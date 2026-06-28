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
    renderTrackingConsentBanner();

    document.addEventListener("click", function (event) {
        var link = event.target.closest && event.target.closest("a");
        if (!link) return;
        var href = link.getAttribute("href") || "";
        var text = (link.textContent || "").trim().slice(0, 80);
        if (link.getAttribute("data-line-cta")) {
            track("line_cta_click", { href: href, text: text, source: link.getAttribute("data-line-cta") });
        } else if (href.indexOf("contact.html") !== -1 || href.indexOf("contact-us.html") !== -1 || href.indexOf("free-check.html") !== -1) {
            track("cta_free_check_click", { href: href, text: text });
        } else if (href.indexOf("service.html") !== -1 || href.indexOf("database.html") !== -1) {
            track("database_click", { href: href, text: text });
        } else if (href.indexOf("blog-details.html") !== -1) {
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
