(function () {
    "use strict";

    var configPromise = null;
    var ga4Loaded = false;
    var metaPixelLoaded = false;
    var sentryLoaded = false;
    var consentKey = "tfse_tracking_consent";
    var sensitiveKeys = ["phone", "line_id", "message", "note", "notes", "display_name", "name", "email", "id_number", "bank_account", "card_number", "password"];

    function getEvents() {
        try {
            return JSON.parse(localStorage.getItem("tfse_events") || "[]");
        } catch (error) {
            return [];
        }
    }

    function saveEvents(events) {
        try {
            localStorage.setItem("tfse_events", JSON.stringify(events.slice(0, 500)));
        } catch (error) {
            // Ignore storage failures in private browsing or locked-down contexts.
        }
    }

    function getErrors() {
        try {
            return JSON.parse(localStorage.getItem("tfse_errors") || "[]");
        } catch (error) {
            return [];
        }
    }

    function saveErrors(errors) {
        try {
            localStorage.setItem("tfse_errors", JSON.stringify(errors.slice(0, 100)));
        } catch (error) {
            // Ignore storage failures in private browsing or locked-down contexts.
        }
    }

    function getTrackingConsent() {
        try {
            var raw = localStorage.getItem(consentKey);
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            return null;
        }
    }

    function saveTrackingConsent(value) {
        var record = {
            analytics: value === "granted",
            source: "tfse_privacy_banner",
            version: "tracking-consent-2026-06-27",
            updated_at: new Date().toISOString()
        };
        try {
            localStorage.setItem(consentKey, JSON.stringify(record));
        } catch (error) {
            // Consent storage can be unavailable in private browsing.
        }
        return record;
    }

    function hasAnalyticsConsent() {
        var record = getTrackingConsent();
        return !!(record && record.analytics);
    }

    function consentStatus() {
        var record = getTrackingConsent();
        if (!record) return "unset";
        return record.analytics ? "granted" : "declined";
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

    function analyticsConfig(config) {
        return (config && config.analytics) || {};
    }

    function shouldSample(sampleRate) {
        var rate = Number(sampleRate);
        if (!rate && rate !== 0) rate = 1;
        if (rate <= 0) return false;
        if (rate >= 1) return true;
        return Math.random() <= rate;
    }

    function scrub(value, depth) {
        if (depth > 4) return "[redacted-depth]";
        if (Array.isArray(value)) {
            return value.slice(0, 20).map(function (item) { return scrub(item, depth + 1); });
        }
        if (value && typeof value === "object") {
            var output = {};
            Object.keys(value).forEach(function (key) {
                var lower = key.toLowerCase();
                var matched = sensitiveKeys.some(function (sensitive) {
                    return lower.indexOf(sensitive) !== -1;
                });
                output[key] = matched ? "[redacted]" : scrub(value[key], depth + 1);
            });
            return output;
        }
        if (typeof value === "string") {
            return value
                .replace(/09\d{8}/g, "[redacted-phone]")
                .replace(/[A-Z][12]\d{8}/gi, "[redacted-id]")
                .slice(0, 500);
        }
        return value;
    }

    function injectScript(src, onload) {
        if (!src) return;
        var existing = document.querySelector("script[src=\"" + src + "\"]");
        if (existing) {
            if (onload) onload();
            return;
        }
        var script = document.createElement("script");
        script.async = true;
        script.src = src;
        if (onload) script.onload = onload;
        document.head.appendChild(script);
    }

    function normalizePath(pathname) {
        var path = String(pathname || "").split("?")[0].split("#")[0];
        path = path.replace(/\\/g, "/").replace(/^.*\/finance_webto\//, "/");
        if (!path || path === "/") return "index.html";
        return path.split("/").pop() ? path.replace(/^\//, "") : "index.html";
    }

    function activeMenuKey() {
        var path = normalizePath(window.location.pathname);
        var file = path.split("/").pop() || "index.html";
        var categoryAliases = [
            "work.html", "category.html", "mortgage.html", "credit-loan.html", "vehicle-finance.html",
            "installment.html", "credit-union.html", "debt-law.html", "insurance-finance.html", "anti-fraud.html"
        ];
        if (file === "index.html") return "index";
        if (file === "about.html") return "about";
        if (path.indexOf("database/") === 0 || path.indexOf("products/") === 0 || file === "database.html") return "database";
        if (categoryAliases.indexOf(file) !== -1) return "category";
        if (path.indexOf("articles/") === 0 || file === "articles.html") return "articles";
        if (path.indexOf("lp/") === 0 || file === "free-check.html") return "free-check";
        if (file === "admin.html") return "admin";
        return "";
    }

    function menuKeyFromHref(href) {
        var path = normalizePath(href || "");
        var file = path.split("/").pop() || "index.html";
        if (file === "index.html") return "index";
        if (file === "about.html") return "about";
        if (file === "database.html") return "database";
        if (file === "work.html") return "category";
        if (file === "articles.html") return "articles";
        if (file === "free-check.html") return "free-check";
        if (file === "admin.html") return "admin";
        return "";
    }

    function syncHeaderActiveState() {
        var current = activeMenuKey();
        Array.prototype.forEach.call(document.querySelectorAll(".site-main-menu > ul"), function (list) {
            Array.prototype.forEach.call(list.children, function (item) {
                if (!item.matches("li")) return;
                item.classList.remove("is-tfse-active");
                var directLink = item.querySelector(":scope > a");
                if (directLink) directLink.removeAttribute("aria-current");
                var key = directLink ? menuKeyFromHref(directLink.getAttribute("href")) : "";
                if (current && key === current) {
                    item.classList.add("is-tfse-active");
                    if (directLink) directLink.setAttribute("aria-current", "page");
                }
            });
        });
    }

    function normalizedMenuText(element) {
        return String((element && element.textContent) || "").replace(/\s+/g, "");
    }

    function stripMenuSubmenu(item) {
        Array.prototype.forEach.call(item.querySelectorAll(":scope > .sub-menu, :scope > .mega-menu, :scope > .menu-toggle"), function (node) {
            node.remove();
        });
        item.classList.remove("has-children", "open");
    }

    function simplifyNavigationMenus() {
        Array.prototype.forEach.call(document.querySelectorAll(".site-main-menu li, .site-mobile-menu li"), function (item) {
            var link = item.querySelector(":scope > a");
            var submenu = item.querySelector(":scope > .sub-menu, :scope > .mega-menu");
            if (!link || !submenu) return;
            var text = normalizedMenuText(link);
            if (text === "首頁" || text === "首页" || text === "金融知識" || text === "金融知识") {
                stripMenuSubmenu(item);
                return;
            }
            if (text === "金融分類" || text === "金融分类") {
                Array.prototype.forEach.call(submenu.querySelectorAll(":scope > li"), function (child) {
                    var childLink = child.querySelector("a");
                    var childText = normalizedMenuText(childLink);
                    var childPath = normalizePath(childLink ? childLink.getAttribute("href") : "");
                    if (childText === "金融分類" || childText === "金融分类" || childPath === "work.html") child.remove();
                });
                if (!submenu.querySelector("li")) stripMenuSubmenu(item);
            }
        });
    }

    function removeClosestSection(node) {
        var section = node && node.closest(".section");
        if (section && section.parentNode) section.parentNode.removeChild(section);
    }

    function pruneRedundantContentBlocks() {
        if (!document.body) return;
        if (document.body.classList.contains("tfse-final-home")) {
            Array.prototype.forEach.call(document.querySelectorAll(".testimonial-slider, .blog"), removeClosestSection);
            Array.prototype.forEach.call(document.querySelectorAll(".tfse-unique-entry"), removeClosestSection);
        }
        if (document.body.classList.contains("tfse-about-page")) {
            Array.prototype.forEach.call(document.querySelectorAll(".testimonial-slider"), removeClosestSection);
        }
        if (document.body.classList.contains("tfse-check-page")) {
            Array.prototype.forEach.call(document.querySelectorAll("[data-line-flow]"), removeClosestSection);
            var checkInfo = document.querySelector(".tfse-check-workbench .contact-Information");
            if (checkInfo && !checkInfo.querySelector(".contact-info.ct-info-two")) {
                checkInfo.innerHTML = [
                    '<div class="section-title-two">',
                    '<span class="sub-title">不代辦、不收證件、不保證核貸</span>',
                    '<h3 class="title">免費財務健檢查詢</h3>',
                    '</div>',
                    '<div class="contact-info ct-info-two" data-vivus-hover>',
                    '<div class="icon"><img class="svgInject" src="assets/images/svg/linea/linea-basic-elaboration-document-check.svg" alt="金融資訊查詢圖示"></div>',
                    '<div class="info"><h4 class="title">低敏資料</h4><span class="info-text">不收身分證字號、證件照片、存摺、銀行帳號或信用卡卡號。</span></div>',
                    '</div>',
                    '<div class="contact-info ct-info-two" data-vivus-hover>',
                    '<div class="icon"><img class="svgInject" src="assets/images/svg/linea/linea-basic-message-txt.svg" alt="金融資訊查詢圖示"></div>',
                    '<div class="info"><h4 class="title">Line 承接</h4><span class="info-text">提交後可加入 Line 官方帳號，接收公開資訊整理與法規導引。</span></div>',
                    '</div>',
                    '<div class="contact-info ct-info-two" data-vivus-hover>',
                    '<div class="icon"><img class="svgInject" src="assets/images/svg/linea/linea-basic-lock.svg" alt="金融資訊查詢圖示"></div>',
                    '<div class="info"><h4 class="title">合規聲明</h4><span class="info-text">TFSE 僅提供資訊整理，不是銀行、放款機構或貸款代辦。</span></div>',
                    '</div>'
                ].join("");
            }
        }
    }

    function normalizeFreeCheckCopy(value) {
        var traditionalFull = "免費財務健檢查詢";
        var simplifiedFull = "免费财务健检查询";
        var traditionalShort = new RegExp("免費財務" + "健檢(?!查詢)", "g");
        var simplifiedShort = new RegExp("免费财务" + "健检(?!查询)", "g");
        var traditionalLegacy = new RegExp("免費" + "健檢", "g");
        var simplifiedLegacy = new RegExp("免费" + "健检", "g");
        return String(value || "")
            .replace(traditionalShort, traditionalFull)
            .replace(simplifiedShort, simplifiedFull)
            .replace(traditionalLegacy, traditionalFull)
            .replace(simplifiedLegacy, simplifiedFull);
    }

    var textOriginals = typeof WeakMap !== "undefined" ? new WeakMap() : null;
    var attrOriginals = typeof WeakMap !== "undefined" ? new WeakMap() : null;
    var i18nApplying = false;
    var i18nObserver = null;
    var tradToSimpPhrases = {
        "TFSE金融便民中心": "TFSE金融便民中心",
        "首頁": "首页",
        "關於": "关于",
        "資料庫": "资料库",
        "金融分類": "金融分类",
        "金融知識": "金融知识",
        "免費財務健檢查詢": "免费财务健检查询",
        "金融便民首頁": "金融便民首页",
        "房貸資訊": "房贷资讯",
        "信貸與企業融資": "信贷与企业融资",
        "債務法令": "债务法令",
        "知識列表": "知识列表",
        "知識專欄": "知识专栏",
        "文章詳情": "文章详情",
        "開始免費財務健檢查詢": "开始免费财务健检查询",
        "查看資料庫": "查看资料库",
        "合法透明": "合法透明",
        "專業整合": "专业整合",
        "免費服務": "免费服务",
        "守護權益": "守护权益",
        "公開金融資訊": "公开金融信息",
        "金融資訊": "金融信息",
        "公開資訊": "公开信息",
        "財務": "财务",
        "法令": "法规",
        "諮詢": "咨询",
        "聯絡": "联系",
        "後台": "后台",
        "線索": "线索",
        "檢視": "查看",
        "匯出": "导出",
        "搜尋": "搜索",
        "篩選": "筛选",
        "機構": "机构",
        "狀態": "状态",
        "更新": "更新",
        "登入": "登录",
        "註冊": "注册",
        "隱私權": "隐私权",
        "條款": "条款",
        "來源": "来源",
        "風險": "风险",
        "提醒": "提醒",
        "送出": "提交",
        "稱呼": "称呼",
        "手機": "手机",
        "所在地區": "所在地区",
        "需求類型": "需求类型",
        "身份類型": "身份类型",
        "收入型態": "收入形态",
        "目前困擾": "目前困扰",
        "選填": "选填",
        "必填": "必填",
        "確定": "确定",
        "切換語言": "切换语言",
        "繁體中文": "繁体中文",
        "簡體中文": "简体中文",
        "搜尋房貸、信貸、車融、債務法令": "搜索房贷、信贷、车融、债务法规",
        "輸入關鍵字搜尋，按 ESC 關閉": "输入关键词搜索，按 ESC 关闭",
        "搜尋目前頁面": "搜索当前页面",
        "輸入關鍵字": "输入关键词",
        "目前頁面沒有找到": "当前页面没有找到",
        "找到": "找到",
        "筆相關內容": "条相关内容",
        "查看位置": "查看位置",
        "清除搜尋": "清除搜索",
        "直接在本頁搜尋內容": "直接在本页搜索内容",
        "送出免費財務健檢查詢需求": "提交免费财务健检查询需求",
        "提交免費財務健檢查詢需求": "提交免费财务健检查询需求",
        "我已閱讀並同意隱私權政策，了解 TFSE 僅作資訊整理與法規導引。": "我已阅读并同意隐私权政策，了解 TFSE 仅作信息整理与法规引导。",
        "我同意透過 Line 接收公開金融資訊與健檢結果提醒。": "我同意通过 Line 接收公开金融信息与健检结果提醒。",
        "請勿填寫身分證字號、帳戶、卡號、密碼或證件資料。": "请勿填写身份证字号、账户、卡号、密码或证件资料。",
        "所在地區": "所在地区",
        "其他地區，自行填寫": "其他地区，自行填写",
        "需求類型：房貸 / 信貸 / 車融 / 債務法令": "需求类型：房贷 / 信贷 / 车融 / 债务法规",
        "房貸資訊查詢": "房贷信息查询",
        "銀行信貸資訊查詢": "银行信贷信息查询",
        "汽機車融資資訊查詢": "汽机车融资信息查询",
        "債務協商與法令資訊": "债务协商与法规信息",
        "儲蓄互助社資訊查詢": "储蓄互助社信息查询",
        "融資公司分期資訊": "融资公司分期信息",
        "防詐與合約風險提醒": "防诈与合约风险提醒",
        "其他需求，自行填寫": "其他需求，自行填写",
        "身份類型：上班族 / 企業主 / 其他": "身份类型：上班族 / 企业主 / 其他",
        "企業主 / 自營商": "企业主 / 自营商",
        "接案工作者": "接案工作者",
        "軍公教 / 公務人員": "军公教 / 公务人员",
        "退休族": "退休族",
        "學生 / 家庭照顧者": "学生 / 家庭照顾者",
        "其他身份，自行填寫": "其他身份，自行填写",
        "收入型態：固定薪轉 / 接案 / 營業收入": "收入形态：固定薪转 / 接案 / 营业收入",
        "固定薪轉": "固定薪转",
        "現金收入": "现金收入",
        "接案收入": "接案收入",
        "營業收入": "营业收入",
        "租金 / 投資收入": "租金 / 投资收入",
        "退休金 / 補助": "退休金 / 补助",
        "暫無固定收入": "暂无固定收入",
        "其他收入型態，自行填寫": "其他收入形态，自行填写",
        "請": "请"
    };
    var tradToSimpChars = {
        "與":"与","專":"专","業":"业","資":"资","訊":"讯","庫":"库","關":"关","於":"于","類":"类","貸":"贷","聯":"联","絡":"络","後":"后","臺":"台","台":"台","選":"选","擇":"择","顯":"显","應":"应","對":"对","條":"条","體":"体","態":"态","點":"点","檢":"检","視":"视","據":"据","覽":"览","續":"续","護":"护","權":"权","益":"益","險":"险","識":"识","證":"证","號":"号","碼":"码","個":"个","隱":"隐","實":"实","說":"说","須":"须","務":"务","費":"费","錄":"录","儲":"储","蓄":"蓄","會":"会","構":"构","時":"时","間":"间","標":"标","籤":"签","啟":"启","動":"动","報":"报","歸":"归","屬":"属","審":"审","核":"核","復":"复","齡":"龄","師":"师","醫":"医","藥":"药","產":"产","營":"营","銷":"销","產":"产","頁":"页","項":"项","額":"额","預":"预","繳":"缴","匯":"汇","導":"导","點":"点","擊":"击","讀":"读","寫":"写","線":"线","佇":"伫","列":"列","儀":"仪","錶":"表","圓":"圆","圖":"图","標":"标","測":"测","試":"试","開":"开","閉":"闭","單":"单","雙":"双","優":"优","級":"级","處":"处","擾":"扰","轉":"转","灣":"湾","劃":"划","無":"无","爲":"为","為":"为","這":"这","並":"并","從":"从","將":"将","當":"当","雜":"杂","餘":"余","壓":"压","寬":"宽","併":"并","灣":"湾","顧":"顾","問":"问","閱":"阅","讀":"读"
    };
    var simpToTradPhrases = null;
    var simpToTradChars = null;

    function reverseMap(map) {
        var output = {};
        Object.keys(map).forEach(function (key) {
            output[map[key]] = key;
        });
        return output;
    }

    function convertByMap(value, phrases, chars) {
        var text = String(value || "");
        Object.keys(phrases).sort(function (a, b) { return b.length - a.length; }).forEach(function (key) {
            text = text.split(key).join(phrases[key]);
        });
        return text.replace(/[\u4e00-\u9fff]/g, function (char) {
            return chars[char] || char;
        });
    }

    function convertText(value, mode) {
        value = normalizeFreeCheckCopy(value);
        if (mode === "zh-CN") return convertByMap(value, tradToSimpPhrases, tradToSimpChars);
        if (!simpToTradPhrases) simpToTradPhrases = reverseMap(tradToSimpPhrases);
        if (!simpToTradChars) simpToTradChars = reverseMap(tradToSimpChars);
        return convertByMap(value, simpToTradPhrases, simpToTradChars);
    }

    function shouldSkipI18nNode(node) {
        var parent = node && node.parentElement;
        if (!parent) return true;
        if (parent.closest("[data-tfse-i18n-skip], script, style, code, pre, textarea")) return true;
        return !String(node.nodeValue || "").trim();
    }

    function applyI18nToTextNode(node, mode) {
        if (shouldSkipI18nNode(node)) return;
        if (textOriginals && !textOriginals.has(node)) textOriginals.set(node, normalizeFreeCheckCopy(node.nodeValue));
        var original = textOriginals ? textOriginals.get(node) : normalizeFreeCheckCopy(node.nodeValue);
        node.nodeValue = mode === "zh-TW" ? original : convertText(original, "zh-CN");
    }

    function applyI18nToElementAttrs(element, mode) {
        if (!element || element.closest("[data-tfse-i18n-skip], script, style, code, pre")) return;
        ["placeholder", "title", "aria-label", "alt", "value"].forEach(function (attr) {
            if (!element.hasAttribute(attr)) return;
            if (attr === "value" && !/^(button|submit|reset)$/i.test(element.getAttribute("type") || "")) return;
            var store = attrOriginals && attrOriginals.get(element);
            if (!store) {
                store = {};
                if (attrOriginals) attrOriginals.set(element, store);
            }
            if (!store[attr]) store[attr] = normalizeFreeCheckCopy(element.getAttribute(attr));
            element.setAttribute(attr, mode === "zh-TW" ? store[attr] : convertText(store[attr], "zh-CN"));
        });
    }

    function walkI18n(root, mode) {
        if (!root) return;
        i18nApplying = true;
        try {
            var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
            var textNode = walker.currentNode;
            while (textNode) {
                applyI18nToTextNode(textNode, mode);
                textNode = walker.nextNode();
            }
            if (root.nodeType === 1) applyI18nToElementAttrs(root, mode);
            Array.prototype.forEach.call((root.nodeType === 1 ? root : document).querySelectorAll ? (root.nodeType === 1 ? root : document).querySelectorAll("[placeholder], [title], [aria-label], img[alt], input[type='button'], input[type='submit'], input[type='reset']") : [], function (element) {
                applyI18nToElementAttrs(element, mode);
            });
            document.documentElement.lang = mode === "zh-CN" ? "zh-Hans-CN" : "zh-Hant-TW";
            document.title = mode === "zh-CN" ? convertText(document.title, "zh-CN") : convertText(document.title, "zh-TW");
        } finally {
            i18nApplying = false;
        }
    }

    function currentLanguageMode() {
        try {
            return localStorage.getItem("tfse_language_mode") || "zh-TW";
        } catch (error) {
            return "zh-TW";
        }
    }

    function setLanguageMode(mode) {
        try {
            localStorage.setItem("tfse_language_mode", mode);
        } catch (error) {
            // Storage may be unavailable; keep the visual state for this page.
        }
        document.documentElement.setAttribute("data-tfse-lang", mode);
        walkI18n(document.body, mode);
        syncLanguageButtons(mode);
    }

    function syncLanguageButtons(mode) {
        Array.prototype.forEach.call(document.querySelectorAll("[data-tfse-lang-toggle]"), function (button) {
            button.setAttribute("aria-label", mode === "zh-CN" ? "切换语言，当前为简体中文" : "切換語言，目前為繁體中文");
            button.setAttribute("title", mode === "zh-CN" ? "切换语言" : "切換語言");
            var text = button.querySelector(".tfse-lang-label");
            if (text) text.textContent = mode === "zh-CN" ? "简" : "繁";
        });
        Array.prototype.forEach.call(document.querySelectorAll("[data-tfse-language-choice]"), function (choice) {
            var selected = choice.getAttribute("data-tfse-language-choice") === mode;
            var targetMode = choice.getAttribute("data-tfse-language-choice");
            if (targetMode === "zh-TW") choice.textContent = mode === "zh-CN" ? "繁体中文" : "繁體中文";
            if (targetMode === "zh-CN") choice.textContent = mode === "zh-CN" ? "简体中文" : "簡體中文";
            choice.classList.toggle("is-active", selected);
            choice.setAttribute("aria-checked", selected ? "true" : "false");
        });
    }

    function closeLanguageMenus(except) {
        Array.prototype.forEach.call(document.querySelectorAll(".tfse-language-switcher.is-open"), function (switcher) {
            if (except && switcher === except) return;
            switcher.classList.remove("is-open");
            var button = switcher.querySelector("[data-tfse-lang-toggle]");
            var menu = switcher.querySelector(".tfse-language-menu");
            if (button) button.setAttribute("aria-expanded", "false");
            if (menu) menu.hidden = true;
        });
    }

    function createLanguageSwitcher() {
        var switcher = document.createElement("div");
        var menuId = "tfse-language-menu-" + Math.random().toString(36).slice(2, 9);
        switcher.className = "tfse-language-switcher";
        switcher.setAttribute("data-tfse-i18n-skip", "");
        switcher.innerHTML = [
            '<button type="button" class="tfse-language-toggle" data-tfse-lang-toggle aria-haspopup="true" aria-expanded="false" aria-controls="' + menuId + '">',
            '<i class="fa fa-globe" aria-hidden="true"></i><span class="tfse-lang-label">繁</span>',
            '</button>',
            '<div class="tfse-language-menu" id="' + menuId + '" role="menu" hidden>',
            '<button type="button" role="menuitemradio" data-tfse-language-choice="zh-TW">繁體中文</button>',
            '<button type="button" role="menuitemradio" data-tfse-language-choice="zh-CN">简体中文</button>',
            '</div>'
        ].join("");
        var button = switcher.querySelector("[data-tfse-lang-toggle]");
        button.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();
            var open = !switcher.classList.contains("is-open");
            closeLanguageMenus(switcher);
            switcher.classList.toggle("is-open", open);
            button.setAttribute("aria-expanded", open ? "true" : "false");
            switcher.querySelector(".tfse-language-menu").hidden = !open;
        });
        Array.prototype.forEach.call(switcher.querySelectorAll("[data-tfse-language-choice]"), function (choice) {
            choice.addEventListener("click", function (event) {
                event.preventDefault();
                event.stopPropagation();
                setLanguageMode(choice.getAttribute("data-tfse-language-choice"));
                closeLanguageMenus();
            });
        });
        return switcher;
    }

    function installLanguageToggle() {
        Array.prototype.forEach.call(document.querySelectorAll(".header-section"), function (header) {
            var right = header.querySelector(".col-xl-2.col.d-none.d-sm-flex");
            if (right && !right.querySelector(".tfse-language-switcher")) {
                var desktopSwitcher = createLanguageSwitcher();
                desktopSwitcher.classList.add("tfse-language-toggle-desktop");
                right.insertBefore(desktopSwitcher, right.firstChild);
            }
            var mobileToggle = header.querySelector(".header-mobile-menu-toggle");
            if (mobileToggle && mobileToggle.parentNode && !mobileToggle.parentNode.querySelector(".tfse-language-toggle-mobile")) {
                var mobileSwitcher = createLanguageSwitcher();
                mobileSwitcher.classList.add("tfse-language-toggle-mobile", "d-xl-none");
                mobileToggle.parentNode.insertBefore(mobileSwitcher, mobileToggle);
            }
        });
        Array.prototype.forEach.call(document.querySelectorAll(".tfse-admin-standalone-actions"), function (actions) {
            if (actions.querySelector(".tfse-language-switcher")) return;
            var adminSwitcher = createLanguageSwitcher();
            adminSwitcher.classList.add("tfse-language-toggle-admin");
            actions.insertBefore(adminSwitcher, actions.firstChild);
        });
        syncLanguageButtons(currentLanguageMode());
    }

    function installLanguageMenuDismissal() {
        if (document.documentElement.hasAttribute("data-tfse-language-dismissal")) return;
        document.documentElement.setAttribute("data-tfse-language-dismissal", "true");
        document.addEventListener("click", function (event) {
            if (event.target.closest && event.target.closest(".tfse-language-switcher")) return;
            closeLanguageMenus();
        });
        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") closeLanguageMenus();
        });
    }

    function searchableText(element) {
        return String(element && element.textContent || "").replace(/\s+/g, " ").trim();
    }

    function searchResultTarget(element) {
        return element.closest(".tfse-service-card, .tfse-final-service, .tfse-article-card, article, section, .row, .container") || element;
    }

    function clearInlineSearch(form) {
        Array.prototype.forEach.call(document.querySelectorAll(".tfse-search-hit"), function (node) {
            node.classList.remove("tfse-search-hit");
        });
        var panel = form && form.querySelector(".tfse-inline-search-results");
        if (panel) {
            panel.hidden = true;
            panel.innerHTML = "";
        }
    }

    function buildInlineSearchResults(form, query) {
        clearInlineSearch(form);
        var panel = form.querySelector(".tfse-inline-search-results");
        if (!panel) return;
        var keyword = String(query || "").trim().toLowerCase();
        if (!keyword) {
            panel.hidden = true;
            return;
        }
        var candidates = Array.prototype.slice.call(document.querySelectorAll("main h1, main h2, main h3, main h4, main p, main li, main a, .page-title-section h1, .page-title-section h2, .tfse-final-hero h1, .tfse-final-hero p, .tfse-check-workbench h2, .tfse-check-workbench p"));
        var seen = [];
        var results = [];
        candidates.some(function (element) {
            if (element.closest("[data-tfse-i18n-skip], .tfse-inline-search-results, script, style")) return false;
            var text = searchableText(element);
            if (!text || text.toLowerCase().indexOf(keyword) === -1) return false;
            var target = searchResultTarget(element);
            if (seen.indexOf(target) !== -1) return false;
            seen.push(target);
            results.push({ element: element, target: target, text: text.slice(0, 96) });
            return results.length >= 6;
        });
        panel.hidden = false;
        if (!results.length) {
            panel.innerHTML = '<div class="tfse-inline-search-empty">目前頁面沒有找到「' + keyword.replace(/[<>&"]/g, "") + '」</div>';
            walkI18n(panel, currentLanguageMode());
            return;
        }
        panel.innerHTML = '<div class="tfse-inline-search-summary">找到 ' + results.length + ' 筆相關內容</div>' + results.map(function (result, index) {
            return '<button type="button" data-tfse-search-index="' + index + '"><span>' + result.text.replace(/[<>&"]/g, "") + '</span><strong>查看位置</strong></button>';
        }).join("");
        Array.prototype.forEach.call(panel.querySelectorAll("[data-tfse-search-index]"), function (button) {
            button.addEventListener("click", function () {
                var result = results[Number(button.getAttribute("data-tfse-search-index"))];
                if (!result) return;
                result.target.classList.add("tfse-search-hit");
                result.target.scrollIntoView({ behavior: "smooth", block: "center" });
            });
        });
        results[0].target.classList.add("tfse-search-hit");
        results[0].target.scrollIntoView({ behavior: "smooth", block: "center" });
        walkI18n(panel, currentLanguageMode());
    }

    function installInlineHeaderSearch() {
        Array.prototype.forEach.call(document.querySelectorAll(".header-search"), function (container, index) {
            if (container.querySelector(".tfse-header-search-form")) return;
            container.innerHTML = [
                '<form class="tfse-header-search-form" role="search" data-tfse-inline-search>',
                '<button type="button" class="tfse-header-search-toggle" aria-label="搜尋目前頁面" aria-expanded="false"><i class="pe-7s-search pe-2x pe-va" aria-hidden="true"></i></button>',
                '<input type="search" class="tfse-header-search-input" name="q" placeholder="輸入關鍵字" aria-label="搜尋目前頁面" autocomplete="off">',
                '<button type="submit" class="tfse-header-search-submit">搜尋</button>',
                '<button type="button" class="tfse-header-search-clear" aria-label="清除搜尋"><i class="pe-7s-close" aria-hidden="true"></i></button>',
                '<div class="tfse-inline-search-results" id="tfse-inline-search-results-' + index + '" hidden></div>',
                '</form>'
            ].join("");
            var form = container.querySelector("form");
            var toggle = form.querySelector(".tfse-header-search-toggle");
            var input = form.querySelector(".tfse-header-search-input");
            var clear = form.querySelector(".tfse-header-search-clear");
            function openSearch() {
                form.classList.add("is-open");
                toggle.setAttribute("aria-expanded", "true");
                input.focus();
                Array.prototype.forEach.call(document.querySelectorAll(".main-search-active.inside"), function (layer) {
                    layer.classList.remove("inside");
                });
            }
            function closeSearch() {
                form.classList.remove("is-open");
                toggle.setAttribute("aria-expanded", "false");
                input.value = "";
                clearInlineSearch(form);
            }
            toggle.addEventListener("click", function (event) {
                event.preventDefault();
                event.stopPropagation();
                if (form.classList.contains("is-open")) {
                    if (input.value.trim()) buildInlineSearchResults(form, input.value);
                    else closeSearch();
                } else {
                    openSearch();
                }
            });
            form.addEventListener("submit", function (event) {
                event.preventDefault();
                event.stopPropagation();
                openSearch();
                buildInlineSearchResults(form, input.value);
            });
            input.addEventListener("input", function () {
                if (input.value.trim().length >= 2) buildInlineSearchResults(form, input.value);
                if (!input.value.trim()) clearInlineSearch(form);
            });
            clear.addEventListener("click", function (event) {
                event.preventDefault();
                closeSearch();
            });
            input.addEventListener("keydown", function (event) {
                if (event.key === "Escape") closeSearch();
            });
        });
    }

    function installI18nObserver() {
        if (i18nObserver || typeof MutationObserver === "undefined") return;
        i18nObserver = new MutationObserver(function (records) {
            if (i18nApplying) return;
            var mode = currentLanguageMode();
            records.forEach(function (record) {
                Array.prototype.forEach.call(record.addedNodes || [], function (node) {
                    if (node.nodeType === 1 || node.nodeType === 3) walkI18n(node, mode);
                });
            });
        });
        i18nObserver.observe(document.body, { childList: true, subtree: true });
    }

    function setupHeaderUi() {
        syncHeaderActiveState();
        simplifyNavigationMenus();
        pruneRedundantContentBlocks();
        installInlineHeaderSearch();
        installLanguageToggle();
        installLanguageMenuDismissal();
        installI18nObserver();
        setLanguageMode(currentLanguageMode());
    }

    function ensureGa4(id) {
        if (!id || ga4Loaded) return;
        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function () {
            window.dataLayer.push(arguments);
        };
        injectScript("https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id));
        window.gtag("js", new Date());
        window.gtag("config", id, { send_page_view: false });
        ga4Loaded = true;
    }

    function ensureMetaPixel(pixelId) {
        if (!pixelId || metaPixelLoaded) return;
        if (!window.fbq) {
            window.fbq = function () {
                if (window.fbq.callMethod) {
                    window.fbq.callMethod.apply(window.fbq, arguments);
                } else {
                    window.fbq.queue.push(arguments);
                }
            };
            if (!window._fbq) window._fbq = window.fbq;
            window.fbq.push = window.fbq;
            window.fbq.loaded = true;
            window.fbq.version = "2.0";
            window.fbq.queue = [];
        }
        injectScript("https://connect.facebook.net/en_US/fbevents.js");
        window.fbq("init", pixelId);
        metaPixelLoaded = true;
    }

    function metaPixelEventName(name) {
        var standardEvents = {
            page_view: "PageView",
            lead_submit: "Lead",
            line_cta_click: "Contact",
            lead_line_cta_shown: "Contact",
            cta_free_check_click: "Contact",
            site_search: "Search",
            site_search_results: "Search",
            database_search: "Search"
        };
        return standardEvents[name] || "";
    }

    function forwardMetaPixel(event, safePayload, pixelId) {
        if (!pixelId) return;
        ensureMetaPixel(pixelId);
        if (!window.fbq) return;
        var payload = Object.assign({}, safePayload, {
            tfse_event: event.name,
            page_path: event.path
        });
        var standardName = metaPixelEventName(event.name);
        if (standardName) {
            window.fbq("track", standardName, payload);
        } else {
            window.fbq("trackCustom", event.name, payload);
        }
    }

    function ensureSentry(dsn) {
        if (!dsn || sentryLoaded) return;
        injectScript("https://browser.sentry-cdn.com/8.55.0/bundle.tracing.min.js", function () {
            if (window.Sentry && window.Sentry.init) {
                window.Sentry.init({
                    dsn: dsn,
                    tracesSampleRate: 0,
                    beforeSend: function (event) {
                        return scrub(event, 0);
                    }
                });
            }
        });
        sentryLoaded = true;
    }

    function forwardEvent(event) {
        loadConfig().then(function (config) {
            var analytics = analyticsConfig(config);
            if (!shouldSample(analytics.sample_rate)) return;
            if (!hasAnalyticsConsent()) return;
            var safePayload = scrub(event.payload || {}, 0);

            if (analytics.ga4_measurement_id) {
                ensureGa4(analytics.ga4_measurement_id);
                if (window.gtag) {
                    window.gtag("event", event.name, {
                        event_category: "tfse",
                        page_path: event.path,
                        page_location: event.url,
                        event_label: safePayload.keyword || safePayload.text || "",
                        tfse_payload: JSON.stringify(safePayload).slice(0, 500)
                    });
                }
            }

            forwardMetaPixel(event, safePayload, analytics.meta_pixel_id);

            if (analytics.server_event_endpoint) {
                fetch(analytics.server_event_endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: event.name,
                        path: event.path,
                        url: event.url,
                        referrer: event.referrer,
                        payload: safePayload,
                        at: event.at
                    }),
                    keepalive: true
                }).catch(function () {
                    // Server-side analytics is optional in the static MVP.
                });
            }
        });
    }

    function track(name, payload) {
        var events = getEvents();
        var event = {
            name: name,
            path: window.location.pathname.split("/").pop() || "index.html",
            url: window.location.href,
            referrer: document.referrer || "",
            payload: scrub(payload || {}, 0),
            at: new Date().toISOString()
        };
        events.unshift(event);
        saveEvents(events);
        forwardEvent(event);
    }

    window.TFSETrack = track;

    function renderTrackingConsentBanner() {
        if (consentStatus() !== "unset" || document.querySelector("[data-tfse-tracking-consent]")) return;
        var banner = document.createElement("div");
        banner.className = "tfse-tracking-consent";
        banner.setAttribute("data-tfse-tracking-consent", "true");
        banner.setAttribute("role", "region");
        banner.setAttribute("aria-label", "追蹤偏好");
        banner.innerHTML = [
            "<p>TFSE 會先以本機去識別事件改善查詢體驗；若您同意，正式 GA4、Meta Pixel 與伺服器事件才會接收去識別追蹤資料。</p>",
            "<div class=\"tfse-tracking-consent__actions\">",
            "<button type=\"button\" class=\"btn btn-primary btn-hover-secondary\" data-tfse-consent-accept>同意追蹤</button>",
            "<button type=\"button\" class=\"btn btn-light btn-hover-primary\" data-tfse-consent-decline>僅必要紀錄</button>",
            "<a href=\"privacy.html\">隱私權政策</a>",
            "</div>"
        ].join("");
        document.body.appendChild(banner);

        banner.querySelector("[data-tfse-consent-accept]").addEventListener("click", function () {
            var record = saveTrackingConsent("granted");
            banner.parentNode.removeChild(banner);
            track("tracking_consent_update", { status: "granted", version: record.version });
        });
        banner.querySelector("[data-tfse-consent-decline]").addEventListener("click", function () {
            var record = saveTrackingConsent("declined");
            banner.parentNode.removeChild(banner);
            track("tracking_consent_update", { status: "declined", version: record.version });
        });
    }

    window.TFSETrackingConsent = {
        get: getTrackingConsent,
        status: consentStatus,
        grant: function () { return saveTrackingConsent("granted"); },
        decline: function () { return saveTrackingConsent("declined"); }
    };

    function recordError(source, message, detail) {
        var safeDetail = scrub(detail || {}, 0);
        var errors = getErrors();
        var record = {
            source: source,
            message: scrub(String(message || ""), 0).slice(0, 300),
            path: window.location.pathname.split("/").pop() || "index.html",
            detail: safeDetail,
            at: new Date().toISOString()
        };
        errors.unshift(record);
        saveErrors(errors);

        loadConfig().then(function (config) {
            var dsn = analyticsConfig(config).sentry_dsn;
            if (!dsn) return;
            ensureSentry(dsn);
            if (window.Sentry && window.Sentry.captureMessage) {
                window.Sentry.captureMessage(record.message, {
                    level: "error",
                    tags: { source: source, path: record.path },
                    extra: safeDetail
                });
            }
        });
    }

    window.TFSEReportError = recordError;

    window.addEventListener("error", function (event) {
        recordError("window_error", event.message, {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
        });
    });

    window.addEventListener("unhandledrejection", function (event) {
        recordError("unhandled_rejection", event.reason && (event.reason.message || String(event.reason)), {});
    });

    track("page_view", {
        title: document.title,
        utm_source: new URLSearchParams(window.location.search).get("utm_source") || "",
        utm_medium: new URLSearchParams(window.location.search).get("utm_medium") || "",
        utm_campaign: new URLSearchParams(window.location.search).get("utm_campaign") || ""
    });
    setupHeaderUi();
    renderTrackingConsentBanner();

    document.addEventListener("click", function (event) {
        var link = event.target.closest && event.target.closest("a");
        if (!link) return;
        var href = link.getAttribute("href") || "";
        var text = (link.textContent || "").trim().slice(0, 80);
        if (link.getAttribute("data-line-cta")) {
            track("line_cta_click", { href: href, text: text, source: link.getAttribute("data-line-cta") });
        } else if (href.indexOf("contact.html") !== -1 || href.indexOf("free-check.html") !== -1) {
            track("cta_free_check_click", { href: href, text: text });
        } else if (href.indexOf("database.html") !== -1) {
            track("database_click", { href: href, text: text });
        } else if (href.indexOf("articles/") !== -1 || href.indexOf("articles.html") !== -1) {
            track("article_click", { href: href, text: text });
        }
    }, true);

    var dbKeyword = document.querySelector("[data-tfse-db-keyword]");
    var dbType = document.querySelector("[data-tfse-db-type]");
    if (dbKeyword) {
        dbKeyword.addEventListener("change", function () {
            track("database_search", { keyword: dbKeyword.value });
        });
    }
    if (dbType) {
        dbType.addEventListener("change", function () {
            track("database_filter", { type: dbType.value });
        });
    }
})();
