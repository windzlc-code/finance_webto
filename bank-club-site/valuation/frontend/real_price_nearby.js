const API_BASE = window.location.protocol === "file:" ? "http://127.0.0.1:5606" : "";
let lastDoorplate = "";

function $(id) {
  return document.getElementById(id);
}

function setStatus(message, tone = "warn") {
  const el = $("realPriceStatus");
  if (!el) return;
  el.className = `msg ${tone}`;
  el.textContent = message;
}

function setLoading(button, loading) {
  if (!button) return;
  button.disabled = loading;
  button.classList.toggle("btn-loading", loading);
}

function subjectDoorplate() {
  return (
    $("recognizedPropertyAddress")?.value?.trim()
    || $("subjectAddress")?.value?.trim()
    || ""
  );
}

function syncDoorplateDisplay() {
  const address = subjectDoorplate();
  const el = $("realPriceDoorplateValue");
  if (el) el.textContent = address || "尚未取得建物門牌";
  if (address !== lastDoorplate) {
    clearHiddenCoords();
    lastDoorplate = address;
    document.dispatchEvent(new CustomEvent("found:subject-location-cleared", { detail: { address } }));
  }
}

function readSubjectUnitPrice() {
  const raw = $("avgUnitPrice")?.textContent?.trim() || "";
  if (!raw || raw === "--") return null;
  const match = raw.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const value = Number(match[0]);
  return Number.isFinite(value) ? value : null;
}

async function postJson(path, payload) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) {
    const error = new Error(data.message || data.error || `HTTP ${response.status}`);
    error.data = data;
    error.status = response.status;
    throw error;
  }
  return data;
}

function updateHiddenCoords(lat, lng) {
  if ($("realPriceLat")) $("realPriceLat").value = Number(lat).toFixed(7);
  if ($("realPriceLng")) $("realPriceLng").value = Number(lng).toFixed(7);
}

function clearHiddenCoords() {
  if ($("realPriceLat")) $("realPriceLat").value = "";
  if ($("realPriceLng")) $("realPriceLng").value = "";
}

function dispatchSubjectLocation(address, geocode) {
  const lat = Number(geocode?.lat);
  const lng = Number(geocode?.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    updateHiddenCoords(lat, lng);
  }
  document.dispatchEvent(new CustomEvent("found:subject-location-updated", {
    detail: {
      address,
      geocode: { ...(geocode || {}), lat, lng },
      subjectUnitPrice: readSubjectUnitPrice(),
    },
  }));
}

async function locateDoorplate(button) {
  syncDoorplateDisplay();
  const address = subjectDoorplate();
  if (!address) {
    setStatus("請先上傳謄本並取得建物門牌。", "warn");
    return null;
  }
  setLoading(button, true);
  try {
    const geocode = await postJson("/api/geocode/address", { address });
    dispatchSubjectLocation(address, geocode);
    setStatus("已完成建物門牌定位；標的會以紅框顯示在地圖上。", "ok");
    return geocode;
  } catch (error) {
    clearHiddenCoords();
    document.dispatchEvent(new CustomEvent("found:subject-location-cleared", { detail: { address } }));
    const isGeocodeMiss = error.data?.error === "geocode_not_found" || error.status === 404;
    const message = isGeocodeMiss
      ? "此建物門牌尚未有可用座標；官方回傳案例若可定位，仍會以藍框顯示。"
      : (error.message || "建物門牌定位失敗。");
    setStatus(message, "error");
    return null;
  } finally {
    setLoading(button, false);
  }
}

function init() {
  syncDoorplateDisplay();
  const searchBtn = $("realPriceSearchBtn");
  searchBtn?.addEventListener("click", () => locateDoorplate(searchBtn));
  document.addEventListener("found:subject-address-updated", syncDoorplateDisplay);
}

document.addEventListener("DOMContentLoaded", init);
