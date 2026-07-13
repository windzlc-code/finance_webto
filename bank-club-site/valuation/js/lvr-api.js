(function () {
  const localHostnames = new Set(["", "localhost", "127.0.0.1", "::1"]);

  async function fetchTextWithTimeout(url, options = {}) {
    const timeoutMs = options.timeoutMs || 60000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      const text = await response.text();
      return { ok: response.ok, status: response.status, text };
    } finally {
      clearTimeout(timer);
    }
  }

  function extractApiErrorText(text) {
    if (!text) return "";
    try {
      const json = JSON.parse(text);
      return json.error || json.message || text;
    } catch {
      return text;
    }
  }

  async function fetchApiJson(url, options = {}) {
    const tryFetch = async (candidate) => {
      try {
        return await fetchTextWithTimeout(candidate, options);
      } catch (error) {
        return { ok: false, status: 0, text: error?.message || String(error || "Failed to fetch") };
      }
    };

    let result = await tryFetch(url);
    const isOfficialApi = typeof url === "string" && url.startsWith("/api/lvr/");
    const isFileOrigin = window.location.protocol === "file:";
    const isLocalOrigin = isFileOrigin || !window.location.hostname || localHostnames.has(window.location.hostname);
    const fallbackCandidates = [];
    const originPort = window.location.port || "";
    if (isOfficialApi) {
      const host = window.location.hostname || "127.0.0.1";
      const scheme = window.location.protocol || "http:";
      for (const proxyPort of [5606, 5502, 5500, 5501]) {
        if (String(proxyPort) === originPort) continue;
        if (isFileOrigin) {
          fallbackCandidates.push(`http://127.0.0.1:${proxyPort}${url}`);
          fallbackCandidates.push(`http://localhost:${proxyPort}${url}`);
        } else if (isLocalOrigin) {
          fallbackCandidates.push(`http://${host}:${proxyPort}${url}`);
          if (host === "localhost") fallbackCandidates.push(`http://127.0.0.1:${proxyPort}${url}`);
          else if (host === "127.0.0.1") fallbackCandidates.push(`http://localhost:${proxyPort}${url}`);
        } else {
          fallbackCandidates.push(`${scheme}//${host}:${proxyPort}${url}`);
        }
      }
    }

    for (const candidate of fallbackCandidates) {
      if (result.ok) break;
      result = await tryFetch(candidate);
    }

    if (!result.ok) {
      const apiErrorText = extractApiErrorText(result.text);
      if (isOfficialApi && result.status === 0) {
        const remoteHint = isLocalOrigin
          ? "請在專案目錄執行 python3 serve.py，並用其顯示的網址開啟（目前常用 http://127.0.0.1:5606/；舊腳本可用 5502/5500/5501，同埠含 /api/lvr）。"
          : `請確認 ${window.location.hostname} 上 5606、5502、5500 或 5501 已啟動代理，或網站已反向代理 /api/lvr/* 到查詢服務。`;
        throw new Error(`${apiErrorText || result.text || "Failed to fetch"}（通常不是地區條件，而是代理服務或網路連線問題；${remoteHint}）`);
      }
      if (isOfficialApi && (result.status === 501 || result.status === 405)) {
        throw new Error("官方查詢需 POST，但目前頁面是由不支援 POST 的靜態伺服器提供。請在專案目錄執行 python3 serve.py，並用它顯示的網址開啟；目前常用 http://127.0.0.1:5606/。");
      }
      throw new Error(apiErrorText || result.text || `HTTP ${result.status}`);
    }
    return result.text ? JSON.parse(result.text) : null;
  }

  async function loadScriptOnce(src) {
    if ([...document.scripts].some((s) => s.src && s.src.includes(src))) return;
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async function reloadOfficialBridge() {
    window.lvrCommonReady = null;
    await loadScriptOnce("lvr-bridge.js");
    if (window.lvrCommonReady) await window.lvrCommonReady;
  }

  window.LvrApi = { fetchApiJson, loadScriptOnce, reloadOfficialBridge };
})();
