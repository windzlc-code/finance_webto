(function () {
    "use strict";

    var roots = document.querySelectorAll("[data-faq-list]");
    if (!roots.length) return;

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function loadJson(path, fallback) {
        return fetch(path).then(function (response) {
            if (!response.ok) throw new Error(path + " " + response.status);
            return response.json();
        }).catch(function () {
            return fallback;
        });
    }

    function getOverrides() {
        try {
            return JSON.parse(localStorage.getItem("tfse_faq_overrides") || "{}");
        } catch (error) {
            return {};
        }
    }

    function withOverrides(items) {
        var overrides = getOverrides();
        return (items || []).map(function (item, index) {
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
        });
    }

    function renderAccordion(items) {
        return items.map(function (item, index) {
            var show = index === 0 ? " show" : "";
            var collapsed = index === 0 ? "" : " collapsed";
            var expanded = index === 0 ? "true" : "false";
            var heading = "faqHeading" + index;
            var collapse = "faqCollapse" + index;
            return [
                "<div class=\"card\">",
                "<h2 class=\"card-header\" id=\"" + heading + "\">",
                "<button class=\"accordion-button acc-btn border-0" + collapsed + "\" type=\"button\" data-bs-toggle=\"collapse\" data-bs-target=\"#" + collapse + "\" aria-expanded=\"" + expanded + "\" aria-controls=\"" + collapse + "\">" + escapeHtml(item.question) + "</button>",
                "</h2>",
                "<div id=\"" + collapse + "\" class=\"accordion-collapse collapse" + show + "\" aria-labelledby=\"" + heading + "\" data-bs-parent=\"#tfseFaqAccordion\">",
                "<div class=\"card-body\">" + escapeHtml(item.answer) + "</div>",
                "</div>",
                "</div>"
            ].join("");
        }).join("");
    }

    loadJson("assets/data/faq.json", []).then(function (items) {
        var faqs = withOverrides(items);
        Array.prototype.slice.call(roots).forEach(function (root) {
            root.innerHTML = faqs.length ? renderAccordion(faqs) : "<p>目前尚無常見問題。</p>";
        });
        if (window.TFSETrack) {
            window.TFSETrack("faq_view", { count: faqs.length });
        }
    });
})();
