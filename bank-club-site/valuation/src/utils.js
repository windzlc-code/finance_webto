export const toNumber = (value) => {
  const text = String(value ?? "").replace(/,/g, "").trim();
  if (!text) return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
};

export const safeNumber = (value) => toNumber(value) ?? 0;

export const formatNum = (value, digits = 2) => Number(value).toLocaleString("zh-TW", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export function normalizeParkingCount(count) {
  const n = Number(count);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n);
}

export function fixOfficialText(value) {
  const text = String(value ?? "");
  if (!text) return "";
  if (/[\u4e00-\u9fff]/.test(text)) return text;
  if (!/[-ÿ]/.test(text)) return text;
  try {
    const bytes = Uint8Array.from([...text].map((char) => char.charCodeAt(0) & 255));
    const fixed = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    return /[\u4e00-\u9fff]/.test(fixed) ? fixed : text;
  } catch {
    return text;
  }
}

export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const nextPaint = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

export function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, "")
    .replace(/臺/g, "台")
    .trim();
}

export function toHalfWidth(text) {
  return String(text || "")
    .normalize("NFKC")
    .replace(/\u3000/g, " ")
    .replace(/[！-～]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xFEE0))
    .replace(/[臺]/g, "台")
    .replace(/[⺠]/g, "民")
    .replace(/[㈯]/g, "土")
    .replace(/[㈲]/g, "有")
    .replace(/[㈰]/g, "日")
    .replace(/[㈪]/g, "月")
    .replace(/[㈾]/g, "資")
    .replace(/[㊠]/g, "項")
    .replace(/[㊞]/g, "印")
    .replace(/[㊟]/g, "注")
    .replace(/[㉂]/g, "自")
    .replace(/[㉃]/g, "至")
    .replace(/[㆞]/g, "地")
    .replace(/[㆒]/g, "一")
    .replace(/[㆓]/g, "二")
    .replace(/[㆔]/g, "三")
    .replace(/[㆕]/g, "四")
    .replace(/[门]/g, "門")
    .replace(/[号]/g, "號")
    .replace(/[楼]/g, "樓")
    .replace(/[阳]/g, "陽")
    .replace(/[户]/g, "戶")
    .replace(/[权]/g, "權")
    .replace(/[围]/g, "圍")
    .replace(/[与]/g, "與");
}

export function cleanOcrText(text) {
  return toHalfWidth(String(text || ""))
    .replace(/[：:]/g, ":")
    .replace(/附\s*[屠属]\s*建物/g, "附屬建物")
    .replace(/共\s*[\(（]\s*有\s*[\)）]\s*部\s*[分份]/g, "共有部分")
    .replace(/所\s*[\(（]\s*有\s*[\)）]\s*權/g, "所有權")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function normalizeOcrAreaUnits(text) {
  return String(text || "")
    .replace(/平方公[怀尺司盡尽屆届限月片]/g, "平方公尺")
    .replace(/[平半][方萬万文分][公]?尺/g, "平方公尺")
    .replace(/平[方萬万文分]公(?!尺)/g, "平方公尺")
    .replace(/平方[／/]/g, "平方公尺");
}

export function compactOcrText(text) {
  return normalizeOcrAreaUnits(cleanOcrText(text)
    .replace(/[*＊]+/g, "")
    .replace(/[ \t]+/g, "")
  )
    .replace(/\n+/g, "");
}

export function isSquareMeterAreaUnit(unit) {
  return /平方公尺|平方?米|平方|m2|㎡/i.test(normalizeOcrAreaUnits(unit));
}

export function normalizePeriodValue(value) {
  const text = String(value || "").trim();
  const match = text.match(/(\d{2,3})\D?(\d{1,2})/);
  if (!match) return null;
  return Number(match[1]) * 100 + Number(match[2]);
}

export function parseKeywords(raw) {
  return String(raw || "").split(/[,\n、，]/).map((item) => item.trim()).filter(Boolean);
}

export function escapeRegExp(text) {
  return String(text || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeFullWidthDigitsToAscii(s) {
  return String(s || "").replace(/[０-９]/g, (ch) => String("０１２３４５６７８９".indexOf(ch)));
}

/** 解析門牌／樓別常見之樓層數字（阿拉伯或中文 1～99 為主） */
export function parseFloorLevelToken(tok) {
  let t = normalizeFullWidthDigitsToAscii(String(tok || "").trim());
  if (!t) return null;
  if (/^\d{1,3}$/.test(t)) {
    const n = Number(t);
    return Number.isFinite(n) && n >= 1 && n <= 199 ? n : null;
  }
  const d = { 〇: 0, 零: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10, 壹: 1, 貳: 2, 參: 3, 肆: 4, 伍: 5, 陸: 6, 柒: 7, 捌: 8, 玖: 9, 拾: 10 };
  if (t.length === 1) {
    const v = d[t];
    return v >= 1 ? v : null;
  }
  if (t === "十") return 10;
  const m11 = t.match(/^[十拾]([一二三四五六七八九壹貳參肆伍陸柒捌玖])$/);
  if (m11) return 10 + d[m11[1]];
  const m12 = t.match(/^([一二三四五六七八九壹貳參肆伍陸柒捌玖])[十拾]$/);
  if (m12) return d[m12[1]] * 10;
  const m13 = t.match(/^([一二三四五六七八九壹貳參肆伍陸柒捌玖])[十拾]([一二三四五六七八九壹貳參肆伍陸柒捌玖])$/);
  if (m13) return d[m13[1]] * 10 + d[m13[2]];
  const tens = "一二三四五六七八九壹貳參肆伍陸柒捌玖";
  for (let i = 0; i < tens.length; i++) {
    const head = tens[i];
    const value = d[head];
    if (t === `${head}十` || t === `${head}拾`) return value * 10;
    if (t.length === 3 && t[0] === head && (t[1] === "十" || t[1] === "拾")) {
      const u = d[t[2]];
      if (u >= 1) return value * 10 + u;
    }
  }
  return null;
}
