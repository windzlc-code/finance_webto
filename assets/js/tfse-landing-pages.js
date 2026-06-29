(function () {
    "use strict";

    var root = document.querySelector("[data-lp-detail]");
    if (!root) return;

    var landingPages = [];
    var products = [];
    var articles = [];

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

    function setMeta(selector, attr, value) {
        var node = document.querySelector(selector);
        if (node) node.setAttribute(attr, value);
    }

    function slugFromPath() {
        var match = window.location.pathname.match(/\/lp\/([^/]+)\.html$/);
        return match ? decodeURIComponent(match[1]) : "";
    }

    function landingPath(page) {
        if (/\/lp\/[^/]+\.html$/.test(window.location.pathname)) {
            return window.location.pathname.replace(/^\/+/, "");
        }
        return "lp.html?slug=" + encodeURIComponent(page.slug);
    }

    function matchesProduct(page, product) {
        return (page.product_categories || []).indexOf(product.category) !== -1;
    }

    function matchesArticle(page, article) {
        var haystack = [article.title, article.category, article.summary].concat(article.keywords || []).join(" ");
        return (page.article_keywords || []).some(function (keyword) {
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

    function renderFaq(page) {
        return (page.faq || []).map(function (item, index) {
            var show = index === 0 ? " show" : "";
            var collapsed = index === 0 ? "" : " collapsed";
            var expanded = index === 0 ? "true" : "false";
            return [
                "<div class=\"card\">",
                "<h2 class=\"card-header\" id=\"lpHeading" + index + "\">",
                "<button class=\"accordion-button acc-btn border-0" + collapsed + "\" type=\"button\" data-bs-toggle=\"collapse\" data-bs-target=\"#lpCollapse" + index + "\" aria-expanded=\"" + expanded + "\" aria-controls=\"lpCollapse" + index + "\">" + escapeHtml(item[0]) + "</button>",
                "</h2>",
                "<div id=\"lpCollapse" + index + "\" class=\"accordion-collapse collapse" + show + "\" aria-labelledby=\"lpHeading" + index + "\" data-bs-parent=\"#lpFaq\">",
                "<div class=\"card-body\">" + escapeHtml(item[1]) + "</div>",
                "</div>",
                "</div>"
            ].join("");
        }).join("");
    }

    function renderForm(page) {
        return [
            "<form action=\"#\" id=\"contact-form\" method=\"post\">",
            "<div class=\"row mb-n4\">",
            "<div class=\"col-md-6 col-12 mb-4\"><input type=\"text\" placeholder=\"稱呼 *\" name=\"display_name\" required></div>",
            "<div class=\"col-md-6 col-12 mb-4\"><input type=\"tel\" placeholder=\"手機 *\" name=\"phone\" required></div>",
            "<div class=\"col-md-6 col-12 mb-4\"><input type=\"text\" placeholder=\"Line ID（選填）\" name=\"line_id\"></div>",
            "<div class=\"col-md-6 col-12 mb-4\"><input type=\"text\" placeholder=\"所在地區\" name=\"region\"></div>",
            "<div class=\"col-md-6 col-12 mb-4\"><input type=\"text\" name=\"needs\" value=\"" + escapeHtml(page.need_label) + "\" aria-label=\"需求類型\"></div>",
            "<div class=\"col-md-6 col-12 mb-4\"><input type=\"text\" placeholder=\"身份類型：上班族 / 企業主 / 其他\" name=\"occupation_type\"></div>",
            "<div class=\"col-md-6 col-12 mb-4\"><input type=\"text\" placeholder=\"收入型態：固定薪轉 / 接案 / 營業收入\" name=\"income_type\"></div>",
            "<div class=\"col-12 mb-4\"><textarea name=\"message\" placeholder=\"目前困擾（選填）\"></textarea></div>",
            "<div class=\"col-12 mb-4\"><label><input type=\"checkbox\" name=\"consent_privacy\" required> 我已閱讀並同意隱私權政策，了解 TFSE 僅作資訊整理與法令導引。</label></div>",
            "<div class=\"col-12 mb-6\"><label><input type=\"checkbox\" name=\"consent_line\"> 我同意透過 Line 接收公開金融資訊與健檢結果提醒。</label></div>",
            "<input type=\"hidden\" name=\"source_url\" value=\"" + escapeHtml(landingPath(page)) + "\">",
            "<input type=\"hidden\" name=\"utm_source\">",
            "<input type=\"hidden\" name=\"utm_medium\">",
            "<input type=\"hidden\" name=\"utm_campaign\">",
            "<input type=\"hidden\" name=\"utm_content\">",
            "<input type=\"hidden\" name=\"utm_term\">",
            "<input type=\"hidden\" name=\"cf_turnstile_response\">",
            "<input type=\"text\" name=\"website\" tabindex=\"-1\" autocomplete=\"off\" aria-hidden=\"true\" style=\"position:absolute;left:-9999px;opacity:0;height:0;width:0;\">",
            "<div class=\"col-12 mb-4\" data-turnstile-field hidden></div>",
            "<div class=\"col-12 text-center mb-4\"><button class=\"btn btn-primary btn-hover-secondary\" type=\"submit\" data-lead-submit>送出免費健檢需求</button></div>",
            "</div>",
            "</form>",
            "<p class=\"form-messege\" aria-live=\"polite\">送出後顯示：已收到您的免費財務健檢需求。若需辦理金融業務，請親洽合法金融機構。</p>"
        ].join("");
    }

    function render() {
        var slug = new URLSearchParams(window.location.search).get("slug") || slugFromPath() || "free-check";
        var page = landingPages.filter(function (item) { return item.slug === slug; })[0] || landingPages[0];
        if (!page) return;

        var matchedProducts = products.filter(function (product) { return matchesProduct(page, product); });
        var matchedArticles = articles.filter(function (article) { return matchesArticle(page, article); });
        var canonical = "https://www.tfse-fcc.com/" + landingPath(page);
        var description = page.pain + " TFSE 僅整理公開資訊，不代辦、不代收證件、不保證核貸。";

        document.title = page.short_title + "｜TFSE金融便民中心";
        setMeta("link[rel='canonical']", "href", canonical);
        setMeta("meta[name='description']", "content", description);
        setMeta("meta[property='og:title']", "content", document.title);
        setMeta("meta[property='og:description']", "content", description);
        setMeta("meta[property='og:url']", "content", canonical);

        var title = document.querySelector("[data-lp-title]");
        var breadcrumb = document.querySelector("[data-lp-breadcrumb]");
        if (title) title.textContent = page.short_title;
        if (breadcrumb) breadcrumb.textContent = page.short_title;

        root.innerHTML = [
            "<div class=\"section section-padding-t90-b100\"><div class=\"container\"><div class=\"row row-cols-lg-2 row-cols-1 align-items-center mb-n6\">",
            "<div class=\"col mb-6\"><div class=\"section-title-two\"><span class=\"sub-title\">合法資訊查詢，不代辦、不收證件</span><h2 class=\"title\">" + escapeHtml(page.title) + "</h2></div><p>" + escapeHtml(page.pain) + "</p><p>TFSE 僅整理公開合法金融商品與法令資訊，所有融資、貸款業務須民眾親自洽詢合法金融機構辦理。</p><a class=\"btn btn-primary btn-hover-secondary mt-4\" href=\"#lp-form\">填寫免費健檢</a> <a class=\"btn btn-outline-secondary mt-4\" href=\"category.html?slug=" + escapeHtml(page.category_slug) + "\">查看分類資訊</a></div>",
            "<div class=\"col mb-6\"><div class=\"about-image-area\"><div class=\"about-image js-tilt\"><img src=\"assets/images/about/about-3.jpg\" alt=\"公開金融資訊查詢\"></div><div class=\"about-image js-tilt\"><img src=\"assets/images/about/about-7.jpg\" alt=\"金融便民資訊整理\"></div></div></div>",
            "</div></div></div>",
            "<div class=\"section section-padding-t90-b100\" data-bg-color=\"#f8faff\"><div class=\"container\"><div class=\"section-title text-center\"><h2 class=\"title fz-32\">三步完成資訊整理</h2></div><div class=\"row row-cols-lg-3 row-cols-md-3 row-cols-1 mb-n6\"><div class=\"col mb-6\"><div class=\"icon-box box-border text-center\"><div class=\"content\"><h3 class=\"title\">選擇需求</h3><p>確認想查詢的金融資訊類型與目前情境。</p></div></div></div><div class=\"col mb-6\"><div class=\"icon-box box-border text-center\"><div class=\"content\"><h3 class=\"title\">查看資訊</h3><p>閱讀公開資訊、注意事項、FAQ 與來源政策。</p></div></div></div><div class=\"col mb-6\"><div class=\"icon-box box-border text-center\"><div class=\"content\"><h3 class=\"title\">填寫健檢</h3><p>留下低敏資料，取得後續分類與文章建議。</p></div></div></div></div></div></div>",
            "<div class=\"section section-padding-t90-b100\"><div class=\"container\"><div class=\"section-title text-center\"><h2 class=\"title fz-32\">對應資訊卡片</h2></div><div class=\"row row-cols-lg-3 row-cols-md-2 row-cols-1 mb-n6\">" + renderCards(matchedProducts, "product") + renderCards(matchedArticles, "article") + "</div></div></div>",
            "<div class=\"faq-section section section-padding-top\" data-bg-color=\"#f8faff\"><div class=\"container\"><div class=\"row row-cols-lg-2 row-cols-1 mb-n6\"><div class=\"col mb-6\"><div class=\"faq-content\"><div class=\"section-title-two\"><span class=\"sub-title\">常見問題</span><h3 class=\"title\">投流頁資訊邊界</h3></div><div class=\"agency-accordion max-mb-n30\" id=\"lpFaq\">" + renderFaq(page) + "</div></div></div><div class=\"col mb-6 pl-xl-12\"><div class=\"about-image-area faq-image-area\"><div class=\"about-image right-n50 js-tilt\"><img src=\"assets/images/faq/faq-2.jpg\" alt=\"金融資訊查詢\"></div><div class=\"about-image js-tilt\"><img src=\"assets/images/faq/faq-1.jpg\" alt=\"合規提醒\"></div></div></div></div></div></div>",
            "<div id=\"lp-form\" class=\"section section-padding contact-section\"><div class=\"container\"><div class=\"row row-cols-lg-2 row-cols-1 align-items-center\"><div class=\"col\"><div class=\"contact-Information me-xl-7\"><div class=\"section-title-two\"><span class=\"sub-title\">不代辦、不收證件、不保證核貸</span><h3 class=\"title\">免費財務健檢查詢</h3></div><p>請勿填寫身分證字號、帳戶、卡號、密碼或證件資料。送出後資料會保存到本機示範 CRM，並保留 UTM 來源。</p><p id=\"line-cta\"><a href=\"free-check.html#line-cta\">Line 官方帳號承接說明</a></p></div></div><div class=\"col mt-lg-0 mt-md-10 mt-8\"><div class=\"contact-form-area box-shadow\"><div class=\"section-title text-center mb-7\"><h2 class=\"title fz-28\">留下需求，取得查詢方向</h2><p class=\"sub-title\">只收低敏需求資料。</p></div>" + renderForm(page) + "</div></div></div></div></div>"
        ].join("");

        if (window.TFSETrack) {
            window.TFSETrack("landing_page_view", {
                slug: page.slug,
                title: page.short_title,
                category_slug: page.category_slug
            });
        }
    }

    Promise.all([
        loadJson("assets/data/landing-pages.json"),
        loadProducts(),
        loadArticles()
    ]).then(function (results) {
        landingPages = results[0] || [];
        products = results[1] || [];
        articles = results[2] || [];
        render();
        document.dispatchEvent(new CustomEvent("tfse:landing-rendered"));
    });
})();
