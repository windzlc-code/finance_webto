export const DEFAULT_LOANS = [
  { name: "本次申請", principalWan: 0, annualRate: 0.025, months: 0 },
  { name: "他行房貸〔IS長擔〕", principalWan: 0, annualRate: 0.025, months: 240, fixedTerms: true },
  { name: "金融債券、債券〔H中放、E短放〕", principalWan: 0, annualRate: 0.049, months: 84, fixedTerms: true },
  { name: "信貸〔H中放〕", principalWan: 0, annualRate: 0.049, months: 84, fixedTerms: true },
  { name: "車貸〔H中擔〕", principalWan: 0, annualRate: 0.026, months: 84, fixedTerms: true },
  { name: "信用卡(卡循、待付金)、現金卡", principalWan: 0, annualRate: 0.15, months: 20, fixedTerms: true }
];

export const DEFAULT_INCOME = {
  salaryWan: 0,
  pensionWan: 0,
  dividendWan: 0,
  rentWan: 0
};

export const DEFAULT_ASSETS = {
  cathayPolicyWan: 0,
  otherPolicyWan: 0,
  stockWan: 0,
  fundWan: 0,
  bondWan: 0,
  depositWan: 0
};

export function toFiniteNumber(value, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function normalizeAnnualRate(value) {
  const rate = toFiniteNumber(value, 0);
  return Math.abs(rate) > 1 ? rate / 100 : rate;
}

export function calculateMonthlyPayment(principalWan, annualRate, months) {
  const principal = Math.max(0, toFiniteNumber(principalWan, 0)) * 10000;
  const periodCount = Math.max(0, Math.floor(toFiniteNumber(months, 0)));
  const monthlyRate = normalizeAnnualRate(annualRate) / 12;
  if (!principal || !periodCount) return 0;
  if (!monthlyRate) return Math.ceil(principal / periodCount);
  const factor = Math.pow(1 + monthlyRate, periodCount);
  return Math.ceil((principal * monthlyRate * factor) / (factor - 1));
}

export function calculateLoan(loan) {
  const monthlyPayment = calculateMonthlyPayment(loan.principalWan, loan.annualRate, loan.months);
  return {
    ...loan,
    principalWan: Math.max(0, toFiniteNumber(loan.principalWan, 0)),
    annualRate: normalizeAnnualRate(loan.annualRate),
    months: Math.max(0, Math.floor(toFiniteNumber(loan.months, 0))),
    monthlyPayment,
    annualTotal: monthlyPayment * 12
  };
}

export function calculateLoans(loans) {
  const items = loans.map(calculateLoan);
  const totalAnnualDebtYuan = items.reduce((sum, item) => sum + item.annualTotal, 0);
  const totalAnnualDebtWanRaw = totalAnnualDebtYuan / 10000;
  return {
    items,
    totalMonthlyPaymentYuan: items.reduce((sum, item) => sum + item.monthlyPayment, 0),
    totalAnnualDebtYuan,
    totalAnnualDebtWanRaw,
    totalAnnualDebtWan: Math.round(totalAnnualDebtWanRaw)
  };
}

export function calculateRecognizedIncome(income) {
  const salaryWan = Math.max(0, toFiniteNumber(income.salaryWan, 0));
  const pensionWan = Math.max(0, toFiniteNumber(income.pensionWan, 0));
  const dividendWan = Math.max(0, toFiniteNumber(income.dividendWan, 0));
  const rentWan = Math.max(0, toFiniteNumber(income.rentWan, 0));
  const recognizedRentWan = rentWan * 0.9;
  return {
    salaryWan,
    pensionWan,
    dividendWan,
    rentWan,
    recognizedRentWan,
    recurringRecognizedIncomeWan: salaryWan + pensionWan + dividendWan + recognizedRentWan
  };
}

export function calculateFinancialAssets(assets, mortgageMonths) {
  const values = {
    cathayPolicyWan: Math.max(0, toFiniteNumber(assets.cathayPolicyWan, 0)),
    otherPolicyWan: Math.max(0, toFiniteNumber(assets.otherPolicyWan, 0)),
    stockWan: Math.max(0, toFiniteNumber(assets.stockWan, 0)),
    fundWan: Math.max(0, toFiniteNumber(assets.fundWan, 0)),
    bondWan: Math.max(0, toFiniteNumber(assets.bondWan, 0)),
    depositWan: Math.max(0, toFiniteNumber(assets.depositWan, 0))
  };
  const totalFinancialAssetsWan = Object.values(values).reduce((sum, value) => sum + value, 0);
  const mortgageTermYears = Math.max(0, toFiniteNumber(mortgageMonths, 0)) / 12;
  const assetConvertedIncomeWan = mortgageTermYears > 0
    ? Math.round((totalFinancialAssetsWan * 0.9) / mortgageTermYears)
    : 0;
  return {
    ...values,
    totalFinancialAssetsWan,
    mortgageTermYears,
    assetConvertedIncomeWan
  };
}

export function calculateCapacity({ loans = DEFAULT_LOANS, income = DEFAULT_INCOME, assets = DEFAULT_ASSETS } = {}) {
  const loanResult = calculateLoans(loans);
  const incomeResult = calculateRecognizedIncome(income);
  const mortgageMonths = loanResult.items[0]?.months ?? 0;
  const assetResult = calculateFinancialAssets(assets, mortgageMonths);
  const recurringRecognizedIncomeWan = incomeResult.recurringRecognizedIncomeWan;
  const financialAssetBonusIncomeWan = assetResult.assetConvertedIncomeWan;
  const totalRecognizedIncomeWan = recurringRecognizedIncomeWan + financialAssetBonusIncomeWan;
  const debtIncomeRatio = totalRecognizedIncomeWan > 0
    ? loanResult.totalAnnualDebtWan / totalRecognizedIncomeWan
    : null;
  const status = debtIncomeRatio == null
    ? "無法計算"
    : debtIncomeRatio <= 0.7
      ? "符合標準"
      : "超過標準";
  return {
    loans: loanResult,
    income: incomeResult,
    assets: assetResult,
    recurringRecognizedIncomeWan,
    financialAssetBonusIncomeWan,
    totalRecognizedIncomeWan,
    debtIncomeRatio,
    status,
    meetsStandard: debtIncomeRatio != null ? debtIncomeRatio <= 0.7 : null
  };
}
