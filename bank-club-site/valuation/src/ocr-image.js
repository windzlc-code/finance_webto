import { setOcrProgress } from "./ui/progress.js";
import { ocrConfig } from "./app/config.js";
import { checkBackendOcrHealth, markBackendOcrUnavailable } from "./constants.js";

function foundOcrRoot() {
  return window.FoundOcr || null;
}

/** 影像 OCR 前自動去歪斜：以水平投影變異數掃描角度，再旋轉補正（不另引套件） */
const OCR_DESKEW_MAX_DEG = 14;
const OCR_DESKEW_STEP_COARSE = 0.75;
const OCR_DESKEW_STEP_FINE = 0.1;
const OCR_DESKEW_MIN_SIDE = 48;
const OCR_DESKEW_APPLY_MIN_ABS_DEG = 0.28;
const OCR_DESKEW_ANALYSIS_MAX_SIDE = 240;
export function horizontalProjectionVarianceScore(ctx, w, h) {
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
export function binarizeCanvasForDeskewAnalysis(ctx, w, h) {
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
export function buildDownscaledBinaryForDeskew(sourceCanvas) {
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
export function estimateDeskewDegrees(sourceCanvas) {
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
    tcx.rotate((deg * Math.PI) / 180);
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
export function rotateCanvasByDegrees(sourceCanvas, deg) {
  if (!deg || Math.abs(deg) < 0.01) return sourceCanvas;
  const rad = (deg * Math.PI) / 180;
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
export function deskewCanvasForOcr(sourceCanvas) {
  const deg = estimateDeskewDegrees(sourceCanvas);
  if (!Number.isFinite(deg) || Math.abs(deg) < OCR_DESKEW_APPLY_MIN_ABS_DEG) return sourceCanvas;
  return rotateCanvasByDegrees(sourceCanvas, deg);
}
function canvasToBackendBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas 轉換 OCR 圖片失敗"));
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
  const root = foundOcrRoot();
  return root?.normalizeConfidence ? root.normalizeConfidence(raw) : raw / 100;
}

function backendOcrPreprocessModes(result) {
  return (result?.page_results || [])
    .map((page) => String(page?.preprocessMode || "").toLowerCase())
    .filter(Boolean);
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
    return isFieldLevel
      ? (sources.FIELD_LEVEL_RAPID_OCR_CLOUD_VISION || "fieldLevelRapidOcrCloudVision")
      : (sources.RAPID_OCR_CLOUD_VISION || "rapidOcrCloudVision");
  }
  if (isCloudVisionBackendResult(result)) {
    return isFieldLevel
      ? (sources.FIELD_LEVEL_CLOUD_VISION_OCR || "fieldLevelCloudVisionOcr")
      : (sources.CLOUD_VISION_OCR || "cloudVisionOcr");
  }
  if (isRapidBackendResult(result)) {
    return isFieldLevel
      ? (sources.FIELD_LEVEL_RAPID_OCR || "fieldLevelRapidOcr")
      : (sources.RAPID_OCR || "rapidOcr");
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
  const root = foundOcrRoot();
  if (!root || !detailed) return;
  root.lastBackendOcrSource = detailed.source || "";
  root.lastBackendOcrEngine = detailed.engine || "";
  root.lastBackendOcrModelVersion = detailed.modelVersion || "";
  root.lastBackendOcrElapsedMs = Number(detailed.elapsedMs) || 0;
  root.lastBackendOcrPages = Number(detailed.pages) || 0;
  root.lastBackendOcrCacheHit = detailed.cached === true;
  root.lastBackendOcrCacheKey = detailed.cacheKey || "";
}

function backendTextFromResult(result) {
  if (typeof result?.text === "string") return result.text;
  return (Array.isArray(result?.pages) ? result.pages : [])
    .map((page) => String(page?.text || "").trim())
    .filter(Boolean)
    .join("\n\n");
}

function backendConfidenceFromResult(result) {
  const direct = Number(result?.confidence);
  if (Number.isFinite(direct)) return direct;
  const values = (Array.isArray(result?.pages) ? result.pages : [])
    .map((page) => Number(page?.confidence))
    .filter(Number.isFinite);
  if (!values.length) return undefined;
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
    pages: Array.isArray(result?.pages) ? result.pages.length : (result?.pages || 1),
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
  const filename = options.fileName || (blob instanceof File && blob.name) || `ocr-source.${backendMimeForBlob(blob).includes("png") ? "png" : "jpg"}`;
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
    throw new Error(err.error || `後端 OCR 錯誤 HTTP ${response.status}`);
  }
  return response.json();
}

export async function ocrFileViaBackendDetailed(file, options = {}) {
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
    console.warn("[OCR] 後端 OCR 失敗，瀏覽器 Tesseract 已停用。", error);
    markBackendOcrUnavailable();
    return null;
  }
}

export async function ocrImageSourceDetailed(source, progressPrefix, options = {}) {
  const { focusTop = false, regionStart = null, regionEnd = null, ocrLayout = "fullPage" } = options;
  const root = foundOcrRoot();
  const normalizedRegion = root?.normalizeRegion ? root.normalizeRegion(options.region || options.bbox || null) : null;
  const ocrSourceName = options.source || "ocr_pipeline";
  const modelVersion = options.modelVersion || "ocr_pipeline";
  let fileHash = options.cacheFileHash || "";
  try {
    if (!fileHash && source instanceof Blob && root?.ocrCache?.hashBlob) fileHash = await root.ocrCache.hashBlob(source);
  } catch (_) {
    fileHash = "";
  }
  const cacheRegion = normalizedRegion || (Number.isFinite(regionStart) || Number.isFinite(regionEnd)
    ? { y: Number.isFinite(regionStart) ? regionStart : 0, h: Number.isFinite(regionEnd) && Number.isFinite(regionStart) ? Math.max(0.05, regionEnd - regionStart) : 0.62, layout: ocrLayout, label: progressPrefix || "" }
    : null);
  const cacheKey = fileHash && root?.ocrCache?.createCacheKey ? root.ocrCache.createCacheKey({
    fileHash,
    page: options.pageNumber || 1,
    dpi: options.dpi || "",
    region: cacheRegion,
    engine: options.engine || "ocr_pipeline",
    modelVersion
  }) : "";
  if (cacheKey && root?.ocrCache?.get) {
    try {
      const cached = await root.ocrCache.get(cacheKey);
      if (cached?.text != null) {
        const detailed = { ...cached, cached: true, cacheKey };
        rememberBackendOcrResult(detailed);
        return detailed;
      }
    } catch (_) {}
  }
  const isFullSourceImage = source instanceof Blob
    && !normalizedRegion
    && !focusTop
    && !(Number.isFinite(regionStart) && Number.isFinite(regionEnd));
  if (isFullSourceImage && options.directBackend !== false) {
    const backendResult = await (async () => {
      try {
        return await recognizeViaBackend(source, options);
      } catch (error) {
        console.warn("[OCR] 後端 OCR 失敗，瀏覽器 Tesseract 已停用。", error);
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
      if (cacheKey && root?.ocrCache?.set) {
        try { root.ocrCache.set(cacheKey, detailed); } catch (_) {}
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
      const sh = normalizedRegion ? Math.max(1, Math.round(baseCanvas.height * normalizedRegion.h)) : Math.max(1, Math.round(baseCanvas.height * (focusTop ? 0.62 : (fallbackEnd - (Number.isFinite(regionStart) ? Math.max(0, Math.min(0.95, regionStart)) : 0)))));
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
      reject(new Error("圖片前處理失敗"));
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
      console.warn("[OCR] 後端 OCR 失敗，瀏覽器 Tesseract 已停用。", error);
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
    if (cacheKey && root?.ocrCache?.set) {
      try { root.ocrCache.set(cacheKey, detailed); } catch (_) {}
    }
    rememberBackendOcrResult(detailed);
    return detailed;
  }
  throw new Error("OCR 後端未能完成辨識；瀏覽器 Tesseract 已停用，請確認 8001 OCR 後端可用，若需 Docker 補強再確認 8099 服務已啟動。");
}
export async function ocrImageSource(source, progressPrefix, options = {}) {
  const detailed = await ocrImageSourceDetailed(source, progressPrefix, options);
  return detailed?.text || "";
}
/** 建物謄本影本／PDF 第一頁：依縱向比例裁切六欄位，各欄獨立 PSM + whitelist */
export const DEED_FIELD_OCR_SPECS = [
  { label: "建號區", regionStart: 0.02, regionEnd: 0.22, layout: "fieldBuildingNo" },
  { label: "門牌區", regionStart: 0.16, regionEnd: 0.4, layout: "fieldDoorplate" },
  { label: "主要用途區", regionStart: 0.32, regionEnd: 0.48, layout: "fieldMainPurpose" },
  { label: "面積區", regionStart: 0.42, regionEnd: 0.7, layout: "fieldNumericArea" },
  { label: "共有部分區", regionStart: 0.62, regionEnd: 0.86, layout: "fieldCommonParts" },
  { label: "權利範圍區", regionStart: 0.74, regionEnd: 0.98, layout: "fieldRightsScope" }
];
export async function ocrDeedFieldLevelBlocksDetailed(source, progressPrefix = "", options = {}) {
  const chunks = [];
  const specs = foundOcrRoot()?.getDeedFieldSpecs?.() || DEED_FIELD_OCR_SPECS;
  const n = specs.length;
  let sharedFileHash = options.cacheFileHash || "";
  if (!sharedFileHash && source instanceof Blob) {
    try {
      const cache = foundOcrRoot()?.ocrCache;
      if (cache?.hashBlob) sharedFileHash = await cache.hashBlob(source);
    } catch (_) {
      sharedFileHash = "";
    }
  }
  setOcrProgress(34, `${progressPrefix}欄位 OCR 並行辨識 0/${n}`);
  let completed = 0;
  const details = await Promise.all(specs.map(async (spec, i) => {
    const detailed = await ocrImageSourceDetailed(source, `${progressPrefix}OCR ${spec.label}`, {
      region: spec,
      regionStart: spec.regionStart,
      regionEnd: spec.regionEnd,
      ocrLayout: spec.layout,
      cacheFileHash: sharedFileHash,
      pageNumber: spec.page || options.pageNumber || 1,
      dpi: options.dpi || ""
    });
    completed += 1;
    setOcrProgress(34 + Math.floor((42 * completed) / n), `${progressPrefix}欄位 OCR 已完成 ${completed}/${n}：${spec.label}`);
    return { ...detailed, label: spec.label, spec };
  }));
  for (const detailed of details) {
    const text = detailed?.text || "";
    if (text && String(text).trim()) chunks.push(text);
  }
  return { text: chunks.join("\n\n"), chunks: details };
}
export async function ocrDeedFieldLevelBlocks(source, progressPrefix = "", options = {}) {
  const detailed = await ocrDeedFieldLevelBlocksDetailed(source, progressPrefix, options);
  return detailed?.text || "";
}
