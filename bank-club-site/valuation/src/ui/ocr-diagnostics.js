import { els } from "../dom.js";
import { isBackendOcrHealthReady } from "../constants.js";

let currentOcrFieldResults = {};
let currentOcrDiagnosticsMeta = {};

export const OCR_FIELD_LABELS = {
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

export const OCR_SOURCE_LABELS = {
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

export function getLastOcrFieldResults() {
  return currentOcrFieldResults;
}

function exposeDebugValue(name, value) {
  try {
    if (typeof window === "undefined") return;
    const descriptor = Object.getOwnPropertyDescriptor(window, name);
    if (descriptor && (descriptor.get || descriptor.set)) return;
    window[name] = value;
  } catch (_) {}
}

export function setLastOcrFieldResults(value) {
  currentOcrFieldResults = value || {};
  exposeDebugValue("lastOcrFieldResults", currentOcrFieldResults);
  return currentOcrFieldResults;
}

export function getLastOcrDiagnosticsMeta() {
  return currentOcrDiagnosticsMeta;
}

export function setLastOcrDiagnosticsMeta(value) {
  currentOcrDiagnosticsMeta = value && typeof value === "object" ? value : {};
  exposeDebugValue("lastOcrDiagnosticsMeta", currentOcrDiagnosticsMeta);
  return currentOcrDiagnosticsMeta;
}

export function foundOcrRoot() {
  return window.FoundOcr || null;
}

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[char]);
}

export function ocrFieldStatusText(result) {
  const root = foundOcrRoot();
  const status = root?.fieldStatus ? root.fieldStatus(result) : (result?.needsReview ? "review" : "unknown");
  if (status === "auto") return { text: "自動採用", className: "ocr-auto" };
  if (status === "warn") return { text: "採用，請檢查", className: "ocr-review" };
  if (status === "review") return { text: "需人工複核", className: "ocr-review" };
  if (status === "manual") return { text: "手動輸入", className: "ocr-muted" };
  return { text: "未採用", className: "ocr-muted" };
}

export function shouldAutofillOcrField(result) {
  const root = foundOcrRoot();
  try {
    if (root?.shouldAutoFillField) return root.shouldAutoFillField(result);
  } catch (_) {}
  return Number(result?.confidence) >= 0.75;
}

export function ocrFieldValue(result) {
  if (!result) return "";
  return result.value == null ? "" : String(result.value).trim();
}

const AREA_VALUE_FIELDS = new Set([
  "mainArea",
  "attachArea",
  "commonArea",
  "landShare",
  "parkingArea"
]);

function isAreaValueField(fieldName) {
  return AREA_VALUE_FIELDS.has(fieldName);
}

function stripPingFromAreaRaw(value) {
  return String(value ?? "")
    .replace(/\s*[／/]\s*[\d,.]+\s*坪/g, "")
    .replace(/\s*\/\s*[\d,.]+\s*坪/g, "")
    .replace(/\s*=\s*[\d,.]+\s*坪/g, "")
    .replace(/（計算[:：]\s*([^）]*?)\s*）/g, (match, formula) => {
      const cleaned = stripPingFromAreaRaw(formula).trim();
      return cleaned ? `（計算：${cleaned}）` : "";
    })
    .trim();
}

function normalizeRawAreaUnit(unit = "") {
  const text = String(unit || "").trim();
  if (/平方公$/i.test(text)) return "平方公尺";
  if (/平方公尺|平方?米|㎡|m2|m²/i.test(text)) return "平方公尺";
  return text;
}

function formatRawAreaSnippet(label, value, unit) {
  const cleanLabel = String(label || "").replace(/面積$/, "").trim();
  const cleanValue = String(value || "").trim();
  const cleanUnit = normalizeRawAreaUnit(unit || "");
  return [cleanLabel, `${cleanValue}${cleanUnit}`].filter(Boolean).join(" ").trim();
}

function normalizeAreaRawSource(rawText) {
  return String(rawText || "")
    .normalize("NFKC")
    .replace(/[０-９]/g, (ch) => String("０１２３４５６７８９".indexOf(ch)))
    .replace(/[：:]/g, ":")
    .replace(/佳圆/g, "佳園")
    .replace(/高牌號|高牌号/g, "門牌號")
    .replace(/建第完成日期|建第完成曰期/g, "建築完成日期")
    .replace(/建物眉數/g, "建物層數")
    .replace(/利幢/g, "權利範圍")
    .replace(/建号/g, "建號")
    .replace(/编號/g, "編號")
    .replace(/合停車位/g, "含停車位")
    .replace(/树林/g, "樹林")
    .replace(/楼/g, "樓")
    .replace(/陽臺|阳台/g, "陽台")
    .replace(/花臺|花合|花喜/g, "花台")
    .replace(/兩遮|两遮|函遮|雨造/g, "雨遮")
    .replace(/權利:/g, "權利範圍:")
    .replace(/[*＊\s]+/g, "");
}

function normalizeAttachedRawLabel(label) {
  const text = String(label || "").replace("臺", "台");
  if (/陽[台臺]/.test(text)) return "陽台";
  if (/花[台臺合喜]/.test(text)) return "花台";
  if (/雨遮|函遮|兩遮|雨造/.test(text)) return "雨遮";
  return text;
}

function attachedItemizedRawFromText(rawText) {
  const source = normalizeAreaRawSource(rawText);
  if (!source) return "";
  const attachedUsage = "(陽台|平台|雨遮|騎樓|露台|花台|門廊|走廊|樓梯間|屋簷|屋檐|屋頂突出物)";
  const attachStart = source.search(/附屬建物用途|附屬建物/);
  if (attachStart < 0) return "";
  const tail = source.slice(attachStart).split(/建物所有權部|建物他項權利部|土地標示部|土地他項權利部|權狀注記事|權狀註記事/)[0];
  const labels = [...tail.matchAll(new RegExp(attachedUsage, "g"))]
    .map((match) => normalizeAttachedRawLabel(match[1]))
    .filter((label, index, list) => label && list.indexOf(label) === index);
  if (!labels.length) return "";

  let areaZone = tail;
  const explicitAreaLabels = [...tail.matchAll(/(?<!層次)(?<!總)面積[:*＊]*/g)];
  if (explicitAreaLabels.length) {
    const explicitLabel = explicitAreaLabels.at(-1);
    if (labels.length < 2 && /共有部[分份]|公有部分|權利範圍|建號/.test(tail.slice(0, explicitLabel.index || 0))) {
      return "";
    }
    areaZone = tail.slice((explicitLabel.index || 0) + explicitLabel[0].length);
  } else {
    const stop = areaZone.search(/共有部[分份]|公有部分|其他登記事項/);
    if (stop >= 0) areaZone = areaZone.slice(0, stop);
  }
  const stop = areaZone.search(/其他登記事項|建物所有權部|建物他項權利部|土地標示部|土地他項權利部/);
  if (stop >= 0) areaZone = areaZone.slice(0, stop);

  const areaUnit = "(平方公尺|平方公|平方?米|m2|m²|㎡)";
  const number = "(\\d+[\\d,.]*)";
  const values = [];
  for (const match of areaZone.matchAll(new RegExp(`${number}${areaUnit}`, "gi"))) {
    const prefix = areaZone.slice(Math.max(0, (match.index || 0) - 42), match.index || 0);
    if (/共有部[分份]|公有部分|權利範圍|分之|建號/.test(prefix)) {
      if (values.length) break;
      continue;
    }
    values.push({ raw: match[1], unit: match[2] });
  }
  if (values.length < 2 && values.length < labels.length) return "";
  return values
    .map((item, index) => formatRawAreaSnippet(labels[index] || labels[0] || "附屬建物", item.raw, item.unit))
    .filter(Boolean)
    .join("；");
}

function commonParkingAreaRawFromText(rawText, fieldName = "") {
  if (fieldName !== "commonArea" && fieldName !== "parkingArea") return "";
  const source = normalizeAreaRawSource(rawText);
  const commonIndex = source.search(/共有部[分份]|公有部分/);
  if (commonIndex < 0) return "";
  const section = source.slice(commonIndex).split(/其他登記事項|權狀注記事|權狀註記事|建物所有權部|建物他項權利部|土地他項權利部/)[0];
  const number = "(\\d+[\\d,.]*)";
  const areaUnit = "(平方公尺|平方公|平方?米|m2|m²|㎡)";
  const base = section.match(new RegExp(`${number}${areaUnit}`, "i"));
  const rights = [...section.matchAll(/(?:權利範圍)?[^\d]{0,40}(\d{1,12})\s*分之\s*(\d{1,12})/g)]
    .map((match) => ({ index: match.index || 0, denom: match[1], num: match[2] }));
  if (!base || !rights.length) return "";
  const parkingIndex = section.search(/停車位|含停車位|車位編號|停車位編號/);
  if (parkingIndex < 0) {
    const total = rights.at(-1);
    return fieldName === "commonArea"
      ? `共有部分 ${base[1]}${normalizeRawAreaUnit(base[2])} 權利範圍 ${total.denom}分之${total.num}`
      : "";
  }
  const beforeParking = rights.filter((item) => item.index < parkingIndex);
  const afterParking = rights.filter((item) => item.index > parkingIndex);
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
    return `共有部分 ${base[1]}${normalizeRawAreaUnit(base[2])} 權利範圍 ${total.denom}分之${total.num}-${parkingNum}`;
  }
  const numberMatch = section.match(/(?:停車位|含停車位|車位編號|停車位編號)[^\d]{0,20}(\d{1,6})/);
  const countText = numberMatch ? `停車位編號${numberMatch[1]}` : "停車位";
  return `${countText} 權利範圍 ${total.denom}分之${parkingNum}`;
}

function ownershipDeedAreaRawFromText(rawText, fieldName = "") {
  const source = normalizeAreaRawSource(rawText);
  if (!/建物所有權狀|建物所有權状/.test(source)) return "";
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
      .map((match) => ({ index: match.index || 0, denom: match[1], num: match[2] }));
    if (!base || !rights.length || parkingIndex < 0) return "";
    const beforeParking = rights.filter((item) => item.index < parkingIndex);
    const afterParking = rights.filter((item) => item.index > parkingIndex);
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
      return `共有部分 ${base[1]}${normalizeRawAreaUnit(base[2])} 權利範圍 ${total.denom}分之${total.num}-${parkingNum}`;
    }
    if (fieldName === "parkingArea") {
      const numberMatch = section.match(/(?:停車位|含停車位|合停車位|車位編號|停車位編號)[^\d]{0,20}(\d{1,6})/);
      const countText = numberMatch ? `停車位編號${numberMatch[1]}` : "停車位";
      return `${countText} 權利範圍 ${total.denom}分之${parkingNum}`;
    }
  }
  return "";
}

function conciseAreaRawFromText(rawText, fieldName = "") {
  const compact = String(rawText || "")
    .replace(/[０-９]/g, (ch) => String("０１２３４５６７８９".indexOf(ch)))
    .replace(/[*＊\s]+/g, "");
  if (!compact) return "";
  const ownershipRaw = ownershipDeedAreaRawFromText(rawText, fieldName);
  if (ownershipRaw) return ownershipRaw;
  const splitAttachedRaw = fieldName === "attachArea" ? attachedItemizedRawFromText(rawText) : "";
  if (splitAttachedRaw) return splitAttachedRaw;
  const commonParkingRaw = commonParkingAreaRawFromText(rawText, fieldName);
  if (commonParkingRaw) return commonParkingRaw;
  const areaUnit = "(平方公尺|平方?米|m2|m²|㎡)";
  const number = "(\\d+[\\d,.]*)";
  const matchers = [];
  if (fieldName === "attachArea") {
    matchers.push(new RegExp(`(陽台|平台|雨遮|騎樓|露台|花台|門廊|走廊|樓梯間)[^\\d]{0,50}${number}${areaUnit}`, "i"));
    matchers.push(new RegExp(`附屬建物用途[:：]?([^\\d面積]{1,12})?面積[^\\d]{0,30}${number}${areaUnit}`, "i"));
  } else if (fieldName === "commonArea") {
    matchers.push(new RegExp(`(共有部[分份])[^\\d]{0,80}${number}${areaUnit}`, "i"));
  } else if (fieldName === "parkingArea") {
    matchers.push(new RegExp(`(停車位|車位)[^\\d]{0,80}${number}${areaUnit}`, "i"));
  } else if (fieldName === "mainArea") {
    matchers.push(new RegExp(`(主建物面積|主建物|層次面積|總面積)[^\\d]{0,80}${number}${areaUnit}`, "i"));
  } else if (fieldName === "landShare") {
    matchers.push(new RegExp(`(土地面積|地積|面積)[^\\d]{0,80}${number}${areaUnit}`, "i"));
  }
  for (const matcher of matchers) {
    const match = compact.match(matcher);
    if (match?.[2] && match?.[3]) return formatRawAreaSnippet(match[1], match[2], match[3]);
  }
  return "";
}

function ocrFieldRawDisplay(fieldName, result) {
  const raw = result?.rawOcr ?? result?.raw_ocr ?? result?.raw ?? "";
  if (!isAreaValueField(fieldName)) return String(raw ?? "");
  return conciseAreaRawFromText(raw, fieldName) || stripPingFromAreaRaw(raw);
}

function formatAreaValueDisplay(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  const sqmMatch = text.match(/(-?\d[\d,]*(?:\.\d+)?)\s*(?:平方公尺|㎡|平方|m2|m²)/i);
  if (sqmMatch) {
    const sqm = Number(sqmMatch[1].replace(/,/g, ""));
    if (Number.isFinite(sqm)) return `${Number((sqm / 3.305785).toFixed(3))} 坪`;
  }
  if (/坪/.test(text)) return text;
  const numeric = Number(text.replace(/,/g, ""));
  if (!Number.isFinite(numeric)) return text;
  return `${Number(numeric.toFixed(3))} 坪`;
}

function ocrFieldValueDisplay(fieldName, result) {
  const value = ocrFieldValue(result);
  if (!isAreaValueField(fieldName)) return value;
  return formatAreaValueDisplay(value);
}

export function ocrSourceLabel(source) {
  const key = String(source || "");
  if (OCR_SOURCE_LABELS[key]) return OCR_SOURCE_LABELS[key];
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

export function setOcrDiagnosticsOpen(open) {
  if (!els.ocrFieldDiagnostics) return;
  els.ocrFieldDiagnostics.classList.toggle("is-hidden", !open);
  if (els.toggleOcrDiagnosticsBtn) {
    els.toggleOcrDiagnosticsBtn.textContent = open ? "隱藏欄位辨識診斷" : "顯示欄位辨識診斷";
  }
}

export function syncOcrDiagnosticsButton(hasDiagnostics) {
  if (!els.toggleOcrDiagnosticsBtn) return;
  els.toggleOcrDiagnosticsBtn.classList.toggle("is-hidden", !hasDiagnostics);
  els.toggleOcrDiagnosticsBtn.disabled = !hasDiagnostics;
  if (!hasDiagnostics) {
    els.toggleOcrDiagnosticsBtn.textContent = "顯示欄位辨識診斷";
  }
}

export function clearOcrFieldDiagnostics() {
  setLastOcrFieldResults({});
  setLastOcrDiagnosticsMeta({});
  if (els.ocrFieldDiagnostics) {
    els.ocrFieldDiagnostics.innerHTML = "";
    delete els.ocrFieldDiagnostics.dataset.manual;
    setOcrDiagnosticsOpen(false);
  }
  syncOcrDiagnosticsButton(false);
}

function firstFiniteNumber(...values) {
  for (const value of values) {
    if (value == null || value === "") continue;
    const n = Number(value);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return null;
}

function formatTokenCount(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "--";
  return Math.round(n).toLocaleString("en-US");
}

function formatElapsedMs(value) {
  const ms = Number(value);
  if (!Number.isFinite(ms) || ms < 0) return "--";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const seconds = ms / 1000;
  return `${seconds < 10 ? seconds.toFixed(2) : seconds.toFixed(1)} 秒`;
}

function shortEngineLabel(value) {
  const text = String(value || "").trim();
  const lowered = text.toLowerCase();
  if (!text) return "";
  const isFieldLevel = /field|欄位|重點/.test(lowered) || /欄位|重點/.test(text);
  const hasRapid = lowered.includes("rapid");
  const hasCloud = lowered.includes("cloud");
  if (hasRapid && hasCloud) {
    return isFieldLevel ? "RapidOCR欄位OCR+Cloud Vision欄位OCR" : "RapidOCR+Cloud Vision";
  }
  if (hasCloud) return isFieldLevel ? "Cloud Vision欄位OCR" : "Cloud Vision";
  if (hasRapid) return isFieldLevel ? "RapidOCR欄位OCR" : "RapidOCR";
  if (lowered.includes("ppocrv5") || lowered.includes("ncnn")) return "原生ncnn OCR";
  if (lowered.includes("macos_vision") || lowered.includes("vision")) return "macOS Vision OCR（已停用）";
  if (lowered.includes("fallback_none")) return "OCR尚未可用";
  if (lowered.includes("tesseract_cli")) return "Tesseract已停用";
  if (lowered.includes("tesseract")) return "Tesseract已停用";
  if (lowered.includes("pdf")) return "PDF文字層";
  return text
    .replace(/^backend[-_]?/i, "")
    .replace(/[-_]?ocr$/i, " OCR")
    .slice(0, 24);
}

function shortProviderLabel(value) {
  const key = String(value || "").trim();
  return {
    pdf_text_layer: "PDF文字層",
    rapidocr: "RapidOCR欄位OCR",
    gpt5_nano: "GPT-5 nano",
    gemini_2_5_flash: "Gemini已移除",
    google_cloud_vision: "Cloud Vision欄位OCR",
    backend: "後端"
  }[key] || shortEngineLabel(key) || key || "未知";
}

function shortStatusLabel(value) {
  const key = String(value || "").trim();
  return {
    ok: "完成",
    empty: "無文字",
    disabled: "未啟用",
    skipped: "略過",
    skipped_fast_mode: "快速略過",
    skipped_no_low_confidence_fields: "無需補強",
    skipped_gpt_sufficient: "GPT已足夠",
    skipped_confident_local_ocr: "本機足夠",
    skipped_short_text: "文字不足",
    needed_escalation_gate: "需補強",
    error: "失敗",
    timeout: "逾時",
    unknown: "未知"
  }[key] || key.replace(/_/g, " ").slice(0, 18);
}

function normalizeGptTokenUsage(usage = {}) {
  if (!usage || typeof usage !== "object") return null;
  const input = firstFiniteNumber(usage.input_tokens, usage.prompt_tokens);
  const output = firstFiniteNumber(usage.output_tokens, usage.completion_tokens);
  const total = firstFiniteNumber(
    usage.total_tokens,
    input != null && output != null ? input + output : null
  );
  const cached = firstFiniteNumber(
    usage.input_tokens_details?.cached_tokens,
    usage.prompt_tokens_details?.cached_tokens
  );
  const reasoning = firstFiniteNumber(
    usage.output_tokens_details?.reasoning_tokens,
    usage.completion_tokens_details?.reasoning_tokens
  );
  if (input == null && output == null && total == null && cached == null && reasoning == null) return null;
  return { input, output, total, cached, reasoning };
}

function normalizeOcrTiming(meta = {}) {
  const timing = meta.ocrTiming || meta.timing || {};
  if (!timing || typeof timing !== "object") return null;
  const elapsedMs = firstFiniteNumber(timing.elapsedMs, timing.ocrElapsedMs, meta.ocrElapsedMs);
  const backendElapsedMs = firstFiniteNumber(timing.backendElapsedMs, timing.backend_ocr_elapsed_ms);
  const pdfTextLayerElapsedMs = firstFiniteNumber(timing.pdfTextLayerElapsedMs);
  const totalElapsedMs = firstFiniteNumber(timing.totalElapsedMs);
  const pages = firstFiniteNumber(timing.pages, timing.backendPages);
  const backendCacheHit = timing.backendCacheHit === true || timing.cacheHit === true;
  if (elapsedMs == null && backendElapsedMs == null && pdfTextLayerElapsedMs == null && totalElapsedMs == null) return null;
  return {
    elapsedMs,
    backendElapsedMs,
    pdfTextLayerElapsedMs,
    totalElapsedMs,
    pages,
    backendCacheHit,
    backendCacheKey: String(timing.backendCacheKey || timing.cacheKey || "").trim(),
    source: String(timing.source || timing.mode || "").trim(),
    engine: String(timing.engine || "").trim(),
    note: String(timing.note || "").trim()
  };
}

function ocrTimingCell(meta = {}, result = {}) {
  const resultMs = firstFiniteNumber(result.ocrElapsedMs, result.elapsedMs);
  if (resultMs != null) return formatElapsedMs(resultMs);
  const timing = normalizeOcrTiming(meta);
  return timing?.elapsedMs != null ? formatElapsedMs(timing.elapsedMs) : "--";
}

function buildOcrTimingRow(meta = {}) {
  const timing = normalizeOcrTiming(meta);
  if (!timing) return "";
  const sourceText = timing.source ? shortEngineLabel(timing.source) || timing.source : "";
  const engineText = timing.engine ? shortEngineLabel(timing.engine) || timing.engine : "";
  const rawParts = [
    sourceText,
    engineText && engineText !== sourceText ? engineText : "",
    timing.pages != null ? `${Math.round(timing.pages)}頁` : "",
    timing.pdfTextLayerElapsedMs != null ? `文字層${formatElapsedMs(timing.pdfTextLayerElapsedMs)}` : "",
    timing.backendElapsedMs != null ? `後端${formatElapsedMs(timing.backendElapsedMs)}` : "",
    timing.totalElapsedMs != null ? `總計${formatElapsedMs(timing.totalElapsedMs)}` : "",
    timing.backendCacheHit ? "快取命中" : ""
  ].filter(Boolean);
  const note = timing.backendCacheHit ? "命中後端 JSON 快取；不含 GPT 校正時間" : translateOcrWarning(timing.note);
  return `<tr class="ocr-token-row">
      <td>謄本 OCR 計時</td>
      <td>OCR pipeline</td>
      <td>${escapeHtml(formatElapsedMs(timing.elapsedMs))}</td>
      <td class="ocr-muted">--</td>
      <td class="ocr-muted">記錄</td>
      <td>${escapeHtml(rawParts.join("／") || "--")}</td>
      <td>${escapeHtml(formatElapsedMs(timing.elapsedMs))}</td>
    </tr>${buildWarningRow("流程警示", note)}`;
}

function buildGptTokenUsageRow(meta = {}) {
  const usage = normalizeGptTokenUsage(meta.gptTokenUsage || meta.usage);
  const model = String(meta.gptModel || meta.model || "").trim();
  const status = String(meta.gptStatus || meta.status || "").trim();
  const cacheHit = meta.gptCacheHit === true || meta.cacheHit === true;
  if (!usage && !model && !status) return "";
  const rawParts = usage ? [
    usage.input != null ? `輸入 ${formatTokenCount(usage.input)}` : "",
    usage.output != null ? `輸出 ${formatTokenCount(usage.output)}` : "",
    usage.cached != null ? `快取 ${formatTokenCount(usage.cached)}` : "",
    usage.reasoning != null ? `推理 ${formatTokenCount(usage.reasoning)}` : "",
    cacheHit ? "JSON快取命中" : ""
  ].filter(Boolean) : ["未回傳 usage"];
  const value = usage?.total != null ? `總計 ${formatTokenCount(usage.total)} tokens` : "--";
  const notes = [
    model ? `model:${model}` : "",
    status ? `status:${status}` : "",
    cacheHit ? "cache:hit" : ""
  ].filter(Boolean).join("、");
  return `<tr class="ocr-token-row">
      <td>GPT token 使用量</td>
      <td>GPT-5 nano 校正器</td>
      <td class="ocr-muted">--</td>
      <td class="ocr-muted">--</td>
      <td class="ocr-muted">記錄</td>
      <td>${escapeHtml(rawParts.join("／"))}</td>
      <td>${escapeHtml(value)}</td>
    </tr>${buildWarningRow("GPT token 使用量", notes)}`;
}

function buildFieldDetectorStatusRow(meta = {}) {
  const status = meta.fieldDetector || null;
  if (!status || typeof status !== "object") return "";
  const reachable = status.serviceReachable === true || isBackendOcrHealthReady(status);
  const modelExists = status.model_exists === true;
  const available = status.available === true;
  const skippedDuringOcr = status.skippedDuringOcr === true;
  const stateText = skippedDuringOcr
    ? "快速模式略過"
    : (available
    ? "可用"
    : (reachable && !modelExists ? "待訓練模型" : "未啟用"));
  const rawParts = [
    status.device ? `device:${status.device}` : "",
    status.pages ? `pages:${status.pages}` : "",
    status.layoutDetections != null ? `layout:${status.layoutDetections}` : "",
    status.fields > 0 ? `legacyFields:${status.fields}` : "",
    status.elapsedMs ? `yolo:${formatElapsedMs(status.elapsedMs)}` : "",
    skippedDuringOcr ? "fastMode:skipSyncYolo" : "",
    status.error ? `error:${status.error}` : ""
  ].filter(Boolean);
  const value = skippedDuringOcr
    ? "OCR 完成前不等待 YOLO"
    : (modelExists ? "models/best.pt 已載入" : "models/best.pt 尚未建立");
  const note = reachable ? "field-detector service reachable" : "field-detector unavailable";
  return `<tr class="ocr-token-row">
      <td>YOLO 版面偵測狀態</td>
      <td>YOLO 版面偵測</td>
      <td class="ocr-muted">--</td>
      <td class="ocr-muted">--</td>
      <td class="${available ? "ocr-auto" : "ocr-muted"}">${escapeHtml(stateText)}</td>
      <td>${escapeHtml(rawParts.join("／") || "--")}</td>
      <td>${escapeHtml(value)}</td>
    </tr>${buildWarningRow("YOLO 版面偵測狀態", note)}`;
}

function buildPipelineDebugRow(meta = {}) {
  const debug = meta.pipelineDebug || meta.ocrPipeline || null;
  if (!debug || typeof debug !== "object") return "";
  const escalation = debug.escalation || {};
  const providers = Array.isArray(debug.providersTried) ? debug.providersTried : [];
  const providerText = providers.map((item) => {
    const provider = shortProviderLabel(item.provider);
    const status = shortStatusLabel(item.status || "unknown");
    const latency = item.latencyMs != null ? `:${formatElapsedMs(item.latencyMs)}` : "";
    const cache = item.cacheHit ? ":快取" : "";
    return `${provider}${status}${latency}${cache}`;
  }).join("／");
  const reasons = Array.isArray(escalation.reasons) ? escalation.reasons.join("；") : "";
  const conflictCount = Array.isArray(debug.conflicts) ? debug.conflicts.length : 0;
  const stateText = escalation.shouldEscalate ? "已啟動救援判斷" : "本機解析足夠";
  return `<tr class="ocr-token-row">
      <td>OCR 救援流程</td>
      <td>Pipeline Gate</td>
      <td>${escapeHtml(formatElapsedMs(debug.elapsedMs))}</td>
      <td class="ocr-muted">--</td>
      <td class="${escalation.shouldEscalate ? "ocr-review" : "ocr-auto"}">${escapeHtml(stateText)}</td>
      <td>${escapeHtml(providerText || "--")}</td>
      <td>${escapeHtml(`mode:${debug.mode || "standard"} / conflicts:${conflictCount}`)}</td>
    </tr>${buildWarningRow("OCR 救援流程", reasons || "依欄位信心、缺漏與格式驗證判斷")}`;
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
  return `<tr class="ocr-token-row">
      <td>OCR 候選比較</td>
      <td>${escapeHtml(source || "候選補強")}</td>
      <td class="ocr-muted">--</td>
      <td class="ocr-muted">--</td>
      <td class="${item.adopted ? "ocr-auto" : "ocr-review"}">${escapeHtml(stateText)}</td>
      <td>${escapeHtml(raw)}</td>
      <td>${escapeHtml(comparisons.length ? `${comparisons.length} 筆比較` : "--")}</td>
    </tr>`;
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
  return `<tr class="ocr-token-row">
      <td>OCR 備援摘要</td>
      <td>${escapeHtml(sourceText)}</td>
      <td class="ocr-muted">--</td>
      <td class="ocr-muted">--</td>
      <td class="${adopted ? "ocr-auto" : "ocr-muted"}">${escapeHtml(stateText)}</td>
      <td>${escapeHtml(raw || "無備援採用")}</td>
      <td>${escapeHtml(count ? `${count} 筆比較` : "--")}</td>
    </tr>`;
}

export function mergeOcrFieldResults(primary = {}, fallback = {}, options = {}) {
  const merged = { ...(primary || {}) };
  const forceKeys = new Set(options.forceKeys || []);
  Object.entries(fallback || {}).forEach(([key, result]) => {
    if (!result) return;
    const current = merged[key];
    if (forceKeys.has(key) && ocrFieldValue(result)) {
      merged[key] = result;
      return;
    }
    if (ocrFieldValue(current)) return;
    if (ocrFieldValue(result)) merged[key] = result;
  });
  return merged;
}

export function trustedAreaPresetFieldKeys(preset = null) {
  return preset?.trustAreaPreset ? ["mainArea", "attachArea", "commonArea"] : [];
}

export function buildOcrFieldResults(parsed, context = {}) {
  const root = foundOcrRoot();
  if (!root?.buildFieldResultsFromParsed) return null;
  try {
    return root.buildFieldResultsFromParsed(parsed || {}, context);
  } catch (error) {
    console.warn("OCR field result wrapper failed", error);
    return null;
  }
}

export function buildKnownPresetFieldResults(fileName, preset) {
  const root = foundOcrRoot();
  if (!preset || !root?.buildKnownPresetFieldResults) return null;
  try {
    return root.buildKnownPresetFieldResults(fileName, preset);
  } catch (error) {
    console.warn("OCR preset field result wrapper failed", error);
    return null;
  }
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
  [/Gemini 2\.5 Flash|gemini_2_5_flash|Gemini API/i, () => "Gemini 2.5 Flash 已移除"],
  [/PP-Structure/i, () => "PP-Structure 已移出主流程"],
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
  return text.replace(/_/g, " ").replace(/\s+/g, " ").trim().slice(0, 48);
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

function warningMatchesField(fieldName, warning) {
  const text = String(warning || "");
  if (/未辨識/.test(text)) return true;
  return (OCR_FIELD_WARNING_PATTERNS[fieldName] || []).some((pattern) => pattern.test(text));
}

function fieldWarningText(fieldName, warnings = []) {
  return uniqueBriefWarnings(warnings.filter((warning) => warningMatchesField(fieldName, warning))).slice(0, 3).join("；");
}

function genericWarningText(fieldResults = {}) {
  const all = Object.values(fieldResults || {}).flatMap((result) => Array.isArray(result?.warnings) ? result.warnings : []);
  return uniqueBriefWarnings(all.filter((warning) => /PDF OCR limited|PDF OCR 僅處理|single-pass OCR|快速 OCR|PaddleOCR 未完成|OCR 後端未完成|原生 ncnn OCR|native worker|macOS Vision|Tesseract|Docker PaddleOCR|PP-Structure|PaddleOCR-VL|MiniMax M3|MiniMax ROI Vision/i.test(String(warning || "")))).slice(0, 4).join("；");
}

function buildWarningRow(label, text, colspan = 6) {
  if (!text) return "";
  return `<tr class="ocr-warning-row"><td>${escapeHtml(label)}</td><td colspan="${colspan}">警示：${escapeHtml(text)}</td></tr>`;
}

function correctionText(result = {}) {
  const corrections = Array.isArray(result?.corrections) ? result.corrections : [];
  return corrections.map((item) => {
    if (item == null) return "";
    if (typeof item === "string") return item;
    return [item.type, item.reason, item.from, item.to].filter(Boolean).join(" ");
  }).filter(Boolean).join(" ");
}

function sourceTextForBadge(result = {}) {
  return [result?.source, correctionText(result), ...(Array.isArray(result?.warnings) ? result.warnings : [])].join(" ");
}

function aiKeysForField(fieldName) {
  return Object.entries(AI_ENHANCEMENT_FIELD_MAP)
    .filter(([, fields]) => fields.includes(fieldName))
    .map(([key]) => key);
}

function fieldHasEnhancementItem(enhancement = {}, fieldName = "", bucket = "") {
  if (!enhancement || typeof enhancement !== "object") return false;
  const keys = aiKeysForField(fieldName);
  const items = Array.isArray(enhancement[bucket]) ? enhancement[bucket] : [];
  return items.some((item) => keys.includes(String(item?.field || "")));
}

function addFieldBadge(badges, label, className, title = "") {
  if (!label || badges.some((badge) => badge.label === label)) return;
  badges.push({ label, className, title });
}

function buildOcrFieldBadges(fieldName, result = {}, meta = {}) {
  const badges = [];
  const ai = meta.ai_enhancement || meta.aiEnhancement || {};
  const roi = meta.roi_enhancement || meta.roiEnhancement || ai.roi_vision || ai.roiVision || {};
  const sourceText = sourceTextForBadge(result);
  const confidence = Number(result?.confidence);

  if (result?.needsReview || /needs_review|人工確認|人工複核|需人工|請檢查/i.test(sourceText)) {
    addFieldBadge(badges, "需人工確認", "ocr-badge-review", "此欄位被標記為需人工確認");
  }
  if (/minimax_roi_vision|MiniMax ROI Vision/i.test(sourceText) || fieldHasEnhancementItem(roi, fieldName, "auto_applied")) {
    addFieldBadge(badges, "MiniMax ROI Vision 已校正", "ocr-badge-ai", "MiniMax ROI Vision 已套用校正");
  }
  if (/minimax_m3|MiniMax M3/i.test(sourceText) || fieldHasEnhancementItem(ai, fieldName, "auto_applied")) {
    addFieldBadge(badges, "MiniMax M3 已校正", "ocr-badge-ai", "MiniMax M3 已套用校正");
  }
  if (/rejected|not_applied|未套用|建議未套用/i.test(sourceText)
    || fieldHasEnhancementItem(ai, fieldName, "rejected")
    || fieldHasEnhancementItem(roi, fieldName, "rejected")) {
    addFieldBadge(badges, "AI 建議未套用", "ocr-badge-muted", "AI 有建議但未符合自動套用條件");
  }
  if (Number.isFinite(confidence) && confidence >= 0.86 && !/minimax/i.test(sourceText)) {
    addFieldBadge(badges, "Parser 高信心", "ocr-badge-parser", "欄位 parser 信心達 0.86 以上");
  }
  if (/ppocrv5|ncnn|pdf_text_layer|pdfTextLayer|macos_vision|native_ocr/i.test(String(result?.source || ""))) {
    addFieldBadge(badges, "本機 OCR", "ocr-badge-local", "由本機 OCR 或 PDF 文字層提供");
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

export function renderOcrFieldDiagnostics(fieldResults = null, meta = {}) {
  setLastOcrFieldResults(fieldResults || {});
  setLastOcrDiagnosticsMeta(meta || {});
  if (!els.ocrFieldDiagnostics) return;
  if (!fieldResults || !Object.keys(fieldResults).length) {
    clearOcrFieldDiagnostics();
    return;
  }
  const tokenUsageRow = buildGptTokenUsageRow(meta);
  const ocrTimingRow = buildOcrTimingRow(meta);
  const fieldDetectorStatusRow = buildFieldDetectorStatusRow(meta);
  const pipelineDebugRow = buildPipelineDebugRow(meta);
  const candidateComparisonRow = buildCandidateComparisonRow(meta);
  const fallbackSummaryRow = buildFallbackSummaryRow(meta);
  const rows = Object.entries(OCR_FIELD_LABELS).map(([fieldName, label]) => {
    const result = fieldResults[fieldName] || {};
    const status = ocrFieldStatusText(result);
    const confidence = Number.isFinite(Number(result.confidence)) ? `${Math.round(Number(result.confidence) * 100)}%` : "--";
    const source = result.source || "--";
    const sourceText = ocrSourceLabel(source);
    const corrections = Array.isArray(result.corrections) ? result.corrections.map((item) => item?.reason || item?.type || item?.from || String(item)).join("、") : "";
    const warnings = fieldWarningText(fieldName, Array.isArray(result.warnings) ? result.warnings : []);
    const warningText = [corrections, warnings].filter(Boolean).join("；");
    const presetTag = source === "knownFilePreset" ? "（已知檔名保底）" : "";
    const badges = renderOcrFieldBadges(fieldName, result, meta);
    const dataRow = `<tr>
      <td>${escapeHtml(label)}</td>
      <td>${escapeHtml(sourceText)}${escapeHtml(presetTag)}</td>
      <td>${escapeHtml(ocrTimingCell(meta, result))}</td>
      <td class="ocr-confidence">${escapeHtml(confidence)}</td>
      <td class="${status.className}">${escapeHtml(status.text)}${badges}</td>
      <td class="ocr-raw-cell">${escapeHtml(ocrFieldRawDisplay(fieldName, result))}</td>
      <td>${escapeHtml(ocrFieldValueDisplay(fieldName, result))}</td>
    </tr>`;
    return `${dataRow}${buildWarningRow(label, warningText)}`;
  }).join("");
  const genericWarnings = buildWarningRow("流程警示", genericWarningText(fieldResults));
  els.ocrFieldDiagnostics.innerHTML = `
    <div class="ocr-diagnostics-title">
      <span>欄位辨識診斷</span>
      <span class="ocr-muted">raw 只顯示對應欄位 OCR 原文；0.75 以上才自動帶入</span>
    </div>
    <table>
      <thead><tr><th>欄位</th><th>來源</th><th>OCR計時</th><th>信心</th><th>狀態</th><th>raw（OCR原文）</th><th>value（面積=坪）</th></tr></thead>
      <tbody>${ocrTimingRow}${candidateComparisonRow}${fallbackSummaryRow}${pipelineDebugRow}${fieldDetectorStatusRow}${tokenUsageRow}${genericWarnings}${rows}</tbody>
    </table>`;
  syncOcrDiagnosticsButton(true);
  const manualState = els.ocrFieldDiagnostics.dataset.manual;
  setOcrDiagnosticsOpen(manualState === "open");
}

export function ocrMissingText() {
  return "無法辨識";
}
