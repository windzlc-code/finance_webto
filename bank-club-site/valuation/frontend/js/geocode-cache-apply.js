const $ = (id) => document.getElementById(id);

const els = {
  city: $("geocodeCacheApplyCity"),
  district: $("geocodeCacheApplyDistrict"),
  limit: $("geocodeCacheApplyLimit"),
  previewBtn: $("geocodeCachePreviewBtn"),
  applyBtn: $("geocodeCacheApplyBtn"),
  status: $("geocodeCacheApplyStatus"),
  kpi: $("geocodeCacheApplyKpi"),
  samples: $("geocodeCacheApplySamples")
};

function formatInt(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number.toLocaleString("zh-TW") : "0";
}

function selectedText(id) {
  const select = $(id);
  const text = select?.selectedOptions?.[0]?.textContent?.trim() || "";
  return /^請選擇/.test(text) ? "" : text;
}

function payload(dryRun) {
  const city = String(els.city?.value || "").trim() || selectedText("cityName");
  const district = String(els.district?.value || "").trim() || selectedText("districtName");
  const limit = Math.max(1, Math.min(Number(els.limit?.value || 5000), 100000));
  return {
    dryRun,
    mode: "missing",
    limit,
    city,
    district,
    sampleLimit: 8,
    refreshStats: true
  };
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || data.message || `HTTP ${response.status}`);
  }
  return data;
}

function setBusy(busy) {
  for (const button of [els.previewBtn, els.applyBtn]) {
    if (button) button.disabled = busy;
  }
}

function renderSamples(items = []) {
  if (!els.samples) return;
  if (!items.length) {
    els.samples.innerHTML = "";
    return;
  }
  els.samples.innerHTML = items.slice(0, 8).map((item) => {
    const address = item.address_raw || item.address_normalized || "";
    const city = [item.city, item.district].filter(Boolean).join("");
    const lat = Number(item.cache_lat);
    const lng = Number(item.cache_lng);
    const point = Number.isFinite(lat) && Number.isFinite(lng) ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : "--";
    return `<div class="real-price-cache-sample"><strong>${escapeHtml(city)} ${escapeHtml(address)}</strong><span>${escapeHtml(point)}</span></div>`;
  }).join("");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderResult(data) {
  const matched = Number(data.matchedRows || 0);
  const applied = Number(data.appliedRows || 0);
  const remaining = Number(data.remainingRows || 0);
  if (els.kpi) {
    els.kpi.textContent = data.dryRun
      ? `可套回 ${formatInt(matched)} 筆`
      : `已套回 ${formatInt(applied)} 筆 / 剩餘 ${formatInt(remaining)} 筆`;
  }
  if (els.status) {
    els.status.className = `msg ${data.dryRun ? "warn" : "ok"} real-price-cache-status`;
    els.status.textContent = data.dryRun
      ? `預覽完成：${formatInt(matched)} 筆交易、${formatInt(data.matchedAddresses)} 個地址可由快取補座標。`
      : `套回完成：本批寫回 ${formatInt(applied)} 筆；仍可套回 ${formatInt(remaining)} 筆。`;
  }
  renderSamples(data.samples || []);
}

async function run(dryRun) {
  setBusy(true);
  if (els.status) {
    els.status.className = "msg warn real-price-cache-status";
    els.status.textContent = dryRun ? "正在預覽可套回筆數..." : "正在套回本批座標...";
  }
  try {
    const data = await postJson("/api/real-price/geocode/apply-cache", payload(dryRun));
    renderResult(data);
  } catch (error) {
    if (els.status) {
      els.status.className = "msg error real-price-cache-status";
      els.status.textContent = error?.message || "座標快取套回失敗";
    }
  } finally {
    setBusy(false);
  }
}

function bind() {
  if (!els.previewBtn || !els.applyBtn) return;
  els.previewBtn.addEventListener("click", () => void run(true));
  els.applyBtn.addEventListener("click", () => {
    const request = payload(false);
    const scope = [request.city, request.district].filter(Boolean).join("") || "全部縣市";
    const ok = window.confirm(`套回 ${scope} 本批最多 ${formatInt(request.limit)} 筆空白座標？`);
    if (ok) void run(false);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bind, { once: true });
} else {
  bind();
}
