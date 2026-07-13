import { cleanOcrText } from "../utils.js";

export function normalizeMainPurposeText(value) {
  return cleanOcrText(value)
    .replace(/\s+/g, "")
    .replace(/用途?$/u, "用")
    .trim();
}

export function rowFloorIsFullLevel(floorInfo) {
  const raw = String(floorInfo || "").trim();
  if (!raw) return false;
  const firstSeg = raw.split(/[\/／]/)[0].replace(/\s+/g, "");
  return firstSeg === "全" || /^全(?:層|樓|棟)?$/u.test(firstSeg);
}
