export function createOcrRuntime({
  runOcr,
  tryPaddleOcr,
  extractPdfTextLayer,
  ocrPdfFile,
  ocrImageSource,
  refreshPaddleOcrStatusMessage
}) {
  return {
    runOcr,
    tryPaddleOcr,
    extractPdfTextLayer,
    ocrPdfFile,
    ocrImageSource,
    refreshPaddleOcrStatusMessage
  };
}

export function initialBackendOcrAttempt(file, {
  backendEnabled = true,
  isPdfFile = () => false
} = {}) {
  if (!backendEnabled || !file) return { shouldAttempt: false, reason: "" };
  if (isPdfFile(file)) return { shouldAttempt: true, reason: "" };
  return {
    shouldAttempt: true,
    reason: "圖片 OCR 使用 ppocrv5_ncnn 第一順位；辨識不足時先用 YOLO/紅框 ROI 補強，ROI 無文字才改用隔離式 Docker PaddleOCR，最後才全頁 Docker 備援（Docker PaddleOCR 備援）。"
  };
}
