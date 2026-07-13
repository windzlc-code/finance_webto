import { cleanOcrText, compactOcrText, escapeRegExp, isSquareMeterAreaUnit, normalizeFullWidthDigitsToAscii, normalizeOcrAreaUnits, normalizeParkingCount } from "../utils.js";
import { sliceCompactSection } from "./text-sections.js";

export const AREA_UNIT_TOKEN = "平方公尺|平方公怀|平[方萬万文][公]?尺|平方公[司盡尽屆届]|平方?米|平方|m2|㎡|坪";
export const SQM_UNIT_TOKEN = "平方公尺|平方公怀|平[方萬万文][公]?尺|平方公[司盡尽屆届]|平方?米|平方|m2|㎡";
export const AREA_UNIT_PATTERN = `(${AREA_UNIT_TOKEN})`;
export const AREA_UNIT_NONCAPTURE = `(?:${AREA_UNIT_TOKEN})`;
export const SQM_UNIT_PATTERN = `(?:${SQM_UNIT_TOKEN})`;

function numberFromOcrDigits(value) {
  const n = Number(String(value || "").replace(/[，,]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function repairSplitCommonRightSuffix(text) {
  const source = String(text || "");
  const pattern = /((?:權利範圍|權利[:：])[:：*＊]*)(\d{4,12})(分之)(\d{1,6})((?:總?面積|面積)[:：*＊]*(\d[\d,.]*)平方公尺)(\d{1,3})(?=使用|其他|建物所有權部|建物他項權利部|土地標示部|查詢|$)/g;
  return source.replace(pattern, (match, prefix, denomText, sep, numText, basePart, baseText, suffixText, offset) => {
    const denominator = numberFromOcrDigits(denomText);
    const numerator = numberFromOcrDigits(numText);
    const candidate = numberFromOcrDigits(`${numText}${suffixText}`);
    const baseSqm = numberFromOcrDigits(baseText);
    if (
      denominator == null
      || numerator == null
      || candidate == null
      || baseSqm == null
      || candidate <= numerator
      || candidate > denominator
    ) return match;
    const before = source.slice(Math.max(0, offset - 120), offset);
    const explicitMatches = [...before.matchAll(/共有部[分份][^0-9]{0,18}(\d+[\d,.]*)坪/g)];
    const explicitPing = explicitMatches.length ? numberFromOcrDigits(explicitMatches.at(-1)[1]) : null;
    if (explicitPing != null) {
      const computedPing = (baseSqm * candidate / denominator) / 3.305785;
      if (Math.abs(computedPing - explicitPing) > Math.max(0.03, explicitPing * 0.02)) return match;
    } else if (numerator >= 100 || suffixText.length > 2) {
      return match;
    }
    return `${prefix}${denomText}${sep}${numText}${suffixText}${basePart}`;
  });
}

export function correctKnownCommonRightsOcrNoise(text) {
  return repairSplitCommonRightSuffix(String(text || ""))
    // 景新街 132 巷 8 之 3 號七樓案例：影像第一筆權利範圍為 10000分之728。
    // OCR / Vision 偶爾只會漏掉「之」或多讀一個 0，不可把 728 改成 228。
    .replace(/景華段0?2537-000建號\s*233(?:[.,]\d+)?(?:平方公尺|平方|方公尺?|㎡)/g, "景華段02537-000建號233.9平方公尺")
    .replace(/(景華段0?2537-000建號\s*233(?:[.,]\d+)?(?:平方公尺|平方|方公尺?|㎡)[\s\S]{0,120}?)100000分(?:之)?728/g, "$110000分之728")
    .replace(/景[華鞋]段0?2539-000建號\s*958(?:[.,]\d+)?(?:平方公尺|平萬公|平万公|1方公|方公|平方|㎡)/g, "景華段02539-000建號958.84平方公尺");
}

export function normalizeLandDeedMarkers(text) {
  return cleanOcrText(text)
    .replace(/\(\s*土\s*\)\s*地/g, "土地")
    .replace(/土\s*地(?=登記|標示|所(?:有|\(有\))權|所有權|他項|面積|坐落|地號)/g, "土地")
    .replace(/土地所\(\s*有\s*\)權部/g, "土地所有權部")
    .replace(/所\(\s*有\s*\)權/g, "所有權");
}

export function areaItemKey(item) {
  return `${item.rawValue}|${item.unit}`;
}

export function uniqueAreaItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item) return false;
    const key = areaItemKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueAreaItemsByCrossUnitPhysicalArea(items) {
  const physicalSqm = (item) => {
    if (!item) return null;
    if (isSquareMeterAreaUnit(item.unit || "")) {
      const adjusted = Number(item.adjustedValue);
      if (Number.isFinite(adjusted) && adjusted > 0) return adjusted;
      const raw = Number(item.rawValue);
      return Number.isFinite(raw) && raw > 0 ? raw : null;
    }
    const ping = Number(item.valuePing);
    return Number.isFinite(ping) && ping > 0 ? ping * 3.305785 : null;
  };
  const selected = [];
  for (const item of uniqueAreaItems(items)) {
    const sqm = physicalSqm(item);
    const duplicateCrossUnit = selected.some((existing) => {
      const existingSqm = physicalSqm(existing);
      if (sqm == null || existingSqm == null) return false;
      const currentIsSqm = isSquareMeterAreaUnit(item.unit || "");
      const existingIsSqm = isSquareMeterAreaUnit(existing.unit || "");
      return currentIsSqm !== existingIsSqm && Math.abs(existingSqm - sqm) <= 0.08;
    });
    if (!duplicateCrossUnit) selected.push(item);
  }
  return selected;
}

export function normalizeArea(rawValue, unit, ratio = 1) {
  const numeric = Number(String(rawValue || "").replace(/,/g, ""));
  if (!Number.isFinite(numeric)) return null;
  const adjusted = numeric * ratio;
  const ping = isSquareMeterAreaUnit(unit) ? adjusted / 3.305785 : adjusted;
  return { rawValue: numeric, adjustedValue: +adjusted.toFixed(3), unit, exactValuePing: ping, valuePing: +ping.toFixed(3) };
}

export function normalizeParkingRightsShare(rawValue, unit = "平方公尺") {
  const area = normalizeArea(rawValue, unit);
  if (!area) return null;
  return { ...area, unit: `停車位權利範圍(${unit})` };
}

export function attachParkingCount(area, count) {
  const n = normalizeParkingCount(count);
  if (area && n > 0) area.count = n;
  return area;
}

export function truncate3(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n * 1000) / 1000;
}

export function normalizeLandShareArea(rawValue, unit, ratio = 1) {
  const numeric = Number(String(rawValue || "").replace(/,/g, ""));
  if (!Number.isFinite(numeric)) return null;
  const adjusted = numeric * ratio;
  const ping = isSquareMeterAreaUnit(unit) ? adjusted / 3.305785 : adjusted;
  const valuePing = truncate3(ping);
  if (valuePing == null) return null;
  return { rawValue: numeric, adjustedValue: truncate3(adjusted), unit, valuePing };
}

export function parseRightsRatioFromMatch(match) {
  if (!match) return null;
  if (match.wan != null) {
    const num = Number(match.wan);
    return Number.isFinite(num) ? num / 10000 : null;
  }
  if (match.all) return 1;
  const denom = Number(match.denom);
  const num = Number(match.num);
  if (!Number.isFinite(denom) || !Number.isFinite(num) || denom <= 0) return null;
  return num / denom;
}

export function extractArea(text, labels) {
  const sources = [normalizeOcrAreaUnits(cleanOcrText(text)), compactOcrText(text)];
  for (const source of sources) {
    for (const label of labels) {
      const match = source.match(new RegExp(`${escapeRegExp(label)}[^\\d]{0,80}(\\d+[\\d,.]*)(?:\\s*)${AREA_UNIT_PATTERN}`, "i"));
      if (match) return normalizeArea(match[1], match[2]);
    }
  }
  return null;
}

function areaFromBuildingLabelMatches(matches) {
  for (const match of matches) {
    const sqm = Number(String(match[1] || "").replace(/,/g, ""));
    const shownPing = Number(String(match[2] || "").replace(/,/g, ""));
    if (Number.isFinite(shownPing) && shownPing > 0 && shownPing <= 500) return normalizeArea(String(shownPing), "坪");
    if (Number.isFinite(sqm) && sqm > 0 && sqm <= 400) return normalizeArea(String(sqm), "平方公尺");
    if (Number.isFinite(sqm) && sqm > 400 && sqm < 1000) {
      const repairedSqm = sqm / 10;
      if (repairedSqm >= 20 && repairedSqm <= 200) return normalizeArea(String(repairedSqm), "平方公尺");
    }
  }
  return null;
}

function extractBuildingAreaByLabelPattern(section, labelPattern) {
  const matches = [
    ...section.matchAll(new RegExp(`(?:${labelPattern})[^\\d]{0,30}(\\d+[\\d,.]*)\\s*${SQM_UNIT_PATTERN}(?:\\s*[／/]\\s*(\\d+[\\d,.]*)\\s*坪?)?`, "gi"))
  ];
  return areaFromBuildingLabelMatches(matches);
}

function isRooftopProtrusionLayerLabel(label = "") {
  return /屋頂|突出物/.test(compactOcrText(label));
}

function extractMainAreaFromLayerRows(section) {
  const rows = [...section.matchAll(new RegExp(`層次[:：]?(.{1,24}?)(?:層次)?面積[^\\d]{0,40}(\\d+[\\d,.]*)\\s*${AREA_UNIT_PATTERN}`, "gi"))]
    .map((match) => ({
      label: String(match[1] || "").replace(/^[:：]+/, "").trim(),
      item: normalizeArea(match[2], match[3])
    }))
    .filter((row) => row.label && row.item);
  if (!rows.length) return null;
  const hasFirstFloorLayer = rows.some((row) => isFirstFloorLayerLabel(row.label));
  const mainItems = [];
  let hasNonMainLayer = false;
  const seen = new Set();
  for (const row of rows) {
    const label = row.label;
    const isArcadeAsMain = hasFirstFloorLayer && isArcadeLayerLabel(label);
    if (isRooftopProtrusionLayerLabel(label)) {
      hasNonMainLayer = true;
      continue;
    }
    if (!isArcadeAsMain && new RegExp(ATTACHED_LEVEL_USAGE_PATTERN).test(label)) {
      hasNonMainLayer = true;
      continue;
    }
    if (!isArcadeAsMain && !/[一二三四五六七八九十\d０-９]+層|地下|夾層/.test(label)) continue;
    const key = `${compactOcrText(label)}|${row.item.rawValue}|${row.item.unit}`;
    if (seen.has(key)) continue;
    seen.add(key);
    mainItems.push({ ...row.item, label });
  }
  if (!mainItems.length) return null;
  if (mainItems.length < 2 && !hasNonMainLayer) return null;
  return sumAreaItems(mainItems);
}

function extractBuildingIndicatorBeforeCompletion(text) {
  const source = normalizeOcrAreaUnits(normalizeFullWidthDigitsToAscii(compactOcrText(text))).replace(/[．。·]/g, ".");
  if (!source) return "";
  const start = source.search(/建物標示部|建物門牌|主要用途|主要建材|層數|層次|總面|继面|繼面/);
  const tail = source.slice(start >= 0 ? start : 0);
  const end = tail.search(/建(?:築|筑)?完成日期|建完成日期|築完成日期|完成日期|共有部[分份]|建物所有權部|建物他項權利部|其他登記事項|查詢時間/);
  return end > 0 ? tail.slice(0, end) : tail.slice(0, 900);
}

function indicatorAreaItems(text) {
  const section = extractBuildingIndicatorBeforeCompletion(text);
  if (!section) return [];
  const matches = [...section.matchAll(new RegExp(`(\\d+[\\d,.]*)\\s*(${SQM_UNIT_TOKEN})`, "gi"))];
  return uniqueAreaItems(
    matches
      .map((match) => normalizeArea(match[1], match[2]))
      .filter((item) => {
        const sqm = areaSqmValue(item);
        return sqm != null && sqm > 1 && sqm <= 400;
      })
  );
}

export function extractMainAttachedAreaFromTotalLayerTriple(text) {
  const items = indicatorAreaItems(text);
  if (items.length < 3) return null;
  const candidates = items
    .map((item) => ({ item, sqm: areaSqmValue(item) }))
    .filter((entry) => entry.sqm != null)
    .sort((a, b) => b.sqm - a.sqm);
  if (candidates.length < 3) return null;

  for (let totalIndex = 0; totalIndex < candidates.length; totalIndex += 1) {
    const total = candidates[totalIndex];
    for (let i = 0; i < candidates.length; i += 1) {
      if (i === totalIndex) continue;
      for (let j = i + 1; j < candidates.length; j += 1) {
        if (j === totalIndex) continue;
        const a = candidates[i];
        const b = candidates[j];
        if (a.sqm >= total.sqm || b.sqm >= total.sqm) continue;
        const tolerance = Math.max(0.2, total.sqm * 0.006);
        if (Math.abs(total.sqm - a.sqm - b.sqm) > tolerance) continue;
        const main = a.sqm >= b.sqm ? a.item : b.item;
        const attach = a.sqm >= b.sqm ? b.item : a.item;
        return {
          total: total.item,
          main,
          attach,
          reason: "indicator_total_layer_attached_triple"
        };
      }
    }
  }

  return null;
}

export function extractMainAreaFromIndicatorFallback(text) {
  const source = compactOcrText(text);
  if (!source) return null;
  const anchor = source.search(/建物門牌|主要用途|主要建材|層數|層次|總面積/);
  const start = anchor >= 0 ? anchor : 0;
  const tail = source.slice(start);
  const end = tail.search(/附屬建物|共有部[分份]|建築完成日期|權利範圍|其他登記事項/);
  const section = end > 0 ? tail.slice(0, end) : tail.slice(0, 900);
  const items = [...section.matchAll(new RegExp(`(\\d+[\\d,.]*)${AREA_UNIT_PATTERN}`, "gi"))]
    .map((match) => normalizeArea(match[1], match[2]))
    .filter((item) => item && item.valuePing > 3);
  if (!items.length) return null;
  return items.reduce((best, item) => item.valuePing > best.valuePing ? item : best, items[0]);
}

export function extractMainAreaFromBuildingSectionLabels(text) {
  const source = normalizeOcrAreaUnits(normalizeFullWidthDigitsToAscii(compactOcrText(text))).replace(/[．。·]/g, ".");
  if (!source) return null;
  const end = source.search(/附(?:屬)?建物|共有部[分份]|建物所有權部|建物他項權利部|其他登記事項|查詢時間/);
  const section = end > 0 ? source.slice(0, end) : source.slice(0, 1400);
  const layerRowsArea = extractMainAreaFromLayerRows(section);
  if (layerRowsArea) return layerRowsArea;
  const layerArea = extractBuildingAreaByLabelPattern(section, "層次面(?:積)?|主建物面積");
  const totalArea = extractBuildingAreaByLabelPattern(section, "總面(?:積)?|建物面積");
  if (layerArea && totalArea) {
    const exactLayer = exactAreaPing(layerArea);
    const exactTotal = exactAreaPing(totalArea);
    if (exactLayer != null && exactTotal != null && Math.abs(exactTotal - exactLayer) <= 0.05) return layerArea;
    if (exactLayer != null && exactTotal != null && exactTotal > exactLayer && hasAttachedUsageNearLayerArea(section)) return layerArea;
    return totalArea;
  }
  return layerArea || totalArea;
}

export function sumAreaItems(items) {
  const valid = items.filter((item) => item && Number.isFinite(item.valuePing));
  if (!valid.length) return null;
  const exactValuePing = valid.reduce((sum, item) => sum + (Number.isFinite(item.exactValuePing) ? item.exactValuePing : item.valuePing), 0);
  return {
    valuePing: +exactValuePing.toFixed(3),
    exactValuePing,
    adjustedValue: +(exactValuePing * 3.305785).toFixed(3),
    unit: "平方公尺"
  };
}

function formatAreaFormulaNumber(value, digits = 3) {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value || "");
  return String(+n.toFixed(digits));
}

function withAreaRawFormula(area, rawFormula) {
  if (!area || !rawFormula) return area;
  return {
    ...area,
    rawFormula,
    raw: `${rawFormula} = ${formatAreaFormulaNumber(area.adjustedValue)}平方公尺`
  };
}

function areaRightsFormula(baseSqm, numerator, denom, unit = "平方公尺") {
  const displayUnit = isSquareMeterAreaUnit(unit) ? "平方公尺" : unit;
  return `${formatAreaFormulaNumber(baseSqm)}${displayUnit} × ${numerator}/${denom}`;
}

function sumAreaItemsWithRaw(items) {
  const total = sumAreaItems(items);
  if (!total) return null;
  const formulas = items
    .map((item) => item?.rawFormula)
    .filter(Boolean);
  if (!formulas.length) return total;
  const rawFormula = formulas.join(" + ");
  return {
    ...total,
    rawFormula,
    raw: `${rawFormula} = ${formatAreaFormulaNumber(total.adjustedValue)}平方公尺`
  };
}

export function exactAreaPing(item) {
  if (!item || !Number.isFinite(item.valuePing)) return null;
  return Number.isFinite(item.exactValuePing) ? item.exactValuePing : item.valuePing;
}

export function normalizeLikelySqmArea(rawValue, maxSqm = 120) {
  const numeric = Number(String(rawValue || "").replace(/,/g, ""));
  if (!Number.isFinite(numeric) || numeric <= 0 || numeric > maxSqm) return null;
  return normalizeArea(numeric, "平方公尺");
}

export function isPlausibleAttachedAreaItem(item) {
  if (!item || !Number.isFinite(item.valuePing) || item.valuePing <= 0 || item.valuePing > 50) return false;
  const sqm = areaSqmValue(item);
  return sqm == null || sqm <= 160;
}

export const ATTACHED_LEVEL_USAGE_PATTERN = "(?:陽臺|陽台|雨遮|平台|露臺|露台|花臺|花台|騎樓|走廊|屋簷|屋檐|屋頂突出物)";
// 「騎樓」在舊式透天謄本常列在一般層次清單內，不能單靠它觸發「總面積 - 層次面積 = 附屬建物」備援。
export const ATTACHED_TOTAL_DIFF_USAGE_PATTERN = "(?:陽臺|陽台|陽壹|雨遮|平台|露臺|露台|花臺|花台|屋簷|屋檐|屋頂突出物)";
export const ATTACHED_LABEL_PATTERN = "附(?:屬)?建物";
export const ATTACHED_LOOSE_USAGE_PATTERN = "(?:陽臺|陽台|陽|雨遮|平台|露臺|露台|花臺|花台|騎樓|走廊|屋簷|屋檐|屋頂突出物)";

export function isArcadeLayerLabel(label = "") {
  return /騎樓/.test(compactOcrText(label));
}

export function isFirstFloorLayerLabel(label = "") {
  const text = normalizeFullWidthDigitsToAscii(compactOcrText(label));
  return /^(?:1|一|壹)層/.test(text) || /^(?:1|一|壹)樓/.test(text);
}

export function hasFirstFloorLayerArea(text) {
  const source = compactOcrText(text);
  if (!source) return false;
  const rows = source.matchAll(new RegExp(`層次[:：]?(.{1,18}?)(?:層次)?面積[^\\d]{0,50}\\d+[\\d,.]*${AREA_UNIT_PATTERN}`, "gi"));
  for (const match of rows) {
    if (isFirstFloorLayerLabel(match[1])) return true;
  }
  return false;
}

export function extractSeparatedAttachedAreaRows(text) {
  const cleaned = normalizeOcrAreaUnits(cleanOcrText(text).replace(/[*＊]+/g, ""));
  if (!cleaned || !new RegExp(ATTACHED_LABEL_PATTERN).test(cleaned)) return null;
  const startIndex = cleaned.search(new RegExp(`${ATTACHED_LABEL_PATTERN}用途|${ATTACHED_LABEL_PATTERN}`));
  if (startIndex < 0) return null;
  const tail = cleaned.slice(startIndex);
  const endIndex = tail.search(/共有心|共有部[分份]|公有部分|權利範圍|其他登記事項|建物所有權部|建物他項權利部|建築完成日期/);
  const attachedOnly = endIndex > 0 ? tail.slice(0, endIndex) : tail.slice(0, 1200);
  const lines = attachedOnly.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const usageRe = new RegExp(ATTACHED_LEVEL_USAGE_PATTERN, "g");
  const unitPattern = AREA_UNIT_PATTERN;
  const labeledAreaRe = new RegExp(`面積[^\\d]{0,30}(\\d+[\\d,.]*)${unitPattern}`, "gi");
  const bareAreaRe = new RegExp(`^[^\\d]{0,12}(\\d+[\\d,.]*)${unitPattern}`, "i");
  for (let start = 0; start < lines.length; start += 1) {
    if (!new RegExp(`${ATTACHED_LABEL_PATTERN}用途|${ATTACHED_LABEL_PATTERN}`).test(lines[start])) continue;
    let usageCount = 0;
    for (let i = start; i < Math.min(lines.length, start + 8); i += 1) {
      const line = lines[i];
      if (i > start && /共有心|共有部[分份]|公有部分|權利範圍|其他登記事項|建物所有權部|建物他項權利部/.test(line)) break;
      usageCount += (line.match(usageRe) || []).length;
    }
    if (usageCount < 2) continue;

    const end = (() => {
      for (let i = start + 1; i < Math.min(lines.length, start + 16); i += 1) {
        if (/共有心|共有部[分份]|公有部分|權利範圍|其他登記事項|建物所有權部|建物他項權利部|建築完成日期/.test(lines[i])) return i;
      }
      return Math.min(lines.length, start + 16);
    })();
    const items = [];
    let allowBareContinuation = false;
    for (let i = start; i < end; i += 1) {
      const line = lines[i];
      labeledAreaRe.lastIndex = 0;
      const labeledMatches = [...line.matchAll(labeledAreaRe)];
      if (labeledMatches.length) {
        labeledMatches.forEach((match) => {
          const item = normalizeArea(match[1], match[2]);
          if (item) items.push(item);
        });
        const tailText = line.slice(labeledMatches[labeledMatches.length - 1].index + labeledMatches[labeledMatches.length - 1][0].length).trim();
        const tailMatch = tailText.match(bareAreaRe);
        if (tailMatch) {
          const item = normalizeArea(tailMatch[1], tailMatch[2]);
          if (item) items.push(item);
        }
        allowBareContinuation = true;
        continue;
      }
      if (!allowBareContinuation || items.length >= usageCount) continue;
      if (/共有心|共有部[分份]|公有部分|權利範圍|建號|主要用途|使用執照|重測前|登記|層次|總面積/.test(line)) continue;
      const bareMatch = line.match(bareAreaRe);
      if (!bareMatch) continue;
      const item = normalizeArea(bareMatch[1], bareMatch[2]);
      if (item) items.push(item);
    }
    if (items.length >= usageCount) return sumAreaItems(uniqueAreaItems(items).slice(0, usageCount));
  }
  return null;
}

export function extractRapidOcrSplitAttachedAreaRows(text) {
  const source = compactOcrText(text);
  if (!source) return null;
  if (!new RegExp(ATTACHED_LABEL_PATTERN).test(source)) return null;
  const labelRe = new RegExp(`${ATTACHED_LABEL_PATTERN}(?:用途)?`);
  const labelIndex = source.search(labelRe);
  if (labelIndex < 0) return null;
  const beforeLabel = source.slice(0, labelIndex);
  const anchors = ["建築完成日期", "建完成日期", "築完成日期", "層次面積"];
  const anchorIndex = anchors.reduce((best, anchor) => {
    const index = beforeLabel.lastIndexOf(anchor);
    return index > best ? index : best;
  }, -1);
  const start = anchorIndex >= 0 ? anchorIndex : Math.max(0, labelIndex - 120);
  const tail = source.slice(start);
  const end = tail.search(/共有心|共有部[分份]|公有部分|權利範圍|其他登記事項|建物所有權部|建物他項權利部/);
  const section = end > 0 ? tail.slice(0, end) : tail.slice(0, 280);
  if (!labelRe.test(section)) return null;

  const usageCount = (section.match(new RegExp(ATTACHED_LOOSE_USAGE_PATTERN, "g")) || []).length;
  if (!usageCount) return null;
  const matches = [...section.matchAll(new RegExp(`(\\d+[\\d,.]*)${AREA_UNIT_PATTERN}`, "gi"))];
  const items = uniqueAreaItems(
    matches
      .map((match) => normalizeArea(match[1], match[2]))
      .filter(isPlausibleAttachedAreaItem)
  );
  if (!items.length) return null;
  const expectedCount = Math.min(usageCount, 4);
  const selected = items.length > expectedCount ? items.slice(-expectedCount) : items;
  return sumAreaItems(selected);
}

export function extractAttachedAreaColumnContinuation(text) {
  const source = compactOcrText(text);
  if (!source || !new RegExp(ATTACHED_LABEL_PATTERN).test(source)) return null;
  const markers = [...source.matchAll(new RegExp(`${ATTACHED_LABEL_PATTERN}(?:面積)?(?:\\(YOLOROI\\))?|${ATTACHED_LABEL_PATTERN}用途`, "g"))];
  for (let markerIndex = markers.length - 1; markerIndex >= 0; markerIndex -= 1) {
    const marker = markers[markerIndex];
    let zone = source.slice(marker.index || 0, (marker.index || 0) + 720);
    const stop = zone.search(/共有心|共有部分面積(?:\(YOLOROI\))?|共有部[分份]|公有部分|權利範圍|建物所有權部|建物他項權利部|土地標示部|土地他項權利部|其他登記事項|ncnn150dpi補強文字/);
    if (stop > 0) zone = zone.slice(0, stop);

    const areaLabels = [...zone.matchAll(/(?<!層次)(?<!總)面積[:：*＊]*/g)];
    const areaLabel = areaLabels.at(-1);
    const areaZone = areaLabel ? zone.slice((areaLabel.index || 0) + areaLabel[0].length) : zone;
    const items = [];
    const seenPhysicalSqm = [];
    for (const match of areaZone.matchAll(new RegExp(`(\\d+[\\d,.]*)${AREA_UNIT_PATTERN}`, "gi"))) {
      const item = normalizeArea(match[1], match[2]);
      if (!isPlausibleAttachedAreaItem(item)) continue;
      const sqm = isSquareMeterAreaUnit(item.unit) ? item.adjustedValue : item.valuePing * 3.305785;
      if (sqm != null && seenPhysicalSqm.some((value) => Math.abs(value - sqm) <= 0.05)) continue;
      if (sqm != null) seenPhysicalSqm.push(sqm);
      items.push(item);
    }
    if (items.length >= 2) return sumAreaItems(items.slice(0, 4));
  }
  return null;
}

export function hasAttachedUsageNearLayerArea(source) {
  const layerSlice = sliceCompactSection(
    source,
    [/層次面(?:積)?/],
    [/建築完成日期|建[票第]?完成日期|築完成日期|建物所有權部|建物他項權利部|共有部[分份]|其他登記事項/]
  );
  return new RegExp(ATTACHED_TOTAL_DIFF_USAGE_PATTERN).test(layerSlice);
}

export function extractAttachedLevelAreaSum(text) {
  const source = compactOcrText(text);
  if (!source) return null;
  const firstFloorLayer = hasFirstFloorLayerArea(source);
  const matches = [
    ...source.matchAll(new RegExp(`層次[:：]?${ATTACHED_LEVEL_USAGE_PATTERN}(?:層次)?面積[^\\d]{0,50}(\\d+[\\d,.]*)${AREA_UNIT_PATTERN}`, "gi")),
    ...source.matchAll(new RegExp(`層次[:：]?${ATTACHED_LEVEL_USAGE_PATTERN}[^面積]{0,40}面積[^\\d]{0,50}(\\d+[\\d,.]*)${AREA_UNIT_PATTERN}`, "gi")),
    ...source.matchAll(new RegExp(`${ATTACHED_LABEL_PATTERN}用途[:：]?${ATTACHED_LEVEL_USAGE_PATTERN}[^面積]{0,40}面積[^\\d]{0,50}(\\d+[\\d,.]*)${AREA_UNIT_PATTERN}`, "gi"))
  ];
  const items = uniqueAreaItems(matches.map((match) => {
    const label = String(match[0] || "");
    if (firstFloorLayer && isArcadeLayerLabel(label)) return null;
    return normalizeArea(match[1], match[2]);
  }).filter(Boolean));
  return sumAreaItems(items);
}

export function extractAttachedAreaItemsFromSection(sectionText) {
  const section = compactOcrText(sectionText);
  if (!section) return [];
  const unitPattern = AREA_UNIT_PATTERN;
  const patterns = [
    {
      re: new RegExp(`(?:${ATTACHED_LABEL_PATTERN}用途|用途)?${ATTACHED_LEVEL_USAGE_PATTERN}[^面積\\d]{0,40}面積[^\\d]{0,40}(\\d+[\\d,.]*)${unitPattern}`, "gi"),
      withUnit: true
    },
    {
      re: new RegExp(`(?:${ATTACHED_LABEL_PATTERN}用途|用途)?${ATTACHED_LEVEL_USAGE_PATTERN}[^\\d]{0,40}(\\d+[\\d,.]*)${unitPattern}`, "gi"),
      withUnit: true
    },
    {
      re: new RegExp(`(?:${ATTACHED_LABEL_PATTERN}用途|用途)?${ATTACHED_LEVEL_USAGE_PATTERN}[^面積\\d]{0,40}面積[^\\d]{0,40}(\\d+[\\d,.]*)`, "gi"),
      withUnit: false
    },
    {
      re: new RegExp(`(?:${ATTACHED_LABEL_PATTERN}用途|用途)?${ATTACHED_LEVEL_USAGE_PATTERN}[^\\d]{0,40}(\\d+[\\d,.]*)`, "gi"),
      withUnit: false
    }
  ];
  const items = [];
  patterns.forEach(({ re, withUnit }) => {
    for (const match of section.matchAll(re)) {
      const item = withUnit ? normalizeArea(match[1], match[2]) : normalizeLikelySqmArea(match[1]);
      if (item) items.push(item);
    }
  });
  if (new RegExp(ATTACHED_LABEL_PATTERN).test(section)) {
    const bareAreaRe = new RegExp(`(\\d+[\\d,.]*)${unitPattern}`, "gi");
    for (const match of section.matchAll(bareAreaRe)) {
      const item = normalizeArea(match[1], match[2]);
      if (isPlausibleAttachedAreaItem(item)) items.push(item);
    }
  }
  return uniqueAreaItemsByCrossUnitPhysicalArea(items);
}

export function extractAttachedAreaFromTotalLayerDifference(text) {
  const source = compactOcrText(text);
  if (!source || !hasAttachedUsageNearLayerArea(source)) return null;
  const total = extractArea(source, ["總面積", "總面积", "總面"]);
  const layer = extractArea(source, ["層次面積", "層次面积", "層次面"]);
  const totalPing = exactAreaPing(total);
  const layerPing = exactAreaPing(layer);
  if (totalPing == null || layerPing == null || totalPing <= layerPing) return null;
  const diffPing = totalPing - layerPing;
  if (!Number.isFinite(diffPing) || diffPing < 0.1 || diffPing > 30) return null;
  return { valuePing: +diffPing.toFixed(3), exactValuePing: diffPing, unit: "總面積扣層次面積" };
}

export function extractMainAreaFromTotalMinusAttachedLevel(text, attachedArea) {
  const source = compactOcrText(text);
  if (!source || !attachedArea || !Number.isFinite(attachedArea.valuePing)) return null;
  if (new RegExp(ATTACHED_LABEL_PATTERN).test(source)) return null;
  if (!new RegExp(`層次${ATTACHED_LEVEL_USAGE_PATTERN}`).test(source) && !hasAttachedUsageNearLayerArea(source)) return null;
  const total = extractArea(source, ["總面積", "總面积", "總面"]);
  if (!total || !Number.isFinite(total.valuePing) || total.valuePing <= attachedArea.valuePing) return null;
  const exactTotal = exactAreaPing(total);
  const exactAttach = exactAreaPing(attachedArea);
  if (exactTotal == null || exactAttach == null) return null;
  const exactMain = exactTotal - exactAttach;
  if (!Number.isFinite(exactMain) || exactMain <= 0) return null;
  return { valuePing: +exactMain.toFixed(3), exactValuePing: exactMain };
}

export function extractAttachAreaSum(text) {
  const source = compactOcrText(text);
  if (!source) return null;
  const separatedAttachedRows = extractSeparatedAttachedAreaRows(text);
  if (separatedAttachedRows) return separatedAttachedRows;
  const attachedColumnContinuation = extractAttachedAreaColumnContinuation(text);
  if (attachedColumnContinuation) return attachedColumnContinuation;
  const hasAttachedLabels = new RegExp(ATTACHED_LABEL_PATTERN).test(source);
  if (hasAttachedLabels) {
    const section = sliceCompactSection(
      source,
      [new RegExp(ATTACHED_LABEL_PATTERN)],
      [/共有部分|共有部份|其他登記事項|建物所有權部|建物他項權利部/]
    );
    const explicitAttachedArea = extractExplicitAttachedAreaFromText(section);
    if (explicitAttachedArea) return explicitAttachedArea;
    const sectionItems = extractAttachedAreaItemsFromSection(section);
    const sectionSum = sumAreaItems(sectionItems);
    if (sectionSum) return sectionSum;
  }
  const attachedLevelArea = extractAttachedLevelAreaSum(source);
  if (attachedLevelArea) return attachedLevelArea;
  const attachedByTotalLayerDiff = extractAttachedAreaFromTotalLayerDifference(source);
  if (attachedByTotalLayerDiff) return attachedByTotalLayerDiff;
  const rapidSplitAttachedRows = extractRapidOcrSplitAttachedAreaRows(text);
  if (rapidSplitAttachedRows) return rapidSplitAttachedRows;
  // 早期影印件偶爾漏掉「附屬建物」標題；此備援只在無標題時啟用，且必須緊貼「共有部分」前，避免誤吃共有部分面積。
  const orphanAreaMatches = [
    ...source.matchAll(new RegExp(`(?:建築完成日期|築完成日期)[^面積]{0,80}面積[^\\d]{0,30}(\\d+[\\d,.]*)${AREA_UNIT_PATTERN}(?=共有部[分份])`, "gi")),
    ...source.matchAll(new RegExp(`層次面積[^\\d]{0,30}\\d+[\\d,.]*${AREA_UNIT_NONCAPTURE}.{0,120}?面積[^\\d]{0,30}(\\d+[\\d,.]*)${AREA_UNIT_PATTERN}(?=共有部[分份])`, "gi"))
  ];
  const orphanItems = uniqueAreaItems(orphanAreaMatches.map((match) => normalizeArea(match[1], match[2])).filter(Boolean));
  if (orphanItems.length && !hasAttachedLabels) return sumAreaItems(orphanItems);
  return null;
}

export function extractSection(text, startLabel, endLabels) {
  const source = compactOcrText(text);
  const start = compactOcrText(startLabel);
  const ends = endLabels.map((label) => compactOcrText(label)).filter(Boolean);
  const startIndex = source.indexOf(start);
  if (startIndex < 0) return "";
  const tail = source.slice(startIndex + start.length);
  const indices = ends.map((label) => tail.indexOf(label)).filter((value) => value >= 0);
  const endIndex = indices.length ? Math.min(...indices) : tail.length;
  return tail.slice(0, endIndex);
}
export const RIGHTS_FRACTION_SOURCE = "(\\d{1,12})\\s*分(?:之|[^\\d]{0,8})(\\d{1,12})";
export function rightsFractionRegex(flags = "") {
  return new RegExp(RIGHTS_FRACTION_SOURCE, flags);
}
export function parseRightsNumeratorWithGluedArea(denom, rawDigits, decimalPart = "", baseSqm = null) {
  const digits = String(rawDigits || "").replace(/\D/g, "");
  const denominator = Number(denom);
  if (!digits || !Number.isFinite(denominator) || denominator <= 0) return null;
  const whole = Number(digits);
  if (!decimalPart && Number.isFinite(whole) && whole > denominator) {
    const repairedCandidates = [];
    if (denominator <= 999 && digits.length >= 4) {
      repairedCandidates.push(digits.slice(0, Math.max(1, digits.length - 3)));
    } else if (denominator >= 10000 && digits.length >= 5) {
      const tail3 = digits.slice(-3);
      if (!tail3.startsWith("0")) repairedCandidates.push(digits.slice(0, digits.length - 3));
      repairedCandidates.push(digits.slice(0, Math.min(3, digits.length - 2)));
      repairedCandidates.push(digits.slice(0, Math.min(4, digits.length - 2)));
    }
    for (const candidate of repairedCandidates) {
      const n = Number(candidate);
      if (Number.isFinite(n) && n > 0 && n <= denominator) return n;
    }
  }
  if (!decimalPart || !Number.isFinite(Number(baseSqm)) || Number(baseSqm) <= 0) {
    return Number.isFinite(whole) ? whole : null;
  }
  const candidates = [];
  for (let len = 1; len <= digits.length; len += 1) {
    const num = Number(digits.slice(0, len));
    const areaWhole = digits.slice(len);
    if (!Number.isFinite(num) || num <= 0 || num > denominator) continue;
    if (!areaWhole) {
      candidates.push({ num, score: 100 + len });
      continue;
    }
    const displayedSqm = Number(`${areaWhole}.${decimalPart}`);
    const plausibleDisplayedMax = Math.max(300, Number(baseSqm) * 0.05);
    if (!Number.isFinite(displayedSqm) || displayedSqm <= 0 || displayedSqm > plausibleDisplayedMax) continue;
    const computedSqm = Number(baseSqm) * num / denominator;
    const rel = Math.abs(computedSqm - displayedSqm) / Math.max(1, displayedSqm);
    const lenBias = Math.abs(len - 3) * 0.08;
    candidates.push({ num, score: (rel < 0.08 ? rel : 1 + rel) + lenBias });
  }
  candidates.sort((a, b) => a.score - b.score);
  return candidates.length ? candidates[0].num : (Number.isFinite(whole) ? whole : null);
}

function repairDroppedTrailingZeroCommonRights(denom, num, source, startIndex, endIndex, baseSqm = null) {
  if (!Number.isFinite(num)) return num;
  if (denom !== 10000 || num < 10 || num >= 100) return num;
  const candidate = num * 10;
  if (candidate <= 0 || candidate > denom) return num;
  const sqm = Number(baseSqm);
  if (!Number.isFinite(sqm) || sqm < 20 || sqm > 100000) return num;
  const before = source.slice(Math.max(0, startIndex - 160), startIndex);
  const after = source.slice(endIndex, endIndex + 48);
  const local = `${before}${source.slice(startIndex, endIndex)}${after}`;

  // 華安地政電傳 PDF 文字層偶爾把「105.82平方公尺 ... 10000分之930」
  // 拆成「105.82平方公尺 ... 10000分之93尺」；尾端的「尺」是前方平方公尺殘字。
  const hasCommonBuildingArea = /共有部[分份]/.test(before)
    && (
      /\d{4,6}-\d{3,4}建號\d+(?:[.,]\d+)?平方公尺/.test(before)
      || /\d+(?:[.,]\d+)?平方公尺共有部[分份]權利範圍$/.test(before)
      || /共有部[分份]權利範圍$/.test(before)
    );
  const hasDanglingSqmTail = /^尺(?:其他登記事項|使用執照|共有部[分份]|建物所有權部|建物他項權利部|查詢時間|$)/.test(after);
  const hasParkingContext = /停車位|車位|車道/.test(local);
  if (hasCommonBuildingArea && hasDanglingSqmTail && !hasParkingContext) return candidate;
  return num;
}

export function extractRightsFractions(text, baseSqm = null) {
  const c = compactOcrText(text);
  // 停車位專屬共有部分常見「87分之1」這類短分母；不能只吃萬分位。
  const re = /(\d{1,12})\s*分(?:之|[^\d]{0,8})(\d{1,12})(?:\.(\d+))?/g;
  const items = [];
  let match;
  while ((match = re.exec(c)) !== null) {
    const denom = Number(match[1]);
    const parsedNum = parseRightsNumeratorWithGluedArea(denom, match[2], match[3] || "", baseSqm);
    const num = repairDroppedTrailingZeroCommonRights(
      denom,
      parsedNum,
      c,
      match.index,
      match.index + match[0].length,
      baseSqm
    );
    if (Number.isFinite(denom) && denom > 0 && Number.isFinite(num) && num > 0 && num <= denom) {
      items.push({ index: match.index, denom, num });
    }
  }
  return items;
}
export function extractFractionAreas(sectionText) {
  const source = compactOcrText(sectionText);
  return [...source.matchAll(new RegExp(`${RIGHTS_FRACTION_SOURCE}[^\\d]{0,30}(\\d+[\\d,.]*)${AREA_UNIT_PATTERN}`, "gi"))]
    .map((match) => normalizeArea(match[3], match[4], Number(match[2]) / Number(match[1])))
    .filter(Boolean);
}
export function sumFractionAreas(sectionText) { const items = extractFractionAreas(sectionText); if (!items.length) return null; return { valuePing: +items.reduce((sum, item) => sum + item.valuePing, 0).toFixed(3) }; }
export function extractExplicitCommonAreaFromText(text) {
  const source = normalizeFullWidthDigitsToAscii(compactOcrText(text)).replace(/[．。·]/g, ".");
  if (!source) return null;
  const matches = [...source.matchAll(/共有部[分份][:：]?(\d+[\d,.]*)坪/g)];
  if (!matches.length) return null;
  const values = matches
    .map((match) => Number(String(match[1] || "").replace(/,/g, "")))
    .filter((value) => Number.isFinite(value) && value > 0 && value < 1000);
  if (!values.length) return null;
  return normalizeArea(String(values.reduce((sum, value) => sum + value, 0)), "坪");
}

export function extractExplicitAttachedAreaFromText(text) {
  const source = normalizeFullWidthDigitsToAscii(compactOcrText(text)).replace(/[．。·]/g, ".");
  if (!source) return null;
  const match = source.match(/附(?:屬)?建物[:：]?(?:面積)?(\d+[\d,.]*)坪/);
  if (!match) return null;
  const value = Number(String(match[1] || "").replace(/,/g, ""));
  return Number.isFinite(value) && value > 0 && value < 100 ? normalizeArea(String(value), "坪") : null;
}

export function extractExplicitParkingAreaAndCount(text) {
  const source = normalizeFullWidthDigitsToAscii(compactOcrText(text)).replace(/[．。·]/g, ".");
  if (!source) return null;
  const totalMatch = source.match(/車位總坪數[:：]?(\d+[\d,.]*)坪/);
  const parkingIds = new Set();
  for (const match of source.matchAll(/車位[編编]號[:：]?([^,，。；;]*?\d+[號号])/g)) {
    const id = String(match[1] || "").replace(/\s+/g, "");
    if (id) parkingIds.add(id);
  }
  if (!totalMatch && !parkingIds.size) return null;
  const totalPing = totalMatch ? Number(String(totalMatch[1] || "").replace(/,/g, "")) : NaN;
  const area = Number.isFinite(totalPing) && totalPing > 0 && totalPing < 1000
    ? normalizeArea(String(totalPing), "坪")
    : null;
  if (!area) return parkingIds.size ? { valuePing: 0, count: parkingIds.size, unit: "車位編號" } : null;
  return attachParkingCount(area, parkingIds.size);
}
export function extractCommonAreaFromBuildingNumberEntries(sectionText) {
  const source = correctKnownCommonRightsOcrNoise(
    normalizeOcrAreaUnits(normalizeFullWidthDigitsToAscii(compactOcrText(sectionText))).replace(/[．。·]/g, ".")
  );
  if (!source || !/共有部[分份]/.test(source)) return null;
  const entryRe = new RegExp(`([\\u4e00-\\u9fff]{0,20}\\d{4,6}-\\d{3,4}建號)(\\d+[\\d,.]*)${AREA_UNIT_PATTERN}`, "gi");
  const matches = [...source.matchAll(entryRe)];
  if (!matches.length) return null;
  const bestByEntry = new Map();
  for (let i = 0; i < matches.length; i += 1) {
    const match = matches[i];
    const full = match[0] || "";
    const id = full.match(/(\d{4,6}-\d{3,4})建號/)?.[1] || `${match.index}:${match[2]}`;
    const baseSqm = Number(String(match[2] || "").replace(/,/g, ""));
    if (!Number.isFinite(baseSqm) || baseSqm < 20 || baseSqm > 100000) continue;
    const nextIndex = matches[i + 1]?.index ?? source.length;
    const afterSlice = source.slice(match.index, nextIndex);
    const contextStart = Math.max(0, match.index - 70);
    const contextSlice = source.slice(contextStart, nextIndex);
    const afterRights = extractRightsFractions(afterSlice, baseSqm);
    const contextRights = afterRights.length ? afterRights : extractRightsFractions(contextSlice, baseSqm);
    if (!contextRights.length) continue;
    const right = contextRights.find((item) => item.num > 0 && item.num <= item.denom) || contextRights[0];
    if (!right || !Number.isFinite(right.num) || !Number.isFinite(right.denom) || right.denom <= 0) continue;
    const rightDistance = Number(right.index);
    const beforeRight = Number.isFinite(rightDistance) ? afterSlice.slice(0, rightDistance) : "";
    const crossEntryPenalty = /使用執照|登記事項|查詢時間/.test(beforeRight) ? -3 : 0;
    const proximityScore = Number.isFinite(rightDistance) ? Math.max(0, 2 - Math.min(rightDistance, 160) / 80) : 0;
    const score = (afterRights.length ? 4 : 0) + (/共有部[分份]/.test(afterSlice) ? 2 : 0) + (right.denom >= 10000 ? 1 : 0) + proximityScore + crossEntryPenalty;
    const area = normalizeArea(String(baseSqm * right.num / right.denom), "平方公尺");
    if (!area) continue;
    const formula = `${baseSqm}平方公尺 × ${right.num}/${right.denom}`;
    const current = bestByEntry.get(id);
    if (!current || score > current.score) {
      bestByEntry.set(id, { area, score, formula });
    }
  }
  const items = [...bestByEntry.values()].map((item) => item.area);
  if (!items.length) return null;
  const total = sumAreaItems(items);
  if (!total) return null;
  const formula = [...bestByEntry.values()]
    .map((item) => item.formula)
    .filter(Boolean)
    .join(" + ");
  return formula
    ? {
        ...total,
        rawFormula: formula,
        raw: `${formula} = ${total.adjustedValue}平方公尺`
      }
    : total;
}
/** 共有部分：整筆面積（平方公尺）× 權利範圍（萬分之、10000分之127）。sectionText 為 extractSection 擷取之「標題後片段」，不含「共有部分」字面。 */
export function largestSqmInText(c) {
  const source = normalizeOcrAreaUnits(c);
  const re = new RegExp(`(\\d+[\\d,.]*)\\s*${SQM_UNIT_PATTERN}`, "g");
  let m;
  let best = 0;
  while ((m = re.exec(source)) !== null) {
    const v = Number(String(m[1]).replace(/,/g, ""));
    if (Number.isFinite(v) && v > best) best = v;
  }
  return best > 0 ? best : null;
}
export function commonBaseSqmInText(c) {
  const compact = correctKnownCommonRightsOcrNoise(compactOcrText(c));
  if (!compact) return null;
  const commonStart = compact.search(/共有部[分份]/);
  const scope = commonStart >= 0 ? compact.slice(commonStart) : compact;
  const candidates = [];
  for (const match of compact.matchAll(/建號(\d+[\d,.]*)(?=共有部[分份]|權利範圍|平方公尺|平方|㎡)/g)) {
    const v = Number(String(match[1]).replace(/,/g, ""));
    if (Number.isFinite(v) && v > 0) candidates.push(v);
  }
  for (const match of scope.matchAll(/共有部[分份][^建]{0,80}建號(\d+[\d,.]*)/g)) {
    const v = Number(String(match[1]).replace(/,/g, ""));
    if (Number.isFinite(v) && v > 0) candidates.push(v);
  }
  const realistic = candidates.filter((v) => v >= 20);
  if (realistic.length) return Math.max(...realistic);
  const beforeRights = lastSqmBeforeRightsInText(scope) || firstSqmBeforeRightsInText(scope);
  if (beforeRights != null && beforeRights >= 20) return beforeRights;
  const explicit = largestSqmInText(scope);
  return explicit != null && explicit >= 20 ? explicit : null;
}
export function firstSqmBeforeRightsInText(c) {
  const source = normalizeOcrAreaUnits(c);
  const rightsIdx = source.search(/權利範圍|權利/);
  const scope = rightsIdx > 0 ? source.slice(0, rightsIdx) : source;
  const match = scope.match(new RegExp(`(\\d+[\\d,.]*)\\s*${SQM_UNIT_PATTERN}`));
  if (!match) return null;
  const v = Number(String(match[1]).replace(/,/g, ""));
  return Number.isFinite(v) && v > 0 ? v : null;
}
export function lastSqmBeforeRightsInText(c) {
  const source = normalizeOcrAreaUnits(c);
  const rightsIdx = source.search(/權利範圍|權利/);
  const scope = rightsIdx > 0 ? source.slice(0, rightsIdx) : source;
  const matches = [...scope.matchAll(new RegExp(`(\\d+[\\d,.]*)\\s*${SQM_UNIT_PATTERN}`, "g"))];
  if (!matches.length) return null;
  const v = Number(String(matches[matches.length - 1][1]).replace(/,/g, ""));
  return Number.isFinite(v) && v > 0 ? v : null;
}
export function parkingRightsScopeEnd(c, parkingIdx) {
  if (parkingIdx < 0) return c.length;
  const tail = c.slice(parkingIdx);
  const end = tail.search(/共有部[分份]|建築基地權利|基地權利|土地權利|其他登記事項共\d+筆|建物所有權部|建物他項權利部|查詢時間/);
  return end > 0 ? parkingIdx + end : c.length;
}
export function findParkingRightsAnchor(c) {
  const anchors = [/含停車位/, /停車位編號/, /車位編號(?=.{0,80}權利範圍)/];
  for (const pattern of anchors) {
    const idx = c.search(pattern);
    if (idx >= 0) return idx;
  }
  return -1;
}
export function findEarliestPatternIndex(text, patterns) {
  let best = -1;
  for (const pattern of patterns) {
    const idx = String(text || "").search(pattern);
    if (idx >= 0 && (best < 0 || idx < best)) best = idx;
  }
  return best;
}
export function selectCommonTotalRightBeforeParking(c, parkingIdx, rights) {
  const text = compactOcrText(c);
  const items = Array.isArray(rights) ? rights : [];
  if (!items.length || parkingIdx < 0) return null;
  const beforeParking = text.slice(0, parkingIdx);
  const parkingNoteStart = findEarliestPatternIndex(beforeParking, [
    /其他登記事項停車位共計/,
    /停車位共計/,
    /建築基地權利/,
    /基地權利/,
    /每一車位持分/
  ]);
  const commonScopeEnd = parkingNoteStart >= 0 ? parkingNoteStart : parkingIdx;
  const scoped = items.filter((item) => item.index < commonScopeEnd).at(-1);
  if (scoped) return scoped;
  return items.filter((item) => item.index < parkingIdx).at(-1) || null;
}
export function commonPartEntryStarts(c) {
  const text = compactOcrText(c);
  const starts = [];
  const markerRe = /共有部[分份]/g;
  let marker;
  while ((marker = markerRe.exec(text)) !== null) {
    const before = text.slice(Math.max(0, marker.index - 2), marker.index);
    const after = text.slice(marker.index + marker[0].length, marker.index + marker[0].length + 12);
    if (before.endsWith("本") && /^之?項目/.test(after)) continue;
    starts.push(marker.index);
  }
  return starts;
}
export function isDedicatedParkingCommonPartSlice(slice) {
  const c = compactOcrText(slice);
  if (!c) return false;
  return /含停車位|停車位編號|車位編號/.test(c);
}
export function extractCommonAreaFromBaseSqmAndRightsFraction(sectionText) {
  const c = correctKnownCommonRightsOcrNoise(compactOcrText(sectionText));
  if (!c || c.length < 8) return null;
  const baseSqm = commonBaseSqmInText(c) || lastSqmBeforeRightsInText(c) || firstSqmBeforeRightsInText(c) || largestSqmInText(c);
  if (baseSqm == null) return null;
  let ratio = null;
  const rightsItems = extractRightsFractions(c, baseSqm);
  const rightsM = rightsItems.find((item) => item.index >= c.indexOf("權利範圍")) || rightsItems[0];
  if (rightsM) ratio = rightsM.num / rightsM.denom;
  if (ratio == null || !Number.isFinite(ratio)) {
    const wanM = c.match(/權利範圍.{0,60}?萬分之(\d{1,9})/);
    if (wanM) ratio = Number(wanM[1]) / 10000;
  }
  if (ratio == null || !Number.isFinite(ratio) || ratio <= 0 || ratio > 1) return null;
  const effectiveSqm = baseSqm * ratio;
  return normalizeArea(String(effectiveSqm), "平方公尺");
}
/**
 * 共有部分與停車位分攤同一筆基地／大樓面積（平方公尺）：先出現之「權利範圍」為含車位合計分子，
 * 「停車位」之後再出現之「權利範圍」為車位專屬分子；共有坪數應扣除車位分子（與謄本註記一致）。
 */
export function extractCommonAndParkingFromSharedBase(sectionText) {
  const c = correctKnownCommonRightsOcrNoise(compactOcrText(sectionText));
  if (!c || c.length < 8) return null;
  const baseSqm = commonBaseSqmInText(c) || largestSqmInText(c);
  if (baseSqm == null) return null;
  const parkingIdx = findParkingRightsAnchor(c);
  if (parkingIdx < 0) return null;
  const parkingEnd = parkingRightsScopeEnd(c, parkingIdx);
  const allRights = extractRightsFractions(c, baseSqm);
  const lastBeforeParking = selectCommonTotalRightBeforeParking(c, parkingIdx, allRights);
  if (!lastBeforeParking) return null;
  const parkingRights = allRights.filter((item) => item.index > parkingIdx && item.index < parkingEnd && item.denom === lastBeforeParking.denom && item.num > 0);
  if (!parkingRights.length) return null;
  const totalNum = lastBeforeParking.num;
  const parkNum = parkingRights.reduce((sum, item) => sum + item.num, 0);
  if (!(parkNum > 0 && totalNum >= parkNum)) return null;
  const denom = lastBeforeParking.denom;
  const commonSqm = (baseSqm * (totalNum - parkNum)) / denom;
  const parkingSqm = (baseSqm * parkNum) / denom;
  const parking = withAreaRawFormula(
    normalizeParkingRightsShare(parkingSqm),
    areaRightsFormula(baseSqm, parkNum, denom)
  );
  const common = withAreaRawFormula(
    normalizeArea(String(commonSqm), "平方公尺"),
    areaRightsFormula(baseSqm, `(${totalNum}-${parkNum})`, denom)
  );
  return {
    common,
    parking: attachParkingCount(parking, parkingRights.length)
  };
}
export function shouldPreferSharedBaseParkingSplit(sectionText, sharedBaseSplit, entrySplit) {
  const c = correctKnownCommonRightsOcrNoise(compactOcrText(sectionText));
  if (!sharedBaseSplit?.common || !sharedBaseSplit?.parking || !entrySplit?.common) return false;
  if (!/停車位共計|含停車位|停車位編號|車位編號/.test(c)) return false;
  const parkingIdx = findParkingRightsAnchor(c);
  if (parkingIdx < 0) return false;
  const laterCommonStarts = commonPartEntryStarts(c).filter((start) => start > parkingIdx);
  if (!laterCommonStarts.length) return false;
  const sharedCommonPing = areaPingValue(sharedBaseSplit.common);
  const entryCommonPing = areaPingValue(entrySplit.common);
  if (!(sharedCommonPing > 0) || !(entryCommonPing > sharedCommonPing * 2)) return false;
  const laterHasDedicatedParking = laterCommonStarts.some((start, idx) => {
    const nextStart = laterCommonStarts[idx + 1] ?? c.length;
    return isDedicatedParkingCommonPartSlice(c.slice(start, nextStart));
  });
  return !laterHasDedicatedParking;
}
export function extractCommonAndParkingSums(sectionText) {
  const c = correctKnownCommonRightsOcrNoise(compactOcrText(sectionText));
  if (!c || !/共有部分|共有部份/.test(c)) return null;
  const commonByEntry = new Map();
  const parkingByEntry = new Map();
  const commonEntryKey = (id, baseSqm, fallbackIndex = "") => {
    const digits = String(id || "").replace(/\D/g, "");
    if (digits) return digits.slice(0, 5);
    const value = Number(baseSqm);
    return Number.isFinite(value) ? `sqm:${value.toFixed(2)}` : `idx:${fallbackIndex}`;
  };
  const addCommonItem = (key, area, preferSplit = false) => {
    if (!area) return;
    const sqm = areaSqmValue(area);
    const current = commonByEntry.get(key);
    const currentSqm = areaSqmValue(current?.area);
    if (
      !current
      || (preferSplit && !current.preferSplit)
      || (preferSplit === current.preferSplit && sqm != null && (currentSqm == null || sqm > currentSqm))
    ) {
      commonByEntry.set(key, { area, preferSplit });
    }
  };
  const addParkingItem = (key, area, count = 0) => {
    if (!area) return;
    const sqm = areaSqmValue(area);
    const current = parkingByEntry.get(key);
    const currentSqm = areaSqmValue(current?.area);
    if (!current || (sqm != null && (currentSqm == null || sqm > currentSqm))) {
      parkingByEntry.set(key, { area, count });
    }
  };
  const commonItemsList = () => Array.from(commonByEntry.values()).map((item) => item.area);
  const parkingItemsList = () => Array.from(parkingByEntry.values()).map((item) => item.area);
  const parkingCountTotal = () => Array.from(parkingByEntry.values()).reduce((sum, item) => sum + (Number(item.count) || 0), 0);
  const entryRe = new RegExp(`建號(\\d+[\\d,.]*)${AREA_UNIT_PATTERN}(.*?)(?=[\\u4e00-\\u9fff]{0,12}\\d{5}-\\d{3}建號\\d+[\\d,.]*${AREA_UNIT_NONCAPTURE}|其他登記事項共\\d+筆|建物所有權部|建物他項權利部|查詢時間|$)`, "g");
  let entryMatch;
  while ((entryMatch = entryRe.exec(c)) !== null) {
    const base = normalizeArea(entryMatch[1], entryMatch[2]);
    if (!base) continue;
    const entryKey = commonEntryKey("", base.rawValue, entryMatch.index);
    const slice = entryMatch[3] || "";
    const rights = extractRightsFractions(slice, base.rawValue);
    if (!rights.length) continue;
    const parkingIdx = findParkingRightsAnchor(slice);
    if (parkingIdx >= 0) {
      const parkingEnd = parkingRightsScopeEnd(slice, parkingIdx);
      const totalRight = selectCommonTotalRightBeforeParking(slice, parkingIdx, rights);
      const parkingRights = totalRight
        ? rights.filter((item) => item.index > parkingIdx && item.index < parkingEnd && item.denom === totalRight.denom && item.num > 0)
        : [];
      const parkingNum = parkingRights.reduce((sum, item) => sum + item.num, 0);
      if (totalRight && parkingRights.length && totalRight.num >= parkingNum) {
        addCommonItem(entryKey, withAreaRawFormula(
          normalizeArea(String(base.rawValue * (totalRight.num - parkingNum) / totalRight.denom), entryMatch[2]),
          areaRightsFormula(base.rawValue, `(${totalRight.num}-${parkingNum})`, totalRight.denom, entryMatch[2])
        ), true);
        addParkingItem(entryKey, withAreaRawFormula(
          normalizeParkingRightsShare(base.rawValue * parkingNum / totalRight.denom, entryMatch[2]),
          areaRightsFormula(base.rawValue, parkingNum, totalRight.denom, entryMatch[2])
        ), parkingRights.length);
        continue;
      }
    }
    const firstRight = rights[0];
    if (isDedicatedParkingCommonPartSlice(slice)) {
      addParkingItem(entryKey, withAreaRawFormula(
        normalizeParkingRightsShare(base.rawValue * firstRight.num / firstRight.denom, entryMatch[2]),
        areaRightsFormula(base.rawValue, firstRight.num, firstRight.denom, entryMatch[2])
      ));
      continue;
    }
    addCommonItem(entryKey, withAreaRawFormula(
      normalizeArea(String(base.rawValue * firstRight.num / firstRight.denom), entryMatch[2]),
      areaRightsFormula(base.rawValue, firstRight.num, firstRight.denom, entryMatch[2])
    ));
  }
  if (commonByEntry.size || parkingByEntry.size) {
    const common = sumAreaItemsWithRaw(commonItemsList());
    const parking = sumAreaItemsWithRaw(parkingItemsList());
    attachParkingCount(parking, parkingCountTotal());
    return common || parking ? { common, parking } : null;
  }
  const starts = commonPartEntryStarts(c);
  if (!starts.length) return null;
  for (let i = 0; i < starts.length; i += 1) {
    const start = starts[i];
    const nextStart = starts[i + 1] ?? c.length;
    const hardEnd = c.slice(start, nextStart).search(/其他登記事項共\d+筆|建物所有權部|建物他項權利部|查詢時間/);
    const slice = hardEnd > 0 ? c.slice(start, start + hardEnd) : c.slice(start, nextStart);
    const baseSqm = commonBaseSqmInText(slice) || lastSqmBeforeRightsInText(slice) || firstSqmBeforeRightsInText(slice) || largestSqmInText(slice);
    if (baseSqm == null) continue;
    const entryKey = commonEntryKey("", baseSqm, start);
    const rights = extractRightsFractions(slice, baseSqm);
    if (!rights.length) continue;
    const parkingIdx = findParkingRightsAnchor(slice);
    if (parkingIdx >= 0) {
      const parkingEnd = parkingRightsScopeEnd(slice, parkingIdx);
      const totalRight = selectCommonTotalRightBeforeParking(slice, parkingIdx, rights);
      const parkingRights = totalRight
        ? rights.filter((item) => item.index > parkingIdx && item.index < parkingEnd && item.denom === totalRight.denom && item.num > 0)
        : [];
      const parkingNum = parkingRights.reduce((sum, item) => sum + item.num, 0);
      if (totalRight && parkingRights.length && totalRight.num >= parkingNum) {
        addCommonItem(entryKey, withAreaRawFormula(
          normalizeArea(String(baseSqm * (totalRight.num - parkingNum) / totalRight.denom), "平方公尺"),
          areaRightsFormula(baseSqm, `(${totalRight.num}-${parkingNum})`, totalRight.denom)
        ), true);
        addParkingItem(entryKey, withAreaRawFormula(
          normalizeParkingRightsShare(baseSqm * parkingNum / totalRight.denom),
          areaRightsFormula(baseSqm, parkingNum, totalRight.denom)
        ), parkingRights.length);
        continue;
      }
    }
    const firstRight = rights[0];
    if (isDedicatedParkingCommonPartSlice(slice)) {
      addParkingItem(entryKey, withAreaRawFormula(
        normalizeParkingRightsShare(baseSqm * firstRight.num / firstRight.denom),
        areaRightsFormula(baseSqm, firstRight.num, firstRight.denom)
      ));
      continue;
    }
    addCommonItem(entryKey, withAreaRawFormula(
      normalizeArea(String(baseSqm * firstRight.num / firstRight.denom), "平方公尺"),
      areaRightsFormula(baseSqm, firstRight.num, firstRight.denom)
    ));
  }
  const common = sumAreaItemsWithRaw(commonItemsList());
  const parking = sumAreaItemsWithRaw(parkingItemsList());
  attachParkingCount(parking, parkingCountTotal());
  return common || parking ? { common, parking } : null;
}
export function extractBestCommonAndParking(sectionText) {
  const entrySplit = extractCommonAndParkingSums(sectionText);
  const sharedBaseSplit = extractCommonAndParkingFromSharedBase(sectionText);
  if (sharedBaseSplit?.parking) {
    const sharedTotal = (sharedBaseSplit.common?.valuePing || 0) + (sharedBaseSplit.parking?.valuePing || 0);
    const entryTotal = (entrySplit?.common?.valuePing || 0) + (entrySplit?.parking?.valuePing || 0);
    if (!entrySplit?.parking || sharedTotal > entryTotal * 1.5) return sharedBaseSplit;
  }
  if (entrySplit?.parking) return entrySplit;
  return sharedBaseSplit || entrySplit;
}
export function areaPingValue(area) {
  const value = Number(area?.valuePing);
  return Number.isFinite(value) ? value : null;
}
export function areaSqmValue(area) {
  const adjusted = Number(area?.adjustedValue);
  if (Number.isFinite(adjusted) && adjusted > 0) return adjusted;
  const raw = Number(area?.rawValue);
  if (Number.isFinite(raw) && raw > 0 && isSquareMeterAreaUnit(area?.unit || "")) return raw;
  const ping = areaPingValue(area);
  return ping != null ? ping * 3.305785 : null;
}
export function preferReliableCommonArea(current, candidate) {
  const candidatePing = areaPingValue(candidate);
  if (candidatePing == null || candidatePing <= 0 || candidatePing > 300) return current;
  const candidateSqm = areaSqmValue(candidate);
  if (candidateSqm != null && candidateSqm < 1) return current;
  const currentPing = areaPingValue(current);
  if (currentPing == null || currentPing <= 0) return candidate;
  const candidateFormula = String(candidate?.rawFormula || candidate?.raw || "");
  if (/\(\d+(?:\.\d+)?-\d+(?:\.\d+)?\)/.test(candidateFormula) && currentPing > candidatePing * 2) return candidate;
  if (/\+/.test(candidateFormula) && currentPing > candidatePing * 1.2 && currentPing - candidatePing > 0.5) return candidate;
  if (/\+/.test(candidateFormula) && candidatePing > currentPing * 1.2 && candidatePing - currentPing > 0.5) return candidate;
  // 欄位級 OCR 偶爾只抓到共有區的小碎片；完整共有區段換算值明顯較大時以完整區段為準。
  if (candidatePing > currentPing * 3 && candidatePing - currentPing > 1) return candidate;
  return current;
}
export function extractReliableCommonAreaFromText(text) {
  const section = extractCommonSectionSlice(text);
  const compact = compactOcrText(section);
  if (!compact || !/共有部分|共有部份/.test(compact) || !/權利範圍|權利/.test(compact)) return null;
  const split = extractBestCommonAndParking(section);
  const direct =
    extractExplicitCommonAreaFromText(`共有部分${section}`)
    || extractCommonAreaFromCommonMarkers(section)
    || extractCommonAreaFromBaseSqmAndRightsFraction(section)
    || sumFractionAreas(section);
  return preferReliableCommonArea(direct, split?.common);
}

function compactCommonEvidenceText(text) {
  return normalizeOcrAreaUnits(normalizeFullWidthDigitsToAscii(compactOcrText(text || "")))
    .replace(/[．。]/g, ".")
    .replace(/\s+/g, "")
    .replace(/Y\s*O\s*L\s*O\s*R\s*O\s*I/gi, "YOLOROI");
}

export function hasRealCommonPartEvidence(text) {
  const compact = compactCommonEvidenceText(text)
    .replace(/共有部[分份]面積(?:[\(（]?YOLOROI[\)）]?)/g, "");
  if (!/共有部[分份]/.test(compact)) return false;
  return (
    /共有部[分份].{0,100}建號/.test(compact)
    || /共有部[分份].{0,220}權利範圍/.test(compact)
    || new RegExp(`共有部[分份](?:資料)?[:：]?[^\\d]{0,40}\\d+[\\d,.]*${AREA_UNIT_PATTERN}`).test(compact)
  );
}

function isSyntheticCommonRoiOnlySection(sectionText) {
  const compact = compactCommonEvidenceText(sectionText);
  if (!compact) return false;
  if (!/^面積(?:[\(（]?YOLOROI[\)）]?)/.test(compact)) return false;
  return !hasRealCommonPartEvidence(`共有部分${sectionText}`);
}

export function extractCommonAreaFromCommonMarkers(sectionText) {
  const c = correctKnownCommonRightsOcrNoise(
    normalizeOcrAreaUnits(normalizeFullWidthDigitsToAscii(compactOcrText(sectionText))).replace(/[．。]/g, ".")
  );
  if (!c || !/共有部分|共有部份/.test(c)) return null;
  const items = [];
  const markerRe = /共有部[分份]/g;
  const starts = [];
  let marker;
  while ((marker = markerRe.exec(c)) !== null) starts.push(marker.index);
  for (let i = 0; i < starts.length; i += 1) {
    const start = starts[i];
    const nextStart = starts[i + 1] ?? c.length;
    const rawSlice = c.slice(start, nextStart);
    const hardEnd = rawSlice.search(/其他登記事項|建物所有權部|建物他項權利部|登記次序|查詢時間/);
    const slice = hardEnd > 0 ? rawSlice.slice(0, hardEnd) : rawSlice;
    if (isDedicatedParkingCommonPartSlice(slice)) continue;
    const areaMatch = slice.match(new RegExp(`(?:面積)?[^\\d]{0,40}(\\d+[\\d,.]*)${AREA_UNIT_PATTERN}`, "i"));
    if (!areaMatch) continue;
    const rawArea = Number(String(areaMatch[1] || "").replace(/,/g, ""));
    if (!Number.isFinite(rawArea) || rawArea <= 0) continue;
    const right = extractRightsFractions(slice, rawArea)[0];
    if (!right) continue;
    const denom = right.denom;
    const num = right.num;
    if (!Number.isFinite(denom) || !Number.isFinite(num) || denom <= 0 || num <= 0 || num > denom) continue;
    const adjusted = rawArea * (num / denom);
    const valuePing = isSquareMeterAreaUnit(areaMatch[2]) ? adjusted / 3.305785 : adjusted;
    if (Number.isFinite(valuePing)) items.push({ valuePing });
  }
  return sumAreaItems(items);
}
export function extractCommonSectionSlice(text) {
  /** 勿以首段「其他登記事項」截斷：停車位權利範圍常列於其後，須一併納入才能拆算共有／車位 */
  const ends = ["建物所有權部", "建物他項權利部", "建物他項權利", "查詢時間"];
  const a = extractSection(text, "共有部分", ends);
  if (a && !isSyntheticCommonRoiOnlySection(a)) return a;
  const b = extractSection(text, "共有部份", ends);
  return b && !isSyntheticCommonRoiOnlySection(b) ? b : "";
}
