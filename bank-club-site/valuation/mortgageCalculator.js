export const DEFAULT_MORTGAGE_CALCULATOR = {
  totalPriceWan: 1500,
  downPaymentPct: 20,
  annualRatePct: 2.5,
  loanYears: 30,
  graceYears: 0
};

export function toFiniteNumber(value, fallback = 0) {
  const parsed = typeof value === "number"
    ? value
    : Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function normalizePercent(value) {
  const numeric = Math.max(0, toFiniteNumber(value, 0));
  return numeric > 1 ? numeric / 100 : numeric;
}

function calculateMonthlyPaymentYuan(principalYuan, monthlyRate, months) {
  if (!principalYuan || !months) return 0;
  if (!monthlyRate) return principalYuan / months;
  return principalYuan * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months));
}

export function calculateMortgage(input = {}) {
  const values = { ...DEFAULT_MORTGAGE_CALCULATOR, ...input };
  const totalPriceWan = Math.max(0, toFiniteNumber(values.totalPriceWan, 0));
  const downPaymentPct = Math.min(100, normalizePercent(values.downPaymentPct) * 100);
  const annualRatePct = normalizePercent(values.annualRatePct) * 100;
  const loanYears = Math.max(0, Math.floor(toFiniteNumber(values.loanYears, 0)));
  const graceYears = Math.max(0, Math.floor(toFiniteNumber(values.graceYears, 0)));

  const downPaymentWan = totalPriceWan * (downPaymentPct / 100);
  const loanAmountWan = Math.max(0, totalPriceWan - downPaymentWan);
  const principalYuan = loanAmountWan * 10000;
  const totalMonths = loanYears * 12;
  const requestedGraceMonths = graceYears * 12;
  const effectiveGraceMonths = Math.min(requestedGraceMonths, Math.max(0, totalMonths - 1));
  const amortizedMonths = Math.max(0, totalMonths - effectiveGraceMonths);
  const monthlyRate = normalizePercent(annualRatePct) / 12;
  const graceMonthlyPaymentYuan = effectiveGraceMonths > 0 ? principalYuan * monthlyRate : 0;
  const amortizedMonthlyPaymentYuan = calculateMonthlyPaymentYuan(principalYuan, monthlyRate, amortizedMonths);
  const primaryMonthlyPaymentYuan = effectiveGraceMonths > 0
    ? amortizedMonthlyPaymentYuan
    : amortizedMonthlyPaymentYuan;
  const graceInterestYuan = graceMonthlyPaymentYuan * effectiveGraceMonths;
  const amortizedTotalPaymentYuan = amortizedMonthlyPaymentYuan * amortizedMonths;
  const totalInterestYuan = Math.max(0, graceInterestYuan + amortizedTotalPaymentYuan - principalYuan);
  const totalRepaymentYuan = principalYuan + totalInterestYuan;
  const suggestedAnnualIncomeWan = primaryMonthlyPaymentYuan * 12 / 10000 / 0.65;
  const requestedGraceClamped = requestedGraceMonths !== effectiveGraceMonths;

  return {
    totalPriceWan,
    downPaymentPct,
    downPaymentWan,
    annualRatePct,
    loanYears,
    graceYears,
    loanAmountWan,
    principalYuan,
    totalMonths,
    effectiveGraceMonths,
    amortizedMonths,
    monthlyRate,
    graceMonthlyPaymentYuan,
    amortizedMonthlyPaymentYuan,
    primaryMonthlyPaymentYuan,
    graceInterestYuan,
    totalInterestYuan,
    totalInterestWan: totalInterestYuan / 10000,
    totalRepaymentYuan,
    totalRepaymentWan: totalRepaymentYuan / 10000,
    suggestedAnnualIncomeWan,
    requestedGraceClamped
  };
}
