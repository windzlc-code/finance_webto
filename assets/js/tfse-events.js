(function () {
    "use strict";

    var configPromise = null;
    var ga4Loaded = false;
    var metaPixelLoaded = false;
    var sentryLoaded = false;
    var consentKey = "tfse_tracking_consent";
    var sensitiveKeys = ["phone", "line_id", "message", "note", "notes", "display_name", "name", "email", "id_number", "bank_account", "card_number", "password"];

    function getEvents() {
        try {
            return JSON.parse(localStorage.getItem("tfse_events") || "[]");
        } catch (error) {
            return [];
        }
    }

    function saveEvents(events) {
        try {
            localStorage.setItem("tfse_events", JSON.stringify(events.slice(0, 500)));
        } catch (error) {
            // Ignore storage failures in private browsing or locked-down contexts.
        }
    }

    function getErrors() {
        try {
            return JSON.parse(localStorage.getItem("tfse_errors") || "[]");
        } catch (error) {
            return [];
        }
    }

    function saveErrors(errors) {
        try {
            localStorage.setItem("tfse_errors", JSON.stringify(errors.slice(0, 100)));
        } catch (error) {
            // Ignore storage failures in private browsing or locked-down contexts.
        }
    }

    function getTrackingConsent() {
        try {
            var raw = localStorage.getItem(consentKey);
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            return null;
        }
    }

    function saveTrackingConsent(value) {
        var record = {
            analytics: value === "granted",
            source: "tfse_privacy_banner",
            version: "tracking-consent-2026-06-27",
            updated_at: new Date().toISOString()
        };
        try {
            localStorage.setItem(consentKey, JSON.stringify(record));
        } catch (error) {
            // Consent storage can be unavailable in private browsing.
        }
        return record;
    }

    function hasAnalyticsConsent() {
        var record = getTrackingConsent();
        return !!(record && record.analytics);
    }

    function consentStatus() {
        var record = getTrackingConsent();
        if (!record) return "unset";
        return record.analytics ? "granted" : "declined";
    }

    function loadConfig() {
        if (configPromise) return configPromise;
        configPromise = fetch("site-config.json")
            .then(function (response) {
                if (!response.ok) throw new Error("site-config.json " + response.status);
                return response.json();
            })
            .catch(function () {
                return {};
            });
        return configPromise;
    }

    function analyticsConfig(config) {
        return (config && config.analytics) || {};
    }

    function shouldSample(sampleRate) {
        var rate = Number(sampleRate);
        if (!rate && rate !== 0) rate = 1;
        if (rate <= 0) return false;
        if (rate >= 1) return true;
        return Math.random() <= rate;
    }

    function scrub(value, depth) {
        if (depth > 4) return "[redacted-depth]";
        if (Array.isArray(value)) {
            return value.slice(0, 20).map(function (item) { return scrub(item, depth + 1); });
        }
        if (value && typeof value === "object") {
            var output = {};
            Object.keys(value).forEach(function (key) {
                var lower = key.toLowerCase();
                var matched = sensitiveKeys.some(function (sensitive) {
                    return lower.indexOf(sensitive) !== -1;
                });
                output[key] = matched ? "[redacted]" : scrub(value[key], depth + 1);
            });
            return output;
        }
        if (typeof value === "string") {
            return value
                .replace(/09\d{8}/g, "[redacted-phone]")
                .replace(/[A-Z][12]\d{8}/gi, "[redacted-id]")
                .slice(0, 500);
        }
        return value;
    }

    function injectScript(src, onload) {
        if (!src) return;
        var existing = document.querySelector("script[src=\"" + src + "\"]");
        if (existing) {
            if (onload) onload();
            return;
        }
        var script = document.createElement("script");
        script.async = true;
        script.src = src;
        if (onload) script.onload = onload;
        document.head.appendChild(script);
    }

    function normalizePath(pathname) {
        var path = String(pathname || "").split("?")[0].split("#")[0];
        path = path.replace(/\\/g, "/").replace(/^.*\/finance_webto\//, "/");
        if (!path || path === "/") return "index.html";
        return path.split("/").pop() ? path.replace(/^\//, "") : "index.html";
    }

    function activeMenuKey() {
        var path = normalizePath(window.location.pathname);
        var file = path.split("/").pop() || "index.html";
        var categoryAliases = [
            "work.html", "category.html", "mortgage.html", "credit-loan.html", "vehicle-finance.html",
            "installment.html", "credit-union.html", "debt-law.html", "insurance-finance.html", "anti-fraud.html"
        ];
        if (file === "index.html") return "index";
        if (file === "about.html") return "about";
        if (path.indexOf("database/") === 0 || path.indexOf("products/") === 0 || file === "database.html") return "database";
        if (categoryAliases.indexOf(file) !== -1) return "category";
        if (path.indexOf("articles/") === 0 || file === "articles.html") return "articles";
        if (path.indexOf("lp/") === 0 || file === "free-check.html") return "free-check";
        if (file === "admin.html") return "admin";
        return "";
    }

    function menuKeyFromHref(href) {
        var path = normalizePath(href || "");
        var file = path.split("/").pop() || "index.html";
        if (file === "index.html") return "index";
        if (file === "about.html") return "about";
        if (file === "database.html") return "database";
        if (file === "work.html") return "category";
        if (file === "articles.html") return "articles";
        if (file === "free-check.html") return "free-check";
        if (file === "admin.html") return "admin";
        return "";
    }

    function syncHeaderActiveState() {
        var current = activeMenuKey();
        Array.prototype.forEach.call(document.querySelectorAll(".site-main-menu > ul"), function (list) {
            Array.prototype.forEach.call(list.children, function (item) {
                if (!item.matches("li")) return;
                item.classList.remove("is-tfse-active");
                var directLink = item.querySelector(":scope > a");
                if (directLink) directLink.removeAttribute("aria-current");
                var key = directLink ? menuKeyFromHref(directLink.getAttribute("href")) : "";
                if (current && key === current) {
                    item.classList.add("is-tfse-active");
                    if (directLink) directLink.setAttribute("aria-current", "page");
                }
            });
        });
    }

    var textOriginals = typeof WeakMap !== "undefined" ? new WeakMap() : null;
    var attrOriginals = typeof WeakMap !== "undefined" ? new WeakMap() : null;
    var i18nApplying = false;
    var i18nObserver = null;
    var tradToSimpPhrases = {
        "TFSE金融便民中心": "TFSE金融便民中心",
        "首頁": "首页",
        "關於": "关于",
        "資料庫": "资料库",
        "金融分類": "金融分类",
        "金融知識": "金融知识",
        "免費健檢": "免费健检",
        "金融便民首頁": "金融便民首页",
        "房貸資訊": "房贷资讯",
        "信貸與企業融資": "信贷与企业融资",
        "債務法令": "债务法令",
        "知識列表": "知识列表",
        "知識專欄": "知识专栏",
        "文章詳情": "文章详情",
        "開始免費健檢": "开始免费健检",
        "查看資料庫": "查看资料库",
        "合法透明": "合法透明",
        "專業整合": "专业整合",
        "免費服務": "免费服务",
        "守護權益": "守护权益",
        "公開金融資訊": "公开金融信息",
        "金融資訊": "金融信息",
        "公開資訊": "公开信息",
        "財務": "财务",
        "法令": "法规",
        "諮詢": "咨询",
        "聯絡": "联系",
        "後台": "后台",
        "線索": "线索",
        "檢視": "查看",
        "匯出": "导出",
        "搜尋": "搜索",
        "篩選": "筛选",
        "機構": "机构",
        "狀態": "状态",
        "更新": "更新",
        "登入": "登录",
        "註冊": "注册",
        "隱私權": "隐私权",
        "條款": "条款",
        "來源": "来源",
        "風險": "风险",
        "提醒": "提醒",
        "送出": "提交",
        "稱呼": "称呼",
        "手機": "手机",
        "所在地區": "所在地区",
        "需求類型": "需求类型",
        "身份類型": "身份类型",
        "收入型態": "收入形态",
        "目前困擾": "目前困扰",
        "選填": "选填",
        "必填": "必填",
        "確定": "确定",
        "請": "请"
    };
    var tradToSimpChars = {
        "與":"与","專":"专","業":"业","資":"资","訊":"讯","庫":"库","關":"关","於":"于","類":"类","貸":"贷","聯":"联","絡":"络","後":"后","臺":"台","台":"台","選":"选","擇":"择","顯":"显","應":"应","對":"对","條":"条","體":"体","態":"态","點":"点","檢":"检","視":"视","據":"据","覽":"览","續":"续","護":"护","權":"权","益":"益","險":"险","識":"识","證":"证","號":"号","碼":"码","個":"个","隱":"隐","實":"实","說":"说","須":"须","務":"务","費":"费","錄":"录","儲":"储","蓄":"蓄","會":"会","構":"构","時":"时","間":"间","標":"标","籤":"签","啟":"启","動":"动","報":"报","歸":"归","屬":"属","審":"审","核":"核","復":"复","齡":"龄","師":"师","醫":"医","藥":"药","產":"产","營":"营","銷":"销","產":"产","頁":"页","項":"项","額":"额","預":"预","繳":"缴","匯":"汇","導":"导","點":"点","擊":"击","讀":"读","寫":"写","線":"线","佇":"伫","列":"列","儀":"仪","錶":"表","圓":"圆","圖":"图","標":"标","測":"测","試":"试","開":"开","閉":"闭","單":"单","雙":"双","優":"优","級":"级","處":"处","擾":"扰","轉":"转","灣":"湾","劃":"划","無":"无","爲":"为","為":"为","這":"这","並":"并","從":"从","將":"将","當":"当","雜":"杂","餘":"余","壓":"压","寬":"宽","併":"并","灣":"湾","顧":"顾","問":"问","閱":"阅","讀":"读"
    };
    var simpToTradPhrases = null;
    var simpToTradChars = null;

    function reverseMap(map) {
        var output = {};
        Object.keys(map).forEach(function (key) {
            output[map[key]] = key;
        });
        return output;
    }

    function convertByMap(value, phrases, chars) {
        var text = String(value || "");
        Object.keys(phrases).sort(function (a, b) { return b.length - a.length; }).forEach(function (key) {
            text = text.split(key).join(phrases[key]);
        });
        return text.replace(/[\u4e00-\u9fff]/g, function (char) {
            return chars[char] || char;
        });
    }

    function convertText(value, mode) {
        if (mode === "zh-CN") return convertByMap(value, tradToSimpPhrases, tradToSimpChars);
        if (!simpToTradPhrases) simpToTradPhrases = reverseMap(tradToSimpPhrases);
        if (!simpToTradChars) simpToTradChars = reverseMap(tradToSimpChars);
        return convertByMap(value, simpToTradPhrases, simpToTradChars);
    }

    function shouldSkipI18nNode(node) {
        var parent = node && node.parentElement;
        if (!parent) return true;
        if (parent.closest("[data-tfse-i18n-skip], script, style, code, pre, textarea")) return true;
        return !String(node.nodeValue || "").trim();
    }

    function applyI18nToTextNode(node, mode) {
        if (shouldSkipI18nNode(node)) return;
        if (textOriginals && !textOriginals.has(node)) textOriginals.set(node, node.nodeValue);
        var original = textOriginals ? textOriginals.get(node) : node.nodeValue;
        node.nodeValue = mode === "zh-TW" ? original : convertText(original, "zh-CN");
    }

    function applyI18nToElementAttrs(element, mode) {
        if (!element || element.closest("[data-tfse-i18n-skip], script, style, code, pre")) return;
        ["placeholder", "title", "aria-label", "alt", "value"].forEach(function (attr) {
            if (!element.hasAttribute(attr)) return;
            if (attr === "value" && !/^(button|submit|reset)$/i.test(element.getAttribute("type") || "")) return;
            var store = attrOriginals && attrOriginals.get(element);
            if (!store) {
                store = {};
                if (attrOriginals) attrOriginals.set(element, store);
            }
            if (!store[attr]) store[attr] = element.getAttribute(attr);
            element.setAttribute(attr, mode === "zh-TW" ? store[attr] : convertText(store[attr], "zh-CN"));
        });
    }

    function walkI18n(root, mode) {
        if (!root) return;
        i18nApplying = true;
        try {
            var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
            var textNode = walker.currentNode;
            while (textNode) {
                applyI18nToTextNode(textNode, mode);
                textNode = walker.nextNode();
            }
            if (root.nodeType === 1) applyI18nToElementAttrs(root, mode);
            Array.prototype.forEach.call((root.nodeType === 1 ? root : document).querySelectorAll ? (root.nodeType === 1 ? root : document).querySelectorAll("[placeholder], [title], [aria-label], img[alt], input[type='button'], input[type='submit'], input[type='reset']") : [], function (element) {
                applyI18nToElementAttrs(element, mode);
            });
            document.documentElement.lang = mode === "zh-CN" ? "zh-Hans-CN" : "zh-Hant-TW";
            document.title = mode === "zh-CN" ? convertText(document.title, "zh-CN") : convertText(document.title, "zh-TW");
        } finally {
            i18nApplying = false;
        }
    }

    function currentLanguageMode() {
        try {
            return localStorage.getItem("tfse_language_mode") || "zh-TW";
        } catch (error) {
            return "zh-TW";
        }
    }

    function setLanguageMode(mode) {
        try {
            localStorage.setItem("tfse_language_mode", mode);
        } catch (error) {
            // Storage may be unavailable; keep the visual state for this page.
        }
        document.documentElement.setAttribute("data-tfse-lang", mode);
        walkI18n(document.body, mode);
        syncLanguageButtons(mode);
    }

    function syncLanguageButtons(mode) {
        Array.prototype.forEach.call(document.querySelectorAll("[data-tfse-lang-toggle]"), function (button) {
            button.setAttribute("aria-label", mode === "zh-CN" ? "切換為繁體中文" : "切换为简体中文");
            button.setAttribute("title", mode === "zh-CN" ? "切換為繁體中文" : "切换为简体中文");
            var text = button.querySelector(".tfse-lang-label");
            if (text) text.textContent = mode === "zh-CN" ? "繁" : "简";
        });
    }

    function createLanguageButton() {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "tfse-language-toggle";
        button.setAttribute("data-tfse-lang-toggle", "");
        button.setAttribute("data-tfse-i18n-skip", "");
        button.innerHTML = '<i class="fa fa-globe" aria-hidden="true"></i><span class="tfse-lang-label">简</span>';
        button.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();
            setLanguageMode(currentLanguageMode() === "zh-CN" ? "zh-TW" : "zh-CN");
        });
        return button;
    }

    function installLanguageToggle() {
        Array.prototype.forEach.call(document.querySelectorAll(".header-section"), function (header) {
            var right = header.querySelector(".col-xl-2.col.d-none.d-sm-flex");
            if (right && !right.querySelector("[data-tfse-lang-toggle]")) {
                var desktopButton = createLanguageButton();
                desktopButton.classList.add("tfse-language-toggle-desktop");
                right.insertBefore(desktopButton, right.firstChild);
            }
            var mobileToggle = header.querySelector(".header-mobile-menu-toggle");
            if (mobileToggle && mobileToggle.parentNode && !mobileToggle.parentNode.querySelector(".tfse-language-toggle-mobile")) {
                var mobileButton = createLanguageButton();
                mobileButton.classList.add("tfse-language-toggle-mobile", "d-xl-none");
                mobileToggle.parentNode.insertBefore(mobileButton, mobileToggle);
            }
        });
        Array.prototype.forEach.call(document.querySelectorAll(".tfse-admin-standalone-actions"), function (actions) {
            if (actions.querySelector("[data-tfse-lang-toggle]")) return;
            var adminButton = createLanguageButton();
            adminButton.classList.add("tfse-language-toggle-admin");
            actions.insertBefore(adminButton, actions.firstChild);
        });
        syncLanguageButtons(currentLanguageMode());
    }

    function installI18nObserver() {
        if (i18nObserver || typeof MutationObserver === "undefined") return;
        i18nObserver = new MutationObserver(function (records) {
            if (i18nApplying || currentLanguageMode() !== "zh-CN") return;
            records.forEach(function (record) {
                Array.prototype.forEach.call(record.addedNodes || [], function (node) {
                    if (node.nodeType === 1 || node.nodeType === 3) walkI18n(node, "zh-CN");
                });
            });
        });
        i18nObserver.observe(document.body, { childList: true, subtree: true });
    }

    function setupHeaderUi() {
        syncHeaderActiveState();
        installLanguageToggle();
        installI18nObserver();
        setLanguageMode(currentLanguageMode());
    }

    function ensureGa4(id) {
        if (!id || ga4Loaded) return;
        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function () {
            window.dataLayer.push(arguments);
        };
        injectScript("https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id));
        window.gtag("js", new Date());
        window.gtag("config", id, { send_page_view: false });
        ga4Loaded = true;
    }

    function ensureMetaPixel(pixelId) {
        if (!pixelId || metaPixelLoaded) return;
        if (!window.fbq) {
            window.fbq = function () {
                if (window.fbq.callMethod) {
                    window.fbq.callMethod.apply(window.fbq, arguments);
                } else {
                    window.fbq.queue.push(arguments);
                }
            };
            if (!window._fbq) window._fbq = window.fbq;
            window.fbq.push = window.fbq;
            window.fbq.loaded = true;
            window.fbq.version = "2.0";
            window.fbq.queue = [];
        }
        injectScript("https://connect.facebook.net/en_US/fbevents.js");
        window.fbq("init", pixelId);
        metaPixelLoaded = true;
    }

    function metaPixelEventName(name) {
        var standardEvents = {
            page_view: "PageView",
            lead_submit: "Lead",
            line_cta_click: "Contact",
            lead_line_cta_shown: "Contact",
            cta_free_check_click: "Contact",
            site_search: "Search",
            site_search_results: "Search",
            database_search: "Search"
        };
        return standardEvents[name] || "";
    }

    function forwardMetaPixel(event, safePayload, pixelId) {
        if (!pixelId) return;
        ensureMetaPixel(pixelId);
        if (!window.fbq) return;
        var payload = Object.assign({}, safePayload, {
            tfse_event: event.name,
            page_path: event.path
        });
        var standardName = metaPixelEventName(event.name);
        if (standardName) {
            window.fbq("track", standardName, payload);
        } else {
            window.fbq("trackCustom", event.name, payload);
        }
    }

    function ensureSentry(dsn) {
        if (!dsn || sentryLoaded) return;
        injectScript("https://browser.sentry-cdn.com/8.55.0/bundle.tracing.min.js", function () {
            if (window.Sentry && window.Sentry.init) {
                window.Sentry.init({
                    dsn: dsn,
                    tracesSampleRate: 0,
                    beforeSend: function (event) {
                        return scrub(event, 0);
                    }
                });
            }
        });
        sentryLoaded = true;
    }

    function forwardEvent(event) {
        loadConfig().then(function (config) {
            var analytics = analyticsConfig(config);
            if (!shouldSample(analytics.sample_rate)) return;
            if (!hasAnalyticsConsent()) return;
            var safePayload = scrub(event.payload || {}, 0);

            if (analytics.ga4_measurement_id) {
                ensureGa4(analytics.ga4_measurement_id);
                if (window.gtag) {
                    window.gtag("event", event.name, {
                        event_category: "tfse",
                        page_path: event.path,
                        page_location: event.url,
                        event_label: safePayload.keyword || safePayload.text || "",
                        tfse_payload: JSON.stringify(safePayload).slice(0, 500)
                    });
                }
            }

            forwardMetaPixel(event, safePayload, analytics.meta_pixel_id);

            if (analytics.server_event_endpoint) {
                fetch(analytics.server_event_endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: event.name,
                        path: event.path,
                        url: event.url,
                        referrer: event.referrer,
                        payload: safePayload,
                        at: event.at
                    }),
                    keepalive: true
                }).catch(function () {
                    // Server-side analytics is optional in the static MVP.
                });
            }
        });
    }

    function track(name, payload) {
        var events = getEvents();
        var event = {
            name: name,
            path: window.location.pathname.split("/").pop() || "index.html",
            url: window.location.href,
            referrer: document.referrer || "",
            payload: scrub(payload || {}, 0),
            at: new Date().toISOString()
        };
        events.unshift(event);
        saveEvents(events);
        forwardEvent(event);
    }

    window.TFSETrack = track;

    function renderTrackingConsentBanner() {
        if (consentStatus() !== "unset" || document.querySelector("[data-tfse-tracking-consent]")) return;
        var banner = document.createElement("div");
        banner.className = "tfse-tracking-consent";
        banner.setAttribute("data-tfse-tracking-consent", "true");
        banner.setAttribute("role", "region");
        banner.setAttribute("aria-label", "追蹤偏好");
        banner.innerHTML = [
            "<p>TFSE 會先以本機去識別事件改善查詢體驗；若您同意，正式 GA4、Meta Pixel 與伺服器事件才會接收去識別追蹤資料。</p>",
            "<div class=\"tfse-tracking-consent__actions\">",
            "<button type=\"button\" class=\"btn btn-primary btn-hover-secondary\" data-tfse-consent-accept>同意追蹤</button>",
            "<button type=\"button\" class=\"btn btn-light btn-hover-primary\" data-tfse-consent-decline>僅必要紀錄</button>",
            "<a href=\"privacy.html\">隱私權政策</a>",
            "</div>"
        ].join("");
        document.body.appendChild(banner);

        banner.querySelector("[data-tfse-consent-accept]").addEventListener("click", function () {
            var record = saveTrackingConsent("granted");
            banner.parentNode.removeChild(banner);
            track("tracking_consent_update", { status: "granted", version: record.version });
        });
        banner.querySelector("[data-tfse-consent-decline]").addEventListener("click", function () {
            var record = saveTrackingConsent("declined");
            banner.parentNode.removeChild(banner);
            track("tracking_consent_update", { status: "declined", version: record.version });
        });
    }

    window.TFSETrackingConsent = {
        get: getTrackingConsent,
        status: consentStatus,
        grant: function () { return saveTrackingConsent("granted"); },
        decline: function () { return saveTrackingConsent("declined"); }
    };

    function recordError(source, message, detail) {
        var safeDetail = scrub(detail || {}, 0);
        var errors = getErrors();
        var record = {
            source: source,
            message: scrub(String(message || ""), 0).slice(0, 300),
            path: window.location.pathname.split("/").pop() || "index.html",
            detail: safeDetail,
            at: new Date().toISOString()
        };
        errors.unshift(record);
        saveErrors(errors);

        loadConfig().then(function (config) {
            var dsn = analyticsConfig(config).sentry_dsn;
            if (!dsn) return;
            ensureSentry(dsn);
            if (window.Sentry && window.Sentry.captureMessage) {
                window.Sentry.captureMessage(record.message, {
                    level: "error",
                    tags: { source: source, path: record.path },
                    extra: safeDetail
                });
            }
        });
    }

    window.TFSEReportError = recordError;

    window.addEventListener("error", function (event) {
        recordError("window_error", event.message, {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
        });
    });

    window.addEventListener("unhandledrejection", function (event) {
        recordError("unhandled_rejection", event.reason && (event.reason.message || String(event.reason)), {});
    });

    track("page_view", {
        title: document.title,
        utm_source: new URLSearchParams(window.location.search).get("utm_source") || "",
        utm_medium: new URLSearchParams(window.location.search).get("utm_medium") || "",
        utm_campaign: new URLSearchParams(window.location.search).get("utm_campaign") || ""
    });
    setupHeaderUi();
    renderTrackingConsentBanner();

    document.addEventListener("click", function (event) {
        var link = event.target.closest && event.target.closest("a");
        if (!link) return;
        var href = link.getAttribute("href") || "";
        var text = (link.textContent || "").trim().slice(0, 80);
        if (link.getAttribute("data-line-cta")) {
            track("line_cta_click", { href: href, text: text, source: link.getAttribute("data-line-cta") });
        } else if (href.indexOf("contact.html") !== -1 || href.indexOf("free-check.html") !== -1) {
            track("cta_free_check_click", { href: href, text: text });
        } else if (href.indexOf("database.html") !== -1) {
            track("database_click", { href: href, text: text });
        } else if (href.indexOf("articles/") !== -1 || href.indexOf("articles.html") !== -1) {
            track("article_click", { href: href, text: text });
        }
    }, true);

    var dbKeyword = document.querySelector("[data-tfse-db-keyword]");
    var dbType = document.querySelector("[data-tfse-db-type]");
    if (dbKeyword) {
        dbKeyword.addEventListener("change", function () {
            track("database_search", { keyword: dbKeyword.value });
        });
    }
    if (dbType) {
        dbType.addEventListener("change", function () {
            track("database_filter", { type: dbType.value });
        });
    }
})();
