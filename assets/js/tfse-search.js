(function () {
    "use strict";

    var resultRoot = document.querySelector("[data-search-results]");
    var titleNode = document.querySelector("[data-search-title]");
    var countNode = document.querySelector("[data-search-count]");
    var inputNode = document.querySelector("[data-search-input]");

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

    function loadSearchResults(query) {
        if (!window.TFSEApi || !window.TFSEApi.searchSite) {
            return Promise.all([
                loadJson("assets/data/products.json"),
                loadJson("assets/data/articles.json"),
                loadJson("assets/data/categories.json")
            ]).then(function (sets) {
                return {
                    products: (sets[0] || []).map(function (item) {
                        item.result_type = "資料庫";
                        item.href = "products/" + encodeURIComponent(item.slug) + ".html";
                        return item;
                    }),
                    articles: (sets[1] || []).map(function (item) {
                        item.result_type = "文章";
                        item.href = "articles/" + encodeURIComponent(item.slug) + ".html";
                        return item;
                    }),
                    categories: (sets[2] || []).map(function (item) {
                        item.result_type = "分類";
                        item.title = item.title || item.short_title;
                        item.href = "category.html?slug=" + encodeURIComponent(item.slug);
                        return item;
                    })
                };
            });
        }
        return window.TFSEApi.searchSite({ q: query }).then(function (result) {
            return {
                products: (result.products || []).map(function (entry) {
                    if (entry.item) {
                        entry.item.result_type = entry.type || "資料庫";
                        entry.item.href = entry.href;
                        return entry.item;
                    }
                    entry.result_type = entry.result_type || "資料庫";
                    entry.href = entry.href || ("products/" + encodeURIComponent(entry.slug) + ".html");
                    return entry;
                }),
                articles: (result.articles || []).map(function (entry) {
                    if (entry.item) {
                        entry.item.result_type = entry.type || "文章";
                        entry.item.href = entry.href;
                        return entry.item;
                    }
                    entry.result_type = entry.result_type || "文章";
                    entry.href = entry.href || ("articles/" + encodeURIComponent(entry.slug) + ".html");
                    return entry;
                }),
                categories: (result.categories || []).map(function (entry) {
                    if (entry.item) {
                        entry.item.result_type = entry.type || "分類";
                        entry.item.title = entry.item.title || entry.item.short_title;
                        entry.item.href = entry.href;
                        return entry.item;
                    }
                    entry.result_type = entry.result_type || "分類";
                    entry.title = entry.title || entry.short_title;
                    entry.href = entry.href || ("category.html?slug=" + encodeURIComponent(entry.slug));
                    return entry;
                })
            };
        });
    }

    function normalize(value) {
        return String(value || "").toLowerCase();
    }

    function bindGlobalSearchForms() {
        Array.prototype.slice.call(document.querySelectorAll(".form-search")).forEach(function (box) {
            var form = box.closest("form");
            var input = box.querySelector("input[type='search'], input[type='text']");
            if (!form || !input || form.getAttribute("data-tfse-search-bound") === "true") return;
            form.setAttribute("data-tfse-search-bound", "true");
            form.addEventListener("submit", function (event) {
                event.preventDefault();
                var query = input.value.trim();
                if (!query) return;
                if (window.TFSETrack) {
                    window.TFSETrack("site_search", { keyword: query, source: window.location.pathname.split("/").pop() || "index.html" });
                }
                window.location.href = "search.html?q=" + encodeURIComponent(query);
            });
        });
    }

    function toResult(item) {
        var text = [item.title, item.name, item.question, item.answer, item.summary, item.description, item.category, item.category_label, item.short_title, item.type_label, item.registry_ref, (item.keywords || []).join(" ")].join(" ");
        return {
            title: item.title || item.short_title || item.name || item.question,
            summary: item.summary || item.description || item.answer || item.pain || "",
            type: item.result_type,
            href: item.href,
            haystack: normalize(text)
        };
    }

    function getLocalJson(key, fallback) {
        try {
            return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
        } catch (error) {
            return fallback;
        }
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

    function renderResults() {
        if (!resultRoot) return;
        var query = new URLSearchParams(window.location.search).get("q") || "";
        var normalized = normalize(query);
        if (inputNode) inputNode.value = query;
        if (titleNode) titleNode.textContent = query ? "搜尋：" + query : "全站搜尋";

        Promise.all([
            loadSearchResults(query),
            loadJson("assets/data/landing-pages.json"),
            loadJson("assets/data/institutions.json"),
            loadJson("assets/data/faq.json")
        ]).then(function (sets) {
            var apiResults = sets[0] || {};
            var products = apiResults.products || [];
            var articles = apiResults.articles || [];
            var categories = apiResults.categories || [];
            var landingPages = sets[1].map(function (item) {
                item.result_type = "落地頁";
                item.title = item.title || item.short_title;
                item.href = "lp.html?slug=" + encodeURIComponent(item.slug);
                return item;
            });
            var institutions = sets[2].map(function (item) {
                item.result_type = "公開來源";
                item.href = "source-policy.html";
                return item;
            });
            var faqs = sets[3].map(withFaqOverrides).map(function (item) {
                item.result_type = "FAQ";
                item.href = "free-check.html#tfseFaqAccordion";
                return item;
            });
            var results = products.concat(articles, categories, landingPages, institutions, faqs).map(toResult).filter(function (item) {
                return !normalized || item.haystack.indexOf(normalized) !== -1;
            });

            if (countNode) countNode.textContent = "找到 " + results.length + " 筆相關資訊";
            if (window.TFSETrack && query) {
                window.TFSETrack("site_search_results", { keyword: query, count: results.length });
            }

            if (!results.length) {
                resultRoot.innerHTML = "<div class=\"col\"><p>找不到符合條件的資訊，可改用「房貸」「信貸」「債務」「防詐」等關鍵字，或先填寫免費財務健檢查詢。</p><a class=\"btn btn-primary btn-hover-secondary mt-4\" href=\"free-check.html\">免費財務健檢查詢</a></div>";
                return;
            }

            resultRoot.innerHTML = results.map(function (item) {
                return [
                    "<div class=\"col mb-6\">",
                    "<div class=\"blog\">",
                    "<div class=\"info\">",
                    "<ul class=\"meta\"><li><i class=\"far fa-eye\"></i>" + escapeHtml(item.type) + "</li></ul>",
                    "<h3 class=\"title\"><a href=\"" + escapeHtml(item.href) + "\">" + escapeHtml(item.title) + "</a></h3>",
                    "<p>" + escapeHtml(item.summary) + "</p>",
                    "<a href=\"" + escapeHtml(item.href) + "\" class=\"link\"><mark>查看資訊</mark></a>",
                    "</div>",
                    "</div>",
                    "</div>"
                ].join("");
            }).join("");
        });
    }

    bindGlobalSearchForms();
    renderResults();
})();
