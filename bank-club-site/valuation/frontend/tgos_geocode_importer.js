let tgosLoaded = false;
let tgosConfig = null;
let stopRequested = false;
let okCount = 0;
let failCount = 0;
const TGOS_LOCATE_TIMEOUT_MS = 12000;

function $(id) {
  return document.getElementById(id);
}

function value(id) {
  return $(id)?.value?.trim() || "";
}

function numberValue(id, fallback) {
  const parsed = Number(value(id));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function log(line) {
  const el = $("log");
  const now = new Date().toLocaleTimeString("zh-TW", { hour12: false });
  el.textContent += `\n[${now}] ${line}`;
  el.scrollTop = el.scrollHeight;
}

function message(text, tone = "warn") {
  const el = $("message");
  el.className = `msg ${tone}`;
  el.textContent = text;
}

async function getJson(url) {
  const response = await fetch(url);
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) throw new Error(data.error || data.message || `HTTP ${response.status}`);
  return data;
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) throw new Error(data.error || data.message || `HTTP ${response.status}`);
  return data;
}

async function loadTgos() {
  if (tgosLoaded) return true;
  const config = await getJson("/api/tgos/config");
  tgosConfig = config;
  const params = new URLSearchParams({ ver: "2", AppID: config.appId, APIKey: config.apiKey });
  const script = document.createElement("script");
  script.src = `${config.scriptBase.split("?")[0]}?${params.toString()}`;
  script.charset = "utf-8";
  document.head.appendChild(script);
  await new Promise((resolve, reject) => {
    script.onload = resolve;
    script.onerror = () => reject(new Error("TGOS script load failed"));
  });
  tgosLoaded = Boolean(window.TGOS);
  if (!tgosLoaded) throw new Error("TGOS object not found");
  if (!window.TGOS.TGLocateService) {
    throw new Error("目前載入的 TGOS 金鑰未提供 TGLocateService 地址定位服務");
  }
  message(`TGOS 已載入：${config.mode}`, "ok");
  log(`TGOS 已載入：${config.mode}`);
  return true;
}

function pendingQueryString() {
  const params = new URLSearchParams({ limit: String(numberValue("batchLimit", 20)) });
  if (value("cityFilter")) params.set("city", value("cityFilter"));
  if (value("districtFilter")) params.set("district", value("districtFilter"));
  return params.toString();
}

async function refreshPending() {
  const data = await getJson(`/api/real-price/geocode/pending?${pendingQueryString()}`);
  $("pendingCount").textContent = String(data.count || 0);
  log(`取得待定位 ${data.count || 0} 筆`);
  return data.items || [];
}

async function importPending() {
  const payload = {
    limit: numberValue("importLimit", 100),
    minSourceId: numberValue("minSourceId", 0),
    city: value("cityFilter"),
    district: value("districtFilter"),
    transactionType: value("transactionType"),
  };
  const data = await postJson("/api/real-price/import-from-open-data", payload);
  $("lastSourceId").textContent = String(data.lastSourceId || payload.minSourceId || 0);
  $("minSourceId").value = String(data.lastSourceId || payload.minSourceId || 0);
  log(`搬入待定位資料：imported=${data.imported || 0}, skipped=${data.skipped || 0}, lastSourceId=${data.lastSourceId || 0}`);
  message(`已搬入 ${data.imported || 0} 筆待定位資料。`, "ok");
}

function locateTwd97(address) {
  if (tgosConfig?.mode === "lite-default") {
    return Promise.reject(new Error("目前使用 TGOS Lite 公開金鑰，地址定位服務會回 Invalid key；請設定正式 TGOS_APP_ID / TGOS_API_KEY 後重啟本機服務。"));
  }
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      if (error) reject(error);
      else resolve(value);
    };
    const timer = window.setTimeout(() => {
      finish(new Error("TGOS 地址定位逾時，請確認 TGOS 金鑰可使用地址定位服務。"));
    }, TGOS_LOCATE_TIMEOUT_MS);
    const service = new window.TGOS.TGLocateService();
    service.locateTWD97({ address }, (result, status) => {
      if (status !== "OK" && status !== window.TGOS.TGLocatorStatus?.OK) {
        finish(new Error(String(status || "TGOS locate failed")));
        return;
      }
      const point = result?.[0]?.geometry?.location;
      if (!point || point.x == null || point.y == null) {
        finish(new Error("TGOS result missing geometry.location"));
        return;
      }
      const [lat, lng] = twd97ToWgs84(Number(point.x), Number(point.y));
      finish(null, { lat, lng, twd97x: Number(point.x), twd97y: Number(point.y) });
    });
  });
}

function twd97ToWgs84(rawX, rawY) {
  const a = 6378137.0;
  const b = 6356752.314245;
  const lon0 = 121 * Math.PI / 180;
  const k0 = 0.9999;
  const e = Math.sqrt(1 - (b * b) / (a * a));
  const e1sq = e * e / (1 - e * e);
  const x = rawX - 250000;
  const y = rawY;
  const m = y / k0;
  const mu = m / (a * (1 - e ** 2 / 4 - 3 * e ** 4 / 64 - 5 * e ** 6 / 256));
  const e1 = (1 - Math.sqrt(1 - e * e)) / (1 + Math.sqrt(1 - e * e));
  const j1 = 3 * e1 / 2 - 27 * e1 ** 3 / 32;
  const j2 = 21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32;
  const j3 = 151 * e1 ** 3 / 96;
  const j4 = 1097 * e1 ** 4 / 512;
  const fp = mu + j1 * Math.sin(2 * mu) + j2 * Math.sin(4 * mu) + j3 * Math.sin(6 * mu) + j4 * Math.sin(8 * mu);
  const sinFp = Math.sin(fp);
  const cosFp = Math.cos(fp);
  const tanFp = Math.tan(fp);
  const c1 = e1sq * cosFp ** 2;
  const t1 = tanFp ** 2;
  const r1 = a * (1 - e * e) / ((1 - e * e * sinFp ** 2) ** 1.5);
  const n1 = a / Math.sqrt(1 - e * e * sinFp ** 2);
  const d = x / (n1 * k0);
  const q1 = n1 * tanFp / r1;
  const q2 = d ** 2 / 2;
  const q3 = (5 + 3 * t1 + 10 * c1 - 4 * c1 ** 2 - 9 * e1sq) * d ** 4 / 24;
  const q4 = (61 + 90 * t1 + 298 * c1 + 45 * t1 ** 2 - 252 * e1sq - 3 * c1 ** 2) * d ** 6 / 720;
  const lat = fp - q1 * (q2 - q3 + q4);
  const q5 = d;
  const q6 = (1 + 2 * t1 + c1) * d ** 3 / 6;
  const q7 = (5 - 2 * c1 + 28 * t1 - 3 * c1 ** 2 + 8 * e1sq + 24 * t1 ** 2) * d ** 5 / 120;
  const lng = lon0 + (q5 - q6 + q7) / cosFp;
  return [lat * 180 / Math.PI, lng * 180 / Math.PI];
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function startBatch() {
  stopRequested = false;
  okCount = 0;
  failCount = 0;
  $("okCount").textContent = "0";
  $("failCount").textContent = "0";
  await loadTgos();
  const items = await refreshPending();
  if (!items.length) {
    message("目前沒有待定位資料；請先搬一批 Open Data。", "warn");
    return;
  }
  const delay = Math.max(200, numberValue("delayMs", 1200));
  for (const item of items) {
    if (stopRequested) {
      log("已停止。");
      break;
    }
    const address = item.geocodeAddress || item.address_normalized || item.address;
    try {
      log(`定位 ${item.id}: ${address}`);
      const result = await locateTwd97(address);
      await postJson("/api/real-price/geocode/commit", {
        id: item.id,
        address,
        lat: result.lat,
        lng: result.lng,
        provider: "tgos",
        confidence: 0.9,
        status: "ok",
        twd97x: result.twd97x,
        twd97y: result.twd97y,
      });
      okCount += 1;
      $("okCount").textContent = String(okCount);
      log(`成功 ${item.id}: ${result.lat.toFixed(7)}, ${result.lng.toFixed(7)}`);
    } catch (error) {
      failCount += 1;
      $("failCount").textContent = String(failCount);
      await postJson("/api/real-price/geocode/commit", {
        id: item.id,
        address,
        provider: "tgos",
        status: "failed",
        error: error.message || "TGOS failed",
      }).catch(() => {});
      log(`失敗 ${item.id}: ${error.message || error}`);
    }
    await sleep(delay);
  }
  message(`本批完成：成功 ${okCount}，失敗 ${failCount}。`, okCount ? "ok" : "warn");
  await refreshPending();
}

$("loadTgosBtn").addEventListener("click", () => loadTgos().catch((error) => {
  message(error.message || String(error), "error");
  log(`TGOS 載入失敗：${error.message || error}`);
}));
$("importPendingBtn").addEventListener("click", () => importPending().catch((error) => {
  message(error.message || String(error), "error");
  log(`搬入失敗：${error.message || error}`);
}));
$("refreshPendingBtn").addEventListener("click", () => refreshPending().catch((error) => {
  message(error.message || String(error), "error");
  log(`查詢待定位失敗：${error.message || error}`);
}));
$("startBtn").addEventListener("click", () => startBatch().catch((error) => {
  message(error.message || String(error), "error");
  log(`批次失敗：${error.message || error}`);
}));
$("stopBtn").addEventListener("click", () => {
  stopRequested = true;
  message("收到停止指令，會在目前這筆完成後停止。", "warn");
});
