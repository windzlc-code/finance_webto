(function () {
    "use strict";

    var configPromise = null;

    function loadConfig() {
        if (configPromise) return configPromise;
        configPromise = fetch("site-config.json")
            .then(function (response) {
                if (!response.ok) throw new Error("site-config.json " + response.status);
                return response.json();
            })
            .catch(function () {
                return {};
            });
        return configPromise;
    }

    function backendConfig(config) {
        return (config && config.backend) || {};
    }

    function apiBase(config) {
        return String(backendConfig(config).api_base_url || "").replace(/\/$/, "");
    }

    function timeoutMs(config) {
        return Number(backendConfig(config).timeout_ms || 8000);
    }

    function backendMode(config) {
        return String(backendConfig(config).mode || "localStorage");
    }

    function endpoint(config, path) {
        var base = apiBase(config);
        if (!base) return "";
        return base + path;
    }

    function loadStaticJson(path, fallback) {
        return fetch(path)
            .then(function (response) {
                if (!response.ok) throw new Error(path + " " + response.status);
                return response.json();
            })
            .catch(function () {
                return fallback;
            });
    }

    function queryString(params) {
        var search = new URLSearchParams();
        Object.keys(params || {}).forEach(function (key) {
            var value = params[key];
            if (value === undefined || value === null || value === "") return;
            search.set(key, value);
        });
        var text = search.toString();
        return text ? "?" + text : "";
    }

    function includesKeyword(text, keyword) {
        return String(text || "").toLowerCase().indexOf(String(keyword || "").toLowerCase()) !== -1;
    }

    function filterProducts(items, params) {
        params = params || {};
        return (items || []).filter(function (item) {
            if (params.type && item.type !== params.type) return false;
            if (params.category && item.category !== params.category) return false;
            if (params.audience && !includesKeyword(item.audience, params.audience)) return false;
            if (params.region && !includesKeyword(item.region, params.region)) return false;
            if (params.status && item.status !== params.status) return false;
            if (params.keyword) {
                var haystack = [
                    item.title,
                    item.summary,
                    item.type_label,
                    item.category_label,
                    item.source_title,
                    (item.checks || []).join(" ")
                ].join(" ");
                if (!includesKeyword(haystack, params.keyword)) return false;
            }
            return true;
        });
    }

    function filterArticles(items, params) {
        params = params || {};
        return (items || []).filter(function (item) {
            if (params.status && item.status !== params.status) return false;
            if (params.category && item.category !== params.category) return false;
            if (params.keyword) {
                var haystack = [
                    item.title,
                    item.summary,
                    item.category,
                    item.seo_description,
                    (item.keywords || []).join(" ")
                ].join(" ");
                if (!includesKeyword(haystack, params.keyword)) return false;
            }
            return true;
        });
    }

    function filterInstitutions(items, params) {
        params = params || {};
        return (items || []).filter(function (item) {
            if (params.type && item.type !== params.type) return false;
            if (params.region && !includesKeyword(item.region, params.region)) return false;
            if (params.keyword) {
                var haystack = [item.name, item.summary, item.type_label, item.registry_ref].join(" ");
                if (!includesKeyword(haystack, params.keyword)) return false;
            }
            return true;
        });
    }

    function localSearchResult(item, type, href) {
        return {
            type: type,
            href: href,
            item: item
        };
    }

    function localSearch(params) {
        params = params || {};
        return Promise.all([
            loadStaticJson("assets/data/products.json", []),
            loadStaticJson("assets/data/articles.json", []),
            loadStaticJson("assets/data/categories.json", [])
        ]).then(function (sets) {
            var keyword = params.q || "";
            return {
                mode: "static",
                products: filterProducts(sets[0], { keyword: keyword }).map(function (item) { return localSearchResult(item, "資料庫", "products/" + encodeURIComponent(item.slug) + ".html"); }),
                articles: filterArticles(sets[1], { keyword: keyword, status: "published" }).map(function (item) { return localSearchResult(item, "文章", "articles/" + encodeURIComponent(item.slug) + ".html"); }),
                categories: (sets[2] || []).filter(function (item) {
                    var haystack = [item.title, item.short_title, item.description].join(" ");
                    return !keyword || includesKeyword(haystack, keyword);
                }).map(function (item) { return localSearchResult(item, "分類", "category.html?slug=" + encodeURIComponent(item.slug)); })
            };
        });
    }

    function getStoredLeads() {
        try {
            return JSON.parse(localStorage.getItem("tfse_leads") || "[]");
        } catch (error) {
            return [];
        }
    }

    function saveStoredLeads(leads) {
        try {
            localStorage.setItem("tfse_leads", JSON.stringify(leads));
        } catch (error) {
            // localStorage can be unavailable in private browsing or file contexts.
        }
    }

    function requestJson(url, options, ms) {
        var controller = window.AbortController ? new AbortController() : null;
        var timer = controller ? setTimeout(function () { controller.abort(); }, ms) : null;
        var requestOptions = Object.assign({
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        }, options || {});
        if (controller) requestOptions.signal = controller.signal;

        return fetch(url, requestOptions)
            .then(function (response) {
                if (timer) clearTimeout(timer);
                if (!response.ok) {
                    var error = new Error(url + " " + response.status);
                    error.status = response.status;
                    throw error;
                }
                return response.json().catch(function () { return {}; });
            })
            .catch(function (error) {
                if (timer) clearTimeout(timer);
                throw error;
            });
    }

    function reportApiFallback(action, error) {
        if (window.TFSEReportError) {
            window.TFSEReportError("api_fallback", action + ": " + (error && error.message ? error.message : error), {});
        }
    }

    function localSubmitLead(payload) {
        var leads = getStoredLeads();
        leads.unshift(payload);
        saveStoredLeads(leads);
        return Promise.resolve({
            mode: "localStorage",
            lead: payload,
            id: payload.id,
            status: payload.status || "new"
        });
    }

    function getStoredPublicFeedback() {
        try {
            return JSON.parse(localStorage.getItem("tfse_public_feedback_tickets") || "[]");
        } catch (error) {
            return [];
        }
    }

    function saveStoredPublicFeedback(items) {
        try {
            localStorage.setItem("tfse_public_feedback_tickets", JSON.stringify(items));
        } catch (error) {
            // Ignore storage failures in private browsing or locked-down contexts.
        }
    }

    function localSubmitPublicFeedback(payload) {
        var tickets = getStoredPublicFeedback();
        var ticket = Object.assign({
            ticket_id: payload.ticket_id || ("feedback_local_" + Date.now()),
            status: "queued",
            assigned_role: "data_manager",
            related_task_type: payload.feedback_type || "content_error",
            received_at: new Date().toISOString()
        }, payload);
        tickets.unshift(ticket);
        saveStoredPublicFeedback(tickets);
        return Promise.resolve({
            mode: "localStorage",
            ticket_id: ticket.ticket_id,
            status: ticket.status,
            assigned_role: ticket.assigned_role,
            related_task_type: ticket.related_task_type,
            ticket: ticket
        });
    }

    function submitLead(payload) {
        return loadConfig().then(function (config) {
            var url = endpoint(config, "/api/leads");
            if (!url) return localSubmitLead(payload);
            return requestJson(url, {
                method: "POST",
                body: JSON.stringify(payload)
            }, timeoutMs(config)).then(function (data) {
                return Object.assign({ mode: "api" }, data);
            }).catch(function (error) {
                reportApiFallback("POST /api/leads", error);
                return localSubmitLead(payload).then(function (data) {
                    data.mode = "api_fallback_localStorage";
                    data.error = error.message;
                    return data;
                });
            });
        });
    }

    function submitPublicFeedback(payload) {
        return loadConfig().then(function (config) {
            var url = endpoint(config, "/api/public-feedback");
            if (!url) return localSubmitPublicFeedback(payload);
            return requestJson(url, {
                method: "POST",
                body: JSON.stringify(payload)
            }, timeoutMs(config)).then(function (data) {
                return Object.assign({ mode: "api" }, data);
            }).catch(function (error) {
                reportApiFallback("POST /api/public-feedback", error);
                return localSubmitPublicFeedback(payload).then(function (data) {
                    data.mode = "api_fallback_localStorage";
                    data.error = error.message;
                    return data;
                });
            });
        });
    }

    function listLeads() {
        return loadConfig().then(function (config) {
            var url = endpoint(config, "/api/admin/leads");
            if (!url) return { mode: "localStorage", items: getStoredLeads() };
            return requestJson(url, { method: "GET" }, timeoutMs(config)).then(function (data) {
                return Object.assign({ mode: "api" }, data);
            }).catch(function (error) {
                reportApiFallback("GET /api/admin/leads", error);
                return { mode: "api_fallback_localStorage", items: getStoredLeads(), error: error.message };
            });
        });
    }

    function updateLeadStatus(id, status, note, meta) {
        meta = meta || {};
        return loadConfig().then(function (config) {
            var url = endpoint(config, "/api/admin/leads/" + encodeURIComponent(id) + "/status");
            if (!url) return localUpdateLeadStatus(id, status, note, meta);
            return requestJson(url, {
                method: "PATCH",
                body: JSON.stringify(Object.assign({ status: status, note: note || "" }, meta))
            }, timeoutMs(config)).then(function (data) {
                return Object.assign({ mode: "api" }, data);
            }).catch(function (error) {
                reportApiFallback("PATCH /api/admin/leads/:id/status", error);
                return localUpdateLeadStatus(id, status, note, meta).then(function (data) {
                    data.mode = "api_fallback_localStorage";
                    data.error = error.message;
                    return data;
                });
            });
        });
    }

    function localUpdateLeadStatus(id, status, note, meta) {
        meta = meta || {};
        var updatedLead = null;
        var now = new Date().toISOString();
        var leads = getStoredLeads().map(function (lead) {
            if (lead.id !== id) return lead;
            lead.status = status;
            if (meta.assigned_to) lead.assigned_to = meta.assigned_to;
            if (meta.follow_up_priority) lead.follow_up_priority = meta.follow_up_priority;
            if (Object.prototype.hasOwnProperty.call(meta, "next_follow_up_at")) lead.next_follow_up_at = meta.next_follow_up_at;
            if (meta.contact_log) lead.contact_logs = (lead.contact_logs || []).concat(meta.contact_log);
            lead.updated_at = now;
            if (note) lead.notes = (lead.notes || []).concat(now + " " + note);
            updatedLead = lead;
            return lead;
        });
        saveStoredLeads(leads);
        return Promise.resolve({ mode: "localStorage", lead: updatedLead });
    }

    function loginAdmin(credentials) {
        credentials = credentials || {};
        return loadConfig().then(function (config) {
            var url = endpoint(config, "/api/admin/auth/login");
            if (!url || backendMode(config) !== "api") {
                return {
                    mode: "localStorage",
                    authenticated: false,
                    supported: false
                };
            }
            return requestJson(url, {
                method: "POST",
                body: JSON.stringify({
                    password: credentials.password || "",
                    role: credentials.role || "viewer"
                })
            }, timeoutMs(config)).then(function (data) {
                return Object.assign({ mode: "api", authenticated: true }, data);
            });
        });
    }

    function getAdminSession() {
        return loadConfig().then(function (config) {
            var url = endpoint(config, "/api/admin/auth/session");
            if (!url || backendMode(config) !== "api") {
                return {
                    mode: "localStorage",
                    authenticated: false,
                    supported: false
                };
            }
            return requestJson(url, { method: "GET" }, timeoutMs(config)).then(function (data) {
                return Object.assign({ mode: "api", authenticated: !!data.authenticated }, data);
            }).catch(function (error) {
                if (error && error.status === 401) {
                    return { mode: "api", authenticated: false };
                }
                reportApiFallback("GET /api/admin/auth/session", error);
                return { mode: "api_fallback_localStorage", authenticated: false, error: error.message };
            });
        });
    }

    function logoutAdmin() {
        return loadConfig().then(function (config) {
            var url = endpoint(config, "/api/admin/auth/logout");
            if (!url || backendMode(config) !== "api") {
                return {
                    mode: "localStorage",
                    authenticated: false,
                    supported: false
                };
            }
            return requestJson(url, {
                method: "POST",
                body: JSON.stringify({})
            }, timeoutMs(config)).then(function (data) {
                return Object.assign({ mode: "api", authenticated: false }, data);
            });
        });
    }

    function listProducts(params) {
        params = params || {};
        return loadConfig().then(function (config) {
            var url = endpoint(config, "/api/products");
            if (!url || backendMode(config) !== "api") {
                return loadStaticJson("assets/data/products.json", []).then(function (items) {
                    var filtered = filterProducts(items, params);
                    return { mode: "static", items: filtered, page: 1, total: filtered.length };
                });
            }
            return requestJson(url + queryString(params), { method: "GET" }, timeoutMs(config)).then(function (data) {
                return Object.assign({ mode: "api" }, data);
            }).catch(function (error) {
                reportApiFallback("GET /api/products", error);
                return loadStaticJson("assets/data/products.json", []).then(function (items) {
                    var filtered = filterProducts(items, params);
                    return { mode: "api_fallback_static", items: filtered, page: 1, total: filtered.length, error: error.message };
                });
            });
        });
    }

    function getProduct(slug) {
        return loadConfig().then(function (config) {
            var url = endpoint(config, "/api/products/" + encodeURIComponent(slug));
            if (!url || backendMode(config) !== "api") {
                return loadStaticJson("assets/data/products.json", []).then(function (items) {
                    return { mode: "static", item: (items || []).filter(function (item) { return item.slug === slug; })[0] || null };
                });
            }
            return requestJson(url, { method: "GET" }, timeoutMs(config)).then(function (data) {
                return { mode: "api", item: data && data.slug ? data : (data.product || null) };
            }).catch(function (error) {
                reportApiFallback("GET /api/products/:slug", error);
                return loadStaticJson("assets/data/products.json", []).then(function (items) {
                    return { mode: "api_fallback_static", item: (items || []).filter(function (item) { return item.slug === slug; })[0] || null, error: error.message };
                });
            });
        });
    }

    function listArticles(params) {
        params = params || {};
        return loadConfig().then(function (config) {
            var url = endpoint(config, "/api/articles");
            if (!url || backendMode(config) !== "api") {
                return loadStaticJson("assets/data/articles.json", []).then(function (items) {
                    var filtered = filterArticles(items, params);
                    return { mode: "static", items: filtered, page: 1, total: filtered.length };
                });
            }
            return requestJson(url + queryString(params), { method: "GET" }, timeoutMs(config)).then(function (data) {
                return Object.assign({ mode: "api" }, data);
            }).catch(function (error) {
                reportApiFallback("GET /api/articles", error);
                return loadStaticJson("assets/data/articles.json", []).then(function (items) {
                    var filtered = filterArticles(items, params);
                    return { mode: "api_fallback_static", items: filtered, page: 1, total: filtered.length, error: error.message };
                });
            });
        });
    }

    function getArticle(slug) {
        return loadConfig().then(function (config) {
            var url = endpoint(config, "/api/articles/" + encodeURIComponent(slug));
            if (!url || backendMode(config) !== "api") {
                return loadStaticJson("assets/data/articles.json", []).then(function (items) {
                    return { mode: "static", item: (items || []).filter(function (item) { return item.slug === slug; })[0] || null };
                });
            }
            return requestJson(url, { method: "GET" }, timeoutMs(config)).then(function (data) {
                return { mode: "api", item: data && data.slug ? data : (data.article || null) };
            }).catch(function (error) {
                reportApiFallback("GET /api/articles/:slug", error);
                return loadStaticJson("assets/data/articles.json", []).then(function (items) {
                    return { mode: "api_fallback_static", item: (items || []).filter(function (item) { return item.slug === slug; })[0] || null, error: error.message };
                });
            });
        });
    }

    function listInstitutions(params) {
        params = params || {};
        return loadConfig().then(function (config) {
            var url = endpoint(config, "/api/institutions");
            if (!url || backendMode(config) !== "api") {
                return loadStaticJson("assets/data/institutions.json", []).then(function (items) {
                    var filtered = filterInstitutions(items, params);
                    return { mode: "static", items: filtered, total: filtered.length };
                });
            }
            return requestJson(url + queryString(params), { method: "GET" }, timeoutMs(config)).then(function (data) {
                return Object.assign({ mode: "api" }, data);
            }).catch(function (error) {
                reportApiFallback("GET /api/institutions", error);
                return loadStaticJson("assets/data/institutions.json", []).then(function (items) {
                    var filtered = filterInstitutions(items, params);
                    return { mode: "api_fallback_static", items: filtered, total: filtered.length, error: error.message };
                });
            });
        });
    }

    function searchSite(params) {
        params = params || {};
        return loadConfig().then(function (config) {
            var url = endpoint(config, "/api/search");
            if (!url || backendMode(config) !== "api") {
                return localSearch(params);
            }
            return requestJson(url + queryString(params), { method: "GET" }, timeoutMs(config)).then(function (data) {
                return Object.assign({ mode: "api" }, data);
            }).catch(function (error) {
                reportApiFallback("GET /api/search", error);
                return localSearch(params).then(function (data) {
                    data.mode = "api_fallback_static";
                    data.error = error.message;
                    return data;
                });
            });
        });
    }

    window.TFSEApi = {
        loadConfig: loadConfig,
        getStoredLeads: getStoredLeads,
        saveStoredLeads: saveStoredLeads,
        getStoredPublicFeedback: getStoredPublicFeedback,
        saveStoredPublicFeedback: saveStoredPublicFeedback,
        submitLead: submitLead,
        submitPublicFeedback: submitPublicFeedback,
        listLeads: listLeads,
        updateLeadStatus: updateLeadStatus,
        loginAdmin: loginAdmin,
        getAdminSession: getAdminSession,
        logoutAdmin: logoutAdmin,
        listProducts: listProducts,
        getProduct: getProduct,
        listArticles: listArticles,
        getArticle: getArticle,
        listInstitutions: listInstitutions,
        searchSite: searchSite
    };
})();
