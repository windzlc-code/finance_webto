(function () {
    "use strict";

    var panel = document.querySelector("[data-home-query]");
    var need = document.querySelector("[data-home-query-need]");
    var audience = document.querySelector("[data-home-query-audience]");
    var region = document.querySelector("[data-home-query-region]");
    var submit = document.querySelector("[data-home-query-submit]");
    var results = document.querySelector("[data-home-query-results]");

    if (!panel || !need || !results) return;

    var categories = [];
    var articles = [];

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function loadJson(path, fallback) {
        return fetch(path)
            .then(function (response) {
                if (!response.ok) throw new Error(path + " " + response.status);
                return response.json();
            })
            .catch(function () {
                return fallback;
            });
    }

    function loadArticles() {
        if (!window.TFSEApi || !window.TFSEApi.listArticles) return loadJson("assets/data/articles.json", []);
        return window.TFSEApi.listArticles({ status: "published" }).then(function (result) {
            return result.items || [];
        });
    }

    function selectedCategory() {
        var slug = need.value;
        return categories.filter(function (item) {
            return item.slug === slug;
        })[0] || categories[0];
    }

    function articleMatches(category, article) {
        var haystack = [
            article.title,
            article.category,
            article.summary,
            (article.keywords || []).join(" ")
        ].join(" ");
        return (category.article_keywords || []).some(function (keyword) {
            return haystack.indexOf(keyword) !== -1;
        });
    }

    function recommendedArticles(category) {
        return articles.filter(function (article) {
            return article.status === "published" && articleMatches(category, article);
        }).slice(0, 3);
    }

    function renderLinks(items) {
        return items.map(function (item) {
            return "<li><a href=\"articles/" + encodeURIComponent(item.slug) + ".html\">" + escapeHtml(item.title) + "</a></li>";
        }).join("");
    }

    function render() {
        var category = selectedCategory();
        if (!category) return;
        var picks = recommendedArticles(category);
        var audienceValue = audience ? audience.value : "";
        var regionValue = region ? region.value.trim() : "";
        var sourceUrl = "free-check.html?needs=" + encodeURIComponent(category.short_title || category.title || "") +
            "&occupation_type=" + encodeURIComponent(audienceValue) +
            "&region=" + encodeURIComponent(regionValue) +
            "&utm_source=site&utm_medium=home_query&utm_campaign=financial_query_panel";

        results.innerHTML = [
            "<div class=\"col mb-6\"><div class=\"icon-box box-border text-center\"><div class=\"content\">",
            "<h3 class=\"title\">" + escapeHtml(category.short_title || category.title) + "</h3>",
            "<div class=\"desc\"><p>" + escapeHtml(category.description) + "</p><p>身份：" + escapeHtml(audienceValue || "未選擇") + "；地區：" + escapeHtml(regionValue || "全台") + "。</p></div>",
            "<a class=\"link\" href=\"category.html?slug=" + encodeURIComponent(category.slug) + "\">查看分類</a> ｜ <a class=\"link\" href=\"database.html\">查資料庫</a>",
            "</div></div></div>",
            "<div class=\"col mb-6\"><div class=\"icon-box box-border text-center\"><div class=\"content\">",
            "<h3 class=\"title\">推薦閱讀</h3>",
            "<div class=\"desc\"><ul class=\"text-start\">" + (picks.length ? renderLinks(picks) : "<li>暫無對應文章，可先查看資料庫。</li>") + "</ul></div>",
            "<a class=\"btn btn-primary btn-hover-secondary mt-4\" href=\"" + sourceUrl + "\">帶入免費財務健檢查詢</a>",
            "</div></div></div>"
        ].join("");

        if (window.TFSETrack) {
            window.TFSETrack("home_query_recommendation", {
                need: category.slug,
                audience: audienceValue,
                region: regionValue || "全台",
                article_count: picks.length
            });
        }
    }

    Promise.all([
        loadJson("assets/data/categories.json", []),
        loadArticles()
    ]).then(function (data) {
        categories = data[0] || [];
        articles = data[1] || [];
        render();
    });

    [need, audience, region].forEach(function (input) {
        if (!input) return;
        input.addEventListener(input.tagName === "INPUT" ? "input" : "change", render);
    });
    if (submit) submit.addEventListener("click", render);
})();
