(function () {
    "use strict";

    var DEFAULT_URL = "/valuation/";
    var BUTTON_ID = "tfse-property-valuation-float";
    var WARMED_KEY = "tfse-property-valuation-warmed";

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
        warmValuation(url);
    }

    function warmValuation(url) {
        if (!window.sessionStorage || sessionStorage.getItem(WARMED_KEY)) return;
        sessionStorage.setItem(WARMED_KEY, "1");

        var target;
        try {
            target = new URL(url, window.location.origin);
            if (target.origin !== window.location.origin || target.pathname.indexOf("/valuation/") !== 0) return;
        } catch (error) {
            return;
        }

        var base = target.pathname.replace(/[^/]*$/, "");
        var warmAssets = [
            ["fetch", target.pathname],
            ["style", base + "style.css?v=20260623-loanable-card"],
            ["style", base + "theme-match.css?v=20260603-style-match-reference-density"],
            ["style", base + "support-calc.css?v=20260623-rate-term-linked"],
            ["style", base + "loan-income-two-column.css?v=20260621-asset-two-col"],
            ["script", base + "_lvr_vendor.bundle.js?v=20260328-1"],
            ["script", base + "lvr-bridge.js?v=20260510-file-fetch"],
            ["script", base + "_lvr_common.bundle.js"],
            ["module", base + "valuationSortBridge.js?v=20260601-feature-parity-import"],
            ["module", base + "src/app/main.js?v=20260630-common-multi-label"],
            ["module", base + "mortgageCalculatorApp.js?v=20260623-remove-mortgage-status"],
            ["module", base + "loanCapacityApp.js?v=20260623-readonly-loan-name"],
            ["module", base + "landValueTaxLazyInit.js?v=20260625-multi-upload-land-tax-sync"],
            ["module", base + "src/support/support-widget.js?v=20260623-loan-capacity-merged"],
            ["module", base + "components/AssetSection.js?v=20260621-asset-two-col"],
            ["module", base + "components/IncomeSection.js?v=20260621-asset-two-col"],
            ["module", base + "components/LoanTable.js?v=20260623-readonly-loan-name"],
            ["module", base + "components/ResultPanel.js"],
            ["module", base + "components/formatters.js"],
            ["module", base + "mortgageCalculator.js"],
            ["module", base + "mortgageCapacityCalculator.js?v=20260623-rate-term-linked"],
            ["module", base + "src/app/address-knowledge.js"],
            ["module", base + "src/app/config.js"],
            ["module", base + "src/app/config.js?v=20260627-ocr-fast"],
            ["module", base + "src/app/deed-fields.js"],
            ["module", base + "src/app/dom.js"],
            ["module", base + "src/app/ocr-flow.js"],
            ["module", base + "src/app/official-search.js"],
            ["module", base + "src/app/results.js"],
            ["module", base + "src/app/selectors.js"],
            ["module", base + "src/app/state.js"],
            ["module", base + "src/app/structured-data.js"],
            ["module", base + "src/app/ui-progress.js"],
            ["module", base + "src/constants.js"],
            ["module", base + "src/deed/area-extract.js"],
            ["module", base + "src/deed/area-extract.js?v=20260630-common-multi-label"],
            ["module", base + "src/deed/floor-type.js?v=20260628-townhouse-layer-series"],
            ["module", base + "src/deed/land-share.js"],
            ["module", base + "src/deed/text-sections.js"],
            ["module", base + "src/utils.js"],
            ["module", base + "src/valuation/address.js"],
            ["module", base + "src/valuation/run-search.js"],
            ["module", base + "src/valuation/sort.js"]
        ];

        var run = function () {
            warmAssets.forEach(function (asset) {
                if (asset[0] === "fetch") {
                    fetch(asset[1], { credentials: "same-origin", cache: "force-cache" }).catch(function () {});
                    return;
                }
                var link = document.createElement("link");
                link.rel = asset[0] === "style" ? "preload" : asset[0] === "module" ? "modulepreload" : asset[0];
                link.href = asset[1];
                if (asset[0] === "style") link.as = "style";
                if (asset[0] === "script") {
                    link.rel = "preload";
                    link.as = "script";
                }
                document.head.appendChild(link);
            });
        };

        if ("requestIdleCallback" in window) window.requestIdleCallback(run, { timeout: 700 });
        else window.setTimeout(run, 400);
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
