(function () {
    "use strict";

    var DEFAULT_URL = "/valuation/";
    var BUTTON_ID = "tfse-property-valuation-float";

    function configUrl() {
        var script = document.currentScript || document.getElementById("tfse-property-valuation-script");
        if (script && script.src) return new URL("../../site-config.json", script.src).href;
        return "site-config.json";
    }

    function withSource(url, source) {
        try {
            var target = new URL(url, window.location.origin);
            target.searchParams.set("from", source || "tfse");
            return target.origin === window.location.origin
                ? target.pathname + target.search + target.hash
                : target.href;
        } catch (error) {
            return url;
        }
    }

    function bindNavigationFallback() {
        if (document.documentElement.hasAttribute("data-tfse-valuation-navigation")) return;
        document.documentElement.setAttribute("data-tfse-valuation-navigation", "true");

        // Keep the two valuation entries usable even when a theme plugin consumes
        // a link click later in the event chain.
        document.addEventListener("click", function (event) {
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            var target = event.target && event.target.closest
                ? event.target.closest("[data-property-valuation-link], #" + BUTTON_ID)
                : null;
            if (!target || target.target === "_blank" || target.hasAttribute("download")) return;

            var href = target.href;
            if (!href) return;
            try {
                var url = new URL(href, window.location.href);
                if (url.origin !== window.location.origin || url.pathname.indexOf("/valuation/") !== 0) return;
                window.location.assign(url.href);
            } catch (error) {
                window.location.assign(href);
            }
        }, true);
    }

    function applyLinks(config) {
        var valuation = (config && config.property_valuation) || {};
        var url = valuation.url || DEFAULT_URL;
        var label = valuation.label || "不動產估價工具";
        var button = document.getElementById(BUTTON_ID);
        if (!button) {
            button = document.createElement("a");
            button.id = BUTTON_ID;
            button.className = "tfse-property-valuation-float";
            button.innerHTML = "<span aria-hidden=\"true\">估</span><span class=\"tfse-property-valuation-float__label\">" + label + "</span>";
            document.body.appendChild(button);
        }
        button.href = withSource(url, "tfse");
        button.title = "開啟" + label;
        button.setAttribute("aria-label", "開啟" + label);
        document.querySelectorAll("[data-property-valuation-link]").forEach(function (link) {
            link.href = withSource(url, link.getAttribute("data-property-valuation-source") || "tfse");
            link.setAttribute("aria-label", "開啟" + label);
        });
    }

    function loadConfig() {
        return fetch(configUrl())
            .then(function (response) {
                if (!response.ok) throw new Error("site config unavailable");
                return response.json();
            })
            .then(applyLinks)
            .catch(function () {
                applyLinks({ property_valuation: { url: DEFAULT_URL } });
            });
    }

    bindNavigationFallback();
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", loadConfig);
    else loadConfig();
}());
