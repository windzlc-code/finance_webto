import { LAND_VALUE_TAX_CPI_DATA, LAND_VALUE_TAX_CPI_METADATA } from './landValueTaxCpiData.js';

export const PING_PER_SQM = 0.3025;

export const LAND_VALUE_TAX_DEFAULTS = {
  taxMode: 'general',
  landAreaSqm: '',
  rightNumerator: '1',
  rightDenominator: '1',
  transferUnitValue: '',
  transferTotalValue: '',
  originalUnitValue: '',
  originalTotalValue: '',
  transferYear: '',
  transferMonth: '',
  originalYear: '',
  originalMonth: '',
  landImprovementCost: '',
  engineeringBenefitFee: '',
  landReadjustmentBurden: '',
  donatedLandValue: '',
  holdingYears: '',
};

export function toLandTaxNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const normalized = String(value ?? '')
    .replace(/[，,]/g, '')
    .replace(/％/g, '%')
    .trim();
  if (!normalized) return 0;
  const number = Number(normalized.replace(/[^\d.-]/g, ''));
  return Number.isFinite(number) ? number : 0;
}

export function formatTaiwanDollar(value) {
  const number = Math.round(toLandTaxNumber(value));
  return number.toLocaleString('zh-TW');
}

export function formatLandTaxNumber(value, digits = 2) {
  const number = toLandTaxNumber(value);
  return number.toLocaleString('zh-TW', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function cpiPeriodKey(year, month) {
  const y = Math.trunc(toLandTaxNumber(year));
  const m = Math.trunc(toLandTaxNumber(month));
  if (!y || !m) return '';
  return `${String(y).padStart(3, '0')}/${String(m).padStart(2, '0')}`;
}

export function cpiPeriodOptions(data = LAND_VALUE_TAX_CPI_DATA) {
  return [...data].sort((a, b) => b.year - a.year || b.month - a.month);
}

export function getLatestCpiPeriod(data = LAND_VALUE_TAX_CPI_DATA) {
  return cpiPeriodOptions(data)[0] || null;
}

export function findCpiIndex(year, month, data = LAND_VALUE_TAX_CPI_DATA) {
  const key = cpiPeriodKey(year, month);
  if (!key) return null;
  return data.find((entry) => entry.period === key) || null;
}

export function holdingDiscountRate(holdingYears) {
  const years = toLandTaxNumber(holdingYears);
  if (years > 40) return 0.4;
  if (years > 30) return 0.3;
  if (years > 20) return 0.2;
  return 0;
}

export function calculateGeneralLandValueTax(taxableGain, adjustedOriginalValue, holdingYears = 0) {
  const gain = Math.max(0, toLandTaxNumber(taxableGain));
  const adjustedOriginal = Math.max(0, toLandTaxNumber(adjustedOriginalValue));
  const discount = holdingDiscountRate(holdingYears);

  if (gain <= 0) {
    return { tax: 0, bracket: '無漲價數額', discountRate: discount, gainRatio: 0 };
  }

  if (adjustedOriginal <= 0) {
    return {
      tax: Math.round(gain * 0.4),
      bracket: '無原地價基準，以最高級距估算',
      discountRate: discount,
      gainRatio: Infinity,
    };
  }

  const gainRatio = gain / adjustedOriginal;
  let tax = 0;
  let bracket = '第一級';

  if (gainRatio <= 1) {
    tax = gain * 0.2;
    bracket = '第一級（漲價數額未超過原地價 100%）';
  } else if (gainRatio <= 2) {
    const rate = 0.3 - (0.3 - 0.2) * discount;
    const deductionRate = 0.1 * (1 - discount);
    tax = gain * rate - adjustedOriginal * deductionRate;
    bracket = '第二級（超過 100%，未超過 200%）';
  } else {
    const rate = 0.4 - (0.4 - 0.2) * discount;
    const deductionRate = 0.3 * (1 - discount);
    tax = gain * rate - adjustedOriginal * deductionRate;
    bracket = '第三級（超過原地價 200%）';
  }

  return {
    tax: Math.max(0, Math.round(tax)),
    bracket,
    discountRate: discount,
    gainRatio,
  };
}

export function calculateLandValueTax(input = {}, cpiData = LAND_VALUE_TAX_CPI_DATA) {
  const values = { ...LAND_VALUE_TAX_DEFAULTS, ...input };
  const warnings = [];

  const landAreaSqm = toLandTaxNumber(values.landAreaSqm);
  const rightNumerator = toLandTaxNumber(values.rightNumerator) || 1;
  const rightDenominator = toLandTaxNumber(values.rightDenominator) || 1;
  const effectiveAreaSqm = landAreaSqm * (rightNumerator / rightDenominator);
  const effectiveAreaPing = effectiveAreaSqm * PING_PER_SQM;

  const transferTotalValueInput = toLandTaxNumber(values.transferTotalValue);
  const originalTotalValueInput = toLandTaxNumber(values.originalTotalValue);
  const transferUnitValue = toLandTaxNumber(values.transferUnitValue);
  const originalUnitValue = toLandTaxNumber(values.originalUnitValue);

  const transferValue = transferTotalValueInput > 0
    ? transferTotalValueInput
    : transferUnitValue * effectiveAreaSqm;
  const originalValue = originalTotalValueInput > 0
    ? originalTotalValueInput
    : originalUnitValue * effectiveAreaSqm;

  if (!effectiveAreaSqm && !transferTotalValueInput && !originalTotalValueInput) {
    warnings.push('土地面積或總額未輸入，無法完整試算。');
  }
  if (!transferValue) warnings.push('申報移轉現值未輸入。');
  if (!originalValue) warnings.push('原規定地價或前次移轉現值未輸入。');

  const latest = getLatestCpiPeriod(cpiData);
  const transferPeriod = findCpiIndex(values.transferYear || latest?.year, values.transferMonth || latest?.month, cpiData);
  const originalPeriod = findCpiIndex(values.originalYear, values.originalMonth, cpiData);
  let cpiRatio = 1;

  if (originalPeriod) {
    cpiRatio = originalPeriod.index / 100;
  } else {
    warnings.push('前次移轉年月物價指數未完整選取，暫以 1.000 倍試算。');
  }

  const adjustedOriginalValue = originalValue * cpiRatio;
  const deductions = {
    landImprovementCost: toLandTaxNumber(values.landImprovementCost),
    engineeringBenefitFee: toLandTaxNumber(values.engineeringBenefitFee),
    landReadjustmentBurden: toLandTaxNumber(values.landReadjustmentBurden),
    donatedLandValue: toLandTaxNumber(values.donatedLandValue),
  };
  const totalDeductions = Object.values(deductions).reduce((sum, value) => sum + value, 0);
  const taxableGain = Math.max(0, transferValue - adjustedOriginalValue - totalDeductions);

  const taxMode = values.taxMode === 'selfUse' ? 'selfUse' : 'general';
  const general = calculateGeneralLandValueTax(taxableGain, adjustedOriginalValue, values.holdingYears);
  const selfUseTax = Math.max(0, Math.round(taxableGain * 0.1));
  const tax = taxMode === 'selfUse'
    ? selfUseTax
    : general.tax;
  const bracket = taxMode === 'selfUse'
    ? '自用住宅用地（10%）'
    : general.bracket;

  return {
    input: values,
    metadata: LAND_VALUE_TAX_CPI_METADATA,
    taxMode,
    landAreaSqm,
    effectiveAreaSqm,
    effectiveAreaPing,
    transferValue: Math.round(transferValue),
    originalValue: Math.round(originalValue),
    transferPeriod,
    originalPeriod,
    cpiRatio,
    adjustedOriginalValue: Math.round(adjustedOriginalValue),
    deductions,
    totalDeductions: Math.round(totalDeductions),
    taxableGain: Math.round(taxableGain),
    holdingDiscountRate: taxMode === 'general' ? general.discountRate : 0,
    gainRatio: general.gainRatio,
    selfUseTax,
    generalTax: general.tax,
    generalBracket: general.bracket,
    generalHoldingDiscountRate: general.discountRate,
    bracket,
    tax,
    warnings,
  };
}
