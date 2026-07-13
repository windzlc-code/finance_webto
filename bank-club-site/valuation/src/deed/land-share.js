import { cleanOcrText, compactOcrText, formatNum, normalizeOcrAreaUnits, toHalfWidth } from "../utils.js";
import {
  AREA_UNIT_PATTERN,
  normalizeLandDeedMarkers,
  normalizeLandShareArea,
  parseRightsRatioFromMatch,
  truncate3
} from "./area-extract.js";
import { sliceCompactSection } from "./text-sections.js";

export { sliceCompactSection } from "./text-sections.js";

export function parseLandShareEntries(rawText) {
  const source = normalizeOcrAreaUnits(cleanOcrText(rawText));
  if (!source) return [];
  const compact = source.replace(/\n+/g, " ");
  const areaRe = new RegExp(`(\\d+[\\d,.]*)\\s*${AREA_UNIT_PATTERN}`, "gi");
  const rightRe = /(?:(?<denom>\d{1,12})\s*分之\s*(?<num>\d{1,12})|萬分之\s*(?<wan>\d{1,12})|權利範圍\s*(?<all>全部))/g;
  const areas = [...compact.matchAll(areaRe)].map((m) => ({
    index: m.index || 0,
    end: (m.index || 0) + m[0].length,
    value: m[1],
    unit: m[2],
    used: false
  }));
  const rights = [...compact.matchAll(rightRe)].map((m) => ({
    index: m.index || 0,
    end: (m.index || 0) + m[0].length,
    text: m[0],
    ratio: parseRightsRatioFromMatch(m.groups || {})
  })).filter((item) => item.ratio != null && item.ratio > 0);
  const entries = [];
  for (const right of rights) {
    const candidates = areas
      .filter((area) => !area.used && Math.abs(area.index - right.index) <= 220)
      .map((area) => {
        const before = area.index < right.index;
        const distance = before ? right.index - area.end : area.index - right.end;
        return { area, distance: Math.abs(distance), before };
      })
      .sort((a, b) => (a.before === b.before ? a.distance - b.distance : a.before ? -1 : 1));
    if (!candidates.length) continue;
    const chosen = candidates[0].area;
    const normalized = normalizeLandShareArea(chosen.value, chosen.unit, right.ratio);
    if (!normalized) continue;
    chosen.used = true;
    entries.push({
      area: normalized.rawValue,
      areaText: chosen.value,
      unit: chosen.unit,
      ratio: +right.ratio.toFixed(8),
      rights: right.text,
      valuePing: normalized.valuePing
    });
  }
  return entries;
}

export function parseLandAreasFromLabelSection(rawText) {
  const compactRaw = compactOcrText(rawText);
  const hasExplicitLandSection = /土地標示部|土地標示/.test(compactRaw);
  const section = sliceCompactSection(
    rawText,
    hasExplicitLandSection ? [/土地標示部/, /土地標示/] : [/土地面積/, /地積/],
    [/土地所有權部/, /土地他項權利部/, /建物標示部/, /建物所有權部/, /建物他項權利部/]
  );
  if (!section && /建物標示部/.test(compactRaw)) return [];
  const source = section || (/土地面積|地積/.test(compactRaw) ? compactRaw : "");
  if (!source) return [];
  const matches = [];
  const seen = new Set();
  const pushMatch = (match) => {
    const key = `${match.index || 0}:${match[1]}:${match[2]}`;
    if (seen.has(key)) return;
    const normalized = normalizeLandShareArea(match[1], match[2]);
    if (!normalized) return;
    seen.add(key);
    matches.push({
      index: match.index || 0,
      area: normalized.rawValue,
      areaText: match[1],
      unit: match[2],
      valuePing: normalized.valuePing
    });
  };
  const labelPattern = hasExplicitLandSection ? "(?:土地面積|地積|面積)" : "(?:土地面積|地積)";
  for (const match of source.matchAll(new RegExp(`${labelPattern}[:：]?[^\\d]{0,40}(\\d+[\\d,.]*)${AREA_UNIT_PATTERN}`, "gi"))) {
    pushMatch(match);
  }
  if (!matches.length && hasExplicitLandSection) {
    for (const match of source.matchAll(new RegExp(`(\\d+[\\d,.]*)${AREA_UNIT_PATTERN}`, "gi"))) {
      pushMatch(match);
    }
  }
  return matches.sort((a, b) => a.index - b.index);
}

export function parseLandRightsFromOwnershipSection(rawText) {
  // 優先以「土地所有權部」或「所有權人」定位段落，避免「權利範圍」過早出現於共有部分時
  // 被 sliceCompactSection 的 Math.min 誤選為起點，導致截入共有部分的權利範圍數值。
  const endPatterns = [/土地他項權利部/, /建物標示部/, /建物所有權部/, /建物他項權利部/];
  const ownershipByExplicit = sliceCompactSection(rawText, [/土地所有權部/, /所有權人/], endPatterns);
  const ownership = ownershipByExplicit || sliceCompactSection(rawText, [/權利範圍/], endPatterns);
  const textSource = cleanOcrText(rawText);
  const lineRights = [];
  for (const line of textSource.split(/\n+/)) {
    const compactLine = compactOcrText(line);
    if (!compactLine || /歷次取得權利範圍/.test(compactLine)) continue;
    if (!/^權利範圍/.test(compactLine)) continue;
    const m = compactLine.match(/^權利範圍[:：*]*(?:(\d{1,12})分之(\d{1,12})|萬分之(\d{1,12})|(全部))/);
    if (!m) continue;
    let ratio = null;
    let denomText = "";
    let numText = "";
    if (m[1] && m[2]) {
      denomText = m[1];
      numText = m[2];
      const denom = Number(denomText);
      const num = Number(numText);
      if (denom > 0 && Number.isFinite(num)) ratio = num / denom;
    } else if (m[3]) {
      denomText = "10000";
      numText = m[3];
      ratio = Number(numText) / 10000;
    } else if (m[4]) {
      denomText = "1";
      numText = "1";
      ratio = 1;
    }
    if (ratio != null && ratio > 0 && ratio <= 1) {
      lineRights.push({ index: lineRights.length, text: `${denomText}分之${numText}`, ratio, denomText, numText });
    }
  }
  if (lineRights.length) return lineRights;
  const source = (ownership || compactOcrText(rawText))
    .replace(/歷次取得權利範圍[:：*]*(?:\d{1,12}分之\d{1,12}|萬分之\d{1,12}|全部)[*]*/g, "");
  const rights = [];
  const rightsRe = /(?:(\d{1,12})分之(\d{1,12})|萬分之(\d{1,12})|權利範圍[:：]?(全部)|權利範圍[:：]?[^\d]{0,20}(全部))/g;
  let match;
  while ((match = rightsRe.exec(source)) !== null) {
    const prefix = source.slice(Math.max(0, (match.index || 0) - 8), match.index || 0);
    if (/歷次取得$/.test(prefix)) continue;
    let ratio = null;
    let denomText = "";
    let numText = "";
    if (match[1] && match[2]) {
      denomText = match[1];
      numText = match[2];
      const denom = Number(denomText);
      const num = Number(numText);
      if (Number.isFinite(denom) && denom > 0 && Number.isFinite(num)) ratio = num / denom;
    } else if (match[3]) {
      denomText = "10000";
      numText = match[3];
      const wan = Number(numText);
      if (Number.isFinite(wan)) ratio = wan / 10000;
    } else if (match[4] || match[5]) {
      denomText = "1";
      numText = "1";
      ratio = 1;
    }
    if (ratio != null && ratio > 0 && ratio <= 1) {
      rights.push({ index: match.index || 0, text: match[0], ratio, denomText, numText });
    }
  }
  return rights.filter((item, index) => !rights.some((other, otherIndex) => (
    otherIndex !== index
    && other.denomText === item.denomText
    && item.numText.length > other.numText.length
    && item.numText.startsWith(other.numText)
  )));
}

export function dedupeLandShareEntries(entries) {
  const source = entries || [];
  const keyOf = (entry) => {
    const parcelKey = String(entry.parcel || "").trim();
    const areaKey = Number(entry.area || entry.areaText || 0).toFixed(6);
    const ratioKey = Number(entry.ratio || 0).toFixed(10);
    return `${parcelKey}|${areaKey}|${entry.unit || ""}|${ratioKey}|${String(entry.rights || "").trim()}`;
  };
  const result = [];
  const seen = new Set();
  for (const entry of source) {
    const key = keyOf(entry);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(entry);
  }
  return result;
}

export function mergeDuplicateLandRights(rights) {
  const source = rights || [];
  const keyOf = (right) => `${right.denomText || ""}|${right.numText || ""}|${Number(right.ratio || 0).toFixed(10)}`;
  const counts = source.reduce((map, right) => {
    const key = keyOf(right);
    map.set(key, (map.get(key) || 0) + 1);
    return map;
  }, new Map());
  const result = [];
  const seen = new Set();
  for (const right of source) {
    const key = keyOf(right);
    if (counts.get(key) <= 2 && seen.has(key)) continue;
    seen.add(key);
    result.push(right);
  }
  return result;
}

export function formatRightsFromRatio(ratio, rightsText = "") {
  const r = Number(ratio);
  if (Number.isFinite(r) && Math.abs(r - 1) < 1e-9) return "1分之1";
  return rightsText || "";
}

export function detectLandParcelLabel(section) {
  const compact = compactOcrText(section);
  const match = compact.match(/([\u4e00-\u9fff]{1,16}段)?([0-9０-９]{1,6}[-－][0-9０-９]{1,6})地號/);
  if (!match) return "";
  let segment = match[1] || "";
  segment = segment.replace(/^.*[市縣區鄉鎮]/, "");
  const parcelNo = toHalfWidth(match[2]).replace(/－/g, "-");
  return `${segment}${parcelNo}地號`;
}

export function splitLandRegistrationSections(rawText) {
  const compact = compactOcrText(rawText);
  if (!compact) return [];
  const starts = [];
  const markerRe = /土地標示部/g;
  let marker;
  while ((marker = markerRe.exec(compact)) !== null) {
    starts.push(marker.index);
  }
  if (!starts.length) return [];
  return starts.map((start, index) => {
    const nextLand = starts[index + 1] ?? compact.length;
    const nextBuilding = compact.indexOf("建物標示部", start + 1);
    const endCandidates = [nextLand, nextBuilding]
      .filter((value) => Number.isFinite(value) && value > start);
    const end = endCandidates.length ? Math.min(...endCandidates) : compact.length;
    const headerStart = Math.max(0, start - 300);
    return compact.slice(headerStart, end);
  }).filter(Boolean);
}

export function sumLandShareFromSeparatedLandSections(rawText) {
  const landSections = splitLandRegistrationSections(rawText);
  if (landSections.length) {
    const sectionEntries = [];
    for (const section of landSections) {
      const areas = parseLandAreasFromLabelSection(section);
      const rights = parseLandRightsFromOwnershipSection(section);
      if (!areas.length || !rights.length) continue;
      const ratio = Math.min(1, rights.reduce((sum, item) => sum + item.ratio, 0));
      if (!Number.isFinite(ratio) || ratio <= 0) continue;
      const rightsText = formatRightsFromRatio(ratio, rights.map((item) => item.text).join("、"));
      const parcel = detectLandParcelLabel(section);
      for (const area of areas) {
        const normalized = normalizeLandShareArea(area.areaText || area.area, area.unit, ratio);
        if (!normalized) continue;
        sectionEntries.push({
          parcel,
          area: area.area,
          areaText: area.areaText,
          unit: area.unit,
          ratio: +ratio.toFixed(8),
          rights: rightsText,
          valuePing: normalized.valuePing
        });
      }
    }
    if (sectionEntries.length) {
      const valuePing = truncate3(sectionEntries.reduce((sum, item) => sum + item.valuePing, 0));
      return { valuePing, entries: sectionEntries };
    }
  }
  const areas = parseLandAreasFromLabelSection(rawText);
  const rights = mergeDuplicateLandRights(parseLandRightsFromOwnershipSection(rawText));
  if (!areas.length || !rights.length) return { valuePing: null, entries: [] };
  const entries = [];
  if (rights.length === 1) {
    for (const area of areas) {
      entries.push({
        area: area.area,
        areaText: area.areaText,
        unit: area.unit,
        ratio: +rights[0].ratio.toFixed(8),
        rights: rights[0].text,
        valuePing: normalizeLandShareArea(area.areaText || area.area, area.unit, rights[0].ratio).valuePing
      });
    }
  } else if (areas.length === 1) {
    const ratio = Math.min(1, rights.reduce((sum, item) => sum + item.ratio, 0));
    const rightsText = formatRightsFromRatio(ratio, rights.map((item) => item.text).join("、"));
    entries.push({
      area: areas[0].area,
      areaText: areas[0].areaText,
      unit: areas[0].unit,
      ratio: +ratio.toFixed(8),
      rights: rightsText,
      valuePing: normalizeLandShareArea(areas[0].areaText || areas[0].area, areas[0].unit, ratio).valuePing
    });
  } else {
    const count = Math.min(areas.length, rights.length);
    for (let index = 0; index < count; index += 1) {
      entries.push({
        area: areas[index].area,
        areaText: areas[index].areaText,
        unit: areas[index].unit,
        ratio: +rights[index].ratio.toFixed(8),
        rights: rights[index].text,
        valuePing: normalizeLandShareArea(areas[index].areaText || areas[index].area, areas[index].unit, rights[index].ratio).valuePing
      });
    }
  }
  const uniqueEntries = dedupeLandShareEntries(entries);
  const valuePing = truncate3(uniqueEntries.reduce((sum, item) => sum + item.valuePing, 0));
  return { valuePing, entries: uniqueEntries };
}

export function sumLandSharePing(rawText) {
  const entries = dedupeLandShareEntries(parseLandShareEntries(rawText));
  if (!entries.length) return { valuePing: null, entries };
  const valuePing = truncate3(entries.reduce((sum, item) => sum + item.valuePing, 0));
  return { valuePing, entries };
}

export function formatLandShareEntry(entry) {
  const parcel = entry.parcel ? `${entry.parcel} ` : "";
  const areaText = entry.areaText || entry.area || "";
  const unit = entry.unit || "平方公尺";
  const rights = entry.rights || formatRightsFromRatio(entry.ratio);
  const subtotal = entry.valuePing != null ? ` = ${formatNum(entry.valuePing, 3)} 坪` : "";
  return `${parcel}土地面積 ${areaText}${unit} 權利範圍 ${rights}${subtotal}`.trim();
}

export function extractLandShareFromOcrText(rawText) {
  const text = normalizeLandDeedMarkers(rawText);
  const compact = compactOcrText(text);
  const hasExplicitLandSection = /土地標示部|土地標示/.test(compact);
  const hasStandaloneLandArea = /(?:土地面積|地積)[:：]?[^\d]{0,40}\d/.test(compact);
  if (!hasExplicitLandSection && /建物標示部/.test(compact)) return { valuePing: null, entries: [] };
  if (!hasExplicitLandSection && !hasStandaloneLandArea) return { valuePing: null, entries: [] };
  const direct = sumLandSharePing(text);
  const separated = sumLandShareFromSeparatedLandSections(text);
  if (separated.valuePing != null) return separated;
  return direct.valuePing != null ? direct : separated;
}
