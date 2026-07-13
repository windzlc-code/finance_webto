import {
  DEFAULT_MORTGAGE_CALCULATOR,
  calculateMortgage
} from "./mortgageCalculator.js";

const root = document.getElementById("mortgageCalculatorRoot");

function formatNumber(value, digits = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "--";
  return numeric.toLocaleString("zh-TW", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}

function formatYuan(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return "--";
  return formatNumber(Math.round(numeric), 0);
}

function formatWan(value, digits = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return "--";
  return `${formatNumber(numeric, digits)} 萬`;
}

function setText(container, selector, value) {
  const node = container.querySelector(selector);
  if (node) node.textContent = value;
}

function createInputField({ id, label, unit, value, min = 0, max = "", step = "0.01" }) {
  const maxAttr = max === "" ? "" : ` max="${max}"`;
  return `
    <label class="mortgage-field" for="${id}">
      <span>${label}</span>
      <span class="mortgage-input-with-unit">
        <input id="${id}" data-mortgage-field type="number" min="${min}"${maxAttr} step="${step}" value="${value}" inputmode="decimal" />
        <b>${unit}</b>
      </span>
    </label>
  `;
}

function readHouseValueWan() {
  const valueNode = document.getElementById("houseValue");
  const text = valueNode?.textContent ?? "";
  const numeric = Number(text.replace(/,/g, "").replace(/[^\d.]/g, ""));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

if (root) {
  root.innerHTML = `
    <div class="mortgage-calculator-layout">
      <div class="mortgage-calculator-card loan-card">
        <div class="loan-card-head">
          <h3>房貸條件</h3>
          <span>看到價格，立即估月付、利息與年收門檻</span>
        </div>
        <div class="mortgage-form-body">
          <div class="mortgage-field-grid">
            ${createInputField({
              id: "mortgageTotalPriceWan",
              label: "房屋總價",
              unit: "萬",
              value: DEFAULT_MORTGAGE_CALCULATOR.totalPriceWan,
              step: "1"
            })}
            ${createInputField({
              id: "mortgageDownPaymentPct",
              label: "自備款",
              unit: "%",
              value: DEFAULT_MORTGAGE_CALCULATOR.downPaymentPct,
              max: 100,
              step: "1"
            })}
            ${createInputField({
              id: "mortgageAnnualRatePct",
              label: "房貸利率",
              unit: "%",
              value: DEFAULT_MORTGAGE_CALCULATOR.annualRatePct,
              max: 20,
              step: "0.01"
            })}
            ${createInputField({
              id: "mortgageLoanYears",
              label: "貸款年限",
              unit: "年",
              value: DEFAULT_MORTGAGE_CALCULATOR.loanYears,
              max: 50,
              step: "1"
            })}
            ${createInputField({
              id: "mortgageGraceYears",
              label: "寬限期",
              unit: "年",
              value: DEFAULT_MORTGAGE_CALCULATOR.graceYears,
              max: 10,
              step: "1"
            })}
          </div>

          <div class="mortgage-primary-result" aria-live="polite">
            <div>
              <small data-mortgage-primary-label>每月月付金</small>
              <strong><span data-mortgage-monthly>--</span><em>元</em></strong>
              <span data-mortgage-primary-note>本息均攤估算</span>
            </div>
          </div>

          <div class="mortgage-kpi-grid">
            <div><small>貸款金額</small><strong data-mortgage-loan-amount>--</strong></div>
            <div><small>自備款金額</small><strong data-mortgage-down-payment>--</strong></div>
            <div><small>總利息</small><strong data-mortgage-interest>--</strong></div>
            <div><small>本利和（總還款）</small><strong data-mortgage-repayment>--</strong></div>
            <div><small>建議年收入</small><strong data-mortgage-income>--</strong></div>
            <div><small>寬限期內月付</small><strong data-mortgage-grace-payment>--</strong></div>
          </div>

          <div class="mortgage-action-row">
            <button id="mortgageClearBtn" type="button" class="btn btn-ghost">清空</button>
          </div>
        </div>
      </div>

    </div>
  `;

  const fields = {
    totalPriceWan: root.querySelector("#mortgageTotalPriceWan"),
    downPaymentPct: root.querySelector("#mortgageDownPaymentPct"),
    annualRatePct: root.querySelector("#mortgageAnnualRatePct"),
    loanYears: root.querySelector("#mortgageLoanYears"),
    graceYears: root.querySelector("#mortgageGraceYears")
  };

  function readForm() {
    return Object.fromEntries(
      Object.entries(fields).map(([key, input]) => [key, input?.value ?? ""])
    );
  }

  function setForm(values) {
    Object.entries(fields).forEach(([key, input]) => {
      if (input) input.value = values[key] ?? "";
    });
  }

  function publishMortgageResult(result) {
    window.FoundMortgageCalculatorState = result;
    document.dispatchEvent(new CustomEvent("found:mortgage-calculator-updated", {
      detail: result
    }));
  }

  function updateResult() {
    const result = calculateMortgage(readForm());
    const hasLoan = result.loanAmountWan > 0 && result.totalMonths > 0;
    const primaryLabel = result.effectiveGraceMonths > 0 ? "寬限期後月付金" : "每月月付金";
    const primaryNote = result.effectiveGraceMonths > 0
      ? `前 ${Math.round(result.effectiveGraceMonths / 12)} 年寬限期只繳利息，期滿後依剩餘 ${result.amortizedMonths} 期本息均攤。`
      : "本息均攤估算";

    setText(root, "[data-mortgage-primary-label]", primaryLabel);
    setText(root, "[data-mortgage-monthly]", hasLoan ? formatYuan(result.primaryMonthlyPaymentYuan) : "--");
    setText(root, "[data-mortgage-primary-note]", hasLoan ? primaryNote : "請輸入房屋總價與貸款年限");
    setText(root, "[data-mortgage-loan-amount]", hasLoan ? formatWan(result.loanAmountWan, 0) : "--");
    setText(root, "[data-mortgage-down-payment]", result.totalPriceWan > 0 ? formatWan(result.downPaymentWan, 0) : "--");
    setText(root, "[data-mortgage-interest]", hasLoan ? formatWan(result.totalInterestWan, 0) : "--");
    setText(root, "[data-mortgage-repayment]", hasLoan ? formatWan(result.totalRepaymentWan, 0) : "--");
    setText(root, "[data-mortgage-income]", hasLoan ? formatWan(result.suggestedAnnualIncomeWan, 0) : "--");
    setText(root, "[data-mortgage-grace-payment]", result.effectiveGraceMonths > 0 ? `${formatYuan(result.graceMonthlyPaymentYuan)} 元` : "--");

    publishMortgageResult(result);
    return result;
  }

  function applyEstimateValue(estimateWan) {
    const numeric = Number(estimateWan);
    if (!Number.isFinite(numeric) || numeric <= 0) return false;
    fields.totalPriceWan.value = Math.round(numeric);
    updateResult();
    return true;
  }

  function valuationEstimateFromDetail(detail = {}) {
    const estimate = Number(detail?.results?.estimate);
    if (Number.isFinite(estimate) && estimate > 0) return estimate;
    return readHouseValueWan();
  }

  root.querySelectorAll("[data-mortgage-field]").forEach((input) => {
    input.addEventListener("input", updateResult);
  });

  root.querySelector("#mortgageClearBtn")?.addEventListener("click", () => {
    setForm({
      totalPriceWan: "",
      downPaymentPct: "",
      annualRatePct: DEFAULT_MORTGAGE_CALCULATOR.annualRatePct,
      loanYears: "",
      graceYears: ""
    });
    updateResult();
  });

  document.addEventListener("found:valuation-results-updated", (event) => {
    applyEstimateValue(valuationEstimateFromDetail(event.detail || {}));
  });

  if (!applyEstimateValue(readHouseValueWan())) {
    updateResult();
  }
}
