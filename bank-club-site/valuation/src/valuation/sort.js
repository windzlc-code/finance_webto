import { cleanOcrText, normalizeFullWidthDigitsToAscii, parseFloorLevelToken, toNumber } from "../utils.js";
import { normalizeDoorplateForMatch, parseComparableAddressParts } from "./address.js";
import { normalizeMainPurposeText, rowFloorIsFullLevel } from "./run-search.js";

export function dateFromYmdParts(year, month, day) {
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  const dt = new Date(year, month - 1, day);
  if (dt.getFullYear() !== year || dt.getMonth() !== month - 1 || dt.getDate() !== day) return null;
  return dt;
}

export function parseDateFromText(dateText) {
  const text = normalizeFullWidthDigitsToAscii(String(dateText || "").trim());
  if (!text) return null;
  const ad = text.match(/(19\d{2}|20\d{2})\D{0,2}(\d{1,2})\D{0,2}(\d{1,2})/);
  if (ad) return dateFromYmdParts(Number(ad[1]), Number(ad[2]), Number(ad[3]));
  const roc = text.match(/(\d{2,3})\D{0,2}(\d{1,2})\D{0,2}(\d{1,2})/);
  if (roc) return dateFromYmdParts(Number(roc[1]) + 1911, Number(roc[2]), Number(roc[3]));
  return null;
}

export function startOfLocalDay(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function oneYearBefore(date) {
  const d = startOfLocalDay(date);
  if (!d) return null;
  return new Date(d.getFullYear() - 1, d.getMonth(), d.getDate());
}

export function isDateWithinLastYear(tradeDate, queryDate = new Date()) {
  const trade = startOfLocalDay(tradeDate);
  const query = startOfLocalDay(queryDate);
  const lower = oneYearBefore(query);
  if (!trade || !query || !lower) return false;
  return trade >= lower && trade <= query;
}

export function sameDoorplateAsSubject(rowAddress, subjectKeys = []) {
  const rowKey = normalizeDoorplateForMatch(rowAddress);
  if (!rowKey || !subjectKeys.length) return false;
  return subjectKeys.some((key) => rowKey === key);
}

export function findShortTermPriorSale(rows, subjectKeys = [], queryDate = new Date()) {
  if (!Array.isArray(subjectKeys) || !subjectKeys.length) return null;
  return rows
    .map((row) => ({ row, tradeDate: parseDateFromText(row.tradeDate || row.tradeYearMonth || "") }))
    .filter(({ row, tradeDate }) =>
      sameDoorplateAsSubject(row.address, subjectKeys)
      && tradeDate
      && isDateWithinLastYear(tradeDate, queryDate)
      && Number.isFinite(row.unitPrice)
      && Number.isFinite(row.totalPrice)
    )
    .sort((a, b) => b.tradeDate.getTime() - a.tradeDate.getTime())[0] || null;
}

export function resolveAppraisalBaseDate(query) {
  const year = Number(query?.periodEndYear);
  const month = Number(query?.periodEndMonth);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return new Date();
  return new Date(year + 1911, month, 0);
}

export function resolveSubjectAgeFromDeedCompletion(completionDateText, appraisalBaseDate = new Date()) {
  const completion = parseDateFromText(completionDateText);
  if (!completion) return null;
  if (!(appraisalBaseDate instanceof Date) || Number.isNaN(appraisalBaseDate.getTime())) return null;
  const deltaMs = appraisalBaseDate.getTime() - completion.getTime();
  if (deltaMs < 0) return null;
  const ageYears = deltaMs / (365.2425 * 24 * 60 * 60 * 1000);
  if (!Number.isFinite(ageYears)) return null;
  return +ageYears.toFixed(3);
}

export function formatDateYmd(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** 由「樓別／樓高」取所在樓層（斜線前為所在層） */
export function parseUnitFloorFromFloorInfo(floorInfo) {
  const raw = normalizeFullWidthDigitsToAscii(String(floorInfo || "").trim());
  if (!raw) return null;
  const firstSeg = raw.split(/[\/／]/)[0].replace(/\s+/g, "");
  if (!firstSeg || /地下|B1|b1/i.test(firstSeg)) return null;
  const m = firstSeg.match(/^([0-9一二三四五六七八九十百千壹]+)\s*(樓|層|F|f)/i);
  if (m) return parseFloorLevelToken(m[1]);
  const plain = firstSeg.match(/^([0-9一二三四五六七八九十百千壹]+)$/u);
  return plain ? parseFloorLevelToken(plain[1]) : null;
}

/** 從樓別／樓高字串推定總樓層（常見「所在／總層」以斜線分隔） */
export function parseTotalFloorsFromFloorInfo(text) {
  const s = normalizeFullWidthDigitsToAscii(String(text || "").trim());
  if (!s) return null;
  const slash = s.match(/([0-9一二三四五六七八九十百千壹]+)\s*(?:樓|層|F|f)?\s*[\/／]\s*([0-9一二三四五六七八九十百千壹]+)\s*(?:樓|層|F|f)?/u);
  if (slash) {
    const a = parseFloorLevelToken(slash[1]);
    const b = parseFloorLevelToken(slash[2]);
    if (Number.isFinite(a) && Number.isFinite(b)) return Math.max(a, b);
  }
  const nums = [...s.matchAll(/([0-9一二三四五六七八九十百千壹]+)\s*(?:樓|層|F|f)/gu)]
    .map((m) => parseFloorLevelToken(m[1]))
    .filter((n) => Number.isFinite(n));
  if (nums.length) return Math.max(...nums);
  const plain = toNumber(s);
  return Number.isFinite(plain) ? plain : null;
}

export function ageDistanceForSort(rowAge, refAge) {
  if (refAge == null || !Number.isFinite(refAge)) return 0;
  const a = toNumber(rowAge);
  if (!Number.isFinite(a)) return 1e9;
  return Math.abs(a - refAge);
}

export function floorDistanceForSort(floorInfo, refFloors) {
  if (refFloors == null || !Number.isFinite(refFloors) || refFloors <= 0) return 0;
  const fp = parseTotalFloorsFromFloorInfo(floorInfo);
  if (fp == null || !Number.isFinite(fp)) return 1e9;
  return Math.abs(fp - refFloors);
}

export function areaDistanceForSort(rowTotalArea, subjectTotalPing) {
  const target = toNumber(subjectTotalPing);
  if (!Number.isFinite(target) || target <= 0) return 0;
  const totalArea = toNumber(rowTotalArea);
  if (!Number.isFinite(totalArea) || totalArea <= 0) return 1e9;
  return Math.abs(totalArea - target);
}

export function normalizeBuildingType(typeText) {
  const text = cleanOcrText(String(typeText || "")).replace(/\s+/g, "");
  if (!text) return "";
  if (/華廈/.test(text)) return "華廈";
  if (/住宅大樓|電梯大樓|大樓/.test(text)) return "大樓";
  if (/公寓|無電梯公寓/.test(text)) return "公寓";
  if (/透天厝|透天|別墅|全棟/.test(text)) return "透天";
  if (/店面|住商|商辦|商業|辦公/.test(text)) return "商用";
  return text;
}

function normalizedPreferredTypes(preferredTypes) {
  return [...new Set((Array.isArray(preferredTypes) ? preferredTypes : [])
    .map(normalizeBuildingType)
    .filter(Boolean))];
}

export function buildingTypeScore(row, preferredTypes = []) {
  const rowType = normalizeBuildingType(row?.type || row?.buildingType || "");
  const preferred = normalizedPreferredTypes(preferredTypes);
  return {
    score: 0,
    reasons: ["型態：不納入排序分數 +0"],
    metrics: { rowType, preferredTypes: preferred, typeWeightRemoved: true }
  };
}

function purposeCategories(purposeText) {
  const text = normalizeMainPurposeText(purposeText);
  const categories = new Set();
  if (!text) return categories;
  if (/住|住宅|集合|宿舍/u.test(text)) categories.add("residential");
  if (/商|辦公|辦事|店鋪|店面|事務所|零售|銀行/u.test(text)) categories.add("commercial");
  if (/工|廠|倉|作業|工業/u.test(text)) categories.add("industrial");
  if (/停車|車位/u.test(text)) categories.add("parking");
  return categories;
}

function purposeCategoryOverlap(a, b) {
  for (const item of a) {
    if (b.has(item)) return true;
  }
  return false;
}

function purposeScoreForCandidate(rowPurpose, wantedPurpose) {
  if (rowPurpose === wantedPurpose) {
    return { score: 5, level: "exact", reason: `主要用途：${rowPurpose}完全相同 +5` };
  }
  const rowCategories = purposeCategories(rowPurpose);
  const wantedCategories = purposeCategories(wantedPurpose);
  if (!rowCategories.size || !wantedCategories.size) {
    return { score: 0, level: "unknown", reason: "主要用途：類別不足 +0" };
  }
  if (purposeCategoryOverlap(rowCategories, wantedCategories)) {
    const mixed = rowCategories.size > 1 || wantedCategories.size > 1;
    if (mixed) {
      return { score: 3, level: "mixed", reason: `主要用途：${rowPurpose}與${wantedPurpose}部分相容 +3` };
    }
    return { score: 4, level: "similar", reason: `主要用途：${rowPurpose}與${wantedPurpose}同類相近 +4` };
  }
  return { score: -3, level: "mismatch", reason: `主要用途：${rowPurpose}與${wantedPurpose}不相容 -3` };
}

function contextMainPurposes(query = {}) {
  const fromArray = Array.isArray(query.mainPurposes) ? query.mainPurposes : [];
  const fromText = String(query.mainPurpose || "").split(/[、,，]/u);
  return [...new Set([...fromArray, ...fromText]
    .map(normalizeMainPurposeText)
    .filter(Boolean))];
}

export function mainPurposeScore(row, query = {}) {
  const wanted = contextMainPurposes(query);
  if (!wanted.length) {
    return { score: 0, reasons: ["主要用途：略過（未選主要用途） +0"], metrics: { purposeSkipped: true } };
  }
  const rowPurpose = normalizeMainPurposeText(row?.purpose || row?.mainPurpose || "");
  if (!rowPurpose) {
    return {
      score: 0,
      reasons: ["主要用途：案例缺主要用途 +0"],
      metrics: { purposeMatchLevel: "missing", rowPurpose: "", wantedPurposes: wanted }
    };
  }
  const best = wanted
    .map((purpose) => purposeScoreForCandidate(rowPurpose, purpose))
    .sort((a, b) => b.score - a.score)[0];
  return {
    score: best?.score ?? 0,
    reasons: [best?.reason || "主要用途：略過 +0"],
    metrics: {
      purposeMatchLevel: best?.level || "unknown",
      rowPurpose,
      wantedPurposes: wanted
    }
  };
}

function addressScoreLevel(rowAddress, subjectAddress) {
  const subjectParts = parseComparableAddressParts(subjectAddress);
  if (!subjectParts.road) return { score: 0, level: "skipped", reason: "地址：略過（無法取得標的道路） +0" };
  const rowParts = parseComparableAddressParts(rowAddress);
  if (rowParts.road && rowParts.road === subjectParts.road) {
    if (subjectParts.lane && rowParts.lane === subjectParts.lane) {
      if (subjectParts.alley && rowParts.alley === subjectParts.alley) {
        return { score: 25, level: "sameRoadLaneAlley", reason: "地址：同路同巷同弄 +25" };
      }
      return { score: 22, level: "sameRoadLane", reason: "地址：同路同巷 +22" };
    }
    return { score: 18, level: "sameRoad", reason: "地址：同路 +18" };
  }
  return { score: 0, level: "other", reason: "地址：其他 +0" };
}

export function addressScore(row, subjectAddress) {
  const result = addressScoreLevel(row?.address || "", subjectAddress || "");
  return {
    score: result.score,
    reasons: [result.reason],
    metrics: { addressLevel: result.level }
  };
}

function parseTradeDateFromRow(row, appraisalBaseDate = new Date()) {
  const direct = parseDateFromText(row?.tradeDate || row?.tradeYearMonth || "");
  if (direct) return direct;
  const raw = normalizeFullWidthDigitsToAscii(String(row?.tradePeriodValue ?? "").replace(/\D/g, ""));
  if (!raw) return null;
  let year = null;
  let month = null;
  if (raw.length === 5) {
    year = Number(raw.slice(0, 3)) + 1911;
    month = Number(raw.slice(3));
  } else if (raw.length === 6) {
    const firstFour = Number(raw.slice(0, 4));
    if (firstFour >= 1911) {
      year = firstFour;
      month = Number(raw.slice(4));
    } else {
      year = Number(raw.slice(0, 3)) + 1911;
      month = Number(raw.slice(3, 5));
    }
  }
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null;
  return new Date(year, month, 0);
}

function monthsBetween(fromDate, toDate) {
  if (!(fromDate instanceof Date) || !(toDate instanceof Date)) return null;
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) return null;
  return Math.max(0, (toDate.getFullYear() - fromDate.getFullYear()) * 12 + (toDate.getMonth() - fromDate.getMonth()));
}

function resolveComparableAge(row) {
  const direct = toNumber(row?.age);
  if (Number.isFinite(direct)) return direct;
  const completionText = row?.completionDate || row?.buildingCompletionDate || row?.建築完成日期 || "";
  const tradeDate = parseTradeDateFromRow(row);
  if (completionText && tradeDate) return resolveSubjectAgeFromDeedCompletion(completionText, tradeDate);
  return null;
}

export function ageScore(row, refAge, appraisalBaseDate = new Date()) {
  const reasons = [];
  const metrics = {};
  const targetAge = toNumber(refAge);
  if (!Number.isFinite(targetAge)) {
    reasons.push("屋齡：略過（標的屋齡缺失） +0");
    return { score: 0, reasons, metrics: { ageSkipped: true } };
  }
  const rowAge = resolveComparableAge(row, appraisalBaseDate);
  if (!Number.isFinite(rowAge)) {
    reasons.push("屋齡：案例缺屋齡 -3");
    return { score: -3, reasons, metrics: { ageGap: Infinity } };
  }
  const gap = Math.abs(rowAge - targetAge);
  metrics.ageGap = +gap.toFixed(3);
  let score = 0;
  if (gap <= 3) score = 17;
  else if (gap <= 5) score = 13;
  else if (gap <= 10) score = 8;
  else if (gap <= 15) score = 4;
  reasons.push(`屋齡：差距 ${metrics.ageGap} 年 +${score}`);
  return { score, reasons, metrics };
}

export function areaScore(row, subjectTotalPing) {
  const target = toNumber(subjectTotalPing);
  if (!Number.isFinite(target) || target <= 0) {
    return { score: 0, reasons: ["總面積：略過（標的總坪數缺失） +0"], metrics: { areaSkipped: true } };
  }
  const rowArea = toNumber(row?.totalArea);
  if (!Number.isFinite(rowArea) || rowArea <= 0) {
    return { score: -5, reasons: ["總面積：案例缺總面積 -5"], metrics: { areaGapRatio: Infinity, areaMissing: true } };
  }
  const ratio = Math.abs(rowArea - target) / target;
  let score = 0;
  if (ratio <= 0.1) score = 15;
  else if (ratio <= 0.2) score = 12;
  else if (ratio <= 0.3) score = 8;
  else if (ratio <= 0.5) score = 4;
  const pct = +(ratio * 100).toFixed(1);
  return { score, reasons: [`總面積：差距 ${pct}% +${score}`], metrics: { areaGapRatio: +ratio.toFixed(4) } };
}

export function totalFloorsScore(row, refFloors) {
  const target = toNumber(refFloors);
  if (!Number.isFinite(target) || target <= 0) {
    return { score: 0, reasons: ["總樓層：略過（標的總樓層缺失） +0"], metrics: { totalFloorsSkipped: true } };
  }
  const rowFloors = parseTotalFloorsFromFloorInfo(row?.floorInfo);
  if (!Number.isFinite(rowFloors) || rowFloors <= 0) {
    return { score: -2, reasons: ["總樓層：案例缺總樓層 -2"], metrics: { totalFloorsGap: Infinity } };
  }
  const gap = Math.abs(rowFloors - target);
  let score = 0;
  if (gap === 0) score = 15;
  else if (gap <= 2) score = 12;
  else if (gap <= 5) score = 8;
  return { score, reasons: [`總樓層：差距 ${gap} 層 +${score}`], metrics: { totalFloorsGap: gap } };
}

function contextIsTownhouse(query = {}, preferredTypes = []) {
  const quickTypes = Array.isArray(query.quickTypes) ? query.quickTypes : [];
  const values = [
    query.houseType,
    query.type,
    ...quickTypes,
    ...preferredTypes
  ].map(normalizeBuildingType);
  return query.isTownhouse === true || values.includes("透天");
}

export function unitFloorScore(row, targetFloor, query = {}, preferredTypes = []) {
  if (contextIsTownhouse(query, preferredTypes)) {
    return { score: 0, reasons: ["樓別：略過（透天案件） +0"], metrics: { unitFloorSkipped: true } };
  }
  const target = toNumber(targetFloor);
  if (!Number.isFinite(target) || target <= 0) {
    return { score: 0, reasons: ["樓別：略過（標的樓別缺失） +0"], metrics: { unitFloorSkipped: true } };
  }
  const rowFloor = parseUnitFloorFromFloorInfo(row?.floorInfo);
  if (!Number.isFinite(rowFloor) || rowFloor <= 0) {
    return { score: -2, reasons: ["樓別：案例缺樓別 -2"], metrics: { unitFloorGap: Infinity } };
  }
  const gap = Math.abs(rowFloor - target);
  let score = 0;
  if (gap === 0) score = 8;
  else if (gap <= 1) score = 6;
  else if (gap <= 2) score = 4;
  else if (gap <= 3) score = 2;
  return { score, reasons: [`樓別：差距 ${gap} 樓 +${score}`], metrics: { unitFloorGap: gap, rowUnitFloor: rowFloor } };
}

function buildPriceStats(rows = []) {
  const priced = rows
    .filter((row) => Number.isFinite(row?.unitPrice))
    .sort((a, b) => b.unitPrice - a.unitPrice);
  const ranks = new Map();
  priced.forEach((row, index) => ranks.set(row, index));
  return { prices: priced.map((row) => row.unitPrice), ranks };
}

export function unitPriceScore(row, priceStats = null) {
  if (!Number.isFinite(row?.unitPrice)) {
    return { score: -10, reasons: ["單價：缺單價 -10"], metrics: { unitPricePercentile: 0 } };
  }
  const stats = priceStats || buildPriceStats([row]);
  const count = stats.prices?.length || 0;
  const rank = stats.ranks?.has(row) ? stats.ranks.get(row) : 0;
  const fraction = count <= 1 ? 0 : rank / (count - 1);
  let score = 1;
  if (fraction <= 0.2) score = 5;
  else if (fraction <= 0.4) score = 4;
  else if (fraction <= 0.6) score = 3;
  else if (fraction <= 0.8) score = 2;
  const percentile = +(1 - fraction).toFixed(3);
  return {
    score,
    reasons: [`單價：PR ${Math.round(percentile * 100)} +${score}`],
    metrics: { unitPricePercentile: percentile }
  };
}

export function tradeDateScore(row, appraisalBaseDate = new Date()) {
  const base = appraisalBaseDate instanceof Date && !Number.isNaN(appraisalBaseDate.getTime())
    ? appraisalBaseDate
    : new Date();
  const tradeDate = parseTradeDateFromRow(row, base);
  if (!tradeDate) return { score: 0, reasons: ["交易日期：缺交易日期 +0"], metrics: { tradeDateDistanceMonths: Infinity } };
  if (tradeDate.getTime() > base.getTime()) {
    return { score: 0, reasons: ["交易日期：晚於基準日 +0"], metrics: { tradeDateDistanceMonths: -1 } };
  }
  const months = monthsBetween(tradeDate, base);
  let score = 1;
  if (months <= 6) score = 10;
  else if (months <= 12) score = 8;
  else if (months <= 24) score = 5;
  else if (months <= 36) score = 3;
  return { score, reasons: [`交易日期：${months} 個月內 +${score}`], metrics: { tradeDateDistanceMonths: months } };
}

function normalizeComparableContext(contextOrRefAge, refFloors, preferredTypes = [], subjectAddress = "", subjectTotalPing = null) {
  if (contextOrRefAge && typeof contextOrRefAge === "object" && !(contextOrRefAge instanceof Date)) {
    return {
      refAge: contextOrRefAge.refAge,
      refFloors: contextOrRefAge.refFloors,
      preferredTypes: contextOrRefAge.preferredTypes || [],
      subjectAddress: contextOrRefAge.subjectAddress || "",
      subjectTotalPing: contextOrRefAge.subjectTotalPing,
      appraisalBaseDate: contextOrRefAge.appraisalBaseDate || new Date(),
      targetFloor: contextOrRefAge.targetFloor,
      query: contextOrRefAge.query || {},
      priceStats: contextOrRefAge.priceStats || null
    };
  }
  return {
    refAge: contextOrRefAge,
    refFloors,
    preferredTypes,
    subjectAddress,
    subjectTotalPing,
    appraisalBaseDate: new Date(),
    query: {},
    priceStats: null
  };
}

function roundScore(value) {
  return Math.round(value * 10) / 10;
}

export function scoreComparable(row, context = {}) {
  const normalized = normalizeComparableContext(context);
  const parts = {
    address: addressScore(row, normalized.subjectAddress),
    type: buildingTypeScore(row, normalized.preferredTypes),
    purpose: mainPurposeScore(row, normalized.query),
    age: ageScore(row, normalized.refAge, normalized.appraisalBaseDate),
    area: areaScore(row, normalized.subjectTotalPing),
    unitFloor: unitFloorScore(row, normalized.targetFloor, normalized.query, normalized.preferredTypes),
    totalFloors: totalFloorsScore(row, normalized.refFloors),
    unitPrice: unitPriceScore(row, normalized.priceStats),
    tradeDate: tradeDateScore(row, normalized.appraisalBaseDate)
  };
  const breakdown = {
    address: parts.address.score,
    type: parts.type.score,
    purpose: parts.purpose.score,
    age: parts.age.score,
    area: parts.area.score,
    unitFloor: parts.unitFloor.score,
    totalFloors: parts.totalFloors.score,
    unitPrice: parts.unitPrice.score,
    tradeDate: parts.tradeDate.score,
    penalties: 0
  };
  const comparableScore = roundScore(Object.values(breakdown).reduce((sum, value) => sum + value, 0));
  row.comparableScore = comparableScore;
  row.comparableScoreBreakdown = breakdown;
  row.comparableSortReason = Object.values(parts).flatMap((part) => part.reasons || []);
  row.comparableSortMetrics = Object.values(parts).reduce((acc, part) => Object.assign(acc, part.metrics || {}), {});
  return row;
}

function numericTieValue(value, fallback = Infinity) {
  return Number.isFinite(value) ? value : fallback;
}

/** Comparable Score：地址25、屋齡17、總樓層15、總面積15、交易日期10、樓別8、主要用途5、單價5；建物型態不計分，一樓案例於排序前另行排除。 */
export function sortComparablesForAverage(rows, contextOrRefAge, refFloors, preferredTypes = [], subjectAddress = "", subjectTotalPing = null) {
  const context = normalizeComparableContext(contextOrRefAge, refFloors, preferredTypes, subjectAddress, subjectTotalPing);
  const sortable = (Array.isArray(rows) ? rows : []).map((row, index) => ({ row, index }));
  const priceStats = buildPriceStats(sortable.map((item) => item.row));
  sortable.forEach(({ row }) => scoreComparable(row, { ...context, priceStats }));
  sortable.sort((a, b) => {
    if (Number.isFinite(toNumber(context.subjectTotalPing)) && toNumber(context.subjectTotalPing) > 0) {
      const areaMissingA = a.row.comparableSortMetrics?.areaMissing === true;
      const areaMissingB = b.row.comparableSortMetrics?.areaMissing === true;
      if (areaMissingA !== areaMissingB) return areaMissingA ? 1 : -1;
    }
    const scoreDiff = (b.row.comparableScore || 0) - (a.row.comparableScore || 0);
    if (scoreDiff !== 0) return scoreDiff;
    const ba = a.row.comparableScoreBreakdown || {};
    const bb = b.row.comparableScoreBreakdown || {};
    for (const key of ["address", "age", "totalFloors", "area", "tradeDate", "unitFloor", "purpose", "unitPrice"]) {
      const diff = (bb[key] || 0) - (ba[key] || 0);
      if (diff !== 0) return diff;
    }
    const ma = a.row.comparableSortMetrics || {};
    const mb = b.row.comparableSortMetrics || {};
    for (const key of ["ageGap", "totalFloorsGap", "areaGapRatio", "tradeDateDistanceMonths", "unitFloorGap"]) {
      const diff = numericTieValue(ma[key]) - numericTieValue(mb[key]);
      if (diff !== 0) return diff;
    }
    const upA = Number.isFinite(a.row.unitPrice) ? a.row.unitPrice : -Infinity;
    const upB = Number.isFinite(b.row.unitPrice) ? b.row.unitPrice : -Infinity;
    if (upA !== upB) return upB - upA;
    const tradeA = parseTradeDateFromRow(a.row, context.appraisalBaseDate)?.getTime() || -Infinity;
    const tradeB = parseTradeDateFromRow(b.row, context.appraisalBaseDate)?.getTime() || -Infinity;
    if (tradeA !== tradeB) return tradeB - tradeA;
    if (a.index !== b.index) return a.index - b.index;
    return String(a.row.address || "").localeCompare(String(b.row.address || ""), "zh-Hant");
  });
  sortable.forEach(({ row }, index) => { row.comparableRank = index + 1; });
  return sortable.map((item) => item.row);
}

/** 由地址字串取最後一組「○○樓」作為戶別樓層（建物門牌常用） */
export function parseLastFloorFromAddress(address) {
  const s = cleanOcrText(address || "").replace(/\s+/g, "");
  if (!s) return null;
  if (/地下一樓|地下1樓|地下１樓/i.test(s)) return null;
  const matches = [...s.matchAll(/([0-9０-９一二三四五六七八九十百千壹]+)\s*樓/gu)];
  if (!matches.length) return null;
  return parseFloorLevelToken(matches[matches.length - 1][1]);
}

export function comparableRowIsFirstFloor(row) {
  if (rowFloorIsFullLevel(row?.floorInfo)) return false;
  const fromInfo = parseUnitFloorFromFloorInfo(row?.floorInfo || "");
  if (fromInfo === 1) return true;
  if (fromInfo != null) return false;
  return parseLastFloorFromAddress(row?.address || "") === 1;
}
