(function () {
    "use strict";

    var boundForm = null;
    var SUBMIT_COOLDOWN_MS = 60000;
    var configPromise = null;
    var turnstileScriptPromise = null;
    var cooldownTimer = null;
    var leadDialogEscHandler = null;
    var phoneCountries = [
        ["TW", "台灣", "+886"], ["CN", "中國大陸", "+86"], ["HK", "香港", "+852"], ["MO", "澳門", "+853"],
        ["US", "美國", "+1"], ["CA", "加拿大", "+1"], ["GB", "英國", "+44"], ["AU", "澳洲", "+61"],
        ["NZ", "紐西蘭", "+64"], ["JP", "日本", "+81"], ["KR", "韓國", "+82"], ["SG", "新加坡", "+65"],
        ["MY", "馬來西亞", "+60"], ["TH", "泰國", "+66"], ["VN", "越南", "+84"], ["PH", "菲律賓", "+63"],
        ["ID", "印尼", "+62"], ["IN", "印度", "+91"], ["AE", "阿聯酋", "+971"], ["SA", "沙烏地阿拉伯", "+966"],
        ["DE", "德國", "+49"], ["FR", "法國", "+33"], ["IT", "義大利", "+39"], ["ES", "西班牙", "+34"],
        ["NL", "荷蘭", "+31"], ["BE", "比利時", "+32"], ["CH", "瑞士", "+41"], ["SE", "瑞典", "+46"],
        ["NO", "挪威", "+47"], ["DK", "丹麥", "+45"], ["FI", "芬蘭", "+358"], ["IE", "愛爾蘭", "+353"],
        ["PT", "葡萄牙", "+351"], ["AT", "奧地利", "+43"], ["PL", "波蘭", "+48"], ["CZ", "捷克", "+420"],
        ["TR", "土耳其", "+90"], ["RU", "俄羅斯", "+7"], ["BR", "巴西", "+55"], ["MX", "墨西哥", "+52"],
        ["AR", "阿根廷", "+54"], ["CL", "智利", "+56"], ["CO", "哥倫比亞", "+57"], ["PE", "秘魯", "+51"],
        ["ZA", "南非", "+27"], ["EG", "埃及", "+20"], ["NG", "奈及利亞", "+234"], ["KE", "肯亞", "+254"]
    ];
    var regionData = {
        "台灣": {
            "北部": ["台北市", "新北市", "基隆市", "桃園市", "新竹市", "新竹縣", "宜蘭縣"],
            "中部": ["台中市", "苗栗縣", "彰化縣", "南投縣", "雲林縣"],
            "南部": ["高雄市", "台南市", "嘉義市", "嘉義縣", "屏東縣"],
            "東部與離島": ["花蓮縣", "台東縣", "澎湖縣", "金門縣", "連江縣"]
        },
        "中國大陸": {
            "直轄市": ["北京市", "上海市", "天津市", "重慶市"],
            "華南": ["廣州市", "深圳市", "珠海市", "佛山市", "東莞市", "廈門市", "福州市"],
            "華東": ["杭州市", "南京市", "蘇州市", "寧波市", "合肥市", "青島市"],
            "華中與西部": ["武漢市", "長沙市", "成都市", "西安市", "昆明市", "鄭州市"]
        },
        "香港": { "香港": ["香港島", "九龍", "新界"] },
        "澳門": { "澳門": ["澳門半島", "氹仔", "路環"] },
        "美國": {
            "California": ["Los Angeles", "San Francisco", "San Jose", "San Diego", "Sacramento"],
            "New York": ["New York City", "Buffalo", "Rochester", "Albany"],
            "Texas": ["Houston", "Dallas", "Austin", "San Antonio"],
            "Washington": ["Seattle", "Bellevue", "Tacoma"],
            "Illinois": ["Chicago", "Springfield"]
        },
        "加拿大": {
            "British Columbia": ["Vancouver", "Richmond", "Burnaby", "Victoria"],
            "Ontario": ["Toronto", "Ottawa", "Mississauga", "Waterloo"],
            "Quebec": ["Montreal", "Quebec City", "Laval"],
            "Alberta": ["Calgary", "Edmonton"]
        },
        "英國": {
            "England": ["London", "Manchester", "Birmingham", "Liverpool", "Leeds"],
            "Scotland": ["Edinburgh", "Glasgow", "Aberdeen"],
            "Wales": ["Cardiff", "Swansea"],
            "Northern Ireland": ["Belfast"]
        },
        "澳洲": {
            "New South Wales": ["Sydney", "Newcastle", "Wollongong"],
            "Victoria": ["Melbourne", "Geelong"],
            "Queensland": ["Brisbane", "Gold Coast", "Cairns"],
            "Western Australia": ["Perth"]
        },
        "日本": {
            "關東": ["東京", "橫濱", "川崎", "埼玉", "千葉"],
            "關西": ["大阪", "京都", "神戶", "奈良"],
            "中部": ["名古屋", "靜岡", "金澤"],
            "九州與北海道": ["福岡", "熊本", "札幌"]
        },
        "韓國": { "首都圈": ["首爾", "仁川", "水原"], "其他": ["釜山", "大邱", "大田", "光州", "濟州"] },
        "新加坡": { "Singapore": ["Singapore"] },
        "馬來西亞": { "西馬": ["Kuala Lumpur", "Petaling Jaya", "Johor Bahru", "Penang"], "東馬": ["Kota Kinabalu", "Kuching"] },
        "泰國": { "Thailand": ["Bangkok", "Chiang Mai", "Phuket", "Pattaya"] },
        "越南": { "Vietnam": ["Ho Chi Minh City", "Hanoi", "Da Nang", "Can Tho"] },
        "菲律賓": { "Philippines": ["Manila", "Quezon City", "Cebu City", "Davao City"] },
        "德國": { "Germany": ["Berlin", "Munich", "Frankfurt", "Hamburg", "Cologne"] },
        "法國": { "France": ["Paris", "Lyon", "Marseille", "Toulouse", "Nice"] },
        "義大利": { "Italy": ["Rome", "Milan", "Florence", "Naples", "Turin"] },
        "西班牙": { "Spain": ["Madrid", "Barcelona", "Valencia", "Seville"] },
        "荷蘭": { "Netherlands": ["Amsterdam", "Rotterdam", "The Hague", "Utrecht"] },
        "巴西": { "Brazil": ["Sao Paulo", "Rio de Janeiro", "Brasilia", "Curitiba"] },
        "墨西哥": { "Mexico": ["Mexico City", "Guadalajara", "Monterrey", "Puebla"] },
        "其他國家 / 地區": { "自定義": ["自定義城市 / 地區"] }
    };

    function getQueryValue(name) {
        var params = new URLSearchParams(window.location.search);
        return params.get(name) || "";
    }

    function getStoredLeads() {
        if (window.TFSEApi && window.TFSEApi.getStoredLeads) return window.TFSEApi.getStoredLeads();
        try {
            return JSON.parse(localStorage.getItem("tfse_leads") || "[]");
        } catch (error) {
            return [];
        }
    }

    function saveStoredLeads(leads) {
        if (window.TFSEApi && window.TFSEApi.saveStoredLeads) {
            window.TFSEApi.saveStoredLeads(leads);
            return;
        }
        try {
            localStorage.setItem("tfse_leads", JSON.stringify(leads));
        } catch (error) {
            // localStorage can be unavailable in private browsing or file contexts.
        }
    }

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

    function lineConfig(config) {
        var line = (config && config.line) || {};
        var url = line.oa_url || "free-check.html#line-cta";
        return {
            url: url,
            label: line.label || "Line 官方帳號承接說明",
            external: /^https?:\/\//i.test(url)
        };
    }

    function turnstileConfig(config) {
        var security = (config && config.security) || {};
        var turnstile = security.turnstile || {};
        return {
            enabled: !!turnstile.enabled && !!turnstile.site_key,
            siteKey: turnstile.site_key || ""
        };
    }

    function loadTurnstileScript() {
        if (window.turnstile) return Promise.resolve(window.turnstile);
        if (turnstileScriptPromise) return turnstileScriptPromise;
        turnstileScriptPromise = new Promise(function (resolve, reject) {
            var existing = document.querySelector("script[data-tfse-turnstile]");
            if (existing) {
                existing.addEventListener("load", function () { resolve(window.turnstile); });
                existing.addEventListener("error", reject);
                return;
            }
            var script = document.createElement("script");
            script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
            script.async = true;
            script.defer = true;
            script.setAttribute("data-tfse-turnstile", "true");
            script.onload = function () { resolve(window.turnstile); };
            script.onerror = reject;
            document.head.appendChild(script);
        });
        return turnstileScriptPromise;
    }

    function setupTurnstile(form, message) {
        var field = form.querySelector("[data-turnstile-field]");
        if (!field) return;
        loadConfig().then(function (config) {
            var options = turnstileConfig(config);
            if (!options.enabled) return;
            field.hidden = false;
            field.innerHTML = "<p class=\"mb-2\">安全驗證載入中。</p><div data-turnstile-widget></div>";
            return loadTurnstileScript().then(function (turnstile) {
                var widget = field.querySelector("[data-turnstile-widget]");
                if (!turnstile || !widget || widget.getAttribute("data-widget-id")) return;
                var widgetId = turnstile.render(widget, {
                    sitekey: options.siteKey,
                    callback: function (token) {
                        if (form.elements.cf_turnstile_response) form.elements.cf_turnstile_response.value = token;
                    },
                    "expired-callback": function () {
                        if (form.elements.cf_turnstile_response) form.elements.cf_turnstile_response.value = "";
                    },
                    "error-callback": function () {
                        if (form.elements.cf_turnstile_response) form.elements.cf_turnstile_response.value = "";
                    }
                });
                widget.setAttribute("data-widget-id", widgetId);
            });
        }).catch(function (error) {
            if (window.TFSEReportError) window.TFSEReportError("turnstile_load_failed", error && error.message ? error.message : error, {});
            setMessage(message, "安全驗證暫時無法載入，請稍後再試。", "error");
        });
    }

    function resetTurnstile(form) {
        var widget = form.querySelector("[data-turnstile-widget]");
        var widgetId = widget ? widget.getAttribute("data-widget-id") : "";
        if (window.turnstile && widgetId) window.turnstile.reset(widgetId);
        if (form.elements.cf_turnstile_response) form.elements.cf_turnstile_response.value = "";
    }

    function requireTurnstileToken(form) {
        return loadConfig().then(function (config) {
            var options = turnstileConfig(config);
            if (!options.enabled) return true;
            return !!(form.elements.cf_turnstile_response && form.elements.cf_turnstile_response.value);
        });
    }

    function getLastSubmittedAt() {
        return Number(localStorage.getItem("tfse_last_lead_submit_at") || "0");
    }

    function setLastSubmittedAt(value) {
        try {
            localStorage.setItem("tfse_last_lead_submit_at", String(value));
        } catch (error) {
            // localStorage can be unavailable in private browsing or file contexts.
        }
    }

    function makeId() {
        return "lead_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
    }

    function getDeviceId() {
        var key = "tfse_device_id";
        try {
            var existing = localStorage.getItem(key);
            if (existing) return existing;
            var randomPart = "";
            if (window.crypto && window.crypto.getRandomValues) {
                var bytes = new Uint32Array(2);
                window.crypto.getRandomValues(bytes);
                randomPart = bytes[0].toString(36) + bytes[1].toString(36);
            } else {
                randomPart = Math.random().toString(36).slice(2);
            }
            var deviceId = "device_" + Date.now().toString(36) + "_" + randomPart.slice(0, 16);
            localStorage.setItem(key, deviceId);
            return deviceId;
        } catch (error) {
            return "device_session_" + Date.now().toString(36);
        }
    }

    function addTag(tags, tag) {
        if (tags.indexOf(tag) === -1) tags.push(tag);
    }

    function inferTags(needs, occupation, form) {
        var text = (needs + " " + occupation).toLowerCase();
        var tags = ["form_submitted"];
        var source = (getQueryValue("utm_source") || "").toLowerCase();
        var medium = (getQueryValue("utm_medium") || "").toLowerCase();

        if (text.indexOf("房") !== -1 || text.indexOf("屋主") !== -1 || text.indexOf("有房") !== -1) addTag(tags, "need_mortgage");
        if (text.indexOf("信") !== -1 || text.indexOf("企業") !== -1) addTag(tags, "need_credit_loan");
        if (text.indexOf("車") !== -1 || text.indexOf("汽機車") !== -1) addTag(tags, "need_vehicle");
        if (text.indexOf("分期") !== -1 || text.indexOf(" installment") !== -1) addTag(tags, "need_installment");
        if (text.indexOf("債") !== -1 || text.indexOf("協商") !== -1 || text.indexOf("負債") !== -1) addTag(tags, "need_debt_law");
        if (text.indexOf("儲") !== -1) addTag(tags, "need_credit_union");
        if (text.indexOf("企業主") !== -1 || text.indexOf("自營") !== -1) addTag(tags, "segment_business_owner");
        if (text.indexOf("上班") !== -1 || text.indexOf("薪轉") !== -1) addTag(tags, "segment_employee");
        if (text.indexOf("屋主") !== -1 || text.indexOf("有房") !== -1 || text.indexOf("二胎") !== -1) addTag(tags, "segment_property_owner");
        if (text.indexOf("負債") !== -1 || text.indexOf("協商") !== -1 || text.indexOf("整合") !== -1) addTag(tags, "segment_high_debt");

        if (source.indexOf("facebook") !== -1 || source === "fb" || medium.indexOf("facebook") !== -1) addTag(tags, "source_fb");
        if (source.indexOf("instagram") !== -1 || source === "ig" || medium.indexOf("instagram") !== -1) addTag(tags, "source_ig");
        if (source.indexOf("tiktok") !== -1 || medium.indexOf("tiktok") !== -1) addTag(tags, "source_tiktok");
        if (source.indexOf("google") !== -1 || source === "seo" || medium === "organic") addTag(tags, "source_seo");
        if (form && form.elements.consent_line && form.elements.consent_line.checked) addTag(tags, "line_opt_in");

        return tags;
    }

    function setHiddenUtmFields(form) {
        ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach(function (name) {
            if (form.elements[name]) form.elements[name].value = getQueryValue(name);
        });
    }

    function setMessage(message, html, type) {
        if (!message) return;
        message.classList.remove("success", "error");
        if (type) message.classList.add(type);
        message.innerHTML = html;
        message.hidden = !html;
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function escapeAttr(value) {
        return escapeHtml(value).replace(/`/g, "&#096;");
    }

    function normalizeInternationalPhone(form) {
        var codeField = form && form.elements.phone_country_code;
        var customCodeField = form && form.querySelector("[data-phone-code-custom]");
        var localField = form && form.elements.phone_local;
        var selectedOption = codeField && codeField.options ? codeField.options[codeField.selectedIndex] : null;
        var code = selectedOption ? selectedOption.getAttribute("data-code") : "";
        if (!code && codeField && /^\+\d+/.test(codeField.value || "")) code = codeField.value;
        if (code === "__custom") code = customCodeField ? customCodeField.value.trim() : "";
        var local = localField ? localField.value : "";
        var localDigits = String(local || "").replace(/\D/g, "");
        if (!code || !localDigits) return "";
        code = "+" + String(code).replace(/\D/g, "");
        return code + localDigits;
    }

    function internationalPhoneError(form) {
        var codeField = form && form.elements.phone_country_code;
        var customCodeField = form && form.querySelector("[data-phone-code-custom]");
        var localField = form && form.elements.phone_local;
        var phone = normalizeInternationalPhone(form);
        var localDigits = localField ? String(localField.value || "").replace(/\D/g, "") : "";
        if (!phone) return "請先選擇國碼並填寫手機號碼。";
        if (codeField && codeField.value === "__custom" && customCodeField && !/^\+\d{1,4}$/.test(customCodeField.value.trim())) return "自定義國碼需使用 + 開頭，例如 +358。";
        if (localDigits.length < 5 || localDigits.length > 15) return "手機號碼長度需為 5 到 15 位數字，請確認國碼與號碼。";
        if (/^(\d)\1{4,}$/.test(localDigits)) return "手機號碼看起來不是真實號碼，請確認後再送出。";
        return "";
    }

    function validatePhoneField(form, message) {
        var field = form && form.elements.phone_local;
        var hidden = form && form.elements.phone;
        if (!field) return true;
        var error = internationalPhoneError(form);
        field.setCustomValidity(error);
        if (error) {
            setMessage(message, error, "error");
            field.reportValidity();
            field.focus();
            return false;
        }
        if (hidden) hidden.value = normalizeInternationalPhone(form);
        return true;
    }

    function addOption(select, value, label) {
        var option = document.createElement("option");
        option.value = value;
        option.textContent = label || value;
        select.appendChild(option);
    }

    function resetSelect(select, label) {
        if (!select) return;
        select.innerHTML = "";
        addOption(select, "", label);
    }

    function setupPhonePicker(form) {
        var country = form.querySelector("[data-phone-country]");
        var customCode = form.querySelector("[data-phone-code-custom]");
        var local = form.querySelector("[data-phone-local]");
        var hidden = form.elements.phone;
        if (!country || country.getAttribute("data-tfse-ready") === "true") return;
        country.setAttribute("data-tfse-ready", "true");
        country.innerHTML = "";
        phoneCountries.forEach(function (item) {
            addOption(country, item[1], item[1] + " " + item[2]);
            country.options[country.options.length - 1].setAttribute("data-code", item[2]);
        });
        addOption(country, "__custom", "其他國碼，自定義");
        country.options[country.options.length - 1].setAttribute("data-code", "__custom");
        country.value = "台灣";
        var sync = function () {
            if (customCode) {
                customCode.hidden = country.value !== "__custom";
                customCode.required = country.value === "__custom";
                if (country.value !== "__custom") customCode.value = "";
            }
            if (hidden) hidden.value = normalizeInternationalPhone(form);
            if (local) local.setCustomValidity("");
            syncRegionCountryFromPhone(form, true);
        };
        country.addEventListener("change", sync);
        if (customCode) customCode.addEventListener("input", sync);
        if (local) local.addEventListener("input", sync);
        sync();
    }

    function choiceValue(form, name) {
        var select = form && form.querySelector("[data-custom-select=\"" + name + "\"]");
        var custom = form && form.querySelector("[data-custom-input=\"" + name + "\"]");
        if (!select) return form && form.elements[name] ? form.elements[name].value : "";
        if (select.value === "__custom") return custom ? custom.value.trim() : "";
        return select.value;
    }

    function setupCustomSelects(form) {
        Array.prototype.slice.call(form.querySelectorAll("[data-custom-select]")).forEach(function (select) {
            var name = select.getAttribute("data-custom-select");
            var custom = form.querySelector("[data-custom-input=\"" + name + "\"]");
            if (!custom || select.getAttribute("data-tfse-ready") === "true") return;
            select.setAttribute("data-tfse-ready", "true");
            var sync = function () {
                var isCustom = select.value === "__custom";
                custom.hidden = !isCustom;
                custom.required = isCustom && select.required;
                if (!isCustom) custom.value = "";
            };
            select.addEventListener("change", sync);
            sync();
        });
    }

    function selectedText(select) {
        if (!select || !select.value) return "";
        return select.options[select.selectedIndex] ? select.options[select.selectedIndex].textContent : select.value;
    }

    function syncRegionValue(form) {
        var country = form.querySelector("[data-region-country]");
        var state = form.querySelector("[data-region-state]");
        var city = form.querySelector("[data-region-city]");
        var custom = form.querySelector("[data-region-custom]");
        var hidden = form.elements.region;
        var parts = [selectedText(country), selectedText(state), selectedText(city)].filter(function (value) {
            return value && value.indexOf("選擇") === -1 && value.indexOf("先選") === -1 && value.indexOf("自定義") === -1;
        });
        if (custom && !custom.hidden && custom.value.trim()) parts.push(custom.value.trim());
        if (hidden) hidden.value = parts.join(" / ");
    }

    function setupRegionPicker(form) {
        var country = form.querySelector("[data-region-country]");
        var state = form.querySelector("[data-region-state]");
        var city = form.querySelector("[data-region-city]");
        var custom = form.querySelector("[data-region-custom]");
        if (!country || country.getAttribute("data-tfse-ready") === "true") return;
        country.setAttribute("data-tfse-ready", "true");
        resetSelect(country, "選擇國家 / 地區");
        phoneCountries.forEach(function (item) {
            if (!regionData[item[1]]) regionData[item[1]] = null;
        });
        Object.keys(regionData).forEach(function (name) { addOption(country, name, name); });
        addOption(country, "__custom", "其他國家 / 地區，自定義");
        resetSelect(state, "先選國家");
        resetSelect(city, "先選州省");

        country.addEventListener("change", function () {
            var data = regionData[country.value] || null;
            var stateNames = data ? Object.keys(data) : [];
            resetSelect(state, stateNames.length ? "選擇州省 / 行政區" : "自定義州省 / 行政區");
            resetSelect(city, "先選州省");
            state.disabled = !stateNames.length;
            city.disabled = true;
            custom.hidden = country.value !== "__custom" && !!stateNames.length;
            custom.required = country.value === "__custom" || (!!country.value && !stateNames.length);
            stateNames.forEach(function (name) { addOption(state, name, name); });
            addOption(state, "__custom", "自定義州省 / 行政區");
            syncRegionValue(form);
        });

        state.addEventListener("change", function () {
            var data = regionData[country.value] || {};
            var cityNames = data[state.value] || [];
            resetSelect(city, cityNames.length ? "選擇城市" : "自定義城市");
            city.disabled = !cityNames.length;
            custom.hidden = state.value !== "__custom" && !!cityNames.length;
            custom.required = state.value === "__custom";
            cityNames.forEach(function (name) { addOption(city, name, name); });
            addOption(city, "__custom", "自定義城市 / 地區");
            syncRegionValue(form);
        });

        city.addEventListener("change", function () {
            custom.hidden = city.value !== "__custom";
            custom.required = city.value === "__custom";
            syncRegionValue(form);
        });
        if (custom) custom.addEventListener("input", function () { syncRegionValue(form); });
        syncRegionValue(form);
    }

    function syncRegionCountryFromPhone(form, force) {
        var phoneCountry = form.querySelector("[data-phone-country]");
        var regionCountry = form.querySelector("[data-region-country]");
        if (!phoneCountry || !regionCountry || !phoneCountry.value) return;
        if (phoneCountry.value === "__custom") {
            regionCountry.value = "__custom";
            regionCountry.dispatchEvent(new Event("change", { bubbles: true }));
            return;
        }
        if (!force && regionCountry.value && regionCountry.value !== phoneCountry.value) return;
        if (!Array.prototype.some.call(regionCountry.options, function (option) { return option.value === phoneCountry.value; })) return;
        regionCountry.value = phoneCountry.value;
        regionCountry.dispatchEvent(new Event("change", { bubbles: true }));
    }

    function setupChoiceControls(form) {
        setupRegionPicker(form);
        setupPhonePicker(form);
        setupCustomSelects(form);
        syncRegionCountryFromPhone(form, true);
    }

    function resetChoiceControls(form) {
        var country = form.querySelector("[data-region-country]");
        var state = form.querySelector("[data-region-state]");
        var city = form.querySelector("[data-region-city]");
        var regionCustom = form.querySelector("[data-region-custom]");
        var phoneCountry = form.querySelector("[data-phone-country]");
        var phoneCustomCode = form.querySelector("[data-phone-code-custom]");
        if (phoneCountry) phoneCountry.value = "台灣";
        if (phoneCustomCode) {
            phoneCustomCode.value = "";
            phoneCustomCode.hidden = true;
            phoneCustomCode.required = false;
        }
        if (form.elements.phone) form.elements.phone.value = "";
        if (country) country.value = "";
        resetSelect(state, "先選國家");
        resetSelect(city, "先選州省");
        if (state) state.disabled = true;
        if (city) city.disabled = true;
        if (regionCustom) {
            regionCustom.value = "";
            regionCustom.hidden = true;
            regionCustom.required = false;
        }
        Array.prototype.slice.call(form.querySelectorAll("[data-custom-select]")).forEach(function (select) {
            var custom = form.querySelector("[data-custom-input=\"" + select.getAttribute("data-custom-select") + "\"]");
            if (!custom) return;
            custom.value = "";
            custom.hidden = true;
            custom.required = false;
        });
        syncRegionValue(form);
    }

    function closeLeadDialog() {
        var dialog = document.querySelector("[data-lead-dialog]");
        if (dialog) dialog.remove();
        if (leadDialogEscHandler) {
            document.removeEventListener("keydown", leadDialogEscHandler);
            leadDialogEscHandler = null;
        }
        document.body.classList.remove("tfse-dialog-open");
    }

    function showLeadDialog(options) {
        options = options || {};
        closeLeadDialog();
        var overlay = document.createElement("div");
        overlay.className = "tfse-lead-dialog";
        overlay.setAttribute("data-lead-dialog", "");
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-labelledby", "tfseLeadDialogTitle");
        overlay.innerHTML = [
            "<div class=\"tfse-lead-dialog__panel\">",
                "<button type=\"button\" class=\"tfse-lead-dialog__close\" data-lead-dialog-close aria-label=\"關閉提示\"><i class=\"fa fa-times\" aria-hidden=\"true\"></i></button>",
                "<div class=\"tfse-lead-dialog__icon\"><i class=\"fa fa-check\" aria-hidden=\"true\"></i></div>",
                "<h3 id=\"tfseLeadDialogTitle\">" + escapeHtml(options.title || "已收到您的免費財務健檢查詢需求") + "</h3>",
                "<div class=\"tfse-lead-dialog__body\">" + (options.body || "") + "</div>",
                "<div class=\"tfse-lead-dialog__actions\">" + (options.actions || "") + "<button type=\"button\" class=\"tfse-dialog-secondary\" data-lead-dialog-close>我知道了</button></div>",
            "</div>"
        ].join("");
        overlay.addEventListener("click", function (event) {
            if (event.target === overlay || event.target.closest("[data-lead-dialog-close]")) closeLeadDialog();
        });
        leadDialogEscHandler = function (event) {
            if (event.key !== "Escape") return;
            closeLeadDialog();
        };
        document.addEventListener("keydown", leadDialogEscHandler);
        document.body.appendChild(overlay);
        document.body.classList.add("tfse-dialog-open");
        var closeButton = overlay.querySelector("[data-lead-dialog-close]");
        if (closeButton) closeButton.focus();
    }

    function submitButton(form) {
        return form ? form.querySelector("[data-lead-submit]") : null;
    }

    function setSubmitState(form, disabled, html) {
        var button = submitButton(form);
        if (!button) return;
        if (!button.getAttribute("data-default-label")) {
            button.setAttribute("data-default-label", button.innerHTML);
        }
        button.disabled = !!disabled;
        button.classList.toggle("is-loading", !!disabled);
        button.innerHTML = html || button.getAttribute("data-default-label") || "送出免費財務健檢查詢需求";
    }

    function countdownText(ms) {
        return Math.max(0, Math.ceil(ms / 1000));
    }

    function clearCooldownTimer() {
        if (cooldownTimer) window.clearInterval(cooldownTimer);
        cooldownTimer = null;
    }

    function renderCooldown(form, message, baseHtml, type, submittedAt, options) {
        options = options || {};
        var remaining = SUBMIT_COOLDOWN_MS - (Date.now() - submittedAt);
        if (remaining <= 0) {
            clearCooldownTimer();
            setSubmitState(form, false);
            if (baseHtml && !options.silentInline) setMessage(message, baseHtml + "<div class=\"tfse-lead-countdown is-ready\"><strong>可再次提交</strong><span>若要補充另一筆需求，現在可以送出。</span></div>", type);
            if (options.silentInline) setMessage(message, "", "");
            return;
        }
        var seconds = countdownText(remaining);
        setSubmitState(form, true, "<span class=\"tfse-btn-spinner\"></span> " + seconds + " 秒後可再次提交");
        if (!options.silentInline) {
            setMessage(message, (baseHtml || "系統已收到您的需求。") + "<div class=\"tfse-lead-countdown\"><strong>" + seconds + "</strong><span>秒後可再次提交，避免重複送件。</span></div>", type || "success");
        } else {
            setMessage(message, "", "");
        }
    }

    function startCooldown(form, message, baseHtml, type, submittedAt, options) {
        clearCooldownTimer();
        renderCooldown(form, message, baseHtml, type, submittedAt, options);
        cooldownTimer = window.setInterval(function () {
            renderCooldown(form, message, baseHtml, type, submittedAt, options);
        }, 1000);
    }

    function findRecentDuplicate(leads, phone, needs) {
        var normalizedPhone = String(phone || "").replace(/\D/g, "");
        var normalizedNeeds = String(needs || "").trim();
        var oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        return leads.some(function (lead) {
            var leadPhone = String(lead.phone || "").replace(/\D/g, "");
            var leadTime = Date.parse(lead.submitted_at || "") || 0;
            return leadPhone && leadPhone === normalizedPhone && String(lead.needs || "").trim() === normalizedNeeds && leadTime > oneDayAgo;
        });
    }

    function recommendFromTags(tags) {
        var categoryMap = [
            { tag: "need_mortgage", title: "房貸與二胎資訊整理", href: "category.html?slug=mortgage" },
            { tag: "need_credit_loan", title: "銀行金融商品專區", href: "category.html?slug=credit-loan" },
            { tag: "need_vehicle", title: "合法融資公司方案專區", href: "category.html?slug=vehicle-finance" },
            { tag: "need_installment", title: "分期付款資訊專區", href: "category.html?slug=installment" },
            { tag: "need_debt_law", title: "債務法令與前置協商資訊", href: "category.html?slug=debt-law" },
            { tag: "need_credit_union", title: "儲蓄互助社優惠資訊專區", href: "category.html?slug=credit-union" }
        ];
        var articleMap = [
            { tag: "need_mortgage", title: "房貸轉貸、增貸與二胎資訊查詢重點", href: "articles/mortgage-refinance-second-mortgage.html" },
            { tag: "need_credit_loan", title: "申請信貸前，先看懂負債比與信用紀錄", href: "articles/credit-score-debt-ratio-check.html" },
            { tag: "need_vehicle", title: "汽機車融資查詢前，先確認費用與合約條款", href: "articles/vehicle-finance-contract-check.html" },
            { tag: "need_installment", title: "車輛分期資訊查詢前要注意什麼", href: "articles/vehicle-installment-before-check.html" },
            { tag: "need_debt_law", title: "前置協商是什麼？債務法令資訊查詢方向", href: "articles/debt-negotiation-public-resources.html" },
            { tag: "need_credit_union", title: "儲蓄互助社是什麼？會員制度與查詢方向", href: "articles/credit-union-member-guide.html" }
        ];
        var categories = categoryMap.filter(function (item) { return tags.indexOf(item.tag) !== -1; });
        var articles = articleMap.filter(function (item) { return tags.indexOf(item.tag) !== -1; });

        if (!categories.length) categories = categoryMap.slice(0, 2);
        if (!articles.length) articles = articleMap.slice(0, 2);

        return {
            categories: categories.slice(0, 3),
            articles: articles.slice(0, 3)
        };
    }

    function renderLinks(items) {
        return items.map(function (item) {
            return "<a href=\"" + escapeAttr(item.href) + "\">" + escapeHtml(item.title) + "</a>";
        }).join("、");
    }

    function renderLineCta(line) {
        var target = line.external ? " target=\"_blank\" rel=\"noopener\"" : "";
        return "<a data-line-cta=\"lead-success\" class=\"btn btn-primary btn-hover-secondary mt-3\" href=\"" + escapeAttr(line.url) + "\"" + target + ">" + escapeHtml(line.label) + "</a>";
    }

    function bindLeadForm() {
        var form = document.getElementById("contact-form");
        if (!form || form === boundForm) return;
        boundForm = form;

        if (window.jQuery) {
            window.jQuery(form).off("submit");
        }
        setHiddenUtmFields(form);
        setupChoiceControls(form);
        setupTurnstile(form, document.querySelector(".form-messege"));
        if (form.elements.phone_local) {
            form.elements.phone_local.addEventListener("input", function () {
                form.elements.phone_local.setCustomValidity("");
            });
            form.elements.phone_local.addEventListener("blur", function () {
                if (!form.elements.phone_local.value.trim()) return;
                var error = internationalPhoneError(form);
                form.elements.phone_local.setCustomValidity(error);
            });
            form.elements.phone_local.addEventListener("invalid", function () {
                var message = document.querySelector(".form-messege");
                setMessage(message, form.elements.phone_local.validationMessage || "請填寫有效的手機號碼。", "error");
            });
        }
        var initialRemaining = SUBMIT_COOLDOWN_MS - (Date.now() - getLastSubmittedAt());
        if (initialRemaining > 0) {
            startCooldown(form, document.querySelector(".form-messege"), "剛剛已送出一筆需求，請稍後再試。", "success", getLastSubmittedAt());
        }

        form.addEventListener("submit", function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        var message = document.querySelector(".form-messege");
        clearCooldownTimer();
        setHiddenUtmFields(form);

        if (!validatePhoneField(form, message)) {
            setSubmitState(form, false);
            return;
        }

        if (!form.checkValidity()) {
            setSubmitState(form, false);
            form.reportValidity();
            setMessage(message, "請先完成必填欄位與隱私權同意。TFSE 僅收低敏需求資料，請勿填寫證件、帳戶、卡號或密碼。", "error");
            return;
        }

        if (form.elements.website && form.elements.website.value) {
            setSubmitState(form, false);
            setMessage(message, "系統已擋下疑似自動提交。若您是一般使用者，請重新整理後再送出。", "error");
            return;
        }

        var now = Date.now();
        var remaining = SUBMIT_COOLDOWN_MS - (now - getLastSubmittedAt());
        if (remaining > 0) {
            startCooldown(form, message, "為保護個資與避免重複提交，請稍後再試。", "error", getLastSubmittedAt());
            return;
        }
        setSubmitState(form, true, "<span class=\"tfse-btn-spinner\"></span> 正在送出並保存資料");
        setMessage(message, "<strong>正在送出...</strong><br>系統正在保存您的免費財務健檢查詢需求，請不要重複點擊。", "success");

        requireTurnstileToken(form).then(function (hasTurnstileToken) {
        if (!hasTurnstileToken) {
            setSubmitState(form, false);
            setMessage(message, "請先完成安全驗證後再送出。", "error");
            return;
        }

        syncRegionValue(form);
        var needs = choiceValue(form, "needs") || choiceValue(form, "message");
        var occupationType = choiceValue(form, "occupation_type");
        var incomeType = choiceValue(form, "income_type");
        var messageValue = choiceValue(form, "message");
        var tags = inferTags(needs, occupationType, form);
        var recommendations = recommendFromTags(tags);
        var leads = getStoredLeads();

        if (findRecentDuplicate(leads, form.elements.phone ? form.elements.phone.value : "", needs)) {
            setSubmitState(form, false);
            setMessage(message, "", "");
            showLeadDialog({
                title: "已收到相同需求",
                body: "<p>系統已收到 24 小時內相同手機與需求的提交內容，將以既有需求為準，避免重複聯繫。</p>",
                actions: "<a href=\"free-check.html#line-cta\" class=\"tfse-dialog-primary\">Line 官方帳號承接說明</a>"
            });
            return;
        }

        var payload = {
            id: makeId(),
            display_name: form.elements.display_name ? form.elements.display_name.value : (form.elements.name ? form.elements.name.value : ""),
            phone: form.elements.phone ? form.elements.phone.value : "",
            line_id: form.elements.line_id ? form.elements.line_id.value : (form.elements.email ? form.elements.email.value : ""),
            region: form.elements.region ? form.elements.region.value : "",
            needs: needs,
            occupation_type: occupationType,
            income_type: incomeType,
            message: messageValue,
            consent_privacy: !!(form.elements.consent_privacy && form.elements.consent_privacy.checked),
            consent_line: !!(form.elements.consent_line && form.elements.consent_line.checked),
            consent_version: "privacy-2026-06-27",
            source_channel: getQueryValue("utm_source") || "direct",
            source_url: form.elements.source_url && form.elements.source_url.value ? form.elements.source_url.value : window.location.href,
            utm_source: getQueryValue("utm_source"),
            utm_medium: getQueryValue("utm_medium"),
            utm_campaign: getQueryValue("utm_campaign"),
            utm_content: getQueryValue("utm_content"),
            utm_term: getQueryValue("utm_term"),
            device_id: getDeviceId(),
            cf_turnstile_response: form.elements.cf_turnstile_response ? form.elements.cf_turnstile_response.value : "",
            status: "new",
            tags: tags,
            recommended_categories: recommendations.categories.map(function (item) { return item.title; }),
            recommended_articles: recommendations.articles.map(function (item) { return item.title; }),
            notes: [],
            submitted_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        var submitPromise = window.TFSEApi && window.TFSEApi.submitLead ? window.TFSEApi.submitLead(payload) : Promise.resolve().then(function () {
            leads.unshift(payload);
            saveStoredLeads(leads);
            return { mode: "localStorage", lead: payload };
        });

        submitPromise.then(function (result) {
            setLastSubmittedAt(now);
            loadConfig().then(function (config) {
                var line = lineConfig(config);
                var successHtml = "<p><strong>您的免費財務健檢查詢需求已提交成功。</strong></p><p>TFSE 僅提供公開金融資訊整理與法令諮詢導引，不代辦貸款、不代收證件、不保證核貸。</p><p>推薦分類：" + renderLinks(recommendations.categories) + "</p><p>推薦文章：" + renderLinks(recommendations.articles) + "</p>";
                showLeadDialog({
                    title: "已提交成功",
                    body: successHtml,
                    actions: renderLineCta(line).replace("btn btn-primary btn-hover-secondary mt-3", "tfse-dialog-primary")
                });
                startCooldown(form, message, successHtml, "success", now, { silentInline: true });

                if (window.TFSETrack) {
                    window.TFSETrack("lead_submit", {
                        source: payload.utm_source || payload.source_channel,
                        mode: result && result.mode,
                        line_cta_url: line.url,
                        tags: payload.tags,
                        recommended_categories: payload.recommended_categories,
                        recommended_articles: payload.recommended_articles
                    });
                    window.TFSETrack("lead_line_cta_shown", {
                        source: payload.utm_source || payload.source_channel,
                        line_cta_url: line.url,
                        mode: result && result.mode
                    });
                }

                form.reset();
                resetChoiceControls(form);
                resetTurnstile(form);
            });
        }).catch(function (error) {
            setSubmitState(form, false);
            if (window.TFSEReportError) window.TFSEReportError("lead_submit_failed", error && error.message ? error.message : error, {});
            setMessage(message, "提交時發生錯誤，請稍後再試，或改由 Line 官方帳號承接說明聯繫。", "error");
        });
        }).catch(function (error) {
            setSubmitState(form, false);
            if (window.TFSEReportError) window.TFSEReportError("turnstile_check_failed", error && error.message ? error.message : error, {});
            setMessage(message, "安全驗證檢查失敗，請稍後再試。", "error");
        });
        }, true);
    }

    bindLeadForm();
    document.addEventListener("tfse:landing-rendered", bindLeadForm);
})();
