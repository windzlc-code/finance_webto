import { calculateLoan, DEFAULT_LOANS, normalizeAnnualRate } from "../mortgageCapacityCalculator.js?v=20260623-rate-term-linked";
import { formatYuan, normalizeDisplayOnFocus, parseNumericInput, setInputDisplay } from "./formatters.js";

export class LoanTable {
  constructor(container, onChange) {
    this.container = container;
    this.onChange = onChange;
    this.loans = structuredClone(DEFAULT_LOANS);
  }

  render() {
    this.container.innerHTML = `
      <section class="loan-card loan-card-wide">
        <div class="loan-card-head">
          <h3>貸款項目</h3>
          <span>本次申請利率與期數由上方房貸條件同步；本金單位：萬元</span>
        </div>
        <div class="loan-table-wrap">
          <table class="loan-table">
            <thead>
              <tr>
                <th>貸款項目名稱</th>
                <th>本金（萬元）</th>
                <th>每月金額</th>
                <th>年度總額</th>
              </tr>
            </thead>
            <tbody>
              ${this.loans.map((loan, index) => this.renderRow(loan, index)).join("")}
            </tbody>
          </table>
        </div>
      </section>
    `;
    this.bindEvents();
    this.updateComputedCells();
  }

  renderRow(loan, index) {
    return `
      <tr data-loan-row="${index}">
        <td data-label="貸款項目名稱"><input class="loan-input loan-name-input loan-fixed-input" data-field="name" data-index="${index}" value="${escapeHtml(loan.name)}" readonly aria-readonly="true" /></td>
        <td data-label="本金（萬元）"><input class="loan-input loan-editable-input" data-field="principalWan" data-kind="money" data-index="${index}" inputmode="decimal" /></td>
        <td class="loan-result-cell" data-label="每月金額" data-monthly="${index}">--</td>
        <td class="loan-result-cell" data-label="年度總額" data-annual="${index}">--</td>
      </tr>
    `;
  }

  bindEvents() {
    this.container.querySelectorAll("[data-field]").forEach((input) => {
      const index = Number(input.dataset.index);
      const field = input.dataset.field;
      const kind = input.dataset.kind || "text";
      if (field === "name" && input.readOnly) return;
      if (field !== "name") {
        setInputDisplay(input, this.loans[index][field], {
          type: kind === "rate" ? "rate" : "number",
          digits: 0
        });
        input.addEventListener("focus", normalizeDisplayOnFocus);
        input.addEventListener("blur", () => {
          setInputDisplay(input, this.loans[index][field], {
            type: kind === "rate" ? "rate" : "number",
            digits: 0
          });
        });
      }
      input.addEventListener("input", () => {
        if (field === "name") {
          this.loans[index][field] = input.value;
        } else {
          const parsed = parseNumericInput(input.value);
          this.loans[index][field] = kind === "rate"
            ? normalizeAnnualRate(parsed)
            : kind === "integer"
              ? Math.max(0, Math.floor(parsed))
              : Math.max(0, parsed);
        }
        this.updateComputedCells();
        this.onChange?.();
      });
    });
  }

  updateComputedCells() {
    this.loans.forEach((loan, index) => {
      const computed = calculateLoan(loan);
      const monthlyCell = this.container.querySelector(`[data-monthly="${index}"]`);
      const annualCell = this.container.querySelector(`[data-annual="${index}"]`);
      if (monthlyCell) monthlyCell.textContent = formatYuan(computed.monthlyPayment);
      if (annualCell) annualCell.textContent = formatYuan(computed.annualTotal);
    });
  }

  getValue() {
    return structuredClone(this.loans);
  }

  reset() {
    this.loans = structuredClone(DEFAULT_LOANS);
    this.render();
    this.onChange?.();
  }

  clear() {
    this.loans = this.loans.map((loan, index) => ({
      ...loan,
      principalWan: 0,
      annualRate: loan.fixedTerms ? loan.annualRate : (DEFAULT_LOANS[index]?.annualRate ?? loan.annualRate ?? 0),
      months: loan.fixedTerms ? loan.months : 0
    }));
    this.render();
    this.onChange?.();
  }

  applyMortgage({ principalWan = null, annualRatePct = null, annualRate = null, loanYears = null, months = null } = {}) {
    const current = this.loans[0] || structuredClone(DEFAULT_LOANS[0]);
    const resolvedMonths = Number.isFinite(Number(months))
      ? Math.max(0, Math.floor(Number(months)))
      : Number.isFinite(Number(loanYears))
        ? Math.max(0, Math.floor(Number(loanYears) * 12))
        : current.months;
    const resolvedRate = annualRatePct != null
      ? normalizeAnnualRate(annualRatePct)
      : annualRate != null
        ? normalizeAnnualRate(annualRate)
        : current.annualRate;
    this.loans[0] = {
      ...current,
      name: current.name || "本次申請",
      principalWan: Math.max(0, Number(principalWan) || 0),
      annualRate: resolvedRate,
      months: resolvedMonths
    };
    this.render();
    this.onChange?.();
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
