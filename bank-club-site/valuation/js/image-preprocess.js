(function () {
  function cloneToCanvas(source) {
    const canvas = document.createElement("canvas");
    canvas.width = source.width || source.naturalWidth;
    canvas.height = source.height || source.naturalHeight;
    const ctx = canvas.getContext("2d", { alpha: false });
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    return canvas;
  }

  function resizeCanvas(source, maxSide = 2400) {
    const input = source instanceof HTMLCanvasElement ? source : cloneToCanvas(source);
    const longSide = Math.max(input.width, input.height);
    if (longSide <= maxSide) return input;
    const scale = maxSide / longSide;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(input.width * scale);
    canvas.height = Math.round(input.height * scale);
    canvas.getContext("2d", { alpha: false }).drawImage(input, 0, 0, canvas.width, canvas.height);
    return canvas;
  }

  function enhanceCanvas(source, mode = "normal") {
    const canvas = source instanceof HTMLCanvasElement ? source : cloneToCanvas(source);
    const ctx = canvas.getContext("2d", { alpha: false });
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = image.data;
    const contrast = mode === "highContrast" ? 1.45 : mode === "thresholdAlt" ? 1.25 : 1.15;
    const thresholdShift = mode === "thresholdAlt" ? -12 : 0;
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      let v = (gray - 128) * contrast + 128;
      if (mode === "thresholdAlt") v = v > 168 + thresholdShift ? 255 : 0;
      data[i] = data[i + 1] = data[i + 2] = Math.max(0, Math.min(255, v));
      data[i + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
    return canvas;
  }

  function preprocessForOcr(source, options = {}) {
    const maxSide = options.maxSide || 2600;
    const resized = resizeCanvas(source, maxSide);
    return enhanceCanvas(resized, options.mode || "normal");
  }

  window.ImagePreprocess = {
    cloneToCanvas,
    resizeCanvas,
    enhanceCanvas,
    preprocessForOcr
  };
})();
