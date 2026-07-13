export function createProgressController({
  progressNode,
  textNode,
  defaultText,
  counted = true,
  formatText = null
}) {
  let timer = null;
  let startedAt = 0;
  let activeCount = 0;
  let baseText = defaultText;
  let stageText = "";

  const render = () => {
    if (!textNode) return;
    if (!startedAt) {
      textNode.textContent = baseText;
      return;
    }
    const elapsedSec = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
    textNode.textContent = formatText
      ? formatText({ baseText, elapsedSec, stageText })
      : `${baseText}（${elapsedSec} 秒）`;
  };

  const stop = () => {
    if (progressNode) progressNode.classList.remove("active");
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    startedAt = 0;
    activeCount = 0;
    baseText = defaultText;
    stageText = "";
  };

  return {
    set(active, text = defaultText) {
      if (!progressNode) return;
      if (active) {
        if (counted) {
          activeCount += 1;
          if (!startedAt) startedAt = Date.now();
        } else {
          activeCount = 1;
          startedAt = Date.now();
          if (timer) {
            clearInterval(timer);
            timer = null;
          }
        }
        baseText = text || defaultText;
        if (!timer) timer = setInterval(render, 1000);
        progressNode.classList.add("active");
        render();
        return;
      }
      if (counted) {
        activeCount = Math.max(0, activeCount - 1);
        if (activeCount > 0) {
          render();
          return;
        }
      }
      stop();
    },
    setStage(nextStageText = "") {
      stageText = String(nextStageText || "").trim();
      render();
    }
  };
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

export function setOcrProgress(els, percent, text) {
  const safe = Math.max(0, Math.min(100, Number(percent) || 0));
  if (els.ocrProgressBar) els.ocrProgressBar.style.width = `${safe}%`;
  if (els.ocrProgressText) els.ocrProgressText.textContent = text;
}
