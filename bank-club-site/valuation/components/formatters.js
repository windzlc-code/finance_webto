export function formatNumber(value, digits = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "--";
  return numeric.toLocaleString("zh-TW", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}

export function formatWan(value, digits = 2) {
  return `${formatNumber(value, digits)} 萬元/年`;
}

export function formatWanAmount(value, digits = 2) {
  return `${formatNumber(value, digits)} 萬元`;
}

export function formatYuan(value) {
  return `${formatNumber(value, 0)} 元`;
}

export function formatPercent(value, digits = 2) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "--";
  return `${formatNumber(numeric * 100, digits)}%`;
}

export function formatRateInput(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric === 0) return "";
  return `${formatNumber(numeric * 100, 3).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1")}%`;
}

export function formatInputNumber(value, digits = 2) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric === 0) return "";
  return numeric.toLocaleString("zh-TW", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits
  });
}

export function parseNumericInput(value) {
  const cleaned = String(value ?? "")
    .replace(/,/g, "")
    .replace(/％/g, "%")
    .replace(/[^\d.%+-]/g, "")
    .trim();
  if (!cleaned) return 0;
  const isPercent = cleaned.includes("%");
  const numeric = Number(cleaned.replace(/%/g, ""));
  if (!Number.isFinite(numeric)) return 0;
  return isPercent ? numeric / 100 : numeric;
}

export function setInputDisplay(input, value, options = {}) {
  const { type = "number", digits = 2 } = options;
  if (type === "rate") {
    input.value = formatRateInput(value);
    return;
  }
  input.value = formatInputNumber(value, digits);
}

export function normalizeDisplayOnFocus(event) {
  event.currentTarget.value = String(event.currentTarget.value || "").replace(/,/g, "").replace(/%/g, "");
}
