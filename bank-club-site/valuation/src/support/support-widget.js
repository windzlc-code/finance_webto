const STORAGE_PREFIX = "foundSupport:";
const HISTORY_KEY = `${STORAGE_PREFIX}history`;
const INTAKES_KEY = `${STORAGE_PREFIX}intakes`;
const AUTO_OCR_OPENER_KEY = `${STORAGE_PREFIX}autoOcrOpeners`;
const REMOTE_MESSAGE_SEEN_KEY = `${STORAGE_PREFIX}remoteMessageSeen`;
const SUPPORT_API_BASE = "/api/support";
const SUPPORT_ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024;
const SUPPORT_ATTACHMENT_MAX_FILES = 3;
const SUPPORT_REMOTE_MESSAGE_POLL_MS = 4500;
const SUPPORT_ATTACHMENT_MIMES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif"
]);
let backendSnapshot = null;
let backendStatus = null;

const KNOWLEDGE = [
  {
    id: "ocr",
    title: "謄本 OCR / PDF 解析",
    keywords: ["ocr", "pdf", "文字層", "ppocrv5", "ncnn", "docker", "roi", "yolo", "辨識", "解析", "謄本"],
    answer: [
      "謄本解析流程會優先讀 PDF 文字層；圖片或低信心欄位會改用本機 ppocrv5_ncnn，並以 YOLO/紅框 ROI 聚焦補強。",
      "若 ROI 仍讀不到文字，系統會在 Docker PaddleOCR 8099 可用時作為隔離式備援；macOS Vision、Gemini、PaddleOCR-VL、PP-Structure 目前不在主 OCR fallback 流程。解析後請先看「欄位辨識診斷」：信心低或標示「請檢查」的欄位，建議人工複核後再估價。"
    ]
  },
  {
    id: "doorplate",
    title: "建物門牌 / 查詢地址",
    keywords: ["門牌", "地址", "查詢地址", "路", "街", "巷", "弄", "號", "樓"],
    answer: [
      "建物門牌會優先取建物標示部的「建物門牌」，並同步帶入查詢地址。",
      "若 OCR 把文件標題、地號或建號誤當門牌，請展開「欄位辨識診斷」看 raw 值；通常是 PDF 文字層換行黏在一起或圖片傾斜造成。"
    ]
  },
  {
    id: "area",
    title: "主建物 / 附屬建物 / 共有部分面積",
    keywords: ["主建物", "附屬", "共有", "面積", "坪", "平方公尺", "車位坪數", "總面積"],
    answer: [
      "房屋坪數 = 主建物 + 附屬建物 + 共有部分；車位坪數另列，總坪數 = 房屋坪數 + 車位坪數。",
      "平方公尺會自動除以 3.305785 換算成坪。共有部分若有權利範圍，會先依權利範圍換算應有部分後再轉坪。"
    ]
  },
  {
    id: "score",
    title: "比較案例排序分數",
    keywords: ["排序", "分數", "comparable", "比較案例", "平均", "權重", "單價", "樓別", "總樓層"],
    answer: [
      "目前比較案例依 Comparable Score 100 分制排序：地址接近度最高25、屋齡17、總樓層15、總面積15、交易日期10、樓別接近度8、主要用途5、單價5。",
      "結果表會預設依排序分數由高到低排列，再取排序後至多前 3 筆計算平均單價；一樓案例只在標的明確為一樓時列入。"
    ]
  },
  {
    id: "townhouse",
    title: "透天與建物型態",
    keywords: ["透天", "公寓", "華廈", "住宅大樓", "建物型態", "層次", "總樓層"],
    answer: [
      "建物型態會依總樓層與謄本層次判斷：5樓以下通常為公寓、6-9樓為華廈、10樓以上為住宅大樓。",
      "透天通常需同一門牌含一樓且涵蓋多個樓層；若只有單一樓別例如三樓、四樓，即使總樓層較低也不會直接判成透天。"
    ]
  },
  {
    id: "parking",
    title: "車位坪數 / 車位總價",
    keywords: ["車位", "停車", "停車位", "車位總價", "車位數量", "權利範圍"],
    answer: [
      "有停車位編號時，車位數量會直接採 OCR 讀到的編號個數；沒有編號時才由車位坪數推估。",
      "估值加計的車位金額會取納入平均案例的單一車位平均價，再依本案車位數或車位坪數倍數計算。"
    ]
  },
  {
    id: "loan",
    title: "償債能力即時試算",
    keywords: ["貸款", "房貸", "償還能力", "償債能力", "收支比", "70%", "月付"],
    answer: [
      "房貸試算器內已合併「償債能力即時試算」，系統會自動帶入本次房貸申請金額與 2.5% 利率，再計算月付金與收支比。",
      "試算結果是內部評估參考，實際核貸仍需以正式授信條件與銀行審核為準。"
    ]
  },
  {
    id: "land-tax",
    title: "土地增值稅試算",
    keywords: ["土增稅", "土地增值稅", "權利範圍", "申報現值", "原地價", "持有年數", "稅率"],
    answer: [
      "頁面下方「土地增值稅試算」可由土地謄本解析土地面積、權利範圍、申報移轉現值、原地價或前次現值與持有年數。",
      "若權利範圍分子分母不正確，請先檢查 OCR raw 值與欄位診斷，再確認是否多筆土地被合併。"
    ]
  },
  {
    id: "cache",
    title: "快取與速度",
    keywords: ["快取", "速度", "慢", "重跑", "同一個檔案", "cache"],
    answer: [
      "同一個 PDF 或圖片若檔案內容相同，後端 JSON 快取可直接回傳上次解析結果，通常會比重新 OCR 快很多。",
      "快取只保存解析 JSON，不保存大量圖片；可控制大小與清理策略，空間壓力比保存整份影像低。"
    ]
  },
  {
    id: "handoff",
    title: "人工協助",
    keywords: ["人工", "真人", "協助", "顧問", "問題", "回報", "聯絡", "留單"],
    answer: [
      "可以，我可以先把問題整理成客服紀錄。請點「人工協助」，填入稱呼、聯絡方式與問題描述。",
      "目前客服紀錄會同步保存到後端 SQLite；若設定 LINE 或 Telegram 憑證，系統會同時推送通知。"
    ]
  }
];

const QUICK_ACTIONS = [
  { label: "OCR 沒帶入門牌", text: "OCR 完成後沒有帶入建物門牌，該怎麼檢查？" },
  { label: "排序分數", text: "排序分數怎麼算？" },
  { label: "共有部分面積", text: "共有部分面積和權利範圍怎麼換算？" },
  { label: "人工協助", text: "我想建立人工協助紀錄" }
];

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[char]));
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
    // Local storage can be disabled or full; the widget still works without persistence.
  }
}

function readStringSet(key) {
  const value = readJson(key, []);
  return new Set(Array.isArray(value) ? value.map((item) => String(item || "")).filter(Boolean) : []);
}

function writeStringSet(key, value, maxItems = 240) {
  writeJson(key, Array.from(value || []).filter(Boolean).slice(-maxItems));
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[，。！？、,.!?]/g, "");
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
  return Array.from(document.querySelectorAll("#mainPurposePick input:checked"))
    .map((input) => input.value || input.closest("label")?.textContent || "")
    .map((value) => String(value).trim())
    .filter(Boolean);
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
    doorplate: "建物門牌",
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
    address: truncateText(row.address || row["地址"] || "", 120),
    unitPrice: row.unitPrice ?? row["單價"] ?? null,
    totalPrice: row.totalPrice ?? row["總價"] ?? null,
    totalArea: row.totalArea ?? row["總面積"] ?? null,
    floorInfo: truncateText(row.floorInfo || row["樓層"] || "", 80),
    purpose: truncateText(row.purpose || row["用途"] || "", 80),
    comparableScore: row.comparableScore ?? null,
    scoreBreakdown: row.comparableScoreBreakdown || null,
    keptForAverage: Array.isArray(row.__keptForAverage) ? row.__keptForAverage : undefined
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
  const hasData = taxAmount && taxAmount !== "--" || status && status !== "請輸入資料後試算" || parseLog && parseLog !== "尚未上傳土地謄本。" || Object.keys(cleanFields).length > 0;
  return hasData ? {
    taxAmount: taxAmount && taxAmount !== "--" ? taxAmount : "",
    status: truncateText(status, 200),
    parseLog: truncateText(parseLog, 500),
    fields: cleanFields,
    warnings: truncateText(readTextValue("ltWarnings"), 500)
  } : {};
}

function collectLoanCapacitySnapshot() {
  const root = document.getElementById("loanCapacityRoot");
  if (!root) return {};
  const result = {
    annualIncome: readInputValue("loanAnnualIncome"),
    debtIncomeRatio: root.querySelector("[data-result-ratio]")?.textContent?.trim() || "",
    status: root.querySelector("[data-result-status]")?.textContent?.trim() || "",
    totalMonthlyPayment: root.querySelector("[data-total-monthly]")?.textContent?.trim() || "",
    totalDebt: root.querySelector("[data-total-debt]")?.textContent?.trim() || "",
    recurringIncome: root.querySelector("[data-recurring-income]")?.textContent?.trim() || "",
    assetIncome: root.querySelector("[data-asset-income]")?.textContent?.trim() || "",
    totalIncome: root.querySelector("[data-total-income]")?.textContent?.trim() || "",
    assetTotal: root.querySelector("[data-asset-total]")?.textContent?.trim() || ""
  };
  const clean = Object.fromEntries(Object.entries(result).filter(([, value]) => value && value !== "--" && value !== "0 元" && value !== "0 萬元" && value !== "0 萬元/年"));
  return Object.keys(clean).length ? clean : {};
}

function collectOcrContextSnapshot() {
  const mapping = safeWindowObject("lastOcrMapping");
  const fieldResults = safeWindowObject("lastOcrFieldResults");
  const pipelineDebug = safeWindowObject("lastOcrPipelineDebug");
  const sourceFiles = Array.from(document.getElementById("sourceFile")?.files || []);
  const files = sourceFiles.map((file) => file.name).filter(Boolean).slice(0, 8);
  const fields = {
    sourceFile: files.join("、") || mapping.source_file || mapping.sourceFile || "",
    propertyAddress: readInputValue("recognizedPropertyAddress") || mapping["建物門牌"] || mapping["地址"] || mapping.building_address || "",
    queryAddress: readInputValue("subjectAddress") || mapping["查詢地址"] || "",
    roadKeyword: readInputValue("roadKeyword"),
    mainArea: readInputValue("mainArea") || mapping["主建物面積坪"] || "",
    attachArea: readInputValue("attachArea") || mapping["附屬建物面積坪"] || "",
    commonArea: readInputValue("commonArea") || mapping["共有部分面積坪"] || "",
    landShareArea: readInputValue("landShareArea") || mapping["標的土地持分坪合計"] || "",
    parkingArea: readInputValue("parkingArea") || mapping["車位權狀坪數"] || "",
    parkingCount: readInputValue("parkingCount") || mapping["車位數量"] || "",
    totalArea: readInputValue("totalWithParkingArea"),
    totalFloors: readInputValue("totalFloors") || mapping["總樓層數"] || "",
    unitFloor: readInputValue("floorFilter") || mapping["標的所在樓層"] || mapping["層次"] || "",
    buildingType: readInputValue("houseType") || mapping["建物型態"] || "",
    purpose: selectedPurposeValues().join("、") || mapping["主要用途"] || "",
    completionDate: mapping["建築完成日期"] || "",
    avgUnitPrice: readMetricValue("avgUnitPrice", "avgUnitPriceSub"),
    houseValue: readMetricValue("houseValue", "houseValueSub"),
    ocrLog: truncateText(document.getElementById("ocrLog")?.textContent || "", 800)
  };
  const compactFields = Object.fromEntries(
    Object.entries(fields).filter(([, value]) => String(value || "").trim())
  );
  const mappingKeys = [
    "source_file",
    "建物門牌",
    "查詢地址",
    "地址",
    "主建物面積坪",
    "附屬建物面積坪",
    "共有部分面積坪",
    "標的土地持分坪合計",
    "車位權狀坪數",
    "車位數量",
    "總樓層數",
    "標的所在樓層",
    "建物型態",
    "主要用途",
    "建築完成日期",
    "每坪單價",
    "房屋價值"
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
  const hasSystemContext = Object.keys(compactValuation).length > 0
    || Object.keys(comparableResults).length > 0
    || Object.keys(landValueTax).length > 0
    || Object.keys(loanCapacity).length > 0;
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
  const normalized = normalizeText(text);
  if (!normalized) return false;
  const hasOcrWord = /ocr|謄本|門牌|地址|辨識|解析|欄位|案件|主建物|附屬|共有|面積|坪數|車位/.test(normalized);
  return hasOcrWord || !!ocrContext?.hasData;
}

function selectedOcrFiles() {
  return Array.from(document.getElementById("sourceFile")?.files || [])
    .filter((file) => {
      const type = file.type || "";
      return SUPPORT_ATTACHMENT_MIMES.has(type) || /\.(pdf|jpe?g|png|webp|heic|heif)$/i.test(file.name || "");
    })
    .slice(0, SUPPORT_ATTACHMENT_MAX_FILES);
}

function fileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("讀取附件失敗"));
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
  return `已附上 OCR 檔案：${clean.map((item) => `${item.fileName}（${formatAttachmentSize(item.size)}）`).join("、")}`;
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
  const fileNames = files.map((file) => file.name).filter(Boolean).join("、");
  const areaParts = [
    fields.mainArea ? `主建物 ${fields.mainArea}` : "",
    fields.attachArea ? `附屬 ${fields.attachArea}` : "",
    fields.commonArea ? `共有 ${fields.commonArea}` : "",
    fields.parkingArea ? `車位 ${fields.parkingArea}` : ""
  ].filter(Boolean);
  const resultParts = [
    fields.avgUnitPrice ? `每坪單價 ${fields.avgUnitPrice}` : "",
    fields.houseValue ? `房屋價值 ${fields.houseValue}` : ""
  ].filter(Boolean);
  return [
    `我剛剛完成 OCR：${fileNames || fields.sourceFile || "謄本檔案"}。`,
    fields.propertyAddress ? `建物門牌：${fields.propertyAddress}` : "",
    areaParts.length ? `坪數摘要：${areaParts.join(" / ")}` : "",
    resultParts.length ? `查詢結果：${resultParts.join(" / ")}` : "",
    "請客服協助查看這份謄本 OCR 案件。"
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
        reason: `附件超過 ${formatAttachmentSize(SUPPORT_ATTACHMENT_MAX_BYTES)} 限制`
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
  const match = String(text || "").match(/(?:案件編號|案件號碼|案號|編號|case\s*id|case|案件)\s*[：:#=]?\s*([A-Za-z0-9][A-Za-z0-9_.-]{2,80})/i)
    || String(text || "").match(/\b(OCR[-_A-Za-z0-9]{4,80})\b/i);
  return match ? match[1].replace(/[，。；;、)）\]】>》"'「」]+$/g, "") : "";
}

function extractCaseIdFromOcrContext(context) {
  const fields = context?.fields || {};
  const mapping = context?.mapping || {};
  return String(fields.caseId || fields.sourceFile || mapping["案件編號"] || mapping.source_file || "").trim();
}

function scoreKnowledge(query, item) {
  const text = normalizeText(query);
  if (!text) return 0;
  return item.keywords.reduce((score, keyword) => {
    const normalized = normalizeText(keyword);
    if (!normalized) return score;
    return score + (text.includes(normalized) ? normalized.length + 2 : 0);
  }, 0);
}

function findAnswer(message) {
  const ranked = KNOWLEDGE
    .map((item) => ({ item, score: scoreKnowledge(message, item) }))
    .sort((a, b) => b.score - a.score);
  const best = ranked[0];
  if (!best || best.score <= 0) {
    return {
      title: "估價系統使用協助",
      lines: [
        "申請貸款麻煩留一下聯絡方式，收到您的訊息會儘速回覆您。"
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
    createdAt: new Date().toISOString()
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

  const createdAt = item.createdAt || new Date().toISOString();
  const remoteTime = new Date(createdAt).getTime();
  if (localLatestTime && Number.isFinite(remoteTime) && remoteTime + 1000 < localLatestTime) {
    return null;
  }

  if (source === "telegram" && direction === "inbound") {
    return {
      id,
      role: "assistant",
      content: text,
      meta: "Telegram 客服",
      createdAt,
      remoteSource: source
    };
  }

  if (source === "line" && direction === "inbound") {
    return {
      id,
      role: "assistant",
      content: text,
      meta: "LINE 客服",
      createdAt,
      remoteSource: source
    };
  }

  return null;
}

function formatSupportTime(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "未記錄";
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
  const seen = new Set();
  [...(primary || []), ...(secondary || [])].forEach((item) => {
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
  const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : 5000;
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
        ...(options.headers || {})
      }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `客服後端 HTTP ${response.status}`);
    return data;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(`客服後端逾時（${Math.round(timeoutMs / 1000)} 秒）`);
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
        meta: payload.ok ? "MiniMax M3 客服" : "本機客服備援"
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
  if (/missingApiKey:minimax/.test(text)) return "尚未設定 MiniMax API Key";
  if (/timed?\s*out|timeout|逾時/i.test(text)) return "M3 回應逾時";
  if (/RESOURCE_EXHAUSTED|quota|rate/i.test(text)) return "M3 額度或頻率限制已達上限";
  if (/abort/i.test(text)) return "請求已中止";
  return truncateText(text, 180);
}

function summarizeMinimaxItem(item, index) {
  if (typeof item === "string") return `項目 ${index + 1}：${truncateText(item, 260)}`;
  if (!item || typeof item !== "object") return `項目 ${index + 1}：${truncateText(JSON.stringify(item), 260)}`;
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
    category: "分類",
    field: "欄位",
    issue: "問題",
    risk: "風險",
    reason: "原因",
    suggestion: "建議",
    fix: "修正",
    task: "任務",
    expected: "預期",
    priority: "優先"
  };
  const parts = preferredKeys
    .filter((key) => item[key] != null && item[key] !== "")
    .map((key) => `${labels[key] || key}：${truncateText(item[key], 120)}`);
  if (parts.length) return parts.join("；");
  return truncateText(JSON.stringify(item), 260);
}

function renderMinimaxAdminResult(kind, payload) {
  const data = payload && typeof payload === "object" ? payload : {};
  const list = kind === "regression_task"
    ? (Array.isArray(data.tasks) ? data.tasks : [])
    : (Array.isArray(data.items) ? data.items : []);
  const warnings = Array.isArray(data.warnings) ? data.warnings.map(formatMinimaxReason).filter(Boolean) : [];
  const fallbackReason = formatMinimaxReason(data.fallbackReason || data.error || "");
  const title = kind === "regression_task" ? "M3 修正任務" : "M3 錯案分析";
  const status = data.ok
    ? "M3 已完成分析"
    : `M3 未完成，暫採後台本機資料${fallbackReason ? `：${fallbackReason}` : ""}`;
  const listHtml = list.length
    ? list.slice(0, 12).map((item, index) => `
      <li>${escapeHtml(summarizeMinimaxItem(item, index))}</li>
    `).join("")
    : `<li>${data.ok ? "M3 未列出需處理項目。" : "可稍後重試，或先依目前欄位診斷人工複核。"}</li>`;
  const warningHtml = warnings.length
    ? `<p class="support-admin-m3-warning">提醒：${escapeHtml(warnings.slice(0, 3).join("；"))}</p>`
    : "";
  return `
    <article class="support-admin-card support-admin-m3-result">
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(status)}${data.model ? ` · ${escapeHtml(data.model)}` : ""}</span>
      <ul>${listHtml}</ul>
      ${warningHtml}
    </article>
  `;
}

function summarizeMinimaxAudit(log, index) {
  if (!log || typeof log !== "object") return `紀錄 ${index + 1}：格式不完整`;
  const payload = log.payload && typeof log.payload === "object" ? log.payload : {};
  const request = payload.request && typeof payload.request === "object" ? payload.request : {};
  const kind = log.kind || "audit";
  const status = payload.status ? `狀態：${payload.status}` : "";
  const reason = formatMinimaxReason(payload.reason || payload.fallbackReason || "");
  const requestKeys = Object.keys(request).slice(0, 5).join("、");
  return [
    `${kind} · ${formatSupportTime(log.createdAt)}`,
    status,
    reason ? `原因：${reason}` : "",
    requestKeys ? `資料：${requestKeys}` : ""
  ].filter(Boolean).join("；");
}

function renderMinimaxAuditResult(payload) {
  const data = payload && typeof payload === "object" ? payload : {};
  const logs = Array.isArray(data.logs) ? data.logs : [];
  const summary = data.summary && typeof data.summary === "object" ? data.summary : {};
  const byKind = summary.byKind && typeof summary.byKind === "object"
    ? Object.entries(summary.byKind).map(([key, value]) => `${key} ${value}`).join("、")
    : "";
  const byStatus = summary.byStatus && typeof summary.byStatus === "object"
    ? Object.entries(summary.byStatus).map(([key, value]) => `${key} ${value}`).join("、")
    : "";
  const errors = summary.errorReasons && typeof summary.errorReasons === "object"
    ? Object.entries(summary.errorReasons).slice(0, 3).map(([key, value]) => `${formatMinimaxReason(key)} ${value}`).join("、")
    : "";
  const summaryHtml = `
    <p class="support-admin-m3-warning">
      統計：掃描 ${escapeHtml(summary.totalScanned ?? logs.length)} 筆；狀態 ${escapeHtml(byStatus || "無")}；類型 ${escapeHtml(byKind || "無")}${errors ? `；常見原因 ${escapeHtml(errors)}` : ""}
    </p>
  `;
  const listHtml = logs.length
    ? logs.slice(0, 20).map((log, index) => `<li>${escapeHtml(summarizeMinimaxAudit(log, index))}</li>`).join("")
    : "<li>目前尚無 M3 決策紀錄。</li>";
  return `
    <article class="support-admin-card support-admin-m3-result">
      <strong>M3 決策紀錄</strong>
      <span>最近 ${logs.length} 筆，可用於回放與人工審查</span>
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
      fileName: "OCR 附件",
      mimeType: "",
      size: 0,
      skipped: true,
      reason: error?.message || "附件讀取失敗"
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
  const root = document.createElement("section");
  root.id = "supportWidget";
  root.className = "support-widget";
  root.setAttribute("aria-label", "估價系統智能客服");
  root.innerHTML = `
    <div class="support-launch-row">
      <button id="supportAdminToggle" class="support-admin-toggle" type="button" aria-expanded="false" aria-controls="supportAdminPanel">客服後台</button>
      <button id="supportChatToggle" class="support-toggle" type="button" aria-expanded="false" aria-controls="supportChatPanel">
        <span class="support-toggle-mark" aria-hidden="true">?</span>
        <span>智能客服</span>
      </button>
    </div>
    <div id="supportAdminPanel" class="support-admin-panel" role="dialog" aria-modal="false" aria-labelledby="supportAdminTitle">
      <div class="support-admin-head">
        <div>
          <h2 id="supportAdminTitle">智能客服後台</h2>
          <p>客服紀錄、M3 錯案分析與知識庫檢視</p>
        </div>
        <button id="supportAdminCloseBtn" class="support-icon-btn" type="button" aria-label="關閉客服後台">×</button>
      </div>
      <div class="support-admin-body">
        <div id="supportAdminSummary" class="support-admin-summary"></div>
        <section class="support-admin-section">
          <h3>通知設定</h3>
          <div id="supportAdminNotify" class="support-admin-list support-admin-notify-list"></div>
        </section>
        <section class="support-admin-section support-admin-m3-section">
          <h3>MiniMax M3 中樞</h3>
          <div class="support-admin-m3-actions">
            <button id="supportAdminM3ReviewBtn" class="support-secondary-btn" type="button">M3 錯案分析</button>
            <button id="supportAdminM3RegressionBtn" class="support-secondary-btn" type="button">產生修正任務</button>
            <button id="supportAdminM3AuditBtn" class="support-ghost-btn" type="button">最近決策紀錄</button>
          </div>
          <div id="supportAdminM3Report" class="support-admin-list support-admin-m3-report">
            <div class="support-admin-empty">尚未產生 M3 管理報告。</div>
          </div>
        </section>
        <section class="support-admin-section">
          <h3>人工協助紀錄</h3>
          <div id="supportAdminIntakes" class="support-admin-list"></div>
        </section>
        <section class="support-admin-section">
          <h3>最近對話</h3>
          <div id="supportAdminHistory" class="support-admin-list"></div>
        </section>
        <section class="support-admin-section">
          <h3>知識庫主題</h3>
          <div id="supportAdminKnowledge" class="support-admin-list"></div>
        </section>
        <div class="support-admin-actions">
          <button id="supportAdminRefreshBtn" class="support-ghost-btn" type="button">重新整理</button>
          <button id="supportAdminExportBtn" class="support-secondary-btn" type="button">匯出 JSON</button>
          <button id="supportAdminClearIntakesBtn" class="support-ghost-btn" type="button">清空留單</button>
        </div>
      </div>
    </div>
    <div id="supportChatPanel" class="support-panel" role="dialog" aria-modal="false" aria-labelledby="supportChatTitle">
      <div class="support-head">
        <div>
          <h2 id="supportChatTitle">估價系統智能客服</h2>
          <p>謄本 OCR、欄位診斷、比較案例排序與試算協助</p>
        </div>
        <button id="supportCloseBtn" class="support-icon-btn" type="button" aria-label="關閉智能客服">×</button>
      </div>
      <div id="supportMessages" class="support-messages" aria-live="polite"></div>
      <div class="support-quick-row">
        ${QUICK_ACTIONS.map((item) => `<button type="button" class="support-chip" data-support-fill="${escapeHtml(item.text)}">${escapeHtml(item.label)}</button>`).join("")}
      </div>
      <form id="supportChatForm" class="support-composer">
        <textarea id="supportChatInput" rows="2" maxlength="800" placeholder="輸入問題，例如：排序分數怎麼算？"></textarea>
        <button id="supportSendBtn" type="submit">送出</button>
      </form>
      <div class="support-handoff">
        <button id="supportHandoffBtn" class="support-secondary-btn" type="button">人工協助</button>
        <button id="supportClearBtn" class="support-ghost-btn" type="button">清空對話</button>
      </div>
      <form id="supportLeadForm" class="support-lead-form is-hidden">
        <label>稱呼<input id="supportLeadName" autocomplete="name"></label>
        <label>聯絡方式<input id="supportLeadContact" autocomplete="email tel" placeholder="電話 / Email / LINE"></label>
        <label>問題描述<textarea id="supportLeadNote" rows="3"></textarea></label>
        <button id="supportLeadSubmit" type="submit">建立客服紀錄</button>
        <div id="supportLeadStatus" class="support-lead-status" aria-live="polite"></div>
      </form>
    </div>
  `;
  document.body.append(root);
  return root;
}

function supportWidget() {
  let messages = readJson(HISTORY_KEY, []);
  if (!Array.isArray(messages) || !messages.length) {
    messages = [createMessage(
      "assistant",
      "您好，我是估價系統智能客服。申請貸款麻煩留一下聯絡方式，收到您的訊息會儘速回覆您。",
      "本機客服"
    )];
  }

  const root = createWidgetShell();
  const panel = root.querySelector("#supportChatPanel");
  const toggle = root.querySelector("#supportChatToggle");
  const closeBtn = root.querySelector("#supportCloseBtn");
  const adminPanel = root.querySelector("#supportAdminPanel");
  const adminToggle = root.querySelector("#supportAdminToggle");
  const adminCloseBtn = root.querySelector("#supportAdminCloseBtn");
  const adminSummary = root.querySelector("#supportAdminSummary");
  const adminNotify = root.querySelector("#supportAdminNotify");
  const adminM3Report = root.querySelector("#supportAdminM3Report");
  const adminM3ReviewBtn = root.querySelector("#supportAdminM3ReviewBtn");
  const adminM3RegressionBtn = root.querySelector("#supportAdminM3RegressionBtn");
  const adminM3AuditBtn = root.querySelector("#supportAdminM3AuditBtn");
  const adminIntakes = root.querySelector("#supportAdminIntakes");
  const adminHistory = root.querySelector("#supportAdminHistory");
  const adminKnowledge = root.querySelector("#supportAdminKnowledge");
  const messagesEl = root.querySelector("#supportMessages");
  const form = root.querySelector("#supportChatForm");
  const input = root.querySelector("#supportChatInput");
  const leadForm = root.querySelector("#supportLeadForm");
  const leadStatus = root.querySelector("#supportLeadStatus");
  let remoteMessageSeenIds = readStringSet(REMOTE_MESSAGE_SEEN_KEY);
  let remoteMessageSyncing = false;

  function saveMessages() {
    writeJson(HISTORY_KEY, messages.slice(-40));
  }

  function renderMessages() {
    messagesEl.innerHTML = messages.map((message) => {
      const role = message.role === "user" ? "user" : "assistant";
      const meta = message.meta ? `<div class="support-message-meta">${escapeHtml(message.meta)}</div>` : "";
      return `<div class="support-message ${role}"><div class="support-bubble">${escapeHtml(message.content)}</div>${meta}</div>`;
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
        if (options.baselineOnly && (!localLatestTime || remoteTime <= localLatestTime + 1000)) return;
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
      fields.propertyAddress ? `門牌：${fields.propertyAddress}` : "",
      fields.mainArea ? `主建物：${fields.mainArea}` : "",
      fields.attachArea ? `附屬：${fields.attachArea}` : "",
      fields.commonArea ? `共有：${fields.commonArea}` : "",
      fields.parkingArea ? `車位：${fields.parkingArea}` : "",
      fields.buildingType ? `型態：${fields.buildingType}` : "",
      fields.purpose ? `用途：${fields.purpose}` : "",
      fields.avgUnitPrice ? `每坪單價：${fields.avgUnitPrice}` : "",
      fields.houseValue ? `房屋價值：${fields.houseValue}` : ""
    ].filter(Boolean);
    return pieces.length ? `<p class="support-admin-ocr">OCR：${escapeHtml(pieces.join(" / "))}</p>` : "";
  }

  function renderRelatedMessageSummary(item) {
    const related = Array.isArray(item?.relatedMessages) ? item.relatedMessages : [];
    const text = related
      .slice(-3)
      .map((message) => message.content || message.text || "")
      .filter(Boolean)
      .map((message) => truncateText(message, 80))
      .join(" / ");
    return text ? `<p class="support-admin-chat">對話：${escapeHtml(text)}</p>` : "";
  }

  function renderAttachmentLinks(item) {
    const attachments = Array.isArray(item?.attachments) ? item.attachments : [];
    const links = attachments.filter((attachment) => attachment?.fileName && attachment?.url && !attachment.skipped);
    const skipped = attachments.filter((attachment) => attachment?.skipped && attachment?.fileName);
    const linkHtml = links.map((attachment) => `
      <a class="support-admin-attachment" href="${escapeHtml(attachment.url)}" target="_blank" rel="noopener">
        查看原始檔：${escapeHtml(attachment.fileName)}（${escapeHtml(formatAttachmentSize(attachment.size))}）
      </a>
    `).join("");
    const skippedHtml = skipped.map((attachment) => `
      <span class="support-admin-attachment is-skipped">
        ${escapeHtml(attachment.fileName)}：${escapeHtml(attachment.reason || "未保存")}
      </span>
    `).join("");
    return linkHtml || skippedHtml
      ? `<div class="support-admin-attachments">${linkHtml}${skippedHtml}</div>`
      : "";
  }

  function renderAdminNotificationStatus(snapshot) {
    const status = snapshot.backend.status || {};
    const storage = status.storage || {};
    const telegram = status.telegram || {};
    const line = status.line || {};
    const localMode = snapshot.backend.available ? "" : "後端未連線，使用本機暫存。";
    return `
      <article class="support-admin-card support-admin-topic">
        <strong>後端保存</strong>
        <span>${snapshot.backend.available ? "已連線" : "未連線"}${storage.type ? ` · ${escapeHtml(storage.type)}` : ""}</span>
        <p>${escapeHtml(storage.available ? "資料庫可用，留單與對話可同步保存。" : (localMode || "後端狀態未回報。"))}</p>
      </article>
      <article class="support-admin-card support-admin-topic">
        <strong>Telegram</strong>
        <span>${telegram.configured ? "已設定，可推送通知" : "未完整設定"}</span>
        <p>Bot Token：${telegram.botToken ? "已設定" : "未設定"} / Chat ID：${telegram.chatId ? "已設定" : "未設定"} / Webhook Secret：${telegram.webhookSecret ? "已設定" : "未設定"}</p>
      </article>
      <article class="support-admin-card support-admin-topic">
        <strong>LINE</strong>
        <span>${line.configured || line.pushConfigured ? "已設定" : "未設定"}</span>
        <p>Channel Token：${line.channelAccessToken ? "已設定" : "未設定"} / Channel Secret：${line.channelSecret ? "已設定" : "未設定"} / Push Target：${line.pushTarget ? "已設定" : "未設定"}</p>
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
      generatedAt: new Date().toISOString(),
      ocrContext,
      summary: {
        intakeCount: snapshot.intakes.length,
        historyCount: snapshot.history.length,
        backendAvailable: !!snapshot.backend.available,
        backendStatus: snapshot.backend.status || {},
        currentCaseHasOcrData: !!ocrContext.hasData
      },
      recentIssues: snapshot.history
        .filter((item) => issueKeywords.test(item?.content || item?.text || item?.note || ""))
        .slice(-12)
        .map(compactAdminRecord),
      intakes: snapshot.intakes.slice(-12).map(compactAdminRecord),
      history: snapshot.history.slice(-16).map(compactAdminRecord),
      knowledgeTopics: snapshot.knowledge.map((item) => ({ id: item.id, title: item.title }))
    };
  }

  async function requestMinimaxAdminAction(kind) {
    const endpoint = kind === "regression_task"
      ? "/api/minimax/regression-task"
      : "/api/minimax/admin-review";
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
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
    buttons.forEach((button) => { button.disabled = true; });
    adminM3Report.innerHTML = `<div class="support-admin-empty">M3 分析中，請稍候...</div>`;
    try {
      const payload = await requestMinimaxAdminAction(kind);
      adminM3Report.innerHTML = renderMinimaxAdminResult(kind, payload);
    } catch (error) {
      adminM3Report.innerHTML = renderMinimaxAdminResult(kind, {
        ok: false,
        fallbackReason: error?.name === "AbortError" ? "M3 回應逾時" : (error?.message || String(error))
      });
    } finally {
      buttons.forEach((button) => { button.disabled = false; });
    }
  }

  async function runMinimaxAuditView() {
    const buttons = [adminM3ReviewBtn, adminM3RegressionBtn, adminM3AuditBtn].filter(Boolean);
    buttons.forEach((button) => { button.disabled = true; });
    adminM3Report.innerHTML = `<div class="support-admin-empty">正在讀取 M3 決策紀錄...</div>`;
    try {
      const payload = await requestMinimaxAuditLogs();
      adminM3Report.innerHTML = renderMinimaxAuditResult(payload);
    } catch (error) {
      adminM3Report.innerHTML = renderMinimaxAdminResult("admin_review", {
        ok: false,
        fallbackReason: error?.message || String(error)
      });
    } finally {
      buttons.forEach((button) => { button.disabled = false; });
    }
  }

  function renderAdmin() {
    const snapshot = supportDataSnapshot();
    const telegramReady = snapshot.backend.status?.telegram?.configured;
    const lineReady = snapshot.backend.status?.line?.configured || snapshot.backend.status?.line?.pushConfigured;
    const notifyCount = [telegramReady, lineReady].filter(Boolean).length;
    adminSummary.innerHTML = `
      <div><strong>${snapshot.intakes.length}</strong><span>留單</span></div>
      <div><strong>${snapshot.history.length}</strong><span>對話訊息</span></div>
      <div><strong>${notifyCount}</strong><span>通知通道</span></div>
    `;
    adminNotify.innerHTML = renderAdminNotificationStatus(snapshot);
    adminIntakes.innerHTML = snapshot.intakes.length
      ? snapshot.intakes.slice().reverse().map((item) => `
        <article class="support-admin-card">
          <strong>${escapeHtml(item.name || "未填稱呼")}</strong>
          ${item.caseId ? `<span>案件：${escapeHtml(item.caseId)}</span>` : ""}
          <span>${escapeHtml(item.contact || "未填聯絡方式")} · ${escapeHtml(formatSupportTime(item.createdAt))}</span>
          <p>${escapeHtml(item.note || "未填問題描述")}</p>
          ${renderOcrIntakeSummary(item)}
          ${renderRelatedMessageSummary(item)}
          ${renderAttachmentLinks(item)}
          <small>${escapeHtml(item.id || "")}</small>
        </article>
      `).join("")
      : `<div class="support-admin-empty">目前尚無人工協助紀錄。</div>`;
    adminHistory.innerHTML = snapshot.history.length
      ? snapshot.history.slice(-8).reverse().map((item) => `
        <article class="support-admin-card">
          <strong>${item.role === "user" ? "使用者" : "客服"}</strong>
          <span>${escapeHtml(item.meta || item.source || "本機對話")} · ${escapeHtml(formatSupportTime(item.createdAt))}</span>
          <p>${escapeHtml(item.content || item.text || "")}</p>
          ${renderAttachmentLinks(item)}
        </article>
      `).join("")
      : `<div class="support-admin-empty">目前尚無對話紀錄。</div>`;
    adminKnowledge.innerHTML = snapshot.knowledge.map((item) => `
      <article class="support-admin-card support-admin-topic">
        <strong>${escapeHtml(item.title)}</strong>
        <span>${escapeHtml(item.id)} · ${item.keywords.length} 個關鍵字</span>
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
    const filePreview = isOcrCaseQueryText(text, ocrContext)
      ? attachmentPreviewText(selectedOcrFileMeta())
      : "";
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
      root.querySelector("#supportLeadNote").value = text;
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
    const name = root.querySelector("#supportLeadName").value.trim();
    const contact = root.querySelector("#supportLeadContact").value.trim();
    const note = root.querySelector("#supportLeadNote").value.trim();
    const intakes = readJson(INTAKES_KEY, []);
    const ocrContext = collectOcrContextSnapshot();
    let attachmentPayloads = [];
    try {
      attachmentPayloads = await buildOcrAttachmentPayloads(note || "OCR 案件人工留單", ocrContext, { force: !!ocrContext.hasData });
    } catch (error) {
      attachmentPayloads = [{
        fileName: "OCR 附件",
        mimeType: "",
        size: 0,
        skipped: true,
        reason: error?.message || "附件讀取失敗"
      }];
    }
    const attachmentMeta = stripAttachmentPayloadData(attachmentPayloads);
    const record = {
      id: `support-${Date.now().toString(36)}`,
      source: "web",
      name,
      contact,
      note,
      createdAt: new Date().toISOString(),
      caseId: extractCaseIdFromText(note) || extractCaseIdFromOcrContext(ocrContext),
      ocrContext,
      lastMessages: messages.slice(-8),
      relatedMessages: messages.slice(-8),
      attachments: attachmentMeta
    };
    writeJson(INTAKES_KEY, Array.isArray(intakes) ? [...intakes, record].slice(-30) : [record]);
    leadStatus.textContent = `已建立客服紀錄，正在同步後端：${record.id}`;
    const backendResult = await syncIntakeToBackend(record, { attachments: attachmentPayloads });
    const synced = backendResult.status === "ok";
    const notifyResults = backendResult.notifyResults || backendResult.record?.notifyResults || [];
    const notifyText = notifyResults
      .filter((item) => item.provider && !item.skipped)
      .map((item) => item.provider)
      .join("、");
    leadStatus.textContent = synced
      ? `已建立後端紀錄：${record.id}${notifyText ? `，已通知 ${notifyText}` : ""}`
      : `已建立本機暫存紀錄：${record.id}；後端同步稍後可重試`;
    messages.push(createMessage(
      "assistant",
      synced
        ? "已建立後端客服紀錄。若已設定 Telegram 或 LINE，系統會同步推送通知。"
        : "已建立本機客服紀錄；目前後端或通知通道未連線，仍可在本機後台查看。",
      "人工協助"
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
  root.querySelector("#supportAdminRefreshBtn").addEventListener("click", renderAdmin);
  root.querySelector("#supportAdminExportBtn").addEventListener("click", () => {
    downloadJson(`found-support-${new Date().toISOString().slice(0, 10)}.json`, {
      exportedAt: new Date().toISOString(),
      ...supportDataSnapshot()
    });
  });
  root.querySelector("#supportAdminClearIntakesBtn").addEventListener("click", () => {
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
  root.querySelectorAll("[data-support-fill]").forEach((button) => {
    button.addEventListener("click", () => {
      const text = button.getAttribute("data-support-fill") || "";
      input.value = text;
      sendMessage(text);
      setOpen(true);
    });
  });
  root.querySelector("#supportHandoffBtn").addEventListener("click", () => {
    leadForm.classList.toggle("is-hidden");
    setOpen(true);
  });
  root.querySelector("#supportClearBtn").addEventListener("click", () => {
    messages = [createMessage("assistant", "對話已清空。請告訴我您要查詢 OCR、估價排序、償債能力或土地增值稅哪一部分。", "本機客服")];
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
