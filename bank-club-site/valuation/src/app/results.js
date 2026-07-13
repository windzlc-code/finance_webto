import { formatNum } from "../utils.js";

export const resultSortColumns = new Set([
  "address",
  "community",
  "totalPrice",
  "tradeDate",
  "unitPrice",
  "totalArea",
  "type",
  "age",
  "floorInfo",
  "purpose",
  "target",
  "layout",
  "parkingPrice",
  "management",
  "elevator",
  "comparableScore",
  "status",
  "note"
]);

export const resultSortCollator = new Intl.Collator("zh-Hant", { numeric: true, sensitivity: "base" });

export function setMessage(resultMessage, type, text) {
  if (!resultMessage) return;
  if (!text) {
    resultMessage.className = "msg";
    resultMessage.style.display = "none";
    resultMessage.textContent = "";
    return;
  }
  resultMessage.className = `msg ${type}`;
  resultMessage.style.display = "block";
  resultMessage.textContent = text;
}

export function formatMetric(value, digits = 2) {
  return formatNum(value, digits);
}

export function normalizeUnderwritingZoneCode(zoneLabel = "") {
  const normalized = String(zoneLabel || "")
    .normalize("NFKC")
    .toUpperCase()
    .replace(/\s+/g, "");
  const explicit = normalized.match(/([ABCDEF])(?:區|ZONE|$)/);
  if (explicit) return explicit[1];
  const loose = normalized.match(/(?:^|[^A-Z])([ABCDEF])(?=$|區|[^A-Z])/);
  return loose ? loose[1] : "";
}

export function loanableRatioForUnderwritingZone(zoneLabel = "") {
  const zoneCode = normalizeUnderwritingZoneCode(zoneLabel);
  if (zoneCode === "A" || zoneCode === "B") return { zoneCode, ratio: 0.8, available: true };
  if (zoneCode === "C") return { zoneCode, ratio: 0.75, available: true };
  if (zoneCode === "D") return { zoneCode, ratio: 0.65, available: true };
  if (zoneCode === "E" || zoneCode === "F") return { zoneCode, ratio: null, available: false };
  return { zoneCode: "", ratio: null, available: null };
}

export function calculateLoanableAmountWan(houseValueWan, zoneLabel = "") {
  const value = Number(houseValueWan);
  if (!Number.isFinite(value) || value <= 0) {
    return {
      status: "pending",
      display: "--",
      sub: "待房屋價值與承作分區",
      amountWan: null,
      ratio: null,
      zoneCode: normalizeUnderwritingZoneCode(zoneLabel)
    };
  }
  const policy = loanableRatioForUnderwritingZone(zoneLabel);
  if (policy.available === false) {
    return {
      status: "unavailable",
      display: "不可貸",
      sub: `${policy.zoneCode}區不承作`,
      amountWan: null,
      ratio: null,
      zoneCode: policy.zoneCode
    };
  }
  if (policy.available !== true || policy.ratio == null) {
    return {
      status: "pending",
      display: "--",
      sub: "待承作分區",
      amountWan: null,
      ratio: null,
      zoneCode: ""
    };
  }
  const amountWan = value * policy.ratio;
  return {
    status: "ok",
    display: `${formatNum(amountWan, 0)} 萬`,
    sub: `${policy.zoneCode}區 × ${Math.round(policy.ratio * 100)}%`,
    amountWan,
    ratio: policy.ratio,
    zoneCode: policy.zoneCode
  };
}
