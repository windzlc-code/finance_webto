(function () {
    "use strict";

    var dataUrl = "../assets/data/bank-club.json";
    var configUrl = "../site-config.json";
    var leadKey = "bank_club_leads";
    var eventKey = "bank_club_events";
    var configPromise = null;

    function $(selector, root) {
        return (root || document).querySelector(selector);
    }

    function $all(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
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
            // Storage can be unavailable in private browsing.
        }
    }

    function track(eventName, payload) {
        var events = readJson(eventKey, []);
        events.unshift({
            id: "bank_event_" + Date.now().toString(36),
            site_key: "bank_club",
            event_name: eventName,
            path: location.pathname,
            payload: payload || {},
            created_at: new Date().toISOString()
        });
        writeJson(eventKey, events.slice(0, 300));
    }

    function loadData() {
        return fetch(dataUrl, { cache: "no-store" }).then(function (response) {
            if (!response.ok) throw new Error("Bank Club data failed");
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

    function submitLeadToApi(lead) {
        return loadConfig().then(function (config) {
            var url = apiEndpoint(config, "/api/bank-club/leads");
            if (!url) throw new Error("bank_club_api_not_configured");
            return fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(lead)
            }).then(function (response) {
                if (!response.ok) throw new Error("bank_club_api_" + response.status);
                return response.json();
            });
        });
    }

    function storeLeadLocally(lead) {
        var leads = readJson(leadKey, []);
        leads.unshift(lead);
        writeJson(leadKey, leads);
        return { mode: "localStorage", lead: lead };
    }

    function renderServices(data) {
        var root = $("[data-bank-services]");
        if (!root) return;
        root.innerHTML = data.services.map(function (service) {
            return [
                "<article class=\"bank-card\" id=\"" + escapeHtml(service.key) + "\">",
                "<span>" + escapeHtml(service.title.slice(0, 1)) + "</span>",
                "<h3>" + escapeHtml(service.title) + "</h3>",
                "<strong>" + escapeHtml(service.subtitle) + "</strong>",
                "<p>" + escapeHtml(service.description) + "</p>",
                "<a href=\"#consultation\" data-bank-track=\"service_" + escapeHtml(service.key) + "\">我要諮詢</a>",
                "</article>"
            ].join("");
        }).join("");
    }

    function renderProcess(data) {
        var root = $("[data-bank-process]");
        if (!root) return;
        root.innerHTML = data.processSteps.map(function (step, index) {
            return "<li><span>" + (index + 1) + "</span><strong>" + escapeHtml(step) + "</strong></li>";
        }).join("");
    }

    function renderContent(data) {
        var articles = $("[data-bank-articles]");
        var files = $("[data-bank-files]");
        if (articles) {
            articles.innerHTML = data.articles.map(function (item) {
                return "<article><small>" + escapeHtml(item.category) + "</small><h3>" + escapeHtml(item.title) + "</h3><p>" + escapeHtml(item.excerpt) + "</p></article>";
            }).join("");
        }
        if (files) {
            files.innerHTML = data.files.map(function (item) {
                return "<article><small>" + escapeHtml(item.visibility) + "</small><h3>" + escapeHtml(item.title) + "</h3><p>" + escapeHtml(item.description) + "</p></article>";
            }).join("");
        }
    }

    function renderSettings(data) {
        $all("[data-bank-setting]").forEach(function (node) {
            var key = node.getAttribute("data-bank-setting");
            node.textContent = data.settings[key] || "";
        });
        var lineQr = $("[data-bank-line-qr]");
        if (lineQr) lineQr.src = data.site.lineQr;
    }

    function bindForm(data) {
        var form = $("[data-bank-lead-form]");
        var message = $("[data-bank-form-message]");
        if (!form) return;
        form.addEventListener("submit", function (event) {
            event.preventDefault();
            var formData = new FormData(form);
            var lead = {
                id: "bank_lead_" + Date.now().toString(36),
                site_key: "bank_club",
                display_name: String(formData.get("display_name") || "").trim(),
                phone: String(formData.get("phone") || "").trim(),
                line_id: String(formData.get("line_id") || "").trim(),
                loan_type: String(formData.get("loan_type") || "unknown"),
                message: String(formData.get("message") || "").trim(),
                status: "new",
                source_page: "bank-club/index.html",
                submitted_at: new Date().toISOString(),
                specialist: data.settings.specialistName
            };
            if (!lead.display_name || !lead.phone) {
                if (message) message.textContent = "請至少填寫稱呼與手機，方便專員聯繫。";
                return;
            }
            track("lead_submit", { loan_type: lead.loan_type });
            submitLeadToApi(lead).then(function (result) {
                form.reset();
                if (message) message.textContent = "已送出到共用後台的 Bank Club 線索列表。" + (result && result.id ? " 編號：" + result.id : "");
            }).catch(function () {
                storeLeadLocally(lead);
                form.reset();
                if (message) message.textContent = "API 暫時不可用，已先保存到本機共用後台。";
            });
        });
    }

    function bindInteractions() {
        document.addEventListener("click", function (event) {
            var target = event.target.closest("[data-bank-track]");
            if (!target) return;
            track(target.getAttribute("data-bank-track"), { href: target.getAttribute("href") || "" });
        });
        track("page_view");
    }

    loadData().then(function (data) {
        renderServices(data);
        renderProcess(data);
        renderContent(data);
        renderSettings(data);
        bindForm(data);
        bindInteractions();
    }).catch(function () {
        var root = $("[data-bank-services]");
        if (root) root.innerHTML = "<p>Bank Club 內容資料暫時無法載入。</p>";
    });
}());
