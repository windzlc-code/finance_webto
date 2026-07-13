(function () {
  const CACHE_PREFIX = "deedOcr:v1:";

  function cacheKey(fileHash, pageIndex, mode) {
    return `${CACHE_PREFIX}${fileHash}:${pageIndex}:${mode}`;
  }

  function readCache(key) {
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function writeCache(key, value) {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Session storage can be full; OCR should continue without cache.
    }
  }

  function canvasToBlob(canvas, type = "image/jpeg", quality = 0.92) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas 轉換 OCR 圖片失敗"));
      }, type, quality);
    });
  }

  function imageToCanvas(image, maxSide = 2600) {
    const width = image.naturalWidth || image.videoWidth || image.width || 0;
    const height = image.naturalHeight || image.videoHeight || image.height || 0;
    if (!width || !height) throw new Error("圖片尺寸無法辨識");
    const scale = Math.min(1, maxSide / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext("2d", { alpha: false });
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas;
  }

  async function loadImageFromString(source) {
    if (/^data:|^blob:|^https?:|^\//i.test(String(source || ""))) {
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("圖片載入失敗"));
        image.src = source;
      });
    }
    throw new Error("不支援的 OCR 圖片來源");
  }

  async function sourceToBlob(source, options = {}) {
    if (source instanceof Blob) return source;
    if (source instanceof HTMLCanvasElement) return canvasToBlob(source);
    if (source instanceof HTMLImageElement) return canvasToBlob(imageToCanvas(source, options.maxSide || 2600));
    if (typeof source === "string") {
      if (/^data:|^blob:/i.test(source)) {
        const response = await fetch(source);
        if (!response.ok) throw new Error("圖片來源讀取失敗");
        return response.blob();
      }
      return canvasToBlob(imageToCanvas(await loadImageFromString(source), options.maxSide || 2600));
    }
    throw new Error("不支援的 OCR 圖片來源");
  }

  function textOnlyEndpoint() {
    const configured = window.FoundOcrConfig?.paddleEndpoint || window.FoundRuntimeConfig?.paddleEndpoint || "http://127.0.0.1:8001/ocr/deed";
    const endpoint = String(configured || "").trim() || "http://127.0.0.1:8001/ocr/deed";
    if (/\/ocr\/deed\/?$/i.test(endpoint)) return endpoint.replace(/\/ocr\/deed\/?$/i, "/ocr/deed/text-only");
    if (/\/ocr\/deed\/text-only\/?$/i.test(endpoint)) return endpoint.replace(/\/+$/, "");
    return `${endpoint.replace(/\/+$/, "")}/text-only`;
  }

  function normalizeConfidence(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return n <= 1 ? Math.round(n * 100) : n;
  }

  function boundedInteger(value, fallback, min) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.floor(n));
  }

  async function recognize(source, options = {}) {
    if (options.signal?.aborted) throw new DOMException("OCR 已取消", "AbortError");
    const blob = await sourceToBlob(source, options);
    const form = new FormData();
    const filename = options.fileName || (typeof File !== "undefined" && blob instanceof File && blob.name) || "ocr-source.jpg";
    form.append("file", blob, filename);
    form.append("max_pages", String(boundedInteger(options.maxPages, 5, 1)));
    form.append("dpi", String(boundedInteger(options.dpi, 180, 120)));
    form.append("fast", options.fast === false ? "false" : "true");
    const response = await fetch(textOnlyEndpoint(), {
      method: "POST",
      body: form,
      signal: options.signal
    });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `後端 OCR 錯誤 HTTP ${response.status}`);
    }
    const result = await response.json();
    return {
      text: result.text || (result.pages || []).map((page) => page.text || "").filter(Boolean).join("\n\n"),
      confidence: normalizeConfidence(result.confidence),
      bbox: result.blocks || result.words || [],
      page: options.page || 1,
      sourceType: "ocrBackend",
      preprocessMode: result.ocr_engine_used || result.ocr_engine || result.engine || "ocr_pipeline",
      elapsedMs: Number(result.elapsed_ms || 0),
      raw: result
    };
  }

  async function recognizeCached(source, options = {}) {
    const key = options.cacheKey;
    if (key) {
      const cached = readCache(key);
      if (cached) return { ...cached, fromCache: true };
    }
    const result = await recognize(source, options);
    if (key) writeCache(key, result);
    return result;
  }

  function createAbortController() {
    return new AbortController();
  }

  window.OcrClient = {
    cacheKey,
    readCache,
    writeCache,
    recognize,
    recognizeCached,
    createAbortController
  };
})();
