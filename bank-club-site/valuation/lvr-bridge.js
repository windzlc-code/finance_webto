(function () {
  const LOCAL_PROXY_PORTS = [5606, 5502, 5500, 5501];

  function bundleCandidates(fileName) {
    const isFileOrigin = window.location.protocol === "file:";
    const candidates = isFileOrigin ? [] : [fileName];
    const host = window.location.hostname || "127.0.0.1";
    const localHost = !host || ["localhost", "127.0.0.1", "::1"].includes(host);
    if (isFileOrigin || localHost) {
      for (const port of LOCAL_PROXY_PORTS) {
        candidates.push(`http://127.0.0.1:${port}/${fileName}`);
        candidates.push(`http://localhost:${port}/${fileName}`);
      }
    }
    return [...new Set(candidates)];
  }

  async function fetchTextWithFallback(fileName) {
    let lastError = null;
    for (const src of bundleCandidates(fileName)) {
      try {
        const response = await fetch(src, { cache: "no-store" });
        if (response.ok) return await response.text();
        lastError = new Error(`HTTP ${response.status} while loading ${src}`);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error(`Unable to load ${fileName}`);
  }

  async function loadCommonBundle() {
    if (
      window.common &&
      typeof window.common.getEncodeStr === "function" &&
      typeof window.common.getPathHash === "function"
    ) {
      return window.common;
    }

    const original = await fetchTextWithFallback("_lvr_common.bundle.js");
    const patched = original
      .replaceAll("window.location.host", '"lvr.land.moi.gov.tw"')
      .replaceAll("window.location.hostname", '"lvr.land.moi.gov.tw"')
      .replaceAll("window.location.origin", '"https://lvr.land.moi.gov.tw"')
      .replaceAll("window.location.href", '"https://lvr.land.moi.gov.tw/R11/index.html"')
      .replaceAll("document.domain", '"lvr.land.moi.gov.tw"')
      .replace(
        'K.d(W,"getMd5word",function(){return I}),K.d(W,"getEncodeStr",function(){return E}),',
        'K.d(W,"getMd5word",function(){return I}),K.d(W,"getPathHash",function(){return J}),K.d(W,"getEncodeStr",function(){return E}),'
      )
      .replace(
        "function I(){return p}function E(t){var e=d.parse(c.encrypt(JSON.stringify(t),g).toString());return u.stringify(e)}",
        'function I(){return p}function J(t){return f("string"==typeof t?t:JSON.stringify(t))}function E(t){var e=d.parse(c.encrypt(JSON.stringify(t),g).toString());return u.stringify(e)}'
      );
    (0, eval)(patched);

    if (
      !window.common ||
      typeof window.common.getEncodeStr !== "function" ||
      typeof window.common.getPathHash !== "function"
    ) {
      throw new Error("Official query helpers are not available after loading bundle.");
    }

    return window.common;
  }

  window.lvrCommonReady = loadCommonBundle();
})();
