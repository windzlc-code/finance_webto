(function () {
    "use strict";

    var dataUrl = "assets/data/bank-club.json";
    var configUrl = "site-config.json";
    var leadKey = "bank_club_leads";
    var eventKey = "bank_club_events";
    var configPromise = null;
    var currentLeadResult = { mode: "localStorage", items: [] };
    var bankLeadsLoaded = false;
    var bankLeadSignature = "";
    var bankClubData = null;
    var bankClubInitPromise = null;
    var moduleBound = false;
    var currentStage = "all";
    var currentSection = "leads";

    function $(selector, root) {
        return (root || document).querySelector(selector);
    }

    function escapeHtml(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function readJson(key, fallback) {
        try {
            return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
        } catch (error) {
            return fallback;
        }
    }

    function writeJson(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            // Ignore storage failures; the UI remains readable.
        }
    }

    function loadData() {
        return fetch(dataUrl, { cache: "no-store" }).then(function (response) {
            if (!response.ok) throw new Error("Bank Club admin data failed");
            return response.json();
        });
    }

    function emptyBankClubData() {
        return {
            site: "Bank Club",
            articles: [],
            files: [],
            settings: { mobile: "", email: "" }
        };
    }

    function loadConfig() {
        if (configPromise) return configPromise;
        configPromise = fetch(configUrl, { cache: "no-store" }).then(function (response) {
            if (!response.ok) throw new Error("site-config.json failed");
            return response.json();
        }).catch(function () {
            return {};
        });
        return configPromise;
    }

    function apiEndpoint(config, path) {
        var backend = (config && config.backend) || {};
        var base = String(backend.api_base_url || "").replace(/\/$/, "");
        if (!base) return "";
        if (base === ".") return path;
        return base + path;
    }

    function csrfToken() {
        try {
            return (JSON.parse(sessionStorage.getItem("tfse_admin_api_session") || "{}") || {}).csrf_token || "";
        } catch (error) {
            return "";
        }
    }

    function apiJson(path, options) {
        return loadConfig().then(function (config) {
            var url = apiEndpoint(config, path);
            if (!url) throw new Error("bank_club_api_not_configured");
            var requestOptions = Object.assign({
                method: "GET",
                credentials: "include",
                headers: { "Content-Type": "application/json" }
            }, options || {});
            if (requestOptions.method && requestOptions.method !== "GET") {
                requestOptions.headers = Object.assign({}, requestOptions.headers, { "X-CSRF-Token": csrfToken() });
            }
            return fetch(url, requestOptions).then(function (response) {
                if (!response.ok) throw new Error(path + " " + response.status);
                return response.json();
            });
        });
    }

    function isAdminAuthenticated() {
        return localStorage.getItem("tfse_admin_auth") === "true"
            && localStorage.getItem("tfse_admin_auth_source") === "api";
    }

    function listBankLeads() {
        if (!isAdminAuthenticated()) {
            return Promise.resolve({ mode: "localStorage", items: readJson(leadKey, []) });
        }
        return apiJson("/api/admin/bank-club/leads").then(function (data) {
            return { mode: "api", items: data.items || [] };
        }).catch(function (error) {
            return { mode: "localStorage", items: readJson(leadKey, []), error: error.message };
        });
    }

    function leadResultSignature(leadResult) {
        return [leadResult.mode || "localStorage"].concat((leadResult.items || []).map(function (lead) {
            return [lead.id || "", lead.status || "new", lead.updated_at || lead.submitted_at || ""].join(":");
        }).sort()).join("|");
    }

    function commitLeadResult(leadResult) {
        var nextResult = {
            mode: leadResult.mode || "localStorage",
            items: (leadResult.items || []).slice()
        };
        var nextSignature = leadResultSignature(nextResult);
        var changed = !bankLeadsLoaded || nextSignature !== bankLeadSignature;
        currentLeadResult = nextResult;
        bankLeadsLoaded = true;
        bankLeadSignature = nextSignature;
        if (changed) {
            document.dispatchEvent(new CustomEvent("tfse:bankclub-leads-updated", {
                detail: { count: nextResult.items.length, mode: nextResult.mode }
            }));
        }
        return nextResult;
    }

    function updateBankLeadStatus(id, status) {
        return apiJson("/api/admin/bank-club/leads/" + encodeURIComponent(id) + "/status", {
            method: "PATCH",
            body: JSON.stringify({ status: status })
        }).catch(function () {
            var leads = readJson(leadKey, []).map(function (lead) {
                if (lead.id === id) {
                    lead.status = status;
                    lead.updated_at = new Date().toISOString();
                }
                return lead;
            });
            writeJson(leadKey, leads);
            return { mode: "localStorage" };
        });
    }

    function statusLabel(status) {
        return {
            new: "新線索",
            contacted: "已聯繫",
            appointment_scheduled: "已預約",
            closed: "已結案"
        }[status] || status || "新線索";
    }

    function genderLabel(value) {
        return {
            male: "男性",
            female: "女性",
            other: "其他 / 不便透露"
        }[value] || "未填";
    }

    function loanLabel(value) {
        return {
            credit: "信用貸款",
            house: "房屋貸款",
            business: "企業貸款",
            unknown: "初步諮詢"
        }[value] || value || "初步諮詢";
    }

    function purposeLabel(value) {
        return {
            living: "生活消費",
            renovation: "房屋修繕",
            business: "營運週轉",
            unsure: "先諮詢專員",
            high_risk: "高風險用途（需覆核）"
        }[value] || value || "";
    }

    function formatLeadDate(value) {
        if (!value) return "未記錄";
        var date = new Date(value);
        if (isNaN(date.getTime())) return String(value);
        return date.getFullYear() + "/" + String(date.getMonth() + 1).padStart(2, "0") + "/" + String(date.getDate()).padStart(2, "0") + " " + String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0");
    }

    function assessmentLabel(lead) {
        var items = [loanLabel(lead.loan_type || lead.loanType), purposeLabel(lead.purpose)];
        return items.filter(Boolean).join(" / ");
    }

    function renderLeadRows(leads) {
        if (!leads.length) {
            return "<tr class=\"tfse-bankclub-empty-row\"><td colspan=\"12\"><div class=\"tfse-bankclub-empty-state\"><i class=\"fa fa-inbox\" aria-hidden=\"true\"></i><div><strong>目前尚無貸款申請</strong><span>使用者送出申請後，完整資料會顯示在此表格。</span></div></div></td></tr>";
        }
        return leads.map(function (lead, index) {
            var description = lead.message || lead.note || purposeLabel(lead.purpose) || "未填寫";
            return [
                "<tr>",
                "<td>" + (index + 1) + "</td>",
                "<td><span class=\"tfse-visual-origin-badge is-bankclub\">Bank Club</span><small>" + escapeHtml(formatLeadDate(lead.submitted_at || lead.created_at)) + "</small></td>",
                "<td><strong>" + escapeHtml(lead.display_name || lead.name || "未命名") + "</strong></td>",
                "<td>" + escapeHtml(genderLabel(lead.gender)) + "</td>",
                "<td>" + escapeHtml(lead.phone || "未填") + "</td>",
                "<td>" + escapeHtml(assessmentLabel(lead)) + "</td>",
                "<td>" + escapeHtml(lead.line_id || lead.lineId || "未填") + "</td>",
                "<td>" + escapeHtml(lead.city || "未填") + "</td>",
                "<td>" + escapeHtml(description) + "</td>",
                "<td>" + escapeHtml(lead.submitted_ip || lead.ip || "未記錄") + "</td>",
                "<td><span class=\"tfse-visual-status is-" + escapeHtml(lead.status || "new") + "\">" + escapeHtml(statusLabel(lead.status)) + "</span></td>",
                "<td><button type=\"button\" class=\"tfse-visual-action-btn is-primary\" data-bank-lead-status=\"" + escapeHtml(lead.id) + "\" data-bank-lead-current=\"" + escapeHtml(lead.status || "new") + "\">切換狀態</button></td>",
                "</tr>"
            ].join("");
        }).join("");
    }

    function renderModule(data, leadResult) {
        var root = $("[data-bank-club-admin]");
        if (!root) return;
        leadResult = leadResult || { mode: "localStorage", items: readJson(leadKey, []) };
        currentLeadResult = {
            mode: leadResult.mode || "localStorage",
            items: (leadResult.items || []).slice()
        };
        var allLeads = leadResult.items || [];
        var leads = allLeads.filter(function (lead) {
            return currentStage === "all" || (lead.status || "new") === currentStage;
        });
        var events = readJson(eventKey, []);
        var openLeads = allLeads.filter(function (lead) {
            return !["closed", "invalid"].includes(lead.status);
        });
        var stageItems = [
            ["all", "全部表單"],
            ["new", "新線索"],
            ["contacted", "已聯繫"],
            ["appointment_scheduled", "已預約"],
            ["closed", "已結案"]
        ];
        var stagePills = "<div class=\"tfse-visual-stage-pills is-bankclub\" aria-label=\"Bank Club 處理階段\">" + stageItems.map(function (item) {
            var count = item[0] === "all" ? allLeads.length : allLeads.filter(function (lead) { return (lead.status || "new") === item[0]; }).length;
            return "<button type=\"button\" class=\"" + (currentStage === item[0] ? "is-active" : "") + "\" data-bank-stage=\"" + item[0] + "\"><span>" + escapeHtml(item[1]) + "</span><b>" + count + "</b></button>";
        }).join("") + "</div>";
        var sectionPills = [
            "<div class=\"tfse-bankclub-section-pills\" aria-label=\"Bank Club 功能分類\">",
            "<button type=\"button\" class=\"" + (currentSection === "leads" ? "is-active" : "") + "\" data-bank-section=\"leads\">諮詢表單與客戶</button>",
            "<button type=\"button\" class=\"" + (currentSection === "resources" ? "is-active" : "") + "\" data-bank-section=\"resources\">內容與文件</button>",
            "</div>"
        ].join("");
        var leadSection = [
            stagePills,
            "<section class=\"tfse-visual-module-card tfse-bankclub-lead-section\"><div class=\"tfse-visual-module-head\"><div><h3>Bank Club 貸款申請名單</h3><p>每筆申請完整保留填單資料，供後台查詢與後續處理。</p></div></div><div class=\"tfse-visual-table-wrap\"><table><thead><tr><th>序</th><th>填單日期</th><th>客戶名稱</th><th>性別</th><th>聯絡電話</th><th>評估項目</th><th>LINE ID</th><th>所在縣市</th><th>內容描述</th><th>填單 IP</th><th>狀態</th><th>動作</th></tr></thead><tbody>" + renderLeadRows(leads) + "</tbody></table></div></section>"
        ].join("");
        var resourceSection = [
            "<div class=\"tfse-visual-split tfse-bankclub-split\">",
            "<section class=\"tfse-visual-module-card\"><div class=\"tfse-visual-module-head\"><div><h3>內容管理</h3><p>Bank Club 主站文章集中查看，與金融站內容模組做好站點區分。</p></div></div><div class=\"tfse-visual-data-list tfse-bankclub-list\">" + data.articles.map(function (item) {
                return "<article class=\"tfse-visual-line-item\"><span><small>Bank Club · " + escapeHtml(item.category) + "</small><b>" + escapeHtml(item.title) + "</b></span><small>" + escapeHtml(item.excerpt) + "</small></article>";
            }).join("") + "</div></section>",
            "<section class=\"tfse-visual-module-card\"><div class=\"tfse-visual-module-head\"><div><h3>文件資源</h3><p>Bank Club 文件與站點設定保留在同一來源分頁。</p></div></div><div class=\"tfse-visual-data-list tfse-bankclub-list\">" + data.files.map(function (item) {
                return "<article class=\"tfse-visual-line-item\"><span><small>Bank Club · " + escapeHtml(item.type) + "</small><b>" + escapeHtml(item.title) + "</b></span><small>" + escapeHtml(item.description) + "</small></article>";
            }).join("") + "</div><ul class=\"tfse-visual-checklist\"><li><span>電話</span><b>" + escapeHtml(data.settings.mobile) + "</b></li><li><span>Email</span><b>" + escapeHtml(data.settings.email) + "</b></li><li><span>前台路徑</span><b>/</b></li></ul></section>",
            "</div>"
        ].join("");
        root.innerHTML = [
            "<div class=\"tfse-visual-module-head\">",
            "<div><span class=\"tfse-visual-eyebrow\">Bank Club 來源</span><h3>表單、客戶與站點資料</h3><p>這裡只顯示 Bank Club 資料，與金融站共用帳戶和操作規則。連線模式：" + escapeHtml(leadResult.mode || "localStorage") + "</p></div>",
            "<div class=\"tfse-visual-action-row\"><a class=\"tfse-visual-real-entry\" href=\"/\" target=\"_blank\" rel=\"noopener\"><i class=\"fa fa-external-link-alt\"></i> 打開前台</a><button type=\"button\" data-bank-export><i class=\"fa fa-download\"></i> 匯出資料</button></div>",
            "</div>",
            "<div class=\"tfse-visual-card-grid is-compact\">",
            "<article class=\"tfse-visual-module-card\"><small>Bank Club 表單</small><h4>" + allLeads.length + "</h4><p>只統計 Bank Club 前台提交</p></article>",
            "<article class=\"tfse-visual-module-card\"><small>待處理</small><h4>" + openLeads.length + "</h4><p>未結案線索</p></article>",
            "<article class=\"tfse-visual-module-card\"><small>內容文章</small><h4>" + data.articles.length + "</h4><p>由主站核心內容遷入</p></article>",
            "<article class=\"tfse-visual-module-card\"><small>事件</small><h4>" + events.length + "</h4><p>頁面瀏覽與按鈕點擊</p></article>",
            "</div>",
            sectionPills,
            currentSection === "leads" ? leadSection : resourceSection
        ].join("");
        document.querySelectorAll("[data-visual-site-count='bankclub']").forEach(function (node) {
            node.textContent = allLeads.length + " 筆";
        });
    }

    function renderActiveModule() {
        if (!bankClubData) {
            return bootstrapBankClubModule().then(function () {
                if ($("[data-bank-club-admin]")) renderModule(bankClubData, currentLeadResult);
                return currentLeadResult;
            });
        }
        if (bankLeadsLoaded) {
            if ($("[data-bank-club-admin]")) renderModule(bankClubData, currentLeadResult);
            return Promise.resolve(currentLeadResult);
        }
        return refreshBankLeads();
    }

    function refreshBankLeads() {
        return listBankLeads().then(function (leadResult) {
            var committed = commitLeadResult(leadResult);
            if (bankClubData && $("[data-bank-club-admin]")) renderModule(bankClubData, committed);
            return committed;
        });
    }

    function bootstrapBankClubModule() {
        if (bankClubData) return Promise.resolve(bankClubData);
        if (bankClubInitPromise) return bankClubInitPromise;
        bankClubInitPromise = loadData().catch(function () {
            // Keep the table usable even if the optional content seed is
            // temporarily unavailable; lead data still comes from the API.
            return emptyBankClubData();
        }).then(function (data) {
            bankClubData = data || emptyBankClubData();
            bindModule(bankClubData);
            return refreshBankLeads().then(function () {
                return bankClubData;
            });
        });
        return bankClubInitPromise;
    }

    function bindModule(data) {
        if (moduleBound) return;
        moduleBound = true;
        function refreshSoon() {
            setTimeout(function () {
                refreshBankLeads();
            }, 450);
        }
        document.addEventListener("click", function (event) {
            var sectionButton = event.target.closest("[data-bank-section]");
            if (sectionButton) {
                currentSection = sectionButton.getAttribute("data-bank-section") === "resources" ? "resources" : "leads";
                renderModule(data, currentLeadResult);
                return;
            }
            var stageButton = event.target.closest("[data-bank-stage]");
            if (stageButton) {
                currentStage = stageButton.getAttribute("data-bank-stage") || "all";
                renderModule(data, currentLeadResult);
                return;
            }
            var statusButton = event.target.closest("[data-bank-lead-status]");
            if (statusButton) {
                var id = statusButton.getAttribute("data-bank-lead-status");
                var currentLead = ((currentLeadResult.items || []).filter(function (lead) { return lead.id === id; })[0]) || (readJson(leadKey, []).filter(function (lead) { return lead.id === id; })[0]) || {};
                var sequence = ["new", "contacted", "appointment_scheduled", "closed"];
                var index = sequence.indexOf(currentLead.status || statusButton.getAttribute("data-bank-lead-current") || "new");
                var nextStatus = sequence[(index + 1) % sequence.length];
                updateBankLeadStatus(id, nextStatus).then(function () {
                    return refreshBankLeads();
                });
            }
            if (event.target.closest("[data-bank-export]")) {
                var payload = {
                    exported_at: new Date().toISOString(),
                    source_mode: currentLeadResult.mode || "localStorage",
                    site: data.site,
                    leads: (currentLeadResult.items || readJson(leadKey, [])).slice(),
                    events: readJson(eventKey, []),
                    articles: data.articles,
                    files: data.files
                };
                var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
                var url = URL.createObjectURL(blob);
                var link = document.createElement("a");
                link.href = url;
                link.download = "bank-club-admin-export.json";
                link.click();
                URL.revokeObjectURL(url);
            }
            if (event.target.closest("[data-admin-login]") || event.target.closest("[data-admin-refresh]")) {
                refreshSoon();
            }
        });
    }

    window.TFSEBankClubAdmin = {
        getLeads: function () {
            return (currentLeadResult.items || []).slice();
        },
        getMode: function () {
            return currentLeadResult.mode || "localStorage";
        },
        isLoaded: function () {
            return bankLeadsLoaded;
        },
        refresh: refreshBankLeads
    };

    bootstrapBankClubModule();
    document.addEventListener("tfse:bankclub-admin-ready", renderActiveModule);
}());
