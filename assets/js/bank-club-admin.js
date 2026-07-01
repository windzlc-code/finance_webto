(function () {
    "use strict";

    var dataUrl = "assets/data/bank-club.json";
    var configUrl = "site-config.json";
    var leadKey = "bank_club_leads";
    var eventKey = "bank_club_events";
    var configPromise = null;
    var currentLeadResult = { mode: "localStorage", items: [] };

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

    function listBankLeads() {
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
                "<td>" + escapeHtml(statusLabel(lead.status)) + "</td>",
                "<td><button type=\"button\" data-bank-lead-status=\"" + escapeHtml(lead.id) + "\" data-bank-lead-current=\"" + escapeHtml(lead.status || "new") + "\">切換狀態</button></td>",
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
            "<div class=\"bank-admin-head\">",
            "<div><span>金融站後台模組</span><h2>Bank Club 業務管理</h2><p>Bank Club 線索、內容資源與事件分析已併入当前金融站後台，與 TFSE 資料在同一個帳戶頁面集中管理。資料來源：" + escapeHtml(leadResult.mode || "localStorage") + "</p></div>",
            "<div class=\"bank-admin-actions\"><a href=\"/\" target=\"_blank\" rel=\"noopener\">打開 Bank Club 前台</a><button type=\"button\" data-bank-export>匯出 Bank Club 資料</button></div>",
            "</div>",
            "<div class=\"bank-admin-metrics\">",
            "<article><small>主站線索</small><strong>" + leads.length + "</strong><span>Bank Club 前台表單</span></article>",
            "<article><small>待處理</small><strong>" + openLeads.length + "</strong><span>未結案線索</span></article>",
            "<article><small>內容文章</small><strong>" + data.articles.length + "</strong><span>由主站核心內容遷入</span></article>",
            "<article><small>事件</small><strong>" + events.length + "</strong><span>頁面瀏覽與按鈕點擊</span></article>",
            "</div>",
            "<div class=\"bank-admin-grid\">",
            "<section><h3>線索管理</h3><div class=\"bank-table-wrap\"><table><thead><tr><th>日期</th><th>聯絡人</th><th>需求</th><th>備註</th><th>狀態</th><th>動作</th></tr></thead><tbody>" + renderLeadRows(leads) + "</tbody></table></div></section>",
            "<section><h3>內容管理</h3><div class=\"bank-content-list\">" + data.articles.map(function (item) {
                return "<article><small>" + escapeHtml(item.category) + "</small><h4>" + escapeHtml(item.title) + "</h4><p>" + escapeHtml(item.excerpt) + "</p></article>";
            }).join("") + "</div></section>",
            "<section><h3>文件資源</h3><div class=\"bank-content-list\">" + data.files.map(function (item) {
                return "<article><small>" + escapeHtml(item.type) + "</small><h4>" + escapeHtml(item.title) + "</h4><p>" + escapeHtml(item.description) + "</p></article>";
            }).join("") + "</div></section>",
            "<section><h3>站點設定</h3><ul class=\"bank-admin-settings\"><li><span>專員</span><b>" + escapeHtml(data.settings.specialistName) + "｜" + escapeHtml(data.settings.specialistTitle) + "</b></li><li><span>電話</span><b>" + escapeHtml(data.settings.mobile) + "</b></li><li><span>Email</span><b>" + escapeHtml(data.settings.email) + "</b></li><li><span>前台路徑</span><b>/</b></li></ul></section>",
            "</div>"
        ].join("");
    }

    function bindModule(data) {
        function refreshSoon() {
            setTimeout(function () {
                listBankLeads().then(function (leadResult) {
                    renderModule(data, leadResult);
                });
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
        listBankLeads().then(function (leadResult) {
            renderModule(data, leadResult);
        });
        bindModule(data);
    }).catch(function () {
        var root = $("[data-bank-club-admin]");
        if (root) root.innerHTML = "<p>Bank Club 後台資料暫時無法載入。</p>";
    });
}());
