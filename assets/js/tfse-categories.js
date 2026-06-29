(function () {
    "use strict";

    var list = document.querySelector("[data-finance-categories]");
    var detail = document.querySelector("[data-category-detail]");
    var categories = [];
    var products = [];
    var articles = [];
    var categoryAliases = {
        "mortgage": "mortgage.html",
        "credit-loan": "credit-loan.html",
        "vehicle-finance": "vehicle-finance.html",
        "installment": "installment.html",
        "credit-union": "credit-union.html",
        "debt-law": "debt-law.html",
        "insurance-finance": "insurance-finance.html",
        "anti-fraud": "anti-fraud.html"
    };
    var images = [
        "assets/images/project/project-1.jpg",
        "assets/images/project/project-2.jpg",
        "assets/images/project/project-3.jpg",
        "assets/images/project/project-4.jpg",
        "assets/images/project/project-5.jpg",
        "assets/images/project/project-6.jpg"
    ];

    if (!list && !detail) return;

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function loadJson(path) {
        return fetch(path).then(function (response) {
            if (!response.ok) throw new Error(path + " " + response.status);
            return response.json();
        }).catch(function () {
            return [];
        });
    }

    function loadProducts() {
        if (!window.TFSEApi || !window.TFSEApi.listProducts) return loadJson("assets/data/products.json");
        return window.TFSEApi.listProducts({}).then(function (result) {
            return result.items || [];
        });
    }

    function loadArticles() {
        if (!window.TFSEApi || !window.TFSEApi.listArticles) return loadJson("assets/data/articles.json");
        return window.TFSEApi.listArticles({ status: "published" }).then(function (result) {
            return result.items || [];
        });
    }

    function categoryUrl(category) {
        return categoryAliases[category.slug] || ("category.html?slug=" + encodeURIComponent(category.slug));
    }

    function slugFromPath() {
        var file = window.location.pathname.split("/").pop().replace(/\.html$/, "");
        return categoryAliases[file] ? file : "";
    }

    function siteBase() {
        var canonical = document.querySelector("link[rel='canonical']");
        var href = canonical ? canonical.getAttribute("href") || "" : "";
        return href.replace(/\/[^/]*$/, "");
    }

    function setMeta(selector, attr, value) {
        var node = document.querySelector(selector);
        if (node) node.setAttribute(attr, value);
    }

    function renderList() {
        if (!list) return;
        list.innerHTML = categories.map(function (category, index) {
            return [
                "<div class=\"col mb-6\">",
                "<div class=\"work\">",
                "<div class=\"thumbnail\"><a class=\"image\" href=\"" + categoryUrl(category) + "\"><img src=\"" + images[index % images.length] + "\" alt=\"" + escapeHtml(category.short_title) + "\"></a></div>",
                "<div class=\"info\">",
                "<h3 class=\"title\"><a href=\"" + categoryUrl(category) + "\">" + escapeHtml(category.short_title) + "</a></h3>",
                "<p class=\"desc\">" + escapeHtml(category.description) + "</p>",
                "<a href=\"" + categoryUrl(category) + "\">查看分類</a>",
                "</div>",
                "</div>",
                "</div>"
            ].join("");
        }).join("");
    }

    function matchesProduct(category, product) {
        return (category.product_categories || []).indexOf(product.category) !== -1;
    }

    function matchesArticle(category, article) {
        var haystack = [article.title, article.category, article.summary].concat(article.keywords || []).join(" ");
        return (category.article_keywords || []).some(function (keyword) {
            return haystack.indexOf(keyword) !== -1;
        });
    }

    function renderCards(items, type) {
        if (!items.length) return "<p>目前尚無對應公開資訊，請先查看資料庫或免費健檢。</p>";
        return items.slice(0, 3).map(function (item, index) {
            var href = type === "product"
                ? "products/" + encodeURIComponent(item.slug) + ".html"
                : "articles/" + encodeURIComponent(item.slug) + ".html";
            return [
                "<div class=\"col mb-6\">",
                "<div class=\"blog\">",
                "<div class=\"thumbnail\"><a href=\"" + href + "\" class=\"image\"><img src=\"assets/images/blog/370/blog-" + ((index % 6) + 1) + ".jpg\" alt=\"" + escapeHtml(item.title) + "\"></a></div>",
                "<div class=\"info\">",
                "<ul class=\"meta\"><li><i class=\"far fa-calendar\"></i>" + escapeHtml(item.updated_at || "2026-06-27") + "</li><li><i class=\"far fa-eye\"></i>" + escapeHtml(item.category_label || item.category || "公開資訊") + "</li></ul>",
                "<h3 class=\"title\"><a href=\"" + href + "\">" + escapeHtml(item.title) + "</a></h3>",
                "<p>" + escapeHtml(item.summary) + "</p>",
                "<a href=\"" + href + "\" class=\"link\"><mark>閱讀更多</mark></a>",
                "</div>",
                "</div>",
                "</div>"
            ].join("");
        }).join("");
    }

    function renderListItems(items) {
        return (items || []).map(function (item) {
            return "<li>" + escapeHtml(item) + "</li>";
        }).join("");
    }

    function renderFaq(category) {
        return (category.faq || []).map(function (item, index) {
            var show = index === 0 ? " show" : "";
            var collapsed = index === 0 ? "" : " collapsed";
            var expanded = index === 0 ? "true" : "false";
            return [
                "<div class=\"card\">",
                "<h2 class=\"card-header\" id=\"categoryHeading" + index + "\">",
                "<button class=\"accordion-button acc-btn border-0" + collapsed + "\" type=\"button\" data-bs-toggle=\"collapse\" data-bs-target=\"#categoryCollapse" + index + "\" aria-expanded=\"" + expanded + "\" aria-controls=\"categoryCollapse" + index + "\">" + escapeHtml(item[0]) + "</button>",
                "</h2>",
                "<div id=\"categoryCollapse" + index + "\" class=\"accordion-collapse collapse" + show + "\" aria-labelledby=\"categoryHeading" + index + "\" data-bs-parent=\"#categoryFaq\">",
                "<div class=\"card-body\">" + escapeHtml(item[1]) + "</div>",
                "</div>",
                "</div>"
            ].join("");
        }).join("");
    }

    function renderDetail() {
        if (!detail) return;
        var slug = new URLSearchParams(window.location.search).get("slug") || slugFromPath() || "mortgage";
        var category = categories.filter(function (item) { return item.slug === slug; })[0] || categories[0];
        if (!category) return;

        var matchedProducts = products.filter(function (product) { return matchesProduct(category, product); });
        var matchedArticles = articles.filter(function (article) { return matchesArticle(category, article); });
        var canonical = siteBase() + "/" + categoryUrl(category);

        document.title = category.title + "｜TFSE金融便民中心";
        setMeta("link[rel='canonical']", "href", canonical);
        setMeta("meta[name='description']", "content", category.description);
        setMeta("meta[property='og:title']", "content", document.title);
        setMeta("meta[property='og:description']", "content", category.description);
        setMeta("meta[property='og:url']", "content", canonical);

        var pageTitle = document.querySelector("[data-category-title]");
        var breadcrumb = document.querySelector("[data-category-breadcrumb]");
        if (pageTitle) pageTitle.textContent = category.title;
        if (breadcrumb) breadcrumb.textContent = category.short_title;

        detail.innerHTML = [
            "<div class=\"section section-padding-t90-b100\"><div class=\"container\">",
            "<div class=\"section-title text-center\" data-aos=\"fade-up\"><h2 class=\"title fz-32\">" + escapeHtml(category.title) + "</h2><p class=\"sub-title\">" + escapeHtml(category.description) + "</p></div>",
            "<div class=\"row row-cols-lg-3 row-cols-md-3 row-cols-1 mb-n6\">",
            "<div class=\"col mb-6\"><div class=\"icon-box box-border text-center\"><div class=\"content\"><h3 class=\"title\">適合對象</h3><ul class=\"text-start\">" + renderListItems(category.audience) + "</ul></div></div></div>",
            "<div class=\"col mb-6\"><div class=\"icon-box box-border text-center\"><div class=\"content\"><h3 class=\"title\">常見需求</h3><ul class=\"text-start\">" + renderListItems(category.needs) + "</ul></div></div></div>",
            "<div class=\"col mb-6\"><div class=\"icon-box box-border text-center\"><div class=\"content\"><h3 class=\"title\">合規邊界</h3><p>TFSE 僅整理公開資訊，不代辦、不代收證件、不保證核貸。</p></div></div></div>",
            "</div></div></div>",
            "<div class=\"section section-padding-t90-b100\" data-bg-color=\"#f8faff\"><div class=\"container\"><div class=\"section-title text-center\"><h2 class=\"title fz-32\">對應資料庫條目</h2></div><div class=\"row row-cols-lg-3 row-cols-md-2 row-cols-1 mb-n6\">" + renderCards(matchedProducts, "product") + "</div></div></div>",
            "<div class=\"section section-padding-t90-b100\"><div class=\"container\"><div class=\"section-title text-center\"><h2 class=\"title fz-32\">相關金融知識</h2></div><div class=\"row row-cols-lg-3 row-cols-md-2 row-cols-1 mb-n6\">" + renderCards(matchedArticles, "article") + "</div></div></div>",
            "<div class=\"faq-section section section-padding-top\" data-bg-color=\"#f8faff\"><div class=\"container\"><div class=\"row row-cols-lg-2 row-cols-1 mb-n6\"><div class=\"col mb-6\"><div class=\"faq-content\"><div class=\"section-title-two\"><span class=\"sub-title\">常見問題</span><h3 class=\"title\">查詢前先確認資訊邊界</h3></div><div class=\"agency-accordion max-mb-n30\" id=\"categoryFaq\">" + renderFaq(category) + "</div></div></div><div class=\"col mb-6 pl-xl-12\"><div class=\"about-image-area faq-image-area\"><div class=\"about-image right-n50 js-tilt\"><img src=\"assets/images/faq/faq-2.jpg\" alt=\"金融資訊查詢\"></div><div class=\"about-image js-tilt\"><img src=\"assets/images/faq/faq-1.jpg\" alt=\"公開來源確認\"></div></div></div></div></div></div>",
            "<div class=\"section section-padding-t110-b120 newsletter-section\" data-bg-color=\"#000\" data-overlay=\"0.7\" data-bg-image=\"assets/images/tfse/tfse-database-hero.png\"><div class=\"container\"><div class=\"cta-content text-center\"><div class=\"section-title color-light text-center mb-0\"><h2 class=\"title\">不確定適合哪類？先做免費財務健檢</h2><p class=\"sub-title fz-18\">只收低敏需求資料，協助導向資料庫、文章與法令資訊，不代辦、不收證件、不保證核貸。</p></div><a href=\"free-check.html\" class=\"btn btn-primary btn-hover-secondary mt-6\">免費健檢</a></div></div></div>"
        ].join("");
    }

    Promise.all([
        loadJson("assets/data/categories.json"),
        loadProducts(),
        loadArticles()
    ]).then(function (results) {
        categories = results[0] || [];
        products = results[1] || [];
        articles = results[2] || [];
        renderList();
        renderDetail();
    });
})();
