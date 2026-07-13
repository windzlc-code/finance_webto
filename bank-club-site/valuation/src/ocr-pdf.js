import { PDF_BROWSER_OCR_MAX_PAGES, PDF_OCR_RASTER_DPI, pdfViewportScaleForOcr } from "./constants.js";
import { cleanOcrText } from "./utils.js";
import { setOcrProgress } from "./ui/progress.js";
import { ocrDeedFieldLevelBlocks, ocrFileViaBackendDetailed, ocrImageSource } from "./ocr-image.js";

function foundOcrRoot() {
  return window.FoundOcr || null;
}

export async function extractPdfTextLayerDetailed(file, options = {}) {
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
export async function extractPdfTextLayer(file, options = {}) {
  const detailed = await extractPdfTextLayerDetailed(file, options);
  return detailed?.text || "";
}
export function formatCaughtError(error) {
  if (error == null) return "未知錯誤";
  if (typeof error === "string") return error || "未知錯誤";
  if (error.message) return error.message;
  try {
    const json = JSON.stringify(error);
    if (json && json !== "{}") return json;
  } catch (_) {}
  return String(error) || "未知錯誤";
}
export async function ocrPdfFile(file, options = {}) {
  const maxPages = Math.max(1, Number(options.maxPages) || PDF_BROWSER_OCR_MAX_PAGES);
  const backendDetailed = await ocrFileViaBackendDetailed(file, options);
  if (backendDetailed?.text && cleanOcrText(backendDetailed.text).length > 20) return backendDetailed.text;
  let fileHash = options.cacheFileHash || "";
  try {
    const cache = foundOcrRoot()?.ocrCache;
    if (!fileHash && cache?.hashBlob) fileHash = await cache.hashBlob(file);
  } catch (_) {}
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
    const pageLabel = pageLimit < pdf.numPages ? `${pageNo}/${pageLimit}（全 ${pdf.numPages} 頁）` : `${pageNo}/${pdf.numPages}`;
    setOcrProgress(Math.round((pageNo - 1) / pageLimit * 100), `PDF 轉圖中 ${pageLabel}`);
    pages.push(await ocrImageSource(canvas, `PDF OCR 第 ${pageNo}/${pdf.numPages} 頁`, { ocrLayout: "fullPage", cacheFileHash: fileHash, pageNumber: pageNo, dpi: options.dpi || PDF_OCR_RASTER_DPI }));
  }
  return pages.join("\n");
}
/** 建物謄本 PDF：指定頁表頭＋建物標示部裁切 OCR，與圖片流程一致，補強縣市／行政區與標示部欄位 */
export async function ocrPdfFirstPageDeedBands(file, options = {}) {
  let fileHash = "";
  try {
    const cache = foundOcrRoot()?.ocrCache;
    if (cache?.hashBlob) fileHash = await cache.hashBlob(file);
  } catch (_) {}
  const buffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: buffer }).promise;
  const requestedPage = Math.max(1, Math.floor(Number(options.pageNumber) || 1));
  const pageNumber = Math.min(pdf.numPages, requestedPage);
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: pdfViewportScaleForOcr() });
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  await page.render({ canvasContext: ctx, viewport }).promise;
  const headerOcr = await ocrImageSource(canvas, `PDF OCR 第 ${pageNumber} 頁謄本上帶`, { regionStart: 0, regionEnd: 0.24, ocrLayout: "headerBand", cacheFileHash: fileHash, pageNumber, dpi: PDF_OCR_RASTER_DPI });
  const fieldText = await ocrDeedFieldLevelBlocks(canvas, `PDF 第 ${pageNumber} 頁 `, { cacheFileHash: fileHash, pageNumber, dpi: PDF_OCR_RASTER_DPI });
  return [headerOcr, fieldText].filter(Boolean).join("\n\n");
}
