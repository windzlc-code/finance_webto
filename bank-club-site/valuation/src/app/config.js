export const ocrConfig = Object.freeze({
  usePaddleOcr: true,
  paddleEndpoint: "http://127.0.0.1:8001/ocr/deed",
  paddleDiagnosticsEndpoint: "http://127.0.0.1:8001/api/ocr/health",
  paddleTimeoutMs: 90000,
  paddlePdfTimeoutMs: 30000,
  paddlePdfMaxPages: 5,
  paddlePdfDpi: 180,
  paddlePdfFastMode: true,
  enableBrowserPdfOcrFallback: false,
  skipPdfBrowserParseAfterPaddle: true,
  pdfQuickTextTimeoutMs: 15000,
  skipAllPdfOcr: false
});

export const officialSearchConfig = Object.freeze({
  tokenTimeoutMs: 12000,
  queryTimeoutMs: 20000,
  detailTimeoutMs: 15000,
  retryBaseDelayMs: 500,
  maxAttempts: 2,
  totalTimeoutMs: 45000,
  autoTotalTimeoutMs: 30000,
  minRowsBeforeStop: 3,
  maxExpandSpanYears: 3
});

export const mainPurposeOptions = Object.freeze([
  "住家用",
  "商業用",
  "工業用",
  "農業用",
  "辦公用",
  "住商用",
  "住工用",
  "住辦用",
  "工商用",
  "商辦用",
  "住商辦用",
  "工商辦用",
  "其他"
]);

export const specialRemarkFilters = Object.freeze([
  { id: "special_relation", label: "親友、員工、共有人或其他特殊關係間之交易", keywords: ["親友", "員工", "共有人", "特殊關係", "二親等", "三親等", "關係人", "關係間"] },
  { id: "unfinished", label: "毛胚屋", keywords: ["毛胚", "毛坯"] },
  { id: "superficies", label: "地上權房屋", keywords: ["地上權"] },
  { id: "public_reserved", label: "(包含)公共設施保留地(用地)", keywords: ["公共設施保留地", "公共設施保留用地", "公設保留地"] },
  { id: "has_note", label: "有備註", keywords: [] },
  { id: "has_elevator", label: "有電梯", keywords: [] },
  { id: "has_management", label: "有管理組織", keywords: [] }
]);

export const specialRemarkFilterById = new Map(specialRemarkFilters.map((filter) => [filter.id, filter]));
