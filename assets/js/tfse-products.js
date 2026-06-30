(function () {
    "use strict";

    var grid = document.querySelector("[data-product-grid]");
    var categoryGrid = document.querySelector("[data-product-categories]");
    var detail = document.querySelector("[data-product-detail]");
    var products = [];
    var articles = [];
    var categories = [];
    var smallImages = [
        "assets/images/blog/370/blog-1.jpg",
        "assets/images/blog/370/blog-2.jpg",
        "assets/images/blog/370/blog-3.jpg",
        "assets/images/blog/370/blog-4.jpg",
        "assets/images/blog/370/blog-5.jpg",
        "assets/images/blog/370/blog-6.jpg"
    ];
    var projectImages = [
        "assets/images/project/project-1.jpg",
        "assets/images/project/project-2.jpg",
        "assets/images/project/project-3.jpg",
        "assets/images/project/project-4.jpg",
        "assets/images/project/project-5.jpg",
        "assets/images/project/project-6.jpg"
    ];

    if (!grid && !categoryGrid && !detail) return;

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function detailUrl(product) {
        return "products/" + encodeURIComponent(product.slug) + ".html";
    }

    function slugFromPath() {
        var match = window.location.pathname.match(/\/products\/([^/]+)\.html$/);
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

    function loadProducts() {
        if (!window.TFSEApi || !window.TFSEApi.listProducts) return loadJson("assets/data/products.json", []);
        return window.TFSEApi.listProducts({}).then(function (result) {
            return result.items || [];
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

    function applyAdminOverrides(data) {
        var statusOverrides = getLocalJson("tfse_product_status", {});
        var contentOverrides = getLocalJson("tfse_product_overrides", {});
        return (data || []).map(function (product) {
            var copy = {};
            Object.keys(product).forEach(function (key) {
                copy[key] = product[key];
            });
            Object.keys(contentOverrides[product.id] || {}).forEach(function (key) {
                copy[key] = contentOverrides[product.id][key];
            });
            copy.status = statusOverrides[product.id] || copy.status || "來源待核驗";
            return copy;
        });
    }

    function renderProductGrid() {
        if (!grid) return;
        grid.innerHTML = products.map(function (product, index) {
            return [
                "<div class=\"col\" data-tfse-db-card data-type=\"" + escapeHtml(product.type) + "\">",
                "<div class=\"blog\">",
                "<div class=\"thumbnail\"><a href=\"" + detailUrl(product) + "\" class=\"image\"><img src=\"" + smallImages[index % smallImages.length] + "\" alt=\"" + escapeHtml(product.title) + "\"></a></div>",
                "<div class=\"info\">",
                "<ul class=\"meta\">",
                "<li><i class=\"far fa-calendar\"></i>" + escapeHtml(product.status) + "</li>",
                "<li><i class=\"far fa-eye\"></i>" + escapeHtml(product.type_label) + "</li>",
                "</ul>",
                "<h3 class=\"title\"><a href=\"" + detailUrl(product) + "\">" + escapeHtml(product.title) + "</a></h3>",
                "<p>" + escapeHtml(product.summary) + "</p>",
                "<a href=\"" + detailUrl(product) + "\" class=\"link \"> <mark>查看分類</mark> </a>",
                "</div>",
                "</div>",
                "</div>"
            ].join("");
        }).join("");
        document.dispatchEvent(new CustomEvent("tfse:products-rendered"));
    }

    function renderCategoryGrid() {
        if (!categoryGrid) return;
        categoryGrid.innerHTML = products.map(function (product, index) {
            return [
                "<div class=\"col mb-6\">",
                "<div class=\"work\">",
                "<div class=\"thumbnail\"><a class=\"image\" href=\"" + detailUrl(product) + "\"><img src=\"" + projectImages[index % projectImages.length] + "\" alt=\"" + escapeHtml(product.title) + "\"></a></div>",
                "<div class=\"info\">",
                "<h3 class=\"title\"><a href=\"" + detailUrl(product) + "\">" + escapeHtml(product.title) + "</a></h3>",
                "<p class=\"desc\">" + escapeHtml(product.summary) + "</p>",
                "<a href=\"" + detailUrl(product) + "\">查看資訊</a>",
                "</div>",
                "</div>",
                "</div>"
            ].join("");
        }).join("");
    }

    function renderDetail() {
        if (!detail || !products.length) return;
        var slug = new URLSearchParams(window.location.search).get("slug") || slugFromPath();
        var product = products.filter(function (item) {
            return item.slug === slug;
        })[0] || products[0];

        var pageTitle = document.querySelector(".page-title-section h1.title");
        var pageCurrent = document.querySelector(".page-breadcrumb li.current");
        var sideTitle = document.querySelector("[data-product-side-title]");
        var updated = document.querySelector("[data-product-updated]");
        var type = document.querySelector("[data-product-type]");
        var category = document.querySelector("[data-product-category]");
        var status = document.querySelector("[data-product-status]");
        var title = document.querySelector("[data-product-title]");
        var body = document.querySelector("[data-product-body]");
        var source = document.querySelector("[data-product-source]");
        var checkTitle = document.querySelector("[data-product-check-title]");
        var checks = document.querySelector("[data-product-checks]");
        var relatedProducts = document.querySelector("[data-related-products]");
        var relatedArticles = document.querySelector("[data-related-product-articles]");
        var productFaq = document.querySelector("[data-product-faq-list]");

        document.title = product.title + "｜TFSE金融便民中心";
        var canonicalUrl = siteBase() + "/" + detailUrl(product);
        setMeta("link[rel='canonical']", "href", canonicalUrl);
        setMeta("meta[name='description']", "content", product.summary);
        setMeta("meta[property='og:title']", "content", document.title);
        setMeta("meta[property='og:description']", "content", product.summary);
        setMeta("meta[property='og:url']", "content", canonicalUrl);
        if (pageTitle) pageTitle.textContent = product.title;
        if (pageCurrent) pageCurrent.textContent = product.category_label;
        if (sideTitle) sideTitle.textContent = "資訊摘要";
        if (updated) updated.textContent = product.updated_at;
        if (type) type.textContent = product.type_label;
        if (category) category.textContent = product.category_label;
        if (status) status.textContent = product.status;
        if (title) title.textContent = product.title;
        if (source) {
            source.setAttribute("href", product.source_url || "source-policy.html");
            source.textContent = product.source_title || "查看來源政策";
        }
        if (checkTitle) checkTitle.textContent = product.category_label + "查詢前確認事項";
        if (checks) checks.textContent = (product.checks || []).join("、") + "。本站不代收文件，也不協助辦理流程。";
        if (body) {
            body.innerHTML = [
                "<div class=\"content mb-5\" data-aos=\"fade-up\"><p><strong>" + escapeHtml(product.summary) + "</strong></p></div>",
                "<div class=\"content mb-5\" data-aos=\"fade-up\"><p>適用受眾：" + escapeHtml(product.audience) + "；服務地區：" + escapeHtml(product.region) + "。</p></div>",
                "<div class=\"content mb-5\" data-aos=\"fade-up\"><p>TFSE 僅彙整公開合法金融商品與法令資訊，不代表任何金融機構，也不承諾額度、利率、速度或核貸結果。</p></div>",
                "<div class=\"content mb-12\" data-aos=\"fade-up\"><p>資料來源與更新：請依來源政策回到官方或主管機關公開資訊確認最新條件。</p></div>",
                "<div class=\"work-btn\"><a class=\"btn btn-primary btn-hover-secondary\" data-product-source href=\"" + escapeHtml(product.source_url || "source-policy.html") + "\">查看官方來源</a> <a class=\"btn btn-outline-secondary\" href=\"database.html\">回到資料庫</a> <a class=\"btn btn-primary btn-hover-secondary\" href=\"free-check.html\">不確定是否適合？做免費財務健檢查詢</a></div>"
            ].join("");
        }

        renderRelatedProducts(product, relatedProducts);
        renderRelatedArticles(product, relatedArticles);
        renderProductFaq(product, productFaq);

        if (window.TFSETrack) {
            window.TFSETrack("product_detail_view", {
                slug: product.slug,
                type: product.type,
                category: product.category
            });
        }
    }

    function renderRelatedProducts(product, root) {
        if (!root) return;
        var related = products.filter(function (item) {
            return item.id !== product.id && (item.category === product.category || item.type === product.type);
        }).sort(function (a, b) {
            var aScore = a.category === product.category ? 0 : 1;
            var bScore = b.category === product.category ? 0 : 1;
            return aScore - bScore;
        }).slice(0, 3);
        if (!related.length) {
            root.innerHTML = "<div class=\"icon-box box-border text-center\"><div class=\"content\"><h3 class=\"title\">相關公開資訊</h3><div class=\"desc\"><p>目前尚無同分類資料，請回到資料庫查詢。</p></div><a class=\"link\" href=\"database.html\">回到資料庫</a></div></div>";
            return;
        }
        root.innerHTML = [
            "<div class=\"icon-box box-border text-center\"><div class=\"content\"><h3 class=\"title\">相關公開資訊</h3><div class=\"desc\"><ul class=\"text-start\">",
            related.map(function (item) {
                return "<li><a href=\"" + detailUrl(item) + "\">" + escapeHtml(item.title) + "</a><br><small>" + escapeHtml(item.status || "來源待核驗") + " ｜ " + escapeHtml(item.type_label || "") + "</small></li>";
            }).join(""),
            "</ul></div><a class=\"link\" href=\"database.html\">查看完整資料庫</a></div></div>"
        ].join("");
    }

    function articleMatchesProduct(product, article) {
        var haystack = [
            article.title,
            article.category,
            article.summary,
            (article.keywords || []).join(" ")
        ].join(" ");
        var needles = [product.category_label, product.category, product.type_label, product.title].filter(Boolean);
        return needles.some(function (keyword) {
            return haystack.indexOf(keyword) !== -1;
        });
    }

    function renderRelatedArticles(product, root) {
        if (!root) return;
        var related = articles.filter(function (article) {
            return article.status === "published" && articleMatchesProduct(product, article);
        }).slice(0, 3);
        if (!related.length) {
            related = articles.filter(function (article) {
                return article.status === "published";
            }).slice(0, 3);
        }
        root.innerHTML = [
            "<div class=\"icon-box box-border text-center\"><div class=\"content\"><h3 class=\"title\">推薦文章</h3><div class=\"desc\"><ul class=\"text-start\">",
            related.map(function (article) {
                return "<li><a href=\"articles/" + encodeURIComponent(article.slug) + ".html\">" + escapeHtml(article.title) + "</a><br><small>" + escapeHtml(article.category || "金融知識") + "</small></li>";
            }).join(""),
            "</ul></div><a class=\"link\" href=\"articles.html\">查看金融知識</a></div></div>"
        ].join("");
    }

    function categoryForProduct(product) {
        return categories.filter(function (category) {
            return (category.product_categories || []).indexOf(product.category) !== -1 || category.slug === product.category;
        })[0] || null;
    }

    function renderProductFaq(product, root) {
        if (!root) return;
        var category = categoryForProduct(product);
        var faqs = category && Array.isArray(category.faq) ? category.faq : [];
        if (!faqs.length) {
            root.innerHTML = "<div class=\"icon-box box-border text-center\"><div class=\"content\"><h3 class=\"title\">常見問題</h3><div class=\"desc\"><p>目前尚無此分類 FAQ，請先查看免責聲明與來源政策。</p></div><a class=\"link\" href=\"disclaimer.html\">查看免責聲明</a></div></div>";
            return;
        }
        root.innerHTML = [
            "<div class=\"icon-box box-border text-start\"><div class=\"content\"><h3 class=\"title text-center\">" + escapeHtml(category.short_title || "常見問題") + " FAQ</h3>",
            faqs.map(function (item) {
                return "<div class=\"desc mb-4\"><p><strong>" + escapeHtml(item[0]) + "</strong><br>" + escapeHtml(item[1]) + "</p></div>";
            }).join(""),
            "<div class=\"text-center\"><a class=\"link\" href=\"disclaimer.html\">查看免責聲明</a> ｜ <a class=\"link\" href=\"source-policy.html\">查看來源政策</a></div></div></div>"
        ].join("");
    }

    Promise.all([
        loadProducts(),
        loadArticles(),
        loadJson("assets/data/categories.json", [])
    ]).then(function (data) {
        products = applyAdminOverrides(data[0] || []);
        articles = data[1] || [];
        categories = data[2] || [];
        renderProductGrid();
        renderCategoryGrid();
        renderDetail();
    });
})();
