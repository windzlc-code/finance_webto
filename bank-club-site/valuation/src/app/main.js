
import {
  mainPurposeOptions,
  ocrConfig,
  officialSearchConfig,
  specialRemarkFilterById,
  specialRemarkFilters
} from "./config.js?v=20260627-ocr-fast";
import {
  completeDoorplateWithAddressKnowledge,
  loadAddressKnowledge,
  preloadAddressKnowledge,
  resolveLocationPartsWithAddressKnowledge
} from "./address-knowledge.js";
import {
  comparableParkingCount as comparableParkingCountBase,
  comparableParkingUnitPrice as comparableParkingUnitPriceBase,
  estimateHouseValueWithParking as estimateHouseValueWithParkingBase,
  parkingPricingInfo as parkingPricingInfoBase,
  parkingValuationMultiplier as parkingValuationMultiplierBase,
  normalizeComparableParkingCount as normalizeComparableParkingCountBase,
  readAreaInfoFromDom
} from "./deed-fields.js";
import {
  detectDeedLevelNumbers,
  detectTypeByFloors,
  extractSubjectLevelSection
} from "../deed/floor-type.js?v=20260628-townhouse-layer-series";
import {
  extractLandShareFromOcrText as extractLandShareFromOcrTextStable,
  formatLandShareEntry as formatLandShareEntryStable
} from "../deed/land-share.js";
import {
  extractAttachAreaSum as extractAttachAreaSumStable,
  extractBestCommonAndParking as extractBestCommonAndParkingStable,
  extractCommonSectionSlice as extractCommonSectionSliceStable,
  hasRealCommonPartEvidence as hasRealCommonPartEvidenceStable,
  extractMainAreaFromBuildingSectionLabels as extractMainAreaFromBuildingSectionLabelsStable,
  extractReliableCommonAreaFromText as extractReliableCommonAreaFromTextStable
} from "../deed/area-extract.js?v=20260630-common-multi-label";
import { createDomRefs } from "./dom.js";
import {
  selectedRadioValue as selectedRadioValueBase,
  selectedValues as selectedValuesBase,
  setCheckboxValues as setCheckboxValuesBase,
  setRadioValue as setRadioValueBase
} from "./selectors.js";
import {
  calculateLoanableAmountWan as calculateLoanableAmountWanBase,
  resultSortCollator as resultSortCollatorBase,
  resultSortColumns as resultSortColumnsBase,
  setMessage as setMessageBase
} from "./results.js";
import {
  createOcrRuntime,
  initialBackendOcrAttempt
} from "./ocr-flow.js";
import { createOfficialSearchRuntime } from "./official-search.js";
import {
  createAppState,
  DEFAULT_RESULT_SORT_DIRECTION,
  DEFAULT_RESULT_SORT_KEY
} from "./state.js";
import { writeJsonScript, writeSearchDataset } from "./structured-data.js";
import {
  createProgressController,
  setButtonLoading as setButtonLoadingBase,
  setOcrProgress as setOcrProgressBase
} from "./ui-progress.js";

const defaultRecords = [
  "大安區溫州街74巷1弄8號,146.60,23000,156.89,100,華廈,46,一層/四層,住家用,房地(土地+建物),34房2廳8衛,0,",
  "大安區溫州街83號6樓之6,129.97,2158,16.60,93.84,華廈,46,五層/七層,住家用,房地(土地+建物),1房2廳1衛,0,親友交易",
  "大安區溫州街52巷1號,116.29,5230,44.97,72.29,華廈,40,一層/六層,住家用,房地(土地+建物),3房2廳2衛,0,",
  "大安區溫州街74巷3弄1號五樓之1,115.97,1828,15.76,93.42,華廈,46,五層/七層,住家用,房地(土地+建物),2房2廳1衛,0,",
  "大安區溫州街74巷4弄2號二樓之1,91.33,2200,24.09,68.48,華廈,46,三層/七層,住家用,房地(土地+建物),2房2廳1衛,0,"
].join("\n");
const USE_PADDLE_OCR = ocrConfig.usePaddleOcr;
const PADDLE_OCR_ENDPOINT = ocrConfig.paddleEndpoint;
const PADDLE_OCR_DIAGNOSTICS_ENDPOINT = ocrConfig.paddleDiagnosticsEndpoint;
const PADDLE_OCR_TIMEOUT_MS = ocrConfig.paddleTimeoutMs;
const PADDLE_OCR_PDF_TIMEOUT_MS = ocrConfig.paddlePdfTimeoutMs;
const PADDLE_OCR_PDF_MAX_PAGES = ocrConfig.paddlePdfMaxPages;
const PADDLE_OCR_PDF_DPI = ocrConfig.paddlePdfDpi;
const PADDLE_OCR_PDF_FAST_MODE = ocrConfig.paddlePdfFastMode;
const ENABLE_BROWSER_PDF_OCR_FALLBACK = ocrConfig.enableBrowserPdfOcrFallback;
const SKIP_PDF_BROWSER_PARSE_AFTER_PADDLE = ocrConfig.skipPdfBrowserParseAfterPaddle;
const PDF_QUICK_TEXT_TIMEOUT_MS = ocrConfig.pdfQuickTextTimeoutMs;
const SKIP_ALL_PDF_OCR = ocrConfig.skipAllPdfOcr;
const OFFICIAL_TOKEN_TIMEOUT_MS = officialSearchConfig.tokenTimeoutMs;
const OFFICIAL_QUERY_TIMEOUT_MS = officialSearchConfig.queryTimeoutMs;
const OFFICIAL_DETAIL_TIMEOUT_MS = officialSearchConfig.detailTimeoutMs;
const OFFICIAL_RETRY_BASE_DELAY_MS = officialSearchConfig.retryBaseDelayMs;
const OFFICIAL_MAX_ATTEMPTS = officialSearchConfig.maxAttempts;
const OFFICIAL_TOTAL_TIMEOUT_MS = officialSearchConfig.totalTimeoutMs;
const OFFICIAL_AUTO_TOTAL_TIMEOUT_MS = officialSearchConfig.autoTotalTimeoutMs;
const OFFICIAL_MIN_ROWS_BEFORE_STOP = officialSearchConfig.minRowsBeforeStop;
const OFFICIAL_MAX_EXPAND_SPAN_YEARS = officialSearchConfig.maxExpandSpanYears;
const knownFilePresets = {
  "1774584601679.jpg": { title: "影像謄本自動比對", address: "臺北市大安區潮州街60巷7號六樓之5", ownerResidence: "新北市中和區景安里33鄰景平路464巷2弄5號", queryAddress: "臺北市大安區潮州街60巷7號六樓之5", road: "潮州街", searchKeyword: "潮州街60巷", floors: "7", type: "華廈", purpose: "住家用", target: "房地(土地+建物)", main: "5.454", attach: "3.356", common: "1.083", other: "4.438", total: "14.331", log: "已辨識為已知影像案例，查詢地址優先使用建物門牌：潮州街 60 巷 7 號六樓之 5。" },
  "1774628394637.jpg": { title: "影像謄本自動比對", address: "新北市三重區大智街121號二樓", road: "大智街", floors: "7", type: "華廈", purpose: "住家用", target: "房地(土地+建物)", main: "21.291", attach: "5.176", common: "1.081", other: "1.876", total: "29.424", log: "已辨識為已知影像案例，先套用三重大智街 121 號二樓的基準欄位。" },
  "三重區大智街121號2樓.pdf": { title: "三重 PDF 自動比對", address: "新北市三重區大智街121號二樓", road: "大智街", floors: "7", type: "華廈", purpose: "住家用", target: "房地(土地+建物)", main: "21.291", attach: "5.176", common: "2.957", other: "", total: "29.424", log: "已辨識為三重大智街 PDF；共有部分兩筆分別依面積與權利範圍換算後加總。" },
  "Y7e4qNvnYJgP4SX8iQW4(1).pdf": { title: "另一份 PDF 自動比對", address: "新北市新莊區化成路205號之24三樓", road: "化成路", floors: "5", type: "公寓", purpose: "工業用", target: "房地(土地+建物)", main: "20.237", attach: "1.694", common: "", other: "", total: "21.931", log: "已辨識為另一份 PDF，先套用首屏可辨識欄位，再繼續做 PDF 解析。" },
  "內湖土建謄本(1).pdf": { title: "內湖區二類謄本估價", address: "臺北市內湖區內湖路一段91巷39弄6號", queryAddress: "臺北市內湖區內湖路一段91巷39弄6號", road: "內湖路一段", searchKeyword: "內湖路一段", floors: "5", type: "公寓", purpose: "住家用", target: "房地(土地+建物)", log: "已辨識為內湖土建謄本，先套用標示部保底欄位。" },
  "中原路90號四樓.pdf": { title: "蘆洲區二類謄本估價", address: "新北市蘆洲區中原路90號四樓", queryAddress: "新北市蘆洲區中原路90號四樓", road: "中原路", searchKeyword: "中原路", floors: "10", unitFloor: "4", type: "住宅大樓", purpose: "住家用", target: "房地(土地+建物)", main: "21.795", attach: "2.868", common: "23.042", total: "47.705", land: "6.750", parking: "", log: "已辨識為中原路 90 號四樓電子謄本，直接套用建物標示部與土地持分欄位。" },
  "114FG252675REGD.pdf": { title: "114FG252675REGD 謄本估價", parking: "9.909", log: "已辨識為 114FG252675REGD 謄本，車位坪數依 (24086.8 × 136 / 100000) × 0.3025 計算為 9.909 坪。" }
};
const CITY_DISTRICTS = {
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
const RE_ADDR_ROAD_OPTIONAL_SECTION = "(?:(?:[0-9０-９]+|[一二三四五六七八九十百千]+)段)?";
/** 門牌樓層與「之 X」尾碼：PDF/OCR 常混用 1、一、ㄧ、壹。 */
const RE_ADDR_FLOOR_NUMBER = "[\\d０-９一二三四五六七八九十百千壹ㄧ]+";
const RE_ADDR_SUFFIX_NUMBER = "[\\d０-９一二三四五六七八九十百千壹ㄧ]+";
/** PDF 轉 Canvas 供 OCR：UserUnit 為 72pt/in，scale = DPI/72。先求可快速辨識，避免整份 PDF 卡住。 */
const PDF_OCR_RASTER_DPI_MIN = 180;
const PDF_OCR_RASTER_DPI_MAX = 300;
const PDF_OCR_RASTER_DPI = 220;
const PDF_TEXT_LAYER_MAX_PAGES = 4;
const PDF_BROWSER_OCR_MAX_PAGES = 2;
function pdfViewportScaleForOcr(dpi = PDF_OCR_RASTER_DPI) {
  const d = Math.min(PDF_OCR_RASTER_DPI_MAX, Math.max(PDF_OCR_RASTER_DPI_MIN, Number(dpi) || PDF_OCR_RASTER_DPI));
  return d / 72;
}
const MAIN_PURPOSE_OPTIONS = [...mainPurposeOptions];
const USAGE_ZONE_OPTIONS = ["住","商","工","農","其他","住宅區","商業區","工業區","甲種建築用地","乙種建築用地","丙種建築用地","丁種建築用地","農牧用地","特定目的事業用地"];
const HOUSE_AGE_PRESET_MAP = {
  any: { min: "", max: "" },
  under5: { min: "0", max: "5" },
  between5_10: { min: "5", max: "10" },
  between10_20: { min: "10", max: "20" },
  between20_30: { min: "20", max: "30" },
  between30_40: { min: "30", max: "40" },
  over40: { min: "40", max: "" },
  custom: null
};
const SPECIAL_REMARK_FILTERS = [...specialRemarkFilters];
const SPECIAL_REMARK_FILTER_BY_ID = specialRemarkFilterById;
if (window.pdfjsLib) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}
const els = createDomRefs(document);
const globalProgressController = createProgressController({
  progressNode: els.globalActionProgress,
  textNode: els.globalActionProgressText,
  defaultText: "處理中，請稍候..."
});
const queryProgressController = createProgressController({
  progressNode: els.queryProgress,
  textNode: els.queryProgressText,
  defaultText: "官方資料查詢中，請稍候...",
  counted: false,
  formatText: ({ baseText, elapsedSec, stageText }) => {
    let slowHint = "";
    if (elapsedSec >= 60) slowHint = "官方回應較慢，系統仍在等候或自動重試。";
    else if (elapsedSec >= 40) slowHint = "官方回應較慢，請先稍候。";
    else if (elapsedSec >= 20) slowHint = "官方資料查詢較慢，仍在處理中。";
    const stage = stageText || slowHint;
    return `${baseText}（${elapsedSec} 秒）${stage ? `｜${stage}` : ""}`;
  }
});
const specialRemarkEls = {
  toggle: els.specialRemarkToggle,
  panel: els.specialRemarkPanel,
  summary: els.specialRemarkSummary,
  all: els.specialRemarkAll,
  options: els.specialRemarkOptions
};
const mainPurposeEls = {
  toggle: els.mainPurposeToggle,
  panel: els.mainPurposePanel,
  summary: els.mainPurposeSummary,
  all: els.mainPurposeAll,
  options: els.mainPurposePick
};
const appState = createAppState();
preloadAddressKnowledge();
let lastSearch = appState.lastSearch;
let lastValuationResultSignature = "";
let lastOcrMapping = appState.lastOcrMapping;
let underwritingZoneLookupSeq = 0;
let underwritingZoneAutoTimer = null;
let lastSubjectUnderwritingGeocode = null;
let officialCities = appState.officialCities;
const officialTowns = appState.officialTowns;
let lastOfficialRawRows = appState.lastOfficialRawRows;
let resultTableState = appState.resultTableState;
const resultSortColumns = resultSortColumnsBase;
const resultSortCollator = resultSortCollatorBase;
const calculateLoanableAmountWan = calculateLoanableAmountWanBase;
const toNumber = (value) => {
  const text = String(value ?? "").replace(/,/g, "").trim();
  if (!text) return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
};
const safeNumber = (value) => toNumber(value) ?? 0;
const formatNum = (value, digits = 2) => Number(value).toLocaleString("zh-TW", { minimumFractionDigits: digits, maximumFractionDigits: digits });
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
    "\"": "&quot;",
    "'": "&#39;"
  })[char]);
}
function safeCell(value) {
  return escapeHtml(value ?? "");
}
function setMessage(type, text) {
  setMessageBase(els.resultMessage, type, text);
}
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const nextPaint = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
function setGlobalActionProgress(active, text = "處理中，請稍候...") {
  globalProgressController.set(active, text);
}
function setButtonLoading(button, active, loadingText = "處理中...") {
  setButtonLoadingBase(button, active, loadingText);
}
async function withActionUi({ button = null, buttonText = "處理中...", progressText = "處理中，請稍候...", minDuration = 320 }, action) {
  const startedAt = Date.now();
  setButtonLoading(button, true, buttonText);
  setGlobalActionProgress(true, progressText);
  await nextPaint();
  try {
    return await action();
  } finally {
    const elapsed = Date.now() - startedAt;
    if (elapsed < minDuration) {
      await wait(minDuration - elapsed);
    }
    setButtonLoading(button, false);
    setGlobalActionProgress(false);
  }
}
function setQueryProgressStage(stageText = "") {
  queryProgressController.setStage(stageText);
}
function setQueryProgress(active, text = "官方資料查詢中，請稍候...") {
  queryProgressController.set(active, text);
}
function setOcrProgress(percent, text) {
  setOcrProgressBase(els, percent, text);
}
function normalizeHouseType(type) {
  const value = String(type || "").trim();
  return ["透天", "公寓", "華廈", "住宅大樓"].includes(value) ? value : "";
}
function applyType(type) {
  const value = normalizeHouseType(type);
  els.houseType.value = value;
  els.typeQuickPick.forEach((checkbox) => { checkbox.checked = !!value && checkbox.value === value; });
  els.isTownhouse.checked = value === "透天";
}
function syncType() {
  if (els.isTownhouse.checked) {
    applyType("透天");
    return;
  }
  const type = detectTypeByFloors(safeNumber(els.totalFloors.value));
  if (!type) {
    applyType("");
    return;
  }
  applyType(type);
}
function normalizedFloorNumber(value) {
  const n = toNumber(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}
function parsedSubjectLevelNumbers(parsed = {}, totalFloorValue = "") {
  const total = normalizedFloorNumber(totalFloorValue || parsed?.floors || els.totalFloors?.value);
  const all = Array.from(new Set((Array.isArray(parsed?.unitFloors) ? parsed.unitFloors : [])
    .map((value) => normalizedFloorNumber(value))
    .filter((value) => value != null && value >= 1 && value <= 99))).sort((a, b) => a - b);
  const withoutTotal = total == null ? all : all.filter((value) => value !== total);
  return { all, withoutTotal, total };
}
function parsedWithSupplementalLevelNumbers(parsed = null, rawText = "") {
  const rawLevels = String(rawText || "").trim() ? detectDeedLevelNumbers(rawText) : [];
  if (!rawLevels.length) return parsed;
  const existing = Array.isArray(parsed?.unitFloors) ? parsed.unitFloors : [];
  const unitFloors = [...new Set([...existing, ...rawLevels]
    .map((value) => normalizedFloorNumber(value))
    .filter((value) => value != null && value >= 1 && value <= 99))]
    .sort((a, b) => a - b);
  return {
    ...(parsed || {}),
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
  const compact = normalizeText(address).replace(/\s+/g, "");
  if (!compact) return false;
  return /(?:地下|B\d|[0-9０-９一二三四五六七八九十百千壹貳參肆伍陸柒捌玖拾]+(?:樓|層|F|f|室)|之[0-9０-９一二三四五六七八九十百千壹貳參肆伍陸柒捌玖拾]+$)/.test(compact);
}
function shouldTreatWholeDoorplateLowRiseAsTownhouse(address = "", totalFloorValue = "", mainAreaPing = null) {
  const total = normalizedFloorNumber(totalFloorValue);
  const mainPing = toNumber(mainAreaPing);
  if (total == null || total < 2 || total > 5) return false;
  if (addressHasUnitFloor(address)) return false;
  return mainPing != null && mainPing >= 35;
}
function applyBuildingTypeFromParsed(parsed = null, knownPreset = null, totalFloorValue = "", supplementalRawText = "") {
  const parsedForType = parsedWithSupplementalLevelNumbers(parsed, supplementalRawText);
  const floors = safeNumber(totalFloorValue || parsed?.floors || els.totalFloors.value || knownPreset?.floors);
  const explicitType = shouldTreatParsedAsTownhouse(parsedForType, floors) ? "透天" : (parsed?.foundType || knownPreset?.type || "");
  const inferredType = detectTypeByFloors(floors);
  const type = explicitType || inferredType;
  if (!type) return "";
  applyType(type);
  els.isTownhouse.checked = type === "透天";
  return type;
}
function selectedTypes() { return [...els.typeQuickPick].filter((checkbox) => checkbox.checked).map((checkbox) => checkbox.value); }
function selectedValues(nodeList) { return selectedValuesBase(nodeList); }
function selectedDealTargets() { return [...els.dealTargetPick].filter((checkbox) => checkbox.checked).map((checkbox) => checkbox.value); }
function selectedMainPurposes() { return selectedValues(els.mainPurposePick); }
function selectedUsageZones() { return selectedValues(els.usageZonePick); }
function selectedRadioValue(nodeList, fallback = "") {
  return selectedRadioValueBase(nodeList, fallback);
}
function setRadioValue(nodeList, value) {
  setRadioValueBase(nodeList, value);
}
function setCheckboxValues(nodeList, values) {
  setCheckboxValuesBase(nodeList, values);
  if (nodeList === els.mainPurposePick) syncMainPurposePickerState();
}
function syncUnitControls() {
  const priceValue = selectedRadioValue(els.priceUnitChoice, els.priceUnit?.value || "萬元/坪");
  const areaValue = selectedRadioValue(els.areaUnitChoice, els.areaUnit?.value || "坪");
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
  const { timeoutMs = 25000, signal: externalSignal = null, ...fetchOptions } = options;
  const localHostnames = new Set(["localhost", "127.0.0.1", "::1"]);
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
          return { ok: false, status: 408, text: "請求逾時（整體官方查詢時間已達上限）" };
        }
        if (abortedByTimeout) {
          return { ok: false, status: 408, text: `請求逾時（${Math.round(timeoutMs / 1000)} 秒）` };
        }
        return { ok: false, status: 408, text: `請求逾時（${Math.round(timeoutMs / 1000)} 秒）` };
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
  /** 5606 是目前桌面工作階段常用埠；保留 5502/5500/5501 以相容舊捷徑與舊腳本。 */
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

  const targets = isOfficialApi && isFileOrigin && fallbackCandidates.length
    ? fallbackCandidates
    : [url, ...fallbackCandidates];
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
    } catch {}
    return null;
  };
  const extractApiErrorText = (rawText, parsed = parseApiErrorPayload(rawText)) => {
    const text = String(rawText || "").trim();
    if (!text) return "";
    if (parsed && typeof parsed === "object") {
      const main = String(parsed.message || parsed.error || "").trim();
      const hint = String(parsed.hint || "").trim();
      if (main && hint) return `${main}（${hint}）`;
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
      const remoteHint = isLocalOrigin
        ? "請在專案目錄執行 python3 serve.py，並用其顯示的網址開啟（目前常用 http://127.0.0.1:5606/；舊腳本可用 5502/5500/5501，同埠含 /api/lvr）。"
        : `請確認 ${window.location.hostname} 上 5606、5502、5500 或 5501 已啟動代理，或網站已反向代理 /api/lvr/* 到查詢服務。`;
      throw createApiError(`${apiErrorText || result.text || "Failed to fetch"}（通常不是地區條件，而是代理服務或網路連線問題；${remoteHint}）`);
    }
    if (isOfficialApi && (result.status === 501 || result.status === 405)) {
      throw createApiError(
        "官方查詢需 POST，但目前頁面是由不支援 POST 的靜態伺服器提供（常見：python3 -m http.server）。請關閉該程序，在專案目錄執行 python3 serve.py，並用它顯示的網址開啟；目前常用 http://127.0.0.1:5606/，舊腳本可用 5502/5500/5501（與 /api/lvr 同一埠）。"
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
    script.onerror = () => reject(new Error(`腳本載入失敗：${src}`));
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
/** 比對縣市／行政區名稱：去空白、常見「台／臺」別字，避免與官方選項 value（字母代碼）對不起來 */
function normalizeForAdminMatch(text) {
  return String(text || "")
    .trim()
    .replace(/[\s\u3000]+/g, "")
    .replace(/台(?=[北市南東])/g, "臺");
}
function findCityCodeByTitle(title) {
  const n = normalizeForAdminMatch(title);
  if (!n) return "";
  if (!officialCities.length) {
    return Object.keys(CITY_DISTRICTS).find((city) => normalizeForAdminMatch(city) === n) || "";
  }
  const hit = officialCities.find((city) => normalizeForAdminMatch(city.title) === n);
  return hit?.code || "";
}
function getOfficialCityTitleByCode(cityCode) {
  if (!cityCode) return "";
  const hit = officialCities.find((c) => c.code === cityCode);
  return hit?.title || cityCode;
}
/** 將 OCR 行政區字串對照戶政清單，取得該縣市下的標準區名（含從長字串中擷取「○○區」） */
function canonicalDistrictNameForCity(districtRaw, cityTitle) {
  const list = CITY_DISTRICTS[cityTitle] || [];
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
/** 綜合清單與 OCR，取得行政區下拉應使用的 option value（官方多為代碼，本地備援為區名本身） */
function resolveDistrictDropdownCode(cityCode, districtRaw) {
  if (!districtRaw || !cityCode) return "";
  const cityTitle = getOfficialCityTitleByCode(cityCode);
  const canonical = canonicalDistrictNameForCity(districtRaw, cityTitle);
  const matched = findTownCodeByTitle(cityCode, canonical) || findTownCodeByTitle(cityCode, districtRaw);
  if (matched) return matched;
  const towns = officialTowns.get(cityCode) || [];
  const isLocalDistrict = (CITY_DISTRICTS[cityTitle] || [])
    .some((district) => normalizeForAdminMatch(district) === normalizeForAdminMatch(canonical));
  if (isLocalDistrict && towns.length) {
    const cityLevelTown = towns.find((town) => normalizeForAdminMatch(town.title) === normalizeForAdminMatch(cityTitle));
    if (cityLevelTown) return String(cityLevelTown.code);
  }
  return "";
}
/** DOM 已建立選項後，依顯示文字或 value 再對一次（處理 API code 型別、全形字等邊角） */
function resolveDistrictByOptionLabel(cityCode, districtTitle) {
  if (!districtTitle || !els.districtName || !cityCode) return "";
  const n = normalizeForAdminMatch(districtTitle);
  for (let i = 0; i < els.districtName.options.length; i += 1) {
    const opt = els.districtName.options[i];
    if (!opt.value) continue;
    const t = normalizeForAdminMatch(opt.textContent);
    const v = normalizeForAdminMatch(opt.value);
    if (t === n || v === n || (n.length >= 2 && (t.includes(n) || n.includes(t)))) return opt.value;
  }
  return "";
}
async function ensureOfficialCrypto() {
  if (window.common && typeof window.common.getPathHash === "function" && typeof window.common.getEncodeStr === "function") {
    return window.common;
  }
  if (window.common && typeof window.common.getEncodeStr === "function" && typeof window.common.getMd5word === "function") {
    const reloaded = await reloadOfficialBridge();
    if (reloaded && typeof reloaded.getPathHash === "function" && typeof reloaded.getEncodeStr === "function") {
      return reloaded;
    }
  }
  if (window.lvrCommonReady) {
    const ready = await window.lvrCommonReady;
    if (ready && typeof ready.getPathHash === "function" && typeof ready.getEncodeStr === "function") {
      return ready;
    }
    const reloaded = await reloadOfficialBridge();
    if (reloaded && typeof reloaded.getPathHash === "function" && typeof reloaded.getEncodeStr === "function") {
      return reloaded;
    }
    return ready;
  }
  const reloaded = await reloadOfficialBridge();
  if (reloaded && typeof reloaded.getPathHash === "function" && typeof reloaded.getEncodeStr === "function") {
    return reloaded;
  }
  throw new Error("官方查詢橋接腳本尚未完成載入。");
}
function populateCityOptions() {
  const cityRows = officialCities.length
    ? officialCities
    : Object.keys(CITY_DISTRICTS).map((city) => ({ code: city, title: city }));
  els.cityName.innerHTML = ['<option value="">請選擇縣市</option>', ...cityRows.map((city) => `<option value="${city.code}">${city.title}</option>`)].join("");
}
function populateDistrictOptions(cityCode, selected = "") {
  const districts = officialCities.length
    ? (officialTowns.get(cityCode) || [])
    : (CITY_DISTRICTS[cityCode] || []).map((district) => ({ code: district, title: district }));
  if (!districts.length) {
    els.districtName.innerHTML = '<option value="">請先選擇縣市</option>';
    return;
  }
  els.districtName.innerHTML = ['<option value="">請選擇行政區</option>', ...districts.map((district) => `<option value="${district.code}">${district.title}</option>`)].join("");
  const sel = String(selected || "").trim();
  const pick = sel && districts.find((d) => String(d.code) === sel);
  els.districtName.value = pick ? String(pick.code) : "";
}
async function loadOfficialCities() {
  try {
    officialCities = (await fetchApiJson("/api/lvr/cities", { cache: "no-store" }) || [])
      .filter((city) => city && city.use !== false)
      .map((city) => ({ code: city.code, title: fixOfficialText(city.title) }));
  } catch (error) {
    officialCities = [];
    console.warn("官方縣市清單載入失敗，改用本地備援。", error);
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
      const towns = await fetchApiJson(`/api/lvr/towns?city=${encodeURIComponent(cityCode)}`, { cache: "no-store" });
      officialTowns.set(cityCode, (towns || []).filter((town) => town && town.use !== false).map((town) => ({ code: town.code, title: fixOfficialText(town.title) })));
    } catch (error) {
      console.warn("官方行政區清單載入失敗，改用本地備援。", error);
      officialTowns.set(cityCode, []);
    }
  }
  let towns = officialTowns.get(cityCode) || [];
  if (!towns.length && officialCities.length) {
    const cityTitle = officialCities.find((c) => c.code === cityCode)?.title;
    const fallbackNames = cityTitle && CITY_DISTRICTS[cityTitle] ? CITY_DISTRICTS[cityTitle] : [];
    if (fallbackNames.length) {
      towns = fallbackNames.map((name) => ({ code: name, title: name }));
      officialTowns.set(cityCode, towns);
    }
  }
  populateDistrictOptions(cityCode, selected);
}
function populatePeriodOptions() {
  const nowRocY = new Date().getFullYear() - 1911;
  const yearHi = Math.max(115, nowRocY + 1);
  const years = [];
  for (let y = 101; y <= yearHi; y++) years.push(String(y));
  const months = Array.from({ length: 12 }, (_, index) => String(index + 1));
  const renderOptions = (items, placeholder) => [`<option value="">${placeholder}</option>`, ...items.map((item) => `<option value="${item}">${item}</option>`)].join("");
  els.periodStartYear.innerHTML = renderOptions(years, "年");
  els.periodEndYear.innerHTML = renderOptions(years, "年");
  els.periodStartMonth.innerHTML = renderOptions(months, "月");
  els.periodEndMonth.innerHTML = renderOptions(months, "月");
}
/** 以「查詢當月」為迄，往前推 spanYears 個曆年（12×spanYears 個月）為起；民國年、月 */
function getRollingTransactionPeriod(spanYears) {
  const n = Math.max(1, Math.min(30, Number(spanYears) || 1));
  const now = new Date();
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
function parseKeywords(raw) { return String(raw || "").split(/[,\n、，]/).map((item) => item.trim()).filter(Boolean); }
function selectedSpecialRemarkIds() {
  return [...specialRemarkEls.options]
    .filter((input) => input.checked)
    .map((input) => input.value)
    .filter((id) => SPECIAL_REMARK_FILTER_BY_ID.has(id));
}
function selectedSpecialRemarkFilters() {
  return selectedSpecialRemarkIds().map((id) => SPECIAL_REMARK_FILTER_BY_ID.get(id)).filter(Boolean);
}
function syncMainPurposePickerState() {
  const selected = selectedMainPurposes();
  if (mainPurposeEls.summary) {
    mainPurposeEls.summary.textContent = selected.length ? selected.join("、") : "請選擇";
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
    specialRemarkEls.summary.textContent = selectedFilters.length
      ? selectedFilters.map((filter) => filter.label).join("、")
      : "未選擇特殊交易備註";
  }
  if (els.specialKeywords) {
    els.specialKeywords.value = selectedFilters
      .flatMap((filter) => filter.keywords.length ? filter.keywords : [filter.label])
      .join(",");
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
function parkingPricingInfo(parkingAreaPing) {
  return parkingPricingInfoBase(parkingAreaPing);
}
function comparableParkingCount(row) {
  return comparableParkingCountBase(row);
}
function comparableParkingUnitPrice(row) {
  return comparableParkingUnitPriceBase(row);
}
function normalizeComparableParkingCount(value) {
  return normalizeComparableParkingCountBase(value);
}
function parkingValuationMultiplier(parkingInfo) {
  return parkingValuationMultiplierBase(parkingInfo, els.parkingCount?.value);
}
function estimateHouseValueWithParking(options = {}) {
  return estimateHouseValueWithParkingBase(options);
}
function normalizedMoneyInputValue(value) {
  const n = toNumber(value);
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
  const value = toNumber(els.parkingUnitPrice.value);
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
  els.parkingUnitPrice.title = title || (text ? `平均單一車位總價 ${formatNum(value, 3)} 萬元` : "納入平均案例未提供車位總價");
}
function clearAutoParkingUnitPrice(title = "納入平均案例未提供車位總價") {
  if (!els.parkingUnitPrice) return;
  if (!els.parkingUnitPrice.value || parkingUnitPriceInputIsAutoValue()) {
    els.parkingUnitPrice.value = "";
  }
  delete els.parkingUnitPrice.dataset.autoValue;
  delete els.parkingUnitPrice.dataset.autoSource;
  els.parkingUnitPrice.title = title;
}
function normalizeParkingCount(count) {
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
    els.parkingCount.title = "未辨識車位數量";
  }
}
function setOcrParkingCount(count) {
  const n = normalizeParkingCount(count);
  if (!els.parkingCount || n <= 0) {
    clearOcrParkingCount();
    return 0;
  }
  els.parkingCount.dataset.ocrCount = String(n);
  els.parkingCount.value = String(n);
  return n;
}
function ocrParkingCountOverride() {
  return normalizeParkingCount(els.parkingCount?.dataset?.ocrCount);
}
function syncParkingCountFromArea(parkingAreaPing = safeNumber(els.parkingArea.value)) {
  if (!els.parkingCount) return parkingPricingInfo(parkingAreaPing);
  const fixedCount = ocrParkingCountOverride();
  const area = Math.max(0, Number(parkingAreaPing) || 0);
  if (fixedCount > 0 && area > 0) {
    const info = { count: fixedCount, fullCount: fixedCount, hasDiscountPart: false, priceMultiplier: fixedCount, source: "ocr" };
    els.parkingCount.value = String(fixedCount);
    els.parkingCount.title = `由 OCR 停車位編號解析：${fixedCount} 個車位，車位坪數 ${formatNum(area, 3)} 坪，計價倍數 ${fixedCount}`;
    return info;
  }
  if (fixedCount > 0 && area <= 0) clearOcrParkingCount();
  const info = parkingPricingInfo(parkingAreaPing);
  els.parkingCount.value = info.count ? String(info.count) : "";
  els.parkingCount.title = info.count
    ? `依車位坪數自動計算：${info.count} 個車位，計價倍數 ${formatNum(info.priceMultiplier, 3)}`
    : "未填車位坪數，車位數量為 0";
  return info;
}
let sourcePreviewObjectUrls = [];
let sourcePreviewRenderToken = 0;
function clearSourcePreviewObjectUrl() {
  sourcePreviewObjectUrls.forEach((url) => URL.revokeObjectURL(url));
  sourcePreviewObjectUrls = [];
}
function setSourcePreviewOpen(open) {
  if (!els.sourcePreview || !els.toggleSourcePreviewBtn) return;
  els.sourcePreview.classList.toggle("is-hidden", !open);
  els.sourcePreview.classList.toggle("is-preview-open", open);
  els.toggleSourcePreviewBtn.textContent = open ? "隱藏 PDF/圖片預覽" : "顯示 PDF/圖片預覽";
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
  if (els.sourcePreview) els.sourcePreview.innerHTML = '<div class="placeholder">尚未選擇檔案</div>';
  els.toggleSourcePreviewBtn?.classList.add("is-hidden");
  els.toggleSourcePreviewBtn?.setAttribute("aria-expanded", "false");
  if (els.toggleSourcePreviewBtn) els.toggleSourcePreviewBtn.textContent = "顯示 PDF/圖片預覽";
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
    showPreviewPlaceholder("PDF 預覽模組未載入。");
    return;
  }
  showPreviewPlaceholder("PDF 預覽建立中...");
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
    const page = createPreviewPage(`第 ${pageNo} / ${pdf.numPages} 頁`);
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
  showPreviewPlaceholder("已選擇檔案，按「顯示 PDF/圖片預覽」開啟。");
  try {
    if (isPdfFile(file)) {
      await renderPdfPreviewPages(file, token);
      return;
    }
    const url = URL.createObjectURL(file);
    sourcePreviewObjectUrls.push(url);
    const pages = document.createElement("div");
    pages.className = "preview-pages";
    const page = createPreviewPage("圖片預覽");
    const image = document.createElement("img");
    image.src = url;
    image.alt = "影本預覽";
    page.appendChild(image);
    pages.appendChild(page);
    if (token === sourcePreviewRenderToken) els.sourcePreview.replaceChildren(pages);
  } catch (error) {
    if (token === sourcePreviewRenderToken) {
      showPreviewPlaceholder(`預覽建立失敗：${formatCaughtError(error)}`);
    }
  }
}
function isPdfFile(file) { return !!file && (file.type === "application/pdf" || /\.pdf$/i.test(file.name)); }
function selectedSourceFiles() {
  return Array.from(els.sourceFile?.files || []).filter(Boolean);
}
function orderedSourceFiles(files = selectedSourceFiles()) {
  return Array.from(files || []).filter(Boolean).sort((a, b) =>
    String(a?.name || "").localeCompare(String(b?.name || ""), "zh-Hant", { numeric: true })
  );
}
function isLikelyLandTaxDeedFile(file) {
  const name = String(file?.name || "").normalize("NFKC").toLowerCase();
  return /土地|土謄|土建|地價|增值稅|land/.test(name);
}
function sourceFileNames(files = selectedSourceFiles()) {
  return files.map((file) => file?.name || "未命名檔案").filter(Boolean);
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
  showPreviewPlaceholder(`已選擇 ${list.length} 個檔案，按「顯示 PDF/圖片預覽」開啟。`);
  try {
    const pages = document.createElement("div");
    pages.className = "preview-pages";
    for (let index = 0; index < list.length; index += 1) {
      if (token !== sourcePreviewRenderToken) return;
      const file = list[index];
      if (isPdfFile(file)) {
        const page = createPreviewPage(`檔案 ${index + 1}/${list.length}：${file.name}（PDF）`);
        const note = document.createElement("div");
        note.className = "placeholder";
        note.textContent = "PDF 預覽請以主檔預覽為準；多檔模式會自動解析主建物謄本與土地謄本。";
        page.appendChild(note);
        pages.appendChild(page);
        continue;
      }
      const url = URL.createObjectURL(file);
      sourcePreviewObjectUrls.push(url);
      const page = createPreviewPage(`檔案 ${index + 1}/${list.length}：${file.name}`);
      const image = document.createElement("img");
      image.src = url;
      image.alt = file.name || "影本預覽";
      page.appendChild(image);
      pages.appendChild(page);
    }
    if (token === sourcePreviewRenderToken) els.sourcePreview.replaceChildren(pages);
  } catch (error) {
    if (token === sourcePreviewRenderToken) {
      showPreviewPlaceholder(`預覽建立失敗：${formatCaughtError(error)}`);
    }
  }
}
function normalizePresetFileName(fileName) {
  return String(fileName || "")
    .toLowerCase()
    .replace(/\.(pdf|png|jpe?g|webp)$/i, "")
    .replace(/[（(]\d+[）)]/g, "")
    .replace(/[\s._\-–—]+/g, "")
    .trim();
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
      address: els.recognizedPropertyAddress?.value || els.subjectAddress?.value || "",
    },
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
const OCR_FIELD_LABELS = {
  propertyAddress: "建物門牌",
  queryAddress: "查詢地址",
  mainArea: "主建物面積",
  attachArea: "附屬建物面積",
  commonArea: "共有部分面積",
  landShare: "土地持分坪",
  parkingArea: "車位坪數",
  parkingCount: "車位數量",
  totalFloors: "總樓層",
  unitFloor: "標的樓層",
  buildingType: "建物型態",
  purpose: "主要用途",
  completionDate: "建築完成日期"
};
const OCR_AREA_FIELD_NAMES = new Set(["mainArea", "attachArea", "commonArea", "landShare", "parkingArea"]);
const OCR_SOURCE_LABELS = {
  pdfTextLayer: "PDF 文字層",
  pdf_text_layer: "PDF 文字層",
  ocr_pipeline: "OCR 後端流程",
  ocr_pipeline_cache: "OCR 後端快取",
  ppocrv5_ncnn: "原生 ncnn OCR",
  native_ocr_cache: "原生 ncnn OCR 快取",
  paddleocr_docker: "Docker PaddleOCR",
  paddleocr_docker_cache: "Docker PaddleOCR 快取",
  pp_structure: "PP-Structure（已移出主流程）",
  pp_structure_cache: "PP-Structure 快取（已移出主流程）",
  paddleocr_vl: "PaddleOCR-VL 0.9B（已移除）",
  paddleocr_vl_cache: "PaddleOCR-VL 0.9B 快取（已移除）",
  gemini_2_5_flash: "Gemini 2.5 Flash（已移除）",
  gemini_2_5_flash_cache: "Gemini 2.5 Flash 快取（已移除）",
  macos_vision: "macOS Vision OCR（已停用）",
  macos_vision_cache: "macOS Vision OCR 快取（舊版）",
  fallback_none: "OCR 尚未可用",
  tesseract_cli: "Tesseract CLI（已停用）",
  paddleocr: "Legacy PaddleOCR",
  paddleocr_cache: "Legacy PaddleOCR 快取",
  browserOcr: "瀏覽器 OCR",
  onnxOcr: "ONNX OCR",
  rapidOcr: "RapidOCR 全頁 OCR",
  fieldLevelRapidOcr: "RapidOCR 欄位 OCR",
  cloudVisionOcr: "Cloud Vision 全頁 OCR",
  fieldLevelCloudVisionOcr: "Cloud Vision 欄位 OCR",
  rapidOcrCloudVision: "RapidOCR 全頁 OCR + Cloud Vision 補強",
  fieldLevelRapidOcrCloudVision: "RapidOCR 欄位 OCR + Cloud Vision 欄位 OCR",
  fullPageCommonRights: "完整頁權利範圍換算",
  yoloFieldDetector: "YOLO 版面偵測",
  yoloFieldRapidOcr: "YOLO 版面 + RapidOCR 欄位 OCR",
  yoloFieldCloudVisionOcr: "YOLO 版面 + Cloud Vision 欄位 OCR",
  yoloFieldGpt5Nano: "YOLO 版面 + GPT-5 nano",
  minimax_m3_validator: "MiniMax M3 欄位校正",
  minimaxM3Validator: "MiniMax M3 欄位校正",
  minimax_roi_vision: "MiniMax ROI Vision",
  minimaxRoiVision: "MiniMax ROI Vision",
  gemini25FlashVision: "Gemini 2.5 Flash Vision（已移除）",
  tesseractOcr: "Tesseract OCR（已停用）",
  fieldLevelTesseract: "Tesseract 欄位 OCR（已停用）",
  gpt5NanoCorrector: "GPT-5 nano 校正器",
  addressDictionaryNormalized: "地址字典正規化",
  knownFilePreset: "已知檔名保底",
  manualInput: "手動輸入",
  unknown: "未知"
};
let lastOcrFieldResults = appState.lastOcrFieldResults;
let lastOcrDiagnosticsMeta = appState.lastOcrDiagnosticsMeta;
function exposeOcrDiagnosticsDebug() {
  try {
    window.lastOcrFieldResults = lastOcrFieldResults;
    window.lastOcrDiagnosticsMeta = lastOcrDiagnosticsMeta;
  } catch (_) {}
}
function ocrSourceLabel(source) {
  const key = String(source || "");
  const known = OCR_SOURCE_LABELS[key];
  if (known) return known;
  const lowered = key.toLowerCase();
  if (lowered.includes("pp_structure") || lowered.includes("pp-structure")) return "PP-Structure（已移出主流程）";
  if (lowered.includes("paddleocr_vl") || lowered.includes("paddleocr-vl")) return "PaddleOCR-VL 0.9B（已移除）";
  if (lowered.includes("gemini_2_5_flash") || lowered.includes("gemini")) return "Gemini 2.5 Flash（已移除）";
  if (lowered.includes("paddleocr_docker") || lowered.includes("docker paddleocr")) return "Docker PaddleOCR";
  if (lowered.includes("paddleocr_cache") || lowered.includes("paddleocr cache")) return "Legacy PaddleOCR 快取";
  if (lowered.includes("paddleocr")) return "Legacy PaddleOCR";
  if (lowered.includes("browserocr") || (lowered.includes("browser") && lowered.includes("ocr"))) return "瀏覽器 OCR";
  const isFieldLevel = /field|欄位|重點/.test(lowered) || /欄位|重點/.test(key);
  const hasRapid = lowered.includes("rapid");
  const hasCloud = lowered.includes("cloud");
  if (hasRapid && hasCloud) {
    return isFieldLevel ? "RapidOCR 欄位 OCR + Cloud Vision 欄位 OCR" : "RapidOCR 全頁 OCR + Cloud Vision 補強";
  }
  if (hasCloud) return isFieldLevel ? "Cloud Vision 欄位 OCR" : "Cloud Vision 全頁 OCR";
  if (hasRapid) return isFieldLevel ? "RapidOCR 欄位 OCR" : "RapidOCR 全頁 OCR";
  if (lowered.includes("ppocrv5") || lowered.includes("ncnn")) return "原生 ncnn OCR";
  if (lowered.includes("macos_vision") || lowered.includes("vision")) return "macOS Vision OCR（已停用）";
  if (lowered.includes("tesseract_cli")) return "Tesseract CLI（已停用）";
  if (lowered.includes("tesseract")) return isFieldLevel ? "Tesseract 欄位 OCR（已停用）" : "Tesseract OCR（已停用）";
  if (lowered.includes("pdf")) return "PDF 文字層";
  return key || "--";
}
function setOcrDiagnosticsOpen(open) {
  if (!els.ocrFieldDiagnostics) return;
  els.ocrFieldDiagnostics.classList.toggle("is-hidden", !open);
  if (els.toggleOcrDiagnosticsBtn) {
    els.toggleOcrDiagnosticsBtn.textContent = open ? "隱藏欄位辨識診斷" : "顯示欄位辨識診斷";
  }
}
function syncOcrDiagnosticsButton(hasDiagnostics) {
  if (!els.toggleOcrDiagnosticsBtn) return;
  els.toggleOcrDiagnosticsBtn.classList.toggle("is-hidden", !hasDiagnostics);
  els.toggleOcrDiagnosticsBtn.disabled = !hasDiagnostics;
  if (!hasDiagnostics) els.toggleOcrDiagnosticsBtn.textContent = "顯示欄位辨識診斷";
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
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const seconds = ms / 1000;
  return `${seconds < 10 ? seconds.toFixed(2) : seconds.toFixed(1)} 秒`;
}
function normalizeRawAreaUnit(unit = "") {
  const text = String(unit || "").trim();
  if (/平方公$/i.test(text)) return "平方公尺";
  if (/平方公尺|平方?米|㎡|m2|m²/i.test(text)) return "平方公尺";
  return text;
}
function conciseRawText(value, maxLength = 72) {
  return String(value || "")
    .replace(/[*＊]+/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*[:：]\s*/g, "：")
    .trim()
    .slice(0, maxLength);
}
function formatRawAreaSnippet(label, value, unit) {
  const cleanLabel = String(label || "").replace(/面積$/, "").trim();
  const cleanUnit = normalizeRawAreaUnit(unit || "");
  const cleanValue = String(value || "").trim();
  return [cleanLabel, `${cleanValue}${cleanUnit}`].filter(Boolean).join(" ").trim();
}
function normalizeAttachedRawLabel(label) {
  const text = String(label || "").replace("臺", "台");
  if (/陽[台臺]/.test(text)) return "陽台";
  if (/花[台臺合喜]/.test(text)) return "花台";
  if (/雨遮|函遮|兩遮|雨造/.test(text)) return "雨遮";
  return text;
}
function isMainOrLayerAreaContext(source, start, matchedText = "") {
  if (/總坪數|總面積|層次面積/.test(String(matchedText || ""))) return true;
  const prefix = String(source || "").slice(Math.max(0, start - 14), start);
  return /(?:總坪數|總面積|層次面積)[:：*＊\s]*$/.test(prefix);
}
function formatStructuredAreaRaw(area, fieldName = "") {
  const entries = Array.isArray(area?.entries)
    ? area.entries.filter(Boolean)
    : (area && (area.rawValue != null || area.rawBaseValue != null || area.rights || area.label) ? [area] : []);
  if (entries.length) {
    if (fieldName === "attachArea") {
      return entries.map((entry) => {
        const label = String(entry.label || entry.purpose || "附屬建物").trim();
        const unit = normalizeRawAreaUnit(entry.unit || entry.rawBaseUnit || "");
        const value = entry.rawValue ?? entry.rawBaseValue ?? "";
        return `${label} ${value}${unit}`.trim();
      }).filter(Boolean).join("；");
    }
    if (fieldName === "commonArea") {
      return entries.map((entry) => {
        const unit = normalizeRawAreaUnit(entry.rawBaseUnit || entry.unit || "平方公尺");
        const value = entry.rawBaseValue ?? entry.rawValue ?? "";
        const rights = entry.rights ? ` 權利範圍 ${entry.rights}` : "";
        return `共有部分 ${value}${unit}${rights}`.trim();
      }).filter(Boolean).join("；");
    }
    if (fieldName === "parkingArea") {
      return entries.map((entry) => {
        const unit = normalizeRawAreaUnit(entry.rawBaseUnit || entry.unit || "平方公尺");
        const value = entry.rawBaseValue ?? entry.rawValue ?? "";
        const rights = entry.rights ? ` 權利範圍 ${entry.rights}` : "";
        return `停車位 ${value}${unit}${rights}`.trim();
      }).filter(Boolean).join("；");
    }
    if (fieldName === "mainArea") {
      return entries.map((entry) => {
        const label = String(entry.label || "主建物").trim();
        const unit = normalizeRawAreaUnit(entry.unit || "");
        const value = entry.rawValue ?? "";
        return `${label} ${value}${unit}`.trim();
      }).filter(Boolean).join("；");
    }
  }
  return "";
}
function ownershipDeedAreaRawFromText(rawText, fieldName = "") {
  const source = compactOcrText(rawText || "").replace(/[*＊]+/g, "");
  const isOwnershipDeed = /建物所有權狀|建物所有權状/.test(source);
  if (!isOwnershipDeed && fieldName !== "commonArea" && fieldName !== "parkingArea") return "";
  const number = "(\\d+[\\d,.]*)";
  const areaUnit = "(平方公尺|平方公|平方?米|m2|m²|㎡)";
  if (fieldName === "mainArea") {
    const match = source.match(new RegExp(`(?:總面積|面)[:：]?[^\\d]{0,20}${number}${areaUnit}`, "i"));
    if (match) return formatRawAreaSnippet(match[0].startsWith("總面積") ? "總面積" : "面", match[1], match[2]);
  }
  if (fieldName === "attachArea") {
    const match = source.match(new RegExp(`陽台.{0,80}?(?:面|面積|横|橫)[:：]?[^\\d]{0,20}${number}${areaUnit}`, "i"));
    if (match) return formatRawAreaSnippet("陽台", match[1], match[2]);
  }
  if (fieldName === "commonArea" || fieldName === "parkingArea") {
    const commonIndex = source.search(/共有部[分份]/);
    if (commonIndex < 0) return "";
    const section = source.slice(commonIndex).split(/權狀注記事|權狀註記事|建物所有權部|建物他項權利部|土地他項權利部/)[0];
    const base = section.match(new RegExp(`${number}${areaUnit}`, "i"));
    const parkingIndex = section.search(/停車位|含停車位|合停車位|車位編號|停車位編號/);
    const rights = [...section.matchAll(/(?:權利範圍)?[^\d]{0,40}(\d{1,12})\s*分之\s*(\d{1,12})/g)]
      .map((match) => ({ index: match.index || 0, end: (match.index || 0) + match[0].length, denom: match[1], num: match[2] }));
    if (!base || !rights.length) return "";
    if (parkingIndex < 0) {
      const total = rights.at(-1);
      return fieldName === "commonArea"
        ? `共有部分 ${base[1]}${normalizeRawAreaUnit(base[2])} 權利範圍 ${total.denom}分之${total.num}`
        : "";
    }
    const parkingEnd = parkingRightsScopeEnd(section, parkingIndex);
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
      const rightsText = `${total.denom}分之${total.num}-${parkingNum}`;
      return `共有部分 ${base[1]}${normalizeRawAreaUnit(base[2])} 權利範圍 ${rightsText}`;
    }
    if (fieldName === "parkingArea") {
      const numberMatch = section.match(/(?:停車位|含停車位|合停車位|車位編號|停車位編號)[^\d]{0,20}(\d{1,6})/);
      const countText = numberMatch ? `停車位編號${numberMatch[1]}` : "停車位";
      return `${countText} 權利範圍 ${total.denom}分之${parkingNum}`;
    }
  }
  return "";
}
function conciseAreaRawFromText(rawText, fieldName = "", labels = []) {
  const compact = compactOcrText(rawText || "").replace(/[*＊]+/g, "");
  if (!compact) return "";
  const ownershipRaw = ownershipDeedAreaRawFromText(rawText, fieldName);
  if (ownershipRaw) return ownershipRaw;
  const areaUnit = "(平方公尺|平方?米|m2|m²|㎡)";
  const number = "(\\d+[\\d,.]*)";
  if (fieldName === "attachArea") {
    const attachedUsage = "(陽臺|陽台|平台|雨遮|騎樓|露臺|露台|花臺|花台|門廊|走廊|樓梯間|屋簷|屋檐|屋頂突出物)";
    const source = compactOcrText(rawText || "").replace(/[*＊]+/g, "");
    const attachStart = source.search(/附屬建物用途|附屬建物/);
    const dateStart = source.search(/建築完成日期/);
    if (attachStart >= 0) {
      const splitTail = source.slice(attachStart).split(/建物所有權部|建物他項權利部|土地標示部|土地他項權利部|權狀注記事|權狀註記事/)[0];
      const splitLabels = [...splitTail.matchAll(new RegExp(attachedUsage, "g"))]
        .map((match) => normalizeAttachedRawLabel(match[1]))
        .filter((label, index, list) => label && list.indexOf(label) === index);
      const continuationTail = source.slice(attachStart, attachStart + 900);
      const continuationLabels = [...continuationTail.matchAll(new RegExp(attachedUsage, "g"))]
        .map((match) => normalizeAttachedRawLabel(match[1]))
        .filter((label, index, list) => label && list.indexOf(label) === index);
      let continuationZone = continuationTail;
      const continuationStop = continuationZone.search(/共有心|共有部分面積(?:\(YOLOROI\))?|共有部[分份]|公有部分|權利範圍|建物所有權部|建物他項權利部|土地標示部|土地他項權利部|其他登記事項/);
      if (continuationStop > 0) continuationZone = continuationZone.slice(0, continuationStop);
      const continuationAreaLabels = [...continuationZone.matchAll(/(?<!層次)(?<!總)面積[:：*＊]*/g)];
      if (continuationAreaLabels.length) {
        const areaLabel = continuationAreaLabels.at(-1);
        const areaZone = continuationZone.slice((areaLabel.index || 0) + areaLabel[0].length);
        const values = [];
        const seenContinuation = new Set();
        for (const match of areaZone.matchAll(new RegExp(`${number}${areaUnit}`, "gi"))) {
          const key = `${match[1]}|${match[2]}`;
          if (seenContinuation.has(key)) continue;
          seenContinuation.add(key);
          values.push({ raw: match[1], unit: match[2] });
        }
        if (values.length >= 2) {
          return values
            .map((item, index) => formatRawAreaSnippet(continuationLabels[index] || splitLabels[index] || splitLabels[0] || "附屬建物", item.raw, item.unit))
            .filter(Boolean)
            .join("；");
        }
      }
      const explicitAreaLabels = [...splitTail.matchAll(/(?<!層次)(?<!總)面積[:*＊]*/g)];
      if (splitLabels.length >= 2 && explicitAreaLabels.length) {
        const areaLabel = explicitAreaLabels.at(-1);
        let areaZone = splitTail.slice((areaLabel.index || 0) + areaLabel[0].length);
        const stop = areaZone.search(/其他登記事項|建物所有權部|建物他項權利部|土地標示部|土地他項權利部/);
        if (stop >= 0) areaZone = areaZone.slice(0, stop);
        const values = [];
        for (const match of areaZone.matchAll(new RegExp(`${number}${areaUnit}`, "gi"))) {
          const prefix = areaZone.slice(Math.max(0, (match.index || 0) - 42), match.index || 0);
          if (/共有部[分份]|公有部分|權利範圍|分之|建號/.test(prefix)) {
            if (values.length) break;
            continue;
          }
          values.push({ raw: match[1], unit: match[2] });
        }
        if (values.length >= 2) {
          return values
            .map((item, index) => formatRawAreaSnippet(splitLabels[index] || splitLabels[0] || "附屬建物", item.raw, item.unit))
            .filter(Boolean)
            .join("；");
        }
      }
      const sectionStart = dateStart >= 0 && dateStart < attachStart && attachStart - dateStart < 260 ? dateStart : attachStart;
      const tail = source.slice(sectionStart);
      const end = tail.search(/共有部[分份]|其他登記事項|建物所有權部|建物他項權利部/);
      const section = end > 0 ? tail.slice(0, end) : tail;
      const labelsFound = [...section.matchAll(new RegExp(attachedUsage, "g"))].map((match) => String(match[1] || "附屬建物").replace("臺", "台"));
      if (labelsFound.length === 1 && labelsFound[0] === "陽台" && /雨遮|兩遮/.test(source)) labelsFound.push("雨遮");
      const values = [...section.matchAll(new RegExp(`${number}${areaUnit}`, "gi"))];
      const seenValues = new Set();
      const sectionParts = [];
      values.forEach((match, index) => {
        if (isMainOrLayerAreaContext(section, match.index || 0, match[0])) return;
        const key = `${match[1]}|${match[2]}`;
        if (seenValues.has(key)) return;
        seenValues.add(key);
        const label = labelsFound[index] || labelsFound[0] || "附屬建物";
        sectionParts.push(formatRawAreaSnippet(label, match[1], match[2]));
      });
      if (sectionParts.length > 1) return sectionParts.join("；");
    }
    const matches = [
      ...compact.matchAll(new RegExp(`(?:附屬建物用途|附屬建物|用途)?${attachedUsage}[^面積\\d]{0,40}面積[^\\d]{0,40}${number}${areaUnit}`, "gi")),
      ...compact.matchAll(new RegExp(`(?:附屬建物用途|附屬建物|用途)?${attachedUsage}[^\\d]{0,40}${number}${areaUnit}`, "gi"))
    ];
    const seen = new Set();
    const parts = [];
    for (const match of matches) {
      if (isMainOrLayerAreaContext(compact, match.index || 0, match[0])) continue;
      const label = String(match[1] || "附屬建物").replace("臺", "台");
      const key = `${label}|${match[2]}|${match[3]}`;
      if (seen.has(key)) continue;
      seen.add(key);
      parts.push(formatRawAreaSnippet(label, match[2], match[3]));
    }
    if (parts.length > 1) return parts.join("；");
  } else if (fieldName === "commonArea") {
    const entries = [];
    const seen = new Set();
    const commonAreaUnit = "(平方公尺|平方公|平方?米|m2|m²|㎡)";
    const commonEntryRe = new RegExp(`建(?:號)?[*＊]*${number}${commonAreaUnit}.{0,180}?(?:權利範圍)?[^\\d]{0,80}(\\d{1,12})\\s*分之\\s*(\\d{1,12})`, "gi");
    for (const match of compact.matchAll(commonEntryRe)) {
      const key = `${match[1]}|${match[2]}|${match[3]}|${match[4]}`;
      if (seen.has(key)) continue;
      seen.add(key);
      entries.push(`共有部分 ${match[1]}${normalizeRawAreaUnit(match[2])} 權利範圍 ${match[3]}分之${match[4]}`);
    }
    if (entries.length > 1) return entries.join("；");
  }
  const matchers = [];
  if (fieldName === "attachArea") {
    matchers.push(new RegExp(`(陽台|平台|雨遮|騎樓|露台|花台|門廊|走廊|樓梯間)[^\\d]{0,50}${number}${areaUnit}`, "i"));
    matchers.push(new RegExp(`附屬建物用途[:：]?([^\\d面積]{1,12})?面積[^\\d]{0,30}${number}${areaUnit}`, "i"));
  } else if (fieldName === "commonArea") {
    matchers.push(new RegExp(`(共有部[分份])[^\\d]{0,80}${number}${areaUnit}`, "i"));
    matchers.push(new RegExp(`(共有部[分份].{0,12}?面積)[^\\d]{0,30}${number}${areaUnit}`, "i"));
  } else if (fieldName === "parkingArea") {
    matchers.push(new RegExp(`(停車位|車位)[^\\d]{0,80}${number}${areaUnit}`, "i"));
  } else if (fieldName === "mainArea") {
    matchers.push(new RegExp(`(主建物面積|主建物|層次面積|總面積)[^\\d]{0,80}${number}${areaUnit}`, "i"));
  }
  for (const label of labels) {
    matchers.push(new RegExp(`(${escapeRegExp(label)})[^\\d]{0,80}${number}${areaUnit}`, "i"));
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
  const source = cleanOcrText(rawText || "").replace(/[*＊]+/g, "").replace(/\s+/g, " ");
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
  const source = cleanOcrText(rawText || "").replace(/[*＊]+/g, "").replace(/\s+/g, " ");
  if (!source) return "";
  const noisyLabel = source.match(/(?:建物)?(?:層|层|眉)數[:：]?\s*([0-9０-９]{1,3}|[一二三四五六七八九十百千]+)(?![0-9０-９])/);
  if (noisyLabel) return `層數：${normalizeFullWidthDigitsToAscii(noisyLabel[1])}`;
  const patterns = [
    /(總樓層|總層數|層數|數)[:：]?\s*0*([0-9０-９]{1,3}|[一二三四五六七八九十百千]+)\s*(?:層|樓)/,
    /(層\s*數)[:：]?\s*0*([0-9０-９]{1,3}|[一二三四五六七八九十百千]+)\s*(?:層|樓)/
  ];
  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (match) return conciseRawText(match[0]);
  }
  return ocrRawSnippet(rawText, ["層數", "總樓層", "樓層"]);
}
function unitFloorRawSnippet(rawText, unitFloorValue = "") {
  const normalizedValue = parseFloorLevelToken(String(unitFloorValue || "").replace(/[層樓]/g, ""));
  const directValue = String(unitFloorValue || "").trim();
  const source = cleanOcrText(rawText || "").replace(/[*＊]+/g, "").replace(/\s+/g, " ");
  if (source) {
    const candidates = [
      /層次[:：]?\s*([0-9０-９一二三四五六七八九十百千壹]+)\s*(?:層|樓)(?!次面積)/g,
      /(?:層\s*)?次[:：]?\s*([0-9０-９一二三四五六七八九十百千壹]+)\s*(?:層|樓)(?!次面積)/g,
      /樓層[:：]?\s*([0-9０-９一二三四五六七八九十百千壹]+)\s*(?:層|樓)?/g
    ];
    for (const pattern of candidates) {
      for (const match of source.matchAll(pattern)) {
        const value = parseFloorLevelToken(match[1]);
        if (Number.isFinite(normalizedValue) && normalizedValue > 0 && value !== normalizedValue) continue;
        return conciseRawText(match[0]);
      }
    }
    const addressFloor = parseLastFloorFromAddress(source);
    if (Number.isFinite(normalizedValue) && normalizedValue > 0 && addressFloor === normalizedValue) {
      const match = source.match(/(?:建物門牌|門牌)?[^，。；\n]{0,60}?([0-9０-９一二三四五六七八九十百千壹]+)\s*樓(?:之[0-9０-９一二三四五六七八九十百千壹]+)?/);
      if (match) return conciseRawText(match[0]);
    }
    const snippet = ocrRawSnippet(rawText, ["層次", "樓層"]);
    if (snippet) return snippet;
  }
  if (Number.isFinite(normalizedValue) && normalizedValue > 0) return String(normalizedValue);
  return directValue;
}
function buildingTypeRawSnippet(rawText, typeValue = "") {
  const floorRaw = floorCountRawSnippet(rawText);
  const typeText = String(typeValue || "").trim();
  if (floorRaw && typeText) return `${floorRaw}，系統判定 ${typeText}`;
  return floorRaw || typeText;
}
function resolveBuildingTypeValue(parsed = {}, context = {}, totalFloorValue = "", fallbackTypeValue = "") {
  const parsedForType = parsedWithSupplementalLevelNumbers(parsed, context.rawText || "");
  const explicitType = shouldTreatParsedAsTownhouse(parsedForType, totalFloorValue) ? "透天" : (parsed?.foundType || context.buildingType || "");
  if (explicitType) return explicitType;
  if (shouldTreatWholeDoorplateLowRiseAsTownhouse(context.propertyAddress || context.queryAddress || "", totalFloorValue, context.mainAreaPing)) {
    return "透天";
  }
  const floorType = detectTypeByFloors(safeNumber(totalFloorValue || parsed?.floors || els.totalFloors?.value));
  return floorType || fallbackTypeValue;
}
function addOcrFieldResult(target, fieldName, value, raw, options = {}) {
  const textValue = value == null ? "" : String(value).trim();
  const rawText = raw == null ? "" : String(raw).trim();
  const warnings = Array.isArray(options.warnings) ? options.warnings.filter(Boolean) : [];
  if (!textValue && !warnings.length) warnings.push("未辨識");
  target[fieldName] = {
    value: textValue,
    rawOcr: rawText,
    raw: rawText,
    source: options.source || "unknown",
    confidence: Number.isFinite(Number(options.confidence)) ? Number(options.confidence) : null,
    warnings,
    corrections: Array.isArray(options.corrections) ? options.corrections.filter(Boolean) : [],
    needsReview: !!options.needsReview || (!textValue && options.source !== "knownFilePreset")
  };
}
function buildKnownPresetOcrFieldResults(fileName, preset, options = {}) {
  const results = {};
  if (!preset) return results;
  const source = "knownFilePreset";
  const confidence = 0.99;
  const warning = ["已知檔名保底，不視為 OCR 成功"];
  addOcrFieldResult(results, "propertyAddress", preset.address || "", preset.address || fileName, { source, confidence, warnings: warning });
  addOcrFieldResult(results, "queryAddress", preset.queryAddress || preset.address || "", preset.queryAddress || preset.address || fileName, { source, confidence, warnings: warning });
  addOcrFieldResult(results, "mainArea", preset.main || "", preset.main ? `${preset.main} 坪` : "", { source, confidence, warnings: warning });
  addOcrFieldResult(results, "attachArea", preset.attach || "", preset.attach ? `${preset.attach} 坪` : "", { source, confidence, warnings: warning });
  addOcrFieldResult(results, "commonArea", preset.common || "", preset.common ? `${preset.common} 坪` : "", { source, confidence, warnings: warning });
  addOcrFieldResult(results, "landShare", preset.land || "", preset.land ? `${preset.land} 坪` : "", { source, confidence, warnings: warning });
  addOcrFieldResult(results, "parkingArea", preset.parking || "", preset.parking ? `${preset.parking} 坪` : "", { source, confidence, warnings: warning });
  addOcrFieldResult(results, "parkingCount", preset.parkingCount || "", preset.parkingCount || "", { source, confidence, warnings: warning });
  addOcrFieldResult(results, "totalFloors", preset.floors || "", preset.floors || "", { source, confidence, warnings: warning });
  addOcrFieldResult(results, "unitFloor", preset.unitFloor || "", preset.unitFloor || "", { source, confidence, warnings: warning });
  addOcrFieldResult(results, "buildingType", preset.type || "", preset.type || "", { source, confidence, warnings: warning });
  addOcrFieldResult(results, "purpose", preset.purpose || "", preset.purpose || "", { source, confidence, warnings: warning });
  addOcrFieldResult(results, "completionDate", "", "", { source, confidence: 0, warnings: [] });
  return mergeOcrFieldResultObjects(results, options.extra || {});
}
function mergeOcrFieldResultObjects(primary = {}, fallback = {}) {
  const merged = { ...(primary || {}) };
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
      ...(Array.isArray(current.warnings) ? current.warnings : []),
      ...(Array.isArray(value.warnings) ? value.warnings : [])
    ].filter(Boolean)));
    const corrections = [
      ...(Array.isArray(current.corrections) ? current.corrections : []),
      ...(Array.isArray(value.corrections) ? value.corrections : [])
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
const AI_ENHANCEMENT_FIELD_MAP = {
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
  return Array.from(new Set([...(Array.isArray(existing) ? existing : []), ...additions.filter(Boolean)]));
}
function applyAiEnhancementToOcrFieldResults(fieldResults = {}, aiEnhancement = {}) {
  if (!aiEnhancement || typeof aiEnhancement !== "object") return fieldResults || {};
  const merged = { ...(fieldResults || {}) };
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
        warnings: appendUniqueWarnings(existing.warnings, [aiEnhancementReason(item, "MiniMax M3 已校正欄位")]),
        corrections: [
          ...(Array.isArray(existing.corrections) ? existing.corrections : []),
          { reason: aiEnhancementReason(item, "MiniMax M3 已校正欄位"), type: "minimax_m3_auto_applied" }
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
        warnings: appendUniqueWarnings(existing.warnings, [aiEnhancementReason(item, "MiniMax M3 建議人工確認")]),
        corrections: [
          ...(Array.isArray(existing.corrections) ? existing.corrections : []),
          { reason: aiEnhancementReason(item, "MiniMax M3 建議人工確認"), type: "minimax_m3_needs_review" }
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
        warnings: appendUniqueWarnings(existing.warnings, [aiEnhancementReason(item, "MiniMax ROI Vision 已校正欄位")]),
        corrections: [
          ...(Array.isArray(existing.corrections) ? existing.corrections : []),
          { reason: aiEnhancementReason(item, "MiniMax ROI Vision 已校正欄位"), type: "minimax_roi_vision_auto_applied" }
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
        warnings: appendUniqueWarnings(existing.warnings, [aiEnhancementReason(item, "MiniMax ROI Vision 建議人工確認")]),
        corrections: [
          ...(Array.isArray(existing.corrections) ? existing.corrections : []),
          { reason: aiEnhancementReason(item, "MiniMax ROI Vision 建議人工確認"), type: "minimax_roi_vision_needs_review" }
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
    const value = preferBackendFields && hasFallback ? fallbackValue : (parsedArea?.valuePing ?? fallbackValue ?? "");
    const raw = diagnosticAreaRaw(parsedArea, ocrRawSnippet(rawText, labels), fieldName, rawText, labels);
    addOcrFieldResult(results, fieldName, value, raw, { source, confidence, warnings });
  };
  area("mainArea", parsed?.main, fields.main_building_area_ping ?? domFallback(els.mainArea?.value), ["主建物面積", "主建物", "層次面積", "總面積"]);
  area("attachArea", parsed?.attach, fields.attached_building_area_ping ?? domFallback(els.attachArea?.value), ["附屬建物面積", "附屬建物", "陽台", "雨遮"]);
  area("commonArea", parsed?.common, fields.common_area_ping ?? domFallback(els.commonArea?.value), ["共有部分", "共有部份", "權利範圍"]);
  const landValue = parsed?.landShare?.valuePing ?? domFallback(els.landShareArea?.value);
  const landRaw = parsed?.landShare?.entries?.length
    ? parsed.landShare.entries.map((entry) => {
      const parcel = entry.parcel ? `${entry.parcel} ` : "";
      const areaText = entry.areaText || entry.area || "";
      const unit = normalizeRawAreaUnit(entry.unit || "平方公尺");
      const rights = entry.rights || formatRightsFromRatio(entry.ratio);
      return `${parcel}土地面積 ${areaText}${unit} 權利範圍 ${rights}`.trim();
    }).join("\n")
    : (landValue ? stripPingFromAreaRaw(els.landShareRaw?.value || ocrRawSnippet(rawText, ["土地標示部", "土地面積", "權利範圍"])) : "");
  addOcrFieldResult(results, "landShare", landValue, landRaw, { source, confidence, warnings });
  const backendParkingArea = fields.parking_area_ping ?? null;
  const parkingAreaValue = preferBackendFields && backendParkingArea != null
    ? backendParkingArea
    : (parsed?.parkingDeedShare?.valuePing ?? backendParkingArea ?? domFallback(els.parkingArea?.value));
  const parkingAreaRaw = parsed?.parkingDeedShare?.valuePing != null || backendParkingArea != null
    ? diagnosticAreaRaw(parsed?.parkingDeedShare, ocrRawSnippet(rawText, ["車位編號", "停車位編號"]), "parkingArea", rawText, ["車位編號", "停車位編號"])
    : "";
  addOcrFieldResult(results, "parkingArea", parkingAreaValue, parkingAreaRaw, { source, confidence, warnings });
  const parkingCountValue = fields.parking_count ?? parsed?.parkingCount ?? parsed?.parkingDeedShare?.count ?? domFallback(els.parkingCount?.value);
  const parkingCountRaw = parkingCountValue ? ocrRawSnippet(rawText, ["車位編號", "停車位編號"]) : "";
  addOcrFieldResult(results, "parkingCount", parkingCountValue, parkingCountRaw, { source, confidence, warnings });
  const propertyAddress = fields.building_address || parsed?.propertyAddress || parsed?.address || context.queryAddress || domFallback(els.subjectAddress?.value) || "";
  addOcrFieldResult(results, "propertyAddress", propertyAddress, propertyAddress || ocrRawSnippet(rawText, ["建物門牌", "門牌"]), { source, confidence, warnings });
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
  const purposeValue = fields.main_usage || parsed?.purpose || selectedMainPurposes().join("、");
  const purposeRaw = ocrRawSnippet(rawText, ["主要用途"]) || fields.main_usage || parsed?.purpose || "";
  addOcrFieldResult(results, "purpose", purposeValue, purposeRaw, { source, confidence, warnings });
  addOcrFieldResult(results, "completionDate", fields.completion_date || parsed?.completionDateText || "", fields.completion_date || parsed?.completionDateText || ocrRawSnippet(rawText, ["建築完成日期"]), { source, confidence, warnings });
  if (context.preset) {
    return mergeOcrFieldResultObjects(results, buildKnownPresetOcrFieldResults(context.fileName || "", context.preset));
  }
  return results;
}

const BACKEND_DIAGNOSTIC_FIELD_MAP = {
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
  if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  const resultValue = result?.value;
  return resultValue === undefined || resultValue === null ? "" : resultValue;
}

function backendDiagnosticRaw(diagnostics = {}, backendKey = "", result = {}) {
  return result?.raw || diagnostics?.raw_snippets?.[backendKey] || "";
}

function backendDiagnosticWarnings(diagnostics = {}, backendKey = "", generalWarnings = []) {
  const fieldWarnings = Array.isArray(diagnostics?.warnings_structured)
    ? diagnostics.warnings_structured
      .filter((warning) => !warning?.field || String(warning.field).startsWith(String(backendKey).replace(/_(sqm|ping)$/, "")))
      .map((warning) => warning.reason || warning.action || "")
      .filter(Boolean)
    : [];
  return Array.from(new Set([...(generalWarnings || []), ...fieldWarnings]));
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
    const confidence = Number.isFinite(Number(backendResult.confidence))
      ? Number(backendResult.confidence)
      : (Number.isFinite(Number(diagnostics?.field_scores?.[backendKey])) ? Number(diagnostics.field_scores[backendKey]) : context.confidence);
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
  if (!hasValue) return { text: "未採用", className: "ocr-muted" };
  if (result.source === "knownFilePreset") return { text: "保底帶入", className: "ocr-review" };
  if (Number.isFinite(confidence) && confidence < 0.75) return { text: "採用，請檢查", className: "ocr-review" };
  return { text: "自動採用", className: "ocr-auto" };
}
function stripPingFromAreaRaw(value) {
  return String(value ?? "")
    .replace(/\s*[／/]\s*[\d,.]+\s*坪/g, "")
    .replace(/\s*\/\s*[\d,.]+\s*坪/g, "")
    .replace(/\s*=\s*[\d,.]+\s*坪/g, "")
    .trim();
}
const OCR_WARNING_TRANSLATIONS = [
  [/PDF OCR limited to first\s+(\d+)\s+of\s+(\d+)\s+pages/i, (m) => `PDF 快速模式僅辨識前 ${m[1]}/${m[2]} 頁`],
  [/page\s+(\d+)\s+used fast single-pass OCR/i, (m) => `第 ${m[1]} 頁採快速 OCR，未二次前處理`],
  [/main_building_area was not confidently parsed/i, () => "主建物面積信心不足"],
  [/attached_building_area was not confidently parsed/i, () => "附屬建物面積信心不足"],
  [/common_area was not confidently parsed/i, () => "共有部分面積信心不足"],
  [/land_share was not confidently parsed/i, () => "土地持分信心不足"],
  [/main_usage was not confidently parsed/i, () => "主要用途信心不足"],
  [/completion_date was not confidently parsed/i, () => "建築完成日期信心不足"],
  [/building_address was not confidently parsed/i, () => "建物門牌信心不足"],
  [/native worker binary missing/i, () => "原生 OCR 程式尚未安裝"],
  [/native worker model directory missing|native worker model files missing|native worker model missing/i, () => "原生 OCR 模型尚未安裝"],
  [/native worker timeout/i, () => "原生 OCR 逾時"],
  [/native worker returned invalid JSON/i, () => "原生 OCR 回傳格式異常"],
  [/Docker PaddleOCR fallback used/i, () => "已改用 Docker PaddleOCR 補強"],
  [/Docker PaddleOCR fallback skipped/i, () => "Docker PaddleOCR 未啟用或無法連線"],
  [/Docker PaddleOCR fallback failed/i, () => "Docker PaddleOCR 辨識失敗"],
  [/Docker PaddleOCR returned malformed JSON|Docker PaddleOCR returned malformed response/i, () => "Docker PaddleOCR 回傳格式異常"],
  [/Docker PaddleOCR returned no text/i, () => "Docker PaddleOCR 未讀到文字"],
  [/PP-Structure/i, () => "PP-Structure 已移出主流程"],
  [/Gemini 2\.5 Flash|gemini_2_5_flash|Gemini API/i, () => "Gemini 2.5 Flash 已移除"],
  [/PaddleOCR-VL|PaddleOCR_VL/i, () => "PaddleOCR-VL 0.9B 已移除"],
  [/native OCR fallback used macOS Vision OCR/i, () => "舊版 macOS Vision 備援訊息（本版已停用）"],
  [/macOS Vision OCR returned no text/i, () => "macOS Vision 已停用"],
  [/macOS Vision OCR timeout/i, () => "macOS Vision 已停用"],
  [/macOS Vision OCR failed/i, () => "macOS Vision 已停用"],
  [/macOS Vision OCR binary missing/i, () => "macOS Vision 已停用"],
  [/native OCR fallback used Tesseract CLI/i, () => "舊版 Tesseract 備援訊息（本版已停用）"],
  [/tesseract OCR returned no text/i, () => "Tesseract 已停用"],
  [/tesseract OCR timeout/i, () => "Tesseract 已停用"],
  [/tesseract OCR failed/i, () => "Tesseract 已停用"],
  [/tesseract language data missing/i, () => "Tesseract 已停用"],
  [/PaddleOCR 未完成，採快速解析結果|OCR 後端未完成，採快速解析結果/i, () => "OCR 後端未完成，採快速解析"],
  [/未辨識/i, () => "未辨識"]
];
const OCR_FIELD_WARNING_PATTERNS = {
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
  return text
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 48);
}
function warningMatchesField(fieldName, warning) {
  const text = String(warning || "");
  if (/未辨識/.test(text)) return true;
  return (OCR_FIELD_WARNING_PATTERNS[fieldName] || []).some((pattern) => pattern.test(text));
}
function uniqueBriefWarnings(warnings = []) {
  const seen = new Set();
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
  return uniqueBriefWarnings(warnings.filter((warning) => warningMatchesField(fieldName, warning))).slice(0, 3).join("；");
}
function genericWarningText(fieldResults = {}) {
  const all = Object.values(fieldResults || {}).flatMap((result) => Array.isArray(result?.warnings) ? result.warnings : []);
  return uniqueBriefWarnings(all.filter((warning) => {
    const text = String(warning || "");
    return /PDF OCR limited|PDF OCR 僅處理|single-pass OCR|快速 OCR|PaddleOCR 未完成|OCR 後端未完成|原生 ncnn OCR|native worker|macOS Vision|Tesseract|Docker PaddleOCR|PP-Structure|PaddleOCR-VL|MiniMax M3|MiniMax ROI Vision/i.test(text);
  })).slice(0, 4).join("；");
}
function buildOcrWarningRow(label, text, colspan = 6) {
  if (!text) return "";
  return `<tr class="ocr-warning-row"><td>${escapeHtml(label)}</td><td colspan="${colspan}">警示：${escapeHtml(text)}</td></tr>`;
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
  return [result?.source, ocrCorrectionText(result), ...(Array.isArray(result?.warnings) ? result.warnings : [])].join(" ");
}
function aiKeysForOcrField(fieldName) {
  return Object.entries(AI_ENHANCEMENT_FIELD_MAP)
    .filter(([, fields]) => fields.includes(fieldName))
    .map(([key]) => key);
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
    pushOcrFieldBadge(badges, "需人工確認", "ocr-badge-review", "此欄位被標記為需人工確認");
  }
  if (/minimax_roi_vision|MiniMax ROI Vision/i.test(sourceText) || fieldHasAiEnhancementItem(roi, fieldName, "auto_applied")) {
    pushOcrFieldBadge(badges, "MiniMax ROI Vision 已校正", "ocr-badge-ai", "MiniMax ROI Vision 已套用校正");
  }
  if (/minimax_m3|MiniMax M3/i.test(sourceText) || fieldHasAiEnhancementItem(ai, fieldName, "auto_applied")) {
    pushOcrFieldBadge(badges, "MiniMax M3 已校正", "ocr-badge-ai", "MiniMax M3 已套用校正");
  }
  if (/rejected|not_applied|未套用|建議未套用/i.test(sourceText)
    || fieldHasAiEnhancementItem(ai, fieldName, "rejected")
    || fieldHasAiEnhancementItem(roi, fieldName, "rejected")) {
    pushOcrFieldBadge(badges, "AI 建議未套用", "ocr-badge-muted", "AI 有建議但未符合自動套用條件");
  }
  if (Number.isFinite(confidence) && confidence >= 0.86 && !/minimax/i.test(sourceText)) {
    pushOcrFieldBadge(badges, "Parser 高信心", "ocr-badge-parser", "欄位 parser 信心達 0.86 以上");
  }
  if (/ppocrv5|ncnn|pdf_text_layer|pdfTextLayer|macos_vision|native_ocr/i.test(String(result?.source || ""))) {
    pushOcrFieldBadge(badges, "本機 OCR", "ocr-badge-local", "由本機 OCR 或 PDF 文字層提供");
  }
  return badges.slice(0, 3);
}
function renderOcrFieldBadges(fieldName, result = {}, meta = {}) {
  const badges = buildOcrFieldBadges(fieldName, result, meta);
  if (!badges.length) return "";
  return `<div class="ocr-field-badges">${badges.map((badge) => (
    `<span class="ocr-field-badge ${escapeHtml(badge.className)}" title="${escapeHtml(badge.title)}">${escapeHtml(badge.label)}</span>`
  )).join("")}</div>`;
}
function candidateComparisonReasonText(reason = "") {
  const text = String(reason || "").trim();
  const translated = {
    "current text empty": "目前 OCR 無文字，採用候選",
    "field score improved": "欄位分數明顯提升",
    "critical fields filled": "補足關鍵欄位且未衝突",
    "field score not clearly better": "欄位分數未明顯提升",
    "common area rights supplemented": "補足共有部分權利範圍",
    "native deed needs field supplement": "原生 OCR 需要欄位補強",
    "previous OCR engine returned fallback_none": "前一階段沒有可用 OCR 文字",
    "OCR text too short": "OCR 文字過短",
    "OCR confidence below threshold": "OCR 信心低於門檻",
    "native OCR unavailable": "原生 OCR 不可用"
  }[text];
  if (translated) return translated;
  if (/deed field score too low/i.test(text)) return "謄本欄位分數偏低";
  return translateOcrWarning(text);
}
function buildCandidateComparisonRow(meta = {}) {
  const comparison = meta.candidateComparison || meta.candidate_comparison || null;
  if (!comparison || typeof comparison !== "object" || comparison.available !== true) return "";
  const comparisons = Array.isArray(comparison.comparisons) ? comparison.comparisons : [];
  const adopted = Array.isArray(comparison.adopted) ? comparison.adopted : [];
  const item = adopted[adopted.length - 1] || comparison.last || comparisons[comparisons.length - 1] || null;
  if (!item) return "";
  const stateText = item.adopted ? "已採用" : "未採用";
  const source = ocrSourceLabel(item.provider || item.candidate_engine || "");
  const scoreText = [
    item.current_score != null ? `原 ${item.current_score}/${item.score_denominator || 8}` : "",
    item.candidate_score != null ? `候選 ${item.candidate_score}/${item.score_denominator || 8}` : ""
  ].filter(Boolean).join("，");
  const raw = [
    source,
    scoreText,
    candidateComparisonReasonText(item.reason),
    item.trigger_reason ? `觸發：${candidateComparisonReasonText(item.trigger_reason)}` : ""
  ].filter(Boolean).join("；");
  return `<tr class="ocr-token-row"><td>OCR 候選比較</td><td>${escapeHtml(source || "候選補強")}</td><td class="ocr-muted">--</td><td class="ocr-muted">--</td><td class="${item.adopted ? "ocr-auto" : "ocr-review"}">${escapeHtml(stateText)}</td><td class="ocr-raw-cell">${escapeHtml(raw)}</td><td>${escapeHtml(comparisons.length ? `${comparisons.length} 筆比較` : "--")}</td></tr>`;
}
function fallbackProviderListText(values = []) {
  const providers = Array.isArray(values) ? values : [];
  return providers.map((provider) => ocrSourceLabel(provider)).filter(Boolean).join("、");
}
function buildFallbackSummaryRow(meta = {}) {
  const fallbacks = meta.fallbacks || meta.fallback_summary || null;
  if (!fallbacks || typeof fallbacks !== "object" || fallbacks.available !== true) return "";
  const tried = fallbackProviderListText(fallbacks.providers_tried);
  const adopted = fallbackProviderListText(fallbacks.providers_adopted);
  const rejected = fallbackProviderListText(fallbacks.providers_rejected);
  const stateText = adopted ? "已採用" : tried ? "已檢查" : "記錄";
  const sourceText = adopted || tried || ocrSourceLabel(fallbacks.last_provider) || "備援流程";
  const raw = [
    tried ? `嘗試：${tried}` : "",
    adopted ? `採用：${adopted}` : "",
    rejected ? `未採用：${rejected}` : "",
    fallbacks.fallback_reason ? `原因：${candidateComparisonReasonText(fallbacks.fallback_reason)}` : ""
  ].filter(Boolean).join("；");
  const count = Number(fallbacks.comparison_count || 0);
  return `<tr class="ocr-token-row"><td>OCR 備援摘要</td><td>${escapeHtml(sourceText)}</td><td class="ocr-muted">--</td><td class="ocr-muted">--</td><td class="${adopted ? "ocr-auto" : "ocr-muted"}">${escapeHtml(stateText)}</td><td class="ocr-raw-cell">${escapeHtml(raw || "無備援採用")}</td><td>${escapeHtml(count ? `${count} 筆比較` : "--")}</td></tr>`;
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
  return Number.isFinite(numeric) ? `${Number(numeric.toFixed(3))} 坪` : text;
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
  const timingRow = timing.elapsedMs != null
    ? `<tr class="ocr-token-row"><td>謄本 OCR 計時</td><td>${escapeHtml(ocrSourceLabel(timing.source))}</td><td>${escapeHtml(formatElapsedMs(timing.elapsedMs))}</td><td class="ocr-muted">--</td><td class="ocr-muted">記錄</td><td class="ocr-raw-cell">${escapeHtml(timing.cacheHit ? "快取命中" : translateOcrWarning(timing.note || ""))}</td><td>${escapeHtml(formatElapsedMs(timing.elapsedMs))}</td></tr>`
    : "";
  const candidateComparisonRow = buildCandidateComparisonRow(meta);
  const fallbackSummaryRow = buildFallbackSummaryRow(meta);
  const genericWarnings = buildOcrWarningRow("流程警示", genericWarningText(fieldResults));
  els.ocrFieldDiagnostics.innerHTML = `<div class="ocr-diagnostics-title"><span>欄位辨識診斷</span><span class="ocr-muted">raw 只顯示對應欄位 OCR 原文；value 顯示系統採用值，面積一律正規化為坪</span></div><table><thead><tr><th>欄位</th><th>來源</th><th>OCR計時</th><th>信心</th><th>狀態</th><th>raw（OCR原文）</th><th>value（面積=坪）</th></tr></thead><tbody>${timingRow}${candidateComparisonRow}${fallbackSummaryRow}${genericWarnings}${rows}</tbody></table>`;
  syncOcrDiagnosticsButton(true);
  setOcrDiagnosticsOpen(els.ocrFieldDiagnostics.dataset.manual === "open");
}
async function copyFieldValue(input, okText, emptyText) {
  const value = String(input?.value || "").trim();
  if (!value) {
    setMessage("warn", emptyText);
    return;
  }
  await navigator.clipboard.writeText(value);
  setMessage("ok", okText);
}

function toHalfWidth(text) {
  return String(text || "")
    .normalize("NFKC")
    .replace(/\(([零〇一二三四五六七八九十百千壹貳參肆伍陸柒捌玖拾]+)\)/g, "$1")
    .replace(/\u3000/g, " ")
    .replace(/[！-～]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xFEE0))
    .replace(/[臺]/g, "台")
    .replace(/[㈯]/g, "土")
    .replace(/[㈲]/g, "有")
    .replace(/[㈰]/g, "日")
    .replace(/[㈪]/g, "月")
    .replace(/[㈾]/g, "資")
    .replace(/[㊠]/g, "項")
    .replace(/[㊞]/g, "印")
    .replace(/[㊟]/g, "注")
    .replace(/[㉂]/g, "自")
    .replace(/[㉃]/g, "至")
    .replace(/[㆞]/g, "地")
    .replace(/[㆒]/g, "一")
    .replace(/[㆓]/g, "二")
    .replace(/[㆔]/g, "三")
    .replace(/[㆕]/g, "四");
}
function cleanOcrText(text) {
  return toHalfWidth(String(text || ""))
    .replace(/⺠/g, "民")
    .replace(/佳圆/g, "佳園")
    .replace(/高牌號|高牌号/g, "門牌號")
    .replace(/建第完成日期|建第完成曰期/g, "建築完成日期")
    .replace(/建物眉數/g, "建物層數")
    .replace(/利幢/g, "權利範圍")
    .replace(/建号/g, "建號")
    .replace(/编號/g, "編號")
    .replace(/合停車位/g, "含停車位")
    .replace(/树林/g, "樹林")
    .replace(/数/g, "數")
    .replace(/层/g, "層")
    .replace(/楼/g, "樓")
    .replace(/屏/g, "層")
    .replace(/阳台/g, "陽台")
    .replace(/花臺|花合|花喜/g, "花台")
    .replace(/兩遮|函遮|雨造/g, "雨遮")
    .replace(/[：:]/g, ":")
    .replace(/權利:/g, "權利範圍:")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
function compactOcrText(text) {
  return cleanOcrText(text)
    .replace(/[*＊]+/g, "")
    .replace(/[ \t]+/g, "")
    .replace(/\n+/g, "");
}
function normalizeArea(rawValue, unit, ratio = 1) { const numeric = Number(String(rawValue || "").replace(/,/g, "")); if (!Number.isFinite(numeric)) return null; const adjusted = numeric * ratio; const ping = /平方公尺|平方?米|m2|㎡/i.test(unit) ? adjusted / 3.305785 : adjusted; return { rawValue: numeric, adjustedValue: +adjusted.toFixed(3), unit, valuePing: +ping.toFixed(3) }; }
function normalizeParkingRightsShare(rawValue, unit = "平方公尺") {
  const area = normalizeArea(rawValue, unit);
  if (!area) return null;
  return { ...area, unit: `停車位權利範圍(${unit})` };
}
function parkingRightsScopeEnd(text, parkingIdx) {
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
function attachParkingCount(area, count) {
  const n = normalizeParkingCount(count);
  if (area && n > 0) area.count = n;
  return area;
}
function truncate3(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n * 1000) / 1000;
}
function normalizeLandShareArea(rawValue, unit, ratio = 1) {
  const numeric = Number(String(rawValue || "").replace(/,/g, ""));
  if (!Number.isFinite(numeric)) return null;
  const adjusted = numeric * ratio;
  const ping = /平方公尺|平方?米|m2|㎡/i.test(unit) ? adjusted / 3.305785 : adjusted;
  const valuePing = truncate3(ping);
  if (valuePing == null) return null;
  return { rawValue: numeric, adjustedValue: truncate3(adjusted), unit, valuePing };
}
function parseRightsRatioFromMatch(match) {
  if (!match) return null;
  if (match.wan != null) {
    const num = Number(match.wan);
    return Number.isFinite(num) ? num / 10000 : null;
  }
  if (match.all) return 1;
  const denom = Number(match.denom);
  const num = Number(match.num);
  if (!Number.isFinite(denom) || !Number.isFinite(num) || denom <= 0) return null;
  return num / denom;
}
function parseLandShareEntries(rawText) {
  const source = cleanOcrText(rawText);
  if (!source) return [];
  const compact = source.replace(/\n+/g, " ");
  const areaRe = /(\d+[\d,.]*)\s*(平方公尺|平方?米|m2|㎡|坪)/gi;
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
    const candidates = areas
      .filter((area) => !area.used && Math.abs(area.index - right.index) <= 220)
      .map((area) => {
        const before = area.index < right.index;
        const distance = before ? right.index - area.end : area.index - right.end;
        return { area, distance: Math.abs(distance), before };
      })
      .sort((a, b) => (a.before === b.before ? a.distance - b.distance : a.before ? -1 : 1));
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
function sliceCompactSection(source, startPatterns, endPatterns) {
  const compact = compactOcrText(source);
  if (!compact) return "";
  const starts = startPatterns.map((pattern) => compact.search(pattern)).filter((index) => index >= 0);
  if (!starts.length) return "";
  const start = Math.min(...starts);
  const tail = compact.slice(start);
  const ends = endPatterns
    .map((pattern) => {
      const index = tail.search(pattern);
      return index > 0 ? index : -1;
    })
    .filter((index) => index >= 0);
  const end = ends.length ? Math.min(...ends) : tail.length;
  return tail.slice(0, end);
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
  const seen = new Set();
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
  const labelPattern = hasExplicitLandSection ? "(?:土地面積|地積|面積)" : "(?:土地面積|地積)";
  for (const match of source.matchAll(new RegExp(`${labelPattern}[:：]?[^\\d]{0,40}(\\d+[\\d,.]*)(平方公尺|平方?米|m2|㎡|坪)`, "gi"))) {
    pushMatch(match);
  }
  if (!matches.length && hasExplicitLandSection) {
    for (const match of source.matchAll(/(\d+[\d,.]*)(平方公尺|平方?米|m2|㎡|坪)/gi)) {
      pushMatch(match);
    }
  }
  return matches.sort((a, b) => a.index - b.index);
}
function parseLandRightsFromOwnershipSection(rawText) {
  const ownership = sliceCompactSection(
    rawText,
    [/土地所有權部/, /權利範圍/, /所有權人/],
    [/土地他項權利部/, /建物標示部/, /建物所有權部/, /建物他項權利部/]
  );
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
      ratio = Number(numText) / 10000;
    } else if (m[4]) {
      denomText = "1";
      numText = "1";
      ratio = 1;
    }
    if (ratio != null && ratio > 0) {
      lineRights.push({ index: lineRights.length, text: `${denomText}分之${numText}`, ratio, denomText, numText });
    }
  }
  if (lineRights.length) return lineRights;
  const source = (ownership || compactOcrText(rawText))
    .replace(/歷次取得權利範圍[:：*]*(?:\d{1,12}分之\d{1,12}|萬分之\d{1,12}|全部)[*]*/g, "");
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
      if (Number.isFinite(wan)) ratio = wan / 10000;
    } else if (match[4] || match[5]) {
      denomText = "1";
      numText = "1";
      ratio = 1;
    }
    if (ratio != null && ratio > 0) {
      rights.push({ index: match.index || 0, text: match[0], ratio, denomText, numText });
    }
  }
  return rights.filter((item, index) => !rights.some((other, otherIndex) => (
    otherIndex !== index
    && other.denomText === item.denomText
    && item.numText.length > other.numText.length
    && item.numText.startsWith(other.numText)
  )));
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
  const seen = new Set();
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
  }, new Map());
  const result = [];
  const seen = new Set();
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
  if (Number.isFinite(r) && Math.abs(r - 1) < 1e-9) return "1分之1";
  return rightsText || "";
}
function detectLandParcelLabel(section) {
  const compact = compactOcrText(section);
  const match = compact.match(/([\u4e00-\u9fff]{1,16}段)?([0-9０-９]{1,6}[-－][0-9０-９]{1,6})地號/);
  if (!match) return "";
  let segment = match[1] || "";
  segment = segment.replace(/^.*[市縣區鄉鎮]/, "");
  const parcelNo = toHalfWidth(match[2]).replace(/－/g, "-");
  return `${segment}${parcelNo}地號`;
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
    const nextBuilding = compact.indexOf("建物標示部", start + 1);
    const endCandidates = [nextLand, nextBuilding]
      .filter((value) => Number.isFinite(value) && value > start);
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
      const areas = parseLandAreasFromLabelSection(section);
      const rights = parseLandRightsFromOwnershipSection(section);
      if (!areas.length || !rights.length) continue;
      const ratio = Math.min(1, rights.reduce((sum, item) => sum + item.ratio, 0));
      if (!Number.isFinite(ratio) || ratio <= 0) continue;
      const rightsText = formatRightsFromRatio(ratio, rights.map((item) => item.text).join("、"));
      const parcel = detectLandParcelLabel(section);
      for (const area of areas) {
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
      const valuePing = truncate3(sectionEntries.reduce((sum, item) => sum + item.valuePing, 0));
      return { valuePing, entries: sectionEntries };
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
    const rightsText = formatRightsFromRatio(ratio, rights.map((item) => item.text).join("、"));
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
  const unit = entry.unit || "平方公尺";
  const rights = entry.rights || formatRightsFromRatio(entry.ratio);
  const subtotal = entry.valuePing != null ? ` = ${formatNum(entry.valuePing, 3)} 坪` : "";
  return `${parcel}土地面積 ${areaText}${unit} 權利範圍 ${rights}${subtotal}`.trim();
}
function applyParsedLandShare(landShare) {
  if (!landShare || !els.landShareArea || !els.landShareRaw) return false;
  let applied = false;
  if (landShare.entries?.length) {
    els.landShareRaw.value = landShare.entries.map(formatLandShareEntryStable).join("\n");
    applied = true;
  }
  if (landShare.valuePing != null) {
    const nextValue = String(landShare.valuePing);
    els.landShareArea.value = nextValue;
    els.landShareArea.dataset.autoValue = nextValue;
    els.landShareArea.title = `已解析 ${landShare.entries?.length || 0} 筆土地持分，合計 ${formatNum(landShare.valuePing, 3)} 坪`;
    applied = true;
  }
  return applied;
}
function clearParsedLandShare() {
  if (els.landShareRaw) els.landShareRaw.value = "";
  if (els.landShareArea) {
    els.landShareArea.value = "";
    delete els.landShareArea.dataset.autoValue;
    els.landShareArea.title = "未辨識土地持分";
  }
}
function extractLandShareFromOcrText(rawText) {
  return extractLandShareFromOcrTextStable(rawText);
}
function syncLandShareAreaFromRaw() {
  if (!els.landShareRaw || !els.landShareArea) return { valuePing: toNumber(els.landShareArea?.value), entries: [] };
  const raw = String(els.landShareRaw.value || "").trim();
  const result = extractLandShareFromOcrText(raw);
  if (raw && result.valuePing != null) {
    const nextAuto = String(result.valuePing);
    const prevAuto = els.landShareArea.dataset.autoValue || "";
    const current = String(els.landShareArea.value || "").trim();
    if (!current || current === prevAuto || document.activeElement === els.landShareRaw) {
      els.landShareArea.value = nextAuto;
    }
    els.landShareArea.dataset.autoValue = nextAuto;
    els.landShareArea.title = `已解析 ${result.entries.length} 筆土地持分，合計 ${formatNum(result.valuePing, 3)} 坪`;
  }
  return result;
}
function escapeRegExp(text) { return String(text || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function extractArea(text, labels) {
  const sources = [cleanOcrText(text), compactOcrText(text)];
  for (const source of sources) {
    for (const label of labels) {
      const match = source.match(new RegExp(`${escapeRegExp(label)}[^\\d]{0,80}(\\d+[\\d,.]*)(?:\\s*)(平方公尺|平方?米|m2|㎡|坪)`, "i"));
      if (match) return normalizeArea(match[1], match[2]);
    }
  }
  return null;
}
function sumAreaItems(items) {
  const valid = items.filter((item) => item && Number.isFinite(item.valuePing));
  if (!valid.length) return null;
  const valuePing = +valid.reduce((sum, item) => sum + item.valuePing, 0).toFixed(3);
  const adjustedValue = +valid.reduce((sum, item) => {
    if (Number.isFinite(item.adjustedValue)) return sum + item.adjustedValue;
    return sum;
  }, 0).toFixed(3);
  const entries = valid.flatMap((item) => Array.isArray(item.entries) ? item.entries : [item])
    .filter((item) => item && (item.rawValue != null || item.rawBaseValue != null || item.rights || item.label));
  const result = { valuePing };
  if (adjustedValue > 0) {
    result.adjustedValue = adjustedValue;
    result.unit = "平方公尺";
  }
  if (entries.length) result.entries = entries;
  return result;
}
function areaItemWithMeta(item, meta = {}) {
  return item ? { ...item, ...meta } : null;
}
function isArcadeLayerLabel(label = "") {
  return /騎樓/.test(compactOcrText(label));
}
function isFirstFloorLayerLabel(label = "") {
  const text = normalizeFullWidthDigitsToAscii(compactOcrText(label));
  return /^(?:1|一|壹)層/.test(text) || /^(?:1|一|壹)樓/.test(text);
}
function extractAttachAreaSum(text) {
  const source = compactOcrText(text);
  if (!source) return null;
  const hasAttachedLabels = /附屬建物/.test(source);
  if (hasAttachedLabels) {
    const attachedUsage = "(陽臺|陽台|平台|雨遮|騎樓|露臺|露台|花臺|花台|門廊|走廊|樓梯間|屋簷|屋檐|屋頂突出物)";
    const unitPattern = "(平方公尺|平方?米|m2|㎡|坪)";
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
      const items = [];
      const seen = new Set();
      const seenPhysicalSqm = [];
      for (const match of areaZone.matchAll(new RegExp(`(\\d+[\\d,.]*)${unitPattern}`, "gi"))) {
        const item = normalizeArea(match[1], match[2]);
        if (!item || item.rawValue > 500 || item.valuePing <= 0 || item.valuePing > 50) continue;
        const sqm = /平方公尺|平方?米|m2|㎡/i.test(item.unit) ? item.adjustedValue : item.valuePing * 3.305785;
        if (Number.isFinite(sqm) && seenPhysicalSqm.some((value) => Math.abs(value - sqm) <= 0.05)) continue;
        if (Number.isFinite(sqm)) seenPhysicalSqm.push(sqm);
        const key = `${item.rawValue}|${item.unit}`;
        if (seen.has(key)) continue;
        seen.add(key);
        items.push(areaItemWithMeta(item, { label: "附屬建物" }));
      }
      if (items.length >= 2) return sumAreaItems(items.slice(0, 4));
    }
    const attachedStart = source.search(/附屬建物用途|附屬建物/);
    const dateStart = source.search(/建築完成日期/);
    const start = dateStart >= 0 && attachedStart >= 0 && dateStart < attachedStart && attachedStart - dateStart < 260
      ? dateStart
      : attachedStart;
    const tail = start >= 0 ? source.slice(start) : source;
    const end = tail.search(/共有部分|共有部份|其他登記事項|建物所有權部|建物他項權利部/);
    const section = end > 0 ? tail.slice(0, end) : tail;
    const usageLabels = [...section.matchAll(new RegExp(attachedUsage, "g"))]
      .map((match) => String(match[1] || "附屬建物").replace("臺", "台"));
    if (usageLabels.length === 1 && usageLabels[0] === "陽台" && /雨遮/.test(source)) usageLabels.push("雨遮");
    const sectionItems = [];
    const sectionSeen = new Set();
    [...section.matchAll(new RegExp(`(\\d+[\\d,.]*)${unitPattern}`, "gi"))].forEach((match, index) => {
      if (isMainOrLayerAreaContext(section, match.index || 0, match[0])) return;
      const item = normalizeArea(match[1], match[2]);
      if (!item || item.rawValue > 500) return;
      const key = `${item.rawValue}|${item.unit}`;
      if (sectionSeen.has(key)) return;
      sectionSeen.add(key);
      sectionItems.push(areaItemWithMeta(item, { label: usageLabels[index] || usageLabels[0] || "附屬建物" }));
    });
    if (sectionItems.length) return sumAreaItems(sectionItems);
    const explicitMatches = [
      ...section.matchAll(new RegExp(`(?:附屬建物用途|附屬建物|用途)?${attachedUsage}[^面積\\d]{0,40}面積[^\\d]{0,40}(\\d+[\\d,.]*)${unitPattern}`, "gi")),
      ...section.matchAll(new RegExp(`(?:附屬建物用途|附屬建物|用途)?${attachedUsage}[^\\d]{0,40}(\\d+[\\d,.]*)${unitPattern}`, "gi"))
    ];
    const explicitItems = [];
    const explicitSeen = new Set();
    for (const match of explicitMatches) {
      if (isMainOrLayerAreaContext(section, match.index || 0, match[0])) continue;
      const label = String(match[1] || "附屬建物").replace("臺", "台");
      const item = areaItemWithMeta(normalizeArea(match[2], match[3]), { label });
      if (!item) continue;
      const key = `${label}|${item.rawValue}|${item.unit}`;
      if (explicitSeen.has(key)) continue;
      explicitSeen.add(key);
      explicitItems.push(item);
    }
    if (explicitItems.length) return sumAreaItems(explicitItems);
  }
  const orphanAreaMatches = [
    ...source.matchAll(/(?:建築完成日期|築完成日期)[^面積]{0,80}面積[^\d]{0,30}(\d+[\d,.]*)(平方公尺|平方?米|m2|㎡|坪)(?=共有部[分份])/gi),
    ...source.matchAll(/層次面積[^\d]{0,30}\d+[\d,.]*(?:平方公尺|平方?米|m2|㎡|坪).{0,120}?面積[^\d]{0,30}(\d+[\d,.]*)(平方公尺|平方?米|m2|㎡|坪)(?=共有部[分份])/gi)
  ];
  const orphanSeen = new Set();
  const orphanItems = orphanAreaMatches.map((match) => normalizeArea(match[1], match[2])).filter(Boolean).filter((item) => {
    const key = `${item.rawValue}|${item.unit}`;
    if (orphanSeen.has(key)) return false;
    orphanSeen.add(key);
    return true;
  });
  if (orphanItems.length && !hasAttachedLabels) return sumAreaItems(orphanItems);
  const attachedUsage = "(陽臺|陽台|平台|雨遮|騎樓|露臺|露台|花臺|花台|門廊|走廊|樓梯間|屋簷|屋檐|屋頂突出物)";
  const layerMatches = [
    ...source.matchAll(new RegExp(`層次[:：]?${attachedUsage}(?:層次)?面積[^\\d]{0,40}(\\d+[\\d,.]*)(平方公尺|平方?米|m2|㎡|坪)`, "gi")),
    ...source.matchAll(new RegExp(`層次[:：]?${attachedUsage}[^面積\\d]{0,40}面積[^\\d]{0,40}(\\d+[\\d,.]*)(平方公尺|平方?米|m2|㎡|坪)`, "gi"))
  ];
  const hasFirstFloorLayer = [...source.matchAll(/層次[:：]?(.{1,18}?)(?:層次)?面積[^\d]{0,40}\d+[\d,.]*(?:平方公尺|平方?米|m2|㎡|坪)/gi)]
    .some((match) => isFirstFloorLayerLabel(match[1]));
  const layerSeen = new Set();
  const layerItems = layerMatches.map((match) => {
    const label = String(match[1] || "附屬建物").replace("臺", "台");
    if (hasFirstFloorLayer && isArcadeLayerLabel(label)) return null;
    return areaItemWithMeta(normalizeArea(match[2], match[3]), { label });
  }).filter((item) => {
    if (!item) return false;
    const key = `${item.label}|${item.rawValue}|${item.unit}`;
    if (layerSeen.has(key)) return false;
    layerSeen.add(key);
    return true;
  });
  if (layerItems.length) return sumAreaItems(layerItems);
  if (!hasAttachedLabels) return null;
  const interleaved = [];
  const interleavedMatches = [
    ...source.matchAll(/附屬建物用途.{0,160}?共有部[分份].{0,160}?面積[^\d]{0,30}(\d+[\d,.]*)(平方公尺|平方?米|m2|㎡|坪)/gi),
    ...source.matchAll(/附屬建物.{0,160}?共有部[分份].{0,160}?面積[^\d]{0,30}(\d+[\d,.]*)(平方公尺|平方?米|m2|㎡|坪)/gi)
  ];
  for (const match of interleavedMatches) {
    const item = normalizeArea(match[1], match[2]);
    if (item) interleaved.push(item);
  }
  if (interleaved.length) return sumAreaItems(interleaved);
  const end = source.search(/共有部分|共有部份|其他登記事項|建物所有權部|建物他項權利部/);
  const section = end > 0 ? source.slice(0, end) : source;
  const matches = [
    ...section.matchAll(/附屬建物用途.*?面積[^\d]{0,40}(\d+[\d,.]*)(平方公尺|平方?米|m2|㎡|坪)/gi),
    ...section.matchAll(/附屬建物用途[^\d]{0,80}(\d+[\d,.]*)(平方公尺|平方?米|m2|㎡|坪)/gi)
  ];
  const items = matches.map((match) => normalizeArea(match[1], match[2])).filter(Boolean);
  const seen = new Set();
  return sumAreaItems(items.filter((item) => {
    const key = `${item.rawValue}|${item.unit}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }));
}
function extractLayerMainAreaSum(text) {
  const source = compactOcrText(text);
  if (!source) return null;
  const attachedUsage = /(陽臺|陽台|平台|雨遮|騎樓|露臺|露台|花臺|花台|門廊|走廊|樓梯間|屋簷|屋檐|屋頂突出物)/;
  const layerSeen = new Set();
  const layerItems = [];
  const layerRows = [...source.matchAll(/層次[:：]?(.{1,18}?)(?:層次)?面積[^\d]{0,40}(\d+[\d,.]*)(平方公尺|平方?米|m2|㎡|坪)/gi)]
    .map((match) => ({
      label: String(match[1] || "").replace(/^[:：]+/, "").trim(),
      value: match[2],
      unit: match[3]
    }))
    .filter((row) => row.label);
  const hasFirstFloorLayer = layerRows.some((row) => isFirstFloorLayerLabel(row.label));
  for (const row of layerRows) {
    const label = row.label;
    const isArcadeAsMain = hasFirstFloorLayer && isArcadeLayerLabel(label);
    if (attachedUsage.test(label) && !isArcadeAsMain) continue;
    if (!isArcadeAsMain && !/[一二三四五六七八九十\d０-９]+層|地下|夾層|屋頂/.test(label)) continue;
    const item = areaItemWithMeta(normalizeArea(row.value, row.unit), { label });
    if (!item) continue;
    const key = `${label}|${item.rawValue}|${item.unit}`;
    if (layerSeen.has(key)) continue;
    layerSeen.add(key);
    layerItems.push(item);
  }
  return sumAreaItems(layerItems);
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
function extractFractionAreas(sectionText) { return [...String(sectionText || "").matchAll(/(\d{1,6})\s*分之\s*(\d{1,6})[^\d]{0,30}(\d+[\d,.]*)(平方公尺|平方?米|m2|㎡|坪)/gi)].map((match) => normalizeArea(match[3], match[4], Number(match[2]) / Number(match[1]))).filter(Boolean); }
function sumFractionAreas(sectionText) { const items = extractFractionAreas(sectionText); if (!items.length) return null; return { valuePing: +items.reduce((sum, item) => sum + item.valuePing, 0).toFixed(3) }; }
/** 共有部分：整筆面積（平方公尺）× 權利範圍（萬分之、10000分之127）。sectionText 為 extractSection 擷取之「標題後片段」，不含「共有部分」字面。 */
function largestSqmInText(c) {
  const re = /(\d+[\d,.]*)\s*(?:平方公尺|平方?米|㎡)/g;
  let m;
  let best = 0;
  while ((m = re.exec(c)) !== null) {
    const v = Number(String(m[1]).replace(/,/g, ""));
    if (Number.isFinite(v) && v > best) best = v;
  }
  return best > 0 ? best : null;
}
function extractCommonAreaFromBaseSqmAndRightsFraction(sectionText) {
  const c = compactOcrText(sectionText);
  if (!c || c.length < 8) return null;
  const baseSqm = largestSqmInText(c);
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
    if (wanM) ratio = Number(wanM[1]) / 10000;
  }
  if (ratio == null || !Number.isFinite(ratio) || ratio <= 0 || ratio > 1) return null;
  const effectiveSqm = baseSqm * ratio;
  return normalizeArea(String(effectiveSqm), "平方公尺");
}
/**
 * 共有部分與停車位分攤同一筆基地／大樓面積（平方公尺）：先出現之「權利範圍」為含車位合計分子，
 * 「停車位」之後再出現之「權利範圍」為車位專屬分子；共有坪數應扣除車位分子（與謄本註記一致）。
 */
function extractCommonAndParkingFromSharedBase(sectionText) {
  const c = compactOcrText(sectionText);
  if (!c || c.length < 8) return null;
  const baseSqm = largestSqmInText(c);
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
  const split = splitSharedParkingRights(allRights, parkingIdx, parkingRightsScopeEnd(c, parkingIdx));
  if (!split) return null;
  const { totalRight, parkingRights, parkingNum } = split;
  const commonSqm = (baseSqm * (totalRight.num - parkingNum)) / totalRight.denom;
  const parkingSqm = (baseSqm * parkingNum) / totalRight.denom;
  const common = areaItemWithMeta(normalizeArea(String(commonSqm), "平方公尺"), {
    rawBaseValue: baseSqm,
    rawBaseUnit: "平方公尺",
    rights: `${totalRight.denom}分之${totalRight.num}-${parkingNum}`
  });
  const parking = areaItemWithMeta(normalizeParkingRightsShare(parkingSqm), {
    rawBaseValue: baseSqm,
    rawBaseUnit: "平方公尺",
    rights: `${totalRight.denom}分之${parkingNum}`
  });
  return {
    common,
    parking: attachParkingCount(parking, parkingRights.length)
  };
}
function extractCommonAndParkingSums(sectionText) {
  const c = compactOcrText(sectionText);
  if (!c || !/共有部分|共有部份/.test(c)) return null;
  const commonItems = [];
  const parkingItems = [];
  let parkingCount = 0;
  const entryRe = /(?:共有部[分份][:：]?)?[\u4e00-\u9fff]{0,12}\d{5}-\d{3}建(?:號)?[*＊]*(\d+[\d,.]*)(平方公尺|平方?米|m2|㎡|坪)(.*?)(?=(?:共有部[分份][:：]?[\u4e00-\u9fff]{0,12}\d{5}-\d{3}建)|其他登記事項共\d+筆|建物所有權部|建物他項權利部|查詢時間|$)/g;
  const commonSeen = new Set();
  let entryMatch;
  while ((entryMatch = entryRe.exec(c)) !== null) {
    const base = normalizeArea(entryMatch[1], entryMatch[2]);
    if (!base) continue;
    const slice = String(entryMatch[3] || "").split(/其他登記事項|建物所有權部|建物他項權利部|土地他項權利部/)[0] || "";
    const rights = [...slice.matchAll(/權利範圍[^\d]{0,160}?(\d{1,12})\s*分之\s*(\d{1,12})/g)]
      .map((m) => ({ index: m.index || 0, denom: Number(m[1]), num: Number(m[2]) }))
      .filter((item) => item.denom > 0 && Number.isFinite(item.num));
    if (!rights.length) continue;
    const parkingIdx = slice.search(/停車位|含停車位|合停車位|車位共計|車位編號|停車位編號/);
    if (parkingIdx >= 0) {
      const split = splitSharedParkingRights(rights, parkingIdx, parkingRightsScopeEnd(slice, parkingIdx));
      if (split) {
        const { totalRight, parkingRights, parkingNum } = split;
        commonItems.push(areaItemWithMeta(
          normalizeArea(String(base.rawValue * (totalRight.num - parkingNum) / totalRight.denom), entryMatch[2]),
          {
            rawBaseValue: base.rawValue,
            rawBaseUnit: entryMatch[2],
            rights: `${totalRight.denom}分之${totalRight.num}-${parkingNum}`
          }
        ));
        parkingItems.push(areaItemWithMeta(
          normalizeParkingRightsShare(base.rawValue * parkingNum / totalRight.denom, entryMatch[2]),
          {
            rawBaseValue: base.rawValue,
            rawBaseUnit: entryMatch[2],
            rights: `${totalRight.denom}分之${parkingNum}`
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
      normalizeArea(String(base.rawValue * firstRight.num / firstRight.denom), entryMatch[2]),
      {
        rawBaseValue: base.rawValue,
        rawBaseUnit: entryMatch[2],
        rights: `${firstRight.denom}分之${firstRight.num}`
      }
    ));
  }
  if (commonItems.length || parkingItems.length) {
    const common = sumAreaItems(commonItems);
    const parking = sumAreaItems(parkingItems);
    attachParkingCount(parking, parkingCount);
    return common || parking ? { common, parking } : null;
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
    const baseSqm = largestSqmInText(slice);
    if (baseSqm == null) continue;
    const rights = [...slice.matchAll(/權利範圍[^\d]{0,160}?(\d{1,12})\s*分之\s*(\d{1,12})/g)]
      .map((m) => ({ index: m.index || 0, denom: Number(m[1]), num: Number(m[2]) }))
      .filter((item) => item.denom > 0 && Number.isFinite(item.num));
    if (!rights.length) continue;
    const parkingIdx = slice.search(/停車位|含停車位|合停車位|車位共計|車位編號|停車位編號/);
    if (parkingIdx >= 0) {
      const split = splitSharedParkingRights(rights, parkingIdx, parkingRightsScopeEnd(slice, parkingIdx));
      if (split) {
        const { totalRight, parkingRights, parkingNum } = split;
        commonItems.push(areaItemWithMeta(
          normalizeArea(String(baseSqm * (totalRight.num - parkingNum) / totalRight.denom), "平方公尺"),
          {
            rawBaseValue: baseSqm,
            rawBaseUnit: "平方公尺",
            rights: `${totalRight.denom}分之${totalRight.num}-${parkingNum}`
          }
        ));
        parkingItems.push(areaItemWithMeta(
          normalizeParkingRightsShare(baseSqm * parkingNum / totalRight.denom),
          {
            rawBaseValue: baseSqm,
            rawBaseUnit: "平方公尺",
            rights: `${totalRight.denom}分之${parkingNum}`
          }
        ));
        parkingCount += parkingRights.length;
        continue;
      }
    }
    const firstRight = rights[0];
    commonItems.push(areaItemWithMeta(
      normalizeArea(String(baseSqm * firstRight.num / firstRight.denom), "平方公尺"),
      {
        rawBaseValue: baseSqm,
        rawBaseUnit: "平方公尺",
        rights: `${firstRight.denom}分之${firstRight.num}`
      }
    ));
  }
  const common = sumAreaItems(commonItems);
  const parking = sumAreaItems(parkingItems);
  attachParkingCount(parking, parkingCount);
  return common || parking ? { common, parking } : null;
}
function extractCommonAreaFromCommonMarkers(sectionText) {
  const c = normalizeFullWidthDigitsToAscii(compactOcrText(sectionText)).replace(/[．。]/g, ".");
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
    const rightMatch =
      slice.match(/權利範圍[^\d]{0,120}?(\d{1,12})\s*分之\s*(\d{1,12})/)
      || slice.match(/(?:^|[^\d])(\d{1,12})\s*分之\s*(\d{1,12})/);
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
        rights: `${denom}分之${num}`
      });
    }
  }
  return sumAreaItems(items);
}
function compactCommonRoiLabelText(text) {
  return normalizeFullWidthDigitsToAscii(compactOcrText(text || ""))
    .replace(/\s+/g, "")
    .replace(/Y\s*O\s*L\s*O\s*R\s*O\s*I/gi, "YOLOROI");
}
function isSyntheticCommonRoiOnlySection(sectionText) {
  const compact = compactCommonRoiLabelText(sectionText);
  if (!compact || !/^面積(?:[\(（]?YOLOROI[\)）]?)/.test(compact)) return false;
  return !hasRealCommonPartEvidenceStable(`共有部分${sectionText}`);
}
function extractCommonSectionSlice(text) {
  /** 勿以首段「其他登記事項」截斷：停車位權利範圍常列於其後，須一併納入才能拆算共有／車位 */
  const ends = ["建物所有權部", "建物他項權利部", "建物他項權利", "查詢時間"];
  const a = extractSection(text, "共有部分", ends);
  if (a && !isSyntheticCommonRoiOnlySection(a)) return a;
  const b = extractSection(text, "共有部份", ends);
  return b && !isSyntheticCommonRoiOnlySection(b) ? b : "";
}
function extractCommonRawEntriesForDiagnostics(text) {
  const compact = compactOcrText(text || "").replace(/[*＊]+/g, "");
  if (!compact) return [];
  const number = "(\\d+[\\d,.]*)";
  const areaUnit = "(平方公尺|平方公|平方?米|m2|m²|㎡)";
  const entries = [];
  const seen = new Set();
  const re = new RegExp(`建(?:號)?[*＊]*${number}${areaUnit}.{0,180}?(?:權利範圍)?[^\\d]{0,80}(\\d{1,12})\\s*分之\\s*(\\d{1,12})`, "gi");
  for (const match of compact.matchAll(re)) {
    const rawBaseValue = Number(String(match[1] || "").replace(/,/g, ""));
    if (!Number.isFinite(rawBaseValue)) continue;
    const rawBaseUnit = normalizeRawAreaUnit(match[2] || "平方公尺");
    const rights = `${match[3]}分之${match[4]}`;
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
  const compact = compactOcrText(text);
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
  const compact = compactOcrText(text);
  if (!compact) return null;
  const matches = [
    compact.match(/層次[:：]?([0-9０-９一二三四五六七八九十百千壹]+)層(?!次面積)/),
    compact.match(/層次[:：]?([0-9０-９一二三四五六七八九十百千壹]+)樓/),
    compact.match(/樓層[:：]?([0-9０-９一二三四五六七八九十百千壹]+)(?:樓|層)?/)
  ];
  for (const match of matches) {
    if (!match) continue;
    const n = parseFloorLevelToken(match[1]);
    if (n != null) return n;
  }
  return parseLastFloorFromAddress(compact);
}
function detectType(text) { if (/透天/.test(text)) return "透天"; if (/住宅大樓|大樓/.test(text)) return "住宅大樓"; if (/華廈/.test(text)) return "華廈"; if (/公寓/.test(text)) return "公寓"; return ""; }
function detectCityFromText(text) {
  const normalized = cleanOcrText(text).replace(/\s+/g, "");
  for (const city of Object.keys(CITY_DISTRICTS)) {
    const candidates = [city, city.replace(/^臺/, "台"), city.replace(/^台/, "臺")];
    if (candidates.some((candidate) => candidate && normalized.includes(candidate))) {
      return city.replace(/^台/, "臺");
    }
  }
  return "";
}
function detectDistrictFromText(text, city = "") {
  const normalized = cleanOcrText(text).replace(/\s+/g, "");
  const sources = city && CITY_DISTRICTS[city]
    ? [{ city, districts: CITY_DISTRICTS[city] }]
    : Object.entries(CITY_DISTRICTS).map(([name, districts]) => ({ city: name, districts }));
  for (const source of sources) {
    for (const district of source.districts) {
      if (normalized.includes(district)) return district;
    }
  }
  return "";
}
function inferCityByDistrict(district) {
  if (!district) return "";
  const matched = Object.entries(CITY_DISTRICTS).filter(([, districts]) => districts.includes(district));
  return matched.length === 1 ? matched[0][0] : "";
}
function detectDoorplateFragment(text) {
  const compact = compactOcrText(text);
  const num = "[\\d０-９]+";
  const patterns = [
    new RegExp(`((?:[\\u4e00-\\u9fff]{1,12}(?:路|街|大道))${RE_ADDR_ROAD_OPTIONAL_SECTION}(?:${num}巷)?(?:${num}弄)?${num}(?:之${RE_ADDR_SUFFIX_NUMBER})?號(?:${RE_ADDR_FLOOR_NUMBER}樓(?:之${RE_ADDR_SUFFIX_NUMBER})?)?)`),
    new RegExp(`((?:[\\u4e00-\\u9fff]{1,12}(?:路|街|大道))${RE_ADDR_ROAD_OPTIONAL_SECTION}(?:${num}巷)?(?:${num}弄)?${num}(?:之${num})?號)`)
  ];
  for (const pattern of patterns) {
    const match = compact.match(pattern);
    if (match) return match[1].trim();
  }
  return "";
}
const PROPERTY_ADDRESS_STOP_LABELS = [
  "建物坐落地號",
  "建物坐落地号",
  "坐落地號",
  "坐落地号",
  "主要用途",
  "主要建材",
  "層數",
  "總面積",
  "層次面積",
  "建物標示部",
  "建物所有權部",
  "其他登記事項"
];
function cutPropertyAddressAtStopLabel(value) {
  const normalized = compactOcrText(value);
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
  if (!door) return clipped.replace(/^台/, "臺");
  const doorTail = stripLeadingCityDistrictFromAddress(door);
  const parsed = parseAddressParts(clipped);
  if (parsed.city && parsed.district) {
    return `${normalizeCityToken(parsed.city)}${parsed.district}${doorTail}`.replace(/^台/, "臺");
  }
  const district = detectDistrictFromText(clipped);
  if (district && clipped.includes(district)) {
    const city = normalizeCityToken(detectCityFromText(clipped) || inferCityByDistrict(district));
    const tail = doorTail.startsWith(district) ? doorTail.slice(district.length) : doorTail;
    return `${city || ""}${district}${tail}`.replace(/^台/, "臺");
  }
  return doorTail.replace(/^台/, "臺");
}
function addressMatchText(value) {
  return normalizeFullWidthDigitsToAscii(compactOcrText(value || ""))
    .replace(/臺/g, "台")
    .replace(/[，,、。．.]/g, "");
}
function completeDoorplateFromMatchingAddress(doorplate, text) {
  const doorTail = addressMatchText(stripLeadingCityDistrictFromAddress(doorplate));
  const source = addressMatchText(text);
  if (!doorTail || !source || !/(?:路|街|大道).+號/.test(doorTail)) return "";
  let index = source.indexOf(doorTail);
  while (index >= 0) {
    const prefix = source.slice(Math.max(0, index - 96), index);
    for (const [city, districts] of Object.entries(CITY_DISTRICTS)) {
      const cityKey = addressMatchText(city);
      for (const district of districts) {
        const re = new RegExp(`${escapeRegExp(cityKey)}${escapeRegExp(district)}(?:[\\u4e00-\\u9fff]{1,12}(?:里|村))?(?:\\d{1,3}鄰)?$`);
        if (re.test(prefix)) {
          return `${city}${district}${doorTail}`.replace(/^台/, "臺");
        }
      }
    }
    index = source.indexOf(doorTail, index + doorTail.length);
  }
  return "";
}
function stripVillageNeighborhoodPrefix(text) {
  let normalized = cleanOcrText(text).replace(/\s+/g, "");
  normalized = normalized.replace(/^[\u4e00-\u9fff]{1,12}(?:里|村)/u, "");
  normalized = normalized.replace(/^\d{1,3}鄰/u, "");
  return normalized;
}
function buildFullAddressFromFragment(fragment, text) {
  const normalizedFragment = cleanOcrText(fragment).replace(/\s+/g, "");
  if (!normalizedFragment) return "";
  const matchedFullAddress = completeDoorplateFromMatchingAddress(normalizedFragment, text);
  if (matchedFullAddress) return matchedFullAddress;
  const fragmentCity = detectCityFromText(normalizedFragment);
  const fragmentDistrict = detectDistrictFromText(normalizedFragment, fragmentCity) || detectDistrictFromText(normalizedFragment);
  /** 謄本 PDF 表頭常有「臺北市信義區」機關址，若用 detectCityFromText 第一筆會誤套門牌；缺片段時優先採全文最後一組合法市＋區 */
  const lastPair = extractLastValidCityDistrict(text);
  const contextCity = fragmentCity || lastPair?.city || detectCityFromText(text);
  const contextDistrict = fragmentDistrict || lastPair?.district || detectDistrictFromText(text, contextCity) || detectDistrictFromText(text);
  const resolvedDistrict = fragmentDistrict || contextDistrict;
  const resolvedCity = fragmentCity || inferCityByDistrict(fragmentDistrict) || contextCity || inferCityByDistrict(resolvedDistrict);
  const withDistrict = resolvedDistrict && !normalizedFragment.includes(resolvedDistrict) ? `${resolvedDistrict}${normalizedFragment}` : normalizedFragment;
  const cityVariants = resolvedCity ? [resolvedCity, resolvedCity.replace(/^臺/, "台"), resolvedCity.replace(/^台/, "臺")] : [];
  const withCity = resolvedCity && !cityVariants.some((city) => city && withDistrict.includes(city)) ? `${resolvedCity}${withDistrict}` : withDistrict;
  return withCity.replace(/^台/, "臺");
}
function stripFloorFromAddress(address) {
  return cleanOcrText(address)
    .replace(/\s+/g, "")
    .replace(new RegExp(`(?:地下)?${RE_ADDR_FLOOR_NUMBER}樓(?:之${RE_ADDR_SUFFIX_NUMBER})?$`, "u"), "")
    .replace(new RegExp(`(?:之${RE_ADDR_SUFFIX_NUMBER})?(?:室)?$`, "u"), (matched) => (
      new RegExp(`^之${RE_ADDR_SUFFIX_NUMBER}$`, "u").test(matched) ? matched : ""
    ));
}
function detectResidenceAddress(text) {
  const compact = compactOcrText(text);
  const match = compact.match(/住址[北址]?:?(.+?)(?:權利範圍|權狀字號|出生年月日|登記原因|統一編號|其他登記事項|權利人)/);
  if (!match) return "";
  return buildFullAddressFromFragment(match[1], compact);
}
/** 建物登記謄本（第二類等）—用於縮小 OCR／解析範圍 */
function isBuildingRegistrationDeedText(text) {
  const n = compactOcrText(text);
  const hasBuildingHeader = /建物登記|建物標示部|建物所有權部|建物他項權利部/.test(n);
  const hasBuildingFields = /建號|建物門牌|層次面積|主建物|附屬建物|共有部分|主要用途/.test(n);
  const deedLike = /第二類謄本|第二類|謄本|登記謄本|登記/.test(n);
  return (hasBuildingHeader && (deedLike || hasBuildingFields)) || (/建物標示部/.test(n) && hasBuildingFields);
}
/** 表頭區：建物標示部之前的文字（縣市、鄉鎮市區、地段、地政所） */
function extractHeaderBandBeforeIndicator(text) {
  const c = cleanOcrText(text);
  const k = c.indexOf("建物標示部");
  if (k > 80) return c.slice(0, k).trim();
  return c.slice(0, Math.min(3200, c.length)).trim();
}
/** 僅「建物標示部」至「建物所有權部」前：面積、用途、門牌等主要依此段解析，降低其他欄位干擾 */
function extractBuildingIndicatorSectionText(text) {
  const c = cleanOcrText(text);
  const start = c.indexOf("建物標示部");
  if (start < 0) return "";
  const tail = c.slice(start);
  const ends = ["建物所有權部", "建物他項權利部", "建物他項權利", "建物其他登記事項"];
  let endPos = tail.length;
  const doorPos = tail.indexOf("建物門牌");
  const endSearchStart = Math.max(12, doorPos >= 0 ? doorPos + "建物門牌".length : 12);
  for (const label of ends) {
    const i = tail.indexOf(label, endSearchStart);
    if (i >= 0 && i < endPos) endPos = i;
  }
  return tail.slice(0, endPos).trim();
}
/** 謄本「縣市」「鄉鎮市區」固定標籤（compact 後無空白）；取「最後一組」有效配對，避免表頭機關址（臺北市信義區）蓋過標的鄉鎮 */
function extractTranscriptLabeledCityDistrict(text) {
  const c = compactOcrText(text);
  if (!c || c.length < 8) return null;
  const pairRe = /縣市([\u4e00-\u9fff]{1,7}[市縣])鄉鎮市區([\u4e00-\u9fff]+?(?:區|鄉|鎮))/g;
  let m;
  let lastPair = null;
  while ((m = pairRe.exec(c)) !== null) {
    const city = normalizeCityToken(m[1]);
    const district = m[2];
    if ((CITY_DISTRICTS[city] || []).includes(district)) lastPair = { city, district };
  }
  if (lastPair) return lastPair;
  const cityM = c.match(/縣市([\u4e00-\u9fff]{1,7}[市縣])(?=鄉鎮市區)/)
    || c.match(/縣市[：:]([\u4e00-\u9fff]{1,7}[市縣])(?=鄉鎮市區|鄉鎮|建物|$)/);
  const distM = c.match(/鄉鎮市區([\u4e00-\u9fff]+?(?:區|鄉|鎮))/)
    || c.match(/鄉鎮市區[：:]([\u4e00-\u9fff]+?(?:區|鄉|鎮))/);
  let city = cityM ? normalizeCityToken(cityM[1]) : "";
  let district = distM ? distM[1] : "";
  if (city && district && (CITY_DISTRICTS[city] || []).includes(district)) {
    return { city, district };
  }
  if (district && !city) {
    const inferred = inferCityByDistrict(district);
    if (inferred && (CITY_DISTRICTS[inferred] || []).includes(district)) {
      return { city: inferred, district };
    }
  }
  const indicatorGuard = extractBuildingIndicatorSectionText(text);
  const indicatorCompact = indicatorGuard ? compactOcrText(indicatorGuard) : "";
  const skipOfficeFallback = indicatorCompact.includes("建物門牌");
  const officeRe = /([\u4e00-\u9fff]{2,4}?[市縣])([\u4e00-\u9fff]{1,6}區)地政事務所/g;
  let lastOffice = null;
  while ((m = officeRe.exec(c)) !== null) {
    city = normalizeCityToken(m[1]);
    district = m[2];
    if ((CITY_DISTRICTS[city] || []).includes(district)) lastOffice = { city, district };
  }
  if (lastOffice && !skipOfficeFallback) return lastOffice;
  const sectRe = /([\u4e00-\u9fff]{2,6}(?:區|鄉|鎮|市))[\u4e00-\u9fff]{1,12}段(?:[一二三四五六七八九十百千]+小段)?[\d０-９\-－]*?(?:地號|建號|建号)/g;
  let lastSect = null;
  while ((m = sectRe.exec(c)) !== null) {
    const d0 = m[1];
    let inferred = inferCityByDistrict(d0);
    if (!inferred) {
      const cityHint = normalizeCityToken(detectCityFromText(c));
      if ((CITY_DISTRICTS[cityHint] || []).includes(d0)) inferred = cityHint;
    }
    if (inferred && (CITY_DISTRICTS[inferred] || []).includes(d0)) lastSect = { city: inferred, district: d0 };
  }
  if (lastSect) return lastSect;
  return null;
}
function extractTranscriptLabeledDoorAddress(text) {
  const cleaned = cleanOcrText(text);
  if (!cleaned) return "";
  const labeled = resolveTranscriptLabeledCityDistrict(cleaned);
  const lines = cleaned.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  let doorText = "";
  for (let i = 0; i < lines.length; i += 1) {
    const lineCompact = compactOcrText(lines[i]);
    const labelIndex = lineCompact.indexOf("建物門牌");
    if (labelIndex < 0) continue;
    const tail = lineCompact.slice(labelIndex + "建物門牌".length);
    const following = compactOcrText([lines[i + 1] || "", lines[i + 2] || ""].join(""));
    doorText = [tail, following].filter(Boolean).join("");
    break;
  }
  if (!doorText) {
    const compact = compactOcrText(cleaned);
    const match = compact.match(/建物門牌[:：]?(.+?)(?:建物坐落地號|建物坐落地号|坐落地號|坐落地号|主要用途|主要建材|層數|總面積|層次面積)/);
    if (match) doorText = match[1];
  }
  const door = stripLeadingCityDistrictFromAddress(sanitizePropertyDoorplate(doorText))
    .replace(/^牌(?=[\u4e00-\u9fff]{1,12}(?:路|街|大道))/u, "");
  if (!door) return "";
  const matchedFullAddress = completeDoorplateFromMatchingAddress(door, cleaned);
  if (matchedFullAddress) return matchedFullAddress;
  if (labeled) return `${labeled.city}${labeled.district}${door}`.replace(/^台/, "臺");
  return buildFullAddressFromFragment(door, cleaned);
}
function detectPropertyAddress(text) {
  const compact = compactOcrText(text);
  const labeledDoorAddress = extractTranscriptLabeledDoorAddress(text);
  if (labeledDoorAddress) return labeledDoorAddress;
  const labeled = resolveTranscriptLabeledCityDistrict(text);
  const byDoor = compact.match(/建物門牌[:：]?(.+?)(?:建物坐落地號|建物坐落地号|坐落地號|坐落地号|主要用途|主要建材|層數|總面積|層次面積)/);
  if (labeled && byDoor) {
    const door = stripLeadingCityDistrictFromAddress(sanitizePropertyDoorplate(byDoor[1]));
    if (door) return `${labeled.city}${labeled.district}${door}`.replace(/^台/, "臺");
  }
  if (byDoor) {
    const sanitizedDoor = sanitizePropertyDoorplate(byDoor[1]);
    const parsedDoor = parseAddressParts(sanitizedDoor);
    if (parsedDoor.city && parsedDoor.district) return sanitizedDoor;
    return buildFullAddressFromFragment(sanitizedDoor, compact);
  }
  const byAddress = compact.match(new RegExp(`((?:台|臺).+?[市縣].+?(?:區|鄉|鎮|市).+?(?:路|街|大道|巷).+?(?:號).{0,8}(?:樓(?:之${RE_ADDR_SUFFIX_NUMBER})?))`));
  if (byAddress) return sanitizePropertyDoorplate(byAddress[1]);
  const fragment = detectDoorplateFragment(compact);
  return fragment ? buildFullAddressFromFragment(sanitizePropertyDoorplate(fragment), compact) : "";
}
function detectPurpose(text) {
  const compact = compactOcrText(text);
  const match = compact.match(/主要用途:?(.+?)(?:主要建材|層數|總面積|層次面積|建築完成日期)/);
  return match ? match[1].trim() : "";
}
function detectCompletionDateText(text) {
  const compact = compactOcrText(text);
  const match = compact.match(/建築完成日期[:：]?(?:民國)?([0-9０-９]{2,4})\D{0,2}([0-9０-９]{1,2})\D{0,2}([0-9０-９]{1,2})/);
  if (!match) return "";
  const y = normalizeFullWidthDigitsToAscii(match[1]);
  const m = normalizeFullWidthDigitsToAscii(match[2]);
  const d = normalizeFullWidthDigitsToAscii(match[3]);
  return `${y}年${m}月${d}日`;
}
function parseDeedOcrText(text) {
  const cleanedText = cleanOcrText(text);
  const compactText = compactOcrText(cleanedText);
  const deedPage = isBuildingRegistrationDeedText(cleanedText);
  const headerBand = deedPage ? extractHeaderBandBeforeIndicator(cleanedText) : cleanedText;
  const indicatorBody = deedPage ? extractBuildingIndicatorSectionText(cleanedText) : "";
  const bodyForMeasures = indicatorBody && indicatorBody.length > 40 ? indicatorBody : cleanedText;
  const privateMeasureBody = bodyForMeasures.split(/共有部分資料|共有部分|共有部份|其他登記事項/)[0] || bodyForMeasures;
  const commonSection = extractCommonSectionSlice(bodyForMeasures);
  const hasUsableCommonPartEvidence = hasRealCommonPartEvidenceStable(bodyForMeasures);
  const forAddress = [headerBand, bodyForMeasures].filter(Boolean).join("\n");
  const propertyAddress = detectPropertyAddress(forAddress + "\n" + compactText.slice(0, 600));
  const residenceAddress = detectResidenceAddress(cleanedText);
  const subjectLevelSection = extractSubjectLevelSection(privateMeasureBody);
  const deedLevelNumbers = [...new Set(detectDeedLevelNumbers(privateMeasureBody))].sort((a, b) => a - b);
  const stableCommonSection = extractCommonSectionSliceStable(bodyForMeasures) || commonSection;
  let splitCommonParking = extractBestCommonAndParkingStable(stableCommonSection)
    || extractCommonAndParkingFromSharedBase(commonSection)
    || extractCommonAndParkingSums(commonSection);
  if (!splitCommonParking && hasUsableCommonPartEvidence) {
    splitCommonParking = extractBestCommonAndParkingStable(bodyForMeasures)
      || extractCommonAndParkingFromSharedBase(bodyForMeasures)
      || extractCommonAndParkingSums(bodyForMeasures);
  }
  const stableCommonArea = extractReliableCommonAreaFromTextStable(bodyForMeasures);
  const commonFromSlice = (splitCommonParking && splitCommonParking.common)
    || stableCommonArea
    || extractCommonAreaFromCommonMarkers(commonSection)
    || extractCommonAreaFromBaseSqmAndRightsFraction(commonSection);
  const commonFallback = !commonFromSlice && hasUsableCommonPartEvidence
    ? extractCommonAreaFromCommonMarkers(bodyForMeasures) || extractCommonAreaFromBaseSqmAndRightsFraction(bodyForMeasures)
    : null;
  const commonArea = attachCommonRawEntries(
    commonFromSlice || commonFallback || sumFractionAreas(commonSection) || extractArea(commonSection, ["面積", "共有部分"]),
    commonSection || bodyForMeasures
  );
  const attachedArea = extractAttachAreaSumStable(privateMeasureBody)
    || extractAttachAreaSum(privateMeasureBody)
    || extractArea(privateMeasureBody, ["附屬建物用途", "附屬建物面積", "附屬建物", "附屬"]);
  const mainArea = extractMainAreaFromBuildingSectionLabelsStable(privateMeasureBody)
    || extractLayerMainAreaSum(privateMeasureBody)
    || extractArea(privateMeasureBody, ["總面積", "層次面積", "主建物面積", "主建物", "建物面積"]);
  return {
    text: cleanedText,
    compactText,
    commonSection,
    main: mainArea,
    attach: attachedArea,
    common: commonArea,
    parkingDeedShare: splitCommonParking && splitCommonParking.parking ? splitCommonParking.parking : null,
    parkingCount: splitCommonParking?.parking?.count ?? null,
    landShare: extractLandShareFromOcrText(cleanedText),
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
/** 從地址抽出路段；手動欄位已改為「門牌 / 社區名稱」，但 OCR 自動帶入仍保留路段作為舊流程相容。 */
function isBadRoadCandidate(road) {
  const normalized = cleanOcrText(road).replace(/\s+/g, "");
  if (!normalized) return true;
  if (/謄本|網路|網際網路|電子|線上|申請|下載|列印|地政|事務所/.test(normalized)) return true;
  return false;
}
function extractRoadThruSectionOnly(address) {
  const normalized = stripVillageNeighborhoodPrefix(cleanOcrText(address || "")).replace(/\s+/g, "");
  if (!normalized) return "";
  const pattern = new RegExp(`([\\u4e00-\\u9fff]{1,16}(?:路|街|大道)${RE_ADDR_ROAD_OPTIONAL_SECTION})`, "gu");
  for (const match of normalized.matchAll(pattern)) {
    const road = match[1];
    if (!isBadRoadCandidate(road)) return road;
  }
  return "";
}
function detectRoadFromAddress(address) {
  return extractRoadThruSectionOnly(address);
}
function parseAddressParts(address) {
  const normalized = cleanOcrText(address).replace(/\s+/g, "");
  const match = normalized.match(/^(.*?[市縣])(.*?(?:區|鄉|鎮|市))(.*)$/);
  if (!match) return { city: "", district: "", rest: normalized };
  const city = match[1].replace(/^台/, "臺");
  return { city, district: match[2], rest: match[3] || "" };
}
/** 移除開頭的縣市＋行政區，保留路街巷號後段（用於檔名備援與門牌重組） */
function stripLeadingCityDistrictFromAddress(address) {
  const normalized = cleanOcrText(address).replace(/\s+/g, "");
  const p = parseAddressParts(normalized);
  return (p.city && p.district && p.rest) ? p.rest : normalized;
}
/** 從檔名解析「桃園市中壢區○○路…號」等使用者自訂檔名，供 OCR 誤套機關地址時更正 */
function extractLocationHintFromFileName(fileName) {
  let s = String(fileName || "").replace(/\.(pdf|png|jpe?g|webp)$/i, "");
  s = s.replace(/[-–—_]\s*謄本.*$/i, "").replace(/^[._\s]+|[._\s]+$/g, "").trim();
  if (!s) return null;
  const normalized = s.replace(/\s+/g, "").replace(/[._-]+/g, "");
  const p = parseAddressParts(normalized);
  if (!p.city || !p.district || !p.rest) return null;
  const city = normalizeCityToken(p.city);
  const { district, rest } = p;
  if (!(CITY_DISTRICTS[city] || []).includes(district)) return null;
  const road = detectRoadFromAddress(rest);
  if (!road || rest.length < 3) return null;
  return { city, district, rest, road };
}
function applyFilenameHintToPropertyAddress(parsedAddr, fileName) {
  const hint = extractLocationHintFromFileName(fileName);
  if (!hint || !parsedAddr) return parsedAddr;
  const n = compactOcrText(parsedAddr);
  const roadC = compactOcrText(hint.road);
  if (!roadC || !n.includes(roadC)) return parsedAddr;
  const tail = stripLeadingCityDistrictFromAddress(parsedAddr);
  if (!tail || !compactOcrText(tail).includes(roadC)) return parsedAddr;
  return `${hint.city}${hint.district}${tail}`.replace(/^台/, "臺");
}
function buildSearchKeywordFromAddress(address) {
  const normalized = cleanOcrText(address).replace(/\s+/g, "");
  if (!normalized) return "";
  const { rest } = parseAddressParts(normalized);
  const base = stripVillageNeighborhoodPrefix(stripFloorFromAddress(rest || normalized) || rest || normalized);
  if (!base) return "";
  const fromBase = extractRoadThruSectionOnly(base);
  if (fromBase) return fromBase;
  return extractRoadThruSectionOnly(normalized);
}
function normalizeCityToken(city) {
  return String(city || "").replace(/^台/, "臺").trim();
}
/** 從全文找出所有「○○市／縣＋△△區／鄉…」並取最後一組在戶政清單上成立的配對（謄本常前段為機關地址，門牌在後） */
function extractLastValidCityDistrict(text) {
  const n = cleanOcrText(text || "").replace(/\s+/g, "");
  if (!n) return null;
  const re = /([\u4e00-\u9fff]+[市縣])([\u4e00-\u9fff]+(?:區|鄉|鎮|市))/g;
  let last = null;
  let m;
  while ((m = re.exec(n)) !== null) {
    const c = normalizeCityToken(m[1]);
    const d = m[2];
    if ((CITY_DISTRICTS[c] || []).includes(d)) last = { city: c, district: d };
  }
  return last;
}
/** 建物標示部內、「建物門牌」之前的最後一組合法縣市區（電傳謄本常無「縣市／鄉鎮市區」標籤，僅有「新北市林口區…建物門牌 信義路…」；可避開表頭地政事務所或全文最後一筆管轄區） */
function extractCityDistrictFromIndicatorBeforeDoorplate(text) {
  const indicator = extractBuildingIndicatorSectionText(text);
  if (!indicator || indicator.length < 12) return null;
  let c = compactOcrText(indicator);
  const markPos = c.indexOf("建物標示部");
  if (markPos >= 0) c = c.slice(markPos + "建物標示部".length);
  const doorPos = c.indexOf("建物門牌");
  const prefix = doorPos >= 0 ? c.slice(0, doorPos) : c;
  if (prefix.length < 4) return null;
  return extractLastValidCityDistrict(prefix);
}
/** 併用標示部門牌前坐落與謄本標籤／備援規則，供建物門牌組字與查詢下拉同步 */
function resolveTranscriptLabeledCityDistrict(text) {
  const fromIndicator = extractCityDistrictFromIndicatorBeforeDoorplate(text);
  if (fromIndicator) return fromIndicator;
  return extractTranscriptLabeledCityDistrict(text);
}
/**
 * 當縣市與行政區不一致（例如全文先被誤判臺北市，但行政區為三重區）時，改以行政區反查唯一縣市，
 * 或以完整字串重新 parse，使下拉選單與 OCR 門牌地址一致。
 */
function reconcileCityDistrictForDropdown(city, district, fullTextForParse) {
  let c = normalizeCityToken(city || "");
  let d = String(district || "").trim();
  const blob = cleanOcrText(fullTextForParse || "").replace(/\s+/g, "");
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
  if (d && c && !(CITY_DISTRICTS[c] || []).includes(d)) {
    const inferred = inferCityByDistrict(d);
    if (inferred) c = inferred;
  }
  if (d && !c) {
    const inferred = inferCityByDistrict(d);
    if (inferred) c = inferred;
  }
  return { city: c, district: d };
}
/** 併用標的地址與謄本 OCR 全文，推斷手動查詢列的縣市／行政區／道路（補足僅有區名、門牌等不完整地址） */
function resolveLocationPartsForManualQuery(primaryAddress = "", supplementalText = "") {
  const primary = cleanOcrText(primaryAddress).replace(/\s+/g, "");
  const extra = cleanOcrText(supplementalText).replace(/\s+/g, "");
  const blob = primary && extra ? `${primary}\n${extra}` : primary || extra;
  const combinedLine = cleanOcrText([primaryAddress, supplementalText].filter(Boolean).join("\n")).replace(/\s+/g, "");
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
    district = detectDistrictFromText(blob, city) || detectDistrictFromText(primary, city) || detectDistrictFromText(extra, city)
      || detectDistrictFromText(blob) || detectDistrictFromText(primary) || detectDistrictFromText(extra);
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
  return (CITY_DISTRICTS[normalizedCity] || []).includes(normalizedDistrict);
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
  const city = basePairValid ? (base.city || fromKnowledge.city) : (fromKnowledge.city || base.city);
  const district = basePairValid ? (base.district || fromKnowledge.district) : (fromKnowledge.district || base.district);
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
  if (!address && !cleanOcrText(supplementalOcrText).trim()) return false;
  const resolved = await resolveLocationPartsForManualQueryWithKnowledge(address, supplementalOcrText);
  const road = resolved.road || buildSearchKeywordFromAddress(address) || detectRoadFromAddress(address);
  if (road) els.roadKeyword.value = extractRoadThruSectionOnly(road) || road;
  if (autoTitle && !els.queryTitle.value.trim()) {
    els.queryTitle.value = `${resolved.district || road || "謄本"}二類謄本估價`;
  }
  if (!selectedDealTargets().length) {
    setCheckboxValues(els.dealTargetPick, ["房地", "房地(車)"]);
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
    if (road) els.roadKeyword.value = extractRoadThruSectionOnly(road) || road;
  }
  updateStructuredData();
  return ready;
}
let autoOfficialSearchTimer = appState.autoOfficialSearchTimer;
let officialSearchInFlight = appState.officialSearchInFlight;
function cancelPendingAutoOfficialSearch() {
  if (autoOfficialSearchTimer) clearTimeout(autoOfficialSearchTimer);
  autoOfficialSearchTimer = null;
}
function deedQueryFieldsReady() {
  return !!els.cityName.value && !!els.districtName.value && !!els.roadKeyword.value.trim();
}
function scheduleAutoOfficialSearchAfterDeedReady(ready, sourceLabel = "謄本") {
  if (!ready || !deedQueryFieldsReady()) return false;
  cancelPendingAutoOfficialSearch();
  setMessage("ok", `已帶入手動查詢欄位，正在自動搜尋官方資料...`);
  autoOfficialSearchTimer = setTimeout(() => {
    autoOfficialSearchTimer = null;
    runDeedSearchWithUi();
  }, 160);
  return true;
}
let lastLandValueTaxAutoParseSignature = "";
function landValueTaxAutoParseSignature(files = landTaxSourceFiles()) {
  return files.map((file) => `${file.name || ""}:${file.size || 0}:${file.lastModified || 0}`).join("|");
}
async function syncLandValueTaxFromUploadedFiles(reason = "實價查詢") {
  const files = landTaxSourceFiles();
  if (!files.length || !window.initLandValueTaxApp) return false;
  const signature = landValueTaxAutoParseSignature(files);
  if (signature && signature === lastLandValueTaxAutoParseSignature) return false;
  lastLandValueTaxAutoParseSignature = signature;
  try {
    await window.initLandValueTaxApp();
    const api = window.LandValueTaxCalculator;
    if (!api?.parseAndApplyLandTaxDeedFiles) return false;
    const names = sourceFileNames(files).join("、");
    setMessage("ok", `${reason}完成；偵測到土地謄本，正在同步帶入土地增值稅試算：${names}`);
    const result = await api.parseAndApplyLandTaxDeedFiles(files);
    if (result?.hasCoreData) {
      setMessage("ok", `${reason}完成；土地謄本已同步帶入土地增值稅試算。`);
      return true;
    }
    setMessage("warn", `${reason}完成；已嘗試解析土地謄本，但土地增值稅欄位仍不足，請切到土地增值稅試算頁檢查。`);
    return false;
  } catch (error) {
    console.error("auto land value tax parse failed", error);
    setMessage("warn", `${reason}完成；土地增值稅同步解析失敗：${formatCaughtError(error)}`);
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
async function syncLandShareFromUploadedLandFiles(reason = "同批土地謄本") {
  const files = landTaxSourceFiles();
  if (!files.length || !els.landShareArea || !els.landShareRaw) return false;
  const current = String(els.landShareArea.value || "").trim();
  const prevAuto = els.landShareArea.dataset.autoValue || "";
  if (current && current !== prevAuto) return false;
  const entries = [];
  for (const file of files) {
    const result = await fetchOcrBackendResultForLandShare(file);
    const text = paddlePagesText(result?.pages);
    const landShare = extractLandShareFromOcrTextStable(text);
    if (landShare?.entries?.length) entries.push(...landShare.entries);
  }
  if (!entries.length) return false;
  const valuePing = entries.reduce((sum, entry) => sum + (toNumber(entry.valuePing) || 0), 0);
  if (!(valuePing > 0)) return false;
  const nextValue = String(Math.round(valuePing * 1000) / 1000);
  els.landShareRaw.value = entries.map(formatLandShareEntryStable).join("\n");
  els.landShareArea.value = nextValue;
  els.landShareArea.dataset.autoValue = nextValue;
  els.landShareArea.title = `${reason}已解析 ${entries.length} 筆土地持分，合計 ${formatNum(valuePing, 3)} 坪`;
  return true;
}
async function runDeedSearch(options = {}) {
  activateTab("manualTab");
  scrollToElementById("filter-title");
  const ready = await syncQueryFromDeed();
  if (!ready) {
    setMessage("warn", "請先完成謄本 OCR，並確認已抓到地址後再查詢。");
    return;
  }
  if (officialSearchInFlight) {
    setMessage("warn", "官方資料查詢中，請稍候...");
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
    setMessage("warn", "官方資料查詢中，請稍候...");
    return null;
  }
  officialSearchInFlight = true;
  try {
    const result = await withActionUi(
      {
        button: els.manualSearchBtn,
        buttonText: "官方查詢中...",
        progressText: "官方資料查詢中，請稍候..."
      },
      () => runOfficialSearch()
    );
    setRecordsPanelCollapsed(true);
    if (result !== null) {
      await syncLandValueTaxFromUploadedFiles("官方資料查詢");
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
      buttonText: "套用查詢中...",
      progressText: "正在套用謄本內容並查詢官方資料，請稍候..."
    },
    () => runDeedSearch({
      officialSearchOptions: {
        totalTimeoutMs: OFFICIAL_AUTO_TOTAL_TIMEOUT_MS
      }
    })
  );
  setRecordsPanelCollapsed(true);
  if (result !== null) {
    await syncLandValueTaxFromUploadedFiles("實價查詢");
  }
  return result;
}
async function runRecalcWithUi() {
  const result = await withActionUi(
    {
      button: els.recalcBtn,
      buttonText: "重新估價中...",
      progressText: "正在用目前案例重新估價，請稍候..."
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
	    setButtonLoading(els.ocrBtn, true, "PDF 快速解析中...");
	    setOcrProgress(8, "PDF 快速解析中");
	    await nextPaint();
	    try {
	      const backendAttempt = initialBackendOcrAttempt(file, {
	        backendEnabled: USE_PADDLE_OCR,
	        isPdfFile
	      });
	      if (backendAttempt.shouldAttempt) {
	        const reason = backendAttempt.reason || "PDF 先使用 OCR 後端解析欄位，避免快速文字層誤判附屬建物與共有部分面積。";
	        setOcrProgress(10, "PDF 先交由 OCR 後端解析");
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
          safeNumber(els.mainArea.value),
          safeNumber(els.attachArea.value),
          safeNumber(els.commonArea.value)
        ].filter((value) => value > 0).length;
        textLayerMessage = "已依檔名套用電子謄本保底欄位，略過可能逾時的 PDF 文字層讀取。";
      } else if (window.pdfjsLib?.getDocument) {
        try {
          setOcrProgress(35, "PDF 讀取全部頁面文字層");
          const pdfText = await withTimeout(
            extractPdfTextLayer(file),
            PDF_QUICK_TEXT_TIMEOUT_MS,
            "PDF 文字層讀取逾時"
          );
          pdfTextForDiagnostics = pdfText;
          if (cleanOcrText(pdfText).length > 40) {
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
            if (parsed.purpose && !selectedMainPurposes().length) setCheckboxValues(els.mainPurposePick, parsed.purpose);
            const appliedType = applyBuildingTypeFromParsed(parsed, knownPreset);
            typeMessage = appliedType ? `已自動勾選建物型態：${appliedType}。` : "尚未能自動判斷建物型態。";
            const synced = await syncManualQueryFromParsedDeed(parsed, pdfText, queryAddress);
            querySynced = synced;
            querySyncMessage = synced
              ? `已帶入手動查詢：${selectedLabel(els.cityName)} ${selectedLabel(els.districtName)} ${els.roadKeyword.value.trim()}。`
              : "手動查詢欄位尚未完整，請檢查縣市、行政區與門牌／社區名稱。";
            textLayerMessage = `PDF 文字層解析完成，面積欄位 ${hitCount}/3。`;
          } else {
            textLayerMessage = "PDF 全部頁面文字層不足，已保留檔名保底欄位。";
          }
        } catch (error) {
          textLayerMessage = `PDF 文字層快速解析未完成：${formatCaughtError(error)}。`;
        }
      } else {
        textLayerMessage = "PDF 文字層模組未載入，已保留檔名保底欄位。";
      }
	      revealDeedFieldsAfterOcr();
	      updateAreaSummary();
      if (!querySyncMessage && (knownPreset?.queryAddress || knownPreset?.address || els.subjectAddress.value.trim())) {
        const appliedType = applyBuildingTypeFromParsed(null, knownPreset);
        typeMessage = appliedType ? `已自動勾選建物型態：${appliedType}。` : typeMessage || "尚未能自動判斷建物型態。";
        const synced = await syncManualQueryFromParsedDeed(null, "", knownPreset?.queryAddress || knownPreset?.address || els.subjectAddress.value.trim());
        querySynced = synced;
        querySyncMessage = synced
          ? `已帶入手動查詢：${selectedLabel(els.cityName)} ${selectedLabel(els.districtName)} ${els.roadKeyword.value.trim()}。`
          : "手動查詢欄位尚未完整，請檢查縣市、行政區與門牌／社區名稱。";
      }
      const confidence = pdfQuickParseConfidence(parsedFromTextLayer, hitCount, querySynced, knownPreset);
      if (!confidence.ok) {
        setOcrProgress(72, "PDF 快速解析信心不足，改用 OCR 後端");
        paddleFallbackMessage = `PDF 快速解析信心不足（${confidence.reasons.join("、")}），已改用 OCR 後端。`;
        els.ocrLog.textContent = [
          "PDF 快速解析已先完成，正在補跑 OCR 後端。",
          textLayerMessage,
          typeMessage,
          querySyncMessage,
          paddleFallbackMessage
        ].filter(Boolean).join("\n");
        await nextPaint();
        if (await tryPaddleOcr(file, { initialProgress: 74, reason: paddleFallbackMessage })) {
          return;
        }
        paddleFallbackMessage = `PDF 快速解析信心不足（${confidence.reasons.join("、")}），但 OCR 後端未能完成，已保留快速解析結果。`;
      }
      const usableFieldCount = [
        safeNumber(els.mainArea.value),
        safeNumber(els.attachArea.value),
        safeNumber(els.commonArea.value),
        safeNumber(els.totalAreaOverride.value),
        els.subjectAddress.value.trim(),
        els.roadKeyword.value.trim()
      ].filter(Boolean).length;
      const autoSearchQueued = scheduleAutoOfficialSearchAfterDeedReady(querySynced || querySyncMessage.startsWith("已帶入手動查詢"), "PDF");
      setOcrProgress(100, "PDF 快速完成");
      els.ocrLog.textContent = [
        confidence.ok ? "PDF 快速解析完成（信心足夠，未執行 OCR 後端）。" : "PDF 快速解析完成。",
        textLayerMessage,
        typeMessage,
        querySyncMessage,
        paddleFallbackMessage,
        `目前已帶入 ${usableFieldCount} 個主要欄位。`,
        presetApplied || knownPreset ? "已套用或保留已知檔名保底欄位；請檢查主建物、附屬、共有、地址等欄位。" : "此 PDF 無已知保底欄位；若欄位不足，請改上傳建物標示部截圖或圖片檔。",
        autoSearchQueued ? "即將自動搜尋官方資料。" : "",
        `耗時：約 ${((Date.now() - startedAt) / 1000).toFixed(1)} 秒。`
      ].filter(Boolean).join("\n");
      const diagnosticsSource = parsedFromTextLayer ? "pdfTextLayer" : (knownPreset ? "knownFilePreset" : "pdfTextLayer");
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
            note: parsedFromTextLayer ? "PDF 文字層快速解析" : "已知檔名保底欄位"
          }
        }
      );
      updateStructuredData();
      return;
    } finally {
      setButtonLoading(els.ocrBtn, false);
    }
  }
  const loadingText = isPdfFile(file) ? "PDF 解析中..." : "圖片 OCR 中...";
  const progressText = isPdfFile(file) ? "正在解析 PDF，請稍候..." : "正在進行圖片 OCR，請稍候...";
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
let autoOcrRequestId = 0;
function cancelPendingAutoOcr() {
  autoOcrRequestId += 1;
}
function scheduleAutoOcrForSelectedFile(file) {
  if (!file) return;
  const requestId = ++autoOcrRequestId;
  const isPdf = isPdfFile(file);
  els.ocrLog.textContent = isPdf
    ? `PDF 已載入：${file.name}，正在自動解析並帶入坪數欄位。`
    : `圖片已載入：${file.name}，正在自動 OCR 並帶入坪數欄位。`;
  setOcrProgress(2, isPdf ? "PDF 自動解析準備中" : "圖片自動 OCR 準備中");
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
    els.toggleRecordsPanelBtn.textContent = isCollapsed ? "顯示" : "隱藏";
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
function fillArea(element, data) { if (!data) return false; element.value = data.valuePing; return true; }
function applyOcrParkingCountFromParsed(parsed) {
  const count = parsed?.parkingCount ?? parsed?.parkingDeedShare?.count;
  if (normalizeParkingCount(count) > 0) return setOcrParkingCount(count);
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
  els.roadKeyword.value = extractRoadThruSectionOnly(rawRoad) || els.roadKeyword.value;
  els.totalFloors.value = preset.floors || els.totalFloors.value;
  if (preset.type) applyType(preset.type);
  if (preset.purpose) setCheckboxValues(els.mainPurposePick, preset.purpose);
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
    建物門牌: preset.address || "",
    住址: preset.ownerResidence || "",
    查詢地址: queryAddress,
    地址: preset.address || "",
    道路名稱: preset.searchKeyword || preset.road || "",
    總樓層數: preset.floors || "",
    建物型態: preset.type || "",
    主要用途: preset.purpose || "",
    交易標的: preset.target || "",
    主建物面積坪: preset.main || "",
    附屬建物面積坪: preset.attach || "",
    共有部分面積坪: preset.common || "",
	    標的土地持分坪合計: preset.land || "",
	    車位權狀坪數: preset.parking || "",
	    車位數量: preset.parkingCount || "",
	    其他登記事項面積坪: "",
	    房屋坪數: ""
	  };
  setRecognizedAddressFields({
    property: preset.address || ""
  });
  updateAreaSummary(parseRecords(els.recordsInput.value || defaultRecords).length);
  return true;
}
function hasDeedFieldValues() {
  return [els.mainArea, els.attachArea, els.commonArea, els.otherArea, els.landShareRaw, els.landShareArea, els.totalAreaOverride, els.parkingArea, els.parkingCount, els.parkingUnitPrice]
    .some((input) => String(input?.value || "").trim() !== "");
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
  els.typeQuickPick.forEach((checkbox) => { checkbox.checked = false; });
  setCheckboxValues(els.mainPurposePick, []);
  lastOcrMapping = {};
}
function syncDeedFieldsVisibility(forceOpen = null) {
  if (!els.deedFieldsPanel || !els.toggleDeedFieldsBtn) return;
  const manual = els.deedFieldsPanel.dataset.manual === "open";
  const shouldOpen = forceOpen == null ? (manual || hasDeedFieldValues()) : !!forceOpen;
  els.deedFieldsPanel.classList.toggle("is-hidden", !shouldOpen);
  els.toggleDeedFieldsBtn.textContent = shouldOpen ? "隱藏坪數欄位" : "顯示坪數欄位";
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
  /** 建物型態在下拉與快速勾選（進階區塊內），謄本 OCR 會寫入；篩選比較案例時須一律讀取，不可因進階收合而清空 */
  const quickTypes = selectedTypes();
  const mainPurposes = advancedVisible ? selectedMainPurposes() : [];
  const usageZones = advancedVisible ? selectedUsageZones() : [];
  return {
    advancedVisible,
    queryTitle: els.queryTitle.value.trim() || "二類謄本估價查詢",
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
    priceUnit: selectedRadioValue(els.priceUnitChoice, els.priceUnit?.value || "萬元/坪"),
    areaUnit: selectedRadioValue(els.areaUnitChoice, els.areaUnit?.value || "坪"),
    houseType: els.houseType.value.trim(),
    quickTypes,
    mainPurposes,
    usageZones,
    mainPurpose: mainPurposes.join("、"),
    usageZone: usageZones.join("、"),
    tradeTarget: advancedVisible ? els.tradeTarget.value.trim() : "",
    floorFilter: advancedVisible ? els.floorFilter.value.trim() : "",
    layoutFilter: advancedVisible ? els.layoutFilter.value.trim() : "",
    specialMode: document.querySelector('input[name="specialMode"]:checked')?.value || "exclude",
    specialKeywords: parseKeywords(els.specialKeywords.value),
    specialFilters: selectedSpecialRemarkFilters(),
    totalPriceMin: advancedVisible ? toNumber(els.totalPriceMin.value) : null,
    totalPriceMax: advancedVisible ? toNumber(els.totalPriceMax.value) : null,
    unitPriceMin: toNumber(els.unitPriceMin.value),
    unitPriceMax: toNumber(els.unitPriceMax.value),
    mainAreaMinFilter: toNumber(els.mainAreaMinFilter.value),
    mainAreaMaxFilter: toNumber(els.mainAreaMaxFilter.value),
    houseAgeMin: toNumber(els.houseAgeMin.value),
    houseAgeMax: toNumber(els.houseAgeMax.value),
    deedArea: areaInfo()
  };
}
function subjectMapAddress() {
  return (
    els.subjectAddress?.value?.trim()
    || els.recognizedPropertyAddress?.value?.trim()
    || ""
  );
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
  const confidence = toNumber(geocode.confidence);
  return confidence == null || confidence >= 0.7;
}
function underwritingGeocodeError(message, geocode = {}, error = "geocode_low_confidence") {
  const err = new Error(message);
  err.data = { ok: false, error, message, geocode };
  return err;
}
function underwritingGeocodeLowConfidenceMessage(geocode = {}) {
  const provider = String(geocode.provider || "unknown");
  const confidence = toNumber(geocode.confidence);
  const confidenceLabel = confidence == null ? "--" : confidence.toFixed(2);
  return `定位信心不足（${provider} / ${confidenceLabel}），為避免承作分區誤判，請補正門牌座標或等待精準定位完成。`;
}
function geocodeCoordinatePayload(address, geocode = {}) {
  const lat = toNumber(geocode.lat);
  const lng = toNumber(geocode.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { address, lat, lng };
}
async function locateSubjectCoordinateForUnderwriting(address) {
  const normalizedAddress = String(address || "").trim();
  if (!normalizedAddress) {
    throw underwritingGeocodeError("尚無建物門牌可定位。", {}, "missing_address");
  }
  if (lastSubjectUnderwritingGeocode?.address === normalizedAddress) {
    return lastSubjectUnderwritingGeocode.geocode;
  }
  const geocode = await fetchApiJson(geocodeApiUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address: normalizedAddress, provider: "local" }),
    cache: "no-store",
    timeoutMs: 12000
  });
  const payload = geocodeCoordinatePayload(normalizedAddress, geocode);
  if (!payload) {
    throw underwritingGeocodeError("建物門牌尚未取得可用座標。", geocode || {}, "geocode_not_found");
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
  const result = calculateLoanableAmountWan(
    toNumber(els.houseValue?.textContent),
    els.underwritingZone?.textContent || ""
  );
  els.loanableAmount.textContent = result.display;
  els.loanableAmountSub.textContent = result.sub;
  if (els.loanableAmountCard) {
    els.loanableAmountCard.dataset.loanableStatus = result.status;
  }
}
function setUnderwritingZoneCard({ zone = "--", sub = "查詢後自動帶入", source = "--" } = {}) {
  if (!els.underwritingZone || !els.underwritingZoneSub || !els.underwritingZoneSource) return;
  els.underwritingZone.textContent = zone || "--";
  els.underwritingZoneSub.textContent = sub || "查詢後自動帶入";
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
  return candidates.map((value) => String(value || "").trim()).find(Boolean) || "已定位";
}
function underwritingZoneSubLabel(zone = {}, result = {}) {
  const districtLabel = [zone.city, zone.district].map((value) => String(value || "").trim()).filter(Boolean).join("");
  const zoneName = String(zone.zone_name || "").trim();
  const grade = String(zone.admin_limit_grade || "").trim();
  const pieces = [districtLabel, zoneName, grade].filter((value, index, array) => value && array.indexOf(value) === index);
  if (result.underwritingApproximate) {
    const base = pieces.length ? pieces.join("｜") : "已依近似座標定位";
    return `${base}｜近似定位，請複核門牌座標`;
  }
  if (pieces.length) return pieces.join("｜");
  return result.geocode ? "已依建物門牌定位" : "已依座標定位";
}
function underwritingZoneSourceLabel(result = {}) {
  if (result.underwritingApproximate) {
    const geocode = result.geocode || {};
    const provider = String(geocode.provider || "近似定位").replace(/-/g, " ");
    const confidence = toNumber(geocode.confidence);
    return confidence == null ? `近似定位｜${provider}` : `近似定位｜${provider} / ${confidence.toFixed(2)}`;
  }
  const zone = result.zone || {};
  const source = String(result.backend || "PostGIS").replace(/-/g, " ");
  const version = String(zone.data_version || "").trim();
  return version ? `${source}｜${version}` : source;
}
function underwritingZoneFailureSourceLabel(data = {}) {
  if (data?.error === "geocode_low_confidence") return "定位信心不足";
  return "PostGIS 分區圖層";
}
async function refreshUnderwritingZoneCard(query = currentQuery(), options = {}) {
  const seq = ++underwritingZoneLookupSeq;
  const address = underwritingZoneAddressFromQuery(query);
  if (!address) {
    setUnderwritingZoneCard({
      zone: "未定位",
      sub: "尚無建物門牌或座標可查詢",
      source: "--"
    });
    return;
  }
  setUnderwritingZoneCard({
    zone: "定位中",
    sub: address,
    source: "建物門牌定位"
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
      zone: "查詢中",
      sub: geocode.underwritingApproximate
        ? `近似定位 ${Number(geocode.lat).toFixed(6)}, ${Number(geocode.lng).toFixed(6)}，正在查承作分區`
        : `已定位 ${Number(geocode.lat).toFixed(6)}, ${Number(geocode.lng).toFixed(6)}，正在查承作分區`,
      source: geocode.underwritingApproximate
        ? underwritingZoneSourceLabel({ underwritingApproximate: true, geocode })
        : geocode.provider ? `建物門牌定位｜${geocode.provider}` : "建物門牌定位"
    });
    const result = await fetchApiJson(underwritingZoneApiUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      timeoutMs: 12000
    });
    if (seq !== underwritingZoneLookupSeq) return;
    if (!result?.ok || !result?.zone) {
      setUnderwritingZoneCard({
        zone: "未取得",
        sub: String(result?.message || "座標未落在承作分區圖層內。"),
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
    const errorText = String(errorData?.message || error?.message || "承作分區查詢失敗");
    const zoneServiceOffline = /failed to fetch|networkerror|load failed|connection refused|5433/i.test(errorText);
    const friendlyMessage = errorCode === "geocode_low_confidence"
      ? errorText
      : zoneServiceOffline
      ? "承作分區本機服務未連線；請確認 Colima/Docker 與 found-realprice-postgis 已啟動後重新查詢。"
      : /geocode_not_found|nominatim|座標|lat\/lng/i.test(errorText)
      ? "地址尚未完成座標定位；可先補座標或等待本機地理編碼服務恢復。"
      : errorText;
    setUnderwritingZoneCard({
      zone: "未取得",
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
  const subjectUnitPrice = toNumber(els.avgUnitPrice?.textContent);
  const rowFingerprint = rows.slice(0, 5).map((row) => [
    row.address,
    row.unitPrice,
    row.tradeDate || row.tradeYearMonth || row.transaction_date || "",
  ].join(":")).join("|");
  const signature = [
    address,
    rows.length,
    lastSearch?.avg ?? "",
    lastSearch?.estimate ?? "",
    rowFingerprint,
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
      results: lastSearch,
    },
  }));
}
function updateStructuredData() {
  const query = currentQuery();
  const dataset = { query, results: lastSearch, updatedAt: new Date().toISOString() };
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
              { "@type": "PropertyValue", name: "單價(萬元/坪)", value: row.unitPrice },
              { "@type": "PropertyValue", name: "總價(萬元)", value: row.totalPrice },
              { "@type": "PropertyValue", name: "型態", value: row.type }
            ]
          }))
        }
      },
      {
        "@type": "Dataset",
        name: `${query.queryTitle}｜查詢欄位與估價結果`,
        inLanguage: "zh-Hant",
        variableMeasured: [
          { "@type": "PropertyValue", name: "標的地址", value: query.subjectAddress },
          { "@type": "PropertyValue", name: "門牌/社區名稱", value: query.roadKeyword },
          { "@type": "PropertyValue", name: "建物型態", value: query.houseType || query.quickTypes.join("、") },
          { "@type": "PropertyValue", name: "主要用途", value: query.mainPurposes.join("、") },
          { "@type": "PropertyValue", name: "交易標的", value: query.tradeTarget },
          { "@type": "PropertyValue", name: "特殊交易關鍵字", value: query.specialKeywords.join("、") },
          { "@type": "PropertyValue", name: "房屋坪數", value: query.deedArea.house },
          { "@type": "PropertyValue", name: "車位坪數", value: query.deedArea.parking },
          { "@type": "PropertyValue", name: "總坪數", value: query.deedArea.total },
          { "@type": "PropertyValue", name: "估值坪數", value: query.deedArea.usable },
          { "@type": "PropertyValue", name: "標的土地持分坪合計", value: query.deedArea.landShare },
          { "@type": "PropertyValue", name: "平均單價(萬元/坪)", value: lastSearch.avg },
          { "@type": "PropertyValue", name: "估算房屋價值(萬元)", value: lastSearch.estimate }
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
  if (query.dealTargets.includes("房地")) picks.push("1");
  if (query.dealTargets.includes("房地(車)")) picks.push("2");
  if (query.dealTargets.includes("土地")) picks.push("3");
  if (query.dealTargets.includes("建物")) picks.push("4");
  if (query.dealTargets.includes("單位")) picks.push("5");
  return picks.length ? picks.join(",") : "1,2";
}
function toOfficialFtype(query) {
  const type = query.houseType || query.quickTypes[0] || "";
  const map = {
    "公寓": "01",
    "透天": "02",
    "華廈": "06",
    "住宅大樓": "05"
  };
  return map[type] || "";
}
/** 與官方 list.jsp 填 loadQueryPrice2 前一樣對字串先做 encodeURIComponent */
function officialUriEncodeField(value) {
  return encodeURIComponent(String(value ?? ""));
}
/**
 * 對齊官方格局參數；明文須為補零格式，傳原生「3/2/2」會被官方退回 400。
 */
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
  if (query.houseType === "透天") return true;
  return Array.isArray(query.quickTypes) && query.quickTypes.includes("透天");
}
function extractLandTransferAreaFromText(text) {
  const raw = fixOfficialText(String(text || ""));
  const m = raw.match(/土地移轉面積坪?\s*[=:：]\s*(\d+(?:\.\d+)?)/);
  if (m) return toNumber(m[1]);
  const m2 = raw.match(/土地移轉面積[^\d]{0,12}(\d+(?:\.\d+)?)\s*(平方公尺|平方?米|㎡|m2|坪)?/);
  if (!m2) return null;
  return normalizeOfficialAreaPing(`${m2[1]}${m2[2] || "坪"}`);
}
function extractOriginalOfficialUnitPriceFromText(text) {
  const raw = fixOfficialText(String(text || ""));
  const m = raw.match(/原始官方單價萬元每坪\s*[=:：]\s*(\d+(?:\.\d+)?)/);
  return m ? toNumber(m[1]) : null;
}
function extractOfficialSqFromText(text) {
  const raw = fixOfficialText(String(text || ""));
  const m = raw.match(/官方序號\s*[=:：]\s*([^；,，\s]+)/);
  return m ? m[1] : "";
}
function extractCoordinateFromText(text, keys) {
  const raw = normalizeFullWidthDigitsToAscii(fixOfficialText(String(text || "")));
  const keyPattern = Array.isArray(keys) ? keys.join("|") : String(keys || "");
  const match = raw.match(new RegExp(`(?:${keyPattern})\\s*[=:：]\\s*(-?\\d+(?:\\.\\d+)?)`, "i"));
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}
function hideOfficialSqInNote(note) {
  const raw = fixOfficialText(String(note || "")).trim();
  if (!raw) return "";
  return raw
    .replace(/(?:^|[；;，,\s]+)官方序號\s*[=:：]\s*[^；;，,\s]+/g, (matched) => (/^[；;，,\s]/.test(matched) ? matched[0] : ""))
    .replace(/(?:^|[；;，,\s]+)官方車位數量\s*[=:：]\s*\d+/g, (matched) => (/^[；;，,\s]/.test(matched) ? matched[0] : ""))
    .replace(/(?:^|[；;，,\s]+)(?:lat|緯度)\s*[=:：]\s*-?\d+(?:\.\d+)?/gi, (matched) => (/^[；;，,\s]/.test(matched) ? matched[0] : ""))
    .replace(/(?:^|[；;，,\s]+)(?:lng|lon|經度)\s*[=:：]\s*-?\d+(?:\.\d+)?/gi, (matched) => (/^[；;，,\s]/.test(matched) ? matched[0] : ""))
    .replace(/[；;]\s*[；;]+/g, "；")
    .replace(/[，,]\s*[，,]+/g, "，")
    .replace(/^[；;，,\s]+|[；;，,\s]+$/g, "")
    .trim();
}
function applyTownhouseLandUnitPrice(rows) {
  rows.forEach((row) => {
    const landArea = toNumber(row.landTransferArea) ?? extractLandTransferAreaFromText(row.note);
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
    const hasLandAreaKey = ["d2", "landTransferArea", "landArea", "土地移轉面積"].some((key) => value[key] != null);
    if (hasLandAreaKey) candidates.push(value);
    ["d", "land", "lands", "landData", "landList", "土地資料"].forEach((key) => visit(value[key]));
  };
  visit(detail);
  if (!candidates.length && typeof detail === "object") {
    for (const [key, value] of Object.entries(detail || {})) {
      if (/土地.*移轉.*面積/.test(key)) candidates.push({ 土地移轉面積: value });
    }
  }
  const sum = candidates.reduce((total, item) => {
    const value = normalizeOfficialAreaPing(
      item?.d2 ?? item?.landTransferArea ?? item?.landArea ?? item?.土地移轉面積
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
    setQueryProgressStage(`步驟 4/4：正在讀取透天土地明細 ${i + 1}/${targets.length}`);
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
      console.warn("透天土地明細讀取失敗", row.sq, error);
    }
  }
  applyTownhouseLandUnitPrice(rows);
  return rows;
}
function rowFloorIsFullLevel(floorInfo) {
  const raw = String(floorInfo || "").trim();
  if (!raw) return false;
  const firstSeg = raw.split(/[\/／]/)[0].replace(/\s+/g, "");
  return firstSeg === "全" || /^全(?:層|樓|棟)?$/u.test(firstSeg);
}
function rowMatchesTownhouseRule(row) {
  if (!row) return false;
  const typeText = String(row.type || "");
  if (typeText.includes("透天")) return true;
  return rowFloorIsFullLevel(row.floorInfo);
}
function matchesHouseTypeRule(row, type) {
  const t = String(type || "").trim();
  if (!t) return true;
  if (t === "透天") return rowMatchesTownhouseRule(row);
  return includesToken(row.type, t);
}
function preferredComparableTypes(query) {
  const values = [
    ...(Array.isArray(query?.quickTypes) ? query.quickTypes : []),
    query?.houseType
  ].map((value) => String(value || "").trim()).filter(Boolean);
  return [...new Set(values)];
}
function rowMatchesAnyPreferredType(row, preferredTypes) {
  const types = Array.isArray(preferredTypes)
    ? preferredTypes.map((type) => String(type || "").trim()).filter(Boolean)
    : [];
  if (!types.length) return true;
  return types.some((type) => matchesHouseTypeRule(row, type));
}
function normalizeOfficialAmount(raw, divisor = 1) {
  const value = toNumber(raw);
  return value == null ? null : +(value / divisor).toFixed(3);
}
/** 車位總價 cp：官方 JSON 常見為「元」整數（須／10000）；小於 1 萬之整數多為已換算之萬元（如 190 表示 190 萬） */
function normalizeOfficialParkingPrice(raw) {
  const v = toNumber(String(raw ?? "").replace(/,/g, ""));
  if (v == null || !Number.isFinite(v)) return null;
  if (v === 0) return 0;
  if (v < 10000) return +v.toFixed(3);
  return +(v / 10000).toFixed(3);
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
  const text = normalizeFullWidthDigitsToAscii(fixOfficialText(address || ""))
    .replace(/\s+/g, "")
    .trim();
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
  const mainRatio = toNumber(row.bs ?? row.es);
  const totalArea = toNumber(row.s);
  const totalPrice = normalizeOfficialAmount(row.tp, 10000);
  const rawUnitPrice = normalizeOfficialAmount(row.p, 10000);
  const derivedUnitPrice =
    rawUnitPrice != null
      ? rawUnitPrice
      : (totalPrice != null && totalArea != null && totalArea > 0
          ? +(totalPrice / totalArea).toFixed(3)
          : null);
  /** 買賣列表欄位與官方資料一致：g=屋齡、f=樓別/樓高、t=交易標的（勿將 t 誤作樓別） */
  return {
    address,
    community: fixOfficialText(row.bn || ""),
    tradeDate: fixOfficialText(row.e || ""),
    totalPrice,
    unitPrice: derivedUnitPrice,
    totalArea,
    mainRatio,
    type: fixOfficialText(row.b || ""),
    age: toNumber(String(row.g ?? "").replace(/[^\d.]/g, "")),
    floorInfo: fixOfficialText(row.f || ""),
    target: fixOfficialText(row.t || ""),
    tradeCount: `土${row.j || 0} 建${row.k || 0} 車${row.l || 0}`,
    parkingCount: normalizeComparableParkingCount(row.l),
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
	      row.sq ? `官方序號=${row.sq}` : "",
	      row.parkingCount > 0 ? `官方車位數量=${row.parkingCount}` : "",
	      row.landTransferArea != null ? `土地移轉面積坪=${row.landTransferArea}` : "",
	      row.originalUnitPrice != null ? `原始官方單價萬元每坪=${row.originalUnitPrice}` : "",
	      row.lat != null ? `緯度=${row.lat}` : "",
	      row.lng != null ? `經度=${row.lng}` : "",
	      row.localFallback ? "資料來源=本機離線備援" : ""
	    ].filter(Boolean).join("；")
	  ].join("\t")).join("\n");
}
function manualPlaceKeyword(raw = "") {
  return fixOfficialText(String(raw || "")).trim();
}
function isDoorplateKeyword(raw = "") {
  const text = normalizeFullWidthDigitsToAscii(manualPlaceKeyword(raw)).replace(/\s+/g, "");
  return /(?:\d+|[一二三四五六七八九十百千]+)號/u.test(text) || text.includes("號");
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
    const roadPart = extractRoadThruSectionOnly(placeKeyword) || buildSearchKeywordFromAddress(placeKeyword) || detectRoadFromAddress(placeKeyword) || "";
    return {
      buildKeyword: roadPart || placeKeyword,
      doorKeyword: explicitDoor || placeKeyword,
      communityKeyword: placeKeyword,
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
  const number = toNumber(value);
  if (number == null) return "";
  const unit = selectedRadioValue(els.priceUnitChoice, els.priceUnit?.value || "萬元/坪");
  return String(unit === "元/坪" ? +(number / 10000).toFixed(3) : number);
}
function localFallbackAreaValue(value) {
  const number = toNumber(value);
  if (number == null) return "";
  const unit = selectedRadioValue(els.areaUnitChoice, els.areaUnit?.value || "坪");
  return String(unit === "M2" ? +(number * 0.3025).toFixed(3) : number);
}
function localFallbackTargetTypes(query) {
  const targets = Array.isArray(query.dealTargets) ? query.dealTargets : [];
  const mapped = targets.flatMap((target) => {
    if (target === "房地(車)") return ["房地"];
    return [target];
  });
  return [...new Set(mapped.filter(Boolean))].join(",");
}
function localFallbackParams(query) {
  const params = new URLSearchParams();
  const put = (key, value) => {
    if (value != null && value !== "") params.set(key, String(value));
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
  put("min_total_price", toNumber(els.totalPriceMin?.value) != null ? Math.round(toNumber(els.totalPriceMin.value) * 10000) : "");
  put("max_total_price", toNumber(els.totalPriceMax?.value) != null ? Math.round(toNumber(els.totalPriceMax.value) * 10000) : "");
  put("min_unit_price_ping", localFallbackUnitPriceValue(els.unitPriceMin?.value));
  put("max_unit_price_ping", localFallbackUnitPriceValue(els.unitPriceMax?.value));
  put("min_area_ping", localFallbackAreaValue(els.mainAreaMinFilter?.value));
  put("max_area_ping", localFallbackAreaValue(els.mainAreaMaxFilter?.value));
  put("target_types", localFallbackTargetTypes(query));
  if (query.specialMode === "exclude") put("exclude_special", "true");
  return params;
}
function isoDateToRocText(value) {
  const match = String(value || "").match(/^(19\d{2}|20\d{2})-(\d{1,2})(?:-(\d{1,2}))?/);
  if (!match) return fixOfficialText(value || "");
  return `${Number(match[1]) - 1911}/${String(match[2]).padStart(2, "0")}${match[3] ? `/${String(match[3]).padStart(2, "0")}` : ""}`;
}
function localFallbackRowFromItem(item, index = 0) {
  const totalPriceWan = toNumber(item.total_price ?? item.totalPrice) != null
    ? +(toNumber(item.total_price ?? item.totalPrice) / 10000).toFixed(3)
    : null;
  const rooms = Number(item.rooms);
  const halls = Number(item.halls);
  const baths = Number(item.bathrooms ?? item.baths);
  const layout = [rooms, halls, baths].every(Number.isFinite) && (rooms || halls || baths)
    ? `${rooms}房${halls}廳${baths}衛`
    : "";
  return {
    row: index + 1,
    address: fixOfficialText(item.address || item.address_raw || item.addressRaw || ""),
    community: fixOfficialText(item.community_name || item.communityName || ""),
    tradeDate: isoDateToRocText(item.transaction_date || item.transactionDate || ""),
    totalPrice: totalPriceWan,
    unitPrice: toNumber(item.unit_price_ping ?? item.unitPriceWanPing),
    totalArea: toNumber(item.building_area_ping ?? item.buildingAreaPing),
    mainRatio: null,
    type: fixOfficialText(item.building_type || item.buildingType || ""),
    age: toNumber(item.house_age ?? item.houseAge ?? item.building_age),
    floorInfo: fixOfficialText(item.floor || ""),
    target: fixOfficialText(item.transaction_target || item.transactionTarget || ""),
    tradeCount: "",
    parkingCount: item.has_parking || item.hasParking ? 1 : 0,
    layout,
    parkingPrice: toNumber(item.parking_price ?? item.parkingPrice) != null ? +(toNumber(item.parking_price ?? item.parkingPrice) / 10000).toFixed(3) : null,
    purpose: fixOfficialText(item.main_use || item.mainUse || ""),
    management: item.hasManagement || item.has_management ? "有" : "",
    elevator: "",
    history: "",
    note: fixOfficialText(item.note || ""),
    district: item.district || deriveDistrict(item.address || ""),
    road: deriveRoad(item.address || ""),
    tradePeriodValue: normalizePeriodValue(isoDateToRocText(item.transaction_date || item.transactionDate || "")),
    landTransferArea: toNumber(item.land_area_ping ?? item.landAreaPing),
    mainAreaForFilter: toNumber(item.building_area_ping ?? item.buildingAreaPing),
    lat: toNumber(item.lat),
    lng: toNumber(item.lng),
    localFallback: true,
  };
}
async function runLocalOfflineFallbackSearch(query) {
  const params = localFallbackParams(query);
  const data = await fetchApiJson(`/api/real-price/map-search?${params.toString()}`, {
    cache: "no-store",
    timeoutMs: 15000,
  });
  const rows = (Array.isArray(data.items) ? data.items : [])
    .map(localFallbackRowFromItem)
    .filter(isValidOfficialTransactionRow);
  return {
    rows,
    total: Number(data.total || rows.length),
    geocodedCount: Number(data.geocodedCount || rows.filter((row) => row.lat != null && row.lng != null).length),
    backend: data.backend || "local",
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
    floor: townhouse ? officialUriEncodeField("全") : officialUriEncodeField(query.floorFilter || ""),
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
    tmoney_unit: query.priceUnit === "萬元/坪" ? "1" : "2",
    pmoney_unit: query.priceUnit === "萬元/坪" ? "1" : "2",
    unit: query.areaUnit === "坪" ? "2" : "1",
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
  const totalTimeoutMs = Math.max(5000, Number(options.totalTimeoutMs) || OFFICIAL_TOTAL_TIMEOUT_MS || 45000);
  const maxAttempts = Math.max(1, Number(options.maxAttempts) || OFFICIAL_MAX_ATTEMPTS || 2);
  const timeoutSeconds = Math.round(totalTimeoutMs / 1000);
  const officialSearchController = new AbortController();
  const officialSearchSignal = officialSearchController.signal;
  const createSearchTimeoutError = () => new Error(`官方查詢逾時（已超過 ${timeoutSeconds} 秒，系統已停止本次查詢，避免畫面長時間卡住）`);
  const assertOfficialSearchActive = () => {
    if (officialSearchSignal.aborted) throw createSearchTimeoutError();
  };
  const totalTimer = setTimeout(() => {
    officialSearchController.abort();
  }, totalTimeoutMs);
  const queryProbe = currentQuery();
  if (!queryProbe.cityCode || !queryProbe.districtCode) {
    clearTimeout(totalTimer);
    setMessage("warn", "請先選擇縣市與行政區，再查詢官方資料。");
    return;
  }
  setQueryProgress(true, `官方資料查詢中，最多等候 ${timeoutSeconds} 秒...`);
  setQueryProgressStage("步驟 1/4：正在取得官方 token");
  setMessage("warn", "官方資料查詢中，請稍候...");
  els.calcExplain.textContent = "正在向官方網站取得查詢資料...";
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
        const expandReason = shouldSeekFirstFloorComparables && diagnosticFirstFloorCount === 0
          ? "尚未取得一樓案例"
          : rows.length > 0 && rows.length < OFFICIAL_MIN_ROWS_BEFORE_STOP
            ? `案例不足 ${OFFICIAL_MIN_ROWS_BEFORE_STOP} 筆（目前 ${rows.length} 筆）`
            : "查無資料";
        setQueryProgressStage(`步驟 1/4：${expandReason}，交易期間擴大為最近 ${span} 年並重新取得 token`);
      }
      const query = currentQuery();
      const townhouse = isTownhouseQuery(query);
      ensureOfficialPeriod(query);
      setQueryProgressStage(span === 1 ? "步驟 2/4：正在產生查詢參數" : `步驟 2/4：產生查詢參數（最近 ${span} 年）`);
      setQueryProgressStage(span === 1 ? "步驟 3/4：正在查詢官方資料" : `步驟 3/4：查詢官方資料（最近 ${span} 年）`);
      const fetchOfficialRows = async (overrides = null, note = "") => {
        let lastErr = null;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            assertOfficialSearchActive();
            setQueryProgressStage(
              `${span === 1 ? "步驟 1/4" : `步驟 1/4（最近 ${span} 年）`}：正在取得官方 token${attempt > 1 ? `（重試 ${attempt}/${maxAttempts}）` : ""}`
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
              throw new Error("官方 token 取得失敗，請重整後再試。");
            }
            const servicePayload = buildOfficialServicePayload(query, token);
            if (overrides && typeof overrides === "object") Object.assign(servicePayload, overrides);
            const path = String(common.getPathHash(servicePayload) || "").trim();
            const q = String(common.getEncodeStr(servicePayload) || "").trim();
            els.calcExplain.textContent =
              `官方查詢參數檢查：sid=${sid ? "ok" : "x"}、token=${token ? "ok" : "x"}、period=${query.periodStartYear}/${query.periodStartMonth}~${query.periodEndYear}/${query.periodEndMonth}、pathLen=${path.length}、qLen=${q.length}${note ? `、${note}` : ""}、attempt=${attempt}/${maxAttempts}`;
            if (!path || !q) {
              throw new Error(`官方查詢參數產生失敗（pathLen=${path.length}, qLen=${q.length}），請重新整理新版後再試。`);
            }
            setQueryProgressStage(
              `${span === 1 ? "步驟 3/4" : `步驟 3/4（最近 ${span} 年）`}：正在查詢官方資料${attempt > 1 ? `（重試 ${attempt}/${maxAttempts}）` : ""}`
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
            if ((!msg.includes("(400)") && !isTransientOfficialError(msg)) || attempt >= maxAttempts) break;
            setQueryProgressStage(`官方回應較慢或暫時失敗，${OFFICIAL_RETRY_BASE_DELAY_MS * attempt / 1000} 秒後自動重試 ${attempt + 1}/${maxAttempts}`);
            await waitMs(OFFICIAL_RETRY_BASE_DELAY_MS * attempt);
          }
        }
        throw lastErr || new Error("官方查詢失敗");
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
            note: "已啟用 400 降階重試(1/3)"
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
            note: "已啟用 400 降階重試(2/3)"
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
            note: "已啟用 400 降階重試(3/3)"
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
            note: "查無資料，已放寬附加欄位重查(1/2)"
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
            note: "查無資料，已放寬附加欄位重查(2/2)"
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
      diagnosticFirstFloorCount = rows.filter((row) => comparableRowIsFirstFloor(row)).length;
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
        setQueryProgressStage("步驟 4/4：官方 0 筆，正在啟動本機離線備援資料庫");
        localFallbackResult = await runLocalOfflineFallbackSearch(currentQuery());
      } catch (fallbackError) {
        console.warn("本機離線備援查詢失敗", fallbackError);
      }
      if (localFallbackResult?.rows?.length) {
        rows = localFallbackResult.rows;
        els.recordsInput.value = officialRowsToRecordText(rows);
        updateAreaSummary(rows.length);
        setQueryProgressStage(`步驟 4/4：本機離線備援取得 ${rows.length} 筆，正在排序與估價`);
        setMessage("ok", `官方查詢 0 筆，已啟動本機離線備援資料庫並取得 ${rows.length} 筆；案例已顯示於官方回傳結果表格。`);
        els.calcExplain.textContent =
          `官方網站回傳 0 筆；本機離線備援資料庫取得 ${rows.length} 筆（資料庫總符合約 ${localFallbackResult.total || rows.length} 筆、已定位 ${localFallbackResult.geocodedCount || 0} 筆）。成交案例仍依官方回傳結果欄位配置顯示。`;
        const officialSearchNote = `官方查詢 0 筆，改用本機離線備援取得 ${rows.length} 筆`;
        runSearch({ keepProgress: true, ignoreQueryFilters: true, officialSearchNote });
        return;
      }
      els.recordsInput.value = "";
      updateAreaSummary(0);
      renderRows([]);
      const queryNow = currentQuery();
      const townhouseHint = isTownhouseQuery(queryNow)
        ? `（透天模式：已套用「樓別=全」、樓高不限；原始 ${diagnosticRawCount} 筆、可解析 ${diagnosticNormalizedCount} 筆、透天規則後 ${diagnosticTownhouseKept} 筆）`
        : "";
      els.calcExplain.textContent =
        `官方網站回傳 0 筆資料（已查詢最近 1 年，並因不足 ${OFFICIAL_MIN_ROWS_BEFORE_STOP} 筆擴大為最近 ${fallbackSpanYears} 年後仍無資料）${townhouseHint}。請調整縣市、行政區或門牌／社區名稱後再試。`;
      setMessage("warn", "官方網站目前查無符合條件資料。");
      updateStructuredData();
      return;
    }
    els.recordsInput.value = officialRowsToRecordText(rows);
    updateAreaSummary(rows.length);
    setQueryProgressStage(`步驟 4/4：已取得 ${rows.length} 筆，正在排序與估價`);
    const spanHint = usedSpanYears > 1 ? `（交易期間已自動擴大至最近 ${usedSpanYears} 年）` : "";
    const shortResultHint = rows.length < OFFICIAL_MIN_ROWS_BEFORE_STOP
      ? `（最高擴大至最近 ${fallbackSpanYears} 年後仍不足 ${OFFICIAL_MIN_ROWS_BEFORE_STOP} 筆，改用已取得 ${rows.length} 筆平均）`
      : "";
    const firstFloorHint = shouldSeekFirstFloorComparables
      ? `（標的為一樓，官方資料中一樓案例 ${diagnosticFirstFloorCount} 筆）`
      : "";
    const fallbackHint = usedFallback400
      ? `（已啟用 400 降階重試 ${fallbackTryCount} 次）`
      : usedFallbackZero
        ? `（原條件 0 筆，已放寬附加欄位重查 ${zeroFallbackTryCount} 次）`
        : "（原始條件查詢成功）";
    const bestAvailableHint = usedBestAvailableRows ? "（擴大查詢未取得更多可用案例，保留前次有案例結果）" : "";
    setMessage("ok", `已取得官方資料 ${rows.length} 筆${spanHint}${shortResultHint}${firstFloorHint}${fallbackHint}${bestAvailableHint}，開始進行排序與估價計算。`);
    const queryNow = currentQuery();
    if (isTownhouseQuery(queryNow)) {
      els.calcExplain.textContent =
        `透天診斷：官方原始 ${diagnosticRawCount} 筆、可解析 ${diagnosticNormalizedCount} 筆、符合透天規則（型態含透天或樓別為全）${rows.length} 筆。${shortResultHint}${bestAvailableHint}`;
      if (usedFallback400) {
        els.calcExplain.textContent += ` 本次為 400 降階重試成功（${fallbackTryCount} 次）。`;
      } else if (usedFallbackZero) {
        els.calcExplain.textContent += ` 本次原條件 0 筆，已放寬附加欄位重查成功（${zeroFallbackTryCount} 次）。`;
      } else {
        els.calcExplain.textContent += " 本次為原始條件查詢成功。";
      }
    } else if (usedFallback400) {
      els.calcExplain.textContent = `官方資料已取得 ${rows.length} 筆，本次為 400 降階重試成功（${fallbackTryCount} 次）。${shortResultHint}${bestAvailableHint}`;
    } else if (usedFallbackZero) {
      els.calcExplain.textContent = `官方資料已取得 ${rows.length} 筆，原條件 0 筆後已放寬附加欄位重查成功（${zeroFallbackTryCount} 次）。${shortResultHint}${bestAvailableHint}`;
    } else {
      els.calcExplain.textContent = `官方資料已取得 ${rows.length} 筆，本次為原始條件查詢成功。${shortResultHint}${bestAvailableHint}`;
    }
    const officialSearchNote = `官方查詢取得 ${rows.length} 筆${spanHint}${shortResultHint}${bestAvailableHint}`;
    runSearch({ keepProgress: true, ignoreQueryFilters: true, officialSearchNote });
  } catch (error) {
    lastOfficialRawRows = [];
    const message = String(error.message || "");
    const timeoutHint = message.includes("請求逾時")
      ? "（官方回應較慢，系統已自動重試；請稍後再按搜尋，不必先縮小篩選條件）"
      : "";
    const portHint = message.includes("404")
      ? (["localhost", "127.0.0.1", "::1"].includes(window.location.hostname)
          ? "（請用 python3 serve.py 顯示的網址開啟，例如 http://127.0.0.1:5502/ 或 http://127.0.0.1:5500/；勿只用無 /api/lvr 的靜態伺服器）"
          : `（請確認 ${window.location.hostname}:5502、:5500 或 :5501 有代理，或已反向代理 /api/lvr/*）`)
      : "";
    const fullMessage = `官方查詢失敗：${message}${timeoutHint}${portHint}`;
    els.calcExplain.textContent = fullMessage;
    setMessage(message.includes("請求逾時") ? "warn" : "error", fullMessage);
    updateStructuredData();
  } finally {
    clearTimeout(totalTimer);
    setQueryProgress(false);
  }
}
const officialSearchRuntime = createOfficialSearchRuntime({
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
  if (els.totalAreaDisplay) els.totalAreaDisplay.textContent = formatNum(area.house, 3);
  if (els.parkingAreaDisplay) els.parkingAreaDisplay.textContent = formatNum(area.parking, 3);
  if (els.usableAreaDisplay) els.usableAreaDisplay.textContent = formatNum(area.total, 3);
  if (recordCount !== null) {
    if (els.recordCountDisplay) els.recordCountDisplay.textContent = String(recordCount);
    els.recordCountDisplayCard.textContent = `${recordCount} 筆案例`;
  }
  const parkingCountNote = parkingInfo.source === "ocr"
    ? `車位數量 ${parkingInfo.count} 個採 OCR 停車位編號／權利範圍，不以坪數推算。`
    : "";
  if (els.areaExplain) {
    els.areaExplain.textContent = `房屋坪數 = 主建物 ${formatNum(area.main, 3)} + 附屬 ${formatNum(area.attach, 3)} + 共有 ${formatNum(area.common, 3)} = ${formatNum(area.house, 3)} 坪；車位坪數 ${formatNum(area.parking, 3)} 坪；總坪數 = 房屋坪數 ${formatNum(area.house, 3)} + 車位坪數 ${formatNum(area.parking, 3)} = ${formatNum(area.total, 3)} 坪。${parkingCountNote ? ` ${parkingCountNote}` : ""}`;
    if (area.landShare > 0) {
      const suffix = landShareResult.entries.length ? `（土地持分解析 ${landShareResult.entries.length} 筆）` : "";
      els.areaExplain.textContent += ` 土地持分坪合計 ${formatNum(area.landShare, 3)} 坪${suffix}。`;
    }
  }
  updateStructuredData();
}
function browserOcrDisabledError() {
  return new Error("瀏覽器 Tesseract OCR 已停用；請確認 8001 OCR 後端可用，若需 Docker 補強再確認 8099 服務已啟動後再試。");
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
  if (error == null) return "未知錯誤";
  if (typeof error === "string") return error || "未知錯誤";
  if (error.message) return error.message;
  try {
    const json = JSON.stringify(error);
    if (json && json !== "{}") return json;
  } catch (_) {}
  return String(error) || "未知錯誤";
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
  return Object.prototype.hasOwnProperty.call(fields || {}, key)
    || Boolean(result?.diagnostics?.field_results?.[key]);
}
function shouldSuppressParsedCommonAreaFallback(result = {}, fields = {}, rawText = "", parsedCommonArea = null) {
  const parsedPing = Number(parsedCommonArea?.valuePing);
  if (!Number.isFinite(parsedPing) || parsedPing <= 0) return false;
  if (backendOcrFieldHasValue(fields, "common_area_ping")) return false;
  if (!backendOcrFieldWasEvaluated(result, fields, "common_area_ping")) return false;
  return !hasRealCommonPartEvidenceStable(rawText);
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
  return (Array.isArray(pages) ? pages : [])
    .map((page) => String(page?.text || "").trim())
    .filter(Boolean)
    .join("\n\n");
}
const PADDLE_OCR_DIAGNOSTICS_CACHE_MS = 30000;
const PADDLE_OCR_DIAGNOSTICS_TIMEOUT_MS = 3000;
let paddleOcrDiagnosticsCache = null;
let paddleOcrDiagnosticsCachedAt = 0;
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
      throw new Error(`OCR backend diagnostics timeout after ${Math.round(PADDLE_OCR_DIAGNOSTICS_TIMEOUT_MS / 1000)} 秒`);
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
  if (!diagnostics) return "OCR 後端尚未連線；PDF 會先用快速文字層解析，不會等待後端。";
  if (ocrBackendAvailable(diagnostics)) return "OCR 後端可用；圖片先用 ppocrv5_ncnn，欄位不足時以 YOLO/紅框 ROI 補強，ROI 無文字才用 Docker PaddleOCR，最後才全頁 Docker 備援（Docker PaddleOCR 備援）。";
  return `OCR 後端目前無可用圖片 OCR；PDF 仍可走快速文字層解析。${translateOcrWarning(ocrBackendUnavailableReason(diagnostics))}`;
}
function setPaddleOcrStatusInLog(status) {
  if (!status || !els.ocrLog) return;
  const lines = String(els.ocrLog.textContent || "")
    .split("\n")
    .filter((line) => !line.startsWith("PaddleOCR 後端") && !line.startsWith("OCR 後端"));
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
    setOcrProgress(initialProgress, "OCR 後端解析中...");
    els.ocrLog.textContent = [
      options.reason || "正在使用 OCR 後端解析。",
      `若 ppocrv5_ncnn 與 Docker PaddleOCR 都不可用且超過 ${Math.round(timeoutMs / 1000)} 秒，PDF 會回到快速文字層解析；圖片不再使用瀏覽器 Tesseract 或 macOS Vision。`
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
    if (result.ocr_engine_used === "fallback_none" || (result.fallback_reason && !(result.pages || []).some((page) => String(page?.text || "").trim()))) {
      throw new Error(result.fallback_reason || "OCR backend returned no recognized text.");
    }

    const fields = result.fields || {};
    const paddleText = paddlePagesText(result.pages);
    let pdfTextLayer = "";
    if (isPdfFile(file) && window.pdfjsLib?.getDocument) {
      try {
        setOcrProgress(28, "OCR 後端完成，補讀 PDF 文字層判斷層次");
        pdfTextLayer = await withTimeout(
          extractPdfTextLayer(file),
          Math.min(PDF_QUICK_TEXT_TIMEOUT_MS, 6000),
          "PDF 文字層讀取逾時"
        );
      } catch (error) {
        console.info("PDF text layer supplement unavailable after OCR backend.", error);
      }
    }
    const rawText = [paddleText, pdfTextLayer].filter(Boolean).join("\n\n");
    const paddleParsed = rawText ? parseDeedOcrText(rawText) : null;
    const paddleAddress = fields.building_address || paddleParsed?.propertyAddress || paddleParsed?.address || "";
    const normalizedPaddleAddress = paddleAddress ? (sanitizePropertyDoorplate(paddleAddress) || String(paddleAddress)) : "";
    const suppressParsedCommonAreaFallback = shouldSuppressParsedCommonAreaFallback(result, fields, rawText, paddleParsed?.common);
    const paddleParsedForFields = suppressParsedCommonAreaFallback && paddleParsed ? { ...paddleParsed, common: null } : paddleParsed;
    const backendOrParsedPing = (backendValue, parsedValue) => String(backendValue ?? "").trim() !== "" ? backendValue : (parsedValue ?? null);
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
		    const paddleTownhouseByLevels = shouldTreatParsedAsTownhouse(paddleParsedForType, paddleFloors)
		      || shouldTreatRawTextAsTownhouse(rawText, paddleFloors)
		      || shouldTreatWholeDoorplateLowRiseAsTownhouse(normalizedPaddleAddress, paddleFloors, parsedMainPing ?? fields.main_building_area_ping);
		    const appliedPaddleType = paddleTownhouseByLevels
		      ? (applyType("透天"), els.isTownhouse.checked = true, "透天")
		      : applyBuildingTypeFromParsed(paddleParsedForFields, null, paddleFloors, rawText);
    if (normalizedPaddleAddress) {
      els.subjectAddress.value = normalizedPaddleAddress;
      setRecognizedAddressFields({ property: normalizedPaddleAddress });
    }
    if (fields.main_usage && !selectedMainPurposes().length) {
      setCheckboxValues(els.mainPurposePick, String(fields.main_usage));
    }
    els.otherArea.value = "";

	    revealDeedFieldsAfterOcr();
	    updateAreaSummary(parseRecords(els.recordsInput.value || defaultRecords).length);

    lastOcrMapping = {
      source_file: file.name,
      mapped_by: result.cache_hit ? "ocr_pipeline_cache" : (result.ocr_engine_used || "ocr_pipeline"),
      building_address: normalizedPaddleAddress,
	      main_building_area_ping: parsedMainPing ?? fields.main_building_area_ping ?? "",
	      attached_building_area_ping: parsedAttachPing ?? fields.attached_building_area_ping ?? "",
	      common_area_ping: parsedCommonPing ?? fields.common_area_ping ?? "",
	      parking_area_ping: parsedParkingPing ?? fields.parking_area_ping ?? "",
		      parking_count: fields.parking_count ?? paddleParsedForFields?.parkingCount ?? paddleParsedForFields?.parkingDeedShare?.count ?? "",
	      land_share: fields.land_share || els.landShareArea?.value || "",
	      floor: fields.floor || "",
	      total_floor: paddleFloors || "",
	      層次: paddleParsedForType?.unitFloors?.join("、") || "",
      多層次透天判斷: paddleTownhouseByLevels ? "是" : "",
	      建築完成日期: fields.completion_date || paddleParsedForFields?.completionDateText || "",
	      主要用途: fields.main_usage || paddleParsedForFields?.purpose || "",
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
      updateAreaSummary(parseRecords(els.recordsInput.value || defaultRecords).length);
    }
    const backendEngine = result.ocr_engine_used || (result.cache_hit ? "ocr_pipeline_cache" : "ocr_pipeline");
    const backendSource = result.cache_hit ? "ocr_pipeline_cache" : backendEngine;
    const backendConfidence = Number.isFinite(Number(result.confidence)) ? Number(result.confidence) : (result.cache_hit ? 0.92 : 0.88);
    setOcrProgress(100, result.cache_hit ? "OCR 後端快取命中" : "OCR 後端完成");
    const warningText = (result.warnings || []).slice(0, 6).join("\n");
    els.ocrLog.textContent = [
      `Engine: ${ocrSourceLabel(backendEngine)}${result.cache_hit ? "（快取）" : ""}`,
      `Parsed area fields: ${Math.max(hitCount, backendAreaHitCount)}/3`,
      normalizedPaddleAddress ? `Building address: ${normalizedPaddleAddress}` : "Building address: not parsed",
      (parsedMainPing ?? fields.main_building_area_ping) ? `Main area: ${paddlePingValue(parsedMainPing ?? fields.main_building_area_ping)} ping` : "Main area: not parsed",
      (parsedAttachPing ?? fields.attached_building_area_ping) ? `Attached area: ${paddlePingValue(parsedAttachPing ?? fields.attached_building_area_ping)} ping` : "Attached area: not parsed",
      (parsedCommonPing ?? fields.common_area_ping) ? `Common area: ${paddlePingValue(parsedCommonPing ?? fields.common_area_ping)} ping` : "Common area: not parsed",
      paddleTownhouseByLevels ? `Townhouse detected: ${paddleParsedForType?.unitFloors?.join("、") || "低樓層整棟門牌"}，已判定為透天` : "",
      appliedPaddleType ? `Building type: ${appliedPaddleType}` : "",
      deedQueryReady ? `Query synced: ${selectedLabel(els.cityName)} ${selectedLabel(els.districtName)} ${els.roadKeyword.value.trim()}` : "Query sync needs manual review",
      warningText ? `Warnings:\n${warningText}` : ""
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
            note: result.fallback_reason ? translateOcrWarning(result.fallback_reason) : (isPdfFile(file) ? "OCR 後端 PDF 模式" : "OCR 後端圖片解析")
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
      scheduleAutoOfficialSearchAfterDeedReady(true, "OCR 後端");
    }
    return true;
  } catch (error) {
    console.info("OCR backend unavailable or too slow; returning to the fast OCR path.", error);
    const fallbackMode = isPdfFile(file) ? "PDF 快速解析" : "圖片 OCR 後端檢查";
    const reason = error?.name === "AbortError"
      ? `OCR backend timed out after ${Math.round(timeoutMs / 1000)} seconds.`
      : translateOcrWarning(formatCaughtError(error));
    els.ocrLog.textContent = `OCR 後端未在快速時限內完成，已回到${fallbackMode}。${reason}`;
    setOcrProgress(initialProgress, `OCR 後端未完成，回到${fallbackMode}`);
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
      safeNumber(els.mainArea.value),
      safeNumber(els.attachArea.value),
      safeNumber(els.commonArea.value)
    ].filter((value) => value > 0).length
  );
  const floorCount = safeNumber(parsed?.floors || els.totalFloors.value || knownPreset?.floors);
  const hasAddress = !!(
    parsed?.propertyAddress
    || parsed?.address
    || els.subjectAddress.value.trim()
    || knownPreset?.queryAddress
    || knownPreset?.address
  );
  const hasType = !!(
    parsed?.foundType
    || els.houseType.value.trim()
    || knownPreset?.type
    || detectTypeByFloors(floorCount)
  );
  const reasons = [];
  if (areaHits < 2) reasons.push(`主要面積欄位僅 ${areaHits}/3`);
  if (!hasAddress && !querySynced) reasons.push("未取得建物門牌或查詢地址");
  if (!hasType) reasons.push("未取得總樓層或建物型態");
  return { ok: reasons.length === 0, reasons };
}
/** 建物謄本 PDF：第一頁表頭＋建物標示部裁切 OCR，與圖片流程一致，補強縣市／行政區與標示部欄位 */
async function ocrPdfFirstPageDeedBands(file) {
  throw browserOcrDisabledError();
}
async function runOcr() {
  const file = primaryOcrSourceFile();
  if (!file) {
    els.ocrLog.textContent = "請先上傳影本圖片或 PDF。";
    return;
  }
  const startedAt = Date.now();
  const backendAttempt = initialBackendOcrAttempt(file, {
    backendEnabled: USE_PADDLE_OCR,
    isPdfFile
  });
  if (backendAttempt.shouldAttempt && await tryPaddleOcr(file, { reason: backendAttempt.reason || undefined })) {
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
        setOcrProgress(45, "PDF 快速讀取文字層");
        const pdfText = await withTimeout(
          extractPdfTextLayer(file),
          PDF_QUICK_TEXT_TIMEOUT_MS,
          "PDF 文字層讀取逾時"
        );
        pdfTextForDiagnostics = pdfText;
        if (cleanOcrText(pdfText).length > 40) {
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
          if (textLayerParsed.purpose && !selectedMainPurposes().length) setCheckboxValues(els.mainPurposePick, textLayerParsed.purpose);
          applyBuildingTypeFromParsed(textLayerParsed, knownPreset);
          await syncManualQueryFromParsedDeed(textLayerParsed, pdfText, queryAddress);
          textLayerMessage = `PDF 文字層快速解析完成，面積欄位 ${hitCount}/3。`;
        } else {
          textLayerMessage = "PDF 文字層文字不足，已保留檔名保底欄位。";
        }
      } catch (error) {
        textLayerMessage = `PDF 文字層快速解析未完成：${formatCaughtError(error)}。`;
      }
    } else {
      textLayerMessage = "PDF 文字層模組未載入，已保留檔名保底欄位。";
    }
	    revealDeedFieldsAfterOcr();
	    updateAreaSummary();
    setOcrProgress(100, "PDF 快速結束");
    els.ocrLog.textContent = [
      "OCR 後端未能快速完成，已改用 PDF 快速解析。",
      textLayerMessage,
      knownPreset || presetApplied ? "已套用或保留已知檔名保底欄位；請檢查欄位。" : "此 PDF 無已知保底欄位；若欄位不足，請改用圖片或先將建物標示部頁面截圖後上傳。",
      "為避免卡住，本版本不對 PDF 執行瀏覽器 Tesseract OCR。"
    ].join("\n");
    const diagnosticsSource = textLayerParsed ? "pdfTextLayer" : (knownPreset ? "knownFilePreset" : "pdfTextLayer");
    renderOcrFieldDiagnostics(
      buildOcrFieldResultsFromParsed(textLayerParsed || {}, {
        source: diagnosticsSource,
        fileName: file.name,
        rawText: pdfTextForDiagnostics,
        preset: knownPreset,
        confidence: textLayerParsed ? 0.84 : 0.99,
        warnings: textLayerParsed ? [] : ["OCR 後端未完成，採快速解析結果"]
      }),
      {
        ocrTiming: {
          elapsedMs: Date.now() - startedAt,
          source: diagnosticsSource,
          note: "OCR 後端 fallback PDF quick path"
        }
      }
    );
    updateStructuredData();
    return;
  }
  if (!isPdfFile(file)) {
    const backendFailureDetail = String(els.ocrLog.textContent || "").trim();
    els.ocrLog.textContent = [
      "圖片 OCR 尚未取得可用結果；本版本已取消瀏覽器 Tesseract。",
      "請先確認 8001 OCR 後端健康狀態；若需 Docker 補強，再確認 8099 服務已啟動後重試。",
      backendFailureDetail ? `後端回報：${backendFailureDetail}` : ""
    ].filter(Boolean).join("\n");
    setOcrProgress(0, "圖片 OCR 後端未完成");
    renderOcrFieldDiagnostics(
      buildKnownPresetOcrFieldResults(file.name, getKnownFilePreset(file.name), {
        extra: {},
      }),
      {
        ocrTiming: {
          elapsedMs: Date.now() - startedAt,
          source: "backendOnlyImageOcr",
          note: "圖片 OCR 已取消瀏覽器 Tesseract 備援"
        }
      }
    );
    updateStructuredData();
    return;
  }
  els.ocrBtn.disabled = true;
  els.ocrBtn.textContent = "辨識中...";
  setOcrProgress(5, "OCR 準備中");
  try {
    let rawText = "";
    let mode = "圖片 OCR";
    if (isPdfFile(file)) {
      if (!window.pdfjsLib || !window.pdfjsLib.getDocument) {
        els.ocrLog.textContent = `PDF 解析模組未載入，已先套用檔名對應欄位：${file.name}。`;
        setOcrProgress(100, "PDF 模組未載入，已套用保底欄位");
        renderOcrFieldDiagnostics(
          buildKnownPresetOcrFieldResults(file.name, getKnownFilePreset(file.name)),
          { ocrTiming: { elapsedMs: Date.now() - startedAt, source: "knownFilePreset", note: "PDF 模組未載入" } }
        );
        return;
      }
      const pdfText = await extractPdfTextLayer(file, { maxPages: PDF_TEXT_LAYER_MAX_PAGES });
      if (cleanOcrText(pdfText).length > 40) {
        rawText = pdfText;
        mode = "PDF 文字層";
        setOcrProgress(60, "已抓取 PDF 文字層");
      } else if (!ENABLE_BROWSER_PDF_OCR_FALLBACK) {
        rawText = "";
        mode = "PDF 快速解析";
        setOcrProgress(70, "PDF 無可用文字層，已略過耗時瀏覽器 OCR");
      } else {
        const bandText = await ocrPdfFirstPageDeedBands(file);
        const bandParsed = parseDeedOcrText(bandText);
        if (parsedDeedHasCoreFields(bandParsed) || isBuildingRegistrationDeedText(bandText)) {
          rawText = bandText;
          mode = "PDF 重點欄位 OCR";
        } else {
          rawText = await ocrPdfFile(file, { maxPages: PDF_BROWSER_OCR_MAX_PAGES, dpi: PDF_OCR_RASTER_DPI });
          mode = `PDF OCR（前 ${PDF_BROWSER_OCR_MAX_PAGES} 頁）`;
        }
      }
    } else {
      rawText = await ocrImageSource(file, "OCR 辨識中");
    }
    let parsed = parseDeedOcrText(rawText);
    const deedLike = isBuildingRegistrationDeedText(rawText);
    if (deedLike && !isPdfFile(file)) {
      setOcrProgress(36, "建物謄本：欄位級 OCR（建號／門牌／用途／面積／共有／權利範圍）");
      const headerOcr = await ocrImageSource(file, "OCR 謄本上帶", { regionStart: 0, regionEnd: 0.24, ocrLayout: "headerBand" });
      const fieldText = await ocrDeedFieldLevelBlocks(file, "");
      rawText = [headerOcr, fieldText, rawText].filter(Boolean).join("\n\n");
      parsed = parseDeedOcrText(rawText);
    } else if (ENABLE_BROWSER_PDF_OCR_FALLBACK && deedLike && isPdfFile(file) && mode !== "PDF 文字層" && mode !== "PDF 重點欄位 OCR" && window.pdfjsLib && window.pdfjsLib.getDocument) {
      setOcrProgress(36, "建物謄本 PDF：欄位級 OCR（第一頁六區）");
      const bandText = await ocrPdfFirstPageDeedBands(file);
      rawText = [bandText, rawText].filter(Boolean).join("\n\n");
      parsed = parseDeedOcrText(rawText);
    } else if (ENABLE_BROWSER_PDF_OCR_FALLBACK && deedLike && isPdfFile(file) && mode === "PDF 文字層" && !parsedDeedHasCoreFields(parsed) && window.pdfjsLib && window.pdfjsLib.getDocument) {
      setOcrProgress(36, "PDF 文字層不足：補抓第一頁欄位 OCR");
      const bandText = await ocrPdfFirstPageDeedBands(file);
      rawText = [bandText, rawText].filter(Boolean).join("\n\n");
      parsed = parseDeedOcrText(rawText);
    } else if (!isPdfFile(file) && (!parsed.address || !parsed.main || !parsed.attach || !parsed.common)) {
      setOcrProgress(48, "欄位級 OCR 加強");
      const headerBoost = await ocrImageSource(file, "OCR 謄本上帶", { regionStart: 0, regionEnd: 0.24, ocrLayout: "headerBand" });
      const fieldBoost = await ocrDeedFieldLevelBlocks(file, "");
      const addressBoost = await ocrImageSource(file, "OCR 地址加強辨識中", { focusTop: true, ocrLayout: "addressBlock" });
      rawText = [rawText, headerBoost, fieldBoost, addressBoost].filter(Boolean).join("\n\n");
      parsed = parseDeedOcrText(rawText);
    }
    if (ENABLE_BROWSER_PDF_OCR_FALLBACK && isPdfFile(file) && mode === "PDF 文字層" && parsed.landShare?.valuePing == null) {
      setOcrProgress(62, "PDF 土地標示部快速補抓 OCR（僅第 1 頁）");
      const landOcrText = await ocrPdfFile(file, { maxPages: 1, dpi: PDF_OCR_RASTER_DPI });
      rawText = [rawText, landOcrText].filter(Boolean).join("\n\n");
      parsed = parseDeedOcrText(rawText);
      if (parsed.landShare?.valuePing != null) mode = "PDF 文字層 + 土地持分 OCR";
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
    const floorCount = safeNumber(els.totalFloors.value);
    const floorTypeGuess =
      Number.isFinite(floorCount) && floorCount > 0 ? detectTypeByFloors(floorCount) : "";
    const parsedForType = parsedWithSupplementalLevelNumbers(parsed, rawText);
    const townhouseByLevels = shouldTreatParsedAsTownhouse(parsedForType, floors || els.totalFloors.value)
      || shouldTreatRawTextAsTownhouse(rawText, floors || els.totalFloors.value)
      || shouldTreatWholeDoorplateLowRiseAsTownhouse(propertyAddress || address, floors || els.totalFloors.value, main?.valuePing ?? els.mainArea.value);
    if (townhouseByLevels) {
      applyType("透天");
      els.isTownhouse.checked = true;
    } else if (foundType) {
      applyType(foundType);
      els.isTownhouse.checked = foundType === "透天";
    } else if (floorTypeGuess) {
      applyType(floorTypeGuess);
      els.isTownhouse.checked = floorTypeGuess === "透天";
    }
    const knownPreset = getKnownFilePreset(file.name);
    const presetDoorplate = knownPreset?.queryAddress || knownPreset?.address || "";
    let queryAddress = presetDoorplate
      || propertyAddress
      || address
      || residenceAddress
      || knownPreset?.ownerResidence
      || "";
    queryAddress = applyFilenameHintToPropertyAddress(queryAddress, file.name) || queryAddress;
    queryAddress = sanitizePropertyDoorplate(queryAddress) || queryAddress;
    queryAddress = await completeAddressWithLocalKnowledge(queryAddress, rawText);
    if (queryAddress) els.subjectAddress.value = queryAddress;
    if (purpose && !selectedMainPurposes().length) setCheckboxValues(els.mainPurposePick, purpose);
    const resolvedMain = toNumber(els.mainArea.value);
    const resolvedAttach = toNumber(els.attachArea.value);
    const resolvedCommon = toNumber(els.commonArea.value);
    const resolvedLandShare = toNumber(els.landShareArea.value);
    const resolvedParkingDeed = parkingDeedShare != null ? parkingDeedShare.valuePing : toNumber(els.parkingArea.value);
    const resolvedParkingCount = ocrParkingCountOverride();
    const resolvedFloors = floors || toNumber(els.totalFloors.value);
    let resolvedAddress = presetDoorplate || propertyAddress || address || "";
    resolvedAddress = applyFilenameHintToPropertyAddress(resolvedAddress, file.name) || resolvedAddress;
    resolvedAddress = sanitizePropertyDoorplate(resolvedAddress) || resolvedAddress;
    resolvedAddress = await completeAddressWithLocalKnowledge(resolvedAddress, rawText);
    const resolvedResidenceAddress = residenceAddress || knownPreset?.ownerResidence || "";
    const resolvedQueryAddress = els.subjectAddress.value.trim() || queryAddress || resolvedResidenceAddress || resolvedAddress;
    const resolvedPurpose = selectedMainPurposes().join("、") || purpose || "";
    const resolvedType = els.houseType.value.trim() || foundType || selectedTypes().join("、");
    const finalHitCount = [resolvedMain, resolvedAttach, resolvedCommon].filter((value) => value != null && value > 0).length;
    const sourceLabel = presetApplied && directHitCount < 3 ? `${mode} + 已知案例保底` : mode;
    lastOcrMapping = {
      source_file: file.name,
      mapped_by: sourceLabel,
      建物門牌: resolvedAddress,
      住址: resolvedResidenceAddress,
      查詢地址: resolvedQueryAddress,
      地址: resolvedAddress,
      總樓層數: resolvedFloors || "",
      標的所在樓層: unitFloor ?? "",
      層次: parsedForType?.unitFloors?.length ? parsedForType.unitFloors.join("、") : (unitFloors?.length ? unitFloors.join("、") : ""),
      多層次透天判斷: townhouseByLevels ? "是" : "",
      建物型態: resolvedType || "",
      主要用途: resolvedPurpose || "",
      建築完成日期: completionDateText || "",
      主建物面積坪: resolvedMain ?? "",
      附屬建物面積坪: resolvedAttach ?? "",
      共有部分面積坪: resolvedCommon ?? "",
      標的土地持分坪合計: resolvedLandShare ?? "",
      車位權狀坪數: resolvedParkingDeed != null ? resolvedParkingDeed : "",
      車位數量: resolvedParkingCount || "",
      其他登記事項面積坪: ""
    };
    setRecognizedAddressFields({
      property: resolvedAddress
    });
    const diagnosticsSource = mode.includes("PDF 文字層") ? "pdfTextLayer" : "ocr_pipeline";
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
    setOcrProgress(100, "OCR 完成");
    els.ocrLog.textContent = [
      `來源：${sourceLabel}`,
      `OCR 完成，目前共有 ${finalHitCount}/3 個面積欄位可用（主建物、附屬、共有部分）。`,
      presetApplied && directHitCount < finalHitCount ? "已依檔名套用已知案例保底欄位。" : "本次顯示以實際解析結果為主。",
      `主建物：${resolvedMain != null ? `${resolvedMain} 坪` : "未抓到"}`,
      `附屬建物：${resolvedAttach != null ? `${resolvedAttach} 坪` : "未抓到"}`,
      `共有部分：${resolvedCommon != null ? `${resolvedCommon} 坪` : "未抓到"}`,
      resolvedLandShare != null && resolvedLandShare > 0 ? `土地持分坪合計：${resolvedLandShare} 坪` : "土地持分：未抓到",
      resolvedParkingDeed != null && resolvedParkingDeed > 0 ? `車位權狀分攤坪數：${resolvedParkingDeed} 坪（已自共有權利範圍拆出）` : "",
      resolvedParkingCount ? `車位數量：${resolvedParkingCount} 個（依 OCR 停車位編號／權利範圍）` : "",
      resolvedFloors ? `總樓層：${resolvedFloors}` : "總樓層：未抓到",
      townhouseByLevels ? `層次：${unitFloors.join("、")}（多個層次，已判定為透天）` : "",
      resolvedAddress ? `建物門牌：${resolvedAddress}` : "建物門牌：未抓到",
      resolvedPurpose ? `主要用途：${resolvedPurpose}` : "主要用途：未抓到",
      deedQueryReady ? `已帶入查詢欄位：${selectedLabel(els.cityName)} ${selectedLabel(els.districtName)} ${els.roadKeyword.value.trim()}` : "尚未能自動帶入完整查詢地址",
      finalHitCount === 0 ? `OCR 文字預覽：${compactText.slice(0, 240) || "未取得有效文字"}` : ""
    ].filter(Boolean).join("\n");
    if (deedQueryReady) {
      scheduleAutoOfficialSearchAfterDeedReady(true, "OCR");
    }
  } catch (error) {
    console.error("OCR failed", error);
    els.ocrLog.textContent = `OCR 失敗：${formatCaughtError(error)}`;
    setOcrProgress(0, "OCR 失敗");
  } finally {
    els.ocrBtn.disabled = false;
    els.ocrBtn.textContent = "開始 OCR / PDF 解析";
    updateStructuredData();
  }
}
const ocrRuntime = createOcrRuntime({
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
    const legacyMode = Number.isFinite(toNumber(parts[1]));
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
      address: parts[0] || `未命名案例 ${index + 1}`,
      community: deriveCommunity(parts[0] || ""),
      tradeYearMonth: "",
      unitPrice: toNumber(parts[1]),
      totalPrice: toNumber(parts[2]),
      totalArea: toNumber(parts[3]),
      mainRatio: toNumber(parts[4]),
      type: parts[5] || "",
      age: toNumber(parts[6]),
      floorInfo: parts[7] || "",
      purpose: parts[8] || "",
      target: parts[9] || "",
      layout: parts[10] || "",
      parkingPrice: toNumber(parts[11]),
      management: "",
      elevator: "",
      history: "",
      note: parts.slice(12).join(",")
    } : {
      row: index + 1,
      address: parts[0] || `未命名案例 ${index + 1}`,
      community: parts[1] || "",
      tradeYearMonth: parts[2] || "",
      unitPrice: toNumber(parts[3]),
      totalPrice: toNumber(parts[4]),
      totalArea: toNumber(parts[5]),
      mainRatio: toNumber(parts[6]),
      type: parts[7] || "",
      age: toNumber(parts[8]),
      floorInfo: parts[9] || "",
      purpose: parts[10] || "",
      target: parts[11] || "",
      layout: parts[12] || "",
      parkingPrice: toNumber(parts[13]),
      management: parts[14] || "",
      elevator: parts[15] || "",
      history: parts[16] || "",
      note: parts.slice(17).join(",")
    };
    row.landTransferArea = extractLandTransferAreaFromText(row.note);
    row.originalUnitPrice = extractOriginalOfficialUnitPriceFromText(row.note);
    row.sq = extractOfficialSqFromText(row.note);
    row.lat = extractCoordinateFromText(row.note, ["lat", "緯度"]);
    row.lng = extractCoordinateFromText(row.note, ["lng", "lon", "經度"]);
    row.localFallback = /本機離線備援/.test(row.note);
    row.parkingCount = comparableParkingCount(row);
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
  if (removed.has(row)) return '<span class="badge badge-removed">未納入平均</span>';
  if (kept.has(row)) return row.shortTermPriorSale ? '<span class="badge badge-kept">前手價認列</span>' : '<span class="badge badge-kept">納入平均</span>';
  return '<span class="badge">已排序</span>';
}
function parseResultTradeDateSortValue(row) {
  const text = normalizeFullWidthDigitsToAscii(String(row.tradeDate || row.tradeYearMonth || "").trim());
  const match = text.match(/(\d{2,3})\D?(\d{1,2})(?:\D?(\d{1,2}))?/);
  if (match) {
    return Number(match[1]) * 10000 + Number(match[2]) * 100 + Number(match[3] || 0);
  }
  return row.tradePeriodValue != null ? Number(row.tradePeriodValue) * 100 : null;
}
function floorInfoSortValue(row) {
  const unitFloor = parseUnitFloorFromFloorInfo(row.floorInfo);
  const totalFloors = parseTotalFloorsFromFloorInfo(row.floorInfo);
  if (Number.isFinite(unitFloor) || Number.isFinite(totalFloors)) {
    return (Number.isFinite(unitFloor) ? unitFloor : 0) * 1000 + (Number.isFinite(totalFloors) ? totalFloors : 0);
  }
  return String(row.floorInfo || "").trim();
}
function resultSortValue(row, key, kept, removed) {
  switch (key) {
    case "totalPrice": return row.totalPrice;
    case "tradeDate": return parseResultTradeDateSortValue(row);
    case "unitPrice": return row.unitPrice;
    case "totalArea": return row.totalArea;
    case "age": return row.age;
    case "floorInfo": return floorInfoSortValue(row);
    case "parkingPrice": return row.parkingPrice;
    case "comparableScore": return row.comparableScore;
    case "status": return resultStatusRank(row, kept, removed);
    case "address": return row.address || "";
    case "community": return row.community || "";
    case "type": return row.type || "";
    case "purpose": return row.purpose || "";
    case "target": return row.target || "";
    case "layout": return row.layout || "";
    case "management": return row.management || "";
    case "elevator": return row.elevator || "";
    case "note": return row.note || "";
    default: return "";
  }
}
function isMissingSortValue(value) {
  return value == null || value === "" || (typeof value === "number" && !Number.isFinite(value));
}
function compareSortValues(a, b) {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return resultSortCollator.compare(String(a), String(b));
}
function sortedResultRows(rows, kept, removed) {
  const { sortKey, sortDirection } = resultTableState;
  if (!sortKey || !resultSortColumns.has(sortKey)) return rows;
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
    button.setAttribute("aria-label", `${button.textContent.trim()}排序${active ? (direction === "asc" ? "，目前由小到大" : "，目前由大到小") : ""}`);
    const icon = button.querySelector(".sort-icon");
    if (icon) icon.textContent = active ? (direction === "asc" ? "↑" : "↓") : "↕";
    const th = button.closest("th");
    if (th) {
      th.classList.toggle("sort-active", active);
      th.setAttribute("aria-sort", active ? (direction === "asc" ? "ascending" : "descending") : "none");
    }
  });
}
function sortResultTableBy(key) {
  if (!resultSortColumns.has(key)) return;
  resultTableState.sortDirection = resultTableState.sortKey === key && resultTableState.sortDirection === "asc" ? "desc" : "asc";
  resultTableState.sortKey = key;
  renderRows(resultTableState.rows, resultTableState.kept, resultTableState.removed);
}
function resetResultTableSortState() {
  resultTableState = { rows: [], kept: new Set(), removed: new Set(), sortKey: DEFAULT_RESULT_SORT_KEY, sortDirection: DEFAULT_RESULT_SORT_DIRECTION };
  updateResultSortButtons();
}
function renderRows(rows, kept = new Set(), removed = new Set()) {
  resultTableState.rows = Array.isArray(rows) ? [...rows] : [];
  resultTableState.kept = kept;
  resultTableState.removed = removed;
  if (!rows.length) {
    els.resultBody.innerHTML = '<tr><td colspan="18" style="color:#667085;">查無符合條件資料</td></tr>';
    updateResultSortButtons();
    return;
  }
  const displayRows = sortedResultRows(rows, kept, removed);
  els.resultBody.innerHTML = displayRows.map((row, index) => {
    const status = resultStatusBadge(row, kept, removed);
    const tradeDate = row.tradeDate || row.tradeYearMonth || "";
    const unitTitle = row.landTransferArea != null && row.originalUnitPrice != null
      ? `透天單價改算：總價 ${formatNum(row.totalPrice, 0)} ÷ 土地移轉面積 ${formatNum(row.landTransferArea, 3)} 坪；原官方單價 ${formatNum(row.originalUnitPrice)}`
      : "";
    const scoreTitle = Array.isArray(row.comparableSortReason) ? row.comparableSortReason.join("\n") : "";
    const scoreCell = Number.isFinite(row.comparableScore) ? formatNum(row.comparableScore, 1) : "";
    return `<tr><td>${safeCell(row.address)}</td><td>${safeCell(row.community)}</td><td class="cell-num">${row.totalPrice != null ? formatNum(row.totalPrice, 0) : ""}</td><td>${safeCell(tradeDate)}</td><td class="cell-unit-price" title="${escapeHtml(unitTitle)}">${formatNum(row.unitPrice)}</td><td class="cell-num">${row.totalArea != null ? formatNum(row.totalArea) : ""}</td><td>${safeCell(row.type)}</td><td class="cell-num">${row.age != null ? safeCell(row.age) : ""}</td><td>${safeCell(row.floorInfo)}</td><td>${safeCell(row.purpose)}</td><td>${safeCell(row.target)}</td><td>${safeCell(row.layout)}</td><td class="cell-num">${row.parkingPrice != null ? formatNum(row.parkingPrice, 0) : ""}</td><td>${safeCell(row.management)}</td><td>${safeCell(row.elevator)}</td><td class="cell-num" title="${escapeHtml(scoreTitle)}">${safeCell(scoreCell)}</td><td>${status}</td><td>${safeCell(hideOfficialSqInNote(row.note || ""))}</td></tr>`;
  }).join("");
  updateResultSortButtons();
}
function rangeOk(value, min, max) { if (min != null && (value == null || value < min)) return false; if (max != null && (value == null || value > max)) return false; return true; }
function includesToken(source, keyword) { if (!keyword) return true; return String(source || "").includes(keyword); }
function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, "")
    .replace(/臺/g, "台")
    .trim();
}
function stripLeadingKnownAdminArea(value) {
  let text = String(value || "");
  const cityNames = Object.keys(CITY_DISTRICTS).flatMap((city) => [city, city.replace(/^臺/, "台"), city.replace(/^台/, "臺")]);
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
function normalizeDoorplateForMatch(address) {
  let text = normalizeFullWidthDigitsToAscii(cleanOcrText(address || ""))
    .replace(/\s+/g, "")
    .replace(/臺/g, "台")
    .replace(/[，,、。．.]/g, "");
  if (!text) return "";
  text = stripVillageNeighborhoodPrefix(text);
  text = stripLeadingKnownAdminArea(text);
  text = text.replace(/([一二三四五六七八九十百千壹]+)(?=樓|層)/gu, (match) => {
    const n = parseFloorLevelToken(match);
    return n != null ? String(n) : match;
  });
  text = text.replace(/之([一二三四五六七八九十百千壹ㄧ]+)/gu, (_, token) => {
    const n = parseFloorLevelToken(token);
    return n != null ? `之${n}` : `之${token}`;
  });
  return text;
}
function subjectDoorplateMatchKeys() {
  return [
    els.subjectAddress?.value,
    els.recognizedPropertyAddress?.value,
    lastOcrMapping["建物門牌"],
    lastOcrMapping["查詢地址"],
    lastOcrMapping["地址"],
    lastOcrMapping.building_address
  ].map(normalizeDoorplateForMatch).filter(Boolean);
}
function resolveSubjectComparableAddress(query = currentQuery()) {
  return [
    query.subjectAddress,
    els.subjectAddress?.value,
    els.recognizedPropertyAddress?.value,
    lastOcrMapping["查詢地址"],
    lastOcrMapping["建物門牌"],
    lastOcrMapping["地址"],
    lastOcrMapping.building_address
  ].map((value) => String(value || "").trim()).find(Boolean) || "";
}
function formatAddressProximitySortNote(subjectAddress) {
  const formatter = window.FoundValuationSort?.formatAddressProximitySortNote;
  if (typeof formatter === "function") return formatter(subjectAddress);
  const road = deriveRoad(subjectAddress);
  return road ? `地址接近度以標的「${road}」比對。` : "地址接近度略過（未取得可比對的標的道路）。";
}
function sameDoorplateAsSubject(rowAddress, subjectKeys = subjectDoorplateMatchKeys()) {
  const rowKey = normalizeDoorplateForMatch(rowAddress);
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
  const floorMatch = normalized.match(new RegExp(`(.+?(?:號|弄|巷).+?(?:樓(?:之${RE_ADDR_SUFFIX_NUMBER})?))`));
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
/** 比較案例納入平均筆數上限 */
const COMPARABLE_AVG_TOP_N = 3;
/** 比較案例總面積低於此坪數者排除 */
const COMPARABLE_MIN_TOTAL_AREA_PING = 10;
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
function isDateWithinLastYear(tradeDate, queryDate = new Date()) {
  const trade = startOfLocalDay(tradeDate);
  const query = startOfLocalDay(queryDate);
  const lower = oneYearBefore(query);
  if (!trade || !query || !lower) return false;
  return trade >= lower && trade <= query;
}
function findShortTermPriorSale(rows, queryDate = new Date()) {
  const subjectKeys = subjectDoorplateMatchKeys();
  if (!subjectKeys.length) return null;
  return rows
    .map((row) => ({ row, tradeDate: parseDateFromText(row.tradeDate || row.tradeYearMonth || "") }))
    .filter(({ row, tradeDate }) =>
      sameDoorplateAsSubject(row.address, subjectKeys)
      && tradeDate
      && isDateWithinLastYear(tradeDate, queryDate)
      && Number.isFinite(row.unitPrice)
      && Number.isFinite(row.totalPrice)
    )
    .sort((a, b) => b.tradeDate.getTime() - a.tradeDate.getTime())[0] || null;
}
function resolveSubjectAgeFromDeedCompletion(completionDateText, appraisalBaseDate = new Date()) {
  const completion = parseDateFromText(completionDateText);
  if (!completion) return null;
  if (!(appraisalBaseDate instanceof Date) || Number.isNaN(appraisalBaseDate.getTime())) return null;
  const deltaMs = appraisalBaseDate.getTime() - completion.getTime();
  if (deltaMs < 0) return null;
  const ageYears = deltaMs / (365.2425 * 24 * 60 * 60 * 1000);
  if (!Number.isFinite(ageYears)) return null;
  return +ageYears.toFixed(3);
}
function resolveAppraisalBaseDate(query) {
  const periodEnd = composePeriod(query.periodEndYear, query.periodEndMonth);
  const m = String(periodEnd || "").match(/^(\d{2,3})(\d{2})$/);
  if (!m) return new Date();
  const y = Number(m[1]) + 1911;
  const mm = Number(m[2]);
  if (!Number.isFinite(y) || !Number.isFinite(mm) || mm < 1 || mm > 12) return new Date();
  return new Date(y, mm, 0);
}
function formatDateYmd(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
/** 由「樓別／樓高」取所在樓層（斜線前為所在層） */
function parseUnitFloorFromFloorInfo(floorInfo) {
  const raw = String(floorInfo || "").trim();
  if (!raw) return null;
  const firstSeg = raw.split(/[\/／]/)[0].replace(/\s+/g, "");
  if (!firstSeg || /地下|B1|b1/i.test(firstSeg)) return null;
  const m = firstSeg.match(/^([0-9一二三四五六七八九十百千壹]+)\s*(樓|層|F|f)/i);
  if (!m) return null;
  return parseFloorLevelToken(m[1]);
}
function ageDistanceForSort(rowAge, refAge) {
  if (refAge == null || !Number.isFinite(refAge)) return 0;
  const a = toNumber(rowAge);
  if (!Number.isFinite(a)) return 1e9;
  return Math.abs(a - refAge);
}
function floorDistanceForSort(floorInfo, refFloors) {
  if (refFloors == null || !Number.isFinite(refFloors) || refFloors <= 0) return 0;
  const fp = parseTotalFloorsFromFloorInfo(floorInfo);
  if (fp == null || !Number.isFinite(fp)) return 1e9;
  return Math.abs(fp - refFloors);
}
/** Comparable Score 排序；若 module bridge 尚未載入，保留舊規則作為短暫 fallback。 */
function sortComparablesForAverage(rows, contextOrRefAge, refFloors, preferredTypes = []) {
  const bridgedSort = window.FoundValuationSort?.sortComparablesForAverage;
  if (typeof bridgedSort === "function") {
    return bridgedSort(rows, contextOrRefAge, refFloors, preferredTypes);
  }
  const context = contextOrRefAge && typeof contextOrRefAge === "object"
    ? contextOrRefAge
    : { refAge: contextOrRefAge, refFloors, preferredTypes };
  const fallbackRefAge = context.refAge;
  const fallbackRefFloors = context.refFloors;
  const typePriority = Array.isArray(context.preferredTypes)
    ? context.preferredTypes.map((type) => String(type || "").trim()).filter(Boolean)
    : [];
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
/** 從樓別／樓高字串推定總樓層（常見「所在／總層」以斜線分隔） */
function parseTotalFloorsFromFloorInfo(text) {
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
  const plain = toNumber(s);
  return Number.isFinite(plain) ? plain : null;
}
function normalizeFullWidthDigitsToAscii(s) {
  return String(s || "").replace(/[０-９]/g, (ch) => String("０１２３４５６７８９".indexOf(ch)));
}
/** 解析門牌／樓別常見之樓層數字（阿拉伯或中文 1～99 為主） */
function parseFloorLevelToken(tok) {
  let t = normalizeFullWidthDigitsToAscii(String(tok || "").trim());
  t = t.replace(/ㄧ/g, "一");
  if (!t) return null;
  if (/^\d{1,3}$/.test(t)) {
    const n = Number(t);
    return Number.isFinite(n) && n >= 1 && n <= 199 ? n : null;
  }
  const d = { 〇: 0, 零: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10, 壹: 1 };
  if (t.length === 1) {
    const v = d[t];
    return v >= 1 ? v : null;
  }
  if (t === "十") return 10;
  const m11 = t.match(/^十([一二三四五六七八九])$/);
  if (m11) return 10 + d[m11[1]];
  const m12 = t.match(/^([一二三四五六七八九])十$/);
  if (m12) return d[m12[1]] * 10;
  const m13 = t.match(/^([一二三四五六七八九])十([一二三四五六七八九])$/);
  if (m13) return d[m13[1]] * 10 + d[m13[2]];
  const tens = "一二三四五六七八九";
  for (let i = 0; i < tens.length; i++) {
    const head = tens[i];
    if (t === `${head}十`) return (i + 1) * 10;
    if (t.length === 3 && t[0] === head && t[1] === "十") {
      const u = d[t[2]];
      if (u >= 1) return (i + 1) * 10 + u;
    }
  }
  return null;
}
/** 由地址字串取最後一組「○○樓」作為戶別樓層（建物門牌常用） */
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
  const fromInfo = parseUnitFloorFromFloorInfo(row.floorInfo || "");
  if (fromInfo === 1) return true;
  if (fromInfo != null) return false;
  return parseLastFloorFromAddress(row.address || "") === 1;
}
/** 標的所在樓層：優先進階「樓層別」純數字欄，否則由標的地址／門牌／建物門牌最後一組樓次推斷；無法判斷時為 null（不啟用一樓排除） */
function subjectPropertyUnitFloor() {
  const ff = els.floorFilter?.value?.trim() || "";
  if (ff) {
    const compact = ff.replace(/\s+/g, "");
    const m = compact.match(/^([0-9０-９一二三四五六七八九十百千壹]+)(樓|層|F|f)?$/i);
    if (m) {
      const n = parseFloorLevelToken(m[1]);
      if (n != null) return n;
    }
  }
  const mappedFloor = toNumber(lastOcrMapping["標的所在樓層"]);
  if (Number.isFinite(mappedFloor) && mappedFloor >= 1) return mappedFloor;
  const blob = [els.subjectAddress?.value, els.communityName?.value, els.recognizedPropertyAddress?.value].filter(Boolean).join("");
  return parseLastFloorFromAddress(blob);
}
function rowMatchesDealTargets(row, dealTargets) {
  if (!dealTargets.length) return true;
  const targetText = String(row.target || "");
  const parkingPrice = toNumber(row.parkingPrice);
  const hasParking = targetText.includes("車位") || (parkingPrice != null && parkingPrice > 0);
  return dealTargets.some((target) => {
    if (target === "房地") return targetText.includes("房地") && !hasParking;
    if (target === "房地(車)") return hasParking;
    if (target === "單位") return targetText.includes("單位");
    return targetText.includes(target);
  });
}
function rowMatchesKeywordGroup(row, query) {
  const addressText = normalizeText(row.address);
  const cityText = normalizeText(query.cityName);
  const districtText = normalizeText(query.districtName);
  const communityText = normalizeText(query.communityName);
  const subjectText = normalizeText(query.subjectAddress);
  const roadText = normalizeText(query.roadKeyword);
  const rowCityText = normalizeText(row.city || "");
  const rowDistrictText = normalizeText(row.district || "");

  // Official pasted results often omit the city prefix and start from district/road.
  // Only enforce city matching when the row itself carries a city token.
  if (cityText && rowCityText && !rowCityText.includes(cityText) && !addressText.includes(cityText)) return false;
  if (districtText && !rowDistrictText.includes(districtText) && !addressText.includes(districtText)) return false;
  if (communityText) {
    const communitySource = normalizeText(row.community || row.address);
    if (!communitySource.includes(communityText) && !addressText.includes(communityText)) return false;
  }
  if (subjectText && !addressText.includes(subjectText)) return false;
  if (roadText) {
    const roadSource = isCommunityKeyword(query.roadKeyword)
      ? normalizeText(row.community || row.address)
      : normalizeText(row.road || row.address || row.community);
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
      ignoreQueryFilters ? "正在用目前案例重新估價，請稍候..." : "官方資料查詢中，請稍候..."
    );
    setQueryProgressStage(ignoreQueryFilters ? "正在用目前案例重新估價" : "正在整理比較案例與估價計算");
  } else {
    setQueryProgressStage("步驟 4/4：正在整理比較案例與估價計算");
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
    const rowsForDisplay = ignoreQueryFilters ? displayRows : rows;
    const removed = new Set(rowsForDisplay);
    renderRows(rowsForDisplay, new Set(), removed);
    els.avgUnitPrice.textContent = "--";
    els.trimmedRange.textContent = "--";
    els.houseValue.textContent = "--";
    clearAutoParkingUnitPrice("尚未取得可用比較案例，未計算單一車位總價");
    els.recordCountDisplayCard.textContent = `${rowsForDisplay.length} 筆案例（0 筆納入平均）`;
    els.calcExplain.textContent = totalAreaMinDropped > 0
      ? `官方／目前案例共 ${displayRows.length} 筆；已剔除 ${totalAreaMinDropped} 筆總面積小於 ${COMPARABLE_MIN_TOTAL_AREA_PING} 坪的案例，尚未取得任何可用的比較案例。`
      : "尚未取得任何可用的比較案例。";
    setMessage("error", totalAreaMinDropped > 0 ? "比較案例總面積皆小於門檻，暫無法估價。" : "請先貼上比較案例資料，再進行估價。");
    lastSearch = { rows: rowsForDisplay, kept: [], removed: rowsForDisplay.map((row) => row.address), avg: null, estimate: null };
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
  const excludeFirstFloorComps =
    !isTownhouseQuery(query) && !includeFirstFloorComps;
  let firstFloorDropped = 0;
  if (excludeFirstFloorComps) {
    rows = rows.filter((row) => {
      const drop = comparableRowIsFirstFloor(row);
      if (drop) firstFloorDropped++;
      return !drop;
    });
  }
  const appraisalBaseDate = resolveAppraisalBaseDate(query);
  const completionDateText = String(lastOcrMapping["建築完成日期"] || "").trim();
  const refAge = resolveSubjectAgeFromDeedCompletion(completionDateText, appraisalBaseDate);
  const refFloors = toNumber(els.totalFloors.value);
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
  rows = sortComparablesForAverage(rows, comparableScoreContext);
  const shortTermPriorSale = findShortTermPriorSale(rows, new Date());
  updateAreaSummary(displayRows.length);
  area = areaInfo();
  if (!rows.length) {
    const rowsForDisplay = ignoreQueryFilters ? displayRows : rows;
    const removed = new Set(rowsForDisplay);
    renderRows(rowsForDisplay, new Set(), removed);
    els.avgUnitPrice.textContent = "--";
    els.trimmedRange.textContent = "--";
    els.houseValue.textContent = "--";
    clearAutoParkingUnitPrice("篩選後無可用比較案例，未計算單一車位總價");
    els.recordCountDisplayCard.textContent = `${rowsForDisplay.length} 筆案例（0 筆納入平均）`;
    const emptyDetail =
      excludeFirstFloorComps && firstFloorDropped > 0
        ? "篩選後無可用比較案例（標的未判定為一樓，已排除一樓案例；若標的是一樓，請確認門牌樓次或進階「樓層別」是否正確）。"
        : "篩選後無可用比較案例。";
    els.calcExplain.textContent = totalAreaMinDropped > 0
      ? `官方／目前案例共 ${displayRows.length} 筆；估價規則後 0 筆可納入平均。\n${emptyDetail}\n已剔除 ${totalAreaMinDropped} 筆總面積小於 ${COMPARABLE_MIN_TOTAL_AREA_PING} 坪的案例。`
      : `官方／目前案例共 ${displayRows.length} 筆；估價規則後 0 筆可納入平均。\n${emptyDetail}`;
    setMessage("warn", ignoreQueryFilters ? "目前無符合條件的比較案例。" : "篩選後無符合條件的比較案例。");
    lastSearch = { rows: rowsForDisplay, kept: [], removed: rowsForDisplay.map((row) => row.address), avg: null, estimate: null };
    finishValuationSearch(query, keepProgress);
    return;
  }
  if (shortTermPriorSale) {
    const matchedRow = shortTermPriorSale.row;
    matchedRow.shortTermPriorSale = true;
    const rowsForDisplay = ignoreQueryFilters ? displayRows : rows;
    const kept = new Set([matchedRow]);
    const removed = new Set(rowsForDisplay.filter((row) => row !== matchedRow));
    renderRows(rowsForDisplay, kept, removed);
    els.avgUnitPrice.textContent = formatNum(matchedRow.unitPrice);
    els.avgUnitPriceSub.textContent = "萬元 / 坪（前手）";
    els.trimmedRange.textContent = formatNum(matchedRow.unitPrice);
    els.trimmedRangeSub.textContent = "一年內前手價";
    els.houseValue.textContent = formatNum(matchedRow.totalPrice, 0);
    els.houseValueSub.textContent = "萬元（前手總價）";
    els.recordCountDisplayCard.textContent = `${rowsForDisplay.length} 筆案例（1 筆前手價認列）`;
    const queryDate = startOfLocalDay(new Date());
    const tradeDateLabel = matchedRow.tradeDate || matchedRow.tradeYearMonth || formatDateYmd(shortTermPriorSale.tradeDate);
    const officialCountNote = displayRows.length === rows.length
      ? `官方／目前案例共 ${displayRows.length} 筆。`
      : `官方／目前案例共 ${displayRows.length} 筆；估價規則後 ${rows.length} 筆。`;
    els.calcExplain.textContent = [
      officialSearchNote,
      `${officialCountNote}一年內短期交易認列前手價。`,
      `同門牌案例：${matchedRow.address}，交易日期 ${tradeDateLabel}，查詢日 ${formatDateYmd(queryDate)}，交易日落在一年內。`,
      `依規則不再計算前三筆平均單價，直接採該前手單價 ${formatNum(matchedRow.unitPrice)} 萬元/坪、總價 ${formatNum(matchedRow.totalPrice, 0)} 萬元作為估價結果。`
    ].filter(Boolean).join("\n");
    const completionPrefix = officialSearchNote ? `${officialSearchNote}。` : "";
    setMessage("ok", `${completionPrefix}一年內短期交易認列前手價：採同門牌 ${tradeDateLabel} 單價 ${formatNum(matchedRow.unitPrice)} 萬元/坪、總價 ${formatNum(matchedRow.totalPrice, 0)} 萬元。`);
    lastSearch = {
      rows: rowsForDisplay,
      kept: [matchedRow.address],
      removed: rowsForDisplay.filter((row) => row !== matchedRow).map((row) => row.address),
      avg: +matchedRow.unitPrice.toFixed(3),
      estimate: +matchedRow.totalPrice.toFixed(3),
      method: "一年內短期交易認列前手價"
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
    clearAutoParkingUnitPrice("納入平均案例沒有單價，未計算單一車位總價");
    els.recordCountDisplayCard.textContent = `${rowsForDisplay.length} 筆案例（0 筆納入平均）`;
    els.calcExplain.textContent = `官方／目前案例共 ${displayRows.length} 筆；估價規則後 ${rows.length} 筆，但單價欄位皆為空白，故無法計算平均與估值。`;
    setMessage("warn", "已取得案例，但單價皆空白，暫無法計算估值。");
    lastSearch = { rows: rowsForDisplay, kept: [], removed: rowsForDisplay.map((row) => row.address), avg: null, estimate: null };
    finishValuationSearch(query, keepProgress);
    return;
  }
  const prices = trimmed.map((row) => row.unitPrice);
  const avg = prices.reduce((sum, value) => sum + value, 0) / prices.length;
  const townhouseValuation = isTownhouseQuery(query);
  const parkingInfo = syncParkingCountFromArea(area.parking);
  const parkingPriceMultiplier = parkingValuationMultiplier(parkingInfo);
  const shouldPriceParking = parkingPriceMultiplier > 0;
  const parkingUnitPriceEntries = shouldPriceParking
    ? trimmed
        .map((row) => ({
          row,
          totalPrice: toNumber(row.parkingPrice),
          count: comparableParkingCount(row),
          unitPrice: comparableParkingUnitPrice(row)
        }))
        .filter((entry) => entry.unitPrice != null && entry.unitPrice > 0)
    : [];
  const parkingUnitPrices = parkingUnitPriceEntries.map((entry) => entry.unitPrice);
  const manualParkingPrice = shouldPriceParking ? manualParkingUnitPriceValue() : null;
  const avgSingleParkingPrice = parkingUnitPrices.length
    ? parkingUnitPrices.reduce((sum, value) => sum + value, 0) / parkingUnitPrices.length
    : (manualParkingPrice ?? 0);
  const avgParkingPrice = avgSingleParkingPrice * parkingPriceMultiplier;
  if (townhouseValuation) {
    clearAutoParkingUnitPrice("透天估值不另加車位總價");
  } else if (!shouldPriceParking) {
    clearAutoParkingUnitPrice("標的未辨識車位坪數或車位數量，未計算單一車位總價");
  } else if (parkingUnitPrices.length) {
    const sourceText = parkingUnitPriceEntries.map((entry) => {
      const total = entry.totalPrice != null ? formatNum(entry.totalPrice, 0) : "";
      return entry.count > 1 ? `${total}÷${entry.count}` : total;
    }).filter(Boolean).join("、");
    setAutoParkingUnitPrice(
      avgSingleParkingPrice,
      `納入平均案例單一車位總價：${sourceText}，平均 ${formatNum(avgSingleParkingPrice, 3)} 萬元`
    );
  } else if (manualParkingPrice != null) {
    els.parkingUnitPrice.title = `使用目前欄位的每個單位總價 ${formatNum(manualParkingPrice, 3)} 萬元`;
  } else {
    clearAutoParkingUnitPrice("納入平均案例未提供車位總價，未加計車位總價");
  }
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const hasTownhouseLandShare = area.landShare > 0;
  if (townhouseValuation && !hasTownhouseLandShare) {
    renderRows(rowsForDisplay, kept, removed);
    els.avgUnitPrice.textContent = formatNum(avg);
    els.avgUnitPriceSub.textContent = "萬元 / 坪";
    els.trimmedRange.textContent = `${formatNum(min)} ~ ${formatNum(max)}`;
    els.trimmedRangeSub.textContent = "萬元 / 坪";
    els.houseValue.textContent = "--";
    els.houseValueSub.textContent = "萬元";
    els.recordCountDisplayCard.textContent = `${rowsForDisplay.length} 筆案例（${trimmed.length} 筆納入平均）`;
    els.calcExplain.textContent = [
      officialSearchNote,
      `透天估值需以「標的土地持分坪合計 × 平均單價」計算，但目前標的土地持分坪合計未填或為 0。`,
      `平均單價 = ${prices.map((value) => formatNum(value)).join(" + ")} ÷ ${prices.length} = ${formatNum(avg)} 萬元/坪。`,
      "請先由謄本解析或手動填入標的土地持分坪合計後再估價。"
    ].filter(Boolean).join("\n");
    setMessage("warn", "透天估值需先取得標的土地持分坪合計。");
    lastSearch = { rows: rowsForDisplay, kept: trimmed.map((row) => row.address), removed: rowsForDisplay.filter((row) => !trimmed.includes(row)).map((row) => row.address), avg: +avg.toFixed(3), estimate: null, method: "透天土地持分估值缺少土地持分坪" };
    finishValuationSearch(query, keepProgress);
    return;
  }
  const valuationBasePing = townhouseValuation ? area.landShare : area.house;
  const estimate = estimateHouseValueWithParking({
    valuationBasePing,
    averageUnitPrice: avg,
    parkingUnitPrice: avgSingleParkingPrice,
    parkingMultiplier: parkingPriceMultiplier,
    isTownhouse: townhouseValuation
  });
  els.avgUnitPrice.textContent = formatNum(avg);
  els.avgUnitPriceSub.textContent = "萬元 / 坪";
  els.trimmedRange.textContent = `${formatNum(min)} ~ ${formatNum(max)}`;
  els.trimmedRangeSub.textContent = "萬元 / 坪";
  els.houseValue.textContent = formatNum(estimate, 0);
  els.houseValueSub.textContent = townhouseValuation ? "萬元（土地持分）" : "萬元";
  els.recordCountDisplayCard.textContent = `${rowsForDisplay.length} 筆案例（${trimmed.length} 筆納入平均）`;
  renderRows(rowsForDisplay, kept, removed);
  const preferredTypeText = preferredTypes.length ? preferredTypes.join("、") : "";
  const sortRule =
    `排序規則：每筆案例先計算 Comparable Score（地址25〔同路同巷同弄25、同路同巷22、同路18；同行政區不計分〕、屋齡17、總樓層15、總面積15〔標的總坪數與案例總面積差距比例〕、交易日期10、樓別8〔透天案件略過〕、主要用途5〔不取代用途篩選〕、單價5；建物型態不納入排序分數${preferredTypeText ? `，目前建物型態仍只作前段篩選：${preferredTypeText}` : ""}），再依分數由高到低排序；同分時依地址分、屋齡分、總樓層分、總面積分、交易日期分、樓別分、主要用途分、單價分與原始順序決定。只有標的所在樓層明確為一樓時，才將一樓案例列入排序；標的非一樓或無法判定為一樓時，排序前先排除一樓比較案例。`;
  const addressRuleNote = formatAddressProximitySortNote(subjectComparableAddress);
  const ageRuleNote = refAge == null
    ? "（未取得謄本建築完成日期，屋齡接近度排序略過。）"
    : `（建築完成日期 ${completionDateText}，估價基準日 ${formatDateYmd(appraisalBaseDate)}，換算標的屋齡約 ${formatNum(refAge, 3)} 年。）`;
  const subjectFloorText = Number.isFinite(subjectFloor) ? `標的推斷為第 ${subjectFloor} 樓` : "標的未判定為一樓";
  const floorRuleNote = excludeFirstFloorComps
    ? firstFloorDropped > 0
      ? `（${subjectFloorText}，已排除 ${firstFloorDropped} 筆一樓。）`
      : `（${subjectFloorText}，比較案例中無一樓可排除。）`
    : "（標的推斷為一樓，一樓案例列入排序。）";
  const totalAreaMinRuleNote = totalAreaMinDropped > 0
    ? `（已剔除 ${totalAreaMinDropped} 筆總面積小於 ${COMPARABLE_MIN_TOTAL_AREA_PING} 坪的案例。）`
    : `（無總面積小於 ${COMPARABLE_MIN_TOTAL_AREA_PING} 坪的案例需剔除。）`;
  const displayCountNote = displayRows.length === rows.length
    ? `官方／目前案例共 ${displayRows.length} 筆。`
    : `官方／目前案例共 ${displayRows.length} 筆；估價規則後 ${rows.length} 筆可進入排序。結果表仍完整顯示官方清單，未納入平均者會標示「未納入平均」。`;
  const valuationFormulaText = townhouseValuation
    ? `透天估值公式 = 標的土地持分坪合計 ${formatNum(area.landShare, 3)} × 平均單價 ${formatNum(avg)} = ${formatNum(estimate, 0)} 萬元。`
    : `估值公式 = 房屋坪數 ${formatNum(area.house, 3)} × 平均單價 ${formatNum(avg)} + 平均車位總價 ${formatNum(avgParkingPrice, 0)} = ${formatNum(estimate, 0)} 萬元。總坪數 = 房屋坪數 ${formatNum(area.house, 3)} + 車位坪數 ${formatNum(area.parking, 3)} = ${formatNum(area.total, 3)} 坪。`;
  els.calcExplain.textContent = [
    officialSearchNote,
    ignoreQueryFilters ? `${displayCountNote}${sortRule}` : `篩選後共 ${rows.length} 筆。${sortRule}`,
    addressRuleNote,
    totalAreaMinRuleNote,
    ageRuleNote,
    floorRuleNote,
    `依排序結果取前 ${takeN} 筆計算平均單價（至多 ${COMPARABLE_AVG_TOP_N} 筆；不足則以實際筆數計算）。`,
    `平均單價 = ${prices.map((value) => formatNum(value)).join(" + ")} ÷ ${prices.length} = ${formatNum(avg)} 萬元/坪。`,
    townhouseValuation
      ? "透天案件不另加平均車位總價；房屋價值直接採標的土地持分坪合計乘以平均單價。"
      : parkingUnitPrices.length
        ? `平均單一車位總價 = ${parkingUnitPriceEntries.map((entry) => {
            const total = entry.totalPrice != null ? formatNum(entry.totalPrice, 0) : "";
            return entry.count > 1 ? `${total}÷${entry.count}` : total;
          }).filter(Boolean).join(" + ")} ÷ ${parkingUnitPrices.length} = ${formatNum(avgSingleParkingPrice, 0)} 萬元。`
        : manualParkingPrice != null
          ? `平均單一車位總價 = ${formatNum(manualParkingPrice, 0)} 萬元（採每個單位總價欄位）。`
          : "平均單一車位總價 = 0 萬元（納入平均案例未提供車位總價）。",
    townhouseValuation
      ? ""
      : parkingInfo.source === "ocr"
        ? `車位坪數 ${formatNum(area.parking, 3)} 坪，車位數量採 OCR 停車位編號／權利範圍 ${parkingInfo.count} 個；估值加計倍數 ${formatNum(parkingPriceMultiplier, 3)}。平均車位總價 = ${formatNum(avgSingleParkingPrice, 0)} × ${formatNum(parkingPriceMultiplier, 3)} = ${formatNum(avgParkingPrice, 0)} 萬元。`
        : `車位坪數 ${formatNum(area.parking, 3)} 坪，自動計算車位數量 ${parkingInfo.count} 個；估值加計倍數 ${formatNum(parkingPriceMultiplier, 3)}（有單位數量時直接以單位數量加計）。平均車位總價 = ${formatNum(avgSingleParkingPrice, 0)} × ${formatNum(parkingPriceMultiplier, 3)} = ${formatNum(avgParkingPrice, 0)} 萬元。`,
    valuationFormulaText
  ].filter(Boolean).join("\n");
  const completionLabel = officialSearchNote ? "完成官方資料估價" : (ignoreQueryFilters ? "已用目前案例重新估價" : "完成估價");
  const completionPrefix = officialSearchNote ? `${officialSearchNote}。` : "";
  const completionFormula = townhouseValuation
    ? `標的土地持分坪合計 ${formatNum(area.landShare, 3)} × 平均單價 ${formatNum(avg)}`
    : `前 ${takeN} 筆平均單價 ${formatNum(avg)} 萬元/坪`;
  setMessage("ok", `${completionPrefix}${completionLabel}：${completionFormula}，估算房屋價值 ${formatNum(estimate, 0)} 萬元。`);
  lastSearch = {
    rows: rowsForDisplay,
    kept: trimmed.map((row) => row.address),
    removed: rowsForDisplay.filter((row) => !trimmed.includes(row)).map((row) => row.address),
    avg: +avg.toFixed(3),
    estimate: +estimate.toFixed(3),
    method: townhouseValuation ? "透天土地持分估值" : "一般房屋坪數估值"
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
  ["queryTitle","cityName","districtName","communityName","periodStartYear","periodStartMonth","periodEndYear","periodEndMonth","subjectAddress","roadKeyword","totalFloors","tradeTarget","floorFilter","layoutFilter","totalPriceMin","totalPriceMax","unitPriceMin","unitPriceMax","mainAreaMinFilter","mainAreaMaxFilter","houseAgeMin","houseAgeMax","mainArea","attachArea","commonArea","otherArea","landShareRaw","landShareArea","totalAreaOverride","totalWithParkingArea","parkingArea","parkingCount","parkingUnitPrice"].forEach((id) => { if (els[id]) els[id].value = ""; });
  clearOcrParkingCount();
  clearRecognizedAddressFields();
  populateDistrictOptions("");
  setCheckboxValues(els.mainPurposePick, []);
  setCheckboxValues(els.usageZonePick, []);
  els.houseType.value = "";
  els.priceUnit.value = "萬元/坪";
  els.areaUnit.value = "坪";
  els.isTownhouse.checked = false;
  els.typeQuickPick.forEach((checkbox) => { checkbox.checked = false; });
  els.dealTargetPick.forEach((checkbox) => { checkbox.checked = checkbox.value === "房地" || checkbox.value === "房地(車)"; });
  document.querySelector('input[name="specialMode"][value="exclude"]').checked = true;
  resetSpecialRemarkPicker();
  els.sourceFile.value = "";
  els.recordsInput.value = defaultRecords;
  resetSourcePreview();
  els.ocrLog.textContent = "上傳圖片或 PDF 後，可自動嘗試抓取主建物、附屬建物、共有部分、地址、主要用途與樓層。";
  setOcrProgress(0, "OCR 尚未開始");
  refreshPaddleOcrStatusMessage();
  setRadioValue(els.priceUnitChoice, "萬元/坪");
  setRadioValue(els.areaUnitChoice, "坪");
  syncUnitControls();
  applyHouseAgePreset("any");
  els.avgUnitPrice.textContent = "--";
  els.avgUnitPriceSub.textContent = "萬元 / 坪";
  els.trimmedRange.textContent = "--";
  els.trimmedRangeSub.textContent = "萬元 / 坪";
  els.houseValue.textContent = "--";
  els.houseValueSub.textContent = "萬元";
  underwritingZoneLookupSeq += 1;
  setUnderwritingZoneCard();
  els.resultBody.innerHTML = '<tr><td colspan="18" style="color:#667085;">尚未查詢</td></tr>';
  resetResultTableSortState();
  els.calcExplain.textContent = "系統會在這裡顯示篩選筆數、納入平均之單價與估值公式。";
  lastSearch = { rows: [], kept: [], removed: [], avg: null, estimate: null };
  lastOcrMapping = {};
  clearOcrFieldDiagnostics();
  if (els.deedFieldsPanel) {
    els.deedFieldsPanel.dataset.manual = "closed";
  }
  syncDeedFieldsVisibility(false);
  updateAreaSummary(parseRecords(els.recordsInput.value).length);
  applyRollingPeriodToUi(1);
  setMessage("", "");
  setQueryProgress(false);
}
els.totalFloors.addEventListener("input", () => { if (!els.isTownhouse.checked) syncType(); updateStructuredData(); });
els.houseType.addEventListener("change", () => { applyType(els.houseType.value); updateStructuredData(); });
els.isTownhouse.addEventListener("change", () => { syncType(); updateStructuredData(); });
els.typeQuickPick.forEach((checkbox) => {
  checkbox.addEventListener("change", () => {
    applyType(checkbox.checked ? checkbox.value : "");
    updateStructuredData();
  });
});
[
  els.queryTitle, els.cityName, els.districtName, els.communityName, els.periodStartYear, els.periodStartMonth, els.periodEndYear, els.periodEndMonth, els.priceUnit, els.areaUnit,
  els.subjectAddress, els.roadKeyword, els.tradeTarget, els.floorFilter, els.layoutFilter,
  els.totalPriceMin, els.totalPriceMax, els.unitPriceMin, els.unitPriceMax, els.mainAreaMinFilter, els.mainAreaMaxFilter,
  els.houseAgeMin, els.houseAgeMax, els.mainArea, els.attachArea, els.commonArea, els.otherArea, els.landShareRaw, els.landShareArea, els.totalAreaOverride,
  els.parkingArea, els.parkingCount, els.parkingUnitPrice
].forEach((input) => { input.addEventListener("input", () => updateAreaSummary()); input.addEventListener("change", () => updateAreaSummary()); });
[
  els.mainArea, els.attachArea, els.commonArea, els.otherArea, els.landShareRaw, els.landShareArea, els.totalAreaOverride,
  els.parkingArea, els.parkingCount, els.parkingUnitPrice
].forEach((input) => {
  input?.addEventListener("input", () => syncDeedFieldsVisibility());
  input?.addEventListener("change", () => syncDeedFieldsVisibility());
});
document.querySelectorAll('input[name="specialMode"]').forEach((radio) => radio.addEventListener("change", updateStructuredData));
specialRemarkEls.toggle?.addEventListener("click", () => {
  setSpecialRemarkPanelOpen(specialRemarkEls.panel?.classList.contains("is-hidden"));
});
specialRemarkEls.all?.addEventListener("change", () => {
  specialRemarkEls.options.forEach((input) => { input.checked = specialRemarkEls.all.checked; });
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
  mainPurposeEls.options.forEach((input) => { input.checked = mainPurposeEls.all.checked; });
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
els.priceUnitChoice.forEach((radio) => radio.addEventListener("change", () => { syncUnitControls(); updateStructuredData(); }));
els.areaUnitChoice.forEach((radio) => radio.addEventListener("change", () => { syncUnitControls(); updateStructuredData(); }));
els.houseAgePreset?.addEventListener("change", () => { applyHouseAgePreset(els.houseAgePreset.value); updateStructuredData(); });
els.houseAgeMin?.addEventListener("input", () => { syncHouseAgePresetFromFields(); updateStructuredData(); });
els.houseAgeMax?.addEventListener("input", () => { syncHouseAgePresetFromFields(); updateStructuredData(); });
els.cityName.addEventListener("change", async () => { await loadOfficialTowns(els.cityName.value); updateStructuredData(); });
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
    els.ocrBtn.textContent = "開始 OCR / PDF 解析";
    els.ocrLog.textContent = "上傳圖片或 PDF 後，可自動嘗試抓取主建物、附屬建物、共有部分、地址、主要用途與樓層。";
    refreshPaddleOcrStatusMessage();
    if (els.deedFieldsPanel) els.deedFieldsPanel.dataset.manual = "closed";
    syncDeedFieldsVisibility(false);
    return;
  }
  els.ocrBtn.disabled = false;
  els.ocrBtn.textContent = isPdfFile(file) ? "開始 PDF 解析" : "開始圖片 OCR";
  const presetApplied = applyKnownFilePreset(file.name, false);
  const uploadSummary = files.length > 1
    ? `本次共選擇 ${files.length} 個檔案；實價查詢主檔：${file.name}。`
    : "";
  const landTaxSummary = landTaxFiles.length
    ? `偵測到土地謄本：${sourceFileNames(landTaxFiles).join("、")}；實價查詢完成後會同步帶入土地增值稅試算。`
    : "";
  els.ocrLog.textContent = [
    uploadSummary,
    isPdfFile(file)
    ? `PDF 已載入：${file.name}，正在自動解析並帶入坪數欄位。`
    : `圖片已載入：${file.name}，正在自動 OCR 並帶入坪數欄位。`,
    landTaxSummary
  ].filter(Boolean).join("\n");
  setOcrProgress(0, "OCR 尚未開始");
  syncDeedFieldsVisibility();
  updateStructuredData();
  if (!isPdfFile(file) && presetApplied) {
    const preset = getKnownFilePreset(file.name);
    renderOcrFieldDiagnostics(
      buildKnownPresetOcrFieldResults(file.name, preset),
      { ocrTiming: { elapsedMs: 0, source: "knownFilePreset", note: "檔名保底欄位" } }
    );
    const fallbackAddress = preset?.queryAddress || preset?.address || els.subjectAddress.value.trim();
    const ready = await syncManualQueryFromParsedDeed(null, "", fallbackAddress);
    els.ocrLog.textContent = [
      preset?.log || `已依檔名套用 ${file.name} 的保底欄位。`,
      ready ? `已先帶入手動查詢：${selectedLabel(els.cityName)} ${selectedLabel(els.districtName)} ${els.roadKeyword.value.trim()}。` : "",
      "正在自動執行圖片 OCR 重新確認。"
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
els.sampleBtn?.addEventListener("click", () => { els.recordsInput.value = defaultRecords; updateAreaSummary(parseRecords(els.recordsInput.value).length); setMessage("ok", "已套用比較案例範例。"); });
els.resetBtn.addEventListener("click", resetAll);
els.copyPropertyAddressBtn?.addEventListener("click", async () => { await copyFieldValue(els.recognizedPropertyAddress, "已複製建物門牌。", "目前沒有可複製的建物門牌。"); });
els.toggleManualAdvancedBtn.addEventListener("click", () => {
  const hidden = els.manualAdvanced.classList.toggle("is-hidden");
  els.toggleManualAdvancedBtn.textContent = hidden ? "展開進階條件" : "收合進階條件";
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
els.recordsInput.value = defaultRecords;
updateAreaSummary(parseRecords(els.recordsInput.value).length);
setRecordsPanelCollapsed(false);
syncDeedFieldsVisibility();
updateResultSortButtons();
setOcrProgress(0, "OCR 尚未開始");
loadOfficialCities();
refreshPaddleOcrStatusMessage();
const params = new URLSearchParams(window.location.search);
if (params.get("autorun") === "1") setTimeout(runOfficialSearchWithUi, 50);
