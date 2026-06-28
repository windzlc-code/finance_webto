(function () {
    "use strict";

    var root = document.querySelector("[data-institution-directory]");
    if (!root) return;

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

    function loadInstitutions() {
        if (!window.TFSEApi || !window.TFSEApi.listInstitutions) return loadJson("assets/data/institutions.json");
        return window.TFSEApi.listInstitutions({}).then(function (result) {
            return result.items || [];
        });
    }

    function renderStatus(status) {
        var labels = {
            verified: "已核驗",
            source_pending: "來源待核驗",
            needs_update: "需更新",
            archived: "已封存"
        };
        return labels[status] || status || "來源待核驗";
    }

    function renderDirectory(items) {
        if (!items.length) {
            root.innerHTML = "<div class=\"col\"><p>來源資料載入中或暫無資料。</p></div>";
            return;
        }
        root.innerHTML = items.map(function (item) {
            var external = /^https?:\/\//i.test(item.official_url || "");
            var target = external ? " target=\"_blank\" rel=\"noopener\"" : "";
            return [
                "<div class=\"col mb-6\">",
                "<div class=\"blog\">",
                "<div class=\"info\">",
                "<ul class=\"meta\">",
                "<li><i class=\"far fa-eye\"></i>" + escapeHtml(item.type_label || item.type) + "</li>",
                "<li><i class=\"far fa-calendar\"></i>" + escapeHtml(renderStatus(item.verification_status)) + "</li>",
                "</ul>",
                "<h3 class=\"title\"><a data-institution-source href=\"" + escapeHtml(item.official_url || "source-policy.html") + "\"" + target + ">" + escapeHtml(item.name) + "</a></h3>",
                "<p>" + escapeHtml(item.summary) + "</p>",
                "<p><strong>核驗依據：</strong>" + escapeHtml(item.registry_ref || "公開來源") + "</p>",
                "<a data-institution-source href=\"" + escapeHtml(item.official_url || "source-policy.html") + "\" class=\"link\"" + target + "><mark>查看官方來源</mark></a>",
                "</div>",
                "</div>",
                "</div>"
            ].join("");
        }).join("");

        if (window.TFSETrack) {
            window.TFSETrack("institution_directory_view", { count: items.length });
        }
    }

    loadInstitutions().then(renderDirectory);
})();
