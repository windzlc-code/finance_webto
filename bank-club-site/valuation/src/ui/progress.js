import { els } from "../dom.js";
import { nextPaint, wait } from "../utils.js";

let globalActionTimer = null;
let globalActionStartAt = 0;
let globalActionBaseText = "處理中，請稍候...";
let globalActionActiveCount = 0;

export function renderGlobalActionProgressText() {
  if (!els.globalActionProgressText) return;
  if (!globalActionStartAt) {
    els.globalActionProgressText.textContent = globalActionBaseText;
    return;
  }
  const elapsedSec = Math.max(0, Math.floor((Date.now() - globalActionStartAt) / 1000));
  els.globalActionProgressText.textContent = `${globalActionBaseText}（${elapsedSec} 秒）`;
}

export function setGlobalActionProgress(active, text = "處理中，請稍候...") {
  if (!els.globalActionProgress) return;
  if (active) {
    globalActionActiveCount += 1;
    globalActionBaseText = text || "處理中，請稍候...";
    if (!globalActionStartAt) {
      globalActionStartAt = Date.now();
    }
    if (!globalActionTimer) {
      globalActionTimer = setInterval(renderGlobalActionProgressText, 1000);
    }
    els.globalActionProgress.classList.add("active");
    renderGlobalActionProgressText();
    return;
  }
  globalActionActiveCount = Math.max(0, globalActionActiveCount - 1);
  if (globalActionActiveCount > 0) {
    renderGlobalActionProgressText();
    return;
  }
  els.globalActionProgress.classList.remove("active");
  if (globalActionTimer) {
    clearInterval(globalActionTimer);
    globalActionTimer = null;
  }
  globalActionStartAt = 0;
  globalActionBaseText = "處理中，請稍候...";
}

export function setButtonLoading(button, active, loadingText = "處理中...") {
  if (!button) return;
  const currentCount = Number(button.dataset.loadingCount || 0);
  if (active) {
    if (!currentCount) {
      button.dataset.originalText = button.textContent;
      button.dataset.originalDisabled = button.disabled ? "1" : "0";
    }
    button.dataset.loadingCount = String(currentCount + 1);
    button.disabled = true;
    button.classList.add("btn-loading");
    button.setAttribute("aria-busy", "true");
    if (loadingText) {
      button.textContent = loadingText;
    }
    return;
  }
  const nextCount = Math.max(0, currentCount - 1);
  if (nextCount) {
    button.dataset.loadingCount = String(nextCount);
    return;
  }
  button.classList.remove("btn-loading");
  button.removeAttribute("aria-busy");
  if ("originalText" in button.dataset) {
    button.textContent = button.dataset.originalText;
    delete button.dataset.originalText;
  }
  button.disabled = button.dataset.originalDisabled === "1";
  delete button.dataset.originalDisabled;
  delete button.dataset.loadingCount;
}

export async function withActionUi({ button = null, buttonText = "處理中...", progressText = "處理中，請稍候...", minDuration = 320 }, action) {
  const startedAt = Date.now();
  setButtonLoading(button, true, buttonText);
  setGlobalActionProgress(true, progressText);
  await nextPaint();
  try {
    return await action();
  } finally {
    const elapsed = Date.now() - startedAt;
    if (elapsed < minDuration) {
      await wait(minDuration - elapsed);
    }
    setButtonLoading(button, false);
    setGlobalActionProgress(false);
  }
}

let queryProgressTimer = null;
let queryProgressStartAt = 0;
let queryProgressBaseText = "官方資料查詢中，請稍候...";
let queryProgressStageText = "";

export function renderQueryProgressText() {
  if (!els.queryProgressText) return;
  if (!queryProgressStartAt) {
    els.queryProgressText.textContent = queryProgressBaseText;
    return;
  }
  const elapsedSec = Math.max(0, Math.floor((Date.now() - queryProgressStartAt) / 1000));
  let slowHint = "";
  if (elapsedSec >= 60) slowHint = "官方回應較慢，系統仍在等候或自動重試。";
  else if (elapsedSec >= 40) slowHint = "官方回應較慢，請先稍候。";
  else if (elapsedSec >= 20) slowHint = "官方資料查詢較慢，仍在處理中。";
  const stage = queryProgressStageText || slowHint;
  els.queryProgressText.textContent = `${queryProgressBaseText}（${elapsedSec} 秒）${stage ? `｜${stage}` : ""}`;
}

export function setQueryProgressStage(stageText = "") {
  queryProgressStageText = String(stageText || "").trim();
  renderQueryProgressText();
}

export function setQueryProgress(active, text = "官方資料查詢中，請稍候...") {
  if (!els.queryProgress) return;
  if (active) {
    els.queryProgress.classList.add("active");
    queryProgressBaseText = text || "官方資料查詢中，請稍候...";
    queryProgressStartAt = Date.now();
    if (queryProgressTimer) clearInterval(queryProgressTimer);
    queryProgressTimer = setInterval(renderQueryProgressText, 1000);
    renderQueryProgressText();
  } else {
    els.queryProgress.classList.remove("active");
    if (queryProgressTimer) {
      clearInterval(queryProgressTimer);
      queryProgressTimer = null;
    }
    queryProgressStartAt = 0;
    queryProgressStageText = "";
  }
}

export function setOcrProgress(percent, text) {
  const safe = Math.max(0, Math.min(100, Number(percent) || 0));
  els.ocrProgressBar.style.width = `${safe}%`;
  els.ocrProgressText.textContent = text;
}
