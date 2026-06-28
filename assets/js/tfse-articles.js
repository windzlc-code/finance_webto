(function () {
    "use strict";

    var grid = document.querySelector("[data-article-grid]");
    var list = document.querySelector("[data-article-list]");
    var detail = document.querySelector("[data-article-detail]");
    var categories = document.querySelector("[data-article-categories]");
    var recent = document.querySelector("[data-article-recent]");
    var tags = document.querySelector("[data-article-tags]");
    var search = document.querySelector("[data-article-search]");

    if (!grid && !list && !detail && !categories && !recent && !tags) return;

    var articles = [];
    var faqs = [];
    var image370 = [
        "assets/images/blog/370/blog-1.jpg",
        "assets/images/blog/370/blog-2.jpg",
        "assets/images/blog/370/blog-3.jpg",
        "assets/images/blog/370/blog-4.jpg",
        "assets/images/blog/370/blog-5.jpg",
        "assets/images/blog/370/blog-6.jpg",
        "assets/images/blog/370/blog-7.jpg"
    ];
    var image770 = [
        "assets/images/blog/770/blog-1.jpg",
        "assets/images/blog/770/blog-2.jpg",
        "assets/images/blog/770/blog-3.jpg"
    ];

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

    function getLocalJson(key, fallback) {
        try {
            return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
        } catch (error) {
            return fallback;
        }
    }

    function getStatusOverrides() {
        try {
            return JSON.parse(localStorage.getItem("tfse_article_status") || "{}");
        } catch (error) {
            return {};
        }
    }

    function withStatus(article) {
        var overrides = getStatusOverrides();
        var contentOverrides = getLocalJson("tfse_article_overrides", {});
        var copy = {};
        Object.keys(article).forEach(function (key) {
            copy[key] = article[key];
        });
        Object.keys(contentOverrides[article.id] || {}).forEach(function (key) {
            copy[key] = contentOverrides[article.id][key];
        });
        copy.status = overrides[article.id] || copy.status || "draft";
        return copy;
    }

    function withFaqOverrides(item, index) {
        var overrides = getLocalJson("tfse_faq_overrides", {});
        var id = item.id || "faq_" + index;
        var copy = {
            id: id,
            question: item.question,
            answer: item.answer
        };
        Object.keys(overrides[id] || {}).forEach(function (key) {
            copy[key] = overrides[id][key];
        });
        return copy;
    }

    function detailUrl(article) {
        return "articles/" + encodeURIComponent(article.slug) + ".html";
    }

    function slugFromPath() {
        var match = window.location.pathname.match(/\/articles\/([^/]+)\.html$/);
        return match ? decodeURIComponent(match[1]) : "";
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

    function imageFor(index, size) {
        var pool = size === "large" ? image770 : image370;
        return pool[index % pool.length];
    }

    function allKeywords() {
        var map = {};
        articles.map(withStatus).filter(function (article) {
            return article.status === "published";
        }).forEach(function (article) {
            (article.keywords || []).forEach(function (keyword) {
                map[keyword] = true;
            });
        });
        return Object.keys(map).slice(0, 12);
    }

    function visibleArticles() {
        var query = search ? search.value.trim().toLowerCase() : "";
        return articles.map(withStatus).filter(function (article) {
            if (article.status !== "published") return false;
            var haystack = [
                article.title,
                article.category,
                article.summary,
                (article.keywords || []).join(" ")
            ].join(" ").toLowerCase();
            return !query || haystack.indexOf(query) !== -1;
        });
    }

    function renderGrid() {
        if (!grid) return;
        var items = visibleArticles();
        if (!items.length) {
            grid.innerHTML = "<div class=\"col\"><p>尚無符合條件的文章。</p></div>";
            return;
        }

        grid.innerHTML = items.map(function (article, index) {
            return [
                "<div class=\"col\">",
                "<div class=\"blog\">",
                "<div class=\"thumbnail\"><a href=\"" + detailUrl(article) + "\" class=\"image\"><img src=\"" + imageFor(index, "small") + "\" alt=\"" + escapeHtml(article.title) + "\"></a></div>",
                "<div class=\"info\">",
                "<ul class=\"meta\">",
                "<li><i class=\"far fa-calendar\"></i>" + escapeHtml(article.updated_at) + "</li>",
                "<li><i class=\"far fa-eye\"></i>" + escapeHtml(article.category) + "</li>",
                "</ul>",
                "<h3 class=\"title\"><a href=\"" + detailUrl(article) + "\">" + escapeHtml(article.title) + "</a></h3>",
                "<a href=\"" + detailUrl(article) + "\" class=\"link \"> <mark>閱讀更多</mark> </a>",
                "</div>",
                "</div>",
                "</div>"
            ].join("");
        }).join("");
    }

    function renderList() {
        if (!list) return;
        var items = visibleArticles();
        if (!items.length) {
            list.innerHTML = "<div class=\"blog-3 col\"><p>尚無符合條件的文章。</p></div>";
            return;
        }

        list.innerHTML = items.map(function (article, index) {
            return [
                "<div class=\"blog-3 col\" data-aos=\"fade-up\">",
                "<div class=\"thumbnail\"><a href=\"" + detailUrl(article) + "\" class=\"image\"><img src=\"" + imageFor(index, "large") + "\" alt=\"" + escapeHtml(article.title) + "\"></a></div>",
                "<div class=\"info\">",
                "<ul class=\"meta\">",
                "<li><i class=\"fal fa-pencil-alt\"></i>TFSE 編輯台，" + escapeHtml(article.updated_at) + "</li>",
                "<li><i class=\"fas fa-tags\"></i>" + escapeHtml(article.category) + "</li>",
                "<li><i class=\"fas fa-comments\"></i>" + escapeHtml(article.status === "published" ? "已發布" : "待審核") + "</li>",
                "</ul>",
                "<h3 class=\"title\"><a href=\"" + detailUrl(article) + "\">" + escapeHtml(article.title) + "</a></h3>",
                "<div class=\"desc\"><p>" + escapeHtml(article.summary) + "</p></div>",
                "<a href=\"" + detailUrl(article) + "\" class=\"btn btn-primary btn-hover-secondary mt-6\">閱讀更多</a>",
                "</div>",
                "</div>"
            ].join("");
        }).join("");
    }

    function renderArticleTypes() {
        if (!categories) return;
        var counts = {};
        visibleArticles().forEach(function (article) {
            counts[article.category] = (counts[article.category] || 0) + 1;
        });
        categories.innerHTML = Object.keys(counts).map(function (category) {
            return "<li><a href=\"blog-classic.html\"><span class=\"text\">" + escapeHtml(category) + "</span> <span class=\"count\">" + counts[category] + "</span></a></li>";
        }).join("");
    }

    function renderRecent() {
        if (!recent) return;
        recent.innerHTML = visibleArticles().slice(0, 5).map(function (article) {
            return [
                "<li>",
                "<span class=\"cate\">" + escapeHtml(article.category) + "</span>",
                "<a href=\"" + detailUrl(article) + "\">" + escapeHtml(article.title) + "</a>",
                "</li>"
            ].join("");
        }).join("");
    }

    function renderTags() {
        if (!tags) return;
        tags.innerHTML = allKeywords().map(function (keyword) {
            return "<a href=\"blog-classic.html\">" + escapeHtml(keyword) + "</a>";
        }).join("");
    }

    function bodyParagraphs(article) {
        return [
            "<p><strong>" + escapeHtml(article.summary) + "</strong></p>",
            "<p>本文以公開資訊、官方公告與法令資源為整理基礎，協助使用者建立查詢方向。實際條件、費用、利率與審核結果，仍應以合法金融機構或主管機關最新公告為準。</p>",
            "<p>查詢前可先整理自身需求、地區、工作型態與想了解的分類，再回到資料庫或官方來源逐項確認。TFSE 不代辦貸款、不代收證件、不保證核貸。</p>",
            "<p><strong>合規提醒</strong></p>",
            "<p>" + escapeHtml(article.compliance_note || "本中心僅彙整公開合法金融商品與法令資訊，不構成金融商品建議。") + "</p>",
            "<p>如遇要求預先付款、交付證件、提供金融卡密碼或承諾結果的不明窗口，請停止互動並回到合法機構官方管道查證。</p>"
        ].join("");
    }

    function renderDetail() {
        if (!detail) return;
        var params = new URLSearchParams(window.location.search);
        var slug = params.get("slug") || slugFromPath();
        var published = visibleArticles();
        var article = published.filter(function (item) {
            return item.slug === slug;
        })[0] || published[0];

        if (!article) return;

        var title = document.querySelector("[data-article-title]");
        var body = document.querySelector("[data-article-body]");
        var meta = document.querySelector("[data-article-meta]");
        var pageTitle = document.querySelector(".page-title-section h1.title");
        var pageCurrent = document.querySelector(".page-breadcrumb li.current");
        var thumbnail = detail.querySelector(".thumbnail img");

        document.title = article.title + "｜TFSE金融便民中心";
        var canonicalUrl = siteBase() + "/" + detailUrl(article);
        setMeta("link[rel='canonical']", "href", canonicalUrl);
        setMeta("meta[property='og:title']", "content", document.title);
        setMeta("meta[property='og:description']", "content", article.seo_description || article.summary);
        setMeta("meta[property='og:url']", "content", canonicalUrl);
        var description = document.querySelector("meta[name='description']");
        if (description) description.setAttribute("content", article.seo_description || article.summary);
        if (pageTitle) pageTitle.textContent = article.title;
        if (pageCurrent) pageCurrent.textContent = article.category;
        if (title) title.textContent = article.title;
        if (body) body.innerHTML = bodyParagraphs(article);
        if (thumbnail) {
            var index = articles.indexOf(articles.filter(function (item) { return item.id === article.id; })[0]);
            thumbnail.setAttribute("src", imageFor(Math.max(index, 0), "large"));
            thumbnail.setAttribute("alt", article.title);
        }
        if (meta) {
            meta.innerHTML = [
                "<li><i class=\"fal fa-pencil-alt\"></i>TFSE 編輯台，更新日期 " + escapeHtml(article.updated_at) + "</li>",
                "<li><i class=\"fas fa-tags\"></i>" + escapeHtml(article.category) + "</li>",
                "<li><i class=\"fas fa-comments\"></i>" + escapeHtml(article.status === "published" ? "已發布" : "待審核") + "</li>",
                "<li class=\"media\"><a href=\"" + detailUrl(article) + "\"><i class=\"fas fa-share-alt\"></i>分享文章</a></li>"
            ].join("");
        }
    }

    function renderRelated() {
        var related = document.querySelector("[data-related-articles]");
        if (!related || !articles.length) return;
        related.innerHTML = visibleArticles().slice(1, 3).map(function (article, index) {
            return [
                "<div class=\"nav-item " + (index === 0 ? "prev" : "next") + "\">",
                "<div class=\"inner\"><a href=\"" + detailUrl(article) + "\">",
                "<div class=\"hover-bg has-thumbnail\" data-bg-image=\"./assets/images/pagination/blog-pagination" + (index ? "-2" : "") + ".jpg\"></div>",
                "<span class=\"cate\">" + escapeHtml(article.category) + "</span>",
                "<h6>" + escapeHtml(article.title) + "</h6>",
                "</a></div>",
                "</div>"
            ].join("");
        }).join("");
    }

    function renderFaq() {
        var faqList = document.querySelector("[data-article-faq]");
        if (!faqList || !faqs.length) return;
        faqList.innerHTML = faqs.slice(0, 4).map(function (item, index) {
            return [
                "<li class=\"comment\">",
                "<div class=\"comment-" + (index + 2) + "\">",
                "<div class=\"comment-author vcard\"><img alt=\"TFSE常見問題回覆示意\" src=\"assets/images/comment/comment" + ((index % 4) + 1) + ".png\"></div>",
                "<div class=\"comment-content\">",
                "<div class=\"meta\"><h6 class=\"fn\">TFSE 常見問題</h6><div class=\"comment-datetime\">27 Jun, 2026. 10:00AM</div></div>",
                "<div class=\"comment-text\"><p><strong>" + escapeHtml(item.question) + "</strong><br>" + escapeHtml(item.answer) + "</p></div>",
                "<div class=\"comment-actions\"><a class=\"comment-reply-link\" href=\"disclaimer.html\">查看說明</a></div>",
                "</div>",
                "</div>",
                "</li>"
            ].join("");
        }).join("");
    }

    function renderAll() {
        renderGrid();
        renderList();
        renderArticleTypes();
        renderRecent();
        renderTags();
        renderDetail();
        renderRelated();
        renderFaq();
    }

    Promise.all([
        loadArticles(),
        loadJson("assets/data/faq.json", [])
    ]).then(function (data) {
        articles = data[0] || [];
        faqs = (data[1] || []).map(withFaqOverrides);
        renderAll();
        if (search) search.addEventListener("input", function () {
            renderGrid();
            renderList();
        });
    });
})();
