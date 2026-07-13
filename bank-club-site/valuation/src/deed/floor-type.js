function toHalfWidth(text) {
  return String(text || "")
    .normalize("NFKC")
    .replace(/\u3000/g, " ")
    .replace(/[！-～]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xFEE0))
    .replace(/[臺]/g, "台")
    .replace(/[㆒]/g, "一")
    .replace(/[㆓]/g, "二")
    .replace(/[㆔]/g, "三")
    .replace(/[㆕]/g, "四");
}

function cleanDeedText(text) {
  return toHalfWidth(text)
    .replace(/建物眉數/g, "建物層數")
    .replace(/数/g, "數")
    .replace(/层/g, "層")
    .replace(/楼/g, "樓")
    .replace(/屏/g, "層")
    .replace(/[：:]/g, ":")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function compactDeedText(text) {
  return cleanDeedText(text)
    .replace(/[*＊]+/g, "")
    .replace(/[ \t]+/g, "")
    .replace(/\n+/g, "");
}

function normalizeFullWidthDigitsToAscii(value) {
  return String(value || "").replace(/[０-９]/g, (ch) => String("０１２３４５６７８９".indexOf(ch)));
}

export function parseFloorLevelToken(token) {
  const t = normalizeFullWidthDigitsToAscii(String(token || "").trim());
  if (!t) return null;
  if (/^\d{1,3}$/.test(t)) {
    const n = Number(t.replace(/^0+/, "") || "0");
    return Number.isFinite(n) && n >= 1 && n <= 199 ? n : null;
  }
  const digit = { 〇: 0, 零: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10, 壹: 1 };
  if (t.length === 1) return digit[t] >= 1 ? digit[t] : null;
  if (t === "十") return 10;
  const m11 = t.match(/^十([一二三四五六七八九])$/);
  if (m11) return 10 + digit[m11[1]];
  const m12 = t.match(/^([一二三四五六七八九])十$/);
  if (m12) return digit[m12[1]] * 10;
  const m13 = t.match(/^([一二三四五六七八九])十([一二三四五六七八九])$/);
  if (m13) return digit[m13[1]] * 10 + digit[m13[2]];
  return null;
}

export function detectTypeByFloors(floors) {
  const value = Number(floors);
  if (!Number.isFinite(value) || value <= 0) return "";
  if (value <= 5) return "公寓";
  if (value <= 9) return "華廈";
  return "住宅大樓";
}

function detectTotalFloorCountFromText(text) {
  const compact = compactDeedText(text);
  const patterns = [
    /(?:總樓層數|總樓層|地上層數|建物層數|層數|數)[:：]?\s*0*([0-9０-９]{1,3}|[一二三四五六七八九十百千]+)\s*(?:F|f|層|樓)/u,
    /(?:主要建材|建材|造)[:：]?[^\d０-９一二三四五六七八九十百千]{0,8}0*([0-9０-９]{1,3}|[一二三四五六七八九十百千]+)\s*(?:層|樓)(?=總面積|層次|層次面積)/u,
    /[:：]0*([0-9０-９]{1,3}|[一二三四五六七八九十百千]+)\s*(?:層|樓)(?=總面積|層次|層次面積)/u
  ];
  for (const pattern of patterns) {
    const match = compact.match(pattern);
    if (!match) continue;
    const value = parseFloorLevelToken(match[1]);
    if (value != null && value >= 2 && value <= 99) return value;
  }
  return null;
}

function inferSequentialLevelsFromLayerAreaSeries(text) {
  const total = detectTotalFloorCountFromText(text);
  if (total == null || total < 2 || total > 9) return [];
  const compact = compactDeedText(text);
  const start = compact.search(/層次(?:面積|面價|面債|面僵|面桥|面橋)|層面積|臺面積|台面積/u);
  if (start < 0) return [];
  let zone = compact.slice(start);
  const end = zone.search(/建築完成日期|建築完成|附屬建物用途|附屬建物|共有部分|共有部份|其他登記事項|建物所有權部|建物他項權利部|權利範圍|查詢時間/u);
  if (end > 0) zone = zone.slice(0, end);
  if (!/層次|層\s*次|[一二三四五六七八九十]\s*層|[2-9]\s*F/i.test(zone)) return [];
  const areaMatches = zone.match(/\d+(?:[,.，．·‧]\d+)?\s*(?:平方公尺|平方公|平万公尺|平万公|平方?米|㎡|m2|M2|坪)/gu) || [];
  const required = total <= 2 ? 2 : Math.min(total - 1, 3);
  if (areaMatches.length < required) return [];
  return Array.from({ length: total }, (_, index) => index + 1);
}

export function extractSubjectLevelSection(text) {
  const source = cleanDeedText(text);
  if (!source) return "";
  const stop = source.search(/附屬建物用途|附屬建物|共有部分|共有部份|其他登記事項|建物所有權部|建物他項權利部|權利範圍|查詢時間/);
  return (stop >= 0 ? source.slice(0, stop) : source).trim();
}

export function detectDeedLevelNumbers(text) {
  const source = cleanDeedText(text);
  const found = [];
  const addToken = (token) => {
    const n = parseFloorLevelToken(token);
    if (n != null && n >= 1 && n <= 99 && !found.includes(n)) found.push(n);
  };
  const parseSlice = (slice) => {
    const cleaned = String(slice || "")
      .replace(/層次面積/g, "")
      .replace(/(?:總樓層數|總樓層|地上層數|建物層數|層數|數)[:：]?\s*[0-9０-９]{1,3}\s*(?:F|f|層|樓)?/g, "")
      .replace(/總面積[:：]?[*\d０-９.,．‧\s]*(?:平方公尺|平方?米|㎡|m2|坪)?/gi, "");
    if (/突出物|共同使用部分/.test(cleaned)) return;
    for (const match of cleaned.matchAll(/([0-9０-９一二三四五六七八九十百千壹]+)\s*(?:層|樓)/gu)) {
      addToken(match[1]);
    }
  };
  const parseLayerContinuationSlice = (slice) => {
    const cleaned = String(slice || "")
      .replace(/(?:總樓層數|總樓層|地上層數|建物層數|層數|數)[:：]?\s*[0-9０-９]{1,3}\s*(?:F|f|層|樓)?/g, "")
      .replace(/總面積[:：]?[*\d０-９.,．‧\s]*(?:平方公尺|平方?米|㎡|m2|坪)?/gi, "");
    for (const match of cleaned.matchAll(/([0-9０-９一二三四五六七八九十百千壹]+)\s*(?:層|樓)(?!\s*夾層)(?=.{0,45}(?:\d|平方公尺|平方?米|㎡|坪))/gu)) {
      const before = cleaned.slice(Math.max(0, match.index - 3), match.index);
      if (/地下$/.test(before)) continue;
      addToken(match[1]);
    }
  };

  const subject = extractSubjectLevelSection(source);
  const lines = cleanDeedText(subject).split(/\n+/).map((line) => line.trim()).filter(Boolean);
  let inLayerRows = false;
  for (const line of lines) {
    if (line.length > 160) continue;
    const lineMatch = line.match(/(?:^|\s)(?:層\s*)?次\s*[:：]?\s*([0-9０-９一二三四五六七八九十百千壹]+)\s*(?:層|樓)?(?!\s*面積)/u)
      || line.match(/層次\s*[:：]?\s*([0-9０-９一二三四五六七八九十百千壹]+)\s*(?:層|樓)?(?!\s*面積)/u);
    if (lineMatch) {
      addToken(lineMatch[1]);
      inLayerRows = true;
      continue;
    }
    if (inLayerRows && /建築完成|附屬建物|共有部分|共有部份|其他登記事項|建物所有權部|權利範圍/.test(line)) {
      inLayerRows = false;
    }
    if (inLayerRows) {
      const continuationMatch = line.match(/^([0-9０-９一二三四五六七八九十百千壹]+)\s*(?:層|樓)(?!\s*夾層)/u);
      if (continuationMatch && /\d|平方公尺|平方?米|㎡|坪/.test(line)) addToken(continuationMatch[1]);
    }
  }

  const compact = compactDeedText(subject);
  for (const match of compact.matchAll(/層次[:：]?(.{0,220}?)(?:層次面積|建築完成日期|附屬建物|共有部分|共有部份|其他登記事項|建物所有權部|權利範圍|查詢時間|$)/gu)) {
    parseSlice(match[1]);
  }
  for (const match of compact.matchAll(/(?:^|[^層])次[:：]?(.{0,120}?)(?:建築完成日期|總面積|層次面積|附屬建物|共有部分|共有部份|其他登記事項|建物所有權部|權利範圍|查詢時間|$)/gu)) {
    parseSlice(match[1]);
  }
  for (const match of compact.matchAll(/層次(?!面積)[:：]?(.{0,360}?)(?:建築完成日期|附屬建物|共有部分|共有部份|其他登記事項|建物所有權部|權利範圍|查詢時間|$)/gu)) {
    parseLayerContinuationSlice(match[1]);
  }
  if (found.length < 2) {
    inferSequentialLevelsFromLayerAreaSeries(subject).forEach(addToken);
  }
  if (found.length < 2 && source !== subject) {
    inferSequentialLevelsFromLayerAreaSeries(source).forEach(addToken);
  }
  return found.sort((a, b) => a - b);
}

export function hasMultipleSubjectLevels(text) {
  return detectDeedLevelNumbers(text).length >= 2;
}
