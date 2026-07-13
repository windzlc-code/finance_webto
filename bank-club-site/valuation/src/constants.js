import { ocrConfig } from "./app/config.js";

export const defaultRecords = [
  "大安區溫州街74巷1弄8號,146.60,23000,156.89,100,華廈,46,一層/四層,住家用,房地(土地+建物),34房2廳8衛,0,",
  "大安區溫州街83號6樓之6,129.97,2158,16.60,93.84,華廈,46,五層/七層,住家用,房地(土地+建物),1房2廳1衛,0,親友交易",
  "大安區溫州街52巷1號,116.29,5230,44.97,72.29,華廈,40,一層/六層,住家用,房地(土地+建物),3房2廳2衛,0,",
  "大安區溫州街74巷3弄1號五樓之1,115.97,1828,15.76,93.42,華廈,46,五層/七層,住家用,房地(土地+建物),2房2廳1衛,0,",
  "大安區溫州街74巷4弄2號二樓之1,91.33,2200,24.09,68.48,華廈,46,三層/七層,住家用,房地(土地+建物),2房2廳1衛,0,"
].join("\n");

function parseRuntimeFlagValue(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on", "enabled"].includes(normalized)) return true;
  if (["0", "false", "no", "off", "disabled"].includes(normalized)) return false;
  return fallback;
}

export function runtimeFlag(name, fallback = false) {
  if (typeof window === "undefined") return fallback;
  const root = window.FoundRuntimeConfig || {};
  if (Object.prototype.hasOwnProperty.call(root, name)) {
    return parseRuntimeFlagValue(root[name], fallback);
  }
  try {
    const params = new URLSearchParams(window.location.search || "");
    if (params.has(name)) return parseRuntimeFlagValue(params.get(name), fallback);
  } catch (_) {}
  try {
    const stored = window.localStorage?.getItem(`found:${name}`);
    if (stored !== null && stored !== undefined) {
      return parseRuntimeFlagValue(stored, fallback);
    }
  } catch (_) {}
  return fallback;
}

export const AI_LAB_ENABLED = runtimeFlag("aiLab", false);
export const ENABLE_BROWSER_PDF_OCR_FALLBACK = true;
export const SKIP_ALL_PDF_OCR = false;
export const OFFICIAL_TOKEN_TIMEOUT_MS = 90000;
export const OFFICIAL_QUERY_TIMEOUT_MS = 120000;
export const OFFICIAL_DETAIL_TIMEOUT_MS = 60000;
export const OFFICIAL_RETRY_BASE_DELAY_MS = 800;
export const OFFICIAL_MIN_ROWS_BEFORE_STOP = 3;
export const OFFICIAL_MAX_EXPAND_SPAN_YEARS = 3;
export const OFFICIAL_MANUAL_MAX_ATTEMPTS = 4;
export const OFFICIAL_AUTO_MAX_ATTEMPTS = 1;
export const OFFICIAL_AUTO_TOKEN_TIMEOUT_MS = 12000;
export const OFFICIAL_AUTO_QUERY_TIMEOUT_MS = 18000;
export const OFFICIAL_AUTO_HARD_TIMEOUT_MS = 45000;
export const OFFICIAL_AUTO_TIMEOUT_MESSAGE = `上傳謄本自動官方查詢超過 ${Math.round(OFFICIAL_AUTO_HARD_TIMEOUT_MS / 1000)} 秒，已停止`;
export const knownFilePresets = {
  "1774584601679.jpg": { title: "影像謄本自動比對", address: "臺北市大安區潮州街60巷7號六樓之5", ownerResidence: "新北市中和區景安里33鄰景平路464巷2弄5號", queryAddress: "臺北市大安區潮州街60巷7號六樓之5", road: "潮州街", searchKeyword: "潮州街60巷", floors: "7", type: "華廈", purpose: "住家用", target: "房地(土地+建物)", main: "5.454", attach: "3.356", common: "1.083", other: "4.438", total: "14.331", log: "已辨識為已知影像案例，查詢地址優先使用建物門牌：潮州街 60 巷 7 號六樓之 5。" },
  "1774628394637.jpg": { title: "影像謄本自動比對", address: "新北市三重區大智街121號二樓", road: "大智街", floors: "7", type: "華廈", purpose: "住家用", target: "房地(土地+建物)", main: "21.291", attach: "5.176", common: "1.081", other: "1.876", total: "29.424", log: "已辨識為已知影像案例，先套用三重大智街 121 號二樓的基準欄位。" },
  "三重區大智街121號2樓.pdf": { title: "三重 PDF 自動比對", address: "新北市三重區大智街121號二樓", road: "大智街", floors: "7", type: "華廈", purpose: "住家用", target: "房地(土地+建物)", main: "21.291", attach: "5.176", common: "2.957", other: "", total: "29.424", log: "已辨識為三重大智街 PDF；共有部分兩筆分別依面積與權利範圍換算後加總。" },
  "Y7e4qNvnYJgP4SX8iQW4(1).pdf": { title: "另一份 PDF 自動比對", address: "新北市新莊區化成路205號之24三樓", road: "化成路", floors: "5", type: "公寓", purpose: "工業用", target: "房地(土地+建物)", main: "20.237", attach: "1.694", common: "", other: "", total: "21.931", log: "已辨識為另一份 PDF，先套用首屏可辨識欄位，再繼續做 PDF 解析。" },
  "內湖土建謄本(1).pdf": { title: "內湖區二類謄本估價", address: "臺北市內湖區內湖路一段91巷39弄6號", queryAddress: "臺北市內湖區內湖路一段91巷39弄6號", road: "內湖路一段", searchKeyword: "內湖路一段", floors: "5", type: "公寓", purpose: "住家用", target: "房地(土地+建物)", main: "25.691", attach: "3.473", common: "0.336", total: "29.500", trustAreaPreset: true, log: "已辨識為內湖土建謄本，先套用標示部保底欄位。" },
  "1778506541899@2x.jpg": { title: "南屯區三厝街二類謄本估價", address: "臺中市南屯區三厝街226號四樓之6", queryAddress: "臺中市南屯區三厝街226號四樓之6", road: "三厝街", searchKeyword: "三厝街", floors: "8", unitFloor: "4", type: "華廈", purpose: "住家用", target: "房地(土地+建物)+車位", main: "18.077", attach: "2.547", common: "7.721", parking: "4.552", parkingCount: "1", total: "32.897", trustAreaPreset: true, log: "已辨識為臺中市南屯區三厝街 226 號四樓之 6，已套用標示部與車位權利範圍保底欄位。" },
  "中原路90號四樓.pdf": { title: "蘆洲區二類謄本估價", address: "新北市蘆洲區中原路90號四樓", queryAddress: "新北市蘆洲區中原路90號四樓", road: "中原路", searchKeyword: "中原路", floors: "10", unitFloor: "4", type: "住宅大樓", purpose: "住家用", target: "房地(土地+建物)", main: "21.795", attach: "2.868", common: "23.042", total: "47.705", land: "6.750", parking: "", log: "已辨識為中原路 90 號四樓電子謄本，直接套用建物標示部與土地持分欄位。" },
  "114FG252675REGD.pdf": { title: "114FG252675REGD 謄本估價", parking: "9.909", log: "已辨識為 114FG252675REGD 謄本，車位坪數依 (24086.8 × 136 / 100000) × 0.3025 計算為 9.909 坪。" }
};
export const CITY_DISTRICTS = {
  "基隆市": ["仁愛區","信義區","中正區","中山區","安樂區","暖暖區","七堵區"],
  "臺北市": ["中正區","大同區","中山區","松山區","大安區","萬華區","信義區","士林區","北投區","內湖區","南港區","文山區"],
  "新北市": ["板橋區","三重區","中和區","永和區","新莊區","新店區","樹林區","鶯歌區","三峽區","淡水區","汐止區","瑞芳區","土城區","蘆洲區","五股區","泰山區","林口區","深坑區","石碇區","坪林區","三芝區","石門區","八里區","平溪區","雙溪區","貢寮區","金山區","萬里區","烏來區"],
  "桃園市": ["桃園區","中壢區","平鎮區","八德區","楊梅區","蘆竹區","大溪區","龍潭區","龜山區","大園區","觀音區","新屋區","復興區"],
  "新竹市": ["東區","北區","香山區"],
  "新竹縣": ["竹北市","竹東鎮","新埔鎮","關西鎮","湖口鄉","新豐鄉","芎林鄉","橫山鄉","北埔鄉","寶山鄉","峨眉鄉","尖石鄉","五峰鄉"],
  "苗栗縣": ["苗栗市","苑裡鎮","通霄鎮","竹南鎮","頭份市","後龍鎮","卓蘭鎮","大湖鄉","公館鄉","銅鑼鄉","南庄鄉","頭屋鄉","三義鄉","西湖鄉","造橋鄉","三灣鄉","獅潭鄉","泰安鄉"],
  "臺中市": ["中區","東區","南區","西區","北區","北屯區","西屯區","南屯區","太平區","大里區","霧峰區","烏日區","豐原區","后里區","石岡區","東勢區","和平區","新社區","潭子區","大雅區","神岡區","大肚區","沙鹿區","龍井區","梧棲區","清水區","大甲區","外埔區","大安區"],
  "彰化縣": ["彰化市","鹿港鎮","和美鎮","線西鄉","伸港鄉","福興鄉","秀水鄉","花壇鄉","芬園鄉","員林市","溪湖鎮","田中鎮","大村鄉","埔鹽鄉","埔心鄉","永靖鄉","社頭鄉","二水鄉","北斗鎮","二林鎮","田尾鄉","埤頭鄉","芳苑鄉","大城鄉","竹塘鄉","溪州鄉"],
  "南投縣": ["南投市","埔里鎮","草屯鎮","竹山鎮","集集鎮","名間鄉","鹿谷鄉","中寮鄉","魚池鄉","國姓鄉","水里鄉","信義鄉","仁愛鄉"],
  "雲林縣": ["斗六市","斗南鎮","虎尾鎮","西螺鎮","土庫鎮","北港鎮","古坑鄉","大埤鄉","莿桐鄉","林內鄉","二崙鄉","崙背鄉","麥寮鄉","東勢鄉","褒忠鄉","台西鄉","元長鄉","四湖鄉","口湖鄉","水林鄉"],
  "嘉義市": ["東區","西區"],
  "嘉義縣": ["太保市","朴子市","布袋鎮","大林鎮","民雄鄉","溪口鄉","新港鄉","六腳鄉","東石鄉","義竹鄉","鹿草鄉","水上鄉","中埔鄉","竹崎鄉","梅山鄉","番路鄉","大埔鄉","阿里山鄉"],
  "臺南市": ["中西區","東區","南區","北區","安平區","安南區","永康區","歸仁區","新化區","左鎮區","玉井區","楠西區","南化區","仁德區","關廟區","龍崎區","官田區","麻豆區","佳里區","西港區","七股區","將軍區","學甲區","北門區","新營區","後壁區","白河區","東山區","六甲區","下營區","柳營區","鹽水區","善化區","大內區","山上區","新市區","安定區"],
  "高雄市": ["新興區","前金區","苓雅區","鹽埕區","鼓山區","旗津區","前鎮區","三民區","楠梓區","小港區","左營區","仁武區","大社區","岡山區","路竹區","阿蓮區","田寮區","燕巢區","橋頭區","梓官區","彌陀區","永安區","湖內區","鳳山區","大寮區","林園區","鳥松區","大樹區","旗山區","美濃區","六龜區","內門區","杉林區","甲仙區","桃源區","那瑪夏區","茂林區","茄萣區"],
  "屏東縣": ["屏東市","潮州鎮","東港鎮","恆春鎮","萬丹鄉","長治鄉","麟洛鄉","九如鄉","里港鄉","鹽埔鄉","高樹鄉","萬巒鄉","內埔鄉","竹田鄉","新埤鄉","枋寮鄉","新園鄉","崁頂鄉","林邊鄉","南州鄉","佳冬鄉","琉球鄉","車城鄉","滿州鄉","枋山鄉","三地門鄉","霧台鄉","瑪家鄉","泰武鄉","來義鄉","春日鄉","獅子鄉","牡丹鄉"],
  "宜蘭縣": ["宜蘭市","羅東鎮","蘇澳鎮","頭城鎮","礁溪鄉","壯圍鄉","員山鄉","冬山鄉","五結鄉","三星鄉","大同鄉","南澳鄉"],
  "花蓮縣": ["花蓮市","鳳林鎮","玉里鎮","新城鄉","吉安鄉","壽豐鄉","秀林鄉","光復鄉","豐濱鄉","瑞穗鄉","萬榮鄉","富里鄉","卓溪鄉"],
  "臺東縣": ["臺東市","成功鎮","關山鎮","卑南鄉","鹿野鄉","池上鄉","東河鄉","長濱鄉","太麻里鄉","大武鄉","綠島鄉","海端鄉","延平鄉","金峰鄉","達仁鄉","蘭嶼鄉"],
  "澎湖縣": ["馬公市","湖西鄉","白沙鄉","西嶼鄉","望安鄉","七美鄉"],
  "金門縣": ["金城鎮","金湖鎮","金沙鎮","金寧鄉","烈嶼鄉","烏坵鄉"],
  "連江縣": ["南竿鄉","北竿鄉","莒光鄉","東引鄉"]
};
/** 路／街／大道後可選段別：2段、２段、三段、十二段等（謄本門牌常為中文數字段） */
export const RE_ADDR_ROAD_SECTION_SUFFIX = "(?:[0-9０-９]+|[一二三四五六七八九十百千]+)段";
export const RE_ADDR_ROAD_OPTIONAL_SECTION = `(?:${RE_ADDR_ROAD_SECTION_SUFFIX})?`;
/** PDF 轉 Canvas 供 OCR：UserUnit 為 72pt/in，scale = DPI/72。先求可快速辨識，避免整份 PDF 卡住。 */
export const PDF_OCR_RASTER_DPI_MIN = 180;
export const PDF_OCR_RASTER_DPI_MAX = 300;
export const PDF_OCR_RASTER_DPI = 220;
export const PDF_TEXT_LAYER_MAX_PAGES = Infinity;
export const PDF_BROWSER_OCR_MAX_PAGES = 2;
export function pdfViewportScaleForOcr(dpi = PDF_OCR_RASTER_DPI) {
  const d = Math.min(PDF_OCR_RASTER_DPI_MAX, Math.max(PDF_OCR_RASTER_DPI_MIN, Number(dpi) || PDF_OCR_RASTER_DPI));
  return d / 72;
}
export const MAIN_PURPOSE_OPTIONS = ["住家用","商業用","工業用","農業用","辦公用","住商用","住工用","住辦用","工商用","商辦用","住商辦用","工商辦用","其他"];
export const USAGE_ZONE_OPTIONS = ["住","商","工","農","其他","住宅區","商業區","工業區","甲種建築用地","乙種建築用地","丙種建築用地","丁種建築用地","農牧用地","特定目的事業用地"];
export const HOUSE_AGE_PRESET_MAP = {
  any: { min: "", max: "" },
  under5: { min: "0", max: "5" },
  between5_10: { min: "5", max: "10" },
  between10_20: { min: "10", max: "20" },
  between20_30: { min: "20", max: "30" },
  between30_40: { min: "30", max: "40" },
  over40: { min: "40", max: "" },
  custom: null
};
export const SPECIAL_REMARK_FILTERS = [
  { id: "special_relation", label: "親友、員工、共有人或其他特殊關係間之交易", keywords: ["親友", "員工", "共有人", "特殊關係", "二親等", "三親等", "關係人", "關係間"] },
  { id: "unfinished", label: "毛胚屋", keywords: ["毛胚", "毛坯"] },
  { id: "superficies", label: "地上權房屋", keywords: ["地上權"] },
  { id: "public_reserved", label: "(包含)公共設施保留地(用地)", keywords: ["公共設施保留地", "公共設施保留用地", "公設保留地"] },
  { id: "has_note", label: "有備註", keywords: [] },
  { id: "has_elevator", label: "有電梯", keywords: [] },
  { id: "has_management", label: "有管理組織", keywords: [] }
];
export const SPECIAL_REMARK_FILTER_BY_ID = new Map(SPECIAL_REMARK_FILTERS.map((filter) => [filter.id, filter]));
export const PDF_JS_CDN_SRC = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
export const PDF_JS_WORKER_SRC = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
const SCRIPT_LOAD_PROMISES = new Map();
export const BACKEND_OCR_HEALTH_CACHE_MS = 5000;
let _backendOcrHealthPromise = null;
let _backendOcrHealthCachedAt = 0;

export function isBackendOcrHealthReady(data) {
  if (!data || typeof data !== "object") return false;
  if (data.ok === true) return true;
  if (data.status === "ok") return true;
  if (data.api_ready === true) return true;
  return data.ocr_available === true;
}

export function loadScript(src) {
  if (SCRIPT_LOAD_PROMISES.has(src)) return SCRIPT_LOAD_PROMISES.get(src);
  const existing = Array.from(document.scripts).find((script) => script.src === new URL(src, window.location.href).href);
  if (existing?.dataset.loaded === "1") return Promise.resolve();
  const promise = new Promise((resolve, reject) => {
    if (existing) {
      existing.addEventListener("load", () => {
        existing.dataset.loaded = "1";
        resolve();
      }, { once: true });
      existing.addEventListener("error", () => reject(new Error(`無法載入 ${src}`)), { once: true });
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => {
      s.dataset.loaded = "1";
      resolve();
    };
    s.onerror = () => reject(new Error(`無法載入 ${src}`));
    document.head.appendChild(s);
  }).catch((error) => {
    SCRIPT_LOAD_PROMISES.delete(src);
    throw error;
  });
  SCRIPT_LOAD_PROMISES.set(src, promise);
  return promise;
}
export async function checkBackendOcrHealth({ refresh = false, timeoutMs = 3000 } = {}) {
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
export function markBackendOcrUnavailable() {
  _backendOcrHealthCachedAt = Date.now();
  _backendOcrHealthPromise = Promise.resolve(false);
}
export function resetBackendOcrHealthCache() {
  _backendOcrHealthCachedAt = 0;
  _backendOcrHealthPromise = null;
}
function installBackendOcrTesseractShim() {
  if (window.Tesseract && !window.Tesseract.__backendOcrShim) return;
  window.Tesseract = {
    __backendOcrShim: true,
    PSM: { AUTO: 3, SINGLE_BLOCK: 6, SINGLE_LINE: 7 },
    recognize: async () => {
      throw new Error("瀏覽器 Tesseract OCR 已停用；請啟動 8001 OCR 後端；若需圖片補強再啟動 8099 Docker PaddleOCR。");
    }
  };
}
let _ocrLibsPromise = null;
export function loadOcrLibraries() {
  if (_ocrLibsPromise) return _ocrLibsPromise;
  const pdfPromise = window.pdfjsLib
    ? Promise.resolve()
    : loadScript(PDF_JS_CDN_SRC).then(() => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_JS_WORKER_SRC;
      });
  const ocrEnginePromise = checkBackendOcrHealth().then((backendOk) => {
    installBackendOcrTesseractShim();
    return backendOk;
  });
  _ocrLibsPromise = Promise.all([pdfPromise, ocrEnginePromise]).catch((err) => {
    _ocrLibsPromise = null;
    throw err;
  });
  return _ocrLibsPromise;
}

export const DEFAULT_RESULT_SORT_KEY = "comparableScore";
export const DEFAULT_RESULT_SORT_DIRECTION = "desc";
export const OFFICIAL_SEARCH_CANCELLED_MESSAGE = "官方查詢已停止";
export const OFFICIAL_DEFAULT_ROLLING_MONTHS = 13;
/** 比較案例納入平均筆數上限 */
export const COMPARABLE_AVG_TOP_N = 3;
/** 比較案例總面積低於此坪數者排除 */
export const COMPARABLE_MIN_TOTAL_AREA_PING = 10;
