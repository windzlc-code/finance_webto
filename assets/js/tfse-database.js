(function () {
    "use strict";

    var keyword = document.querySelector("[data-tfse-db-keyword]");
    var type = document.querySelector("[data-tfse-db-type]");
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-tfse-db-card]"));
    var count = document.querySelector("[data-tfse-db-count]");
    var empty = document.querySelector("[data-tfse-db-empty]");
    var searchButton = document.querySelector("[data-tfse-db-search-submit]");
    var tabButtons = Array.prototype.slice.call(document.querySelectorAll("[data-tfse-db-tab]"));

    if (!cards.length) return;

    function defaultTypeFromPath() {
        var path = window.location.pathname;
        if (path.indexOf("/database/banks") !== -1) return "bank";
        if (path.indexOf("/database/finance-companies") !== -1) return "finance_company";
        if (path.indexOf("/database/credit-unions") !== -1) return "credit_union";
        return "";
    }

    function applyDefaultType() {
        if (!type) return;
        var defaultType = type.getAttribute("data-default-type") || defaultTypeFromPath();
        if (!defaultType) return;
        type.value = defaultType;
        syncTabs(defaultType);
    }

    function syncTabs(value) {
        var current = value || "all";
        tabButtons.forEach(function (button) {
            button.classList.toggle("is-active", button.getAttribute("data-tfse-db-tab") === current);
        });
    }

    function applyFilters() {
        var keywordValue = keyword ? keyword.value.trim().toLowerCase() : "";
        var typeValue = type ? type.value : "all";
        var visible = 0;

        syncTabs(typeValue);
        cards = Array.prototype.slice.call(document.querySelectorAll("[data-tfse-db-card]"));
        cards.forEach(function (card) {
            var text = card.textContent.toLowerCase();
            var matchesKeyword = !keywordValue || text.indexOf(keywordValue) !== -1;
            var matchesType = typeValue === "all" || card.getAttribute("data-type") === typeValue;
            var show = matchesKeyword && matchesType;

            card.style.display = show ? "" : "none";
            if (show) visible += 1;
        });

        if (count) count.textContent = "目前顯示 " + visible + " 筆公開資訊";
        if (empty) empty.style.display = visible ? "none" : "";
    }

    if (keyword) keyword.addEventListener("input", applyFilters);
    if (type) type.addEventListener("change", applyFilters);
    if (searchButton) searchButton.addEventListener("click", function () {
        applyFilters();
        var target = document.querySelector(".tfse-db-content-grid") || document.querySelector("[data-tfse-db-card]");
        if (target && target.scrollIntoView) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    tabButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            var nextType = button.getAttribute("data-tfse-db-tab") || "all";
            if (type) type.value = nextType;
            syncTabs(nextType);
            applyFilters();
        });
    });
    document.addEventListener("tfse:products-rendered", applyFilters);
    applyDefaultType();
    applyFilters();
})();
