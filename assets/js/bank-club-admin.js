(function () {
    "use strict";

    var dataUrl = "assets/data/bank-club.json";
    var configUrl = "site-config.json";
    var leadKey = "bank_club_leads";
    var eventKey = "bank_club_events";
    var configPromise = null;
    var currentLeadResult = { mode: "localStorage", items: [] };
    var bankClubData = null;
    var moduleBound = false;

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

    function renderLeadRows(leads) {
        if (!leads.length) {
            return "<tr><td colspan=\"6\">目前沒有 Bank Club 線索。可從 Bank Club 前台送出測試諮詢。</td></tr>";
        }
        return leads.map(function (lead) {
            return [
                "<tr>",
                "<td>" + escapeHtml((lead.submitted_at || "").slice(0, 10)) + "</td>",
                "<td><strong>" + escapeHtml(lead.display_name || "未命名") + "</strong><br><small>" + escapeHtml(lead.phone || "") + "</small></td>",
                "<td>" + escapeHtml(lead.loan_type || "unknown") + "</td>",
                "<td>" + escapeHtml(lead.message || "未填寫") + "</td>",
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
        var leads = leadResult.items || [];
        var events = readJson(eventKey, []);
        var openLeads = leads.filter(function (lead) {
            return !["closed", "invalid"].includes(lead.status);
        });
        root.innerHTML = [
            "<div class=\"tfse-visual-module-head\">",
            "<div><span class=\"tfse-visual-eyebrow\">主站業務</span><h3>Bank Club 管理</h3><p>Bank Club 線索、內容資源與事件分析已併入金融站後台，與 TFSE 資料在同一個帳戶頁面集中管理。資料來源：" + escapeHtml(leadResult.mode || "localStorage") + "</p></div>",
            "<div class=\"tfse-visual-action-row\"><a class=\"tfse-visual-real-entry\" href=\"/\" target=\"_blank\" rel=\"noopener\"><i class=\"fa fa-external-link-alt\"></i> 打開前台</a><button type=\"button\" data-bank-export><i class=\"fa fa-download\"></i> 匯出資料</button></div>",
            "</div>",
            "<div class=\"tfse-visual-card-grid is-compact\">",
            "<article class=\"tfse-visual-module-card\"><small>主站線索</small><h4>" + leads.length + "</h4><p>Bank Club 前台表單</p></article>",
            "<article class=\"tfse-visual-module-card\"><small>待處理</small><h4>" + openLeads.length + "</h4><p>未結案線索</p></article>",
            "<article class=\"tfse-visual-module-card\"><small>內容文章</small><h4>" + data.articles.length + "</h4><p>由主站核心內容遷入</p></article>",
            "<article class=\"tfse-visual-module-card\"><small>事件</small><h4>" + events.length + "</h4><p>頁面瀏覽與按鈕點擊</p></article>",
            "</div>",
            "<div class=\"tfse-visual-split tfse-bankclub-split\">",
            "<section class=\"tfse-visual-module-card\"><div class=\"tfse-visual-module-head\"><div><h3>線索管理</h3><p>直接在金融站後台檢視和更新 Bank Club 來源線索。</p></div></div><div class=\"tfse-visual-table-wrap\"><table><thead><tr><th>日期</th><th>聯絡人</th><th>需求</th><th>備註</th><th>狀態</th><th>動作</th></tr></thead><tbody>" + renderLeadRows(leads) + "</tbody></table></div></section>",
            "<section class=\"tfse-visual-module-card\"><div class=\"tfse-visual-module-head\"><div><h3>內容管理</h3><p>主站核心內容以金融站後台列表格式集中查看。</p></div></div><div class=\"tfse-visual-data-list tfse-bankclub-list\">" + data.articles.map(function (item) {
                return "<article class=\"tfse-visual-line-item\"><span><small>" + escapeHtml(item.category) + "</small><b>" + escapeHtml(item.title) + "</b></span><small>" + escapeHtml(item.excerpt) + "</small></article>";
            }).join("") + "</div></section>",
            "<section class=\"tfse-visual-module-card\"><div class=\"tfse-visual-module-head\"><div><h3>文件資源</h3><p>文件與設定保留資料能力，但使用金融站後台版面呈現。</p></div></div><div class=\"tfse-visual-data-list tfse-bankclub-list\">" + data.files.map(function (item) {
                return "<article class=\"tfse-visual-line-item\"><span><small>" + escapeHtml(item.type) + "</small><b>" + escapeHtml(item.title) + "</b></span><small>" + escapeHtml(item.description) + "</small></article>";
            }).join("") + "</div><ul class=\"tfse-visual-checklist\"><li><span>專員</span><b>" + escapeHtml(data.settings.specialistName) + "｜" + escapeHtml(data.settings.specialistTitle) + "</b></li><li><span>電話</span><b>" + escapeHtml(data.settings.mobile) + "</b></li><li><span>Email</span><b>" + escapeHtml(data.settings.email) + "</b></li><li><span>前台路徑</span><b>/</b></li></ul></section>",
            "</div>"
        ].join("");
    }

    function renderActiveModule() {
        if (!bankClubData || !$("[data-bank-club-admin]")) return;
        listBankLeads().then(function (leadResult) {
            renderModule(bankClubData, leadResult);
        });
    }

    function bindModule(data) {
        if (moduleBound) return;
        moduleBound = true;
        function refreshSoon() {
            setTimeout(function () {
                renderActiveModule();
            }, 450);
        }
        document.addEventListener("click", function (event) {
            var statusButton = event.target.closest("[data-bank-lead-status]");
            if (statusButton) {
                var id = statusButton.getAttribute("data-bank-lead-status");
                var currentLead = (readJson(leadKey, []).filter(function (lead) { return lead.id === id; })[0]) || {};
                var sequence = ["new", "contacted", "appointment_scheduled", "closed"];
                var index = sequence.indexOf(currentLead.status || statusButton.getAttribute("data-bank-lead-current") || "new");
                var nextStatus = sequence[(index + 1) % sequence.length];
                updateBankLeadStatus(id, nextStatus).then(function () {
                    return listBankLeads();
                }).then(function (leadResult) {
                    renderModule(data, leadResult);
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

    loadData().then(function (data) {
        bankClubData = data;
        renderActiveModule();
        bindModule(data);
    }).catch(function () {
        var root = $("[data-bank-club-admin]");
        if (root) root.innerHTML = "<p>Bank Club 後台資料暫時無法載入。</p>";
    });
    document.addEventListener("tfse:bankclub-admin-ready", renderActiveModule);
}());
