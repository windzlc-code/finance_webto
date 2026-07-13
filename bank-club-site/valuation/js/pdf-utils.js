(function () {
  const DPI_MIN = 250;
  const DPI_MAX = 350;

  function choosePdfOcrDpi(page, mode = "auto") {
    const viewport = page.getViewport({ scale: 1 });
    const longSide = Math.max(viewport.width, viewport.height);
    if (mode === "smallText") return 350;
    if (longSide > 1000) return 250;
    if (longSide > 850) return 280;
    return 300;
  }

  function viewportScaleForDpi(dpi) {
    const safe = Math.min(DPI_MAX, Math.max(DPI_MIN, Number(dpi) || 300));
    return safe / 72;
  }

  async function fileHash(file) {
    const head = await file.slice(0, Math.min(file.size, 1024 * 1024)).arrayBuffer();
    const hash = await crypto.subtle.digest("SHA-256", head);
    return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  async function extractTextLayer(file) {
    const buffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: buffer }).promise;
    const pages = [];
    for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
      const page = await pdf.getPage(pageNo);
      const textContent = await page.getTextContent();
      pages.push({
        page: pageNo,
        sourceType: "textLayer",
        text: textContent.items.map((item) => item.str).join(" "),
        confidence: 1,
        bbox: null
      });
    }
    return { pdf, pages, text: pages.map((p) => p.text).join("\n") };
  }

  async function renderPageToCanvas(pdf, pageNo, options = {}) {
    const page = await pdf.getPage(pageNo);
    const dpi = options.dpi || choosePdfOcrDpi(page, options.mode);
    const viewport = page.getViewport({ scale: viewportScaleForDpi(dpi) });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { alpha: false });
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    return { canvas, page, dpi };
  }

  window.PdfUtils = {
    choosePdfOcrDpi,
    viewportScaleForDpi,
    fileHash,
    extractTextLayer,
    renderPageToCanvas
  };
})();
