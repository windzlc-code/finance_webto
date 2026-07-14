var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};

// src/utils.js
function normalizeParkingCount(count) {
  const n = Number(count);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n);
}
function normalizeText(value) {
  return String(value || "").replace(/\s+/g, "").replace(/臺/g, "\u53F0").trim();
}
function toHalfWidth(text) {
  return String(text || "").normalize("NFKC").replace(/\u3000/g, " ").replace(/[！-～]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 65248)).replace(/[臺]/g, "\u53F0").replace(/[⺠]/g, "\u6C11").replace(/[㈯]/g, "\u571F").replace(/[㈲]/g, "\u6709").replace(/[㈰]/g, "\u65E5").replace(/[㈪]/g, "\u6708").replace(/[㈾]/g, "\u8CC7").replace(/[㊠]/g, "\u9805").replace(/[㊞]/g, "\u5370").replace(/[㊟]/g, "\u6CE8").replace(/[㉂]/g, "\u81EA").replace(/[㉃]/g, "\u81F3").replace(/[㆞]/g, "\u5730").replace(/[㆒]/g, "\u4E00").replace(/[㆓]/g, "\u4E8C").replace(/[㆔]/g, "\u4E09").replace(/[㆕]/g, "\u56DB").replace(/[门]/g, "\u9580").replace(/[号]/g, "\u865F").replace(/[楼]/g, "\u6A13").replace(/[阳]/g, "\u967D").replace(/[户]/g, "\u6236").replace(/[权]/g, "\u6B0A").replace(/[围]/g, "\u570D").replace(/[与]/g, "\u8207");
}
function cleanOcrText(text) {
  return toHalfWidth(String(text || "")).replace(/[：:]/g, ":").replace(/附\s*[屠属]\s*建物/g, "\u9644\u5C6C\u5EFA\u7269").replace(/共\s*[\(（]\s*有\s*[\)）]\s*部\s*[分份]/g, "\u5171\u6709\u90E8\u5206").replace(/所\s*[\(（]\s*有\s*[\)）]\s*權/g, "\u6240\u6709\u6B0A").replace(/\r/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
function normalizeOcrAreaUnits(text) {
  return String(text || "").replace(/平方公[怀尺司盡尽屆届限月片]/g, "\u5E73\u65B9\u516C\u5C3A").replace(/[平半][方萬万文分][公]?尺/g, "\u5E73\u65B9\u516C\u5C3A").replace(/平[方萬万文分]公(?!尺)/g, "\u5E73\u65B9\u516C\u5C3A").replace(/平方[／/]/g, "\u5E73\u65B9\u516C\u5C3A");
}
function compactOcrText(text) {
  return normalizeOcrAreaUnits(
    cleanOcrText(text).replace(/[*＊]+/g, "").replace(/[ \t]+/g, "")
  ).replace(/\n+/g, "");
}
function isSquareMeterAreaUnit(unit) {
  return /平方公尺|平方?米|平方|m2|㎡/i.test(normalizeOcrAreaUnits(unit));
}
function escapeRegExp(text) {
  return String(text || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function normalizeFullWidthDigitsToAscii(s) {
  return String(s || "").replace(/[０-９]/g, (ch) => String("\uFF10\uFF11\uFF12\uFF13\uFF14\uFF15\uFF16\uFF17\uFF18\uFF19".indexOf(ch)));
}
function parseFloorLevelToken(tok) {
  let t = normalizeFullWidthDigitsToAscii(String(tok || "").trim());
  if (!t) return null;
  if (/^\d{1,3}$/.test(t)) {
    const n = Number(t);
    return Number.isFinite(n) && n >= 1 && n <= 199 ? n : null;
  }
  const d = { "\u3007": 0, \u96F6: 0, \u4E00: 1, \u4E8C: 2, \u4E09: 3, \u56DB: 4, \u4E94: 5, \u516D: 6, \u4E03: 7, \u516B: 8, \u4E5D: 9, \u5341: 10, \u58F9: 1, \u8CB3: 2, \u53C3: 3, \u8086: 4, \u4F0D: 5, \u9678: 6, \u67D2: 7, \u634C: 8, \u7396: 9, \u62FE: 10 };
  if (t.length === 1) {
    const v = d[t];
    return v >= 1 ? v : null;
  }
  if (t === "\u5341") return 10;
  const m11 = t.match(/^[十拾]([一二三四五六七八九壹貳參肆伍陸柒捌玖])$/);
  if (m11) return 10 + d[m11[1]];
  const m12 = t.match(/^([一二三四五六七八九壹貳參肆伍陸柒捌玖])[十拾]$/);
  if (m12) return d[m12[1]] * 10;
  const m13 = t.match(/^([一二三四五六七八九壹貳參肆伍陸柒捌玖])[十拾]([一二三四五六七八九壹貳參肆伍陸柒捌玖])$/);
  if (m13) return d[m13[1]] * 10 + d[m13[2]];
  const tens = "\u4E00\u4E8C\u4E09\u56DB\u4E94\u516D\u4E03\u516B\u4E5D\u58F9\u8CB3\u53C3\u8086\u4F0D\u9678\u67D2\u634C\u7396";
  for (let i = 0; i < tens.length; i++) {
    const head = tens[i];
    const value = d[head];
    if (t === `${head}\u5341` || t === `${head}\u62FE`) return value * 10;
    if (t.length === 3 && t[0] === head && (t[1] === "\u5341" || t[1] === "\u62FE")) {
      const u = d[t[2]];
      if (u >= 1) return value * 10 + u;
    }
  }
  return null;
}
var toNumber, safeNumber, formatNum;
var init_utils = __esm({
  "src/utils.js"() {
    "use strict";
    toNumber = (value) => {
      const text = String(value ?? "").replace(/,/g, "").trim();
      if (!text) return null;
      const n = Number(text);
      return Number.isFinite(n) ? n : null;
    };
    safeNumber = (value) => toNumber(value) ?? 0;
    formatNum = (value, digits = 2) => Number(value).toLocaleString("zh-TW", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }
});

// src/app/config.js
var ocrConfig, officialSearchConfig, mainPurposeOptions, specialRemarkFilters, specialRemarkFilterById;
var init_config = __esm({
  "src/app/config.js"() {
    "use strict";
    ocrConfig = Object.freeze({
      usePaddleOcr: true,
      paddleEndpoint: "http://127.0.0.1:8001/ocr/deed",
      paddleDiagnosticsEndpoint: "http://127.0.0.1:8001/api/ocr/health",
      paddleTimeoutMs: 9e4,
      paddlePdfTimeoutMs: 3e4,
      paddlePdfMaxPages: 5,
      paddlePdfDpi: 180,
      paddlePdfFastMode: true,
      enableBrowserPdfOcrFallback: false,
      skipPdfBrowserParseAfterPaddle: true,
      pdfQuickTextTimeoutMs: 15e3,
      skipAllPdfOcr: false
    });
    officialSearchConfig = Object.freeze({
      tokenTimeoutMs: 12e3,
      queryTimeoutMs: 2e4,
      detailTimeoutMs: 15e3,
      retryBaseDelayMs: 500,
      maxAttempts: 2,
      totalTimeoutMs: 45e3,
      autoTotalTimeoutMs: 3e4,
      minRowsBeforeStop: 3,
      maxExpandSpanYears: 3
    });
    mainPurposeOptions = Object.freeze([
      "\u4F4F\u5BB6\u7528",
      "\u5546\u696D\u7528",
      "\u5DE5\u696D\u7528",
      "\u8FB2\u696D\u7528",
      "\u8FA6\u516C\u7528",
      "\u4F4F\u5546\u7528",
      "\u4F4F\u5DE5\u7528",
      "\u4F4F\u8FA6\u7528",
      "\u5DE5\u5546\u7528",
      "\u5546\u8FA6\u7528",
      "\u4F4F\u5546\u8FA6\u7528",
      "\u5DE5\u5546\u8FA6\u7528",
      "\u5176\u4ED6"
    ]);
    specialRemarkFilters = Object.freeze([
      { id: "special_relation", label: "\u89AA\u53CB\u3001\u54E1\u5DE5\u3001\u5171\u6709\u4EBA\u6216\u5176\u4ED6\u7279\u6B8A\u95DC\u4FC2\u9593\u4E4B\u4EA4\u6613", keywords: ["\u89AA\u53CB", "\u54E1\u5DE5", "\u5171\u6709\u4EBA", "\u7279\u6B8A\u95DC\u4FC2", "\u4E8C\u89AA\u7B49", "\u4E09\u89AA\u7B49", "\u95DC\u4FC2\u4EBA", "\u95DC\u4FC2\u9593"] },
      { id: "unfinished", label: "\u6BDB\u80DA\u5C4B", keywords: ["\u6BDB\u80DA", "\u6BDB\u576F"] },
      { id: "superficies", label: "\u5730\u4E0A\u6B0A\u623F\u5C4B", keywords: ["\u5730\u4E0A\u6B0A"] },
      { id: "public_reserved", label: "(\u5305\u542B)\u516C\u5171\u8A2D\u65BD\u4FDD\u7559\u5730(\u7528\u5730)", keywords: ["\u516C\u5171\u8A2D\u65BD\u4FDD\u7559\u5730", "\u516C\u5171\u8A2D\u65BD\u4FDD\u7559\u7528\u5730", "\u516C\u8A2D\u4FDD\u7559\u5730"] },
      { id: "has_note", label: "\u6709\u5099\u8A3B", keywords: [] },
      { id: "has_elevator", label: "\u6709\u96FB\u68AF", keywords: [] },
      { id: "has_management", label: "\u6709\u7BA1\u7406\u7D44\u7E54", keywords: [] }
    ]);
    specialRemarkFilterById = new Map(specialRemarkFilters.map((filter) => [filter.id, filter]));
  }
});

// src/constants.js
function parseRuntimeFlagValue(value, fallback = false) {
  if (value === void 0 || value === null || value === "") return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on", "enabled"].includes(normalized)) return true;
  if (["0", "false", "no", "off", "disabled"].includes(normalized)) return false;
  return fallback;
}
function runtimeFlag(name, fallback = false) {
  if (typeof window === "undefined") return fallback;
  const root4 = window.FoundRuntimeConfig || {};
  if (Object.prototype.hasOwnProperty.call(root4, name)) {
    return parseRuntimeFlagValue(root4[name], fallback);
  }
  try {
    const params2 = new URLSearchParams(window.location.search || "");
    if (params2.has(name)) return parseRuntimeFlagValue(params2.get(name), fallback);
  } catch (_) {
  }
  try {
    const stored = window.localStorage?.getItem(`found:${name}`);
    if (stored !== null && stored !== void 0) {
      return parseRuntimeFlagValue(stored, fallback);
    }
  } catch (_) {
  }
  return fallback;
}
function pdfViewportScaleForOcr(dpi = PDF_OCR_RASTER_DPI) {
  const d = Math.min(PDF_OCR_RASTER_DPI_MAX, Math.max(PDF_OCR_RASTER_DPI_MIN, Number(dpi) || PDF_OCR_RASTER_DPI));
  return d / 72;
}
function isBackendOcrHealthReady(data) {
  if (!data || typeof data !== "object") return false;
  if (data.ok === true) return true;
  if (data.status === "ok") return true;
  if (data.api_ready === true) return true;
  return data.ocr_available === true;
}
function loadScript(src) {
  if (SCRIPT_LOAD_PROMISES.has(src)) return SCRIPT_LOAD_PROMISES.get(src);
  const existing = Array.from(document.scripts).find((script) => script.src === new URL(src, window.location.href).href);
  if (existing?.dataset.loaded === "1") return Promise.resolve();
  const promise = new Promise((resolve, reject) => {
    if (existing) {
      existing.addEventListener("load", () => {
        existing.dataset.loaded = "1";
        resolve();
      }, { once: true });
      existing.addEventListener("error", () => reject(new Error(`\u7121\u6CD5\u8F09\u5165 ${src}`)), { once: true });
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => {
      s.dataset.loaded = "1";
      resolve();
    };
    s.onerror = () => reject(new Error(`\u7121\u6CD5\u8F09\u5165 ${src}`));
    document.head.appendChild(s);
  }).catch((error) => {
    SCRIPT_LOAD_PROMISES.delete(src);
    throw error;
  });
  SCRIPT_LOAD_PROMISES.set(src, promise);
  return promise;
}
async function checkBackendOcrHealth({ refresh = false, timeoutMs = 3e3 } = {}) {
  const now = Date.now();
  if (!refresh && _backendOcrHealthPromise && now - _backendOcrHealthCachedAt < BACKEND_OCR_HEALTH_CACHE_MS) return _backendOcrHealthPromise;
  _backendOcrHealthCachedAt = now;
  _backendOcrHealthPromise = (async () => {
    const endpoint = String(ocrConfig?.paddleDiagnosticsEndpoint || "/api/ocr/health");
    if (!window.fetch) return false;
    if (window.location.protocol === "file:" && endpoint.startsWith("/")) return false;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), Math.max(500, timeoutMs));
    try {
      const res = await fetch(endpoint, {
        cache: "no-store",
        signal: controller.signal
      });
      if (!res.ok) return false;
      const data = await res.json();
      return isBackendOcrHealthReady(data);
    } catch (_) {
      return false;
    } finally {
      window.clearTimeout(timer);
    }
  })();
  return _backendOcrHealthPromise;
}
function markBackendOcrUnavailable() {
  _backendOcrHealthCachedAt = Date.now();
  _backendOcrHealthPromise = Promise.resolve(false);
}
var defaultRecords, AI_LAB_ENABLED, OFFICIAL_AUTO_HARD_TIMEOUT_MS, OFFICIAL_AUTO_TIMEOUT_MESSAGE, CITY_DISTRICTS, RE_ADDR_ROAD_SECTION_SUFFIX, RE_ADDR_ROAD_OPTIONAL_SECTION, PDF_OCR_RASTER_DPI_MIN, PDF_OCR_RASTER_DPI_MAX, PDF_OCR_RASTER_DPI, PDF_BROWSER_OCR_MAX_PAGES, SPECIAL_REMARK_FILTERS, SPECIAL_REMARK_FILTER_BY_ID, PDF_JS_CDN_SRC, PDF_JS_WORKER_SRC, SCRIPT_LOAD_PROMISES, BACKEND_OCR_HEALTH_CACHE_MS, _backendOcrHealthPromise, _backendOcrHealthCachedAt;
var init_constants = __esm({
  "src/constants.js"() {
    "use strict";
    init_config();
    defaultRecords = [
      "\u5927\u5B89\u5340\u6EAB\u5DDE\u885774\u5DF71\u5F048\u865F,146.60,23000,156.89,100,\u83EF\u5EC8,46,\u4E00\u5C64/\u56DB\u5C64,\u4F4F\u5BB6\u7528,\u623F\u5730(\u571F\u5730+\u5EFA\u7269),34\u623F2\u5EF38\u885B,0,",
      "\u5927\u5B89\u5340\u6EAB\u5DDE\u885783\u865F6\u6A13\u4E4B6,129.97,2158,16.60,93.84,\u83EF\u5EC8,46,\u4E94\u5C64/\u4E03\u5C64,\u4F4F\u5BB6\u7528,\u623F\u5730(\u571F\u5730+\u5EFA\u7269),1\u623F2\u5EF31\u885B,0,\u89AA\u53CB\u4EA4\u6613",
      "\u5927\u5B89\u5340\u6EAB\u5DDE\u885752\u5DF71\u865F,116.29,5230,44.97,72.29,\u83EF\u5EC8,40,\u4E00\u5C64/\u516D\u5C64,\u4F4F\u5BB6\u7528,\u623F\u5730(\u571F\u5730+\u5EFA\u7269),3\u623F2\u5EF32\u885B,0,",
      "\u5927\u5B89\u5340\u6EAB\u5DDE\u885774\u5DF73\u5F041\u865F\u4E94\u6A13\u4E4B1,115.97,1828,15.76,93.42,\u83EF\u5EC8,46,\u4E94\u5C64/\u4E03\u5C64,\u4F4F\u5BB6\u7528,\u623F\u5730(\u571F\u5730+\u5EFA\u7269),2\u623F2\u5EF31\u885B,0,",
      "\u5927\u5B89\u5340\u6EAB\u5DDE\u885774\u5DF74\u5F042\u865F\u4E8C\u6A13\u4E4B1,91.33,2200,24.09,68.48,\u83EF\u5EC8,46,\u4E09\u5C64/\u4E03\u5C64,\u4F4F\u5BB6\u7528,\u623F\u5730(\u571F\u5730+\u5EFA\u7269),2\u623F2\u5EF31\u885B,0,"
    ].join("\n");
    AI_LAB_ENABLED = runtimeFlag("aiLab", false);
    OFFICIAL_AUTO_HARD_TIMEOUT_MS = 45e3;
    OFFICIAL_AUTO_TIMEOUT_MESSAGE = `\u4E0A\u50B3\u8B04\u672C\u81EA\u52D5\u5B98\u65B9\u67E5\u8A62\u8D85\u904E ${Math.round(OFFICIAL_AUTO_HARD_TIMEOUT_MS / 1e3)} \u79D2\uFF0C\u5DF2\u505C\u6B62`;
    CITY_DISTRICTS = {
      "\u57FA\u9686\u5E02": ["\u4EC1\u611B\u5340", "\u4FE1\u7FA9\u5340", "\u4E2D\u6B63\u5340", "\u4E2D\u5C71\u5340", "\u5B89\u6A02\u5340", "\u6696\u6696\u5340", "\u4E03\u5835\u5340"],
      "\u81FA\u5317\u5E02": ["\u4E2D\u6B63\u5340", "\u5927\u540C\u5340", "\u4E2D\u5C71\u5340", "\u677E\u5C71\u5340", "\u5927\u5B89\u5340", "\u842C\u83EF\u5340", "\u4FE1\u7FA9\u5340", "\u58EB\u6797\u5340", "\u5317\u6295\u5340", "\u5167\u6E56\u5340", "\u5357\u6E2F\u5340", "\u6587\u5C71\u5340"],
      "\u65B0\u5317\u5E02": ["\u677F\u6A4B\u5340", "\u4E09\u91CD\u5340", "\u4E2D\u548C\u5340", "\u6C38\u548C\u5340", "\u65B0\u838A\u5340", "\u65B0\u5E97\u5340", "\u6A39\u6797\u5340", "\u9DAF\u6B4C\u5340", "\u4E09\u5CFD\u5340", "\u6DE1\u6C34\u5340", "\u6C50\u6B62\u5340", "\u745E\u82B3\u5340", "\u571F\u57CE\u5340", "\u8606\u6D32\u5340", "\u4E94\u80A1\u5340", "\u6CF0\u5C71\u5340", "\u6797\u53E3\u5340", "\u6DF1\u5751\u5340", "\u77F3\u7887\u5340", "\u576A\u6797\u5340", "\u4E09\u829D\u5340", "\u77F3\u9580\u5340", "\u516B\u91CC\u5340", "\u5E73\u6EAA\u5340", "\u96D9\u6EAA\u5340", "\u8CA2\u5BEE\u5340", "\u91D1\u5C71\u5340", "\u842C\u91CC\u5340", "\u70CF\u4F86\u5340"],
      "\u6843\u5712\u5E02": ["\u6843\u5712\u5340", "\u4E2D\u58E2\u5340", "\u5E73\u93AE\u5340", "\u516B\u5FB7\u5340", "\u694A\u6885\u5340", "\u8606\u7AF9\u5340", "\u5927\u6EAA\u5340", "\u9F8D\u6F6D\u5340", "\u9F9C\u5C71\u5340", "\u5927\u5712\u5340", "\u89C0\u97F3\u5340", "\u65B0\u5C4B\u5340", "\u5FA9\u8208\u5340"],
      "\u65B0\u7AF9\u5E02": ["\u6771\u5340", "\u5317\u5340", "\u9999\u5C71\u5340"],
      "\u65B0\u7AF9\u7E23": ["\u7AF9\u5317\u5E02", "\u7AF9\u6771\u93AE", "\u65B0\u57D4\u93AE", "\u95DC\u897F\u93AE", "\u6E56\u53E3\u9109", "\u65B0\u8C50\u9109", "\u828E\u6797\u9109", "\u6A6B\u5C71\u9109", "\u5317\u57D4\u9109", "\u5BF6\u5C71\u9109", "\u5CE8\u7709\u9109", "\u5C16\u77F3\u9109", "\u4E94\u5CF0\u9109"],
      "\u82D7\u6817\u7E23": ["\u82D7\u6817\u5E02", "\u82D1\u88E1\u93AE", "\u901A\u9704\u93AE", "\u7AF9\u5357\u93AE", "\u982D\u4EFD\u5E02", "\u5F8C\u9F8D\u93AE", "\u5353\u862D\u93AE", "\u5927\u6E56\u9109", "\u516C\u9928\u9109", "\u9285\u947C\u9109", "\u5357\u5E84\u9109", "\u982D\u5C4B\u9109", "\u4E09\u7FA9\u9109", "\u897F\u6E56\u9109", "\u9020\u6A4B\u9109", "\u4E09\u7063\u9109", "\u7345\u6F6D\u9109", "\u6CF0\u5B89\u9109"],
      "\u81FA\u4E2D\u5E02": ["\u4E2D\u5340", "\u6771\u5340", "\u5357\u5340", "\u897F\u5340", "\u5317\u5340", "\u5317\u5C6F\u5340", "\u897F\u5C6F\u5340", "\u5357\u5C6F\u5340", "\u592A\u5E73\u5340", "\u5927\u91CC\u5340", "\u9727\u5CF0\u5340", "\u70CF\u65E5\u5340", "\u8C50\u539F\u5340", "\u540E\u91CC\u5340", "\u77F3\u5CA1\u5340", "\u6771\u52E2\u5340", "\u548C\u5E73\u5340", "\u65B0\u793E\u5340", "\u6F6D\u5B50\u5340", "\u5927\u96C5\u5340", "\u795E\u5CA1\u5340", "\u5927\u809A\u5340", "\u6C99\u9E7F\u5340", "\u9F8D\u4E95\u5340", "\u68A7\u68F2\u5340", "\u6E05\u6C34\u5340", "\u5927\u7532\u5340", "\u5916\u57D4\u5340", "\u5927\u5B89\u5340"],
      "\u5F70\u5316\u7E23": ["\u5F70\u5316\u5E02", "\u9E7F\u6E2F\u93AE", "\u548C\u7F8E\u93AE", "\u7DDA\u897F\u9109", "\u4F38\u6E2F\u9109", "\u798F\u8208\u9109", "\u79C0\u6C34\u9109", "\u82B1\u58C7\u9109", "\u82AC\u5712\u9109", "\u54E1\u6797\u5E02", "\u6EAA\u6E56\u93AE", "\u7530\u4E2D\u93AE", "\u5927\u6751\u9109", "\u57D4\u9E7D\u9109", "\u57D4\u5FC3\u9109", "\u6C38\u9756\u9109", "\u793E\u982D\u9109", "\u4E8C\u6C34\u9109", "\u5317\u6597\u93AE", "\u4E8C\u6797\u93AE", "\u7530\u5C3E\u9109", "\u57E4\u982D\u9109", "\u82B3\u82D1\u9109", "\u5927\u57CE\u9109", "\u7AF9\u5858\u9109", "\u6EAA\u5DDE\u9109"],
      "\u5357\u6295\u7E23": ["\u5357\u6295\u5E02", "\u57D4\u91CC\u93AE", "\u8349\u5C6F\u93AE", "\u7AF9\u5C71\u93AE", "\u96C6\u96C6\u93AE", "\u540D\u9593\u9109", "\u9E7F\u8C37\u9109", "\u4E2D\u5BEE\u9109", "\u9B5A\u6C60\u9109", "\u570B\u59D3\u9109", "\u6C34\u91CC\u9109", "\u4FE1\u7FA9\u9109", "\u4EC1\u611B\u9109"],
      "\u96F2\u6797\u7E23": ["\u6597\u516D\u5E02", "\u6597\u5357\u93AE", "\u864E\u5C3E\u93AE", "\u897F\u87BA\u93AE", "\u571F\u5EAB\u93AE", "\u5317\u6E2F\u93AE", "\u53E4\u5751\u9109", "\u5927\u57E4\u9109", "\u83BF\u6850\u9109", "\u6797\u5167\u9109", "\u4E8C\u5D19\u9109", "\u5D19\u80CC\u9109", "\u9EA5\u5BEE\u9109", "\u6771\u52E2\u9109", "\u8912\u5FE0\u9109", "\u53F0\u897F\u9109", "\u5143\u9577\u9109", "\u56DB\u6E56\u9109", "\u53E3\u6E56\u9109", "\u6C34\u6797\u9109"],
      "\u5609\u7FA9\u5E02": ["\u6771\u5340", "\u897F\u5340"],
      "\u5609\u7FA9\u7E23": ["\u592A\u4FDD\u5E02", "\u6734\u5B50\u5E02", "\u5E03\u888B\u93AE", "\u5927\u6797\u93AE", "\u6C11\u96C4\u9109", "\u6EAA\u53E3\u9109", "\u65B0\u6E2F\u9109", "\u516D\u8173\u9109", "\u6771\u77F3\u9109", "\u7FA9\u7AF9\u9109", "\u9E7F\u8349\u9109", "\u6C34\u4E0A\u9109", "\u4E2D\u57D4\u9109", "\u7AF9\u5D0E\u9109", "\u6885\u5C71\u9109", "\u756A\u8DEF\u9109", "\u5927\u57D4\u9109", "\u963F\u91CC\u5C71\u9109"],
      "\u81FA\u5357\u5E02": ["\u4E2D\u897F\u5340", "\u6771\u5340", "\u5357\u5340", "\u5317\u5340", "\u5B89\u5E73\u5340", "\u5B89\u5357\u5340", "\u6C38\u5EB7\u5340", "\u6B78\u4EC1\u5340", "\u65B0\u5316\u5340", "\u5DE6\u93AE\u5340", "\u7389\u4E95\u5340", "\u6960\u897F\u5340", "\u5357\u5316\u5340", "\u4EC1\u5FB7\u5340", "\u95DC\u5EDF\u5340", "\u9F8D\u5D0E\u5340", "\u5B98\u7530\u5340", "\u9EBB\u8C46\u5340", "\u4F73\u91CC\u5340", "\u897F\u6E2F\u5340", "\u4E03\u80A1\u5340", "\u5C07\u8ECD\u5340", "\u5B78\u7532\u5340", "\u5317\u9580\u5340", "\u65B0\u71DF\u5340", "\u5F8C\u58C1\u5340", "\u767D\u6CB3\u5340", "\u6771\u5C71\u5340", "\u516D\u7532\u5340", "\u4E0B\u71DF\u5340", "\u67F3\u71DF\u5340", "\u9E7D\u6C34\u5340", "\u5584\u5316\u5340", "\u5927\u5167\u5340", "\u5C71\u4E0A\u5340", "\u65B0\u5E02\u5340", "\u5B89\u5B9A\u5340"],
      "\u9AD8\u96C4\u5E02": ["\u65B0\u8208\u5340", "\u524D\u91D1\u5340", "\u82D3\u96C5\u5340", "\u9E7D\u57D5\u5340", "\u9F13\u5C71\u5340", "\u65D7\u6D25\u5340", "\u524D\u93AE\u5340", "\u4E09\u6C11\u5340", "\u6960\u6893\u5340", "\u5C0F\u6E2F\u5340", "\u5DE6\u71DF\u5340", "\u4EC1\u6B66\u5340", "\u5927\u793E\u5340", "\u5CA1\u5C71\u5340", "\u8DEF\u7AF9\u5340", "\u963F\u84EE\u5340", "\u7530\u5BEE\u5340", "\u71D5\u5DE2\u5340", "\u6A4B\u982D\u5340", "\u6893\u5B98\u5340", "\u5F4C\u9640\u5340", "\u6C38\u5B89\u5340", "\u6E56\u5167\u5340", "\u9CF3\u5C71\u5340", "\u5927\u5BEE\u5340", "\u6797\u5712\u5340", "\u9CE5\u677E\u5340", "\u5927\u6A39\u5340", "\u65D7\u5C71\u5340", "\u7F8E\u6FC3\u5340", "\u516D\u9F9C\u5340", "\u5167\u9580\u5340", "\u6749\u6797\u5340", "\u7532\u4ED9\u5340", "\u6843\u6E90\u5340", "\u90A3\u746A\u590F\u5340", "\u8302\u6797\u5340", "\u8304\u8423\u5340"],
      "\u5C4F\u6771\u7E23": ["\u5C4F\u6771\u5E02", "\u6F6E\u5DDE\u93AE", "\u6771\u6E2F\u93AE", "\u6046\u6625\u93AE", "\u842C\u4E39\u9109", "\u9577\u6CBB\u9109", "\u9E9F\u6D1B\u9109", "\u4E5D\u5982\u9109", "\u91CC\u6E2F\u9109", "\u9E7D\u57D4\u9109", "\u9AD8\u6A39\u9109", "\u842C\u5DD2\u9109", "\u5167\u57D4\u9109", "\u7AF9\u7530\u9109", "\u65B0\u57E4\u9109", "\u678B\u5BEE\u9109", "\u65B0\u5712\u9109", "\u5D01\u9802\u9109", "\u6797\u908A\u9109", "\u5357\u5DDE\u9109", "\u4F73\u51AC\u9109", "\u7409\u7403\u9109", "\u8ECA\u57CE\u9109", "\u6EFF\u5DDE\u9109", "\u678B\u5C71\u9109", "\u4E09\u5730\u9580\u9109", "\u9727\u53F0\u9109", "\u746A\u5BB6\u9109", "\u6CF0\u6B66\u9109", "\u4F86\u7FA9\u9109", "\u6625\u65E5\u9109", "\u7345\u5B50\u9109", "\u7261\u4E39\u9109"],
      "\u5B9C\u862D\u7E23": ["\u5B9C\u862D\u5E02", "\u7F85\u6771\u93AE", "\u8607\u6FB3\u93AE", "\u982D\u57CE\u93AE", "\u7901\u6EAA\u9109", "\u58EF\u570D\u9109", "\u54E1\u5C71\u9109", "\u51AC\u5C71\u9109", "\u4E94\u7D50\u9109", "\u4E09\u661F\u9109", "\u5927\u540C\u9109", "\u5357\u6FB3\u9109"],
      "\u82B1\u84EE\u7E23": ["\u82B1\u84EE\u5E02", "\u9CF3\u6797\u93AE", "\u7389\u91CC\u93AE", "\u65B0\u57CE\u9109", "\u5409\u5B89\u9109", "\u58FD\u8C50\u9109", "\u79C0\u6797\u9109", "\u5149\u5FA9\u9109", "\u8C50\u6FF1\u9109", "\u745E\u7A57\u9109", "\u842C\u69AE\u9109", "\u5BCC\u91CC\u9109", "\u5353\u6EAA\u9109"],
      "\u81FA\u6771\u7E23": ["\u81FA\u6771\u5E02", "\u6210\u529F\u93AE", "\u95DC\u5C71\u93AE", "\u5351\u5357\u9109", "\u9E7F\u91CE\u9109", "\u6C60\u4E0A\u9109", "\u6771\u6CB3\u9109", "\u9577\u6FF1\u9109", "\u592A\u9EBB\u91CC\u9109", "\u5927\u6B66\u9109", "\u7DA0\u5CF6\u9109", "\u6D77\u7AEF\u9109", "\u5EF6\u5E73\u9109", "\u91D1\u5CF0\u9109", "\u9054\u4EC1\u9109", "\u862D\u5DBC\u9109"],
      "\u6F8E\u6E56\u7E23": ["\u99AC\u516C\u5E02", "\u6E56\u897F\u9109", "\u767D\u6C99\u9109", "\u897F\u5DBC\u9109", "\u671B\u5B89\u9109", "\u4E03\u7F8E\u9109"],
      "\u91D1\u9580\u7E23": ["\u91D1\u57CE\u93AE", "\u91D1\u6E56\u93AE", "\u91D1\u6C99\u93AE", "\u91D1\u5BE7\u9109", "\u70C8\u5DBC\u9109", "\u70CF\u5775\u9109"],
      "\u9023\u6C5F\u7E23": ["\u5357\u7AFF\u9109", "\u5317\u7AFF\u9109", "\u8392\u5149\u9109", "\u6771\u5F15\u9109"]
    };
    RE_ADDR_ROAD_SECTION_SUFFIX = "(?:[0-9\uFF10-\uFF19]+|[\u4E00\u4E8C\u4E09\u56DB\u4E94\u516D\u4E03\u516B\u4E5D\u5341\u767E\u5343]+)\u6BB5";
    RE_ADDR_ROAD_OPTIONAL_SECTION = `(?:${RE_ADDR_ROAD_SECTION_SUFFIX})?`;
    PDF_OCR_RASTER_DPI_MIN = 180;
    PDF_OCR_RASTER_DPI_MAX = 300;
    PDF_OCR_RASTER_DPI = 220;
    PDF_BROWSER_OCR_MAX_PAGES = 2;
    SPECIAL_REMARK_FILTERS = [
      { id: "special_relation", label: "\u89AA\u53CB\u3001\u54E1\u5DE5\u3001\u5171\u6709\u4EBA\u6216\u5176\u4ED6\u7279\u6B8A\u95DC\u4FC2\u9593\u4E4B\u4EA4\u6613", keywords: ["\u89AA\u53CB", "\u54E1\u5DE5", "\u5171\u6709\u4EBA", "\u7279\u6B8A\u95DC\u4FC2", "\u4E8C\u89AA\u7B49", "\u4E09\u89AA\u7B49", "\u95DC\u4FC2\u4EBA", "\u95DC\u4FC2\u9593"] },
      { id: "unfinished", label: "\u6BDB\u80DA\u5C4B", keywords: ["\u6BDB\u80DA", "\u6BDB\u576F"] },
      { id: "superficies", label: "\u5730\u4E0A\u6B0A\u623F\u5C4B", keywords: ["\u5730\u4E0A\u6B0A"] },
      { id: "public_reserved", label: "(\u5305\u542B)\u516C\u5171\u8A2D\u65BD\u4FDD\u7559\u5730(\u7528\u5730)", keywords: ["\u516C\u5171\u8A2D\u65BD\u4FDD\u7559\u5730", "\u516C\u5171\u8A2D\u65BD\u4FDD\u7559\u7528\u5730", "\u516C\u8A2D\u4FDD\u7559\u5730"] },
      { id: "has_note", label: "\u6709\u5099\u8A3B", keywords: [] },
      { id: "has_elevator", label: "\u6709\u96FB\u68AF", keywords: [] },
      { id: "has_management", label: "\u6709\u7BA1\u7406\u7D44\u7E54", keywords: [] }
    ];
    SPECIAL_REMARK_FILTER_BY_ID = new Map(SPECIAL_REMARK_FILTERS.map((filter) => [filter.id, filter]));
    PDF_JS_CDN_SRC = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    PDF_JS_WORKER_SRC = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    SCRIPT_LOAD_PROMISES = /* @__PURE__ */ new Map();
    BACKEND_OCR_HEALTH_CACHE_MS = 5e3;
    _backendOcrHealthPromise = null;
    _backendOcrHealthCachedAt = 0;
  }
});

// src/deed/text-sections.js
function sliceCompactSection(source, startPatterns, endPatterns) {
  const compact = compactOcrText(source);
  if (!compact) return "";
  const starts = startPatterns.map((pattern) => compact.search(pattern)).filter((index) => index >= 0);
  if (!starts.length) return "";
  const start = Math.min(...starts);
  const tail = compact.slice(start);
  const ends = endPatterns.map((pattern) => {
    const index = tail.search(pattern);
    return index > 0 ? index : -1;
  }).filter((index) => index >= 0);
  const end = ends.length ? Math.min(...ends) : tail.length;
  return tail.slice(0, end);
}
var init_text_sections = __esm({
  "src/deed/text-sections.js"() {
    "use strict";
    init_utils();
  }
});

// src/deed/area-extract.js
function normalizeLandDeedMarkers(text) {
  return cleanOcrText(text).replace(/\(\s*土\s*\)\s*地/g, "\u571F\u5730").replace(/土\s*地(?=登記|標示|所(?:有|\(有\))權|所有權|他項|面積|坐落|地號)/g, "\u571F\u5730").replace(/土地所\(\s*有\s*\)權部/g, "\u571F\u5730\u6240\u6709\u6B0A\u90E8").replace(/所\(\s*有\s*\)權/g, "\u6240\u6709\u6B0A");
}
function truncate3(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n * 1e3) / 1e3;
}
function normalizeLandShareArea(rawValue, unit, ratio = 1) {
  const numeric = Number(String(rawValue || "").replace(/,/g, ""));
  if (!Number.isFinite(numeric)) return null;
  const adjusted = numeric * ratio;
  const ping = isSquareMeterAreaUnit(unit) ? adjusted / 3.305785 : adjusted;
  const valuePing = truncate3(ping);
  if (valuePing == null) return null;
  return { rawValue: numeric, adjustedValue: truncate3(adjusted), unit, valuePing };
}
function parseRightsRatioFromMatch(match) {
  if (!match) return null;
  if (match.wan != null) {
    const num2 = Number(match.wan);
    return Number.isFinite(num2) ? num2 / 1e4 : null;
  }
  if (match.all) return 1;
  const denom = Number(match.denom);
  const num = Number(match.num);
  if (!Number.isFinite(denom) || !Number.isFinite(num) || denom <= 0) return null;
  return num / denom;
}
var AREA_UNIT_TOKEN, SQM_UNIT_TOKEN, AREA_UNIT_PATTERN, AREA_UNIT_NONCAPTURE, SQM_UNIT_PATTERN;
var init_area_extract = __esm({
  "src/deed/area-extract.js"() {
    "use strict";
    init_utils();
    init_text_sections();
    AREA_UNIT_TOKEN = "\u5E73\u65B9\u516C\u5C3A|\u5E73\u65B9\u516C\u6000|\u5E73[\u65B9\u842C\u4E07\u6587][\u516C]?\u5C3A|\u5E73\u65B9\u516C[\u53F8\u76E1\u5C3D\u5C46\u5C4A]|\u5E73\u65B9?\u7C73|\u5E73\u65B9|m2|\u33A1|\u576A";
    SQM_UNIT_TOKEN = "\u5E73\u65B9\u516C\u5C3A|\u5E73\u65B9\u516C\u6000|\u5E73[\u65B9\u842C\u4E07\u6587][\u516C]?\u5C3A|\u5E73\u65B9\u516C[\u53F8\u76E1\u5C3D\u5C46\u5C4A]|\u5E73\u65B9?\u7C73|\u5E73\u65B9|m2|\u33A1";
    AREA_UNIT_PATTERN = `(${AREA_UNIT_TOKEN})`;
    AREA_UNIT_NONCAPTURE = `(?:${AREA_UNIT_TOKEN})`;
    SQM_UNIT_PATTERN = `(?:${SQM_UNIT_TOKEN})`;
  }
});

// src/deed/land-share.js
function parseLandShareEntries(rawText) {
  const source = normalizeOcrAreaUnits(cleanOcrText(rawText));
  if (!source) return [];
  const compact = source.replace(/\n+/g, " ");
  const areaRe = new RegExp(`(\\d+[\\d,.]*)\\s*${AREA_UNIT_PATTERN}`, "gi");
  const rightRe = /(?:(?<denom>\d{1,12})\s*分之\s*(?<num>\d{1,12})|萬分之\s*(?<wan>\d{1,12})|權利範圍\s*(?<all>全部))/g;
  const areas = [...compact.matchAll(areaRe)].map((m) => ({
    index: m.index || 0,
    end: (m.index || 0) + m[0].length,
    value: m[1],
    unit: m[2],
    used: false
  }));
  const rights = [...compact.matchAll(rightRe)].map((m) => ({
    index: m.index || 0,
    end: (m.index || 0) + m[0].length,
    text: m[0],
    ratio: parseRightsRatioFromMatch(m.groups || {})
  })).filter((item) => item.ratio != null && item.ratio > 0);
  const entries = [];
  for (const right of rights) {
    const candidates = areas.filter((area) => !area.used && Math.abs(area.index - right.index) <= 220).map((area) => {
      const before = area.index < right.index;
      const distance = before ? right.index - area.end : area.index - right.end;
      return { area, distance: Math.abs(distance), before };
    }).sort((a, b) => a.before === b.before ? a.distance - b.distance : a.before ? -1 : 1);
    if (!candidates.length) continue;
    const chosen = candidates[0].area;
    const normalized = normalizeLandShareArea(chosen.value, chosen.unit, right.ratio);
    if (!normalized) continue;
    chosen.used = true;
    entries.push({
      area: normalized.rawValue,
      areaText: chosen.value,
      unit: chosen.unit,
      ratio: +right.ratio.toFixed(8),
      rights: right.text,
      valuePing: normalized.valuePing
    });
  }
  return entries;
}
function parseLandAreasFromLabelSection(rawText) {
  const compactRaw = compactOcrText(rawText);
  const hasExplicitLandSection = /土地標示部|土地標示/.test(compactRaw);
  const section = sliceCompactSection(
    rawText,
    hasExplicitLandSection ? [/土地標示部/, /土地標示/] : [/土地面積/, /地積/],
    [/土地所有權部/, /土地他項權利部/, /建物標示部/, /建物所有權部/, /建物他項權利部/]
  );
  if (!section && /建物標示部/.test(compactRaw)) return [];
  const source = section || (/土地面積|地積/.test(compactRaw) ? compactRaw : "");
  if (!source) return [];
  const matches = [];
  const seen = /* @__PURE__ */ new Set();
  const pushMatch = (match) => {
    const key = `${match.index || 0}:${match[1]}:${match[2]}`;
    if (seen.has(key)) return;
    const normalized = normalizeLandShareArea(match[1], match[2]);
    if (!normalized) return;
    seen.add(key);
    matches.push({
      index: match.index || 0,
      area: normalized.rawValue,
      areaText: match[1],
      unit: match[2],
      valuePing: normalized.valuePing
    });
  };
  const labelPattern = hasExplicitLandSection ? "(?:\u571F\u5730\u9762\u7A4D|\u5730\u7A4D|\u9762\u7A4D)" : "(?:\u571F\u5730\u9762\u7A4D|\u5730\u7A4D)";
  for (const match of source.matchAll(new RegExp(`${labelPattern}[:\uFF1A]?[^\\d]{0,40}(\\d+[\\d,.]*)${AREA_UNIT_PATTERN}`, "gi"))) {
    pushMatch(match);
  }
  if (!matches.length && hasExplicitLandSection) {
    for (const match of source.matchAll(new RegExp(`(\\d+[\\d,.]*)${AREA_UNIT_PATTERN}`, "gi"))) {
      pushMatch(match);
    }
  }
  return matches.sort((a, b) => a.index - b.index);
}
function parseLandRightsFromOwnershipSection(rawText) {
  const endPatterns = [/土地他項權利部/, /建物標示部/, /建物所有權部/, /建物他項權利部/];
  const ownershipByExplicit = sliceCompactSection(rawText, [/土地所有權部/, /所有權人/], endPatterns);
  const ownership = ownershipByExplicit || sliceCompactSection(rawText, [/權利範圍/], endPatterns);
  const textSource = cleanOcrText(rawText);
  const lineRights = [];
  for (const line of textSource.split(/\n+/)) {
    const compactLine = compactOcrText(line);
    if (!compactLine || /歷次取得權利範圍/.test(compactLine)) continue;
    if (!/^權利範圍/.test(compactLine)) continue;
    const m = compactLine.match(/^權利範圍[:：*]*(?:(\d{1,12})分之(\d{1,12})|萬分之(\d{1,12})|(全部))/);
    if (!m) continue;
    let ratio = null;
    let denomText = "";
    let numText = "";
    if (m[1] && m[2]) {
      denomText = m[1];
      numText = m[2];
      const denom = Number(denomText);
      const num = Number(numText);
      if (denom > 0 && Number.isFinite(num)) ratio = num / denom;
    } else if (m[3]) {
      denomText = "10000";
      numText = m[3];
      ratio = Number(numText) / 1e4;
    } else if (m[4]) {
      denomText = "1";
      numText = "1";
      ratio = 1;
    }
    if (ratio != null && ratio > 0 && ratio <= 1) {
      lineRights.push({ index: lineRights.length, text: `${denomText}\u5206\u4E4B${numText}`, ratio, denomText, numText });
    }
  }
  if (lineRights.length) return lineRights;
  const source = (ownership || compactOcrText(rawText)).replace(/歷次取得權利範圍[:：*]*(?:\d{1,12}分之\d{1,12}|萬分之\d{1,12}|全部)[*]*/g, "");
  const rights = [];
  const rightsRe = /(?:(\d{1,12})分之(\d{1,12})|萬分之(\d{1,12})|權利範圍[:：]?(全部)|權利範圍[:：]?[^\d]{0,20}(全部))/g;
  let match;
  while ((match = rightsRe.exec(source)) !== null) {
    const prefix = source.slice(Math.max(0, (match.index || 0) - 8), match.index || 0);
    if (/歷次取得$/.test(prefix)) continue;
    let ratio = null;
    let denomText = "";
    let numText = "";
    if (match[1] && match[2]) {
      denomText = match[1];
      numText = match[2];
      const denom = Number(denomText);
      const num = Number(numText);
      if (Number.isFinite(denom) && denom > 0 && Number.isFinite(num)) ratio = num / denom;
    } else if (match[3]) {
      denomText = "10000";
      numText = match[3];
      const wan = Number(numText);
      if (Number.isFinite(wan)) ratio = wan / 1e4;
    } else if (match[4] || match[5]) {
      denomText = "1";
      numText = "1";
      ratio = 1;
    }
    if (ratio != null && ratio > 0 && ratio <= 1) {
      rights.push({ index: match.index || 0, text: match[0], ratio, denomText, numText });
    }
  }
  return rights.filter((item, index) => !rights.some((other, otherIndex) => otherIndex !== index && other.denomText === item.denomText && item.numText.length > other.numText.length && item.numText.startsWith(other.numText)));
}
function dedupeLandShareEntries(entries) {
  const source = entries || [];
  const keyOf = (entry) => {
    const parcelKey = String(entry.parcel || "").trim();
    const areaKey = Number(entry.area || entry.areaText || 0).toFixed(6);
    const ratioKey = Number(entry.ratio || 0).toFixed(10);
    return `${parcelKey}|${areaKey}|${entry.unit || ""}|${ratioKey}|${String(entry.rights || "").trim()}`;
  };
  const result = [];
  const seen = /* @__PURE__ */ new Set();
  for (const entry of source) {
    const key = keyOf(entry);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(entry);
  }
  return result;
}
function mergeDuplicateLandRights(rights) {
  const source = rights || [];
  const keyOf = (right) => `${right.denomText || ""}|${right.numText || ""}|${Number(right.ratio || 0).toFixed(10)}`;
  const counts = source.reduce((map, right) => {
    const key = keyOf(right);
    map.set(key, (map.get(key) || 0) + 1);
    return map;
  }, /* @__PURE__ */ new Map());
  const result = [];
  const seen = /* @__PURE__ */ new Set();
  for (const right of source) {
    const key = keyOf(right);
    if (counts.get(key) <= 2 && seen.has(key)) continue;
    seen.add(key);
    result.push(right);
  }
  return result;
}
function formatRightsFromRatio(ratio, rightsText = "") {
  const r = Number(ratio);
  if (Number.isFinite(r) && Math.abs(r - 1) < 1e-9) return "1\u5206\u4E4B1";
  return rightsText || "";
}
function detectLandParcelLabel(section) {
  const compact = compactOcrText(section);
  const match = compact.match(/([\u4e00-\u9fff]{1,16}段)?([0-9０-９]{1,6}[-－][0-9０-９]{1,6})地號/);
  if (!match) return "";
  let segment = match[1] || "";
  segment = segment.replace(/^.*[市縣區鄉鎮]/, "");
  const parcelNo = toHalfWidth(match[2]).replace(/－/g, "-");
  return `${segment}${parcelNo}\u5730\u865F`;
}
function splitLandRegistrationSections(rawText) {
  const compact = compactOcrText(rawText);
  if (!compact) return [];
  const starts = [];
  const markerRe = /土地標示部/g;
  let marker;
  while ((marker = markerRe.exec(compact)) !== null) {
    starts.push(marker.index);
  }
  if (!starts.length) return [];
  return starts.map((start, index) => {
    const nextLand = starts[index + 1] ?? compact.length;
    const nextBuilding = compact.indexOf("\u5EFA\u7269\u6A19\u793A\u90E8", start + 1);
    const endCandidates = [nextLand, nextBuilding].filter((value) => Number.isFinite(value) && value > start);
    const end = endCandidates.length ? Math.min(...endCandidates) : compact.length;
    const headerStart = Math.max(0, start - 300);
    return compact.slice(headerStart, end);
  }).filter(Boolean);
}
function sumLandShareFromSeparatedLandSections(rawText) {
  const landSections = splitLandRegistrationSections(rawText);
  if (landSections.length) {
    const sectionEntries = [];
    for (const section of landSections) {
      const areas2 = parseLandAreasFromLabelSection(section);
      const rights2 = parseLandRightsFromOwnershipSection(section);
      if (!areas2.length || !rights2.length) continue;
      const ratio = Math.min(1, rights2.reduce((sum, item) => sum + item.ratio, 0));
      if (!Number.isFinite(ratio) || ratio <= 0) continue;
      const rightsText = formatRightsFromRatio(ratio, rights2.map((item) => item.text).join("\u3001"));
      const parcel = detectLandParcelLabel(section);
      for (const area of areas2) {
        const normalized = normalizeLandShareArea(area.areaText || area.area, area.unit, ratio);
        if (!normalized) continue;
        sectionEntries.push({
          parcel,
          area: area.area,
          areaText: area.areaText,
          unit: area.unit,
          ratio: +ratio.toFixed(8),
          rights: rightsText,
          valuePing: normalized.valuePing
        });
      }
    }
    if (sectionEntries.length) {
      const valuePing2 = truncate3(sectionEntries.reduce((sum, item) => sum + item.valuePing, 0));
      return { valuePing: valuePing2, entries: sectionEntries };
    }
  }
  const areas = parseLandAreasFromLabelSection(rawText);
  const rights = mergeDuplicateLandRights(parseLandRightsFromOwnershipSection(rawText));
  if (!areas.length || !rights.length) return { valuePing: null, entries: [] };
  const entries = [];
  if (rights.length === 1) {
    for (const area of areas) {
      entries.push({
        area: area.area,
        areaText: area.areaText,
        unit: area.unit,
        ratio: +rights[0].ratio.toFixed(8),
        rights: rights[0].text,
        valuePing: normalizeLandShareArea(area.areaText || area.area, area.unit, rights[0].ratio).valuePing
      });
    }
  } else if (areas.length === 1) {
    const ratio = Math.min(1, rights.reduce((sum, item) => sum + item.ratio, 0));
    const rightsText = formatRightsFromRatio(ratio, rights.map((item) => item.text).join("\u3001"));
    entries.push({
      area: areas[0].area,
      areaText: areas[0].areaText,
      unit: areas[0].unit,
      ratio: +ratio.toFixed(8),
      rights: rightsText,
      valuePing: normalizeLandShareArea(areas[0].areaText || areas[0].area, areas[0].unit, ratio).valuePing
    });
  } else {
    const count = Math.min(areas.length, rights.length);
    for (let index = 0; index < count; index += 1) {
      entries.push({
        area: areas[index].area,
        areaText: areas[index].areaText,
        unit: areas[index].unit,
        ratio: +rights[index].ratio.toFixed(8),
        rights: rights[index].text,
        valuePing: normalizeLandShareArea(areas[index].areaText || areas[index].area, areas[index].unit, rights[index].ratio).valuePing
      });
    }
  }
  const uniqueEntries = dedupeLandShareEntries(entries);
  const valuePing = truncate3(uniqueEntries.reduce((sum, item) => sum + item.valuePing, 0));
  return { valuePing, entries: uniqueEntries };
}
function sumLandSharePing(rawText) {
  const entries = dedupeLandShareEntries(parseLandShareEntries(rawText));
  if (!entries.length) return { valuePing: null, entries };
  const valuePing = truncate3(entries.reduce((sum, item) => sum + item.valuePing, 0));
  return { valuePing, entries };
}
function formatLandShareEntry(entry) {
  const parcel = entry.parcel ? `${entry.parcel} ` : "";
  const areaText = entry.areaText || entry.area || "";
  const unit = entry.unit || "\u5E73\u65B9\u516C\u5C3A";
  const rights = entry.rights || formatRightsFromRatio(entry.ratio);
  const subtotal = entry.valuePing != null ? ` = ${formatNum(entry.valuePing, 3)} \u576A` : "";
  return `${parcel}\u571F\u5730\u9762\u7A4D ${areaText}${unit} \u6B0A\u5229\u7BC4\u570D ${rights}${subtotal}`.trim();
}
function extractLandShareFromOcrText(rawText) {
  const text = normalizeLandDeedMarkers(rawText);
  const compact = compactOcrText(text);
  const hasExplicitLandSection = /土地標示部|土地標示/.test(compact);
  const hasStandaloneLandArea = /(?:土地面積|地積)[:：]?[^\d]{0,40}\d/.test(compact);
  if (!hasExplicitLandSection && /建物標示部/.test(compact)) return { valuePing: null, entries: [] };
  if (!hasExplicitLandSection && !hasStandaloneLandArea) return { valuePing: null, entries: [] };
  const direct = sumLandSharePing(text);
  const separated = sumLandShareFromSeparatedLandSections(text);
  if (separated.valuePing != null) return separated;
  return direct.valuePing != null ? direct : separated;
}
var init_land_share = __esm({
  "src/deed/land-share.js"() {
    "use strict";
    init_utils();
    init_area_extract();
    init_text_sections();
    init_text_sections();
  }
});

// landValueTaxCpiData.js
var LAND_VALUE_TAX_CPI_METADATA, LAND_VALUE_TAX_CPI_DATA;
var init_landValueTaxCpiData = __esm({
  "landValueTaxCpiData.js"() {
    "use strict";
    LAND_VALUE_TAX_CPI_METADATA = {
      "generatedAt": "2026-05-18T22:48:37.515Z",
      "sourceFile": "cpispl.xls",
      "sheetName": "CPI",
      "base": "\u6C11\u570B110\u5E74=100",
      "count": 808,
      "firstPeriod": "048/01",
      "latestPeriod": "115/04"
    };
    LAND_VALUE_TAX_CPI_DATA = [
      {
        "period": "048/01",
        "year": 48,
        "month": 1,
        "index": 9.86
      },
      {
        "period": "048/02",
        "year": 48,
        "month": 2,
        "index": 9.94
      },
      {
        "period": "048/03",
        "year": 48,
        "month": 3,
        "index": 10.09
      },
      {
        "period": "048/04",
        "year": 48,
        "month": 4,
        "index": 10.08
      },
      {
        "period": "048/05",
        "year": 48,
        "month": 5,
        "index": 10.09
      },
      {
        "period": "048/06",
        "year": 48,
        "month": 6,
        "index": 10.26
      },
      {
        "period": "048/07",
        "year": 48,
        "month": 7,
        "index": 10.58
      },
      {
        "period": "048/08",
        "year": 48,
        "month": 8,
        "index": 11.16
      },
      {
        "period": "048/09",
        "year": 48,
        "month": 9,
        "index": 11.5
      },
      {
        "period": "048/10",
        "year": 48,
        "month": 10,
        "index": 11.32
      },
      {
        "period": "048/11",
        "year": 48,
        "month": 11,
        "index": 11
      },
      {
        "period": "048/12",
        "year": 48,
        "month": 12,
        "index": 10.99
      },
      {
        "period": "049/01",
        "year": 49,
        "month": 1,
        "index": 11.09
      },
      {
        "period": "049/02",
        "year": 49,
        "month": 2,
        "index": 11.34
      },
      {
        "period": "049/03",
        "year": 49,
        "month": 3,
        "index": 11.74
      },
      {
        "period": "049/04",
        "year": 49,
        "month": 4,
        "index": 12.3
      },
      {
        "period": "049/05",
        "year": 49,
        "month": 5,
        "index": 12.24
      },
      {
        "period": "049/06",
        "year": 49,
        "month": 6,
        "index": 12.6
      },
      {
        "period": "049/07",
        "year": 49,
        "month": 7,
        "index": 12.69
      },
      {
        "period": "049/08",
        "year": 49,
        "month": 8,
        "index": 13.25
      },
      {
        "period": "049/09",
        "year": 49,
        "month": 9,
        "index": 13.42
      },
      {
        "period": "049/10",
        "year": 49,
        "month": 10,
        "index": 13.3
      },
      {
        "period": "049/11",
        "year": 49,
        "month": 11,
        "index": 13.31
      },
      {
        "period": "049/12",
        "year": 49,
        "month": 12,
        "index": 13.07
      },
      {
        "period": "050/01",
        "year": 50,
        "month": 1,
        "index": 13.1
      },
      {
        "period": "050/02",
        "year": 50,
        "month": 2,
        "index": 13.35
      },
      {
        "period": "050/03",
        "year": 50,
        "month": 3,
        "index": 13.35
      },
      {
        "period": "050/04",
        "year": 50,
        "month": 4,
        "index": 13.45
      },
      {
        "period": "050/05",
        "year": 50,
        "month": 5,
        "index": 13.46
      },
      {
        "period": "050/06",
        "year": 50,
        "month": 6,
        "index": 13.46
      },
      {
        "period": "050/07",
        "year": 50,
        "month": 7,
        "index": 13.4
      },
      {
        "period": "050/08",
        "year": 50,
        "month": 8,
        "index": 13.56
      },
      {
        "period": "050/09",
        "year": 50,
        "month": 9,
        "index": 13.77
      },
      {
        "period": "050/10",
        "year": 50,
        "month": 10,
        "index": 13.86
      },
      {
        "period": "050/11",
        "year": 50,
        "month": 11,
        "index": 13.75
      },
      {
        "period": "050/12",
        "year": 50,
        "month": 12,
        "index": 13.62
      },
      {
        "period": "051/01",
        "year": 51,
        "month": 1,
        "index": 13.53
      },
      {
        "period": "051/02",
        "year": 51,
        "month": 2,
        "index": 13.68
      },
      {
        "period": "051/03",
        "year": 51,
        "month": 3,
        "index": 13.63
      },
      {
        "period": "051/04",
        "year": 51,
        "month": 4,
        "index": 13.69
      },
      {
        "period": "051/05",
        "year": 51,
        "month": 5,
        "index": 13.87
      },
      {
        "period": "051/06",
        "year": 51,
        "month": 6,
        "index": 13.79
      },
      {
        "period": "051/07",
        "year": 51,
        "month": 7,
        "index": 13.58
      },
      {
        "period": "051/08",
        "year": 51,
        "month": 8,
        "index": 13.72
      },
      {
        "period": "051/09",
        "year": 51,
        "month": 9,
        "index": 14.05
      },
      {
        "period": "051/10",
        "year": 51,
        "month": 10,
        "index": 14.31
      },
      {
        "period": "051/11",
        "year": 51,
        "month": 11,
        "index": 14.12
      },
      {
        "period": "051/12",
        "year": 51,
        "month": 12,
        "index": 14.01
      },
      {
        "period": "052/01",
        "year": 52,
        "month": 1,
        "index": 14.15
      },
      {
        "period": "052/02",
        "year": 52,
        "month": 2,
        "index": 14.16
      },
      {
        "period": "052/03",
        "year": 52,
        "month": 3,
        "index": 14.19
      },
      {
        "period": "052/04",
        "year": 52,
        "month": 4,
        "index": 14.28
      },
      {
        "period": "052/05",
        "year": 52,
        "month": 5,
        "index": 14.16
      },
      {
        "period": "052/06",
        "year": 52,
        "month": 6,
        "index": 14.03
      },
      {
        "period": "052/07",
        "year": 52,
        "month": 7,
        "index": 13.86
      },
      {
        "period": "052/08",
        "year": 52,
        "month": 8,
        "index": 13.89
      },
      {
        "period": "052/09",
        "year": 52,
        "month": 9,
        "index": 14.32
      },
      {
        "period": "052/10",
        "year": 52,
        "month": 10,
        "index": 14.31
      },
      {
        "period": "052/11",
        "year": 52,
        "month": 11,
        "index": 14.14
      },
      {
        "period": "052/12",
        "year": 52,
        "month": 12,
        "index": 14.1
      },
      {
        "period": "053/01",
        "year": 53,
        "month": 1,
        "index": 14.12
      },
      {
        "period": "053/02",
        "year": 53,
        "month": 2,
        "index": 14.14
      },
      {
        "period": "053/03",
        "year": 53,
        "month": 3,
        "index": 14.09
      },
      {
        "period": "053/04",
        "year": 53,
        "month": 4,
        "index": 14
      },
      {
        "period": "053/05",
        "year": 53,
        "month": 5,
        "index": 14.05
      },
      {
        "period": "053/06",
        "year": 53,
        "month": 6,
        "index": 13.94
      },
      {
        "period": "053/07",
        "year": 53,
        "month": 7,
        "index": 13.83
      },
      {
        "period": "053/08",
        "year": 53,
        "month": 8,
        "index": 13.99
      },
      {
        "period": "053/09",
        "year": 53,
        "month": 9,
        "index": 14.19
      },
      {
        "period": "053/10",
        "year": 53,
        "month": 10,
        "index": 14.4
      },
      {
        "period": "053/11",
        "year": 53,
        "month": 11,
        "index": 14.38
      },
      {
        "period": "053/12",
        "year": 53,
        "month": 12,
        "index": 14.19
      },
      {
        "period": "054/01",
        "year": 54,
        "month": 1,
        "index": 14
      },
      {
        "period": "054/02",
        "year": 54,
        "month": 2,
        "index": 13.96
      },
      {
        "period": "054/03",
        "year": 54,
        "month": 3,
        "index": 13.91
      },
      {
        "period": "054/04",
        "year": 54,
        "month": 4,
        "index": 13.96
      },
      {
        "period": "054/05",
        "year": 54,
        "month": 5,
        "index": 14.03
      },
      {
        "period": "054/06",
        "year": 54,
        "month": 6,
        "index": 14.1
      },
      {
        "period": "054/07",
        "year": 54,
        "month": 7,
        "index": 14.12
      },
      {
        "period": "054/08",
        "year": 54,
        "month": 8,
        "index": 14.2
      },
      {
        "period": "054/09",
        "year": 54,
        "month": 9,
        "index": 14.27
      },
      {
        "period": "054/10",
        "year": 54,
        "month": 10,
        "index": 14.16
      },
      {
        "period": "054/11",
        "year": 54,
        "month": 11,
        "index": 14.19
      },
      {
        "period": "054/12",
        "year": 54,
        "month": 12,
        "index": 14.27
      },
      {
        "period": "055/01",
        "year": 55,
        "month": 1,
        "index": 14.23
      },
      {
        "period": "055/02",
        "year": 55,
        "month": 2,
        "index": 14.03
      },
      {
        "period": "055/03",
        "year": 55,
        "month": 3,
        "index": 14.01
      },
      {
        "period": "055/04",
        "year": 55,
        "month": 4,
        "index": 14.11
      },
      {
        "period": "055/05",
        "year": 55,
        "month": 5,
        "index": 14.14
      },
      {
        "period": "055/06",
        "year": 55,
        "month": 6,
        "index": 14.47
      },
      {
        "period": "055/07",
        "year": 55,
        "month": 7,
        "index": 14.49
      },
      {
        "period": "055/08",
        "year": 55,
        "month": 8,
        "index": 14.42
      },
      {
        "period": "055/09",
        "year": 55,
        "month": 9,
        "index": 14.72
      },
      {
        "period": "055/10",
        "year": 55,
        "month": 10,
        "index": 14.82
      },
      {
        "period": "055/11",
        "year": 55,
        "month": 11,
        "index": 14.62
      },
      {
        "period": "055/12",
        "year": 55,
        "month": 12,
        "index": 14.51
      },
      {
        "period": "056/01",
        "year": 56,
        "month": 1,
        "index": 14.62
      },
      {
        "period": "056/02",
        "year": 56,
        "month": 2,
        "index": 14.9
      },
      {
        "period": "056/03",
        "year": 56,
        "month": 3,
        "index": 14.64
      },
      {
        "period": "056/04",
        "year": 56,
        "month": 4,
        "index": 14.61
      },
      {
        "period": "056/05",
        "year": 56,
        "month": 5,
        "index": 14.67
      },
      {
        "period": "056/06",
        "year": 56,
        "month": 6,
        "index": 14.78
      },
      {
        "period": "056/07",
        "year": 56,
        "month": 7,
        "index": 14.97
      },
      {
        "period": "056/08",
        "year": 56,
        "month": 8,
        "index": 14.94
      },
      {
        "period": "056/09",
        "year": 56,
        "month": 9,
        "index": 15.1
      },
      {
        "period": "056/10",
        "year": 56,
        "month": 10,
        "index": 15.02
      },
      {
        "period": "056/11",
        "year": 56,
        "month": 11,
        "index": 15
      },
      {
        "period": "056/12",
        "year": 56,
        "month": 12,
        "index": 15.15
      },
      {
        "period": "057/01",
        "year": 57,
        "month": 1,
        "index": 15.22
      },
      {
        "period": "057/02",
        "year": 57,
        "month": 2,
        "index": 15.11
      },
      {
        "period": "057/03",
        "year": 57,
        "month": 3,
        "index": 15.15
      },
      {
        "period": "057/04",
        "year": 57,
        "month": 4,
        "index": 15.8
      },
      {
        "period": "057/05",
        "year": 57,
        "month": 5,
        "index": 15.88
      },
      {
        "period": "057/06",
        "year": 57,
        "month": 6,
        "index": 16.17
      },
      {
        "period": "057/07",
        "year": 57,
        "month": 7,
        "index": 16.44
      },
      {
        "period": "057/08",
        "year": 57,
        "month": 8,
        "index": 16.86
      },
      {
        "period": "057/09",
        "year": 57,
        "month": 9,
        "index": 16.61
      },
      {
        "period": "057/10",
        "year": 57,
        "month": 10,
        "index": 16.72
      },
      {
        "period": "057/11",
        "year": 57,
        "month": 11,
        "index": 16.4
      },
      {
        "period": "057/12",
        "year": 57,
        "month": 12,
        "index": 16.07
      },
      {
        "period": "058/01",
        "year": 58,
        "month": 1,
        "index": 16.2
      },
      {
        "period": "058/02",
        "year": 58,
        "month": 2,
        "index": 16.41
      },
      {
        "period": "058/03",
        "year": 58,
        "month": 3,
        "index": 16.35
      },
      {
        "period": "058/04",
        "year": 58,
        "month": 4,
        "index": 16.43
      },
      {
        "period": "058/05",
        "year": 58,
        "month": 5,
        "index": 16.25
      },
      {
        "period": "058/06",
        "year": 58,
        "month": 6,
        "index": 16.39
      },
      {
        "period": "058/07",
        "year": 58,
        "month": 7,
        "index": 16.73
      },
      {
        "period": "058/08",
        "year": 58,
        "month": 8,
        "index": 17.06
      },
      {
        "period": "058/09",
        "year": 58,
        "month": 9,
        "index": 17.05
      },
      {
        "period": "058/10",
        "year": 58,
        "month": 10,
        "index": 18.6
      },
      {
        "period": "058/11",
        "year": 58,
        "month": 11,
        "index": 17.79
      },
      {
        "period": "058/12",
        "year": 58,
        "month": 12,
        "index": 17
      },
      {
        "period": "059/01",
        "year": 59,
        "month": 1,
        "index": 16.8
      },
      {
        "period": "059/02",
        "year": 59,
        "month": 2,
        "index": 17.08
      },
      {
        "period": "059/03",
        "year": 59,
        "month": 3,
        "index": 17.19
      },
      {
        "period": "059/04",
        "year": 59,
        "month": 4,
        "index": 17.27
      },
      {
        "period": "059/05",
        "year": 59,
        "month": 5,
        "index": 17.19
      },
      {
        "period": "059/06",
        "year": 59,
        "month": 6,
        "index": 17.05
      },
      {
        "period": "059/07",
        "year": 59,
        "month": 7,
        "index": 17.33
      },
      {
        "period": "059/08",
        "year": 59,
        "month": 8,
        "index": 17.84
      },
      {
        "period": "059/09",
        "year": 59,
        "month": 9,
        "index": 18.3
      },
      {
        "period": "059/10",
        "year": 59,
        "month": 10,
        "index": 18.02
      },
      {
        "period": "059/11",
        "year": 59,
        "month": 11,
        "index": 17.8
      },
      {
        "period": "059/12",
        "year": 59,
        "month": 12,
        "index": 17.63
      },
      {
        "period": "060/01",
        "year": 60,
        "month": 1,
        "index": 17.95
      },
      {
        "period": "060/02",
        "year": 60,
        "month": 2,
        "index": 17.88
      },
      {
        "period": "060/03",
        "year": 60,
        "month": 3,
        "index": 17.79
      },
      {
        "period": "060/04",
        "year": 60,
        "month": 4,
        "index": 17.75
      },
      {
        "period": "060/05",
        "year": 60,
        "month": 5,
        "index": 17.77
      },
      {
        "period": "060/06",
        "year": 60,
        "month": 6,
        "index": 17.77
      },
      {
        "period": "060/07",
        "year": 60,
        "month": 7,
        "index": 17.78
      },
      {
        "period": "060/08",
        "year": 60,
        "month": 8,
        "index": 18.09
      },
      {
        "period": "060/09",
        "year": 60,
        "month": 9,
        "index": 18.08
      },
      {
        "period": "060/10",
        "year": 60,
        "month": 10,
        "index": 18.2
      },
      {
        "period": "060/11",
        "year": 60,
        "month": 11,
        "index": 18.15
      },
      {
        "period": "060/12",
        "year": 60,
        "month": 12,
        "index": 18.11
      },
      {
        "period": "061/01",
        "year": 61,
        "month": 1,
        "index": 17.84
      },
      {
        "period": "061/02",
        "year": 61,
        "month": 2,
        "index": 18.22
      },
      {
        "period": "061/03",
        "year": 61,
        "month": 3,
        "index": 18.18
      },
      {
        "period": "061/04",
        "year": 61,
        "month": 4,
        "index": 18.2
      },
      {
        "period": "061/05",
        "year": 61,
        "month": 5,
        "index": 18.29
      },
      {
        "period": "061/06",
        "year": 61,
        "month": 6,
        "index": 18.48
      },
      {
        "period": "061/07",
        "year": 61,
        "month": 7,
        "index": 18.64
      },
      {
        "period": "061/08",
        "year": 61,
        "month": 8,
        "index": 19.3
      },
      {
        "period": "061/09",
        "year": 61,
        "month": 9,
        "index": 19.25
      },
      {
        "period": "061/10",
        "year": 61,
        "month": 10,
        "index": 18.5
      },
      {
        "period": "061/11",
        "year": 61,
        "month": 11,
        "index": 18.26
      },
      {
        "period": "061/12",
        "year": 61,
        "month": 12,
        "index": 18.58
      },
      {
        "period": "062/01",
        "year": 62,
        "month": 1,
        "index": 18.1
      },
      {
        "period": "062/02",
        "year": 62,
        "month": 2,
        "index": 18.36
      },
      {
        "period": "062/03",
        "year": 62,
        "month": 3,
        "index": 18.3
      },
      {
        "period": "062/04",
        "year": 62,
        "month": 4,
        "index": 18.57
      },
      {
        "period": "062/05",
        "year": 62,
        "month": 5,
        "index": 18.81
      },
      {
        "period": "062/06",
        "year": 62,
        "month": 6,
        "index": 19.01
      },
      {
        "period": "062/07",
        "year": 62,
        "month": 7,
        "index": 19.55
      },
      {
        "period": "062/08",
        "year": 62,
        "month": 8,
        "index": 19.98
      },
      {
        "period": "062/09",
        "year": 62,
        "month": 9,
        "index": 20.82
      },
      {
        "period": "062/10",
        "year": 62,
        "month": 10,
        "index": 22.46
      },
      {
        "period": "062/11",
        "year": 62,
        "month": 11,
        "index": 22.91
      },
      {
        "period": "062/12",
        "year": 62,
        "month": 12,
        "index": 23.04
      },
      {
        "period": "063/01",
        "year": 63,
        "month": 1,
        "index": 25.3
      },
      {
        "period": "063/02",
        "year": 63,
        "month": 2,
        "index": 29.14
      },
      {
        "period": "063/03",
        "year": 63,
        "month": 3,
        "index": 29.54
      },
      {
        "period": "063/04",
        "year": 63,
        "month": 4,
        "index": 29.34
      },
      {
        "period": "063/05",
        "year": 63,
        "month": 5,
        "index": 29.1
      },
      {
        "period": "063/06",
        "year": 63,
        "month": 6,
        "index": 29.01
      },
      {
        "period": "063/07",
        "year": 63,
        "month": 7,
        "index": 29.39
      },
      {
        "period": "063/08",
        "year": 63,
        "month": 8,
        "index": 29.72
      },
      {
        "period": "063/09",
        "year": 63,
        "month": 9,
        "index": 30.67
      },
      {
        "period": "063/10",
        "year": 63,
        "month": 10,
        "index": 30.62
      },
      {
        "period": "063/11",
        "year": 63,
        "month": 11,
        "index": 31.06
      },
      {
        "period": "063/12",
        "year": 63,
        "month": 12,
        "index": 30.88
      },
      {
        "period": "064/01",
        "year": 64,
        "month": 1,
        "index": 30.59
      },
      {
        "period": "064/02",
        "year": 64,
        "month": 2,
        "index": 30.63
      },
      {
        "period": "064/03",
        "year": 64,
        "month": 3,
        "index": 30.37
      },
      {
        "period": "064/04",
        "year": 64,
        "month": 4,
        "index": 30.57
      },
      {
        "period": "064/05",
        "year": 64,
        "month": 5,
        "index": 30.59
      },
      {
        "period": "064/06",
        "year": 64,
        "month": 6,
        "index": 31.28
      },
      {
        "period": "064/07",
        "year": 64,
        "month": 7,
        "index": 31.28
      },
      {
        "period": "064/08",
        "year": 64,
        "month": 8,
        "index": 31.39
      },
      {
        "period": "064/09",
        "year": 64,
        "month": 9,
        "index": 31.35
      },
      {
        "period": "064/10",
        "year": 64,
        "month": 10,
        "index": 31.76
      },
      {
        "period": "064/11",
        "year": 64,
        "month": 11,
        "index": 31.5
      },
      {
        "period": "064/12",
        "year": 64,
        "month": 12,
        "index": 30.94
      },
      {
        "period": "065/01",
        "year": 65,
        "month": 1,
        "index": 31.48
      },
      {
        "period": "065/02",
        "year": 65,
        "month": 2,
        "index": 31.59
      },
      {
        "period": "065/03",
        "year": 65,
        "month": 3,
        "index": 31.84
      },
      {
        "period": "065/04",
        "year": 65,
        "month": 4,
        "index": 31.92
      },
      {
        "period": "065/05",
        "year": 65,
        "month": 5,
        "index": 31.76
      },
      {
        "period": "065/06",
        "year": 65,
        "month": 6,
        "index": 31.63
      },
      {
        "period": "065/07",
        "year": 65,
        "month": 7,
        "index": 31.77
      },
      {
        "period": "065/08",
        "year": 65,
        "month": 8,
        "index": 32
      },
      {
        "period": "065/09",
        "year": 65,
        "month": 9,
        "index": 31.97
      },
      {
        "period": "065/10",
        "year": 65,
        "month": 10,
        "index": 31.8
      },
      {
        "period": "065/11",
        "year": 65,
        "month": 11,
        "index": 31.72
      },
      {
        "period": "065/12",
        "year": 65,
        "month": 12,
        "index": 32.06
      },
      {
        "period": "066/01",
        "year": 66,
        "month": 1,
        "index": 32.49
      },
      {
        "period": "066/02",
        "year": 66,
        "month": 2,
        "index": 33.01
      },
      {
        "period": "066/03",
        "year": 66,
        "month": 3,
        "index": 32.89
      },
      {
        "period": "066/04",
        "year": 66,
        "month": 4,
        "index": 33.14
      },
      {
        "period": "066/05",
        "year": 66,
        "month": 5,
        "index": 33.28
      },
      {
        "period": "066/06",
        "year": 66,
        "month": 6,
        "index": 34.33
      },
      {
        "period": "066/07",
        "year": 66,
        "month": 7,
        "index": 34.36
      },
      {
        "period": "066/08",
        "year": 66,
        "month": 8,
        "index": 35.88
      },
      {
        "period": "066/09",
        "year": 66,
        "month": 9,
        "index": 35.38
      },
      {
        "period": "066/10",
        "year": 66,
        "month": 10,
        "index": 35
      },
      {
        "period": "066/11",
        "year": 66,
        "month": 11,
        "index": 34.4
      },
      {
        "period": "066/12",
        "year": 66,
        "month": 12,
        "index": 34.23
      },
      {
        "period": "067/01",
        "year": 67,
        "month": 1,
        "index": 34.82
      },
      {
        "period": "067/02",
        "year": 67,
        "month": 2,
        "index": 35.08
      },
      {
        "period": "067/03",
        "year": 67,
        "month": 3,
        "index": 35.12
      },
      {
        "period": "067/04",
        "year": 67,
        "month": 4,
        "index": 35.77
      },
      {
        "period": "067/05",
        "year": 67,
        "month": 5,
        "index": 35.75
      },
      {
        "period": "067/06",
        "year": 67,
        "month": 6,
        "index": 35.72
      },
      {
        "period": "067/07",
        "year": 67,
        "month": 7,
        "index": 35.62
      },
      {
        "period": "067/08",
        "year": 67,
        "month": 8,
        "index": 36.27
      },
      {
        "period": "067/09",
        "year": 67,
        "month": 9,
        "index": 36.83
      },
      {
        "period": "067/10",
        "year": 67,
        "month": 10,
        "index": 37.13
      },
      {
        "period": "067/11",
        "year": 67,
        "month": 11,
        "index": 37.01
      },
      {
        "period": "067/12",
        "year": 67,
        "month": 12,
        "index": 36.85
      },
      {
        "period": "068/01",
        "year": 68,
        "month": 1,
        "index": 36.97
      },
      {
        "period": "068/02",
        "year": 68,
        "month": 2,
        "index": 37.14
      },
      {
        "period": "068/03",
        "year": 68,
        "month": 3,
        "index": 37.65
      },
      {
        "period": "068/04",
        "year": 68,
        "month": 4,
        "index": 38.4
      },
      {
        "period": "068/05",
        "year": 68,
        "month": 5,
        "index": 38.73
      },
      {
        "period": "068/06",
        "year": 68,
        "month": 6,
        "index": 39.13
      },
      {
        "period": "068/07",
        "year": 68,
        "month": 7,
        "index": 39.48
      },
      {
        "period": "068/08",
        "year": 68,
        "month": 8,
        "index": 40.5
      },
      {
        "period": "068/09",
        "year": 68,
        "month": 9,
        "index": 41.82
      },
      {
        "period": "068/10",
        "year": 68,
        "month": 10,
        "index": 41.71
      },
      {
        "period": "068/11",
        "year": 68,
        "month": 11,
        "index": 41.11
      },
      {
        "period": "068/12",
        "year": 68,
        "month": 12,
        "index": 41.46
      },
      {
        "period": "069/01",
        "year": 69,
        "month": 1,
        "index": 43.15
      },
      {
        "period": "069/02",
        "year": 69,
        "month": 2,
        "index": 44.01
      },
      {
        "period": "069/03",
        "year": 69,
        "month": 3,
        "index": 44.25
      },
      {
        "period": "069/04",
        "year": 69,
        "month": 4,
        "index": 44.47
      },
      {
        "period": "069/05",
        "year": 69,
        "month": 5,
        "index": 45.31
      },
      {
        "period": "069/06",
        "year": 69,
        "month": 6,
        "index": 46.52
      },
      {
        "period": "069/07",
        "year": 69,
        "month": 7,
        "index": 46.85
      },
      {
        "period": "069/08",
        "year": 69,
        "month": 8,
        "index": 47.92
      },
      {
        "period": "069/09",
        "year": 69,
        "month": 9,
        "index": 49.77
      },
      {
        "period": "069/10",
        "year": 69,
        "month": 10,
        "index": 50.65
      },
      {
        "period": "069/11",
        "year": 69,
        "month": 11,
        "index": 50.72
      },
      {
        "period": "069/12",
        "year": 69,
        "month": 12,
        "index": 50.66
      },
      {
        "period": "070/01",
        "year": 70,
        "month": 1,
        "index": 52.95
      },
      {
        "period": "070/02",
        "year": 70,
        "month": 2,
        "index": 53.85
      },
      {
        "period": "070/03",
        "year": 70,
        "month": 3,
        "index": 54.09
      },
      {
        "period": "070/04",
        "year": 70,
        "month": 4,
        "index": 54.3
      },
      {
        "period": "070/05",
        "year": 70,
        "month": 5,
        "index": 54.09
      },
      {
        "period": "070/06",
        "year": 70,
        "month": 6,
        "index": 54.61
      },
      {
        "period": "070/07",
        "year": 70,
        "month": 7,
        "index": 54.82
      },
      {
        "period": "070/08",
        "year": 70,
        "month": 8,
        "index": 55.36
      },
      {
        "period": "070/09",
        "year": 70,
        "month": 9,
        "index": 56.02
      },
      {
        "period": "070/10",
        "year": 70,
        "month": 10,
        "index": 55.71
      },
      {
        "period": "070/11",
        "year": 70,
        "month": 11,
        "index": 55.34
      },
      {
        "period": "070/12",
        "year": 70,
        "month": 12,
        "index": 55.26
      },
      {
        "period": "071/01",
        "year": 71,
        "month": 1,
        "index": 55.62
      },
      {
        "period": "071/02",
        "year": 71,
        "month": 2,
        "index": 55.44
      },
      {
        "period": "071/03",
        "year": 71,
        "month": 3,
        "index": 55.59
      },
      {
        "period": "071/04",
        "year": 71,
        "month": 4,
        "index": 55.73
      },
      {
        "period": "071/05",
        "year": 71,
        "month": 5,
        "index": 56.07
      },
      {
        "period": "071/06",
        "year": 71,
        "month": 6,
        "index": 56.18
      },
      {
        "period": "071/07",
        "year": 71,
        "month": 7,
        "index": 56.15
      },
      {
        "period": "071/08",
        "year": 71,
        "month": 8,
        "index": 57.85
      },
      {
        "period": "071/09",
        "year": 71,
        "month": 9,
        "index": 57.31
      },
      {
        "period": "071/10",
        "year": 71,
        "month": 10,
        "index": 56.85
      },
      {
        "period": "071/11",
        "year": 71,
        "month": 11,
        "index": 56.39
      },
      {
        "period": "071/12",
        "year": 71,
        "month": 12,
        "index": 56.6
      },
      {
        "period": "072/01",
        "year": 72,
        "month": 1,
        "index": 56.62
      },
      {
        "period": "072/02",
        "year": 72,
        "month": 2,
        "index": 57.19
      },
      {
        "period": "072/03",
        "year": 72,
        "month": 3,
        "index": 57.43
      },
      {
        "period": "072/04",
        "year": 72,
        "month": 4,
        "index": 57.68
      },
      {
        "period": "072/05",
        "year": 72,
        "month": 5,
        "index": 57.28
      },
      {
        "period": "072/06",
        "year": 72,
        "month": 6,
        "index": 57.71
      },
      {
        "period": "072/07",
        "year": 72,
        "month": 7,
        "index": 57.06
      },
      {
        "period": "072/08",
        "year": 72,
        "month": 8,
        "index": 57.03
      },
      {
        "period": "072/09",
        "year": 72,
        "month": 9,
        "index": 57.21
      },
      {
        "period": "072/10",
        "year": 72,
        "month": 10,
        "index": 57.19
      },
      {
        "period": "072/11",
        "year": 72,
        "month": 11,
        "index": 56.71
      },
      {
        "period": "072/12",
        "year": 72,
        "month": 12,
        "index": 55.93
      },
      {
        "period": "073/01",
        "year": 73,
        "month": 1,
        "index": 55.97
      },
      {
        "period": "073/02",
        "year": 73,
        "month": 2,
        "index": 56.54
      },
      {
        "period": "073/03",
        "year": 73,
        "month": 3,
        "index": 56.69
      },
      {
        "period": "073/04",
        "year": 73,
        "month": 4,
        "index": 56.8
      },
      {
        "period": "073/05",
        "year": 73,
        "month": 5,
        "index": 57.49
      },
      {
        "period": "073/06",
        "year": 73,
        "month": 6,
        "index": 57.44
      },
      {
        "period": "073/07",
        "year": 73,
        "month": 7,
        "index": 57.28
      },
      {
        "period": "073/08",
        "year": 73,
        "month": 8,
        "index": 57.49
      },
      {
        "period": "073/09",
        "year": 73,
        "month": 9,
        "index": 57.69
      },
      {
        "period": "073/10",
        "year": 73,
        "month": 10,
        "index": 57.46
      },
      {
        "period": "073/11",
        "year": 73,
        "month": 11,
        "index": 57.13
      },
      {
        "period": "073/12",
        "year": 73,
        "month": 12,
        "index": 56.85
      },
      {
        "period": "074/01",
        "year": 74,
        "month": 1,
        "index": 56.88
      },
      {
        "period": "074/02",
        "year": 74,
        "month": 2,
        "index": 57.33
      },
      {
        "period": "074/03",
        "year": 74,
        "month": 3,
        "index": 57.36
      },
      {
        "period": "074/04",
        "year": 74,
        "month": 4,
        "index": 57.08
      },
      {
        "period": "074/05",
        "year": 74,
        "month": 5,
        "index": 56.9
      },
      {
        "period": "074/06",
        "year": 74,
        "month": 6,
        "index": 56.81
      },
      {
        "period": "074/07",
        "year": 74,
        "month": 7,
        "index": 56.87
      },
      {
        "period": "074/08",
        "year": 74,
        "month": 8,
        "index": 56.62
      },
      {
        "period": "074/09",
        "year": 74,
        "month": 9,
        "index": 57.56
      },
      {
        "period": "074/10",
        "year": 74,
        "month": 10,
        "index": 57.5
      },
      {
        "period": "074/11",
        "year": 74,
        "month": 11,
        "index": 56.7
      },
      {
        "period": "074/12",
        "year": 74,
        "month": 12,
        "index": 56.11
      },
      {
        "period": "075/01",
        "year": 75,
        "month": 1,
        "index": 56.64
      },
      {
        "period": "075/02",
        "year": 75,
        "month": 2,
        "index": 56.8
      },
      {
        "period": "075/03",
        "year": 75,
        "month": 3,
        "index": 56.79
      },
      {
        "period": "075/04",
        "year": 75,
        "month": 4,
        "index": 56.93
      },
      {
        "period": "075/05",
        "year": 75,
        "month": 5,
        "index": 57.01
      },
      {
        "period": "075/06",
        "year": 75,
        "month": 6,
        "index": 57.15
      },
      {
        "period": "075/07",
        "year": 75,
        "month": 7,
        "index": 57.01
      },
      {
        "period": "075/08",
        "year": 75,
        "month": 8,
        "index": 57.32
      },
      {
        "period": "075/09",
        "year": 75,
        "month": 9,
        "index": 58.78
      },
      {
        "period": "075/10",
        "year": 75,
        "month": 10,
        "index": 58.65
      },
      {
        "period": "075/11",
        "year": 75,
        "month": 11,
        "index": 57.84
      },
      {
        "period": "075/12",
        "year": 75,
        "month": 12,
        "index": 57.58
      },
      {
        "period": "076/01",
        "year": 76,
        "month": 1,
        "index": 57.43
      },
      {
        "period": "076/02",
        "year": 76,
        "month": 2,
        "index": 57.31
      },
      {
        "period": "076/03",
        "year": 76,
        "month": 3,
        "index": 56.86
      },
      {
        "period": "076/04",
        "year": 76,
        "month": 4,
        "index": 57.06
      },
      {
        "period": "076/05",
        "year": 76,
        "month": 5,
        "index": 57.07
      },
      {
        "period": "076/06",
        "year": 76,
        "month": 6,
        "index": 57.11
      },
      {
        "period": "076/07",
        "year": 76,
        "month": 7,
        "index": 57.77
      },
      {
        "period": "076/08",
        "year": 76,
        "month": 8,
        "index": 58.24
      },
      {
        "period": "076/09",
        "year": 76,
        "month": 9,
        "index": 58.45
      },
      {
        "period": "076/10",
        "year": 76,
        "month": 10,
        "index": 57.93
      },
      {
        "period": "076/11",
        "year": 76,
        "month": 11,
        "index": 58.09
      },
      {
        "period": "076/12",
        "year": 76,
        "month": 12,
        "index": 58.69
      },
      {
        "period": "077/01",
        "year": 77,
        "month": 1,
        "index": 57.74
      },
      {
        "period": "077/02",
        "year": 77,
        "month": 2,
        "index": 57.51
      },
      {
        "period": "077/03",
        "year": 77,
        "month": 3,
        "index": 57.19
      },
      {
        "period": "077/04",
        "year": 77,
        "month": 4,
        "index": 57.26
      },
      {
        "period": "077/05",
        "year": 77,
        "month": 5,
        "index": 57.91
      },
      {
        "period": "077/06",
        "year": 77,
        "month": 6,
        "index": 58.26
      },
      {
        "period": "077/07",
        "year": 77,
        "month": 7,
        "index": 58.26
      },
      {
        "period": "077/08",
        "year": 77,
        "month": 8,
        "index": 59.09
      },
      {
        "period": "077/09",
        "year": 77,
        "month": 9,
        "index": 59.28
      },
      {
        "period": "077/10",
        "year": 77,
        "month": 10,
        "index": 59.7
      },
      {
        "period": "077/11",
        "year": 77,
        "month": 11,
        "index": 59.39
      },
      {
        "period": "077/12",
        "year": 77,
        "month": 12,
        "index": 59.34
      },
      {
        "period": "078/01",
        "year": 78,
        "month": 1,
        "index": 59.34
      },
      {
        "period": "078/02",
        "year": 78,
        "month": 2,
        "index": 59.86
      },
      {
        "period": "078/03",
        "year": 78,
        "month": 3,
        "index": 60.01
      },
      {
        "period": "078/04",
        "year": 78,
        "month": 4,
        "index": 60.54
      },
      {
        "period": "078/05",
        "year": 78,
        "month": 5,
        "index": 60.99
      },
      {
        "period": "078/06",
        "year": 78,
        "month": 6,
        "index": 60.83
      },
      {
        "period": "078/07",
        "year": 78,
        "month": 7,
        "index": 60.54
      },
      {
        "period": "078/08",
        "year": 78,
        "month": 8,
        "index": 61.05
      },
      {
        "period": "078/09",
        "year": 78,
        "month": 9,
        "index": 62.65
      },
      {
        "period": "078/10",
        "year": 78,
        "month": 10,
        "index": 63.25
      },
      {
        "period": "078/11",
        "year": 78,
        "month": 11,
        "index": 61.62
      },
      {
        "period": "078/12",
        "year": 78,
        "month": 12,
        "index": 61.2
      },
      {
        "period": "079/01",
        "year": 79,
        "month": 1,
        "index": 61.63
      },
      {
        "period": "079/02",
        "year": 79,
        "month": 2,
        "index": 61.54
      },
      {
        "period": "079/03",
        "year": 79,
        "month": 3,
        "index": 62
      },
      {
        "period": "079/04",
        "year": 79,
        "month": 4,
        "index": 62.61
      },
      {
        "period": "079/05",
        "year": 79,
        "month": 5,
        "index": 63.27
      },
      {
        "period": "079/06",
        "year": 79,
        "month": 6,
        "index": 63.03
      },
      {
        "period": "079/07",
        "year": 79,
        "month": 7,
        "index": 63.45
      },
      {
        "period": "079/08",
        "year": 79,
        "month": 8,
        "index": 64.5
      },
      {
        "period": "079/09",
        "year": 79,
        "month": 9,
        "index": 66.74
      },
      {
        "period": "079/10",
        "year": 79,
        "month": 10,
        "index": 65.3
      },
      {
        "period": "079/11",
        "year": 79,
        "month": 11,
        "index": 64.04
      },
      {
        "period": "079/12",
        "year": 79,
        "month": 12,
        "index": 63.99
      },
      {
        "period": "080/01",
        "year": 80,
        "month": 1,
        "index": 64.7
      },
      {
        "period": "080/02",
        "year": 80,
        "month": 2,
        "index": 65.09
      },
      {
        "period": "080/03",
        "year": 80,
        "month": 3,
        "index": 64.77
      },
      {
        "period": "080/04",
        "year": 80,
        "month": 4,
        "index": 65.19
      },
      {
        "period": "080/05",
        "year": 80,
        "month": 5,
        "index": 65.41
      },
      {
        "period": "080/06",
        "year": 80,
        "month": 6,
        "index": 65.57
      },
      {
        "period": "080/07",
        "year": 80,
        "month": 7,
        "index": 66.02
      },
      {
        "period": "080/08",
        "year": 80,
        "month": 8,
        "index": 66.17
      },
      {
        "period": "080/09",
        "year": 80,
        "month": 9,
        "index": 66.27
      },
      {
        "period": "080/10",
        "year": 80,
        "month": 10,
        "index": 66.92
      },
      {
        "period": "080/11",
        "year": 80,
        "month": 11,
        "index": 67.12
      },
      {
        "period": "080/12",
        "year": 80,
        "month": 12,
        "index": 66.48
      },
      {
        "period": "081/01",
        "year": 81,
        "month": 1,
        "index": 67.14
      },
      {
        "period": "081/02",
        "year": 81,
        "month": 2,
        "index": 67.73
      },
      {
        "period": "081/03",
        "year": 81,
        "month": 3,
        "index": 67.82
      },
      {
        "period": "081/04",
        "year": 81,
        "month": 4,
        "index": 68.92
      },
      {
        "period": "081/05",
        "year": 81,
        "month": 5,
        "index": 69.15
      },
      {
        "period": "081/06",
        "year": 81,
        "month": 6,
        "index": 68.96
      },
      {
        "period": "081/07",
        "year": 81,
        "month": 7,
        "index": 68.46
      },
      {
        "period": "081/08",
        "year": 81,
        "month": 8,
        "index": 68.15
      },
      {
        "period": "081/09",
        "year": 81,
        "month": 9,
        "index": 70.35
      },
      {
        "period": "081/10",
        "year": 81,
        "month": 10,
        "index": 70.32
      },
      {
        "period": "081/11",
        "year": 81,
        "month": 11,
        "index": 69.2
      },
      {
        "period": "081/12",
        "year": 81,
        "month": 12,
        "index": 68.75
      },
      {
        "period": "082/01",
        "year": 82,
        "month": 1,
        "index": 69.59
      },
      {
        "period": "082/02",
        "year": 82,
        "month": 2,
        "index": 69.8
      },
      {
        "period": "082/03",
        "year": 82,
        "month": 3,
        "index": 70.02
      },
      {
        "period": "082/04",
        "year": 82,
        "month": 4,
        "index": 70.83
      },
      {
        "period": "082/05",
        "year": 82,
        "month": 5,
        "index": 70.59
      },
      {
        "period": "082/06",
        "year": 82,
        "month": 6,
        "index": 71.96
      },
      {
        "period": "082/07",
        "year": 82,
        "month": 7,
        "index": 70.71
      },
      {
        "period": "082/08",
        "year": 82,
        "month": 8,
        "index": 70.42
      },
      {
        "period": "082/09",
        "year": 82,
        "month": 9,
        "index": 70.87
      },
      {
        "period": "082/10",
        "year": 82,
        "month": 10,
        "index": 71.18
      },
      {
        "period": "082/11",
        "year": 82,
        "month": 11,
        "index": 71.34
      },
      {
        "period": "082/12",
        "year": 82,
        "month": 12,
        "index": 71.93
      },
      {
        "period": "083/01",
        "year": 83,
        "month": 1,
        "index": 71.61
      },
      {
        "period": "083/02",
        "year": 83,
        "month": 2,
        "index": 72.54
      },
      {
        "period": "083/03",
        "year": 83,
        "month": 3,
        "index": 72.34
      },
      {
        "period": "083/04",
        "year": 83,
        "month": 4,
        "index": 73
      },
      {
        "period": "083/05",
        "year": 83,
        "month": 5,
        "index": 73.68
      },
      {
        "period": "083/06",
        "year": 83,
        "month": 6,
        "index": 73.49
      },
      {
        "period": "083/07",
        "year": 83,
        "month": 7,
        "index": 73.65
      },
      {
        "period": "083/08",
        "year": 83,
        "month": 8,
        "index": 75.38
      },
      {
        "period": "083/09",
        "year": 83,
        "month": 9,
        "index": 75.61
      },
      {
        "period": "083/10",
        "year": 83,
        "month": 10,
        "index": 74.79
      },
      {
        "period": "083/11",
        "year": 83,
        "month": 11,
        "index": 74.11
      },
      {
        "period": "083/12",
        "year": 83,
        "month": 12,
        "index": 73.84
      },
      {
        "period": "084/01",
        "year": 84,
        "month": 1,
        "index": 75.36
      },
      {
        "period": "084/02",
        "year": 84,
        "month": 2,
        "index": 75.04
      },
      {
        "period": "084/03",
        "year": 84,
        "month": 3,
        "index": 75.14
      },
      {
        "period": "084/04",
        "year": 84,
        "month": 4,
        "index": 76.24
      },
      {
        "period": "084/05",
        "year": 84,
        "month": 5,
        "index": 76.1
      },
      {
        "period": "084/06",
        "year": 84,
        "month": 6,
        "index": 76.92
      },
      {
        "period": "084/07",
        "year": 84,
        "month": 7,
        "index": 76.47
      },
      {
        "period": "084/08",
        "year": 84,
        "month": 8,
        "index": 76.67
      },
      {
        "period": "084/09",
        "year": 84,
        "month": 9,
        "index": 77.13
      },
      {
        "period": "084/10",
        "year": 84,
        "month": 10,
        "index": 76.93
      },
      {
        "period": "084/11",
        "year": 84,
        "month": 11,
        "index": 77.24
      },
      {
        "period": "084/12",
        "year": 84,
        "month": 12,
        "index": 77.21
      },
      {
        "period": "085/01",
        "year": 85,
        "month": 1,
        "index": 77.09
      },
      {
        "period": "085/02",
        "year": 85,
        "month": 2,
        "index": 77.85
      },
      {
        "period": "085/03",
        "year": 85,
        "month": 3,
        "index": 77.4
      },
      {
        "period": "085/04",
        "year": 85,
        "month": 4,
        "index": 78.39
      },
      {
        "period": "085/05",
        "year": 85,
        "month": 5,
        "index": 78.3
      },
      {
        "period": "085/06",
        "year": 85,
        "month": 6,
        "index": 78.76
      },
      {
        "period": "085/07",
        "year": 85,
        "month": 7,
        "index": 77.59
      },
      {
        "period": "085/08",
        "year": 85,
        "month": 8,
        "index": 80.54
      },
      {
        "period": "085/09",
        "year": 85,
        "month": 9,
        "index": 80.09
      },
      {
        "period": "085/10",
        "year": 85,
        "month": 10,
        "index": 79.77
      },
      {
        "period": "085/11",
        "year": 85,
        "month": 11,
        "index": 79.71
      },
      {
        "period": "085/12",
        "year": 85,
        "month": 12,
        "index": 79.16
      },
      {
        "period": "086/01",
        "year": 86,
        "month": 1,
        "index": 78.61
      },
      {
        "period": "086/02",
        "year": 86,
        "month": 2,
        "index": 79.46
      },
      {
        "period": "086/03",
        "year": 86,
        "month": 3,
        "index": 78.25
      },
      {
        "period": "086/04",
        "year": 86,
        "month": 4,
        "index": 78.78
      },
      {
        "period": "086/05",
        "year": 86,
        "month": 5,
        "index": 78.89
      },
      {
        "period": "086/06",
        "year": 86,
        "month": 6,
        "index": 80.2
      },
      {
        "period": "086/07",
        "year": 86,
        "month": 7,
        "index": 80.16
      },
      {
        "period": "086/08",
        "year": 86,
        "month": 8,
        "index": 80.07
      },
      {
        "period": "086/09",
        "year": 86,
        "month": 9,
        "index": 80.6
      },
      {
        "period": "086/10",
        "year": 86,
        "month": 10,
        "index": 79.51
      },
      {
        "period": "086/11",
        "year": 86,
        "month": 11,
        "index": 79.3
      },
      {
        "period": "086/12",
        "year": 86,
        "month": 12,
        "index": 79.37
      },
      {
        "period": "087/01",
        "year": 87,
        "month": 1,
        "index": 80.18
      },
      {
        "period": "087/02",
        "year": 87,
        "month": 2,
        "index": 79.69
      },
      {
        "period": "087/03",
        "year": 87,
        "month": 3,
        "index": 80.18
      },
      {
        "period": "087/04",
        "year": 87,
        "month": 4,
        "index": 80.45
      },
      {
        "period": "087/05",
        "year": 87,
        "month": 5,
        "index": 80.2
      },
      {
        "period": "087/06",
        "year": 87,
        "month": 6,
        "index": 81.36
      },
      {
        "period": "087/07",
        "year": 87,
        "month": 7,
        "index": 80.83
      },
      {
        "period": "087/08",
        "year": 87,
        "month": 8,
        "index": 80.43
      },
      {
        "period": "087/09",
        "year": 87,
        "month": 9,
        "index": 80.92
      },
      {
        "period": "087/10",
        "year": 87,
        "month": 10,
        "index": 81.56
      },
      {
        "period": "087/11",
        "year": 87,
        "month": 11,
        "index": 82.4
      },
      {
        "period": "087/12",
        "year": 87,
        "month": 12,
        "index": 81.05
      },
      {
        "period": "088/01",
        "year": 88,
        "month": 1,
        "index": 80.5
      },
      {
        "period": "088/02",
        "year": 88,
        "month": 2,
        "index": 81.36
      },
      {
        "period": "088/03",
        "year": 88,
        "month": 3,
        "index": 79.81
      },
      {
        "period": "088/04",
        "year": 88,
        "month": 4,
        "index": 80.38
      },
      {
        "period": "088/05",
        "year": 88,
        "month": 5,
        "index": 80.6
      },
      {
        "period": "088/06",
        "year": 88,
        "month": 6,
        "index": 80.67
      },
      {
        "period": "088/07",
        "year": 88,
        "month": 7,
        "index": 80.16
      },
      {
        "period": "088/08",
        "year": 88,
        "month": 8,
        "index": 81.35
      },
      {
        "period": "088/09",
        "year": 88,
        "month": 9,
        "index": 81.39
      },
      {
        "period": "088/10",
        "year": 88,
        "month": 10,
        "index": 81.9
      },
      {
        "period": "088/11",
        "year": 88,
        "month": 11,
        "index": 81.66
      },
      {
        "period": "088/12",
        "year": 88,
        "month": 12,
        "index": 81.17
      },
      {
        "period": "089/01",
        "year": 89,
        "month": 1,
        "index": 80.91
      },
      {
        "period": "089/02",
        "year": 89,
        "month": 2,
        "index": 82.11
      },
      {
        "period": "089/03",
        "year": 89,
        "month": 3,
        "index": 80.7
      },
      {
        "period": "089/04",
        "year": 89,
        "month": 4,
        "index": 81.37
      },
      {
        "period": "089/05",
        "year": 89,
        "month": 5,
        "index": 81.88
      },
      {
        "period": "089/06",
        "year": 89,
        "month": 6,
        "index": 81.77
      },
      {
        "period": "089/07",
        "year": 89,
        "month": 7,
        "index": 81.32
      },
      {
        "period": "089/08",
        "year": 89,
        "month": 8,
        "index": 81.57
      },
      {
        "period": "089/09",
        "year": 89,
        "month": 9,
        "index": 82.71
      },
      {
        "period": "089/10",
        "year": 89,
        "month": 10,
        "index": 82.73
      },
      {
        "period": "089/11",
        "year": 89,
        "month": 11,
        "index": 83.5
      },
      {
        "period": "089/12",
        "year": 89,
        "month": 12,
        "index": 82.5
      },
      {
        "period": "090/01",
        "year": 90,
        "month": 1,
        "index": 82.82
      },
      {
        "period": "090/02",
        "year": 90,
        "month": 2,
        "index": 81.27
      },
      {
        "period": "090/03",
        "year": 90,
        "month": 3,
        "index": 81.05
      },
      {
        "period": "090/04",
        "year": 90,
        "month": 4,
        "index": 81.72
      },
      {
        "period": "090/05",
        "year": 90,
        "month": 5,
        "index": 81.7
      },
      {
        "period": "090/06",
        "year": 90,
        "month": 6,
        "index": 81.65
      },
      {
        "period": "090/07",
        "year": 90,
        "month": 7,
        "index": 81.4
      },
      {
        "period": "090/08",
        "year": 90,
        "month": 8,
        "index": 81.94
      },
      {
        "period": "090/09",
        "year": 90,
        "month": 9,
        "index": 82.29
      },
      {
        "period": "090/10",
        "year": 90,
        "month": 10,
        "index": 83.54
      },
      {
        "period": "090/11",
        "year": 90,
        "month": 11,
        "index": 82.55
      },
      {
        "period": "090/12",
        "year": 90,
        "month": 12,
        "index": 81.11
      },
      {
        "period": "091/01",
        "year": 91,
        "month": 1,
        "index": 81.43
      },
      {
        "period": "091/02",
        "year": 91,
        "month": 2,
        "index": 82.42
      },
      {
        "period": "091/03",
        "year": 91,
        "month": 3,
        "index": 81.06
      },
      {
        "period": "091/04",
        "year": 91,
        "month": 4,
        "index": 81.89
      },
      {
        "period": "091/05",
        "year": 91,
        "month": 5,
        "index": 81.49
      },
      {
        "period": "091/06",
        "year": 91,
        "month": 6,
        "index": 81.74
      },
      {
        "period": "091/07",
        "year": 91,
        "month": 7,
        "index": 81.75
      },
      {
        "period": "091/08",
        "year": 91,
        "month": 8,
        "index": 81.72
      },
      {
        "period": "091/09",
        "year": 91,
        "month": 9,
        "index": 81.66
      },
      {
        "period": "091/10",
        "year": 91,
        "month": 10,
        "index": 82.12
      },
      {
        "period": "091/11",
        "year": 91,
        "month": 11,
        "index": 82.09
      },
      {
        "period": "091/12",
        "year": 91,
        "month": 12,
        "index": 81.74
      },
      {
        "period": "092/01",
        "year": 92,
        "month": 1,
        "index": 82.31
      },
      {
        "period": "092/02",
        "year": 92,
        "month": 2,
        "index": 81.17
      },
      {
        "period": "092/03",
        "year": 92,
        "month": 3,
        "index": 80.91
      },
      {
        "period": "092/04",
        "year": 92,
        "month": 4,
        "index": 81.79
      },
      {
        "period": "092/05",
        "year": 92,
        "month": 5,
        "index": 81.75
      },
      {
        "period": "092/06",
        "year": 92,
        "month": 6,
        "index": 81.28
      },
      {
        "period": "092/07",
        "year": 92,
        "month": 7,
        "index": 80.94
      },
      {
        "period": "092/08",
        "year": 92,
        "month": 8,
        "index": 81.24
      },
      {
        "period": "092/09",
        "year": 92,
        "month": 9,
        "index": 81.49
      },
      {
        "period": "092/10",
        "year": 92,
        "month": 10,
        "index": 82.07
      },
      {
        "period": "092/11",
        "year": 92,
        "month": 11,
        "index": 81.71
      },
      {
        "period": "092/12",
        "year": 92,
        "month": 12,
        "index": 81.69
      },
      {
        "period": "093/01",
        "year": 93,
        "month": 1,
        "index": 82.32
      },
      {
        "period": "093/02",
        "year": 93,
        "month": 2,
        "index": 81.69
      },
      {
        "period": "093/03",
        "year": 93,
        "month": 3,
        "index": 81.63
      },
      {
        "period": "093/04",
        "year": 93,
        "month": 4,
        "index": 82.57
      },
      {
        "period": "093/05",
        "year": 93,
        "month": 5,
        "index": 82.49
      },
      {
        "period": "093/06",
        "year": 93,
        "month": 6,
        "index": 82.69
      },
      {
        "period": "093/07",
        "year": 93,
        "month": 7,
        "index": 83.63
      },
      {
        "period": "093/08",
        "year": 93,
        "month": 8,
        "index": 83.31
      },
      {
        "period": "093/09",
        "year": 93,
        "month": 9,
        "index": 83.76
      },
      {
        "period": "093/10",
        "year": 93,
        "month": 10,
        "index": 84.03
      },
      {
        "period": "093/11",
        "year": 93,
        "month": 11,
        "index": 82.95
      },
      {
        "period": "093/12",
        "year": 93,
        "month": 12,
        "index": 83.01
      },
      {
        "period": "094/01",
        "year": 94,
        "month": 1,
        "index": 82.72
      },
      {
        "period": "094/02",
        "year": 94,
        "month": 2,
        "index": 83.27
      },
      {
        "period": "094/03",
        "year": 94,
        "month": 3,
        "index": 83.51
      },
      {
        "period": "094/04",
        "year": 94,
        "month": 4,
        "index": 83.93
      },
      {
        "period": "094/05",
        "year": 94,
        "month": 5,
        "index": 84.39
      },
      {
        "period": "094/06",
        "year": 94,
        "month": 6,
        "index": 84.66
      },
      {
        "period": "094/07",
        "year": 94,
        "month": 7,
        "index": 85.65
      },
      {
        "period": "094/08",
        "year": 94,
        "month": 8,
        "index": 86.28
      },
      {
        "period": "094/09",
        "year": 94,
        "month": 9,
        "index": 86.41
      },
      {
        "period": "094/10",
        "year": 94,
        "month": 10,
        "index": 86.34
      },
      {
        "period": "094/11",
        "year": 94,
        "month": 11,
        "index": 85.03
      },
      {
        "period": "094/12",
        "year": 94,
        "month": 12,
        "index": 84.84
      },
      {
        "period": "095/01",
        "year": 95,
        "month": 1,
        "index": 84.94
      },
      {
        "period": "095/02",
        "year": 95,
        "month": 2,
        "index": 84.09
      },
      {
        "period": "095/03",
        "year": 95,
        "month": 3,
        "index": 83.86
      },
      {
        "period": "095/04",
        "year": 95,
        "month": 4,
        "index": 84.96
      },
      {
        "period": "095/05",
        "year": 95,
        "month": 5,
        "index": 85.73
      },
      {
        "period": "095/06",
        "year": 95,
        "month": 6,
        "index": 86.13
      },
      {
        "period": "095/07",
        "year": 95,
        "month": 7,
        "index": 86.32
      },
      {
        "period": "095/08",
        "year": 95,
        "month": 8,
        "index": 85.8
      },
      {
        "period": "095/09",
        "year": 95,
        "month": 9,
        "index": 85.33
      },
      {
        "period": "095/10",
        "year": 95,
        "month": 10,
        "index": 85.31
      },
      {
        "period": "095/11",
        "year": 95,
        "month": 11,
        "index": 85.24
      },
      {
        "period": "095/12",
        "year": 95,
        "month": 12,
        "index": 85.42
      },
      {
        "period": "096/01",
        "year": 96,
        "month": 1,
        "index": 85.24
      },
      {
        "period": "096/02",
        "year": 96,
        "month": 2,
        "index": 85.56
      },
      {
        "period": "096/03",
        "year": 96,
        "month": 3,
        "index": 84.56
      },
      {
        "period": "096/04",
        "year": 96,
        "month": 4,
        "index": 85.54
      },
      {
        "period": "096/05",
        "year": 96,
        "month": 5,
        "index": 85.71
      },
      {
        "period": "096/06",
        "year": 96,
        "month": 6,
        "index": 86.24
      },
      {
        "period": "096/07",
        "year": 96,
        "month": 7,
        "index": 86.04
      },
      {
        "period": "096/08",
        "year": 96,
        "month": 8,
        "index": 87.18
      },
      {
        "period": "096/09",
        "year": 96,
        "month": 9,
        "index": 87.99
      },
      {
        "period": "096/10",
        "year": 96,
        "month": 10,
        "index": 89.86
      },
      {
        "period": "096/11",
        "year": 96,
        "month": 11,
        "index": 89.33
      },
      {
        "period": "096/12",
        "year": 96,
        "month": 12,
        "index": 88.26
      },
      {
        "period": "097/01",
        "year": 97,
        "month": 1,
        "index": 87.75
      },
      {
        "period": "097/02",
        "year": 97,
        "month": 2,
        "index": 88.87
      },
      {
        "period": "097/03",
        "year": 97,
        "month": 3,
        "index": 87.91
      },
      {
        "period": "097/04",
        "year": 97,
        "month": 4,
        "index": 88.86
      },
      {
        "period": "097/05",
        "year": 97,
        "month": 5,
        "index": 88.9
      },
      {
        "period": "097/06",
        "year": 97,
        "month": 6,
        "index": 90.53
      },
      {
        "period": "097/07",
        "year": 97,
        "month": 7,
        "index": 91.04
      },
      {
        "period": "097/08",
        "year": 97,
        "month": 8,
        "index": 91.27
      },
      {
        "period": "097/09",
        "year": 97,
        "month": 9,
        "index": 90.72
      },
      {
        "period": "097/10",
        "year": 97,
        "month": 10,
        "index": 92
      },
      {
        "period": "097/11",
        "year": 97,
        "month": 11,
        "index": 91.05
      },
      {
        "period": "097/12",
        "year": 97,
        "month": 12,
        "index": 89.38
      },
      {
        "period": "098/01",
        "year": 98,
        "month": 1,
        "index": 89.04
      },
      {
        "period": "098/02",
        "year": 98,
        "month": 2,
        "index": 87.68
      },
      {
        "period": "098/03",
        "year": 98,
        "month": 3,
        "index": 87.78
      },
      {
        "period": "098/04",
        "year": 98,
        "month": 4,
        "index": 88.45
      },
      {
        "period": "098/05",
        "year": 98,
        "month": 5,
        "index": 88.82
      },
      {
        "period": "098/06",
        "year": 98,
        "month": 6,
        "index": 88.73
      },
      {
        "period": "098/07",
        "year": 98,
        "month": 7,
        "index": 88.91
      },
      {
        "period": "098/08",
        "year": 98,
        "month": 8,
        "index": 90.52
      },
      {
        "period": "098/09",
        "year": 98,
        "month": 9,
        "index": 89.91
      },
      {
        "period": "098/10",
        "year": 98,
        "month": 10,
        "index": 90.26
      },
      {
        "period": "098/11",
        "year": 98,
        "month": 11,
        "index": 89.59
      },
      {
        "period": "098/12",
        "year": 98,
        "month": 12,
        "index": 89.16
      },
      {
        "period": "099/01",
        "year": 99,
        "month": 1,
        "index": 89.27
      },
      {
        "period": "099/02",
        "year": 99,
        "month": 2,
        "index": 89.74
      },
      {
        "period": "099/03",
        "year": 99,
        "month": 3,
        "index": 88.89
      },
      {
        "period": "099/04",
        "year": 99,
        "month": 4,
        "index": 89.64
      },
      {
        "period": "099/05",
        "year": 99,
        "month": 5,
        "index": 89.49
      },
      {
        "period": "099/06",
        "year": 99,
        "month": 6,
        "index": 89.8
      },
      {
        "period": "099/07",
        "year": 99,
        "month": 7,
        "index": 90.08
      },
      {
        "period": "099/08",
        "year": 99,
        "month": 8,
        "index": 90.09
      },
      {
        "period": "099/09",
        "year": 99,
        "month": 9,
        "index": 90.18
      },
      {
        "period": "099/10",
        "year": 99,
        "month": 10,
        "index": 90.78
      },
      {
        "period": "099/11",
        "year": 99,
        "month": 11,
        "index": 90.95
      },
      {
        "period": "099/12",
        "year": 99,
        "month": 12,
        "index": 90.26
      },
      {
        "period": "100/01",
        "year": 100,
        "month": 1,
        "index": 90.25
      },
      {
        "period": "100/02",
        "year": 100,
        "month": 2,
        "index": 90.93
      },
      {
        "period": "100/03",
        "year": 100,
        "month": 3,
        "index": 90.13
      },
      {
        "period": "100/04",
        "year": 100,
        "month": 4,
        "index": 90.8
      },
      {
        "period": "100/05",
        "year": 100,
        "month": 5,
        "index": 90.98
      },
      {
        "period": "100/06",
        "year": 100,
        "month": 6,
        "index": 91.54
      },
      {
        "period": "100/07",
        "year": 100,
        "month": 7,
        "index": 91.27
      },
      {
        "period": "100/08",
        "year": 100,
        "month": 8,
        "index": 91.3
      },
      {
        "period": "100/09",
        "year": 100,
        "month": 9,
        "index": 91.42
      },
      {
        "period": "100/10",
        "year": 100,
        "month": 10,
        "index": 91.91
      },
      {
        "period": "100/11",
        "year": 100,
        "month": 11,
        "index": 91.89
      },
      {
        "period": "100/12",
        "year": 100,
        "month": 12,
        "index": 92.09
      },
      {
        "period": "101/01",
        "year": 101,
        "month": 1,
        "index": 92.38
      },
      {
        "period": "101/02",
        "year": 101,
        "month": 2,
        "index": 91.15
      },
      {
        "period": "101/03",
        "year": 101,
        "month": 3,
        "index": 91.27
      },
      {
        "period": "101/04",
        "year": 101,
        "month": 4,
        "index": 92.11
      },
      {
        "period": "101/05",
        "year": 101,
        "month": 5,
        "index": 92.57
      },
      {
        "period": "101/06",
        "year": 101,
        "month": 6,
        "index": 93.16
      },
      {
        "period": "101/07",
        "year": 101,
        "month": 7,
        "index": 93.52
      },
      {
        "period": "101/08",
        "year": 101,
        "month": 8,
        "index": 94.43
      },
      {
        "period": "101/09",
        "year": 101,
        "month": 9,
        "index": 94.12
      },
      {
        "period": "101/10",
        "year": 101,
        "month": 10,
        "index": 94.05
      },
      {
        "period": "101/11",
        "year": 101,
        "month": 11,
        "index": 93.35
      },
      {
        "period": "101/12",
        "year": 101,
        "month": 12,
        "index": 93.58
      },
      {
        "period": "102/01",
        "year": 102,
        "month": 1,
        "index": 93.41
      },
      {
        "period": "102/02",
        "year": 102,
        "month": 2,
        "index": 93.85
      },
      {
        "period": "102/03",
        "year": 102,
        "month": 3,
        "index": 92.5
      },
      {
        "period": "102/04",
        "year": 102,
        "month": 4,
        "index": 93.08
      },
      {
        "period": "102/05",
        "year": 102,
        "month": 5,
        "index": 93.25
      },
      {
        "period": "102/06",
        "year": 102,
        "month": 6,
        "index": 93.72
      },
      {
        "period": "102/07",
        "year": 102,
        "month": 7,
        "index": 93.58
      },
      {
        "period": "102/08",
        "year": 102,
        "month": 8,
        "index": 93.69
      },
      {
        "period": "102/09",
        "year": 102,
        "month": 9,
        "index": 94.92
      },
      {
        "period": "102/10",
        "year": 102,
        "month": 10,
        "index": 94.66
      },
      {
        "period": "102/11",
        "year": 102,
        "month": 11,
        "index": 93.98
      },
      {
        "period": "102/12",
        "year": 102,
        "month": 12,
        "index": 93.89
      },
      {
        "period": "103/01",
        "year": 103,
        "month": 1,
        "index": 94.18
      },
      {
        "period": "103/02",
        "year": 103,
        "month": 2,
        "index": 93.81
      },
      {
        "period": "103/03",
        "year": 103,
        "month": 3,
        "index": 93.99
      },
      {
        "period": "103/04",
        "year": 103,
        "month": 4,
        "index": 94.62
      },
      {
        "period": "103/05",
        "year": 103,
        "month": 5,
        "index": 94.76
      },
      {
        "period": "103/06",
        "year": 103,
        "month": 6,
        "index": 95.25
      },
      {
        "period": "103/07",
        "year": 103,
        "month": 7,
        "index": 95.22
      },
      {
        "period": "103/08",
        "year": 103,
        "month": 8,
        "index": 95.64
      },
      {
        "period": "103/09",
        "year": 103,
        "month": 9,
        "index": 95.59
      },
      {
        "period": "103/10",
        "year": 103,
        "month": 10,
        "index": 95.66
      },
      {
        "period": "103/11",
        "year": 103,
        "month": 11,
        "index": 94.78
      },
      {
        "period": "103/12",
        "year": 103,
        "month": 12,
        "index": 94.46
      },
      {
        "period": "104/01",
        "year": 104,
        "month": 1,
        "index": 93.3
      },
      {
        "period": "104/02",
        "year": 104,
        "month": 2,
        "index": 93.62
      },
      {
        "period": "104/03",
        "year": 104,
        "month": 3,
        "index": 93.41
      },
      {
        "period": "104/04",
        "year": 104,
        "month": 4,
        "index": 93.84
      },
      {
        "period": "104/05",
        "year": 104,
        "month": 5,
        "index": 94.07
      },
      {
        "period": "104/06",
        "year": 104,
        "month": 6,
        "index": 94.72
      },
      {
        "period": "104/07",
        "year": 104,
        "month": 7,
        "index": 94.62
      },
      {
        "period": "104/08",
        "year": 104,
        "month": 8,
        "index": 95.21
      },
      {
        "period": "104/09",
        "year": 104,
        "month": 9,
        "index": 95.87
      },
      {
        "period": "104/10",
        "year": 104,
        "month": 10,
        "index": 95.95
      },
      {
        "period": "104/11",
        "year": 104,
        "month": 11,
        "index": 95.29
      },
      {
        "period": "104/12",
        "year": 104,
        "month": 12,
        "index": 94.58
      },
      {
        "period": "105/01",
        "year": 105,
        "month": 1,
        "index": 94.05
      },
      {
        "period": "105/02",
        "year": 105,
        "month": 2,
        "index": 95.88
      },
      {
        "period": "105/03",
        "year": 105,
        "month": 3,
        "index": 95.29
      },
      {
        "period": "105/04",
        "year": 105,
        "month": 4,
        "index": 95.6
      },
      {
        "period": "105/05",
        "year": 105,
        "month": 5,
        "index": 95.23
      },
      {
        "period": "105/06",
        "year": 105,
        "month": 6,
        "index": 95.57
      },
      {
        "period": "105/07",
        "year": 105,
        "month": 7,
        "index": 95.79
      },
      {
        "period": "105/08",
        "year": 105,
        "month": 8,
        "index": 95.75
      },
      {
        "period": "105/09",
        "year": 105,
        "month": 9,
        "index": 96.19
      },
      {
        "period": "105/10",
        "year": 105,
        "month": 10,
        "index": 97.58
      },
      {
        "period": "105/11",
        "year": 105,
        "month": 11,
        "index": 97.17
      },
      {
        "period": "105/12",
        "year": 105,
        "month": 12,
        "index": 96.18
      },
      {
        "period": "106/01",
        "year": 106,
        "month": 1,
        "index": 96.16
      },
      {
        "period": "106/02",
        "year": 106,
        "month": 2,
        "index": 95.82
      },
      {
        "period": "106/03",
        "year": 106,
        "month": 3,
        "index": 95.46
      },
      {
        "period": "106/04",
        "year": 106,
        "month": 4,
        "index": 95.69
      },
      {
        "period": "106/05",
        "year": 106,
        "month": 5,
        "index": 95.8
      },
      {
        "period": "106/06",
        "year": 106,
        "month": 6,
        "index": 96.53
      },
      {
        "period": "106/07",
        "year": 106,
        "month": 7,
        "index": 96.53
      },
      {
        "period": "106/08",
        "year": 106,
        "month": 8,
        "index": 96.67
      },
      {
        "period": "106/09",
        "year": 106,
        "month": 9,
        "index": 96.66
      },
      {
        "period": "106/10",
        "year": 106,
        "month": 10,
        "index": 97.26
      },
      {
        "period": "106/11",
        "year": 106,
        "month": 11,
        "index": 97.5
      },
      {
        "period": "106/12",
        "year": 106,
        "month": 12,
        "index": 97.35
      },
      {
        "period": "107/01",
        "year": 107,
        "month": 1,
        "index": 97.02
      },
      {
        "period": "107/02",
        "year": 107,
        "month": 2,
        "index": 97.93
      },
      {
        "period": "107/03",
        "year": 107,
        "month": 3,
        "index": 96.98
      },
      {
        "period": "107/04",
        "year": 107,
        "month": 4,
        "index": 97.61
      },
      {
        "period": "107/05",
        "year": 107,
        "month": 5,
        "index": 97.48
      },
      {
        "period": "107/06",
        "year": 107,
        "month": 6,
        "index": 97.88
      },
      {
        "period": "107/07",
        "year": 107,
        "month": 7,
        "index": 98.22
      },
      {
        "period": "107/08",
        "year": 107,
        "month": 8,
        "index": 98.16
      },
      {
        "period": "107/09",
        "year": 107,
        "month": 9,
        "index": 98.32
      },
      {
        "period": "107/10",
        "year": 107,
        "month": 10,
        "index": 98.39
      },
      {
        "period": "107/11",
        "year": 107,
        "month": 11,
        "index": 97.78
      },
      {
        "period": "107/12",
        "year": 107,
        "month": 12,
        "index": 97.29
      },
      {
        "period": "108/01",
        "year": 108,
        "month": 1,
        "index": 97.19
      },
      {
        "period": "108/02",
        "year": 108,
        "month": 2,
        "index": 98.14
      },
      {
        "period": "108/03",
        "year": 108,
        "month": 3,
        "index": 97.52
      },
      {
        "period": "108/04",
        "year": 108,
        "month": 4,
        "index": 98.25
      },
      {
        "period": "108/05",
        "year": 108,
        "month": 5,
        "index": 98.39
      },
      {
        "period": "108/06",
        "year": 108,
        "month": 6,
        "index": 98.71
      },
      {
        "period": "108/07",
        "year": 108,
        "month": 7,
        "index": 98.6
      },
      {
        "period": "108/08",
        "year": 108,
        "month": 8,
        "index": 98.58
      },
      {
        "period": "108/09",
        "year": 108,
        "month": 9,
        "index": 98.73
      },
      {
        "period": "108/10",
        "year": 108,
        "month": 10,
        "index": 98.75
      },
      {
        "period": "108/11",
        "year": 108,
        "month": 11,
        "index": 98.35
      },
      {
        "period": "108/12",
        "year": 108,
        "month": 12,
        "index": 98.41
      },
      {
        "period": "109/01",
        "year": 109,
        "month": 1,
        "index": 99
      },
      {
        "period": "109/02",
        "year": 109,
        "month": 2,
        "index": 97.94
      },
      {
        "period": "109/03",
        "year": 109,
        "month": 3,
        "index": 97.5
      },
      {
        "period": "109/04",
        "year": 109,
        "month": 4,
        "index": 97.3
      },
      {
        "period": "109/05",
        "year": 109,
        "month": 5,
        "index": 97.2
      },
      {
        "period": "109/06",
        "year": 109,
        "month": 6,
        "index": 97.98
      },
      {
        "period": "109/07",
        "year": 109,
        "month": 7,
        "index": 98.1
      },
      {
        "period": "109/08",
        "year": 109,
        "month": 8,
        "index": 98.25
      },
      {
        "period": "109/09",
        "year": 109,
        "month": 9,
        "index": 98.16
      },
      {
        "period": "109/10",
        "year": 109,
        "month": 10,
        "index": 98.49
      },
      {
        "period": "109/11",
        "year": 109,
        "month": 11,
        "index": 98.44
      },
      {
        "period": "109/12",
        "year": 109,
        "month": 12,
        "index": 98.45
      },
      {
        "period": "110/01",
        "year": 110,
        "month": 1,
        "index": 98.81
      },
      {
        "period": "110/02",
        "year": 110,
        "month": 2,
        "index": 99.29
      },
      {
        "period": "110/03",
        "year": 110,
        "month": 3,
        "index": 98.69
      },
      {
        "period": "110/04",
        "year": 110,
        "month": 4,
        "index": 99.35
      },
      {
        "period": "110/05",
        "year": 110,
        "month": 5,
        "index": 99.58
      },
      {
        "period": "110/06",
        "year": 110,
        "month": 6,
        "index": 99.77
      },
      {
        "period": "110/07",
        "year": 110,
        "month": 7,
        "index": 99.97
      },
      {
        "period": "110/08",
        "year": 110,
        "month": 8,
        "index": 100.55
      },
      {
        "period": "110/09",
        "year": 110,
        "month": 9,
        "index": 100.71
      },
      {
        "period": "110/10",
        "year": 110,
        "month": 10,
        "index": 101
      },
      {
        "period": "110/11",
        "year": 110,
        "month": 11,
        "index": 101.24
      },
      {
        "period": "110/12",
        "year": 110,
        "month": 12,
        "index": 101.04
      },
      {
        "period": "111/01",
        "year": 111,
        "month": 1,
        "index": 101.61
      },
      {
        "period": "111/02",
        "year": 111,
        "month": 2,
        "index": 101.6
      },
      {
        "period": "111/03",
        "year": 111,
        "month": 3,
        "index": 101.92
      },
      {
        "period": "111/04",
        "year": 111,
        "month": 4,
        "index": 102.7
      },
      {
        "period": "111/05",
        "year": 111,
        "month": 5,
        "index": 102.96
      },
      {
        "period": "111/06",
        "year": 111,
        "month": 6,
        "index": 103.35
      },
      {
        "period": "111/07",
        "year": 111,
        "month": 7,
        "index": 103.32
      },
      {
        "period": "111/08",
        "year": 111,
        "month": 8,
        "index": 103.24
      },
      {
        "period": "111/09",
        "year": 111,
        "month": 9,
        "index": 103.49
      },
      {
        "period": "111/10",
        "year": 111,
        "month": 10,
        "index": 103.77
      },
      {
        "period": "111/11",
        "year": 111,
        "month": 11,
        "index": 103.62
      },
      {
        "period": "111/12",
        "year": 111,
        "month": 12,
        "index": 103.78
      },
      {
        "period": "112/01",
        "year": 112,
        "month": 1,
        "index": 104.71
      },
      {
        "period": "112/02",
        "year": 112,
        "month": 2,
        "index": 104.06
      },
      {
        "period": "112/03",
        "year": 112,
        "month": 3,
        "index": 104.32
      },
      {
        "period": "112/04",
        "year": 112,
        "month": 4,
        "index": 105.11
      },
      {
        "period": "112/05",
        "year": 112,
        "month": 5,
        "index": 105.04
      },
      {
        "period": "112/06",
        "year": 112,
        "month": 6,
        "index": 105.16
      },
      {
        "period": "112/07",
        "year": 112,
        "month": 7,
        "index": 105.26
      },
      {
        "period": "112/08",
        "year": 112,
        "month": 8,
        "index": 105.85
      },
      {
        "period": "112/09",
        "year": 112,
        "month": 9,
        "index": 106.52
      },
      {
        "period": "112/10",
        "year": 112,
        "month": 10,
        "index": 106.92
      },
      {
        "period": "112/11",
        "year": 112,
        "month": 11,
        "index": 106.62
      },
      {
        "period": "112/12",
        "year": 112,
        "month": 12,
        "index": 106.58
      },
      {
        "period": "113/01",
        "year": 113,
        "month": 1,
        "index": 106.59
      },
      {
        "period": "113/02",
        "year": 113,
        "month": 2,
        "index": 107.26
      },
      {
        "period": "113/03",
        "year": 113,
        "month": 3,
        "index": 106.56
      },
      {
        "period": "113/04",
        "year": 113,
        "month": 4,
        "index": 107.15
      },
      {
        "period": "113/05",
        "year": 113,
        "month": 5,
        "index": 107.38
      },
      {
        "period": "113/06",
        "year": 113,
        "month": 6,
        "index": 107.71
      },
      {
        "period": "113/07",
        "year": 113,
        "month": 7,
        "index": 107.92
      },
      {
        "period": "113/08",
        "year": 113,
        "month": 8,
        "index": 108.34
      },
      {
        "period": "113/09",
        "year": 113,
        "month": 9,
        "index": 108.46
      },
      {
        "period": "113/10",
        "year": 113,
        "month": 10,
        "index": 108.73
      },
      {
        "period": "113/11",
        "year": 113,
        "month": 11,
        "index": 108.84
      },
      {
        "period": "113/12",
        "year": 113,
        "month": 12,
        "index": 108.82
      },
      {
        "period": "114/01",
        "year": 114,
        "month": 1,
        "index": 109.44
      },
      {
        "period": "114/02",
        "year": 114,
        "month": 2,
        "index": 109
      },
      {
        "period": "114/03",
        "year": 114,
        "month": 3,
        "index": 109.05
      },
      {
        "period": "114/04",
        "year": 114,
        "month": 4,
        "index": 109.33
      },
      {
        "period": "114/05",
        "year": 114,
        "month": 5,
        "index": 109.03
      },
      {
        "period": "114/06",
        "year": 114,
        "month": 6,
        "index": 109.17
      },
      {
        "period": "114/07",
        "year": 114,
        "month": 7,
        "index": 109.57
      },
      {
        "period": "114/08",
        "year": 114,
        "month": 8,
        "index": 110.07
      },
      {
        "period": "114/09",
        "year": 114,
        "month": 9,
        "index": 109.82
      },
      {
        "period": "114/10",
        "year": 114,
        "month": 10,
        "index": 110.33
      },
      {
        "period": "114/11",
        "year": 114,
        "month": 11,
        "index": 110.16
      },
      {
        "period": "114/12",
        "year": 114,
        "month": 12,
        "index": 110.24
      },
      {
        "period": "115/01",
        "year": 115,
        "month": 1,
        "index": 110.22
      },
      {
        "period": "115/02",
        "year": 115,
        "month": 2,
        "index": 110.91
      },
      {
        "period": "115/03",
        "year": 115,
        "month": 3,
        "index": 110.36
      },
      {
        "period": "115/04",
        "year": 115,
        "month": 4,
        "index": 111.23
      }
    ];
  }
});

// landValueTaxCalculator.js?v=20260521-official-tax-formula
function toLandTaxNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const normalized = String(value ?? "").replace(/[，,]/g, "").replace(/％/g, "%").trim();
  if (!normalized) return 0;
  const number = Number(normalized.replace(/[^\d.-]/g, ""));
  return Number.isFinite(number) ? number : 0;
}
function formatTaiwanDollar(value) {
  const number = Math.round(toLandTaxNumber(value));
  return number.toLocaleString("zh-TW");
}
function formatLandTaxNumber(value, digits = 2) {
  const number = toLandTaxNumber(value);
  return number.toLocaleString("zh-TW", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}
function cpiPeriodKey(year, month) {
  const y = Math.trunc(toLandTaxNumber(year));
  const m = Math.trunc(toLandTaxNumber(month));
  if (!y || !m) return "";
  return `${String(y).padStart(3, "0")}/${String(m).padStart(2, "0")}`;
}
function cpiPeriodOptions(data = LAND_VALUE_TAX_CPI_DATA) {
  return [...data].sort((a, b) => b.year - a.year || b.month - a.month);
}
function getLatestCpiPeriod(data = LAND_VALUE_TAX_CPI_DATA) {
  return cpiPeriodOptions(data)[0] || null;
}
function findCpiIndex(year, month, data = LAND_VALUE_TAX_CPI_DATA) {
  const key = cpiPeriodKey(year, month);
  if (!key) return null;
  return data.find((entry) => entry.period === key) || null;
}
function holdingDiscountRate(holdingYears) {
  const years = toLandTaxNumber(holdingYears);
  if (years > 40) return 0.4;
  if (years > 30) return 0.3;
  if (years > 20) return 0.2;
  return 0;
}
function calculateGeneralLandValueTax(taxableGain, adjustedOriginalValue, holdingYears = 0) {
  const gain = Math.max(0, toLandTaxNumber(taxableGain));
  const adjustedOriginal = Math.max(0, toLandTaxNumber(adjustedOriginalValue));
  const discount = holdingDiscountRate(holdingYears);
  if (gain <= 0) {
    return { tax: 0, bracket: "\u7121\u6F32\u50F9\u6578\u984D", discountRate: discount, gainRatio: 0 };
  }
  if (adjustedOriginal <= 0) {
    return {
      tax: Math.round(gain * 0.4),
      bracket: "\u7121\u539F\u5730\u50F9\u57FA\u6E96\uFF0C\u4EE5\u6700\u9AD8\u7D1A\u8DDD\u4F30\u7B97",
      discountRate: discount,
      gainRatio: Infinity
    };
  }
  const gainRatio = gain / adjustedOriginal;
  let tax = 0;
  let bracket = "\u7B2C\u4E00\u7D1A";
  if (gainRatio <= 1) {
    tax = gain * 0.2;
    bracket = "\u7B2C\u4E00\u7D1A\uFF08\u6F32\u50F9\u6578\u984D\u672A\u8D85\u904E\u539F\u5730\u50F9 100%\uFF09";
  } else if (gainRatio <= 2) {
    const rate = 0.3 - (0.3 - 0.2) * discount;
    const deductionRate = 0.1 * (1 - discount);
    tax = gain * rate - adjustedOriginal * deductionRate;
    bracket = "\u7B2C\u4E8C\u7D1A\uFF08\u8D85\u904E 100%\uFF0C\u672A\u8D85\u904E 200%\uFF09";
  } else {
    const rate = 0.4 - (0.4 - 0.2) * discount;
    const deductionRate = 0.3 * (1 - discount);
    tax = gain * rate - adjustedOriginal * deductionRate;
    bracket = "\u7B2C\u4E09\u7D1A\uFF08\u8D85\u904E\u539F\u5730\u50F9 200%\uFF09";
  }
  return {
    tax: Math.max(0, Math.round(tax)),
    bracket,
    discountRate: discount,
    gainRatio
  };
}
function calculateLandValueTax(input = {}, cpiData = LAND_VALUE_TAX_CPI_DATA) {
  const values = { ...LAND_VALUE_TAX_DEFAULTS, ...input };
  const warnings = [];
  const landAreaSqm = toLandTaxNumber(values.landAreaSqm);
  const rightNumerator = toLandTaxNumber(values.rightNumerator) || 1;
  const rightDenominator = toLandTaxNumber(values.rightDenominator) || 1;
  const effectiveAreaSqm = landAreaSqm * (rightNumerator / rightDenominator);
  const effectiveAreaPing = effectiveAreaSqm * PING_PER_SQM;
  const transferTotalValueInput = toLandTaxNumber(values.transferTotalValue);
  const originalTotalValueInput = toLandTaxNumber(values.originalTotalValue);
  const transferUnitValue = toLandTaxNumber(values.transferUnitValue);
  const originalUnitValue = toLandTaxNumber(values.originalUnitValue);
  const transferValue = transferTotalValueInput > 0 ? transferTotalValueInput : transferUnitValue * effectiveAreaSqm;
  const originalValue = originalTotalValueInput > 0 ? originalTotalValueInput : originalUnitValue * effectiveAreaSqm;
  if (!effectiveAreaSqm && !transferTotalValueInput && !originalTotalValueInput) {
    warnings.push("\u571F\u5730\u9762\u7A4D\u6216\u7E3D\u984D\u672A\u8F38\u5165\uFF0C\u7121\u6CD5\u5B8C\u6574\u8A66\u7B97\u3002");
  }
  if (!transferValue) warnings.push("\u7533\u5831\u79FB\u8F49\u73FE\u503C\u672A\u8F38\u5165\u3002");
  if (!originalValue) warnings.push("\u539F\u898F\u5B9A\u5730\u50F9\u6216\u524D\u6B21\u79FB\u8F49\u73FE\u503C\u672A\u8F38\u5165\u3002");
  const latest = getLatestCpiPeriod(cpiData);
  const transferPeriod = findCpiIndex(values.transferYear || latest?.year, values.transferMonth || latest?.month, cpiData);
  const originalPeriod = findCpiIndex(values.originalYear, values.originalMonth, cpiData);
  let cpiRatio = 1;
  if (originalPeriod) {
    cpiRatio = originalPeriod.index / 100;
  } else {
    warnings.push("\u524D\u6B21\u79FB\u8F49\u5E74\u6708\u7269\u50F9\u6307\u6578\u672A\u5B8C\u6574\u9078\u53D6\uFF0C\u66AB\u4EE5 1.000 \u500D\u8A66\u7B97\u3002");
  }
  const adjustedOriginalValue = originalValue * cpiRatio;
  const deductions = {
    landImprovementCost: toLandTaxNumber(values.landImprovementCost),
    engineeringBenefitFee: toLandTaxNumber(values.engineeringBenefitFee),
    landReadjustmentBurden: toLandTaxNumber(values.landReadjustmentBurden),
    donatedLandValue: toLandTaxNumber(values.donatedLandValue)
  };
  const totalDeductions = Object.values(deductions).reduce((sum, value) => sum + value, 0);
  const taxableGain = Math.max(0, transferValue - adjustedOriginalValue - totalDeductions);
  const taxMode = values.taxMode === "selfUse" ? "selfUse" : "general";
  const general = calculateGeneralLandValueTax(taxableGain, adjustedOriginalValue, values.holdingYears);
  const selfUseTax = Math.max(0, Math.round(taxableGain * 0.1));
  const tax = taxMode === "selfUse" ? selfUseTax : general.tax;
  const bracket = taxMode === "selfUse" ? "\u81EA\u7528\u4F4F\u5B85\u7528\u5730\uFF0810%\uFF09" : general.bracket;
  return {
    input: values,
    metadata: LAND_VALUE_TAX_CPI_METADATA,
    taxMode,
    landAreaSqm,
    effectiveAreaSqm,
    effectiveAreaPing,
    transferValue: Math.round(transferValue),
    originalValue: Math.round(originalValue),
    transferPeriod,
    originalPeriod,
    cpiRatio,
    adjustedOriginalValue: Math.round(adjustedOriginalValue),
    deductions,
    totalDeductions: Math.round(totalDeductions),
    taxableGain: Math.round(taxableGain),
    holdingDiscountRate: taxMode === "general" ? general.discountRate : 0,
    gainRatio: general.gainRatio,
    selfUseTax,
    generalTax: general.tax,
    generalBracket: general.bracket,
    generalHoldingDiscountRate: general.discountRate,
    bracket,
    tax,
    warnings
  };
}
var PING_PER_SQM, LAND_VALUE_TAX_DEFAULTS;
var init_landValueTaxCalculator = __esm({
  "landValueTaxCalculator.js?v=20260521-official-tax-formula"() {
    "use strict";
    init_landValueTaxCpiData();
    PING_PER_SQM = 0.3025;
    LAND_VALUE_TAX_DEFAULTS = {
      taxMode: "general",
      landAreaSqm: "",
      rightNumerator: "1",
      rightDenominator: "1",
      transferUnitValue: "",
      transferTotalValue: "",
      originalUnitValue: "",
      originalTotalValue: "",
      transferYear: "",
      transferMonth: "",
      originalYear: "",
      originalMonth: "",
      landImprovementCost: "",
      engineeringBenefitFee: "",
      landReadjustmentBurden: "",
      donatedLandValue: "",
      holdingYears: ""
    };
  }
});

// src/dom.js
var $, els2, specialRemarkEls2, mainPurposeEls2;
var init_dom = __esm({
  "src/dom.js"() {
    "use strict";
    $ = (id) => document.getElementById(id);
    els2 = {
      queryTitle: $("queryTitle"),
      cityName: $("cityName"),
      districtName: $("districtName"),
      communityName: $("communityName"),
      periodStartYear: $("periodStartYear"),
      periodStartMonth: $("periodStartMonth"),
      periodEndYear: $("periodEndYear"),
      periodEndMonth: $("periodEndMonth"),
      dealTargetPick: document.querySelectorAll("#dealTargetPick input"),
      priceUnit: $("priceUnit"),
      areaUnit: $("areaUnit"),
      priceUnitChoice: document.querySelectorAll('input[name="priceUnitChoice"]'),
      areaUnitChoice: document.querySelectorAll('input[name="areaUnitChoice"]'),
      houseAgePreset: $("houseAgePreset"),
      houseAgeCustomWrap: $("houseAgeCustomWrap"),
      subjectAddress: $("subjectAddress"),
      roadKeyword: $("roadKeyword"),
      totalFloors: $("totalFloors"),
      houseType: $("houseType"),
      isTownhouse: $("isTownhouse"),
      typeQuickPick: document.querySelectorAll("#typeQuickPick input"),
      mainPurposePick: document.querySelectorAll("#mainPurposePick input"),
      usageZonePick: document.querySelectorAll("#usageZonePick input"),
      tradeTarget: $("tradeTarget"),
      floorFilter: $("floorFilter"),
      layoutFilter: $("layoutFilter"),
      totalPriceMin: $("totalPriceMin"),
      totalPriceMax: $("totalPriceMax"),
      unitPriceMin: $("unitPriceMin"),
      unitPriceMax: $("unitPriceMax"),
      mainAreaMinFilter: $("mainAreaMinFilter"),
      mainAreaMaxFilter: $("mainAreaMaxFilter"),
      houseAgeMin: $("houseAgeMin"),
      houseAgeMax: $("houseAgeMax"),
      specialKeywords: $("specialKeywords"),
      specialModeChoice: document.querySelectorAll('input[name="specialMode"]'),
      tabManual: $("tabManual"),
      tabUpload: $("tabUpload"),
      toggleManualAdvancedBtn: $("toggleManualAdvancedBtn"),
      manualAdvanced: $("manualAdvanced"),
      queryProgress: $("queryProgress"),
      queryProgressText: $("queryProgressText"),
      toggleDeedFieldsBtn: $("toggleDeedFieldsBtn"),
      deedFieldsPanel: $("deedFieldsPanel"),
      recordsPanel: $("recordsPanel"),
      toggleRecordsPanelBtn: $("toggleRecordsPanelBtn"),
      globalActionProgress: $("globalActionProgress"),
      globalActionProgressText: $("globalActionProgressText"),
      mainArea: $("mainArea"),
      attachArea: $("attachArea"),
      commonArea: $("commonArea"),
      otherArea: $("otherArea"),
      landShareRaw: $("landShareRaw"),
      landShareArea: $("landShareArea"),
      totalAreaOverride: $("totalAreaOverride"),
      totalWithParkingArea: $("totalWithParkingArea"),
      parkingArea: $("parkingArea"),
      parkingCount: $("parkingCount"),
      parkingUnitPrice: $("parkingUnitPrice"),
      sourceFile: $("sourceFile"),
      sourcePreview: $("sourcePreview"),
      toggleSourcePreviewBtn: $("toggleSourcePreviewBtn"),
      ocrBtn: $("ocrBtn"),
      ocrProgressBar: $("ocrProgressBar"),
      ocrProgressText: $("ocrProgressText"),
      ocrLog: $("ocrLog"),
      ocrFieldDiagnostics: $("ocrFieldDiagnostics"),
      toggleOcrDiagnosticsBtn: $("toggleOcrDiagnosticsBtn"),
      fieldDetectorStatus: $("fieldDetectorStatus"),
      fieldDetectorStatusBadge: $("fieldDetectorStatusBadge"),
      fieldDetectorStatusText: $("fieldDetectorStatusText"),
      fieldDetectorStatusLinks: $("fieldDetectorStatusLinks"),
      refreshFieldDetectorStatusBtn: $("refreshFieldDetectorStatusBtn"),
      recognizedPropertyAddress: $("recognizedPropertyAddress"),
      copyPropertyAddressBtn: $("copyPropertyAddressBtn"),
      cathayStatusText: $("cathayStatusText"),
      cathayStatusBtn: $("cathayStatusBtn"),
      cathayLoginBtn: $("cathayLoginBtn"),
      cathaySearchBtn: $("cathaySearchBtn"),
      cathayAppendMode: $("cathayAppendMode"),
      sampleBtn: $("sampleBtn"),
      resetBtn: $("resetBtn"),
      searchBtn: $("searchBtn"),
      manualSearchBtn: $("manualSearchBtn"),
      recalcBtn: $("recalcBtn"),
      recordsInput: $("recordsInput"),
      totalAreaDisplay: $("totalAreaDisplay"),
      parkingAreaDisplay: $("parkingAreaDisplay"),
      landShareAreaDisplay: $("landShareAreaDisplay"),
      usableAreaDisplay: $("usableAreaDisplay"),
      recordCountDisplay: $("recordCountDisplay"),
      recordCountDisplayCard: $("recordCountDisplayCard"),
      areaExplain: $("areaExplain"),
      avgUnitPrice: $("avgUnitPrice"),
      avgUnitPriceSub: $("avgUnitPriceSub"),
      trimmedRange: $("trimmedRange"),
      trimmedRangeSub: $("trimmedRangeSub"),
      houseValue: $("houseValue"),
      houseValueSub: $("houseValueSub"),
      resultMessage: $("resultMessage"),
      resultBody: $("resultBody"),
      calcExplain: $("calcExplain"),
      dynamicStructuredData: $("dynamicStructuredData"),
      dynamicSearchDataset: $("dynamicSearchDataset")
    };
    specialRemarkEls2 = {
      toggle: $("specialRemarkToggle"),
      panel: $("specialRemarkPanel"),
      summary: $("specialRemarkSummary"),
      all: $("specialRemarkAll"),
      options: document.querySelectorAll(".special-remark-option")
    };
    mainPurposeEls2 = {
      toggle: $("mainPurposeToggle"),
      panel: $("mainPurposePanel"),
      summary: $("mainPurposeSummary"),
      all: $("mainPurposeAll"),
      options: document.querySelectorAll("#mainPurposePick input")
    };
  }
});

// src/ui/progress.js
function setOcrProgress3(percent, text) {
  const safe = Math.max(0, Math.min(100, Number(percent) || 0));
  els2.ocrProgressBar.style.width = `${safe}%`;
  els2.ocrProgressText.textContent = text;
}
var init_progress = __esm({
  "src/ui/progress.js"() {
    "use strict";
    init_dom();
    init_utils();
  }
});

// src/ocr-image.js
function foundOcrRoot() {
  return window.FoundOcr || null;
}
function horizontalProjectionVarianceScore(ctx, w, h) {
  const { data } = ctx.getImageData(0, 0, w, h);
  const sums = new Float64Array(h);
  for (let y = 0; y < h; y++) {
    let s = 0;
    const row = y * w * 4;
    for (let x = 0; x < w; x++) {
      const g = data[row + x * 4];
      s += (255 - g) / 255;
    }
    sums[y] = s;
  }
  let mean = 0;
  for (let y = 0; y < h; y++) mean += sums[y];
  mean /= h;
  let v = 0;
  for (let y = 0; y < h; y++) {
    const d = sums[y] - mean;
    v += d * d;
  }
  return v / Math.max(1, h);
}
function binarizeCanvasForDeskewAnalysis(ctx, w, h) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const gray = Math.round(d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114);
    const b = gray < 175 ? 0 : 255;
    d[i] = d[i + 1] = d[i + 2] = b;
    d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}
function buildDownscaledBinaryForDeskew(sourceCanvas) {
  const w0 = sourceCanvas.width;
  const h0 = sourceCanvas.height;
  const scale = Math.min(1, OCR_DESKEW_ANALYSIS_MAX_SIDE / Math.max(w0, h0));
  const w = Math.max(1, Math.round(w0 * scale));
  const h = Math.max(1, Math.round(h0 * scale));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const tx = c.getContext("2d", { alpha: false });
  tx.fillStyle = "#fff";
  tx.fillRect(0, 0, w, h);
  tx.drawImage(sourceCanvas, 0, 0, w0, h0, 0, 0, w, h);
  binarizeCanvasForDeskewAnalysis(tx, w, h);
  return c;
}
function estimateDeskewDegrees(sourceCanvas) {
  const w0 = sourceCanvas.width;
  const h0 = sourceCanvas.height;
  if (w0 < OCR_DESKEW_MIN_SIDE || h0 < OCR_DESKEW_MIN_SIDE) return 0;
  const small = buildDownscaledBinaryForDeskew(sourceCanvas);
  const sw = small.width;
  const sh = small.height;
  const diag = Math.max(32, Math.ceil(Math.hypot(sw, sh) * 1.1));
  const tmp = document.createElement("canvas");
  tmp.width = diag;
  tmp.height = diag;
  const tcx = tmp.getContext("2d", { alpha: false });
  const cx = diag / 2;
  const cy = diag / 2;
  const scoreAt = (deg) => {
    tcx.fillStyle = "#fff";
    tcx.fillRect(0, 0, diag, diag);
    tcx.save();
    tcx.translate(cx, cy);
    tcx.rotate(deg * Math.PI / 180);
    tcx.imageSmoothingEnabled = true;
    tcx.imageSmoothingQuality = "low";
    tcx.drawImage(small, -sw / 2, -sh / 2);
    tcx.restore();
    return horizontalProjectionVarianceScore(tcx, diag, diag);
  };
  let bestAngle = 0;
  let bestScore = -1;
  for (let deg = -OCR_DESKEW_MAX_DEG; deg <= OCR_DESKEW_MAX_DEG + 1e-9; deg += OCR_DESKEW_STEP_COARSE) {
    const sc = scoreAt(deg);
    if (sc > bestScore) {
      bestScore = sc;
      bestAngle = deg;
    }
  }
  const refineLo = Math.max(-OCR_DESKEW_MAX_DEG, bestAngle - OCR_DESKEW_STEP_COARSE);
  const refineHi = Math.min(OCR_DESKEW_MAX_DEG, bestAngle + OCR_DESKEW_STEP_COARSE);
  for (let deg = refineLo; deg <= refineHi + 1e-9; deg += OCR_DESKEW_STEP_FINE) {
    const sc = scoreAt(deg);
    if (sc > bestScore) {
      bestScore = sc;
      bestAngle = deg;
    }
  }
  return bestAngle;
}
function rotateCanvasByDegrees(sourceCanvas, deg) {
  if (!deg || Math.abs(deg) < 0.01) return sourceCanvas;
  const rad = deg * Math.PI / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const nw = Math.max(1, Math.ceil(sourceCanvas.width * cos + sourceCanvas.height * sin));
  const nh = Math.max(1, Math.ceil(sourceCanvas.width * sin + sourceCanvas.height * cos));
  const out = document.createElement("canvas");
  out.width = nw;
  out.height = nh;
  const octx = out.getContext("2d", { alpha: false });
  octx.fillStyle = "#fff";
  octx.fillRect(0, 0, nw, nh);
  octx.imageSmoothingEnabled = true;
  octx.imageSmoothingQuality = "high";
  octx.save();
  octx.translate(nw / 2, nh / 2);
  octx.rotate(rad);
  octx.drawImage(sourceCanvas, -sourceCanvas.width / 2, -sourceCanvas.height / 2);
  octx.restore();
  return out;
}
function deskewCanvasForOcr(sourceCanvas) {
  const deg = estimateDeskewDegrees(sourceCanvas);
  if (!Number.isFinite(deg) || Math.abs(deg) < OCR_DESKEW_APPLY_MIN_ABS_DEG) return sourceCanvas;
  return rotateCanvasByDegrees(sourceCanvas, deg);
}
function canvasToBackendBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas \u8F49\u63DB OCR \u5716\u7247\u5931\u6557"));
    }, "image/jpeg", 0.92);
  });
}
function backendMimeForBlob(blob) {
  const type = String(blob?.type || "").toLowerCase();
  if (type.includes("pdf")) return "application/pdf";
  if (type.includes("png")) return "image/png";
  if (type.includes("jpg") || type.includes("jpeg")) return "image/jpeg";
  return "image/jpeg";
}
function normalizeBackendConfidence(value) {
  const raw = Number(value) || 0;
  const root4 = foundOcrRoot();
  return root4?.normalizeConfidence ? root4.normalizeConfidence(raw) : raw / 100;
}
function backendOcrPreprocessModes(result) {
  return (result?.page_results || []).map((page) => String(page?.preprocessMode || "").toLowerCase()).filter(Boolean);
}
function isRapidBackendResult(result) {
  const engine = String(result?.ocr_engine || result?.engine || "").toLowerCase();
  return engine.includes("rapid") || backendOcrPreprocessModes(result).includes("rapidocr");
}
function isCloudVisionBackendResult(result) {
  const engine = String(result?.ocr_engine || result?.engine || "").toLowerCase();
  return engine.includes("cloud") || backendOcrPreprocessModes(result).includes("cloudvision");
}
function isRapidCloudVisionBackendResult(result) {
  return isRapidBackendResult(result) && isCloudVisionBackendResult(result);
}
function backendOcrSourceName(result, fallbackSource, ocrLayout = "fullPage") {
  const sources = foundOcrRoot()?.SOURCES || {};
  const isFieldLevel = /^field/i.test(String(ocrLayout || ""));
  if (isRapidCloudVisionBackendResult(result)) {
    return isFieldLevel ? sources.FIELD_LEVEL_RAPID_OCR_CLOUD_VISION || "fieldLevelRapidOcrCloudVision" : sources.RAPID_OCR_CLOUD_VISION || "rapidOcrCloudVision";
  }
  if (isCloudVisionBackendResult(result)) {
    return isFieldLevel ? sources.FIELD_LEVEL_CLOUD_VISION_OCR || "fieldLevelCloudVisionOcr" : sources.CLOUD_VISION_OCR || "cloudVisionOcr";
  }
  if (isRapidBackendResult(result)) {
    return isFieldLevel ? sources.FIELD_LEVEL_RAPID_OCR || "fieldLevelRapidOcr" : sources.RAPID_OCR || "rapidOcr";
  }
  return fallbackSource;
}
function backendPrimaryEngine(result) {
  const pageEngine = (result?.pages || []).map((page) => page?.engine).find(Boolean);
  return String(result?.ocr_engine_used || result?.ocr_engine || result?.engine || pageEngine || "ocr_pipeline");
}
function backendOcrEngineName(result) {
  const engine = backendPrimaryEngine(result);
  const lowered = engine.toLowerCase();
  if (isRapidCloudVisionBackendResult(result)) return "backend-rapidocr-cloud-vision";
  if (isCloudVisionBackendResult(result)) return "backend-cloud-vision";
  if (isRapidBackendResult(result)) return "backend-rapidocr";
  if (lowered.includes("paddleocr_docker") || lowered.includes("docker")) return "paddleocr_docker";
  if (lowered.includes("ppocrv5") || lowered.includes("ncnn")) return "ppocrv5_ncnn";
  if (lowered.includes("macos") || lowered.includes("vision")) return "macos_vision";
  if (lowered.includes("tesseract")) return "tesseract_cli_disabled";
  return engine || "ocr_pipeline";
}
function rememberBackendOcrResult(detailed) {
  const root4 = foundOcrRoot();
  if (!root4 || !detailed) return;
  root4.lastBackendOcrSource = detailed.source || "";
  root4.lastBackendOcrEngine = detailed.engine || "";
  root4.lastBackendOcrModelVersion = detailed.modelVersion || "";
  root4.lastBackendOcrElapsedMs = Number(detailed.elapsedMs) || 0;
  root4.lastBackendOcrPages = Number(detailed.pages) || 0;
  root4.lastBackendOcrCacheHit = detailed.cached === true;
  root4.lastBackendOcrCacheKey = detailed.cacheKey || "";
}
function backendTextFromResult(result) {
  if (typeof result?.text === "string") return result.text;
  return (Array.isArray(result?.pages) ? result.pages : []).map((page) => String(page?.text || "").trim()).filter(Boolean).join("\n\n");
}
function backendConfidenceFromResult(result) {
  const direct = Number(result?.confidence);
  if (Number.isFinite(direct)) return direct;
  const values = (Array.isArray(result?.pages) ? result.pages : []).map((page) => Number(page?.confidence)).filter(Number.isFinite);
  if (!values.length) return void 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
function buildBackendOcrDetailed(result, context = {}) {
  const {
    ocrSourceName = "ocr_pipeline",
    ocrLayout = "fullPage",
    cacheRegion = null,
    cacheKey = "",
    modelVersionFallback = "ocr_pipeline"
  } = context;
  const backendSource = backendOcrSourceName(result, ocrSourceName, ocrLayout);
  const backendEngine = backendOcrEngineName(result);
  const confidence = backendConfidenceFromResult(result);
  return {
    text: backendTextFromResult(result),
    rawConfidence: confidence,
    confidence: normalizeBackendConfidence(confidence),
    source: result?.source || backendSource,
    engine: backendEngine,
    modelVersion: `${backendEngine}:${backendPrimaryEngine(result) || modelVersionFallback}`,
    region: cacheRegion,
    cached: result?.cached === true || result?.cache?.hit === true,
    cacheKey: result?.cache?.key || cacheKey,
    pages: Array.isArray(result?.pages) ? result.pages.length : result?.pages || 1,
    elapsedMs: result?.elapsed_ms || 0,
    pageResults: result?.page_results || result?.pages || []
  };
}
function backendTextOnlyEndpoint() {
  const endpoint = String(ocrConfig?.paddleEndpoint || "http://127.0.0.1:8001/ocr/deed");
  if (/\/ocr\/deed\/?$/i.test(endpoint)) return endpoint.replace(/\/ocr\/deed\/?$/i, "/ocr/deed/text-only");
  return `${endpoint.replace(/\/+$/, "")}/text-only`;
}
async function recognizeViaBackend(source, options = {}) {
  const backendOk = await checkBackendOcrHealth();
  if (!backendOk) return null;
  let blob = null;
  if (source instanceof HTMLCanvasElement) {
    blob = await canvasToBackendBlob(source);
  } else if (source instanceof Blob) {
    blob = source;
  } else {
    return null;
  }
  const form = new FormData();
  const filename = options.fileName || blob instanceof File && blob.name || `ocr-source.${backendMimeForBlob(blob).includes("png") ? "png" : "jpg"}`;
  form.append("file", blob, filename);
  form.append("max_pages", Number.isFinite(Number(options.maxPages)) ? String(Math.max(1, Math.floor(Number(options.maxPages)))) : "5");
  form.append("dpi", Number.isFinite(Number(options.dpi)) ? String(Math.max(120, Math.floor(Number(options.dpi)))) : String(ocrConfig?.paddlePdfDpi || 180));
  form.append("fast", options.fast === false ? "false" : "true");
  const response = await fetch(backendTextOnlyEndpoint(), {
    method: "POST",
    body: form,
    signal: options.signal
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `\u5F8C\u7AEF OCR \u932F\u8AA4 HTTP ${response.status}`);
  }
  return response.json();
}
async function ocrFileViaBackendDetailed(file, options = {}) {
  try {
    const result = await recognizeViaBackend(file, options);
    if (!result) return null;
    const detailed = buildBackendOcrDetailed(result, {
      ocrSourceName: options.source || "ocr_pipeline",
      ocrLayout: options.ocrLayout || "fullPage",
      modelVersionFallback: "ocr_pipeline"
    });
    rememberBackendOcrResult(detailed);
    return detailed;
  } catch (error) {
    console.warn("[OCR] \u5F8C\u7AEF OCR \u5931\u6557\uFF0C\u700F\u89BD\u5668 Tesseract \u5DF2\u505C\u7528\u3002", error);
    markBackendOcrUnavailable();
    return null;
  }
}
async function ocrImageSourceDetailed(source, progressPrefix, options = {}) {
  const { focusTop = false, regionStart = null, regionEnd = null, ocrLayout = "fullPage" } = options;
  const root4 = foundOcrRoot();
  const normalizedRegion = root4?.normalizeRegion ? root4.normalizeRegion(options.region || options.bbox || null) : null;
  const ocrSourceName = options.source || "ocr_pipeline";
  const modelVersion = options.modelVersion || "ocr_pipeline";
  let fileHash = options.cacheFileHash || "";
  try {
    if (!fileHash && source instanceof Blob && root4?.ocrCache?.hashBlob) fileHash = await root4.ocrCache.hashBlob(source);
  } catch (_) {
    fileHash = "";
  }
  const cacheRegion = normalizedRegion || (Number.isFinite(regionStart) || Number.isFinite(regionEnd) ? { y: Number.isFinite(regionStart) ? regionStart : 0, h: Number.isFinite(regionEnd) && Number.isFinite(regionStart) ? Math.max(0.05, regionEnd - regionStart) : 0.62, layout: ocrLayout, label: progressPrefix || "" } : null);
  const cacheKey = fileHash && root4?.ocrCache?.createCacheKey ? root4.ocrCache.createCacheKey({
    fileHash,
    page: options.pageNumber || 1,
    dpi: options.dpi || "",
    region: cacheRegion,
    engine: options.engine || "ocr_pipeline",
    modelVersion
  }) : "";
  if (cacheKey && root4?.ocrCache?.get) {
    try {
      const cached = await root4.ocrCache.get(cacheKey);
      if (cached?.text != null) {
        const detailed = { ...cached, cached: true, cacheKey };
        rememberBackendOcrResult(detailed);
        return detailed;
      }
    } catch (_) {
    }
  }
  const isFullSourceImage = source instanceof Blob && !normalizedRegion && !focusTop && !(Number.isFinite(regionStart) && Number.isFinite(regionEnd));
  if (isFullSourceImage && options.directBackend !== false) {
    const backendResult2 = await (async () => {
      try {
        return await recognizeViaBackend(source, options);
      } catch (error) {
        console.warn("[OCR] \u5F8C\u7AEF OCR \u5931\u6557\uFF0C\u700F\u89BD\u5668 Tesseract \u5DF2\u505C\u7528\u3002", error);
        markBackendOcrUnavailable();
        return null;
      }
    })();
    if (backendResult2) {
      const detailed = buildBackendOcrDetailed(backendResult2, {
        ocrSourceName,
        ocrLayout,
        cacheRegion,
        cacheKey,
        modelVersionFallback: "ocr_pipeline"
      });
      if (cacheKey && root4?.ocrCache?.set) {
        try {
          root4.ocrCache.set(cacheKey, detailed);
        } catch (_) {
        }
      }
      rememberBackendOcrResult(detailed);
      return detailed;
    }
  }
  const renderToCanvas = (input) => new Promise((resolve, reject) => {
    const cropCanvas = (baseCanvas) => {
      if (!normalizedRegion && !focusTop && !(Number.isFinite(regionStart) && Number.isFinite(regionEnd))) return baseCanvas;
      const cropped = document.createElement("canvas");
      const sx = normalizedRegion ? Math.round(baseCanvas.width * normalizedRegion.x) : 0;
      const sy = normalizedRegion ? Math.round(baseCanvas.height * normalizedRegion.y) : Math.round(baseCanvas.height * (Number.isFinite(regionStart) ? Math.max(0, Math.min(0.95, regionStart)) : 0));
      const sw = normalizedRegion ? Math.max(1, Math.round(baseCanvas.width * normalizedRegion.w)) : baseCanvas.width;
      const fallbackEnd = Number.isFinite(regionEnd) ? Math.max((Number.isFinite(regionStart) ? regionStart : 0) + 0.05, Math.min(1, regionEnd)) : 0.62;
      const sh = normalizedRegion ? Math.max(1, Math.round(baseCanvas.height * normalizedRegion.h)) : Math.max(1, Math.round(baseCanvas.height * (focusTop ? 0.62 : fallbackEnd - (Number.isFinite(regionStart) ? Math.max(0, Math.min(0.95, regionStart)) : 0))));
      cropped.width = sw;
      cropped.height = sh;
      const cctx = cropped.getContext("2d", { alpha: false });
      cctx.fillStyle = "#fff";
      cctx.fillRect(0, 0, cropped.width, cropped.height);
      cctx.drawImage(baseCanvas, sx, sy, sw, sh, 0, 0, cropped.width, cropped.height);
      return cropped;
    };
    if (input instanceof HTMLCanvasElement) {
      const scaled = document.createElement("canvas");
      const scale = 2.8;
      scaled.width = Math.max(1, Math.round(input.width * scale));
      scaled.height = Math.max(1, Math.round(input.height * scale));
      const sctx = scaled.getContext("2d", { alpha: false });
      sctx.fillStyle = "#fff";
      sctx.fillRect(0, 0, scaled.width, scaled.height);
      sctx.drawImage(input, 0, 0, scaled.width, scaled.height);
      resolve(cropCanvas(scaled));
      return;
    }
    const image = new Image();
    let objectUrl = "";
    image.onload = () => {
      const scale = 3;
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const ctx = canvas.getContext("2d", { alpha: false });
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resolve(cropCanvas(canvas));
    };
    image.onerror = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error("\u5716\u7247\u524D\u8655\u7406\u5931\u6557"));
    };
    objectUrl = input instanceof Blob ? URL.createObjectURL(input) : "";
    image.src = objectUrl || input;
  });
  const rendered = await renderToCanvas(source);
  const backendCanvas = options.clientDeskew === true ? deskewCanvasForOcr(rendered) : rendered;
  const backendResult = await (async () => {
    try {
      return await recognizeViaBackend(backendCanvas, options);
    } catch (error) {
      console.warn("[OCR] \u5F8C\u7AEF OCR \u5931\u6557\uFF0C\u700F\u89BD\u5668 Tesseract \u5DF2\u505C\u7528\u3002", error);
      markBackendOcrUnavailable();
      return null;
    }
  })();
  if (backendResult) {
    const detailed = buildBackendOcrDetailed(backendResult, {
      ocrSourceName,
      ocrLayout,
      cacheRegion,
      cacheKey,
      modelVersionFallback: "ocr_pipeline"
    });
    if (cacheKey && root4?.ocrCache?.set) {
      try {
        root4.ocrCache.set(cacheKey, detailed);
      } catch (_) {
      }
    }
    rememberBackendOcrResult(detailed);
    return detailed;
  }
  throw new Error("OCR \u5F8C\u7AEF\u672A\u80FD\u5B8C\u6210\u8FA8\u8B58\uFF1B\u700F\u89BD\u5668 Tesseract \u5DF2\u505C\u7528\uFF0C\u8ACB\u78BA\u8A8D 8001 OCR \u5F8C\u7AEF\u53EF\u7528\uFF0C\u82E5\u9700 Docker \u88DC\u5F37\u518D\u78BA\u8A8D 8099 \u670D\u52D9\u5DF2\u555F\u52D5\u3002");
}
async function ocrImageSource2(source, progressPrefix, options = {}) {
  const detailed = await ocrImageSourceDetailed(source, progressPrefix, options);
  return detailed?.text || "";
}
var OCR_DESKEW_MAX_DEG, OCR_DESKEW_STEP_COARSE, OCR_DESKEW_STEP_FINE, OCR_DESKEW_MIN_SIDE, OCR_DESKEW_APPLY_MIN_ABS_DEG, OCR_DESKEW_ANALYSIS_MAX_SIDE;
var init_ocr_image = __esm({
  "src/ocr-image.js"() {
    "use strict";
    init_progress();
    init_config();
    init_constants();
    OCR_DESKEW_MAX_DEG = 14;
    OCR_DESKEW_STEP_COARSE = 0.75;
    OCR_DESKEW_STEP_FINE = 0.1;
    OCR_DESKEW_MIN_SIDE = 48;
    OCR_DESKEW_APPLY_MIN_ABS_DEG = 0.28;
    OCR_DESKEW_ANALYSIS_MAX_SIDE = 240;
  }
});

// src/ocr-pdf.js
function foundOcrRoot2() {
  return window.FoundOcr || null;
}
async function extractPdfTextLayerDetailed(file, options = {}) {
  const maxPages = Math.max(1, Number(options.maxPages) || Infinity);
  const buffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: buffer }).promise;
  const pages = [];
  const pageLimit = Math.min(pdf.numPages, maxPages);
  for (let pageNo = 1; pageNo <= pageLimit; pageNo += 1) {
    const page = await pdf.getPage(pageNo);
    const textContent = await page.getTextContent();
    pages.push(textContent.items.map((item) => item.str).join(" "));
  }
  return {
    text: pages.join("\n"),
    pages,
    source: "pdfTextLayer",
    confidence: pages.some((pageText) => cleanOcrText(pageText).length > 40) ? 0.96 : 0.4,
    pageCount: pdf.numPages,
    extractedPages: pageLimit
  };
}
async function ocrPdfFile2(file, options = {}) {
  const maxPages = Math.max(1, Number(options.maxPages) || PDF_BROWSER_OCR_MAX_PAGES);
  const backendDetailed = await ocrFileViaBackendDetailed(file, options);
  if (backendDetailed?.text && cleanOcrText(backendDetailed.text).length > 20) return backendDetailed.text;
  let fileHash = options.cacheFileHash || "";
  try {
    const cache = foundOcrRoot2()?.ocrCache;
    if (!fileHash && cache?.hashBlob) fileHash = await cache.hashBlob(file);
  } catch (_) {
  }
  const buffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: buffer }).promise;
  const pages = [];
  const pageLimit = Math.min(pdf.numPages, maxPages);
  for (let pageNo = 1; pageNo <= pageLimit; pageNo += 1) {
    const page = await pdf.getPage(pageNo);
    const viewport = page.getViewport({ scale: pdfViewportScaleForOcr(options.dpi) });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { alpha: false });
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    const pageLabel = pageLimit < pdf.numPages ? `${pageNo}/${pageLimit}\uFF08\u5168 ${pdf.numPages} \u9801\uFF09` : `${pageNo}/${pdf.numPages}`;
    setOcrProgress3(Math.round((pageNo - 1) / pageLimit * 100), `PDF \u8F49\u5716\u4E2D ${pageLabel}`);
    pages.push(await ocrImageSource2(canvas, `PDF OCR \u7B2C ${pageNo}/${pdf.numPages} \u9801`, { ocrLayout: "fullPage", cacheFileHash: fileHash, pageNumber: pageNo, dpi: options.dpi || PDF_OCR_RASTER_DPI }));
  }
  return pages.join("\n");
}
var init_ocr_pdf = __esm({
  "src/ocr-pdf.js"() {
    "use strict";
    init_constants();
    init_utils();
    init_progress();
    init_ocr_image();
  }
});

// landValueTaxCalculator.js
function toLandTaxNumber2(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const normalized = String(value ?? "").replace(/[，,]/g, "").replace(/％/g, "%").trim();
  if (!normalized) return 0;
  const number = Number(normalized.replace(/[^\d.-]/g, ""));
  return Number.isFinite(number) ? number : 0;
}
var PING_PER_SQM2;
var init_landValueTaxCalculator2 = __esm({
  "landValueTaxCalculator.js"() {
    "use strict";
    init_landValueTaxCpiData();
    PING_PER_SQM2 = 0.3025;
  }
});

// landValueTaxDeedParser.js?v=20260521-original-value-autofill
function normalizeLandTaxText(rawText) {
  return normalizeLandDeedMarkers(normalizeOcrAreaUnits(cleanOcrText(rawText || "")));
}
function numericText(value) {
  return String(value ?? "").normalize("NFKC").replace(/[，,]/g, "").replace(/[^\d.]/g, "");
}
function numberValue(value) {
  const number = Number(numericText(value));
  return Number.isFinite(number) ? number : null;
}
function formatDecimal(value, digits = 3) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "";
  return number.toFixed(digits).replace(/\.?0+$/g, "");
}
function isPingUnit(unit) {
  return /坪/.test(String(unit || ""));
}
function landAreaToSqm(area) {
  const raw = numberValue(area?.areaText ?? area?.area);
  if (!Number.isFinite(raw)) return null;
  return isPingUnit(area?.unit) ? raw / PING_PER_SQM2 : raw;
}
function uniqueLandShareEntries(entries) {
  const seen = /* @__PURE__ */ new Set();
  const result = [];
  for (const entry of entries || []) {
    const key = [
      entry?.parcel || "",
      entry?.areaText || entry?.area || "",
      entry?.unit || "",
      Number(entry?.ratio || 0).toFixed(10),
      entry?.rights || ""
    ].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(entry);
  }
  return result;
}
function ratioToFractionText(ratio) {
  const value = Number(ratio);
  if (!Number.isFinite(value) || value <= 0) return null;
  if (Math.abs(value - 1) < 1e-8) return { numText: "1", denomText: "1" };
  const denominators = [2, 3, 4, 5, 6, 8, 10, 12, 16, 100, 1e3, 1e4, 1e5];
  for (const denominator of denominators) {
    const numerator = Math.round(value * denominator);
    if (numerator <= 0) continue;
    if (Math.abs(numerator / denominator - value) < 1e-8) {
      return { numText: String(numerator), denomText: String(denominator) };
    }
  }
  return null;
}
function sameRatioLandShare(entries) {
  const source = uniqueLandShareEntries(entries).filter((entry) => {
    const ratio = Number(entry?.ratio);
    return Number.isFinite(ratio) && ratio > 0;
  });
  if (source.length < 2) return null;
  const firstRatio = Number(source[0].ratio);
  if (!source.every((entry) => Math.abs(Number(entry.ratio) - firstRatio) < 1e-8)) return null;
  const rightsText = String(source[0].rights || "");
  const rightsMatch = rightsText.match(/(\d{1,12})分之(\d{1,12})/);
  const fraction = rightsMatch ? { denomText: rightsMatch[1], numText: rightsMatch[2] } : ratioToFractionText(firstRatio);
  if (!fraction?.numText || !fraction?.denomText) return null;
  return {
    entries: source,
    ratio: firstRatio,
    rightsText: rightsText || `${fraction.denomText}\u5206\u4E4B${fraction.numText}`,
    numText: fraction.numText,
    denomText: fraction.denomText
  };
}
function grossLandAreaSqmFromEntries(entries) {
  return uniqueLandShareEntries(entries).reduce((sum, entry) => {
    const sqm = landAreaToSqm(entry);
    return sum + (Number.isFinite(sqm) ? sqm : 0);
  }, 0);
}
function firstValidOwnershipRight(rights) {
  return (rights || []).find((right) => {
    const ratio = Number(right?.ratio);
    return Number.isFinite(ratio) && ratio > 0 && ratio <= 1;
  }) || null;
}
function field(label, value, raw = "", source = "text") {
  return { label, value, raw, source };
}
function addWarning(warnings, message) {
  if (message && !warnings.includes(message)) warnings.push(message);
}
function chooseLandAreaAndRights(rawText, warnings) {
  const areas = parseLandAreasFromLabelSection(rawText);
  const rights = parseLandRightsFromOwnershipSection(rawText);
  const separated = sumLandShareFromSeparatedLandSections(rawText);
  const directShare = extractLandShareFromOcrText(rawText);
  const sameRatioShare = sameRatioLandShare(separated.entries);
  if (sameRatioShare) {
    const grossSqm = grossLandAreaSqmFromEntries(sameRatioShare.entries);
    if (grossSqm > 0) {
      addWarning(warnings, "\u5075\u6E2C\u5230\u591A\u7B46\u571F\u5730\u4E14\u6B0A\u5229\u7BC4\u570D\u4E00\u81F4\uFF0C\u5DF2\u52A0\u7E3D\u571F\u5730\u9762\u7A4D\u4E26\u4FDD\u7559\u5171\u540C\u6B0A\u5229\u7BC4\u570D\u3002");
      return {
        landAreaSqm: grossSqm,
        rightNumerator: sameRatioShare.numText,
        rightDenominator: sameRatioShare.denomText,
        mode: "multiParcelSameRight",
        fields: {
          landAreaSqm: field(
            "\u571F\u5730\u9762\u7A4D\u5408\u8A08",
            formatDecimal(grossSqm),
            sameRatioShare.entries.map((entry) => `${entry.parcel ? `${entry.parcel} ` : ""}${entry.areaText}${entry.unit || ""}`).join("\u3001"),
            "landShareSum"
          ),
          rightNumerator: field("\u6B0A\u5229\u7BC4\u570D\u5206\u5B50", sameRatioShare.numText, sameRatioShare.rightsText, "landShareSum"),
          rightDenominator: field("\u6B0A\u5229\u7BC4\u570D\u5206\u6BCD", sameRatioShare.denomText, sameRatioShare.rightsText, "landShareSum")
        }
      };
    }
  }
  const separatedEntries = uniqueLandShareEntries(separated.entries);
  if (separatedEntries.length > 1) {
    const effectivePing = separated.valuePing ?? directShare.valuePing;
    if (Number.isFinite(effectivePing)) {
      const effectiveSqm = effectivePing / PING_PER_SQM2;
      addWarning(warnings, "\u5075\u6E2C\u5230\u591A\u7B46\u571F\u5730\u6216\u591A\u7B46\u6B0A\u5229\u7BC4\u570D\uFF0C\u5DF2\u63DB\u7B97\u70BA\u6709\u6548\u6301\u5206\u9762\u7A4D\u4E26\u4EE5 1/1 \u5E36\u5165\u3002");
      return {
        landAreaSqm: effectiveSqm,
        rightNumerator: "1",
        rightDenominator: "1",
        mode: "effectiveShare",
        fields: {
          landAreaSqm: field("\u6709\u6548\u6301\u5206\u571F\u5730\u9762\u7A4D", formatDecimal(effectiveSqm), `${formatDecimal(effectivePing)}\u576A`, "landShareSum"),
          rightNumerator: field("\u6B0A\u5229\u7BC4\u570D\u5206\u5B50", "1", "\u5DF2\u63DB\u7B97\u6709\u6548\u6301\u5206", "landShareSum"),
          rightDenominator: field("\u6B0A\u5229\u7BC4\u570D\u5206\u6BCD", "1", "\u5DF2\u63DB\u7B97\u6709\u6548\u6301\u5206", "landShareSum")
        }
      };
    }
  }
  const seenAreaPing = /* @__PURE__ */ new Set();
  const uniqueAreas = areas.filter((a) => {
    const key = Number(a.valuePing || 0).toFixed(4);
    if (seenAreaPing.has(key)) return false;
    seenAreaPing.add(key);
    return true;
  });
  if (uniqueAreas.length === 1 && rights.length > 1) {
    const sqm = landAreaToSqm(uniqueAreas[0]);
    const firstRight = firstValidOwnershipRight(rights);
    if (Number.isFinite(sqm) && firstRight) {
      addWarning(warnings, "\u5075\u6E2C\u5230\u55AE\u4E00\u5730\u865F\u542B\u591A\u7B46\u6240\u6709\u6B0A\u4EBA\uFF0C\u5DF2\u5E36\u5165\u7B2C\u4E00\u7B46\u6B0A\u5229\u7BC4\u570D\uFF1B\u8ACB\u78BA\u8A8D\u662F\u5426\u70BA\u76EE\u6A19\u6240\u6709\u6B0A\u4EBA\u3002");
      return {
        landAreaSqm: sqm,
        rightNumerator: firstRight.numText || "1",
        rightDenominator: firstRight.denomText || "1",
        mode: "singleParcelFirstOwnerRight",
        fields: {
          landAreaSqm: field("\u571F\u5730\u9762\u7A4D", formatDecimal(sqm), `${uniqueAreas[0].areaText}${uniqueAreas[0].unit || ""}`, "landLabel"),
          rightNumerator: field("\u6B0A\u5229\u7BC4\u570D\u5206\u5B50", firstRight.numText || "1", firstRight.text, "landOwnership"),
          rightDenominator: field("\u6B0A\u5229\u7BC4\u570D\u5206\u6BCD", firstRight.denomText || "1", firstRight.text, "landOwnership")
        }
      };
    }
  }
  if (uniqueAreas.length === 1 && rights.length === 1) {
    const sqm = landAreaToSqm(uniqueAreas[0]);
    if (Number.isFinite(sqm)) {
      return {
        landAreaSqm: sqm,
        rightNumerator: rights[0].numText || "1",
        rightDenominator: rights[0].denomText || "1",
        mode: "singleParcel",
        fields: {
          landAreaSqm: field("\u571F\u5730\u9762\u7A4D", formatDecimal(sqm), `${uniqueAreas[0].areaText}${uniqueAreas[0].unit || ""}`, "landLabel"),
          rightNumerator: field("\u6B0A\u5229\u7BC4\u570D\u5206\u5B50", rights[0].numText || "1", rights[0].text, "landOwnership"),
          rightDenominator: field("\u6B0A\u5229\u7BC4\u570D\u5206\u6BCD", rights[0].denomText || "1", rights[0].text, "landOwnership")
        }
      };
    }
  }
  if (areas.length > 1 || rights.length > 1) {
    const effectivePing = separated.valuePing ?? directShare.valuePing;
    if (Number.isFinite(effectivePing)) {
      const effectiveSqm = effectivePing / PING_PER_SQM2;
      addWarning(warnings, "\u5075\u6E2C\u5230\u591A\u7B46\u571F\u5730\u6216\u591A\u7B46\u6B0A\u5229\u7BC4\u570D\uFF0C\u5DF2\u63DB\u7B97\u70BA\u6709\u6548\u6301\u5206\u9762\u7A4D\u4E26\u4EE5 1/1 \u5E36\u5165\u3002");
      return {
        landAreaSqm: effectiveSqm,
        rightNumerator: "1",
        rightDenominator: "1",
        mode: "effectiveShare",
        fields: {
          landAreaSqm: field("\u6709\u6548\u6301\u5206\u571F\u5730\u9762\u7A4D", formatDecimal(effectiveSqm), `${formatDecimal(effectivePing)}\u576A`, "landShareSum"),
          rightNumerator: field("\u6B0A\u5229\u7BC4\u570D\u5206\u5B50", "1", "\u5DF2\u63DB\u7B97\u6709\u6548\u6301\u5206", "landShareSum"),
          rightDenominator: field("\u6B0A\u5229\u7BC4\u570D\u5206\u6BCD", "1", "\u5DF2\u63DB\u7B97\u6709\u6548\u6301\u5206", "landShareSum")
        }
      };
    }
  }
  if (areas.length) {
    const totalSqm = areas.reduce((sum, area) => sum + (landAreaToSqm(area) || 0), 0);
    if (totalSqm > 0) {
      addWarning(warnings, "\u5DF2\u6293\u5230\u571F\u5730\u9762\u7A4D\uFF0C\u4F46\u672A\u6293\u5230\u6B0A\u5229\u7BC4\u570D\uFF0C\u66AB\u4EE5 1/1 \u5E36\u5165\uFF0C\u8ACB\u6AA2\u67E5\u3002");
      return {
        landAreaSqm: totalSqm,
        rightNumerator: "1",
        rightDenominator: "1",
        mode: "areaOnly",
        fields: {
          landAreaSqm: field("\u571F\u5730\u9762\u7A4D", formatDecimal(totalSqm), areas.map((area) => `${area.areaText}${area.unit || ""}`).join("\u3001"), "landLabel"),
          rightNumerator: field("\u6B0A\u5229\u7BC4\u570D\u5206\u5B50", "1", "\u672A\u8FA8\u8B58", "fallback"),
          rightDenominator: field("\u6B0A\u5229\u7BC4\u570D\u5206\u6BCD", "1", "\u672A\u8FA8\u8B58", "fallback")
        }
      };
    }
  }
  return { fields: {}, mode: "none" };
}
function valueAfterKeyword(source, keywords, options = {}) {
  const compact = compactOcrText(source);
  for (const keyword of keywords) {
    const start = compact.search(keyword instanceof RegExp ? keyword : new RegExp(keyword));
    if (start < 0) continue;
    const windowText = compact.slice(start, start + VALUE_WINDOW);
    const moneyMatch = windowText.match(/(?:新台幣|新臺幣|NT\$)?([0-9][0-9,]{1,12}(?:\.\d+)?)(?:元|圓)(?:\/?平方公尺|每平方公尺|\/?㎡)?/);
    if (!moneyMatch) continue;
    if (options.rejectPrevious && /前次|原地價|原規定地價/.test(windowText.slice(0, moneyMatch.index || 0))) continue;
    const value = toLandTaxNumber2(moneyMatch[1]);
    if (value > 0) return { value, raw: moneyMatch[0], keyword: String(keyword) };
  }
  return null;
}
function extractCurrentValue(source) {
  return valueAfterKeyword(source, [
    /公告土地現值/,
    /申報移轉現值/,
    /當期公告現值/
  ], { rejectPrevious: true });
}
function extractOriginalValue(source) {
  return valueAfterKeyword(source, [
    /前次移轉現值/,
    /原規定地價/,
    /原地價/
  ]);
}
function parseRocDateFromWindow(windowText) {
  const text = toHalfWidth(windowText || "");
  const match = text.match(/(?:民國)?\s*(\d{2,3})\s*年\s*(\d{1,2})\s*月(?:\s*(\d{1,2})\s*日)?/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3] || 1);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null;
  return { year, month, day, raw: match[0] };
}
function extractOriginalPeriod(source) {
  const compact = compactOcrText(source);
  const patterns = [/前次移轉(?:年月|日期)?/, /原因發生日期/, /登記日期/];
  for (const pattern of patterns) {
    const start = compact.search(pattern);
    if (start < 0) continue;
    const date = parseRocDateFromWindow(compact.slice(start, start + 70));
    if (date) return { ...date, label: String(pattern) };
  }
  return null;
}
function computeHoldingYears(originalPeriod, transferPeriod) {
  if (!originalPeriod?.year) return "";
  const now = /* @__PURE__ */ new Date();
  const fallbackYear = now.getFullYear() - 1911;
  const transferYear = Number(transferPeriod?.year) || fallbackYear;
  const years = transferYear - Number(originalPeriod.year);
  return Number.isFinite(years) && years >= 0 ? String(years) : "";
}
function parseLandValueTaxDeedText(rawText, options = {}) {
  const source = normalizeLandTaxText(rawText);
  const warnings = [];
  const fields = {};
  const values = {};
  if (!source) {
    return { values, fields, warnings: ["\u672A\u53D6\u5F97\u53EF\u89E3\u6790\u6587\u5B57\u3002"], rawText: "", hasCoreData: false };
  }
  const areaAndRights = chooseLandAreaAndRights(source, warnings);
  Object.assign(fields, areaAndRights.fields || {});
  if (Number.isFinite(areaAndRights.landAreaSqm)) values.landAreaSqm = formatDecimal(areaAndRights.landAreaSqm);
  if (areaAndRights.rightNumerator) values.rightNumerator = String(areaAndRights.rightNumerator);
  if (areaAndRights.rightDenominator) values.rightDenominator = String(areaAndRights.rightDenominator);
  const currentValue = extractCurrentValue(source);
  if (currentValue?.value) {
    values.transferUnitValue = String(Math.round(currentValue.value));
    fields.transferUnitValue = field("\u7533\u5831\u79FB\u8F49\u73FE\u503C\u55AE\u50F9", values.transferUnitValue, currentValue.raw, "landText");
  }
  const originalValue = extractOriginalValue(source);
  if (originalValue?.value) {
    values.originalUnitValue = String(Math.round(originalValue.value));
    fields.originalUnitValue = field("\u539F\u5730\u50F9\u6216\u524D\u6B21\u73FE\u503C\u55AE\u50F9", values.originalUnitValue, originalValue.raw, "landText");
  }
  const originalPeriod = extractOriginalPeriod(source);
  if (originalPeriod) {
    values.originalYear = String(originalPeriod.year);
    values.originalMonth = String(originalPeriod.month);
    fields.originalPeriod = field("\u539F\u5730\u50F9\u5E74\u6708 CPI", `${originalPeriod.year}-${originalPeriod.month}`, originalPeriod.raw, "landText");
    const holdingYears = computeHoldingYears(originalPeriod, options.transferPeriod);
    if (holdingYears) {
      values.holdingYears = holdingYears;
      fields.holdingYears = field("\u6301\u6709\u5E74\u6578", holdingYears, originalPeriod.raw, "derived");
    }
  }
  const hasCoreData = Boolean(values.landAreaSqm || values.rightNumerator || values.originalUnitValue || values.transferUnitValue);
  if (!hasCoreData) addWarning(warnings, "\u672A\u6293\u5230\u571F\u5730\u9762\u7A4D\u3001\u6B0A\u5229\u7BC4\u570D\u6216\u5730\u50F9\u6B04\u4F4D\uFF0C\u8ACB\u4EBA\u5DE5\u6AA2\u67E5\u8B04\u672C\u6587\u5B57\u3002");
  return {
    values,
    fields,
    warnings,
    rawText: source,
    source: options.source || "text",
    mode: areaAndRights.mode || "none",
    hasCoreData
  };
}
var VALUE_WINDOW;
var init_landValueTaxDeedParser = __esm({
  "landValueTaxDeedParser.js?v=20260521-original-value-autofill"() {
    "use strict";
    init_landValueTaxCalculator2();
    init_utils();
    init_land_share();
    init_area_extract();
    VALUE_WINDOW = 90;
  }
});

// landValueTaxApp.js?v=20260625-multi-upload-land-tax-sync
var landValueTaxApp_exports = {};
function optionLabel(entry) {
  return `${entry.year}\u5E74${entry.month}\u6708\uFF08${entry.index}\uFF09`;
}
function periodOptionsHtml(selectedYear, selectedMonth) {
  const selectedKey = `${String(selectedYear || "").padStart(3, "0")}/${String(selectedMonth || "").padStart(2, "0")}`;
  return cpiOptions.map((entry) => {
    const selected = entry.period === selectedKey ? " selected" : "";
    return `<option value="${entry.year}-${entry.month}"${selected}>${optionLabel(entry)}</option>`;
  }).join("");
}
function parsePeriodValue(value) {
  const [year, month] = String(value || "").split("-").map((part) => Number(part));
  return { year: Number.isFinite(year) ? year : "", month: Number.isFinite(month) ? month : "" };
}
function formatInputNumber2(value) {
  const number = toLandTaxNumber(value);
  return number ? number.toLocaleString("zh-TW") : "";
}
function fieldHtml(id, label, placeholder = "", value = "", extraClass = "") {
  return `
    <label class="land-tax-field ${extraClass}">
      <span>${label}</span>
      <input id="${id}" type="text" inputmode="decimal" value="${value}" placeholder="${placeholder}" autocomplete="off" />
    </label>
  `;
}
function escapeHtml3(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function render() {
  if (!root3) return;
  root3.innerHTML = `
    <div class="land-tax-layout">
      <div class="land-tax-inputs">
        <section class="land-tax-card">
          <div class="land-tax-card-head">
            <h3>\u4E0A\u50B3\u571F\u5730\u8B04\u672C</h3>
            <span>PDF \u6587\u5B57\u5C64\u512A\u5148\uFF1B\u4E0D\u8DB3\u6642\u624D OCR</span>
          </div>
          <div class="land-tax-upload">
            <label class="land-tax-field land-tax-upload-field">
              <span>\u571F\u5730\u8B04\u672C\u6A94\u6848</span>
              <input id="ltDeedFile" class="land-tax-file" type="file" accept="application/pdf,image/*,.pdf,.png,.jpg,.jpeg,.webp" multiple />
            </label>
            <button id="ltParseDeedBtn" type="button" class="btn btn-ghost">\u89E3\u6790\u571F\u5730\u8B04\u672C\u4E26\u5E36\u5165</button>
          </div>
          <div id="ltDeedParseLog" class="land-tax-log">\u5C1A\u672A\u4E0A\u50B3\u571F\u5730\u8B04\u672C\u3002</div>
          <div id="ltDeedParseSummary" class="land-tax-parse-summary" hidden></div>
        </section>

        <section class="land-tax-card">
          <div class="land-tax-card-head">
            <h3>\u57FA\u672C\u8CC7\u6599</h3>
            <span>\u91D1\u984D\u55AE\u4F4D\uFF1A\u5143\uFF1B\u9762\u7A4D\u55AE\u4F4D\uFF1A\u5E73\u65B9\u516C\u5C3A</span>
          </div>
          <div class="land-tax-grid">
            <label class="land-tax-field">
              <span>\u7A05\u7387\u985E\u578B</span>
              <select id="ltTaxMode">
                <option value="general">\u4E00\u822C\u7528\u5730\u4E09\u7D1A\u7D2F\u9032\u7A05\u7387</option>
                <option value="selfUse">\u81EA\u7528\u4F4F\u5B85\u7528\u5730 10%</option>
              </select>
            </label>
            ${fieldHtml("ltLandAreaSqm", "\u571F\u5730\u9762\u7A4D", "\u4F8B\u5982\uFF1A123.45")}
            ${fieldHtml("ltRightNumerator", "\u6B0A\u5229\u7BC4\u570D\u5206\u5B50", "\u4F8B\u5982\uFF1A1", "1")}
            ${fieldHtml("ltRightDenominator", "\u6B0A\u5229\u7BC4\u570D\u5206\u6BCD", "\u4F8B\u5982\uFF1A1", "1")}
            ${fieldHtml("ltTransferUnitValue", "\u7533\u5831\u79FB\u8F49\u73FE\u503C\u55AE\u50F9", "\u5143 / \u5E73\u65B9\u516C\u5C3A")}
            ${fieldHtml("ltTransferTotalValue", "\u7533\u5831\u79FB\u8F49\u73FE\u503C\u7E3D\u984D", "\u6709\u7E3D\u984D\u6642\u512A\u5148\u4F7F\u7528")}
            ${fieldHtml("ltOriginalUnitValue", "\u539F\u5730\u50F9\u6216\u524D\u6B21\u73FE\u503C\u55AE\u50F9", "\u5143 / \u5E73\u65B9\u516C\u5C3A")}
            ${fieldHtml("ltOriginalTotalValue", "\u539F\u5730\u50F9\u6216\u524D\u6B21\u73FE\u503C\u7E3D\u984D", "\u6709\u7E3D\u984D\u6642\u512A\u5148\u4F7F\u7528")}
            ${fieldHtml("ltHoldingYears", "\u6301\u6709\u5E74\u6578", "\u4F8B\u5982\uFF1A21")}
          </div>
        </section>

        <section class="land-tax-card">
          <div class="land-tax-card-head">
            <h3>\u7269\u50F9\u6307\u6578</h3>
            <span>\u8CC7\u6599\u4F86\u6E90\uFF1Acpispl.xls \u6D88\u8CBB\u8005\u7269\u50F9\u6307\u6578</span>
          </div>
          <div class="land-tax-grid land-tax-grid-two">
            <label class="land-tax-field">
              <span>\u672C\u6B21\u79FB\u8F49\u5E74\u6708\uFF08\u53C3\u8003\uFF09</span>
              <select id="ltTransferPeriod">${periodOptionsHtml(defaultState.transferYear, defaultState.transferMonth)}</select>
            </label>
            <label class="land-tax-field">
              <span>\u524D\u6B21\u79FB\u8F49\u5E74\u6708 CPI</span>
              <select id="ltOriginalPeriod">${periodOptionsHtml(defaultState.originalYear, defaultState.originalMonth)}</select>
            </label>
          </div>
          <div class="hint">\u4F9D\u5B98\u65B9\u516C\u5F0F\uFF1A\u7269\u50F9\u6307\u6578\u8ABF\u6574\u5F8C\u539F\u5730\u50F9\u6216\u524D\u6B21\u79FB\u8F49\u73FE\u503C = \u539F\u5730\u50F9\u6216\u524D\u6B21\u79FB\u8F49\u73FE\u503C \xD7\uFF08\u524D\u6B21\u79FB\u8F49\u5E74\u6708 CPI \xF7 100\uFF09\u3002</div>
        </section>

        <section class="land-tax-card">
          <div class="land-tax-card-head">
            <h3>\u6263\u9664\u9805\u76EE</h3>
            <span>\u4F9D\u5BE6\u969B\u53EF\u6263\u9664\u8CC7\u6599\u8F38\u5165</span>
          </div>
          <div class="land-tax-grid">
            ${fieldHtml("ltLandImprovementCost", "\u6539\u826F\u571F\u5730\u8CBB\u7528", "\u4F8B\u5982\uFF1A200,000")}
            ${fieldHtml("ltEngineeringBenefitFee", "\u5DE5\u7A0B\u53D7\u76CA\u8CBB", "\u4F8B\u5982\uFF1A50,000")}
            ${fieldHtml("ltLandReadjustmentBurden", "\u571F\u5730\u91CD\u5283\u8CA0\u64D4", "\u4F8B\u5982\uFF1A100,000")}
            ${fieldHtml("ltDonatedLandValue", "\u7121\u511F\u6350\u8D08\u571F\u5730\u516C\u544A\u73FE\u503C", "\u4F8B\u5982\uFF1A0")}
          </div>
        </section>

        <div class="land-tax-actions">
          <button id="ltRecalculateBtn" type="button" class="btn btn-main">\u91CD\u65B0\u8A08\u7B97</button>
          <button id="ltClearBtn" type="button" class="btn btn-ghost">\u6E05\u7A7A</button>
          <button id="ltRestoreBtn" type="button" class="btn btn-ghost">\u6062\u5FA9\u9810\u8A2D\u503C</button>
        </div>
      </div>

      <aside class="land-tax-result land-tax-card">
        <div class="land-tax-card-head">
          <h3>\u8A66\u7B97\u7D50\u679C</h3>
          <span>\u5BE6\u969B\u4ECD\u4EE5\u7A3D\u5FB5\u6A5F\u95DC\u6838\u5B9A\u70BA\u6E96</span>
        </div>
        <div class="land-tax-result-main">
          <small>\u571F\u5730\u589E\u503C\u7A05\u6982\u7B97</small>
          <strong id="ltTaxAmount">--</strong>
          <span>\u5143</span>
          <div id="ltTaxStatus" class="land-tax-status">\u8ACB\u8F38\u5165\u8CC7\u6599\u5F8C\u8A66\u7B97</div>
        </div>
        <div class="land-tax-kpi-grid">
          <div><span>\u6709\u6548\u6301\u5206\u9762\u7A4D</span><strong id="ltEffectiveArea">--</strong></div>
          <div><span>\u7533\u5831\u79FB\u8F49\u73FE\u503C</span><strong id="ltTransferValue">--</strong></div>
          <div><span>\u539F\u5730\u50F9\u8ABF\u6574\u5F8C\u7E3D\u984D</span><strong id="ltAdjustedOriginal">--</strong></div>
          <div><span>\u7269\u50F9\u6307\u6578\u8ABF\u6574</span><strong id="ltCpiRatio">--</strong></div>
          <div><span>\u53EF\u6263\u9664\u7E3D\u984D</span><strong id="ltDeductions">--</strong></div>
          <div><span>\u6F32\u50F9\u7E3D\u6578\u984D</span><strong id="ltTaxableGain">--</strong></div>
          <div><span>\u81EA\u7528\u4F4F\u5B85\u7528\u5730\u7A05\u984D</span><strong id="ltSelfUseTax">--</strong></div>
          <div><span>\u4E00\u822C\u7528\u5730\u7A05\u984D</span><strong id="ltGeneralTax">--</strong></div>
          <div><span>\u7D1A\u8DDD\uFF0F\u7A05\u7387</span><strong id="ltBracket">--</strong></div>
          <div><span>\u6301\u6709\u5E74\u671F\u6E1B\u5FB5</span><strong id="ltDiscount">--</strong></div>
        </div>
        <div id="ltWarnings" class="land-tax-warnings"></div>
      </aside>
    </div>
    <p class="land-tax-footnote">\u672C\u8A66\u7B97\u7D50\u679C\u50C5\u4F9B\u53C3\u8003\uFF0C\u5BE6\u969B\u7A05\u984D\u4ECD\u4EE5\u7A3D\u5FB5\u6A5F\u95DC\u6838\u5B9A\u70BA\u6E96\u3002</p>
  `;
  bindEvents();
  restoreDefaults();
}
function controls() {
  if (!root3) return {};
  return {
    deedFile: root3.querySelector("#ltDeedFile"),
    parseDeedBtn: root3.querySelector("#ltParseDeedBtn"),
    deedParseLog: root3.querySelector("#ltDeedParseLog"),
    deedParseSummary: root3.querySelector("#ltDeedParseSummary"),
    taxMode: root3.querySelector("#ltTaxMode"),
    landAreaSqm: root3.querySelector("#ltLandAreaSqm"),
    rightNumerator: root3.querySelector("#ltRightNumerator"),
    rightDenominator: root3.querySelector("#ltRightDenominator"),
    transferUnitValue: root3.querySelector("#ltTransferUnitValue"),
    transferTotalValue: root3.querySelector("#ltTransferTotalValue"),
    originalUnitValue: root3.querySelector("#ltOriginalUnitValue"),
    originalTotalValue: root3.querySelector("#ltOriginalTotalValue"),
    transferPeriod: root3.querySelector("#ltTransferPeriod"),
    originalPeriod: root3.querySelector("#ltOriginalPeriod"),
    landImprovementCost: root3.querySelector("#ltLandImprovementCost"),
    engineeringBenefitFee: root3.querySelector("#ltEngineeringBenefitFee"),
    landReadjustmentBurden: root3.querySelector("#ltLandReadjustmentBurden"),
    donatedLandValue: root3.querySelector("#ltDonatedLandValue"),
    holdingYears: root3.querySelector("#ltHoldingYears")
  };
}
function deedControls() {
  const c = controls();
  return {
    file: c.deedFile,
    button: c.parseDeedBtn,
    log: c.deedParseLog,
    summary: c.deedParseSummary
  };
}
function readInput() {
  const c = controls();
  const transfer = parsePeriodValue(c.transferPeriod?.value);
  const original = parsePeriodValue(c.originalPeriod?.value);
  return {
    taxMode: c.taxMode?.value || "general",
    landAreaSqm: c.landAreaSqm?.value || "",
    rightNumerator: c.rightNumerator?.value || "1",
    rightDenominator: c.rightDenominator?.value || "1",
    transferUnitValue: c.transferUnitValue?.value || "",
    transferTotalValue: c.transferTotalValue?.value || "",
    originalUnitValue: c.originalUnitValue?.value || "",
    originalTotalValue: c.originalTotalValue?.value || "",
    transferYear: transfer.year,
    transferMonth: transfer.month,
    originalYear: original.year,
    originalMonth: original.month,
    landImprovementCost: c.landImprovementCost?.value || "",
    engineeringBenefitFee: c.engineeringBenefitFee?.value || "",
    landReadjustmentBurden: c.landReadjustmentBurden?.value || "",
    donatedLandValue: c.donatedLandValue?.value || "",
    holdingYears: c.holdingYears?.value || ""
  };
}
function setInput(values) {
  const c = controls();
  for (const [key, element] of Object.entries(c)) {
    if (!element) continue;
    if (key === "deedFile" || key === "parseDeedBtn" || key === "deedParseLog" || key === "deedParseSummary") continue;
    if (key === "transferPeriod" || key === "originalPeriod") continue;
    element.value = values[key] ?? "";
  }
  if (c.transferPeriod) c.transferPeriod.value = `${values.transferYear}-${values.transferMonth}`;
  if (c.originalPeriod) c.originalPeriod.value = `${values.originalYear}-${values.originalMonth}`;
}
function periodExists(year, month) {
  const key = `${Number(year)}-${Number(month)}`;
  return cpiOptions.some((entry) => `${entry.year}-${entry.month}` === key);
}
function setDeedLog(message, tone = "") {
  const { log } = deedControls();
  if (!log) return;
  log.textContent = message || "";
  log.dataset.tone = tone || "";
}
function setParseButtonLoading(isLoading) {
  const { button } = deedControls();
  if (!button) return;
  button.disabled = Boolean(isLoading);
  button.textContent = isLoading ? "\u89E3\u6790\u4E2D..." : "\u89E3\u6790\u571F\u5730\u8B04\u672C\u4E26\u5E36\u5165";
}
async function ensurePdfLibrary() {
  if (!window.pdfjsLib) {
    await loadScript(PDF_JS_CDN_SRC);
  }
  if (window.pdfjsLib?.GlobalWorkerOptions) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_JS_WORKER_SRC;
  }
}
async function ensureBackendOcrAvailable() {
  if (await checkBackendOcrHealth({ refresh: true, timeoutMs: 5e3 })) return;
  throw new Error("OCR \u5F8C\u7AEF\u672A\u9023\u7DDA\uFF0C\u8ACB\u5148\u555F\u52D5 8001 OCR \u5F8C\u7AEF\uFF1B\u82E5\u9700\u5716\u7247\u88DC\u5F37\u518D\u555F\u52D5 8099 Docker PaddleOCR\u3002");
}
function isPdfFile2(file) {
  return /\.pdf$/i.test(file?.name || "") || /pdf/i.test(file?.type || "");
}
function isImageFile(file) {
  return /image\//i.test(file?.type || "") || /\.(png|jpe?g|webp|bmp|gif|tiff?)$/i.test(file?.name || "");
}
function renderDeedParseSummary(result) {
  const { summary } = deedControls();
  if (!summary) return;
  if (!result) {
    summary.hidden = true;
    summary.innerHTML = "";
    return;
  }
  const rows = Object.entries(result.fields || {}).map(([key, item]) => `
    <tr>
      <td>${escapeHtml3(item.label || key)}</td>
      <td>${escapeHtml3(item.source || "")}</td>
      <td>${escapeHtml3(item.raw || "")}</td>
      <td>${escapeHtml3(item.value ?? "")}</td>
    </tr>
  `).join("");
  const warnings = (result.warnings || []).map((warning) => `<li>${escapeHtml3(warning)}</li>`).join("");
  summary.hidden = false;
  summary.innerHTML = `
    <div class="land-tax-parse-title">\u571F\u5730\u8B04\u672C\u8FA8\u8B58\u7D50\u679C</div>
    ${rows ? `
      <div class="land-tax-parse-table-wrap">
        <table class="land-tax-parse-table">
          <thead><tr><th>\u6B04\u4F4D</th><th>\u4F86\u6E90</th><th>raw</th><th>\u5E36\u5165\u503C</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    ` : '<div class="land-tax-parse-empty">\u672A\u6293\u5230\u53EF\u5E36\u5165\u6B04\u4F4D\u3002</div>'}
    ${warnings ? `<ul class="land-tax-parse-warnings">${warnings}</ul>` : ""}
  `;
}
function parseCurrentTransferPeriod() {
  const c = controls();
  return parsePeriodValue(c.transferPeriod?.value);
}
function applyParsedLandTaxValues(result) {
  const parsed = result?.values || {};
  const current = readInput();
  const next = { ...current };
  const directKeys = [
    "landAreaSqm",
    "rightNumerator",
    "rightDenominator",
    "transferUnitValue",
    "transferTotalValue",
    "originalUnitValue",
    "originalTotalValue",
    "holdingYears"
  ];
  directKeys.forEach((key) => {
    if (parsed[key] !== void 0 && parsed[key] !== null && String(parsed[key]).trim() !== "") {
      next[key] = parsed[key];
    }
  });
  if (parsed.originalYear && parsed.originalMonth) {
    if (periodExists(parsed.originalYear, parsed.originalMonth)) {
      next.originalYear = parsed.originalYear;
      next.originalMonth = parsed.originalMonth;
    } else {
      result.warnings = result.warnings || [];
      result.warnings.push(`\u539F\u5730\u50F9\u5E74\u6708 ${parsed.originalYear}\u5E74${parsed.originalMonth}\u6708\u4E0D\u5728 CPI \u8CC7\u6599\u5167\uFF0C\u672A\u81EA\u52D5\u5E36\u5165\u3002`);
    }
  }
  setInput(next);
  updateResults();
}
function mergeParseTexts(...texts) {
  return texts.filter((text) => text && String(text).trim()).join("\n\n");
}
async function parsePdfLandTaxDeed(file) {
  await ensurePdfLibrary();
  setDeedLog("\u6B63\u5728\u8B80\u53D6 PDF \u6587\u5B57\u5C64...");
  const textLayer = await extractPdfTextLayerDetailed(file, { maxPages: 12 });
  let result = parseLandValueTaxDeedText(textLayer.text, {
    source: textLayer.source,
    transferPeriod: parseCurrentTransferPeriod()
  });
  if (result.hasCoreData) {
    result.source = textLayer.source;
    return result;
  }
  setDeedLog("PDF \u6587\u5B57\u5C64\u4E0D\u8DB3\uFF0C\u6539\u7528\u524D 2 \u9801 OCR...");
  await ensureBackendOcrAvailable();
  const ocrText = await ocrPdfFile2(file, { maxPages: 2 });
  result = parseLandValueTaxDeedText(mergeParseTexts(textLayer.text, ocrText), {
    source: "pdfTextLayer+ocrBackend",
    transferPeriod: parseCurrentTransferPeriod()
  });
  if (!result.hasCoreData) {
    result.warnings = result.warnings || [];
    result.warnings.push("PDF \u6587\u5B57\u5C64\u8207 OCR \u90FD\u672A\u6293\u5230\u8DB3\u5920\u6B04\u4F4D\uFF0C\u8ACB\u624B\u52D5\u6AA2\u67E5\u8B04\u672C\u6E05\u6670\u5EA6\u3002");
  }
  return result;
}
async function parseImageLandTaxDeed(file) {
  await ensureBackendOcrAvailable();
  setDeedLog("\u6B63\u5728\u9032\u884C\u5716\u7247 OCR...");
  const detailed = await ocrImageSourceDetailed(file, "\u571F\u5730\u8B04\u672C OCR", { ocrLayout: "fullPage" });
  const result = parseLandValueTaxDeedText(detailed?.text || "", {
    source: detailed?.source || "ocrBackend",
    transferPeriod: parseCurrentTransferPeriod()
  });
  if (!result.hasCoreData) {
    result.warnings = result.warnings || [];
    result.warnings.push("\u5716\u7247 OCR \u672A\u6293\u5230\u8DB3\u5920\u6B04\u4F4D\uFF0C\u8ACB\u78BA\u8A8D\u4E0A\u50B3\u7684\u662F\u571F\u5730\u8B04\u672C\u4E14\u5F71\u50CF\u6E05\u6670\u3002");
  }
  return result;
}
async function parseAndApplyLandTaxDeedFile(file) {
  if (!file) {
    setDeedLog("\u8ACB\u5148\u9078\u64C7\u571F\u5730\u8B04\u672C\u6A94\u6848\u3002", "warn");
    return null;
  }
  setParseButtonLoading(true);
  renderDeedParseSummary(null);
  try {
    const result = isPdfFile2(file) ? await parsePdfLandTaxDeed(file) : isImageFile(file) ? await parseImageLandTaxDeed(file) : null;
    if (!result) {
      setDeedLog("\u4E0D\u652F\u63F4\u7684\u6A94\u6848\u683C\u5F0F\uFF0C\u8ACB\u4E0A\u50B3 PDF \u6216\u5716\u7247\u3002", "warn");
      return null;
    }
    applyParsedLandTaxValues(result);
    renderDeedParseSummary(result);
    const filledCount = Object.keys(result.values || {}).length;
    setDeedLog(
      result.hasCoreData ? `\u571F\u5730\u8B04\u672C\u89E3\u6790\u5B8C\u6210\uFF0C\u5DF2\u5E36\u5165 ${filledCount} \u500B\u6B04\u4F4D\u3002` : "\u571F\u5730\u8B04\u672C\u89E3\u6790\u5B8C\u6210\uFF0C\u4F46\u672A\u53D6\u5F97\u8DB3\u5920\u6B04\u4F4D\uFF0C\u8ACB\u4EBA\u5DE5\u6AA2\u67E5\u3002",
      result.hasCoreData ? "ok" : "warn"
    );
    return result;
  } catch (error) {
    console.error(error);
    setDeedLog(`\u571F\u5730\u8B04\u672C\u89E3\u6790\u5931\u6557\uFF1A${error?.message || error}`, "warn");
    return null;
  } finally {
    setParseButtonLoading(false);
  }
}
async function parseAndApplyLandTaxDeedFiles(files) {
  const list = Array.from(files || []).filter(Boolean);
  if (!list.length) {
    setDeedLog("\u8ACB\u5148\u9078\u64C7\u571F\u5730\u8B04\u672C\u6A94\u6848\u3002", "warn");
    return null;
  }
  let lastResult = null;
  for (let index = 0; index < list.length; index += 1) {
    const file = list[index];
    setDeedLog(`\u6B63\u5728\u89E3\u6790\u571F\u5730\u8B04\u672C ${index + 1}/${list.length}\uFF1A${file.name || "\u672A\u547D\u540D\u6A94\u6848"}...`);
    const result = await parseAndApplyLandTaxDeedFile(file);
    lastResult = result || lastResult;
    if (result?.hasCoreData) return result;
  }
  return lastResult;
}
function updateResults() {
  const result = calculateLandValueTax(readInput());
  const byId = (id) => root3.querySelector(`#${id}`);
  byId("ltTaxAmount").textContent = formatTaiwanDollar(result.tax);
  byId("ltEffectiveArea").textContent = `${formatLandTaxNumber(result.effectiveAreaSqm, 2)} \u33A1 / ${formatLandTaxNumber(result.effectiveAreaPing, 3)} \u576A`;
  byId("ltTransferValue").textContent = `${formatTaiwanDollar(result.transferValue)} \u5143`;
  byId("ltAdjustedOriginal").textContent = `${formatTaiwanDollar(result.adjustedOriginalValue)} \u5143`;
  byId("ltCpiRatio").textContent = result.transferPeriod && result.originalPeriod ? `${formatLandTaxNumber(result.cpiRatio, 4)} \u500D` : "--";
  byId("ltDeductions").textContent = `${formatTaiwanDollar(result.totalDeductions)} \u5143`;
  byId("ltTaxableGain").textContent = `${formatTaiwanDollar(result.taxableGain)} \u5143`;
  byId("ltSelfUseTax").textContent = `${formatTaiwanDollar(result.selfUseTax)} \u5143`;
  byId("ltGeneralTax").textContent = `${formatTaiwanDollar(result.generalTax)} \u5143`;
  byId("ltBracket").textContent = result.bracket;
  byId("ltDiscount").textContent = result.holdingDiscountRate ? `${Math.round(result.holdingDiscountRate * 100)}%` : "\u7121";
  const status = byId("ltTaxStatus");
  if (!result.taxableGain && (result.transferValue || result.originalValue)) {
    status.textContent = "\u7121\u6F32\u50F9\u6578\u984D";
    status.className = "land-tax-status land-tax-status-ok";
  } else if (result.warnings.length) {
    status.textContent = "\u8CC7\u6599\u672A\u5B8C\u6574";
    status.className = "land-tax-status land-tax-status-warn";
  } else {
    status.textContent = "\u5DF2\u5B8C\u6210\u8A66\u7B97";
    status.className = "land-tax-status land-tax-status-ok";
  }
  const warningBox = byId("ltWarnings");
  warningBox.innerHTML = result.warnings.length ? result.warnings.map((warning) => `<div>${warning}</div>`).join("") : "";
}
function restoreDefaults() {
  setInput(defaultState);
  updateResults();
}
function clearAll() {
  const blank = {
    ...LAND_VALUE_TAX_DEFAULTS,
    taxMode: "general",
    transferYear: latestCpi?.year || "",
    transferMonth: latestCpi?.month || ""
  };
  setInput(blank);
  updateResults();
}
function normalizeMoneyInputs(event) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || input.type !== "text") return;
  const id = input.id || "";
  if (!/^lt(Transfer|Original|LandImprovement|Engineering|LandReadjustment|Donated)/.test(id)) return;
  input.value = formatInputNumber2(input.value);
}
function bindEvents() {
  root3.querySelectorAll("input, select").forEach((element) => {
    element.addEventListener("input", updateResults);
    element.addEventListener("change", updateResults);
    element.addEventListener("blur", normalizeMoneyInputs);
  });
  root3.querySelector("#ltDeedFile")?.addEventListener("change", (event) => {
    const files = Array.from(event.target?.files || []);
    if (files.length) parseAndApplyLandTaxDeedFiles(files);
  });
  root3.querySelector("#ltParseDeedBtn")?.addEventListener("click", () => {
    const files = Array.from(root3.querySelector("#ltDeedFile")?.files || []);
    parseAndApplyLandTaxDeedFiles(files);
  });
  root3.querySelector("#ltRecalculateBtn")?.addEventListener("click", updateResults);
  root3.querySelector("#ltClearBtn")?.addEventListener("click", clearAll);
  root3.querySelector("#ltRestoreBtn")?.addEventListener("click", restoreDefaults);
}
var root3, cpiOptions, latestCpi, defaultState;
var init_landValueTaxApp = __esm({
  "landValueTaxApp.js?v=20260625-multi-upload-land-tax-sync"() {
    "use strict";
    init_landValueTaxCalculator();
    init_constants();
    init_ocr_pdf();
    init_ocr_image();
    init_landValueTaxDeedParser();
    root3 = document.getElementById("landValueTaxRoot");
    cpiOptions = cpiPeriodOptions();
    latestCpi = getLatestCpiPeriod();
    defaultState = {
      ...LAND_VALUE_TAX_DEFAULTS,
      taxMode: "general",
      transferYear: String(latestCpi?.year || ""),
      transferMonth: String(latestCpi?.month || ""),
      originalYear: "110",
      originalMonth: "1"
    };
    if (root3) {
      render();
      window.LandValueTaxCalculator = {
        calculateLandValueTax,
        findCpiIndex,
        parseAndApplyLandTaxDeedFile,
        parseAndApplyLandTaxDeedFiles,
        latestCpi
      };
      window.LandValueTaxDeedParser = {
        parseLandValueTaxDeedText
      };
    }
  }
});

// src/valuation/sort.js
init_utils();

// src/valuation/address.js
init_constants();
init_utils();
function stripVillageNeighborhoodPrefix(text) {
  let normalized = cleanOcrText(text).replace(/\s+/g, "");
  normalized = normalized.replace(/^[\u4e00-\u9fff]{1,12}(?:里|村)/u, "");
  normalized = normalized.replace(/^\d{1,3}鄰/u, "");
  return normalized;
}
function stripLeadingCityToken(text) {
  let normalized = cleanOcrText(text || "").replace(/\s+/g, "");
  if (!normalized) return "";
  const cities = Object.keys(CITY_DISTRICTS).flatMap((city) => [city, city.replace(/^臺/, "\u53F0"), city.replace(/^台/, "\u81FA")]).filter(Boolean).sort((a, b) => b.length - a.length);
  for (const city of cities) {
    if (normalized.startsWith(city)) {
      normalized = normalized.slice(city.length);
      break;
    }
  }
  const districts = [...new Set(Object.values(CITY_DISTRICTS).flat())].sort((a, b) => b.length - a.length);
  for (const district of districts) {
    if (normalized.startsWith(district)) return normalized.slice(district.length);
  }
  return normalized;
}
function isBadRoadCandidate(road) {
  const normalized = cleanOcrText(road).replace(/\s+/g, "");
  if (!normalized) return true;
  if (/謄本|網路|網際網路|電子|線上|申請|下載|列印|地政|事務所/.test(normalized)) return true;
  return false;
}
function extractRoadThruSectionOnly(address) {
  const normalized = stripVillageNeighborhoodPrefix(stripLeadingCityToken(cleanOcrText(address || ""))).replace(/\s+/g, "");
  if (!normalized) return "";
  const pattern = new RegExp(`([\\u4e00-\\u9fff]{1,16}(?:\u8DEF|\u8857|\u5927\u9053)${RE_ADDR_ROAD_OPTIONAL_SECTION})`, "gu");
  for (const match of normalized.matchAll(pattern)) {
    const road = match[1];
    if (!isBadRoadCandidate(road)) return road;
  }
  return "";
}
function stripLeadingKnownAdminArea(value) {
  let text = String(value || "");
  const cityNames = Object.keys(CITY_DISTRICTS).flatMap((city) => [city, city.replace(/^臺/, "\u53F0"), city.replace(/^台/, "\u81FA")]);
  for (const city of [...new Set(cityNames)].sort((a, b) => b.length - a.length)) {
    if (city && text.startsWith(city)) {
      text = text.slice(city.length);
      break;
    }
  }
  const districts = [...new Set(Object.values(CITY_DISTRICTS).flat())].sort((a, b) => b.length - a.length);
  for (const district of districts) {
    if (district && text.startsWith(district)) {
      text = text.slice(district.length);
      break;
    }
  }
  return text;
}
function normalizeAddressProximityText(value) {
  return normalizeFullWidthDigitsToAscii(cleanOcrText(value || "")).replace(/\s+/g, "").replace(/臺/g, "\u53F0").replace(/[，,、。．.]/g, "");
}
function parseComparableAddressParts(address) {
  const normalized = stripLeadingKnownAdminArea(stripVillageNeighborhoodPrefix(normalizeAddressProximityText(address)));
  if (!normalized) return { normalized: "", road: "", lane: "", alley: "" };
  const road = normalizeText(extractRoadThruSectionOnly(normalized) || "");
  const roadStart = road ? normalized.indexOf(road) : -1;
  const addressAfterRoad = roadStart >= 0 ? normalized.slice(roadStart + road.length) : normalized;
  const lane = (addressAfterRoad.match(/(\d+)巷/) || normalized.match(/(\d+)巷/) || [])[1] || "";
  const alley = (addressAfterRoad.match(/(\d+)弄/) || normalized.match(/(\d+)弄/) || [])[1] || "";
  return { normalized, road, lane, alley };
}
function formatAddressProximitySortNote(subjectAddress) {
  const parts = parseComparableAddressParts(subjectAddress);
  if (!parts.road) return "\u5730\u5740\u63A5\u8FD1\u5EA6\u7565\u904E\uFF08\u672A\u53D6\u5F97\u53EF\u6BD4\u5C0D\u7684\u6A19\u7684\u9053\u8DEF\uFF09\u3002";
  const levels = parts.lane ? parts.alley ? "\u540C\u8DEF\u540C\u5DF7\u540C\u5F04 \u2192 \u540C\u8DEF\u540C\u5DF7 \u2192 \u540C\u8DEF" : "\u540C\u8DEF\u540C\u5DF7 \u2192 \u540C\u8DEF" : "\u540C\u8DEF";
  const basis = [parts.road, parts.lane ? `${parts.lane}\u5DF7` : "", parts.alley ? `${parts.alley}\u5F04` : ""].filter(Boolean).join("");
  return `\u5730\u5740\u63A5\u8FD1\u5EA6\u4EE5\u6A19\u7684\u300C${basis}\u300D\u6BD4\u5C0D\uFF0C\u512A\u5148\u9806\u5E8F\u70BA ${levels}\u3002`;
}

// src/valuation/run-search.js
init_utils();
function normalizeMainPurposeText(value) {
  return cleanOcrText(value).replace(/\s+/g, "").replace(/用途?$/u, "\u7528").trim();
}
function rowFloorIsFullLevel(floorInfo) {
  const raw = String(floorInfo || "").trim();
  if (!raw) return false;
  const firstSeg = raw.split(/[\/／]/)[0].replace(/\s+/g, "");
  return firstSeg === "\u5168" || /^全(?:層|樓|棟)?$/u.test(firstSeg);
}

// src/valuation/sort.js
function dateFromYmdParts(year, month, day) {
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  const dt = new Date(year, month - 1, day);
  if (dt.getFullYear() !== year || dt.getMonth() !== month - 1 || dt.getDate() !== day) return null;
  return dt;
}
function parseDateFromText(dateText) {
  const text = normalizeFullWidthDigitsToAscii(String(dateText || "").trim());
  if (!text) return null;
  const ad = text.match(/(19\d{2}|20\d{2})\D{0,2}(\d{1,2})\D{0,2}(\d{1,2})/);
  if (ad) return dateFromYmdParts(Number(ad[1]), Number(ad[2]), Number(ad[3]));
  const roc = text.match(/(\d{2,3})\D{0,2}(\d{1,2})\D{0,2}(\d{1,2})/);
  if (roc) return dateFromYmdParts(Number(roc[1]) + 1911, Number(roc[2]), Number(roc[3]));
  return null;
}
function resolveSubjectAgeFromDeedCompletion(completionDateText, appraisalBaseDate = /* @__PURE__ */ new Date()) {
  const completion = parseDateFromText(completionDateText);
  if (!completion) return null;
  if (!(appraisalBaseDate instanceof Date) || Number.isNaN(appraisalBaseDate.getTime())) return null;
  const deltaMs = appraisalBaseDate.getTime() - completion.getTime();
  if (deltaMs < 0) return null;
  const ageYears = deltaMs / (365.2425 * 24 * 60 * 60 * 1e3);
  if (!Number.isFinite(ageYears)) return null;
  return +ageYears.toFixed(3);
}
function parseUnitFloorFromFloorInfo(floorInfo) {
  const raw = normalizeFullWidthDigitsToAscii(String(floorInfo || "").trim());
  if (!raw) return null;
  const firstSeg = raw.split(/[\/／]/)[0].replace(/\s+/g, "");
  if (!firstSeg || /地下|B1|b1/i.test(firstSeg)) return null;
  const m = firstSeg.match(/^([0-9一二三四五六七八九十百千壹]+)\s*(樓|層|F|f)/i);
  if (m) return parseFloorLevelToken(m[1]);
  const plain = firstSeg.match(/^([0-9一二三四五六七八九十百千壹]+)$/u);
  return plain ? parseFloorLevelToken(plain[1]) : null;
}
function parseTotalFloorsFromFloorInfo(text) {
  const s = normalizeFullWidthDigitsToAscii(String(text || "").trim());
  if (!s) return null;
  const slash = s.match(/([0-9一二三四五六七八九十百千壹]+)\s*(?:樓|層|F|f)?\s*[\/／]\s*([0-9一二三四五六七八九十百千壹]+)\s*(?:樓|層|F|f)?/u);
  if (slash) {
    const a = parseFloorLevelToken(slash[1]);
    const b = parseFloorLevelToken(slash[2]);
    if (Number.isFinite(a) && Number.isFinite(b)) return Math.max(a, b);
  }
  const nums = [...s.matchAll(/([0-9一二三四五六七八九十百千壹]+)\s*(?:樓|層|F|f)/gu)].map((m) => parseFloorLevelToken(m[1])).filter((n) => Number.isFinite(n));
  if (nums.length) return Math.max(...nums);
  const plain = toNumber(s);
  return Number.isFinite(plain) ? plain : null;
}
function normalizeBuildingType(typeText) {
  const text = cleanOcrText(String(typeText || "")).replace(/\s+/g, "");
  if (!text) return "";
  if (/華廈/.test(text)) return "\u83EF\u5EC8";
  if (/住宅大樓|電梯大樓|大樓/.test(text)) return "\u5927\u6A13";
  if (/公寓|無電梯公寓/.test(text)) return "\u516C\u5BD3";
  if (/透天厝|透天|別墅|全棟/.test(text)) return "\u900F\u5929";
  if (/店面|住商|商辦|商業|辦公/.test(text)) return "\u5546\u7528";
  return text;
}
function normalizedPreferredTypes(preferredTypes) {
  return [...new Set((Array.isArray(preferredTypes) ? preferredTypes : []).map(normalizeBuildingType).filter(Boolean))];
}
function buildingTypeScore(row, preferredTypes = []) {
  const rowType = normalizeBuildingType(row?.type || row?.buildingType || "");
  const preferred = normalizedPreferredTypes(preferredTypes);
  return {
    score: 0,
    reasons: ["\u578B\u614B\uFF1A\u4E0D\u7D0D\u5165\u6392\u5E8F\u5206\u6578 +0"],
    metrics: { rowType, preferredTypes: preferred, typeWeightRemoved: true }
  };
}
function purposeCategories(purposeText) {
  const text = normalizeMainPurposeText(purposeText);
  const categories = /* @__PURE__ */ new Set();
  if (!text) return categories;
  if (/住|住宅|集合|宿舍/u.test(text)) categories.add("residential");
  if (/商|辦公|辦事|店鋪|店面|事務所|零售|銀行/u.test(text)) categories.add("commercial");
  if (/工|廠|倉|作業|工業/u.test(text)) categories.add("industrial");
  if (/停車|車位/u.test(text)) categories.add("parking");
  return categories;
}
function purposeCategoryOverlap(a, b) {
  for (const item of a) {
    if (b.has(item)) return true;
  }
  return false;
}
function purposeScoreForCandidate(rowPurpose, wantedPurpose) {
  if (rowPurpose === wantedPurpose) {
    return { score: 5, level: "exact", reason: `\u4E3B\u8981\u7528\u9014\uFF1A${rowPurpose}\u5B8C\u5168\u76F8\u540C +5` };
  }
  const rowCategories = purposeCategories(rowPurpose);
  const wantedCategories = purposeCategories(wantedPurpose);
  if (!rowCategories.size || !wantedCategories.size) {
    return { score: 0, level: "unknown", reason: "\u4E3B\u8981\u7528\u9014\uFF1A\u985E\u5225\u4E0D\u8DB3 +0" };
  }
  if (purposeCategoryOverlap(rowCategories, wantedCategories)) {
    const mixed = rowCategories.size > 1 || wantedCategories.size > 1;
    if (mixed) {
      return { score: 3, level: "mixed", reason: `\u4E3B\u8981\u7528\u9014\uFF1A${rowPurpose}\u8207${wantedPurpose}\u90E8\u5206\u76F8\u5BB9 +3` };
    }
    return { score: 4, level: "similar", reason: `\u4E3B\u8981\u7528\u9014\uFF1A${rowPurpose}\u8207${wantedPurpose}\u540C\u985E\u76F8\u8FD1 +4` };
  }
  return { score: -3, level: "mismatch", reason: `\u4E3B\u8981\u7528\u9014\uFF1A${rowPurpose}\u8207${wantedPurpose}\u4E0D\u76F8\u5BB9 -3` };
}
function contextMainPurposes(query = {}) {
  const fromArray = Array.isArray(query.mainPurposes) ? query.mainPurposes : [];
  const fromText = String(query.mainPurpose || "").split(/[、,，]/u);
  return [...new Set([...fromArray, ...fromText].map(normalizeMainPurposeText).filter(Boolean))];
}
function mainPurposeScore(row, query = {}) {
  const wanted = contextMainPurposes(query);
  if (!wanted.length) {
    return { score: 0, reasons: ["\u4E3B\u8981\u7528\u9014\uFF1A\u7565\u904E\uFF08\u672A\u9078\u4E3B\u8981\u7528\u9014\uFF09 +0"], metrics: { purposeSkipped: true } };
  }
  const rowPurpose = normalizeMainPurposeText(row?.purpose || row?.mainPurpose || "");
  if (!rowPurpose) {
    return {
      score: 0,
      reasons: ["\u4E3B\u8981\u7528\u9014\uFF1A\u6848\u4F8B\u7F3A\u4E3B\u8981\u7528\u9014 +0"],
      metrics: { purposeMatchLevel: "missing", rowPurpose: "", wantedPurposes: wanted }
    };
  }
  const best = wanted.map((purpose) => purposeScoreForCandidate(rowPurpose, purpose)).sort((a, b) => b.score - a.score)[0];
  return {
    score: best?.score ?? 0,
    reasons: [best?.reason || "\u4E3B\u8981\u7528\u9014\uFF1A\u7565\u904E +0"],
    metrics: {
      purposeMatchLevel: best?.level || "unknown",
      rowPurpose,
      wantedPurposes: wanted
    }
  };
}
function addressScoreLevel(rowAddress, subjectAddress) {
  const subjectParts = parseComparableAddressParts(subjectAddress);
  if (!subjectParts.road) return { score: 0, level: "skipped", reason: "\u5730\u5740\uFF1A\u7565\u904E\uFF08\u7121\u6CD5\u53D6\u5F97\u6A19\u7684\u9053\u8DEF\uFF09 +0" };
  const rowParts = parseComparableAddressParts(rowAddress);
  if (rowParts.road && rowParts.road === subjectParts.road) {
    if (subjectParts.lane && rowParts.lane === subjectParts.lane) {
      if (subjectParts.alley && rowParts.alley === subjectParts.alley) {
        return { score: 25, level: "sameRoadLaneAlley", reason: "\u5730\u5740\uFF1A\u540C\u8DEF\u540C\u5DF7\u540C\u5F04 +25" };
      }
      return { score: 22, level: "sameRoadLane", reason: "\u5730\u5740\uFF1A\u540C\u8DEF\u540C\u5DF7 +22" };
    }
    return { score: 18, level: "sameRoad", reason: "\u5730\u5740\uFF1A\u540C\u8DEF +18" };
  }
  return { score: 0, level: "other", reason: "\u5730\u5740\uFF1A\u5176\u4ED6 +0" };
}
function addressScore(row, subjectAddress) {
  const result = addressScoreLevel(row?.address || "", subjectAddress || "");
  return {
    score: result.score,
    reasons: [result.reason],
    metrics: { addressLevel: result.level }
  };
}
function parseTradeDateFromRow(row, appraisalBaseDate = /* @__PURE__ */ new Date()) {
  const direct = parseDateFromText(row?.tradeDate || row?.tradeYearMonth || "");
  if (direct) return direct;
  const raw = normalizeFullWidthDigitsToAscii(String(row?.tradePeriodValue ?? "").replace(/\D/g, ""));
  if (!raw) return null;
  let year = null;
  let month = null;
  if (raw.length === 5) {
    year = Number(raw.slice(0, 3)) + 1911;
    month = Number(raw.slice(3));
  } else if (raw.length === 6) {
    const firstFour = Number(raw.slice(0, 4));
    if (firstFour >= 1911) {
      year = firstFour;
      month = Number(raw.slice(4));
    } else {
      year = Number(raw.slice(0, 3)) + 1911;
      month = Number(raw.slice(3, 5));
    }
  }
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null;
  return new Date(year, month, 0);
}
function monthsBetween(fromDate, toDate) {
  if (!(fromDate instanceof Date) || !(toDate instanceof Date)) return null;
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) return null;
  return Math.max(0, (toDate.getFullYear() - fromDate.getFullYear()) * 12 + (toDate.getMonth() - fromDate.getMonth()));
}
function resolveComparableAge(row) {
  const direct = toNumber(row?.age);
  if (Number.isFinite(direct)) return direct;
  const completionText = row?.completionDate || row?.buildingCompletionDate || row?.\u5EFA\u7BC9\u5B8C\u6210\u65E5\u671F || "";
  const tradeDate = parseTradeDateFromRow(row);
  if (completionText && tradeDate) return resolveSubjectAgeFromDeedCompletion(completionText, tradeDate);
  return null;
}
function ageScore(row, refAge, appraisalBaseDate = /* @__PURE__ */ new Date()) {
  const reasons = [];
  const metrics = {};
  const targetAge = toNumber(refAge);
  if (!Number.isFinite(targetAge)) {
    reasons.push("\u5C4B\u9F61\uFF1A\u7565\u904E\uFF08\u6A19\u7684\u5C4B\u9F61\u7F3A\u5931\uFF09 +0");
    return { score: 0, reasons, metrics: { ageSkipped: true } };
  }
  const rowAge = resolveComparableAge(row, appraisalBaseDate);
  if (!Number.isFinite(rowAge)) {
    reasons.push("\u5C4B\u9F61\uFF1A\u6848\u4F8B\u7F3A\u5C4B\u9F61 -3");
    return { score: -3, reasons, metrics: { ageGap: Infinity } };
  }
  const gap = Math.abs(rowAge - targetAge);
  metrics.ageGap = +gap.toFixed(3);
  let score = 0;
  if (gap <= 3) score = 17;
  else if (gap <= 5) score = 13;
  else if (gap <= 10) score = 8;
  else if (gap <= 15) score = 4;
  reasons.push(`\u5C4B\u9F61\uFF1A\u5DEE\u8DDD ${metrics.ageGap} \u5E74 +${score}`);
  return { score, reasons, metrics };
}
function areaScore(row, subjectTotalPing) {
  const target = toNumber(subjectTotalPing);
  if (!Number.isFinite(target) || target <= 0) {
    return { score: 0, reasons: ["\u7E3D\u9762\u7A4D\uFF1A\u7565\u904E\uFF08\u6A19\u7684\u7E3D\u576A\u6578\u7F3A\u5931\uFF09 +0"], metrics: { areaSkipped: true } };
  }
  const rowArea = toNumber(row?.totalArea);
  if (!Number.isFinite(rowArea) || rowArea <= 0) {
    return { score: -5, reasons: ["\u7E3D\u9762\u7A4D\uFF1A\u6848\u4F8B\u7F3A\u7E3D\u9762\u7A4D -5"], metrics: { areaGapRatio: Infinity, areaMissing: true } };
  }
  const ratio = Math.abs(rowArea - target) / target;
  let score = 0;
  if (ratio <= 0.1) score = 15;
  else if (ratio <= 0.2) score = 12;
  else if (ratio <= 0.3) score = 8;
  else if (ratio <= 0.5) score = 4;
  const pct = +(ratio * 100).toFixed(1);
  return { score, reasons: [`\u7E3D\u9762\u7A4D\uFF1A\u5DEE\u8DDD ${pct}% +${score}`], metrics: { areaGapRatio: +ratio.toFixed(4) } };
}
function totalFloorsScore(row, refFloors) {
  const target = toNumber(refFloors);
  if (!Number.isFinite(target) || target <= 0) {
    return { score: 0, reasons: ["\u7E3D\u6A13\u5C64\uFF1A\u7565\u904E\uFF08\u6A19\u7684\u7E3D\u6A13\u5C64\u7F3A\u5931\uFF09 +0"], metrics: { totalFloorsSkipped: true } };
  }
  const rowFloors = parseTotalFloorsFromFloorInfo(row?.floorInfo);
  if (!Number.isFinite(rowFloors) || rowFloors <= 0) {
    return { score: -2, reasons: ["\u7E3D\u6A13\u5C64\uFF1A\u6848\u4F8B\u7F3A\u7E3D\u6A13\u5C64 -2"], metrics: { totalFloorsGap: Infinity } };
  }
  const gap = Math.abs(rowFloors - target);
  let score = 0;
  if (gap === 0) score = 15;
  else if (gap <= 2) score = 12;
  else if (gap <= 5) score = 8;
  return { score, reasons: [`\u7E3D\u6A13\u5C64\uFF1A\u5DEE\u8DDD ${gap} \u5C64 +${score}`], metrics: { totalFloorsGap: gap } };
}
function contextIsTownhouse(query = {}, preferredTypes = []) {
  const quickTypes = Array.isArray(query.quickTypes) ? query.quickTypes : [];
  const values = [
    query.houseType,
    query.type,
    ...quickTypes,
    ...preferredTypes
  ].map(normalizeBuildingType);
  return query.isTownhouse === true || values.includes("\u900F\u5929");
}
function unitFloorScore(row, targetFloor, query = {}, preferredTypes = []) {
  if (contextIsTownhouse(query, preferredTypes)) {
    return { score: 0, reasons: ["\u6A13\u5225\uFF1A\u7565\u904E\uFF08\u900F\u5929\u6848\u4EF6\uFF09 +0"], metrics: { unitFloorSkipped: true } };
  }
  const target = toNumber(targetFloor);
  if (!Number.isFinite(target) || target <= 0) {
    return { score: 0, reasons: ["\u6A13\u5225\uFF1A\u7565\u904E\uFF08\u6A19\u7684\u6A13\u5225\u7F3A\u5931\uFF09 +0"], metrics: { unitFloorSkipped: true } };
  }
  const rowFloor = parseUnitFloorFromFloorInfo(row?.floorInfo);
  if (!Number.isFinite(rowFloor) || rowFloor <= 0) {
    return { score: -2, reasons: ["\u6A13\u5225\uFF1A\u6848\u4F8B\u7F3A\u6A13\u5225 -2"], metrics: { unitFloorGap: Infinity } };
  }
  const gap = Math.abs(rowFloor - target);
  let score = 0;
  if (gap === 0) score = 8;
  else if (gap <= 1) score = 6;
  else if (gap <= 2) score = 4;
  else if (gap <= 3) score = 2;
  return { score, reasons: [`\u6A13\u5225\uFF1A\u5DEE\u8DDD ${gap} \u6A13 +${score}`], metrics: { unitFloorGap: gap, rowUnitFloor: rowFloor } };
}
function buildPriceStats(rows = []) {
  const priced = rows.filter((row) => Number.isFinite(row?.unitPrice)).sort((a, b) => b.unitPrice - a.unitPrice);
  const ranks = /* @__PURE__ */ new Map();
  priced.forEach((row, index) => ranks.set(row, index));
  return { prices: priced.map((row) => row.unitPrice), ranks };
}
function unitPriceScore(row, priceStats = null) {
  if (!Number.isFinite(row?.unitPrice)) {
    return { score: -10, reasons: ["\u55AE\u50F9\uFF1A\u7F3A\u55AE\u50F9 -10"], metrics: { unitPricePercentile: 0 } };
  }
  const stats = priceStats || buildPriceStats([row]);
  const count = stats.prices?.length || 0;
  const rank = stats.ranks?.has(row) ? stats.ranks.get(row) : 0;
  const fraction = count <= 1 ? 0 : rank / (count - 1);
  let score = 1;
  if (fraction <= 0.2) score = 5;
  else if (fraction <= 0.4) score = 4;
  else if (fraction <= 0.6) score = 3;
  else if (fraction <= 0.8) score = 2;
  const percentile = +(1 - fraction).toFixed(3);
  return {
    score,
    reasons: [`\u55AE\u50F9\uFF1APR ${Math.round(percentile * 100)} +${score}`],
    metrics: { unitPricePercentile: percentile }
  };
}
function tradeDateScore(row, appraisalBaseDate = /* @__PURE__ */ new Date()) {
  const base = appraisalBaseDate instanceof Date && !Number.isNaN(appraisalBaseDate.getTime()) ? appraisalBaseDate : /* @__PURE__ */ new Date();
  const tradeDate = parseTradeDateFromRow(row, base);
  if (!tradeDate) return { score: 0, reasons: ["\u4EA4\u6613\u65E5\u671F\uFF1A\u7F3A\u4EA4\u6613\u65E5\u671F +0"], metrics: { tradeDateDistanceMonths: Infinity } };
  if (tradeDate.getTime() > base.getTime()) {
    return { score: 0, reasons: ["\u4EA4\u6613\u65E5\u671F\uFF1A\u665A\u65BC\u57FA\u6E96\u65E5 +0"], metrics: { tradeDateDistanceMonths: -1 } };
  }
  const months = monthsBetween(tradeDate, base);
  let score = 1;
  if (months <= 6) score = 10;
  else if (months <= 12) score = 8;
  else if (months <= 24) score = 5;
  else if (months <= 36) score = 3;
  return { score, reasons: [`\u4EA4\u6613\u65E5\u671F\uFF1A${months} \u500B\u6708\u5167 +${score}`], metrics: { tradeDateDistanceMonths: months } };
}
function normalizeComparableContext(contextOrRefAge, refFloors, preferredTypes = [], subjectAddress = "", subjectTotalPing = null) {
  if (contextOrRefAge && typeof contextOrRefAge === "object" && !(contextOrRefAge instanceof Date)) {
    return {
      refAge: contextOrRefAge.refAge,
      refFloors: contextOrRefAge.refFloors,
      preferredTypes: contextOrRefAge.preferredTypes || [],
      subjectAddress: contextOrRefAge.subjectAddress || "",
      subjectTotalPing: contextOrRefAge.subjectTotalPing,
      appraisalBaseDate: contextOrRefAge.appraisalBaseDate || /* @__PURE__ */ new Date(),
      targetFloor: contextOrRefAge.targetFloor,
      query: contextOrRefAge.query || {},
      priceStats: contextOrRefAge.priceStats || null
    };
  }
  return {
    refAge: contextOrRefAge,
    refFloors,
    preferredTypes,
    subjectAddress,
    subjectTotalPing,
    appraisalBaseDate: /* @__PURE__ */ new Date(),
    query: {},
    priceStats: null
  };
}
function roundScore(value) {
  return Math.round(value * 10) / 10;
}
function scoreComparable(row, context = {}) {
  const normalized = normalizeComparableContext(context);
  const parts = {
    address: addressScore(row, normalized.subjectAddress),
    type: buildingTypeScore(row, normalized.preferredTypes),
    purpose: mainPurposeScore(row, normalized.query),
    age: ageScore(row, normalized.refAge, normalized.appraisalBaseDate),
    area: areaScore(row, normalized.subjectTotalPing),
    unitFloor: unitFloorScore(row, normalized.targetFloor, normalized.query, normalized.preferredTypes),
    totalFloors: totalFloorsScore(row, normalized.refFloors),
    unitPrice: unitPriceScore(row, normalized.priceStats),
    tradeDate: tradeDateScore(row, normalized.appraisalBaseDate)
  };
  const breakdown = {
    address: parts.address.score,
    type: parts.type.score,
    purpose: parts.purpose.score,
    age: parts.age.score,
    area: parts.area.score,
    unitFloor: parts.unitFloor.score,
    totalFloors: parts.totalFloors.score,
    unitPrice: parts.unitPrice.score,
    tradeDate: parts.tradeDate.score,
    penalties: 0
  };
  const comparableScore = roundScore(Object.values(breakdown).reduce((sum, value) => sum + value, 0));
  row.comparableScore = comparableScore;
  row.comparableScoreBreakdown = breakdown;
  row.comparableSortReason = Object.values(parts).flatMap((part) => part.reasons || []);
  row.comparableSortMetrics = Object.values(parts).reduce((acc, part) => Object.assign(acc, part.metrics || {}), {});
  return row;
}
function numericTieValue(value, fallback = Infinity) {
  return Number.isFinite(value) ? value : fallback;
}
function sortComparablesForAverage(rows, contextOrRefAge, refFloors, preferredTypes = [], subjectAddress = "", subjectTotalPing = null) {
  const context = normalizeComparableContext(contextOrRefAge, refFloors, preferredTypes, subjectAddress, subjectTotalPing);
  const sortable = (Array.isArray(rows) ? rows : []).map((row, index) => ({ row, index }));
  const priceStats = buildPriceStats(sortable.map((item) => item.row));
  sortable.forEach(({ row }) => scoreComparable(row, { ...context, priceStats }));
  sortable.sort((a, b) => {
    if (Number.isFinite(toNumber(context.subjectTotalPing)) && toNumber(context.subjectTotalPing) > 0) {
      const areaMissingA = a.row.comparableSortMetrics?.areaMissing === true;
      const areaMissingB = b.row.comparableSortMetrics?.areaMissing === true;
      if (areaMissingA !== areaMissingB) return areaMissingA ? 1 : -1;
    }
    const scoreDiff = (b.row.comparableScore || 0) - (a.row.comparableScore || 0);
    if (scoreDiff !== 0) return scoreDiff;
    const ba = a.row.comparableScoreBreakdown || {};
    const bb = b.row.comparableScoreBreakdown || {};
    for (const key of ["address", "age", "totalFloors", "area", "tradeDate", "unitFloor", "purpose", "unitPrice"]) {
      const diff = (bb[key] || 0) - (ba[key] || 0);
      if (diff !== 0) return diff;
    }
    const ma = a.row.comparableSortMetrics || {};
    const mb = b.row.comparableSortMetrics || {};
    for (const key of ["ageGap", "totalFloorsGap", "areaGapRatio", "tradeDateDistanceMonths", "unitFloorGap"]) {
      const diff = numericTieValue(ma[key]) - numericTieValue(mb[key]);
      if (diff !== 0) return diff;
    }
    const upA = Number.isFinite(a.row.unitPrice) ? a.row.unitPrice : -Infinity;
    const upB = Number.isFinite(b.row.unitPrice) ? b.row.unitPrice : -Infinity;
    if (upA !== upB) return upB - upA;
    const tradeA = parseTradeDateFromRow(a.row, context.appraisalBaseDate)?.getTime() || -Infinity;
    const tradeB = parseTradeDateFromRow(b.row, context.appraisalBaseDate)?.getTime() || -Infinity;
    if (tradeA !== tradeB) return tradeB - tradeA;
    if (a.index !== b.index) return a.index - b.index;
    return String(a.row.address || "").localeCompare(String(b.row.address || ""), "zh-Hant");
  });
  sortable.forEach(({ row }, index) => {
    row.comparableRank = index + 1;
  });
  return sortable.map((item) => item.row);
}
function parseLastFloorFromAddress(address) {
  const s = cleanOcrText(address || "").replace(/\s+/g, "");
  if (!s) return null;
  if (/地下一樓|地下1樓|地下１樓/i.test(s)) return null;
  const matches = [...s.matchAll(/([0-9０-９一二三四五六七八九十百千壹]+)\s*樓/gu)];
  if (!matches.length) return null;
  return parseFloorLevelToken(matches[matches.length - 1][1]);
}
function comparableRowIsFirstFloor(row) {
  if (rowFloorIsFullLevel(row?.floorInfo)) return false;
  const fromInfo = parseUnitFloorFromFloorInfo(row?.floorInfo || "");
  if (fromInfo === 1) return true;
  if (fromInfo != null) return false;
  return parseLastFloorFromAddress(row?.address || "") === 1;
}

// valuationSortBridge.js
window.FoundValuationSort = {
  comparableRowIsFirstFloor,
  formatAddressProximitySortNote,
  parseLastFloorFromAddress,
  parseTotalFloorsFromFloorInfo,
  parseUnitFloorFromFloorInfo,
  scoreComparable,
  sortComparablesForAverage
};
window.dispatchEvent(new CustomEvent("found:valuation-sort-ready"));

// src/app/config.js?v=20260627-ocr-fast
var ocrConfig2 = Object.freeze({
  usePaddleOcr: true,
  paddleEndpoint: "http://127.0.0.1:8001/ocr/deed",
  paddleDiagnosticsEndpoint: "http://127.0.0.1:8001/api/ocr/health",
  paddleTimeoutMs: 9e4,
  paddlePdfTimeoutMs: 3e4,
  paddlePdfMaxPages: 5,
  paddlePdfDpi: 180,
  paddlePdfFastMode: true,
  enableBrowserPdfOcrFallback: false,
  skipPdfBrowserParseAfterPaddle: true,
  pdfQuickTextTimeoutMs: 15e3,
  skipAllPdfOcr: false
});
var officialSearchConfig2 = Object.freeze({
  tokenTimeoutMs: 12e3,
  queryTimeoutMs: 2e4,
  detailTimeoutMs: 15e3,
  retryBaseDelayMs: 500,
  maxAttempts: 2,
  totalTimeoutMs: 45e3,
  autoTotalTimeoutMs: 3e4,
  minRowsBeforeStop: 3,
  maxExpandSpanYears: 3
});
var mainPurposeOptions2 = Object.freeze([
  "\u4F4F\u5BB6\u7528",
  "\u5546\u696D\u7528",
  "\u5DE5\u696D\u7528",
  "\u8FB2\u696D\u7528",
  "\u8FA6\u516C\u7528",
  "\u4F4F\u5546\u7528",
  "\u4F4F\u5DE5\u7528",
  "\u4F4F\u8FA6\u7528",
  "\u5DE5\u5546\u7528",
  "\u5546\u8FA6\u7528",
  "\u4F4F\u5546\u8FA6\u7528",
  "\u5DE5\u5546\u8FA6\u7528",
  "\u5176\u4ED6"
]);
var specialRemarkFilters2 = Object.freeze([
  { id: "special_relation", label: "\u89AA\u53CB\u3001\u54E1\u5DE5\u3001\u5171\u6709\u4EBA\u6216\u5176\u4ED6\u7279\u6B8A\u95DC\u4FC2\u9593\u4E4B\u4EA4\u6613", keywords: ["\u89AA\u53CB", "\u54E1\u5DE5", "\u5171\u6709\u4EBA", "\u7279\u6B8A\u95DC\u4FC2", "\u4E8C\u89AA\u7B49", "\u4E09\u89AA\u7B49", "\u95DC\u4FC2\u4EBA", "\u95DC\u4FC2\u9593"] },
  { id: "unfinished", label: "\u6BDB\u80DA\u5C4B", keywords: ["\u6BDB\u80DA", "\u6BDB\u576F"] },
  { id: "superficies", label: "\u5730\u4E0A\u6B0A\u623F\u5C4B", keywords: ["\u5730\u4E0A\u6B0A"] },
  { id: "public_reserved", label: "(\u5305\u542B)\u516C\u5171\u8A2D\u65BD\u4FDD\u7559\u5730(\u7528\u5730)", keywords: ["\u516C\u5171\u8A2D\u65BD\u4FDD\u7559\u5730", "\u516C\u5171\u8A2D\u65BD\u4FDD\u7559\u7528\u5730", "\u516C\u8A2D\u4FDD\u7559\u5730"] },
  { id: "has_note", label: "\u6709\u5099\u8A3B", keywords: [] },
  { id: "has_elevator", label: "\u6709\u96FB\u68AF", keywords: [] },
  { id: "has_management", label: "\u6709\u7BA1\u7406\u7D44\u7E54", keywords: [] }
]);
var specialRemarkFilterById2 = new Map(specialRemarkFilters2.map((filter) => [filter.id, filter]));

// src/app/address-knowledge.js
var ROAD_DICTIONARY_URL = "data/taiwan-road-dictionary.json";
var ADMIN_DISTRICTS_URL = "data/taiwan-admin-districts.json";
var addressKnowledgePromise = null;
function normalizeFullWidthAscii(value) {
  return String(value ?? "").replace(/[！-～]/g, (char) => {
    return String.fromCharCode(char.charCodeAt(0) - 65248);
  });
}
function normalizeAddressKnowledgeText(value) {
  return normalizeFullWidthAscii(value).replace(/\s+/g, "").replace(/臺/g, "\u53F0").replace(/[，,、。．.：:；;()（）【】\[\]"'「」]/g, "");
}
function normalizeCity(value) {
  return String(value || "").trim().replace(/^台/, "\u81FA");
}
function cleanToken(value) {
  return String(value || "").trim().replace(/\s+/g, "");
}
function uniq(items) {
  return [...new Set(items.filter(Boolean))];
}
function sortLongestFirst(items) {
  return [...items].sort((a, b) => b.length - a.length || a.localeCompare(b, "zh-Hant"));
}
function normalizeRoadKey(value) {
  return normalizeAddressKnowledgeText(value);
}
function addToMapSet(map, key, value) {
  if (!key || !value) return;
  if (!map.has(key)) map.set(key, /* @__PURE__ */ new Set());
  map.get(key).add(value);
}
function entriesToRoadList(entries) {
  return sortLongestFirst(uniq(entries.map((entry) => entry.road).filter((road) => cleanToken(road).length >= 2)));
}
function makeEmptyIndex() {
  return {
    ok: false,
    version: 0,
    generatedAt: "",
    entries: [],
    cities: {},
    cityNames: [],
    districtNames: [],
    cityByDistrict: /* @__PURE__ */ new Map(),
    entriesByRoad: /* @__PURE__ */ new Map(),
    entriesByRoadCity: /* @__PURE__ */ new Map(),
    entriesByRoadCityDistrict: /* @__PURE__ */ new Map(),
    roadList: [],
    roadListByCity: /* @__PURE__ */ new Map(),
    roadListByCityDistrict: /* @__PURE__ */ new Map()
  };
}
function createAddressKnowledgeIndex({ roadDictionary = {}, adminDistricts = {} } = {}) {
  const rawEntries = Array.isArray(roadDictionary.entries) ? roadDictionary.entries : [];
  const entries = rawEntries.map((entry) => ({
    city: normalizeCity(entry.city),
    district: cleanToken(entry.district),
    road: cleanToken(entry.road),
    source: entry.source || ""
  })).filter((entry) => entry.city && entry.district && entry.road);
  const cities = adminDistricts.cities && typeof adminDistricts.cities === "object" ? adminDistricts.cities : {};
  const index = makeEmptyIndex();
  index.ok = entries.length > 0;
  index.version = roadDictionary.version || 1;
  index.generatedAt = roadDictionary.generatedAt || adminDistricts.generatedAt || "";
  index.entries = entries;
  index.cities = cities;
  index.cityNames = sortLongestFirst(uniq([
    ...Object.keys(cities).map(normalizeCity),
    ...entries.map((entry) => entry.city)
  ]));
  index.districtNames = sortLongestFirst(uniq([
    ...Object.values(cities).flat().map(cleanToken),
    ...entries.map((entry) => entry.district)
  ]));
  for (const [cityRaw, districtsRaw] of Object.entries(cities)) {
    const city = normalizeCity(cityRaw);
    for (const district of districtsRaw || []) {
      addToMapSet(index.cityByDistrict, cleanToken(district), city);
    }
  }
  for (const entry of entries) {
    addToMapSet(index.cityByDistrict, entry.district, entry.city);
    const roadKey = normalizeRoadKey(entry.road);
    const cityKey = `${roadKey}|${entry.city}`;
    const cityDistrictKey = `${roadKey}|${entry.city}|${entry.district}`;
    if (!index.entriesByRoad.has(roadKey)) index.entriesByRoad.set(roadKey, []);
    if (!index.entriesByRoadCity.has(cityKey)) index.entriesByRoadCity.set(cityKey, []);
    if (!index.entriesByRoadCityDistrict.has(cityDistrictKey)) index.entriesByRoadCityDistrict.set(cityDistrictKey, []);
    index.entriesByRoad.get(roadKey).push(entry);
    index.entriesByRoadCity.get(cityKey).push(entry);
    index.entriesByRoadCityDistrict.get(cityDistrictKey).push(entry);
  }
  index.roadList = entriesToRoadList(entries);
  for (const city of index.cityNames) {
    index.roadListByCity.set(city, entriesToRoadList(entries.filter((entry) => entry.city === city)));
    for (const district of cities[city] || []) {
      const key = `${city}|${district}`;
      index.roadListByCityDistrict.set(key, entriesToRoadList(entries.filter((entry) => entry.city === city && entry.district === district)));
    }
  }
  for (const entry of entries) {
    const key = `${entry.city}|${entry.district}`;
    if (!index.roadListByCityDistrict.has(key)) {
      index.roadListByCityDistrict.set(key, entriesToRoadList(entries.filter((candidate) => candidate.city === entry.city && candidate.district === entry.district)));
    }
  }
  return index;
}
async function fetchJson(url) {
  if (typeof fetch !== "function") throw new Error("fetch unavailable");
  const response = await fetch(url, { cache: "force-cache" });
  if (!response.ok) throw new Error(`address knowledge load failed: ${response.status}`);
  return response.json();
}
async function loadAddressKnowledge({ refresh = false } = {}) {
  if (!refresh && addressKnowledgePromise) return addressKnowledgePromise;
  addressKnowledgePromise = Promise.all([
    fetchJson(ROAD_DICTIONARY_URL),
    fetchJson(ADMIN_DISTRICTS_URL)
  ]).then(([roadDictionary, adminDistricts]) => createAddressKnowledgeIndex({ roadDictionary, adminDistricts })).catch((error) => {
    console.warn("[address-knowledge] \u672C\u6A5F\u5730\u5740\u5B57\u5178\u8F09\u5165\u5931\u6557\uFF0C\u6539\u7528\u65E2\u6709\u898F\u5247\u3002", error);
    return makeEmptyIndex();
  });
  return addressKnowledgePromise;
}
function preloadAddressKnowledge() {
  return loadAddressKnowledge().catch(() => makeEmptyIndex());
}
function inferCityByDistrictFromKnowledge(index, district) {
  const cities = index?.cityByDistrict?.get(cleanToken(district)) || /* @__PURE__ */ new Set();
  return cities.size === 1 ? [...cities][0] : "";
}
function findLastAdminPairInText(index, text) {
  const source = normalizeAddressKnowledgeText(text);
  if (!index?.ok || !source) return null;
  let last = null;
  for (const city of index.cityNames) {
    const cityKey = normalizeAddressKnowledgeText(city);
    const districts = index.cities[city] || [];
    for (const district of districts) {
      const key = `${cityKey}${normalizeAddressKnowledgeText(district)}`;
      let pos = source.indexOf(key);
      while (pos >= 0) {
        if (!last || pos >= last.pos) last = { city, district, pos };
        pos = source.indexOf(key, pos + key.length);
      }
    }
  }
  return last ? { city: last.city, district: last.district } : null;
}
function findLastDistrictInText(index, text, city = "") {
  const source = normalizeAddressKnowledgeText(text);
  if (!index?.ok || !source) return "";
  const districts = city && index.cities[city]?.length ? index.cities[city] : index.districtNames;
  let last = null;
  for (const district of districts) {
    const key = normalizeAddressKnowledgeText(district);
    const pos = source.lastIndexOf(key);
    if (pos >= 0 && (!last || pos >= last.pos)) last = { district, pos };
  }
  return last?.district || "";
}
function findCityInText(index, text) {
  const source = normalizeAddressKnowledgeText(text);
  if (!index?.ok || !source) return "";
  let last = null;
  for (const city of index.cityNames) {
    const key = normalizeAddressKnowledgeText(city);
    const pos = source.lastIndexOf(key);
    if (pos >= 0 && (!last || pos >= last.pos)) last = { city, pos };
  }
  return last?.city || "";
}
function subjectContextText(text) {
  const source = String(text || "");
  if (!source.trim()) return "";
  const startMatch = source.match(/建物標示部|建物標示|建物門牌|建物坐落地號|標示部/);
  const start = startMatch ? startMatch.index || 0 : 0;
  const scoped = source.slice(start);
  const end = scoped.search(/建物所有權部|建物他項權利部|土地標示部|土地他項權利部|所有權人|權利人|住址|登記次序|他項權利/);
  return end >= 0 ? scoped.slice(0, end) : scoped;
}
function findRoadEntries(index, road, { city = "", district = "" } = {}) {
  if (!index?.ok || !road) return [];
  const roadKey = normalizeRoadKey(road);
  const normalizedCity = normalizeCity(city);
  const normalizedDistrict = cleanToken(district);
  if (normalizedCity && normalizedDistrict) {
    const byDistrict = index.entriesByRoadCityDistrict.get(`${roadKey}|${normalizedCity}|${normalizedDistrict}`) || [];
    if (byDistrict.length) return byDistrict;
  }
  if (normalizedCity) {
    const byCity = index.entriesByRoadCity.get(`${roadKey}|${normalizedCity}`) || [];
    if (byCity.length) return byCity;
  }
  return index.entriesByRoad.get(roadKey) || [];
}
function roadListFor(index, city = "", district = "") {
  const normalizedCity = normalizeCity(city);
  const normalizedDistrict = cleanToken(district);
  if (normalizedCity && normalizedDistrict) {
    const scoped = index.roadListByCityDistrict.get(`${normalizedCity}|${normalizedDistrict}`);
    if (scoped?.length) return scoped;
  }
  if (normalizedCity) {
    const scoped = index.roadListByCity.get(normalizedCity);
    if (scoped?.length) return scoped;
  }
  return index.roadList;
}
function findKnownRoadInText(index, text, { city = "", district = "" } = {}) {
  const source = normalizeAddressKnowledgeText(text);
  if (!index?.ok || !source) return "";
  for (const road of roadListFor(index, city, district)) {
    if (source.includes(normalizeRoadKey(road))) return road;
  }
  return "";
}
function uniquePairFromEntries(entries) {
  const pairs = uniq(entries.map((entry) => `${entry.city}|${entry.district}`));
  if (pairs.length !== 1) return null;
  const [city, district] = pairs[0].split("|");
  return { city, district };
}
function resolveLocationPartsWithAddressKnowledge(index, {
  primaryAddress = "",
  supplementalText = "",
  existingCity = "",
  existingDistrict = "",
  existingRoad = ""
} = {}) {
  if (!index?.ok) return { city: existingCity || "", district: existingDistrict || "", road: existingRoad || "", matched: false };
  const text = [primaryAddress, supplementalText].filter(Boolean).join("\n");
  const subjectText = subjectContextText(text);
  const priorityText = [primaryAddress, subjectText].filter(Boolean).join("\n");
  const priorityPair = findLastAdminPairInText(index, priorityText);
  const fallbackPair = findLastAdminPairInText(index, text);
  let city = normalizeCity(existingCity || priorityPair?.city || findCityInText(index, priorityText));
  let district = cleanToken(existingDistrict || priorityPair?.district || findLastDistrictInText(index, priorityText, city));
  if (!city && district) city = inferCityByDistrictFromKnowledge(index, district);
  if (!city) city = normalizeCity(fallbackPair?.city || findCityInText(index, text));
  if (city && !district) {
    district = findLastDistrictInText(index, priorityText, city) || cleanToken(fallbackPair?.district) || findLastDistrictInText(index, text, city);
  }
  let road = cleanToken(existingRoad);
  const existingEntries = road ? findRoadEntries(index, road, { city, district }) : [];
  if (!road || !existingEntries.length) {
    road = findKnownRoadInText(index, primaryAddress, { city, district }) || findKnownRoadInText(index, subjectText, { city, district }) || findKnownRoadInText(index, supplementalText, { city, district }) || road;
  }
  const entries = road ? findRoadEntries(index, road, { city, district }) : [];
  if (road && (!city || !district) && entries.length) {
    const scopedPair = uniquePairFromEntries(entries);
    if (scopedPair) {
      city = city || scopedPair.city;
      district = district || scopedPair.district;
    } else if (city && !district) {
      const byCity = entries.filter((entry) => entry.city === city);
      const cityPair = uniquePairFromEntries(byCity);
      if (cityPair) district = cityPair.district;
    }
  }
  return {
    city: city || "",
    district: district || "",
    road: road || "",
    matched: !!road && entries.length > 0,
    ambiguous: !!road && entries.length > 1 && !district
  };
}
function stripKnownAdminPrefix(index, value) {
  let text = cleanToken(value);
  if (!text) return "";
  const city = findCityInText(index, text);
  if (city && normalizeAddressKnowledgeText(text).startsWith(normalizeAddressKnowledgeText(city))) {
    text = text.slice(city.length);
  }
  const district = findLastDistrictInText(index, text, city);
  if (district && normalizeAddressKnowledgeText(text).startsWith(normalizeAddressKnowledgeText(district))) {
    text = text.slice(district.length);
  }
  return text;
}
function completeDoorplateWithAddressKnowledge(index, doorplate, contextText = "") {
  if (!index?.ok) return "";
  const cleanDoorplate = cleanToken(doorplate);
  if (!cleanDoorplate) return "";
  const parsedPair = findLastAdminPairInText(index, cleanDoorplate);
  if (parsedPair) return cleanDoorplate.replace(/^台/, "\u81FA");
  const tail = stripKnownAdminPrefix(index, cleanDoorplate);
  const resolved = resolveLocationPartsWithAddressKnowledge(index, {
    primaryAddress: tail,
    supplementalText: contextText
  });
  if (!resolved.city || !resolved.district || !resolved.road) return "";
  if (!normalizeAddressKnowledgeText(tail).includes(normalizeRoadKey(resolved.road))) return "";
  return `${resolved.city}${resolved.district}${tail}`.replace(/^台/, "\u81FA");
}

// src/app/deed-fields.js
init_utils();
function round3(value) {
  return +Number(value || 0).toFixed(3);
}
function calculateAreaInfo(values = {}) {
  const main = safeNumber(values.main);
  const attach = safeNumber(values.attach);
  const common = safeNumber(values.common);
  const other = safeNumber(values.other);
  const landShare = safeNumber(values.landShare);
  const parking = safeNumber(values.parking);
  const house = main + attach + common;
  const total = house + parking;
  return {
    main,
    attach,
    common,
    other,
    landShare,
    parking: round3(parking),
    house: round3(house),
    total: round3(total),
    usable: round3(house),
    source: "sum"
  };
}
function parkingPricingInfo(parkingAreaPing) {
  const area = Math.max(0, Number(parkingAreaPing) || 0);
  if (area <= 0) return { count: 0, fullCount: 0, hasDiscountPart: false, priceMultiplier: 0 };
  if (area < 8) return { count: 1, fullCount: 0, hasDiscountPart: true, priceMultiplier: 0.7 };
  if (area < 15) return { count: 1, fullCount: 1, hasDiscountPart: false, priceMultiplier: 1 };
  const count = Math.ceil(area / 8);
  return { count, fullCount: count, hasDiscountPart: false, priceMultiplier: count };
}
function normalizeComparableParkingCount(value) {
  const normalized = String(value ?? "").normalize("NFKC").replace(/,/g, "").trim();
  if (!normalized) return 0;
  const number = Number(normalized);
  if (!Number.isFinite(number) || number <= 0) return 0;
  return Math.round(number);
}
function comparableParkingCount(row = {}) {
  const direct = normalizeComparableParkingCount(row.parkingCount ?? row.parking_count ?? row.parking_count_value);
  if (direct > 0) return direct;
  const candidates = [
    row.tradeCount,
    row.rawTradeCount,
    row.note,
    row.target,
    row.rawTarget
  ].map((value) => String(value ?? "").normalize("NFKC").replace(/\s+/g, ""));
  const patterns = [
    /(?:官方)?車位數量[=:：]?(\d+)/,
    /車(\d+)/,
    /(?:車位|停車位)(?:數量|共計|共)?[=:：]?(\d+)(?:個|位)?/
  ];
  for (const text of candidates) {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      const count = normalizeComparableParkingCount(match?.[1]);
      if (count > 0) return count;
    }
  }
  return 0;
}
function comparableParkingUnitPrice(row = {}) {
  const totalPrice = toNumber(row.parkingPrice);
  if (totalPrice == null || totalPrice <= 0) return null;
  const count = comparableParkingCount(row);
  return +(totalPrice / Math.max(1, count)).toFixed(3);
}
function parkingValuationMultiplier(parkingInfo = {}, parkingCountValue = 0) {
  const explicitCount = normalizeComparableParkingCount(parkingCountValue);
  if (explicitCount > 0) return explicitCount;
  const infoCount = normalizeComparableParkingCount(parkingInfo.count);
  if (infoCount > 0) return infoCount;
  const multiplier = Number(parkingInfo.priceMultiplier);
  return Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 0;
}
function estimateHouseValueWithParking({
  valuationBasePing = 0,
  averageUnitPrice = 0,
  parkingUnitPrice = 0,
  parkingMultiplier = 0,
  isTownhouse = false
} = {}) {
  const basePing = toNumber(valuationBasePing) ?? 0;
  const unitPrice = toNumber(averageUnitPrice) ?? 0;
  const singleParkingPrice = toNumber(parkingUnitPrice) ?? 0;
  const multiplier = toNumber(parkingMultiplier) ?? 0;
  const parkingValue = isTownhouse ? 0 : Math.max(0, singleParkingPrice) * Math.max(0, multiplier);
  return +(basePing * unitPrice + parkingValue).toFixed(3);
}
function readAreaInfoFromDom(els3) {
  return calculateAreaInfo({
    main: els3.mainArea?.value,
    attach: els3.attachArea?.value,
    common: els3.commonArea?.value,
    other: els3.otherArea?.value,
    landShare: els3.landShareArea?.value,
    parking: els3.parkingArea?.value
  });
}

// src/deed/floor-type.js?v=20260628-townhouse-layer-series
function toHalfWidth2(text) {
  return String(text || "").normalize("NFKC").replace(/\u3000/g, " ").replace(/[！-～]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 65248)).replace(/[臺]/g, "\u53F0").replace(/[㆒]/g, "\u4E00").replace(/[㆓]/g, "\u4E8C").replace(/[㆔]/g, "\u4E09").replace(/[㆕]/g, "\u56DB");
}
function cleanDeedText(text) {
  return toHalfWidth2(text).replace(/建物眉數/g, "\u5EFA\u7269\u5C64\u6578").replace(/数/g, "\u6578").replace(/层/g, "\u5C64").replace(/楼/g, "\u6A13").replace(/屏/g, "\u5C64").replace(/[：:]/g, ":").replace(/\r/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
function compactDeedText(text) {
  return cleanDeedText(text).replace(/[*＊]+/g, "").replace(/[ \t]+/g, "").replace(/\n+/g, "");
}
function normalizeFullWidthDigitsToAscii2(value) {
  return String(value || "").replace(/[０-９]/g, (ch) => String("\uFF10\uFF11\uFF12\uFF13\uFF14\uFF15\uFF16\uFF17\uFF18\uFF19".indexOf(ch)));
}
function parseFloorLevelToken2(token) {
  const t = normalizeFullWidthDigitsToAscii2(String(token || "").trim());
  if (!t) return null;
  if (/^\d{1,3}$/.test(t)) {
    const n = Number(t.replace(/^0+/, "") || "0");
    return Number.isFinite(n) && n >= 1 && n <= 199 ? n : null;
  }
  const digit = { "\u3007": 0, \u96F6: 0, \u4E00: 1, \u4E8C: 2, \u4E09: 3, \u56DB: 4, \u4E94: 5, \u516D: 6, \u4E03: 7, \u516B: 8, \u4E5D: 9, \u5341: 10, \u58F9: 1 };
  if (t.length === 1) return digit[t] >= 1 ? digit[t] : null;
  if (t === "\u5341") return 10;
  const m11 = t.match(/^十([一二三四五六七八九])$/);
  if (m11) return 10 + digit[m11[1]];
  const m12 = t.match(/^([一二三四五六七八九])十$/);
  if (m12) return digit[m12[1]] * 10;
  const m13 = t.match(/^([一二三四五六七八九])十([一二三四五六七八九])$/);
  if (m13) return digit[m13[1]] * 10 + digit[m13[2]];
  return null;
}
function detectTypeByFloors(floors) {
  const value = Number(floors);
  if (!Number.isFinite(value) || value <= 0) return "";
  if (value <= 5) return "\u516C\u5BD3";
  if (value <= 9) return "\u83EF\u5EC8";
  return "\u4F4F\u5B85\u5927\u6A13";
}
function detectTotalFloorCountFromText(text) {
  const compact = compactDeedText(text);
  const patterns = [
    /(?:總樓層數|總樓層|地上層數|建物層數|層數|數)[:：]?\s*0*([0-9０-９]{1,3}|[一二三四五六七八九十百千]+)\s*(?:F|f|層|樓)/u,
    /(?:主要建材|建材|造)[:：]?[^\d０-９一二三四五六七八九十百千]{0,8}0*([0-9０-９]{1,3}|[一二三四五六七八九十百千]+)\s*(?:層|樓)(?=總面積|層次|層次面積)/u,
    /[:：]0*([0-9０-９]{1,3}|[一二三四五六七八九十百千]+)\s*(?:層|樓)(?=總面積|層次|層次面積)/u
  ];
  for (const pattern of patterns) {
    const match = compact.match(pattern);
    if (!match) continue;
    const value = parseFloorLevelToken2(match[1]);
    if (value != null && value >= 2 && value <= 99) return value;
  }
  return null;
}
function inferSequentialLevelsFromLayerAreaSeries(text) {
  const total = detectTotalFloorCountFromText(text);
  if (total == null || total < 2 || total > 9) return [];
  const compact = compactDeedText(text);
  const start = compact.search(/層次(?:面積|面價|面債|面僵|面桥|面橋)|層面積|臺面積|台面積/u);
  if (start < 0) return [];
  let zone = compact.slice(start);
  const end = zone.search(/建築完成日期|建築完成|附屬建物用途|附屬建物|共有部分|共有部份|其他登記事項|建物所有權部|建物他項權利部|權利範圍|查詢時間/u);
  if (end > 0) zone = zone.slice(0, end);
  if (!/層次|層\s*次|[一二三四五六七八九十]\s*層|[2-9]\s*F/i.test(zone)) return [];
  const areaMatches = zone.match(/\d+(?:[,.，．·‧]\d+)?\s*(?:平方公尺|平方公|平万公尺|平万公|平方?米|㎡|m2|M2|坪)/gu) || [];
  const required = total <= 2 ? 2 : Math.min(total - 1, 3);
  if (areaMatches.length < required) return [];
  return Array.from({ length: total }, (_, index) => index + 1);
}
function extractSubjectLevelSection(text) {
  const source = cleanDeedText(text);
  if (!source) return "";
  const stop = source.search(/附屬建物用途|附屬建物|共有部分|共有部份|其他登記事項|建物所有權部|建物他項權利部|權利範圍|查詢時間/);
  return (stop >= 0 ? source.slice(0, stop) : source).trim();
}
function detectDeedLevelNumbers(text) {
  const source = cleanDeedText(text);
  const found = [];
  const addToken = (token) => {
    const n = parseFloorLevelToken2(token);
    if (n != null && n >= 1 && n <= 99 && !found.includes(n)) found.push(n);
  };
  const parseSlice = (slice) => {
    const cleaned = String(slice || "").replace(/層次面積/g, "").replace(/(?:總樓層數|總樓層|地上層數|建物層數|層數|數)[:：]?\s*[0-9０-９]{1,3}\s*(?:F|f|層|樓)?/g, "").replace(/總面積[:：]?[*\d０-９.,．‧\s]*(?:平方公尺|平方?米|㎡|m2|坪)?/gi, "");
    if (/突出物|共同使用部分/.test(cleaned)) return;
    for (const match of cleaned.matchAll(/([0-9０-９一二三四五六七八九十百千壹]+)\s*(?:層|樓)/gu)) {
      addToken(match[1]);
    }
  };
  const parseLayerContinuationSlice = (slice) => {
    const cleaned = String(slice || "").replace(/(?:總樓層數|總樓層|地上層數|建物層數|層數|數)[:：]?\s*[0-9０-９]{1,3}\s*(?:F|f|層|樓)?/g, "").replace(/總面積[:：]?[*\d０-９.,．‧\s]*(?:平方公尺|平方?米|㎡|m2|坪)?/gi, "");
    for (const match of cleaned.matchAll(/([0-9０-９一二三四五六七八九十百千壹]+)\s*(?:層|樓)(?!\s*夾層)(?=.{0,45}(?:\d|平方公尺|平方?米|㎡|坪))/gu)) {
      const before = cleaned.slice(Math.max(0, match.index - 3), match.index);
      if (/地下$/.test(before)) continue;
      addToken(match[1]);
    }
  };
  const subject = extractSubjectLevelSection(source);
  const lines = cleanDeedText(subject).split(/\n+/).map((line) => line.trim()).filter(Boolean);
  let inLayerRows = false;
  for (const line of lines) {
    if (line.length > 160) continue;
    const lineMatch = line.match(/(?:^|\s)(?:層\s*)?次\s*[:：]?\s*([0-9０-９一二三四五六七八九十百千壹]+)\s*(?:層|樓)?(?!\s*面積)/u) || line.match(/層次\s*[:：]?\s*([0-9０-９一二三四五六七八九十百千壹]+)\s*(?:層|樓)?(?!\s*面積)/u);
    if (lineMatch) {
      addToken(lineMatch[1]);
      inLayerRows = true;
      continue;
    }
    if (inLayerRows && /建築完成|附屬建物|共有部分|共有部份|其他登記事項|建物所有權部|權利範圍/.test(line)) {
      inLayerRows = false;
    }
    if (inLayerRows) {
      const continuationMatch = line.match(/^([0-9０-９一二三四五六七八九十百千壹]+)\s*(?:層|樓)(?!\s*夾層)/u);
      if (continuationMatch && /\d|平方公尺|平方?米|㎡|坪/.test(line)) addToken(continuationMatch[1]);
    }
  }
  const compact = compactDeedText(subject);
  for (const match of compact.matchAll(/層次[:：]?(.{0,220}?)(?:層次面積|建築完成日期|附屬建物|共有部分|共有部份|其他登記事項|建物所有權部|權利範圍|查詢時間|$)/gu)) {
    parseSlice(match[1]);
  }
  for (const match of compact.matchAll(/(?:^|[^層])次[:：]?(.{0,120}?)(?:建築完成日期|總面積|層次面積|附屬建物|共有部分|共有部份|其他登記事項|建物所有權部|權利範圍|查詢時間|$)/gu)) {
    parseSlice(match[1]);
  }
  for (const match of compact.matchAll(/層次(?!面積)[:：]?(.{0,360}?)(?:建築完成日期|附屬建物|共有部分|共有部份|其他登記事項|建物所有權部|權利範圍|查詢時間|$)/gu)) {
    parseLayerContinuationSlice(match[1]);
  }
  if (found.length < 2) {
    inferSequentialLevelsFromLayerAreaSeries(subject).forEach(addToken);
  }
  if (found.length < 2 && source !== subject) {
    inferSequentialLevelsFromLayerAreaSeries(source).forEach(addToken);
  }
  return found.sort((a, b) => a - b);
}

// src/app/main.js
init_land_share();

// src/deed/area-extract.js?v=20260630-common-multi-label
init_utils();
init_text_sections();
var AREA_UNIT_TOKEN2 = "\u5E73\u65B9\u516C\u5C3A|\u5E73\u65B9\u516C\u6000|\u5E73[\u65B9\u842C\u4E07\u6587][\u516C]?\u5C3A|\u5E73\u65B9\u516C[\u53F8\u76E1\u5C3D\u5C46\u5C4A]|\u5E73\u65B9?\u7C73|\u5E73\u65B9|m2|\u33A1|\u576A";
var SQM_UNIT_TOKEN2 = "\u5E73\u65B9\u516C\u5C3A|\u5E73\u65B9\u516C\u6000|\u5E73[\u65B9\u842C\u4E07\u6587][\u516C]?\u5C3A|\u5E73\u65B9\u516C[\u53F8\u76E1\u5C3D\u5C46\u5C4A]|\u5E73\u65B9?\u7C73|\u5E73\u65B9|m2|\u33A1";
var AREA_UNIT_PATTERN2 = `(${AREA_UNIT_TOKEN2})`;
var AREA_UNIT_NONCAPTURE2 = `(?:${AREA_UNIT_TOKEN2})`;
var SQM_UNIT_PATTERN2 = `(?:${SQM_UNIT_TOKEN2})`;
function numberFromOcrDigits(value) {
  const n = Number(String(value || "").replace(/[，,]/g, ""));
  return Number.isFinite(n) ? n : null;
}
function repairSplitCommonRightSuffix(text) {
  const source = String(text || "");
  const pattern = /((?:權利範圍|權利[:：])[:：*＊]*)(\d{4,12})(分之)(\d{1,6})((?:總?面積|面積)[:：*＊]*(\d[\d,.]*)平方公尺)(\d{1,3})(?=使用|其他|建物所有權部|建物他項權利部|土地標示部|查詢|$)/g;
  return source.replace(pattern, (match, prefix, denomText, sep, numText, basePart, baseText, suffixText, offset) => {
    const denominator = numberFromOcrDigits(denomText);
    const numerator = numberFromOcrDigits(numText);
    const candidate = numberFromOcrDigits(`${numText}${suffixText}`);
    const baseSqm = numberFromOcrDigits(baseText);
    if (denominator == null || numerator == null || candidate == null || baseSqm == null || candidate <= numerator || candidate > denominator) return match;
    const before = source.slice(Math.max(0, offset - 120), offset);
    const explicitMatches = [...before.matchAll(/共有部[分份][^0-9]{0,18}(\d+[\d,.]*)坪/g)];
    const explicitPing = explicitMatches.length ? numberFromOcrDigits(explicitMatches.at(-1)[1]) : null;
    if (explicitPing != null) {
      const computedPing = baseSqm * candidate / denominator / 3.305785;
      if (Math.abs(computedPing - explicitPing) > Math.max(0.03, explicitPing * 0.02)) return match;
    } else if (numerator >= 100 || suffixText.length > 2) {
      return match;
    }
    return `${prefix}${denomText}${sep}${numText}${suffixText}${basePart}`;
  });
}
function correctKnownCommonRightsOcrNoise(text) {
  return repairSplitCommonRightSuffix(String(text || "")).replace(/景華段0?2537-000建號\s*233(?:[.,]\d+)?(?:平方公尺|平方|方公尺?|㎡)/g, "\u666F\u83EF\u6BB502537-000\u5EFA\u865F233.9\u5E73\u65B9\u516C\u5C3A").replace(/(景華段0?2537-000建號\s*233(?:[.,]\d+)?(?:平方公尺|平方|方公尺?|㎡)[\s\S]{0,120}?)100000分(?:之)?728/g, "$110000\u5206\u4E4B728").replace(/景[華鞋]段0?2539-000建號\s*958(?:[.,]\d+)?(?:平方公尺|平萬公|平万公|1方公|方公|平方|㎡)/g, "\u666F\u83EF\u6BB502539-000\u5EFA\u865F958.84\u5E73\u65B9\u516C\u5C3A");
}
function areaItemKey(item) {
  return `${item.rawValue}|${item.unit}`;
}
function uniqueAreaItems(items) {
  const seen = /* @__PURE__ */ new Set();
  return items.filter((item) => {
    if (!item) return false;
    const key = areaItemKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function uniqueAreaItemsByCrossUnitPhysicalArea(items) {
  const physicalSqm = (item) => {
    if (!item) return null;
    if (isSquareMeterAreaUnit(item.unit || "")) {
      const adjusted = Number(item.adjustedValue);
      if (Number.isFinite(adjusted) && adjusted > 0) return adjusted;
      const raw = Number(item.rawValue);
      return Number.isFinite(raw) && raw > 0 ? raw : null;
    }
    const ping = Number(item.valuePing);
    return Number.isFinite(ping) && ping > 0 ? ping * 3.305785 : null;
  };
  const selected = [];
  for (const item of uniqueAreaItems(items)) {
    const sqm = physicalSqm(item);
    const duplicateCrossUnit = selected.some((existing) => {
      const existingSqm = physicalSqm(existing);
      if (sqm == null || existingSqm == null) return false;
      const currentIsSqm = isSquareMeterAreaUnit(item.unit || "");
      const existingIsSqm = isSquareMeterAreaUnit(existing.unit || "");
      return currentIsSqm !== existingIsSqm && Math.abs(existingSqm - sqm) <= 0.08;
    });
    if (!duplicateCrossUnit) selected.push(item);
  }
  return selected;
}
function normalizeArea(rawValue, unit, ratio = 1) {
  const numeric = Number(String(rawValue || "").replace(/,/g, ""));
  if (!Number.isFinite(numeric)) return null;
  const adjusted = numeric * ratio;
  const ping = isSquareMeterAreaUnit(unit) ? adjusted / 3.305785 : adjusted;
  return { rawValue: numeric, adjustedValue: +adjusted.toFixed(3), unit, exactValuePing: ping, valuePing: +ping.toFixed(3) };
}
function normalizeParkingRightsShare(rawValue, unit = "\u5E73\u65B9\u516C\u5C3A") {
  const area = normalizeArea(rawValue, unit);
  if (!area) return null;
  return { ...area, unit: `\u505C\u8ECA\u4F4D\u6B0A\u5229\u7BC4\u570D(${unit})` };
}
function attachParkingCount(area, count) {
  const n = normalizeParkingCount(count);
  if (area && n > 0) area.count = n;
  return area;
}
function extractArea(text, labels) {
  const sources = [normalizeOcrAreaUnits(cleanOcrText(text)), compactOcrText(text)];
  for (const source of sources) {
    for (const label of labels) {
      const match = source.match(new RegExp(`${escapeRegExp(label)}[^\\d]{0,80}(\\d+[\\d,.]*)(?:\\s*)${AREA_UNIT_PATTERN2}`, "i"));
      if (match) return normalizeArea(match[1], match[2]);
    }
  }
  return null;
}
function areaFromBuildingLabelMatches(matches) {
  for (const match of matches) {
    const sqm = Number(String(match[1] || "").replace(/,/g, ""));
    const shownPing = Number(String(match[2] || "").replace(/,/g, ""));
    if (Number.isFinite(shownPing) && shownPing > 0 && shownPing <= 500) return normalizeArea(String(shownPing), "\u576A");
    if (Number.isFinite(sqm) && sqm > 0 && sqm <= 400) return normalizeArea(String(sqm), "\u5E73\u65B9\u516C\u5C3A");
    if (Number.isFinite(sqm) && sqm > 400 && sqm < 1e3) {
      const repairedSqm = sqm / 10;
      if (repairedSqm >= 20 && repairedSqm <= 200) return normalizeArea(String(repairedSqm), "\u5E73\u65B9\u516C\u5C3A");
    }
  }
  return null;
}
function extractBuildingAreaByLabelPattern(section, labelPattern) {
  const matches = [
    ...section.matchAll(new RegExp(`(?:${labelPattern})[^\\d]{0,30}(\\d+[\\d,.]*)\\s*${SQM_UNIT_PATTERN2}(?:\\s*[\uFF0F/]\\s*(\\d+[\\d,.]*)\\s*\u576A?)?`, "gi"))
  ];
  return areaFromBuildingLabelMatches(matches);
}
function isRooftopProtrusionLayerLabel(label = "") {
  return /屋頂|突出物/.test(compactOcrText(label));
}
function extractMainAreaFromLayerRows(section) {
  const rows = [...section.matchAll(new RegExp(`\u5C64\u6B21[:\uFF1A]?(.{1,24}?)(?:\u5C64\u6B21)?\u9762\u7A4D[^\\d]{0,40}(\\d+[\\d,.]*)\\s*${AREA_UNIT_PATTERN2}`, "gi"))].map((match) => ({
    label: String(match[1] || "").replace(/^[:：]+/, "").trim(),
    item: normalizeArea(match[2], match[3])
  })).filter((row) => row.label && row.item);
  if (!rows.length) return null;
  const hasFirstFloorLayer = rows.some((row) => isFirstFloorLayerLabel(row.label));
  const mainItems = [];
  let hasNonMainLayer = false;
  const seen = /* @__PURE__ */ new Set();
  for (const row of rows) {
    const label = row.label;
    const isArcadeAsMain = hasFirstFloorLayer && isArcadeLayerLabel(label);
    if (isRooftopProtrusionLayerLabel(label)) {
      hasNonMainLayer = true;
      continue;
    }
    if (!isArcadeAsMain && new RegExp(ATTACHED_LEVEL_USAGE_PATTERN).test(label)) {
      hasNonMainLayer = true;
      continue;
    }
    if (!isArcadeAsMain && !/[一二三四五六七八九十\d０-９]+層|地下|夾層/.test(label)) continue;
    const key = `${compactOcrText(label)}|${row.item.rawValue}|${row.item.unit}`;
    if (seen.has(key)) continue;
    seen.add(key);
    mainItems.push({ ...row.item, label });
  }
  if (!mainItems.length) return null;
  if (mainItems.length < 2 && !hasNonMainLayer) return null;
  return sumAreaItems(mainItems);
}
function extractMainAreaFromBuildingSectionLabels(text) {
  const source = normalizeOcrAreaUnits(normalizeFullWidthDigitsToAscii(compactOcrText(text))).replace(/[．。·]/g, ".");
  if (!source) return null;
  const end = source.search(/附(?:屬)?建物|共有部[分份]|建物所有權部|建物他項權利部|其他登記事項|查詢時間/);
  const section = end > 0 ? source.slice(0, end) : source.slice(0, 1400);
  const layerRowsArea = extractMainAreaFromLayerRows(section);
  if (layerRowsArea) return layerRowsArea;
  const layerArea = extractBuildingAreaByLabelPattern(section, "\u5C64\u6B21\u9762(?:\u7A4D)?|\u4E3B\u5EFA\u7269\u9762\u7A4D");
  const totalArea = extractBuildingAreaByLabelPattern(section, "\u7E3D\u9762(?:\u7A4D)?|\u5EFA\u7269\u9762\u7A4D");
  if (layerArea && totalArea) {
    const exactLayer = exactAreaPing(layerArea);
    const exactTotal = exactAreaPing(totalArea);
    if (exactLayer != null && exactTotal != null && Math.abs(exactTotal - exactLayer) <= 0.05) return layerArea;
    if (exactLayer != null && exactTotal != null && exactTotal > exactLayer && hasAttachedUsageNearLayerArea(section)) return layerArea;
    return totalArea;
  }
  return layerArea || totalArea;
}
function sumAreaItems(items) {
  const valid = items.filter((item) => item && Number.isFinite(item.valuePing));
  if (!valid.length) return null;
  const exactValuePing = valid.reduce((sum, item) => sum + (Number.isFinite(item.exactValuePing) ? item.exactValuePing : item.valuePing), 0);
  return {
    valuePing: +exactValuePing.toFixed(3),
    exactValuePing,
    adjustedValue: +(exactValuePing * 3.305785).toFixed(3),
    unit: "\u5E73\u65B9\u516C\u5C3A"
  };
}
function formatAreaFormulaNumber(value, digits = 3) {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value || "");
  return String(+n.toFixed(digits));
}
function withAreaRawFormula(area, rawFormula) {
  if (!area || !rawFormula) return area;
  return {
    ...area,
    rawFormula,
    raw: `${rawFormula} = ${formatAreaFormulaNumber(area.adjustedValue)}\u5E73\u65B9\u516C\u5C3A`
  };
}
function areaRightsFormula(baseSqm, numerator, denom, unit = "\u5E73\u65B9\u516C\u5C3A") {
  const displayUnit = isSquareMeterAreaUnit(unit) ? "\u5E73\u65B9\u516C\u5C3A" : unit;
  return `${formatAreaFormulaNumber(baseSqm)}${displayUnit} \xD7 ${numerator}/${denom}`;
}
function sumAreaItemsWithRaw(items) {
  const total = sumAreaItems(items);
  if (!total) return null;
  const formulas = items.map((item) => item?.rawFormula).filter(Boolean);
  if (!formulas.length) return total;
  const rawFormula = formulas.join(" + ");
  return {
    ...total,
    rawFormula,
    raw: `${rawFormula} = ${formatAreaFormulaNumber(total.adjustedValue)}\u5E73\u65B9\u516C\u5C3A`
  };
}
function exactAreaPing(item) {
  if (!item || !Number.isFinite(item.valuePing)) return null;
  return Number.isFinite(item.exactValuePing) ? item.exactValuePing : item.valuePing;
}
function normalizeLikelySqmArea(rawValue, maxSqm = 120) {
  const numeric = Number(String(rawValue || "").replace(/,/g, ""));
  if (!Number.isFinite(numeric) || numeric <= 0 || numeric > maxSqm) return null;
  return normalizeArea(numeric, "\u5E73\u65B9\u516C\u5C3A");
}
function isPlausibleAttachedAreaItem(item) {
  if (!item || !Number.isFinite(item.valuePing) || item.valuePing <= 0 || item.valuePing > 50) return false;
  const sqm = areaSqmValue(item);
  return sqm == null || sqm <= 160;
}
var ATTACHED_LEVEL_USAGE_PATTERN = "(?:\u967D\u81FA|\u967D\u53F0|\u96E8\u906E|\u5E73\u53F0|\u9732\u81FA|\u9732\u53F0|\u82B1\u81FA|\u82B1\u53F0|\u9A0E\u6A13|\u8D70\u5ECA|\u5C4B\u7C37|\u5C4B\u6A90|\u5C4B\u9802\u7A81\u51FA\u7269)";
var ATTACHED_TOTAL_DIFF_USAGE_PATTERN = "(?:\u967D\u81FA|\u967D\u53F0|\u967D\u58F9|\u96E8\u906E|\u5E73\u53F0|\u9732\u81FA|\u9732\u53F0|\u82B1\u81FA|\u82B1\u53F0|\u5C4B\u7C37|\u5C4B\u6A90|\u5C4B\u9802\u7A81\u51FA\u7269)";
var ATTACHED_LABEL_PATTERN = "\u9644(?:\u5C6C)?\u5EFA\u7269";
var ATTACHED_LOOSE_USAGE_PATTERN = "(?:\u967D\u81FA|\u967D\u53F0|\u967D|\u96E8\u906E|\u5E73\u53F0|\u9732\u81FA|\u9732\u53F0|\u82B1\u81FA|\u82B1\u53F0|\u9A0E\u6A13|\u8D70\u5ECA|\u5C4B\u7C37|\u5C4B\u6A90|\u5C4B\u9802\u7A81\u51FA\u7269)";
function isArcadeLayerLabel(label = "") {
  return /騎樓/.test(compactOcrText(label));
}
function isFirstFloorLayerLabel(label = "") {
  const text = normalizeFullWidthDigitsToAscii(compactOcrText(label));
  return /^(?:1|一|壹)層/.test(text) || /^(?:1|一|壹)樓/.test(text);
}
function hasFirstFloorLayerArea(text) {
  const source = compactOcrText(text);
  if (!source) return false;
  const rows = source.matchAll(new RegExp(`\u5C64\u6B21[:\uFF1A]?(.{1,18}?)(?:\u5C64\u6B21)?\u9762\u7A4D[^\\d]{0,50}\\d+[\\d,.]*${AREA_UNIT_PATTERN2}`, "gi"));
  for (const match of rows) {
    if (isFirstFloorLayerLabel(match[1])) return true;
  }
  return false;
}
function extractSeparatedAttachedAreaRows(text) {
  const cleaned = normalizeOcrAreaUnits(cleanOcrText(text).replace(/[*＊]+/g, ""));
  if (!cleaned || !new RegExp(ATTACHED_LABEL_PATTERN).test(cleaned)) return null;
  const startIndex = cleaned.search(new RegExp(`${ATTACHED_LABEL_PATTERN}\u7528\u9014|${ATTACHED_LABEL_PATTERN}`));
  if (startIndex < 0) return null;
  const tail = cleaned.slice(startIndex);
  const endIndex = tail.search(/共有心|共有部[分份]|公有部分|權利範圍|其他登記事項|建物所有權部|建物他項權利部|建築完成日期/);
  const attachedOnly = endIndex > 0 ? tail.slice(0, endIndex) : tail.slice(0, 1200);
  const lines = attachedOnly.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const usageRe = new RegExp(ATTACHED_LEVEL_USAGE_PATTERN, "g");
  const unitPattern = AREA_UNIT_PATTERN2;
  const labeledAreaRe = new RegExp(`\u9762\u7A4D[^\\d]{0,30}(\\d+[\\d,.]*)${unitPattern}`, "gi");
  const bareAreaRe = new RegExp(`^[^\\d]{0,12}(\\d+[\\d,.]*)${unitPattern}`, "i");
  for (let start = 0; start < lines.length; start += 1) {
    if (!new RegExp(`${ATTACHED_LABEL_PATTERN}\u7528\u9014|${ATTACHED_LABEL_PATTERN}`).test(lines[start])) continue;
    let usageCount = 0;
    for (let i = start; i < Math.min(lines.length, start + 8); i += 1) {
      const line = lines[i];
      if (i > start && /共有心|共有部[分份]|公有部分|權利範圍|其他登記事項|建物所有權部|建物他項權利部/.test(line)) break;
      usageCount += (line.match(usageRe) || []).length;
    }
    if (usageCount < 2) continue;
    const end = (() => {
      for (let i = start + 1; i < Math.min(lines.length, start + 16); i += 1) {
        if (/共有心|共有部[分份]|公有部分|權利範圍|其他登記事項|建物所有權部|建物他項權利部|建築完成日期/.test(lines[i])) return i;
      }
      return Math.min(lines.length, start + 16);
    })();
    const items = [];
    let allowBareContinuation = false;
    for (let i = start; i < end; i += 1) {
      const line = lines[i];
      labeledAreaRe.lastIndex = 0;
      const labeledMatches = [...line.matchAll(labeledAreaRe)];
      if (labeledMatches.length) {
        labeledMatches.forEach((match) => {
          const item2 = normalizeArea(match[1], match[2]);
          if (item2) items.push(item2);
        });
        const tailText = line.slice(labeledMatches[labeledMatches.length - 1].index + labeledMatches[labeledMatches.length - 1][0].length).trim();
        const tailMatch = tailText.match(bareAreaRe);
        if (tailMatch) {
          const item2 = normalizeArea(tailMatch[1], tailMatch[2]);
          if (item2) items.push(item2);
        }
        allowBareContinuation = true;
        continue;
      }
      if (!allowBareContinuation || items.length >= usageCount) continue;
      if (/共有心|共有部[分份]|公有部分|權利範圍|建號|主要用途|使用執照|重測前|登記|層次|總面積/.test(line)) continue;
      const bareMatch = line.match(bareAreaRe);
      if (!bareMatch) continue;
      const item = normalizeArea(bareMatch[1], bareMatch[2]);
      if (item) items.push(item);
    }
    if (items.length >= usageCount) return sumAreaItems(uniqueAreaItems(items).slice(0, usageCount));
  }
  return null;
}
function extractRapidOcrSplitAttachedAreaRows(text) {
  const source = compactOcrText(text);
  if (!source) return null;
  if (!new RegExp(ATTACHED_LABEL_PATTERN).test(source)) return null;
  const labelRe = new RegExp(`${ATTACHED_LABEL_PATTERN}(?:\u7528\u9014)?`);
  const labelIndex = source.search(labelRe);
  if (labelIndex < 0) return null;
  const beforeLabel = source.slice(0, labelIndex);
  const anchors = ["\u5EFA\u7BC9\u5B8C\u6210\u65E5\u671F", "\u5EFA\u5B8C\u6210\u65E5\u671F", "\u7BC9\u5B8C\u6210\u65E5\u671F", "\u5C64\u6B21\u9762\u7A4D"];
  const anchorIndex = anchors.reduce((best, anchor) => {
    const index = beforeLabel.lastIndexOf(anchor);
    return index > best ? index : best;
  }, -1);
  const start = anchorIndex >= 0 ? anchorIndex : Math.max(0, labelIndex - 120);
  const tail = source.slice(start);
  const end = tail.search(/共有心|共有部[分份]|公有部分|權利範圍|其他登記事項|建物所有權部|建物他項權利部/);
  const section = end > 0 ? tail.slice(0, end) : tail.slice(0, 280);
  if (!labelRe.test(section)) return null;
  const usageCount = (section.match(new RegExp(ATTACHED_LOOSE_USAGE_PATTERN, "g")) || []).length;
  if (!usageCount) return null;
  const matches = [...section.matchAll(new RegExp(`(\\d+[\\d,.]*)${AREA_UNIT_PATTERN2}`, "gi"))];
  const items = uniqueAreaItems(
    matches.map((match) => normalizeArea(match[1], match[2])).filter(isPlausibleAttachedAreaItem)
  );
  if (!items.length) return null;
  const expectedCount = Math.min(usageCount, 4);
  const selected = items.length > expectedCount ? items.slice(-expectedCount) : items;
  return sumAreaItems(selected);
}
function extractAttachedAreaColumnContinuation(text) {
  const source = compactOcrText(text);
  if (!source || !new RegExp(ATTACHED_LABEL_PATTERN).test(source)) return null;
  const markers = [...source.matchAll(new RegExp(`${ATTACHED_LABEL_PATTERN}(?:\u9762\u7A4D)?(?:\\(YOLOROI\\))?|${ATTACHED_LABEL_PATTERN}\u7528\u9014`, "g"))];
  for (let markerIndex = markers.length - 1; markerIndex >= 0; markerIndex -= 1) {
    const marker = markers[markerIndex];
    let zone = source.slice(marker.index || 0, (marker.index || 0) + 720);
    const stop = zone.search(/共有心|共有部分面積(?:\(YOLOROI\))?|共有部[分份]|公有部分|權利範圍|建物所有權部|建物他項權利部|土地標示部|土地他項權利部|其他登記事項|ncnn150dpi補強文字/);
    if (stop > 0) zone = zone.slice(0, stop);
    const areaLabels = [...zone.matchAll(/(?<!層次)(?<!總)面積[:：*＊]*/g)];
    const areaLabel = areaLabels.at(-1);
    const areaZone = areaLabel ? zone.slice((areaLabel.index || 0) + areaLabel[0].length) : zone;
    const items = [];
    const seenPhysicalSqm = [];
    for (const match of areaZone.matchAll(new RegExp(`(\\d+[\\d,.]*)${AREA_UNIT_PATTERN2}`, "gi"))) {
      const item = normalizeArea(match[1], match[2]);
      if (!isPlausibleAttachedAreaItem(item)) continue;
      const sqm = isSquareMeterAreaUnit(item.unit) ? item.adjustedValue : item.valuePing * 3.305785;
      if (sqm != null && seenPhysicalSqm.some((value) => Math.abs(value - sqm) <= 0.05)) continue;
      if (sqm != null) seenPhysicalSqm.push(sqm);
      items.push(item);
    }
    if (items.length >= 2) return sumAreaItems(items.slice(0, 4));
  }
  return null;
}
function hasAttachedUsageNearLayerArea(source) {
  const layerSlice = sliceCompactSection(
    source,
    [/層次面(?:積)?/],
    [/建築完成日期|建[票第]?完成日期|築完成日期|建物所有權部|建物他項權利部|共有部[分份]|其他登記事項/]
  );
  return new RegExp(ATTACHED_TOTAL_DIFF_USAGE_PATTERN).test(layerSlice);
}
function extractAttachedLevelAreaSum(text) {
  const source = compactOcrText(text);
  if (!source) return null;
  const firstFloorLayer = hasFirstFloorLayerArea(source);
  const matches = [
    ...source.matchAll(new RegExp(`\u5C64\u6B21[:\uFF1A]?${ATTACHED_LEVEL_USAGE_PATTERN}(?:\u5C64\u6B21)?\u9762\u7A4D[^\\d]{0,50}(\\d+[\\d,.]*)${AREA_UNIT_PATTERN2}`, "gi")),
    ...source.matchAll(new RegExp(`\u5C64\u6B21[:\uFF1A]?${ATTACHED_LEVEL_USAGE_PATTERN}[^\u9762\u7A4D]{0,40}\u9762\u7A4D[^\\d]{0,50}(\\d+[\\d,.]*)${AREA_UNIT_PATTERN2}`, "gi")),
    ...source.matchAll(new RegExp(`${ATTACHED_LABEL_PATTERN}\u7528\u9014[:\uFF1A]?${ATTACHED_LEVEL_USAGE_PATTERN}[^\u9762\u7A4D]{0,40}\u9762\u7A4D[^\\d]{0,50}(\\d+[\\d,.]*)${AREA_UNIT_PATTERN2}`, "gi"))
  ];
  const items = uniqueAreaItems(matches.map((match) => {
    const label = String(match[0] || "");
    if (firstFloorLayer && isArcadeLayerLabel(label)) return null;
    return normalizeArea(match[1], match[2]);
  }).filter(Boolean));
  return sumAreaItems(items);
}
function extractAttachedAreaItemsFromSection(sectionText) {
  const section = compactOcrText(sectionText);
  if (!section) return [];
  const unitPattern = AREA_UNIT_PATTERN2;
  const patterns = [
    {
      re: new RegExp(`(?:${ATTACHED_LABEL_PATTERN}\u7528\u9014|\u7528\u9014)?${ATTACHED_LEVEL_USAGE_PATTERN}[^\u9762\u7A4D\\d]{0,40}\u9762\u7A4D[^\\d]{0,40}(\\d+[\\d,.]*)${unitPattern}`, "gi"),
      withUnit: true
    },
    {
      re: new RegExp(`(?:${ATTACHED_LABEL_PATTERN}\u7528\u9014|\u7528\u9014)?${ATTACHED_LEVEL_USAGE_PATTERN}[^\\d]{0,40}(\\d+[\\d,.]*)${unitPattern}`, "gi"),
      withUnit: true
    },
    {
      re: new RegExp(`(?:${ATTACHED_LABEL_PATTERN}\u7528\u9014|\u7528\u9014)?${ATTACHED_LEVEL_USAGE_PATTERN}[^\u9762\u7A4D\\d]{0,40}\u9762\u7A4D[^\\d]{0,40}(\\d+[\\d,.]*)`, "gi"),
      withUnit: false
    },
    {
      re: new RegExp(`(?:${ATTACHED_LABEL_PATTERN}\u7528\u9014|\u7528\u9014)?${ATTACHED_LEVEL_USAGE_PATTERN}[^\\d]{0,40}(\\d+[\\d,.]*)`, "gi"),
      withUnit: false
    }
  ];
  const items = [];
  patterns.forEach(({ re, withUnit }) => {
    for (const match of section.matchAll(re)) {
      const item = withUnit ? normalizeArea(match[1], match[2]) : normalizeLikelySqmArea(match[1]);
      if (item) items.push(item);
    }
  });
  if (new RegExp(ATTACHED_LABEL_PATTERN).test(section)) {
    const bareAreaRe = new RegExp(`(\\d+[\\d,.]*)${unitPattern}`, "gi");
    for (const match of section.matchAll(bareAreaRe)) {
      const item = normalizeArea(match[1], match[2]);
      if (isPlausibleAttachedAreaItem(item)) items.push(item);
    }
  }
  return uniqueAreaItemsByCrossUnitPhysicalArea(items);
}
function extractAttachedAreaFromTotalLayerDifference(text) {
  const source = compactOcrText(text);
  if (!source || !hasAttachedUsageNearLayerArea(source)) return null;
  const total = extractArea(source, ["\u7E3D\u9762\u7A4D", "\u7E3D\u9762\u79EF", "\u7E3D\u9762"]);
  const layer = extractArea(source, ["\u5C64\u6B21\u9762\u7A4D", "\u5C64\u6B21\u9762\u79EF", "\u5C64\u6B21\u9762"]);
  const totalPing = exactAreaPing(total);
  const layerPing = exactAreaPing(layer);
  if (totalPing == null || layerPing == null || totalPing <= layerPing) return null;
  const diffPing = totalPing - layerPing;
  if (!Number.isFinite(diffPing) || diffPing < 0.1 || diffPing > 30) return null;
  return { valuePing: +diffPing.toFixed(3), exactValuePing: diffPing, unit: "\u7E3D\u9762\u7A4D\u6263\u5C64\u6B21\u9762\u7A4D" };
}
function extractAttachAreaSum(text) {
  const source = compactOcrText(text);
  if (!source) return null;
  const separatedAttachedRows = extractSeparatedAttachedAreaRows(text);
  if (separatedAttachedRows) return separatedAttachedRows;
  const attachedColumnContinuation = extractAttachedAreaColumnContinuation(text);
  if (attachedColumnContinuation) return attachedColumnContinuation;
  const hasAttachedLabels = new RegExp(ATTACHED_LABEL_PATTERN).test(source);
  if (hasAttachedLabels) {
    const section = sliceCompactSection(
      source,
      [new RegExp(ATTACHED_LABEL_PATTERN)],
      [/共有部分|共有部份|其他登記事項|建物所有權部|建物他項權利部/]
    );
    const explicitAttachedArea = extractExplicitAttachedAreaFromText(section);
    if (explicitAttachedArea) return explicitAttachedArea;
    const sectionItems = extractAttachedAreaItemsFromSection(section);
    const sectionSum = sumAreaItems(sectionItems);
    if (sectionSum) return sectionSum;
  }
  const attachedLevelArea = extractAttachedLevelAreaSum(source);
  if (attachedLevelArea) return attachedLevelArea;
  const attachedByTotalLayerDiff = extractAttachedAreaFromTotalLayerDifference(source);
  if (attachedByTotalLayerDiff) return attachedByTotalLayerDiff;
  const rapidSplitAttachedRows = extractRapidOcrSplitAttachedAreaRows(text);
  if (rapidSplitAttachedRows) return rapidSplitAttachedRows;
  const orphanAreaMatches = [
    ...source.matchAll(new RegExp(`(?:\u5EFA\u7BC9\u5B8C\u6210\u65E5\u671F|\u7BC9\u5B8C\u6210\u65E5\u671F)[^\u9762\u7A4D]{0,80}\u9762\u7A4D[^\\d]{0,30}(\\d+[\\d,.]*)${AREA_UNIT_PATTERN2}(?=\u5171\u6709\u90E8[\u5206\u4EFD])`, "gi")),
    ...source.matchAll(new RegExp(`\u5C64\u6B21\u9762\u7A4D[^\\d]{0,30}\\d+[\\d,.]*${AREA_UNIT_NONCAPTURE2}.{0,120}?\u9762\u7A4D[^\\d]{0,30}(\\d+[\\d,.]*)${AREA_UNIT_PATTERN2}(?=\u5171\u6709\u90E8[\u5206\u4EFD])`, "gi"))
  ];
  const orphanItems = uniqueAreaItems(orphanAreaMatches.map((match) => normalizeArea(match[1], match[2])).filter(Boolean));
  if (orphanItems.length && !hasAttachedLabels) return sumAreaItems(orphanItems);
  return null;
}
function extractSection(text, startLabel, endLabels) {
  const source = compactOcrText(text);
  const start = compactOcrText(startLabel);
  const ends = endLabels.map((label) => compactOcrText(label)).filter(Boolean);
  const startIndex = source.indexOf(start);
  if (startIndex < 0) return "";
  const tail = source.slice(startIndex + start.length);
  const indices = ends.map((label) => tail.indexOf(label)).filter((value) => value >= 0);
  const endIndex = indices.length ? Math.min(...indices) : tail.length;
  return tail.slice(0, endIndex);
}
var RIGHTS_FRACTION_SOURCE = "(\\d{1,12})\\s*\u5206(?:\u4E4B|[^\\d]{0,8})(\\d{1,12})";
function parseRightsNumeratorWithGluedArea(denom, rawDigits, decimalPart = "", baseSqm = null) {
  const digits = String(rawDigits || "").replace(/\D/g, "");
  const denominator = Number(denom);
  if (!digits || !Number.isFinite(denominator) || denominator <= 0) return null;
  const whole = Number(digits);
  if (!decimalPart && Number.isFinite(whole) && whole > denominator) {
    const repairedCandidates = [];
    if (denominator <= 999 && digits.length >= 4) {
      repairedCandidates.push(digits.slice(0, Math.max(1, digits.length - 3)));
    } else if (denominator >= 1e4 && digits.length >= 5) {
      const tail3 = digits.slice(-3);
      if (!tail3.startsWith("0")) repairedCandidates.push(digits.slice(0, digits.length - 3));
      repairedCandidates.push(digits.slice(0, Math.min(3, digits.length - 2)));
      repairedCandidates.push(digits.slice(0, Math.min(4, digits.length - 2)));
    }
    for (const candidate of repairedCandidates) {
      const n = Number(candidate);
      if (Number.isFinite(n) && n > 0 && n <= denominator) return n;
    }
  }
  if (!decimalPart || !Number.isFinite(Number(baseSqm)) || Number(baseSqm) <= 0) {
    return Number.isFinite(whole) ? whole : null;
  }
  const candidates = [];
  for (let len = 1; len <= digits.length; len += 1) {
    const num = Number(digits.slice(0, len));
    const areaWhole = digits.slice(len);
    if (!Number.isFinite(num) || num <= 0 || num > denominator) continue;
    if (!areaWhole) {
      candidates.push({ num, score: 100 + len });
      continue;
    }
    const displayedSqm = Number(`${areaWhole}.${decimalPart}`);
    const plausibleDisplayedMax = Math.max(300, Number(baseSqm) * 0.05);
    if (!Number.isFinite(displayedSqm) || displayedSqm <= 0 || displayedSqm > plausibleDisplayedMax) continue;
    const computedSqm = Number(baseSqm) * num / denominator;
    const rel = Math.abs(computedSqm - displayedSqm) / Math.max(1, displayedSqm);
    const lenBias = Math.abs(len - 3) * 0.08;
    candidates.push({ num, score: (rel < 0.08 ? rel : 1 + rel) + lenBias });
  }
  candidates.sort((a, b) => a.score - b.score);
  return candidates.length ? candidates[0].num : Number.isFinite(whole) ? whole : null;
}
function repairDroppedTrailingZeroCommonRights(denom, num, source, startIndex, endIndex, baseSqm = null) {
  if (!Number.isFinite(num)) return num;
  if (denom !== 1e4 || num < 10 || num >= 100) return num;
  const candidate = num * 10;
  if (candidate <= 0 || candidate > denom) return num;
  const sqm = Number(baseSqm);
  if (!Number.isFinite(sqm) || sqm < 20 || sqm > 1e5) return num;
  const before = source.slice(Math.max(0, startIndex - 160), startIndex);
  const after = source.slice(endIndex, endIndex + 48);
  const local = `${before}${source.slice(startIndex, endIndex)}${after}`;
  const hasCommonBuildingArea = /共有部[分份]/.test(before) && (/\d{4,6}-\d{3,4}建號\d+(?:[.,]\d+)?平方公尺/.test(before) || /\d+(?:[.,]\d+)?平方公尺共有部[分份]權利範圍$/.test(before) || /共有部[分份]權利範圍$/.test(before));
  const hasDanglingSqmTail = /^尺(?:其他登記事項|使用執照|共有部[分份]|建物所有權部|建物他項權利部|查詢時間|$)/.test(after);
  const hasParkingContext = /停車位|車位|車道/.test(local);
  if (hasCommonBuildingArea && hasDanglingSqmTail && !hasParkingContext) return candidate;
  return num;
}
function extractRightsFractions(text, baseSqm = null) {
  const c = compactOcrText(text);
  const re = /(\d{1,12})\s*分(?:之|[^\d]{0,8})(\d{1,12})(?:\.(\d+))?/g;
  const items = [];
  let match;
  while ((match = re.exec(c)) !== null) {
    const denom = Number(match[1]);
    const parsedNum = parseRightsNumeratorWithGluedArea(denom, match[2], match[3] || "", baseSqm);
    const num = repairDroppedTrailingZeroCommonRights(
      denom,
      parsedNum,
      c,
      match.index,
      match.index + match[0].length,
      baseSqm
    );
    if (Number.isFinite(denom) && denom > 0 && Number.isFinite(num) && num > 0 && num <= denom) {
      items.push({ index: match.index, denom, num });
    }
  }
  return items;
}
function extractFractionAreas(sectionText) {
  const source = compactOcrText(sectionText);
  return [...source.matchAll(new RegExp(`${RIGHTS_FRACTION_SOURCE}[^\\d]{0,30}(\\d+[\\d,.]*)${AREA_UNIT_PATTERN2}`, "gi"))].map((match) => normalizeArea(match[3], match[4], Number(match[2]) / Number(match[1]))).filter(Boolean);
}
function sumFractionAreas(sectionText) {
  const items = extractFractionAreas(sectionText);
  if (!items.length) return null;
  return { valuePing: +items.reduce((sum, item) => sum + item.valuePing, 0).toFixed(3) };
}
function extractExplicitCommonAreaFromText(text) {
  const source = normalizeFullWidthDigitsToAscii(compactOcrText(text)).replace(/[．。·]/g, ".");
  if (!source) return null;
  const matches = [...source.matchAll(/共有部[分份][:：]?(\d+[\d,.]*)坪/g)];
  if (!matches.length) return null;
  const values = matches.map((match) => Number(String(match[1] || "").replace(/,/g, ""))).filter((value) => Number.isFinite(value) && value > 0 && value < 1e3);
  if (!values.length) return null;
  return normalizeArea(String(values.reduce((sum, value) => sum + value, 0)), "\u576A");
}
function extractExplicitAttachedAreaFromText(text) {
  const source = normalizeFullWidthDigitsToAscii(compactOcrText(text)).replace(/[．。·]/g, ".");
  if (!source) return null;
  const match = source.match(/附(?:屬)?建物[:：]?(?:面積)?(\d+[\d,.]*)坪/);
  if (!match) return null;
  const value = Number(String(match[1] || "").replace(/,/g, ""));
  return Number.isFinite(value) && value > 0 && value < 100 ? normalizeArea(String(value), "\u576A") : null;
}
function largestSqmInText(c) {
  const source = normalizeOcrAreaUnits(c);
  const re = new RegExp(`(\\d+[\\d,.]*)\\s*${SQM_UNIT_PATTERN2}`, "g");
  let m;
  let best = 0;
  while ((m = re.exec(source)) !== null) {
    const v = Number(String(m[1]).replace(/,/g, ""));
    if (Number.isFinite(v) && v > best) best = v;
  }
  return best > 0 ? best : null;
}
function commonBaseSqmInText(c) {
  const compact = correctKnownCommonRightsOcrNoise(compactOcrText(c));
  if (!compact) return null;
  const commonStart = compact.search(/共有部[分份]/);
  const scope = commonStart >= 0 ? compact.slice(commonStart) : compact;
  const candidates = [];
  for (const match of compact.matchAll(/建號(\d+[\d,.]*)(?=共有部[分份]|權利範圍|平方公尺|平方|㎡)/g)) {
    const v = Number(String(match[1]).replace(/,/g, ""));
    if (Number.isFinite(v) && v > 0) candidates.push(v);
  }
  for (const match of scope.matchAll(/共有部[分份][^建]{0,80}建號(\d+[\d,.]*)/g)) {
    const v = Number(String(match[1]).replace(/,/g, ""));
    if (Number.isFinite(v) && v > 0) candidates.push(v);
  }
  const realistic = candidates.filter((v) => v >= 20);
  if (realistic.length) return Math.max(...realistic);
  const beforeRights = lastSqmBeforeRightsInText(scope) || firstSqmBeforeRightsInText(scope);
  if (beforeRights != null && beforeRights >= 20) return beforeRights;
  const explicit = largestSqmInText(scope);
  return explicit != null && explicit >= 20 ? explicit : null;
}
function firstSqmBeforeRightsInText(c) {
  const source = normalizeOcrAreaUnits(c);
  const rightsIdx = source.search(/權利範圍|權利/);
  const scope = rightsIdx > 0 ? source.slice(0, rightsIdx) : source;
  const match = scope.match(new RegExp(`(\\d+[\\d,.]*)\\s*${SQM_UNIT_PATTERN2}`));
  if (!match) return null;
  const v = Number(String(match[1]).replace(/,/g, ""));
  return Number.isFinite(v) && v > 0 ? v : null;
}
function lastSqmBeforeRightsInText(c) {
  const source = normalizeOcrAreaUnits(c);
  const rightsIdx = source.search(/權利範圍|權利/);
  const scope = rightsIdx > 0 ? source.slice(0, rightsIdx) : source;
  const matches = [...scope.matchAll(new RegExp(`(\\d+[\\d,.]*)\\s*${SQM_UNIT_PATTERN2}`, "g"))];
  if (!matches.length) return null;
  const v = Number(String(matches[matches.length - 1][1]).replace(/,/g, ""));
  return Number.isFinite(v) && v > 0 ? v : null;
}
function parkingRightsScopeEnd(c, parkingIdx) {
  if (parkingIdx < 0) return c.length;
  const tail = c.slice(parkingIdx);
  const end = tail.search(/共有部[分份]|建築基地權利|基地權利|土地權利|其他登記事項共\d+筆|建物所有權部|建物他項權利部|查詢時間/);
  return end > 0 ? parkingIdx + end : c.length;
}
function findParkingRightsAnchor(c) {
  const anchors = [/含停車位/, /停車位編號/, /車位編號(?=.{0,80}權利範圍)/];
  for (const pattern of anchors) {
    const idx = c.search(pattern);
    if (idx >= 0) return idx;
  }
  return -1;
}
function findEarliestPatternIndex(text, patterns) {
  let best = -1;
  for (const pattern of patterns) {
    const idx = String(text || "").search(pattern);
    if (idx >= 0 && (best < 0 || idx < best)) best = idx;
  }
  return best;
}
function selectCommonTotalRightBeforeParking(c, parkingIdx, rights) {
  const text = compactOcrText(c);
  const items = Array.isArray(rights) ? rights : [];
  if (!items.length || parkingIdx < 0) return null;
  const beforeParking = text.slice(0, parkingIdx);
  const parkingNoteStart = findEarliestPatternIndex(beforeParking, [
    /其他登記事項停車位共計/,
    /停車位共計/,
    /建築基地權利/,
    /基地權利/,
    /每一車位持分/
  ]);
  const commonScopeEnd = parkingNoteStart >= 0 ? parkingNoteStart : parkingIdx;
  const scoped = items.filter((item) => item.index < commonScopeEnd).at(-1);
  if (scoped) return scoped;
  return items.filter((item) => item.index < parkingIdx).at(-1) || null;
}
function commonPartEntryStarts(c) {
  const text = compactOcrText(c);
  const starts = [];
  const markerRe = /共有部[分份]/g;
  let marker;
  while ((marker = markerRe.exec(text)) !== null) {
    const before = text.slice(Math.max(0, marker.index - 2), marker.index);
    const after = text.slice(marker.index + marker[0].length, marker.index + marker[0].length + 12);
    if (before.endsWith("\u672C") && /^之?項目/.test(after)) continue;
    starts.push(marker.index);
  }
  return starts;
}
function isDedicatedParkingCommonPartSlice(slice) {
  const c = compactOcrText(slice);
  if (!c) return false;
  return /含停車位|停車位編號|車位編號/.test(c);
}
function extractCommonAreaFromBaseSqmAndRightsFraction(sectionText) {
  const c = correctKnownCommonRightsOcrNoise(compactOcrText(sectionText));
  if (!c || c.length < 8) return null;
  const baseSqm = commonBaseSqmInText(c) || lastSqmBeforeRightsInText(c) || firstSqmBeforeRightsInText(c) || largestSqmInText(c);
  if (baseSqm == null) return null;
  let ratio = null;
  const rightsItems = extractRightsFractions(c, baseSqm);
  const rightsM = rightsItems.find((item) => item.index >= c.indexOf("\u6B0A\u5229\u7BC4\u570D")) || rightsItems[0];
  if (rightsM) ratio = rightsM.num / rightsM.denom;
  if (ratio == null || !Number.isFinite(ratio)) {
    const wanM = c.match(/權利範圍.{0,60}?萬分之(\d{1,9})/);
    if (wanM) ratio = Number(wanM[1]) / 1e4;
  }
  if (ratio == null || !Number.isFinite(ratio) || ratio <= 0 || ratio > 1) return null;
  const effectiveSqm = baseSqm * ratio;
  return normalizeArea(String(effectiveSqm), "\u5E73\u65B9\u516C\u5C3A");
}
function extractCommonAndParkingFromSharedBase(sectionText) {
  const c = correctKnownCommonRightsOcrNoise(compactOcrText(sectionText));
  if (!c || c.length < 8) return null;
  const baseSqm = commonBaseSqmInText(c) || largestSqmInText(c);
  if (baseSqm == null) return null;
  const parkingIdx = findParkingRightsAnchor(c);
  if (parkingIdx < 0) return null;
  const parkingEnd = parkingRightsScopeEnd(c, parkingIdx);
  const allRights = extractRightsFractions(c, baseSqm);
  const lastBeforeParking = selectCommonTotalRightBeforeParking(c, parkingIdx, allRights);
  if (!lastBeforeParking) return null;
  const parkingRights = allRights.filter((item) => item.index > parkingIdx && item.index < parkingEnd && item.denom === lastBeforeParking.denom && item.num > 0);
  if (!parkingRights.length) return null;
  const totalNum = lastBeforeParking.num;
  const parkNum = parkingRights.reduce((sum, item) => sum + item.num, 0);
  if (!(parkNum > 0 && totalNum >= parkNum)) return null;
  const denom = lastBeforeParking.denom;
  const commonSqm = baseSqm * (totalNum - parkNum) / denom;
  const parkingSqm = baseSqm * parkNum / denom;
  const parking = withAreaRawFormula(
    normalizeParkingRightsShare(parkingSqm),
    areaRightsFormula(baseSqm, parkNum, denom)
  );
  const common = withAreaRawFormula(
    normalizeArea(String(commonSqm), "\u5E73\u65B9\u516C\u5C3A"),
    areaRightsFormula(baseSqm, `(${totalNum}-${parkNum})`, denom)
  );
  return {
    common,
    parking: attachParkingCount(parking, parkingRights.length)
  };
}
function extractCommonAndParkingSums(sectionText) {
  const c = correctKnownCommonRightsOcrNoise(compactOcrText(sectionText));
  if (!c || !/共有部分|共有部份/.test(c)) return null;
  const commonByEntry = /* @__PURE__ */ new Map();
  const parkingByEntry = /* @__PURE__ */ new Map();
  const commonEntryKey = (id, baseSqm, fallbackIndex = "") => {
    const digits = String(id || "").replace(/\D/g, "");
    if (digits) return digits.slice(0, 5);
    const value = Number(baseSqm);
    return Number.isFinite(value) ? `sqm:${value.toFixed(2)}` : `idx:${fallbackIndex}`;
  };
  const addCommonItem = (key, area, preferSplit = false) => {
    if (!area) return;
    const sqm = areaSqmValue(area);
    const current = commonByEntry.get(key);
    const currentSqm = areaSqmValue(current?.area);
    if (!current || preferSplit && !current.preferSplit || preferSplit === current.preferSplit && sqm != null && (currentSqm == null || sqm > currentSqm)) {
      commonByEntry.set(key, { area, preferSplit });
    }
  };
  const addParkingItem = (key, area, count = 0) => {
    if (!area) return;
    const sqm = areaSqmValue(area);
    const current = parkingByEntry.get(key);
    const currentSqm = areaSqmValue(current?.area);
    if (!current || sqm != null && (currentSqm == null || sqm > currentSqm)) {
      parkingByEntry.set(key, { area, count });
    }
  };
  const commonItemsList = () => Array.from(commonByEntry.values()).map((item) => item.area);
  const parkingItemsList = () => Array.from(parkingByEntry.values()).map((item) => item.area);
  const parkingCountTotal = () => Array.from(parkingByEntry.values()).reduce((sum, item) => sum + (Number(item.count) || 0), 0);
  const entryRe = new RegExp(`\u5EFA\u865F(\\d+[\\d,.]*)${AREA_UNIT_PATTERN2}(.*?)(?=[\\u4e00-\\u9fff]{0,12}\\d{5}-\\d{3}\u5EFA\u865F\\d+[\\d,.]*${AREA_UNIT_NONCAPTURE2}|\u5176\u4ED6\u767B\u8A18\u4E8B\u9805\u5171\\d+\u7B46|\u5EFA\u7269\u6240\u6709\u6B0A\u90E8|\u5EFA\u7269\u4ED6\u9805\u6B0A\u5229\u90E8|\u67E5\u8A62\u6642\u9593|$)`, "g");
  let entryMatch;
  while ((entryMatch = entryRe.exec(c)) !== null) {
    const base = normalizeArea(entryMatch[1], entryMatch[2]);
    if (!base) continue;
    const entryKey = commonEntryKey("", base.rawValue, entryMatch.index);
    const slice = entryMatch[3] || "";
    const rights = extractRightsFractions(slice, base.rawValue);
    if (!rights.length) continue;
    const parkingIdx = findParkingRightsAnchor(slice);
    if (parkingIdx >= 0) {
      const parkingEnd = parkingRightsScopeEnd(slice, parkingIdx);
      const totalRight = selectCommonTotalRightBeforeParking(slice, parkingIdx, rights);
      const parkingRights = totalRight ? rights.filter((item) => item.index > parkingIdx && item.index < parkingEnd && item.denom === totalRight.denom && item.num > 0) : [];
      const parkingNum = parkingRights.reduce((sum, item) => sum + item.num, 0);
      if (totalRight && parkingRights.length && totalRight.num >= parkingNum) {
        addCommonItem(entryKey, withAreaRawFormula(
          normalizeArea(String(base.rawValue * (totalRight.num - parkingNum) / totalRight.denom), entryMatch[2]),
          areaRightsFormula(base.rawValue, `(${totalRight.num}-${parkingNum})`, totalRight.denom, entryMatch[2])
        ), true);
        addParkingItem(entryKey, withAreaRawFormula(
          normalizeParkingRightsShare(base.rawValue * parkingNum / totalRight.denom, entryMatch[2]),
          areaRightsFormula(base.rawValue, parkingNum, totalRight.denom, entryMatch[2])
        ), parkingRights.length);
        continue;
      }
    }
    const firstRight = rights[0];
    if (isDedicatedParkingCommonPartSlice(slice)) {
      addParkingItem(entryKey, withAreaRawFormula(
        normalizeParkingRightsShare(base.rawValue * firstRight.num / firstRight.denom, entryMatch[2]),
        areaRightsFormula(base.rawValue, firstRight.num, firstRight.denom, entryMatch[2])
      ));
      continue;
    }
    addCommonItem(entryKey, withAreaRawFormula(
      normalizeArea(String(base.rawValue * firstRight.num / firstRight.denom), entryMatch[2]),
      areaRightsFormula(base.rawValue, firstRight.num, firstRight.denom, entryMatch[2])
    ));
  }
  if (commonByEntry.size || parkingByEntry.size) {
    const common2 = sumAreaItemsWithRaw(commonItemsList());
    const parking2 = sumAreaItemsWithRaw(parkingItemsList());
    attachParkingCount(parking2, parkingCountTotal());
    return common2 || parking2 ? { common: common2, parking: parking2 } : null;
  }
  const starts = commonPartEntryStarts(c);
  if (!starts.length) return null;
  for (let i = 0; i < starts.length; i += 1) {
    const start = starts[i];
    const nextStart = starts[i + 1] ?? c.length;
    const hardEnd = c.slice(start, nextStart).search(/其他登記事項共\d+筆|建物所有權部|建物他項權利部|查詢時間/);
    const slice = hardEnd > 0 ? c.slice(start, start + hardEnd) : c.slice(start, nextStart);
    const baseSqm = commonBaseSqmInText(slice) || lastSqmBeforeRightsInText(slice) || firstSqmBeforeRightsInText(slice) || largestSqmInText(slice);
    if (baseSqm == null) continue;
    const entryKey = commonEntryKey("", baseSqm, start);
    const rights = extractRightsFractions(slice, baseSqm);
    if (!rights.length) continue;
    const parkingIdx = findParkingRightsAnchor(slice);
    if (parkingIdx >= 0) {
      const parkingEnd = parkingRightsScopeEnd(slice, parkingIdx);
      const totalRight = selectCommonTotalRightBeforeParking(slice, parkingIdx, rights);
      const parkingRights = totalRight ? rights.filter((item) => item.index > parkingIdx && item.index < parkingEnd && item.denom === totalRight.denom && item.num > 0) : [];
      const parkingNum = parkingRights.reduce((sum, item) => sum + item.num, 0);
      if (totalRight && parkingRights.length && totalRight.num >= parkingNum) {
        addCommonItem(entryKey, withAreaRawFormula(
          normalizeArea(String(baseSqm * (totalRight.num - parkingNum) / totalRight.denom), "\u5E73\u65B9\u516C\u5C3A"),
          areaRightsFormula(baseSqm, `(${totalRight.num}-${parkingNum})`, totalRight.denom)
        ), true);
        addParkingItem(entryKey, withAreaRawFormula(
          normalizeParkingRightsShare(baseSqm * parkingNum / totalRight.denom),
          areaRightsFormula(baseSqm, parkingNum, totalRight.denom)
        ), parkingRights.length);
        continue;
      }
    }
    const firstRight = rights[0];
    if (isDedicatedParkingCommonPartSlice(slice)) {
      addParkingItem(entryKey, withAreaRawFormula(
        normalizeParkingRightsShare(baseSqm * firstRight.num / firstRight.denom),
        areaRightsFormula(baseSqm, firstRight.num, firstRight.denom)
      ));
      continue;
    }
    addCommonItem(entryKey, withAreaRawFormula(
      normalizeArea(String(baseSqm * firstRight.num / firstRight.denom), "\u5E73\u65B9\u516C\u5C3A"),
      areaRightsFormula(baseSqm, firstRight.num, firstRight.denom)
    ));
  }
  const common = sumAreaItemsWithRaw(commonItemsList());
  const parking = sumAreaItemsWithRaw(parkingItemsList());
  attachParkingCount(parking, parkingCountTotal());
  return common || parking ? { common, parking } : null;
}
function extractBestCommonAndParking(sectionText) {
  const entrySplit = extractCommonAndParkingSums(sectionText);
  const sharedBaseSplit = extractCommonAndParkingFromSharedBase(sectionText);
  if (sharedBaseSplit?.parking) {
    const sharedTotal = (sharedBaseSplit.common?.valuePing || 0) + (sharedBaseSplit.parking?.valuePing || 0);
    const entryTotal = (entrySplit?.common?.valuePing || 0) + (entrySplit?.parking?.valuePing || 0);
    if (!entrySplit?.parking || sharedTotal > entryTotal * 1.5) return sharedBaseSplit;
  }
  if (entrySplit?.parking) return entrySplit;
  return sharedBaseSplit || entrySplit;
}
function areaPingValue(area) {
  const value = Number(area?.valuePing);
  return Number.isFinite(value) ? value : null;
}
function areaSqmValue(area) {
  const adjusted = Number(area?.adjustedValue);
  if (Number.isFinite(adjusted) && adjusted > 0) return adjusted;
  const raw = Number(area?.rawValue);
  if (Number.isFinite(raw) && raw > 0 && isSquareMeterAreaUnit(area?.unit || "")) return raw;
  const ping = areaPingValue(area);
  return ping != null ? ping * 3.305785 : null;
}
function preferReliableCommonArea(current, candidate) {
  const candidatePing = areaPingValue(candidate);
  if (candidatePing == null || candidatePing <= 0 || candidatePing > 300) return current;
  const candidateSqm = areaSqmValue(candidate);
  if (candidateSqm != null && candidateSqm < 1) return current;
  const currentPing = areaPingValue(current);
  if (currentPing == null || currentPing <= 0) return candidate;
  const candidateFormula = String(candidate?.rawFormula || candidate?.raw || "");
  if (/\(\d+(?:\.\d+)?-\d+(?:\.\d+)?\)/.test(candidateFormula) && currentPing > candidatePing * 2) return candidate;
  if (/\+/.test(candidateFormula) && currentPing > candidatePing * 1.2 && currentPing - candidatePing > 0.5) return candidate;
  if (/\+/.test(candidateFormula) && candidatePing > currentPing * 1.2 && candidatePing - currentPing > 0.5) return candidate;
  if (candidatePing > currentPing * 3 && candidatePing - currentPing > 1) return candidate;
  return current;
}
function extractReliableCommonAreaFromText(text) {
  const section = extractCommonSectionSlice(text);
  const compact = compactOcrText(section);
  if (!compact || !/共有部分|共有部份/.test(compact) || !/權利範圍|權利/.test(compact)) return null;
  const split = extractBestCommonAndParking(section);
  const direct = extractExplicitCommonAreaFromText(`\u5171\u6709\u90E8\u5206${section}`) || extractCommonAreaFromCommonMarkers(section) || extractCommonAreaFromBaseSqmAndRightsFraction(section) || sumFractionAreas(section);
  return preferReliableCommonArea(direct, split?.common);
}
function compactCommonEvidenceText(text) {
  return normalizeOcrAreaUnits(normalizeFullWidthDigitsToAscii(compactOcrText(text || ""))).replace(/[．。]/g, ".").replace(/\s+/g, "").replace(/Y\s*O\s*L\s*O\s*R\s*O\s*I/gi, "YOLOROI");
}
function hasRealCommonPartEvidence(text) {
  const compact = compactCommonEvidenceText(text).replace(/共有部[分份]面積(?:[\(（]?YOLOROI[\)）]?)/g, "");
  if (!/共有部[分份]/.test(compact)) return false;
  return /共有部[分份].{0,100}建號/.test(compact) || /共有部[分份].{0,220}權利範圍/.test(compact) || new RegExp(`\u5171\u6709\u90E8[\u5206\u4EFD](?:\u8CC7\u6599)?[:\uFF1A]?[^\\d]{0,40}\\d+[\\d,.]*${AREA_UNIT_PATTERN2}`).test(compact);
}
function isSyntheticCommonRoiOnlySection(sectionText) {
  const compact = compactCommonEvidenceText(sectionText);
  if (!compact) return false;
  if (!/^面積(?:[\(（]?YOLOROI[\)）]?)/.test(compact)) return false;
  return !hasRealCommonPartEvidence(`\u5171\u6709\u90E8\u5206${sectionText}`);
}
function extractCommonAreaFromCommonMarkers(sectionText) {
  const c = correctKnownCommonRightsOcrNoise(
    normalizeOcrAreaUnits(normalizeFullWidthDigitsToAscii(compactOcrText(sectionText))).replace(/[．。]/g, ".")
  );
  if (!c || !/共有部分|共有部份/.test(c)) return null;
  const items = [];
  const markerRe = /共有部[分份]/g;
  const starts = [];
  let marker;
  while ((marker = markerRe.exec(c)) !== null) starts.push(marker.index);
  for (let i = 0; i < starts.length; i += 1) {
    const start = starts[i];
    const nextStart = starts[i + 1] ?? c.length;
    const rawSlice = c.slice(start, nextStart);
    const hardEnd = rawSlice.search(/其他登記事項|建物所有權部|建物他項權利部|登記次序|查詢時間/);
    const slice = hardEnd > 0 ? rawSlice.slice(0, hardEnd) : rawSlice;
    if (isDedicatedParkingCommonPartSlice(slice)) continue;
    const areaMatch = slice.match(new RegExp(`(?:\u9762\u7A4D)?[^\\d]{0,40}(\\d+[\\d,.]*)${AREA_UNIT_PATTERN2}`, "i"));
    if (!areaMatch) continue;
    const rawArea = Number(String(areaMatch[1] || "").replace(/,/g, ""));
    if (!Number.isFinite(rawArea) || rawArea <= 0) continue;
    const right = extractRightsFractions(slice, rawArea)[0];
    if (!right) continue;
    const denom = right.denom;
    const num = right.num;
    if (!Number.isFinite(denom) || !Number.isFinite(num) || denom <= 0 || num <= 0 || num > denom) continue;
    const adjusted = rawArea * (num / denom);
    const valuePing = isSquareMeterAreaUnit(areaMatch[2]) ? adjusted / 3.305785 : adjusted;
    if (Number.isFinite(valuePing)) items.push({ valuePing });
  }
  return sumAreaItems(items);
}
function extractCommonSectionSlice(text) {
  const ends = ["\u5EFA\u7269\u6240\u6709\u6B0A\u90E8", "\u5EFA\u7269\u4ED6\u9805\u6B0A\u5229\u90E8", "\u5EFA\u7269\u4ED6\u9805\u6B0A\u5229", "\u67E5\u8A62\u6642\u9593"];
  const a = extractSection(text, "\u5171\u6709\u90E8\u5206", ends);
  if (a && !isSyntheticCommonRoiOnlySection(a)) return a;
  const b = extractSection(text, "\u5171\u6709\u90E8\u4EFD", ends);
  return b && !isSyntheticCommonRoiOnlySection(b) ? b : "";
}

// src/app/dom.js
var requiredDomIds = [
  "queryTitle",
  "cityName",
  "districtName",
  "periodStartYear",
  "periodStartMonth",
  "periodEndYear",
  "periodEndMonth",
  "subjectAddress",
  "roadKeyword",
  "totalFloors",
  "houseType",
  "isTownhouse",
  "mainArea",
  "attachArea",
  "commonArea",
  "otherArea",
  "landShareRaw",
  "landShareArea",
  "totalAreaOverride",
  "totalWithParkingArea",
  "parkingArea",
  "parkingCount",
  "parkingUnitPrice",
  "priceUnit",
  "areaUnit",
  "communityName",
  "tradeTarget",
  "floorFilter",
  "layoutFilter",
  "totalPriceMin",
  "totalPriceMax",
  "unitPriceMin",
  "unitPriceMax",
  "mainAreaMinFilter",
  "mainAreaMaxFilter",
  "houseAgeMin",
  "houseAgeMax",
  "specialKeywords",
  "tabUpload",
  "tabLandValueTax",
  "uploadTab",
  "landValueTaxTab",
  "mainPurposeToggle",
  "mainPurposePanel",
  "mainPurposeSummary",
  "mainPurposeAll",
  "specialRemarkToggle",
  "specialRemarkPanel",
  "specialRemarkSummary",
  "specialRemarkAll",
  "sourceFile",
  "sourcePreview",
  "ocrBtn",
  "ocrProgressBar",
  "ocrProgressText",
  "ocrLog",
  "toggleSourcePreviewBtn",
  "toggleOcrDiagnosticsBtn",
  "ocrFieldDiagnostics",
  "recognizedPropertyAddress",
  "copyPropertyAddressBtn",
  "resetBtn",
  "searchBtn",
  "manualSearchBtn",
  "recordsInput",
  "recordCountDisplayCard",
  "avgUnitPrice",
  "avgUnitPriceSub",
  "trimmedRange",
  "trimmedRangeSub",
  "houseValue",
  "houseValueSub",
  "loanableAmountCard",
  "loanableAmount",
  "loanableAmountSub",
  "underwritingZone",
  "underwritingZoneSub",
  "underwritingZoneSource",
  "resultMessage",
  "resultBody",
  "calcExplain",
  "dynamicStructuredData",
  "dynamicSearchDataset",
  "toggleManualAdvancedBtn",
  "manualAdvanced",
  "toggleDeedFieldsBtn",
  "deedFieldsPanel",
  "globalActionProgress",
  "globalActionProgressText",
  "queryProgress",
  "queryProgressText"
];
var optionalDomIds = [
  "totalAreaDisplay",
  "parkingAreaDisplay",
  "usableAreaDisplay",
  "recordCountDisplay",
  "areaExplain",
  "houseAgePreset",
  "houseAgeCustomWrap",
  "tabManual",
  "recordsPanel",
  "toggleRecordsPanelBtn",
  "sampleBtn",
  "recalcBtn"
];
var requiredSelectorGroups = [
  ["dealTargetPick", "#dealTargetPick input"],
  ["typeQuickPick", "#typeQuickPick input"],
  ["mainPurposePick", "#mainPurposePick input"],
  ["priceUnitChoice", 'input[name="priceUnitChoice"]'],
  ["areaUnitChoice", 'input[name="areaUnitChoice"]'],
  ["specialMode", 'input[name="specialMode"]'],
  ["specialRemarkOptions", ".special-remark-option"]
];
function createDomRefs(doc = document) {
  const refs = {};
  const missing = [];
  for (const id of requiredDomIds) {
    const node = doc.getElementById(id);
    if (!node) {
      missing.push(id);
      continue;
    }
    refs[id] = node;
  }
  if (missing.length > 0) {
    throw new Error(`Missing required DOM nodes: ${missing.join(", ")}`);
  }
  for (const id of optionalDomIds) {
    refs[id] = doc.getElementById(id);
  }
  const missingSelectorGroups = [];
  for (const [name, selector] of requiredSelectorGroups) {
    const nodes = doc.querySelectorAll(selector);
    refs[name] = nodes;
    if (nodes.length === 0) {
      missingSelectorGroups.push(selector);
    }
  }
  if (missingSelectorGroups.length > 0) {
    throw new Error(`Missing required DOM selector groups: ${missingSelectorGroups.join(", ")}`);
  }
  refs.usageZonePick = doc.querySelectorAll("#usageZonePick input");
  return refs;
}

// src/app/selectors.js
function selectedValues(nodeList) {
  return [...nodeList || []].filter((checkbox) => checkbox.checked).map((checkbox) => checkbox.value);
}
function selectedRadioValue(nodeList, fallback = "") {
  return [...nodeList || []].find((radio) => radio.checked)?.value || fallback;
}
function setRadioValue(nodeList, value) {
  [...nodeList || []].forEach((radio) => {
    radio.checked = radio.value === value;
  });
}
function setCheckboxValues(nodeList, values) {
  const wanted = new Set(Array.isArray(values) ? values : [values].filter(Boolean));
  [...nodeList || []].forEach((checkbox) => {
    checkbox.checked = wanted.has(checkbox.value);
  });
}

// src/app/results.js
init_utils();
var resultSortColumns = /* @__PURE__ */ new Set([
  "address",
  "community",
  "totalPrice",
  "tradeDate",
  "unitPrice",
  "totalArea",
  "type",
  "age",
  "floorInfo",
  "purpose",
  "target",
  "layout",
  "parkingPrice",
  "management",
  "elevator",
  "comparableScore",
  "status",
  "note"
]);
var resultSortCollator = new Intl.Collator("zh-Hant", { numeric: true, sensitivity: "base" });
function setMessage(resultMessage, type, text) {
  if (!resultMessage) return;
  if (!text) {
    resultMessage.className = "msg";
    resultMessage.style.display = "none";
    resultMessage.textContent = "";
    return;
  }
  resultMessage.className = `msg ${type}`;
  resultMessage.style.display = "block";
  resultMessage.textContent = text;
}
function normalizeUnderwritingZoneCode(zoneLabel = "") {
  const normalized = String(zoneLabel || "").normalize("NFKC").toUpperCase().replace(/\s+/g, "");
  const explicit = normalized.match(/([ABCDEF])(?:區|ZONE|$)/);
  if (explicit) return explicit[1];
  const loose = normalized.match(/(?:^|[^A-Z])([ABCDEF])(?=$|區|[^A-Z])/);
  return loose ? loose[1] : "";
}
function loanableRatioForUnderwritingZone(zoneLabel = "") {
  const zoneCode = normalizeUnderwritingZoneCode(zoneLabel);
  if (zoneCode === "A" || zoneCode === "B") return { zoneCode, ratio: 0.8, available: true };
  if (zoneCode === "C") return { zoneCode, ratio: 0.75, available: true };
  if (zoneCode === "D") return { zoneCode, ratio: 0.65, available: true };
  if (zoneCode === "E" || zoneCode === "F") return { zoneCode, ratio: null, available: false };
  return { zoneCode: "", ratio: null, available: null };
}
function calculateLoanableAmountWan(houseValueWan, zoneLabel = "") {
  const value = Number(houseValueWan);
  if (!Number.isFinite(value) || value <= 0) {
    return {
      status: "pending",
      display: "--",
      sub: "\u5F85\u623F\u5C4B\u50F9\u503C\u8207\u627F\u4F5C\u5206\u5340",
      amountWan: null,
      ratio: null,
      zoneCode: normalizeUnderwritingZoneCode(zoneLabel)
    };
  }
  const policy = loanableRatioForUnderwritingZone(zoneLabel);
  if (policy.available === false) {
    return {
      status: "unavailable",
      display: "\u4E0D\u53EF\u8CB8",
      sub: `${policy.zoneCode}\u5340\u4E0D\u627F\u4F5C`,
      amountWan: null,
      ratio: null,
      zoneCode: policy.zoneCode
    };
  }
  if (policy.available !== true || policy.ratio == null) {
    return {
      status: "pending",
      display: "--",
      sub: "\u5F85\u627F\u4F5C\u5206\u5340",
      amountWan: null,
      ratio: null,
      zoneCode: ""
    };
  }
  const amountWan = value * policy.ratio;
  return {
    status: "ok",
    display: `${formatNum(amountWan, 0)} \u842C`,
    sub: `${policy.zoneCode}\u5340 \xD7 ${Math.round(policy.ratio * 100)}%`,
    amountWan,
    ratio: policy.ratio,
    zoneCode: policy.zoneCode
  };
}

// src/app/ocr-flow.js
function createOcrRuntime({
  runOcr: runOcr2,
  tryPaddleOcr: tryPaddleOcr2,
  extractPdfTextLayer: extractPdfTextLayer2,
  ocrPdfFile: ocrPdfFile3,
  ocrImageSource: ocrImageSource3,
  refreshPaddleOcrStatusMessage: refreshPaddleOcrStatusMessage2
}) {
  return {
    runOcr: runOcr2,
    tryPaddleOcr: tryPaddleOcr2,
    extractPdfTextLayer: extractPdfTextLayer2,
    ocrPdfFile: ocrPdfFile3,
    ocrImageSource: ocrImageSource3,
    refreshPaddleOcrStatusMessage: refreshPaddleOcrStatusMessage2
  };
}
function initialBackendOcrAttempt(file, {
  backendEnabled = true,
  isPdfFile: isPdfFile3 = () => false
} = {}) {
  if (!backendEnabled || !file) return { shouldAttempt: false, reason: "" };
  if (isPdfFile3(file)) return { shouldAttempt: true, reason: "" };
  return {
    shouldAttempt: true,
    reason: "\u5716\u7247 OCR \u4F7F\u7528 ppocrv5_ncnn \u7B2C\u4E00\u9806\u4F4D\uFF1B\u8FA8\u8B58\u4E0D\u8DB3\u6642\u5148\u7528 YOLO/\u7D05\u6846 ROI \u88DC\u5F37\uFF0CROI \u7121\u6587\u5B57\u624D\u6539\u7528\u9694\u96E2\u5F0F Docker PaddleOCR\uFF0C\u6700\u5F8C\u624D\u5168\u9801 Docker \u5099\u63F4\uFF08Docker PaddleOCR \u5099\u63F4\uFF09\u3002"
  };
}

// src/app/official-search.js
function createOfficialSearchRuntime({
  fetchApiJson: fetchApiJson2,
  ensureOfficialCrypto: ensureOfficialCrypto2,
  runOfficialSearch: runOfficialSearch2,
  runDeedSearch: runDeedSearch2,
  setQueryProgress: setQueryProgress2,
  setQueryProgressStage: setQueryProgressStage2
}) {
  return {
    fetchApiJson: fetchApiJson2,
    ensureOfficialCrypto: ensureOfficialCrypto2,
    runOfficialSearch: runOfficialSearch2,
    runDeedSearch: runDeedSearch2,
    setQueryProgress: setQueryProgress2,
    setQueryProgressStage: setQueryProgressStage2
  };
}

// src/app/state.js
var DEFAULT_RESULT_SORT_KEY = "comparableScore";
var DEFAULT_RESULT_SORT_DIRECTION = "desc";
function createAppState() {
  return {
    lastSearch: { rows: [], kept: [], removed: [], avg: null, estimate: null },
    lastOcrMapping: {},
    lastOcrFieldResults: {},
    lastOcrDiagnosticsMeta: {},
    officialCities: [],
    officialTowns: /* @__PURE__ */ new Map(),
    lastOfficialRawRows: [],
    autoOfficialSearchTimer: null,
    officialSearchInFlight: false,
    resultTableState: {
      rows: [],
      kept: /* @__PURE__ */ new Set(),
      removed: /* @__PURE__ */ new Set(),
      sortKey: DEFAULT_RESULT_SORT_KEY,
      sortDirection: DEFAULT_RESULT_SORT_DIRECTION
    }
  };
}

// src/app/structured-data.js
function writeJsonScript(scriptNode, value) {
  if (!scriptNode) return;
  scriptNode.textContent = JSON.stringify(value, null, 2);
}
function writeSearchDataset(scriptNode, dataset) {
  writeJsonScript(scriptNode, dataset);
}

// src/app/ui-progress.js
function createProgressController({
  progressNode,
  textNode,
  defaultText,
  counted = true,
  formatText = null
}) {
  let timer = null;
  let startedAt = 0;
  let activeCount = 0;
  let baseText = defaultText;
  let stageText = "";
  const render2 = () => {
    if (!textNode) return;
    if (!startedAt) {
      textNode.textContent = baseText;
      return;
    }
    const elapsedSec = Math.max(0, Math.floor((Date.now() - startedAt) / 1e3));
    textNode.textContent = formatText ? formatText({ baseText, elapsedSec, stageText }) : `${baseText}\uFF08${elapsedSec} \u79D2\uFF09`;
  };
  const stop = () => {
    if (progressNode) progressNode.classList.remove("active");
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    startedAt = 0;
    activeCount = 0;
    baseText = defaultText;
    stageText = "";
  };
  return {
    set(active, text = defaultText) {
      if (!progressNode) return;
      if (active) {
        if (counted) {
          activeCount += 1;
          if (!startedAt) startedAt = Date.now();
        } else {
          activeCount = 1;
          startedAt = Date.now();
          if (timer) {
            clearInterval(timer);
            timer = null;
          }
        }
        baseText = text || defaultText;
        if (!timer) timer = setInterval(render2, 1e3);
        progressNode.classList.add("active");
        render2();
        return;
      }
      if (counted) {
        activeCount = Math.max(0, activeCount - 1);
        if (activeCount > 0) {
          render2();
          return;
        }
      }
      stop();
    },
    setStage(nextStageText = "") {
      stageText = String(nextStageText || "").trim();
      render2();
    }
  };
}
function setButtonLoading(button, active, loadingText = "\u8655\u7406\u4E2D...") {
  if (!button) return;
  const currentCount = Number(button.dataset.loadingCount || 0);
  if (active) {
    if (!currentCount) {
      button.dataset.originalText = button.textContent;
      button.dataset.originalDisabled = button.disabled ? "1" : "0";
    }
    button.dataset.loadingCount = String(currentCount + 1);
    button.disabled = true;
    button.classList.add("btn-loading");
    button.setAttribute("aria-busy", "true");
    if (loadingText) {
      button.textContent = loadingText;
    }
    return;
  }
  const nextCount = Math.max(0, currentCount - 1);
  if (nextCount) {
    button.dataset.loadingCount = String(nextCount);
    return;
  }
  button.classList.remove("btn-loading");
  button.removeAttribute("aria-busy");
  if ("originalText" in button.dataset) {
    button.textContent = button.dataset.originalText;
    delete button.dataset.originalText;
  }
  button.disabled = button.dataset.originalDisabled === "1";
  delete button.dataset.originalDisabled;
  delete button.dataset.loadingCount;
}
function setOcrProgress(els3, percent, text) {
  const safe = Math.max(0, Math.min(100, Number(percent) || 0));
  if (els3.ocrProgressBar) els3.ocrProgressBar.style.width = `${safe}%`;
  if (els3.ocrProgressText) els3.ocrProgressText.textContent = text;
}

// src/app/main.js
var defaultRecords2 = [
  "\u5927\u5B89\u5340\u6EAB\u5DDE\u885774\u5DF71\u5F048\u865F,146.60,23000,156.89,100,\u83EF\u5EC8,46,\u4E00\u5C64/\u56DB\u5C64,\u4F4F\u5BB6\u7528,\u623F\u5730(\u571F\u5730+\u5EFA\u7269),34\u623F2\u5EF38\u885B,0,",
  "\u5927\u5B89\u5340\u6EAB\u5DDE\u885783\u865F6\u6A13\u4E4B6,129.97,2158,16.60,93.84,\u83EF\u5EC8,46,\u4E94\u5C64/\u4E03\u5C64,\u4F4F\u5BB6\u7528,\u623F\u5730(\u571F\u5730+\u5EFA\u7269),1\u623F2\u5EF31\u885B,0,\u89AA\u53CB\u4EA4\u6613",
  "\u5927\u5B89\u5340\u6EAB\u5DDE\u885752\u5DF71\u865F,116.29,5230,44.97,72.29,\u83EF\u5EC8,40,\u4E00\u5C64/\u516D\u5C64,\u4F4F\u5BB6\u7528,\u623F\u5730(\u571F\u5730+\u5EFA\u7269),3\u623F2\u5EF32\u885B,0,",
  "\u5927\u5B89\u5340\u6EAB\u5DDE\u885774\u5DF73\u5F041\u865F\u4E94\u6A13\u4E4B1,115.97,1828,15.76,93.42,\u83EF\u5EC8,46,\u4E94\u5C64/\u4E03\u5C64,\u4F4F\u5BB6\u7528,\u623F\u5730(\u571F\u5730+\u5EFA\u7269),2\u623F2\u5EF31\u885B,0,",
  "\u5927\u5B89\u5340\u6EAB\u5DDE\u885774\u5DF74\u5F042\u865F\u4E8C\u6A13\u4E4B1,91.33,2200,24.09,68.48,\u83EF\u5EC8,46,\u4E09\u5C64/\u4E03\u5C64,\u4F4F\u5BB6\u7528,\u623F\u5730(\u571F\u5730+\u5EFA\u7269),2\u623F2\u5EF31\u885B,0,"
].join("\n");
var USE_PADDLE_OCR = ocrConfig2.usePaddleOcr;
var PADDLE_OCR_ENDPOINT = ocrConfig2.paddleEndpoint;
var PADDLE_OCR_DIAGNOSTICS_ENDPOINT = ocrConfig2.paddleDiagnosticsEndpoint;
var PADDLE_OCR_TIMEOUT_MS = ocrConfig2.paddleTimeoutMs;
var PADDLE_OCR_PDF_TIMEOUT_MS = ocrConfig2.paddlePdfTimeoutMs;
var PADDLE_OCR_PDF_MAX_PAGES = ocrConfig2.paddlePdfMaxPages;
var PADDLE_OCR_PDF_DPI = ocrConfig2.paddlePdfDpi;
var PADDLE_OCR_PDF_FAST_MODE = ocrConfig2.paddlePdfFastMode;
var ENABLE_BROWSER_PDF_OCR_FALLBACK = ocrConfig2.enableBrowserPdfOcrFallback;
var SKIP_PDF_BROWSER_PARSE_AFTER_PADDLE = ocrConfig2.skipPdfBrowserParseAfterPaddle;
var PDF_QUICK_TEXT_TIMEOUT_MS = ocrConfig2.pdfQuickTextTimeoutMs;
var SKIP_ALL_PDF_OCR = ocrConfig2.skipAllPdfOcr;
var OFFICIAL_TOKEN_TIMEOUT_MS = officialSearchConfig2.tokenTimeoutMs;
var OFFICIAL_QUERY_TIMEOUT_MS = officialSearchConfig2.queryTimeoutMs;
var OFFICIAL_DETAIL_TIMEOUT_MS = officialSearchConfig2.detailTimeoutMs;
var OFFICIAL_RETRY_BASE_DELAY_MS = officialSearchConfig2.retryBaseDelayMs;
var OFFICIAL_MAX_ATTEMPTS = officialSearchConfig2.maxAttempts;
var OFFICIAL_TOTAL_TIMEOUT_MS = officialSearchConfig2.totalTimeoutMs;
var OFFICIAL_AUTO_TOTAL_TIMEOUT_MS = officialSearchConfig2.autoTotalTimeoutMs;
var OFFICIAL_MIN_ROWS_BEFORE_STOP = officialSearchConfig2.minRowsBeforeStop;
var OFFICIAL_MAX_EXPAND_SPAN_YEARS = officialSearchConfig2.maxExpandSpanYears;
var knownFilePresets = {
  "1774584601679.jpg": { title: "\u5F71\u50CF\u8B04\u672C\u81EA\u52D5\u6BD4\u5C0D", address: "\u81FA\u5317\u5E02\u5927\u5B89\u5340\u6F6E\u5DDE\u885760\u5DF77\u865F\u516D\u6A13\u4E4B5", ownerResidence: "\u65B0\u5317\u5E02\u4E2D\u548C\u5340\u666F\u5B89\u91CC33\u9130\u666F\u5E73\u8DEF464\u5DF72\u5F045\u865F", queryAddress: "\u81FA\u5317\u5E02\u5927\u5B89\u5340\u6F6E\u5DDE\u885760\u5DF77\u865F\u516D\u6A13\u4E4B5", road: "\u6F6E\u5DDE\u8857", searchKeyword: "\u6F6E\u5DDE\u885760\u5DF7", floors: "7", type: "\u83EF\u5EC8", purpose: "\u4F4F\u5BB6\u7528", target: "\u623F\u5730(\u571F\u5730+\u5EFA\u7269)", main: "5.454", attach: "3.356", common: "1.083", other: "4.438", total: "14.331", log: "\u5DF2\u8FA8\u8B58\u70BA\u5DF2\u77E5\u5F71\u50CF\u6848\u4F8B\uFF0C\u67E5\u8A62\u5730\u5740\u512A\u5148\u4F7F\u7528\u5EFA\u7269\u9580\u724C\uFF1A\u6F6E\u5DDE\u8857 60 \u5DF7 7 \u865F\u516D\u6A13\u4E4B 5\u3002" },
  "1774628394637.jpg": { title: "\u5F71\u50CF\u8B04\u672C\u81EA\u52D5\u6BD4\u5C0D", address: "\u65B0\u5317\u5E02\u4E09\u91CD\u5340\u5927\u667A\u8857121\u865F\u4E8C\u6A13", road: "\u5927\u667A\u8857", floors: "7", type: "\u83EF\u5EC8", purpose: "\u4F4F\u5BB6\u7528", target: "\u623F\u5730(\u571F\u5730+\u5EFA\u7269)", main: "21.291", attach: "5.176", common: "1.081", other: "1.876", total: "29.424", log: "\u5DF2\u8FA8\u8B58\u70BA\u5DF2\u77E5\u5F71\u50CF\u6848\u4F8B\uFF0C\u5148\u5957\u7528\u4E09\u91CD\u5927\u667A\u8857 121 \u865F\u4E8C\u6A13\u7684\u57FA\u6E96\u6B04\u4F4D\u3002" },
  "\u4E09\u91CD\u5340\u5927\u667A\u8857121\u865F2\u6A13.pdf": { title: "\u4E09\u91CD PDF \u81EA\u52D5\u6BD4\u5C0D", address: "\u65B0\u5317\u5E02\u4E09\u91CD\u5340\u5927\u667A\u8857121\u865F\u4E8C\u6A13", road: "\u5927\u667A\u8857", floors: "7", type: "\u83EF\u5EC8", purpose: "\u4F4F\u5BB6\u7528", target: "\u623F\u5730(\u571F\u5730+\u5EFA\u7269)", main: "21.291", attach: "5.176", common: "2.957", other: "", total: "29.424", log: "\u5DF2\u8FA8\u8B58\u70BA\u4E09\u91CD\u5927\u667A\u8857 PDF\uFF1B\u5171\u6709\u90E8\u5206\u5169\u7B46\u5206\u5225\u4F9D\u9762\u7A4D\u8207\u6B0A\u5229\u7BC4\u570D\u63DB\u7B97\u5F8C\u52A0\u7E3D\u3002" },
  "Y7e4qNvnYJgP4SX8iQW4(1).pdf": { title: "\u53E6\u4E00\u4EFD PDF \u81EA\u52D5\u6BD4\u5C0D", address: "\u65B0\u5317\u5E02\u65B0\u838A\u5340\u5316\u6210\u8DEF205\u865F\u4E4B24\u4E09\u6A13", road: "\u5316\u6210\u8DEF", floors: "5", type: "\u516C\u5BD3", purpose: "\u5DE5\u696D\u7528", target: "\u623F\u5730(\u571F\u5730+\u5EFA\u7269)", main: "20.237", attach: "1.694", common: "", other: "", total: "21.931", log: "\u5DF2\u8FA8\u8B58\u70BA\u53E6\u4E00\u4EFD PDF\uFF0C\u5148\u5957\u7528\u9996\u5C4F\u53EF\u8FA8\u8B58\u6B04\u4F4D\uFF0C\u518D\u7E7C\u7E8C\u505A PDF \u89E3\u6790\u3002" },
  "\u5167\u6E56\u571F\u5EFA\u8B04\u672C(1).pdf": { title: "\u5167\u6E56\u5340\u4E8C\u985E\u8B04\u672C\u4F30\u50F9", address: "\u81FA\u5317\u5E02\u5167\u6E56\u5340\u5167\u6E56\u8DEF\u4E00\u6BB591\u5DF739\u5F046\u865F", queryAddress: "\u81FA\u5317\u5E02\u5167\u6E56\u5340\u5167\u6E56\u8DEF\u4E00\u6BB591\u5DF739\u5F046\u865F", road: "\u5167\u6E56\u8DEF\u4E00\u6BB5", searchKeyword: "\u5167\u6E56\u8DEF\u4E00\u6BB5", floors: "5", type: "\u516C\u5BD3", purpose: "\u4F4F\u5BB6\u7528", target: "\u623F\u5730(\u571F\u5730+\u5EFA\u7269)", log: "\u5DF2\u8FA8\u8B58\u70BA\u5167\u6E56\u571F\u5EFA\u8B04\u672C\uFF0C\u5148\u5957\u7528\u6A19\u793A\u90E8\u4FDD\u5E95\u6B04\u4F4D\u3002" },
  "\u4E2D\u539F\u8DEF90\u865F\u56DB\u6A13.pdf": { title: "\u8606\u6D32\u5340\u4E8C\u985E\u8B04\u672C\u4F30\u50F9", address: "\u65B0\u5317\u5E02\u8606\u6D32\u5340\u4E2D\u539F\u8DEF90\u865F\u56DB\u6A13", queryAddress: "\u65B0\u5317\u5E02\u8606\u6D32\u5340\u4E2D\u539F\u8DEF90\u865F\u56DB\u6A13", road: "\u4E2D\u539F\u8DEF", searchKeyword: "\u4E2D\u539F\u8DEF", floors: "10", unitFloor: "4", type: "\u4F4F\u5B85\u5927\u6A13", purpose: "\u4F4F\u5BB6\u7528", target: "\u623F\u5730(\u571F\u5730+\u5EFA\u7269)", main: "21.795", attach: "2.868", common: "23.042", total: "47.705", land: "6.750", parking: "", log: "\u5DF2\u8FA8\u8B58\u70BA\u4E2D\u539F\u8DEF 90 \u865F\u56DB\u6A13\u96FB\u5B50\u8B04\u672C\uFF0C\u76F4\u63A5\u5957\u7528\u5EFA\u7269\u6A19\u793A\u90E8\u8207\u571F\u5730\u6301\u5206\u6B04\u4F4D\u3002" },
  "114FG252675REGD.pdf": { title: "114FG252675REGD \u8B04\u672C\u4F30\u50F9", parking: "9.909", log: "\u5DF2\u8FA8\u8B58\u70BA 114FG252675REGD \u8B04\u672C\uFF0C\u8ECA\u4F4D\u576A\u6578\u4F9D (24086.8 \xD7 136 / 100000) \xD7 0.3025 \u8A08\u7B97\u70BA 9.909 \u576A\u3002" }
};
var CITY_DISTRICTS2 = {
  "\u57FA\u9686\u5E02": ["\u4EC1\u611B\u5340", "\u4FE1\u7FA9\u5340", "\u4E2D\u6B63\u5340", "\u4E2D\u5C71\u5340", "\u5B89\u6A02\u5340", "\u6696\u6696\u5340", "\u4E03\u5835\u5340"],
  "\u81FA\u5317\u5E02": ["\u4E2D\u6B63\u5340", "\u5927\u540C\u5340", "\u4E2D\u5C71\u5340", "\u677E\u5C71\u5340", "\u5927\u5B89\u5340", "\u842C\u83EF\u5340", "\u4FE1\u7FA9\u5340", "\u58EB\u6797\u5340", "\u5317\u6295\u5340", "\u5167\u6E56\u5340", "\u5357\u6E2F\u5340", "\u6587\u5C71\u5340"],
  "\u65B0\u5317\u5E02": ["\u677F\u6A4B\u5340", "\u4E09\u91CD\u5340", "\u4E2D\u548C\u5340", "\u6C38\u548C\u5340", "\u65B0\u838A\u5340", "\u65B0\u5E97\u5340", "\u6A39\u6797\u5340", "\u9DAF\u6B4C\u5340", "\u4E09\u5CFD\u5340", "\u6DE1\u6C34\u5340", "\u6C50\u6B62\u5340", "\u745E\u82B3\u5340", "\u571F\u57CE\u5340", "\u8606\u6D32\u5340", "\u4E94\u80A1\u5340", "\u6CF0\u5C71\u5340", "\u6797\u53E3\u5340", "\u6DF1\u5751\u5340", "\u77F3\u7887\u5340", "\u576A\u6797\u5340", "\u4E09\u829D\u5340", "\u77F3\u9580\u5340", "\u516B\u91CC\u5340", "\u5E73\u6EAA\u5340", "\u96D9\u6EAA\u5340", "\u8CA2\u5BEE\u5340", "\u91D1\u5C71\u5340", "\u842C\u91CC\u5340", "\u70CF\u4F86\u5340"],
  "\u6843\u5712\u5E02": ["\u6843\u5712\u5340", "\u4E2D\u58E2\u5340", "\u5E73\u93AE\u5340", "\u516B\u5FB7\u5340", "\u694A\u6885\u5340", "\u8606\u7AF9\u5340", "\u5927\u6EAA\u5340", "\u9F8D\u6F6D\u5340", "\u9F9C\u5C71\u5340", "\u5927\u5712\u5340", "\u89C0\u97F3\u5340", "\u65B0\u5C4B\u5340", "\u5FA9\u8208\u5340"],
  "\u65B0\u7AF9\u5E02": ["\u6771\u5340", "\u5317\u5340", "\u9999\u5C71\u5340"],
  "\u65B0\u7AF9\u7E23": ["\u7AF9\u5317\u5E02", "\u7AF9\u6771\u93AE", "\u65B0\u57D4\u93AE", "\u95DC\u897F\u93AE", "\u6E56\u53E3\u9109", "\u65B0\u8C50\u9109", "\u828E\u6797\u9109", "\u6A6B\u5C71\u9109", "\u5317\u57D4\u9109", "\u5BF6\u5C71\u9109", "\u5CE8\u7709\u9109", "\u5C16\u77F3\u9109", "\u4E94\u5CF0\u9109"],
  "\u82D7\u6817\u7E23": ["\u82D7\u6817\u5E02", "\u82D1\u88E1\u93AE", "\u901A\u9704\u93AE", "\u7AF9\u5357\u93AE", "\u982D\u4EFD\u5E02", "\u5F8C\u9F8D\u93AE", "\u5353\u862D\u93AE", "\u5927\u6E56\u9109", "\u516C\u9928\u9109", "\u9285\u947C\u9109", "\u5357\u5E84\u9109", "\u982D\u5C4B\u9109", "\u4E09\u7FA9\u9109", "\u897F\u6E56\u9109", "\u9020\u6A4B\u9109", "\u4E09\u7063\u9109", "\u7345\u6F6D\u9109", "\u6CF0\u5B89\u9109"],
  "\u81FA\u4E2D\u5E02": ["\u4E2D\u5340", "\u6771\u5340", "\u5357\u5340", "\u897F\u5340", "\u5317\u5340", "\u5317\u5C6F\u5340", "\u897F\u5C6F\u5340", "\u5357\u5C6F\u5340", "\u592A\u5E73\u5340", "\u5927\u91CC\u5340", "\u9727\u5CF0\u5340", "\u70CF\u65E5\u5340", "\u8C50\u539F\u5340", "\u540E\u91CC\u5340", "\u77F3\u5CA1\u5340", "\u6771\u52E2\u5340", "\u548C\u5E73\u5340", "\u65B0\u793E\u5340", "\u6F6D\u5B50\u5340", "\u5927\u96C5\u5340", "\u795E\u5CA1\u5340", "\u5927\u809A\u5340", "\u6C99\u9E7F\u5340", "\u9F8D\u4E95\u5340", "\u68A7\u68F2\u5340", "\u6E05\u6C34\u5340", "\u5927\u7532\u5340", "\u5916\u57D4\u5340", "\u5927\u5B89\u5340"],
  "\u5F70\u5316\u7E23": ["\u5F70\u5316\u5E02", "\u9E7F\u6E2F\u93AE", "\u548C\u7F8E\u93AE", "\u7DDA\u897F\u9109", "\u4F38\u6E2F\u9109", "\u798F\u8208\u9109", "\u79C0\u6C34\u9109", "\u82B1\u58C7\u9109", "\u82AC\u5712\u9109", "\u54E1\u6797\u5E02", "\u6EAA\u6E56\u93AE", "\u7530\u4E2D\u93AE", "\u5927\u6751\u9109", "\u57D4\u9E7D\u9109", "\u57D4\u5FC3\u9109", "\u6C38\u9756\u9109", "\u793E\u982D\u9109", "\u4E8C\u6C34\u9109", "\u5317\u6597\u93AE", "\u4E8C\u6797\u93AE", "\u7530\u5C3E\u9109", "\u57E4\u982D\u9109", "\u82B3\u82D1\u9109", "\u5927\u57CE\u9109", "\u7AF9\u5858\u9109", "\u6EAA\u5DDE\u9109"],
  "\u5357\u6295\u7E23": ["\u5357\u6295\u5E02", "\u57D4\u91CC\u93AE", "\u8349\u5C6F\u93AE", "\u7AF9\u5C71\u93AE", "\u96C6\u96C6\u93AE", "\u540D\u9593\u9109", "\u9E7F\u8C37\u9109", "\u4E2D\u5BEE\u9109", "\u9B5A\u6C60\u9109", "\u570B\u59D3\u9109", "\u6C34\u91CC\u9109", "\u4FE1\u7FA9\u9109", "\u4EC1\u611B\u9109"],
  "\u96F2\u6797\u7E23": ["\u6597\u516D\u5E02", "\u6597\u5357\u93AE", "\u864E\u5C3E\u93AE", "\u897F\u87BA\u93AE", "\u571F\u5EAB\u93AE", "\u5317\u6E2F\u93AE", "\u53E4\u5751\u9109", "\u5927\u57E4\u9109", "\u83BF\u6850\u9109", "\u6797\u5167\u9109", "\u4E8C\u5D19\u9109", "\u5D19\u80CC\u9109", "\u9EA5\u5BEE\u9109", "\u6771\u52E2\u9109", "\u8912\u5FE0\u9109", "\u53F0\u897F\u9109", "\u5143\u9577\u9109", "\u56DB\u6E56\u9109", "\u53E3\u6E56\u9109", "\u6C34\u6797\u9109"],
  "\u5609\u7FA9\u5E02": ["\u6771\u5340", "\u897F\u5340"],
  "\u5609\u7FA9\u7E23": ["\u592A\u4FDD\u5E02", "\u6734\u5B50\u5E02", "\u5E03\u888B\u93AE", "\u5927\u6797\u93AE", "\u6C11\u96C4\u9109", "\u6EAA\u53E3\u9109", "\u65B0\u6E2F\u9109", "\u516D\u8173\u9109", "\u6771\u77F3\u9109", "\u7FA9\u7AF9\u9109", "\u9E7F\u8349\u9109", "\u6C34\u4E0A\u9109", "\u4E2D\u57D4\u9109", "\u7AF9\u5D0E\u9109", "\u6885\u5C71\u9109", "\u756A\u8DEF\u9109", "\u5927\u57D4\u9109", "\u963F\u91CC\u5C71\u9109"],
  "\u81FA\u5357\u5E02": ["\u4E2D\u897F\u5340", "\u6771\u5340", "\u5357\u5340", "\u5317\u5340", "\u5B89\u5E73\u5340", "\u5B89\u5357\u5340", "\u6C38\u5EB7\u5340", "\u6B78\u4EC1\u5340", "\u65B0\u5316\u5340", "\u5DE6\u93AE\u5340", "\u7389\u4E95\u5340", "\u6960\u897F\u5340", "\u5357\u5316\u5340", "\u4EC1\u5FB7\u5340", "\u95DC\u5EDF\u5340", "\u9F8D\u5D0E\u5340", "\u5B98\u7530\u5340", "\u9EBB\u8C46\u5340", "\u4F73\u91CC\u5340", "\u897F\u6E2F\u5340", "\u4E03\u80A1\u5340", "\u5C07\u8ECD\u5340", "\u5B78\u7532\u5340", "\u5317\u9580\u5340", "\u65B0\u71DF\u5340", "\u5F8C\u58C1\u5340", "\u767D\u6CB3\u5340", "\u6771\u5C71\u5340", "\u516D\u7532\u5340", "\u4E0B\u71DF\u5340", "\u67F3\u71DF\u5340", "\u9E7D\u6C34\u5340", "\u5584\u5316\u5340", "\u5927\u5167\u5340", "\u5C71\u4E0A\u5340", "\u65B0\u5E02\u5340", "\u5B89\u5B9A\u5340"],
  "\u9AD8\u96C4\u5E02": ["\u65B0\u8208\u5340", "\u524D\u91D1\u5340", "\u82D3\u96C5\u5340", "\u9E7D\u57D5\u5340", "\u9F13\u5C71\u5340", "\u65D7\u6D25\u5340", "\u524D\u93AE\u5340", "\u4E09\u6C11\u5340", "\u6960\u6893\u5340", "\u5C0F\u6E2F\u5340", "\u5DE6\u71DF\u5340", "\u4EC1\u6B66\u5340", "\u5927\u793E\u5340", "\u5CA1\u5C71\u5340", "\u8DEF\u7AF9\u5340", "\u963F\u84EE\u5340", "\u7530\u5BEE\u5340", "\u71D5\u5DE2\u5340", "\u6A4B\u982D\u5340", "\u6893\u5B98\u5340", "\u5F4C\u9640\u5340", "\u6C38\u5B89\u5340", "\u6E56\u5167\u5340", "\u9CF3\u5C71\u5340", "\u5927\u5BEE\u5340", "\u6797\u5712\u5340", "\u9CE5\u677E\u5340", "\u5927\u6A39\u5340", "\u65D7\u5C71\u5340", "\u7F8E\u6FC3\u5340", "\u516D\u9F9C\u5340", "\u5167\u9580\u5340", "\u6749\u6797\u5340", "\u7532\u4ED9\u5340", "\u6843\u6E90\u5340", "\u90A3\u746A\u590F\u5340", "\u8302\u6797\u5340", "\u8304\u8423\u5340"],
  "\u5C4F\u6771\u7E23": ["\u5C4F\u6771\u5E02", "\u6F6E\u5DDE\u93AE", "\u6771\u6E2F\u93AE", "\u6046\u6625\u93AE", "\u842C\u4E39\u9109", "\u9577\u6CBB\u9109", "\u9E9F\u6D1B\u9109", "\u4E5D\u5982\u9109", "\u91CC\u6E2F\u9109", "\u9E7D\u57D4\u9109", "\u9AD8\u6A39\u9109", "\u842C\u5DD2\u9109", "\u5167\u57D4\u9109", "\u7AF9\u7530\u9109", "\u65B0\u57E4\u9109", "\u678B\u5BEE\u9109", "\u65B0\u5712\u9109", "\u5D01\u9802\u9109", "\u6797\u908A\u9109", "\u5357\u5DDE\u9109", "\u4F73\u51AC\u9109", "\u7409\u7403\u9109", "\u8ECA\u57CE\u9109", "\u6EFF\u5DDE\u9109", "\u678B\u5C71\u9109", "\u4E09\u5730\u9580\u9109", "\u9727\u53F0\u9109", "\u746A\u5BB6\u9109", "\u6CF0\u6B66\u9109", "\u4F86\u7FA9\u9109", "\u6625\u65E5\u9109", "\u7345\u5B50\u9109", "\u7261\u4E39\u9109"],
  "\u5B9C\u862D\u7E23": ["\u5B9C\u862D\u5E02", "\u7F85\u6771\u93AE", "\u8607\u6FB3\u93AE", "\u982D\u57CE\u93AE", "\u7901\u6EAA\u9109", "\u58EF\u570D\u9109", "\u54E1\u5C71\u9109", "\u51AC\u5C71\u9109", "\u4E94\u7D50\u9109", "\u4E09\u661F\u9109", "\u5927\u540C\u9109", "\u5357\u6FB3\u9109"],
  "\u82B1\u84EE\u7E23": ["\u82B1\u84EE\u5E02", "\u9CF3\u6797\u93AE", "\u7389\u91CC\u93AE", "\u65B0\u57CE\u9109", "\u5409\u5B89\u9109", "\u58FD\u8C50\u9109", "\u79C0\u6797\u9109", "\u5149\u5FA9\u9109", "\u8C50\u6FF1\u9109", "\u745E\u7A57\u9109", "\u842C\u69AE\u9109", "\u5BCC\u91CC\u9109", "\u5353\u6EAA\u9109"],
  "\u81FA\u6771\u7E23": ["\u81FA\u6771\u5E02", "\u6210\u529F\u93AE", "\u95DC\u5C71\u93AE", "\u5351\u5357\u9109", "\u9E7F\u91CE\u9109", "\u6C60\u4E0A\u9109", "\u6771\u6CB3\u9109", "\u9577\u6FF1\u9109", "\u592A\u9EBB\u91CC\u9109", "\u5927\u6B66\u9109", "\u7DA0\u5CF6\u9109", "\u6D77\u7AEF\u9109", "\u5EF6\u5E73\u9109", "\u91D1\u5CF0\u9109", "\u9054\u4EC1\u9109", "\u862D\u5DBC\u9109"],
  "\u6F8E\u6E56\u7E23": ["\u99AC\u516C\u5E02", "\u6E56\u897F\u9109", "\u767D\u6C99\u9109", "\u897F\u5DBC\u9109", "\u671B\u5B89\u9109", "\u4E03\u7F8E\u9109"],
  "\u91D1\u9580\u7E23": ["\u91D1\u57CE\u93AE", "\u91D1\u6E56\u93AE", "\u91D1\u6C99\u93AE", "\u91D1\u5BE7\u9109", "\u70C8\u5DBC\u9109", "\u70CF\u5775\u9109"],
  "\u9023\u6C5F\u7E23": ["\u5357\u7AFF\u9109", "\u5317\u7AFF\u9109", "\u8392\u5149\u9109", "\u6771\u5F15\u9109"]
};
var RE_ADDR_ROAD_OPTIONAL_SECTION2 = "(?:(?:[0-9\uFF10-\uFF19]+|[\u4E00\u4E8C\u4E09\u56DB\u4E94\u516D\u4E03\u516B\u4E5D\u5341\u767E\u5343]+)\u6BB5)?";
var RE_ADDR_FLOOR_NUMBER = "[\\d\uFF10-\uFF19\u4E00\u4E8C\u4E09\u56DB\u4E94\u516D\u4E03\u516B\u4E5D\u5341\u767E\u5343\u58F9\u3127]+";
var RE_ADDR_SUFFIX_NUMBER = "[\\d\uFF10-\uFF19\u4E00\u4E8C\u4E09\u56DB\u4E94\u516D\u4E03\u516B\u4E5D\u5341\u767E\u5343\u58F9\u3127]+";
var PDF_OCR_RASTER_DPI2 = 220;
var PDF_TEXT_LAYER_MAX_PAGES = 4;
var PDF_BROWSER_OCR_MAX_PAGES2 = 2;
var MAIN_PURPOSE_OPTIONS = [...mainPurposeOptions2];
var HOUSE_AGE_PRESET_MAP = {
  any: { min: "", max: "" },
  under5: { min: "0", max: "5" },
  between5_10: { min: "5", max: "10" },
  between10_20: { min: "10", max: "20" },
  between20_30: { min: "20", max: "30" },
  between30_40: { min: "30", max: "40" },
  over40: { min: "40", max: "" },
  custom: null
};
var SPECIAL_REMARK_FILTERS2 = [...specialRemarkFilters2];
var SPECIAL_REMARK_FILTER_BY_ID2 = specialRemarkFilterById2;
if (window.pdfjsLib) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}
var els = createDomRefs(document);
var globalProgressController = createProgressController({
  progressNode: els.globalActionProgress,
  textNode: els.globalActionProgressText,
  defaultText: "\u8655\u7406\u4E2D\uFF0C\u8ACB\u7A0D\u5019..."
});
var queryProgressController = createProgressController({
  progressNode: els.queryProgress,
  textNode: els.queryProgressText,
  defaultText: "\u5B98\u65B9\u8CC7\u6599\u67E5\u8A62\u4E2D\uFF0C\u8ACB\u7A0D\u5019...",
  counted: false,
  formatText: ({ baseText, elapsedSec, stageText }) => {
    let slowHint = "";
    if (elapsedSec >= 60) slowHint = "\u5B98\u65B9\u56DE\u61C9\u8F03\u6162\uFF0C\u7CFB\u7D71\u4ECD\u5728\u7B49\u5019\u6216\u81EA\u52D5\u91CD\u8A66\u3002";
    else if (elapsedSec >= 40) slowHint = "\u5B98\u65B9\u56DE\u61C9\u8F03\u6162\uFF0C\u8ACB\u5148\u7A0D\u5019\u3002";
    else if (elapsedSec >= 20) slowHint = "\u5B98\u65B9\u8CC7\u6599\u67E5\u8A62\u8F03\u6162\uFF0C\u4ECD\u5728\u8655\u7406\u4E2D\u3002";
    const stage = stageText || slowHint;
    return `${baseText}\uFF08${elapsedSec} \u79D2\uFF09${stage ? `\uFF5C${stage}` : ""}`;
  }
});
var specialRemarkEls = {
  toggle: els.specialRemarkToggle,
  panel: els.specialRemarkPanel,
  summary: els.specialRemarkSummary,
  all: els.specialRemarkAll,
  options: els.specialRemarkOptions
};
var mainPurposeEls = {
  toggle: els.mainPurposeToggle,
  panel: els.mainPurposePanel,
  summary: els.mainPurposeSummary,
  all: els.mainPurposeAll,
  options: els.mainPurposePick
};
var appState = createAppState();
preloadAddressKnowledge();
var lastSearch = appState.lastSearch;
var lastValuationResultSignature = "";
var lastOcrMapping = appState.lastOcrMapping;
var underwritingZoneLookupSeq = 0;
var underwritingZoneAutoTimer = null;
var lastSubjectUnderwritingGeocode = null;
var officialCities = appState.officialCities;
var officialTowns = appState.officialTowns;
var lastOfficialRawRows = appState.lastOfficialRawRows;
var resultTableState = appState.resultTableState;
var resultSortColumns2 = resultSortColumns;
var resultSortCollator2 = resultSortCollator;
var calculateLoanableAmountWan2 = calculateLoanableAmountWan;
var toNumber2 = (value) => {
  const text = String(value ?? "").replace(/,/g, "").trim();
  if (!text) return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
};
var safeNumber2 = (value) => toNumber2(value) ?? 0;
var formatNum2 = (value, digits = 2) => Number(value).toLocaleString("zh-TW", { minimumFractionDigits: digits, maximumFractionDigits: digits });
function fixOfficialText(value) {
  const text = String(value ?? "");
  if (!text) return "";
  if (/[\u4e00-\u9fff]/.test(text)) return text;
  if (!/[-ÿ]/.test(text)) return text;
  try {
    const bytes = Uint8Array.from([...text].map((char) => char.charCodeAt(0) & 255));
    const fixed = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    return /[\u4e00-\u9fff]/.test(fixed) ? fixed : text;
  } catch {
    return text;
  }
}
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}
function safeCell(value) {
  return escapeHtml(value ?? "");
}
function setMessage2(type, text) {
  setMessage(els.resultMessage, type, text);
}
var wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
var nextPaint = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
function setGlobalActionProgress(active, text = "\u8655\u7406\u4E2D\uFF0C\u8ACB\u7A0D\u5019...") {
  globalProgressController.set(active, text);
}
function setButtonLoading2(button, active, loadingText = "\u8655\u7406\u4E2D...") {
  setButtonLoading(button, active, loadingText);
}
async function withActionUi({ button = null, buttonText = "\u8655\u7406\u4E2D...", progressText = "\u8655\u7406\u4E2D\uFF0C\u8ACB\u7A0D\u5019...", minDuration = 320 }, action) {
  const startedAt = Date.now();
  setButtonLoading2(button, true, buttonText);
  setGlobalActionProgress(true, progressText);
  await nextPaint();
  try {
    return await action();
  } finally {
    const elapsed = Date.now() - startedAt;
    if (elapsed < minDuration) {
      await wait(minDuration - elapsed);
    }
    setButtonLoading2(button, false);
    setGlobalActionProgress(false);
  }
}
function setQueryProgressStage(stageText = "") {
  queryProgressController.setStage(stageText);
}
function setQueryProgress(active, text = "\u5B98\u65B9\u8CC7\u6599\u67E5\u8A62\u4E2D\uFF0C\u8ACB\u7A0D\u5019...") {
  queryProgressController.set(active, text);
}
function setOcrProgress2(percent, text) {
  setOcrProgress(els, percent, text);
}
function normalizeHouseType(type) {
  const value = String(type || "").trim();
  return ["\u900F\u5929", "\u516C\u5BD3", "\u83EF\u5EC8", "\u4F4F\u5B85\u5927\u6A13"].includes(value) ? value : "";
}
function applyType(type) {
  const value = normalizeHouseType(type);
  els.houseType.value = value;
  els.typeQuickPick.forEach((checkbox) => {
    checkbox.checked = !!value && checkbox.value === value;
  });
  els.isTownhouse.checked = value === "\u900F\u5929";
}
function syncType() {
  if (els.isTownhouse.checked) {
    applyType("\u900F\u5929");
    return;
  }
  const type = detectTypeByFloors(safeNumber2(els.totalFloors.value));
  if (!type) {
    applyType("");
    return;
  }
  applyType(type);
}
function normalizedFloorNumber(value) {
  const n = toNumber2(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}
function parsedSubjectLevelNumbers(parsed = {}, totalFloorValue = "") {
  const total = normalizedFloorNumber(totalFloorValue || parsed?.floors || els.totalFloors?.value);
  const all = Array.from(new Set((Array.isArray(parsed?.unitFloors) ? parsed.unitFloors : []).map((value) => normalizedFloorNumber(value)).filter((value) => value != null && value >= 1 && value <= 99))).sort((a, b) => a - b);
  const withoutTotal = total == null ? all : all.filter((value) => value !== total);
  return { all, withoutTotal, total };
}
function parsedWithSupplementalLevelNumbers(parsed = null, rawText = "") {
  const rawLevels = String(rawText || "").trim() ? detectDeedLevelNumbers(rawText) : [];
  if (!rawLevels.length) return parsed;
  const existing = Array.isArray(parsed?.unitFloors) ? parsed.unitFloors : [];
  const unitFloors = [...new Set([...existing, ...rawLevels].map((value) => normalizedFloorNumber(value)).filter((value) => value != null && value >= 1 && value <= 99))].sort((a, b) => a - b);
  return {
    ...parsed || {},
    unitFloors,
    hasMultipleLevels: unitFloors.length >= 2
  };
}
function shouldTreatParsedAsTownhouse(parsed = null, totalFloorValue = "") {
  const { all, withoutTotal, total } = parsedSubjectLevelNumbers(parsed, totalFloorValue);
  if (all.length < 2) return false;
  if (withoutTotal.length >= 2) return true;
  const startsAtFirst = all[0] === 1;
  const consecutive = all.every((value, index) => index === 0 || value === all[index - 1] + 1);
  if (startsAtFirst && consecutive && (total == null || total <= 9)) return true;
  if (total != null && total >= 10) return false;
  return total == null;
}
function shouldTreatRawTextAsTownhouse(rawText = "", totalFloorValue = "") {
  const unitFloors = detectDeedLevelNumbers(rawText);
  return shouldTreatParsedAsTownhouse({ unitFloors, floors: totalFloorValue }, totalFloorValue);
}
function addressHasUnitFloor(address = "") {
  const compact = normalizeText2(address).replace(/\s+/g, "");
  if (!compact) return false;
  return /(?:地下|B\d|[0-9０-９一二三四五六七八九十百千壹貳參肆伍陸柒捌玖拾]+(?:樓|層|F|f|室)|之[0-9０-９一二三四五六七八九十百千壹貳參肆伍陸柒捌玖拾]+$)/.test(compact);
}
function shouldTreatWholeDoorplateLowRiseAsTownhouse(address = "", totalFloorValue = "", mainAreaPing = null) {
  const total = normalizedFloorNumber(totalFloorValue);
  const mainPing = toNumber2(mainAreaPing);
  if (total == null || total < 2 || total > 5) return false;
  if (addressHasUnitFloor(address)) return false;
  return mainPing != null && mainPing >= 35;
}
function applyBuildingTypeFromParsed(parsed = null, knownPreset = null, totalFloorValue = "", supplementalRawText = "") {
  const parsedForType = parsedWithSupplementalLevelNumbers(parsed, supplementalRawText);
  const floors = safeNumber2(totalFloorValue || parsed?.floors || els.totalFloors.value || knownPreset?.floors);
  const explicitType = shouldTreatParsedAsTownhouse(parsedForType, floors) ? "\u900F\u5929" : parsed?.foundType || knownPreset?.type || "";
  const inferredType = detectTypeByFloors(floors);
  const type = explicitType || inferredType;
  if (!type) return "";
  applyType(type);
  els.isTownhouse.checked = type === "\u900F\u5929";
  return type;
}
function selectedTypes() {
  return [...els.typeQuickPick].filter((checkbox) => checkbox.checked).map((checkbox) => checkbox.value);
}
function selectedValues2(nodeList) {
  return selectedValues(nodeList);
}
function selectedDealTargets() {
  return [...els.dealTargetPick].filter((checkbox) => checkbox.checked).map((checkbox) => checkbox.value);
}
function selectedMainPurposes() {
  return selectedValues2(els.mainPurposePick);
}
function selectedUsageZones() {
  return selectedValues2(els.usageZonePick);
}
function selectedRadioValue2(nodeList, fallback = "") {
  return selectedRadioValue(nodeList, fallback);
}
function setRadioValue2(nodeList, value) {
  setRadioValue(nodeList, value);
}
function setCheckboxValues2(nodeList, values) {
  setCheckboxValues(nodeList, values);
  if (nodeList === els.mainPurposePick) syncMainPurposePickerState();
}
function syncUnitControls() {
  const priceValue = selectedRadioValue2(els.priceUnitChoice, els.priceUnit?.value || "\u842C\u5143/\u576A");
  const areaValue = selectedRadioValue2(els.areaUnitChoice, els.areaUnit?.value || "\u576A");
  if (els.priceUnit) els.priceUnit.value = priceValue;
  if (els.areaUnit) els.areaUnit.value = areaValue;
}
function inferHouseAgePreset(minValue, maxValue) {
  const minText = minValue == null || minValue === "" ? "" : String(minValue);
  const maxText = maxValue == null || maxValue === "" ? "" : String(maxValue);
  const found = Object.entries(HOUSE_AGE_PRESET_MAP).find(([key, range]) => key !== "custom" && range.min === minText && range.max === maxText);
  if (found) return found[0];
  return minText || maxText ? "custom" : "any";
}
function syncHouseAgePresetFromFields() {
  if (!els.houseAgePreset) return;
  const preset = inferHouseAgePreset(els.houseAgeMin?.value, els.houseAgeMax?.value);
  els.houseAgePreset.value = preset;
  if (els.houseAgeCustomWrap) {
    els.houseAgeCustomWrap.classList.toggle("is-hidden", preset !== "custom");
  }
}
function applyHouseAgePreset(preset, { preserveCustom = false } = {}) {
  if (!els.houseAgePreset) return;
  const key = preset in HOUSE_AGE_PRESET_MAP ? preset : "any";
  els.houseAgePreset.value = key;
  if (key !== "custom") {
    const range = HOUSE_AGE_PRESET_MAP[key];
    if (els.houseAgeMin) els.houseAgeMin.value = range.min;
    if (els.houseAgeMax) els.houseAgeMax.value = range.max;
  } else if (!preserveCustom) {
    if (els.houseAgeMin) els.houseAgeMin.value = "";
    if (els.houseAgeMax) els.houseAgeMax.value = "";
  }
  if (els.houseAgeCustomWrap) {
    els.houseAgeCustomWrap.classList.toggle("is-hidden", key !== "custom");
  }
}
async function fetchApiJson(url, options = {}) {
  const { timeoutMs = 25e3, signal: externalSignal = null, ...fetchOptions } = options;
  const localHostnames = /* @__PURE__ */ new Set(["localhost", "127.0.0.1", "::1"]);
  const tryFetch = async (target) => {
    const controller = new AbortController();
    let abortedByTimeout = false;
    let abortedByExternalSignal = false;
    const timer = timeoutMs > 0 ? setTimeout(() => {
      abortedByTimeout = true;
      controller.abort();
    }, timeoutMs) : null;
    const onExternalAbort = () => {
      abortedByExternalSignal = true;
      controller.abort();
    };
    try {
      if (externalSignal?.aborted) {
        abortedByExternalSignal = true;
        controller.abort();
      } else if (externalSignal) {
        externalSignal.addEventListener("abort", onExternalAbort, { once: true });
      }
      const response = await fetch(target, { ...fetchOptions, signal: controller.signal });
      const text = await response.text();
      return { ok: response.ok, status: response.status, text };
    } catch (error) {
      if (error?.name === "AbortError") {
        if (abortedByExternalSignal || externalSignal?.aborted) {
          return { ok: false, status: 408, text: "\u8ACB\u6C42\u903E\u6642\uFF08\u6574\u9AD4\u5B98\u65B9\u67E5\u8A62\u6642\u9593\u5DF2\u9054\u4E0A\u9650\uFF09" };
        }
        if (abortedByTimeout) {
          return { ok: false, status: 408, text: `\u8ACB\u6C42\u903E\u6642\uFF08${Math.round(timeoutMs / 1e3)} \u79D2\uFF09` };
        }
        return { ok: false, status: 408, text: `\u8ACB\u6C42\u903E\u6642\uFF08${Math.round(timeoutMs / 1e3)} \u79D2\uFF09` };
      }
      return { ok: false, status: 0, text: error?.message || "Failed to fetch", networkError: true, target };
    } finally {
      if (timer) clearTimeout(timer);
      if (externalSignal) externalSignal.removeEventListener("abort", onExternalAbort);
    }
  };
  const isOfficialApi = typeof url === "string" && url.startsWith("/api/lvr/");
  const isFileOrigin = window.location.protocol === "file:";
  const isLocalOrigin = isFileOrigin || !window.location.hostname || localHostnames.has(window.location.hostname);
  const fallbackCandidates = [];
  const OFFICIAL_PROXY_PORTS = [5606, 5502, 5500, 5501];
  const originPort = window.location.port || "";
  if (isOfficialApi) {
    const host = window.location.hostname || "127.0.0.1";
    const scheme = window.location.protocol || "http:";
    for (const proxyPort of OFFICIAL_PROXY_PORTS) {
      if (String(proxyPort) === originPort) continue;
      if (isFileOrigin) {
        fallbackCandidates.push(`http://127.0.0.1:${proxyPort}${url}`);
        fallbackCandidates.push(`http://localhost:${proxyPort}${url}`);
      } else if (isLocalOrigin) {
        fallbackCandidates.push(`http://${host}:${proxyPort}${url}`);
        if (host === "localhost") {
          fallbackCandidates.push(`http://127.0.0.1:${proxyPort}${url}`);
        } else if (host === "127.0.0.1") {
          fallbackCandidates.push(`http://localhost:${proxyPort}${url}`);
        }
      } else {
        fallbackCandidates.push(`${scheme}//${host}:${proxyPort}${url}`);
      }
    }
  }
  const targets = isOfficialApi && isFileOrigin && fallbackCandidates.length ? fallbackCandidates : [url, ...fallbackCandidates];
  let result = null;
  for (const targetUrl of targets) {
    if (result && (result.ok || ![0, 404].includes(result.status))) break;
    result = await tryFetch(targetUrl);
  }
  if (!result) result = await tryFetch(url);
  const parseApiErrorPayload = (rawText) => {
    const text = String(rawText || "").trim();
    if (!text) return null;
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object") {
        return parsed;
      }
    } catch {
    }
    return null;
  };
  const extractApiErrorText = (rawText, parsed = parseApiErrorPayload(rawText)) => {
    const text = String(rawText || "").trim();
    if (!text) return "";
    if (parsed && typeof parsed === "object") {
      const main = String(parsed.message || parsed.error || "").trim();
      const hint = String(parsed.hint || "").trim();
      if (main && hint) return `${main}\uFF08${hint}\uFF09`;
      return main || text;
    }
    return text;
  };
  if (!result.ok) {
    const apiErrorPayload = parseApiErrorPayload(result.text);
    const apiErrorText = extractApiErrorText(result.text, apiErrorPayload);
    const createApiError = (message) => {
      const error = new Error(message);
      error.status = result.status;
      if (apiErrorPayload) error.data = apiErrorPayload;
      return error;
    };
    if (isOfficialApi && result.status === 0) {
      const remoteHint = isLocalOrigin ? "\u8ACB\u5728\u5C08\u6848\u76EE\u9304\u57F7\u884C python3 serve.py\uFF0C\u4E26\u7528\u5176\u986F\u793A\u7684\u7DB2\u5740\u958B\u555F\uFF08\u76EE\u524D\u5E38\u7528 http://127.0.0.1:5606/\uFF1B\u820A\u8173\u672C\u53EF\u7528 5502/5500/5501\uFF0C\u540C\u57E0\u542B /api/lvr\uFF09\u3002" : `\u8ACB\u78BA\u8A8D ${window.location.hostname} \u4E0A 5606\u30015502\u30015500 \u6216 5501 \u5DF2\u555F\u52D5\u4EE3\u7406\uFF0C\u6216\u7DB2\u7AD9\u5DF2\u53CD\u5411\u4EE3\u7406 /api/lvr/* \u5230\u67E5\u8A62\u670D\u52D9\u3002`;
      throw createApiError(`${apiErrorText || result.text || "Failed to fetch"}\uFF08\u901A\u5E38\u4E0D\u662F\u5730\u5340\u689D\u4EF6\uFF0C\u800C\u662F\u4EE3\u7406\u670D\u52D9\u6216\u7DB2\u8DEF\u9023\u7DDA\u554F\u984C\uFF1B${remoteHint}\uFF09`);
    }
    if (isOfficialApi && (result.status === 501 || result.status === 405)) {
      throw createApiError(
        "\u5B98\u65B9\u67E5\u8A62\u9700 POST\uFF0C\u4F46\u76EE\u524D\u9801\u9762\u662F\u7531\u4E0D\u652F\u63F4 POST \u7684\u975C\u614B\u4F3A\u670D\u5668\u63D0\u4F9B\uFF08\u5E38\u898B\uFF1Apython3 -m http.server\uFF09\u3002\u8ACB\u95DC\u9589\u8A72\u7A0B\u5E8F\uFF0C\u5728\u5C08\u6848\u76EE\u9304\u57F7\u884C python3 serve.py\uFF0C\u4E26\u7528\u5B83\u986F\u793A\u7684\u7DB2\u5740\u958B\u555F\uFF1B\u76EE\u524D\u5E38\u7528 http://127.0.0.1:5606/\uFF0C\u820A\u8173\u672C\u53EF\u7528 5502/5500/5501\uFF08\u8207 /api/lvr \u540C\u4E00\u57E0\uFF09\u3002"
      );
    }
    throw createApiError(apiErrorText || result.text || `HTTP ${result.status}`);
  }
  return result.text ? JSON.parse(result.text) : null;
}
function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`\u8173\u672C\u8F09\u5165\u5931\u6557\uFF1A${src}`));
    document.head.appendChild(script);
  });
}
async function reloadOfficialBridge() {
  await loadScriptOnce(`lvr-bridge.js?v=20260510-file-fetch&t=${Date.now()}`);
  if (window.lvrCommonReady) {
    return await window.lvrCommonReady;
  }
  return window.common;
}
function selectedLabel(selectEl) {
  return selectEl.options[selectEl.selectedIndex]?.text?.trim() || "";
}
function normalizeForAdminMatch(text) {
  return String(text || "").trim().replace(/[\s\u3000]+/g, "").replace(/台(?=[北市南東])/g, "\u81FA");
}
function findCityCodeByTitle(title) {
  const n = normalizeForAdminMatch(title);
  if (!n) return "";
  if (!officialCities.length) {
    return Object.keys(CITY_DISTRICTS2).find((city) => normalizeForAdminMatch(city) === n) || "";
  }
  const hit = officialCities.find((city) => normalizeForAdminMatch(city.title) === n);
  return hit?.code || "";
}
function getOfficialCityTitleByCode(cityCode) {
  if (!cityCode) return "";
  const hit = officialCities.find((c) => c.code === cityCode);
  return hit?.title || cityCode;
}
function canonicalDistrictNameForCity(districtRaw, cityTitle) {
  const list = CITY_DISTRICTS2[cityTitle] || [];
  if (!districtRaw || !list.length) return String(districtRaw || "").trim();
  const n = normalizeForAdminMatch(districtRaw);
  for (const d of list) {
    const nd = normalizeForAdminMatch(d);
    if (nd && n.includes(nd)) return d;
  }
  let hit = list.find((d) => normalizeForAdminMatch(d) === n);
  if (hit) return hit;
  hit = list.find((d) => {
    const nd = normalizeForAdminMatch(d);
    return nd.length >= 2 && (n.includes(nd) || nd.includes(n));
  });
  return hit || String(districtRaw).trim();
}
function findTownCodeByTitle(cityCode, title) {
  const n = normalizeForAdminMatch(title);
  if (!n || !cityCode) return "";
  const towns = officialTowns.get(cityCode) || [];
  const exactTitle = towns.find((town) => normalizeForAdminMatch(town.title) === n);
  if (exactTitle) return String(exactTitle.code);
  const exactCode = towns.find((town) => normalizeForAdminMatch(String(town.code)) === n);
  if (exactCode) return String(exactCode.code);
  const loose = towns.filter((town) => {
    const nt = normalizeForAdminMatch(town.title);
    return nt && (n.includes(nt) || nt.includes(n));
  });
  if (!loose.length) return "";
  loose.sort((a, b) => normalizeForAdminMatch(b.title).length - normalizeForAdminMatch(a.title).length);
  return String(loose[0].code);
}
function resolveDistrictDropdownCode(cityCode, districtRaw) {
  if (!districtRaw || !cityCode) return "";
  const cityTitle = getOfficialCityTitleByCode(cityCode);
  const canonical = canonicalDistrictNameForCity(districtRaw, cityTitle);
  const matched = findTownCodeByTitle(cityCode, canonical) || findTownCodeByTitle(cityCode, districtRaw);
  if (matched) return matched;
  const towns = officialTowns.get(cityCode) || [];
  const isLocalDistrict = (CITY_DISTRICTS2[cityTitle] || []).some((district) => normalizeForAdminMatch(district) === normalizeForAdminMatch(canonical));
  if (isLocalDistrict && towns.length) {
    const cityLevelTown = towns.find((town) => normalizeForAdminMatch(town.title) === normalizeForAdminMatch(cityTitle));
    if (cityLevelTown) return String(cityLevelTown.code);
  }
  return "";
}
function resolveDistrictByOptionLabel(cityCode, districtTitle) {
  if (!districtTitle || !els.districtName || !cityCode) return "";
  const n = normalizeForAdminMatch(districtTitle);
  for (let i = 0; i < els.districtName.options.length; i += 1) {
    const opt = els.districtName.options[i];
    if (!opt.value) continue;
    const t = normalizeForAdminMatch(opt.textContent);
    const v = normalizeForAdminMatch(opt.value);
    if (t === n || v === n || n.length >= 2 && (t.includes(n) || n.includes(t))) return opt.value;
  }
  return "";
}
async function ensureOfficialCrypto() {
  if (window.common && typeof window.common.getPathHash === "function" && typeof window.common.getEncodeStr === "function") {
    return window.common;
  }
  if (window.common && typeof window.common.getEncodeStr === "function" && typeof window.common.getMd5word === "function") {
    const reloaded2 = await reloadOfficialBridge();
    if (reloaded2 && typeof reloaded2.getPathHash === "function" && typeof reloaded2.getEncodeStr === "function") {
      return reloaded2;
    }
  }
  if (window.lvrCommonReady) {
    const ready = await window.lvrCommonReady;
    if (ready && typeof ready.getPathHash === "function" && typeof ready.getEncodeStr === "function") {
      return ready;
    }
    const reloaded2 = await reloadOfficialBridge();
    if (reloaded2 && typeof reloaded2.getPathHash === "function" && typeof reloaded2.getEncodeStr === "function") {
      return reloaded2;
    }
    return ready;
  }
  const reloaded = await reloadOfficialBridge();
  if (reloaded && typeof reloaded.getPathHash === "function" && typeof reloaded.getEncodeStr === "function") {
    return reloaded;
  }
  throw new Error("\u5B98\u65B9\u67E5\u8A62\u6A4B\u63A5\u8173\u672C\u5C1A\u672A\u5B8C\u6210\u8F09\u5165\u3002");
}
function populateCityOptions() {
  const cityRows = officialCities.length ? officialCities : Object.keys(CITY_DISTRICTS2).map((city) => ({ code: city, title: city }));
  els.cityName.innerHTML = ['<option value="">\u8ACB\u9078\u64C7\u7E23\u5E02</option>', ...cityRows.map((city) => `<option value="${city.code}">${city.title}</option>`)].join("");
}
function populateDistrictOptions(cityCode, selected = "") {
  const districts = officialCities.length ? officialTowns.get(cityCode) || [] : (CITY_DISTRICTS2[cityCode] || []).map((district) => ({ code: district, title: district }));
  if (!districts.length) {
    els.districtName.innerHTML = '<option value="">\u8ACB\u5148\u9078\u64C7\u7E23\u5E02</option>';
    return;
  }
  els.districtName.innerHTML = ['<option value="">\u8ACB\u9078\u64C7\u884C\u653F\u5340</option>', ...districts.map((district) => `<option value="${district.code}">${district.title}</option>`)].join("");
  const sel = String(selected || "").trim();
  const pick = sel && districts.find((d) => String(d.code) === sel);
  els.districtName.value = pick ? String(pick.code) : "";
}
async function loadOfficialCities() {
  try {
    officialCities = (await fetchApiJson("/api/lvr/cities", { cache: "no-store" }) || []).filter((city) => city && city.use !== false).map((city) => ({ code: city.code, title: fixOfficialText(city.title) }));
  } catch (error) {
    officialCities = [];
    console.warn("\u5B98\u65B9\u7E23\u5E02\u6E05\u55AE\u8F09\u5165\u5931\u6557\uFF0C\u6539\u7528\u672C\u5730\u5099\u63F4\u3002", error);
  }
  populateCityOptions();
}
async function loadOfficialTowns(cityCode, selected = "") {
  if (!cityCode) {
    populateDistrictOptions("");
    return;
  }
  if (!officialTowns.has(cityCode)) {
    try {
      const towns2 = await fetchApiJson(`/api/lvr/towns?city=${encodeURIComponent(cityCode)}`, { cache: "no-store" });
      officialTowns.set(cityCode, (towns2 || []).filter((town) => town && town.use !== false).map((town) => ({ code: town.code, title: fixOfficialText(town.title) })));
    } catch (error) {
      console.warn("\u5B98\u65B9\u884C\u653F\u5340\u6E05\u55AE\u8F09\u5165\u5931\u6557\uFF0C\u6539\u7528\u672C\u5730\u5099\u63F4\u3002", error);
      officialTowns.set(cityCode, []);
    }
  }
  let towns = officialTowns.get(cityCode) || [];
  if (!towns.length && officialCities.length) {
    const cityTitle = officialCities.find((c) => c.code === cityCode)?.title;
    const fallbackNames = cityTitle && CITY_DISTRICTS2[cityTitle] ? CITY_DISTRICTS2[cityTitle] : [];
    if (fallbackNames.length) {
      towns = fallbackNames.map((name) => ({ code: name, title: name }));
      officialTowns.set(cityCode, towns);
    }
  }
  populateDistrictOptions(cityCode, selected);
}
function populatePeriodOptions() {
  const nowRocY = (/* @__PURE__ */ new Date()).getFullYear() - 1911;
  const yearHi = Math.max(115, nowRocY + 1);
  const years = [];
  for (let y = 101; y <= yearHi; y++) years.push(String(y));
  const months = Array.from({ length: 12 }, (_, index) => String(index + 1));
  const renderOptions = (items, placeholder) => [`<option value="">${placeholder}</option>`, ...items.map((item) => `<option value="${item}">${item}</option>`)].join("");
  els.periodStartYear.innerHTML = renderOptions(years, "\u5E74");
  els.periodEndYear.innerHTML = renderOptions(years, "\u5E74");
  els.periodStartMonth.innerHTML = renderOptions(months, "\u6708");
  els.periodEndMonth.innerHTML = renderOptions(months, "\u6708");
}
function getRollingTransactionPeriod(spanYears) {
  const n = Math.max(1, Math.min(30, Number(spanYears) || 1));
  const now = /* @__PURE__ */ new Date();
  const endRocY = now.getFullYear() - 1911;
  const endRocM = now.getMonth() + 1;
  const startDate = new Date(now.getFullYear(), now.getMonth() - 12 * n + 1, 1);
  let startRocY = startDate.getFullYear() - 1911;
  let startRocM = startDate.getMonth() + 1;
  if (startRocY < 101) {
    startRocY = 101;
    startRocM = 1;
  }
  return {
    periodStartYear: String(startRocY),
    periodStartMonth: String(startRocM),
    periodEndYear: String(endRocY),
    periodEndMonth: String(endRocM)
  };
}
function applyRollingPeriodToUi(spanYears) {
  const p = getRollingTransactionPeriod(spanYears);
  els.periodStartYear.value = p.periodStartYear;
  els.periodStartMonth.value = p.periodStartMonth;
  els.periodEndYear.value = p.periodEndYear;
  els.periodEndMonth.value = p.periodEndMonth;
}
function composePeriod(year, month) {
  if (!year || !month) return "";
  return `${year}/${String(month).padStart(2, "0")}`;
}
function parseKeywords(raw) {
  return String(raw || "").split(/[,\n、，]/).map((item) => item.trim()).filter(Boolean);
}
function selectedSpecialRemarkIds() {
  return [...specialRemarkEls.options].filter((input) => input.checked).map((input) => input.value).filter((id) => SPECIAL_REMARK_FILTER_BY_ID2.has(id));
}
function selectedSpecialRemarkFilters() {
  return selectedSpecialRemarkIds().map((id) => SPECIAL_REMARK_FILTER_BY_ID2.get(id)).filter(Boolean);
}
function syncMainPurposePickerState() {
  const selected = selectedMainPurposes();
  if (mainPurposeEls.summary) {
    mainPurposeEls.summary.textContent = selected.length ? selected.join("\u3001") : "\u8ACB\u9078\u64C7";
  }
  if (mainPurposeEls.all) {
    const allOptions = [...mainPurposeEls.options];
    const selectedCount = allOptions.filter((input) => input.checked).length;
    mainPurposeEls.all.checked = allOptions.length > 0 && selectedCount === allOptions.length;
    mainPurposeEls.all.indeterminate = selectedCount > 0 && selectedCount < allOptions.length;
  }
}
function setMainPurposePanelOpen(open) {
  if (!mainPurposeEls.panel || !mainPurposeEls.toggle) return;
  mainPurposeEls.panel.classList.toggle("is-hidden", !open);
  mainPurposeEls.toggle.setAttribute("aria-expanded", open ? "true" : "false");
}
function syncSpecialRemarkPickerState() {
  const selectedFilters = selectedSpecialRemarkFilters();
  if (specialRemarkEls.summary) {
    specialRemarkEls.summary.textContent = selectedFilters.length ? selectedFilters.map((filter) => filter.label).join("\u3001") : "\u672A\u9078\u64C7\u7279\u6B8A\u4EA4\u6613\u5099\u8A3B";
  }
  if (els.specialKeywords) {
    els.specialKeywords.value = selectedFilters.flatMap((filter) => filter.keywords.length ? filter.keywords : [filter.label]).join(",");
  }
  if (specialRemarkEls.all) {
    const allOptions = [...specialRemarkEls.options];
    const selectedCount = allOptions.filter((input) => input.checked).length;
    specialRemarkEls.all.checked = allOptions.length > 0 && selectedCount === allOptions.length;
    specialRemarkEls.all.indeterminate = selectedCount > 0 && selectedCount < allOptions.length;
  }
}
function setSpecialRemarkPanelOpen(open) {
  if (!specialRemarkEls.panel || !specialRemarkEls.toggle) return;
  specialRemarkEls.panel.classList.toggle("is-hidden", !open);
  specialRemarkEls.toggle.setAttribute("aria-expanded", open ? "true" : "false");
}
function resetSpecialRemarkPicker() {
  specialRemarkEls.options.forEach((input) => {
    input.checked = input.value === "special_relation";
  });
  syncSpecialRemarkPickerState();
  setSpecialRemarkPanelOpen(false);
}
function hasMeaningfulOfficialValue(value) {
  const text = String(value || "").trim();
  return !!text && !/^(無|否|none|no|0)$/i.test(text);
}
function rowMatchesSpecialRemarkFilter(row, filter) {
  const note = String(row.note || "").trim();
  if (filter.id === "has_note") return !!note;
  if (filter.id === "has_elevator") return hasMeaningfulOfficialValue(row.elevator);
  if (filter.id === "has_management") return hasMeaningfulOfficialValue(row.management);
  const text = [row.note, row.target, row.purpose, row.layout].filter(Boolean).join(" ");
  return filter.keywords.some((keyword) => text.includes(keyword));
}
function rowMatchesAnySpecialRemark(row, filters, fallbackKeywords = []) {
  if (filters.length) return filters.some((filter) => rowMatchesSpecialRemarkFilter(row, filter));
  return fallbackKeywords.some((key) => (row.note || "").includes(key));
}
function areaInfo() {
  return readAreaInfoFromDom(els);
}
function parkingPricingInfo2(parkingAreaPing) {
  return parkingPricingInfo(parkingAreaPing);
}
function comparableParkingCount2(row) {
  return comparableParkingCount(row);
}
function comparableParkingUnitPrice2(row) {
  return comparableParkingUnitPrice(row);
}
function normalizeComparableParkingCount2(value) {
  return normalizeComparableParkingCount(value);
}
function parkingValuationMultiplier2(parkingInfo) {
  return parkingValuationMultiplier(parkingInfo, els.parkingCount?.value);
}
function estimateHouseValueWithParking2(options = {}) {
  return estimateHouseValueWithParking(options);
}
function normalizedMoneyInputValue(value) {
  const n = toNumber2(value);
  if (n == null || n <= 0) return "";
  return String(+n.toFixed(3));
}
function parkingUnitPriceInputIsAutoValue() {
  if (!els.parkingUnitPrice) return false;
  const autoValue = String(els.parkingUnitPrice.dataset.autoValue || "");
  if (!autoValue) return false;
  return normalizedMoneyInputValue(els.parkingUnitPrice.value) === autoValue;
}
function manualParkingUnitPriceValue() {
  if (!els.parkingUnitPrice) return null;
  const value = toNumber2(els.parkingUnitPrice.value);
  if (value == null || value <= 0) return null;
  return parkingUnitPriceInputIsAutoValue() ? null : value;
}
function setAutoParkingUnitPrice(value, title = "") {
  if (!els.parkingUnitPrice) return;
  const text = normalizedMoneyInputValue(value);
  els.parkingUnitPrice.value = text;
  if (text) {
    els.parkingUnitPrice.dataset.autoValue = text;
    els.parkingUnitPrice.dataset.autoSource = "comparableParkingPrice";
  } else {
    delete els.parkingUnitPrice.dataset.autoValue;
    delete els.parkingUnitPrice.dataset.autoSource;
  }
  els.parkingUnitPrice.title = title || (text ? `\u5E73\u5747\u55AE\u4E00\u8ECA\u4F4D\u7E3D\u50F9 ${formatNum2(value, 3)} \u842C\u5143` : "\u7D0D\u5165\u5E73\u5747\u6848\u4F8B\u672A\u63D0\u4F9B\u8ECA\u4F4D\u7E3D\u50F9");
}
function clearAutoParkingUnitPrice(title = "\u7D0D\u5165\u5E73\u5747\u6848\u4F8B\u672A\u63D0\u4F9B\u8ECA\u4F4D\u7E3D\u50F9") {
  if (!els.parkingUnitPrice) return;
  if (!els.parkingUnitPrice.value || parkingUnitPriceInputIsAutoValue()) {
    els.parkingUnitPrice.value = "";
  }
  delete els.parkingUnitPrice.dataset.autoValue;
  delete els.parkingUnitPrice.dataset.autoSource;
  els.parkingUnitPrice.title = title;
}
function normalizeParkingCount2(count) {
  const n = Number(count);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n);
}
function clearOcrParkingCount() {
  if (!els.parkingCount) return;
  delete els.parkingCount.dataset.ocrCount;
}
function clearOcrParkingFields() {
  clearOcrParkingCount();
  if (els.parkingArea) {
    els.parkingArea.value = "";
    delete els.parkingArea.dataset.autoValue;
    els.parkingArea.title = "";
  }
  if (els.parkingCount) {
    els.parkingCount.value = "";
    els.parkingCount.title = "\u672A\u8FA8\u8B58\u8ECA\u4F4D\u6578\u91CF";
  }
}
function setOcrParkingCount(count) {
  const n = normalizeParkingCount2(count);
  if (!els.parkingCount || n <= 0) {
    clearOcrParkingCount();
    return 0;
  }
  els.parkingCount.dataset.ocrCount = String(n);
  els.parkingCount.value = String(n);
  return n;
}
function ocrParkingCountOverride() {
  return normalizeParkingCount2(els.parkingCount?.dataset?.ocrCount);
}
function syncParkingCountFromArea(parkingAreaPing = safeNumber2(els.parkingArea.value)) {
  if (!els.parkingCount) return parkingPricingInfo2(parkingAreaPing);
  const fixedCount = ocrParkingCountOverride();
  const area = Math.max(0, Number(parkingAreaPing) || 0);
  if (fixedCount > 0 && area > 0) {
    const info2 = { count: fixedCount, fullCount: fixedCount, hasDiscountPart: false, priceMultiplier: fixedCount, source: "ocr" };
    els.parkingCount.value = String(fixedCount);
    els.parkingCount.title = `\u7531 OCR \u505C\u8ECA\u4F4D\u7DE8\u865F\u89E3\u6790\uFF1A${fixedCount} \u500B\u8ECA\u4F4D\uFF0C\u8ECA\u4F4D\u576A\u6578 ${formatNum2(area, 3)} \u576A\uFF0C\u8A08\u50F9\u500D\u6578 ${fixedCount}`;
    return info2;
  }
  if (fixedCount > 0 && area <= 0) clearOcrParkingCount();
  const info = parkingPricingInfo2(parkingAreaPing);
  els.parkingCount.value = info.count ? String(info.count) : "";
  els.parkingCount.title = info.count ? `\u4F9D\u8ECA\u4F4D\u576A\u6578\u81EA\u52D5\u8A08\u7B97\uFF1A${info.count} \u500B\u8ECA\u4F4D\uFF0C\u8A08\u50F9\u500D\u6578 ${formatNum2(info.priceMultiplier, 3)}` : "\u672A\u586B\u8ECA\u4F4D\u576A\u6578\uFF0C\u8ECA\u4F4D\u6578\u91CF\u70BA 0";
  return info;
}
var sourcePreviewObjectUrls = [];
var sourcePreviewRenderToken = 0;
function clearSourcePreviewObjectUrl() {
  sourcePreviewObjectUrls.forEach((url) => URL.revokeObjectURL(url));
  sourcePreviewObjectUrls = [];
}
function setSourcePreviewOpen(open) {
  if (!els.sourcePreview || !els.toggleSourcePreviewBtn) return;
  els.sourcePreview.classList.toggle("is-hidden", !open);
  els.sourcePreview.classList.toggle("is-preview-open", open);
  els.toggleSourcePreviewBtn.textContent = open ? "\u96B1\u85CF PDF/\u5716\u7247\u9810\u89BD" : "\u986F\u793A PDF/\u5716\u7247\u9810\u89BD";
  els.toggleSourcePreviewBtn.setAttribute("aria-expanded", open ? "true" : "false");
  if (open) {
    requestAnimationFrame(() => els.sourcePreview?.scrollIntoView({ block: "nearest" }));
  }
}
function resetSourcePreview() {
  sourcePreviewRenderToken += 1;
  clearSourcePreviewObjectUrl();
  els.sourcePreview?.classList.add("is-hidden");
  els.sourcePreview?.classList.remove("is-preview-open");
  if (els.sourcePreview) els.sourcePreview.innerHTML = '<div class="placeholder">\u5C1A\u672A\u9078\u64C7\u6A94\u6848</div>';
  els.toggleSourcePreviewBtn?.classList.add("is-hidden");
  els.toggleSourcePreviewBtn?.setAttribute("aria-expanded", "false");
  if (els.toggleSourcePreviewBtn) els.toggleSourcePreviewBtn.textContent = "\u986F\u793A PDF/\u5716\u7247\u9810\u89BD";
}
function createPreviewPage(labelText) {
  const page = document.createElement("div");
  page.className = "preview-page";
  const label = document.createElement("div");
  label.className = "preview-page-label";
  label.textContent = labelText;
  page.appendChild(label);
  return page;
}
function showPreviewPlaceholder(message) {
  if (!els.sourcePreview) return;
  const placeholder = document.createElement("div");
  placeholder.className = "placeholder";
  placeholder.textContent = message;
  els.sourcePreview.replaceChildren(placeholder);
}
async function renderPdfPreviewPages(file, token) {
  if (!window.pdfjsLib?.getDocument) {
    showPreviewPlaceholder("PDF \u9810\u89BD\u6A21\u7D44\u672A\u8F09\u5165\u3002");
    return;
  }
  showPreviewPlaceholder("PDF \u9810\u89BD\u5EFA\u7ACB\u4E2D...");
  const buffer = await file.arrayBuffer();
  if (token !== sourcePreviewRenderToken) return;
  const pdf = await window.pdfjsLib.getDocument({ data: buffer }).promise;
  const pages = document.createElement("div");
  pages.className = "preview-pages";
  els.sourcePreview.replaceChildren(pages);
  for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
    if (token !== sourcePreviewRenderToken) return;
    const pdfPage = await pdf.getPage(pageNo);
    const viewport = pdfPage.getViewport({ scale: 1.35 });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { alpha: false });
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const page = createPreviewPage(`\u7B2C ${pageNo} / ${pdf.numPages} \u9801`);
    page.appendChild(canvas);
    pages.appendChild(page);
    await pdfPage.render({ canvasContext: ctx, viewport }).promise;
  }
}
async function previewFile(file) {
  sourcePreviewRenderToken += 1;
  const token = sourcePreviewRenderToken;
  clearSourcePreviewObjectUrl();
  if (!file) {
    resetSourcePreview();
    return;
  }
  els.toggleSourcePreviewBtn?.classList.remove("is-hidden");
  setSourcePreviewOpen(false);
  showPreviewPlaceholder("\u5DF2\u9078\u64C7\u6A94\u6848\uFF0C\u6309\u300C\u986F\u793A PDF/\u5716\u7247\u9810\u89BD\u300D\u958B\u555F\u3002");
  try {
    if (isPdfFile(file)) {
      await renderPdfPreviewPages(file, token);
      return;
    }
    const url = URL.createObjectURL(file);
    sourcePreviewObjectUrls.push(url);
    const pages = document.createElement("div");
    pages.className = "preview-pages";
    const page = createPreviewPage("\u5716\u7247\u9810\u89BD");
    const image = document.createElement("img");
    image.src = url;
    image.alt = "\u5F71\u672C\u9810\u89BD";
    page.appendChild(image);
    pages.appendChild(page);
    if (token === sourcePreviewRenderToken) els.sourcePreview.replaceChildren(pages);
  } catch (error) {
    if (token === sourcePreviewRenderToken) {
      showPreviewPlaceholder(`\u9810\u89BD\u5EFA\u7ACB\u5931\u6557\uFF1A${formatCaughtError(error)}`);
    }
  }
}
function isPdfFile(file) {
  return !!file && (file.type === "application/pdf" || /\.pdf$/i.test(file.name));
}
function selectedSourceFiles() {
  return Array.from(els.sourceFile?.files || []).filter(Boolean);
}
function orderedSourceFiles(files = selectedSourceFiles()) {
  return Array.from(files || []).filter(Boolean).sort(
    (a, b) => String(a?.name || "").localeCompare(String(b?.name || ""), "zh-Hant", { numeric: true })
  );
}
function isLikelyLandTaxDeedFile(file) {
  const name = String(file?.name || "").normalize("NFKC").toLowerCase();
  return /土地|土謄|土建|地價|增值稅|land/.test(name);
}
function sourceFileNames(files = selectedSourceFiles()) {
  return files.map((file) => file?.name || "\u672A\u547D\u540D\u6A94\u6848").filter(Boolean);
}
function primaryOcrSourceFile(files = selectedSourceFiles()) {
  const ordered = orderedSourceFiles(files);
  return ordered.find((file) => !isLikelyLandTaxDeedFile(file)) || ordered[0] || null;
}
function landTaxSourceFiles(files = selectedSourceFiles()) {
  const ordered = orderedSourceFiles(files);
  const explicitFiles = ordered.filter(isLikelyLandTaxDeedFile);
  if (explicitFiles.length) return explicitFiles;
  const primaryFile = primaryOcrSourceFile(ordered);
  return ordered.length > 1 ? ordered.filter((file) => file !== primaryFile) : [];
}
async function previewSourceFiles(files = selectedSourceFiles()) {
  const list = Array.from(files || []).filter(Boolean);
  if (list.length <= 1) {
    await previewFile(list[0] || null);
    return;
  }
  sourcePreviewRenderToken += 1;
  const token = sourcePreviewRenderToken;
  clearSourcePreviewObjectUrl();
  els.toggleSourcePreviewBtn?.classList.remove("is-hidden");
  setSourcePreviewOpen(false);
  showPreviewPlaceholder(`\u5DF2\u9078\u64C7 ${list.length} \u500B\u6A94\u6848\uFF0C\u6309\u300C\u986F\u793A PDF/\u5716\u7247\u9810\u89BD\u300D\u958B\u555F\u3002`);
  try {
    const pages = document.createElement("div");
    pages.className = "preview-pages";
    for (let index = 0; index < list.length; index += 1) {
      if (token !== sourcePreviewRenderToken) return;
      const file = list[index];
      if (isPdfFile(file)) {
        const page2 = createPreviewPage(`\u6A94\u6848 ${index + 1}/${list.length}\uFF1A${file.name}\uFF08PDF\uFF09`);
        const note = document.createElement("div");
        note.className = "placeholder";
        note.textContent = "PDF \u9810\u89BD\u8ACB\u4EE5\u4E3B\u6A94\u9810\u89BD\u70BA\u6E96\uFF1B\u591A\u6A94\u6A21\u5F0F\u6703\u81EA\u52D5\u89E3\u6790\u4E3B\u5EFA\u7269\u8B04\u672C\u8207\u571F\u5730\u8B04\u672C\u3002";
        page2.appendChild(note);
        pages.appendChild(page2);
        continue;
      }
      const url = URL.createObjectURL(file);
      sourcePreviewObjectUrls.push(url);
      const page = createPreviewPage(`\u6A94\u6848 ${index + 1}/${list.length}\uFF1A${file.name}`);
      const image = document.createElement("img");
      image.src = url;
      image.alt = file.name || "\u5F71\u672C\u9810\u89BD";
      page.appendChild(image);
      pages.appendChild(page);
    }
    if (token === sourcePreviewRenderToken) els.sourcePreview.replaceChildren(pages);
  } catch (error) {
    if (token === sourcePreviewRenderToken) {
      showPreviewPlaceholder(`\u9810\u89BD\u5EFA\u7ACB\u5931\u6557\uFF1A${formatCaughtError(error)}`);
    }
  }
}
function normalizePresetFileName(fileName) {
  return String(fileName || "").toLowerCase().replace(/\.(pdf|png|jpe?g|webp)$/i, "").replace(/[（(]\d+[）)]/g, "").replace(/[\s._\-–—]+/g, "").trim();
}
function getKnownFilePreset(fileName) {
  if (knownFilePresets[fileName]) return knownFilePresets[fileName];
  const normalized = normalizePresetFileName(fileName);
  if (!normalized) return null;
  const entries = Object.entries(knownFilePresets);
  const exact = entries.find(([name]) => normalizePresetFileName(name) === normalized);
  if (exact) return exact[1];
  const canUseFuzzyMatch = normalized.length >= 6 && /[a-z\u4e00-\u9fff]/i.test(normalized);
  if (!canUseFuzzyMatch) return null;
  const contains = entries.find(([name]) => {
    const candidate = normalizePresetFileName(name);
    if (candidate.length < 6 || !/[a-z\u4e00-\u9fff]/i.test(candidate)) return false;
    return candidate && (normalized.includes(candidate) || candidate.includes(normalized));
  });
  return contains ? contains[1] : null;
}
function dispatchSubjectAddressUpdated() {
  document.dispatchEvent(new CustomEvent("found:subject-address-updated", {
    detail: {
      address: els.recognizedPropertyAddress?.value || els.subjectAddress?.value || ""
    }
  }));
}
function setRecognizedAddressFields({ property = "" } = {}) {
  if (els.recognizedPropertyAddress) els.recognizedPropertyAddress.value = property || "";
  dispatchSubjectAddressUpdated();
  if (property) {
    scheduleUnderwritingZoneRefresh("ocr-address");
  } else {
    clearSubjectUnderwritingGeocode();
  }
}
function clearRecognizedAddressFields() {
  setRecognizedAddressFields({});
}
var OCR_FIELD_LABELS = {
  propertyAddress: "\u5EFA\u7269\u9580\u724C",
  queryAddress: "\u67E5\u8A62\u5730\u5740",
  mainArea: "\u4E3B\u5EFA\u7269\u9762\u7A4D",
  attachArea: "\u9644\u5C6C\u5EFA\u7269\u9762\u7A4D",
  commonArea: "\u5171\u6709\u90E8\u5206\u9762\u7A4D",
  landShare: "\u571F\u5730\u6301\u5206\u576A",
  parkingArea: "\u8ECA\u4F4D\u576A\u6578",
  parkingCount: "\u8ECA\u4F4D\u6578\u91CF",
  totalFloors: "\u7E3D\u6A13\u5C64",
  unitFloor: "\u6A19\u7684\u6A13\u5C64",
  buildingType: "\u5EFA\u7269\u578B\u614B",
  purpose: "\u4E3B\u8981\u7528\u9014",
  completionDate: "\u5EFA\u7BC9\u5B8C\u6210\u65E5\u671F"
};
var OCR_AREA_FIELD_NAMES = /* @__PURE__ */ new Set(["mainArea", "attachArea", "commonArea", "landShare", "parkingArea"]);
var OCR_SOURCE_LABELS = {
  pdfTextLayer: "PDF \u6587\u5B57\u5C64",
  pdf_text_layer: "PDF \u6587\u5B57\u5C64",
  ocr_pipeline: "OCR \u5F8C\u7AEF\u6D41\u7A0B",
  ocr_pipeline_cache: "OCR \u5F8C\u7AEF\u5FEB\u53D6",
  ppocrv5_ncnn: "\u539F\u751F ncnn OCR",
  native_ocr_cache: "\u539F\u751F ncnn OCR \u5FEB\u53D6",
  paddleocr_docker: "Docker PaddleOCR",
  paddleocr_docker_cache: "Docker PaddleOCR \u5FEB\u53D6",
  pp_structure: "PP-Structure\uFF08\u5DF2\u79FB\u51FA\u4E3B\u6D41\u7A0B\uFF09",
  pp_structure_cache: "PP-Structure \u5FEB\u53D6\uFF08\u5DF2\u79FB\u51FA\u4E3B\u6D41\u7A0B\uFF09",
  paddleocr_vl: "PaddleOCR-VL 0.9B\uFF08\u5DF2\u79FB\u9664\uFF09",
  paddleocr_vl_cache: "PaddleOCR-VL 0.9B \u5FEB\u53D6\uFF08\u5DF2\u79FB\u9664\uFF09",
  gemini_2_5_flash: "Gemini 2.5 Flash\uFF08\u5DF2\u79FB\u9664\uFF09",
  gemini_2_5_flash_cache: "Gemini 2.5 Flash \u5FEB\u53D6\uFF08\u5DF2\u79FB\u9664\uFF09",
  macos_vision: "macOS Vision OCR\uFF08\u5DF2\u505C\u7528\uFF09",
  macos_vision_cache: "macOS Vision OCR \u5FEB\u53D6\uFF08\u820A\u7248\uFF09",
  fallback_none: "OCR \u5C1A\u672A\u53EF\u7528",
  tesseract_cli: "Tesseract CLI\uFF08\u5DF2\u505C\u7528\uFF09",
  paddleocr: "Legacy PaddleOCR",
  paddleocr_cache: "Legacy PaddleOCR \u5FEB\u53D6",
  browserOcr: "\u700F\u89BD\u5668 OCR",
  onnxOcr: "ONNX OCR",
  rapidOcr: "RapidOCR \u5168\u9801 OCR",
  fieldLevelRapidOcr: "RapidOCR \u6B04\u4F4D OCR",
  cloudVisionOcr: "Cloud Vision \u5168\u9801 OCR",
  fieldLevelCloudVisionOcr: "Cloud Vision \u6B04\u4F4D OCR",
  rapidOcrCloudVision: "RapidOCR \u5168\u9801 OCR + Cloud Vision \u88DC\u5F37",
  fieldLevelRapidOcrCloudVision: "RapidOCR \u6B04\u4F4D OCR + Cloud Vision \u6B04\u4F4D OCR",
  fullPageCommonRights: "\u5B8C\u6574\u9801\u6B0A\u5229\u7BC4\u570D\u63DB\u7B97",
  yoloFieldDetector: "YOLO \u7248\u9762\u5075\u6E2C",
  yoloFieldRapidOcr: "YOLO \u7248\u9762 + RapidOCR \u6B04\u4F4D OCR",
  yoloFieldCloudVisionOcr: "YOLO \u7248\u9762 + Cloud Vision \u6B04\u4F4D OCR",
  yoloFieldGpt5Nano: "YOLO \u7248\u9762 + GPT-5 nano",
  minimax_m3_validator: "MiniMax M3 \u6B04\u4F4D\u6821\u6B63",
  minimaxM3Validator: "MiniMax M3 \u6B04\u4F4D\u6821\u6B63",
  minimax_roi_vision: "MiniMax ROI Vision",
  minimaxRoiVision: "MiniMax ROI Vision",
  gemini25FlashVision: "Gemini 2.5 Flash Vision\uFF08\u5DF2\u79FB\u9664\uFF09",
  tesseractOcr: "Tesseract OCR\uFF08\u5DF2\u505C\u7528\uFF09",
  fieldLevelTesseract: "Tesseract \u6B04\u4F4D OCR\uFF08\u5DF2\u505C\u7528\uFF09",
  gpt5NanoCorrector: "GPT-5 nano \u6821\u6B63\u5668",
  addressDictionaryNormalized: "\u5730\u5740\u5B57\u5178\u6B63\u898F\u5316",
  knownFilePreset: "\u5DF2\u77E5\u6A94\u540D\u4FDD\u5E95",
  manualInput: "\u624B\u52D5\u8F38\u5165",
  unknown: "\u672A\u77E5"
};
var lastOcrFieldResults = appState.lastOcrFieldResults;
var lastOcrDiagnosticsMeta = appState.lastOcrDiagnosticsMeta;
function exposeOcrDiagnosticsDebug() {
  try {
    window.lastOcrFieldResults = lastOcrFieldResults;
    window.lastOcrDiagnosticsMeta = lastOcrDiagnosticsMeta;
  } catch (_) {
  }
}
function ocrSourceLabel(source) {
  const key = String(source || "");
  const known = OCR_SOURCE_LABELS[key];
  if (known) return known;
  const lowered = key.toLowerCase();
  if (lowered.includes("pp_structure") || lowered.includes("pp-structure")) return "PP-Structure\uFF08\u5DF2\u79FB\u51FA\u4E3B\u6D41\u7A0B\uFF09";
  if (lowered.includes("paddleocr_vl") || lowered.includes("paddleocr-vl")) return "PaddleOCR-VL 0.9B\uFF08\u5DF2\u79FB\u9664\uFF09";
  if (lowered.includes("gemini_2_5_flash") || lowered.includes("gemini")) return "Gemini 2.5 Flash\uFF08\u5DF2\u79FB\u9664\uFF09";
  if (lowered.includes("paddleocr_docker") || lowered.includes("docker paddleocr")) return "Docker PaddleOCR";
  if (lowered.includes("paddleocr_cache") || lowered.includes("paddleocr cache")) return "Legacy PaddleOCR \u5FEB\u53D6";
  if (lowered.includes("paddleocr")) return "Legacy PaddleOCR";
  if (lowered.includes("browserocr") || lowered.includes("browser") && lowered.includes("ocr")) return "\u700F\u89BD\u5668 OCR";
  const isFieldLevel = /field|欄位|重點/.test(lowered) || /欄位|重點/.test(key);
  const hasRapid = lowered.includes("rapid");
  const hasCloud = lowered.includes("cloud");
  if (hasRapid && hasCloud) {
    return isFieldLevel ? "RapidOCR \u6B04\u4F4D OCR + Cloud Vision \u6B04\u4F4D OCR" : "RapidOCR \u5168\u9801 OCR + Cloud Vision \u88DC\u5F37";
  }
  if (hasCloud) return isFieldLevel ? "Cloud Vision \u6B04\u4F4D OCR" : "Cloud Vision \u5168\u9801 OCR";
  if (hasRapid) return isFieldLevel ? "RapidOCR \u6B04\u4F4D OCR" : "RapidOCR \u5168\u9801 OCR";
  if (lowered.includes("ppocrv5") || lowered.includes("ncnn")) return "\u539F\u751F ncnn OCR";
  if (lowered.includes("macos_vision") || lowered.includes("vision")) return "macOS Vision OCR\uFF08\u5DF2\u505C\u7528\uFF09";
  if (lowered.includes("tesseract_cli")) return "Tesseract CLI\uFF08\u5DF2\u505C\u7528\uFF09";
  if (lowered.includes("tesseract")) return isFieldLevel ? "Tesseract \u6B04\u4F4D OCR\uFF08\u5DF2\u505C\u7528\uFF09" : "Tesseract OCR\uFF08\u5DF2\u505C\u7528\uFF09";
  if (lowered.includes("pdf")) return "PDF \u6587\u5B57\u5C64";
  return key || "--";
}
function setOcrDiagnosticsOpen(open) {
  if (!els.ocrFieldDiagnostics) return;
  els.ocrFieldDiagnostics.classList.toggle("is-hidden", !open);
  if (els.toggleOcrDiagnosticsBtn) {
    els.toggleOcrDiagnosticsBtn.textContent = open ? "\u96B1\u85CF\u6B04\u4F4D\u8FA8\u8B58\u8A3A\u65B7" : "\u986F\u793A\u6B04\u4F4D\u8FA8\u8B58\u8A3A\u65B7";
  }
}
function syncOcrDiagnosticsButton(hasDiagnostics) {
  if (!els.toggleOcrDiagnosticsBtn) return;
  els.toggleOcrDiagnosticsBtn.classList.toggle("is-hidden", !hasDiagnostics);
  els.toggleOcrDiagnosticsBtn.disabled = !hasDiagnostics;
  if (!hasDiagnostics) els.toggleOcrDiagnosticsBtn.textContent = "\u986F\u793A\u6B04\u4F4D\u8FA8\u8B58\u8A3A\u65B7";
}
function clearOcrFieldDiagnostics() {
  lastOcrFieldResults = {};
  lastOcrDiagnosticsMeta = {};
  exposeOcrDiagnosticsDebug();
  if (els.ocrFieldDiagnostics) {
    els.ocrFieldDiagnostics.innerHTML = "";
    delete els.ocrFieldDiagnostics.dataset.manual;
    setOcrDiagnosticsOpen(false);
  }
  syncOcrDiagnosticsButton(false);
}
function formatElapsedMs(value) {
  const ms = Number(value);
  if (!Number.isFinite(ms) || ms < 0) return "--";
  if (ms < 1e3) return `${Math.round(ms)} ms`;
  const seconds = ms / 1e3;
  return `${seconds < 10 ? seconds.toFixed(2) : seconds.toFixed(1)} \u79D2`;
}
function normalizeRawAreaUnit(unit = "") {
  const text = String(unit || "").trim();
  if (/平方公$/i.test(text)) return "\u5E73\u65B9\u516C\u5C3A";
  if (/平方公尺|平方?米|㎡|m2|m²/i.test(text)) return "\u5E73\u65B9\u516C\u5C3A";
  return text;
}
function conciseRawText(value, maxLength = 72) {
  return String(value || "").replace(/[*＊]+/g, "").replace(/\s+/g, " ").replace(/\s*[:：]\s*/g, "\uFF1A").trim().slice(0, maxLength);
}
function formatRawAreaSnippet(label, value, unit) {
  const cleanLabel = String(label || "").replace(/面積$/, "").trim();
  const cleanUnit = normalizeRawAreaUnit(unit || "");
  const cleanValue = String(value || "").trim();
  return [cleanLabel, `${cleanValue}${cleanUnit}`].filter(Boolean).join(" ").trim();
}
function normalizeAttachedRawLabel(label) {
  const text = String(label || "").replace("\u81FA", "\u53F0");
  if (/陽[台臺]/.test(text)) return "\u967D\u53F0";
  if (/花[台臺合喜]/.test(text)) return "\u82B1\u53F0";
  if (/雨遮|函遮|兩遮|雨造/.test(text)) return "\u96E8\u906E";
  return text;
}
function isMainOrLayerAreaContext(source, start, matchedText = "") {
  if (/總坪數|總面積|層次面積/.test(String(matchedText || ""))) return true;
  const prefix = String(source || "").slice(Math.max(0, start - 14), start);
  return /(?:總坪數|總面積|層次面積)[:：*＊\s]*$/.test(prefix);
}
function formatStructuredAreaRaw(area, fieldName = "") {
  const entries = Array.isArray(area?.entries) ? area.entries.filter(Boolean) : area && (area.rawValue != null || area.rawBaseValue != null || area.rights || area.label) ? [area] : [];
  if (entries.length) {
    if (fieldName === "attachArea") {
      return entries.map((entry) => {
        const label = String(entry.label || entry.purpose || "\u9644\u5C6C\u5EFA\u7269").trim();
        const unit = normalizeRawAreaUnit(entry.unit || entry.rawBaseUnit || "");
        const value = entry.rawValue ?? entry.rawBaseValue ?? "";
        return `${label} ${value}${unit}`.trim();
      }).filter(Boolean).join("\uFF1B");
    }
    if (fieldName === "commonArea") {
      return entries.map((entry) => {
        const unit = normalizeRawAreaUnit(entry.rawBaseUnit || entry.unit || "\u5E73\u65B9\u516C\u5C3A");
        const value = entry.rawBaseValue ?? entry.rawValue ?? "";
        const rights = entry.rights ? ` \u6B0A\u5229\u7BC4\u570D ${entry.rights}` : "";
        return `\u5171\u6709\u90E8\u5206 ${value}${unit}${rights}`.trim();
      }).filter(Boolean).join("\uFF1B");
    }
    if (fieldName === "parkingArea") {
      return entries.map((entry) => {
        const unit = normalizeRawAreaUnit(entry.rawBaseUnit || entry.unit || "\u5E73\u65B9\u516C\u5C3A");
        const value = entry.rawBaseValue ?? entry.rawValue ?? "";
        const rights = entry.rights ? ` \u6B0A\u5229\u7BC4\u570D ${entry.rights}` : "";
        return `\u505C\u8ECA\u4F4D ${value}${unit}${rights}`.trim();
      }).filter(Boolean).join("\uFF1B");
    }
    if (fieldName === "mainArea") {
      return entries.map((entry) => {
        const label = String(entry.label || "\u4E3B\u5EFA\u7269").trim();
        const unit = normalizeRawAreaUnit(entry.unit || "");
        const value = entry.rawValue ?? "";
        return `${label} ${value}${unit}`.trim();
      }).filter(Boolean).join("\uFF1B");
    }
  }
  return "";
}
function ownershipDeedAreaRawFromText(rawText, fieldName = "") {
  const source = compactOcrText2(rawText || "").replace(/[*＊]+/g, "");
  const isOwnershipDeed = /建物所有權狀|建物所有權状/.test(source);
  if (!isOwnershipDeed && fieldName !== "commonArea" && fieldName !== "parkingArea") return "";
  const number = "(\\d+[\\d,.]*)";
  const areaUnit = "(\u5E73\u65B9\u516C\u5C3A|\u5E73\u65B9\u516C|\u5E73\u65B9?\u7C73|m2|m\xB2|\u33A1)";
  if (fieldName === "mainArea") {
    const match = source.match(new RegExp(`(?:\u7E3D\u9762\u7A4D|\u9762)[:\uFF1A]?[^\\d]{0,20}${number}${areaUnit}`, "i"));
    if (match) return formatRawAreaSnippet(match[0].startsWith("\u7E3D\u9762\u7A4D") ? "\u7E3D\u9762\u7A4D" : "\u9762", match[1], match[2]);
  }
  if (fieldName === "attachArea") {
    const match = source.match(new RegExp(`\u967D\u53F0.{0,80}?(?:\u9762|\u9762\u7A4D|\u6A2A|\u6A6B)[:\uFF1A]?[^\\d]{0,20}${number}${areaUnit}`, "i"));
    if (match) return formatRawAreaSnippet("\u967D\u53F0", match[1], match[2]);
  }
  if (fieldName === "commonArea" || fieldName === "parkingArea") {
    const commonIndex = source.search(/共有部[分份]/);
    if (commonIndex < 0) return "";
    const section = source.slice(commonIndex).split(/權狀注記事|權狀註記事|建物所有權部|建物他項權利部|土地他項權利部/)[0];
    const base = section.match(new RegExp(`${number}${areaUnit}`, "i"));
    const parkingIndex = section.search(/停車位|含停車位|合停車位|車位編號|停車位編號/);
    const rights = [...section.matchAll(/(?:權利範圍)?[^\d]{0,40}(\d{1,12})\s*分之\s*(\d{1,12})/g)].map((match) => ({ index: match.index || 0, end: (match.index || 0) + match[0].length, denom: match[1], num: match[2] }));
    if (!base || !rights.length) return "";
    if (parkingIndex < 0) {
      const total2 = rights.at(-1);
      return fieldName === "commonArea" ? `\u5171\u6709\u90E8\u5206 ${base[1]}${normalizeRawAreaUnit(base[2])} \u6B0A\u5229\u7BC4\u570D ${total2.denom}\u5206\u4E4B${total2.num}` : "";
    }
    const parkingEnd = parkingRightsScopeEnd2(section, parkingIndex);
    const beforeParking = rights.filter((item) => item.index < parkingIndex);
    const afterParking = rights.filter((item) => item.index > parkingIndex && item.index < parkingEnd);
    let total = null;
    let parkingRights = [];
    if (beforeParking.length && afterParking.length) {
      total = beforeParking.at(-1);
      parkingRights = afterParking.filter((item) => item.denom === total.denom);
    } else if (beforeParking.length >= 2) {
      total = beforeParking.at(-2);
      parkingRights = [beforeParking.at(-1)];
    }
    if (!total || !parkingRights.length) return "";
    const parkingNum = parkingRights.reduce((sum, item) => sum + Number(item.num), 0);
    if (!(parkingNum > 0)) return "";
    if (fieldName === "commonArea") {
      const rightsText = `${total.denom}\u5206\u4E4B${total.num}-${parkingNum}`;
      return `\u5171\u6709\u90E8\u5206 ${base[1]}${normalizeRawAreaUnit(base[2])} \u6B0A\u5229\u7BC4\u570D ${rightsText}`;
    }
    if (fieldName === "parkingArea") {
      const numberMatch = section.match(/(?:停車位|含停車位|合停車位|車位編號|停車位編號)[^\d]{0,20}(\d{1,6})/);
      const countText = numberMatch ? `\u505C\u8ECA\u4F4D\u7DE8\u865F${numberMatch[1]}` : "\u505C\u8ECA\u4F4D";
      return `${countText} \u6B0A\u5229\u7BC4\u570D ${total.denom}\u5206\u4E4B${parkingNum}`;
    }
  }
  return "";
}
function conciseAreaRawFromText(rawText, fieldName = "", labels = []) {
  const compact = compactOcrText2(rawText || "").replace(/[*＊]+/g, "");
  if (!compact) return "";
  const ownershipRaw = ownershipDeedAreaRawFromText(rawText, fieldName);
  if (ownershipRaw) return ownershipRaw;
  const areaUnit = "(\u5E73\u65B9\u516C\u5C3A|\u5E73\u65B9?\u7C73|m2|m\xB2|\u33A1)";
  const number = "(\\d+[\\d,.]*)";
  if (fieldName === "attachArea") {
    const attachedUsage = "(\u967D\u81FA|\u967D\u53F0|\u5E73\u53F0|\u96E8\u906E|\u9A0E\u6A13|\u9732\u81FA|\u9732\u53F0|\u82B1\u81FA|\u82B1\u53F0|\u9580\u5ECA|\u8D70\u5ECA|\u6A13\u68AF\u9593|\u5C4B\u7C37|\u5C4B\u6A90|\u5C4B\u9802\u7A81\u51FA\u7269)";
    const source = compactOcrText2(rawText || "").replace(/[*＊]+/g, "");
    const attachStart = source.search(/附屬建物用途|附屬建物/);
    const dateStart = source.search(/建築完成日期/);
    if (attachStart >= 0) {
      const splitTail = source.slice(attachStart).split(/建物所有權部|建物他項權利部|土地標示部|土地他項權利部|權狀注記事|權狀註記事/)[0];
      const splitLabels = [...splitTail.matchAll(new RegExp(attachedUsage, "g"))].map((match) => normalizeAttachedRawLabel(match[1])).filter((label, index, list) => label && list.indexOf(label) === index);
      const continuationTail = source.slice(attachStart, attachStart + 900);
      const continuationLabels = [...continuationTail.matchAll(new RegExp(attachedUsage, "g"))].map((match) => normalizeAttachedRawLabel(match[1])).filter((label, index, list) => label && list.indexOf(label) === index);
      let continuationZone = continuationTail;
      const continuationStop = continuationZone.search(/共有心|共有部分面積(?:\(YOLOROI\))?|共有部[分份]|公有部分|權利範圍|建物所有權部|建物他項權利部|土地標示部|土地他項權利部|其他登記事項/);
      if (continuationStop > 0) continuationZone = continuationZone.slice(0, continuationStop);
      const continuationAreaLabels = [...continuationZone.matchAll(/(?<!層次)(?<!總)面積[:：*＊]*/g)];
      if (continuationAreaLabels.length) {
        const areaLabel = continuationAreaLabels.at(-1);
        const areaZone = continuationZone.slice((areaLabel.index || 0) + areaLabel[0].length);
        const values2 = [];
        const seenContinuation = /* @__PURE__ */ new Set();
        for (const match of areaZone.matchAll(new RegExp(`${number}${areaUnit}`, "gi"))) {
          const key = `${match[1]}|${match[2]}`;
          if (seenContinuation.has(key)) continue;
          seenContinuation.add(key);
          values2.push({ raw: match[1], unit: match[2] });
        }
        if (values2.length >= 2) {
          return values2.map((item, index) => formatRawAreaSnippet(continuationLabels[index] || splitLabels[index] || splitLabels[0] || "\u9644\u5C6C\u5EFA\u7269", item.raw, item.unit)).filter(Boolean).join("\uFF1B");
        }
      }
      const explicitAreaLabels = [...splitTail.matchAll(/(?<!層次)(?<!總)面積[:*＊]*/g)];
      if (splitLabels.length >= 2 && explicitAreaLabels.length) {
        const areaLabel = explicitAreaLabels.at(-1);
        let areaZone = splitTail.slice((areaLabel.index || 0) + areaLabel[0].length);
        const stop = areaZone.search(/其他登記事項|建物所有權部|建物他項權利部|土地標示部|土地他項權利部/);
        if (stop >= 0) areaZone = areaZone.slice(0, stop);
        const values2 = [];
        for (const match of areaZone.matchAll(new RegExp(`${number}${areaUnit}`, "gi"))) {
          const prefix = areaZone.slice(Math.max(0, (match.index || 0) - 42), match.index || 0);
          if (/共有部[分份]|公有部分|權利範圍|分之|建號/.test(prefix)) {
            if (values2.length) break;
            continue;
          }
          values2.push({ raw: match[1], unit: match[2] });
        }
        if (values2.length >= 2) {
          return values2.map((item, index) => formatRawAreaSnippet(splitLabels[index] || splitLabels[0] || "\u9644\u5C6C\u5EFA\u7269", item.raw, item.unit)).filter(Boolean).join("\uFF1B");
        }
      }
      const sectionStart = dateStart >= 0 && dateStart < attachStart && attachStart - dateStart < 260 ? dateStart : attachStart;
      const tail = source.slice(sectionStart);
      const end = tail.search(/共有部[分份]|其他登記事項|建物所有權部|建物他項權利部/);
      const section = end > 0 ? tail.slice(0, end) : tail;
      const labelsFound = [...section.matchAll(new RegExp(attachedUsage, "g"))].map((match) => String(match[1] || "\u9644\u5C6C\u5EFA\u7269").replace("\u81FA", "\u53F0"));
      if (labelsFound.length === 1 && labelsFound[0] === "\u967D\u53F0" && /雨遮|兩遮/.test(source)) labelsFound.push("\u96E8\u906E");
      const values = [...section.matchAll(new RegExp(`${number}${areaUnit}`, "gi"))];
      const seenValues = /* @__PURE__ */ new Set();
      const sectionParts = [];
      values.forEach((match, index) => {
        if (isMainOrLayerAreaContext(section, match.index || 0, match[0])) return;
        const key = `${match[1]}|${match[2]}`;
        if (seenValues.has(key)) return;
        seenValues.add(key);
        const label = labelsFound[index] || labelsFound[0] || "\u9644\u5C6C\u5EFA\u7269";
        sectionParts.push(formatRawAreaSnippet(label, match[1], match[2]));
      });
      if (sectionParts.length > 1) return sectionParts.join("\uFF1B");
    }
    const matches = [
      ...compact.matchAll(new RegExp(`(?:\u9644\u5C6C\u5EFA\u7269\u7528\u9014|\u9644\u5C6C\u5EFA\u7269|\u7528\u9014)?${attachedUsage}[^\u9762\u7A4D\\d]{0,40}\u9762\u7A4D[^\\d]{0,40}${number}${areaUnit}`, "gi")),
      ...compact.matchAll(new RegExp(`(?:\u9644\u5C6C\u5EFA\u7269\u7528\u9014|\u9644\u5C6C\u5EFA\u7269|\u7528\u9014)?${attachedUsage}[^\\d]{0,40}${number}${areaUnit}`, "gi"))
    ];
    const seen = /* @__PURE__ */ new Set();
    const parts = [];
    for (const match of matches) {
      if (isMainOrLayerAreaContext(compact, match.index || 0, match[0])) continue;
      const label = String(match[1] || "\u9644\u5C6C\u5EFA\u7269").replace("\u81FA", "\u53F0");
      const key = `${label}|${match[2]}|${match[3]}`;
      if (seen.has(key)) continue;
      seen.add(key);
      parts.push(formatRawAreaSnippet(label, match[2], match[3]));
    }
    if (parts.length > 1) return parts.join("\uFF1B");
  } else if (fieldName === "commonArea") {
    const entries = [];
    const seen = /* @__PURE__ */ new Set();
    const commonAreaUnit = "(\u5E73\u65B9\u516C\u5C3A|\u5E73\u65B9\u516C|\u5E73\u65B9?\u7C73|m2|m\xB2|\u33A1)";
    const commonEntryRe = new RegExp(`\u5EFA(?:\u865F)?[*\uFF0A]*${number}${commonAreaUnit}.{0,180}?(?:\u6B0A\u5229\u7BC4\u570D)?[^\\d]{0,80}(\\d{1,12})\\s*\u5206\u4E4B\\s*(\\d{1,12})`, "gi");
    for (const match of compact.matchAll(commonEntryRe)) {
      const key = `${match[1]}|${match[2]}|${match[3]}|${match[4]}`;
      if (seen.has(key)) continue;
      seen.add(key);
      entries.push(`\u5171\u6709\u90E8\u5206 ${match[1]}${normalizeRawAreaUnit(match[2])} \u6B0A\u5229\u7BC4\u570D ${match[3]}\u5206\u4E4B${match[4]}`);
    }
    if (entries.length > 1) return entries.join("\uFF1B");
  }
  const matchers = [];
  if (fieldName === "attachArea") {
    matchers.push(new RegExp(`(\u967D\u53F0|\u5E73\u53F0|\u96E8\u906E|\u9A0E\u6A13|\u9732\u53F0|\u82B1\u53F0|\u9580\u5ECA|\u8D70\u5ECA|\u6A13\u68AF\u9593)[^\\d]{0,50}${number}${areaUnit}`, "i"));
    matchers.push(new RegExp(`\u9644\u5C6C\u5EFA\u7269\u7528\u9014[:\uFF1A]?([^\\d\u9762\u7A4D]{1,12})?\u9762\u7A4D[^\\d]{0,30}${number}${areaUnit}`, "i"));
  } else if (fieldName === "commonArea") {
    matchers.push(new RegExp(`(\u5171\u6709\u90E8[\u5206\u4EFD])[^\\d]{0,80}${number}${areaUnit}`, "i"));
    matchers.push(new RegExp(`(\u5171\u6709\u90E8[\u5206\u4EFD].{0,12}?\u9762\u7A4D)[^\\d]{0,30}${number}${areaUnit}`, "i"));
  } else if (fieldName === "parkingArea") {
    matchers.push(new RegExp(`(\u505C\u8ECA\u4F4D|\u8ECA\u4F4D)[^\\d]{0,80}${number}${areaUnit}`, "i"));
  } else if (fieldName === "mainArea") {
    matchers.push(new RegExp(`(\u4E3B\u5EFA\u7269\u9762\u7A4D|\u4E3B\u5EFA\u7269|\u5C64\u6B21\u9762\u7A4D|\u7E3D\u9762\u7A4D)[^\\d]{0,80}${number}${areaUnit}`, "i"));
  }
  for (const label of labels) {
    matchers.push(new RegExp(`(${escapeRegExp2(label)})[^\\d]{0,80}${number}${areaUnit}`, "i"));
  }
  for (const matcher of matchers) {
    const match = compact.match(matcher);
    if (!match) continue;
    const rawLabel = match[1] || "";
    const rawValue = match[2] || "";
    const rawUnit = match[3] || "";
    if (rawValue && rawUnit) return formatRawAreaSnippet(rawLabel, rawValue, rawUnit);
  }
  return "";
}
function diagnosticAreaRaw(area, fallback = "", fieldName = "", rawText = "", labels = []) {
  if (fieldName === "attachArea" && !area) return null;
  const concise = conciseAreaRawFromText(rawText, fieldName, labels) || conciseAreaRawFromText(fallback, fieldName, labels);
  const structured = formatStructuredAreaRaw(area, fieldName);
  if (structured) return structured;
  if (concise) return concise;
  if (area?.rawValue != null) return `${area.rawValue}${normalizeRawAreaUnit(area.unit || "")}`.trim();
  return "";
}
function ocrRawSnippet(rawText, labels = []) {
  const source = cleanOcrText2(rawText || "").replace(/[*＊]+/g, "").replace(/\s+/g, " ");
  if (!source) return "";
  for (const label of labels) {
    const index = source.indexOf(label);
    if (index >= 0) {
      const snippet = source.slice(index, index + 90);
      const stop = snippet.search(/其他登記事項|建物所有權部|建物他項權利部|土地他項權利部|權狀字號|當期申報地價/);
      return conciseRawText(stop > 0 ? snippet.slice(0, stop) : snippet);
    }
  }
  return "";
}
function floorCountRawSnippet(rawText) {
  const source = cleanOcrText2(rawText || "").replace(/[*＊]+/g, "").replace(/\s+/g, " ");
  if (!source) return "";
  const noisyLabel = source.match(/(?:建物)?(?:層|层|眉)數[:：]?\s*([0-9０-９]{1,3}|[一二三四五六七八九十百千]+)(?![0-9０-９])/);
  if (noisyLabel) return `\u5C64\u6578\uFF1A${normalizeFullWidthDigitsToAscii3(noisyLabel[1])}`;
  const patterns = [
    /(總樓層|總層數|層數|數)[:：]?\s*0*([0-9０-９]{1,3}|[一二三四五六七八九十百千]+)\s*(?:層|樓)/,
    /(層\s*數)[:：]?\s*0*([0-9０-９]{1,3}|[一二三四五六七八九十百千]+)\s*(?:層|樓)/
  ];
  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (match) return conciseRawText(match[0]);
  }
  return ocrRawSnippet(rawText, ["\u5C64\u6578", "\u7E3D\u6A13\u5C64", "\u6A13\u5C64"]);
}
function unitFloorRawSnippet(rawText, unitFloorValue = "") {
  const normalizedValue = parseFloorLevelToken3(String(unitFloorValue || "").replace(/[層樓]/g, ""));
  const directValue = String(unitFloorValue || "").trim();
  const source = cleanOcrText2(rawText || "").replace(/[*＊]+/g, "").replace(/\s+/g, " ");
  if (source) {
    const candidates = [
      /層次[:：]?\s*([0-9０-９一二三四五六七八九十百千壹]+)\s*(?:層|樓)(?!次面積)/g,
      /(?:層\s*)?次[:：]?\s*([0-9０-９一二三四五六七八九十百千壹]+)\s*(?:層|樓)(?!次面積)/g,
      /樓層[:：]?\s*([0-9０-９一二三四五六七八九十百千壹]+)\s*(?:層|樓)?/g
    ];
    for (const pattern of candidates) {
      for (const match of source.matchAll(pattern)) {
        const value = parseFloorLevelToken3(match[1]);
        if (Number.isFinite(normalizedValue) && normalizedValue > 0 && value !== normalizedValue) continue;
        return conciseRawText(match[0]);
      }
    }
    const addressFloor = parseLastFloorFromAddress2(source);
    if (Number.isFinite(normalizedValue) && normalizedValue > 0 && addressFloor === normalizedValue) {
      const match = source.match(/(?:建物門牌|門牌)?[^，。；\n]{0,60}?([0-9０-９一二三四五六七八九十百千壹]+)\s*樓(?:之[0-9０-９一二三四五六七八九十百千壹]+)?/);
      if (match) return conciseRawText(match[0]);
    }
    const snippet = ocrRawSnippet(rawText, ["\u5C64\u6B21", "\u6A13\u5C64"]);
    if (snippet) return snippet;
  }
  if (Number.isFinite(normalizedValue) && normalizedValue > 0) return String(normalizedValue);
  return directValue;
}
function buildingTypeRawSnippet(rawText, typeValue = "") {
  const floorRaw = floorCountRawSnippet(rawText);
  const typeText = String(typeValue || "").trim();
  if (floorRaw && typeText) return `${floorRaw}\uFF0C\u7CFB\u7D71\u5224\u5B9A ${typeText}`;
  return floorRaw || typeText;
}
function resolveBuildingTypeValue(parsed = {}, context = {}, totalFloorValue = "", fallbackTypeValue = "") {
  const parsedForType = parsedWithSupplementalLevelNumbers(parsed, context.rawText || "");
  const explicitType = shouldTreatParsedAsTownhouse(parsedForType, totalFloorValue) ? "\u900F\u5929" : parsed?.foundType || context.buildingType || "";
  if (explicitType) return explicitType;
  if (shouldTreatWholeDoorplateLowRiseAsTownhouse(context.propertyAddress || context.queryAddress || "", totalFloorValue, context.mainAreaPing)) {
    return "\u900F\u5929";
  }
  const floorType = detectTypeByFloors(safeNumber2(totalFloorValue || parsed?.floors || els.totalFloors?.value));
  return floorType || fallbackTypeValue;
}
function addOcrFieldResult(target, fieldName, value, raw, options = {}) {
  const textValue = value == null ? "" : String(value).trim();
  const rawText = raw == null ? "" : String(raw).trim();
  const warnings = Array.isArray(options.warnings) ? options.warnings.filter(Boolean) : [];
  if (!textValue && !warnings.length) warnings.push("\u672A\u8FA8\u8B58");
  target[fieldName] = {
    value: textValue,
    rawOcr: rawText,
    raw: rawText,
    source: options.source || "unknown",
    confidence: Number.isFinite(Number(options.confidence)) ? Number(options.confidence) : null,
    warnings,
    corrections: Array.isArray(options.corrections) ? options.corrections.filter(Boolean) : [],
    needsReview: !!options.needsReview || !textValue && options.source !== "knownFilePreset"
  };
}
function buildKnownPresetOcrFieldResults(fileName, preset, options = {}) {
  const results = {};
  if (!preset) return results;
  const source = "knownFilePreset";
  const confidence = 0.99;
  const warning = ["\u5DF2\u77E5\u6A94\u540D\u4FDD\u5E95\uFF0C\u4E0D\u8996\u70BA OCR \u6210\u529F"];
  addOcrFieldResult(results, "propertyAddress", preset.address || "", preset.address || fileName, { source, confidence, warnings: warning });
  addOcrFieldResult(results, "queryAddress", preset.queryAddress || preset.address || "", preset.queryAddress || preset.address || fileName, { source, confidence, warnings: warning });
  addOcrFieldResult(results, "mainArea", preset.main || "", preset.main ? `${preset.main} \u576A` : "", { source, confidence, warnings: warning });
  addOcrFieldResult(results, "attachArea", preset.attach || "", preset.attach ? `${preset.attach} \u576A` : "", { source, confidence, warnings: warning });
  addOcrFieldResult(results, "commonArea", preset.common || "", preset.common ? `${preset.common} \u576A` : "", { source, confidence, warnings: warning });
  addOcrFieldResult(results, "landShare", preset.land || "", preset.land ? `${preset.land} \u576A` : "", { source, confidence, warnings: warning });
  addOcrFieldResult(results, "parkingArea", preset.parking || "", preset.parking ? `${preset.parking} \u576A` : "", { source, confidence, warnings: warning });
  addOcrFieldResult(results, "parkingCount", preset.parkingCount || "", preset.parkingCount || "", { source, confidence, warnings: warning });
  addOcrFieldResult(results, "totalFloors", preset.floors || "", preset.floors || "", { source, confidence, warnings: warning });
  addOcrFieldResult(results, "unitFloor", preset.unitFloor || "", preset.unitFloor || "", { source, confidence, warnings: warning });
  addOcrFieldResult(results, "buildingType", preset.type || "", preset.type || "", { source, confidence, warnings: warning });
  addOcrFieldResult(results, "purpose", preset.purpose || "", preset.purpose || "", { source, confidence, warnings: warning });
  addOcrFieldResult(results, "completionDate", "", "", { source, confidence: 0, warnings: [] });
  return mergeOcrFieldResultObjects(results, options.extra || {});
}
function mergeOcrFieldResultObjects(primary = {}, fallback = {}) {
  const merged = { ...primary || {} };
  Object.entries(fallback || {}).forEach(([key, value]) => {
    if (!value) return;
    const current = merged[key];
    if (!current) {
      merged[key] = value;
      return;
    }
    const currentRaw = String(current.rawOcr || current.raw || "").trim();
    const fallbackRaw = String(value.rawOcr || value.raw || "").trim();
    const warnings = Array.from(new Set([
      ...Array.isArray(current.warnings) ? current.warnings : [],
      ...Array.isArray(value.warnings) ? value.warnings : []
    ].filter(Boolean)));
    const corrections = [
      ...Array.isArray(current.corrections) ? current.corrections : [],
      ...Array.isArray(value.corrections) ? value.corrections : []
    ].filter(Boolean);
    if (!current.value && value.value) {
      merged[key] = {
        ...value,
        rawOcr: fallbackRaw || currentRaw,
        raw: fallbackRaw || currentRaw,
        warnings,
        corrections
      };
      return;
    }
    if (!currentRaw && fallbackRaw) {
      current.rawOcr = fallbackRaw;
      current.raw = fallbackRaw;
    }
    if ((!current.source || current.source === "unknown") && value.source) current.source = value.source;
    if ((current.confidence == null || !Number.isFinite(Number(current.confidence))) && Number.isFinite(Number(value.confidence))) {
      current.confidence = Number(value.confidence);
    }
    current.warnings = warnings;
    current.corrections = corrections;
  });
  return merged;
}
var AI_ENHANCEMENT_FIELD_MAP = {
  building_address: ["propertyAddress", "queryAddress"],
  main_building_area_ping: ["mainArea"],
  attached_building_area_ping: ["attachArea"],
  common_area_ping: ["commonArea"],
  parking_area_ping: ["parkingArea"],
  parking_count: ["parkingCount"],
  floor: ["unitFloor"],
  total_floor: ["totalFloors"],
  main_usage: ["purpose"],
  completion_date: ["completionDate"]
};
function aiEnhancementReason(item = {}, fallback = "") {
  return String(item.reason || fallback || "").trim();
}
function appendUniqueWarnings(existing = [], additions = []) {
  return Array.from(/* @__PURE__ */ new Set([...Array.isArray(existing) ? existing : [], ...additions.filter(Boolean)]));
}
function applyAiEnhancementToOcrFieldResults(fieldResults = {}, aiEnhancement = {}) {
  if (!aiEnhancement || typeof aiEnhancement !== "object") return fieldResults || {};
  const merged = { ...fieldResults || {} };
  const applyItems = Array.isArray(aiEnhancement.auto_applied) ? aiEnhancement.auto_applied : [];
  for (const item of applyItems) {
    const mapped = AI_ENHANCEMENT_FIELD_MAP[item?.field] || [];
    for (const key of mapped) {
      const existing = merged[key] || {};
      merged[key] = {
        ...existing,
        value: String(item?.value ?? existing.value ?? "").trim(),
        rawOcr: String(item?.evidence || existing.rawOcr || existing.raw || "").trim(),
        source: "minimax_m3_validator",
        confidence: Number.isFinite(Number(item?.confidence)) ? Number(item.confidence) : existing.confidence,
        warnings: appendUniqueWarnings(existing.warnings, [aiEnhancementReason(item, "MiniMax M3 \u5DF2\u6821\u6B63\u6B04\u4F4D")]),
        corrections: [
          ...Array.isArray(existing.corrections) ? existing.corrections : [],
          { reason: aiEnhancementReason(item, "MiniMax M3 \u5DF2\u6821\u6B63\u6B04\u4F4D"), type: "minimax_m3_auto_applied" }
        ],
        needsReview: false
      };
    }
  }
  const reviewItems = Array.isArray(aiEnhancement.needs_review) ? aiEnhancement.needs_review : [];
  for (const item of reviewItems) {
    const mapped = AI_ENHANCEMENT_FIELD_MAP[item?.field] || [];
    for (const key of mapped) {
      const existing = merged[key] || {};
      merged[key] = {
        ...existing,
        warnings: appendUniqueWarnings(existing.warnings, [aiEnhancementReason(item, "MiniMax M3 \u5EFA\u8B70\u4EBA\u5DE5\u78BA\u8A8D")]),
        corrections: [
          ...Array.isArray(existing.corrections) ? existing.corrections : [],
          { reason: aiEnhancementReason(item, "MiniMax M3 \u5EFA\u8B70\u4EBA\u5DE5\u78BA\u8A8D"), type: "minimax_m3_needs_review" }
        ],
        needsReview: true
      };
    }
  }
  const roiEnhancement = aiEnhancement.roi_vision || aiEnhancement.roiVision || {};
  const roiApplyItems = Array.isArray(roiEnhancement.auto_applied) ? roiEnhancement.auto_applied : [];
  for (const item of roiApplyItems) {
    const mapped = AI_ENHANCEMENT_FIELD_MAP[item?.field] || [];
    for (const key of mapped) {
      const existing = merged[key] || {};
      merged[key] = {
        ...existing,
        value: String(item?.value ?? existing.value ?? "").trim(),
        rawOcr: String(item?.evidence || existing.rawOcr || existing.raw || "").trim(),
        source: "minimax_roi_vision",
        confidence: Number.isFinite(Number(item?.confidence)) ? Number(item.confidence) : existing.confidence,
        warnings: appendUniqueWarnings(existing.warnings, [aiEnhancementReason(item, "MiniMax ROI Vision \u5DF2\u6821\u6B63\u6B04\u4F4D")]),
        corrections: [
          ...Array.isArray(existing.corrections) ? existing.corrections : [],
          { reason: aiEnhancementReason(item, "MiniMax ROI Vision \u5DF2\u6821\u6B63\u6B04\u4F4D"), type: "minimax_roi_vision_auto_applied" }
        ],
        needsReview: false
      };
    }
  }
  const roiReviewItems = Array.isArray(roiEnhancement.needs_review) ? roiEnhancement.needs_review : [];
  for (const item of roiReviewItems) {
    const mapped = AI_ENHANCEMENT_FIELD_MAP[item?.field] || [];
    for (const key of mapped) {
      const existing = merged[key] || {};
      merged[key] = {
        ...existing,
        source: existing.source || "minimax_roi_vision",
        warnings: appendUniqueWarnings(existing.warnings, [aiEnhancementReason(item, "MiniMax ROI Vision \u5EFA\u8B70\u4EBA\u5DE5\u78BA\u8A8D")]),
        corrections: [
          ...Array.isArray(existing.corrections) ? existing.corrections : [],
          { reason: aiEnhancementReason(item, "MiniMax ROI Vision \u5EFA\u8B70\u4EBA\u5DE5\u78BA\u8A8D"), type: "minimax_roi_vision_needs_review" }
        ],
        needsReview: true
      };
    }
  }
  return merged;
}
function buildOcrFieldResultsFromParsed(parsed = {}, context = {}) {
  const source = context.source || "unknown";
  const confidence = Number.isFinite(Number(context.confidence)) ? Number(context.confidence) : 0.85;
  const rawText = context.rawText || parsed?.text || "";
  const fields = context.fields || {};
  const warnings = Array.isArray(context.warnings) ? context.warnings.filter(Boolean) : [];
  const allowDomFallback = context.allowDomFallback !== false;
  const preferBackendFields = context.preferBackendFields === true;
  const domFallback = (value) => allowDomFallback ? value : "";
  const results = {};
  const area = (fieldName, parsedArea, fallbackValue, labels) => {
    const hasFallback = String(fallbackValue ?? "").trim() !== "";
    const value = preferBackendFields && hasFallback ? fallbackValue : parsedArea?.valuePing ?? fallbackValue ?? "";
    const raw = diagnosticAreaRaw(parsedArea, ocrRawSnippet(rawText, labels), fieldName, rawText, labels);
    addOcrFieldResult(results, fieldName, value, raw, { source, confidence, warnings });
  };
  area("mainArea", parsed?.main, fields.main_building_area_ping ?? domFallback(els.mainArea?.value), ["\u4E3B\u5EFA\u7269\u9762\u7A4D", "\u4E3B\u5EFA\u7269", "\u5C64\u6B21\u9762\u7A4D", "\u7E3D\u9762\u7A4D"]);
  area("attachArea", parsed?.attach, fields.attached_building_area_ping ?? domFallback(els.attachArea?.value), ["\u9644\u5C6C\u5EFA\u7269\u9762\u7A4D", "\u9644\u5C6C\u5EFA\u7269", "\u967D\u53F0", "\u96E8\u906E"]);
  area("commonArea", parsed?.common, fields.common_area_ping ?? domFallback(els.commonArea?.value), ["\u5171\u6709\u90E8\u5206", "\u5171\u6709\u90E8\u4EFD", "\u6B0A\u5229\u7BC4\u570D"]);
  const landValue = parsed?.landShare?.valuePing ?? domFallback(els.landShareArea?.value);
  const landRaw = parsed?.landShare?.entries?.length ? parsed.landShare.entries.map((entry) => {
    const parcel = entry.parcel ? `${entry.parcel} ` : "";
    const areaText = entry.areaText || entry.area || "";
    const unit = normalizeRawAreaUnit(entry.unit || "\u5E73\u65B9\u516C\u5C3A");
    const rights = entry.rights || formatRightsFromRatio2(entry.ratio);
    return `${parcel}\u571F\u5730\u9762\u7A4D ${areaText}${unit} \u6B0A\u5229\u7BC4\u570D ${rights}`.trim();
  }).join("\n") : landValue ? stripPingFromAreaRaw(els.landShareRaw?.value || ocrRawSnippet(rawText, ["\u571F\u5730\u6A19\u793A\u90E8", "\u571F\u5730\u9762\u7A4D", "\u6B0A\u5229\u7BC4\u570D"])) : "";
  addOcrFieldResult(results, "landShare", landValue, landRaw, { source, confidence, warnings });
  const backendParkingArea = fields.parking_area_ping ?? null;
  const parkingAreaValue = preferBackendFields && backendParkingArea != null ? backendParkingArea : parsed?.parkingDeedShare?.valuePing ?? backendParkingArea ?? domFallback(els.parkingArea?.value);
  const parkingAreaRaw = parsed?.parkingDeedShare?.valuePing != null || backendParkingArea != null ? diagnosticAreaRaw(parsed?.parkingDeedShare, ocrRawSnippet(rawText, ["\u8ECA\u4F4D\u7DE8\u865F", "\u505C\u8ECA\u4F4D\u7DE8\u865F"]), "parkingArea", rawText, ["\u8ECA\u4F4D\u7DE8\u865F", "\u505C\u8ECA\u4F4D\u7DE8\u865F"]) : "";
  addOcrFieldResult(results, "parkingArea", parkingAreaValue, parkingAreaRaw, { source, confidence, warnings });
  const parkingCountValue = fields.parking_count ?? parsed?.parkingCount ?? parsed?.parkingDeedShare?.count ?? domFallback(els.parkingCount?.value);
  const parkingCountRaw = parkingCountValue ? ocrRawSnippet(rawText, ["\u8ECA\u4F4D\u7DE8\u865F", "\u505C\u8ECA\u4F4D\u7DE8\u865F"]) : "";
  addOcrFieldResult(results, "parkingCount", parkingCountValue, parkingCountRaw, { source, confidence, warnings });
  const propertyAddress = fields.building_address || parsed?.propertyAddress || parsed?.address || context.queryAddress || domFallback(els.subjectAddress?.value) || "";
  addOcrFieldResult(results, "propertyAddress", propertyAddress, propertyAddress || ocrRawSnippet(rawText, ["\u5EFA\u7269\u9580\u724C", "\u9580\u724C"]), { source, confidence, warnings });
  addOcrFieldResult(results, "queryAddress", domFallback(els.subjectAddress?.value) || context.queryAddress || propertyAddress, context.queryAddress || propertyAddress, { source, confidence, warnings });
  const totalFloorValue = fields.total_floor || parsed?.floors || domFallback(els.totalFloors?.value);
  addOcrFieldResult(results, "totalFloors", totalFloorValue, floorCountRawSnippet(rawText), { source, confidence, warnings });
  const unitFloorValue = fields.floor || parsed?.unitFloor || domFallback(els.floorFilter?.value);
  addOcrFieldResult(results, "unitFloor", unitFloorValue, unitFloorRawSnippet(rawText, unitFloorValue), { source, confidence, warnings });
  const buildingTypeValue = resolveBuildingTypeValue(parsed, {
    ...context,
    propertyAddress,
    mainAreaPing: fields.main_building_area_ping ?? parsed?.main?.valuePing
  }, totalFloorValue, domFallback(els.houseType?.value));
  addOcrFieldResult(results, "buildingType", buildingTypeValue, parsed?.foundType || context.buildingTypeRaw || buildingTypeRawSnippet(rawText, buildingTypeValue), { source, confidence, warnings });
  const purposeValue = fields.main_usage || parsed?.purpose || selectedMainPurposes().join("\u3001");
  const purposeRaw = ocrRawSnippet(rawText, ["\u4E3B\u8981\u7528\u9014"]) || fields.main_usage || parsed?.purpose || "";
  addOcrFieldResult(results, "purpose", purposeValue, purposeRaw, { source, confidence, warnings });
  addOcrFieldResult(results, "completionDate", fields.completion_date || parsed?.completionDateText || "", fields.completion_date || parsed?.completionDateText || ocrRawSnippet(rawText, ["\u5EFA\u7BC9\u5B8C\u6210\u65E5\u671F"]), { source, confidence, warnings });
  if (context.preset) {
    return mergeOcrFieldResultObjects(results, buildKnownPresetOcrFieldResults(context.fileName || "", context.preset));
  }
  return results;
}
var BACKEND_DIAGNOSTIC_FIELD_MAP = {
  propertyAddress: "building_address",
  queryAddress: "building_address",
  mainArea: "main_building_area_ping",
  attachArea: "attached_building_area_ping",
  commonArea: "common_area_ping",
  landShare: "land_share",
  parkingArea: "parking_area_ping",
  parkingCount: "parking_count",
  totalFloors: "total_floor",
  unitFloor: "floor",
  purpose: "main_usage",
  completionDate: "completion_date"
};
function backendDiagnosticFieldValue(fields = {}, backendKey = "", result = {}) {
  const value = fields?.[backendKey];
  if (value !== void 0 && value !== null && String(value).trim() !== "") return value;
  const resultValue = result?.value;
  return resultValue === void 0 || resultValue === null ? "" : resultValue;
}
function backendDiagnosticRaw(diagnostics = {}, backendKey = "", result = {}) {
  return result?.raw || diagnostics?.raw_snippets?.[backendKey] || "";
}
function backendDiagnosticWarnings(diagnostics = {}, backendKey = "", generalWarnings = []) {
  const fieldWarnings = Array.isArray(diagnostics?.warnings_structured) ? diagnostics.warnings_structured.filter((warning) => !warning?.field || String(warning.field).startsWith(String(backendKey).replace(/_(sqm|ping)$/, ""))).map((warning) => warning.reason || warning.action || "").filter(Boolean) : [];
  return Array.from(/* @__PURE__ */ new Set([...generalWarnings || [], ...fieldWarnings]));
}
function buildOcrFieldResultsFromBackendDiagnostics(diagnostics = {}, context = {}) {
  const fieldResults = diagnostics?.field_results || {};
  if (!fieldResults || typeof fieldResults !== "object" || !Object.keys(fieldResults).length) return {};
  const source = context.source || diagnostics.ocr_engine_used || "ocr_pipeline";
  const fields = context.fields || {};
  const generalWarnings = Array.isArray(context.warnings) ? context.warnings : [];
  const results = {};
  Object.entries(BACKEND_DIAGNOSTIC_FIELD_MAP).forEach(([fieldName, backendKey]) => {
    const backendResult = fieldResults[backendKey] || {};
    const value = backendDiagnosticFieldValue(fields, backendKey, backendResult);
    const raw = backendDiagnosticRaw(diagnostics, backendKey, backendResult);
    if (String(value ?? "").trim() === "" && String(raw ?? "").trim() === "") return;
    const confidence = Number.isFinite(Number(backendResult.confidence)) ? Number(backendResult.confidence) : Number.isFinite(Number(diagnostics?.field_scores?.[backendKey])) ? Number(diagnostics.field_scores[backendKey]) : context.confidence;
    addOcrFieldResult(results, fieldName, value, raw, {
      source: backendResult.source_engine || source,
      confidence,
      warnings: backendDiagnosticWarnings(diagnostics, backendKey, Array.isArray(backendResult.warnings) ? backendResult.warnings : generalWarnings),
      corrections: backendResult.rule ? [{ reason: backendResult.rule }] : []
    });
  });
  return results;
}
function ocrFieldStatusText(result = {}) {
  const hasValue = String(result.value ?? "").trim() !== "";
  const confidence = Number(result.confidence);
  if (!hasValue) return { text: "\u672A\u63A1\u7528", className: "ocr-muted" };
  if (result.source === "knownFilePreset") return { text: "\u4FDD\u5E95\u5E36\u5165", className: "ocr-review" };
  if (Number.isFinite(confidence) && confidence < 0.75) return { text: "\u63A1\u7528\uFF0C\u8ACB\u6AA2\u67E5", className: "ocr-review" };
  return { text: "\u81EA\u52D5\u63A1\u7528", className: "ocr-auto" };
}
function stripPingFromAreaRaw(value) {
  return String(value ?? "").replace(/\s*[／/]\s*[\d,.]+\s*坪/g, "").replace(/\s*\/\s*[\d,.]+\s*坪/g, "").replace(/\s*=\s*[\d,.]+\s*坪/g, "").trim();
}
var OCR_WARNING_TRANSLATIONS = [
  [/PDF OCR limited to first\s+(\d+)\s+of\s+(\d+)\s+pages/i, (m) => `PDF \u5FEB\u901F\u6A21\u5F0F\u50C5\u8FA8\u8B58\u524D ${m[1]}/${m[2]} \u9801`],
  [/page\s+(\d+)\s+used fast single-pass OCR/i, (m) => `\u7B2C ${m[1]} \u9801\u63A1\u5FEB\u901F OCR\uFF0C\u672A\u4E8C\u6B21\u524D\u8655\u7406`],
  [/main_building_area was not confidently parsed/i, () => "\u4E3B\u5EFA\u7269\u9762\u7A4D\u4FE1\u5FC3\u4E0D\u8DB3"],
  [/attached_building_area was not confidently parsed/i, () => "\u9644\u5C6C\u5EFA\u7269\u9762\u7A4D\u4FE1\u5FC3\u4E0D\u8DB3"],
  [/common_area was not confidently parsed/i, () => "\u5171\u6709\u90E8\u5206\u9762\u7A4D\u4FE1\u5FC3\u4E0D\u8DB3"],
  [/land_share was not confidently parsed/i, () => "\u571F\u5730\u6301\u5206\u4FE1\u5FC3\u4E0D\u8DB3"],
  [/main_usage was not confidently parsed/i, () => "\u4E3B\u8981\u7528\u9014\u4FE1\u5FC3\u4E0D\u8DB3"],
  [/completion_date was not confidently parsed/i, () => "\u5EFA\u7BC9\u5B8C\u6210\u65E5\u671F\u4FE1\u5FC3\u4E0D\u8DB3"],
  [/building_address was not confidently parsed/i, () => "\u5EFA\u7269\u9580\u724C\u4FE1\u5FC3\u4E0D\u8DB3"],
  [/native worker binary missing/i, () => "\u539F\u751F OCR \u7A0B\u5F0F\u5C1A\u672A\u5B89\u88DD"],
  [/native worker model directory missing|native worker model files missing|native worker model missing/i, () => "\u539F\u751F OCR \u6A21\u578B\u5C1A\u672A\u5B89\u88DD"],
  [/native worker timeout/i, () => "\u539F\u751F OCR \u903E\u6642"],
  [/native worker returned invalid JSON/i, () => "\u539F\u751F OCR \u56DE\u50B3\u683C\u5F0F\u7570\u5E38"],
  [/Docker PaddleOCR fallback used/i, () => "\u5DF2\u6539\u7528 Docker PaddleOCR \u88DC\u5F37"],
  [/Docker PaddleOCR fallback skipped/i, () => "Docker PaddleOCR \u672A\u555F\u7528\u6216\u7121\u6CD5\u9023\u7DDA"],
  [/Docker PaddleOCR fallback failed/i, () => "Docker PaddleOCR \u8FA8\u8B58\u5931\u6557"],
  [/Docker PaddleOCR returned malformed JSON|Docker PaddleOCR returned malformed response/i, () => "Docker PaddleOCR \u56DE\u50B3\u683C\u5F0F\u7570\u5E38"],
  [/Docker PaddleOCR returned no text/i, () => "Docker PaddleOCR \u672A\u8B80\u5230\u6587\u5B57"],
  [/PP-Structure/i, () => "PP-Structure \u5DF2\u79FB\u51FA\u4E3B\u6D41\u7A0B"],
  [/Gemini 2\.5 Flash|gemini_2_5_flash|Gemini API/i, () => "Gemini 2.5 Flash \u5DF2\u79FB\u9664"],
  [/PaddleOCR-VL|PaddleOCR_VL/i, () => "PaddleOCR-VL 0.9B \u5DF2\u79FB\u9664"],
  [/native OCR fallback used macOS Vision OCR/i, () => "\u820A\u7248 macOS Vision \u5099\u63F4\u8A0A\u606F\uFF08\u672C\u7248\u5DF2\u505C\u7528\uFF09"],
  [/macOS Vision OCR returned no text/i, () => "macOS Vision \u5DF2\u505C\u7528"],
  [/macOS Vision OCR timeout/i, () => "macOS Vision \u5DF2\u505C\u7528"],
  [/macOS Vision OCR failed/i, () => "macOS Vision \u5DF2\u505C\u7528"],
  [/macOS Vision OCR binary missing/i, () => "macOS Vision \u5DF2\u505C\u7528"],
  [/native OCR fallback used Tesseract CLI/i, () => "\u820A\u7248 Tesseract \u5099\u63F4\u8A0A\u606F\uFF08\u672C\u7248\u5DF2\u505C\u7528\uFF09"],
  [/tesseract OCR returned no text/i, () => "Tesseract \u5DF2\u505C\u7528"],
  [/tesseract OCR timeout/i, () => "Tesseract \u5DF2\u505C\u7528"],
  [/tesseract OCR failed/i, () => "Tesseract \u5DF2\u505C\u7528"],
  [/tesseract language data missing/i, () => "Tesseract \u5DF2\u505C\u7528"],
  [/PaddleOCR 未完成，採快速解析結果|OCR 後端未完成，採快速解析結果/i, () => "OCR \u5F8C\u7AEF\u672A\u5B8C\u6210\uFF0C\u63A1\u5FEB\u901F\u89E3\u6790"],
  [/未辨識/i, () => "\u672A\u8FA8\u8B58"]
];
var OCR_FIELD_WARNING_PATTERNS = {
  propertyAddress: [/building_address|address|建物門牌|門牌/i],
  queryAddress: [/building_address|address|查詢地址|建物門牌|門牌/i],
  mainArea: [/main_building_area|主建物/i],
  attachArea: [/attached_building_area|附屬|陽台/i],
  commonArea: [/common_area|共有/i],
  landShare: [/land_share|土地持分|土地/i],
  parkingArea: [/parking|車位|停車/i],
  parkingCount: [/parking|車位|停車/i],
  totalFloors: [/total_floor|總樓層|層數/i],
  unitFloor: [/unit_floor|floor|標的樓層|層次/i],
  buildingType: [/building_type|建物型態/i],
  purpose: [/main_usage|主要用途/i],
  completionDate: [/completion_date|建築完成日期/i]
};
function translateOcrWarning(warning) {
  const text = String(warning || "").trim();
  if (!text) return "";
  for (const [pattern, formatter] of OCR_WARNING_TRANSLATIONS) {
    const match = text.match(pattern);
    if (match) return formatter(match);
  }
  return text.replace(/_/g, " ").replace(/\s+/g, " ").trim().slice(0, 48);
}
function warningMatchesField(fieldName, warning) {
  const text = String(warning || "");
  if (/未辨識/.test(text)) return true;
  return (OCR_FIELD_WARNING_PATTERNS[fieldName] || []).some((pattern) => pattern.test(text));
}
function uniqueBriefWarnings(warnings = []) {
  const seen = /* @__PURE__ */ new Set();
  const output = [];
  for (const warning of warnings) {
    const translated = translateOcrWarning(warning);
    if (!translated || seen.has(translated)) continue;
    seen.add(translated);
    output.push(translated);
  }
  return output;
}
function fieldWarningText(fieldName, warnings = []) {
  return uniqueBriefWarnings(warnings.filter((warning) => warningMatchesField(fieldName, warning))).slice(0, 3).join("\uFF1B");
}
function genericWarningText(fieldResults = {}) {
  const all = Object.values(fieldResults || {}).flatMap((result) => Array.isArray(result?.warnings) ? result.warnings : []);
  return uniqueBriefWarnings(all.filter((warning) => {
    const text = String(warning || "");
    return /PDF OCR limited|PDF OCR 僅處理|single-pass OCR|快速 OCR|PaddleOCR 未完成|OCR 後端未完成|原生 ncnn OCR|native worker|macOS Vision|Tesseract|Docker PaddleOCR|PP-Structure|PaddleOCR-VL|MiniMax M3|MiniMax ROI Vision/i.test(text);
  })).slice(0, 4).join("\uFF1B");
}
function buildOcrWarningRow(label, text, colspan = 6) {
  if (!text) return "";
  return `<tr class="ocr-warning-row"><td>${escapeHtml(label)}</td><td colspan="${colspan}">\u8B66\u793A\uFF1A${escapeHtml(text)}</td></tr>`;
}
function ocrCorrectionText(result = {}) {
  const corrections = Array.isArray(result?.corrections) ? result.corrections : [];
  return corrections.map((item) => {
    if (item == null) return "";
    if (typeof item === "string") return item;
    return [item.type, item.reason, item.from, item.to].filter(Boolean).join(" ");
  }).filter(Boolean).join(" ");
}
function ocrBadgeSourceText(result = {}) {
  return [result?.source, ocrCorrectionText(result), ...Array.isArray(result?.warnings) ? result.warnings : []].join(" ");
}
function aiKeysForOcrField(fieldName) {
  return Object.entries(AI_ENHANCEMENT_FIELD_MAP).filter(([, fields]) => fields.includes(fieldName)).map(([key]) => key);
}
function fieldHasAiEnhancementItem(enhancement = {}, fieldName = "", bucket = "") {
  if (!enhancement || typeof enhancement !== "object") return false;
  const keys = aiKeysForOcrField(fieldName);
  const items = Array.isArray(enhancement[bucket]) ? enhancement[bucket] : [];
  return items.some((item) => keys.includes(String(item?.field || "")));
}
function pushOcrFieldBadge(badges, label, className, title = "") {
  if (!label || badges.some((badge) => badge.label === label)) return;
  badges.push({ label, className, title });
}
function buildOcrFieldBadges(fieldName, result = {}, meta = {}) {
  const badges = [];
  const ai = meta.ai_enhancement || meta.aiEnhancement || {};
  const roi = meta.roi_enhancement || meta.roiEnhancement || ai.roi_vision || ai.roiVision || {};
  const sourceText = ocrBadgeSourceText(result);
  const confidence = Number(result?.confidence);
  if (result?.needsReview || /needs_review|人工確認|人工複核|需人工|請檢查/i.test(sourceText)) {
    pushOcrFieldBadge(badges, "\u9700\u4EBA\u5DE5\u78BA\u8A8D", "ocr-badge-review", "\u6B64\u6B04\u4F4D\u88AB\u6A19\u8A18\u70BA\u9700\u4EBA\u5DE5\u78BA\u8A8D");
  }
  if (/minimax_roi_vision|MiniMax ROI Vision/i.test(sourceText) || fieldHasAiEnhancementItem(roi, fieldName, "auto_applied")) {
    pushOcrFieldBadge(badges, "MiniMax ROI Vision \u5DF2\u6821\u6B63", "ocr-badge-ai", "MiniMax ROI Vision \u5DF2\u5957\u7528\u6821\u6B63");
  }
  if (/minimax_m3|MiniMax M3/i.test(sourceText) || fieldHasAiEnhancementItem(ai, fieldName, "auto_applied")) {
    pushOcrFieldBadge(badges, "MiniMax M3 \u5DF2\u6821\u6B63", "ocr-badge-ai", "MiniMax M3 \u5DF2\u5957\u7528\u6821\u6B63");
  }
  if (/rejected|not_applied|未套用|建議未套用/i.test(sourceText) || fieldHasAiEnhancementItem(ai, fieldName, "rejected") || fieldHasAiEnhancementItem(roi, fieldName, "rejected")) {
    pushOcrFieldBadge(badges, "AI \u5EFA\u8B70\u672A\u5957\u7528", "ocr-badge-muted", "AI \u6709\u5EFA\u8B70\u4F46\u672A\u7B26\u5408\u81EA\u52D5\u5957\u7528\u689D\u4EF6");
  }
  if (Number.isFinite(confidence) && confidence >= 0.86 && !/minimax/i.test(sourceText)) {
    pushOcrFieldBadge(badges, "Parser \u9AD8\u4FE1\u5FC3", "ocr-badge-parser", "\u6B04\u4F4D parser \u4FE1\u5FC3\u9054 0.86 \u4EE5\u4E0A");
  }
  if (/ppocrv5|ncnn|pdf_text_layer|pdfTextLayer|macos_vision|native_ocr/i.test(String(result?.source || ""))) {
    pushOcrFieldBadge(badges, "\u672C\u6A5F OCR", "ocr-badge-local", "\u7531\u672C\u6A5F OCR \u6216 PDF \u6587\u5B57\u5C64\u63D0\u4F9B");
  }
  return badges.slice(0, 3);
}
function renderOcrFieldBadges(fieldName, result = {}, meta = {}) {
  const badges = buildOcrFieldBadges(fieldName, result, meta);
  if (!badges.length) return "";
  return `<div class="ocr-field-badges">${badges.map((badge) => `<span class="ocr-field-badge ${escapeHtml(badge.className)}" title="${escapeHtml(badge.title)}">${escapeHtml(badge.label)}</span>`).join("")}</div>`;
}
function candidateComparisonReasonText(reason = "") {
  const text = String(reason || "").trim();
  const translated = {
    "current text empty": "\u76EE\u524D OCR \u7121\u6587\u5B57\uFF0C\u63A1\u7528\u5019\u9078",
    "field score improved": "\u6B04\u4F4D\u5206\u6578\u660E\u986F\u63D0\u5347",
    "critical fields filled": "\u88DC\u8DB3\u95DC\u9375\u6B04\u4F4D\u4E14\u672A\u885D\u7A81",
    "field score not clearly better": "\u6B04\u4F4D\u5206\u6578\u672A\u660E\u986F\u63D0\u5347",
    "common area rights supplemented": "\u88DC\u8DB3\u5171\u6709\u90E8\u5206\u6B0A\u5229\u7BC4\u570D",
    "native deed needs field supplement": "\u539F\u751F OCR \u9700\u8981\u6B04\u4F4D\u88DC\u5F37",
    "previous OCR engine returned fallback_none": "\u524D\u4E00\u968E\u6BB5\u6C92\u6709\u53EF\u7528 OCR \u6587\u5B57",
    "OCR text too short": "OCR \u6587\u5B57\u904E\u77ED",
    "OCR confidence below threshold": "OCR \u4FE1\u5FC3\u4F4E\u65BC\u9580\u6ABB",
    "native OCR unavailable": "\u539F\u751F OCR \u4E0D\u53EF\u7528"
  }[text];
  if (translated) return translated;
  if (/deed field score too low/i.test(text)) return "\u8B04\u672C\u6B04\u4F4D\u5206\u6578\u504F\u4F4E";
  return translateOcrWarning(text);
}
function buildCandidateComparisonRow(meta = {}) {
  const comparison = meta.candidateComparison || meta.candidate_comparison || null;
  if (!comparison || typeof comparison !== "object" || comparison.available !== true) return "";
  const comparisons = Array.isArray(comparison.comparisons) ? comparison.comparisons : [];
  const adopted = Array.isArray(comparison.adopted) ? comparison.adopted : [];
  const item = adopted[adopted.length - 1] || comparison.last || comparisons[comparisons.length - 1] || null;
  if (!item) return "";
  const stateText = item.adopted ? "\u5DF2\u63A1\u7528" : "\u672A\u63A1\u7528";
  const source = ocrSourceLabel(item.provider || item.candidate_engine || "");
  const scoreText = [
    item.current_score != null ? `\u539F ${item.current_score}/${item.score_denominator || 8}` : "",
    item.candidate_score != null ? `\u5019\u9078 ${item.candidate_score}/${item.score_denominator || 8}` : ""
  ].filter(Boolean).join("\uFF0C");
  const raw = [
    source,
    scoreText,
    candidateComparisonReasonText(item.reason),
    item.trigger_reason ? `\u89F8\u767C\uFF1A${candidateComparisonReasonText(item.trigger_reason)}` : ""
  ].filter(Boolean).join("\uFF1B");
  return `<tr class="ocr-token-row"><td>OCR \u5019\u9078\u6BD4\u8F03</td><td>${escapeHtml(source || "\u5019\u9078\u88DC\u5F37")}</td><td class="ocr-muted">--</td><td class="ocr-muted">--</td><td class="${item.adopted ? "ocr-auto" : "ocr-review"}">${escapeHtml(stateText)}</td><td class="ocr-raw-cell">${escapeHtml(raw)}</td><td>${escapeHtml(comparisons.length ? `${comparisons.length} \u7B46\u6BD4\u8F03` : "--")}</td></tr>`;
}
function fallbackProviderListText(values = []) {
  const providers = Array.isArray(values) ? values : [];
  return providers.map((provider) => ocrSourceLabel(provider)).filter(Boolean).join("\u3001");
}
function buildFallbackSummaryRow(meta = {}) {
  const fallbacks = meta.fallbacks || meta.fallback_summary || null;
  if (!fallbacks || typeof fallbacks !== "object" || fallbacks.available !== true) return "";
  const tried = fallbackProviderListText(fallbacks.providers_tried);
  const adopted = fallbackProviderListText(fallbacks.providers_adopted);
  const rejected = fallbackProviderListText(fallbacks.providers_rejected);
  const stateText = adopted ? "\u5DF2\u63A1\u7528" : tried ? "\u5DF2\u6AA2\u67E5" : "\u8A18\u9304";
  const sourceText = adopted || tried || ocrSourceLabel(fallbacks.last_provider) || "\u5099\u63F4\u6D41\u7A0B";
  const raw = [
    tried ? `\u5617\u8A66\uFF1A${tried}` : "",
    adopted ? `\u63A1\u7528\uFF1A${adopted}` : "",
    rejected ? `\u672A\u63A1\u7528\uFF1A${rejected}` : "",
    fallbacks.fallback_reason ? `\u539F\u56E0\uFF1A${candidateComparisonReasonText(fallbacks.fallback_reason)}` : ""
  ].filter(Boolean).join("\uFF1B");
  const count = Number(fallbacks.comparison_count || 0);
  return `<tr class="ocr-token-row"><td>OCR \u5099\u63F4\u6458\u8981</td><td>${escapeHtml(sourceText)}</td><td class="ocr-muted">--</td><td class="ocr-muted">--</td><td class="${adopted ? "ocr-auto" : "ocr-muted"}">${escapeHtml(stateText)}</td><td class="ocr-raw-cell">${escapeHtml(raw || "\u7121\u5099\u63F4\u63A1\u7528")}</td><td>${escapeHtml(count ? `${count} \u7B46\u6BD4\u8F03` : "--")}</td></tr>`;
}
function ocrFieldRawDisplay(fieldName, result = {}) {
  const raw = result.rawOcr ?? result.raw_ocr ?? result.raw ?? "";
  if (!OCR_AREA_FIELD_NAMES.has(fieldName)) return String(raw ?? "");
  const concise = conciseAreaRawFromText(raw, fieldName);
  if (concise) return concise;
  const stripped = stripPingFromAreaRaw(raw);
  return stripped;
}
function formatOcrFieldValue(fieldName, value) {
  const text = String(value ?? "").trim();
  if (!text || !OCR_AREA_FIELD_NAMES.has(fieldName)) return text;
  if (/坪/.test(text)) return text;
  const numeric = Number(text.replace(/,/g, ""));
  return Number.isFinite(numeric) ? `${Number(numeric.toFixed(3))} \u576A` : text;
}
function renderOcrFieldDiagnostics(fieldResults = null, meta = {}) {
  lastOcrFieldResults = fieldResults || {};
  lastOcrDiagnosticsMeta = meta || {};
  exposeOcrDiagnosticsDebug();
  if (!els.ocrFieldDiagnostics) return;
  if (!fieldResults || !Object.keys(fieldResults).length) {
    clearOcrFieldDiagnostics();
    return;
  }
  const timing = meta.ocrTiming || {};
  const rows = Object.entries(OCR_FIELD_LABELS).map(([fieldName, label]) => {
    const result = fieldResults[fieldName] || {};
    const status = ocrFieldStatusText(result);
    const rawValue = ocrFieldRawDisplay(fieldName, result);
    const confidence = Number.isFinite(Number(result.confidence)) ? `${Math.round(Number(result.confidence) * 100)}%` : "--";
    const warnings = fieldWarningText(fieldName, Array.isArray(result.warnings) ? result.warnings : []);
    const timingText = result.elapsedMs != null ? formatElapsedMs(result.elapsedMs) : formatElapsedMs(timing.elapsedMs);
    const badges = renderOcrFieldBadges(fieldName, result, meta);
    const dataRow = `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(ocrSourceLabel(result.source))}</td><td>${escapeHtml(timingText)}</td><td class="ocr-confidence">${escapeHtml(confidence)}</td><td class="${status.className}">${escapeHtml(status.text)}${badges}</td><td class="ocr-raw-cell">${escapeHtml(rawValue)}</td><td>${escapeHtml(formatOcrFieldValue(fieldName, result.value))}</td></tr>`;
    return `${dataRow}${buildOcrWarningRow(label, warnings)}`;
  }).join("");
  const timingRow = timing.elapsedMs != null ? `<tr class="ocr-token-row"><td>\u8B04\u672C OCR \u8A08\u6642</td><td>${escapeHtml(ocrSourceLabel(timing.source))}</td><td>${escapeHtml(formatElapsedMs(timing.elapsedMs))}</td><td class="ocr-muted">--</td><td class="ocr-muted">\u8A18\u9304</td><td class="ocr-raw-cell">${escapeHtml(timing.cacheHit ? "\u5FEB\u53D6\u547D\u4E2D" : translateOcrWarning(timing.note || ""))}</td><td>${escapeHtml(formatElapsedMs(timing.elapsedMs))}</td></tr>` : "";
  const candidateComparisonRow = buildCandidateComparisonRow(meta);
  const fallbackSummaryRow = buildFallbackSummaryRow(meta);
  const genericWarnings = buildOcrWarningRow("\u6D41\u7A0B\u8B66\u793A", genericWarningText(fieldResults));
  els.ocrFieldDiagnostics.innerHTML = `<div class="ocr-diagnostics-title"><span>\u6B04\u4F4D\u8FA8\u8B58\u8A3A\u65B7</span><span class="ocr-muted">raw \u53EA\u986F\u793A\u5C0D\u61C9\u6B04\u4F4D OCR \u539F\u6587\uFF1Bvalue \u986F\u793A\u7CFB\u7D71\u63A1\u7528\u503C\uFF0C\u9762\u7A4D\u4E00\u5F8B\u6B63\u898F\u5316\u70BA\u576A</span></div><table><thead><tr><th>\u6B04\u4F4D</th><th>\u4F86\u6E90</th><th>OCR\u8A08\u6642</th><th>\u4FE1\u5FC3</th><th>\u72C0\u614B</th><th>raw\uFF08OCR\u539F\u6587\uFF09</th><th>value\uFF08\u9762\u7A4D=\u576A\uFF09</th></tr></thead><tbody>${timingRow}${candidateComparisonRow}${fallbackSummaryRow}${genericWarnings}${rows}</tbody></table>`;
  syncOcrDiagnosticsButton(true);
  setOcrDiagnosticsOpen(els.ocrFieldDiagnostics.dataset.manual === "open");
}
async function copyFieldValue(input, okText, emptyText) {
  const value = String(input?.value || "").trim();
  if (!value) {
    setMessage2("warn", emptyText);
    return;
  }
  await navigator.clipboard.writeText(value);
  setMessage2("ok", okText);
}
function toHalfWidth3(text) {
  return String(text || "").normalize("NFKC").replace(/\(([零〇一二三四五六七八九十百千壹貳參肆伍陸柒捌玖拾]+)\)/g, "$1").replace(/\u3000/g, " ").replace(/[！-～]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 65248)).replace(/[臺]/g, "\u53F0").replace(/[㈯]/g, "\u571F").replace(/[㈲]/g, "\u6709").replace(/[㈰]/g, "\u65E5").replace(/[㈪]/g, "\u6708").replace(/[㈾]/g, "\u8CC7").replace(/[㊠]/g, "\u9805").replace(/[㊞]/g, "\u5370").replace(/[㊟]/g, "\u6CE8").replace(/[㉂]/g, "\u81EA").replace(/[㉃]/g, "\u81F3").replace(/[㆞]/g, "\u5730").replace(/[㆒]/g, "\u4E00").replace(/[㆓]/g, "\u4E8C").replace(/[㆔]/g, "\u4E09").replace(/[㆕]/g, "\u56DB");
}
function cleanOcrText2(text) {
  return toHalfWidth3(String(text || "")).replace(/⺠/g, "\u6C11").replace(/佳圆/g, "\u4F73\u5712").replace(/高牌號|高牌号/g, "\u9580\u724C\u865F").replace(/建第完成日期|建第完成曰期/g, "\u5EFA\u7BC9\u5B8C\u6210\u65E5\u671F").replace(/建物眉數/g, "\u5EFA\u7269\u5C64\u6578").replace(/利幢/g, "\u6B0A\u5229\u7BC4\u570D").replace(/建号/g, "\u5EFA\u865F").replace(/编號/g, "\u7DE8\u865F").replace(/合停車位/g, "\u542B\u505C\u8ECA\u4F4D").replace(/树林/g, "\u6A39\u6797").replace(/数/g, "\u6578").replace(/层/g, "\u5C64").replace(/楼/g, "\u6A13").replace(/屏/g, "\u5C64").replace(/阳台/g, "\u967D\u53F0").replace(/花臺|花合|花喜/g, "\u82B1\u53F0").replace(/兩遮|函遮|雨造/g, "\u96E8\u906E").replace(/[：:]/g, ":").replace(/權利:/g, "\u6B0A\u5229\u7BC4\u570D:").replace(/\r/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
function compactOcrText2(text) {
  return cleanOcrText2(text).replace(/[*＊]+/g, "").replace(/[ \t]+/g, "").replace(/\n+/g, "");
}
function normalizeArea2(rawValue, unit, ratio = 1) {
  const numeric = Number(String(rawValue || "").replace(/,/g, ""));
  if (!Number.isFinite(numeric)) return null;
  const adjusted = numeric * ratio;
  const ping = /平方公尺|平方?米|m2|㎡/i.test(unit) ? adjusted / 3.305785 : adjusted;
  return { rawValue: numeric, adjustedValue: +adjusted.toFixed(3), unit, valuePing: +ping.toFixed(3) };
}
function normalizeParkingRightsShare2(rawValue, unit = "\u5E73\u65B9\u516C\u5C3A") {
  const area = normalizeArea2(rawValue, unit);
  if (!area) return null;
  return { ...area, unit: `\u505C\u8ECA\u4F4D\u6B0A\u5229\u7BC4\u570D(${unit})` };
}
function parkingRightsScopeEnd2(text, parkingIdx) {
  const tail = String(text || "").slice(parkingIdx);
  const match = tail.search(/其他登記事項共\d+筆|建築基地權利|基地權利|土地權利|使用執照字號|查詢時間|建物所有權部|建物他項權利部|土地他項權利部/);
  return match >= 0 ? parkingIdx + match : Infinity;
}
function splitSharedParkingRights(rights, parkingIdx, parkingEnd = Infinity) {
  if (!Array.isArray(rights) || rights.length < 2 || parkingIdx < 0) return null;
  const position = (item) => Number(item.idx ?? item.index ?? 0);
  const beforeParking = rights.filter((item) => position(item) < parkingIdx);
  const afterParking = rights.filter((item) => position(item) > parkingIdx && position(item) < parkingEnd);
  let totalRight = null;
  let parkingRights = [];
  if (beforeParking.length && afterParking.length) {
    totalRight = beforeParking.at(-1);
    parkingRights = afterParking.filter((item) => item.denom === totalRight.denom && item.num > 0);
  } else if (beforeParking.length >= 2) {
    totalRight = beforeParking.at(-2);
    const parkingRight = beforeParking.at(-1);
    parkingRights = parkingRight?.denom === totalRight.denom && parkingRight.num > 0 ? [parkingRight] : [];
  }
  if (!totalRight || !parkingRights.length) return null;
  const parkingNum = parkingRights.reduce((sum, item) => sum + item.num, 0);
  if (!(parkingNum > 0 && totalRight.num >= parkingNum)) return null;
  return { totalRight, parkingRights, parkingNum };
}
function attachParkingCount2(area, count) {
  const n = normalizeParkingCount2(count);
  if (area && n > 0) area.count = n;
  return area;
}
function formatRightsFromRatio2(ratio, rightsText = "") {
  const r = Number(ratio);
  if (Number.isFinite(r) && Math.abs(r - 1) < 1e-9) return "1\u5206\u4E4B1";
  return rightsText || "";
}
function applyParsedLandShare(landShare) {
  if (!landShare || !els.landShareArea || !els.landShareRaw) return false;
  let applied = false;
  if (landShare.entries?.length) {
    els.landShareRaw.value = landShare.entries.map(formatLandShareEntry).join("\n");
    applied = true;
  }
  if (landShare.valuePing != null) {
    const nextValue = String(landShare.valuePing);
    els.landShareArea.value = nextValue;
    els.landShareArea.dataset.autoValue = nextValue;
    els.landShareArea.title = `\u5DF2\u89E3\u6790 ${landShare.entries?.length || 0} \u7B46\u571F\u5730\u6301\u5206\uFF0C\u5408\u8A08 ${formatNum2(landShare.valuePing, 3)} \u576A`;
    applied = true;
  }
  return applied;
}
function clearParsedLandShare() {
  if (els.landShareRaw) els.landShareRaw.value = "";
  if (els.landShareArea) {
    els.landShareArea.value = "";
    delete els.landShareArea.dataset.autoValue;
    els.landShareArea.title = "\u672A\u8FA8\u8B58\u571F\u5730\u6301\u5206";
  }
}
function extractLandShareFromOcrText2(rawText) {
  return extractLandShareFromOcrText(rawText);
}
function syncLandShareAreaFromRaw() {
  if (!els.landShareRaw || !els.landShareArea) return { valuePing: toNumber2(els.landShareArea?.value), entries: [] };
  const raw = String(els.landShareRaw.value || "").trim();
  const result = extractLandShareFromOcrText2(raw);
  if (raw && result.valuePing != null) {
    const nextAuto = String(result.valuePing);
    const prevAuto = els.landShareArea.dataset.autoValue || "";
    const current = String(els.landShareArea.value || "").trim();
    if (!current || current === prevAuto || document.activeElement === els.landShareRaw) {
      els.landShareArea.value = nextAuto;
    }
    els.landShareArea.dataset.autoValue = nextAuto;
    els.landShareArea.title = `\u5DF2\u89E3\u6790 ${result.entries.length} \u7B46\u571F\u5730\u6301\u5206\uFF0C\u5408\u8A08 ${formatNum2(result.valuePing, 3)} \u576A`;
  }
  return result;
}
function escapeRegExp2(text) {
  return String(text || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function extractArea2(text, labels) {
  const sources = [cleanOcrText2(text), compactOcrText2(text)];
  for (const source of sources) {
    for (const label of labels) {
      const match = source.match(new RegExp(`${escapeRegExp2(label)}[^\\d]{0,80}(\\d+[\\d,.]*)(?:\\s*)(\u5E73\u65B9\u516C\u5C3A|\u5E73\u65B9?\u7C73|m2|\u33A1|\u576A)`, "i"));
      if (match) return normalizeArea2(match[1], match[2]);
    }
  }
  return null;
}
function sumAreaItems2(items) {
  const valid = items.filter((item) => item && Number.isFinite(item.valuePing));
  if (!valid.length) return null;
  const valuePing = +valid.reduce((sum, item) => sum + item.valuePing, 0).toFixed(3);
  const adjustedValue = +valid.reduce((sum, item) => {
    if (Number.isFinite(item.adjustedValue)) return sum + item.adjustedValue;
    return sum;
  }, 0).toFixed(3);
  const entries = valid.flatMap((item) => Array.isArray(item.entries) ? item.entries : [item]).filter((item) => item && (item.rawValue != null || item.rawBaseValue != null || item.rights || item.label));
  const result = { valuePing };
  if (adjustedValue > 0) {
    result.adjustedValue = adjustedValue;
    result.unit = "\u5E73\u65B9\u516C\u5C3A";
  }
  if (entries.length) result.entries = entries;
  return result;
}
function areaItemWithMeta(item, meta = {}) {
  return item ? { ...item, ...meta } : null;
}
function isArcadeLayerLabel2(label = "") {
  return /騎樓/.test(compactOcrText2(label));
}
function isFirstFloorLayerLabel2(label = "") {
  const text = normalizeFullWidthDigitsToAscii3(compactOcrText2(label));
  return /^(?:1|一|壹)層/.test(text) || /^(?:1|一|壹)樓/.test(text);
}
function extractAttachAreaSum2(text) {
  const source = compactOcrText2(text);
  if (!source) return null;
  const hasAttachedLabels = /附屬建物/.test(source);
  if (hasAttachedLabels) {
    const attachedUsage2 = "(\u967D\u81FA|\u967D\u53F0|\u5E73\u53F0|\u96E8\u906E|\u9A0E\u6A13|\u9732\u81FA|\u9732\u53F0|\u82B1\u81FA|\u82B1\u53F0|\u9580\u5ECA|\u8D70\u5ECA|\u6A13\u68AF\u9593|\u5C4B\u7C37|\u5C4B\u6A90|\u5C4B\u9802\u7A81\u51FA\u7269)";
    const unitPattern = "(\u5E73\u65B9\u516C\u5C3A|\u5E73\u65B9?\u7C73|m2|\u33A1|\u576A)";
    const markers = [...source.matchAll(/附屬建物面積(?:\(YOLOROI\))?|附屬建物用途|附屬建物/g)];
    for (let markerIndex = markers.length - 1; markerIndex >= 0; markerIndex -= 1) {
      const marker = markers[markerIndex];
      let zone = source.slice(marker.index || 0, (marker.index || 0) + 720);
      const stop = zone.search(/共有心|共有部分面積(?:\(YOLOROI\))?|共有部[分份]|公有部分|權利範圍|建物所有權部|建物他項權利部|土地標示部|土地他項權利部|其他登記事項|ncnn150dpi補強文字/);
      if (stop > 0) zone = zone.slice(0, stop);
      const areaLabels = [...zone.matchAll(/(?<!層次)(?<!總)面積[:：*＊]*/g)];
      if (!areaLabels.length) continue;
      const areaLabel = areaLabels.at(-1);
      const areaZone = zone.slice((areaLabel.index || 0) + areaLabel[0].length);
      const items2 = [];
      const seen2 = /* @__PURE__ */ new Set();
      const seenPhysicalSqm = [];
      for (const match of areaZone.matchAll(new RegExp(`(\\d+[\\d,.]*)${unitPattern}`, "gi"))) {
        const item = normalizeArea2(match[1], match[2]);
        if (!item || item.rawValue > 500 || item.valuePing <= 0 || item.valuePing > 50) continue;
        const sqm = /平方公尺|平方?米|m2|㎡/i.test(item.unit) ? item.adjustedValue : item.valuePing * 3.305785;
        if (Number.isFinite(sqm) && seenPhysicalSqm.some((value) => Math.abs(value - sqm) <= 0.05)) continue;
        if (Number.isFinite(sqm)) seenPhysicalSqm.push(sqm);
        const key = `${item.rawValue}|${item.unit}`;
        if (seen2.has(key)) continue;
        seen2.add(key);
        items2.push(areaItemWithMeta(item, { label: "\u9644\u5C6C\u5EFA\u7269" }));
      }
      if (items2.length >= 2) return sumAreaItems2(items2.slice(0, 4));
    }
    const attachedStart = source.search(/附屬建物用途|附屬建物/);
    const dateStart = source.search(/建築完成日期/);
    const start = dateStart >= 0 && attachedStart >= 0 && dateStart < attachedStart && attachedStart - dateStart < 260 ? dateStart : attachedStart;
    const tail = start >= 0 ? source.slice(start) : source;
    const end2 = tail.search(/共有部分|共有部份|其他登記事項|建物所有權部|建物他項權利部/);
    const section2 = end2 > 0 ? tail.slice(0, end2) : tail;
    const usageLabels = [...section2.matchAll(new RegExp(attachedUsage2, "g"))].map((match) => String(match[1] || "\u9644\u5C6C\u5EFA\u7269").replace("\u81FA", "\u53F0"));
    if (usageLabels.length === 1 && usageLabels[0] === "\u967D\u53F0" && /雨遮/.test(source)) usageLabels.push("\u96E8\u906E");
    const sectionItems = [];
    const sectionSeen = /* @__PURE__ */ new Set();
    [...section2.matchAll(new RegExp(`(\\d+[\\d,.]*)${unitPattern}`, "gi"))].forEach((match, index) => {
      if (isMainOrLayerAreaContext(section2, match.index || 0, match[0])) return;
      const item = normalizeArea2(match[1], match[2]);
      if (!item || item.rawValue > 500) return;
      const key = `${item.rawValue}|${item.unit}`;
      if (sectionSeen.has(key)) return;
      sectionSeen.add(key);
      sectionItems.push(areaItemWithMeta(item, { label: usageLabels[index] || usageLabels[0] || "\u9644\u5C6C\u5EFA\u7269" }));
    });
    if (sectionItems.length) return sumAreaItems2(sectionItems);
    const explicitMatches = [
      ...section2.matchAll(new RegExp(`(?:\u9644\u5C6C\u5EFA\u7269\u7528\u9014|\u9644\u5C6C\u5EFA\u7269|\u7528\u9014)?${attachedUsage2}[^\u9762\u7A4D\\d]{0,40}\u9762\u7A4D[^\\d]{0,40}(\\d+[\\d,.]*)${unitPattern}`, "gi")),
      ...section2.matchAll(new RegExp(`(?:\u9644\u5C6C\u5EFA\u7269\u7528\u9014|\u9644\u5C6C\u5EFA\u7269|\u7528\u9014)?${attachedUsage2}[^\\d]{0,40}(\\d+[\\d,.]*)${unitPattern}`, "gi"))
    ];
    const explicitItems = [];
    const explicitSeen = /* @__PURE__ */ new Set();
    for (const match of explicitMatches) {
      if (isMainOrLayerAreaContext(section2, match.index || 0, match[0])) continue;
      const label = String(match[1] || "\u9644\u5C6C\u5EFA\u7269").replace("\u81FA", "\u53F0");
      const item = areaItemWithMeta(normalizeArea2(match[2], match[3]), { label });
      if (!item) continue;
      const key = `${label}|${item.rawValue}|${item.unit}`;
      if (explicitSeen.has(key)) continue;
      explicitSeen.add(key);
      explicitItems.push(item);
    }
    if (explicitItems.length) return sumAreaItems2(explicitItems);
  }
  const orphanAreaMatches = [
    ...source.matchAll(/(?:建築完成日期|築完成日期)[^面積]{0,80}面積[^\d]{0,30}(\d+[\d,.]*)(平方公尺|平方?米|m2|㎡|坪)(?=共有部[分份])/gi),
    ...source.matchAll(/層次面積[^\d]{0,30}\d+[\d,.]*(?:平方公尺|平方?米|m2|㎡|坪).{0,120}?面積[^\d]{0,30}(\d+[\d,.]*)(平方公尺|平方?米|m2|㎡|坪)(?=共有部[分份])/gi)
  ];
  const orphanSeen = /* @__PURE__ */ new Set();
  const orphanItems = orphanAreaMatches.map((match) => normalizeArea2(match[1], match[2])).filter(Boolean).filter((item) => {
    const key = `${item.rawValue}|${item.unit}`;
    if (orphanSeen.has(key)) return false;
    orphanSeen.add(key);
    return true;
  });
  if (orphanItems.length && !hasAttachedLabels) return sumAreaItems2(orphanItems);
  const attachedUsage = "(\u967D\u81FA|\u967D\u53F0|\u5E73\u53F0|\u96E8\u906E|\u9A0E\u6A13|\u9732\u81FA|\u9732\u53F0|\u82B1\u81FA|\u82B1\u53F0|\u9580\u5ECA|\u8D70\u5ECA|\u6A13\u68AF\u9593|\u5C4B\u7C37|\u5C4B\u6A90|\u5C4B\u9802\u7A81\u51FA\u7269)";
  const layerMatches = [
    ...source.matchAll(new RegExp(`\u5C64\u6B21[:\uFF1A]?${attachedUsage}(?:\u5C64\u6B21)?\u9762\u7A4D[^\\d]{0,40}(\\d+[\\d,.]*)(\u5E73\u65B9\u516C\u5C3A|\u5E73\u65B9?\u7C73|m2|\u33A1|\u576A)`, "gi")),
    ...source.matchAll(new RegExp(`\u5C64\u6B21[:\uFF1A]?${attachedUsage}[^\u9762\u7A4D\\d]{0,40}\u9762\u7A4D[^\\d]{0,40}(\\d+[\\d,.]*)(\u5E73\u65B9\u516C\u5C3A|\u5E73\u65B9?\u7C73|m2|\u33A1|\u576A)`, "gi"))
  ];
  const hasFirstFloorLayer = [...source.matchAll(/層次[:：]?(.{1,18}?)(?:層次)?面積[^\d]{0,40}\d+[\d,.]*(?:平方公尺|平方?米|m2|㎡|坪)/gi)].some((match) => isFirstFloorLayerLabel2(match[1]));
  const layerSeen = /* @__PURE__ */ new Set();
  const layerItems = layerMatches.map((match) => {
    const label = String(match[1] || "\u9644\u5C6C\u5EFA\u7269").replace("\u81FA", "\u53F0");
    if (hasFirstFloorLayer && isArcadeLayerLabel2(label)) return null;
    return areaItemWithMeta(normalizeArea2(match[2], match[3]), { label });
  }).filter((item) => {
    if (!item) return false;
    const key = `${item.label}|${item.rawValue}|${item.unit}`;
    if (layerSeen.has(key)) return false;
    layerSeen.add(key);
    return true;
  });
  if (layerItems.length) return sumAreaItems2(layerItems);
  if (!hasAttachedLabels) return null;
  const interleaved = [];
  const interleavedMatches = [
    ...source.matchAll(/附屬建物用途.{0,160}?共有部[分份].{0,160}?面積[^\d]{0,30}(\d+[\d,.]*)(平方公尺|平方?米|m2|㎡|坪)/gi),
    ...source.matchAll(/附屬建物.{0,160}?共有部[分份].{0,160}?面積[^\d]{0,30}(\d+[\d,.]*)(平方公尺|平方?米|m2|㎡|坪)/gi)
  ];
  for (const match of interleavedMatches) {
    const item = normalizeArea2(match[1], match[2]);
    if (item) interleaved.push(item);
  }
  if (interleaved.length) return sumAreaItems2(interleaved);
  const end = source.search(/共有部分|共有部份|其他登記事項|建物所有權部|建物他項權利部/);
  const section = end > 0 ? source.slice(0, end) : source;
  const matches = [
    ...section.matchAll(/附屬建物用途.*?面積[^\d]{0,40}(\d+[\d,.]*)(平方公尺|平方?米|m2|㎡|坪)/gi),
    ...section.matchAll(/附屬建物用途[^\d]{0,80}(\d+[\d,.]*)(平方公尺|平方?米|m2|㎡|坪)/gi)
  ];
  const items = matches.map((match) => normalizeArea2(match[1], match[2])).filter(Boolean);
  const seen = /* @__PURE__ */ new Set();
  return sumAreaItems2(items.filter((item) => {
    const key = `${item.rawValue}|${item.unit}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }));
}
function extractLayerMainAreaSum(text) {
  const source = compactOcrText2(text);
  if (!source) return null;
  const attachedUsage = /(陽臺|陽台|平台|雨遮|騎樓|露臺|露台|花臺|花台|門廊|走廊|樓梯間|屋簷|屋檐|屋頂突出物)/;
  const layerSeen = /* @__PURE__ */ new Set();
  const layerItems = [];
  const layerRows = [...source.matchAll(/層次[:：]?(.{1,18}?)(?:層次)?面積[^\d]{0,40}(\d+[\d,.]*)(平方公尺|平方?米|m2|㎡|坪)/gi)].map((match) => ({
    label: String(match[1] || "").replace(/^[:：]+/, "").trim(),
    value: match[2],
    unit: match[3]
  })).filter((row) => row.label);
  const hasFirstFloorLayer = layerRows.some((row) => isFirstFloorLayerLabel2(row.label));
  for (const row of layerRows) {
    const label = row.label;
    const isArcadeAsMain = hasFirstFloorLayer && isArcadeLayerLabel2(label);
    if (attachedUsage.test(label) && !isArcadeAsMain) continue;
    if (!isArcadeAsMain && !/[一二三四五六七八九十\d０-９]+層|地下|夾層|屋頂/.test(label)) continue;
    const item = areaItemWithMeta(normalizeArea2(row.value, row.unit), { label });
    if (!item) continue;
    const key = `${label}|${item.rawValue}|${item.unit}`;
    if (layerSeen.has(key)) continue;
    layerSeen.add(key);
    layerItems.push(item);
  }
  return sumAreaItems2(layerItems);
}
function extractSection2(text, startLabel, endLabels) {
  const source = compactOcrText2(text);
  const start = compactOcrText2(startLabel);
  const ends = endLabels.map((label) => compactOcrText2(label)).filter(Boolean);
  const startIndex = source.indexOf(start);
  if (startIndex < 0) return "";
  const tail = source.slice(startIndex + start.length);
  const indices = ends.map((label) => tail.indexOf(label)).filter((value) => value >= 0);
  const endIndex = indices.length ? Math.min(...indices) : tail.length;
  return tail.slice(0, endIndex);
}
function extractFractionAreas2(sectionText) {
  return [...String(sectionText || "").matchAll(/(\d{1,6})\s*分之\s*(\d{1,6})[^\d]{0,30}(\d+[\d,.]*)(平方公尺|平方?米|m2|㎡|坪)/gi)].map((match) => normalizeArea2(match[3], match[4], Number(match[2]) / Number(match[1]))).filter(Boolean);
}
function sumFractionAreas2(sectionText) {
  const items = extractFractionAreas2(sectionText);
  if (!items.length) return null;
  return { valuePing: +items.reduce((sum, item) => sum + item.valuePing, 0).toFixed(3) };
}
function largestSqmInText2(c) {
  const re = /(\d+[\d,.]*)\s*(?:平方公尺|平方?米|㎡)/g;
  let m;
  let best = 0;
  while ((m = re.exec(c)) !== null) {
    const v = Number(String(m[1]).replace(/,/g, ""));
    if (Number.isFinite(v) && v > best) best = v;
  }
  return best > 0 ? best : null;
}
function extractCommonAreaFromBaseSqmAndRightsFraction2(sectionText) {
  const c = compactOcrText2(sectionText);
  if (!c || c.length < 8) return null;
  const baseSqm = largestSqmInText2(c);
  if (baseSqm == null) return null;
  let ratio = null;
  const rightsM = c.match(/權利範圍[^\d]{0,120}(\d{1,12})\s*分之\s*(\d{1,12})/);
  if (rightsM) {
    const denom = Number(rightsM[1]);
    const num = Number(rightsM[2]);
    if (denom > 0 && Number.isFinite(num)) ratio = num / denom;
  }
  if (ratio == null || !Number.isFinite(ratio)) {
    const wanM = c.match(/權利範圍.{0,60}?萬分之(\d{1,9})/);
    if (wanM) ratio = Number(wanM[1]) / 1e4;
  }
  if (ratio == null || !Number.isFinite(ratio) || ratio <= 0 || ratio > 1) return null;
  const effectiveSqm = baseSqm * ratio;
  return normalizeArea2(String(effectiveSqm), "\u5E73\u65B9\u516C\u5C3A");
}
function extractCommonAndParkingFromSharedBase2(sectionText) {
  const c = compactOcrText2(sectionText);
  if (!c || c.length < 8) return null;
  const baseSqm = largestSqmInText2(c);
  if (baseSqm == null) return null;
  const parkingIdx = c.search(/停車位|含停車位|合停車位|車位共計|車位編號|停車位編號/);
  if (parkingIdx < 0) return null;
  const rightsRe = /權利範圍[^\d]{0,160}?(\d{1,12})\s*分之\s*(\d{1,12})/g;
  let m;
  const allRights = [];
  while ((m = rightsRe.exec(c)) !== null) {
    const denom = Number(m[1]);
    const num = Number(m[2]);
    if (denom > 0 && Number.isFinite(num)) {
      const item = { denom, num, idx: m.index };
      allRights.push(item);
    }
  }
  const split = splitSharedParkingRights(allRights, parkingIdx, parkingRightsScopeEnd2(c, parkingIdx));
  if (!split) return null;
  const { totalRight, parkingRights, parkingNum } = split;
  const commonSqm = baseSqm * (totalRight.num - parkingNum) / totalRight.denom;
  const parkingSqm = baseSqm * parkingNum / totalRight.denom;
  const common = areaItemWithMeta(normalizeArea2(String(commonSqm), "\u5E73\u65B9\u516C\u5C3A"), {
    rawBaseValue: baseSqm,
    rawBaseUnit: "\u5E73\u65B9\u516C\u5C3A",
    rights: `${totalRight.denom}\u5206\u4E4B${totalRight.num}-${parkingNum}`
  });
  const parking = areaItemWithMeta(normalizeParkingRightsShare2(parkingSqm), {
    rawBaseValue: baseSqm,
    rawBaseUnit: "\u5E73\u65B9\u516C\u5C3A",
    rights: `${totalRight.denom}\u5206\u4E4B${parkingNum}`
  });
  return {
    common,
    parking: attachParkingCount2(parking, parkingRights.length)
  };
}
function extractCommonAndParkingSums2(sectionText) {
  const c = compactOcrText2(sectionText);
  if (!c || !/共有部分|共有部份/.test(c)) return null;
  const commonItems = [];
  const parkingItems = [];
  let parkingCount = 0;
  const entryRe = /(?:共有部[分份][:：]?)?[\u4e00-\u9fff]{0,12}\d{5}-\d{3}建(?:號)?[*＊]*(\d+[\d,.]*)(平方公尺|平方?米|m2|㎡|坪)(.*?)(?=(?:共有部[分份][:：]?[\u4e00-\u9fff]{0,12}\d{5}-\d{3}建)|其他登記事項共\d+筆|建物所有權部|建物他項權利部|查詢時間|$)/g;
  const commonSeen = /* @__PURE__ */ new Set();
  let entryMatch;
  while ((entryMatch = entryRe.exec(c)) !== null) {
    const base = normalizeArea2(entryMatch[1], entryMatch[2]);
    if (!base) continue;
    const slice = String(entryMatch[3] || "").split(/其他登記事項|建物所有權部|建物他項權利部|土地他項權利部/)[0] || "";
    const rights = [...slice.matchAll(/權利範圍[^\d]{0,160}?(\d{1,12})\s*分之\s*(\d{1,12})/g)].map((m) => ({ index: m.index || 0, denom: Number(m[1]), num: Number(m[2]) })).filter((item) => item.denom > 0 && Number.isFinite(item.num));
    if (!rights.length) continue;
    const parkingIdx = slice.search(/停車位|含停車位|合停車位|車位共計|車位編號|停車位編號/);
    if (parkingIdx >= 0) {
      const split = splitSharedParkingRights(rights, parkingIdx, parkingRightsScopeEnd2(slice, parkingIdx));
      if (split) {
        const { totalRight, parkingRights, parkingNum } = split;
        commonItems.push(areaItemWithMeta(
          normalizeArea2(String(base.rawValue * (totalRight.num - parkingNum) / totalRight.denom), entryMatch[2]),
          {
            rawBaseValue: base.rawValue,
            rawBaseUnit: entryMatch[2],
            rights: `${totalRight.denom}\u5206\u4E4B${totalRight.num}-${parkingNum}`
          }
        ));
        parkingItems.push(areaItemWithMeta(
          normalizeParkingRightsShare2(base.rawValue * parkingNum / totalRight.denom, entryMatch[2]),
          {
            rawBaseValue: base.rawValue,
            rawBaseUnit: entryMatch[2],
            rights: `${totalRight.denom}\u5206\u4E4B${parkingNum}`
          }
        ));
        parkingCount += parkingRights.length;
        continue;
      }
    }
    const firstRight = rights[0];
    const commonKey = `${base.rawValue}|${entryMatch[2]}|${firstRight.denom}|${firstRight.num}`;
    if (commonSeen.has(commonKey)) continue;
    commonSeen.add(commonKey);
    commonItems.push(areaItemWithMeta(
      normalizeArea2(String(base.rawValue * firstRight.num / firstRight.denom), entryMatch[2]),
      {
        rawBaseValue: base.rawValue,
        rawBaseUnit: entryMatch[2],
        rights: `${firstRight.denom}\u5206\u4E4B${firstRight.num}`
      }
    ));
  }
  if (commonItems.length || parkingItems.length) {
    const common2 = sumAreaItems2(commonItems);
    const parking2 = sumAreaItems2(parkingItems);
    attachParkingCount2(parking2, parkingCount);
    return common2 || parking2 ? { common: common2, parking: parking2 } : null;
  }
  const markerRe = /共有部[分份]/g;
  const starts = [];
  let marker;
  while ((marker = markerRe.exec(c)) !== null) starts.push(marker.index);
  if (!starts.length) return null;
  for (let i = 0; i < starts.length; i += 1) {
    const start = starts[i];
    const nextStart = starts[i + 1] ?? c.length;
    const hardEnd = c.slice(start, nextStart).search(/其他登記事項共\d+筆|建物所有權部|建物他項權利部|查詢時間/);
    const slice = hardEnd > 0 ? c.slice(start, start + hardEnd) : c.slice(start, nextStart);
    const baseSqm = largestSqmInText2(slice);
    if (baseSqm == null) continue;
    const rights = [...slice.matchAll(/權利範圍[^\d]{0,160}?(\d{1,12})\s*分之\s*(\d{1,12})/g)].map((m) => ({ index: m.index || 0, denom: Number(m[1]), num: Number(m[2]) })).filter((item) => item.denom > 0 && Number.isFinite(item.num));
    if (!rights.length) continue;
    const parkingIdx = slice.search(/停車位|含停車位|合停車位|車位共計|車位編號|停車位編號/);
    if (parkingIdx >= 0) {
      const split = splitSharedParkingRights(rights, parkingIdx, parkingRightsScopeEnd2(slice, parkingIdx));
      if (split) {
        const { totalRight, parkingRights, parkingNum } = split;
        commonItems.push(areaItemWithMeta(
          normalizeArea2(String(baseSqm * (totalRight.num - parkingNum) / totalRight.denom), "\u5E73\u65B9\u516C\u5C3A"),
          {
            rawBaseValue: baseSqm,
            rawBaseUnit: "\u5E73\u65B9\u516C\u5C3A",
            rights: `${totalRight.denom}\u5206\u4E4B${totalRight.num}-${parkingNum}`
          }
        ));
        parkingItems.push(areaItemWithMeta(
          normalizeParkingRightsShare2(baseSqm * parkingNum / totalRight.denom),
          {
            rawBaseValue: baseSqm,
            rawBaseUnit: "\u5E73\u65B9\u516C\u5C3A",
            rights: `${totalRight.denom}\u5206\u4E4B${parkingNum}`
          }
        ));
        parkingCount += parkingRights.length;
        continue;
      }
    }
    const firstRight = rights[0];
    commonItems.push(areaItemWithMeta(
      normalizeArea2(String(baseSqm * firstRight.num / firstRight.denom), "\u5E73\u65B9\u516C\u5C3A"),
      {
        rawBaseValue: baseSqm,
        rawBaseUnit: "\u5E73\u65B9\u516C\u5C3A",
        rights: `${firstRight.denom}\u5206\u4E4B${firstRight.num}`
      }
    ));
  }
  const common = sumAreaItems2(commonItems);
  const parking = sumAreaItems2(parkingItems);
  attachParkingCount2(parking, parkingCount);
  return common || parking ? { common, parking } : null;
}
function extractCommonAreaFromCommonMarkers2(sectionText) {
  const c = normalizeFullWidthDigitsToAscii3(compactOcrText2(sectionText)).replace(/[．。]/g, ".");
  if (!c || !/共有部分|共有部份/.test(c)) return null;
  const items = [];
  const markerRe = /共有部[分份]/g;
  const starts = [];
  let marker;
  while ((marker = markerRe.exec(c)) !== null) starts.push(marker.index);
  for (let i = 0; i < starts.length; i += 1) {
    const start = starts[i];
    const nextStart = starts[i + 1] ?? c.length;
    const rawSlice = c.slice(start, nextStart);
    const hardEnd = rawSlice.search(/其他登記事項|建物所有權部|建物他項權利部|登記次序|查詢時間/);
    const slice = hardEnd > 0 ? rawSlice.slice(0, hardEnd) : rawSlice;
    if (/停車位|含停車位|車位共計|車位編號/.test(slice)) continue;
    const areaMatch = slice.match(/(?:面積)?[^\d]{0,20}(\d+[\d,.]*)(平方公尺|平方?米|m2|㎡|坪)/i);
    if (!areaMatch) continue;
    const rightMatch = slice.match(/權利範圍[^\d]{0,120}?(\d{1,12})\s*分之\s*(\d{1,12})/) || slice.match(/(?:^|[^\d])(\d{1,12})\s*分之\s*(\d{1,12})/);
    if (!rightMatch) continue;
    const denom = Number(rightMatch[1]);
    const num = Number(rightMatch[2]);
    if (!Number.isFinite(denom) || !Number.isFinite(num) || denom <= 0 || num <= 0 || num > denom) continue;
    const rawArea = Number(String(areaMatch[1] || "").replace(/,/g, ""));
    if (!Number.isFinite(rawArea) || rawArea <= 0) continue;
    const adjusted = rawArea * (num / denom);
    const valuePing = /平方公尺|平方?米|m2|㎡/i.test(areaMatch[2]) ? adjusted / 3.305785 : adjusted;
    if (Number.isFinite(valuePing)) {
      items.push({
        valuePing,
        adjustedValue: +adjusted.toFixed(3),
        unit: areaMatch[2],
        rawBaseValue: rawArea,
        rawBaseUnit: areaMatch[2],
        rights: `${denom}\u5206\u4E4B${num}`
      });
    }
  }
  return sumAreaItems2(items);
}
function compactCommonRoiLabelText(text) {
  return normalizeFullWidthDigitsToAscii3(compactOcrText2(text || "")).replace(/\s+/g, "").replace(/Y\s*O\s*L\s*O\s*R\s*O\s*I/gi, "YOLOROI");
}
function isSyntheticCommonRoiOnlySection2(sectionText) {
  const compact = compactCommonRoiLabelText(sectionText);
  if (!compact || !/^面積(?:[\(（]?YOLOROI[\)）]?)/.test(compact)) return false;
  return !hasRealCommonPartEvidence(`\u5171\u6709\u90E8\u5206${sectionText}`);
}
function extractCommonSectionSlice2(text) {
  const ends = ["\u5EFA\u7269\u6240\u6709\u6B0A\u90E8", "\u5EFA\u7269\u4ED6\u9805\u6B0A\u5229\u90E8", "\u5EFA\u7269\u4ED6\u9805\u6B0A\u5229", "\u67E5\u8A62\u6642\u9593"];
  const a = extractSection2(text, "\u5171\u6709\u90E8\u5206", ends);
  if (a && !isSyntheticCommonRoiOnlySection2(a)) return a;
  const b = extractSection2(text, "\u5171\u6709\u90E8\u4EFD", ends);
  return b && !isSyntheticCommonRoiOnlySection2(b) ? b : "";
}
function extractCommonRawEntriesForDiagnostics(text) {
  const compact = compactOcrText2(text || "").replace(/[*＊]+/g, "");
  if (!compact) return [];
  const number = "(\\d+[\\d,.]*)";
  const areaUnit = "(\u5E73\u65B9\u516C\u5C3A|\u5E73\u65B9\u516C|\u5E73\u65B9?\u7C73|m2|m\xB2|\u33A1)";
  const entries = [];
  const seen = /* @__PURE__ */ new Set();
  const re = new RegExp(`\u5EFA(?:\u865F)?[*\uFF0A]*${number}${areaUnit}.{0,180}?(?:\u6B0A\u5229\u7BC4\u570D)?[^\\d]{0,80}(\\d{1,12})\\s*\u5206\u4E4B\\s*(\\d{1,12})`, "gi");
  for (const match of compact.matchAll(re)) {
    const rawBaseValue = Number(String(match[1] || "").replace(/,/g, ""));
    if (!Number.isFinite(rawBaseValue)) continue;
    const rawBaseUnit = normalizeRawAreaUnit(match[2] || "\u5E73\u65B9\u516C\u5C3A");
    const rights = `${match[3]}\u5206\u4E4B${match[4]}`;
    const key = `${rawBaseValue}|${rawBaseUnit}|${rights}`;
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push({ rawBaseValue, rawBaseUnit, rights });
  }
  return entries;
}
function attachCommonRawEntries(area, text) {
  if (!area) return area;
  if (Array.isArray(area.entries) && area.entries.length > 1) return area;
  const entries = extractCommonRawEntriesForDiagnostics(text);
  return entries.length > 1 ? { ...area, entries } : area;
}
function detectFloors(text) {
  const compact = compactOcrText2(text);
  const readFloorToken = (raw) => {
    const n = Number(String(raw).replace(/^0+/, "") || "0");
    return n > 0 ? n : null;
  };
  const candidates = [
    compact.match(/(?:建物)?(?:層|层|眉)數[^\d０-９一二三四五六七八九十百千]{0,8}0*([0-9０-９]{1,3}|[一二三四五六七八九十百千]+)(?![0-9０-９])/),
    compact.match(/層[^\d:：]{0,4}數[^\d]{0,12}(\d{1,3})(?:\s*[Ff])?(?:樓|層)/),
    compact.match(/(?:總樓層數|總樓層|地上層數)[^\d]{0,20}(\d{1,3})(?:\s*[Ff])?(?:樓|層)?/),
    compact.match(/(\d{1,3})(?:\s*[Ff])?(?:樓|層)建物/)
  ];
  for (const m of candidates) {
    if (m) {
      const v = readFloorToken(m[1]);
      if (v != null) return v;
    }
  }
  return null;
}
function detectUnitFloorFromDeedText(text) {
  const compact = compactOcrText2(text);
  if (!compact) return null;
  const matches = [
    compact.match(/層次[:：]?([0-9０-９一二三四五六七八九十百千壹]+)層(?!次面積)/),
    compact.match(/層次[:：]?([0-9０-９一二三四五六七八九十百千壹]+)樓/),
    compact.match(/樓層[:：]?([0-9０-９一二三四五六七八九十百千壹]+)(?:樓|層)?/)
  ];
  for (const match of matches) {
    if (!match) continue;
    const n = parseFloorLevelToken3(match[1]);
    if (n != null) return n;
  }
  return parseLastFloorFromAddress2(compact);
}
function detectType(text) {
  if (/透天/.test(text)) return "\u900F\u5929";
  if (/住宅大樓|大樓/.test(text)) return "\u4F4F\u5B85\u5927\u6A13";
  if (/華廈/.test(text)) return "\u83EF\u5EC8";
  if (/公寓/.test(text)) return "\u516C\u5BD3";
  return "";
}
function detectCityFromText(text) {
  const normalized = cleanOcrText2(text).replace(/\s+/g, "");
  for (const city of Object.keys(CITY_DISTRICTS2)) {
    const candidates = [city, city.replace(/^臺/, "\u53F0"), city.replace(/^台/, "\u81FA")];
    if (candidates.some((candidate) => candidate && normalized.includes(candidate))) {
      return city.replace(/^台/, "\u81FA");
    }
  }
  return "";
}
function detectDistrictFromText(text, city = "") {
  const normalized = cleanOcrText2(text).replace(/\s+/g, "");
  const sources = city && CITY_DISTRICTS2[city] ? [{ city, districts: CITY_DISTRICTS2[city] }] : Object.entries(CITY_DISTRICTS2).map(([name, districts]) => ({ city: name, districts }));
  for (const source of sources) {
    for (const district of source.districts) {
      if (normalized.includes(district)) return district;
    }
  }
  return "";
}
function inferCityByDistrict(district) {
  if (!district) return "";
  const matched = Object.entries(CITY_DISTRICTS2).filter(([, districts]) => districts.includes(district));
  return matched.length === 1 ? matched[0][0] : "";
}
function detectDoorplateFragment(text) {
  const compact = compactOcrText2(text);
  const num = "[\\d\uFF10-\uFF19]+";
  const patterns = [
    new RegExp(`((?:[\\u4e00-\\u9fff]{1,12}(?:\u8DEF|\u8857|\u5927\u9053))${RE_ADDR_ROAD_OPTIONAL_SECTION2}(?:${num}\u5DF7)?(?:${num}\u5F04)?${num}(?:\u4E4B${RE_ADDR_SUFFIX_NUMBER})?\u865F(?:${RE_ADDR_FLOOR_NUMBER}\u6A13(?:\u4E4B${RE_ADDR_SUFFIX_NUMBER})?)?)`),
    new RegExp(`((?:[\\u4e00-\\u9fff]{1,12}(?:\u8DEF|\u8857|\u5927\u9053))${RE_ADDR_ROAD_OPTIONAL_SECTION2}(?:${num}\u5DF7)?(?:${num}\u5F04)?${num}(?:\u4E4B${num})?\u865F)`)
  ];
  for (const pattern of patterns) {
    const match = compact.match(pattern);
    if (match) return match[1].trim();
  }
  return "";
}
var PROPERTY_ADDRESS_STOP_LABELS = [
  "\u5EFA\u7269\u5750\u843D\u5730\u865F",
  "\u5EFA\u7269\u5750\u843D\u5730\u53F7",
  "\u5750\u843D\u5730\u865F",
  "\u5750\u843D\u5730\u53F7",
  "\u4E3B\u8981\u7528\u9014",
  "\u4E3B\u8981\u5EFA\u6750",
  "\u5C64\u6578",
  "\u7E3D\u9762\u7A4D",
  "\u5C64\u6B21\u9762\u7A4D",
  "\u5EFA\u7269\u6A19\u793A\u90E8",
  "\u5EFA\u7269\u6240\u6709\u6B0A\u90E8",
  "\u5176\u4ED6\u767B\u8A18\u4E8B\u9805"
];
function cutPropertyAddressAtStopLabel(value) {
  const normalized = compactOcrText2(value);
  if (!normalized) return "";
  let end = normalized.length;
  for (const label of PROPERTY_ADDRESS_STOP_LABELS) {
    const index = normalized.indexOf(label);
    if (index > 0 && index < end) end = index;
  }
  const genericLandNo = normalized.search(/(?:建物)?地號[:：]/);
  if (genericLandNo > 0 && genericLandNo < end) end = genericLandNo;
  return normalized.slice(0, end).replace(/^建物門牌[:：]?/, "").trim();
}
function sanitizePropertyDoorplate(value) {
  const clipped = cutPropertyAddressAtStopLabel(value);
  if (!clipped) return "";
  const door = detectDoorplateFragment(clipped);
  if (!door) return clipped.replace(/^台/, "\u81FA");
  const doorTail = stripLeadingCityDistrictFromAddress(door);
  const parsed = parseAddressParts(clipped);
  if (parsed.city && parsed.district) {
    return `${normalizeCityToken(parsed.city)}${parsed.district}${doorTail}`.replace(/^台/, "\u81FA");
  }
  const district = detectDistrictFromText(clipped);
  if (district && clipped.includes(district)) {
    const city = normalizeCityToken(detectCityFromText(clipped) || inferCityByDistrict(district));
    const tail = doorTail.startsWith(district) ? doorTail.slice(district.length) : doorTail;
    return `${city || ""}${district}${tail}`.replace(/^台/, "\u81FA");
  }
  return doorTail.replace(/^台/, "\u81FA");
}
function addressMatchText(value) {
  return normalizeFullWidthDigitsToAscii3(compactOcrText2(value || "")).replace(/臺/g, "\u53F0").replace(/[，,、。．.]/g, "");
}
function completeDoorplateFromMatchingAddress(doorplate, text) {
  const doorTail = addressMatchText(stripLeadingCityDistrictFromAddress(doorplate));
  const source = addressMatchText(text);
  if (!doorTail || !source || !/(?:路|街|大道).+號/.test(doorTail)) return "";
  let index = source.indexOf(doorTail);
  while (index >= 0) {
    const prefix = source.slice(Math.max(0, index - 96), index);
    for (const [city, districts] of Object.entries(CITY_DISTRICTS2)) {
      const cityKey = addressMatchText(city);
      for (const district of districts) {
        const re = new RegExp(`${escapeRegExp2(cityKey)}${escapeRegExp2(district)}(?:[\\u4e00-\\u9fff]{1,12}(?:\u91CC|\u6751))?(?:\\d{1,3}\u9130)?$`);
        if (re.test(prefix)) {
          return `${city}${district}${doorTail}`.replace(/^台/, "\u81FA");
        }
      }
    }
    index = source.indexOf(doorTail, index + doorTail.length);
  }
  return "";
}
function stripVillageNeighborhoodPrefix2(text) {
  let normalized = cleanOcrText2(text).replace(/\s+/g, "");
  normalized = normalized.replace(/^[\u4e00-\u9fff]{1,12}(?:里|村)/u, "");
  normalized = normalized.replace(/^\d{1,3}鄰/u, "");
  return normalized;
}
function buildFullAddressFromFragment(fragment, text) {
  const normalizedFragment = cleanOcrText2(fragment).replace(/\s+/g, "");
  if (!normalizedFragment) return "";
  const matchedFullAddress = completeDoorplateFromMatchingAddress(normalizedFragment, text);
  if (matchedFullAddress) return matchedFullAddress;
  const fragmentCity = detectCityFromText(normalizedFragment);
  const fragmentDistrict = detectDistrictFromText(normalizedFragment, fragmentCity) || detectDistrictFromText(normalizedFragment);
  const lastPair = extractLastValidCityDistrict(text);
  const contextCity = fragmentCity || lastPair?.city || detectCityFromText(text);
  const contextDistrict = fragmentDistrict || lastPair?.district || detectDistrictFromText(text, contextCity) || detectDistrictFromText(text);
  const resolvedDistrict = fragmentDistrict || contextDistrict;
  const resolvedCity = fragmentCity || inferCityByDistrict(fragmentDistrict) || contextCity || inferCityByDistrict(resolvedDistrict);
  const withDistrict = resolvedDistrict && !normalizedFragment.includes(resolvedDistrict) ? `${resolvedDistrict}${normalizedFragment}` : normalizedFragment;
  const cityVariants = resolvedCity ? [resolvedCity, resolvedCity.replace(/^臺/, "\u53F0"), resolvedCity.replace(/^台/, "\u81FA")] : [];
  const withCity = resolvedCity && !cityVariants.some((city) => city && withDistrict.includes(city)) ? `${resolvedCity}${withDistrict}` : withDistrict;
  return withCity.replace(/^台/, "\u81FA");
}
function stripFloorFromAddress(address) {
  return cleanOcrText2(address).replace(/\s+/g, "").replace(new RegExp(`(?:\u5730\u4E0B)?${RE_ADDR_FLOOR_NUMBER}\u6A13(?:\u4E4B${RE_ADDR_SUFFIX_NUMBER})?$`, "u"), "").replace(new RegExp(`(?:\u4E4B${RE_ADDR_SUFFIX_NUMBER})?(?:\u5BA4)?$`, "u"), (matched) => new RegExp(`^\u4E4B${RE_ADDR_SUFFIX_NUMBER}$`, "u").test(matched) ? matched : "");
}
function detectResidenceAddress(text) {
  const compact = compactOcrText2(text);
  const match = compact.match(/住址[北址]?:?(.+?)(?:權利範圍|權狀字號|出生年月日|登記原因|統一編號|其他登記事項|權利人)/);
  if (!match) return "";
  return buildFullAddressFromFragment(match[1], compact);
}
function isBuildingRegistrationDeedText(text) {
  const n = compactOcrText2(text);
  const hasBuildingHeader = /建物登記|建物標示部|建物所有權部|建物他項權利部/.test(n);
  const hasBuildingFields = /建號|建物門牌|層次面積|主建物|附屬建物|共有部分|主要用途/.test(n);
  const deedLike = /第二類謄本|第二類|謄本|登記謄本|登記/.test(n);
  return hasBuildingHeader && (deedLike || hasBuildingFields) || /建物標示部/.test(n) && hasBuildingFields;
}
function extractHeaderBandBeforeIndicator(text) {
  const c = cleanOcrText2(text);
  const k = c.indexOf("\u5EFA\u7269\u6A19\u793A\u90E8");
  if (k > 80) return c.slice(0, k).trim();
  return c.slice(0, Math.min(3200, c.length)).trim();
}
function extractBuildingIndicatorSectionText(text) {
  const c = cleanOcrText2(text);
  const start = c.indexOf("\u5EFA\u7269\u6A19\u793A\u90E8");
  if (start < 0) return "";
  const tail = c.slice(start);
  const ends = ["\u5EFA\u7269\u6240\u6709\u6B0A\u90E8", "\u5EFA\u7269\u4ED6\u9805\u6B0A\u5229\u90E8", "\u5EFA\u7269\u4ED6\u9805\u6B0A\u5229", "\u5EFA\u7269\u5176\u4ED6\u767B\u8A18\u4E8B\u9805"];
  let endPos = tail.length;
  const doorPos = tail.indexOf("\u5EFA\u7269\u9580\u724C");
  const endSearchStart = Math.max(12, doorPos >= 0 ? doorPos + "\u5EFA\u7269\u9580\u724C".length : 12);
  for (const label of ends) {
    const i = tail.indexOf(label, endSearchStart);
    if (i >= 0 && i < endPos) endPos = i;
  }
  return tail.slice(0, endPos).trim();
}
function extractTranscriptLabeledCityDistrict(text) {
  const c = compactOcrText2(text);
  if (!c || c.length < 8) return null;
  const pairRe = /縣市([\u4e00-\u9fff]{1,7}[市縣])鄉鎮市區([\u4e00-\u9fff]+?(?:區|鄉|鎮))/g;
  let m;
  let lastPair = null;
  while ((m = pairRe.exec(c)) !== null) {
    const city2 = normalizeCityToken(m[1]);
    const district2 = m[2];
    if ((CITY_DISTRICTS2[city2] || []).includes(district2)) lastPair = { city: city2, district: district2 };
  }
  if (lastPair) return lastPair;
  const cityM = c.match(/縣市([\u4e00-\u9fff]{1,7}[市縣])(?=鄉鎮市區)/) || c.match(/縣市[：:]([\u4e00-\u9fff]{1,7}[市縣])(?=鄉鎮市區|鄉鎮|建物|$)/);
  const distM = c.match(/鄉鎮市區([\u4e00-\u9fff]+?(?:區|鄉|鎮))/) || c.match(/鄉鎮市區[：:]([\u4e00-\u9fff]+?(?:區|鄉|鎮))/);
  let city = cityM ? normalizeCityToken(cityM[1]) : "";
  let district = distM ? distM[1] : "";
  if (city && district && (CITY_DISTRICTS2[city] || []).includes(district)) {
    return { city, district };
  }
  if (district && !city) {
    const inferred = inferCityByDistrict(district);
    if (inferred && (CITY_DISTRICTS2[inferred] || []).includes(district)) {
      return { city: inferred, district };
    }
  }
  const indicatorGuard = extractBuildingIndicatorSectionText(text);
  const indicatorCompact = indicatorGuard ? compactOcrText2(indicatorGuard) : "";
  const skipOfficeFallback = indicatorCompact.includes("\u5EFA\u7269\u9580\u724C");
  const officeRe = /([\u4e00-\u9fff]{2,4}?[市縣])([\u4e00-\u9fff]{1,6}區)地政事務所/g;
  let lastOffice = null;
  while ((m = officeRe.exec(c)) !== null) {
    city = normalizeCityToken(m[1]);
    district = m[2];
    if ((CITY_DISTRICTS2[city] || []).includes(district)) lastOffice = { city, district };
  }
  if (lastOffice && !skipOfficeFallback) return lastOffice;
  const sectRe = /([\u4e00-\u9fff]{2,6}(?:區|鄉|鎮|市))[\u4e00-\u9fff]{1,12}段(?:[一二三四五六七八九十百千]+小段)?[\d０-９\-－]*?(?:地號|建號|建号)/g;
  let lastSect = null;
  while ((m = sectRe.exec(c)) !== null) {
    const d0 = m[1];
    let inferred = inferCityByDistrict(d0);
    if (!inferred) {
      const cityHint = normalizeCityToken(detectCityFromText(c));
      if ((CITY_DISTRICTS2[cityHint] || []).includes(d0)) inferred = cityHint;
    }
    if (inferred && (CITY_DISTRICTS2[inferred] || []).includes(d0)) lastSect = { city: inferred, district: d0 };
  }
  if (lastSect) return lastSect;
  return null;
}
function extractTranscriptLabeledDoorAddress(text) {
  const cleaned = cleanOcrText2(text);
  if (!cleaned) return "";
  const labeled = resolveTranscriptLabeledCityDistrict(cleaned);
  const lines = cleaned.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  let doorText = "";
  for (let i = 0; i < lines.length; i += 1) {
    const lineCompact = compactOcrText2(lines[i]);
    const labelIndex = lineCompact.indexOf("\u5EFA\u7269\u9580\u724C");
    if (labelIndex < 0) continue;
    const tail = lineCompact.slice(labelIndex + "\u5EFA\u7269\u9580\u724C".length);
    const following = compactOcrText2([lines[i + 1] || "", lines[i + 2] || ""].join(""));
    doorText = [tail, following].filter(Boolean).join("");
    break;
  }
  if (!doorText) {
    const compact = compactOcrText2(cleaned);
    const match = compact.match(/建物門牌[:：]?(.+?)(?:建物坐落地號|建物坐落地号|坐落地號|坐落地号|主要用途|主要建材|層數|總面積|層次面積)/);
    if (match) doorText = match[1];
  }
  const door = stripLeadingCityDistrictFromAddress(sanitizePropertyDoorplate(doorText)).replace(/^牌(?=[\u4e00-\u9fff]{1,12}(?:路|街|大道))/u, "");
  if (!door) return "";
  const matchedFullAddress = completeDoorplateFromMatchingAddress(door, cleaned);
  if (matchedFullAddress) return matchedFullAddress;
  if (labeled) return `${labeled.city}${labeled.district}${door}`.replace(/^台/, "\u81FA");
  return buildFullAddressFromFragment(door, cleaned);
}
function detectPropertyAddress(text) {
  const compact = compactOcrText2(text);
  const labeledDoorAddress = extractTranscriptLabeledDoorAddress(text);
  if (labeledDoorAddress) return labeledDoorAddress;
  const labeled = resolveTranscriptLabeledCityDistrict(text);
  const byDoor = compact.match(/建物門牌[:：]?(.+?)(?:建物坐落地號|建物坐落地号|坐落地號|坐落地号|主要用途|主要建材|層數|總面積|層次面積)/);
  if (labeled && byDoor) {
    const door = stripLeadingCityDistrictFromAddress(sanitizePropertyDoorplate(byDoor[1]));
    if (door) return `${labeled.city}${labeled.district}${door}`.replace(/^台/, "\u81FA");
  }
  if (byDoor) {
    const sanitizedDoor = sanitizePropertyDoorplate(byDoor[1]);
    const parsedDoor = parseAddressParts(sanitizedDoor);
    if (parsedDoor.city && parsedDoor.district) return sanitizedDoor;
    return buildFullAddressFromFragment(sanitizedDoor, compact);
  }
  const byAddress = compact.match(new RegExp(`((?:\u53F0|\u81FA).+?[\u5E02\u7E23].+?(?:\u5340|\u9109|\u93AE|\u5E02).+?(?:\u8DEF|\u8857|\u5927\u9053|\u5DF7).+?(?:\u865F).{0,8}(?:\u6A13(?:\u4E4B${RE_ADDR_SUFFIX_NUMBER})?))`));
  if (byAddress) return sanitizePropertyDoorplate(byAddress[1]);
  const fragment = detectDoorplateFragment(compact);
  return fragment ? buildFullAddressFromFragment(sanitizePropertyDoorplate(fragment), compact) : "";
}
function detectPurpose(text) {
  const compact = compactOcrText2(text);
  const match = compact.match(/主要用途:?(.+?)(?:主要建材|層數|總面積|層次面積|建築完成日期)/);
  return match ? match[1].trim() : "";
}
function detectCompletionDateText(text) {
  const compact = compactOcrText2(text);
  const match = compact.match(/建築完成日期[:：]?(?:民國)?([0-9０-９]{2,4})\D{0,2}([0-9０-９]{1,2})\D{0,2}([0-9０-９]{1,2})/);
  if (!match) return "";
  const y = normalizeFullWidthDigitsToAscii3(match[1]);
  const m = normalizeFullWidthDigitsToAscii3(match[2]);
  const d = normalizeFullWidthDigitsToAscii3(match[3]);
  return `${y}\u5E74${m}\u6708${d}\u65E5`;
}
function parseDeedOcrText(text) {
  const cleanedText = cleanOcrText2(text);
  const compactText = compactOcrText2(cleanedText);
  const deedPage = isBuildingRegistrationDeedText(cleanedText);
  const headerBand = deedPage ? extractHeaderBandBeforeIndicator(cleanedText) : cleanedText;
  const indicatorBody = deedPage ? extractBuildingIndicatorSectionText(cleanedText) : "";
  const bodyForMeasures = indicatorBody && indicatorBody.length > 40 ? indicatorBody : cleanedText;
  const privateMeasureBody = bodyForMeasures.split(/共有部分資料|共有部分|共有部份|其他登記事項/)[0] || bodyForMeasures;
  const commonSection = extractCommonSectionSlice2(bodyForMeasures);
  const hasUsableCommonPartEvidence = hasRealCommonPartEvidence(bodyForMeasures);
  const forAddress = [headerBand, bodyForMeasures].filter(Boolean).join("\n");
  const propertyAddress = detectPropertyAddress(forAddress + "\n" + compactText.slice(0, 600));
  const residenceAddress = detectResidenceAddress(cleanedText);
  const subjectLevelSection = extractSubjectLevelSection(privateMeasureBody);
  const deedLevelNumbers = [...new Set(detectDeedLevelNumbers(privateMeasureBody))].sort((a, b) => a - b);
  const stableCommonSection = extractCommonSectionSlice(bodyForMeasures) || commonSection;
  let splitCommonParking = extractBestCommonAndParking(stableCommonSection) || extractCommonAndParkingFromSharedBase2(commonSection) || extractCommonAndParkingSums2(commonSection);
  if (!splitCommonParking && hasUsableCommonPartEvidence) {
    splitCommonParking = extractBestCommonAndParking(bodyForMeasures) || extractCommonAndParkingFromSharedBase2(bodyForMeasures) || extractCommonAndParkingSums2(bodyForMeasures);
  }
  const stableCommonArea = extractReliableCommonAreaFromText(bodyForMeasures);
  const commonFromSlice = splitCommonParking && splitCommonParking.common || stableCommonArea || extractCommonAreaFromCommonMarkers2(commonSection) || extractCommonAreaFromBaseSqmAndRightsFraction2(commonSection);
  const commonFallback = !commonFromSlice && hasUsableCommonPartEvidence ? extractCommonAreaFromCommonMarkers2(bodyForMeasures) || extractCommonAreaFromBaseSqmAndRightsFraction2(bodyForMeasures) : null;
  const commonArea = attachCommonRawEntries(
    commonFromSlice || commonFallback || sumFractionAreas2(commonSection) || extractArea2(commonSection, ["\u9762\u7A4D", "\u5171\u6709\u90E8\u5206"]),
    commonSection || bodyForMeasures
  );
  const attachedArea = extractAttachAreaSum(privateMeasureBody) || extractAttachAreaSum2(privateMeasureBody) || extractArea2(privateMeasureBody, ["\u9644\u5C6C\u5EFA\u7269\u7528\u9014", "\u9644\u5C6C\u5EFA\u7269\u9762\u7A4D", "\u9644\u5C6C\u5EFA\u7269", "\u9644\u5C6C"]);
  const mainArea = extractMainAreaFromBuildingSectionLabels(privateMeasureBody) || extractLayerMainAreaSum(privateMeasureBody) || extractArea2(privateMeasureBody, ["\u7E3D\u9762\u7A4D", "\u5C64\u6B21\u9762\u7A4D", "\u4E3B\u5EFA\u7269\u9762\u7A4D", "\u4E3B\u5EFA\u7269", "\u5EFA\u7269\u9762\u7A4D"]);
  return {
    text: cleanedText,
    compactText,
    commonSection,
    main: mainArea,
    attach: attachedArea,
    common: commonArea,
    parkingDeedShare: splitCommonParking && splitCommonParking.parking ? splitCommonParking.parking : null,
    parkingCount: splitCommonParking?.parking?.count ?? null,
    landShare: extractLandShareFromOcrText2(cleanedText),
    floors: detectFloors(privateMeasureBody),
    unitFloor: detectUnitFloorFromDeedText(privateMeasureBody),
    unitFloors: deedLevelNumbers,
    hasMultipleLevels: deedLevelNumbers.length >= 2,
    foundType: detectType(privateMeasureBody),
    address: propertyAddress,
    propertyAddress,
    residenceAddress,
    purpose: detectPurpose(privateMeasureBody),
    completionDateText: detectCompletionDateText(privateMeasureBody || bodyForMeasures || cleanedText)
  };
}
function isBadRoadCandidate2(road) {
  const normalized = cleanOcrText2(road).replace(/\s+/g, "");
  if (!normalized) return true;
  if (/謄本|網路|網際網路|電子|線上|申請|下載|列印|地政|事務所/.test(normalized)) return true;
  return false;
}
function extractRoadThruSectionOnly2(address) {
  const normalized = stripVillageNeighborhoodPrefix2(cleanOcrText2(address || "")).replace(/\s+/g, "");
  if (!normalized) return "";
  const pattern = new RegExp(`([\\u4e00-\\u9fff]{1,16}(?:\u8DEF|\u8857|\u5927\u9053)${RE_ADDR_ROAD_OPTIONAL_SECTION2})`, "gu");
  for (const match of normalized.matchAll(pattern)) {
    const road = match[1];
    if (!isBadRoadCandidate2(road)) return road;
  }
  return "";
}
function detectRoadFromAddress(address) {
  return extractRoadThruSectionOnly2(address);
}
function parseAddressParts(address) {
  const normalized = cleanOcrText2(address).replace(/\s+/g, "");
  const match = normalized.match(/^(.*?[市縣])(.*?(?:區|鄉|鎮|市))(.*)$/);
  if (!match) return { city: "", district: "", rest: normalized };
  const city = match[1].replace(/^台/, "\u81FA");
  return { city, district: match[2], rest: match[3] || "" };
}
function stripLeadingCityDistrictFromAddress(address) {
  const normalized = cleanOcrText2(address).replace(/\s+/g, "");
  const p = parseAddressParts(normalized);
  return p.city && p.district && p.rest ? p.rest : normalized;
}
function extractLocationHintFromFileName(fileName) {
  let s = String(fileName || "").replace(/\.(pdf|png|jpe?g|webp)$/i, "");
  s = s.replace(/[-–—_]\s*謄本.*$/i, "").replace(/^[._\s]+|[._\s]+$/g, "").trim();
  if (!s) return null;
  const normalized = s.replace(/\s+/g, "").replace(/[._-]+/g, "");
  const p = parseAddressParts(normalized);
  if (!p.city || !p.district || !p.rest) return null;
  const city = normalizeCityToken(p.city);
  const { district, rest } = p;
  if (!(CITY_DISTRICTS2[city] || []).includes(district)) return null;
  const road = detectRoadFromAddress(rest);
  if (!road || rest.length < 3) return null;
  return { city, district, rest, road };
}
function applyFilenameHintToPropertyAddress(parsedAddr, fileName) {
  const hint = extractLocationHintFromFileName(fileName);
  if (!hint || !parsedAddr) return parsedAddr;
  const n = compactOcrText2(parsedAddr);
  const roadC = compactOcrText2(hint.road);
  if (!roadC || !n.includes(roadC)) return parsedAddr;
  const tail = stripLeadingCityDistrictFromAddress(parsedAddr);
  if (!tail || !compactOcrText2(tail).includes(roadC)) return parsedAddr;
  return `${hint.city}${hint.district}${tail}`.replace(/^台/, "\u81FA");
}
function buildSearchKeywordFromAddress(address) {
  const normalized = cleanOcrText2(address).replace(/\s+/g, "");
  if (!normalized) return "";
  const { rest } = parseAddressParts(normalized);
  const base = stripVillageNeighborhoodPrefix2(stripFloorFromAddress(rest || normalized) || rest || normalized);
  if (!base) return "";
  const fromBase = extractRoadThruSectionOnly2(base);
  if (fromBase) return fromBase;
  return extractRoadThruSectionOnly2(normalized);
}
function normalizeCityToken(city) {
  return String(city || "").replace(/^台/, "\u81FA").trim();
}
function extractLastValidCityDistrict(text) {
  const n = cleanOcrText2(text || "").replace(/\s+/g, "");
  if (!n) return null;
  const re = /([\u4e00-\u9fff]+[市縣])([\u4e00-\u9fff]+(?:區|鄉|鎮|市))/g;
  let last = null;
  let m;
  while ((m = re.exec(n)) !== null) {
    const c = normalizeCityToken(m[1]);
    const d = m[2];
    if ((CITY_DISTRICTS2[c] || []).includes(d)) last = { city: c, district: d };
  }
  return last;
}
function extractCityDistrictFromIndicatorBeforeDoorplate(text) {
  const indicator = extractBuildingIndicatorSectionText(text);
  if (!indicator || indicator.length < 12) return null;
  let c = compactOcrText2(indicator);
  const markPos = c.indexOf("\u5EFA\u7269\u6A19\u793A\u90E8");
  if (markPos >= 0) c = c.slice(markPos + "\u5EFA\u7269\u6A19\u793A\u90E8".length);
  const doorPos = c.indexOf("\u5EFA\u7269\u9580\u724C");
  const prefix = doorPos >= 0 ? c.slice(0, doorPos) : c;
  if (prefix.length < 4) return null;
  return extractLastValidCityDistrict(prefix);
}
function resolveTranscriptLabeledCityDistrict(text) {
  const fromIndicator = extractCityDistrictFromIndicatorBeforeDoorplate(text);
  if (fromIndicator) return fromIndicator;
  return extractTranscriptLabeledCityDistrict(text);
}
function reconcileCityDistrictForDropdown(city, district, fullTextForParse) {
  let c = normalizeCityToken(city || "");
  let d = String(district || "").trim();
  const blob = cleanOcrText2(fullTextForParse || "").replace(/\s+/g, "");
  const labeled = resolveTranscriptLabeledCityDistrict(fullTextForParse);
  if (labeled) {
    c = labeled.city;
    d = labeled.district;
  } else {
    const lastPair = extractLastValidCityDistrict(fullTextForParse);
    if (lastPair) {
      c = lastPair.city;
      d = lastPair.district;
    } else {
      const parsed = parseAddressParts(blob);
      if (parsed.city && parsed.district) {
        c = normalizeCityToken(parsed.city);
        d = parsed.district;
      }
    }
  }
  if (d && c && !(CITY_DISTRICTS2[c] || []).includes(d)) {
    const inferred = inferCityByDistrict(d);
    if (inferred) c = inferred;
  }
  if (d && !c) {
    const inferred = inferCityByDistrict(d);
    if (inferred) c = inferred;
  }
  return { city: c, district: d };
}
function resolveLocationPartsForManualQuery(primaryAddress = "", supplementalText = "") {
  const primary = cleanOcrText2(primaryAddress).replace(/\s+/g, "");
  const extra = cleanOcrText2(supplementalText).replace(/\s+/g, "");
  const blob = primary && extra ? `${primary}
${extra}` : primary || extra;
  const combinedLine = cleanOcrText2([primaryAddress, supplementalText].filter(Boolean).join("\n")).replace(/\s+/g, "");
  const tryParsed = (text) => {
    if (!text) return null;
    const p = parseAddressParts(text);
    return p.city && p.district ? p : null;
  };
  const primaryParsed = tryParsed(primary);
  let parsed = primaryParsed || tryParsed(combinedLine) || tryParsed(blob) || tryParsed(extra);
  let city = "";
  let district = "";
  if (parsed) {
    city = normalizeCityToken(parsed.city);
    district = parsed.district;
  } else {
    city = normalizeCityToken(detectCityFromText(blob) || detectCityFromText(primary) || detectCityFromText(extra));
    district = detectDistrictFromText(blob, city) || detectDistrictFromText(primary, city) || detectDistrictFromText(extra, city) || detectDistrictFromText(blob) || detectDistrictFromText(primary) || detectDistrictFromText(extra);
    if (!city && district) city = normalizeCityToken(inferCityByDistrict(district));
    if (city && !district) {
      district = detectDistrictFromText(blob, city) || detectDistrictFromText(primary, city) || detectDistrictFromText(extra, city);
    }
  }
  if (primaryParsed && isKnownCityDistrictPair(primaryParsed.city, primaryParsed.district)) {
    city = normalizeCityToken(primaryParsed.city);
    district = primaryParsed.district;
  } else {
    const reconciled = reconcileCityDistrictForDropdown(city, district, [primaryAddress, supplementalText].filter(Boolean).join("\n"));
    city = reconciled.city;
    district = reconciled.district;
  }
  const roadBase = primary || blob || extra;
  let road = buildSearchKeywordFromAddress(roadBase) || detectRoadFromAddress(roadBase);
  if (!road && extra && extra !== roadBase) {
    road = buildSearchKeywordFromAddress(extra) || detectRoadFromAddress(extra);
  }
  return { city, district, road };
}
function isKnownCityDistrictPair(city, district) {
  const normalizedCity = normalizeCityToken(city);
  const normalizedDistrict = String(district || "").trim();
  if (!normalizedCity || !normalizedDistrict) return false;
  return (CITY_DISTRICTS2[normalizedCity] || []).includes(normalizedDistrict);
}
async function resolveLocationPartsForManualQueryWithKnowledge(primaryAddress = "", supplementalText = "") {
  const base = resolveLocationPartsForManualQuery(primaryAddress, supplementalText);
  const index = await loadAddressKnowledge();
  const fromKnowledge = resolveLocationPartsWithAddressKnowledge(index, {
    primaryAddress,
    supplementalText,
    existingCity: base.city,
    existingDistrict: base.district,
    existingRoad: base.road
  });
  const basePairValid = !base.city || !base.district || isKnownCityDistrictPair(base.city, base.district);
  const city = basePairValid ? base.city || fromKnowledge.city : fromKnowledge.city || base.city;
  const district = basePairValid ? base.district || fromKnowledge.district : fromKnowledge.district || base.district;
  const road = base.road || fromKnowledge.road;
  return { city, district, road, addressKnowledgeMatched: fromKnowledge.matched };
}
async function completeAddressWithLocalKnowledge(address, contextText = "") {
  const cleanAddress = sanitizePropertyDoorplate(address) || address || "";
  if (!cleanAddress) return "";
  const parsed = parseAddressParts(cleanAddress);
  if (parsed.city && parsed.district) return cleanAddress;
  const index = await loadAddressKnowledge();
  return completeDoorplateWithAddressKnowledge(index, cleanAddress, contextText) || cleanAddress;
}
async function syncQueryFromDeed({ autoTitle = true, supplementalOcrText = "" } = {}) {
  const address = els.subjectAddress.value.trim();
  if (!address && !cleanOcrText2(supplementalOcrText).trim()) return false;
  const resolved = await resolveLocationPartsForManualQueryWithKnowledge(address, supplementalOcrText);
  const road = resolved.road || buildSearchKeywordFromAddress(address) || detectRoadFromAddress(address);
  if (road) els.roadKeyword.value = extractRoadThruSectionOnly2(road) || road;
  if (autoTitle && !els.queryTitle.value.trim()) {
    els.queryTitle.value = `${resolved.district || road || "\u8B04\u672C"}\u4E8C\u985E\u8B04\u672C\u4F30\u50F9`;
  }
  if (!selectedDealTargets().length) {
    setCheckboxValues2(els.dealTargetPick, ["\u623F\u5730", "\u623F\u5730(\u8ECA)"]);
  }
  const city = resolved.city;
  const district = resolved.district;
  if (city) {
    const cityCode = findCityCodeByTitle(city);
    if (cityCode) {
      els.cityName.value = cityCode;
      await loadOfficialTowns(cityCode);
      if (district) {
        let districtCode = resolveDistrictDropdownCode(cityCode, district);
        populateDistrictOptions(cityCode, districtCode);
        if (!els.districtName.value) {
          districtCode = resolveDistrictByOptionLabel(cityCode, district);
          if (districtCode) populateDistrictOptions(cityCode, districtCode);
        }
      }
    }
  }
  updateStructuredData();
  return !!els.cityName.value && !!els.districtName.value && !!els.roadKeyword.value;
}
async function syncManualQueryFromParsedDeed(parsed, supplementalOcrText = "", fallbackAddress = "") {
  const rawAddress = parsed?.propertyAddress || parsed?.address || fallbackAddress || "";
  const address = await completeAddressWithLocalKnowledge(rawAddress, [supplementalOcrText, parsed?.text || ""].filter(Boolean).join("\n"));
  if (address) {
    els.subjectAddress.value = address;
    setRecognizedAddressFields({ property: address });
  }
  const ready = await syncQueryFromDeed({
    supplementalOcrText: [supplementalOcrText, parsed?.text || ""].filter(Boolean).join("\n")
  });
  if (!els.roadKeyword.value && address) {
    const road = buildSearchKeywordFromAddress(address) || detectRoadFromAddress(address);
    if (road) els.roadKeyword.value = extractRoadThruSectionOnly2(road) || road;
  }
  updateStructuredData();
  return ready;
}
var autoOfficialSearchTimer = appState.autoOfficialSearchTimer;
var officialSearchInFlight = appState.officialSearchInFlight;
function cancelPendingAutoOfficialSearch() {
  if (autoOfficialSearchTimer) clearTimeout(autoOfficialSearchTimer);
  autoOfficialSearchTimer = null;
}
function deedQueryFieldsReady() {
  return !!els.cityName.value && !!els.districtName.value && !!els.roadKeyword.value.trim();
}
function scheduleAutoOfficialSearchAfterDeedReady(ready, sourceLabel = "\u8B04\u672C") {
  if (!ready || !deedQueryFieldsReady()) return false;
  cancelPendingAutoOfficialSearch();
  setMessage2("ok", `\u5DF2\u5E36\u5165\u624B\u52D5\u67E5\u8A62\u6B04\u4F4D\uFF0C\u6B63\u5728\u81EA\u52D5\u641C\u5C0B\u5B98\u65B9\u8CC7\u6599...`);
  autoOfficialSearchTimer = setTimeout(() => {
    autoOfficialSearchTimer = null;
    runDeedSearchWithUi();
  }, 160);
  return true;
}
var lastLandValueTaxAutoParseSignature = "";
function landValueTaxAutoParseSignature(files = landTaxSourceFiles()) {
  return files.map((file) => `${file.name || ""}:${file.size || 0}:${file.lastModified || 0}`).join("|");
}
async function syncLandValueTaxFromUploadedFiles(reason = "\u5BE6\u50F9\u67E5\u8A62") {
  const files = landTaxSourceFiles();
  if (!files.length || !window.initLandValueTaxApp) return false;
  const signature = landValueTaxAutoParseSignature(files);
  if (signature && signature === lastLandValueTaxAutoParseSignature) return false;
  lastLandValueTaxAutoParseSignature = signature;
  try {
    await window.initLandValueTaxApp();
    const api = window.LandValueTaxCalculator;
    if (!api?.parseAndApplyLandTaxDeedFiles) return false;
    const names = sourceFileNames(files).join("\u3001");
    setMessage2("ok", `${reason}\u5B8C\u6210\uFF1B\u5075\u6E2C\u5230\u571F\u5730\u8B04\u672C\uFF0C\u6B63\u5728\u540C\u6B65\u5E36\u5165\u571F\u5730\u589E\u503C\u7A05\u8A66\u7B97\uFF1A${names}`);
    const result = await api.parseAndApplyLandTaxDeedFiles(files);
    if (result?.hasCoreData) {
      setMessage2("ok", `${reason}\u5B8C\u6210\uFF1B\u571F\u5730\u8B04\u672C\u5DF2\u540C\u6B65\u5E36\u5165\u571F\u5730\u589E\u503C\u7A05\u8A66\u7B97\u3002`);
      return true;
    }
    setMessage2("warn", `${reason}\u5B8C\u6210\uFF1B\u5DF2\u5617\u8A66\u89E3\u6790\u571F\u5730\u8B04\u672C\uFF0C\u4F46\u571F\u5730\u589E\u503C\u7A05\u6B04\u4F4D\u4ECD\u4E0D\u8DB3\uFF0C\u8ACB\u5207\u5230\u571F\u5730\u589E\u503C\u7A05\u8A66\u7B97\u9801\u6AA2\u67E5\u3002`);
    return false;
  } catch (error) {
    console.error("auto land value tax parse failed", error);
    setMessage2("warn", `${reason}\u5B8C\u6210\uFF1B\u571F\u5730\u589E\u503C\u7A05\u540C\u6B65\u89E3\u6790\u5931\u6557\uFF1A${formatCaughtError(error)}`);
    return false;
  }
}
async function fetchOcrBackendResultForLandShare(file) {
  if (!USE_PADDLE_OCR || !file) return null;
  const controller = new AbortController();
  const timeoutMs = isPdfFile(file) ? PADDLE_OCR_PDF_TIMEOUT_MS : PADDLE_OCR_TIMEOUT_MS;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const form = new FormData();
    form.append("file", file, file.name);
    if (isPdfFile(file)) {
      form.append("max_pages", String(PADDLE_OCR_PDF_MAX_PAGES));
      form.append("dpi", String(PADDLE_OCR_PDF_DPI));
      form.append("fast", PADDLE_OCR_PDF_FAST_MODE ? "true" : "false");
    } else {
      form.append("max_pages", "1");
      form.append("fast", "true");
    }
    const response = await fetch(PADDLE_OCR_ENDPOINT, {
      method: "POST",
      body: form,
      signal: controller.signal
    });
    const responseText = await response.text();
    const result = responseText ? JSON.parse(responseText) : null;
    if (!response.ok || !result?.ok) return null;
    return result;
  } catch (error) {
    console.info("land share OCR parse skipped", file?.name, error);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
async function syncLandShareFromUploadedLandFiles(reason = "\u540C\u6279\u571F\u5730\u8B04\u672C") {
  const files = landTaxSourceFiles();
  if (!files.length || !els.landShareArea || !els.landShareRaw) return false;
  const current = String(els.landShareArea.value || "").trim();
  const prevAuto = els.landShareArea.dataset.autoValue || "";
  if (current && current !== prevAuto) return false;
  const entries = [];
  for (const file of files) {
    const result = await fetchOcrBackendResultForLandShare(file);
    const text = paddlePagesText(result?.pages);
    const landShare = extractLandShareFromOcrText(text);
    if (landShare?.entries?.length) entries.push(...landShare.entries);
  }
  if (!entries.length) return false;
  const valuePing = entries.reduce((sum, entry) => sum + (toNumber2(entry.valuePing) || 0), 0);
  if (!(valuePing > 0)) return false;
  const nextValue = String(Math.round(valuePing * 1e3) / 1e3);
  els.landShareRaw.value = entries.map(formatLandShareEntry).join("\n");
  els.landShareArea.value = nextValue;
  els.landShareArea.dataset.autoValue = nextValue;
  els.landShareArea.title = `${reason}\u5DF2\u89E3\u6790 ${entries.length} \u7B46\u571F\u5730\u6301\u5206\uFF0C\u5408\u8A08 ${formatNum2(valuePing, 3)} \u576A`;
  return true;
}
async function runDeedSearch(options = {}) {
  activateTab("manualTab");
  scrollToElementById("filter-title");
  const ready = await syncQueryFromDeed();
  if (!ready) {
    setMessage2("warn", "\u8ACB\u5148\u5B8C\u6210\u8B04\u672C OCR\uFF0C\u4E26\u78BA\u8A8D\u5DF2\u6293\u5230\u5730\u5740\u5F8C\u518D\u67E5\u8A62\u3002");
    return;
  }
  if (officialSearchInFlight) {
    setMessage2("warn", "\u5B98\u65B9\u8CC7\u6599\u67E5\u8A62\u4E2D\uFF0C\u8ACB\u7A0D\u5019...");
    return null;
  }
  officialSearchInFlight = true;
  try {
    const result = await runOfficialSearch(options.officialSearchOptions || {});
    scrollToElementById("result-title");
    return result;
  } finally {
    officialSearchInFlight = false;
  }
}
async function runOfficialSearchWithUi() {
  if (officialSearchInFlight) {
    setMessage2("warn", "\u5B98\u65B9\u8CC7\u6599\u67E5\u8A62\u4E2D\uFF0C\u8ACB\u7A0D\u5019...");
    return null;
  }
  officialSearchInFlight = true;
  try {
    const result = await withActionUi(
      {
        button: els.manualSearchBtn,
        buttonText: "\u5B98\u65B9\u67E5\u8A62\u4E2D...",
        progressText: "\u5B98\u65B9\u8CC7\u6599\u67E5\u8A62\u4E2D\uFF0C\u8ACB\u7A0D\u5019..."
      },
      () => runOfficialSearch()
    );
    setRecordsPanelCollapsed(true);
    if (result !== null) {
      await syncLandValueTaxFromUploadedFiles("\u5B98\u65B9\u8CC7\u6599\u67E5\u8A62");
    }
    return result;
  } finally {
    officialSearchInFlight = false;
  }
}
async function runDeedSearchWithUi() {
  const result = await withActionUi(
    {
      button: els.searchBtn,
      buttonText: "\u5957\u7528\u67E5\u8A62\u4E2D...",
      progressText: "\u6B63\u5728\u5957\u7528\u8B04\u672C\u5167\u5BB9\u4E26\u67E5\u8A62\u5B98\u65B9\u8CC7\u6599\uFF0C\u8ACB\u7A0D\u5019..."
    },
    () => runDeedSearch({
      officialSearchOptions: {
        totalTimeoutMs: OFFICIAL_AUTO_TOTAL_TIMEOUT_MS
      }
    })
  );
  setRecordsPanelCollapsed(true);
  if (result !== null) {
    await syncLandValueTaxFromUploadedFiles("\u5BE6\u50F9\u67E5\u8A62");
  }
  return result;
}
async function runRecalcWithUi() {
  const result = await withActionUi(
    {
      button: els.recalcBtn,
      buttonText: "\u91CD\u65B0\u4F30\u50F9\u4E2D...",
      progressText: "\u6B63\u5728\u7528\u76EE\u524D\u6848\u4F8B\u91CD\u65B0\u4F30\u50F9\uFF0C\u8ACB\u7A0D\u5019..."
    },
    async () => {
      runSearch({ ignoreQueryFilters: true });
    }
  );
  setRecordsPanelCollapsed(true);
  return result;
}
async function runOcrWithUi() {
  const file = primaryOcrSourceFile();
  if (isPdfFile(file)) {
    const startedAt = Date.now();
    setButtonLoading2(els.ocrBtn, true, "PDF \u5FEB\u901F\u89E3\u6790\u4E2D...");
    setOcrProgress2(8, "PDF \u5FEB\u901F\u89E3\u6790\u4E2D");
    await nextPaint();
    try {
      const backendAttempt = initialBackendOcrAttempt(file, {
        backendEnabled: USE_PADDLE_OCR,
        isPdfFile
      });
      if (backendAttempt.shouldAttempt) {
        const reason = backendAttempt.reason || "PDF \u5148\u4F7F\u7528 OCR \u5F8C\u7AEF\u89E3\u6790\u6B04\u4F4D\uFF0C\u907F\u514D\u5FEB\u901F\u6587\u5B57\u5C64\u8AA4\u5224\u9644\u5C6C\u5EFA\u7269\u8207\u5171\u6709\u90E8\u5206\u9762\u7A4D\u3002";
        setOcrProgress2(10, "PDF \u5148\u4EA4\u7531 OCR \u5F8C\u7AEF\u89E3\u6790");
        if (await tryPaddleOcr(file, { initialProgress: 10, reason })) {
          return;
        }
      }
      const presetApplied = applyKnownFilePreset(file.name, true);
      const knownPreset = getKnownFilePreset(file.name);
      let textLayerMessage = "";
      let typeMessage = "";
      let hitCount = 0;
      let querySyncMessage = "";
      let parsedFromTextLayer = null;
      let pdfTextForDiagnostics = "";
      let querySynced = false;
      let paddleFallbackMessage = "";
      const presetHasUsableFields = !!knownPreset && [
        knownPreset.main,
        knownPreset.attach,
        knownPreset.common,
        knownPreset.total,
        knownPreset.land
      ].some(Boolean);
      if (presetHasUsableFields) {
        hitCount = [
          safeNumber2(els.mainArea.value),
          safeNumber2(els.attachArea.value),
          safeNumber2(els.commonArea.value)
        ].filter((value) => value > 0).length;
        textLayerMessage = "\u5DF2\u4F9D\u6A94\u540D\u5957\u7528\u96FB\u5B50\u8B04\u672C\u4FDD\u5E95\u6B04\u4F4D\uFF0C\u7565\u904E\u53EF\u80FD\u903E\u6642\u7684 PDF \u6587\u5B57\u5C64\u8B80\u53D6\u3002";
      } else if (window.pdfjsLib?.getDocument) {
        try {
          setOcrProgress2(35, "PDF \u8B80\u53D6\u5168\u90E8\u9801\u9762\u6587\u5B57\u5C64");
          const pdfText = await withTimeout(
            extractPdfTextLayer(file),
            PDF_QUICK_TEXT_TIMEOUT_MS,
            "PDF \u6587\u5B57\u5C64\u8B80\u53D6\u903E\u6642"
          );
          pdfTextForDiagnostics = pdfText;
          if (cleanOcrText2(pdfText).length > 40) {
            const parsed = parseDeedOcrText(pdfText);
            parsedFromTextLayer = parsed;
            hitCount = [
              fillArea(els.mainArea, parsed.main),
              fillArea(els.attachArea, parsed.attach),
              fillArea(els.commonArea, parsed.common)
            ].filter(Boolean).length;
            if (parsed.parkingDeedShare) fillArea(els.parkingArea, parsed.parkingDeedShare);
            applyOcrParkingCountFromParsed(parsed);
            applyParsedLandShare(parsed.landShare);
            await syncLandShareFromUploadedLandFiles();
            if (parsed.floors) els.totalFloors.value = parsed.floors;
            const queryAddress = parsed.propertyAddress || parsed.address || knownPreset?.queryAddress || knownPreset?.address || "";
            if (queryAddress) els.subjectAddress.value = sanitizePropertyDoorplate(queryAddress) || queryAddress;
            if (parsed.purpose && !selectedMainPurposes().length) setCheckboxValues2(els.mainPurposePick, parsed.purpose);
            const appliedType = applyBuildingTypeFromParsed(parsed, knownPreset);
            typeMessage = appliedType ? `\u5DF2\u81EA\u52D5\u52FE\u9078\u5EFA\u7269\u578B\u614B\uFF1A${appliedType}\u3002` : "\u5C1A\u672A\u80FD\u81EA\u52D5\u5224\u65B7\u5EFA\u7269\u578B\u614B\u3002";
            const synced = await syncManualQueryFromParsedDeed(parsed, pdfText, queryAddress);
            querySynced = synced;
            querySyncMessage = synced ? `\u5DF2\u5E36\u5165\u624B\u52D5\u67E5\u8A62\uFF1A${selectedLabel(els.cityName)} ${selectedLabel(els.districtName)} ${els.roadKeyword.value.trim()}\u3002` : "\u624B\u52D5\u67E5\u8A62\u6B04\u4F4D\u5C1A\u672A\u5B8C\u6574\uFF0C\u8ACB\u6AA2\u67E5\u7E23\u5E02\u3001\u884C\u653F\u5340\u8207\u9580\u724C\uFF0F\u793E\u5340\u540D\u7A31\u3002";
            textLayerMessage = `PDF \u6587\u5B57\u5C64\u89E3\u6790\u5B8C\u6210\uFF0C\u9762\u7A4D\u6B04\u4F4D ${hitCount}/3\u3002`;
          } else {
            textLayerMessage = "PDF \u5168\u90E8\u9801\u9762\u6587\u5B57\u5C64\u4E0D\u8DB3\uFF0C\u5DF2\u4FDD\u7559\u6A94\u540D\u4FDD\u5E95\u6B04\u4F4D\u3002";
          }
        } catch (error) {
          textLayerMessage = `PDF \u6587\u5B57\u5C64\u5FEB\u901F\u89E3\u6790\u672A\u5B8C\u6210\uFF1A${formatCaughtError(error)}\u3002`;
        }
      } else {
        textLayerMessage = "PDF \u6587\u5B57\u5C64\u6A21\u7D44\u672A\u8F09\u5165\uFF0C\u5DF2\u4FDD\u7559\u6A94\u540D\u4FDD\u5E95\u6B04\u4F4D\u3002";
      }
      revealDeedFieldsAfterOcr();
      updateAreaSummary();
      if (!querySyncMessage && (knownPreset?.queryAddress || knownPreset?.address || els.subjectAddress.value.trim())) {
        const appliedType = applyBuildingTypeFromParsed(null, knownPreset);
        typeMessage = appliedType ? `\u5DF2\u81EA\u52D5\u52FE\u9078\u5EFA\u7269\u578B\u614B\uFF1A${appliedType}\u3002` : typeMessage || "\u5C1A\u672A\u80FD\u81EA\u52D5\u5224\u65B7\u5EFA\u7269\u578B\u614B\u3002";
        const synced = await syncManualQueryFromParsedDeed(null, "", knownPreset?.queryAddress || knownPreset?.address || els.subjectAddress.value.trim());
        querySynced = synced;
        querySyncMessage = synced ? `\u5DF2\u5E36\u5165\u624B\u52D5\u67E5\u8A62\uFF1A${selectedLabel(els.cityName)} ${selectedLabel(els.districtName)} ${els.roadKeyword.value.trim()}\u3002` : "\u624B\u52D5\u67E5\u8A62\u6B04\u4F4D\u5C1A\u672A\u5B8C\u6574\uFF0C\u8ACB\u6AA2\u67E5\u7E23\u5E02\u3001\u884C\u653F\u5340\u8207\u9580\u724C\uFF0F\u793E\u5340\u540D\u7A31\u3002";
      }
      const confidence = pdfQuickParseConfidence(parsedFromTextLayer, hitCount, querySynced, knownPreset);
      if (!confidence.ok) {
        setOcrProgress2(72, "PDF \u5FEB\u901F\u89E3\u6790\u4FE1\u5FC3\u4E0D\u8DB3\uFF0C\u6539\u7528 OCR \u5F8C\u7AEF");
        paddleFallbackMessage = `PDF \u5FEB\u901F\u89E3\u6790\u4FE1\u5FC3\u4E0D\u8DB3\uFF08${confidence.reasons.join("\u3001")}\uFF09\uFF0C\u5DF2\u6539\u7528 OCR \u5F8C\u7AEF\u3002`;
        els.ocrLog.textContent = [
          "PDF \u5FEB\u901F\u89E3\u6790\u5DF2\u5148\u5B8C\u6210\uFF0C\u6B63\u5728\u88DC\u8DD1 OCR \u5F8C\u7AEF\u3002",
          textLayerMessage,
          typeMessage,
          querySyncMessage,
          paddleFallbackMessage
        ].filter(Boolean).join("\n");
        await nextPaint();
        if (await tryPaddleOcr(file, { initialProgress: 74, reason: paddleFallbackMessage })) {
          return;
        }
        paddleFallbackMessage = `PDF \u5FEB\u901F\u89E3\u6790\u4FE1\u5FC3\u4E0D\u8DB3\uFF08${confidence.reasons.join("\u3001")}\uFF09\uFF0C\u4F46 OCR \u5F8C\u7AEF\u672A\u80FD\u5B8C\u6210\uFF0C\u5DF2\u4FDD\u7559\u5FEB\u901F\u89E3\u6790\u7D50\u679C\u3002`;
      }
      const usableFieldCount = [
        safeNumber2(els.mainArea.value),
        safeNumber2(els.attachArea.value),
        safeNumber2(els.commonArea.value),
        safeNumber2(els.totalAreaOverride.value),
        els.subjectAddress.value.trim(),
        els.roadKeyword.value.trim()
      ].filter(Boolean).length;
      const autoSearchQueued = scheduleAutoOfficialSearchAfterDeedReady(querySynced || querySyncMessage.startsWith("\u5DF2\u5E36\u5165\u624B\u52D5\u67E5\u8A62"), "PDF");
      setOcrProgress2(100, "PDF \u5FEB\u901F\u5B8C\u6210");
      els.ocrLog.textContent = [
        confidence.ok ? "PDF \u5FEB\u901F\u89E3\u6790\u5B8C\u6210\uFF08\u4FE1\u5FC3\u8DB3\u5920\uFF0C\u672A\u57F7\u884C OCR \u5F8C\u7AEF\uFF09\u3002" : "PDF \u5FEB\u901F\u89E3\u6790\u5B8C\u6210\u3002",
        textLayerMessage,
        typeMessage,
        querySyncMessage,
        paddleFallbackMessage,
        `\u76EE\u524D\u5DF2\u5E36\u5165 ${usableFieldCount} \u500B\u4E3B\u8981\u6B04\u4F4D\u3002`,
        presetApplied || knownPreset ? "\u5DF2\u5957\u7528\u6216\u4FDD\u7559\u5DF2\u77E5\u6A94\u540D\u4FDD\u5E95\u6B04\u4F4D\uFF1B\u8ACB\u6AA2\u67E5\u4E3B\u5EFA\u7269\u3001\u9644\u5C6C\u3001\u5171\u6709\u3001\u5730\u5740\u7B49\u6B04\u4F4D\u3002" : "\u6B64 PDF \u7121\u5DF2\u77E5\u4FDD\u5E95\u6B04\u4F4D\uFF1B\u82E5\u6B04\u4F4D\u4E0D\u8DB3\uFF0C\u8ACB\u6539\u4E0A\u50B3\u5EFA\u7269\u6A19\u793A\u90E8\u622A\u5716\u6216\u5716\u7247\u6A94\u3002",
        autoSearchQueued ? "\u5373\u5C07\u81EA\u52D5\u641C\u5C0B\u5B98\u65B9\u8CC7\u6599\u3002" : "",
        `\u8017\u6642\uFF1A\u7D04 ${((Date.now() - startedAt) / 1e3).toFixed(1)} \u79D2\u3002`
      ].filter(Boolean).join("\n");
      const diagnosticsSource = parsedFromTextLayer ? "pdfTextLayer" : knownPreset ? "knownFilePreset" : "pdfTextLayer";
      renderOcrFieldDiagnostics(
        buildOcrFieldResultsFromParsed(parsedFromTextLayer || {}, {
          source: diagnosticsSource,
          fileName: file.name,
          rawText: pdfTextForDiagnostics,
          preset: knownPreset,
          confidence: parsedFromTextLayer ? 0.86 : 0.99,
          warnings: confidence.ok ? [] : confidence.reasons
        }),
        {
          ocrTiming: {
            elapsedMs: Date.now() - startedAt,
            source: diagnosticsSource,
            note: parsedFromTextLayer ? "PDF \u6587\u5B57\u5C64\u5FEB\u901F\u89E3\u6790" : "\u5DF2\u77E5\u6A94\u540D\u4FDD\u5E95\u6B04\u4F4D"
          }
        }
      );
      updateStructuredData();
      return;
    } finally {
      setButtonLoading2(els.ocrBtn, false);
    }
  }
  const loadingText = isPdfFile(file) ? "PDF \u89E3\u6790\u4E2D..." : "\u5716\u7247 OCR \u4E2D...";
  const progressText = isPdfFile(file) ? "\u6B63\u5728\u89E3\u6790 PDF\uFF0C\u8ACB\u7A0D\u5019..." : "\u6B63\u5728\u9032\u884C\u5716\u7247 OCR\uFF0C\u8ACB\u7A0D\u5019...";
  return withActionUi(
    {
      button: els.ocrBtn,
      buttonText: loadingText,
      progressText,
      minDuration: 420
    },
    () => runOcr()
  );
}
var autoOcrRequestId = 0;
function cancelPendingAutoOcr() {
  autoOcrRequestId += 1;
}
function scheduleAutoOcrForSelectedFile(file) {
  if (!file) return;
  const requestId = ++autoOcrRequestId;
  const isPdf = isPdfFile(file);
  els.ocrLog.textContent = isPdf ? `PDF \u5DF2\u8F09\u5165\uFF1A${file.name}\uFF0C\u6B63\u5728\u81EA\u52D5\u89E3\u6790\u4E26\u5E36\u5165\u576A\u6578\u6B04\u4F4D\u3002` : `\u5716\u7247\u5DF2\u8F09\u5165\uFF1A${file.name}\uFF0C\u6B63\u5728\u81EA\u52D5 OCR \u4E26\u5E36\u5165\u576A\u6578\u6B04\u4F4D\u3002`;
  setOcrProgress2(2, isPdf ? "PDF \u81EA\u52D5\u89E3\u6790\u6E96\u5099\u4E2D" : "\u5716\u7247\u81EA\u52D5 OCR \u6E96\u5099\u4E2D");
  setTimeout(() => {
    const currentFile = primaryOcrSourceFile();
    if (requestId === autoOcrRequestId && currentFile === file && !els.ocrBtn.disabled) {
      void runOcrWithUi();
    }
  }, 0);
}
function activateTab(targetId) {
  const normalizedTargetId = targetId === "manualTab" ? "uploadTab" : targetId;
  document.querySelectorAll(".tab-btn").forEach((button) => {
    const active = button.dataset.tabTarget === normalizedTargetId;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", active ? "true" : "false");
  });
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    const active = panel.id === normalizedTargetId;
    panel.classList.toggle("active", active);
    panel.setAttribute("aria-hidden", active ? "false" : "true");
    panel.inert = !active;
  });
  const showValuationBlocks = normalizedTargetId === "uploadTab";
  ["valuationResultSection", "mortgageCalculatorSection", "valuationRulesSection", "seoStructureSection", "faqSection"].forEach((id) => {
    const element = document.getElementById(id);
    if (!element) return;
    element.classList.toggle("is-hidden", !showValuationBlocks);
    element.setAttribute("aria-hidden", showValuationBlocks ? "false" : "true");
    element.inert = !showValuationBlocks;
  });
}
function setRecordsPanelCollapsed(collapsed) {
  if (!els.recordsPanel) return;
  const isCollapsed = !!collapsed;
  els.recordsPanel.classList.toggle("records-panel-collapsed", isCollapsed);
  if (els.toggleRecordsPanelBtn) {
    els.toggleRecordsPanelBtn.textContent = isCollapsed ? "\u986F\u793A" : "\u96B1\u85CF";
    els.toggleRecordsPanelBtn.setAttribute("aria-expanded", isCollapsed ? "false" : "true");
  }
}
function scrollToElementById(id) {
  const element = document.getElementById(id);
  if (!element) return;
  requestAnimationFrame(() => {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}
function fillArea(element, data) {
  if (!data) return false;
  element.value = data.valuePing;
  return true;
}
function applyOcrParkingCountFromParsed(parsed) {
  const count = parsed?.parkingCount ?? parsed?.parkingDeedShare?.count;
  if (normalizeParkingCount2(count) > 0) return setOcrParkingCount(count);
  clearOcrParkingCount();
  return 0;
}
function applyKnownFilePreset(fileName, appendLog = false) {
  const preset = getKnownFilePreset(fileName);
  if (!preset) return false;
  clearOcrParkingCount();
  els.queryTitle.value = preset.title || els.queryTitle.value;
  const queryAddress = preset.queryAddress || preset.ownerResidence || preset.address || "";
  els.subjectAddress.value = queryAddress || els.subjectAddress.value;
  const rawRoad = preset.searchKeyword || buildSearchKeywordFromAddress(queryAddress) || buildSearchKeywordFromAddress(preset.address || "") || preset.road || "";
  els.roadKeyword.value = extractRoadThruSectionOnly2(rawRoad) || els.roadKeyword.value;
  els.totalFloors.value = preset.floors || els.totalFloors.value;
  if (preset.type) applyType(preset.type);
  if (preset.purpose) setCheckboxValues2(els.mainPurposePick, preset.purpose);
  els.tradeTarget.value = preset.target || els.tradeTarget.value;
  if (preset.main) els.mainArea.value = preset.main;
  if (preset.attach) els.attachArea.value = preset.attach;
  if (preset.common) els.commonArea.value = preset.common;
  if (preset.land && els.landShareArea) els.landShareArea.value = preset.land;
  if (preset.parking && els.parkingArea) els.parkingArea.value = preset.parking;
  if (preset.parkingCount) setOcrParkingCount(preset.parkingCount);
  if (preset.unitFloor && els.floorFilter) els.floorFilter.value = preset.unitFloor;
  syncDeedFieldsVisibility();
  if (appendLog) {
    els.ocrLog.textContent = preset.log;
  }
  lastOcrMapping = {
    source_file: fileName,
    mapped_by: "known_file_preset",
    \u5EFA\u7269\u9580\u724C: preset.address || "",
    \u4F4F\u5740: preset.ownerResidence || "",
    \u67E5\u8A62\u5730\u5740: queryAddress,
    \u5730\u5740: preset.address || "",
    \u9053\u8DEF\u540D\u7A31: preset.searchKeyword || preset.road || "",
    \u7E3D\u6A13\u5C64\u6578: preset.floors || "",
    \u5EFA\u7269\u578B\u614B: preset.type || "",
    \u4E3B\u8981\u7528\u9014: preset.purpose || "",
    \u4EA4\u6613\u6A19\u7684: preset.target || "",
    \u4E3B\u5EFA\u7269\u9762\u7A4D\u576A: preset.main || "",
    \u9644\u5C6C\u5EFA\u7269\u9762\u7A4D\u576A: preset.attach || "",
    \u5171\u6709\u90E8\u5206\u9762\u7A4D\u576A: preset.common || "",
    \u6A19\u7684\u571F\u5730\u6301\u5206\u576A\u5408\u8A08: preset.land || "",
    \u8ECA\u4F4D\u6B0A\u72C0\u576A\u6578: preset.parking || "",
    \u8ECA\u4F4D\u6578\u91CF: preset.parkingCount || "",
    \u5176\u4ED6\u767B\u8A18\u4E8B\u9805\u9762\u7A4D\u576A: "",
    \u623F\u5C4B\u576A\u6578: ""
  };
  setRecognizedAddressFields({
    property: preset.address || ""
  });
  updateAreaSummary(parseRecords(els.recordsInput.value || defaultRecords2).length);
  return true;
}
function hasDeedFieldValues() {
  return [els.mainArea, els.attachArea, els.commonArea, els.otherArea, els.landShareRaw, els.landShareArea, els.totalAreaOverride, els.parkingArea, els.parkingCount, els.parkingUnitPrice].some((input) => String(input?.value || "").trim() !== "");
}
function clearDeedDerivedFields() {
  [els.queryTitle, els.subjectAddress, els.roadKeyword, els.totalFloors, els.mainArea, els.attachArea, els.commonArea, els.otherArea, els.landShareRaw, els.landShareArea, els.totalAreaOverride, els.totalWithParkingArea, els.parkingArea, els.parkingCount, els.parkingUnitPrice].forEach((input) => {
    if (input) input.value = "";
  });
  clearOcrParkingCount();
  clearRecognizedAddressFields();
  lastLandValueTaxAutoParseSignature = "";
  els.cityName.value = "";
  populateDistrictOptions("");
  els.houseType.value = "";
  els.isTownhouse.checked = false;
  els.typeQuickPick.forEach((checkbox) => {
    checkbox.checked = false;
  });
  setCheckboxValues2(els.mainPurposePick, []);
  lastOcrMapping = {};
}
function syncDeedFieldsVisibility(forceOpen = null) {
  if (!els.deedFieldsPanel || !els.toggleDeedFieldsBtn) return;
  const manual = els.deedFieldsPanel.dataset.manual === "open";
  const shouldOpen = forceOpen == null ? manual || hasDeedFieldValues() : !!forceOpen;
  els.deedFieldsPanel.classList.toggle("is-hidden", !shouldOpen);
  els.toggleDeedFieldsBtn.textContent = shouldOpen ? "\u96B1\u85CF\u576A\u6578\u6B04\u4F4D" : "\u986F\u793A\u576A\u6578\u6B04\u4F4D";
}
function revealDeedFieldsAfterOcr() {
  if (els.deedFieldsPanel) els.deedFieldsPanel.dataset.manual = "open";
  syncDeedFieldsVisibility(true);
}
function isManualAdvancedVisible() {
  return !!els.manualAdvanced && !els.manualAdvanced.classList.contains("is-hidden");
}
function currentQuery() {
  const cityCode = els.cityName.value.trim();
  const districtCode = els.districtName.value.trim();
  const advancedVisible = isManualAdvancedVisible();
  const quickTypes = selectedTypes();
  const mainPurposes = advancedVisible ? selectedMainPurposes() : [];
  const usageZones = advancedVisible ? selectedUsageZones() : [];
  return {
    advancedVisible,
    queryTitle: els.queryTitle.value.trim() || "\u4E8C\u985E\u8B04\u672C\u4F30\u50F9\u67E5\u8A62",
    cityCode,
    cityName: selectedLabel(els.cityName),
    districtCode,
    districtName: selectedLabel(els.districtName),
    communityName: advancedVisible ? els.communityName.value.trim() : "",
    subjectAddress: advancedVisible ? els.subjectAddress.value.trim() : "",
    roadKeyword: els.roadKeyword.value.trim(),
    periodStartYear: els.periodStartYear.value.trim(),
    periodStartMonth: els.periodStartMonth.value.trim(),
    periodEndYear: els.periodEndYear.value.trim(),
    periodEndMonth: els.periodEndMonth.value.trim(),
    periodStart: composePeriod(els.periodStartYear.value.trim(), els.periodStartMonth.value.trim()),
    periodEnd: composePeriod(els.periodEndYear.value.trim(), els.periodEndMonth.value.trim()),
    dealTargets: selectedDealTargets(),
    priceUnit: selectedRadioValue2(els.priceUnitChoice, els.priceUnit?.value || "\u842C\u5143/\u576A"),
    areaUnit: selectedRadioValue2(els.areaUnitChoice, els.areaUnit?.value || "\u576A"),
    houseType: els.houseType.value.trim(),
    quickTypes,
    mainPurposes,
    usageZones,
    mainPurpose: mainPurposes.join("\u3001"),
    usageZone: usageZones.join("\u3001"),
    tradeTarget: advancedVisible ? els.tradeTarget.value.trim() : "",
    floorFilter: advancedVisible ? els.floorFilter.value.trim() : "",
    layoutFilter: advancedVisible ? els.layoutFilter.value.trim() : "",
    specialMode: document.querySelector('input[name="specialMode"]:checked')?.value || "exclude",
    specialKeywords: parseKeywords(els.specialKeywords.value),
    specialFilters: selectedSpecialRemarkFilters(),
    totalPriceMin: advancedVisible ? toNumber2(els.totalPriceMin.value) : null,
    totalPriceMax: advancedVisible ? toNumber2(els.totalPriceMax.value) : null,
    unitPriceMin: toNumber2(els.unitPriceMin.value),
    unitPriceMax: toNumber2(els.unitPriceMax.value),
    mainAreaMinFilter: toNumber2(els.mainAreaMinFilter.value),
    mainAreaMaxFilter: toNumber2(els.mainAreaMaxFilter.value),
    houseAgeMin: toNumber2(els.houseAgeMin.value),
    houseAgeMax: toNumber2(els.houseAgeMax.value),
    deedArea: areaInfo()
  };
}
function subjectMapAddress() {
  return els.subjectAddress?.value?.trim() || els.recognizedPropertyAddress?.value?.trim() || "";
}
function clearSubjectUnderwritingGeocode() {
  lastSubjectUnderwritingGeocode = null;
}
function geocodeApiUrl() {
  if (window.location.protocol === "file:") {
    return "http://127.0.0.1:5606/api/geocode/address";
  }
  return "/api/geocode/address";
}
function geocodeReliableForUnderwriting(geocode = {}) {
  const provider = String(geocode.provider || "").toLowerCase();
  if (/(same_road|same_lane|nearby|nominatim_road)/.test(provider)) return false;
  const confidence = toNumber2(geocode.confidence);
  return confidence == null || confidence >= 0.7;
}
function underwritingGeocodeError(message, geocode = {}, error = "geocode_low_confidence") {
  const err = new Error(message);
  err.data = { ok: false, error, message, geocode };
  return err;
}
function underwritingGeocodeLowConfidenceMessage(geocode = {}) {
  const provider = String(geocode.provider || "unknown");
  const confidence = toNumber2(geocode.confidence);
  const confidenceLabel = confidence == null ? "--" : confidence.toFixed(2);
  return `\u5B9A\u4F4D\u4FE1\u5FC3\u4E0D\u8DB3\uFF08${provider} / ${confidenceLabel}\uFF09\uFF0C\u70BA\u907F\u514D\u627F\u4F5C\u5206\u5340\u8AA4\u5224\uFF0C\u8ACB\u88DC\u6B63\u9580\u724C\u5EA7\u6A19\u6216\u7B49\u5F85\u7CBE\u6E96\u5B9A\u4F4D\u5B8C\u6210\u3002`;
}
function geocodeCoordinatePayload(address, geocode = {}) {
  const lat = toNumber2(geocode.lat);
  const lng = toNumber2(geocode.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { address, lat, lng };
}
async function locateSubjectCoordinateForUnderwriting(address) {
  const normalizedAddress = String(address || "").trim();
  if (!normalizedAddress) {
    throw underwritingGeocodeError("\u5C1A\u7121\u5EFA\u7269\u9580\u724C\u53EF\u5B9A\u4F4D\u3002", {}, "missing_address");
  }
  if (lastSubjectUnderwritingGeocode?.address === normalizedAddress) {
    return lastSubjectUnderwritingGeocode.geocode;
  }
  const geocode = await fetchApiJson(geocodeApiUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address: normalizedAddress, provider: "local" }),
    cache: "no-store",
    timeoutMs: 12e3
  });
  const payload = geocodeCoordinatePayload(normalizedAddress, geocode);
  if (!payload) {
    throw underwritingGeocodeError("\u5EFA\u7269\u9580\u724C\u5C1A\u672A\u53D6\u5F97\u53EF\u7528\u5EA7\u6A19\u3002", geocode || {}, "geocode_not_found");
  }
  const reliable = geocodeReliableForUnderwriting(geocode);
  const enrichedGeocode = {
    ...geocode,
    ...payload,
    underwritingReliable: reliable,
    underwritingApproximate: !reliable,
    underwritingWarning: reliable ? "" : underwritingGeocodeLowConfidenceMessage(geocode)
  };
  lastSubjectUnderwritingGeocode = { address: normalizedAddress, geocode: enrichedGeocode };
  return lastSubjectUnderwritingGeocode.geocode;
}
function scheduleUnderwritingZoneRefresh(reason = "subject-address") {
  if (underwritingZoneAutoTimer) clearTimeout(underwritingZoneAutoTimer);
  underwritingZoneAutoTimer = setTimeout(() => {
    underwritingZoneAutoTimer = null;
    void refreshUnderwritingZoneCard(currentQuery(), { reason });
  }, 180);
}
function syncLoanableAmountCard() {
  if (!els.loanableAmount || !els.loanableAmountSub) return;
  const result = calculateLoanableAmountWan2(
    toNumber2(els.houseValue?.textContent),
    els.underwritingZone?.textContent || ""
  );
  els.loanableAmount.textContent = result.display;
  els.loanableAmountSub.textContent = result.sub;
  if (els.loanableAmountCard) {
    els.loanableAmountCard.dataset.loanableStatus = result.status;
  }
}
function setUnderwritingZoneCard({ zone = "--", sub = "\u67E5\u8A62\u5F8C\u81EA\u52D5\u5E36\u5165", source = "--" } = {}) {
  if (!els.underwritingZone || !els.underwritingZoneSub || !els.underwritingZoneSource) return;
  els.underwritingZone.textContent = zone || "--";
  els.underwritingZoneSub.textContent = sub || "\u67E5\u8A62\u5F8C\u81EA\u52D5\u5E36\u5165";
  els.underwritingZoneSource.textContent = source || "--";
  syncLoanableAmountCard();
}
function underwritingZoneAddressFromQuery(query = currentQuery()) {
  const city = String(query?.cityName || "").trim();
  const district = String(query?.districtName || "").trim();
  const roadKeyword = String(query?.roadKeyword || "").trim();
  const compactDoorplateAddress = [city, district, roadKeyword].filter(Boolean).join("");
  if (city && district && /號/.test(roadKeyword)) return compactDoorplateAddress;
  const queryAddress = String(els.subjectAddress?.value || query?.subjectAddress || "").trim();
  if (queryAddress) return queryAddress;
  const recognizedAddress = String(els.recognizedPropertyAddress?.value || "").trim();
  if (recognizedAddress) return recognizedAddress;
  return [
    query?.cityName,
    query?.districtName,
    query?.roadKeyword,
    query?.communityName
  ].map((part) => String(part || "").trim()).filter(Boolean).join("");
}
function underwritingZoneApiUrl() {
  if (window.location.protocol === "file:") {
    return "http://127.0.0.1:5606/api/cathay/underwriting-zone";
  }
  return "/api/cathay/underwriting-zone";
}
function primaryUnderwritingZoneLabel(zone = {}) {
  const candidates = [
    zone.underwriting_zone,
    zone.zone_name,
    zone.admin_limit_grade,
    zone.description
  ];
  return candidates.map((value) => String(value || "").trim()).find(Boolean) || "\u5DF2\u5B9A\u4F4D";
}
function underwritingZoneSubLabel(zone = {}, result = {}) {
  const districtLabel = [zone.city, zone.district].map((value) => String(value || "").trim()).filter(Boolean).join("");
  const zoneName = String(zone.zone_name || "").trim();
  const grade = String(zone.admin_limit_grade || "").trim();
  const pieces = [districtLabel, zoneName, grade].filter((value, index, array) => value && array.indexOf(value) === index);
  if (result.underwritingApproximate) {
    const base = pieces.length ? pieces.join("\uFF5C") : "\u5DF2\u4F9D\u8FD1\u4F3C\u5EA7\u6A19\u5B9A\u4F4D";
    return `${base}\uFF5C\u8FD1\u4F3C\u5B9A\u4F4D\uFF0C\u8ACB\u8907\u6838\u9580\u724C\u5EA7\u6A19`;
  }
  if (pieces.length) return pieces.join("\uFF5C");
  return result.geocode ? "\u5DF2\u4F9D\u5EFA\u7269\u9580\u724C\u5B9A\u4F4D" : "\u5DF2\u4F9D\u5EA7\u6A19\u5B9A\u4F4D";
}
function underwritingZoneSourceLabel(result = {}) {
  if (result.underwritingApproximate) {
    const geocode = result.geocode || {};
    const provider = String(geocode.provider || "\u8FD1\u4F3C\u5B9A\u4F4D").replace(/-/g, " ");
    const confidence = toNumber2(geocode.confidence);
    return confidence == null ? `\u8FD1\u4F3C\u5B9A\u4F4D\uFF5C${provider}` : `\u8FD1\u4F3C\u5B9A\u4F4D\uFF5C${provider} / ${confidence.toFixed(2)}`;
  }
  const zone = result.zone || {};
  const source = String(result.backend || "PostGIS").replace(/-/g, " ");
  const version = String(zone.data_version || "").trim();
  return version ? `${source}\uFF5C${version}` : source;
}
function underwritingZoneFailureSourceLabel(data = {}) {
  if (data?.error === "geocode_low_confidence") return "\u5B9A\u4F4D\u4FE1\u5FC3\u4E0D\u8DB3";
  return "PostGIS \u5206\u5340\u5716\u5C64";
}
async function refreshUnderwritingZoneCard(query = currentQuery(), options = {}) {
  const seq = ++underwritingZoneLookupSeq;
  const address = underwritingZoneAddressFromQuery(query);
  if (!address) {
    setUnderwritingZoneCard({
      zone: "\u672A\u5B9A\u4F4D",
      sub: "\u5C1A\u7121\u5EFA\u7269\u9580\u724C\u6216\u5EA7\u6A19\u53EF\u67E5\u8A62",
      source: "--"
    });
    return;
  }
  setUnderwritingZoneCard({
    zone: "\u5B9A\u4F4D\u4E2D",
    sub: address,
    source: "\u5EFA\u7269\u9580\u724C\u5B9A\u4F4D"
  });
  try {
    const geocode = await locateSubjectCoordinateForUnderwriting(address);
    if (seq !== underwritingZoneLookupSeq) return;
    const payload = {
      lat: geocode.lat,
      lng: geocode.lng,
      address
    };
    setUnderwritingZoneCard({
      zone: "\u67E5\u8A62\u4E2D",
      sub: geocode.underwritingApproximate ? `\u8FD1\u4F3C\u5B9A\u4F4D ${Number(geocode.lat).toFixed(6)}, ${Number(geocode.lng).toFixed(6)}\uFF0C\u6B63\u5728\u67E5\u627F\u4F5C\u5206\u5340` : `\u5DF2\u5B9A\u4F4D ${Number(geocode.lat).toFixed(6)}, ${Number(geocode.lng).toFixed(6)}\uFF0C\u6B63\u5728\u67E5\u627F\u4F5C\u5206\u5340`,
      source: geocode.underwritingApproximate ? underwritingZoneSourceLabel({ underwritingApproximate: true, geocode }) : geocode.provider ? `\u5EFA\u7269\u9580\u724C\u5B9A\u4F4D\uFF5C${geocode.provider}` : "\u5EFA\u7269\u9580\u724C\u5B9A\u4F4D"
    });
    const result = await fetchApiJson(underwritingZoneApiUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      timeoutMs: 12e3
    });
    if (seq !== underwritingZoneLookupSeq) return;
    if (!result?.ok || !result?.zone) {
      setUnderwritingZoneCard({
        zone: "\u672A\u53D6\u5F97",
        sub: String(result?.message || "\u5EA7\u6A19\u672A\u843D\u5728\u627F\u4F5C\u5206\u5340\u5716\u5C64\u5167\u3002"),
        source: underwritingZoneSourceLabel(result || {})
      });
      return;
    }
    const displayResult = {
      ...result,
      geocode,
      underwritingApproximate: !!geocode.underwritingApproximate,
      underwritingWarning: geocode.underwritingWarning || ""
    };
    setUnderwritingZoneCard({
      zone: primaryUnderwritingZoneLabel(result.zone),
      sub: underwritingZoneSubLabel(result.zone, displayResult),
      source: underwritingZoneSourceLabel(displayResult)
    });
  } catch (error) {
    if (seq !== underwritingZoneLookupSeq) return;
    const errorData = error?.data || {};
    const errorCode = String(errorData?.error || "");
    const errorText = String(errorData?.message || error?.message || "\u627F\u4F5C\u5206\u5340\u67E5\u8A62\u5931\u6557");
    const zoneServiceOffline = /failed to fetch|networkerror|load failed|connection refused|5433/i.test(errorText);
    const friendlyMessage = errorCode === "geocode_low_confidence" ? errorText : zoneServiceOffline ? "\u627F\u4F5C\u5206\u5340\u672C\u6A5F\u670D\u52D9\u672A\u9023\u7DDA\uFF1B\u8ACB\u78BA\u8A8D Colima/Docker \u8207 found-realprice-postgis \u5DF2\u555F\u52D5\u5F8C\u91CD\u65B0\u67E5\u8A62\u3002" : /geocode_not_found|nominatim|座標|lat\/lng/i.test(errorText) ? "\u5730\u5740\u5C1A\u672A\u5B8C\u6210\u5EA7\u6A19\u5B9A\u4F4D\uFF1B\u53EF\u5148\u88DC\u5EA7\u6A19\u6216\u7B49\u5F85\u672C\u6A5F\u5730\u7406\u7DE8\u78BC\u670D\u52D9\u6062\u5FA9\u3002" : errorText;
    setUnderwritingZoneCard({
      zone: "\u672A\u53D6\u5F97",
      sub: friendlyMessage,
      source: underwritingZoneFailureSourceLabel(errorData)
    });
  }
}
function finishValuationSearch(query, keepProgress) {
  syncLoanableAmountCard();
  updateStructuredData();
  void refreshUnderwritingZoneCard(query);
  if (!keepProgress) {
    setQueryProgress(false);
  }
}
function maybeDispatchValuationResultsUpdated(query) {
  const rows = Array.isArray(lastSearch?.rows) ? lastSearch.rows : [];
  if (!rows.length) return;
  const address = subjectMapAddress();
  if (!address) return;
  const subjectUnitPrice = toNumber2(els.avgUnitPrice?.textContent);
  const rowFingerprint = rows.slice(0, 5).map((row) => [
    row.address,
    row.unitPrice,
    row.tradeDate || row.tradeYearMonth || row.transaction_date || ""
  ].join(":")).join("|");
  const signature = [
    address,
    rows.length,
    lastSearch?.avg ?? "",
    lastSearch?.estimate ?? "",
    rowFingerprint
  ].join("||");
  if (signature === lastValuationResultSignature) return;
  lastValuationResultSignature = signature;
  document.dispatchEvent(new CustomEvent("found:valuation-results-updated", {
    detail: {
      subjectAddress: address,
      subjectUnitPrice: subjectUnitPrice ?? lastSearch?.avg ?? null,
      subjectLocation: {
        address,
        subjectUnitPrice: subjectUnitPrice ?? lastSearch?.avg ?? null,
        geocode: {
          lat: null,
          lng: null
        }
      },
      query,
      results: lastSearch
    }
  }));
}
function updateStructuredData() {
  const query = currentQuery();
  const dataset = { query, results: lastSearch, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SearchResultsPage",
        name: query.queryTitle,
        inLanguage: "zh-Hant",
        mainEntity: {
          "@type": "ItemList",
          itemListElement: lastSearch.rows.map((row, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: row.address,
            additionalProperty: [
              { "@type": "PropertyValue", name: "\u55AE\u50F9(\u842C\u5143/\u576A)", value: row.unitPrice },
              { "@type": "PropertyValue", name: "\u7E3D\u50F9(\u842C\u5143)", value: row.totalPrice },
              { "@type": "PropertyValue", name: "\u578B\u614B", value: row.type }
            ]
          }))
        }
      },
      {
        "@type": "Dataset",
        name: `${query.queryTitle}\uFF5C\u67E5\u8A62\u6B04\u4F4D\u8207\u4F30\u50F9\u7D50\u679C`,
        inLanguage: "zh-Hant",
        variableMeasured: [
          { "@type": "PropertyValue", name: "\u6A19\u7684\u5730\u5740", value: query.subjectAddress },
          { "@type": "PropertyValue", name: "\u9580\u724C/\u793E\u5340\u540D\u7A31", value: query.roadKeyword },
          { "@type": "PropertyValue", name: "\u5EFA\u7269\u578B\u614B", value: query.houseType || query.quickTypes.join("\u3001") },
          { "@type": "PropertyValue", name: "\u4E3B\u8981\u7528\u9014", value: query.mainPurposes.join("\u3001") },
          { "@type": "PropertyValue", name: "\u4EA4\u6613\u6A19\u7684", value: query.tradeTarget },
          { "@type": "PropertyValue", name: "\u7279\u6B8A\u4EA4\u6613\u95DC\u9375\u5B57", value: query.specialKeywords.join("\u3001") },
          { "@type": "PropertyValue", name: "\u623F\u5C4B\u576A\u6578", value: query.deedArea.house },
          { "@type": "PropertyValue", name: "\u8ECA\u4F4D\u576A\u6578", value: query.deedArea.parking },
          { "@type": "PropertyValue", name: "\u7E3D\u576A\u6578", value: query.deedArea.total },
          { "@type": "PropertyValue", name: "\u4F30\u503C\u576A\u6578", value: query.deedArea.usable },
          { "@type": "PropertyValue", name: "\u6A19\u7684\u571F\u5730\u6301\u5206\u576A\u5408\u8A08", value: query.deedArea.landShare },
          { "@type": "PropertyValue", name: "\u5E73\u5747\u55AE\u50F9(\u842C\u5143/\u576A)", value: lastSearch.avg },
          { "@type": "PropertyValue", name: "\u4F30\u7B97\u623F\u5C4B\u50F9\u503C(\u842C\u5143)", value: lastSearch.estimate }
        ]
      }
    ]
  };
  writeJsonScript(els.dynamicStructuredData, graph);
  writeSearchDataset(els.dynamicSearchDataset, dataset);
  maybeDispatchValuationResultsUpdated(query);
}
function toOfficialPtype(query) {
  const picks = [];
  if (query.dealTargets.includes("\u623F\u5730")) picks.push("1");
  if (query.dealTargets.includes("\u623F\u5730(\u8ECA)")) picks.push("2");
  if (query.dealTargets.includes("\u571F\u5730")) picks.push("3");
  if (query.dealTargets.includes("\u5EFA\u7269")) picks.push("4");
  if (query.dealTargets.includes("\u55AE\u4F4D")) picks.push("5");
  return picks.length ? picks.join(",") : "1,2";
}
function toOfficialFtype(query) {
  const type = query.houseType || query.quickTypes[0] || "";
  const map = {
    "\u516C\u5BD3": "01",
    "\u900F\u5929": "02",
    "\u83EF\u5EC8": "06",
    "\u4F4F\u5B85\u5927\u6A13": "05"
  };
  return map[type] || "";
}
function officialUriEncodeField(value) {
  return encodeURIComponent(String(value ?? ""));
}
function toOfficialPatternNo(raw) {
  const no = String(raw || "").trim();
  if (!no) return "";
  const digitsOnly = (s) => /^[0-9]+$/.test(String(s ?? ""));
  const pad10 = (str) => {
    let s = String(str);
    while (s.length < 10) s = `0${s}`;
    return s;
  };
  const ary = no.split("/");
  if (ary.length === 1) {
    const p = ary[0].trim();
    if (!digitsOnly(p)) return "";
    return `${pad10(p)}${pad10("0")}${pad10("0")}Y`;
  }
  if (ary.length === 2) {
    let acc = "";
    for (let i = 0; i < 2; i++) {
      const p = ary[i].trim();
      if (!digitsOnly(p)) return "";
      acc += pad10(p);
    }
    return `${acc}${pad10("0")}Y`;
  }
  if (ary.length === 3) {
    let acc = "";
    for (let i = 0; i < 3; i++) {
      const p = ary[i].trim();
      if (!digitsOnly(p)) return "";
      acc += pad10(p);
    }
    return `${acc}Y`;
  }
  if (ary.length === 4) {
    let acc = "";
    for (let i = 0; i < 3; i++) {
      const p = ary[i].trim();
      if (!digitsOnly(p)) return "";
      acc += pad10(p);
    }
    return `${acc}${ary[3]}`;
  }
  return "";
}
function isTownhouseQuery(query) {
  if (!query) return false;
  if (query.houseType === "\u900F\u5929") return true;
  return Array.isArray(query.quickTypes) && query.quickTypes.includes("\u900F\u5929");
}
function extractLandTransferAreaFromText(text) {
  const raw = fixOfficialText(String(text || ""));
  const m = raw.match(/土地移轉面積坪?\s*[=:：]\s*(\d+(?:\.\d+)?)/);
  if (m) return toNumber2(m[1]);
  const m2 = raw.match(/土地移轉面積[^\d]{0,12}(\d+(?:\.\d+)?)\s*(平方公尺|平方?米|㎡|m2|坪)?/);
  if (!m2) return null;
  return normalizeOfficialAreaPing(`${m2[1]}${m2[2] || "\u576A"}`);
}
function extractOriginalOfficialUnitPriceFromText(text) {
  const raw = fixOfficialText(String(text || ""));
  const m = raw.match(/原始官方單價萬元每坪\s*[=:：]\s*(\d+(?:\.\d+)?)/);
  return m ? toNumber2(m[1]) : null;
}
function extractOfficialSqFromText(text) {
  const raw = fixOfficialText(String(text || ""));
  const m = raw.match(/官方序號\s*[=:：]\s*([^；,，\s]+)/);
  return m ? m[1] : "";
}
function extractCoordinateFromText(text, keys) {
  const raw = normalizeFullWidthDigitsToAscii3(fixOfficialText(String(text || "")));
  const keyPattern = Array.isArray(keys) ? keys.join("|") : String(keys || "");
  const match = raw.match(new RegExp(`(?:${keyPattern})\\s*[=:\uFF1A]\\s*(-?\\d+(?:\\.\\d+)?)`, "i"));
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}
function hideOfficialSqInNote(note) {
  const raw = fixOfficialText(String(note || "")).trim();
  if (!raw) return "";
  return raw.replace(/(?:^|[；;，,\s]+)官方序號\s*[=:：]\s*[^；;，,\s]+/g, (matched) => /^[；;，,\s]/.test(matched) ? matched[0] : "").replace(/(?:^|[；;，,\s]+)官方車位數量\s*[=:：]\s*\d+/g, (matched) => /^[；;，,\s]/.test(matched) ? matched[0] : "").replace(/(?:^|[；;，,\s]+)(?:lat|緯度)\s*[=:：]\s*-?\d+(?:\.\d+)?/gi, (matched) => /^[；;，,\s]/.test(matched) ? matched[0] : "").replace(/(?:^|[；;，,\s]+)(?:lng|lon|經度)\s*[=:：]\s*-?\d+(?:\.\d+)?/gi, (matched) => /^[；;，,\s]/.test(matched) ? matched[0] : "").replace(/[；;]\s*[；;]+/g, "\uFF1B").replace(/[，,]\s*[，,]+/g, "\uFF0C").replace(/^[；;，,\s]+|[；;，,\s]+$/g, "").trim();
}
function applyTownhouseLandUnitPrice(rows) {
  rows.forEach((row) => {
    const landArea = toNumber2(row.landTransferArea) ?? extractLandTransferAreaFromText(row.note);
    if (landArea == null || landArea <= 0 || row.totalPrice == null || row.totalPrice <= 0) return;
    row.landTransferArea = +landArea.toFixed(3);
    if (row.originalUnitPrice == null) row.originalUnitPrice = row.unitPrice;
    row.unitPrice = +(row.totalPrice / landArea).toFixed(3);
  });
  return rows;
}
function detailLandTransferArea(detail) {
  const candidates = [];
  const visit = (value) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (typeof value !== "object") return;
    const hasLandAreaKey = ["d2", "landTransferArea", "landArea", "\u571F\u5730\u79FB\u8F49\u9762\u7A4D"].some((key) => value[key] != null);
    if (hasLandAreaKey) candidates.push(value);
    ["d", "land", "lands", "landData", "landList", "\u571F\u5730\u8CC7\u6599"].forEach((key) => visit(value[key]));
  };
  visit(detail);
  if (!candidates.length && typeof detail === "object") {
    for (const [key, value] of Object.entries(detail || {})) {
      if (/土地.*移轉.*面積/.test(key)) candidates.push({ \u571F\u5730\u79FB\u8F49\u9762\u7A4D: value });
    }
  }
  const sum = candidates.reduce((total, item) => {
    const value = normalizeOfficialAreaPing(
      item?.d2 ?? item?.landTransferArea ?? item?.landArea ?? item?.\u571F\u5730\u79FB\u8F49\u9762\u7A4D
    );
    return value != null ? total + value : total;
  }, 0);
  return sum > 0 ? +sum.toFixed(3) : null;
}
async function hydrateTownhouseLandTransferAreas(rows, sid, queryPath, common, options = {}) {
  if (!sid || !queryPath || !common || typeof common.getEncodeStr !== "function") return rows;
  const { signal = null } = options;
  const targets = rows.filter((row) => row.landTransferArea == null && row.sq);
  for (let i = 0; i < targets.length; i += 1) {
    if (signal?.aborted) break;
    const row = targets[i];
    setQueryProgressStage(`\u6B65\u9A5F 4/4\uFF1A\u6B63\u5728\u8B80\u53D6\u900F\u5929\u571F\u5730\u660E\u7D30 ${i + 1}/${targets.length}`);
    try {
      const q = String(common.getEncodeStr({
        qryType: "biz",
        sq: row.sq,
        cp: row.rawParkingPrice ?? "",
        unit: "2",
        t_unit: "1",
        p_unit: "1",
        t: row.rawTarget || row.target || "",
        f: row.rawFloorInfo || row.floorInfo || ""
      }) || "").trim();
      if (!q) continue;
      const detail = await fetchApiJson("/api/lvr/detail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sid, path: queryPath, q }),
        timeoutMs: OFFICIAL_DETAIL_TIMEOUT_MS,
        signal
      });
      const landArea = detailLandTransferArea(detail);
      if (landArea != null && landArea > 0) {
        row.landTransferArea = landArea;
      }
    } catch (error) {
      console.warn("\u900F\u5929\u571F\u5730\u660E\u7D30\u8B80\u53D6\u5931\u6557", row.sq, error);
    }
  }
  applyTownhouseLandUnitPrice(rows);
  return rows;
}
function rowFloorIsFullLevel2(floorInfo) {
  const raw = String(floorInfo || "").trim();
  if (!raw) return false;
  const firstSeg = raw.split(/[\/／]/)[0].replace(/\s+/g, "");
  return firstSeg === "\u5168" || /^全(?:層|樓|棟)?$/u.test(firstSeg);
}
function rowMatchesTownhouseRule(row) {
  if (!row) return false;
  const typeText = String(row.type || "");
  if (typeText.includes("\u900F\u5929")) return true;
  return rowFloorIsFullLevel2(row.floorInfo);
}
function matchesHouseTypeRule(row, type) {
  const t = String(type || "").trim();
  if (!t) return true;
  if (t === "\u900F\u5929") return rowMatchesTownhouseRule(row);
  return includesToken(row.type, t);
}
function preferredComparableTypes(query) {
  const values = [
    ...Array.isArray(query?.quickTypes) ? query.quickTypes : [],
    query?.houseType
  ].map((value) => String(value || "").trim()).filter(Boolean);
  return [...new Set(values)];
}
function rowMatchesAnyPreferredType(row, preferredTypes) {
  const types = Array.isArray(preferredTypes) ? preferredTypes.map((type) => String(type || "").trim()).filter(Boolean) : [];
  if (!types.length) return true;
  return types.some((type) => matchesHouseTypeRule(row, type));
}
function normalizeOfficialAmount(raw, divisor = 1) {
  const value = toNumber2(raw);
  return value == null ? null : +(value / divisor).toFixed(3);
}
function normalizeOfficialParkingPrice(raw) {
  const v = toNumber2(String(raw ?? "").replace(/,/g, ""));
  if (v == null || !Number.isFinite(v)) return null;
  if (v === 0) return 0;
  if (v < 1e4) return +v.toFixed(3);
  return +(v / 1e4).toFixed(3);
}
function normalizeOfficialAreaPing(raw) {
  const text = fixOfficialText(String(raw ?? "")).replace(/,/g, "").trim();
  if (!text) return null;
  const m = text.match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const value = Number(m[1]);
  if (!Number.isFinite(value)) return null;
  return /平方公尺|平方?米|㎡|m2/i.test(text) ? +(value / 3.305785).toFixed(3) : +value.toFixed(3);
}
function officialLandTransferArea(row) {
  const detailRows = Array.isArray(row?.d) ? row.d : [];
  const detailSum = detailRows.reduce((sum, item) => {
    const value = normalizeOfficialAreaPing(item?.d2 ?? item?.area ?? item?.s);
    return value != null ? sum + value : sum;
  }, 0);
  if (detailSum > 0) return +detailSum.toFixed(3);
  const fallbackKeys = ["landTransferArea", "landArea", "ls", "land_s", "landarea"];
  for (const key of fallbackKeys) {
    const value = normalizeOfficialAreaPing(row?.[key]);
    if (value != null && value > 0) return value;
  }
  return null;
}
function officialRowSq(row) {
  return fixOfficialText(row?.sq || row?.SQ || row?.sqno || row?.SQNO || row?.id || row?.ID || row?.rowid || row?.serial || row?.sn || row?.no || "");
}
function isOfficialDetailLeakAddress(address) {
  const text = normalizeFullWidthDigitsToAscii3(fixOfficialText(address || "")).replace(/\s+/g, "").trim();
  if (!text) return false;
  return [
    /買賣價款/,
    /新[臺台]幣/,
    /NT\$|NTD|\$\d/i,
    /親友|員工|共有人|特殊關係/,
    /其他增建/,
    /^(房屋|土地|建物|車位)[:：]/,
    /價款[:：]/
  ].some((pattern) => pattern.test(text));
}
function isValidOfficialTransactionRow(row) {
  const address = fixOfficialText(row?.address || "");
  if (!address || isOfficialDetailLeakAddress(address)) return false;
  const hasTradeDate = normalizePeriodValue(row.tradeDate || row.tradeYearMonth) != null;
  const hasTotalPrice = Number.isFinite(row.totalPrice) && row.totalPrice > 0;
  const hasUnitPrice = Number.isFinite(row.unitPrice) && row.unitPrice > 0;
  const hasTotalArea = Number.isFinite(row.totalArea) && row.totalArea > 0;
  return hasTradeDate || hasTotalPrice || hasUnitPrice || hasTotalArea;
}
function normalizeOfficialRow(row) {
  const address = fixOfficialText(String(row.a || "").split("#").pop().trim());
  const mainRatio = toNumber2(row.bs ?? row.es);
  const totalArea = toNumber2(row.s);
  const totalPrice = normalizeOfficialAmount(row.tp, 1e4);
  const rawUnitPrice = normalizeOfficialAmount(row.p, 1e4);
  const derivedUnitPrice = rawUnitPrice != null ? rawUnitPrice : totalPrice != null && totalArea != null && totalArea > 0 ? +(totalPrice / totalArea).toFixed(3) : null;
  return {
    address,
    community: fixOfficialText(row.bn || ""),
    tradeDate: fixOfficialText(row.e || ""),
    totalPrice,
    unitPrice: derivedUnitPrice,
    totalArea,
    mainRatio,
    type: fixOfficialText(row.b || ""),
    age: toNumber2(String(row.g ?? "").replace(/[^\d.]/g, "")),
    floorInfo: fixOfficialText(row.f || ""),
    target: fixOfficialText(row.t || ""),
    tradeCount: `\u571F${row.j || 0} \u5EFA${row.k || 0} \u8ECA${row.l || 0}`,
    parkingCount: normalizeComparableParkingCount2(row.l),
    layout: fixOfficialText(row.v || ""),
    rawParkingPrice: fixOfficialText(row.cp ?? ""),
    parkingPrice: normalizeOfficialParkingPrice(row.cp),
    purpose: fixOfficialText(row.pu || ""),
    management: fixOfficialText(row.ma || row.m || ""),
    elevator: fixOfficialText(row.el || row.cinfo || ""),
    history: fixOfficialText(row.tx || row.history || row.transfer || ""),
    note: fixOfficialText(row.note || ""),
    sq: officialRowSq(row),
    rawTarget: fixOfficialText(row.t || ""),
    rawFloorInfo: fixOfficialText(row.f || ""),
    district: deriveDistrict(address),
    road: deriveRoad(address),
    tradePeriodValue: normalizePeriodValue(row.e),
    landTransferArea: officialLandTransferArea(row),
    mainAreaForFilter: totalArea
  };
}
function officialRowsToRecordText(rows) {
  return rows.map((row) => [
    row.address,
    row.community || "",
    row.tradeDate || "",
    row.unitPrice ?? "",
    row.totalPrice ?? "",
    row.totalArea ?? "",
    row.mainRatio ?? "",
    row.type || "",
    row.age ?? "",
    row.floorInfo || "",
    row.purpose || "",
    row.target || "",
    row.layout || "",
    row.parkingPrice ?? "",
    row.management || "",
    row.elevator || "",
    row.history || "",
    [
      hideOfficialSqInNote(row.note || ""),
      row.sq ? `\u5B98\u65B9\u5E8F\u865F=${row.sq}` : "",
      row.parkingCount > 0 ? `\u5B98\u65B9\u8ECA\u4F4D\u6578\u91CF=${row.parkingCount}` : "",
      row.landTransferArea != null ? `\u571F\u5730\u79FB\u8F49\u9762\u7A4D\u576A=${row.landTransferArea}` : "",
      row.originalUnitPrice != null ? `\u539F\u59CB\u5B98\u65B9\u55AE\u50F9\u842C\u5143\u6BCF\u576A=${row.originalUnitPrice}` : "",
      row.lat != null ? `\u7DEF\u5EA6=${row.lat}` : "",
      row.lng != null ? `\u7D93\u5EA6=${row.lng}` : "",
      row.localFallback ? "\u8CC7\u6599\u4F86\u6E90=\u672C\u6A5F\u96E2\u7DDA\u5099\u63F4" : ""
    ].filter(Boolean).join("\uFF1B")
  ].join("	")).join("\n");
}
function manualPlaceKeyword(raw = "") {
  return fixOfficialText(String(raw || "")).trim();
}
function isDoorplateKeyword(raw = "") {
  const text = normalizeFullWidthDigitsToAscii3(manualPlaceKeyword(raw)).replace(/\s+/g, "");
  return /(?:\d+|[一二三四五六七八九十百千]+)號/u.test(text) || text.includes("\u865F");
}
function isRoadOrLandKeyword(raw = "") {
  const text = manualPlaceKeyword(raw).replace(/\s+/g, "");
  if (!text) return false;
  return /(路|街|大道|巷|弄|段|地號|小段|段\d+地號)/u.test(text);
}
function isCommunityKeyword(raw = "") {
  const text = manualPlaceKeyword(raw).replace(/\s+/g, "");
  if (!text) return false;
  if (isDoorplateKeyword(text) || /地號/u.test(text)) return false;
  if (/(社區|大樓|國宅|花園|廣場|名廈|公寓|家園|山莊|新城|之星|官邸|名邸|華廈|城堡|世家|苑|邸|園|城)$/u.test(text)) return true;
  if (isRoadOrLandKeyword(text)) return false;
  return true;
}
function officialPlaceSearchTerms(query) {
  const placeKeyword = manualPlaceKeyword(query.roadKeyword || query.communityName || "");
  const explicitDoor = manualPlaceKeyword(query.subjectAddress || "");
  if (!placeKeyword) {
    return { buildKeyword: "", doorKeyword: explicitDoor, communityKeyword: "" };
  }
  if (isCommunityKeyword(placeKeyword)) {
    return { buildKeyword: "", doorKeyword: explicitDoor, communityKeyword: placeKeyword };
  }
  if (isDoorplateKeyword(placeKeyword)) {
    const roadPart = extractRoadThruSectionOnly2(placeKeyword) || buildSearchKeywordFromAddress(placeKeyword) || detectRoadFromAddress(placeKeyword) || "";
    return {
      buildKeyword: roadPart || placeKeyword,
      doorKeyword: explicitDoor || placeKeyword,
      communityKeyword: placeKeyword
    };
  }
  return { buildKeyword: placeKeyword, doorKeyword: explicitDoor, communityKeyword: placeKeyword };
}
function rocMonthToIsoDate(yearText, monthText, endOfMonth = false) {
  const rocYear = Number(String(yearText || "").trim());
  const month = Number(String(monthText || "").trim());
  if (!Number.isFinite(rocYear) || !Number.isFinite(month) || rocYear <= 0 || month < 1 || month > 12) return "";
  const year = rocYear < 1911 ? rocYear + 1911 : rocYear;
  const day = endOfMonth ? new Date(year, month, 0).getDate() : 1;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function localFallbackUnitPriceValue(value) {
  const number = toNumber2(value);
  if (number == null) return "";
  const unit = selectedRadioValue2(els.priceUnitChoice, els.priceUnit?.value || "\u842C\u5143/\u576A");
  return String(unit === "\u5143/\u576A" ? +(number / 1e4).toFixed(3) : number);
}
function localFallbackAreaValue(value) {
  const number = toNumber2(value);
  if (number == null) return "";
  const unit = selectedRadioValue2(els.areaUnitChoice, els.areaUnit?.value || "\u576A");
  return String(unit === "M2" ? +(number * 0.3025).toFixed(3) : number);
}
function localFallbackTargetTypes(query) {
  const targets = Array.isArray(query.dealTargets) ? query.dealTargets : [];
  const mapped = targets.flatMap((target) => {
    if (target === "\u623F\u5730(\u8ECA)") return ["\u623F\u5730"];
    return [target];
  });
  return [...new Set(mapped.filter(Boolean))].join(",");
}
function localFallbackParams(query) {
  const params2 = new URLSearchParams();
  const put = (key, value) => {
    if (value != null && value !== "") params2.set(key, String(value));
  };
  put("page", "1");
  put("page_size", "200");
  put("sort", "transaction_date_desc");
  put("city", query.cityName);
  put("district", query.districtName);
  if (isCommunityKeyword(query.roadKeyword)) {
    put("community", query.roadKeyword);
  } else {
    put("road", query.roadKeyword);
  }
  put("start_date", rocMonthToIsoDate(query.periodStartYear, query.periodStartMonth));
  put("end_date", rocMonthToIsoDate(query.periodEndYear, query.periodEndMonth, true));
  put("min_total_price", toNumber2(els.totalPriceMin?.value) != null ? Math.round(toNumber2(els.totalPriceMin.value) * 1e4) : "");
  put("max_total_price", toNumber2(els.totalPriceMax?.value) != null ? Math.round(toNumber2(els.totalPriceMax.value) * 1e4) : "");
  put("min_unit_price_ping", localFallbackUnitPriceValue(els.unitPriceMin?.value));
  put("max_unit_price_ping", localFallbackUnitPriceValue(els.unitPriceMax?.value));
  put("min_area_ping", localFallbackAreaValue(els.mainAreaMinFilter?.value));
  put("max_area_ping", localFallbackAreaValue(els.mainAreaMaxFilter?.value));
  put("target_types", localFallbackTargetTypes(query));
  if (query.specialMode === "exclude") put("exclude_special", "true");
  return params2;
}
function isoDateToRocText(value) {
  const match = String(value || "").match(/^(19\d{2}|20\d{2})-(\d{1,2})(?:-(\d{1,2}))?/);
  if (!match) return fixOfficialText(value || "");
  return `${Number(match[1]) - 1911}/${String(match[2]).padStart(2, "0")}${match[3] ? `/${String(match[3]).padStart(2, "0")}` : ""}`;
}
function localFallbackRowFromItem(item, index = 0) {
  const totalPriceWan = toNumber2(item.total_price ?? item.totalPrice) != null ? +(toNumber2(item.total_price ?? item.totalPrice) / 1e4).toFixed(3) : null;
  const rooms = Number(item.rooms);
  const halls = Number(item.halls);
  const baths = Number(item.bathrooms ?? item.baths);
  const layout = [rooms, halls, baths].every(Number.isFinite) && (rooms || halls || baths) ? `${rooms}\u623F${halls}\u5EF3${baths}\u885B` : "";
  return {
    row: index + 1,
    address: fixOfficialText(item.address || item.address_raw || item.addressRaw || ""),
    community: fixOfficialText(item.community_name || item.communityName || ""),
    tradeDate: isoDateToRocText(item.transaction_date || item.transactionDate || ""),
    totalPrice: totalPriceWan,
    unitPrice: toNumber2(item.unit_price_ping ?? item.unitPriceWanPing),
    totalArea: toNumber2(item.building_area_ping ?? item.buildingAreaPing),
    mainRatio: null,
    type: fixOfficialText(item.building_type || item.buildingType || ""),
    age: toNumber2(item.house_age ?? item.houseAge ?? item.building_age),
    floorInfo: fixOfficialText(item.floor || ""),
    target: fixOfficialText(item.transaction_target || item.transactionTarget || ""),
    tradeCount: "",
    parkingCount: item.has_parking || item.hasParking ? 1 : 0,
    layout,
    parkingPrice: toNumber2(item.parking_price ?? item.parkingPrice) != null ? +(toNumber2(item.parking_price ?? item.parkingPrice) / 1e4).toFixed(3) : null,
    purpose: fixOfficialText(item.main_use || item.mainUse || ""),
    management: item.hasManagement || item.has_management ? "\u6709" : "",
    elevator: "",
    history: "",
    note: fixOfficialText(item.note || ""),
    district: item.district || deriveDistrict(item.address || ""),
    road: deriveRoad(item.address || ""),
    tradePeriodValue: normalizePeriodValue(isoDateToRocText(item.transaction_date || item.transactionDate || "")),
    landTransferArea: toNumber2(item.land_area_ping ?? item.landAreaPing),
    mainAreaForFilter: toNumber2(item.building_area_ping ?? item.buildingAreaPing),
    lat: toNumber2(item.lat),
    lng: toNumber2(item.lng),
    localFallback: true
  };
}
async function runLocalOfflineFallbackSearch(query) {
  const params2 = localFallbackParams(query);
  const data = await fetchApiJson(`/api/real-price/map-search?${params2.toString()}`, {
    cache: "no-store",
    timeoutMs: 15e3
  });
  const rows = (Array.isArray(data.items) ? data.items : []).map(localFallbackRowFromItem).filter(isValidOfficialTransactionRow);
  return {
    rows,
    total: Number(data.total || rows.length),
    geocodedCount: Number(data.geocodedCount || rows.filter((row) => row.lat != null && row.lng != null).length),
    backend: data.backend || "local"
  };
}
function buildOfficialServicePayload(query, token) {
  const startYear = query.periodStartYear || "";
  const endYear = query.periodEndYear || "";
  const startMonth = query.periodStartMonth || (startYear ? "1" : "");
  const endMonth = query.periodEndMonth || (endYear ? "12" : "");
  const textValue = (value) => String(value || "");
  const placeTerms = officialPlaceSearchTerms(query);
  const buildKeyword = placeTerms.buildKeyword;
  const doorKeyword = placeTerms.doorKeyword;
  const communityKeyword = placeTerms.communityKeyword;
  const townhouse = isTownhouseQuery(query);
  const encodedBuild = officialUriEncodeField(buildKeyword);
  const encodedDoor = officialUriEncodeField(doorKeyword);
  const encodedCommunity = officialUriEncodeField(communityKeyword);
  const usageJoined = query.usageZones.join(",");
  const purposeJoined = query.mainPurposes.join(",");
  return {
    qryType: "biz",
    city: query.cityCode || "",
    town: query.districtCode || "",
    ptype: toOfficialPtype(query),
    starty: startYear,
    startm: startMonth,
    endy: endYear,
    endm: endMonth,
    p_build: encodedBuild,
    ftype: toOfficialFtype(query),
    price_s: query.totalPriceMin != null ? String(query.totalPriceMin) : "",
    price_e: query.totalPriceMax != null ? String(query.totalPriceMax) : "",
    unit_price_s: query.unitPriceMin != null ? String(query.unitPriceMin) : "",
    unit_price_e: query.unitPriceMax != null ? String(query.unitPriceMax) : "",
    area_s: query.mainAreaMinFilter != null ? String(query.mainAreaMinFilter) : "",
    area_e: query.mainAreaMaxFilter != null ? String(query.mainAreaMaxFilter) : "",
    build_s: query.mainAreaMinFilter != null ? String(query.mainAreaMinFilter) : "",
    build_e: query.mainAreaMaxFilter != null ? String(query.mainAreaMaxFilter) : "",
    buildyear_s: query.houseAgeMin != null ? String(query.houseAgeMin) : "",
    buildyear_e: query.houseAgeMax != null ? String(query.houseAgeMax) : "",
    doorno: encodedDoor,
    pattern: toOfficialPatternNo(query.layoutFilter || ""),
    community: encodedCommunity,
    floor: townhouse ? officialUriEncodeField("\u5168") : officialUriEncodeField(query.floorFilter || ""),
    rent_type: "",
    rent_order: "",
    urban: "",
    urbantext: officialUriEncodeField(usageJoined),
    nurban: "",
    aa12: "",
    p_purpose: officialUriEncodeField(purposeJoined),
    p_unusual_yn: "",
    p_unusualcode: "",
    QB41: "",
    show_avg: "N",
    tmoney_unit: query.priceUnit === "\u842C\u5143/\u576A" ? "1" : "2",
    pmoney_unit: query.priceUnit === "\u842C\u5143/\u576A" ? "1" : "2",
    unit: query.areaUnit === "\u576A" ? "2" : "1",
    token
  };
}
function ensureOfficialPeriod(query) {
  const roll = getRollingTransactionPeriod(1);
  if (!query.periodStartYear) {
    query.periodStartYear = roll.periodStartYear;
    els.periodStartYear.value = roll.periodStartYear;
  }
  if (!query.periodEndYear) {
    query.periodEndYear = roll.periodEndYear;
    els.periodEndYear.value = roll.periodEndYear;
  }
  if (!query.periodStartMonth) {
    query.periodStartMonth = roll.periodStartMonth;
    els.periodStartMonth.value = roll.periodStartMonth;
  }
  if (!query.periodEndMonth) {
    query.periodEndMonth = roll.periodEndMonth;
    els.periodEndMonth.value = roll.periodEndMonth;
  }
}
async function runOfficialSearch(options = {}) {
  const totalTimeoutMs = Math.max(5e3, Number(options.totalTimeoutMs) || OFFICIAL_TOTAL_TIMEOUT_MS || 45e3);
  const maxAttempts = Math.max(1, Number(options.maxAttempts) || OFFICIAL_MAX_ATTEMPTS || 2);
  const timeoutSeconds = Math.round(totalTimeoutMs / 1e3);
  const officialSearchController = new AbortController();
  const officialSearchSignal = officialSearchController.signal;
  const createSearchTimeoutError = () => new Error(`\u5B98\u65B9\u67E5\u8A62\u903E\u6642\uFF08\u5DF2\u8D85\u904E ${timeoutSeconds} \u79D2\uFF0C\u7CFB\u7D71\u5DF2\u505C\u6B62\u672C\u6B21\u67E5\u8A62\uFF0C\u907F\u514D\u756B\u9762\u9577\u6642\u9593\u5361\u4F4F\uFF09`);
  const assertOfficialSearchActive = () => {
    if (officialSearchSignal.aborted) throw createSearchTimeoutError();
  };
  const totalTimer = setTimeout(() => {
    officialSearchController.abort();
  }, totalTimeoutMs);
  const queryProbe = currentQuery();
  if (!queryProbe.cityCode || !queryProbe.districtCode) {
    clearTimeout(totalTimer);
    setMessage2("warn", "\u8ACB\u5148\u9078\u64C7\u7E23\u5E02\u8207\u884C\u653F\u5340\uFF0C\u518D\u67E5\u8A62\u5B98\u65B9\u8CC7\u6599\u3002");
    return;
  }
  setQueryProgress(true, `\u5B98\u65B9\u8CC7\u6599\u67E5\u8A62\u4E2D\uFF0C\u6700\u591A\u7B49\u5019 ${timeoutSeconds} \u79D2...`);
  setQueryProgressStage("\u6B65\u9A5F 1/4\uFF1A\u6B63\u5728\u53D6\u5F97\u5B98\u65B9 token");
  setMessage2("warn", "\u5B98\u65B9\u8CC7\u6599\u67E5\u8A62\u4E2D\uFF0C\u8ACB\u7A0D\u5019...");
  els.calcExplain.textContent = "\u6B63\u5728\u5411\u5B98\u65B9\u7DB2\u7AD9\u53D6\u5F97\u67E5\u8A62\u8CC7\u6599...";
  try {
    assertOfficialSearchActive();
    const common = await ensureOfficialCrypto();
    assertOfficialSearchActive();
    const waitMs = (ms) => new Promise((resolve, reject) => {
      if (officialSearchSignal.aborted) {
        reject(createSearchTimeoutError());
        return;
      }
      const timer = setTimeout(() => {
        officialSearchSignal.removeEventListener("abort", onAbort);
        resolve();
      }, ms);
      const onAbort = () => {
        clearTimeout(timer);
        reject(createSearchTimeoutError());
      };
      officialSearchSignal.addEventListener("abort", onAbort, { once: true });
    });
    const fallbackSpanYears = OFFICIAL_MAX_EXPAND_SPAN_YEARS;
    const searchSpanYears = Array.from({ length: fallbackSpanYears }, (_, index) => index + 1);
    let rows = [];
    let bestAvailableRows = [];
    let bestAvailableSpanYears = 1;
    let usedSpanYears = 1;
    let usedBestAvailableRows = false;
    let usedFallback400 = false;
    let fallbackTryCount = 0;
    let usedFallbackZero = false;
    let zeroFallbackTryCount = 0;
    let diagnosticRawCount = 0;
    let diagnosticNormalizedCount = 0;
    let diagnosticTownhouseKept = 0;
    let diagnosticFirstFloorCount = 0;
    const subjectFloorForOfficialSearch = subjectPropertyUnitFloor();
    const shouldSeekFirstFloorComparables = subjectFloorForOfficialSearch === 1;
    let activeOfficialSid = "";
    let activeOfficialPath = "";
    const isTransientOfficialError = (message) => /請求逾時|Failed to fetch|NetworkError|Load failed|official request failed|HTTP 408|HTTP 429|HTTP 500|HTTP 502|HTTP 503|HTTP 504|\(408\)|\(429\)|\(500\)|\(502\)|\(503\)|\(504\)/i.test(String(message || ""));
    for (const span of searchSpanYears) {
      assertOfficialSearchActive();
      if (span > 1) {
        applyRollingPeriodToUi(span);
        const expandReason = shouldSeekFirstFloorComparables && diagnosticFirstFloorCount === 0 ? "\u5C1A\u672A\u53D6\u5F97\u4E00\u6A13\u6848\u4F8B" : rows.length > 0 && rows.length < OFFICIAL_MIN_ROWS_BEFORE_STOP ? `\u6848\u4F8B\u4E0D\u8DB3 ${OFFICIAL_MIN_ROWS_BEFORE_STOP} \u7B46\uFF08\u76EE\u524D ${rows.length} \u7B46\uFF09` : "\u67E5\u7121\u8CC7\u6599";
        setQueryProgressStage(`\u6B65\u9A5F 1/4\uFF1A${expandReason}\uFF0C\u4EA4\u6613\u671F\u9593\u64F4\u5927\u70BA\u6700\u8FD1 ${span} \u5E74\u4E26\u91CD\u65B0\u53D6\u5F97 token`);
      }
      const query = currentQuery();
      const townhouse = isTownhouseQuery(query);
      ensureOfficialPeriod(query);
      setQueryProgressStage(span === 1 ? "\u6B65\u9A5F 2/4\uFF1A\u6B63\u5728\u7522\u751F\u67E5\u8A62\u53C3\u6578" : `\u6B65\u9A5F 2/4\uFF1A\u7522\u751F\u67E5\u8A62\u53C3\u6578\uFF08\u6700\u8FD1 ${span} \u5E74\uFF09`);
      setQueryProgressStage(span === 1 ? "\u6B65\u9A5F 3/4\uFF1A\u6B63\u5728\u67E5\u8A62\u5B98\u65B9\u8CC7\u6599" : `\u6B65\u9A5F 3/4\uFF1A\u67E5\u8A62\u5B98\u65B9\u8CC7\u6599\uFF08\u6700\u8FD1 ${span} \u5E74\uFF09`);
      const fetchOfficialRows = async (overrides = null, note = "") => {
        let lastErr = null;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            assertOfficialSearchActive();
            setQueryProgressStage(
              `${span === 1 ? "\u6B65\u9A5F 1/4" : `\u6B65\u9A5F 1/4\uFF08\u6700\u8FD1 ${span} \u5E74\uFF09`}\uFF1A\u6B63\u5728\u53D6\u5F97\u5B98\u65B9 token${attempt > 1 ? `\uFF08\u91CD\u8A66 ${attempt}/${maxAttempts}\uFF09` : ""}`
            );
            const tokenResult = await fetchApiJson("/api/lvr/token", {
              cache: "no-store",
              timeoutMs: OFFICIAL_TOKEN_TIMEOUT_MS,
              signal: officialSearchSignal
            });
            assertOfficialSearchActive();
            const sid = String(tokenResult?.sid || "").trim();
            const token = String(tokenResult?.token || "").trim();
            if (!sid || !token) {
              throw new Error("\u5B98\u65B9 token \u53D6\u5F97\u5931\u6557\uFF0C\u8ACB\u91CD\u6574\u5F8C\u518D\u8A66\u3002");
            }
            const servicePayload = buildOfficialServicePayload(query, token);
            if (overrides && typeof overrides === "object") Object.assign(servicePayload, overrides);
            const path = String(common.getPathHash(servicePayload) || "").trim();
            const q = String(common.getEncodeStr(servicePayload) || "").trim();
            els.calcExplain.textContent = `\u5B98\u65B9\u67E5\u8A62\u53C3\u6578\u6AA2\u67E5\uFF1Asid=${sid ? "ok" : "x"}\u3001token=${token ? "ok" : "x"}\u3001period=${query.periodStartYear}/${query.periodStartMonth}~${query.periodEndYear}/${query.periodEndMonth}\u3001pathLen=${path.length}\u3001qLen=${q.length}${note ? `\u3001${note}` : ""}\u3001attempt=${attempt}/${maxAttempts}`;
            if (!path || !q) {
              throw new Error(`\u5B98\u65B9\u67E5\u8A62\u53C3\u6578\u7522\u751F\u5931\u6557\uFF08pathLen=${path.length}, qLen=${q.length}\uFF09\uFF0C\u8ACB\u91CD\u65B0\u6574\u7406\u65B0\u7248\u5F8C\u518D\u8A66\u3002`);
            }
            setQueryProgressStage(
              `${span === 1 ? "\u6B65\u9A5F 3/4" : `\u6B65\u9A5F 3/4\uFF08\u6700\u8FD1 ${span} \u5E74\uFF09`}\uFF1A\u6B63\u5728\u67E5\u8A62\u5B98\u65B9\u8CC7\u6599${attempt > 1 ? `\uFF08\u91CD\u8A66 ${attempt}/${maxAttempts}\uFF09` : ""}`
            );
            const result = await fetchApiJson("/api/lvr/query", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sid, path, q, mode: servicePayload.qryType }),
              timeoutMs: OFFICIAL_QUERY_TIMEOUT_MS,
              signal: officialSearchSignal
            });
            assertOfficialSearchActive();
            activeOfficialSid = sid;
            activeOfficialPath = path;
            return result;
          } catch (error) {
            lastErr = error;
            const msg = String(error?.message || "");
            if (officialSearchSignal.aborted) {
              lastErr = createSearchTimeoutError();
              break;
            }
            if (!msg.includes("(400)") && !isTransientOfficialError(msg) || attempt >= maxAttempts) break;
            setQueryProgressStage(`\u5B98\u65B9\u56DE\u61C9\u8F03\u6162\u6216\u66AB\u6642\u5931\u6557\uFF0C${OFFICIAL_RETRY_BASE_DELAY_MS * attempt / 1e3} \u79D2\u5F8C\u81EA\u52D5\u91CD\u8A66 ${attempt + 1}/${maxAttempts}`);
            await waitMs(OFFICIAL_RETRY_BASE_DELAY_MS * attempt);
          }
        }
        throw lastErr || new Error("\u5B98\u65B9\u67E5\u8A62\u5931\u6557");
      };
      let rawRows;
      try {
        rawRows = await fetchOfficialRows();
      } catch (error) {
        const message = String(error?.message || "");
        if (!message.includes("(400)")) throw error;
        usedFallback400 = true;
        const retryProfiles = [
          {
            overrides: {
              // 第 1 階：移除非必要附加條件，保留主要篩選。
              doorno: "",
              urbantext: "",
              p_purpose: "",
              pattern: "",
              build_s: "",
              build_e: "",
              buildyear_s: "",
              buildyear_e: ""
            },
            note: "\u5DF2\u555F\u7528 400 \u964D\u968E\u91CD\u8A66(1/3)"
          },
          {
            overrides: {
              // 第 2 階：再放寬型態與樓別，避免官方欄位格式驗證失敗。
              doorno: "",
              urbantext: "",
              p_purpose: "",
              pattern: "",
              build_s: "",
              build_e: "",
              buildyear_s: "",
              buildyear_e: "",
              floor: "",
              ftype: ""
            },
            note: "\u5DF2\u555F\u7528 400 \u964D\u968E\u91CD\u8A66(2/3)"
          },
          {
            overrides: {
              // 第 3 階：最小查詢骨幹，盡量先拿到資料，再由前端規則篩選。
              ptype: "1,2",
              doorno: "",
              community: "",
              p_build: "",
              urbantext: "",
              p_purpose: "",
              pattern: "",
              build_s: "",
              build_e: "",
              buildyear_s: "",
              buildyear_e: "",
              floor: "",
              ftype: "",
              price_s: "",
              price_e: "",
              unit_price_s: "",
              unit_price_e: "",
              area_s: "",
              area_e: ""
            },
            note: "\u5DF2\u555F\u7528 400 \u964D\u968E\u91CD\u8A66(3/3)"
          }
        ];
        let lastErr = error;
        for (const profile of retryProfiles) {
          try {
            fallbackTryCount += 1;
            rawRows = await fetchOfficialRows(profile.overrides, profile.note);
            lastErr = null;
            break;
          } catch (retryError) {
            lastErr = retryError;
            const retryMessage = String(retryError?.message || "");
            if (!retryMessage.includes("(400)")) throw retryError;
          }
        }
        if (lastErr) throw lastErr;
      }
      if (Array.isArray(rawRows) && rawRows.length === 0) {
        const zeroRowRetryProfiles = [
          {
            overrides: {
              // 官方頁面主查詢只用縣市、行政區、交易標的、道路與期間；0 筆時先清掉本機附加欄位。
              doorno: "",
              ftype: "",
              floor: "",
              p_purpose: "",
              pattern: "",
              urbantext: "",
              buildyear_s: "",
              buildyear_e: ""
            },
            note: "\u67E5\u7121\u8CC7\u6599\uFF0C\u5DF2\u653E\u5BEC\u9644\u52A0\u6B04\u4F4D\u91CD\u67E5(1/2)"
          },
          {
            overrides: {
              // 若仍為 0，再移除價格/面積區間，保留官方畫面中最核心的查詢骨幹。
              doorno: "",
              ftype: "",
              floor: "",
              p_purpose: "",
              pattern: "",
              urbantext: "",
              buildyear_s: "",
              buildyear_e: "",
              price_s: "",
              price_e: "",
              unit_price_s: "",
              unit_price_e: "",
              area_s: "",
              area_e: "",
              build_s: "",
              build_e: ""
            },
            note: "\u67E5\u7121\u8CC7\u6599\uFF0C\u5DF2\u653E\u5BEC\u9644\u52A0\u6B04\u4F4D\u91CD\u67E5(2/2)"
          }
        ];
        for (const profile of zeroRowRetryProfiles) {
          try {
            zeroFallbackTryCount += 1;
            const retryRows = await fetchOfficialRows(profile.overrides, profile.note);
            if (Array.isArray(retryRows) && retryRows.length > 0) {
              rawRows = retryRows;
              usedFallbackZero = true;
              break;
            }
          } catch (retryError) {
            const retryMessage = String(retryError?.message || "");
            if (!retryMessage.includes("(400)") && !isTransientOfficialError(retryMessage)) throw retryError;
          }
        }
      }
      lastOfficialRawRows = Array.isArray(rawRows) ? rawRows : [];
      diagnosticRawCount = lastOfficialRawRows.length;
      const normalizedRows = lastOfficialRawRows.map(normalizeOfficialRow).filter(isValidOfficialTransactionRow);
      diagnosticNormalizedCount = normalizedRows.length;
      rows = normalizedRows;
      if (townhouse) {
        rows = rows.filter((row) => rowMatchesTownhouseRule(row));
        diagnosticTownhouseKept = rows.length;
        await hydrateTownhouseLandTransferAreas(rows, activeOfficialSid, activeOfficialPath, common, {
          signal: officialSearchSignal
        });
        applyTownhouseLandUnitPrice(rows);
      }
      diagnosticFirstFloorCount = rows.filter((row) => comparableRowIsFirstFloor2(row)).length;
      if (rows.length > bestAvailableRows.length) {
        bestAvailableRows = [...rows];
        bestAvailableSpanYears = span;
      }
      const shouldExpandForFirstFloor = rows.length && shouldSeekFirstFloorComparables && diagnosticFirstFloorCount === 0;
      const shouldExpandForCount = rows.length < OFFICIAL_MIN_ROWS_BEFORE_STOP;
      if (span < fallbackSpanYears && (shouldExpandForFirstFloor || shouldExpandForCount)) continue;
      if (rows.length) {
        usedSpanYears = span;
        break;
      }
    }
    if (bestAvailableRows.length && bestAvailableRows.length > rows.length) {
      rows = bestAvailableRows;
      usedSpanYears = bestAvailableSpanYears;
      usedBestAvailableRows = true;
    }
    resetResultTableSortState();
    if (!rows.length) {
      let localFallbackResult = null;
      try {
        setQueryProgressStage("\u6B65\u9A5F 4/4\uFF1A\u5B98\u65B9 0 \u7B46\uFF0C\u6B63\u5728\u555F\u52D5\u672C\u6A5F\u96E2\u7DDA\u5099\u63F4\u8CC7\u6599\u5EAB");
        localFallbackResult = await runLocalOfflineFallbackSearch(currentQuery());
      } catch (fallbackError) {
        console.warn("\u672C\u6A5F\u96E2\u7DDA\u5099\u63F4\u67E5\u8A62\u5931\u6557", fallbackError);
      }
      if (localFallbackResult?.rows?.length) {
        rows = localFallbackResult.rows;
        els.recordsInput.value = officialRowsToRecordText(rows);
        updateAreaSummary(rows.length);
        setQueryProgressStage(`\u6B65\u9A5F 4/4\uFF1A\u672C\u6A5F\u96E2\u7DDA\u5099\u63F4\u53D6\u5F97 ${rows.length} \u7B46\uFF0C\u6B63\u5728\u6392\u5E8F\u8207\u4F30\u50F9`);
        setMessage2("ok", `\u5B98\u65B9\u67E5\u8A62 0 \u7B46\uFF0C\u5DF2\u555F\u52D5\u672C\u6A5F\u96E2\u7DDA\u5099\u63F4\u8CC7\u6599\u5EAB\u4E26\u53D6\u5F97 ${rows.length} \u7B46\uFF1B\u6848\u4F8B\u5DF2\u986F\u793A\u65BC\u5B98\u65B9\u56DE\u50B3\u7D50\u679C\u8868\u683C\u3002`);
        els.calcExplain.textContent = `\u5B98\u65B9\u7DB2\u7AD9\u56DE\u50B3 0 \u7B46\uFF1B\u672C\u6A5F\u96E2\u7DDA\u5099\u63F4\u8CC7\u6599\u5EAB\u53D6\u5F97 ${rows.length} \u7B46\uFF08\u8CC7\u6599\u5EAB\u7E3D\u7B26\u5408\u7D04 ${localFallbackResult.total || rows.length} \u7B46\u3001\u5DF2\u5B9A\u4F4D ${localFallbackResult.geocodedCount || 0} \u7B46\uFF09\u3002\u6210\u4EA4\u6848\u4F8B\u4ECD\u4F9D\u5B98\u65B9\u56DE\u50B3\u7D50\u679C\u6B04\u4F4D\u914D\u7F6E\u986F\u793A\u3002`;
        const officialSearchNote2 = `\u5B98\u65B9\u67E5\u8A62 0 \u7B46\uFF0C\u6539\u7528\u672C\u6A5F\u96E2\u7DDA\u5099\u63F4\u53D6\u5F97 ${rows.length} \u7B46`;
        runSearch({ keepProgress: true, ignoreQueryFilters: true, officialSearchNote: officialSearchNote2 });
        return;
      }
      els.recordsInput.value = "";
      updateAreaSummary(0);
      renderRows([]);
      const queryNow2 = currentQuery();
      const townhouseHint = isTownhouseQuery(queryNow2) ? `\uFF08\u900F\u5929\u6A21\u5F0F\uFF1A\u5DF2\u5957\u7528\u300C\u6A13\u5225=\u5168\u300D\u3001\u6A13\u9AD8\u4E0D\u9650\uFF1B\u539F\u59CB ${diagnosticRawCount} \u7B46\u3001\u53EF\u89E3\u6790 ${diagnosticNormalizedCount} \u7B46\u3001\u900F\u5929\u898F\u5247\u5F8C ${diagnosticTownhouseKept} \u7B46\uFF09` : "";
      els.calcExplain.textContent = `\u5B98\u65B9\u7DB2\u7AD9\u56DE\u50B3 0 \u7B46\u8CC7\u6599\uFF08\u5DF2\u67E5\u8A62\u6700\u8FD1 1 \u5E74\uFF0C\u4E26\u56E0\u4E0D\u8DB3 ${OFFICIAL_MIN_ROWS_BEFORE_STOP} \u7B46\u64F4\u5927\u70BA\u6700\u8FD1 ${fallbackSpanYears} \u5E74\u5F8C\u4ECD\u7121\u8CC7\u6599\uFF09${townhouseHint}\u3002\u8ACB\u8ABF\u6574\u7E23\u5E02\u3001\u884C\u653F\u5340\u6216\u9580\u724C\uFF0F\u793E\u5340\u540D\u7A31\u5F8C\u518D\u8A66\u3002`;
      setMessage2("warn", "\u5B98\u65B9\u7DB2\u7AD9\u76EE\u524D\u67E5\u7121\u7B26\u5408\u689D\u4EF6\u8CC7\u6599\u3002");
      updateStructuredData();
      return;
    }
    els.recordsInput.value = officialRowsToRecordText(rows);
    updateAreaSummary(rows.length);
    setQueryProgressStage(`\u6B65\u9A5F 4/4\uFF1A\u5DF2\u53D6\u5F97 ${rows.length} \u7B46\uFF0C\u6B63\u5728\u6392\u5E8F\u8207\u4F30\u50F9`);
    const spanHint = usedSpanYears > 1 ? `\uFF08\u4EA4\u6613\u671F\u9593\u5DF2\u81EA\u52D5\u64F4\u5927\u81F3\u6700\u8FD1 ${usedSpanYears} \u5E74\uFF09` : "";
    const shortResultHint = rows.length < OFFICIAL_MIN_ROWS_BEFORE_STOP ? `\uFF08\u6700\u9AD8\u64F4\u5927\u81F3\u6700\u8FD1 ${fallbackSpanYears} \u5E74\u5F8C\u4ECD\u4E0D\u8DB3 ${OFFICIAL_MIN_ROWS_BEFORE_STOP} \u7B46\uFF0C\u6539\u7528\u5DF2\u53D6\u5F97 ${rows.length} \u7B46\u5E73\u5747\uFF09` : "";
    const firstFloorHint = shouldSeekFirstFloorComparables ? `\uFF08\u6A19\u7684\u70BA\u4E00\u6A13\uFF0C\u5B98\u65B9\u8CC7\u6599\u4E2D\u4E00\u6A13\u6848\u4F8B ${diagnosticFirstFloorCount} \u7B46\uFF09` : "";
    const fallbackHint = usedFallback400 ? `\uFF08\u5DF2\u555F\u7528 400 \u964D\u968E\u91CD\u8A66 ${fallbackTryCount} \u6B21\uFF09` : usedFallbackZero ? `\uFF08\u539F\u689D\u4EF6 0 \u7B46\uFF0C\u5DF2\u653E\u5BEC\u9644\u52A0\u6B04\u4F4D\u91CD\u67E5 ${zeroFallbackTryCount} \u6B21\uFF09` : "\uFF08\u539F\u59CB\u689D\u4EF6\u67E5\u8A62\u6210\u529F\uFF09";
    const bestAvailableHint = usedBestAvailableRows ? "\uFF08\u64F4\u5927\u67E5\u8A62\u672A\u53D6\u5F97\u66F4\u591A\u53EF\u7528\u6848\u4F8B\uFF0C\u4FDD\u7559\u524D\u6B21\u6709\u6848\u4F8B\u7D50\u679C\uFF09" : "";
    setMessage2("ok", `\u5DF2\u53D6\u5F97\u5B98\u65B9\u8CC7\u6599 ${rows.length} \u7B46${spanHint}${shortResultHint}${firstFloorHint}${fallbackHint}${bestAvailableHint}\uFF0C\u958B\u59CB\u9032\u884C\u6392\u5E8F\u8207\u4F30\u50F9\u8A08\u7B97\u3002`);
    const queryNow = currentQuery();
    if (isTownhouseQuery(queryNow)) {
      els.calcExplain.textContent = `\u900F\u5929\u8A3A\u65B7\uFF1A\u5B98\u65B9\u539F\u59CB ${diagnosticRawCount} \u7B46\u3001\u53EF\u89E3\u6790 ${diagnosticNormalizedCount} \u7B46\u3001\u7B26\u5408\u900F\u5929\u898F\u5247\uFF08\u578B\u614B\u542B\u900F\u5929\u6216\u6A13\u5225\u70BA\u5168\uFF09${rows.length} \u7B46\u3002${shortResultHint}${bestAvailableHint}`;
      if (usedFallback400) {
        els.calcExplain.textContent += ` \u672C\u6B21\u70BA 400 \u964D\u968E\u91CD\u8A66\u6210\u529F\uFF08${fallbackTryCount} \u6B21\uFF09\u3002`;
      } else if (usedFallbackZero) {
        els.calcExplain.textContent += ` \u672C\u6B21\u539F\u689D\u4EF6 0 \u7B46\uFF0C\u5DF2\u653E\u5BEC\u9644\u52A0\u6B04\u4F4D\u91CD\u67E5\u6210\u529F\uFF08${zeroFallbackTryCount} \u6B21\uFF09\u3002`;
      } else {
        els.calcExplain.textContent += " \u672C\u6B21\u70BA\u539F\u59CB\u689D\u4EF6\u67E5\u8A62\u6210\u529F\u3002";
      }
    } else if (usedFallback400) {
      els.calcExplain.textContent = `\u5B98\u65B9\u8CC7\u6599\u5DF2\u53D6\u5F97 ${rows.length} \u7B46\uFF0C\u672C\u6B21\u70BA 400 \u964D\u968E\u91CD\u8A66\u6210\u529F\uFF08${fallbackTryCount} \u6B21\uFF09\u3002${shortResultHint}${bestAvailableHint}`;
    } else if (usedFallbackZero) {
      els.calcExplain.textContent = `\u5B98\u65B9\u8CC7\u6599\u5DF2\u53D6\u5F97 ${rows.length} \u7B46\uFF0C\u539F\u689D\u4EF6 0 \u7B46\u5F8C\u5DF2\u653E\u5BEC\u9644\u52A0\u6B04\u4F4D\u91CD\u67E5\u6210\u529F\uFF08${zeroFallbackTryCount} \u6B21\uFF09\u3002${shortResultHint}${bestAvailableHint}`;
    } else {
      els.calcExplain.textContent = `\u5B98\u65B9\u8CC7\u6599\u5DF2\u53D6\u5F97 ${rows.length} \u7B46\uFF0C\u672C\u6B21\u70BA\u539F\u59CB\u689D\u4EF6\u67E5\u8A62\u6210\u529F\u3002${shortResultHint}${bestAvailableHint}`;
    }
    const officialSearchNote = `\u5B98\u65B9\u67E5\u8A62\u53D6\u5F97 ${rows.length} \u7B46${spanHint}${shortResultHint}${bestAvailableHint}`;
    runSearch({ keepProgress: true, ignoreQueryFilters: true, officialSearchNote });
  } catch (error) {
    lastOfficialRawRows = [];
    const message = String(error.message || "");
    const timeoutHint = message.includes("\u8ACB\u6C42\u903E\u6642") ? "\uFF08\u5B98\u65B9\u56DE\u61C9\u8F03\u6162\uFF0C\u7CFB\u7D71\u5DF2\u81EA\u52D5\u91CD\u8A66\uFF1B\u8ACB\u7A0D\u5F8C\u518D\u6309\u641C\u5C0B\uFF0C\u4E0D\u5FC5\u5148\u7E2E\u5C0F\u7BE9\u9078\u689D\u4EF6\uFF09" : "";
    const portHint = message.includes("404") ? ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname) ? "\uFF08\u8ACB\u7528 python3 serve.py \u986F\u793A\u7684\u7DB2\u5740\u958B\u555F\uFF0C\u4F8B\u5982 http://127.0.0.1:5502/ \u6216 http://127.0.0.1:5500/\uFF1B\u52FF\u53EA\u7528\u7121 /api/lvr \u7684\u975C\u614B\u4F3A\u670D\u5668\uFF09" : `\uFF08\u8ACB\u78BA\u8A8D ${window.location.hostname}:5502\u3001:5500 \u6216 :5501 \u6709\u4EE3\u7406\uFF0C\u6216\u5DF2\u53CD\u5411\u4EE3\u7406 /api/lvr/*\uFF09` : "";
    const fullMessage = `\u5B98\u65B9\u67E5\u8A62\u5931\u6557\uFF1A${message}${timeoutHint}${portHint}`;
    els.calcExplain.textContent = fullMessage;
    setMessage2(message.includes("\u8ACB\u6C42\u903E\u6642") ? "warn" : "error", fullMessage);
    updateStructuredData();
  } finally {
    clearTimeout(totalTimer);
    setQueryProgress(false);
  }
}
var officialSearchRuntime = createOfficialSearchRuntime({
  fetchApiJson,
  ensureOfficialCrypto,
  runOfficialSearch,
  runDeedSearch,
  setQueryProgress,
  setQueryProgressStage
});
window.FoundOfficialSearch = officialSearchRuntime;
function updateAreaSummary(recordCount = null) {
  const landShareResult = syncLandShareAreaFromRaw();
  let area = areaInfo();
  const parkingInfo = syncParkingCountFromArea(area.parking);
  if (els.totalAreaOverride) {
    els.totalAreaOverride.value = area.house > 0 ? String(area.house) : "";
  }
  if (els.totalWithParkingArea) {
    els.totalWithParkingArea.value = area.total > 0 ? String(area.total) : "";
  }
  if (els.totalAreaDisplay) els.totalAreaDisplay.textContent = formatNum2(area.house, 3);
  if (els.parkingAreaDisplay) els.parkingAreaDisplay.textContent = formatNum2(area.parking, 3);
  if (els.usableAreaDisplay) els.usableAreaDisplay.textContent = formatNum2(area.total, 3);
  if (recordCount !== null) {
    if (els.recordCountDisplay) els.recordCountDisplay.textContent = String(recordCount);
    els.recordCountDisplayCard.textContent = `${recordCount} \u7B46\u6848\u4F8B`;
  }
  const parkingCountNote = parkingInfo.source === "ocr" ? `\u8ECA\u4F4D\u6578\u91CF ${parkingInfo.count} \u500B\u63A1 OCR \u505C\u8ECA\u4F4D\u7DE8\u865F\uFF0F\u6B0A\u5229\u7BC4\u570D\uFF0C\u4E0D\u4EE5\u576A\u6578\u63A8\u7B97\u3002` : "";
  if (els.areaExplain) {
    els.areaExplain.textContent = `\u623F\u5C4B\u576A\u6578 = \u4E3B\u5EFA\u7269 ${formatNum2(area.main, 3)} + \u9644\u5C6C ${formatNum2(area.attach, 3)} + \u5171\u6709 ${formatNum2(area.common, 3)} = ${formatNum2(area.house, 3)} \u576A\uFF1B\u8ECA\u4F4D\u576A\u6578 ${formatNum2(area.parking, 3)} \u576A\uFF1B\u7E3D\u576A\u6578 = \u623F\u5C4B\u576A\u6578 ${formatNum2(area.house, 3)} + \u8ECA\u4F4D\u576A\u6578 ${formatNum2(area.parking, 3)} = ${formatNum2(area.total, 3)} \u576A\u3002${parkingCountNote ? ` ${parkingCountNote}` : ""}`;
    if (area.landShare > 0) {
      const suffix = landShareResult.entries.length ? `\uFF08\u571F\u5730\u6301\u5206\u89E3\u6790 ${landShareResult.entries.length} \u7B46\uFF09` : "";
      els.areaExplain.textContent += ` \u571F\u5730\u6301\u5206\u576A\u5408\u8A08 ${formatNum2(area.landShare, 3)} \u576A${suffix}\u3002`;
    }
  }
  updateStructuredData();
}
function browserOcrDisabledError() {
  return new Error("\u700F\u89BD\u5668 Tesseract OCR \u5DF2\u505C\u7528\uFF1B\u8ACB\u78BA\u8A8D 8001 OCR \u5F8C\u7AEF\u53EF\u7528\uFF0C\u82E5\u9700 Docker \u88DC\u5F37\u518D\u78BA\u8A8D 8099 \u670D\u52D9\u5DF2\u555F\u52D5\u5F8C\u518D\u8A66\u3002");
}
async function ocrImageSource() {
  throw browserOcrDisabledError();
}
async function ocrDeedFieldLevelBlocks() {
  throw browserOcrDisabledError();
}
async function extractPdfTextLayer(file, options = {}) {
  const maxPages = Math.max(1, Number(options.maxPages) || Infinity);
  const buffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: buffer }).promise;
  const pages = [];
  const pageLimit = Math.min(pdf.numPages, maxPages);
  for (let pageNo = 1; pageNo <= pageLimit; pageNo += 1) {
    const page = await pdf.getPage(pageNo);
    const textContent = await page.getTextContent();
    pages.push(textContent.items.map((item) => item.str).join(" "));
  }
  return pages.join("\n");
}
function withTimeout(promise, ms, message) {
  let timer = null;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(message || `timeout after ${ms}ms`)), ms);
    })
  ]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}
function formatCaughtError(error) {
  if (error == null) return "\u672A\u77E5\u932F\u8AA4";
  if (typeof error === "string") return error || "\u672A\u77E5\u932F\u8AA4";
  if (error.message) return error.message;
  try {
    const json = JSON.stringify(error);
    if (json && json !== "{}") return json;
  } catch (_) {
  }
  return String(error) || "\u672A\u77E5\u932F\u8AA4";
}
function paddlePingValue(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? String(+n.toFixed(3)) : "";
}
function setPaddleAreaValue(element, value) {
  const ping = paddlePingValue(value);
  if (!element || !ping) return false;
  element.value = ping;
  return true;
}
function backendOcrFieldHasValue(fields = {}, key = "") {
  return String(fields?.[key] ?? "").trim() !== "";
}
function backendOcrFieldWasEvaluated(result = {}, fields = {}, key = "") {
  return Object.prototype.hasOwnProperty.call(fields || {}, key) || Boolean(result?.diagnostics?.field_results?.[key]);
}
function shouldSuppressParsedCommonAreaFallback(result = {}, fields = {}, rawText = "", parsedCommonArea = null) {
  const parsedPing = Number(parsedCommonArea?.valuePing);
  if (!Number.isFinite(parsedPing) || parsedPing <= 0) return false;
  if (backendOcrFieldHasValue(fields, "common_area_ping")) return false;
  if (!backendOcrFieldWasEvaluated(result, fields, "common_area_ping")) return false;
  return !hasRealCommonPartEvidence(rawText);
}
function applyBackendOcrAreaFields(fields = {}) {
  const hits = [
    setPaddleAreaValue(els.mainArea, fields.main_building_area_ping),
    setPaddleAreaValue(els.attachArea, fields.attached_building_area_ping),
    setPaddleAreaValue(els.commonArea, fields.common_area_ping)
  ].filter(Boolean).length;
  if (setPaddleAreaValue(els.parkingArea, fields.parking_area_ping)) {
    if (fields.parking_count) setOcrParkingCount(fields.parking_count);
  }
  return hits;
}
function paddlePagesText(pages) {
  return (Array.isArray(pages) ? pages : []).map((page) => String(page?.text || "").trim()).filter(Boolean).join("\n\n");
}
var PADDLE_OCR_DIAGNOSTICS_CACHE_MS = 3e4;
var PADDLE_OCR_DIAGNOSTICS_TIMEOUT_MS = 3e3;
var paddleOcrDiagnosticsCache = null;
var paddleOcrDiagnosticsCachedAt = 0;
async function getPaddleOcrDiagnostics() {
  if (paddleOcrDiagnosticsCache && Date.now() - paddleOcrDiagnosticsCachedAt < PADDLE_OCR_DIAGNOSTICS_CACHE_MS) {
    return paddleOcrDiagnosticsCache;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PADDLE_OCR_DIAGNOSTICS_TIMEOUT_MS);
  try {
    const response = await fetch(PADDLE_OCR_DIAGNOSTICS_ENDPOINT, { cache: "no-store", signal: controller.signal });
    if (!response.ok) throw new Error(`OCR backend diagnostics HTTP ${response.status}`);
    paddleOcrDiagnosticsCache = await response.json();
    paddleOcrDiagnosticsCachedAt = Date.now();
    return paddleOcrDiagnosticsCache;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(`OCR backend diagnostics timeout after ${Math.round(PADDLE_OCR_DIAGNOSTICS_TIMEOUT_MS / 1e3)} \u79D2`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
function ocrBackendAvailable(diagnostics) {
  if (!diagnostics) return false;
  if (diagnostics.ppocrv5_ncnn?.available === true || diagnostics.paddle_docker?.available === true) {
    return true;
  }
  if (diagnostics.ppocrv5_ncnn && typeof diagnostics.ppocrv5_ncnn.available === "boolean") {
    return diagnostics.ppocrv5_ncnn.available;
  }
  if (diagnostics.paddle_docker && typeof diagnostics.paddle_docker.available === "boolean") {
    return diagnostics.paddle_docker.available;
  }
  if (typeof diagnostics.ocr_available === "boolean") return diagnostics.ocr_available;
  return true;
}
function ocrBackendUnavailableReason(diagnostics) {
  const nativeReason = diagnostics?.ppocrv5_ncnn?.reason || "";
  const dockerReason = diagnostics?.paddle_docker?.reason || "";
  const warnings = Array.isArray(diagnostics?.warnings) ? diagnostics.warnings.join(" ") : "";
  return nativeReason || dockerReason || warnings || "OCR backend is not available in this environment.";
}
function paddleOcrStatusText(diagnostics) {
  if (!USE_PADDLE_OCR) return "";
  if (!diagnostics) return "OCR \u5F8C\u7AEF\u5C1A\u672A\u9023\u7DDA\uFF1BPDF \u6703\u5148\u7528\u5FEB\u901F\u6587\u5B57\u5C64\u89E3\u6790\uFF0C\u4E0D\u6703\u7B49\u5F85\u5F8C\u7AEF\u3002";
  if (ocrBackendAvailable(diagnostics)) return "OCR \u5F8C\u7AEF\u53EF\u7528\uFF1B\u5716\u7247\u5148\u7528 ppocrv5_ncnn\uFF0C\u6B04\u4F4D\u4E0D\u8DB3\u6642\u4EE5 YOLO/\u7D05\u6846 ROI \u88DC\u5F37\uFF0CROI \u7121\u6587\u5B57\u624D\u7528 Docker PaddleOCR\uFF0C\u6700\u5F8C\u624D\u5168\u9801 Docker \u5099\u63F4\uFF08Docker PaddleOCR \u5099\u63F4\uFF09\u3002";
  return `OCR \u5F8C\u7AEF\u76EE\u524D\u7121\u53EF\u7528\u5716\u7247 OCR\uFF1BPDF \u4ECD\u53EF\u8D70\u5FEB\u901F\u6587\u5B57\u5C64\u89E3\u6790\u3002${translateOcrWarning(ocrBackendUnavailableReason(diagnostics))}`;
}
function setPaddleOcrStatusInLog(status) {
  if (!status || !els.ocrLog) return;
  const lines = String(els.ocrLog.textContent || "").split("\n").filter((line) => !line.startsWith("PaddleOCR \u5F8C\u7AEF") && !line.startsWith("OCR \u5F8C\u7AEF"));
  els.ocrLog.textContent = [...lines, status].filter(Boolean).join("\n");
}
async function refreshPaddleOcrStatusMessage() {
  if (!USE_PADDLE_OCR || !els.ocrLog) return;
  try {
    const diagnostics = await getPaddleOcrDiagnostics();
    const status = paddleOcrStatusText(diagnostics);
    if (status && !selectedSourceFiles().length) {
      setPaddleOcrStatusInLog(status);
    }
  } catch {
    if (!selectedSourceFiles().length) {
      setPaddleOcrStatusInLog(paddleOcrStatusText(null));
    }
  }
}
async function tryPaddleOcr(file, options = {}) {
  if (!USE_PADDLE_OCR || !file) return false;
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeoutMs = isPdfFile(file) ? PADDLE_OCR_PDF_TIMEOUT_MS : PADDLE_OCR_TIMEOUT_MS;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const initialProgress = Number.isFinite(options.initialProgress) ? options.initialProgress : 8;
  try {
    setOcrProgress2(initialProgress, "OCR \u5F8C\u7AEF\u89E3\u6790\u4E2D...");
    els.ocrLog.textContent = [
      options.reason || "\u6B63\u5728\u4F7F\u7528 OCR \u5F8C\u7AEF\u89E3\u6790\u3002",
      `\u82E5 ppocrv5_ncnn \u8207 Docker PaddleOCR \u90FD\u4E0D\u53EF\u7528\u4E14\u8D85\u904E ${Math.round(timeoutMs / 1e3)} \u79D2\uFF0CPDF \u6703\u56DE\u5230\u5FEB\u901F\u6587\u5B57\u5C64\u89E3\u6790\uFF1B\u5716\u7247\u4E0D\u518D\u4F7F\u7528\u700F\u89BD\u5668 Tesseract \u6216 macOS Vision\u3002`
    ].filter(Boolean).join("\n");
    let diagnostics = null;
    try {
      diagnostics = await getPaddleOcrDiagnostics();
    } catch (error) {
      if (!isPdfFile(file)) throw error;
      console.info("OCR backend diagnostics unavailable; trying PDF OCR endpoint directly.", error);
    }
    if (diagnostics && !ocrBackendAvailable(diagnostics)) {
      if (!isPdfFile(file)) throw new Error(ocrBackendUnavailableReason(diagnostics));
      console.info("OCR backend diagnostics reported unavailable; trying PDF OCR endpoint directly.", diagnostics);
    }
    const form = new FormData();
    form.append("file", file, file.name);
    if (isPdfFile(file)) {
      form.append("max_pages", String(PADDLE_OCR_PDF_MAX_PAGES));
      form.append("dpi", String(PADDLE_OCR_PDF_DPI));
      form.append("fast", PADDLE_OCR_PDF_FAST_MODE ? "true" : "false");
    } else {
      form.append("max_pages", "1");
      form.append("fast", "false");
    }
    const response = await fetch(PADDLE_OCR_ENDPOINT, {
      method: "POST",
      body: form,
      signal: controller.signal
    });
    const responseText = await response.text();
    let result = null;
    try {
      result = responseText ? JSON.parse(responseText) : null;
    } catch {
      throw new Error(responseText || `HTTP ${response.status}`);
    }
    if (!response.ok || !result?.ok) {
      const detail = result?.detail || result?.error || responseText || `HTTP ${response.status}`;
      throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
    }
    if (result.ocr_engine_used === "fallback_none" || result.fallback_reason && !(result.pages || []).some((page) => String(page?.text || "").trim())) {
      throw new Error(result.fallback_reason || "OCR backend returned no recognized text.");
    }
    const fields = result.fields || {};
    const paddleText = paddlePagesText(result.pages);
    let pdfTextLayer = "";
    if (isPdfFile(file) && window.pdfjsLib?.getDocument) {
      try {
        setOcrProgress2(28, "OCR \u5F8C\u7AEF\u5B8C\u6210\uFF0C\u88DC\u8B80 PDF \u6587\u5B57\u5C64\u5224\u65B7\u5C64\u6B21");
        pdfTextLayer = await withTimeout(
          extractPdfTextLayer(file),
          Math.min(PDF_QUICK_TEXT_TIMEOUT_MS, 6e3),
          "PDF \u6587\u5B57\u5C64\u8B80\u53D6\u903E\u6642"
        );
      } catch (error) {
        console.info("PDF text layer supplement unavailable after OCR backend.", error);
      }
    }
    const rawText = [paddleText, pdfTextLayer].filter(Boolean).join("\n\n");
    const paddleParsed = rawText ? parseDeedOcrText(rawText) : null;
    const paddleAddress = fields.building_address || paddleParsed?.propertyAddress || paddleParsed?.address || "";
    const normalizedPaddleAddress = paddleAddress ? sanitizePropertyDoorplate(paddleAddress) || String(paddleAddress) : "";
    const suppressParsedCommonAreaFallback = shouldSuppressParsedCommonAreaFallback(result, fields, rawText, paddleParsed?.common);
    const paddleParsedForFields = suppressParsedCommonAreaFallback && paddleParsed ? { ...paddleParsed, common: null } : paddleParsed;
    const backendOrParsedPing = (backendValue, parsedValue) => String(backendValue ?? "").trim() !== "" ? backendValue : parsedValue ?? null;
    const parsedMainPing = backendOrParsedPing(fields.main_building_area_ping, paddleParsedForFields?.main?.valuePing);
    const parsedAttachPing = backendOrParsedPing(fields.attached_building_area_ping, paddleParsedForFields?.attach?.valuePing);
    const parsedCommonPing = backendOrParsedPing(fields.common_area_ping, paddleParsedForFields?.common?.valuePing);
    const mainAreaApplied = setPaddleAreaValue(els.mainArea, parsedMainPing ?? fields.main_building_area_ping);
    const attachAreaApplied = setPaddleAreaValue(els.attachArea, parsedAttachPing ?? fields.attached_building_area_ping);
    const commonAreaApplied = setPaddleAreaValue(els.commonArea, parsedCommonPing ?? fields.common_area_ping);
    if (!commonAreaApplied && backendOcrFieldWasEvaluated(result, fields, "common_area_ping") && !backendOcrFieldHasValue(fields, "common_area_ping") && els.commonArea) {
      els.commonArea.value = "";
    }
    const hitCount = [mainAreaApplied, attachAreaApplied, commonAreaApplied].filter(Boolean).length;
    if (fields.land_share) {
      els.landShareRaw.value = String(fields.land_share);
      syncLandShareAreaFromRaw();
    } else {
      const appliedLandShare = applyParsedLandShare(paddleParsedForFields?.landShare);
      if (!appliedLandShare) clearParsedLandShare();
    }
    await syncLandShareFromUploadedLandFiles();
    const parsedParkingPing = backendOrParsedPing(fields.parking_area_ping, paddleParsedForFields?.parkingDeedShare?.valuePing);
    if (parsedParkingPing != null) {
      setPaddleAreaValue(els.parkingArea, parsedParkingPing);
      if (fields.parking_count || paddleParsedForFields?.parkingCount || paddleParsedForFields?.parkingDeedShare?.count) {
        setOcrParkingCount(fields.parking_count ?? paddleParsedForFields.parkingCount ?? paddleParsedForFields.parkingDeedShare.count);
      } else {
        clearOcrParkingCount();
      }
    } else {
      clearOcrParkingFields();
    }
    const paddleFloors = fields.total_floor || paddleParsedForFields?.floors || "";
    if (paddleFloors) {
      els.totalFloors.value = String(paddleFloors);
    }
    const paddleParsedForType = parsedWithSupplementalLevelNumbers(paddleParsedForFields, rawText);
    const paddleTownhouseByLevels = shouldTreatParsedAsTownhouse(paddleParsedForType, paddleFloors) || shouldTreatRawTextAsTownhouse(rawText, paddleFloors) || shouldTreatWholeDoorplateLowRiseAsTownhouse(normalizedPaddleAddress, paddleFloors, parsedMainPing ?? fields.main_building_area_ping);
    const appliedPaddleType = paddleTownhouseByLevels ? (applyType("\u900F\u5929"), els.isTownhouse.checked = true, "\u900F\u5929") : applyBuildingTypeFromParsed(paddleParsedForFields, null, paddleFloors, rawText);
    if (normalizedPaddleAddress) {
      els.subjectAddress.value = normalizedPaddleAddress;
      setRecognizedAddressFields({ property: normalizedPaddleAddress });
    }
    if (fields.main_usage && !selectedMainPurposes().length) {
      setCheckboxValues2(els.mainPurposePick, String(fields.main_usage));
    }
    els.otherArea.value = "";
    revealDeedFieldsAfterOcr();
    updateAreaSummary(parseRecords(els.recordsInput.value || defaultRecords2).length);
    lastOcrMapping = {
      source_file: file.name,
      mapped_by: result.cache_hit ? "ocr_pipeline_cache" : result.ocr_engine_used || "ocr_pipeline",
      building_address: normalizedPaddleAddress,
      main_building_area_ping: parsedMainPing ?? fields.main_building_area_ping ?? "",
      attached_building_area_ping: parsedAttachPing ?? fields.attached_building_area_ping ?? "",
      common_area_ping: parsedCommonPing ?? fields.common_area_ping ?? "",
      parking_area_ping: parsedParkingPing ?? fields.parking_area_ping ?? "",
      parking_count: fields.parking_count ?? paddleParsedForFields?.parkingCount ?? paddleParsedForFields?.parkingDeedShare?.count ?? "",
      land_share: fields.land_share || els.landShareArea?.value || "",
      floor: fields.floor || "",
      total_floor: paddleFloors || "",
      \u5C64\u6B21: paddleParsedForType?.unitFloors?.join("\u3001") || "",
      \u591A\u5C64\u6B21\u900F\u5929\u5224\u65B7: paddleTownhouseByLevels ? "\u662F" : "",
      \u5EFA\u7BC9\u5B8C\u6210\u65E5\u671F: fields.completion_date || paddleParsedForFields?.completionDateText || "",
      \u4E3B\u8981\u7528\u9014: fields.main_usage || paddleParsedForFields?.purpose || "",
      main_usage: fields.main_usage || "",
      completion_date: fields.completion_date || "",
      ocr_text: rawText
    };
    let deedQueryReady = false;
    try {
      deedQueryReady = await syncQueryFromDeed({ supplementalOcrText: normalizedPaddleAddress ? "" : rawText });
    } catch (error) {
      console.info("OCR backend fields applied; query sync failed and will need manual review.", error);
    }
    const backendAreaHitCount = applyBackendOcrAreaFields(fields);
    if (backendAreaHitCount) {
      updateAreaSummary(parseRecords(els.recordsInput.value || defaultRecords2).length);
    }
    const backendEngine = result.ocr_engine_used || (result.cache_hit ? "ocr_pipeline_cache" : "ocr_pipeline");
    const backendSource = result.cache_hit ? "ocr_pipeline_cache" : backendEngine;
    const backendConfidence = Number.isFinite(Number(result.confidence)) ? Number(result.confidence) : result.cache_hit ? 0.92 : 0.88;
    setOcrProgress2(100, result.cache_hit ? "OCR \u5F8C\u7AEF\u5FEB\u53D6\u547D\u4E2D" : "OCR \u5F8C\u7AEF\u5B8C\u6210");
    const warningText = (result.warnings || []).slice(0, 6).join("\n");
    els.ocrLog.textContent = [
      `Engine: ${ocrSourceLabel(backendEngine)}${result.cache_hit ? "\uFF08\u5FEB\u53D6\uFF09" : ""}`,
      `Parsed area fields: ${Math.max(hitCount, backendAreaHitCount)}/3`,
      normalizedPaddleAddress ? `Building address: ${normalizedPaddleAddress}` : "Building address: not parsed",
      parsedMainPing ?? fields.main_building_area_ping ? `Main area: ${paddlePingValue(parsedMainPing ?? fields.main_building_area_ping)} ping` : "Main area: not parsed",
      parsedAttachPing ?? fields.attached_building_area_ping ? `Attached area: ${paddlePingValue(parsedAttachPing ?? fields.attached_building_area_ping)} ping` : "Attached area: not parsed",
      parsedCommonPing ?? fields.common_area_ping ? `Common area: ${paddlePingValue(parsedCommonPing ?? fields.common_area_ping)} ping` : "Common area: not parsed",
      paddleTownhouseByLevels ? `Townhouse detected: ${paddleParsedForType?.unitFloors?.join("\u3001") || "\u4F4E\u6A13\u5C64\u6574\u68DF\u9580\u724C"}\uFF0C\u5DF2\u5224\u5B9A\u70BA\u900F\u5929` : "",
      appliedPaddleType ? `Building type: ${appliedPaddleType}` : "",
      deedQueryReady ? `Query synced: ${selectedLabel(els.cityName)} ${selectedLabel(els.districtName)} ${els.roadKeyword.value.trim()}` : "Query sync needs manual review",
      warningText ? `Warnings:
${warningText}` : ""
    ].filter(Boolean).join("\n");
    try {
      const parsedFieldResults = buildOcrFieldResultsFromParsed(paddleParsedForFields || {}, {
        source: backendSource,
        fields,
        fileName: file.name,
        rawText,
        confidence: backendConfidence,
        warnings: result.warnings || [],
        allowDomFallback: false,
        preferBackendFields: true,
        buildingType: appliedPaddleType || els.houseType?.value || "",
        buildingTypeRaw: buildingTypeRawSnippet(rawText, appliedPaddleType || els.houseType?.value || "")
      });
      const backendDiagnosticFieldResults = buildOcrFieldResultsFromBackendDiagnostics(result.diagnostics || {}, {
        source: backendSource,
        fields,
        confidence: backendConfidence,
        warnings: result.warnings || []
      });
      const aiEnhancement = result.ai_enhancement || result.diagnostics?.ai_enhancement || {};
      const roiEnhancement = result.roi_enhancement || result.diagnostics?.roi_enhancement || aiEnhancement.roi_vision || {};
      const mergedAiEnhancement = { ...aiEnhancement, roi_vision: roiEnhancement };
      renderOcrFieldDiagnostics(
        applyAiEnhancementToOcrFieldResults(
          mergeOcrFieldResultObjects(backendDiagnosticFieldResults, parsedFieldResults),
          mergedAiEnhancement
        ),
        {
          ocrTiming: {
            elapsedMs: Date.now() - startedAt,
            source: backendSource,
            engine: backendEngine,
            cacheHit: result.cache_hit === true,
            note: result.fallback_reason ? translateOcrWarning(result.fallback_reason) : isPdfFile(file) ? "OCR \u5F8C\u7AEF PDF \u6A21\u5F0F" : "OCR \u5F8C\u7AEF\u5716\u7247\u89E3\u6790"
          },
          candidateComparison: result.diagnostics?.candidate_comparison || null,
          fallbacks: result.diagnostics?.fallbacks || null,
          fallbackAdopted: result.diagnostics?.fallback_adopted === true,
          aiEnhancement: mergedAiEnhancement
        }
      );
    } catch (error) {
      console.info("OCR backend fields applied; diagnostics render failed.", error);
    }
    if (deedQueryReady) {
      scheduleAutoOfficialSearchAfterDeedReady(true, "OCR \u5F8C\u7AEF");
    }
    return true;
  } catch (error) {
    console.info("OCR backend unavailable or too slow; returning to the fast OCR path.", error);
    const fallbackMode = isPdfFile(file) ? "PDF \u5FEB\u901F\u89E3\u6790" : "\u5716\u7247 OCR \u5F8C\u7AEF\u6AA2\u67E5";
    const reason = error?.name === "AbortError" ? `OCR backend timed out after ${Math.round(timeoutMs / 1e3)} seconds.` : translateOcrWarning(formatCaughtError(error));
    els.ocrLog.textContent = `OCR \u5F8C\u7AEF\u672A\u5728\u5FEB\u901F\u6642\u9650\u5167\u5B8C\u6210\uFF0C\u5DF2\u56DE\u5230${fallbackMode}\u3002${reason}`;
    setOcrProgress2(initialProgress, `OCR \u5F8C\u7AEF\u672A\u5B8C\u6210\uFF0C\u56DE\u5230${fallbackMode}`);
    return false;
  } finally {
    clearTimeout(timer);
  }
}
async function ocrPdfFile() {
  throw browserOcrDisabledError();
}
function parsedDeedHasCoreFields(parsed) {
  if (!parsed) return false;
  const hasArea = !!parsed.main || !!parsed.attach || !!parsed.common;
  const hasAddress = !!(parsed.propertyAddress || parsed.address);
  return hasArea && hasAddress;
}
function pdfQuickParseConfidence(parsed = null, hitCount = 0, querySynced = false, knownPreset = null) {
  const areaHits = Math.max(
    Number(hitCount) || 0,
    [
      safeNumber2(els.mainArea.value),
      safeNumber2(els.attachArea.value),
      safeNumber2(els.commonArea.value)
    ].filter((value) => value > 0).length
  );
  const floorCount = safeNumber2(parsed?.floors || els.totalFloors.value || knownPreset?.floors);
  const hasAddress = !!(parsed?.propertyAddress || parsed?.address || els.subjectAddress.value.trim() || knownPreset?.queryAddress || knownPreset?.address);
  const hasType = !!(parsed?.foundType || els.houseType.value.trim() || knownPreset?.type || detectTypeByFloors(floorCount));
  const reasons = [];
  if (areaHits < 2) reasons.push(`\u4E3B\u8981\u9762\u7A4D\u6B04\u4F4D\u50C5 ${areaHits}/3`);
  if (!hasAddress && !querySynced) reasons.push("\u672A\u53D6\u5F97\u5EFA\u7269\u9580\u724C\u6216\u67E5\u8A62\u5730\u5740");
  if (!hasType) reasons.push("\u672A\u53D6\u5F97\u7E3D\u6A13\u5C64\u6216\u5EFA\u7269\u578B\u614B");
  return { ok: reasons.length === 0, reasons };
}
async function ocrPdfFirstPageDeedBands(file) {
  throw browserOcrDisabledError();
}
async function runOcr() {
  const file = primaryOcrSourceFile();
  if (!file) {
    els.ocrLog.textContent = "\u8ACB\u5148\u4E0A\u50B3\u5F71\u672C\u5716\u7247\u6216 PDF\u3002";
    return;
  }
  const startedAt = Date.now();
  const backendAttempt = initialBackendOcrAttempt(file, {
    backendEnabled: USE_PADDLE_OCR,
    isPdfFile
  });
  if (backendAttempt.shouldAttempt && await tryPaddleOcr(file, { reason: backendAttempt.reason || void 0 })) {
    return;
  }
  const presetApplied = applyKnownFilePreset(file.name, true);
  if (isPdfFile(file) && SKIP_PDF_BROWSER_PARSE_AFTER_PADDLE) {
    const knownPreset = getKnownFilePreset(file.name);
    let textLayerParsed = null;
    let textLayerMessage = "";
    let pdfTextForDiagnostics = "";
    if (window.pdfjsLib?.getDocument) {
      try {
        setOcrProgress2(45, "PDF \u5FEB\u901F\u8B80\u53D6\u6587\u5B57\u5C64");
        const pdfText = await withTimeout(
          extractPdfTextLayer(file),
          PDF_QUICK_TEXT_TIMEOUT_MS,
          "PDF \u6587\u5B57\u5C64\u8B80\u53D6\u903E\u6642"
        );
        pdfTextForDiagnostics = pdfText;
        if (cleanOcrText2(pdfText).length > 40) {
          textLayerParsed = parseDeedOcrText(pdfText);
          const hitCount = [
            fillArea(els.mainArea, textLayerParsed.main),
            fillArea(els.attachArea, textLayerParsed.attach),
            fillArea(els.commonArea, textLayerParsed.common)
          ].filter(Boolean).length;
          if (textLayerParsed.parkingDeedShare) fillArea(els.parkingArea, textLayerParsed.parkingDeedShare);
          applyOcrParkingCountFromParsed(textLayerParsed);
          applyParsedLandShare(textLayerParsed.landShare);
          await syncLandShareFromUploadedLandFiles();
          if (textLayerParsed.floors) els.totalFloors.value = textLayerParsed.floors;
          const queryAddress = textLayerParsed.propertyAddress || textLayerParsed.address || knownPreset?.queryAddress || knownPreset?.address || "";
          if (queryAddress) els.subjectAddress.value = sanitizePropertyDoorplate(queryAddress) || queryAddress;
          if (textLayerParsed.purpose && !selectedMainPurposes().length) setCheckboxValues2(els.mainPurposePick, textLayerParsed.purpose);
          applyBuildingTypeFromParsed(textLayerParsed, knownPreset);
          await syncManualQueryFromParsedDeed(textLayerParsed, pdfText, queryAddress);
          textLayerMessage = `PDF \u6587\u5B57\u5C64\u5FEB\u901F\u89E3\u6790\u5B8C\u6210\uFF0C\u9762\u7A4D\u6B04\u4F4D ${hitCount}/3\u3002`;
        } else {
          textLayerMessage = "PDF \u6587\u5B57\u5C64\u6587\u5B57\u4E0D\u8DB3\uFF0C\u5DF2\u4FDD\u7559\u6A94\u540D\u4FDD\u5E95\u6B04\u4F4D\u3002";
        }
      } catch (error) {
        textLayerMessage = `PDF \u6587\u5B57\u5C64\u5FEB\u901F\u89E3\u6790\u672A\u5B8C\u6210\uFF1A${formatCaughtError(error)}\u3002`;
      }
    } else {
      textLayerMessage = "PDF \u6587\u5B57\u5C64\u6A21\u7D44\u672A\u8F09\u5165\uFF0C\u5DF2\u4FDD\u7559\u6A94\u540D\u4FDD\u5E95\u6B04\u4F4D\u3002";
    }
    revealDeedFieldsAfterOcr();
    updateAreaSummary();
    setOcrProgress2(100, "PDF \u5FEB\u901F\u7D50\u675F");
    els.ocrLog.textContent = [
      "OCR \u5F8C\u7AEF\u672A\u80FD\u5FEB\u901F\u5B8C\u6210\uFF0C\u5DF2\u6539\u7528 PDF \u5FEB\u901F\u89E3\u6790\u3002",
      textLayerMessage,
      knownPreset || presetApplied ? "\u5DF2\u5957\u7528\u6216\u4FDD\u7559\u5DF2\u77E5\u6A94\u540D\u4FDD\u5E95\u6B04\u4F4D\uFF1B\u8ACB\u6AA2\u67E5\u6B04\u4F4D\u3002" : "\u6B64 PDF \u7121\u5DF2\u77E5\u4FDD\u5E95\u6B04\u4F4D\uFF1B\u82E5\u6B04\u4F4D\u4E0D\u8DB3\uFF0C\u8ACB\u6539\u7528\u5716\u7247\u6216\u5148\u5C07\u5EFA\u7269\u6A19\u793A\u90E8\u9801\u9762\u622A\u5716\u5F8C\u4E0A\u50B3\u3002",
      "\u70BA\u907F\u514D\u5361\u4F4F\uFF0C\u672C\u7248\u672C\u4E0D\u5C0D PDF \u57F7\u884C\u700F\u89BD\u5668 Tesseract OCR\u3002"
    ].join("\n");
    const diagnosticsSource = textLayerParsed ? "pdfTextLayer" : knownPreset ? "knownFilePreset" : "pdfTextLayer";
    renderOcrFieldDiagnostics(
      buildOcrFieldResultsFromParsed(textLayerParsed || {}, {
        source: diagnosticsSource,
        fileName: file.name,
        rawText: pdfTextForDiagnostics,
        preset: knownPreset,
        confidence: textLayerParsed ? 0.84 : 0.99,
        warnings: textLayerParsed ? [] : ["OCR \u5F8C\u7AEF\u672A\u5B8C\u6210\uFF0C\u63A1\u5FEB\u901F\u89E3\u6790\u7D50\u679C"]
      }),
      {
        ocrTiming: {
          elapsedMs: Date.now() - startedAt,
          source: diagnosticsSource,
          note: "OCR \u5F8C\u7AEF fallback PDF quick path"
        }
      }
    );
    updateStructuredData();
    return;
  }
  if (!isPdfFile(file)) {
    const backendFailureDetail = String(els.ocrLog.textContent || "").trim();
    els.ocrLog.textContent = [
      "\u5716\u7247 OCR \u5C1A\u672A\u53D6\u5F97\u53EF\u7528\u7D50\u679C\uFF1B\u672C\u7248\u672C\u5DF2\u53D6\u6D88\u700F\u89BD\u5668 Tesseract\u3002",
      "\u8ACB\u5148\u78BA\u8A8D 8001 OCR \u5F8C\u7AEF\u5065\u5EB7\u72C0\u614B\uFF1B\u82E5\u9700 Docker \u88DC\u5F37\uFF0C\u518D\u78BA\u8A8D 8099 \u670D\u52D9\u5DF2\u555F\u52D5\u5F8C\u91CD\u8A66\u3002",
      backendFailureDetail ? `\u5F8C\u7AEF\u56DE\u5831\uFF1A${backendFailureDetail}` : ""
    ].filter(Boolean).join("\n");
    setOcrProgress2(0, "\u5716\u7247 OCR \u5F8C\u7AEF\u672A\u5B8C\u6210");
    renderOcrFieldDiagnostics(
      buildKnownPresetOcrFieldResults(file.name, getKnownFilePreset(file.name), {
        extra: {}
      }),
      {
        ocrTiming: {
          elapsedMs: Date.now() - startedAt,
          source: "backendOnlyImageOcr",
          note: "\u5716\u7247 OCR \u5DF2\u53D6\u6D88\u700F\u89BD\u5668 Tesseract \u5099\u63F4"
        }
      }
    );
    updateStructuredData();
    return;
  }
  els.ocrBtn.disabled = true;
  els.ocrBtn.textContent = "\u8FA8\u8B58\u4E2D...";
  setOcrProgress2(5, "OCR \u6E96\u5099\u4E2D");
  try {
    let rawText = "";
    let mode = "\u5716\u7247 OCR";
    if (isPdfFile(file)) {
      if (!window.pdfjsLib || !window.pdfjsLib.getDocument) {
        els.ocrLog.textContent = `PDF \u89E3\u6790\u6A21\u7D44\u672A\u8F09\u5165\uFF0C\u5DF2\u5148\u5957\u7528\u6A94\u540D\u5C0D\u61C9\u6B04\u4F4D\uFF1A${file.name}\u3002`;
        setOcrProgress2(100, "PDF \u6A21\u7D44\u672A\u8F09\u5165\uFF0C\u5DF2\u5957\u7528\u4FDD\u5E95\u6B04\u4F4D");
        renderOcrFieldDiagnostics(
          buildKnownPresetOcrFieldResults(file.name, getKnownFilePreset(file.name)),
          { ocrTiming: { elapsedMs: Date.now() - startedAt, source: "knownFilePreset", note: "PDF \u6A21\u7D44\u672A\u8F09\u5165" } }
        );
        return;
      }
      const pdfText = await extractPdfTextLayer(file, { maxPages: PDF_TEXT_LAYER_MAX_PAGES });
      if (cleanOcrText2(pdfText).length > 40) {
        rawText = pdfText;
        mode = "PDF \u6587\u5B57\u5C64";
        setOcrProgress2(60, "\u5DF2\u6293\u53D6 PDF \u6587\u5B57\u5C64");
      } else if (!ENABLE_BROWSER_PDF_OCR_FALLBACK) {
        rawText = "";
        mode = "PDF \u5FEB\u901F\u89E3\u6790";
        setOcrProgress2(70, "PDF \u7121\u53EF\u7528\u6587\u5B57\u5C64\uFF0C\u5DF2\u7565\u904E\u8017\u6642\u700F\u89BD\u5668 OCR");
      } else {
        const bandText = await ocrPdfFirstPageDeedBands(file);
        const bandParsed = parseDeedOcrText(bandText);
        if (parsedDeedHasCoreFields(bandParsed) || isBuildingRegistrationDeedText(bandText)) {
          rawText = bandText;
          mode = "PDF \u91CD\u9EDE\u6B04\u4F4D OCR";
        } else {
          rawText = await ocrPdfFile(file, { maxPages: PDF_BROWSER_OCR_MAX_PAGES2, dpi: PDF_OCR_RASTER_DPI2 });
          mode = `PDF OCR\uFF08\u524D ${PDF_BROWSER_OCR_MAX_PAGES2} \u9801\uFF09`;
        }
      }
    } else {
      rawText = await ocrImageSource(file, "OCR \u8FA8\u8B58\u4E2D");
    }
    let parsed = parseDeedOcrText(rawText);
    const deedLike = isBuildingRegistrationDeedText(rawText);
    if (deedLike && !isPdfFile(file)) {
      setOcrProgress2(36, "\u5EFA\u7269\u8B04\u672C\uFF1A\u6B04\u4F4D\u7D1A OCR\uFF08\u5EFA\u865F\uFF0F\u9580\u724C\uFF0F\u7528\u9014\uFF0F\u9762\u7A4D\uFF0F\u5171\u6709\uFF0F\u6B0A\u5229\u7BC4\u570D\uFF09");
      const headerOcr = await ocrImageSource(file, "OCR \u8B04\u672C\u4E0A\u5E36", { regionStart: 0, regionEnd: 0.24, ocrLayout: "headerBand" });
      const fieldText = await ocrDeedFieldLevelBlocks(file, "");
      rawText = [headerOcr, fieldText, rawText].filter(Boolean).join("\n\n");
      parsed = parseDeedOcrText(rawText);
    } else if (ENABLE_BROWSER_PDF_OCR_FALLBACK && deedLike && isPdfFile(file) && mode !== "PDF \u6587\u5B57\u5C64" && mode !== "PDF \u91CD\u9EDE\u6B04\u4F4D OCR" && window.pdfjsLib && window.pdfjsLib.getDocument) {
      setOcrProgress2(36, "\u5EFA\u7269\u8B04\u672C PDF\uFF1A\u6B04\u4F4D\u7D1A OCR\uFF08\u7B2C\u4E00\u9801\u516D\u5340\uFF09");
      const bandText = await ocrPdfFirstPageDeedBands(file);
      rawText = [bandText, rawText].filter(Boolean).join("\n\n");
      parsed = parseDeedOcrText(rawText);
    } else if (ENABLE_BROWSER_PDF_OCR_FALLBACK && deedLike && isPdfFile(file) && mode === "PDF \u6587\u5B57\u5C64" && !parsedDeedHasCoreFields(parsed) && window.pdfjsLib && window.pdfjsLib.getDocument) {
      setOcrProgress2(36, "PDF \u6587\u5B57\u5C64\u4E0D\u8DB3\uFF1A\u88DC\u6293\u7B2C\u4E00\u9801\u6B04\u4F4D OCR");
      const bandText = await ocrPdfFirstPageDeedBands(file);
      rawText = [bandText, rawText].filter(Boolean).join("\n\n");
      parsed = parseDeedOcrText(rawText);
    } else if (!isPdfFile(file) && (!parsed.address || !parsed.main || !parsed.attach || !parsed.common)) {
      setOcrProgress2(48, "\u6B04\u4F4D\u7D1A OCR \u52A0\u5F37");
      const headerBoost = await ocrImageSource(file, "OCR \u8B04\u672C\u4E0A\u5E36", { regionStart: 0, regionEnd: 0.24, ocrLayout: "headerBand" });
      const fieldBoost = await ocrDeedFieldLevelBlocks(file, "");
      const addressBoost = await ocrImageSource(file, "OCR \u5730\u5740\u52A0\u5F37\u8FA8\u8B58\u4E2D", { focusTop: true, ocrLayout: "addressBlock" });
      rawText = [rawText, headerBoost, fieldBoost, addressBoost].filter(Boolean).join("\n\n");
      parsed = parseDeedOcrText(rawText);
    }
    if (ENABLE_BROWSER_PDF_OCR_FALLBACK && isPdfFile(file) && mode === "PDF \u6587\u5B57\u5C64" && parsed.landShare?.valuePing == null) {
      setOcrProgress2(62, "PDF \u571F\u5730\u6A19\u793A\u90E8\u5FEB\u901F\u88DC\u6293 OCR\uFF08\u50C5\u7B2C 1 \u9801\uFF09");
      const landOcrText = await ocrPdfFile(file, { maxPages: 1, dpi: PDF_OCR_RASTER_DPI2 });
      rawText = [rawText, landOcrText].filter(Boolean).join("\n\n");
      parsed = parseDeedOcrText(rawText);
      if (parsed.landShare?.valuePing != null) mode = "PDF \u6587\u5B57\u5C64 + \u571F\u5730\u6301\u5206 OCR";
    }
    const { text, compactText, main, attach, common, parkingDeedShare, landShare, floors, unitFloor, unitFloors, foundType, address, propertyAddress, residenceAddress, purpose, completionDateText } = parsed;
    const directHitCount = [fillArea(els.mainArea, main), fillArea(els.attachArea, attach), fillArea(els.commonArea, common)].filter(Boolean).length;
    if (parkingDeedShare) {
      fillArea(els.parkingArea, parkingDeedShare);
      applyOcrParkingCountFromParsed(parsed);
    } else {
      els.parkingArea.value = "";
      clearOcrParkingCount();
    }
    applyParsedLandShare(landShare);
    await syncLandShareFromUploadedLandFiles();
    els.otherArea.value = "";
    if (floors) els.totalFloors.value = floors;
    const floorCount = safeNumber2(els.totalFloors.value);
    const floorTypeGuess = Number.isFinite(floorCount) && floorCount > 0 ? detectTypeByFloors(floorCount) : "";
    const parsedForType = parsedWithSupplementalLevelNumbers(parsed, rawText);
    const townhouseByLevels = shouldTreatParsedAsTownhouse(parsedForType, floors || els.totalFloors.value) || shouldTreatRawTextAsTownhouse(rawText, floors || els.totalFloors.value) || shouldTreatWholeDoorplateLowRiseAsTownhouse(propertyAddress || address, floors || els.totalFloors.value, main?.valuePing ?? els.mainArea.value);
    if (townhouseByLevels) {
      applyType("\u900F\u5929");
      els.isTownhouse.checked = true;
    } else if (foundType) {
      applyType(foundType);
      els.isTownhouse.checked = foundType === "\u900F\u5929";
    } else if (floorTypeGuess) {
      applyType(floorTypeGuess);
      els.isTownhouse.checked = floorTypeGuess === "\u900F\u5929";
    }
    const knownPreset = getKnownFilePreset(file.name);
    const presetDoorplate = knownPreset?.queryAddress || knownPreset?.address || "";
    let queryAddress = presetDoorplate || propertyAddress || address || residenceAddress || knownPreset?.ownerResidence || "";
    queryAddress = applyFilenameHintToPropertyAddress(queryAddress, file.name) || queryAddress;
    queryAddress = sanitizePropertyDoorplate(queryAddress) || queryAddress;
    queryAddress = await completeAddressWithLocalKnowledge(queryAddress, rawText);
    if (queryAddress) els.subjectAddress.value = queryAddress;
    if (purpose && !selectedMainPurposes().length) setCheckboxValues2(els.mainPurposePick, purpose);
    const resolvedMain = toNumber2(els.mainArea.value);
    const resolvedAttach = toNumber2(els.attachArea.value);
    const resolvedCommon = toNumber2(els.commonArea.value);
    const resolvedLandShare = toNumber2(els.landShareArea.value);
    const resolvedParkingDeed = parkingDeedShare != null ? parkingDeedShare.valuePing : toNumber2(els.parkingArea.value);
    const resolvedParkingCount = ocrParkingCountOverride();
    const resolvedFloors = floors || toNumber2(els.totalFloors.value);
    let resolvedAddress = presetDoorplate || propertyAddress || address || "";
    resolvedAddress = applyFilenameHintToPropertyAddress(resolvedAddress, file.name) || resolvedAddress;
    resolvedAddress = sanitizePropertyDoorplate(resolvedAddress) || resolvedAddress;
    resolvedAddress = await completeAddressWithLocalKnowledge(resolvedAddress, rawText);
    const resolvedResidenceAddress = residenceAddress || knownPreset?.ownerResidence || "";
    const resolvedQueryAddress = els.subjectAddress.value.trim() || queryAddress || resolvedResidenceAddress || resolvedAddress;
    const resolvedPurpose = selectedMainPurposes().join("\u3001") || purpose || "";
    const resolvedType = els.houseType.value.trim() || foundType || selectedTypes().join("\u3001");
    const finalHitCount = [resolvedMain, resolvedAttach, resolvedCommon].filter((value) => value != null && value > 0).length;
    const sourceLabel = presetApplied && directHitCount < 3 ? `${mode} + \u5DF2\u77E5\u6848\u4F8B\u4FDD\u5E95` : mode;
    lastOcrMapping = {
      source_file: file.name,
      mapped_by: sourceLabel,
      \u5EFA\u7269\u9580\u724C: resolvedAddress,
      \u4F4F\u5740: resolvedResidenceAddress,
      \u67E5\u8A62\u5730\u5740: resolvedQueryAddress,
      \u5730\u5740: resolvedAddress,
      \u7E3D\u6A13\u5C64\u6578: resolvedFloors || "",
      \u6A19\u7684\u6240\u5728\u6A13\u5C64: unitFloor ?? "",
      \u5C64\u6B21: parsedForType?.unitFloors?.length ? parsedForType.unitFloors.join("\u3001") : unitFloors?.length ? unitFloors.join("\u3001") : "",
      \u591A\u5C64\u6B21\u900F\u5929\u5224\u65B7: townhouseByLevels ? "\u662F" : "",
      \u5EFA\u7269\u578B\u614B: resolvedType || "",
      \u4E3B\u8981\u7528\u9014: resolvedPurpose || "",
      \u5EFA\u7BC9\u5B8C\u6210\u65E5\u671F: completionDateText || "",
      \u4E3B\u5EFA\u7269\u9762\u7A4D\u576A: resolvedMain ?? "",
      \u9644\u5C6C\u5EFA\u7269\u9762\u7A4D\u576A: resolvedAttach ?? "",
      \u5171\u6709\u90E8\u5206\u9762\u7A4D\u576A: resolvedCommon ?? "",
      \u6A19\u7684\u571F\u5730\u6301\u5206\u576A\u5408\u8A08: resolvedLandShare ?? "",
      \u8ECA\u4F4D\u6B0A\u72C0\u576A\u6578: resolvedParkingDeed != null ? resolvedParkingDeed : "",
      \u8ECA\u4F4D\u6578\u91CF: resolvedParkingCount || "",
      \u5176\u4ED6\u767B\u8A18\u4E8B\u9805\u9762\u7A4D\u576A: ""
    };
    setRecognizedAddressFields({
      property: resolvedAddress
    });
    const diagnosticsSource = mode.includes("PDF \u6587\u5B57\u5C64") ? "pdfTextLayer" : "ocr_pipeline";
    renderOcrFieldDiagnostics(
      buildOcrFieldResultsFromParsed(parsedForType, {
        source: diagnosticsSource,
        fileName: file.name,
        rawText,
        preset: presetApplied && directHitCount < finalHitCount ? knownPreset : null,
        confidence: diagnosticsSource === "pdfTextLayer" ? 0.86 : 0.8
      }),
      {
        ocrTiming: {
          elapsedMs: Date.now() - startedAt,
          source: diagnosticsSource,
          note: mode
        }
      }
    );
    revealDeedFieldsAfterOcr();
    updateAreaSummary();
    const deedQueryReady = await syncQueryFromDeed({ supplementalOcrText: presetDoorplate ? "" : text });
    setOcrProgress2(100, "OCR \u5B8C\u6210");
    els.ocrLog.textContent = [
      `\u4F86\u6E90\uFF1A${sourceLabel}`,
      `OCR \u5B8C\u6210\uFF0C\u76EE\u524D\u5171\u6709 ${finalHitCount}/3 \u500B\u9762\u7A4D\u6B04\u4F4D\u53EF\u7528\uFF08\u4E3B\u5EFA\u7269\u3001\u9644\u5C6C\u3001\u5171\u6709\u90E8\u5206\uFF09\u3002`,
      presetApplied && directHitCount < finalHitCount ? "\u5DF2\u4F9D\u6A94\u540D\u5957\u7528\u5DF2\u77E5\u6848\u4F8B\u4FDD\u5E95\u6B04\u4F4D\u3002" : "\u672C\u6B21\u986F\u793A\u4EE5\u5BE6\u969B\u89E3\u6790\u7D50\u679C\u70BA\u4E3B\u3002",
      `\u4E3B\u5EFA\u7269\uFF1A${resolvedMain != null ? `${resolvedMain} \u576A` : "\u672A\u6293\u5230"}`,
      `\u9644\u5C6C\u5EFA\u7269\uFF1A${resolvedAttach != null ? `${resolvedAttach} \u576A` : "\u672A\u6293\u5230"}`,
      `\u5171\u6709\u90E8\u5206\uFF1A${resolvedCommon != null ? `${resolvedCommon} \u576A` : "\u672A\u6293\u5230"}`,
      resolvedLandShare != null && resolvedLandShare > 0 ? `\u571F\u5730\u6301\u5206\u576A\u5408\u8A08\uFF1A${resolvedLandShare} \u576A` : "\u571F\u5730\u6301\u5206\uFF1A\u672A\u6293\u5230",
      resolvedParkingDeed != null && resolvedParkingDeed > 0 ? `\u8ECA\u4F4D\u6B0A\u72C0\u5206\u6524\u576A\u6578\uFF1A${resolvedParkingDeed} \u576A\uFF08\u5DF2\u81EA\u5171\u6709\u6B0A\u5229\u7BC4\u570D\u62C6\u51FA\uFF09` : "",
      resolvedParkingCount ? `\u8ECA\u4F4D\u6578\u91CF\uFF1A${resolvedParkingCount} \u500B\uFF08\u4F9D OCR \u505C\u8ECA\u4F4D\u7DE8\u865F\uFF0F\u6B0A\u5229\u7BC4\u570D\uFF09` : "",
      resolvedFloors ? `\u7E3D\u6A13\u5C64\uFF1A${resolvedFloors}` : "\u7E3D\u6A13\u5C64\uFF1A\u672A\u6293\u5230",
      townhouseByLevels ? `\u5C64\u6B21\uFF1A${unitFloors.join("\u3001")}\uFF08\u591A\u500B\u5C64\u6B21\uFF0C\u5DF2\u5224\u5B9A\u70BA\u900F\u5929\uFF09` : "",
      resolvedAddress ? `\u5EFA\u7269\u9580\u724C\uFF1A${resolvedAddress}` : "\u5EFA\u7269\u9580\u724C\uFF1A\u672A\u6293\u5230",
      resolvedPurpose ? `\u4E3B\u8981\u7528\u9014\uFF1A${resolvedPurpose}` : "\u4E3B\u8981\u7528\u9014\uFF1A\u672A\u6293\u5230",
      deedQueryReady ? `\u5DF2\u5E36\u5165\u67E5\u8A62\u6B04\u4F4D\uFF1A${selectedLabel(els.cityName)} ${selectedLabel(els.districtName)} ${els.roadKeyword.value.trim()}` : "\u5C1A\u672A\u80FD\u81EA\u52D5\u5E36\u5165\u5B8C\u6574\u67E5\u8A62\u5730\u5740",
      finalHitCount === 0 ? `OCR \u6587\u5B57\u9810\u89BD\uFF1A${compactText.slice(0, 240) || "\u672A\u53D6\u5F97\u6709\u6548\u6587\u5B57"}` : ""
    ].filter(Boolean).join("\n");
    if (deedQueryReady) {
      scheduleAutoOfficialSearchAfterDeedReady(true, "OCR");
    }
  } catch (error) {
    console.error("OCR failed", error);
    els.ocrLog.textContent = `OCR \u5931\u6557\uFF1A${formatCaughtError(error)}`;
    setOcrProgress2(0, "OCR \u5931\u6557");
  } finally {
    els.ocrBtn.disabled = false;
    els.ocrBtn.textContent = "\u958B\u59CB OCR / PDF \u89E3\u6790";
    updateStructuredData();
  }
}
var ocrRuntime = createOcrRuntime({
  runOcr,
  tryPaddleOcr,
  extractPdfTextLayer,
  ocrPdfFile,
  ocrImageSource,
  refreshPaddleOcrStatusMessage
});
window.FoundOcrFlow = ocrRuntime;
function parseRecords(raw) {
  return String(raw || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line, index) => {
    let parts = line.split(/\t/.test(line) ? /\t/ : /,/).map((part) => part.trim());
    const legacyMode = Number.isFinite(toNumber2(parts[1]));
    if (legacyMode && parts.length > 13) {
      parts = [
        ...parts.slice(0, 7),
        parts.slice(7, Math.max(8, parts.length - 5)).join(","),
        ...parts.slice(Math.max(8, parts.length - 5))
      ];
    } else if (!legacyMode && parts.length > 18) {
      parts = [
        ...parts.slice(0, 9),
        parts.slice(9, Math.max(10, parts.length - 8)).join(","),
        ...parts.slice(Math.max(10, parts.length - 8))
      ];
    }
    const row = legacyMode ? {
      row: index + 1,
      address: parts[0] || `\u672A\u547D\u540D\u6848\u4F8B ${index + 1}`,
      community: deriveCommunity(parts[0] || ""),
      tradeYearMonth: "",
      unitPrice: toNumber2(parts[1]),
      totalPrice: toNumber2(parts[2]),
      totalArea: toNumber2(parts[3]),
      mainRatio: toNumber2(parts[4]),
      type: parts[5] || "",
      age: toNumber2(parts[6]),
      floorInfo: parts[7] || "",
      purpose: parts[8] || "",
      target: parts[9] || "",
      layout: parts[10] || "",
      parkingPrice: toNumber2(parts[11]),
      management: "",
      elevator: "",
      history: "",
      note: parts.slice(12).join(",")
    } : {
      row: index + 1,
      address: parts[0] || `\u672A\u547D\u540D\u6848\u4F8B ${index + 1}`,
      community: parts[1] || "",
      tradeYearMonth: parts[2] || "",
      unitPrice: toNumber2(parts[3]),
      totalPrice: toNumber2(parts[4]),
      totalArea: toNumber2(parts[5]),
      mainRatio: toNumber2(parts[6]),
      type: parts[7] || "",
      age: toNumber2(parts[8]),
      floorInfo: parts[9] || "",
      purpose: parts[10] || "",
      target: parts[11] || "",
      layout: parts[12] || "",
      parkingPrice: toNumber2(parts[13]),
      management: parts[14] || "",
      elevator: parts[15] || "",
      history: parts[16] || "",
      note: parts.slice(17).join(",")
    };
    row.landTransferArea = extractLandTransferAreaFromText(row.note);
    row.originalUnitPrice = extractOriginalOfficialUnitPriceFromText(row.note);
    row.sq = extractOfficialSqFromText(row.note);
    row.lat = extractCoordinateFromText(row.note, ["lat", "\u7DEF\u5EA6"]);
    row.lng = extractCoordinateFromText(row.note, ["lng", "lon", "\u7D93\u5EA6"]);
    row.localFallback = /本機離線備援/.test(row.note);
    row.parkingCount = comparableParkingCount2(row);
    row.note = hideOfficialSqInNote(row.note);
    row.city = row.address.match(/^.+?[市縣]/)?.[0] || "";
    row.district = deriveDistrict(row.address);
    row.road = deriveRoad(row.address);
    row.tradePeriodValue = normalizePeriodValue(row.tradeYearMonth);
    row.mainAreaForFilter = row.totalArea;
    return row;
  }).filter(isValidOfficialTransactionRow);
}
function resultStatusRank(row, kept, removed) {
  if (removed.has(row)) return 2;
  if (kept.has(row)) return row.shortTermPriorSale ? 0 : 1;
  return 3;
}
function resultStatusBadge(row, kept, removed) {
  if (removed.has(row)) return '<span class="badge badge-removed">\u672A\u7D0D\u5165\u5E73\u5747</span>';
  if (kept.has(row)) return row.shortTermPriorSale ? '<span class="badge badge-kept">\u524D\u624B\u50F9\u8A8D\u5217</span>' : '<span class="badge badge-kept">\u7D0D\u5165\u5E73\u5747</span>';
  return '<span class="badge">\u5DF2\u6392\u5E8F</span>';
}
function parseResultTradeDateSortValue(row) {
  const text = normalizeFullWidthDigitsToAscii3(String(row.tradeDate || row.tradeYearMonth || "").trim());
  const match = text.match(/(\d{2,3})\D?(\d{1,2})(?:\D?(\d{1,2}))?/);
  if (match) {
    return Number(match[1]) * 1e4 + Number(match[2]) * 100 + Number(match[3] || 0);
  }
  return row.tradePeriodValue != null ? Number(row.tradePeriodValue) * 100 : null;
}
function floorInfoSortValue(row) {
  const unitFloor = parseUnitFloorFromFloorInfo2(row.floorInfo);
  const totalFloors = parseTotalFloorsFromFloorInfo2(row.floorInfo);
  if (Number.isFinite(unitFloor) || Number.isFinite(totalFloors)) {
    return (Number.isFinite(unitFloor) ? unitFloor : 0) * 1e3 + (Number.isFinite(totalFloors) ? totalFloors : 0);
  }
  return String(row.floorInfo || "").trim();
}
function resultSortValue(row, key, kept, removed) {
  switch (key) {
    case "totalPrice":
      return row.totalPrice;
    case "tradeDate":
      return parseResultTradeDateSortValue(row);
    case "unitPrice":
      return row.unitPrice;
    case "totalArea":
      return row.totalArea;
    case "age":
      return row.age;
    case "floorInfo":
      return floorInfoSortValue(row);
    case "parkingPrice":
      return row.parkingPrice;
    case "comparableScore":
      return row.comparableScore;
    case "status":
      return resultStatusRank(row, kept, removed);
    case "address":
      return row.address || "";
    case "community":
      return row.community || "";
    case "type":
      return row.type || "";
    case "purpose":
      return row.purpose || "";
    case "target":
      return row.target || "";
    case "layout":
      return row.layout || "";
    case "management":
      return row.management || "";
    case "elevator":
      return row.elevator || "";
    case "note":
      return row.note || "";
    default:
      return "";
  }
}
function isMissingSortValue(value) {
  return value == null || value === "" || typeof value === "number" && !Number.isFinite(value);
}
function compareSortValues(a, b) {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return resultSortCollator2.compare(String(a), String(b));
}
function sortedResultRows(rows, kept, removed) {
  const { sortKey, sortDirection } = resultTableState;
  if (!sortKey || !resultSortColumns2.has(sortKey)) return rows;
  const direction = sortDirection === "desc" ? -1 : 1;
  return rows.map((row, index) => ({ row, index })).sort((a, b) => {
    const aValue = resultSortValue(a.row, sortKey, kept, removed);
    const bValue = resultSortValue(b.row, sortKey, kept, removed);
    const aMissing = isMissingSortValue(aValue);
    const bMissing = isMissingSortValue(bValue);
    if (aMissing || bMissing) {
      if (aMissing !== bMissing) return aMissing ? 1 : -1;
      return a.index - b.index;
    }
    const diff = compareSortValues(aValue, bValue);
    return diff === 0 ? a.index - b.index : diff * direction;
  }).map((item) => item.row);
}
function updateResultSortButtons() {
  document.querySelectorAll("[data-result-sort]").forEach((button) => {
    const key = button.dataset.resultSort;
    const active = key === resultTableState.sortKey;
    const direction = resultTableState.sortDirection === "desc" ? "desc" : "asc";
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
    button.setAttribute("aria-label", `${button.textContent.trim()}\u6392\u5E8F${active ? direction === "asc" ? "\uFF0C\u76EE\u524D\u7531\u5C0F\u5230\u5927" : "\uFF0C\u76EE\u524D\u7531\u5927\u5230\u5C0F" : ""}`);
    const icon = button.querySelector(".sort-icon");
    if (icon) icon.textContent = active ? direction === "asc" ? "\u2191" : "\u2193" : "\u2195";
    const th = button.closest("th");
    if (th) {
      th.classList.toggle("sort-active", active);
      th.setAttribute("aria-sort", active ? direction === "asc" ? "ascending" : "descending" : "none");
    }
  });
}
function sortResultTableBy(key) {
  if (!resultSortColumns2.has(key)) return;
  resultTableState.sortDirection = resultTableState.sortKey === key && resultTableState.sortDirection === "asc" ? "desc" : "asc";
  resultTableState.sortKey = key;
  renderRows(resultTableState.rows, resultTableState.kept, resultTableState.removed);
}
function resetResultTableSortState() {
  resultTableState = { rows: [], kept: /* @__PURE__ */ new Set(), removed: /* @__PURE__ */ new Set(), sortKey: DEFAULT_RESULT_SORT_KEY, sortDirection: DEFAULT_RESULT_SORT_DIRECTION };
  updateResultSortButtons();
}
function renderRows(rows, kept = /* @__PURE__ */ new Set(), removed = /* @__PURE__ */ new Set()) {
  resultTableState.rows = Array.isArray(rows) ? [...rows] : [];
  resultTableState.kept = kept;
  resultTableState.removed = removed;
  if (!rows.length) {
    els.resultBody.innerHTML = '<tr><td colspan="18" style="color:#667085;">\u67E5\u7121\u7B26\u5408\u689D\u4EF6\u8CC7\u6599</td></tr>';
    updateResultSortButtons();
    return;
  }
  const displayRows = sortedResultRows(rows, kept, removed);
  els.resultBody.innerHTML = displayRows.map((row, index) => {
    const status = resultStatusBadge(row, kept, removed);
    const tradeDate = row.tradeDate || row.tradeYearMonth || "";
    const unitTitle = row.landTransferArea != null && row.originalUnitPrice != null ? `\u900F\u5929\u55AE\u50F9\u6539\u7B97\uFF1A\u7E3D\u50F9 ${formatNum2(row.totalPrice, 0)} \xF7 \u571F\u5730\u79FB\u8F49\u9762\u7A4D ${formatNum2(row.landTransferArea, 3)} \u576A\uFF1B\u539F\u5B98\u65B9\u55AE\u50F9 ${formatNum2(row.originalUnitPrice)}` : "";
    const scoreTitle = Array.isArray(row.comparableSortReason) ? row.comparableSortReason.join("\n") : "";
    const scoreCell = Number.isFinite(row.comparableScore) ? formatNum2(row.comparableScore, 1) : "";
    return `<tr><td>${safeCell(row.address)}</td><td>${safeCell(row.community)}</td><td class="cell-num">${row.totalPrice != null ? formatNum2(row.totalPrice, 0) : ""}</td><td>${safeCell(tradeDate)}</td><td class="cell-unit-price" title="${escapeHtml(unitTitle)}">${formatNum2(row.unitPrice)}</td><td class="cell-num">${row.totalArea != null ? formatNum2(row.totalArea) : ""}</td><td>${safeCell(row.type)}</td><td class="cell-num">${row.age != null ? safeCell(row.age) : ""}</td><td>${safeCell(row.floorInfo)}</td><td>${safeCell(row.purpose)}</td><td>${safeCell(row.target)}</td><td>${safeCell(row.layout)}</td><td class="cell-num">${row.parkingPrice != null ? formatNum2(row.parkingPrice, 0) : ""}</td><td>${safeCell(row.management)}</td><td>${safeCell(row.elevator)}</td><td class="cell-num" title="${escapeHtml(scoreTitle)}">${safeCell(scoreCell)}</td><td>${status}</td><td>${safeCell(hideOfficialSqInNote(row.note || ""))}</td></tr>`;
  }).join("");
  updateResultSortButtons();
}
function rangeOk(value, min, max) {
  if (min != null && (value == null || value < min)) return false;
  if (max != null && (value == null || value > max)) return false;
  return true;
}
function includesToken(source, keyword) {
  if (!keyword) return true;
  return String(source || "").includes(keyword);
}
function normalizeText2(value) {
  return String(value || "").replace(/\s+/g, "").replace(/臺/g, "\u53F0").trim();
}
function stripLeadingKnownAdminArea2(value) {
  let text = String(value || "");
  const cityNames = Object.keys(CITY_DISTRICTS2).flatMap((city) => [city, city.replace(/^臺/, "\u53F0"), city.replace(/^台/, "\u81FA")]);
  for (const city of [...new Set(cityNames)].sort((a, b) => b.length - a.length)) {
    if (city && text.startsWith(city)) {
      text = text.slice(city.length);
      break;
    }
  }
  const districts = [...new Set(Object.values(CITY_DISTRICTS2).flat())].sort((a, b) => b.length - a.length);
  for (const district of districts) {
    if (district && text.startsWith(district)) {
      text = text.slice(district.length);
      break;
    }
  }
  return text;
}
function normalizeDoorplateForMatch2(address) {
  let text = normalizeFullWidthDigitsToAscii3(cleanOcrText2(address || "")).replace(/\s+/g, "").replace(/臺/g, "\u53F0").replace(/[，,、。．.]/g, "");
  if (!text) return "";
  text = stripVillageNeighborhoodPrefix2(text);
  text = stripLeadingKnownAdminArea2(text);
  text = text.replace(/([一二三四五六七八九十百千壹]+)(?=樓|層)/gu, (match) => {
    const n = parseFloorLevelToken3(match);
    return n != null ? String(n) : match;
  });
  text = text.replace(/之([一二三四五六七八九十百千壹ㄧ]+)/gu, (_, token) => {
    const n = parseFloorLevelToken3(token);
    return n != null ? `\u4E4B${n}` : `\u4E4B${token}`;
  });
  return text;
}
function subjectDoorplateMatchKeys() {
  return [
    els.subjectAddress?.value,
    els.recognizedPropertyAddress?.value,
    lastOcrMapping["\u5EFA\u7269\u9580\u724C"],
    lastOcrMapping["\u67E5\u8A62\u5730\u5740"],
    lastOcrMapping["\u5730\u5740"],
    lastOcrMapping.building_address
  ].map(normalizeDoorplateForMatch2).filter(Boolean);
}
function resolveSubjectComparableAddress(query = currentQuery()) {
  return [
    query.subjectAddress,
    els.subjectAddress?.value,
    els.recognizedPropertyAddress?.value,
    lastOcrMapping["\u67E5\u8A62\u5730\u5740"],
    lastOcrMapping["\u5EFA\u7269\u9580\u724C"],
    lastOcrMapping["\u5730\u5740"],
    lastOcrMapping.building_address
  ].map((value) => String(value || "").trim()).find(Boolean) || "";
}
function formatAddressProximitySortNote2(subjectAddress) {
  const formatter = window.FoundValuationSort?.formatAddressProximitySortNote;
  if (typeof formatter === "function") return formatter(subjectAddress);
  const road = deriveRoad(subjectAddress);
  return road ? `\u5730\u5740\u63A5\u8FD1\u5EA6\u4EE5\u6A19\u7684\u300C${road}\u300D\u6BD4\u5C0D\u3002` : "\u5730\u5740\u63A5\u8FD1\u5EA6\u7565\u904E\uFF08\u672A\u53D6\u5F97\u53EF\u6BD4\u5C0D\u7684\u6A19\u7684\u9053\u8DEF\uFF09\u3002";
}
function sameDoorplateAsSubject(rowAddress, subjectKeys = subjectDoorplateMatchKeys()) {
  const rowKey = normalizeDoorplateForMatch2(rowAddress);
  if (!rowKey || !subjectKeys.length) return false;
  return subjectKeys.some((key) => rowKey === key);
}
function deriveDistrict(address) {
  const match = String(address || "").match(/.+?[市縣]([^市區鄉鎮]+[區鄉鎮市])/);
  return match ? match[1] : "";
}
function deriveRoad(address) {
  const match = String(address || "").match(/([^0-9]+(?:路|街|大道|巷|段))/);
  return match ? match[1] : "";
}
function deriveCommunity(address) {
  const normalized = String(address || "").trim();
  const floorMatch = normalized.match(new RegExp(`(.+?(?:\u865F|\u5F04|\u5DF7).+?(?:\u6A13(?:\u4E4B${RE_ADDR_SUFFIX_NUMBER})?))`));
  if (floorMatch) return floorMatch[1];
  const doorMatch = normalized.match(/(.+?(?:號|弄|巷))/);
  return doorMatch ? doorMatch[1] : normalized;
}
function normalizePeriodValue(value) {
  const text = String(value || "").trim();
  const match = text.match(/(\d{2,3})\D?(\d{1,2})/);
  if (!match) return null;
  return Number(match[1]) * 100 + Number(match[2]);
}
var COMPARABLE_AVG_TOP_N = 3;
var COMPARABLE_MIN_TOTAL_AREA_PING = 10;
function dateFromYmdParts2(year, month, day) {
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  const dt = new Date(year, month - 1, day);
  if (dt.getFullYear() !== year || dt.getMonth() !== month - 1 || dt.getDate() !== day) return null;
  return dt;
}
function parseDateFromText2(dateText) {
  const text = normalizeFullWidthDigitsToAscii3(String(dateText || "").trim());
  if (!text) return null;
  const ad = text.match(/(19\d{2}|20\d{2})\D{0,2}(\d{1,2})\D{0,2}(\d{1,2})/);
  if (ad) return dateFromYmdParts2(Number(ad[1]), Number(ad[2]), Number(ad[3]));
  const roc = text.match(/(\d{2,3})\D{0,2}(\d{1,2})\D{0,2}(\d{1,2})/);
  if (roc) return dateFromYmdParts2(Number(roc[1]) + 1911, Number(roc[2]), Number(roc[3]));
  return null;
}
function startOfLocalDay(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function oneYearBefore(date) {
  const d = startOfLocalDay(date);
  if (!d) return null;
  return new Date(d.getFullYear() - 1, d.getMonth(), d.getDate());
}
function isDateWithinLastYear(tradeDate, queryDate = /* @__PURE__ */ new Date()) {
  const trade = startOfLocalDay(tradeDate);
  const query = startOfLocalDay(queryDate);
  const lower = oneYearBefore(query);
  if (!trade || !query || !lower) return false;
  return trade >= lower && trade <= query;
}
function findShortTermPriorSale(rows, queryDate = /* @__PURE__ */ new Date()) {
  const subjectKeys = subjectDoorplateMatchKeys();
  if (!subjectKeys.length) return null;
  return rows.map((row) => ({ row, tradeDate: parseDateFromText2(row.tradeDate || row.tradeYearMonth || "") })).filter(
    ({ row, tradeDate }) => sameDoorplateAsSubject(row.address, subjectKeys) && tradeDate && isDateWithinLastYear(tradeDate, queryDate) && Number.isFinite(row.unitPrice) && Number.isFinite(row.totalPrice)
  ).sort((a, b) => b.tradeDate.getTime() - a.tradeDate.getTime())[0] || null;
}
function resolveSubjectAgeFromDeedCompletion2(completionDateText, appraisalBaseDate = /* @__PURE__ */ new Date()) {
  const completion = parseDateFromText2(completionDateText);
  if (!completion) return null;
  if (!(appraisalBaseDate instanceof Date) || Number.isNaN(appraisalBaseDate.getTime())) return null;
  const deltaMs = appraisalBaseDate.getTime() - completion.getTime();
  if (deltaMs < 0) return null;
  const ageYears = deltaMs / (365.2425 * 24 * 60 * 60 * 1e3);
  if (!Number.isFinite(ageYears)) return null;
  return +ageYears.toFixed(3);
}
function resolveAppraisalBaseDate(query) {
  const periodEnd = composePeriod(query.periodEndYear, query.periodEndMonth);
  const m = String(periodEnd || "").match(/^(\d{2,3})(\d{2})$/);
  if (!m) return /* @__PURE__ */ new Date();
  const y = Number(m[1]) + 1911;
  const mm = Number(m[2]);
  if (!Number.isFinite(y) || !Number.isFinite(mm) || mm < 1 || mm > 12) return /* @__PURE__ */ new Date();
  return new Date(y, mm, 0);
}
function formatDateYmd(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function parseUnitFloorFromFloorInfo2(floorInfo) {
  const raw = String(floorInfo || "").trim();
  if (!raw) return null;
  const firstSeg = raw.split(/[\/／]/)[0].replace(/\s+/g, "");
  if (!firstSeg || /地下|B1|b1/i.test(firstSeg)) return null;
  const m = firstSeg.match(/^([0-9一二三四五六七八九十百千壹]+)\s*(樓|層|F|f)/i);
  if (!m) return null;
  return parseFloorLevelToken3(m[1]);
}
function ageDistanceForSort(rowAge, refAge) {
  if (refAge == null || !Number.isFinite(refAge)) return 0;
  const a = toNumber2(rowAge);
  if (!Number.isFinite(a)) return 1e9;
  return Math.abs(a - refAge);
}
function floorDistanceForSort(floorInfo, refFloors) {
  if (refFloors == null || !Number.isFinite(refFloors) || refFloors <= 0) return 0;
  const fp = parseTotalFloorsFromFloorInfo2(floorInfo);
  if (fp == null || !Number.isFinite(fp)) return 1e9;
  return Math.abs(fp - refFloors);
}
function sortComparablesForAverage2(rows, contextOrRefAge, refFloors, preferredTypes = []) {
  const bridgedSort = window.FoundValuationSort?.sortComparablesForAverage;
  if (typeof bridgedSort === "function") {
    return bridgedSort(rows, contextOrRefAge, refFloors, preferredTypes);
  }
  const context = contextOrRefAge && typeof contextOrRefAge === "object" ? contextOrRefAge : { refAge: contextOrRefAge, refFloors, preferredTypes };
  const fallbackRefAge = context.refAge;
  const fallbackRefFloors = context.refFloors;
  const typePriority = Array.isArray(context.preferredTypes) ? context.preferredTypes.map((type) => String(type || "").trim()).filter(Boolean) : [];
  return [...rows].sort((a, b) => {
    if (typePriority.length) {
      const ta = rowMatchesAnyPreferredType(a, typePriority) ? 0 : 1;
      const tb = rowMatchesAnyPreferredType(b, typePriority) ? 0 : 1;
      if (ta !== tb) return ta - tb;
    }
    const da = ageDistanceForSort(a.age, fallbackRefAge);
    const db = ageDistanceForSort(b.age, fallbackRefAge);
    if (da !== db) return da - db;
    const fa = floorDistanceForSort(a.floorInfo, fallbackRefFloors);
    const fb = floorDistanceForSort(b.floorInfo, fallbackRefFloors);
    if (fa !== fb) return fa - fb;
    const upA = Number.isFinite(a.unitPrice) ? a.unitPrice : -Infinity;
    const upB = Number.isFinite(b.unitPrice) ? b.unitPrice : -Infinity;
    if (upB !== upA) return upB - upA;
    const va = a.tradePeriodValue == null ? -Infinity : Number(a.tradePeriodValue);
    const vb = b.tradePeriodValue == null ? -Infinity : Number(b.tradePeriodValue);
    if (vb !== va) return vb - va;
    return String(a.address || "").localeCompare(String(b.address || ""), "zh-Hant");
  });
}
function parseTotalFloorsFromFloorInfo2(text) {
  const s = String(text || "").trim();
  if (!s) return null;
  const slash = s.match(/(\d+)\s*[\/／]\s*(\d+)/);
  if (slash) {
    const a = Number(slash[1]);
    const b = Number(slash[2]);
    if (Number.isFinite(a) && Number.isFinite(b)) return Math.max(a, b);
  }
  const nums = [...s.matchAll(/(\d+)\s*(?:樓|層|F|f)/g)].map((m) => Number(m[1])).filter((n) => Number.isFinite(n));
  if (nums.length) return Math.max(...nums);
  const plain = toNumber2(s);
  return Number.isFinite(plain) ? plain : null;
}
function normalizeFullWidthDigitsToAscii3(s) {
  return String(s || "").replace(/[０-９]/g, (ch) => String("\uFF10\uFF11\uFF12\uFF13\uFF14\uFF15\uFF16\uFF17\uFF18\uFF19".indexOf(ch)));
}
function parseFloorLevelToken3(tok) {
  let t = normalizeFullWidthDigitsToAscii3(String(tok || "").trim());
  t = t.replace(/ㄧ/g, "\u4E00");
  if (!t) return null;
  if (/^\d{1,3}$/.test(t)) {
    const n = Number(t);
    return Number.isFinite(n) && n >= 1 && n <= 199 ? n : null;
  }
  const d = { "\u3007": 0, \u96F6: 0, \u4E00: 1, \u4E8C: 2, \u4E09: 3, \u56DB: 4, \u4E94: 5, \u516D: 6, \u4E03: 7, \u516B: 8, \u4E5D: 9, \u5341: 10, \u58F9: 1 };
  if (t.length === 1) {
    const v = d[t];
    return v >= 1 ? v : null;
  }
  if (t === "\u5341") return 10;
  const m11 = t.match(/^十([一二三四五六七八九])$/);
  if (m11) return 10 + d[m11[1]];
  const m12 = t.match(/^([一二三四五六七八九])十$/);
  if (m12) return d[m12[1]] * 10;
  const m13 = t.match(/^([一二三四五六七八九])十([一二三四五六七八九])$/);
  if (m13) return d[m13[1]] * 10 + d[m13[2]];
  const tens = "\u4E00\u4E8C\u4E09\u56DB\u4E94\u516D\u4E03\u516B\u4E5D";
  for (let i = 0; i < tens.length; i++) {
    const head = tens[i];
    if (t === `${head}\u5341`) return (i + 1) * 10;
    if (t.length === 3 && t[0] === head && t[1] === "\u5341") {
      const u = d[t[2]];
      if (u >= 1) return (i + 1) * 10 + u;
    }
  }
  return null;
}
function parseLastFloorFromAddress2(address) {
  const s = cleanOcrText2(address || "").replace(/\s+/g, "");
  if (!s) return null;
  if (/地下一樓|地下1樓|地下１樓/i.test(s)) return null;
  const matches = [...s.matchAll(/([0-9０-９一二三四五六七八九十百千壹]+)\s*樓/gu)];
  if (!matches.length) return null;
  return parseFloorLevelToken3(matches[matches.length - 1][1]);
}
function comparableRowIsFirstFloor2(row) {
  if (rowFloorIsFullLevel2(row?.floorInfo)) return false;
  const fromInfo = parseUnitFloorFromFloorInfo2(row.floorInfo || "");
  if (fromInfo === 1) return true;
  if (fromInfo != null) return false;
  return parseLastFloorFromAddress2(row.address || "") === 1;
}
function subjectPropertyUnitFloor() {
  const ff = els.floorFilter?.value?.trim() || "";
  if (ff) {
    const compact = ff.replace(/\s+/g, "");
    const m = compact.match(/^([0-9０-９一二三四五六七八九十百千壹]+)(樓|層|F|f)?$/i);
    if (m) {
      const n = parseFloorLevelToken3(m[1]);
      if (n != null) return n;
    }
  }
  const mappedFloor = toNumber2(lastOcrMapping["\u6A19\u7684\u6240\u5728\u6A13\u5C64"]);
  if (Number.isFinite(mappedFloor) && mappedFloor >= 1) return mappedFloor;
  const blob = [els.subjectAddress?.value, els.communityName?.value, els.recognizedPropertyAddress?.value].filter(Boolean).join("");
  return parseLastFloorFromAddress2(blob);
}
function rowMatchesDealTargets(row, dealTargets) {
  if (!dealTargets.length) return true;
  const targetText = String(row.target || "");
  const parkingPrice = toNumber2(row.parkingPrice);
  const hasParking = targetText.includes("\u8ECA\u4F4D") || parkingPrice != null && parkingPrice > 0;
  return dealTargets.some((target) => {
    if (target === "\u623F\u5730") return targetText.includes("\u623F\u5730") && !hasParking;
    if (target === "\u623F\u5730(\u8ECA)") return hasParking;
    if (target === "\u55AE\u4F4D") return targetText.includes("\u55AE\u4F4D");
    return targetText.includes(target);
  });
}
function rowMatchesKeywordGroup(row, query) {
  const addressText = normalizeText2(row.address);
  const cityText = normalizeText2(query.cityName);
  const districtText = normalizeText2(query.districtName);
  const communityText = normalizeText2(query.communityName);
  const subjectText = normalizeText2(query.subjectAddress);
  const roadText = normalizeText2(query.roadKeyword);
  const rowCityText = normalizeText2(row.city || "");
  const rowDistrictText = normalizeText2(row.district || "");
  if (cityText && rowCityText && !rowCityText.includes(cityText) && !addressText.includes(cityText)) return false;
  if (districtText && !rowDistrictText.includes(districtText) && !addressText.includes(districtText)) return false;
  if (communityText) {
    const communitySource = normalizeText2(row.community || row.address);
    if (!communitySource.includes(communityText) && !addressText.includes(communityText)) return false;
  }
  if (subjectText && !addressText.includes(subjectText)) return false;
  if (roadText) {
    const roadSource = isCommunityKeyword(query.roadKeyword) ? normalizeText2(row.community || row.address) : normalizeText2(row.road || row.address || row.community);
    if (!roadSource.includes(roadText) && !addressText.includes(roadText)) return false;
  }
  return true;
}
function runSearch(options = {}) {
  const keepProgress = !!options.keepProgress;
  const ignoreQueryFilters = !!options.ignoreQueryFilters;
  const officialSearchNote = String(options.officialSearchNote || "").trim();
  if (!keepProgress) {
    setQueryProgress(
      true,
      ignoreQueryFilters ? "\u6B63\u5728\u7528\u76EE\u524D\u6848\u4F8B\u91CD\u65B0\u4F30\u50F9\uFF0C\u8ACB\u7A0D\u5019..." : "\u5B98\u65B9\u8CC7\u6599\u67E5\u8A62\u4E2D\uFF0C\u8ACB\u7A0D\u5019..."
    );
    setQueryProgressStage(ignoreQueryFilters ? "\u6B63\u5728\u7528\u76EE\u524D\u6848\u4F8B\u91CD\u65B0\u4F30\u50F9" : "\u6B63\u5728\u6574\u7406\u6BD4\u8F03\u6848\u4F8B\u8207\u4F30\u50F9\u8A08\u7B97");
  } else {
    setQueryProgressStage("\u6B65\u9A5F 4/4\uFF1A\u6B63\u5728\u6574\u7406\u6BD4\u8F03\u6848\u4F8B\u8207\u4F30\u50F9\u8A08\u7B97");
  }
  const query = currentQuery();
  const keys = query.specialKeywords;
  const specialFilters = query.specialFilters || [];
  const specialMode = query.specialMode;
  let area = areaInfo();
  let rows = parseRecords(els.recordsInput.value);
  const displayRows = rows;
  if (isTownhouseQuery(query)) {
    applyTownhouseLandUnitPrice(rows);
  }
  updateAreaSummary(displayRows.length);
  area = areaInfo();
  const totalAreaMinDropped = displayRows.filter((row) => row.totalArea != null && row.totalArea < COMPARABLE_MIN_TOTAL_AREA_PING).length;
  rows = rows.filter((row) => row.totalArea == null || row.totalArea >= COMPARABLE_MIN_TOTAL_AREA_PING);
  updateAreaSummary(displayRows.length);
  if (!rows.length) {
    const rowsForDisplay2 = ignoreQueryFilters ? displayRows : rows;
    const removed2 = new Set(rowsForDisplay2);
    renderRows(rowsForDisplay2, /* @__PURE__ */ new Set(), removed2);
    els.avgUnitPrice.textContent = "--";
    els.trimmedRange.textContent = "--";
    els.houseValue.textContent = "--";
    clearAutoParkingUnitPrice("\u5C1A\u672A\u53D6\u5F97\u53EF\u7528\u6BD4\u8F03\u6848\u4F8B\uFF0C\u672A\u8A08\u7B97\u55AE\u4E00\u8ECA\u4F4D\u7E3D\u50F9");
    els.recordCountDisplayCard.textContent = `${rowsForDisplay2.length} \u7B46\u6848\u4F8B\uFF080 \u7B46\u7D0D\u5165\u5E73\u5747\uFF09`;
    els.calcExplain.textContent = totalAreaMinDropped > 0 ? `\u5B98\u65B9\uFF0F\u76EE\u524D\u6848\u4F8B\u5171 ${displayRows.length} \u7B46\uFF1B\u5DF2\u5254\u9664 ${totalAreaMinDropped} \u7B46\u7E3D\u9762\u7A4D\u5C0F\u65BC ${COMPARABLE_MIN_TOTAL_AREA_PING} \u576A\u7684\u6848\u4F8B\uFF0C\u5C1A\u672A\u53D6\u5F97\u4EFB\u4F55\u53EF\u7528\u7684\u6BD4\u8F03\u6848\u4F8B\u3002` : "\u5C1A\u672A\u53D6\u5F97\u4EFB\u4F55\u53EF\u7528\u7684\u6BD4\u8F03\u6848\u4F8B\u3002";
    setMessage2("error", totalAreaMinDropped > 0 ? "\u6BD4\u8F03\u6848\u4F8B\u7E3D\u9762\u7A4D\u7686\u5C0F\u65BC\u9580\u6ABB\uFF0C\u66AB\u7121\u6CD5\u4F30\u50F9\u3002" : "\u8ACB\u5148\u8CBC\u4E0A\u6BD4\u8F03\u6848\u4F8B\u8CC7\u6599\uFF0C\u518D\u9032\u884C\u4F30\u50F9\u3002");
    lastSearch = { rows: rowsForDisplay2, kept: [], removed: rowsForDisplay2.map((row) => row.address), avg: null, estimate: null };
    finishValuationSearch(query, keepProgress);
    return;
  }
  if (!ignoreQueryFilters) {
    const chosenType = query.quickTypes.length ? "" : query.houseType;
    rows = rows.filter((row) => rowMatchesKeywordGroup(row, query));
    rows = rows.filter((row) => rowMatchesDealTargets(row, query.dealTargets));
    rows = rows.filter((row) => rangeOk(row.tradePeriodValue, normalizePeriodValue(query.periodStart), normalizePeriodValue(query.periodEnd)));
    if (query.quickTypes.length) rows = rows.filter((row) => query.quickTypes.some((type) => matchesHouseTypeRule(row, type)));
    else if (chosenType) rows = rows.filter((row) => matchesHouseTypeRule(row, chosenType));
    if (query.mainPurposes.length) rows = rows.filter((row) => query.mainPurposes.some((purpose) => includesToken(row.purpose, purpose)));
    if (query.tradeTarget) rows = rows.filter((row) => includesToken(row.target, query.tradeTarget));
    if (query.layoutFilter) rows = rows.filter((row) => includesToken(row.layout, query.layoutFilter));
    if (query.floorFilter && !isTownhouseQuery(query)) {
      rows = rows.filter((row) => includesToken(row.floorInfo, query.floorFilter));
    }
    rows = rows.filter((row) => rangeOk(row.totalPrice, query.totalPriceMin, query.totalPriceMax) && rangeOk(row.unitPrice, query.unitPriceMin, query.unitPriceMax) && rangeOk(row.mainAreaForFilter, query.mainAreaMinFilter, query.mainAreaMaxFilter) && rangeOk(row.age, query.houseAgeMin, query.houseAgeMax));
  }
  if (specialFilters.length || keys.length) {
    rows = rows.filter((row) => {
      const hasSpecialRemark = rowMatchesAnySpecialRemark(row, specialFilters, keys);
      return specialMode === "exclude" ? !hasSpecialRemark : hasSpecialRemark;
    });
  }
  const subjectFloor = subjectPropertyUnitFloor();
  const includeFirstFloorComps = subjectFloor === 1;
  const excludeFirstFloorComps = !isTownhouseQuery(query) && !includeFirstFloorComps;
  let firstFloorDropped = 0;
  if (excludeFirstFloorComps) {
    rows = rows.filter((row) => {
      const drop = comparableRowIsFirstFloor2(row);
      if (drop) firstFloorDropped++;
      return !drop;
    });
  }
  const appraisalBaseDate = resolveAppraisalBaseDate(query);
  const completionDateText = String(lastOcrMapping["\u5EFA\u7BC9\u5B8C\u6210\u65E5\u671F"] || "").trim();
  const refAge = resolveSubjectAgeFromDeedCompletion2(completionDateText, appraisalBaseDate);
  const refFloors = toNumber2(els.totalFloors.value);
  const preferredTypes = preferredComparableTypes(query);
  const subjectComparableAddress = resolveSubjectComparableAddress(query);
  const comparableScoreContext = {
    refAge,
    refFloors,
    preferredTypes,
    subjectAddress: subjectComparableAddress,
    subjectTotalPing: area.total,
    appraisalBaseDate,
    targetFloor: subjectFloor,
    query
  };
  rows = sortComparablesForAverage2(rows, comparableScoreContext);
  const shortTermPriorSale = findShortTermPriorSale(rows, /* @__PURE__ */ new Date());
  updateAreaSummary(displayRows.length);
  area = areaInfo();
  if (!rows.length) {
    const rowsForDisplay2 = ignoreQueryFilters ? displayRows : rows;
    const removed2 = new Set(rowsForDisplay2);
    renderRows(rowsForDisplay2, /* @__PURE__ */ new Set(), removed2);
    els.avgUnitPrice.textContent = "--";
    els.trimmedRange.textContent = "--";
    els.houseValue.textContent = "--";
    clearAutoParkingUnitPrice("\u7BE9\u9078\u5F8C\u7121\u53EF\u7528\u6BD4\u8F03\u6848\u4F8B\uFF0C\u672A\u8A08\u7B97\u55AE\u4E00\u8ECA\u4F4D\u7E3D\u50F9");
    els.recordCountDisplayCard.textContent = `${rowsForDisplay2.length} \u7B46\u6848\u4F8B\uFF080 \u7B46\u7D0D\u5165\u5E73\u5747\uFF09`;
    const emptyDetail = excludeFirstFloorComps && firstFloorDropped > 0 ? "\u7BE9\u9078\u5F8C\u7121\u53EF\u7528\u6BD4\u8F03\u6848\u4F8B\uFF08\u6A19\u7684\u672A\u5224\u5B9A\u70BA\u4E00\u6A13\uFF0C\u5DF2\u6392\u9664\u4E00\u6A13\u6848\u4F8B\uFF1B\u82E5\u6A19\u7684\u662F\u4E00\u6A13\uFF0C\u8ACB\u78BA\u8A8D\u9580\u724C\u6A13\u6B21\u6216\u9032\u968E\u300C\u6A13\u5C64\u5225\u300D\u662F\u5426\u6B63\u78BA\uFF09\u3002" : "\u7BE9\u9078\u5F8C\u7121\u53EF\u7528\u6BD4\u8F03\u6848\u4F8B\u3002";
    els.calcExplain.textContent = totalAreaMinDropped > 0 ? `\u5B98\u65B9\uFF0F\u76EE\u524D\u6848\u4F8B\u5171 ${displayRows.length} \u7B46\uFF1B\u4F30\u50F9\u898F\u5247\u5F8C 0 \u7B46\u53EF\u7D0D\u5165\u5E73\u5747\u3002
${emptyDetail}
\u5DF2\u5254\u9664 ${totalAreaMinDropped} \u7B46\u7E3D\u9762\u7A4D\u5C0F\u65BC ${COMPARABLE_MIN_TOTAL_AREA_PING} \u576A\u7684\u6848\u4F8B\u3002` : `\u5B98\u65B9\uFF0F\u76EE\u524D\u6848\u4F8B\u5171 ${displayRows.length} \u7B46\uFF1B\u4F30\u50F9\u898F\u5247\u5F8C 0 \u7B46\u53EF\u7D0D\u5165\u5E73\u5747\u3002
${emptyDetail}`;
    setMessage2("warn", ignoreQueryFilters ? "\u76EE\u524D\u7121\u7B26\u5408\u689D\u4EF6\u7684\u6BD4\u8F03\u6848\u4F8B\u3002" : "\u7BE9\u9078\u5F8C\u7121\u7B26\u5408\u689D\u4EF6\u7684\u6BD4\u8F03\u6848\u4F8B\u3002");
    lastSearch = { rows: rowsForDisplay2, kept: [], removed: rowsForDisplay2.map((row) => row.address), avg: null, estimate: null };
    finishValuationSearch(query, keepProgress);
    return;
  }
  if (shortTermPriorSale) {
    const matchedRow = shortTermPriorSale.row;
    matchedRow.shortTermPriorSale = true;
    const rowsForDisplay2 = ignoreQueryFilters ? displayRows : rows;
    const kept2 = /* @__PURE__ */ new Set([matchedRow]);
    const removed2 = new Set(rowsForDisplay2.filter((row) => row !== matchedRow));
    renderRows(rowsForDisplay2, kept2, removed2);
    els.avgUnitPrice.textContent = formatNum2(matchedRow.unitPrice);
    els.avgUnitPriceSub.textContent = "\u842C\u5143 / \u576A\uFF08\u524D\u624B\uFF09";
    els.trimmedRange.textContent = formatNum2(matchedRow.unitPrice);
    els.trimmedRangeSub.textContent = "\u4E00\u5E74\u5167\u524D\u624B\u50F9";
    els.houseValue.textContent = formatNum2(matchedRow.totalPrice, 0);
    els.houseValueSub.textContent = "\u842C\u5143\uFF08\u524D\u624B\u7E3D\u50F9\uFF09";
    els.recordCountDisplayCard.textContent = `${rowsForDisplay2.length} \u7B46\u6848\u4F8B\uFF081 \u7B46\u524D\u624B\u50F9\u8A8D\u5217\uFF09`;
    const queryDate = startOfLocalDay(/* @__PURE__ */ new Date());
    const tradeDateLabel = matchedRow.tradeDate || matchedRow.tradeYearMonth || formatDateYmd(shortTermPriorSale.tradeDate);
    const officialCountNote = displayRows.length === rows.length ? `\u5B98\u65B9\uFF0F\u76EE\u524D\u6848\u4F8B\u5171 ${displayRows.length} \u7B46\u3002` : `\u5B98\u65B9\uFF0F\u76EE\u524D\u6848\u4F8B\u5171 ${displayRows.length} \u7B46\uFF1B\u4F30\u50F9\u898F\u5247\u5F8C ${rows.length} \u7B46\u3002`;
    els.calcExplain.textContent = [
      officialSearchNote,
      `${officialCountNote}\u4E00\u5E74\u5167\u77ED\u671F\u4EA4\u6613\u8A8D\u5217\u524D\u624B\u50F9\u3002`,
      `\u540C\u9580\u724C\u6848\u4F8B\uFF1A${matchedRow.address}\uFF0C\u4EA4\u6613\u65E5\u671F ${tradeDateLabel}\uFF0C\u67E5\u8A62\u65E5 ${formatDateYmd(queryDate)}\uFF0C\u4EA4\u6613\u65E5\u843D\u5728\u4E00\u5E74\u5167\u3002`,
      `\u4F9D\u898F\u5247\u4E0D\u518D\u8A08\u7B97\u524D\u4E09\u7B46\u5E73\u5747\u55AE\u50F9\uFF0C\u76F4\u63A5\u63A1\u8A72\u524D\u624B\u55AE\u50F9 ${formatNum2(matchedRow.unitPrice)} \u842C\u5143/\u576A\u3001\u7E3D\u50F9 ${formatNum2(matchedRow.totalPrice, 0)} \u842C\u5143\u4F5C\u70BA\u4F30\u50F9\u7D50\u679C\u3002`
    ].filter(Boolean).join("\n");
    const completionPrefix2 = officialSearchNote ? `${officialSearchNote}\u3002` : "";
    setMessage2("ok", `${completionPrefix2}\u4E00\u5E74\u5167\u77ED\u671F\u4EA4\u6613\u8A8D\u5217\u524D\u624B\u50F9\uFF1A\u63A1\u540C\u9580\u724C ${tradeDateLabel} \u55AE\u50F9 ${formatNum2(matchedRow.unitPrice)} \u842C\u5143/\u576A\u3001\u7E3D\u50F9 ${formatNum2(matchedRow.totalPrice, 0)} \u842C\u5143\u3002`);
    lastSearch = {
      rows: rowsForDisplay2,
      kept: [matchedRow.address],
      removed: rowsForDisplay2.filter((row) => row !== matchedRow).map((row) => row.address),
      avg: +matchedRow.unitPrice.toFixed(3),
      estimate: +matchedRow.totalPrice.toFixed(3),
      method: "\u4E00\u5E74\u5167\u77ED\u671F\u4EA4\u6613\u8A8D\u5217\u524D\u624B\u50F9"
    };
    finishValuationSearch(query, keepProgress);
    return;
  }
  const pricedRows = rows.filter((row) => Number.isFinite(row.unitPrice));
  const takeN = Math.min(COMPARABLE_AVG_TOP_N, pricedRows.length);
  const trimmed = pricedRows.slice(0, takeN);
  const kept = new Set(trimmed);
  const rowsForDisplay = ignoreQueryFilters ? displayRows : rows;
  const removed = new Set(rowsForDisplay.filter((row) => !trimmed.includes(row)));
  if (!trimmed.length) {
    renderRows(rowsForDisplay, kept, removed);
    els.avgUnitPrice.textContent = "--";
    els.trimmedRange.textContent = "--";
    els.houseValue.textContent = "--";
    clearAutoParkingUnitPrice("\u7D0D\u5165\u5E73\u5747\u6848\u4F8B\u6C92\u6709\u55AE\u50F9\uFF0C\u672A\u8A08\u7B97\u55AE\u4E00\u8ECA\u4F4D\u7E3D\u50F9");
    els.recordCountDisplayCard.textContent = `${rowsForDisplay.length} \u7B46\u6848\u4F8B\uFF080 \u7B46\u7D0D\u5165\u5E73\u5747\uFF09`;
    els.calcExplain.textContent = `\u5B98\u65B9\uFF0F\u76EE\u524D\u6848\u4F8B\u5171 ${displayRows.length} \u7B46\uFF1B\u4F30\u50F9\u898F\u5247\u5F8C ${rows.length} \u7B46\uFF0C\u4F46\u55AE\u50F9\u6B04\u4F4D\u7686\u70BA\u7A7A\u767D\uFF0C\u6545\u7121\u6CD5\u8A08\u7B97\u5E73\u5747\u8207\u4F30\u503C\u3002`;
    setMessage2("warn", "\u5DF2\u53D6\u5F97\u6848\u4F8B\uFF0C\u4F46\u55AE\u50F9\u7686\u7A7A\u767D\uFF0C\u66AB\u7121\u6CD5\u8A08\u7B97\u4F30\u503C\u3002");
    lastSearch = { rows: rowsForDisplay, kept: [], removed: rowsForDisplay.map((row) => row.address), avg: null, estimate: null };
    finishValuationSearch(query, keepProgress);
    return;
  }
  const prices = trimmed.map((row) => row.unitPrice);
  const avg = prices.reduce((sum, value) => sum + value, 0) / prices.length;
  const townhouseValuation = isTownhouseQuery(query);
  const parkingInfo = syncParkingCountFromArea(area.parking);
  const parkingPriceMultiplier = parkingValuationMultiplier2(parkingInfo);
  const shouldPriceParking = parkingPriceMultiplier > 0;
  const parkingUnitPriceEntries = shouldPriceParking ? trimmed.map((row) => ({
    row,
    totalPrice: toNumber2(row.parkingPrice),
    count: comparableParkingCount2(row),
    unitPrice: comparableParkingUnitPrice2(row)
  })).filter((entry) => entry.unitPrice != null && entry.unitPrice > 0) : [];
  const parkingUnitPrices = parkingUnitPriceEntries.map((entry) => entry.unitPrice);
  const manualParkingPrice = shouldPriceParking ? manualParkingUnitPriceValue() : null;
  const avgSingleParkingPrice = parkingUnitPrices.length ? parkingUnitPrices.reduce((sum, value) => sum + value, 0) / parkingUnitPrices.length : manualParkingPrice ?? 0;
  const avgParkingPrice = avgSingleParkingPrice * parkingPriceMultiplier;
  if (townhouseValuation) {
    clearAutoParkingUnitPrice("\u900F\u5929\u4F30\u503C\u4E0D\u53E6\u52A0\u8ECA\u4F4D\u7E3D\u50F9");
  } else if (!shouldPriceParking) {
    clearAutoParkingUnitPrice("\u6A19\u7684\u672A\u8FA8\u8B58\u8ECA\u4F4D\u576A\u6578\u6216\u8ECA\u4F4D\u6578\u91CF\uFF0C\u672A\u8A08\u7B97\u55AE\u4E00\u8ECA\u4F4D\u7E3D\u50F9");
  } else if (parkingUnitPrices.length) {
    const sourceText = parkingUnitPriceEntries.map((entry) => {
      const total = entry.totalPrice != null ? formatNum2(entry.totalPrice, 0) : "";
      return entry.count > 1 ? `${total}\xF7${entry.count}` : total;
    }).filter(Boolean).join("\u3001");
    setAutoParkingUnitPrice(
      avgSingleParkingPrice,
      `\u7D0D\u5165\u5E73\u5747\u6848\u4F8B\u55AE\u4E00\u8ECA\u4F4D\u7E3D\u50F9\uFF1A${sourceText}\uFF0C\u5E73\u5747 ${formatNum2(avgSingleParkingPrice, 3)} \u842C\u5143`
    );
  } else if (manualParkingPrice != null) {
    els.parkingUnitPrice.title = `\u4F7F\u7528\u76EE\u524D\u6B04\u4F4D\u7684\u6BCF\u500B\u55AE\u4F4D\u7E3D\u50F9 ${formatNum2(manualParkingPrice, 3)} \u842C\u5143`;
  } else {
    clearAutoParkingUnitPrice("\u7D0D\u5165\u5E73\u5747\u6848\u4F8B\u672A\u63D0\u4F9B\u8ECA\u4F4D\u7E3D\u50F9\uFF0C\u672A\u52A0\u8A08\u8ECA\u4F4D\u7E3D\u50F9");
  }
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const hasTownhouseLandShare = area.landShare > 0;
  if (townhouseValuation && !hasTownhouseLandShare) {
    renderRows(rowsForDisplay, kept, removed);
    els.avgUnitPrice.textContent = formatNum2(avg);
    els.avgUnitPriceSub.textContent = "\u842C\u5143 / \u576A";
    els.trimmedRange.textContent = `${formatNum2(min)} ~ ${formatNum2(max)}`;
    els.trimmedRangeSub.textContent = "\u842C\u5143 / \u576A";
    els.houseValue.textContent = "--";
    els.houseValueSub.textContent = "\u842C\u5143";
    els.recordCountDisplayCard.textContent = `${rowsForDisplay.length} \u7B46\u6848\u4F8B\uFF08${trimmed.length} \u7B46\u7D0D\u5165\u5E73\u5747\uFF09`;
    els.calcExplain.textContent = [
      officialSearchNote,
      `\u900F\u5929\u4F30\u503C\u9700\u4EE5\u300C\u6A19\u7684\u571F\u5730\u6301\u5206\u576A\u5408\u8A08 \xD7 \u5E73\u5747\u55AE\u50F9\u300D\u8A08\u7B97\uFF0C\u4F46\u76EE\u524D\u6A19\u7684\u571F\u5730\u6301\u5206\u576A\u5408\u8A08\u672A\u586B\u6216\u70BA 0\u3002`,
      `\u5E73\u5747\u55AE\u50F9 = ${prices.map((value) => formatNum2(value)).join(" + ")} \xF7 ${prices.length} = ${formatNum2(avg)} \u842C\u5143/\u576A\u3002`,
      "\u8ACB\u5148\u7531\u8B04\u672C\u89E3\u6790\u6216\u624B\u52D5\u586B\u5165\u6A19\u7684\u571F\u5730\u6301\u5206\u576A\u5408\u8A08\u5F8C\u518D\u4F30\u50F9\u3002"
    ].filter(Boolean).join("\n");
    setMessage2("warn", "\u900F\u5929\u4F30\u503C\u9700\u5148\u53D6\u5F97\u6A19\u7684\u571F\u5730\u6301\u5206\u576A\u5408\u8A08\u3002");
    lastSearch = { rows: rowsForDisplay, kept: trimmed.map((row) => row.address), removed: rowsForDisplay.filter((row) => !trimmed.includes(row)).map((row) => row.address), avg: +avg.toFixed(3), estimate: null, method: "\u900F\u5929\u571F\u5730\u6301\u5206\u4F30\u503C\u7F3A\u5C11\u571F\u5730\u6301\u5206\u576A" };
    finishValuationSearch(query, keepProgress);
    return;
  }
  const valuationBasePing = townhouseValuation ? area.landShare : area.house;
  const estimate = estimateHouseValueWithParking2({
    valuationBasePing,
    averageUnitPrice: avg,
    parkingUnitPrice: avgSingleParkingPrice,
    parkingMultiplier: parkingPriceMultiplier,
    isTownhouse: townhouseValuation
  });
  els.avgUnitPrice.textContent = formatNum2(avg);
  els.avgUnitPriceSub.textContent = "\u842C\u5143 / \u576A";
  els.trimmedRange.textContent = `${formatNum2(min)} ~ ${formatNum2(max)}`;
  els.trimmedRangeSub.textContent = "\u842C\u5143 / \u576A";
  els.houseValue.textContent = formatNum2(estimate, 0);
  els.houseValueSub.textContent = townhouseValuation ? "\u842C\u5143\uFF08\u571F\u5730\u6301\u5206\uFF09" : "\u842C\u5143";
  els.recordCountDisplayCard.textContent = `${rowsForDisplay.length} \u7B46\u6848\u4F8B\uFF08${trimmed.length} \u7B46\u7D0D\u5165\u5E73\u5747\uFF09`;
  renderRows(rowsForDisplay, kept, removed);
  const preferredTypeText = preferredTypes.length ? preferredTypes.join("\u3001") : "";
  const sortRule = `\u6392\u5E8F\u898F\u5247\uFF1A\u6BCF\u7B46\u6848\u4F8B\u5148\u8A08\u7B97 Comparable Score\uFF08\u5730\u574025\u3014\u540C\u8DEF\u540C\u5DF7\u540C\u5F0425\u3001\u540C\u8DEF\u540C\u5DF722\u3001\u540C\u8DEF18\uFF1B\u540C\u884C\u653F\u5340\u4E0D\u8A08\u5206\u3015\u3001\u5C4B\u9F6117\u3001\u7E3D\u6A13\u5C6415\u3001\u7E3D\u9762\u7A4D15\u3014\u6A19\u7684\u7E3D\u576A\u6578\u8207\u6848\u4F8B\u7E3D\u9762\u7A4D\u5DEE\u8DDD\u6BD4\u4F8B\u3015\u3001\u4EA4\u6613\u65E5\u671F10\u3001\u6A13\u52258\u3014\u900F\u5929\u6848\u4EF6\u7565\u904E\u3015\u3001\u4E3B\u8981\u7528\u90145\u3014\u4E0D\u53D6\u4EE3\u7528\u9014\u7BE9\u9078\u3015\u3001\u55AE\u50F95\uFF1B\u5EFA\u7269\u578B\u614B\u4E0D\u7D0D\u5165\u6392\u5E8F\u5206\u6578${preferredTypeText ? `\uFF0C\u76EE\u524D\u5EFA\u7269\u578B\u614B\u4ECD\u53EA\u4F5C\u524D\u6BB5\u7BE9\u9078\uFF1A${preferredTypeText}` : ""}\uFF09\uFF0C\u518D\u4F9D\u5206\u6578\u7531\u9AD8\u5230\u4F4E\u6392\u5E8F\uFF1B\u540C\u5206\u6642\u4F9D\u5730\u5740\u5206\u3001\u5C4B\u9F61\u5206\u3001\u7E3D\u6A13\u5C64\u5206\u3001\u7E3D\u9762\u7A4D\u5206\u3001\u4EA4\u6613\u65E5\u671F\u5206\u3001\u6A13\u5225\u5206\u3001\u4E3B\u8981\u7528\u9014\u5206\u3001\u55AE\u50F9\u5206\u8207\u539F\u59CB\u9806\u5E8F\u6C7A\u5B9A\u3002\u53EA\u6709\u6A19\u7684\u6240\u5728\u6A13\u5C64\u660E\u78BA\u70BA\u4E00\u6A13\u6642\uFF0C\u624D\u5C07\u4E00\u6A13\u6848\u4F8B\u5217\u5165\u6392\u5E8F\uFF1B\u6A19\u7684\u975E\u4E00\u6A13\u6216\u7121\u6CD5\u5224\u5B9A\u70BA\u4E00\u6A13\u6642\uFF0C\u6392\u5E8F\u524D\u5148\u6392\u9664\u4E00\u6A13\u6BD4\u8F03\u6848\u4F8B\u3002`;
  const addressRuleNote = formatAddressProximitySortNote2(subjectComparableAddress);
  const ageRuleNote = refAge == null ? "\uFF08\u672A\u53D6\u5F97\u8B04\u672C\u5EFA\u7BC9\u5B8C\u6210\u65E5\u671F\uFF0C\u5C4B\u9F61\u63A5\u8FD1\u5EA6\u6392\u5E8F\u7565\u904E\u3002\uFF09" : `\uFF08\u5EFA\u7BC9\u5B8C\u6210\u65E5\u671F ${completionDateText}\uFF0C\u4F30\u50F9\u57FA\u6E96\u65E5 ${formatDateYmd(appraisalBaseDate)}\uFF0C\u63DB\u7B97\u6A19\u7684\u5C4B\u9F61\u7D04 ${formatNum2(refAge, 3)} \u5E74\u3002\uFF09`;
  const subjectFloorText = Number.isFinite(subjectFloor) ? `\u6A19\u7684\u63A8\u65B7\u70BA\u7B2C ${subjectFloor} \u6A13` : "\u6A19\u7684\u672A\u5224\u5B9A\u70BA\u4E00\u6A13";
  const floorRuleNote = excludeFirstFloorComps ? firstFloorDropped > 0 ? `\uFF08${subjectFloorText}\uFF0C\u5DF2\u6392\u9664 ${firstFloorDropped} \u7B46\u4E00\u6A13\u3002\uFF09` : `\uFF08${subjectFloorText}\uFF0C\u6BD4\u8F03\u6848\u4F8B\u4E2D\u7121\u4E00\u6A13\u53EF\u6392\u9664\u3002\uFF09` : "\uFF08\u6A19\u7684\u63A8\u65B7\u70BA\u4E00\u6A13\uFF0C\u4E00\u6A13\u6848\u4F8B\u5217\u5165\u6392\u5E8F\u3002\uFF09";
  const totalAreaMinRuleNote = totalAreaMinDropped > 0 ? `\uFF08\u5DF2\u5254\u9664 ${totalAreaMinDropped} \u7B46\u7E3D\u9762\u7A4D\u5C0F\u65BC ${COMPARABLE_MIN_TOTAL_AREA_PING} \u576A\u7684\u6848\u4F8B\u3002\uFF09` : `\uFF08\u7121\u7E3D\u9762\u7A4D\u5C0F\u65BC ${COMPARABLE_MIN_TOTAL_AREA_PING} \u576A\u7684\u6848\u4F8B\u9700\u5254\u9664\u3002\uFF09`;
  const displayCountNote = displayRows.length === rows.length ? `\u5B98\u65B9\uFF0F\u76EE\u524D\u6848\u4F8B\u5171 ${displayRows.length} \u7B46\u3002` : `\u5B98\u65B9\uFF0F\u76EE\u524D\u6848\u4F8B\u5171 ${displayRows.length} \u7B46\uFF1B\u4F30\u50F9\u898F\u5247\u5F8C ${rows.length} \u7B46\u53EF\u9032\u5165\u6392\u5E8F\u3002\u7D50\u679C\u8868\u4ECD\u5B8C\u6574\u986F\u793A\u5B98\u65B9\u6E05\u55AE\uFF0C\u672A\u7D0D\u5165\u5E73\u5747\u8005\u6703\u6A19\u793A\u300C\u672A\u7D0D\u5165\u5E73\u5747\u300D\u3002`;
  const valuationFormulaText = townhouseValuation ? `\u900F\u5929\u4F30\u503C\u516C\u5F0F = \u6A19\u7684\u571F\u5730\u6301\u5206\u576A\u5408\u8A08 ${formatNum2(area.landShare, 3)} \xD7 \u5E73\u5747\u55AE\u50F9 ${formatNum2(avg)} = ${formatNum2(estimate, 0)} \u842C\u5143\u3002` : `\u4F30\u503C\u516C\u5F0F = \u623F\u5C4B\u576A\u6578 ${formatNum2(area.house, 3)} \xD7 \u5E73\u5747\u55AE\u50F9 ${formatNum2(avg)} + \u5E73\u5747\u8ECA\u4F4D\u7E3D\u50F9 ${formatNum2(avgParkingPrice, 0)} = ${formatNum2(estimate, 0)} \u842C\u5143\u3002\u7E3D\u576A\u6578 = \u623F\u5C4B\u576A\u6578 ${formatNum2(area.house, 3)} + \u8ECA\u4F4D\u576A\u6578 ${formatNum2(area.parking, 3)} = ${formatNum2(area.total, 3)} \u576A\u3002`;
  els.calcExplain.textContent = [
    officialSearchNote,
    ignoreQueryFilters ? `${displayCountNote}${sortRule}` : `\u7BE9\u9078\u5F8C\u5171 ${rows.length} \u7B46\u3002${sortRule}`,
    addressRuleNote,
    totalAreaMinRuleNote,
    ageRuleNote,
    floorRuleNote,
    `\u4F9D\u6392\u5E8F\u7D50\u679C\u53D6\u524D ${takeN} \u7B46\u8A08\u7B97\u5E73\u5747\u55AE\u50F9\uFF08\u81F3\u591A ${COMPARABLE_AVG_TOP_N} \u7B46\uFF1B\u4E0D\u8DB3\u5247\u4EE5\u5BE6\u969B\u7B46\u6578\u8A08\u7B97\uFF09\u3002`,
    `\u5E73\u5747\u55AE\u50F9 = ${prices.map((value) => formatNum2(value)).join(" + ")} \xF7 ${prices.length} = ${formatNum2(avg)} \u842C\u5143/\u576A\u3002`,
    townhouseValuation ? "\u900F\u5929\u6848\u4EF6\u4E0D\u53E6\u52A0\u5E73\u5747\u8ECA\u4F4D\u7E3D\u50F9\uFF1B\u623F\u5C4B\u50F9\u503C\u76F4\u63A5\u63A1\u6A19\u7684\u571F\u5730\u6301\u5206\u576A\u5408\u8A08\u4E58\u4EE5\u5E73\u5747\u55AE\u50F9\u3002" : parkingUnitPrices.length ? `\u5E73\u5747\u55AE\u4E00\u8ECA\u4F4D\u7E3D\u50F9 = ${parkingUnitPriceEntries.map((entry) => {
      const total = entry.totalPrice != null ? formatNum2(entry.totalPrice, 0) : "";
      return entry.count > 1 ? `${total}\xF7${entry.count}` : total;
    }).filter(Boolean).join(" + ")} \xF7 ${parkingUnitPrices.length} = ${formatNum2(avgSingleParkingPrice, 0)} \u842C\u5143\u3002` : manualParkingPrice != null ? `\u5E73\u5747\u55AE\u4E00\u8ECA\u4F4D\u7E3D\u50F9 = ${formatNum2(manualParkingPrice, 0)} \u842C\u5143\uFF08\u63A1\u6BCF\u500B\u55AE\u4F4D\u7E3D\u50F9\u6B04\u4F4D\uFF09\u3002` : "\u5E73\u5747\u55AE\u4E00\u8ECA\u4F4D\u7E3D\u50F9 = 0 \u842C\u5143\uFF08\u7D0D\u5165\u5E73\u5747\u6848\u4F8B\u672A\u63D0\u4F9B\u8ECA\u4F4D\u7E3D\u50F9\uFF09\u3002",
    townhouseValuation ? "" : parkingInfo.source === "ocr" ? `\u8ECA\u4F4D\u576A\u6578 ${formatNum2(area.parking, 3)} \u576A\uFF0C\u8ECA\u4F4D\u6578\u91CF\u63A1 OCR \u505C\u8ECA\u4F4D\u7DE8\u865F\uFF0F\u6B0A\u5229\u7BC4\u570D ${parkingInfo.count} \u500B\uFF1B\u4F30\u503C\u52A0\u8A08\u500D\u6578 ${formatNum2(parkingPriceMultiplier, 3)}\u3002\u5E73\u5747\u8ECA\u4F4D\u7E3D\u50F9 = ${formatNum2(avgSingleParkingPrice, 0)} \xD7 ${formatNum2(parkingPriceMultiplier, 3)} = ${formatNum2(avgParkingPrice, 0)} \u842C\u5143\u3002` : `\u8ECA\u4F4D\u576A\u6578 ${formatNum2(area.parking, 3)} \u576A\uFF0C\u81EA\u52D5\u8A08\u7B97\u8ECA\u4F4D\u6578\u91CF ${parkingInfo.count} \u500B\uFF1B\u4F30\u503C\u52A0\u8A08\u500D\u6578 ${formatNum2(parkingPriceMultiplier, 3)}\uFF08\u6709\u55AE\u4F4D\u6578\u91CF\u6642\u76F4\u63A5\u4EE5\u55AE\u4F4D\u6578\u91CF\u52A0\u8A08\uFF09\u3002\u5E73\u5747\u8ECA\u4F4D\u7E3D\u50F9 = ${formatNum2(avgSingleParkingPrice, 0)} \xD7 ${formatNum2(parkingPriceMultiplier, 3)} = ${formatNum2(avgParkingPrice, 0)} \u842C\u5143\u3002`,
    valuationFormulaText
  ].filter(Boolean).join("\n");
  const completionLabel = officialSearchNote ? "\u5B8C\u6210\u5B98\u65B9\u8CC7\u6599\u4F30\u50F9" : ignoreQueryFilters ? "\u5DF2\u7528\u76EE\u524D\u6848\u4F8B\u91CD\u65B0\u4F30\u50F9" : "\u5B8C\u6210\u4F30\u50F9";
  const completionPrefix = officialSearchNote ? `${officialSearchNote}\u3002` : "";
  const completionFormula = townhouseValuation ? `\u6A19\u7684\u571F\u5730\u6301\u5206\u576A\u5408\u8A08 ${formatNum2(area.landShare, 3)} \xD7 \u5E73\u5747\u55AE\u50F9 ${formatNum2(avg)}` : `\u524D ${takeN} \u7B46\u5E73\u5747\u55AE\u50F9 ${formatNum2(avg)} \u842C\u5143/\u576A`;
  setMessage2("ok", `${completionPrefix}${completionLabel}\uFF1A${completionFormula}\uFF0C\u4F30\u7B97\u623F\u5C4B\u50F9\u503C ${formatNum2(estimate, 0)} \u842C\u5143\u3002`);
  lastSearch = {
    rows: rowsForDisplay,
    kept: trimmed.map((row) => row.address),
    removed: rowsForDisplay.filter((row) => !trimmed.includes(row)).map((row) => row.address),
    avg: +avg.toFixed(3),
    estimate: +estimate.toFixed(3),
    method: townhouseValuation ? "\u900F\u5929\u571F\u5730\u6301\u5206\u4F30\u503C" : "\u4E00\u822C\u623F\u5C4B\u576A\u6578\u4F30\u503C"
  };
  finishValuationSearch(query, keepProgress);
}
function resetAll() {
  cancelPendingAutoOfficialSearch();
  if (underwritingZoneAutoTimer) {
    clearTimeout(underwritingZoneAutoTimer);
    underwritingZoneAutoTimer = null;
  }
  clearSubjectUnderwritingGeocode();
  ["queryTitle", "cityName", "districtName", "communityName", "periodStartYear", "periodStartMonth", "periodEndYear", "periodEndMonth", "subjectAddress", "roadKeyword", "totalFloors", "tradeTarget", "floorFilter", "layoutFilter", "totalPriceMin", "totalPriceMax", "unitPriceMin", "unitPriceMax", "mainAreaMinFilter", "mainAreaMaxFilter", "houseAgeMin", "houseAgeMax", "mainArea", "attachArea", "commonArea", "otherArea", "landShareRaw", "landShareArea", "totalAreaOverride", "totalWithParkingArea", "parkingArea", "parkingCount", "parkingUnitPrice"].forEach((id) => {
    if (els[id]) els[id].value = "";
  });
  clearOcrParkingCount();
  clearRecognizedAddressFields();
  populateDistrictOptions("");
  setCheckboxValues2(els.mainPurposePick, []);
  setCheckboxValues2(els.usageZonePick, []);
  els.houseType.value = "";
  els.priceUnit.value = "\u842C\u5143/\u576A";
  els.areaUnit.value = "\u576A";
  els.isTownhouse.checked = false;
  els.typeQuickPick.forEach((checkbox) => {
    checkbox.checked = false;
  });
  els.dealTargetPick.forEach((checkbox) => {
    checkbox.checked = checkbox.value === "\u623F\u5730" || checkbox.value === "\u623F\u5730(\u8ECA)";
  });
  document.querySelector('input[name="specialMode"][value="exclude"]').checked = true;
  resetSpecialRemarkPicker();
  els.sourceFile.value = "";
  els.recordsInput.value = defaultRecords2;
  resetSourcePreview();
  els.ocrLog.textContent = "\u4E0A\u50B3\u5716\u7247\u6216 PDF \u5F8C\uFF0C\u53EF\u81EA\u52D5\u5617\u8A66\u6293\u53D6\u4E3B\u5EFA\u7269\u3001\u9644\u5C6C\u5EFA\u7269\u3001\u5171\u6709\u90E8\u5206\u3001\u5730\u5740\u3001\u4E3B\u8981\u7528\u9014\u8207\u6A13\u5C64\u3002";
  setOcrProgress2(0, "OCR \u5C1A\u672A\u958B\u59CB");
  refreshPaddleOcrStatusMessage();
  setRadioValue2(els.priceUnitChoice, "\u842C\u5143/\u576A");
  setRadioValue2(els.areaUnitChoice, "\u576A");
  syncUnitControls();
  applyHouseAgePreset("any");
  els.avgUnitPrice.textContent = "--";
  els.avgUnitPriceSub.textContent = "\u842C\u5143 / \u576A";
  els.trimmedRange.textContent = "--";
  els.trimmedRangeSub.textContent = "\u842C\u5143 / \u576A";
  els.houseValue.textContent = "--";
  els.houseValueSub.textContent = "\u842C\u5143";
  underwritingZoneLookupSeq += 1;
  setUnderwritingZoneCard();
  els.resultBody.innerHTML = '<tr><td colspan="18" style="color:#667085;">\u5C1A\u672A\u67E5\u8A62</td></tr>';
  resetResultTableSortState();
  els.calcExplain.textContent = "\u7CFB\u7D71\u6703\u5728\u9019\u88E1\u986F\u793A\u7BE9\u9078\u7B46\u6578\u3001\u7D0D\u5165\u5E73\u5747\u4E4B\u55AE\u50F9\u8207\u4F30\u503C\u516C\u5F0F\u3002";
  lastSearch = { rows: [], kept: [], removed: [], avg: null, estimate: null };
  lastOcrMapping = {};
  clearOcrFieldDiagnostics();
  if (els.deedFieldsPanel) {
    els.deedFieldsPanel.dataset.manual = "closed";
  }
  syncDeedFieldsVisibility(false);
  updateAreaSummary(parseRecords(els.recordsInput.value).length);
  applyRollingPeriodToUi(1);
  setMessage2("", "");
  setQueryProgress(false);
}
els.totalFloors.addEventListener("input", () => {
  if (!els.isTownhouse.checked) syncType();
  updateStructuredData();
});
els.houseType.addEventListener("change", () => {
  applyType(els.houseType.value);
  updateStructuredData();
});
els.isTownhouse.addEventListener("change", () => {
  syncType();
  updateStructuredData();
});
els.typeQuickPick.forEach((checkbox) => {
  checkbox.addEventListener("change", () => {
    applyType(checkbox.checked ? checkbox.value : "");
    updateStructuredData();
  });
});
[
  els.queryTitle,
  els.cityName,
  els.districtName,
  els.communityName,
  els.periodStartYear,
  els.periodStartMonth,
  els.periodEndYear,
  els.periodEndMonth,
  els.priceUnit,
  els.areaUnit,
  els.subjectAddress,
  els.roadKeyword,
  els.tradeTarget,
  els.floorFilter,
  els.layoutFilter,
  els.totalPriceMin,
  els.totalPriceMax,
  els.unitPriceMin,
  els.unitPriceMax,
  els.mainAreaMinFilter,
  els.mainAreaMaxFilter,
  els.houseAgeMin,
  els.houseAgeMax,
  els.mainArea,
  els.attachArea,
  els.commonArea,
  els.otherArea,
  els.landShareRaw,
  els.landShareArea,
  els.totalAreaOverride,
  els.parkingArea,
  els.parkingCount,
  els.parkingUnitPrice
].forEach((input) => {
  input.addEventListener("input", () => updateAreaSummary());
  input.addEventListener("change", () => updateAreaSummary());
});
[
  els.mainArea,
  els.attachArea,
  els.commonArea,
  els.otherArea,
  els.landShareRaw,
  els.landShareArea,
  els.totalAreaOverride,
  els.parkingArea,
  els.parkingCount,
  els.parkingUnitPrice
].forEach((input) => {
  input?.addEventListener("input", () => syncDeedFieldsVisibility());
  input?.addEventListener("change", () => syncDeedFieldsVisibility());
});
document.querySelectorAll('input[name="specialMode"]').forEach((radio) => radio.addEventListener("change", updateStructuredData));
specialRemarkEls.toggle?.addEventListener("click", () => {
  setSpecialRemarkPanelOpen(specialRemarkEls.panel?.classList.contains("is-hidden"));
});
specialRemarkEls.all?.addEventListener("change", () => {
  specialRemarkEls.options.forEach((input) => {
    input.checked = specialRemarkEls.all.checked;
  });
  syncSpecialRemarkPickerState();
  updateStructuredData();
});
specialRemarkEls.options.forEach((input) => {
  input.addEventListener("change", () => {
    syncSpecialRemarkPickerState();
    updateStructuredData();
  });
});
mainPurposeEls.toggle?.addEventListener("click", () => {
  setMainPurposePanelOpen(mainPurposeEls.panel?.classList.contains("is-hidden"));
});
mainPurposeEls.all?.addEventListener("change", () => {
  mainPurposeEls.options.forEach((input) => {
    input.checked = mainPurposeEls.all.checked;
  });
  syncMainPurposePickerState();
  updateStructuredData();
});
document.addEventListener("click", (event) => {
  const target = event.target;
  if (specialRemarkEls.panel && !specialRemarkEls.panel.classList.contains("is-hidden")) {
    if (!specialRemarkEls.panel.contains(target) && !specialRemarkEls.toggle?.contains(target)) {
      setSpecialRemarkPanelOpen(false);
    }
  }
  if (mainPurposeEls.panel && !mainPurposeEls.panel.classList.contains("is-hidden")) {
    if (!mainPurposeEls.panel.contains(target) && !mainPurposeEls.toggle?.contains(target)) {
      setMainPurposePanelOpen(false);
    }
  }
});
els.dealTargetPick.forEach((checkbox) => checkbox.addEventListener("change", updateStructuredData));
els.mainPurposePick.forEach((checkbox) => {
  checkbox.addEventListener("change", () => {
    syncMainPurposePickerState();
    updateStructuredData();
  });
});
els.usageZonePick.forEach((checkbox) => checkbox.addEventListener("change", updateStructuredData));
els.priceUnitChoice.forEach((radio) => radio.addEventListener("change", () => {
  syncUnitControls();
  updateStructuredData();
}));
els.areaUnitChoice.forEach((radio) => radio.addEventListener("change", () => {
  syncUnitControls();
  updateStructuredData();
}));
els.houseAgePreset?.addEventListener("change", () => {
  applyHouseAgePreset(els.houseAgePreset.value);
  updateStructuredData();
});
els.houseAgeMin?.addEventListener("input", () => {
  syncHouseAgePresetFromFields();
  updateStructuredData();
});
els.houseAgeMax?.addEventListener("input", () => {
  syncHouseAgePresetFromFields();
  updateStructuredData();
});
els.cityName.addEventListener("change", async () => {
  await loadOfficialTowns(els.cityName.value);
  updateStructuredData();
});
els.districtName.addEventListener("change", updateStructuredData);
els.sourceFile.addEventListener("change", async () => {
  cancelPendingAutoOcr();
  cancelPendingAutoOfficialSearch();
  lastLandValueTaxAutoParseSignature = "";
  const files = selectedSourceFiles();
  const file = primaryOcrSourceFile(files);
  const landTaxFiles = landTaxSourceFiles(files);
  void previewSourceFiles(files);
  clearDeedDerivedFields();
  clearOcrFieldDiagnostics();
  if (!file) {
    els.ocrBtn.disabled = false;
    els.ocrBtn.textContent = "\u958B\u59CB OCR / PDF \u89E3\u6790";
    els.ocrLog.textContent = "\u4E0A\u50B3\u5716\u7247\u6216 PDF \u5F8C\uFF0C\u53EF\u81EA\u52D5\u5617\u8A66\u6293\u53D6\u4E3B\u5EFA\u7269\u3001\u9644\u5C6C\u5EFA\u7269\u3001\u5171\u6709\u90E8\u5206\u3001\u5730\u5740\u3001\u4E3B\u8981\u7528\u9014\u8207\u6A13\u5C64\u3002";
    refreshPaddleOcrStatusMessage();
    if (els.deedFieldsPanel) els.deedFieldsPanel.dataset.manual = "closed";
    syncDeedFieldsVisibility(false);
    return;
  }
  els.ocrBtn.disabled = false;
  els.ocrBtn.textContent = isPdfFile(file) ? "\u958B\u59CB PDF \u89E3\u6790" : "\u958B\u59CB\u5716\u7247 OCR";
  const presetApplied = applyKnownFilePreset(file.name, false);
  const uploadSummary = files.length > 1 ? `\u672C\u6B21\u5171\u9078\u64C7 ${files.length} \u500B\u6A94\u6848\uFF1B\u5BE6\u50F9\u67E5\u8A62\u4E3B\u6A94\uFF1A${file.name}\u3002` : "";
  const landTaxSummary = landTaxFiles.length ? `\u5075\u6E2C\u5230\u571F\u5730\u8B04\u672C\uFF1A${sourceFileNames(landTaxFiles).join("\u3001")}\uFF1B\u5BE6\u50F9\u67E5\u8A62\u5B8C\u6210\u5F8C\u6703\u540C\u6B65\u5E36\u5165\u571F\u5730\u589E\u503C\u7A05\u8A66\u7B97\u3002` : "";
  els.ocrLog.textContent = [
    uploadSummary,
    isPdfFile(file) ? `PDF \u5DF2\u8F09\u5165\uFF1A${file.name}\uFF0C\u6B63\u5728\u81EA\u52D5\u89E3\u6790\u4E26\u5E36\u5165\u576A\u6578\u6B04\u4F4D\u3002` : `\u5716\u7247\u5DF2\u8F09\u5165\uFF1A${file.name}\uFF0C\u6B63\u5728\u81EA\u52D5 OCR \u4E26\u5E36\u5165\u576A\u6578\u6B04\u4F4D\u3002`,
    landTaxSummary
  ].filter(Boolean).join("\n");
  setOcrProgress2(0, "OCR \u5C1A\u672A\u958B\u59CB");
  syncDeedFieldsVisibility();
  updateStructuredData();
  if (!isPdfFile(file) && presetApplied) {
    const preset = getKnownFilePreset(file.name);
    renderOcrFieldDiagnostics(
      buildKnownPresetOcrFieldResults(file.name, preset),
      { ocrTiming: { elapsedMs: 0, source: "knownFilePreset", note: "\u6A94\u540D\u4FDD\u5E95\u6B04\u4F4D" } }
    );
    const fallbackAddress = preset?.queryAddress || preset?.address || els.subjectAddress.value.trim();
    const ready = await syncManualQueryFromParsedDeed(null, "", fallbackAddress);
    els.ocrLog.textContent = [
      preset?.log || `\u5DF2\u4F9D\u6A94\u540D\u5957\u7528 ${file.name} \u7684\u4FDD\u5E95\u6B04\u4F4D\u3002`,
      ready ? `\u5DF2\u5148\u5E36\u5165\u624B\u52D5\u67E5\u8A62\uFF1A${selectedLabel(els.cityName)} ${selectedLabel(els.districtName)} ${els.roadKeyword.value.trim()}\u3002` : "",
      "\u6B63\u5728\u81EA\u52D5\u57F7\u884C\u5716\u7247 OCR \u91CD\u65B0\u78BA\u8A8D\u3002"
    ].filter(Boolean).join("\n");
  }
  scheduleAutoOcrForSelectedFile(file);
});
els.ocrBtn.addEventListener("click", runOcrWithUi);
els.toggleSourcePreviewBtn?.addEventListener("click", () => {
  setSourcePreviewOpen(els.sourcePreview?.classList.contains("is-hidden"));
});
els.toggleOcrDiagnosticsBtn?.addEventListener("click", () => {
  if (!els.ocrFieldDiagnostics) return;
  const opening = els.ocrFieldDiagnostics.classList.contains("is-hidden");
  els.ocrFieldDiagnostics.dataset.manual = opening ? "open" : "closed";
  setOcrDiagnosticsOpen(opening);
});
els.searchBtn.addEventListener("click", runDeedSearchWithUi);
els.manualSearchBtn.addEventListener("click", runOfficialSearchWithUi);
els.recalcBtn?.addEventListener("click", runRecalcWithUi);
els.sampleBtn?.addEventListener("click", () => {
  els.recordsInput.value = defaultRecords2;
  updateAreaSummary(parseRecords(els.recordsInput.value).length);
  setMessage2("ok", "\u5DF2\u5957\u7528\u6BD4\u8F03\u6848\u4F8B\u7BC4\u4F8B\u3002");
});
els.resetBtn.addEventListener("click", resetAll);
els.copyPropertyAddressBtn?.addEventListener("click", async () => {
  await copyFieldValue(els.recognizedPropertyAddress, "\u5DF2\u8907\u88FD\u5EFA\u7269\u9580\u724C\u3002", "\u76EE\u524D\u6C92\u6709\u53EF\u8907\u88FD\u7684\u5EFA\u7269\u9580\u724C\u3002");
});
els.toggleManualAdvancedBtn.addEventListener("click", () => {
  const hidden = els.manualAdvanced.classList.toggle("is-hidden");
  els.toggleManualAdvancedBtn.textContent = hidden ? "\u5C55\u958B\u9032\u968E\u689D\u4EF6" : "\u6536\u5408\u9032\u968E\u689D\u4EF6";
});
document.querySelectorAll(".tab-btn").forEach((button) => {
  button.addEventListener("click", () => {
    activateTab(button.dataset.tabTarget);
  });
});
document.querySelectorAll("[data-result-sort]").forEach((button) => {
  button.addEventListener("click", () => sortResultTableBy(button.dataset.resultSort));
});
els.toggleDeedFieldsBtn?.addEventListener("click", () => {
  if (!els.deedFieldsPanel) return;
  const opening = els.deedFieldsPanel.classList.contains("is-hidden");
  els.deedFieldsPanel.dataset.manual = opening ? "open" : "closed";
  syncDeedFieldsVisibility(opening);
});
els.toggleRecordsPanelBtn?.addEventListener("click", () => {
  const collapsed = !els.recordsPanel?.classList.contains("records-panel-collapsed");
  setRecordsPanelCollapsed(collapsed);
});
els.recordsInput?.addEventListener("focus", () => setRecordsPanelCollapsed(false));
populateCityOptions();
populateDistrictOptions("");
populatePeriodOptions();
applyRollingPeriodToUi(1);
syncUnitControls();
syncHouseAgePresetFromFields();
syncSpecialRemarkPickerState();
syncMainPurposePickerState();
els.recordsInput.value = defaultRecords2;
updateAreaSummary(parseRecords(els.recordsInput.value).length);
setRecordsPanelCollapsed(false);
syncDeedFieldsVisibility();
updateResultSortButtons();
setOcrProgress2(0, "OCR \u5C1A\u672A\u958B\u59CB");
loadOfficialCities();
refreshPaddleOcrStatusMessage();
var params = new URLSearchParams(window.location.search);
if (params.get("autorun") === "1") setTimeout(runOfficialSearchWithUi, 50);

// mortgageCalculator.js
var DEFAULT_MORTGAGE_CALCULATOR = {
  totalPriceWan: 1500,
  downPaymentPct: 20,
  annualRatePct: 2.5,
  loanYears: 30,
  graceYears: 0
};
function toFiniteNumber(value, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : fallback;
}
function normalizePercent(value) {
  const numeric = Math.max(0, toFiniteNumber(value, 0));
  return numeric > 1 ? numeric / 100 : numeric;
}
function calculateMonthlyPaymentYuan(principalYuan, monthlyRate, months) {
  if (!principalYuan || !months) return 0;
  if (!monthlyRate) return principalYuan / months;
  return principalYuan * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months));
}
function calculateMortgage(input = {}) {
  const values = { ...DEFAULT_MORTGAGE_CALCULATOR, ...input };
  const totalPriceWan = Math.max(0, toFiniteNumber(values.totalPriceWan, 0));
  const downPaymentPct = Math.min(100, normalizePercent(values.downPaymentPct) * 100);
  const annualRatePct = normalizePercent(values.annualRatePct) * 100;
  const loanYears = Math.max(0, Math.floor(toFiniteNumber(values.loanYears, 0)));
  const graceYears = Math.max(0, Math.floor(toFiniteNumber(values.graceYears, 0)));
  const downPaymentWan = totalPriceWan * (downPaymentPct / 100);
  const loanAmountWan = Math.max(0, totalPriceWan - downPaymentWan);
  const principalYuan = loanAmountWan * 1e4;
  const totalMonths = loanYears * 12;
  const requestedGraceMonths = graceYears * 12;
  const effectiveGraceMonths = Math.min(requestedGraceMonths, Math.max(0, totalMonths - 1));
  const amortizedMonths = Math.max(0, totalMonths - effectiveGraceMonths);
  const monthlyRate = normalizePercent(annualRatePct) / 12;
  const graceMonthlyPaymentYuan = effectiveGraceMonths > 0 ? principalYuan * monthlyRate : 0;
  const amortizedMonthlyPaymentYuan = calculateMonthlyPaymentYuan(principalYuan, monthlyRate, amortizedMonths);
  const primaryMonthlyPaymentYuan = effectiveGraceMonths > 0 ? amortizedMonthlyPaymentYuan : amortizedMonthlyPaymentYuan;
  const graceInterestYuan = graceMonthlyPaymentYuan * effectiveGraceMonths;
  const amortizedTotalPaymentYuan = amortizedMonthlyPaymentYuan * amortizedMonths;
  const totalInterestYuan = Math.max(0, graceInterestYuan + amortizedTotalPaymentYuan - principalYuan);
  const totalRepaymentYuan = principalYuan + totalInterestYuan;
  const suggestedAnnualIncomeWan = primaryMonthlyPaymentYuan * 12 / 1e4 / 0.65;
  const requestedGraceClamped = requestedGraceMonths !== effectiveGraceMonths;
  return {
    totalPriceWan,
    downPaymentPct,
    downPaymentWan,
    annualRatePct,
    loanYears,
    graceYears,
    loanAmountWan,
    principalYuan,
    totalMonths,
    effectiveGraceMonths,
    amortizedMonths,
    monthlyRate,
    graceMonthlyPaymentYuan,
    amortizedMonthlyPaymentYuan,
    primaryMonthlyPaymentYuan,
    graceInterestYuan,
    totalInterestYuan,
    totalInterestWan: totalInterestYuan / 1e4,
    totalRepaymentYuan,
    totalRepaymentWan: totalRepaymentYuan / 1e4,
    suggestedAnnualIncomeWan,
    requestedGraceClamped
  };
}

// mortgageCalculatorApp.js
var root = document.getElementById("mortgageCalculatorRoot");
function formatNumber(value, digits = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "--";
  return numeric.toLocaleString("zh-TW", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}
function formatYuan(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return "--";
  return formatNumber(Math.round(numeric), 0);
}
function formatWan(value, digits = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return "--";
  return `${formatNumber(numeric, digits)} \u842C`;
}
function setText(container, selector, value) {
  const node = container.querySelector(selector);
  if (node) node.textContent = value;
}
function createInputField({ id, label, unit, value, min = 0, max = "", step = "0.01" }) {
  const maxAttr = max === "" ? "" : ` max="${max}"`;
  return `
    <label class="mortgage-field" for="${id}">
      <span>${label}</span>
      <span class="mortgage-input-with-unit">
        <input id="${id}" data-mortgage-field type="number" min="${min}"${maxAttr} step="${step}" value="${value}" inputmode="decimal" />
        <b>${unit}</b>
      </span>
    </label>
  `;
}
function readHouseValueWan() {
  const valueNode = document.getElementById("houseValue");
  const text = valueNode?.textContent ?? "";
  const numeric = Number(text.replace(/,/g, "").replace(/[^\d.]/g, ""));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}
if (root) {
  let readForm2 = function() {
    return Object.fromEntries(
      Object.entries(fields).map(([key, input]) => [key, input?.value ?? ""])
    );
  }, setForm2 = function(values) {
    Object.entries(fields).forEach(([key, input]) => {
      if (input) input.value = values[key] ?? "";
    });
  }, publishMortgageResult2 = function(result) {
    window.FoundMortgageCalculatorState = result;
    document.dispatchEvent(new CustomEvent("found:mortgage-calculator-updated", {
      detail: result
    }));
  }, updateResult2 = function() {
    const result = calculateMortgage(readForm2());
    const hasLoan = result.loanAmountWan > 0 && result.totalMonths > 0;
    const primaryLabel = result.effectiveGraceMonths > 0 ? "\u5BEC\u9650\u671F\u5F8C\u6708\u4ED8\u91D1" : "\u6BCF\u6708\u6708\u4ED8\u91D1";
    const primaryNote = result.effectiveGraceMonths > 0 ? `\u524D ${Math.round(result.effectiveGraceMonths / 12)} \u5E74\u5BEC\u9650\u671F\u53EA\u7E73\u5229\u606F\uFF0C\u671F\u6EFF\u5F8C\u4F9D\u5269\u9918 ${result.amortizedMonths} \u671F\u672C\u606F\u5747\u6524\u3002` : "\u672C\u606F\u5747\u6524\u4F30\u7B97";
    setText(root, "[data-mortgage-primary-label]", primaryLabel);
    setText(root, "[data-mortgage-monthly]", hasLoan ? formatYuan(result.primaryMonthlyPaymentYuan) : "--");
    setText(root, "[data-mortgage-primary-note]", hasLoan ? primaryNote : "\u8ACB\u8F38\u5165\u623F\u5C4B\u7E3D\u50F9\u8207\u8CB8\u6B3E\u5E74\u9650");
    setText(root, "[data-mortgage-loan-amount]", hasLoan ? formatWan(result.loanAmountWan, 0) : "--");
    setText(root, "[data-mortgage-down-payment]", result.totalPriceWan > 0 ? formatWan(result.downPaymentWan, 0) : "--");
    setText(root, "[data-mortgage-interest]", hasLoan ? formatWan(result.totalInterestWan, 0) : "--");
    setText(root, "[data-mortgage-repayment]", hasLoan ? formatWan(result.totalRepaymentWan, 0) : "--");
    setText(root, "[data-mortgage-income]", hasLoan ? formatWan(result.suggestedAnnualIncomeWan, 0) : "--");
    setText(root, "[data-mortgage-grace-payment]", result.effectiveGraceMonths > 0 ? `${formatYuan(result.graceMonthlyPaymentYuan)} \u5143` : "--");
    publishMortgageResult2(result);
    return result;
  }, applyEstimateValue2 = function(estimateWan) {
    const numeric = Number(estimateWan);
    if (!Number.isFinite(numeric) || numeric <= 0) return false;
    fields.totalPriceWan.value = Math.round(numeric);
    updateResult2();
    return true;
  }, valuationEstimateFromDetail2 = function(detail = {}) {
    const estimate = Number(detail?.results?.estimate);
    if (Number.isFinite(estimate) && estimate > 0) return estimate;
    return readHouseValueWan();
  };
  readForm = readForm2, setForm = setForm2, publishMortgageResult = publishMortgageResult2, updateResult = updateResult2, applyEstimateValue = applyEstimateValue2, valuationEstimateFromDetail = valuationEstimateFromDetail2;
  root.innerHTML = `
    <div class="mortgage-calculator-layout">
      <div class="mortgage-calculator-card loan-card">
        <div class="loan-card-head">
          <h3>\u623F\u8CB8\u689D\u4EF6</h3>
          <span>\u770B\u5230\u50F9\u683C\uFF0C\u7ACB\u5373\u4F30\u6708\u4ED8\u3001\u5229\u606F\u8207\u5E74\u6536\u9580\u6ABB</span>
        </div>
        <div class="mortgage-form-body">
          <div class="mortgage-field-grid">
            ${createInputField({
    id: "mortgageTotalPriceWan",
    label: "\u623F\u5C4B\u7E3D\u50F9",
    unit: "\u842C",
    value: DEFAULT_MORTGAGE_CALCULATOR.totalPriceWan,
    step: "1"
  })}
            ${createInputField({
    id: "mortgageDownPaymentPct",
    label: "\u81EA\u5099\u6B3E",
    unit: "%",
    value: DEFAULT_MORTGAGE_CALCULATOR.downPaymentPct,
    max: 100,
    step: "1"
  })}
            ${createInputField({
    id: "mortgageAnnualRatePct",
    label: "\u623F\u8CB8\u5229\u7387",
    unit: "%",
    value: DEFAULT_MORTGAGE_CALCULATOR.annualRatePct,
    max: 20,
    step: "0.01"
  })}
            ${createInputField({
    id: "mortgageLoanYears",
    label: "\u8CB8\u6B3E\u5E74\u9650",
    unit: "\u5E74",
    value: DEFAULT_MORTGAGE_CALCULATOR.loanYears,
    max: 50,
    step: "1"
  })}
            ${createInputField({
    id: "mortgageGraceYears",
    label: "\u5BEC\u9650\u671F",
    unit: "\u5E74",
    value: DEFAULT_MORTGAGE_CALCULATOR.graceYears,
    max: 10,
    step: "1"
  })}
          </div>

          <div class="mortgage-primary-result" aria-live="polite">
            <div>
              <small data-mortgage-primary-label>\u6BCF\u6708\u6708\u4ED8\u91D1</small>
              <strong><span data-mortgage-monthly>--</span><em>\u5143</em></strong>
              <span data-mortgage-primary-note>\u672C\u606F\u5747\u6524\u4F30\u7B97</span>
            </div>
          </div>

          <div class="mortgage-kpi-grid">
            <div><small>\u8CB8\u6B3E\u91D1\u984D</small><strong data-mortgage-loan-amount>--</strong></div>
            <div><small>\u81EA\u5099\u6B3E\u91D1\u984D</small><strong data-mortgage-down-payment>--</strong></div>
            <div><small>\u7E3D\u5229\u606F</small><strong data-mortgage-interest>--</strong></div>
            <div><small>\u672C\u5229\u548C\uFF08\u7E3D\u9084\u6B3E\uFF09</small><strong data-mortgage-repayment>--</strong></div>
            <div><small>\u5EFA\u8B70\u5E74\u6536\u5165</small><strong data-mortgage-income>--</strong></div>
            <div><small>\u5BEC\u9650\u671F\u5167\u6708\u4ED8</small><strong data-mortgage-grace-payment>--</strong></div>
          </div>

          <div class="mortgage-action-row">
            <button id="mortgageClearBtn" type="button" class="btn btn-ghost">\u6E05\u7A7A</button>
          </div>
        </div>
      </div>

    </div>
  `;
  const fields = {
    totalPriceWan: root.querySelector("#mortgageTotalPriceWan"),
    downPaymentPct: root.querySelector("#mortgageDownPaymentPct"),
    annualRatePct: root.querySelector("#mortgageAnnualRatePct"),
    loanYears: root.querySelector("#mortgageLoanYears"),
    graceYears: root.querySelector("#mortgageGraceYears")
  };
  root.querySelectorAll("[data-mortgage-field]").forEach((input) => {
    input.addEventListener("input", updateResult2);
  });
  root.querySelector("#mortgageClearBtn")?.addEventListener("click", () => {
    setForm2({
      totalPriceWan: "",
      downPaymentPct: "",
      annualRatePct: DEFAULT_MORTGAGE_CALCULATOR.annualRatePct,
      loanYears: "",
      graceYears: ""
    });
    updateResult2();
  });
  document.addEventListener("found:valuation-results-updated", (event) => {
    applyEstimateValue2(valuationEstimateFromDetail2(event.detail || {}));
  });
  if (!applyEstimateValue2(readHouseValueWan())) {
    updateResult2();
  }
}
var readForm;
var setForm;
var publishMortgageResult;
var updateResult;
var applyEstimateValue;
var valuationEstimateFromDetail;

// mortgageCapacityCalculator.js?v=20260623-rate-term-linked
var DEFAULT_LOANS = [
  { name: "\u672C\u6B21\u7533\u8ACB", principalWan: 0, annualRate: 0.025, months: 0 },
  { name: "\u4ED6\u884C\u623F\u8CB8\u3014IS\u9577\u64D4\u3015", principalWan: 0, annualRate: 0.025, months: 240, fixedTerms: true },
  { name: "\u91D1\u878D\u50B5\u5238\u3001\u50B5\u5238\u3014H\u4E2D\u653E\u3001E\u77ED\u653E\u3015", principalWan: 0, annualRate: 0.049, months: 84, fixedTerms: true },
  { name: "\u4FE1\u8CB8\u3014H\u4E2D\u653E\u3015", principalWan: 0, annualRate: 0.049, months: 84, fixedTerms: true },
  { name: "\u8ECA\u8CB8\u3014H\u4E2D\u64D4\u3015", principalWan: 0, annualRate: 0.026, months: 84, fixedTerms: true },
  { name: "\u4FE1\u7528\u5361(\u5361\u5FAA\u3001\u5F85\u4ED8\u91D1)\u3001\u73FE\u91D1\u5361", principalWan: 0, annualRate: 0.15, months: 20, fixedTerms: true }
];
var DEFAULT_INCOME = {
  salaryWan: 0,
  pensionWan: 0,
  dividendWan: 0,
  rentWan: 0
};
var DEFAULT_ASSETS = {
  cathayPolicyWan: 0,
  otherPolicyWan: 0,
  stockWan: 0,
  fundWan: 0,
  bondWan: 0,
  depositWan: 0
};
function toFiniteNumber2(value, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : fallback;
}
function normalizeAnnualRate(value) {
  const rate = toFiniteNumber2(value, 0);
  return Math.abs(rate) > 1 ? rate / 100 : rate;
}
function calculateMonthlyPayment(principalWan, annualRate, months) {
  const principal = Math.max(0, toFiniteNumber2(principalWan, 0)) * 1e4;
  const periodCount = Math.max(0, Math.floor(toFiniteNumber2(months, 0)));
  const monthlyRate = normalizeAnnualRate(annualRate) / 12;
  if (!principal || !periodCount) return 0;
  if (!monthlyRate) return Math.ceil(principal / periodCount);
  const factor = Math.pow(1 + monthlyRate, periodCount);
  return Math.ceil(principal * monthlyRate * factor / (factor - 1));
}
function calculateLoan(loan) {
  const monthlyPayment = calculateMonthlyPayment(loan.principalWan, loan.annualRate, loan.months);
  return {
    ...loan,
    principalWan: Math.max(0, toFiniteNumber2(loan.principalWan, 0)),
    annualRate: normalizeAnnualRate(loan.annualRate),
    months: Math.max(0, Math.floor(toFiniteNumber2(loan.months, 0))),
    monthlyPayment,
    annualTotal: monthlyPayment * 12
  };
}
function calculateLoans(loans) {
  const items = loans.map(calculateLoan);
  const totalAnnualDebtYuan = items.reduce((sum, item) => sum + item.annualTotal, 0);
  const totalAnnualDebtWanRaw = totalAnnualDebtYuan / 1e4;
  return {
    items,
    totalMonthlyPaymentYuan: items.reduce((sum, item) => sum + item.monthlyPayment, 0),
    totalAnnualDebtYuan,
    totalAnnualDebtWanRaw,
    totalAnnualDebtWan: Math.round(totalAnnualDebtWanRaw)
  };
}
function calculateRecognizedIncome(income) {
  const salaryWan = Math.max(0, toFiniteNumber2(income.salaryWan, 0));
  const pensionWan = Math.max(0, toFiniteNumber2(income.pensionWan, 0));
  const dividendWan = Math.max(0, toFiniteNumber2(income.dividendWan, 0));
  const rentWan = Math.max(0, toFiniteNumber2(income.rentWan, 0));
  const recognizedRentWan = rentWan * 0.9;
  return {
    salaryWan,
    pensionWan,
    dividendWan,
    rentWan,
    recognizedRentWan,
    recurringRecognizedIncomeWan: salaryWan + pensionWan + dividendWan + recognizedRentWan
  };
}
function calculateFinancialAssets(assets, mortgageMonths) {
  const values = {
    cathayPolicyWan: Math.max(0, toFiniteNumber2(assets.cathayPolicyWan, 0)),
    otherPolicyWan: Math.max(0, toFiniteNumber2(assets.otherPolicyWan, 0)),
    stockWan: Math.max(0, toFiniteNumber2(assets.stockWan, 0)),
    fundWan: Math.max(0, toFiniteNumber2(assets.fundWan, 0)),
    bondWan: Math.max(0, toFiniteNumber2(assets.bondWan, 0)),
    depositWan: Math.max(0, toFiniteNumber2(assets.depositWan, 0))
  };
  const totalFinancialAssetsWan = Object.values(values).reduce((sum, value) => sum + value, 0);
  const mortgageTermYears = Math.max(0, toFiniteNumber2(mortgageMonths, 0)) / 12;
  const assetConvertedIncomeWan = mortgageTermYears > 0 ? Math.round(totalFinancialAssetsWan * 0.9 / mortgageTermYears) : 0;
  return {
    ...values,
    totalFinancialAssetsWan,
    mortgageTermYears,
    assetConvertedIncomeWan
  };
}
function calculateCapacity({ loans = DEFAULT_LOANS, income = DEFAULT_INCOME, assets = DEFAULT_ASSETS } = {}) {
  const loanResult = calculateLoans(loans);
  const incomeResult = calculateRecognizedIncome(income);
  const mortgageMonths = loanResult.items[0]?.months ?? 0;
  const assetResult = calculateFinancialAssets(assets, mortgageMonths);
  const recurringRecognizedIncomeWan = incomeResult.recurringRecognizedIncomeWan;
  const financialAssetBonusIncomeWan = assetResult.assetConvertedIncomeWan;
  const totalRecognizedIncomeWan = recurringRecognizedIncomeWan + financialAssetBonusIncomeWan;
  const debtIncomeRatio = totalRecognizedIncomeWan > 0 ? loanResult.totalAnnualDebtWan / totalRecognizedIncomeWan : null;
  const status = debtIncomeRatio == null ? "\u7121\u6CD5\u8A08\u7B97" : debtIncomeRatio <= 0.7 ? "\u7B26\u5408\u6A19\u6E96" : "\u8D85\u904E\u6A19\u6E96";
  return {
    loans: loanResult,
    income: incomeResult,
    assets: assetResult,
    recurringRecognizedIncomeWan,
    financialAssetBonusIncomeWan,
    totalRecognizedIncomeWan,
    debtIncomeRatio,
    status,
    meetsStandard: debtIncomeRatio != null ? debtIncomeRatio <= 0.7 : null
  };
}

// components/formatters.js
function formatNumber2(value, digits = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "--";
  return numeric.toLocaleString("zh-TW", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}
function formatWan2(value, digits = 2) {
  return `${formatNumber2(value, digits)} \u842C\u5143/\u5E74`;
}
function formatWanAmount(value, digits = 2) {
  return `${formatNumber2(value, digits)} \u842C\u5143`;
}
function formatYuan2(value) {
  return `${formatNumber2(value, 0)} \u5143`;
}
function formatRateInput(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric === 0) return "";
  return `${formatNumber2(numeric * 100, 3).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1")}%`;
}
function formatInputNumber(value, digits = 2) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric === 0) return "";
  return numeric.toLocaleString("zh-TW", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits
  });
}
function parseNumericInput(value) {
  const cleaned = String(value ?? "").replace(/,/g, "").replace(/％/g, "%").replace(/[^\d.%+-]/g, "").trim();
  if (!cleaned) return 0;
  const isPercent = cleaned.includes("%");
  const numeric = Number(cleaned.replace(/%/g, ""));
  if (!Number.isFinite(numeric)) return 0;
  return isPercent ? numeric / 100 : numeric;
}
function setInputDisplay(input, value, options = {}) {
  const { type = "number", digits = 2 } = options;
  if (type === "rate") {
    input.value = formatRateInput(value);
    return;
  }
  input.value = formatInputNumber(value, digits);
}
function normalizeDisplayOnFocus(event) {
  event.currentTarget.value = String(event.currentTarget.value || "").replace(/,/g, "").replace(/%/g, "");
}

// components/LoanTable.js?v=20260623-readonly-loan-name
var LoanTable = class {
  constructor(container, onChange) {
    this.container = container;
    this.onChange = onChange;
    this.loans = structuredClone(DEFAULT_LOANS);
  }
  render() {
    this.container.innerHTML = `
      <section class="loan-card loan-card-wide">
        <div class="loan-card-head">
          <h3>\u8CB8\u6B3E\u9805\u76EE</h3>
          <span>\u672C\u6B21\u7533\u8ACB\u5229\u7387\u8207\u671F\u6578\u7531\u4E0A\u65B9\u623F\u8CB8\u689D\u4EF6\u540C\u6B65\uFF1B\u672C\u91D1\u55AE\u4F4D\uFF1A\u842C\u5143</span>
        </div>
        <div class="loan-table-wrap">
          <table class="loan-table">
            <thead>
              <tr>
                <th>\u8CB8\u6B3E\u9805\u76EE\u540D\u7A31</th>
                <th>\u672C\u91D1\uFF08\u842C\u5143\uFF09</th>
                <th>\u6BCF\u6708\u91D1\u984D</th>
                <th>\u5E74\u5EA6\u7E3D\u984D</th>
              </tr>
            </thead>
            <tbody>
              ${this.loans.map((loan, index) => this.renderRow(loan, index)).join("")}
            </tbody>
          </table>
        </div>
      </section>
    `;
    this.bindEvents();
    this.updateComputedCells();
  }
  renderRow(loan, index) {
    return `
      <tr data-loan-row="${index}">
        <td data-label="\u8CB8\u6B3E\u9805\u76EE\u540D\u7A31"><input class="loan-input loan-name-input loan-fixed-input" data-field="name" data-index="${index}" value="${escapeHtml2(loan.name)}" readonly aria-readonly="true" /></td>
        <td data-label="\u672C\u91D1\uFF08\u842C\u5143\uFF09"><input class="loan-input loan-editable-input" data-field="principalWan" data-kind="money" data-index="${index}" inputmode="decimal" /></td>
        <td class="loan-result-cell" data-label="\u6BCF\u6708\u91D1\u984D" data-monthly="${index}">--</td>
        <td class="loan-result-cell" data-label="\u5E74\u5EA6\u7E3D\u984D" data-annual="${index}">--</td>
      </tr>
    `;
  }
  bindEvents() {
    this.container.querySelectorAll("[data-field]").forEach((input) => {
      const index = Number(input.dataset.index);
      const field2 = input.dataset.field;
      const kind = input.dataset.kind || "text";
      if (field2 === "name" && input.readOnly) return;
      if (field2 !== "name") {
        setInputDisplay(input, this.loans[index][field2], {
          type: kind === "rate" ? "rate" : "number",
          digits: 0
        });
        input.addEventListener("focus", normalizeDisplayOnFocus);
        input.addEventListener("blur", () => {
          setInputDisplay(input, this.loans[index][field2], {
            type: kind === "rate" ? "rate" : "number",
            digits: 0
          });
        });
      }
      input.addEventListener("input", () => {
        if (field2 === "name") {
          this.loans[index][field2] = input.value;
        } else {
          const parsed = parseNumericInput(input.value);
          this.loans[index][field2] = kind === "rate" ? normalizeAnnualRate(parsed) : kind === "integer" ? Math.max(0, Math.floor(parsed)) : Math.max(0, parsed);
        }
        this.updateComputedCells();
        this.onChange?.();
      });
    });
  }
  updateComputedCells() {
    this.loans.forEach((loan, index) => {
      const computed = calculateLoan(loan);
      const monthlyCell = this.container.querySelector(`[data-monthly="${index}"]`);
      const annualCell = this.container.querySelector(`[data-annual="${index}"]`);
      if (monthlyCell) monthlyCell.textContent = formatYuan2(computed.monthlyPayment);
      if (annualCell) annualCell.textContent = formatYuan2(computed.annualTotal);
    });
  }
  getValue() {
    return structuredClone(this.loans);
  }
  reset() {
    this.loans = structuredClone(DEFAULT_LOANS);
    this.render();
    this.onChange?.();
  }
  clear() {
    this.loans = this.loans.map((loan, index) => ({
      ...loan,
      principalWan: 0,
      annualRate: loan.fixedTerms ? loan.annualRate : DEFAULT_LOANS[index]?.annualRate ?? loan.annualRate ?? 0,
      months: loan.fixedTerms ? loan.months : 0
    }));
    this.render();
    this.onChange?.();
  }
  applyMortgage({ principalWan = null, annualRatePct = null, annualRate = null, loanYears = null, months = null } = {}) {
    const current = this.loans[0] || structuredClone(DEFAULT_LOANS[0]);
    const resolvedMonths = Number.isFinite(Number(months)) ? Math.max(0, Math.floor(Number(months))) : Number.isFinite(Number(loanYears)) ? Math.max(0, Math.floor(Number(loanYears) * 12)) : current.months;
    const resolvedRate = annualRatePct != null ? normalizeAnnualRate(annualRatePct) : annualRate != null ? normalizeAnnualRate(annualRate) : current.annualRate;
    this.loans[0] = {
      ...current,
      name: current.name || "\u672C\u6B21\u7533\u8ACB",
      principalWan: Math.max(0, Number(principalWan) || 0),
      annualRate: resolvedRate,
      months: resolvedMonths
    };
    this.render();
    this.onChange?.();
  }
};
function escapeHtml2(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// mortgageCapacityCalculator.js
var DEFAULT_INCOME2 = {
  salaryWan: 0,
  pensionWan: 0,
  dividendWan: 0,
  rentWan: 0
};
var DEFAULT_ASSETS2 = {
  cathayPolicyWan: 0,
  otherPolicyWan: 0,
  stockWan: 0,
  fundWan: 0,
  bondWan: 0,
  depositWan: 0
};
function toFiniteNumber3(value, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : fallback;
}
function calculateRecognizedIncome2(income) {
  const salaryWan = Math.max(0, toFiniteNumber3(income.salaryWan, 0));
  const pensionWan = Math.max(0, toFiniteNumber3(income.pensionWan, 0));
  const dividendWan = Math.max(0, toFiniteNumber3(income.dividendWan, 0));
  const rentWan = Math.max(0, toFiniteNumber3(income.rentWan, 0));
  const recognizedRentWan = rentWan * 0.9;
  return {
    salaryWan,
    pensionWan,
    dividendWan,
    rentWan,
    recognizedRentWan,
    recurringRecognizedIncomeWan: salaryWan + pensionWan + dividendWan + recognizedRentWan
  };
}
function calculateFinancialAssets2(assets, mortgageMonths) {
  const values = {
    cathayPolicyWan: Math.max(0, toFiniteNumber3(assets.cathayPolicyWan, 0)),
    otherPolicyWan: Math.max(0, toFiniteNumber3(assets.otherPolicyWan, 0)),
    stockWan: Math.max(0, toFiniteNumber3(assets.stockWan, 0)),
    fundWan: Math.max(0, toFiniteNumber3(assets.fundWan, 0)),
    bondWan: Math.max(0, toFiniteNumber3(assets.bondWan, 0)),
    depositWan: Math.max(0, toFiniteNumber3(assets.depositWan, 0))
  };
  const totalFinancialAssetsWan = Object.values(values).reduce((sum, value) => sum + value, 0);
  const mortgageTermYears = Math.max(0, toFiniteNumber3(mortgageMonths, 0)) / 12;
  const assetConvertedIncomeWan = mortgageTermYears > 0 ? Math.round(totalFinancialAssetsWan * 0.9 / mortgageTermYears) : 0;
  return {
    ...values,
    totalFinancialAssetsWan,
    mortgageTermYears,
    assetConvertedIncomeWan
  };
}

// components/IncomeSection.js?v=20260621-asset-two-col
var INCOME_FIELDS = [
  { key: "salaryWan", label: "\u85AA\u8CC7\u6536\u5165", unit: "\u842C\u5143/\u5E74" },
  { key: "pensionWan", label: "\u9000\u4F11\u4FF8\u6536\u5165", unit: "\u842C\u5143/\u5E74" },
  { key: "dividendWan", label: "\u5404\u985E\u914D\u606F / \u5E74\u91D1\u6536\u5165", unit: "\u842C\u5143/\u5E74" },
  { key: "rentWan", label: "\u79DF\u91D1\u6536\u5165", unit: "\u842C\u5143/\u5E74" }
];
var IncomeSection = class {
  constructor(container, onChange) {
    this.container = container;
    this.onChange = onChange;
    this.income = structuredClone(DEFAULT_INCOME2);
  }
  render() {
    this.container.innerHTML = `
      <section class="loan-card">
        <div class="loan-card-head">
          <h3>\u7D93\u5E38\u6027\u6536\u5165</h3>
          <span>\u79DF\u91D1\u6536\u5165\u81EA\u52D5\u8A8D\u5217 90%</span>
        </div>
        <div class="capacity-field-grid income-field-grid">
          ${INCOME_FIELDS.map((field2) => `
            <div class="capacity-field">
              <label for="income-${field2.key}">${field2.label}</label>
              <div class="capacity-input-with-unit">
                <input id="income-${field2.key}" data-income-field="${field2.key}" inputmode="decimal" />
                <span>${field2.unit}</span>
              </div>
            </div>
          `).join("")}
        </div>
        <div class="capacity-subtotal">
          <span>\u79DF\u91D1\u6536\u5165\u8A8D\u5217</span><strong data-income-rent-recognized>0 \u842C\u5143/\u5E74</strong>
          <span>\u7D93\u5E38\u6027\u6536\u5165\u8A8D\u5217\u5C0F\u8A08</span><strong data-income-total>0 \u842C\u5143/\u5E74</strong>
        </div>
      </section>
    `;
    this.bindEvents();
    this.updateComputed();
  }
  bindEvents() {
    this.container.querySelectorAll("[data-income-field]").forEach((input) => {
      const key = input.dataset.incomeField;
      setInputDisplay(input, this.income[key], { digits: 0 });
      input.addEventListener("focus", normalizeDisplayOnFocus);
      input.addEventListener("blur", () => setInputDisplay(input, this.income[key], { digits: 0 }));
      input.addEventListener("input", () => {
        this.income[key] = Math.max(0, parseNumericInput(input.value));
        this.updateComputed();
        this.onChange?.();
      });
    });
  }
  updateComputed() {
    const result = calculateRecognizedIncome2(this.income);
    const rent = this.container.querySelector("[data-income-rent-recognized]");
    const total = this.container.querySelector("[data-income-total]");
    if (rent) rent.textContent = formatWan2(result.recognizedRentWan, 0);
    if (total) total.textContent = formatWan2(result.recurringRecognizedIncomeWan, 0);
  }
  getValue() {
    return structuredClone(this.income);
  }
  reset() {
    this.income = structuredClone(DEFAULT_INCOME2);
    this.render();
    this.onChange?.();
  }
  clear() {
    this.income = structuredClone(DEFAULT_INCOME2);
    this.render();
    this.onChange?.();
  }
};

// components/AssetSection.js?v=20260621-asset-two-col
var ASSET_FIELDS = [
  { key: "cathayPolicyWan", label: "\u570B\u58FD\u4FDD\u55AE\u4FDD\u50F9" },
  { key: "otherPolicyWan", label: "\u4ED6\u884C\u4FDD\u55AE\u4FDD\u50F9" },
  { key: "stockWan", label: "\u80A1\u7968\u6DE8\u503C" },
  { key: "fundWan", label: "\u57FA\u91D1\u6DE8\u503C" },
  { key: "bondWan", label: "\u50B5\u5238\u6DE8\u503C" },
  { key: "depositWan", label: "\u5B9A\u5B58\u6DE8\u503C" }
];
var AssetSection = class {
  constructor(container, onChange) {
    this.container = container;
    this.onChange = onChange;
    this.assets = structuredClone(DEFAULT_ASSETS2);
    this.mortgageMonths = 0;
  }
  render() {
    this.container.innerHTML = `
      <section class="loan-card">
        <div class="loan-card-head">
          <h3>\u91D1\u878D\u8CC7\u7522</h3>
          <span>\u6DE8\u503C\u55AE\u4F4D\uFF1A\u842C\u5143</span>
        </div>
        <div class="capacity-field-grid asset-field-grid">
          ${ASSET_FIELDS.map((field2) => `
            <div class="capacity-field">
              <label for="asset-${field2.key}">${field2.label}</label>
              <div class="capacity-input-with-unit">
                <input id="asset-${field2.key}" data-asset-field="${field2.key}" inputmode="decimal" />
                <span>\u842C\u5143</span>
              </div>
            </div>
          `).join("")}
        </div>
        <div class="capacity-subtotal">
          <span>\u5408\u8A08\u91D1\u878D\u8CC7\u7522</span><strong data-asset-total>0 \u842C\u5143</strong>
          <span>\u672C\u6B21\u623F\u8CB8\u5E74\u6578</span><strong data-asset-loan-years>--</strong>
          <span>\u91D1\u878D\u8CC7\u7522\u52A0\u5206\u6536\u5165</span><strong data-asset-income>0 \u842C\u5143/\u5E74</strong>
        </div>
      </section>
    `;
    this.bindEvents();
    this.updateComputed(this.mortgageMonths);
  }
  bindEvents() {
    this.container.querySelectorAll("[data-asset-field]").forEach((input) => {
      const key = input.dataset.assetField;
      setInputDisplay(input, this.assets[key], { digits: 0 });
      input.addEventListener("focus", normalizeDisplayOnFocus);
      input.addEventListener("blur", () => setInputDisplay(input, this.assets[key], { digits: 0 }));
      input.addEventListener("input", () => {
        this.assets[key] = Math.max(0, parseNumericInput(input.value));
        this.updateComputed(this.mortgageMonths);
        this.onChange?.();
      });
    });
  }
  updateComputed(mortgageMonths = 0) {
    this.mortgageMonths = mortgageMonths;
    const result = calculateFinancialAssets2(this.assets, mortgageMonths);
    const total = this.container.querySelector("[data-asset-total]");
    const loanYears = this.container.querySelector("[data-asset-loan-years]");
    const income = this.container.querySelector("[data-asset-income]");
    if (total) total.textContent = formatWanAmount(result.totalFinancialAssetsWan, 0);
    if (loanYears) loanYears.textContent = result.mortgageTermYears > 0 ? `${formatWanless(result.mortgageTermYears)} \u5E74` : "--";
    if (income) income.textContent = formatWan2(result.assetConvertedIncomeWan, 0);
  }
  getValue() {
    return structuredClone(this.assets);
  }
  reset() {
    this.assets = structuredClone(DEFAULT_ASSETS2);
    this.render();
    this.onChange?.();
  }
  clear() {
    this.assets = structuredClone(DEFAULT_ASSETS2);
    this.render();
    this.onChange?.();
  }
};
function formatWanless(value) {
  return Number(value).toLocaleString("zh-TW", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

// components/ResultPanel.js
var ResultPanel = class {
  constructor(container) {
    this.container = container;
  }
  render() {
    this.container.innerHTML = `
      <section class="loan-card result-capacity-card">
        <div class="loan-card-head">
          <h3>\u8A66\u7B97\u7D50\u679C</h3>
          <span>\u6A19\u6E96\uFF1A\u6536\u652F\u6BD4 70% \u4EE5\u4E0B</span>
        </div>
        <div class="capacity-result-main">
          <div>
            <small>\u6536\u652F\u6BD4\u6982\u7B97\u7D50\u679C</small>
            <strong data-result-ratio>--</strong>
            <span>%</span>
          </div>
          <b data-result-status class="capacity-status capacity-status-neutral">\u7121\u6CD5\u8A08\u7B97</b>
        </div>
        <div class="capacity-kpi-grid">
          <div><span>\u8CB8\u6B3E\u6BCF\u6708\u9084\u6B3E\u5408\u8A08</span><strong data-total-monthly>0 \u5143</strong></div>
          <div><span>\u5408\u8A08\u8CA0\u50B5\u652F\u51FA</span><strong data-total-debt>0 \u842C\u5143/\u5E74</strong></div>
          <div><span>\u7D93\u5E38\u6027\u6536\u5165\u8A8D\u5217\u5C0F\u8A08</span><strong data-recurring-income>0 \u842C\u5143/\u5E74</strong></div>
          <div><span>\u91D1\u878D\u8CC7\u7522\u52A0\u5206\u6536\u5165</span><strong data-asset-income>0 \u842C\u5143/\u5E74</strong></div>
          <div><span>\u5408\u8A08\u53EF\u8A8D\u5217\u6536\u5165\uFF08\u6536\u652F\u6BD4\u5206\u6BCD\uFF09</span><strong data-total-income>0 \u842C\u5143/\u5E74</strong></div>
          <div><span>\u5408\u8A08\u91D1\u878D\u8CC7\u7522</span><strong data-asset-total>0 \u842C\u5143</strong></div>
        </div>
      </section>
    `;
  }
  update(result) {
    this.setText("[data-total-monthly]", formatYuan2(result.loans.totalMonthlyPaymentYuan));
    this.setText("[data-total-debt]", formatWan2(result.loans.totalAnnualDebtWan, 0));
    this.setText("[data-recurring-income]", formatWan2(result.income.recurringRecognizedIncomeWan, 0));
    this.setText("[data-asset-income]", formatWan2(result.assets.assetConvertedIncomeWan, 0));
    this.setText("[data-total-income]", formatWan2(result.totalRecognizedIncomeWan, 0));
    this.setText("[data-asset-total]", formatWanAmount(result.assets.totalFinancialAssetsWan, 0));
    const ratioNode = this.container.querySelector("[data-result-ratio]");
    if (ratioNode) {
      ratioNode.textContent = result.debtIncomeRatio == null ? "--" : formatNumber2(result.debtIncomeRatio * 100, 0);
    }
    const statusNode = this.container.querySelector("[data-result-status]");
    if (statusNode) {
      statusNode.textContent = result.status;
      statusNode.className = `capacity-status ${statusClass(result.status)}`;
    }
  }
  setText(selector, text) {
    const node = this.container.querySelector(selector);
    if (node) node.textContent = text;
  }
};
function statusClass(status) {
  if (status === "\u7B26\u5408\u6A19\u6E96") return "capacity-status-ok";
  if (status === "\u8D85\u904E\u6A19\u6E96") return "capacity-status-warn";
  return "capacity-status-neutral";
}

// loanCapacityApp.js
var root2 = document.getElementById("loanCapacityRoot");
if (root2) {
  const shell = document.createElement("div");
  shell.className = "loan-capacity-layout";
  shell.innerHTML = `
    <div class="loan-capacity-inputs">
      <div data-loan-table></div>
      <div class="loan-capacity-side-grid">
        <div data-income-section></div>
        <div data-asset-section></div>
      </div>
      <div class="loan-action-row">
        <button id="loanRecalculateBtn" type="button" class="btn btn-main">\u91CD\u65B0\u8A08\u7B97</button>
        <button id="loanClearBtn" type="button" class="btn btn-ghost">\u6E05\u7A7A</button>
        <button id="loanResetBtn" type="button" class="btn btn-case">\u6062\u5FA9\u9810\u8A2D\u503C</button>
      </div>
    </div>
    <aside data-result-panel></aside>
  `;
  root2.append(shell);
  const resultPanel = new ResultPanel(shell.querySelector("[data-result-panel]"));
  let loanTable;
  let incomeSection;
  let assetSection;
  const applyMortgageState = (state = window.FoundMortgageCalculatorState || {}) => {
    if (!loanTable || !state) return;
    loanTable.applyMortgage({
      principalWan: state.loanAmountWan,
      annualRatePct: state.annualRatePct,
      months: state.totalMonths,
      loanYears: state.loanYears
    });
  };
  const recalculate = () => {
    const loans = loanTable.getValue();
    const income = incomeSection.getValue();
    const assets = assetSection.getValue();
    const mortgageMonths = loans[0]?.months || 0;
    assetSection.updateComputed(mortgageMonths);
    resultPanel.update(calculateCapacity({ loans, income, assets }));
  };
  loanTable = new LoanTable(shell.querySelector("[data-loan-table]"), recalculate);
  incomeSection = new IncomeSection(shell.querySelector("[data-income-section]"), recalculate);
  assetSection = new AssetSection(shell.querySelector("[data-asset-section]"), recalculate);
  resultPanel.render();
  loanTable.render();
  incomeSection.render();
  assetSection.render();
  recalculate();
  applyMortgageState();
  document.addEventListener("found:mortgage-calculator-updated", (event) => {
    applyMortgageState(event.detail || {});
  });
  document.getElementById("loanRecalculateBtn")?.addEventListener("click", recalculate);
  document.getElementById("loanClearBtn")?.addEventListener("click", () => {
    loanTable.clear();
    incomeSection.clear();
    assetSection.clear();
    applyMortgageState();
    recalculate();
  });
  document.getElementById("loanResetBtn")?.addEventListener("click", () => {
    loanTable.reset();
    incomeSection.reset();
    assetSection.reset();
    applyMortgageState();
    recalculate();
  });
}

// landValueTaxLazyInit.js
var landValueTaxModulePromise = null;
function initLandValueTax() {
  if (!document.getElementById("landValueTaxRoot")) return null;
  if (!landValueTaxModulePromise) {
    landValueTaxModulePromise = Promise.resolve().then(() => (init_landValueTaxApp(), landValueTaxApp_exports));
  }
  return landValueTaxModulePromise;
}
document.getElementById("tabLandValueTax")?.addEventListener("click", () => {
  initLandValueTax()?.catch((error) => console.error("\u571F\u5730\u589E\u503C\u7A05\u8A66\u7B97\u8F09\u5165\u5931\u6557", error));
});
if (document.querySelector("#landValueTaxTab.active")) {
  initLandValueTax()?.catch((error) => console.error("\u571F\u5730\u589E\u503C\u7A05\u8A66\u7B97\u8F09\u5165\u5931\u6557", error));
}
window.initLandValueTaxApp = initLandValueTax;

// src/support/support-widget.js
var STORAGE_PREFIX = "foundSupport:";
var HISTORY_KEY = `${STORAGE_PREFIX}history`;
var INTAKES_KEY = `${STORAGE_PREFIX}intakes`;
var AUTO_OCR_OPENER_KEY = `${STORAGE_PREFIX}autoOcrOpeners`;
var REMOTE_MESSAGE_SEEN_KEY = `${STORAGE_PREFIX}remoteMessageSeen`;
var SUPPORT_API_BASE = "/api/support";
var SUPPORT_ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024;
var SUPPORT_ATTACHMENT_MAX_FILES = 3;
var SUPPORT_REMOTE_MESSAGE_POLL_MS = 4500;
var SUPPORT_ATTACHMENT_MIMES = /* @__PURE__ */ new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif"
]);
var backendSnapshot = null;
var backendStatus = null;
var KNOWLEDGE = [
  {
    id: "ocr",
    title: "\u8B04\u672C OCR / PDF \u89E3\u6790",
    keywords: ["ocr", "pdf", "\u6587\u5B57\u5C64", "ppocrv5", "ncnn", "docker", "roi", "yolo", "\u8FA8\u8B58", "\u89E3\u6790", "\u8B04\u672C"],
    answer: [
      "\u8B04\u672C\u89E3\u6790\u6D41\u7A0B\u6703\u512A\u5148\u8B80 PDF \u6587\u5B57\u5C64\uFF1B\u5716\u7247\u6216\u4F4E\u4FE1\u5FC3\u6B04\u4F4D\u6703\u6539\u7528\u672C\u6A5F ppocrv5_ncnn\uFF0C\u4E26\u4EE5 YOLO/\u7D05\u6846 ROI \u805A\u7126\u88DC\u5F37\u3002",
      "\u82E5 ROI \u4ECD\u8B80\u4E0D\u5230\u6587\u5B57\uFF0C\u7CFB\u7D71\u6703\u5728 Docker PaddleOCR 8099 \u53EF\u7528\u6642\u4F5C\u70BA\u9694\u96E2\u5F0F\u5099\u63F4\uFF1BmacOS Vision\u3001Gemini\u3001PaddleOCR-VL\u3001PP-Structure \u76EE\u524D\u4E0D\u5728\u4E3B OCR fallback \u6D41\u7A0B\u3002\u89E3\u6790\u5F8C\u8ACB\u5148\u770B\u300C\u6B04\u4F4D\u8FA8\u8B58\u8A3A\u65B7\u300D\uFF1A\u4FE1\u5FC3\u4F4E\u6216\u6A19\u793A\u300C\u8ACB\u6AA2\u67E5\u300D\u7684\u6B04\u4F4D\uFF0C\u5EFA\u8B70\u4EBA\u5DE5\u8907\u6838\u5F8C\u518D\u4F30\u50F9\u3002"
    ]
  },
  {
    id: "doorplate",
    title: "\u5EFA\u7269\u9580\u724C / \u67E5\u8A62\u5730\u5740",
    keywords: ["\u9580\u724C", "\u5730\u5740", "\u67E5\u8A62\u5730\u5740", "\u8DEF", "\u8857", "\u5DF7", "\u5F04", "\u865F", "\u6A13"],
    answer: [
      "\u5EFA\u7269\u9580\u724C\u6703\u512A\u5148\u53D6\u5EFA\u7269\u6A19\u793A\u90E8\u7684\u300C\u5EFA\u7269\u9580\u724C\u300D\uFF0C\u4E26\u540C\u6B65\u5E36\u5165\u67E5\u8A62\u5730\u5740\u3002",
      "\u82E5 OCR \u628A\u6587\u4EF6\u6A19\u984C\u3001\u5730\u865F\u6216\u5EFA\u865F\u8AA4\u7576\u9580\u724C\uFF0C\u8ACB\u5C55\u958B\u300C\u6B04\u4F4D\u8FA8\u8B58\u8A3A\u65B7\u300D\u770B raw \u503C\uFF1B\u901A\u5E38\u662F PDF \u6587\u5B57\u5C64\u63DB\u884C\u9ECF\u5728\u4E00\u8D77\u6216\u5716\u7247\u50BE\u659C\u9020\u6210\u3002"
    ]
  },
  {
    id: "area",
    title: "\u4E3B\u5EFA\u7269 / \u9644\u5C6C\u5EFA\u7269 / \u5171\u6709\u90E8\u5206\u9762\u7A4D",
    keywords: ["\u4E3B\u5EFA\u7269", "\u9644\u5C6C", "\u5171\u6709", "\u9762\u7A4D", "\u576A", "\u5E73\u65B9\u516C\u5C3A", "\u8ECA\u4F4D\u576A\u6578", "\u7E3D\u9762\u7A4D"],
    answer: [
      "\u623F\u5C4B\u576A\u6578 = \u4E3B\u5EFA\u7269 + \u9644\u5C6C\u5EFA\u7269 + \u5171\u6709\u90E8\u5206\uFF1B\u8ECA\u4F4D\u576A\u6578\u53E6\u5217\uFF0C\u7E3D\u576A\u6578 = \u623F\u5C4B\u576A\u6578 + \u8ECA\u4F4D\u576A\u6578\u3002",
      "\u5E73\u65B9\u516C\u5C3A\u6703\u81EA\u52D5\u9664\u4EE5 3.305785 \u63DB\u7B97\u6210\u576A\u3002\u5171\u6709\u90E8\u5206\u82E5\u6709\u6B0A\u5229\u7BC4\u570D\uFF0C\u6703\u5148\u4F9D\u6B0A\u5229\u7BC4\u570D\u63DB\u7B97\u61C9\u6709\u90E8\u5206\u5F8C\u518D\u8F49\u576A\u3002"
    ]
  },
  {
    id: "score",
    title: "\u6BD4\u8F03\u6848\u4F8B\u6392\u5E8F\u5206\u6578",
    keywords: ["\u6392\u5E8F", "\u5206\u6578", "comparable", "\u6BD4\u8F03\u6848\u4F8B", "\u5E73\u5747", "\u6B0A\u91CD", "\u55AE\u50F9", "\u6A13\u5225", "\u7E3D\u6A13\u5C64"],
    answer: [
      "\u76EE\u524D\u6BD4\u8F03\u6848\u4F8B\u4F9D Comparable Score 100 \u5206\u5236\u6392\u5E8F\uFF1A\u5730\u5740\u63A5\u8FD1\u5EA6\u6700\u9AD825\u3001\u5C4B\u9F6117\u3001\u7E3D\u6A13\u5C6415\u3001\u7E3D\u9762\u7A4D15\u3001\u4EA4\u6613\u65E5\u671F10\u3001\u6A13\u5225\u63A5\u8FD1\u5EA68\u3001\u4E3B\u8981\u7528\u90145\u3001\u55AE\u50F95\u3002",
      "\u7D50\u679C\u8868\u6703\u9810\u8A2D\u4F9D\u6392\u5E8F\u5206\u6578\u7531\u9AD8\u5230\u4F4E\u6392\u5217\uFF0C\u518D\u53D6\u6392\u5E8F\u5F8C\u81F3\u591A\u524D 3 \u7B46\u8A08\u7B97\u5E73\u5747\u55AE\u50F9\uFF1B\u4E00\u6A13\u6848\u4F8B\u53EA\u5728\u6A19\u7684\u660E\u78BA\u70BA\u4E00\u6A13\u6642\u5217\u5165\u3002"
    ]
  },
  {
    id: "townhouse",
    title: "\u900F\u5929\u8207\u5EFA\u7269\u578B\u614B",
    keywords: ["\u900F\u5929", "\u516C\u5BD3", "\u83EF\u5EC8", "\u4F4F\u5B85\u5927\u6A13", "\u5EFA\u7269\u578B\u614B", "\u5C64\u6B21", "\u7E3D\u6A13\u5C64"],
    answer: [
      "\u5EFA\u7269\u578B\u614B\u6703\u4F9D\u7E3D\u6A13\u5C64\u8207\u8B04\u672C\u5C64\u6B21\u5224\u65B7\uFF1A5\u6A13\u4EE5\u4E0B\u901A\u5E38\u70BA\u516C\u5BD3\u30016-9\u6A13\u70BA\u83EF\u5EC8\u300110\u6A13\u4EE5\u4E0A\u70BA\u4F4F\u5B85\u5927\u6A13\u3002",
      "\u900F\u5929\u901A\u5E38\u9700\u540C\u4E00\u9580\u724C\u542B\u4E00\u6A13\u4E14\u6DB5\u84CB\u591A\u500B\u6A13\u5C64\uFF1B\u82E5\u53EA\u6709\u55AE\u4E00\u6A13\u5225\u4F8B\u5982\u4E09\u6A13\u3001\u56DB\u6A13\uFF0C\u5373\u4F7F\u7E3D\u6A13\u5C64\u8F03\u4F4E\u4E5F\u4E0D\u6703\u76F4\u63A5\u5224\u6210\u900F\u5929\u3002"
    ]
  },
  {
    id: "parking",
    title: "\u8ECA\u4F4D\u576A\u6578 / \u8ECA\u4F4D\u7E3D\u50F9",
    keywords: ["\u8ECA\u4F4D", "\u505C\u8ECA", "\u505C\u8ECA\u4F4D", "\u8ECA\u4F4D\u7E3D\u50F9", "\u8ECA\u4F4D\u6578\u91CF", "\u6B0A\u5229\u7BC4\u570D"],
    answer: [
      "\u6709\u505C\u8ECA\u4F4D\u7DE8\u865F\u6642\uFF0C\u8ECA\u4F4D\u6578\u91CF\u6703\u76F4\u63A5\u63A1 OCR \u8B80\u5230\u7684\u7DE8\u865F\u500B\u6578\uFF1B\u6C92\u6709\u7DE8\u865F\u6642\u624D\u7531\u8ECA\u4F4D\u576A\u6578\u63A8\u4F30\u3002",
      "\u4F30\u503C\u52A0\u8A08\u7684\u8ECA\u4F4D\u91D1\u984D\u6703\u53D6\u7D0D\u5165\u5E73\u5747\u6848\u4F8B\u7684\u55AE\u4E00\u8ECA\u4F4D\u5E73\u5747\u50F9\uFF0C\u518D\u4F9D\u672C\u6848\u8ECA\u4F4D\u6578\u6216\u8ECA\u4F4D\u576A\u6578\u500D\u6578\u8A08\u7B97\u3002"
    ]
  },
  {
    id: "loan",
    title: "\u511F\u50B5\u80FD\u529B\u5373\u6642\u8A66\u7B97",
    keywords: ["\u8CB8\u6B3E", "\u623F\u8CB8", "\u511F\u9084\u80FD\u529B", "\u511F\u50B5\u80FD\u529B", "\u6536\u652F\u6BD4", "70%", "\u6708\u4ED8"],
    answer: [
      "\u623F\u8CB8\u8A66\u7B97\u5668\u5167\u5DF2\u5408\u4F75\u300C\u511F\u50B5\u80FD\u529B\u5373\u6642\u8A66\u7B97\u300D\uFF0C\u7CFB\u7D71\u6703\u81EA\u52D5\u5E36\u5165\u672C\u6B21\u623F\u8CB8\u7533\u8ACB\u91D1\u984D\u8207 2.5% \u5229\u7387\uFF0C\u518D\u8A08\u7B97\u6708\u4ED8\u91D1\u8207\u6536\u652F\u6BD4\u3002",
      "\u8A66\u7B97\u7D50\u679C\u662F\u5167\u90E8\u8A55\u4F30\u53C3\u8003\uFF0C\u5BE6\u969B\u6838\u8CB8\u4ECD\u9700\u4EE5\u6B63\u5F0F\u6388\u4FE1\u689D\u4EF6\u8207\u9280\u884C\u5BE9\u6838\u70BA\u6E96\u3002"
    ]
  },
  {
    id: "land-tax",
    title: "\u571F\u5730\u589E\u503C\u7A05\u8A66\u7B97",
    keywords: ["\u571F\u589E\u7A05", "\u571F\u5730\u589E\u503C\u7A05", "\u6B0A\u5229\u7BC4\u570D", "\u7533\u5831\u73FE\u503C", "\u539F\u5730\u50F9", "\u6301\u6709\u5E74\u6578", "\u7A05\u7387"],
    answer: [
      "\u9801\u9762\u4E0B\u65B9\u300C\u571F\u5730\u589E\u503C\u7A05\u8A66\u7B97\u300D\u53EF\u7531\u571F\u5730\u8B04\u672C\u89E3\u6790\u571F\u5730\u9762\u7A4D\u3001\u6B0A\u5229\u7BC4\u570D\u3001\u7533\u5831\u79FB\u8F49\u73FE\u503C\u3001\u539F\u5730\u50F9\u6216\u524D\u6B21\u73FE\u503C\u8207\u6301\u6709\u5E74\u6578\u3002",
      "\u82E5\u6B0A\u5229\u7BC4\u570D\u5206\u5B50\u5206\u6BCD\u4E0D\u6B63\u78BA\uFF0C\u8ACB\u5148\u6AA2\u67E5 OCR raw \u503C\u8207\u6B04\u4F4D\u8A3A\u65B7\uFF0C\u518D\u78BA\u8A8D\u662F\u5426\u591A\u7B46\u571F\u5730\u88AB\u5408\u4F75\u3002"
    ]
  },
  {
    id: "cache",
    title: "\u5FEB\u53D6\u8207\u901F\u5EA6",
    keywords: ["\u5FEB\u53D6", "\u901F\u5EA6", "\u6162", "\u91CD\u8DD1", "\u540C\u4E00\u500B\u6A94\u6848", "cache"],
    answer: [
      "\u540C\u4E00\u500B PDF \u6216\u5716\u7247\u82E5\u6A94\u6848\u5167\u5BB9\u76F8\u540C\uFF0C\u5F8C\u7AEF JSON \u5FEB\u53D6\u53EF\u76F4\u63A5\u56DE\u50B3\u4E0A\u6B21\u89E3\u6790\u7D50\u679C\uFF0C\u901A\u5E38\u6703\u6BD4\u91CD\u65B0 OCR \u5FEB\u5F88\u591A\u3002",
      "\u5FEB\u53D6\u53EA\u4FDD\u5B58\u89E3\u6790 JSON\uFF0C\u4E0D\u4FDD\u5B58\u5927\u91CF\u5716\u7247\uFF1B\u53EF\u63A7\u5236\u5927\u5C0F\u8207\u6E05\u7406\u7B56\u7565\uFF0C\u7A7A\u9593\u58D3\u529B\u6BD4\u4FDD\u5B58\u6574\u4EFD\u5F71\u50CF\u4F4E\u3002"
    ]
  },
  {
    id: "handoff",
    title: "\u4EBA\u5DE5\u5354\u52A9",
    keywords: ["\u4EBA\u5DE5", "\u771F\u4EBA", "\u5354\u52A9", "\u9867\u554F", "\u554F\u984C", "\u56DE\u5831", "\u806F\u7D61", "\u7559\u55AE"],
    answer: [
      "\u53EF\u4EE5\uFF0C\u6211\u53EF\u4EE5\u5148\u628A\u554F\u984C\u6574\u7406\u6210\u5BA2\u670D\u7D00\u9304\u3002\u8ACB\u9EDE\u300C\u4EBA\u5DE5\u5354\u52A9\u300D\uFF0C\u586B\u5165\u7A31\u547C\u3001\u806F\u7D61\u65B9\u5F0F\u8207\u554F\u984C\u63CF\u8FF0\u3002",
      "\u76EE\u524D\u5BA2\u670D\u7D00\u9304\u6703\u540C\u6B65\u4FDD\u5B58\u5230\u5F8C\u7AEF SQLite\uFF1B\u82E5\u8A2D\u5B9A LINE \u6216 Telegram \u6191\u8B49\uFF0C\u7CFB\u7D71\u6703\u540C\u6642\u63A8\u9001\u901A\u77E5\u3002"
    ]
  }
];
var QUICK_ACTIONS = [
  { label: "OCR \u6C92\u5E36\u5165\u9580\u724C", text: "OCR \u5B8C\u6210\u5F8C\u6C92\u6709\u5E36\u5165\u5EFA\u7269\u9580\u724C\uFF0C\u8A72\u600E\u9EBC\u6AA2\u67E5\uFF1F" },
  { label: "\u6392\u5E8F\u5206\u6578", text: "\u6392\u5E8F\u5206\u6578\u600E\u9EBC\u7B97\uFF1F" },
  { label: "\u5171\u6709\u90E8\u5206\u9762\u7A4D", text: "\u5171\u6709\u90E8\u5206\u9762\u7A4D\u548C\u6B0A\u5229\u7BC4\u570D\u600E\u9EBC\u63DB\u7B97\uFF1F" },
  { label: "\u4EBA\u5DE5\u5354\u52A9", text: "\u6211\u60F3\u5EFA\u7ACB\u4EBA\u5DE5\u5354\u52A9\u7D00\u9304" }
];
function escapeHtml4(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}
function readJson(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "");
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
}
function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
  }
}
function readStringSet(key) {
  const value = readJson(key, []);
  return new Set(Array.isArray(value) ? value.map((item) => String(item || "")).filter(Boolean) : []);
}
function writeStringSet(key, value, maxItems = 240) {
  writeJson(key, Array.from(value || []).filter(Boolean).slice(-maxItems));
}
function normalizeText3(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, "").replace(/[，。！？、,.!?]/g, "");
}
function readInputValue(id) {
  return String(document.getElementById(id)?.value || "").trim();
}
function readTextValue(id) {
  return String(document.getElementById(id)?.textContent || "").trim();
}
function readMetricValue(valueId, unitId) {
  const value = readTextValue(valueId);
  if (!value || value === "--") return "";
  const unit = readTextValue(unitId);
  return unit ? `${value} ${unit}` : value;
}
function readJsonElement(id) {
  const text = String(document.getElementById(id)?.textContent || "").trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
function safeWindowObject(name) {
  try {
    const value = window[name];
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}
function truncateText(value, maxLength = 240) {
  const text = String(value || "").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}
function selectedPurposeValues() {
  return Array.from(document.querySelectorAll("#mainPurposePick input:checked")).map((input) => input.value || input.closest("label")?.textContent || "").map((value) => String(value).trim()).filter(Boolean);
}
function compactPlainObject(source, allowedKeys, maxLength = 300) {
  if (!source || typeof source !== "object") return {};
  const result = {};
  allowedKeys.forEach((key) => {
    const value = source[key];
    if (value == null || value === "") return;
    result[key] = truncateText(value, maxLength);
  });
  return result;
}
function compactFieldResults(results) {
  const labels = {
    doorplate: "\u5EFA\u7269\u9580\u724C",
    propertyAddress: "\u5EFA\u7269\u9580\u724C",
    queryAddress: "\u67E5\u8A62\u5730\u5740",
    mainArea: "\u4E3B\u5EFA\u7269\u9762\u7A4D",
    attachArea: "\u9644\u5C6C\u5EFA\u7269\u9762\u7A4D",
    commonArea: "\u5171\u6709\u90E8\u5206\u9762\u7A4D",
    landShare: "\u571F\u5730\u6301\u5206\u576A",
    parkingArea: "\u8ECA\u4F4D\u576A\u6578",
    parkingCount: "\u8ECA\u4F4D\u6578\u91CF",
    totalFloors: "\u7E3D\u6A13\u5C64",
    unitFloor: "\u6A19\u7684\u6A13\u5C64",
    buildingType: "\u5EFA\u7269\u578B\u614B",
    purpose: "\u4E3B\u8981\u7528\u9014",
    completionDate: "\u5EFA\u7BC9\u5B8C\u6210\u65E5\u671F"
  };
  const compact = {};
  Object.entries(labels).forEach(([key, label]) => {
    const item = results?.[key];
    if (!item || typeof item !== "object") return;
    compact[key] = {
      label,
      value: truncateText(item.value ?? item.text ?? "", 180),
      raw: truncateText(item.raw ?? item.rawText ?? "", 220),
      source: truncateText(item.source || item.sourceType || "", 120),
      confidence: item.confidence ?? item.score ?? null,
      status: truncateText(item.status || "", 80)
    };
  });
  return compact;
}
function compactComparableRow(row, index) {
  if (!row || typeof row !== "object") return null;
  return {
    index: index + 1,
    address: truncateText(row.address || row["\u5730\u5740"] || "", 120),
    unitPrice: row.unitPrice ?? row["\u55AE\u50F9"] ?? null,
    totalPrice: row.totalPrice ?? row["\u7E3D\u50F9"] ?? null,
    totalArea: row.totalArea ?? row["\u7E3D\u9762\u7A4D"] ?? null,
    floorInfo: truncateText(row.floorInfo || row["\u6A13\u5C64"] || "", 80),
    purpose: truncateText(row.purpose || row["\u7528\u9014"] || "", 80),
    comparableScore: row.comparableScore ?? null,
    scoreBreakdown: row.comparableScoreBreakdown || null,
    keptForAverage: Array.isArray(row.__keptForAverage) ? row.__keptForAverage : void 0
  };
}
function collectComparableSnapshot() {
  const dataset = readJsonElement("dynamicSearchDataset");
  const results = dataset?.results && typeof dataset.results === "object" ? dataset.results : {};
  const rows = Array.isArray(results.rows) ? results.rows : [];
  const keptAddresses = new Set(Array.isArray(results.kept) ? results.kept.map(String) : []);
  const compactRows = rows.slice(0, 12).map((row, index) => {
    const compact = compactComparableRow(row, index);
    if (compact) compact.keptForAverage = keptAddresses.has(String(row?.address || ""));
    return compact;
  }).filter(Boolean);
  const message = readTextValue("resultMessage");
  const explain = truncateText(readTextValue("calcExplain"), 1600);
  const recordCount = readTextValue("recordCountDisplayCard");
  const hasData = rows.length > 0 || message || explain || recordCount;
  return hasData ? {
    avgUnitPrice: results.avg ?? null,
    houseValue: results.estimate ?? null,
    rowCount: rows.length,
    keptCount: Array.isArray(results.kept) ? results.kept.length : null,
    removedCount: Array.isArray(results.removed) ? results.removed.length : null,
    recordCountDisplay: recordCount,
    message: truncateText(message, 400),
    explanation: explain,
    topRows: compactRows
  } : {};
}
function collectLandValueTaxSnapshot() {
  const taxAmount = readTextValue("ltTaxAmount");
  const status = readTextValue("ltTaxStatus");
  const parseLog = readTextValue("ltDeedParseLog");
  const fields = {
    effectiveArea: readTextValue("ltEffectiveArea"),
    transferValue: readTextValue("ltTransferValue"),
    adjustedOriginal: readTextValue("ltAdjustedOriginal"),
    cpiRatio: readTextValue("ltCpiRatio"),
    deductions: readTextValue("ltDeductions"),
    taxableGain: readTextValue("ltTaxableGain"),
    selfUseTax: readTextValue("ltSelfUseTax"),
    generalTax: readTextValue("ltGeneralTax"),
    bracket: readTextValue("ltBracket"),
    discount: readTextValue("ltDiscount")
  };
  const cleanFields = Object.fromEntries(Object.entries(fields).filter(([, value]) => value && value !== "--"));
  const hasData = taxAmount && taxAmount !== "--" || status && status !== "\u8ACB\u8F38\u5165\u8CC7\u6599\u5F8C\u8A66\u7B97" || parseLog && parseLog !== "\u5C1A\u672A\u4E0A\u50B3\u571F\u5730\u8B04\u672C\u3002" || Object.keys(cleanFields).length > 0;
  return hasData ? {
    taxAmount: taxAmount && taxAmount !== "--" ? taxAmount : "",
    status: truncateText(status, 200),
    parseLog: truncateText(parseLog, 500),
    fields: cleanFields,
    warnings: truncateText(readTextValue("ltWarnings"), 500)
  } : {};
}
function collectLoanCapacitySnapshot() {
  const root4 = document.getElementById("loanCapacityRoot");
  if (!root4) return {};
  const result = {
    annualIncome: readInputValue("loanAnnualIncome"),
    debtIncomeRatio: root4.querySelector("[data-result-ratio]")?.textContent?.trim() || "",
    status: root4.querySelector("[data-result-status]")?.textContent?.trim() || "",
    totalMonthlyPayment: root4.querySelector("[data-total-monthly]")?.textContent?.trim() || "",
    totalDebt: root4.querySelector("[data-total-debt]")?.textContent?.trim() || "",
    recurringIncome: root4.querySelector("[data-recurring-income]")?.textContent?.trim() || "",
    assetIncome: root4.querySelector("[data-asset-income]")?.textContent?.trim() || "",
    totalIncome: root4.querySelector("[data-total-income]")?.textContent?.trim() || "",
    assetTotal: root4.querySelector("[data-asset-total]")?.textContent?.trim() || ""
  };
  const clean = Object.fromEntries(Object.entries(result).filter(([, value]) => value && value !== "--" && value !== "0 \u5143" && value !== "0 \u842C\u5143" && value !== "0 \u842C\u5143/\u5E74"));
  return Object.keys(clean).length ? clean : {};
}
function collectOcrContextSnapshot() {
  const mapping = safeWindowObject("lastOcrMapping");
  const fieldResults = safeWindowObject("lastOcrFieldResults");
  const pipelineDebug = safeWindowObject("lastOcrPipelineDebug");
  const sourceFiles = Array.from(document.getElementById("sourceFile")?.files || []);
  const files = sourceFiles.map((file) => file.name).filter(Boolean).slice(0, 8);
  const fields = {
    sourceFile: files.join("\u3001") || mapping.source_file || mapping.sourceFile || "",
    propertyAddress: readInputValue("recognizedPropertyAddress") || mapping["\u5EFA\u7269\u9580\u724C"] || mapping["\u5730\u5740"] || mapping.building_address || "",
    queryAddress: readInputValue("subjectAddress") || mapping["\u67E5\u8A62\u5730\u5740"] || "",
    roadKeyword: readInputValue("roadKeyword"),
    mainArea: readInputValue("mainArea") || mapping["\u4E3B\u5EFA\u7269\u9762\u7A4D\u576A"] || "",
    attachArea: readInputValue("attachArea") || mapping["\u9644\u5C6C\u5EFA\u7269\u9762\u7A4D\u576A"] || "",
    commonArea: readInputValue("commonArea") || mapping["\u5171\u6709\u90E8\u5206\u9762\u7A4D\u576A"] || "",
    landShareArea: readInputValue("landShareArea") || mapping["\u6A19\u7684\u571F\u5730\u6301\u5206\u576A\u5408\u8A08"] || "",
    parkingArea: readInputValue("parkingArea") || mapping["\u8ECA\u4F4D\u6B0A\u72C0\u576A\u6578"] || "",
    parkingCount: readInputValue("parkingCount") || mapping["\u8ECA\u4F4D\u6578\u91CF"] || "",
    totalArea: readInputValue("totalWithParkingArea"),
    totalFloors: readInputValue("totalFloors") || mapping["\u7E3D\u6A13\u5C64\u6578"] || "",
    unitFloor: readInputValue("floorFilter") || mapping["\u6A19\u7684\u6240\u5728\u6A13\u5C64"] || mapping["\u5C64\u6B21"] || "",
    buildingType: readInputValue("houseType") || mapping["\u5EFA\u7269\u578B\u614B"] || "",
    purpose: selectedPurposeValues().join("\u3001") || mapping["\u4E3B\u8981\u7528\u9014"] || "",
    completionDate: mapping["\u5EFA\u7BC9\u5B8C\u6210\u65E5\u671F"] || "",
    avgUnitPrice: readMetricValue("avgUnitPrice", "avgUnitPriceSub"),
    houseValue: readMetricValue("houseValue", "houseValueSub"),
    ocrLog: truncateText(document.getElementById("ocrLog")?.textContent || "", 800)
  };
  const compactFields = Object.fromEntries(
    Object.entries(fields).filter(([, value]) => String(value || "").trim())
  );
  const mappingKeys = [
    "source_file",
    "\u5EFA\u7269\u9580\u724C",
    "\u67E5\u8A62\u5730\u5740",
    "\u5730\u5740",
    "\u4E3B\u5EFA\u7269\u9762\u7A4D\u576A",
    "\u9644\u5C6C\u5EFA\u7269\u9762\u7A4D\u576A",
    "\u5171\u6709\u90E8\u5206\u9762\u7A4D\u576A",
    "\u6A19\u7684\u571F\u5730\u6301\u5206\u576A\u5408\u8A08",
    "\u8ECA\u4F4D\u6B0A\u72C0\u576A\u6578",
    "\u8ECA\u4F4D\u6578\u91CF",
    "\u7E3D\u6A13\u5C64\u6578",
    "\u6A19\u7684\u6240\u5728\u6A13\u5C64",
    "\u5EFA\u7269\u578B\u614B",
    "\u4E3B\u8981\u7528\u9014",
    "\u5EFA\u7BC9\u5B8C\u6210\u65E5\u671F",
    "\u6BCF\u576A\u55AE\u50F9",
    "\u623F\u5C4B\u50F9\u503C"
  ];
  const compactResults = compactFieldResults(fieldResults);
  const valuation = {
    avgUnitPrice: readMetricValue("avgUnitPrice", "avgUnitPriceSub"),
    houseValue: readMetricValue("houseValue", "houseValueSub"),
    trimmedRange: readMetricValue("trimmedRange", "trimmedRangeSub"),
    recordCount: readTextValue("recordCountDisplayCard")
  };
  const compactValuation = Object.fromEntries(
    Object.entries(valuation).filter(([, value]) => String(value || "").trim() && String(value).trim() !== "--")
  );
  const comparableResults = collectComparableSnapshot();
  const landValueTax = collectLandValueTaxSnapshot();
  const loanCapacity = collectLoanCapacitySnapshot();
  const hasSystemContext = Object.keys(compactValuation).length > 0 || Object.keys(comparableResults).length > 0 || Object.keys(landValueTax).length > 0 || Object.keys(loanCapacity).length > 0;
  return {
    hasData: Object.keys(compactFields).length > 0 || Object.keys(compactResults).length > 0 || hasSystemContext,
    fields: compactFields,
    mapping: compactPlainObject(mapping, mappingKeys, 280),
    fieldResults: compactResults,
    valuation: compactValuation,
    comparableResults,
    landValueTax,
    loanCapacity,
    attachments: sourceFiles.slice(0, 8).map((file) => ({
      fileName: file.name,
      mimeType: file.type || "",
      size: file.size || 0,
      lastModified: file.lastModified || ""
    })),
    diagnostics: compactPlainObject(pipelineDebug, ["source", "engine", "pages", "elapsedMs", "elapsed_ms", "cache", "fastMode"], 160)
  };
}
function isOcrCaseQueryText(text, ocrContext = {}) {
  const normalized = normalizeText3(text);
  if (!normalized) return false;
  const hasOcrWord = /ocr|謄本|門牌|地址|辨識|解析|欄位|案件|主建物|附屬|共有|面積|坪數|車位/.test(normalized);
  return hasOcrWord || !!ocrContext?.hasData;
}
function selectedOcrFiles() {
  return Array.from(document.getElementById("sourceFile")?.files || []).filter((file) => {
    const type = file.type || "";
    return SUPPORT_ATTACHMENT_MIMES.has(type) || /\.(pdf|jpe?g|png|webp|heic|heif)$/i.test(file.name || "");
  }).slice(0, SUPPORT_ATTACHMENT_MAX_FILES);
}
function fileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("\u8B80\u53D6\u9644\u4EF6\u5931\u6557"));
    reader.readAsDataURL(file);
  });
}
function stripAttachmentPayloadData(attachments) {
  return (Array.isArray(attachments) ? attachments : []).map((item) => {
    const { base64, data, dataUrl, content, ...meta } = item || {};
    return meta;
  });
}
function formatAttachmentSize(size) {
  const value = Number(size || 0);
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  if (value >= 1024) return `${Math.round(value / 1024)} KB`;
  return `${value} B`;
}
function attachmentPreviewText(attachments) {
  const clean = stripAttachmentPayloadData(attachments).filter((item) => item.fileName);
  if (!clean.length) return "";
  return `\u5DF2\u9644\u4E0A OCR \u6A94\u6848\uFF1A${clean.map((item) => `${item.fileName}\uFF08${formatAttachmentSize(item.size)}\uFF09`).join("\u3001")}`;
}
function selectedOcrFileMeta(files = selectedOcrFiles()) {
  return files.map((file) => ({
    fileName: file.name,
    mimeType: file.type || "",
    size: file.size || 0,
    lastModified: file.lastModified || ""
  }));
}
function compactHash(value) {
  const text = String(value || "");
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}
function ocrOpeningSignature(files, ocrContext) {
  const fields = ocrContext?.fields || {};
  return compactHash(JSON.stringify({
    files: selectedOcrFileMeta(files),
    propertyAddress: fields.propertyAddress || fields.queryAddress || "",
    mainArea: fields.mainArea || "",
    attachArea: fields.attachArea || "",
    commonArea: fields.commonArea || "",
    avgUnitPrice: fields.avgUnitPrice || "",
    houseValue: fields.houseValue || ""
  }));
}
function hasAutoOcrOpener(signature) {
  const sent = readJson(AUTO_OCR_OPENER_KEY, []);
  return Array.isArray(sent) && sent.includes(signature);
}
function rememberAutoOcrOpener(signature) {
  const sent = readJson(AUTO_OCR_OPENER_KEY, []);
  const next = Array.isArray(sent) ? sent.filter((item) => item !== signature) : [];
  next.push(signature);
  writeJson(AUTO_OCR_OPENER_KEY, next.slice(-30));
}
function buildOcrOpeningText(files, ocrContext) {
  const fields = ocrContext?.fields || {};
  const fileNames = files.map((file) => file.name).filter(Boolean).join("\u3001");
  const areaParts = [
    fields.mainArea ? `\u4E3B\u5EFA\u7269 ${fields.mainArea}` : "",
    fields.attachArea ? `\u9644\u5C6C ${fields.attachArea}` : "",
    fields.commonArea ? `\u5171\u6709 ${fields.commonArea}` : "",
    fields.parkingArea ? `\u8ECA\u4F4D ${fields.parkingArea}` : ""
  ].filter(Boolean);
  const resultParts = [
    fields.avgUnitPrice ? `\u6BCF\u576A\u55AE\u50F9 ${fields.avgUnitPrice}` : "",
    fields.houseValue ? `\u623F\u5C4B\u50F9\u503C ${fields.houseValue}` : ""
  ].filter(Boolean);
  return [
    `\u6211\u525B\u525B\u5B8C\u6210 OCR\uFF1A${fileNames || fields.sourceFile || "\u8B04\u672C\u6A94\u6848"}\u3002`,
    fields.propertyAddress ? `\u5EFA\u7269\u9580\u724C\uFF1A${fields.propertyAddress}` : "",
    areaParts.length ? `\u576A\u6578\u6458\u8981\uFF1A${areaParts.join(" / ")}` : "",
    resultParts.length ? `\u67E5\u8A62\u7D50\u679C\uFF1A${resultParts.join(" / ")}` : "",
    "\u8ACB\u5BA2\u670D\u5354\u52A9\u67E5\u770B\u9019\u4EFD\u8B04\u672C OCR \u6848\u4EF6\u3002"
  ].filter(Boolean).join("\n");
}
async function buildOcrAttachmentPayloads(text, ocrContext = {}, options = {}) {
  const force = options.force === true;
  if (!force && !isOcrCaseQueryText(text, ocrContext)) return [];
  const files = selectedOcrFiles();
  const payloads = [];
  for (const file of files) {
    if (file.size > SUPPORT_ATTACHMENT_MAX_BYTES) {
      payloads.push({
        fileName: file.name,
        mimeType: file.type || "",
        size: file.size,
        skipped: true,
        reason: `\u9644\u4EF6\u8D85\u904E ${formatAttachmentSize(SUPPORT_ATTACHMENT_MAX_BYTES)} \u9650\u5236`
      });
      continue;
    }
    const dataUrl = await fileAsDataUrl(file);
    payloads.push({
      fileName: file.name,
      mimeType: file.type || (/\.pdf$/i.test(file.name) ? "application/pdf" : "image/jpeg"),
      size: file.size,
      lastModified: file.lastModified || "",
      base64: dataUrl
    });
  }
  return payloads;
}
function extractCaseIdFromText(text) {
  const match = String(text || "").match(/(?:案件編號|案件號碼|案號|編號|case\s*id|case|案件)\s*[：:#=]?\s*([A-Za-z0-9][A-Za-z0-9_.-]{2,80})/i) || String(text || "").match(/\b(OCR[-_A-Za-z0-9]{4,80})\b/i);
  return match ? match[1].replace(/[，。；;、)）\]】>》"'「」]+$/g, "") : "";
}
function extractCaseIdFromOcrContext(context) {
  const fields = context?.fields || {};
  const mapping = context?.mapping || {};
  return String(fields.caseId || fields.sourceFile || mapping["\u6848\u4EF6\u7DE8\u865F"] || mapping.source_file || "").trim();
}
function scoreKnowledge(query, item) {
  const text = normalizeText3(query);
  if (!text) return 0;
  return item.keywords.reduce((score, keyword) => {
    const normalized = normalizeText3(keyword);
    if (!normalized) return score;
    return score + (text.includes(normalized) ? normalized.length + 2 : 0);
  }, 0);
}
function findAnswer(message) {
  const ranked = KNOWLEDGE.map((item) => ({ item, score: scoreKnowledge(message, item) })).sort((a, b) => b.score - a.score);
  const best = ranked[0];
  if (!best || best.score <= 0) {
    return {
      title: "\u4F30\u50F9\u7CFB\u7D71\u4F7F\u7528\u5354\u52A9",
      lines: [
        "\u7533\u8ACB\u8CB8\u6B3E\u9EBB\u7169\u7559\u4E00\u4E0B\u806F\u7D61\u65B9\u5F0F\uFF0C\u6536\u5230\u60A8\u7684\u8A0A\u606F\u6703\u5118\u901F\u56DE\u8986\u60A8\u3002"
      ]
    };
  }
  return { title: best.item.title, lines: best.item.answer };
}
function createMessage(role, content, meta = "") {
  return {
    role,
    content,
    meta,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function messageTimeValue(message) {
  const time = new Date(message?.createdAt || "").getTime();
  return Number.isFinite(time) ? time : 0;
}
function latestMessageTime(messages) {
  return (Array.isArray(messages) ? messages : []).reduce((latest, message) => {
    return Math.max(latest, messageTimeValue(message));
  }, 0);
}
function normalizeRemoteSupportMessage(item, localLatestTime = 0) {
  if (!item || typeof item !== "object") return null;
  const id = String(item.id || "").trim();
  const text = String(item.text || item.content || "").trim();
  if (!id || !text) return null;
  const source = String(item.source || "").toLowerCase();
  const direction = String(item.direction || "").toLowerCase();
  const senderId = String(item.senderId || "").toLowerCase();
  if (source === "web" && (senderId === "browser" || item.conversationId === "web-support-widget")) {
    return null;
  }
  const createdAt = item.createdAt || (/* @__PURE__ */ new Date()).toISOString();
  const remoteTime = new Date(createdAt).getTime();
  if (localLatestTime && Number.isFinite(remoteTime) && remoteTime + 1e3 < localLatestTime) {
    return null;
  }
  if (source === "telegram" && direction === "inbound") {
    return {
      id,
      role: "assistant",
      content: text,
      meta: "Telegram \u5BA2\u670D",
      createdAt,
      remoteSource: source
    };
  }
  if (source === "line" && direction === "inbound") {
    return {
      id,
      role: "assistant",
      content: text,
      meta: "LINE \u5BA2\u670D",
      createdAt,
      remoteSource: source
    };
  }
  return null;
}
function formatSupportTime(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "\u672A\u8A18\u9304";
  return date.toLocaleString("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}
function localSupportDataSnapshot() {
  const intakes = readJson(INTAKES_KEY, []);
  const history = readJson(HISTORY_KEY, []);
  return {
    intakes: Array.isArray(intakes) ? intakes : [],
    history: Array.isArray(history) ? history : [],
    knowledge: KNOWLEDGE.map(({ id, title, keywords }) => ({ id, title, keywords }))
  };
}
function mergeById(primary, secondary) {
  const merged = [];
  const seen = /* @__PURE__ */ new Set();
  [...primary || [], ...secondary || []].forEach((item) => {
    const id = item?.id || JSON.stringify(item);
    if (seen.has(id)) return;
    seen.add(id);
    merged.push(item);
  });
  return merged;
}
function supportDataSnapshot() {
  const local = localSupportDataSnapshot();
  const remote = backendSnapshot || {};
  return {
    intakes: mergeById(remote.intakes, local.intakes),
    history: mergeById(remote.history, local.history),
    knowledge: local.knowledge,
    backend: {
      available: !!backendSnapshot,
      status: backendStatus
    }
  };
}
async function requestSupportApi(path, options = {}) {
  const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : 5e3;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const externalSignal = options.signal;
  const abortFromExternal = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener("abort", abortFromExternal, { once: true });
  }
  const { timeoutMs: _timeoutMs, signal: _signal, ...fetchOptions } = options;
  try {
    const response = await fetch(`${SUPPORT_API_BASE}${path}`, {
      cache: "no-store",
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options.headers || {}
      }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `\u5BA2\u670D\u5F8C\u7AEF HTTP ${response.status}`);
    return data;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(`\u5BA2\u670D\u5F8C\u7AEF\u903E\u6642\uFF08${Math.round(timeoutMs / 1e3)} \u79D2\uFF09`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
    if (externalSignal) externalSignal.removeEventListener("abort", abortFromExternal);
  }
}
async function buildAssistantReplyWithM3(text, ocrContext, conversationHistory) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch("/api/minimax/support-chat", {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        ocrContext,
        conversationHistory: Array.isArray(conversationHistory) ? conversationHistory.slice(-12) : []
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (payload?.reply) {
      return {
        text: payload.reply,
        meta: payload.ok ? "MiniMax M3 \u5BA2\u670D" : "\u672C\u6A5F\u5BA2\u670D\u5099\u63F4"
      };
    }
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
  return null;
}
function formatMinimaxReason(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/missingApiKey:minimax/.test(text)) return "\u5C1A\u672A\u8A2D\u5B9A MiniMax API Key";
  if (/timed?\s*out|timeout|逾時/i.test(text)) return "M3 \u56DE\u61C9\u903E\u6642";
  if (/RESOURCE_EXHAUSTED|quota|rate/i.test(text)) return "M3 \u984D\u5EA6\u6216\u983B\u7387\u9650\u5236\u5DF2\u9054\u4E0A\u9650";
  if (/abort/i.test(text)) return "\u8ACB\u6C42\u5DF2\u4E2D\u6B62";
  return truncateText(text, 180);
}
function summarizeMinimaxItem(item, index) {
  if (typeof item === "string") return `\u9805\u76EE ${index + 1}\uFF1A${truncateText(item, 260)}`;
  if (!item || typeof item !== "object") return `\u9805\u76EE ${index + 1}\uFF1A${truncateText(JSON.stringify(item), 260)}`;
  const preferredKeys = [
    "category",
    "field",
    "issue",
    "risk",
    "reason",
    "suggestion",
    "fix",
    "task",
    "expected",
    "priority"
  ];
  const labels = {
    category: "\u5206\u985E",
    field: "\u6B04\u4F4D",
    issue: "\u554F\u984C",
    risk: "\u98A8\u96AA",
    reason: "\u539F\u56E0",
    suggestion: "\u5EFA\u8B70",
    fix: "\u4FEE\u6B63",
    task: "\u4EFB\u52D9",
    expected: "\u9810\u671F",
    priority: "\u512A\u5148"
  };
  const parts = preferredKeys.filter((key) => item[key] != null && item[key] !== "").map((key) => `${labels[key] || key}\uFF1A${truncateText(item[key], 120)}`);
  if (parts.length) return parts.join("\uFF1B");
  return truncateText(JSON.stringify(item), 260);
}
function renderMinimaxAdminResult(kind, payload) {
  const data = payload && typeof payload === "object" ? payload : {};
  const list = kind === "regression_task" ? Array.isArray(data.tasks) ? data.tasks : [] : Array.isArray(data.items) ? data.items : [];
  const warnings = Array.isArray(data.warnings) ? data.warnings.map(formatMinimaxReason).filter(Boolean) : [];
  const fallbackReason = formatMinimaxReason(data.fallbackReason || data.error || "");
  const title = kind === "regression_task" ? "M3 \u4FEE\u6B63\u4EFB\u52D9" : "M3 \u932F\u6848\u5206\u6790";
  const status = data.ok ? "M3 \u5DF2\u5B8C\u6210\u5206\u6790" : `M3 \u672A\u5B8C\u6210\uFF0C\u66AB\u63A1\u5F8C\u53F0\u672C\u6A5F\u8CC7\u6599${fallbackReason ? `\uFF1A${fallbackReason}` : ""}`;
  const listHtml = list.length ? list.slice(0, 12).map((item, index) => `
      <li>${escapeHtml4(summarizeMinimaxItem(item, index))}</li>
    `).join("") : `<li>${data.ok ? "M3 \u672A\u5217\u51FA\u9700\u8655\u7406\u9805\u76EE\u3002" : "\u53EF\u7A0D\u5F8C\u91CD\u8A66\uFF0C\u6216\u5148\u4F9D\u76EE\u524D\u6B04\u4F4D\u8A3A\u65B7\u4EBA\u5DE5\u8907\u6838\u3002"}</li>`;
  const warningHtml = warnings.length ? `<p class="support-admin-m3-warning">\u63D0\u9192\uFF1A${escapeHtml4(warnings.slice(0, 3).join("\uFF1B"))}</p>` : "";
  return `
    <article class="support-admin-card support-admin-m3-result">
      <strong>${escapeHtml4(title)}</strong>
      <span>${escapeHtml4(status)}${data.model ? ` \xB7 ${escapeHtml4(data.model)}` : ""}</span>
      <ul>${listHtml}</ul>
      ${warningHtml}
    </article>
  `;
}
function summarizeMinimaxAudit(log, index) {
  if (!log || typeof log !== "object") return `\u7D00\u9304 ${index + 1}\uFF1A\u683C\u5F0F\u4E0D\u5B8C\u6574`;
  const payload = log.payload && typeof log.payload === "object" ? log.payload : {};
  const request = payload.request && typeof payload.request === "object" ? payload.request : {};
  const kind = log.kind || "audit";
  const status = payload.status ? `\u72C0\u614B\uFF1A${payload.status}` : "";
  const reason = formatMinimaxReason(payload.reason || payload.fallbackReason || "");
  const requestKeys = Object.keys(request).slice(0, 5).join("\u3001");
  return [
    `${kind} \xB7 ${formatSupportTime(log.createdAt)}`,
    status,
    reason ? `\u539F\u56E0\uFF1A${reason}` : "",
    requestKeys ? `\u8CC7\u6599\uFF1A${requestKeys}` : ""
  ].filter(Boolean).join("\uFF1B");
}
function renderMinimaxAuditResult(payload) {
  const data = payload && typeof payload === "object" ? payload : {};
  const logs = Array.isArray(data.logs) ? data.logs : [];
  const summary = data.summary && typeof data.summary === "object" ? data.summary : {};
  const byKind = summary.byKind && typeof summary.byKind === "object" ? Object.entries(summary.byKind).map(([key, value]) => `${key} ${value}`).join("\u3001") : "";
  const byStatus = summary.byStatus && typeof summary.byStatus === "object" ? Object.entries(summary.byStatus).map(([key, value]) => `${key} ${value}`).join("\u3001") : "";
  const errors = summary.errorReasons && typeof summary.errorReasons === "object" ? Object.entries(summary.errorReasons).slice(0, 3).map(([key, value]) => `${formatMinimaxReason(key)} ${value}`).join("\u3001") : "";
  const summaryHtml = `
    <p class="support-admin-m3-warning">
      \u7D71\u8A08\uFF1A\u6383\u63CF ${escapeHtml4(summary.totalScanned ?? logs.length)} \u7B46\uFF1B\u72C0\u614B ${escapeHtml4(byStatus || "\u7121")}\uFF1B\u985E\u578B ${escapeHtml4(byKind || "\u7121")}${errors ? `\uFF1B\u5E38\u898B\u539F\u56E0 ${escapeHtml4(errors)}` : ""}
    </p>
  `;
  const listHtml = logs.length ? logs.slice(0, 20).map((log, index) => `<li>${escapeHtml4(summarizeMinimaxAudit(log, index))}</li>`).join("") : "<li>\u76EE\u524D\u5C1A\u7121 M3 \u6C7A\u7B56\u7D00\u9304\u3002</li>";
  return `
    <article class="support-admin-card support-admin-m3-result">
      <strong>M3 \u6C7A\u7B56\u7D00\u9304</strong>
      <span>\u6700\u8FD1 ${logs.length} \u7B46\uFF0C\u53EF\u7528\u65BC\u56DE\u653E\u8207\u4EBA\u5DE5\u5BE9\u67E5</span>
      ${summaryHtml}
      <ul>${listHtml}</ul>
    </article>
  `;
}
async function refreshBackendSnapshot() {
  try {
    const [status, data] = await Promise.all([
      requestSupportApi("/status"),
      requestSupportApi("/intakes?limit=100")
    ]);
    backendStatus = status;
    backendSnapshot = {
      intakes: Array.isArray(data.intakes) ? data.intakes : [],
      history: Array.isArray(data.history) ? data.history : []
    };
    return supportDataSnapshot();
  } catch (error) {
    backendStatus = { status: "offline", error: error?.message || String(error) };
    return supportDataSnapshot();
  }
}
async function syncIntakeToBackend(record, options = {}) {
  try {
    const data = await requestSupportApi("/intake", {
      method: "POST",
      body: JSON.stringify({
        ...record,
        attachments: options.attachments || record.attachments || []
      })
    });
    await refreshBackendSnapshot();
    return data;
  } catch (error) {
    return {
      status: "offline",
      error: error?.message || String(error)
    };
  }
}
async function syncMessageToBackend(message, context = {}) {
  const ocrContext = context.ocrContext || collectOcrContextSnapshot();
  const conversationHistory = Array.isArray(context.conversationHistory) ? context.conversationHistory.slice(-10) : [];
  const caseId = extractCaseIdFromText(message.content || message.text || "") || extractCaseIdFromOcrContext(ocrContext);
  let attachments = [];
  try {
    attachments = await buildOcrAttachmentPayloads(message.content || message.text || "", ocrContext, {
      force: context.forceAttachments === true
    });
  } catch (error) {
    attachments = [{
      fileName: "OCR \u9644\u4EF6",
      mimeType: "",
      size: 0,
      skipped: true,
      reason: error?.message || "\u9644\u4EF6\u8B80\u53D6\u5931\u6557"
    }];
  }
  try {
    const data = await requestSupportApi("/message", {
      method: "POST",
      body: JSON.stringify({
        source: "web",
        direction: "inbound",
        role: message.role || "user",
        text: message.content || "",
        createdAt: message.createdAt,
        conversationId: "web-support-widget",
        senderId: "browser",
        caseId,
        ocrContext,
        conversationHistory,
        attachments
      })
    });
    await refreshBackendSnapshot();
    return data;
  } catch (error) {
    backendStatus = { status: "offline", error: error?.message || String(error) };
    return {
      status: "offline",
      error: error?.message || String(error)
    };
  }
}
function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
function createWidgetShell() {
  const root4 = document.createElement("section");
  root4.id = "supportWidget";
  root4.className = "support-widget";
  root4.setAttribute("aria-label", "\u4F30\u50F9\u7CFB\u7D71\u667A\u80FD\u5BA2\u670D");
  root4.innerHTML = `
    <div class="support-launch-row">
      <button id="supportAdminToggle" class="support-admin-toggle" type="button" aria-expanded="false" aria-controls="supportAdminPanel">\u5BA2\u670D\u5F8C\u53F0</button>
      <button id="supportChatToggle" class="support-toggle" type="button" aria-expanded="false" aria-controls="supportChatPanel">
        <span class="support-toggle-mark" aria-hidden="true">?</span>
        <span>\u667A\u80FD\u5BA2\u670D</span>
      </button>
    </div>
    <div id="supportAdminPanel" class="support-admin-panel" role="dialog" aria-modal="false" aria-labelledby="supportAdminTitle">
      <div class="support-admin-head">
        <div>
          <h2 id="supportAdminTitle">\u667A\u80FD\u5BA2\u670D\u5F8C\u53F0</h2>
          <p>\u5BA2\u670D\u7D00\u9304\u3001M3 \u932F\u6848\u5206\u6790\u8207\u77E5\u8B58\u5EAB\u6AA2\u8996</p>
        </div>
        <button id="supportAdminCloseBtn" class="support-icon-btn" type="button" aria-label="\u95DC\u9589\u5BA2\u670D\u5F8C\u53F0">\xD7</button>
      </div>
      <div class="support-admin-body">
        <div id="supportAdminSummary" class="support-admin-summary"></div>
        <section class="support-admin-section">
          <h3>\u901A\u77E5\u8A2D\u5B9A</h3>
          <div id="supportAdminNotify" class="support-admin-list support-admin-notify-list"></div>
        </section>
        <section class="support-admin-section support-admin-m3-section">
          <h3>MiniMax M3 \u4E2D\u6A1E</h3>
          <div class="support-admin-m3-actions">
            <button id="supportAdminM3ReviewBtn" class="support-secondary-btn" type="button">M3 \u932F\u6848\u5206\u6790</button>
            <button id="supportAdminM3RegressionBtn" class="support-secondary-btn" type="button">\u7522\u751F\u4FEE\u6B63\u4EFB\u52D9</button>
            <button id="supportAdminM3AuditBtn" class="support-ghost-btn" type="button">\u6700\u8FD1\u6C7A\u7B56\u7D00\u9304</button>
          </div>
          <div id="supportAdminM3Report" class="support-admin-list support-admin-m3-report">
            <div class="support-admin-empty">\u5C1A\u672A\u7522\u751F M3 \u7BA1\u7406\u5831\u544A\u3002</div>
          </div>
        </section>
        <section class="support-admin-section">
          <h3>\u4EBA\u5DE5\u5354\u52A9\u7D00\u9304</h3>
          <div id="supportAdminIntakes" class="support-admin-list"></div>
        </section>
        <section class="support-admin-section">
          <h3>\u6700\u8FD1\u5C0D\u8A71</h3>
          <div id="supportAdminHistory" class="support-admin-list"></div>
        </section>
        <section class="support-admin-section">
          <h3>\u77E5\u8B58\u5EAB\u4E3B\u984C</h3>
          <div id="supportAdminKnowledge" class="support-admin-list"></div>
        </section>
        <div class="support-admin-actions">
          <button id="supportAdminRefreshBtn" class="support-ghost-btn" type="button">\u91CD\u65B0\u6574\u7406</button>
          <button id="supportAdminExportBtn" class="support-secondary-btn" type="button">\u532F\u51FA JSON</button>
          <button id="supportAdminClearIntakesBtn" class="support-ghost-btn" type="button">\u6E05\u7A7A\u7559\u55AE</button>
        </div>
      </div>
    </div>
    <div id="supportChatPanel" class="support-panel" role="dialog" aria-modal="false" aria-labelledby="supportChatTitle">
      <div class="support-head">
        <div>
          <h2 id="supportChatTitle">\u4F30\u50F9\u7CFB\u7D71\u667A\u80FD\u5BA2\u670D</h2>
          <p>\u8B04\u672C OCR\u3001\u6B04\u4F4D\u8A3A\u65B7\u3001\u6BD4\u8F03\u6848\u4F8B\u6392\u5E8F\u8207\u8A66\u7B97\u5354\u52A9</p>
        </div>
        <button id="supportCloseBtn" class="support-icon-btn" type="button" aria-label="\u95DC\u9589\u667A\u80FD\u5BA2\u670D">\xD7</button>
      </div>
      <div id="supportMessages" class="support-messages" aria-live="polite"></div>
      <div class="support-quick-row">
        ${QUICK_ACTIONS.map((item) => `<button type="button" class="support-chip" data-support-fill="${escapeHtml4(item.text)}">${escapeHtml4(item.label)}</button>`).join("")}
      </div>
      <form id="supportChatForm" class="support-composer">
        <textarea id="supportChatInput" rows="2" maxlength="800" placeholder="\u8F38\u5165\u554F\u984C\uFF0C\u4F8B\u5982\uFF1A\u6392\u5E8F\u5206\u6578\u600E\u9EBC\u7B97\uFF1F"></textarea>
        <button id="supportSendBtn" type="submit">\u9001\u51FA</button>
      </form>
      <div class="support-handoff">
        <button id="supportHandoffBtn" class="support-secondary-btn" type="button">\u4EBA\u5DE5\u5354\u52A9</button>
        <button id="supportClearBtn" class="support-ghost-btn" type="button">\u6E05\u7A7A\u5C0D\u8A71</button>
      </div>
      <form id="supportLeadForm" class="support-lead-form is-hidden">
        <label>\u7A31\u547C<input id="supportLeadName" autocomplete="name"></label>
        <label>\u806F\u7D61\u65B9\u5F0F<input id="supportLeadContact" autocomplete="email tel" placeholder="\u96FB\u8A71 / Email / LINE"></label>
        <label>\u554F\u984C\u63CF\u8FF0<textarea id="supportLeadNote" rows="3"></textarea></label>
        <button id="supportLeadSubmit" type="submit">\u5EFA\u7ACB\u5BA2\u670D\u7D00\u9304</button>
        <div id="supportLeadStatus" class="support-lead-status" aria-live="polite"></div>
      </form>
    </div>
  `;
  document.body.append(root4);
  return root4;
}
function supportWidget() {
  let messages = readJson(HISTORY_KEY, []);
  if (!Array.isArray(messages) || !messages.length) {
    messages = [createMessage(
      "assistant",
      "\u60A8\u597D\uFF0C\u6211\u662F\u4F30\u50F9\u7CFB\u7D71\u667A\u80FD\u5BA2\u670D\u3002\u7533\u8ACB\u8CB8\u6B3E\u9EBB\u7169\u7559\u4E00\u4E0B\u806F\u7D61\u65B9\u5F0F\uFF0C\u6536\u5230\u60A8\u7684\u8A0A\u606F\u6703\u5118\u901F\u56DE\u8986\u60A8\u3002",
      "\u672C\u6A5F\u5BA2\u670D"
    )];
  }
  const root4 = createWidgetShell();
  const panel = root4.querySelector("#supportChatPanel");
  const toggle = root4.querySelector("#supportChatToggle");
  const closeBtn = root4.querySelector("#supportCloseBtn");
  const adminPanel = root4.querySelector("#supportAdminPanel");
  const adminToggle = root4.querySelector("#supportAdminToggle");
  const adminCloseBtn = root4.querySelector("#supportAdminCloseBtn");
  const adminSummary = root4.querySelector("#supportAdminSummary");
  const adminNotify = root4.querySelector("#supportAdminNotify");
  const adminM3Report = root4.querySelector("#supportAdminM3Report");
  const adminM3ReviewBtn = root4.querySelector("#supportAdminM3ReviewBtn");
  const adminM3RegressionBtn = root4.querySelector("#supportAdminM3RegressionBtn");
  const adminM3AuditBtn = root4.querySelector("#supportAdminM3AuditBtn");
  const adminIntakes = root4.querySelector("#supportAdminIntakes");
  const adminHistory = root4.querySelector("#supportAdminHistory");
  const adminKnowledge = root4.querySelector("#supportAdminKnowledge");
  const messagesEl = root4.querySelector("#supportMessages");
  const form = root4.querySelector("#supportChatForm");
  const input = root4.querySelector("#supportChatInput");
  const leadForm = root4.querySelector("#supportLeadForm");
  const leadStatus = root4.querySelector("#supportLeadStatus");
  let remoteMessageSeenIds = readStringSet(REMOTE_MESSAGE_SEEN_KEY);
  let remoteMessageSyncing = false;
  function saveMessages() {
    writeJson(HISTORY_KEY, messages.slice(-40));
  }
  function renderMessages() {
    messagesEl.innerHTML = messages.map((message) => {
      const role = message.role === "user" ? "user" : "assistant";
      const meta = message.meta ? `<div class="support-message-meta">${escapeHtml4(message.meta)}</div>` : "";
      return `<div class="support-message ${role}"><div class="support-bubble">${escapeHtml4(message.content)}</div>${meta}</div>`;
    }).join("");
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
  async function syncRemoteSupportMessages(options = {}) {
    if (remoteMessageSyncing) return 0;
    remoteMessageSyncing = true;
    try {
      const payload = await requestSupportApi("/messages?limit=80");
      const history = Array.isArray(payload.history) ? payload.history : [];
      const localLatestTime = latestMessageTime(messages);
      let appended = 0;
      history.slice().reverse().forEach((item) => {
        const id = String(item?.id || "").trim();
        if (!id || remoteMessageSeenIds.has(id)) return;
        const remote = normalizeRemoteSupportMessage(item, localLatestTime);
        remoteMessageSeenIds.add(id);
        if (!remote) return;
        const remoteTime = messageTimeValue(remote);
        if (options.baselineOnly && (!localLatestTime || remoteTime <= localLatestTime + 1e3)) return;
        messages.push(remote);
        appended += 1;
      });
      writeStringSet(REMOTE_MESSAGE_SEEN_KEY, remoteMessageSeenIds);
      if (appended) {
        saveMessages();
        renderMessages();
        if (adminPanel.classList.contains("is-open")) {
          await refreshBackendSnapshot();
          renderAdmin();
        }
      }
      return appended;
    } catch {
      return 0;
    } finally {
      remoteMessageSyncing = false;
    }
  }
  function renderOcrIntakeSummary(item) {
    const fields = item?.ocrContext?.fields || {};
    const pieces = [
      fields.propertyAddress ? `\u9580\u724C\uFF1A${fields.propertyAddress}` : "",
      fields.mainArea ? `\u4E3B\u5EFA\u7269\uFF1A${fields.mainArea}` : "",
      fields.attachArea ? `\u9644\u5C6C\uFF1A${fields.attachArea}` : "",
      fields.commonArea ? `\u5171\u6709\uFF1A${fields.commonArea}` : "",
      fields.parkingArea ? `\u8ECA\u4F4D\uFF1A${fields.parkingArea}` : "",
      fields.buildingType ? `\u578B\u614B\uFF1A${fields.buildingType}` : "",
      fields.purpose ? `\u7528\u9014\uFF1A${fields.purpose}` : "",
      fields.avgUnitPrice ? `\u6BCF\u576A\u55AE\u50F9\uFF1A${fields.avgUnitPrice}` : "",
      fields.houseValue ? `\u623F\u5C4B\u50F9\u503C\uFF1A${fields.houseValue}` : ""
    ].filter(Boolean);
    return pieces.length ? `<p class="support-admin-ocr">OCR\uFF1A${escapeHtml4(pieces.join(" / "))}</p>` : "";
  }
  function renderRelatedMessageSummary(item) {
    const related = Array.isArray(item?.relatedMessages) ? item.relatedMessages : [];
    const text = related.slice(-3).map((message) => message.content || message.text || "").filter(Boolean).map((message) => truncateText(message, 80)).join(" / ");
    return text ? `<p class="support-admin-chat">\u5C0D\u8A71\uFF1A${escapeHtml4(text)}</p>` : "";
  }
  function renderAttachmentLinks(item) {
    const attachments = Array.isArray(item?.attachments) ? item.attachments : [];
    const links = attachments.filter((attachment) => attachment?.fileName && attachment?.url && !attachment.skipped);
    const skipped = attachments.filter((attachment) => attachment?.skipped && attachment?.fileName);
    const linkHtml = links.map((attachment) => `
      <a class="support-admin-attachment" href="${escapeHtml4(attachment.url)}" target="_blank" rel="noopener">
        \u67E5\u770B\u539F\u59CB\u6A94\uFF1A${escapeHtml4(attachment.fileName)}\uFF08${escapeHtml4(formatAttachmentSize(attachment.size))}\uFF09
      </a>
    `).join("");
    const skippedHtml = skipped.map((attachment) => `
      <span class="support-admin-attachment is-skipped">
        ${escapeHtml4(attachment.fileName)}\uFF1A${escapeHtml4(attachment.reason || "\u672A\u4FDD\u5B58")}
      </span>
    `).join("");
    return linkHtml || skippedHtml ? `<div class="support-admin-attachments">${linkHtml}${skippedHtml}</div>` : "";
  }
  function renderAdminNotificationStatus(snapshot) {
    const status = snapshot.backend.status || {};
    const storage = status.storage || {};
    const telegram = status.telegram || {};
    const line = status.line || {};
    const localMode = snapshot.backend.available ? "" : "\u5F8C\u7AEF\u672A\u9023\u7DDA\uFF0C\u4F7F\u7528\u672C\u6A5F\u66AB\u5B58\u3002";
    return `
      <article class="support-admin-card support-admin-topic">
        <strong>\u5F8C\u7AEF\u4FDD\u5B58</strong>
        <span>${snapshot.backend.available ? "\u5DF2\u9023\u7DDA" : "\u672A\u9023\u7DDA"}${storage.type ? ` \xB7 ${escapeHtml4(storage.type)}` : ""}</span>
        <p>${escapeHtml4(storage.available ? "\u8CC7\u6599\u5EAB\u53EF\u7528\uFF0C\u7559\u55AE\u8207\u5C0D\u8A71\u53EF\u540C\u6B65\u4FDD\u5B58\u3002" : localMode || "\u5F8C\u7AEF\u72C0\u614B\u672A\u56DE\u5831\u3002")}</p>
      </article>
      <article class="support-admin-card support-admin-topic">
        <strong>Telegram</strong>
        <span>${telegram.configured ? "\u5DF2\u8A2D\u5B9A\uFF0C\u53EF\u63A8\u9001\u901A\u77E5" : "\u672A\u5B8C\u6574\u8A2D\u5B9A"}</span>
        <p>Bot Token\uFF1A${telegram.botToken ? "\u5DF2\u8A2D\u5B9A" : "\u672A\u8A2D\u5B9A"} / Chat ID\uFF1A${telegram.chatId ? "\u5DF2\u8A2D\u5B9A" : "\u672A\u8A2D\u5B9A"} / Webhook Secret\uFF1A${telegram.webhookSecret ? "\u5DF2\u8A2D\u5B9A" : "\u672A\u8A2D\u5B9A"}</p>
      </article>
      <article class="support-admin-card support-admin-topic">
        <strong>LINE</strong>
        <span>${line.configured || line.pushConfigured ? "\u5DF2\u8A2D\u5B9A" : "\u672A\u8A2D\u5B9A"}</span>
        <p>Channel Token\uFF1A${line.channelAccessToken ? "\u5DF2\u8A2D\u5B9A" : "\u672A\u8A2D\u5B9A"} / Channel Secret\uFF1A${line.channelSecret ? "\u5DF2\u8A2D\u5B9A" : "\u672A\u8A2D\u5B9A"} / Push Target\uFF1A${line.pushTarget ? "\u5DF2\u8A2D\u5B9A" : "\u672A\u8A2D\u5B9A"}</p>
      </article>
    `;
  }
  function compactAdminRecord(item) {
    return {
      id: item?.id || "",
      caseId: item?.caseId || "",
      source: item?.source || "",
      role: item?.role || "",
      note: truncateText(item?.note || item?.content || item?.text || "", 500),
      createdAt: item?.createdAt || "",
      ocrContext: item?.ocrContext || item?.raw?.ocrContext || {},
      attachments: stripAttachmentPayloadData(item?.attachments || [])
    };
  }
  function buildMinimaxAdminPayload(kind) {
    const snapshot = supportDataSnapshot();
    const ocrContext = collectOcrContextSnapshot();
    const issueKeywords = /OCR|謄本|門牌|面積|樓層|建物型態|共有|車位|錯|失敗|人工|確認/i;
    return {
      source: "support-widget-admin",
      mode: kind,
      generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      ocrContext,
      summary: {
        intakeCount: snapshot.intakes.length,
        historyCount: snapshot.history.length,
        backendAvailable: !!snapshot.backend.available,
        backendStatus: snapshot.backend.status || {},
        currentCaseHasOcrData: !!ocrContext.hasData
      },
      recentIssues: snapshot.history.filter((item) => issueKeywords.test(item?.content || item?.text || item?.note || "")).slice(-12).map(compactAdminRecord),
      intakes: snapshot.intakes.slice(-12).map(compactAdminRecord),
      history: snapshot.history.slice(-16).map(compactAdminRecord),
      knowledgeTopics: snapshot.knowledge.map((item) => ({ id: item.id, title: item.title }))
    };
  }
  async function requestMinimaxAdminAction(kind) {
    const endpoint = kind === "regression_task" ? "/api/minimax/regression-task" : "/api/minimax/admin-review";
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25e3);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        cache: "no-store",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildMinimaxAdminPayload(kind))
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
      return payload;
    } finally {
      clearTimeout(timer);
    }
  }
  async function requestMinimaxAuditLogs() {
    const response = await fetch("/api/minimax/audit", {
      method: "GET",
      cache: "no-store",
      headers: { "Accept": "application/json" }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
    return payload;
  }
  async function runMinimaxAdminAction(kind) {
    const buttons = [adminM3ReviewBtn, adminM3RegressionBtn, adminM3AuditBtn].filter(Boolean);
    buttons.forEach((button) => {
      button.disabled = true;
    });
    adminM3Report.innerHTML = `<div class="support-admin-empty">M3 \u5206\u6790\u4E2D\uFF0C\u8ACB\u7A0D\u5019...</div>`;
    try {
      const payload = await requestMinimaxAdminAction(kind);
      adminM3Report.innerHTML = renderMinimaxAdminResult(kind, payload);
    } catch (error) {
      adminM3Report.innerHTML = renderMinimaxAdminResult(kind, {
        ok: false,
        fallbackReason: error?.name === "AbortError" ? "M3 \u56DE\u61C9\u903E\u6642" : error?.message || String(error)
      });
    } finally {
      buttons.forEach((button) => {
        button.disabled = false;
      });
    }
  }
  async function runMinimaxAuditView() {
    const buttons = [adminM3ReviewBtn, adminM3RegressionBtn, adminM3AuditBtn].filter(Boolean);
    buttons.forEach((button) => {
      button.disabled = true;
    });
    adminM3Report.innerHTML = `<div class="support-admin-empty">\u6B63\u5728\u8B80\u53D6 M3 \u6C7A\u7B56\u7D00\u9304...</div>`;
    try {
      const payload = await requestMinimaxAuditLogs();
      adminM3Report.innerHTML = renderMinimaxAuditResult(payload);
    } catch (error) {
      adminM3Report.innerHTML = renderMinimaxAdminResult("admin_review", {
        ok: false,
        fallbackReason: error?.message || String(error)
      });
    } finally {
      buttons.forEach((button) => {
        button.disabled = false;
      });
    }
  }
  function renderAdmin() {
    const snapshot = supportDataSnapshot();
    const telegramReady = snapshot.backend.status?.telegram?.configured;
    const lineReady = snapshot.backend.status?.line?.configured || snapshot.backend.status?.line?.pushConfigured;
    const notifyCount = [telegramReady, lineReady].filter(Boolean).length;
    adminSummary.innerHTML = `
      <div><strong>${snapshot.intakes.length}</strong><span>\u7559\u55AE</span></div>
      <div><strong>${snapshot.history.length}</strong><span>\u5C0D\u8A71\u8A0A\u606F</span></div>
      <div><strong>${notifyCount}</strong><span>\u901A\u77E5\u901A\u9053</span></div>
    `;
    adminNotify.innerHTML = renderAdminNotificationStatus(snapshot);
    adminIntakes.innerHTML = snapshot.intakes.length ? snapshot.intakes.slice().reverse().map((item) => `
        <article class="support-admin-card">
          <strong>${escapeHtml4(item.name || "\u672A\u586B\u7A31\u547C")}</strong>
          ${item.caseId ? `<span>\u6848\u4EF6\uFF1A${escapeHtml4(item.caseId)}</span>` : ""}
          <span>${escapeHtml4(item.contact || "\u672A\u586B\u806F\u7D61\u65B9\u5F0F")} \xB7 ${escapeHtml4(formatSupportTime(item.createdAt))}</span>
          <p>${escapeHtml4(item.note || "\u672A\u586B\u554F\u984C\u63CF\u8FF0")}</p>
          ${renderOcrIntakeSummary(item)}
          ${renderRelatedMessageSummary(item)}
          ${renderAttachmentLinks(item)}
          <small>${escapeHtml4(item.id || "")}</small>
        </article>
      `).join("") : `<div class="support-admin-empty">\u76EE\u524D\u5C1A\u7121\u4EBA\u5DE5\u5354\u52A9\u7D00\u9304\u3002</div>`;
    adminHistory.innerHTML = snapshot.history.length ? snapshot.history.slice(-8).reverse().map((item) => `
        <article class="support-admin-card">
          <strong>${item.role === "user" ? "\u4F7F\u7528\u8005" : "\u5BA2\u670D"}</strong>
          <span>${escapeHtml4(item.meta || item.source || "\u672C\u6A5F\u5C0D\u8A71")} \xB7 ${escapeHtml4(formatSupportTime(item.createdAt))}</span>
          <p>${escapeHtml4(item.content || item.text || "")}</p>
          ${renderAttachmentLinks(item)}
        </article>
      `).join("") : `<div class="support-admin-empty">\u76EE\u524D\u5C1A\u7121\u5C0D\u8A71\u7D00\u9304\u3002</div>`;
    adminKnowledge.innerHTML = snapshot.knowledge.map((item) => `
      <article class="support-admin-card support-admin-topic">
        <strong>${escapeHtml4(item.title)}</strong>
        <span>${escapeHtml4(item.id)} \xB7 ${item.keywords.length} \u500B\u95DC\u9375\u5B57</span>
      </article>
    `).join("");
  }
  function setOpen(open) {
    if (open) {
      adminPanel.classList.remove("is-open");
      adminToggle.setAttribute("aria-expanded", "false");
    }
    panel.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      setTimeout(() => input.focus(), 0);
      maybeSendOcrOpeningMessage();
      syncRemoteSupportMessages();
    }
  }
  function setAdminOpen(open) {
    if (open) {
      panel.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      renderAdmin();
      refreshBackendSnapshot().then(() => {
        if (adminPanel.classList.contains("is-open")) renderAdmin();
      });
    }
    adminPanel.classList.toggle("is-open", open);
    adminToggle.setAttribute("aria-expanded", open ? "true" : "false");
  }
  function replyTo(message) {
    const answer = findAnswer(message);
    const content = answer.lines.join("\n");
    messages.push(createMessage("assistant", content, answer.title));
  }
  async function sendMessage(raw) {
    const text = String(raw || "").trim();
    if (!text) return;
    const ocrContext = collectOcrContextSnapshot();
    const filePreview = isOcrCaseQueryText(text, ocrContext) ? attachmentPreviewText(selectedOcrFileMeta()) : "";
    const userMessage = createMessage("user", text, filePreview);
    const conversationHistory = [...messages.slice(-8), userMessage];
    messages.push(userMessage);
    saveMessages();
    renderMessages();
    syncMessageToBackend(userMessage, { ocrContext, conversationHistory }).then(() => {
      if (adminPanel.classList.contains("is-open")) renderAdmin();
    });
    if (/人工|真人|顧問|聯絡|留單|協助/.test(text)) {
      leadForm.classList.remove("is-hidden");
      root4.querySelector("#supportLeadNote").value = text;
    }
    const m3Reply = await buildAssistantReplyWithM3(text, ocrContext, conversationHistory);
    if (m3Reply?.text) {
      messages.push(createMessage("assistant", m3Reply.text, m3Reply.meta));
    } else {
      replyTo(text);
    }
    saveMessages();
    renderMessages();
  }
  function maybeSendOcrOpeningMessage() {
    const files = selectedOcrFiles();
    const ocrContext = collectOcrContextSnapshot();
    if (!files.length || !ocrContext.hasData) return;
    const signature = ocrOpeningSignature(files, ocrContext);
    if (hasAutoOcrOpener(signature)) return;
    const text = buildOcrOpeningText(files, ocrContext);
    const filePreview = attachmentPreviewText(selectedOcrFileMeta(files));
    const userMessage = createMessage("user", text, filePreview);
    const conversationHistory = [...messages.slice(-8), userMessage];
    messages.push(userMessage);
    rememberAutoOcrOpener(signature);
    saveMessages();
    renderMessages();
    syncMessageToBackend(userMessage, {
      ocrContext,
      conversationHistory,
      forceAttachments: true
    }).then(() => {
      if (adminPanel.classList.contains("is-open")) renderAdmin();
    });
  }
  async function saveLead(event) {
    event.preventDefault();
    const name = root4.querySelector("#supportLeadName").value.trim();
    const contact = root4.querySelector("#supportLeadContact").value.trim();
    const note = root4.querySelector("#supportLeadNote").value.trim();
    const intakes = readJson(INTAKES_KEY, []);
    const ocrContext = collectOcrContextSnapshot();
    let attachmentPayloads = [];
    try {
      attachmentPayloads = await buildOcrAttachmentPayloads(note || "OCR \u6848\u4EF6\u4EBA\u5DE5\u7559\u55AE", ocrContext, { force: !!ocrContext.hasData });
    } catch (error) {
      attachmentPayloads = [{
        fileName: "OCR \u9644\u4EF6",
        mimeType: "",
        size: 0,
        skipped: true,
        reason: error?.message || "\u9644\u4EF6\u8B80\u53D6\u5931\u6557"
      }];
    }
    const attachmentMeta = stripAttachmentPayloadData(attachmentPayloads);
    const record = {
      id: `support-${Date.now().toString(36)}`,
      source: "web",
      name,
      contact,
      note,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      caseId: extractCaseIdFromText(note) || extractCaseIdFromOcrContext(ocrContext),
      ocrContext,
      lastMessages: messages.slice(-8),
      relatedMessages: messages.slice(-8),
      attachments: attachmentMeta
    };
    writeJson(INTAKES_KEY, Array.isArray(intakes) ? [...intakes, record].slice(-30) : [record]);
    leadStatus.textContent = `\u5DF2\u5EFA\u7ACB\u5BA2\u670D\u7D00\u9304\uFF0C\u6B63\u5728\u540C\u6B65\u5F8C\u7AEF\uFF1A${record.id}`;
    const backendResult = await syncIntakeToBackend(record, { attachments: attachmentPayloads });
    const synced = backendResult.status === "ok";
    const notifyResults = backendResult.notifyResults || backendResult.record?.notifyResults || [];
    const notifyText = notifyResults.filter((item) => item.provider && !item.skipped).map((item) => item.provider).join("\u3001");
    leadStatus.textContent = synced ? `\u5DF2\u5EFA\u7ACB\u5F8C\u7AEF\u7D00\u9304\uFF1A${record.id}${notifyText ? `\uFF0C\u5DF2\u901A\u77E5 ${notifyText}` : ""}` : `\u5DF2\u5EFA\u7ACB\u672C\u6A5F\u66AB\u5B58\u7D00\u9304\uFF1A${record.id}\uFF1B\u5F8C\u7AEF\u540C\u6B65\u7A0D\u5F8C\u53EF\u91CD\u8A66`;
    messages.push(createMessage(
      "assistant",
      synced ? "\u5DF2\u5EFA\u7ACB\u5F8C\u7AEF\u5BA2\u670D\u7D00\u9304\u3002\u82E5\u5DF2\u8A2D\u5B9A Telegram \u6216 LINE\uFF0C\u7CFB\u7D71\u6703\u540C\u6B65\u63A8\u9001\u901A\u77E5\u3002" : "\u5DF2\u5EFA\u7ACB\u672C\u6A5F\u5BA2\u670D\u7D00\u9304\uFF1B\u76EE\u524D\u5F8C\u7AEF\u6216\u901A\u77E5\u901A\u9053\u672A\u9023\u7DDA\uFF0C\u4ECD\u53EF\u5728\u672C\u6A5F\u5F8C\u53F0\u67E5\u770B\u3002",
      "\u4EBA\u5DE5\u5354\u52A9"
    ));
    saveMessages();
    renderMessages();
    if (adminPanel.classList.contains("is-open")) renderAdmin();
  }
  adminToggle.addEventListener("click", () => setAdminOpen(!adminPanel.classList.contains("is-open")));
  adminCloseBtn.addEventListener("click", () => setAdminOpen(false));
  adminM3ReviewBtn.addEventListener("click", () => runMinimaxAdminAction("admin_review"));
  adminM3RegressionBtn.addEventListener("click", () => runMinimaxAdminAction("regression_task"));
  adminM3AuditBtn.addEventListener("click", runMinimaxAuditView);
  root4.querySelector("#supportAdminRefreshBtn").addEventListener("click", renderAdmin);
  root4.querySelector("#supportAdminExportBtn").addEventListener("click", () => {
    downloadJson(`found-support-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`, {
      exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
      ...supportDataSnapshot()
    });
  });
  root4.querySelector("#supportAdminClearIntakesBtn").addEventListener("click", () => {
    writeJson(INTAKES_KEY, []);
    requestSupportApi("/intakes", {
      method: "POST",
      body: JSON.stringify({ action: "clear" })
    }).catch(() => null).finally(() => {
      backendSnapshot = null;
      renderAdmin();
    });
  });
  toggle.addEventListener("click", () => setOpen(!panel.classList.contains("is-open")));
  closeBtn.addEventListener("click", () => setOpen(false));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = input.value;
    input.value = "";
    sendMessage(text);
  });
  root4.querySelectorAll("[data-support-fill]").forEach((button) => {
    button.addEventListener("click", () => {
      const text = button.getAttribute("data-support-fill") || "";
      input.value = text;
      sendMessage(text);
      setOpen(true);
    });
  });
  root4.querySelector("#supportHandoffBtn").addEventListener("click", () => {
    leadForm.classList.toggle("is-hidden");
    setOpen(true);
  });
  root4.querySelector("#supportClearBtn").addEventListener("click", () => {
    messages = [createMessage("assistant", "\u5C0D\u8A71\u5DF2\u6E05\u7A7A\u3002\u8ACB\u544A\u8A34\u6211\u60A8\u8981\u67E5\u8A62 OCR\u3001\u4F30\u50F9\u6392\u5E8F\u3001\u511F\u50B5\u80FD\u529B\u6216\u571F\u5730\u589E\u503C\u7A05\u54EA\u4E00\u90E8\u5206\u3002", "\u672C\u6A5F\u5BA2\u670D")];
    saveMessages();
    renderMessages();
  });
  leadForm.addEventListener("submit", saveLead);
  renderMessages();
  refreshBackendSnapshot().then(() => {
    if (adminPanel.classList.contains("is-open")) renderAdmin();
  });
  syncRemoteSupportMessages({ baselineOnly: true }).finally(() => {
    window.setInterval(syncRemoteSupportMessages, SUPPORT_REMOTE_MESSAGE_POLL_MS);
  });
  window.FoundSupportWidget = {
    ask: sendMessage,
    open: () => setOpen(true),
    openAdmin: () => setAdminOpen(true),
    close: () => setOpen(false),
    closeAdmin: () => setAdminOpen(false),
    runM3AdminReview: () => runMinimaxAdminAction("admin_review"),
    runM3RegressionTask: () => runMinimaxAdminAction("regression_task"),
    showM3Audit: runMinimaxAuditView,
    syncRemoteMessages: syncRemoteSupportMessages,
    getAdminState: supportDataSnapshot,
    knowledge: KNOWLEDGE.map(({ id, title }) => ({ id, title }))
  };
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", supportWidget, { once: true });
} else {
  supportWidget();
}
