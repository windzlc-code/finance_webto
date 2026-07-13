import { PING_PER_SQM, toLandTaxNumber } from './landValueTaxCalculator.js';
import {
  cleanOcrText,
  compactOcrText,
  normalizeOcrAreaUnits,
  toHalfWidth,
} from './src/utils.js';
import {
  extractLandShareFromOcrText,
  parseLandAreasFromLabelSection,
  parseLandRightsFromOwnershipSection,
  sumLandShareFromSeparatedLandSections,
} from './src/deed/land-share.js';
import { normalizeLandDeedMarkers } from './src/deed/area-extract.js';

const VALUE_WINDOW = 90;

function normalizeLandTaxText(rawText) {
  return normalizeLandDeedMarkers(normalizeOcrAreaUnits(cleanOcrText(rawText || '')));
}

function numericText(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/[，,]/g, '')
    .replace(/[^\d.]/g, '');
}

function numberValue(value) {
  const number = Number(numericText(value));
  return Number.isFinite(number) ? number : null;
}

function formatDecimal(value, digits = 3) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '';
  return number.toFixed(digits).replace(/\.?0+$/g, '');
}

function isPingUnit(unit) {
  return /坪/.test(String(unit || ''));
}

function landAreaToSqm(area) {
  const raw = numberValue(area?.areaText ?? area?.area);
  if (!Number.isFinite(raw)) return null;
  return isPingUnit(area?.unit) ? raw / PING_PER_SQM : raw;
}

function uniqueLandShareEntries(entries) {
  const seen = new Set();
  const result = [];
  for (const entry of entries || []) {
    const key = [
      entry?.parcel || '',
      entry?.areaText || entry?.area || '',
      entry?.unit || '',
      Number(entry?.ratio || 0).toFixed(10),
      entry?.rights || '',
    ].join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(entry);
  }
  return result;
}

function ratioToFractionText(ratio) {
  const value = Number(ratio);
  if (!Number.isFinite(value) || value <= 0) return null;
  if (Math.abs(value - 1) < 1e-8) return { numText: '1', denomText: '1' };
  const denominators = [2, 3, 4, 5, 6, 8, 10, 12, 16, 100, 1000, 10000, 100000];
  for (const denominator of denominators) {
    const numerator = Math.round(value * denominator);
    if (numerator <= 0) continue;
    if (Math.abs(numerator / denominator - value) < 1e-8) {
      return { numText: String(numerator), denomText: String(denominator) };
    }
  }
  return null;
}

function sameRatioLandShare(entries) {
  const source = uniqueLandShareEntries(entries).filter((entry) => {
    const ratio = Number(entry?.ratio);
    return Number.isFinite(ratio) && ratio > 0;
  });
  if (source.length < 2) return null;
  const firstRatio = Number(source[0].ratio);
  if (!source.every((entry) => Math.abs(Number(entry.ratio) - firstRatio) < 1e-8)) return null;
  const rightsText = String(source[0].rights || '');
  const rightsMatch = rightsText.match(/(\d{1,12})分之(\d{1,12})/);
  const fraction = rightsMatch
    ? { denomText: rightsMatch[1], numText: rightsMatch[2] }
    : ratioToFractionText(firstRatio);
  if (!fraction?.numText || !fraction?.denomText) return null;
  return {
    entries: source,
    ratio: firstRatio,
    rightsText: rightsText || `${fraction.denomText}分之${fraction.numText}`,
    numText: fraction.numText,
    denomText: fraction.denomText,
  };
}

function grossLandAreaSqmFromEntries(entries) {
  return uniqueLandShareEntries(entries).reduce((sum, entry) => {
    const sqm = landAreaToSqm(entry);
    return sum + (Number.isFinite(sqm) ? sqm : 0);
  }, 0);
}

function firstValidOwnershipRight(rights) {
  return (rights || []).find((right) => {
    const ratio = Number(right?.ratio);
    return Number.isFinite(ratio) && ratio > 0 && ratio <= 1;
  }) || null;
}

function field(label, value, raw = '', source = 'text') {
  return { label, value, raw, source };
}

function addWarning(warnings, message) {
  if (message && !warnings.includes(message)) warnings.push(message);
}

function chooseLandAreaAndRights(rawText, warnings) {
  const areas = parseLandAreasFromLabelSection(rawText);
  const rights = parseLandRightsFromOwnershipSection(rawText);
  const separated = sumLandShareFromSeparatedLandSections(rawText);
  const directShare = extractLandShareFromOcrText(rawText);

  const sameRatioShare = sameRatioLandShare(separated.entries);
  if (sameRatioShare) {
    const grossSqm = grossLandAreaSqmFromEntries(sameRatioShare.entries);
    if (grossSqm > 0) {
      addWarning(warnings, '偵測到多筆土地且權利範圍一致，已加總土地面積並保留共同權利範圍。');
      return {
        landAreaSqm: grossSqm,
        rightNumerator: sameRatioShare.numText,
        rightDenominator: sameRatioShare.denomText,
        mode: 'multiParcelSameRight',
        fields: {
          landAreaSqm: field(
            '土地面積合計',
            formatDecimal(grossSqm),
            sameRatioShare.entries.map((entry) => `${entry.parcel ? `${entry.parcel} ` : ''}${entry.areaText}${entry.unit || ''}`).join('、'),
            'landShareSum',
          ),
          rightNumerator: field('權利範圍分子', sameRatioShare.numText, sameRatioShare.rightsText, 'landShareSum'),
          rightDenominator: field('權利範圍分母', sameRatioShare.denomText, sameRatioShare.rightsText, 'landShareSum'),
        },
      };
    }
  }

  const separatedEntries = uniqueLandShareEntries(separated.entries);
  if (separatedEntries.length > 1) {
    const effectivePing = separated.valuePing ?? directShare.valuePing;
    if (Number.isFinite(effectivePing)) {
      const effectiveSqm = effectivePing / PING_PER_SQM;
      addWarning(warnings, '偵測到多筆土地或多筆權利範圍，已換算為有效持分面積並以 1/1 帶入。');
      return {
        landAreaSqm: effectiveSqm,
        rightNumerator: '1',
        rightDenominator: '1',
        mode: 'effectiveShare',
        fields: {
          landAreaSqm: field('有效持分土地面積', formatDecimal(effectiveSqm), `${formatDecimal(effectivePing)}坪`, 'landShareSum'),
          rightNumerator: field('權利範圍分子', '1', '已換算有效持分', 'landShareSum'),
          rightDenominator: field('權利範圍分母', '1', '已換算有效持分', 'landShareSum'),
        },
      };
    }
  }

  // Deduplicate areas with identical valuePing (e.g. when OCR has both 地積 and 面積 labels for the same parcel)
  const seenAreaPing = new Set();
  const uniqueAreas = areas.filter((a) => {
    const key = Number(a.valuePing || 0).toFixed(4);
    if (seenAreaPing.has(key)) return false;
    seenAreaPing.add(key);
    return true;
  });

  if (uniqueAreas.length === 1 && rights.length > 1) {
    const sqm = landAreaToSqm(uniqueAreas[0]);
    const firstRight = firstValidOwnershipRight(rights);
    if (Number.isFinite(sqm) && firstRight) {
      addWarning(warnings, '偵測到單一地號含多筆所有權人，已帶入第一筆權利範圍；請確認是否為目標所有權人。');
      return {
        landAreaSqm: sqm,
        rightNumerator: firstRight.numText || '1',
        rightDenominator: firstRight.denomText || '1',
        mode: 'singleParcelFirstOwnerRight',
        fields: {
          landAreaSqm: field('土地面積', formatDecimal(sqm), `${uniqueAreas[0].areaText}${uniqueAreas[0].unit || ''}`, 'landLabel'),
          rightNumerator: field('權利範圍分子', firstRight.numText || '1', firstRight.text, 'landOwnership'),
          rightDenominator: field('權利範圍分母', firstRight.denomText || '1', firstRight.text, 'landOwnership'),
        },
      };
    }
  }

  if (uniqueAreas.length === 1 && rights.length === 1) {
    const sqm = landAreaToSqm(uniqueAreas[0]);
    if (Number.isFinite(sqm)) {
      return {
        landAreaSqm: sqm,
        rightNumerator: rights[0].numText || '1',
        rightDenominator: rights[0].denomText || '1',
        mode: 'singleParcel',
        fields: {
          landAreaSqm: field('土地面積', formatDecimal(sqm), `${uniqueAreas[0].areaText}${uniqueAreas[0].unit || ''}`, 'landLabel'),
          rightNumerator: field('權利範圍分子', rights[0].numText || '1', rights[0].text, 'landOwnership'),
          rightDenominator: field('權利範圍分母', rights[0].denomText || '1', rights[0].text, 'landOwnership'),
        },
      };
    }
  }

  if (areas.length > 1 || rights.length > 1) {
    const effectivePing = separated.valuePing ?? directShare.valuePing;
    if (Number.isFinite(effectivePing)) {
      const effectiveSqm = effectivePing / PING_PER_SQM;
      addWarning(warnings, '偵測到多筆土地或多筆權利範圍，已換算為有效持分面積並以 1/1 帶入。');
      return {
        landAreaSqm: effectiveSqm,
        rightNumerator: '1',
        rightDenominator: '1',
        mode: 'effectiveShare',
        fields: {
          landAreaSqm: field('有效持分土地面積', formatDecimal(effectiveSqm), `${formatDecimal(effectivePing)}坪`, 'landShareSum'),
          rightNumerator: field('權利範圍分子', '1', '已換算有效持分', 'landShareSum'),
          rightDenominator: field('權利範圍分母', '1', '已換算有效持分', 'landShareSum'),
        },
      };
    }
  }

  if (areas.length) {
    const totalSqm = areas.reduce((sum, area) => sum + (landAreaToSqm(area) || 0), 0);
    if (totalSqm > 0) {
      addWarning(warnings, '已抓到土地面積，但未抓到權利範圍，暫以 1/1 帶入，請檢查。');
      return {
        landAreaSqm: totalSqm,
        rightNumerator: '1',
        rightDenominator: '1',
        mode: 'areaOnly',
        fields: {
          landAreaSqm: field('土地面積', formatDecimal(totalSqm), areas.map((area) => `${area.areaText}${area.unit || ''}`).join('、'), 'landLabel'),
          rightNumerator: field('權利範圍分子', '1', '未辨識', 'fallback'),
          rightDenominator: field('權利範圍分母', '1', '未辨識', 'fallback'),
        },
      };
    }
  }

  return { fields: {}, mode: 'none' };
}

function valueAfterKeyword(source, keywords, options = {}) {
  const compact = compactOcrText(source);
  for (const keyword of keywords) {
    const start = compact.search(keyword instanceof RegExp ? keyword : new RegExp(keyword));
    if (start < 0) continue;
    const windowText = compact.slice(start, start + VALUE_WINDOW);
    const moneyMatch = windowText.match(/(?:新台幣|新臺幣|NT\$)?([0-9][0-9,]{1,12}(?:\.\d+)?)(?:元|圓)(?:\/?平方公尺|每平方公尺|\/?㎡)?/);
    if (!moneyMatch) continue;
    if (options.rejectPrevious && /前次|原地價|原規定地價/.test(windowText.slice(0, moneyMatch.index || 0))) continue;
    const value = toLandTaxNumber(moneyMatch[1]);
    if (value > 0) return { value, raw: moneyMatch[0], keyword: String(keyword) };
  }
  return null;
}

function extractCurrentValue(source) {
  return valueAfterKeyword(source, [
    /公告土地現值/,
    /申報移轉現值/,
    /當期公告現值/,
  ], { rejectPrevious: true });
}

function extractOriginalValue(source) {
  return valueAfterKeyword(source, [
    /前次移轉現值/,
    /原規定地價/,
    /原地價/,
  ]);
}

function parseRocDateFromWindow(windowText) {
  const text = toHalfWidth(windowText || '');
  const match = text.match(/(?:民國)?\s*(\d{2,3})\s*年\s*(\d{1,2})\s*月(?:\s*(\d{1,2})\s*日)?/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3] || 1);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null;
  return { year, month, day, raw: match[0] };
}

function extractOriginalPeriod(source) {
  const compact = compactOcrText(source);
  const patterns = [/前次移轉(?:年月|日期)?/, /原因發生日期/, /登記日期/];
  for (const pattern of patterns) {
    const start = compact.search(pattern);
    if (start < 0) continue;
    const date = parseRocDateFromWindow(compact.slice(start, start + 70));
    if (date) return { ...date, label: String(pattern) };
  }
  return null;
}

function computeHoldingYears(originalPeriod, transferPeriod) {
  if (!originalPeriod?.year) return '';
  const now = new Date();
  const fallbackYear = now.getFullYear() - 1911;
  const transferYear = Number(transferPeriod?.year) || fallbackYear;
  const years = transferYear - Number(originalPeriod.year);
  return Number.isFinite(years) && years >= 0 ? String(years) : '';
}

export function parseLandValueTaxDeedText(rawText, options = {}) {
  const source = normalizeLandTaxText(rawText);
  const warnings = [];
  const fields = {};
  const values = {};
  if (!source) {
    return { values, fields, warnings: ['未取得可解析文字。'], rawText: '', hasCoreData: false };
  }

  const areaAndRights = chooseLandAreaAndRights(source, warnings);
  Object.assign(fields, areaAndRights.fields || {});
  if (Number.isFinite(areaAndRights.landAreaSqm)) values.landAreaSqm = formatDecimal(areaAndRights.landAreaSqm);
  if (areaAndRights.rightNumerator) values.rightNumerator = String(areaAndRights.rightNumerator);
  if (areaAndRights.rightDenominator) values.rightDenominator = String(areaAndRights.rightDenominator);

  const currentValue = extractCurrentValue(source);
  if (currentValue?.value) {
    values.transferUnitValue = String(Math.round(currentValue.value));
    fields.transferUnitValue = field('申報移轉現值單價', values.transferUnitValue, currentValue.raw, 'landText');
  }

  const originalValue = extractOriginalValue(source);
  if (originalValue?.value) {
    values.originalUnitValue = String(Math.round(originalValue.value));
    fields.originalUnitValue = field('原地價或前次現值單價', values.originalUnitValue, originalValue.raw, 'landText');
  }

  const originalPeriod = extractOriginalPeriod(source);
  if (originalPeriod) {
    values.originalYear = String(originalPeriod.year);
    values.originalMonth = String(originalPeriod.month);
    fields.originalPeriod = field('原地價年月 CPI', `${originalPeriod.year}-${originalPeriod.month}`, originalPeriod.raw, 'landText');
    const holdingYears = computeHoldingYears(originalPeriod, options.transferPeriod);
    if (holdingYears) {
      values.holdingYears = holdingYears;
      fields.holdingYears = field('持有年數', holdingYears, originalPeriod.raw, 'derived');
    }
  }

  const hasCoreData = Boolean(values.landAreaSqm || values.rightNumerator || values.originalUnitValue || values.transferUnitValue);
  if (!hasCoreData) addWarning(warnings, '未抓到土地面積、權利範圍或地價欄位，請人工檢查謄本文字。');

  return {
    values,
    fields,
    warnings,
    rawText: source,
    source: options.source || 'text',
    mode: areaAndRights.mode || 'none',
    hasCoreData,
  };
}

export default parseLandValueTaxDeedText;
