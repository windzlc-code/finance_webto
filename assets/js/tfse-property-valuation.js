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

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", loadConfig);
    else loadConfig();
}());
