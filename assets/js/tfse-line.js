(function () {
    "use strict";

    var roots = document.querySelectorAll("[data-line-flow]");
    if (!roots.length) return;

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function loadJson(path) {
        return fetch(path)
            .then(function (response) {
                if (!response.ok) throw new Error(path + " " + response.status);
                return response.json();
            })
            .catch(function () {
                return null;
            });
    }

    function renderButtons(items) {
        return (items || []).map(function (item) {
            var links = [
                item.article_href ? "<a class=\"link me-3\" data-line-quick-reply=\"" + escapeHtml(item.tag) + "\" data-line-action=\"article\" href=\"" + escapeHtml(item.article_href) + "\"><mark>入門文章</mark></a>" : "",
                item.database_href ? "<a class=\"link me-3\" data-line-quick-reply=\"" + escapeHtml(item.tag) + "\" data-line-action=\"database\" href=\"" + escapeHtml(item.database_href) + "\"><mark>資料庫</mark></a>" : "",
                item.free_check_href ? "<a class=\"link\" data-line-quick-reply=\"" + escapeHtml(item.tag) + "\" data-line-action=\"free_check\" href=\"" + escapeHtml(item.free_check_href) + "\"><mark>免費財務健檢查詢</mark></a>" : ""
            ].filter(Boolean).join("");
            return [
                "<div class=\"col mb-6\">",
                "<div class=\"icon-box box-border text-center\">",
                "<div class=\"content\">",
                "<h3 class=\"title\"><a data-line-quick-reply=\"" + escapeHtml(item.tag) + "\" href=\"" + escapeHtml(item.href) + "\">" + escapeHtml(item.label) + "</a></h3>",
                "<p>" + escapeHtml(item.reply) + "</p>",
                item.boundary ? "<p><small>" + escapeHtml(item.boundary) + "</small></p>" : "",
                "<a class=\"link me-3\" data-line-quick-reply=\"" + escapeHtml(item.tag) + "\" data-line-action=\"category\" href=\"" + escapeHtml(item.href) + "\"><mark>查看資訊</mark></a>",
                links ? "<div class=\"mt-2\">" + links + "</div>" : "",
                "</div>",
                "</div>",
                "</div>"
            ].join("");
        }).join("");
    }

    function renderTags(tags) {
        return (tags || []).map(function (tag) {
            return "<span class=\"badge bg-light text-dark me-2 mb-2\">" + escapeHtml(tag) + "</span>";
        }).join("");
    }

    function renderPrinciples(items) {
        return "<ul>" + (items || []).map(function (item) {
            return "<li>" + escapeHtml(item) + "</li>";
        }).join("") + "</ul>";
    }

    function bindClicks(root) {
        Array.prototype.slice.call(root.querySelectorAll("[data-line-quick-reply]")).forEach(function (link) {
            link.addEventListener("click", function () {
                if (window.TFSETrack) {
                    window.TFSETrack("line_quick_reply_click", {
                        tag: link.getAttribute("data-line-quick-reply"),
                        action: link.getAttribute("data-line-action") || "category",
                        href: link.getAttribute("href")
                    });
                }
            });
        });
    }

    function render(data) {
        if (!data) return;
        Array.prototype.slice.call(roots).forEach(function (root) {
            root.innerHTML = [
                "<div class=\"section-title text-center mb-7\">",
                "<h2 class=\"title fz-32\">Line 官方帳號承接說明</h2>",
                "<p class=\"sub-title\">" + escapeHtml((data.welcome || []).join(" ")) + "</p>",
                "</div>",
                "<div class=\"row row-cols-lg-3 row-cols-md-2 row-cols-1 mb-n6\">" + renderButtons(data.quick_replies) + "</div>",
                "<div class=\"row mt-8\">",
                "<div class=\"col-lg-6 col-12 mb-6\"><h5 class=\"title\">Line 分群標籤</h5><div>" + renderTags(data.tags) + "</div></div>",
                "<div class=\"col-lg-6 col-12 mb-6\"><h5 class=\"title\">自動回覆原則</h5>" + renderPrinciples(data.reply_principles) + "</div>",
                "</div>"
            ].join("");
            bindClicks(root);
        });
        if (window.TFSETrack) {
            window.TFSETrack("line_flow_view", {
                quick_replies: (data.quick_replies || []).length,
                tags: (data.tags || []).length
            });
        }
    }

    loadJson("assets/data/line-flows.json").then(render);
})();
