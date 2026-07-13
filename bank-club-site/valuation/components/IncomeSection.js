import { DEFAULT_INCOME, calculateRecognizedIncome } from "../mortgageCapacityCalculator.js";
import { formatWan, normalizeDisplayOnFocus, parseNumericInput, setInputDisplay } from "./formatters.js";

const INCOME_FIELDS = [
  { key: "salaryWan", label: "薪資收入", unit: "萬元/年" },
  { key: "pensionWan", label: "退休俸收入", unit: "萬元/年" },
  { key: "dividendWan", label: "各類配息 / 年金收入", unit: "萬元/年" },
  { key: "rentWan", label: "租金收入", unit: "萬元/年" }
];

export class IncomeSection {
  constructor(container, onChange) {
    this.container = container;
    this.onChange = onChange;
    this.income = structuredClone(DEFAULT_INCOME);
  }

  render() {
    this.container.innerHTML = `
      <section class="loan-card">
        <div class="loan-card-head">
          <h3>經常性收入</h3>
          <span>租金收入自動認列 90%</span>
        </div>
        <div class="capacity-field-grid income-field-grid">
          ${INCOME_FIELDS.map((field) => `
            <div class="capacity-field">
              <label for="income-${field.key}">${field.label}</label>
              <div class="capacity-input-with-unit">
                <input id="income-${field.key}" data-income-field="${field.key}" inputmode="decimal" />
                <span>${field.unit}</span>
              </div>
            </div>
          `).join("")}
        </div>
        <div class="capacity-subtotal">
          <span>租金收入認列</span><strong data-income-rent-recognized>0 萬元/年</strong>
          <span>經常性收入認列小計</span><strong data-income-total>0 萬元/年</strong>
        </div>
      </section>
    `;
    this.bindEvents();
    this.updateComputed();
  }

  bindEvents() {
    this.container.querySelectorAll("[data-income-field]").forEach((input) => {
      const key = input.dataset.incomeField;
      setInputDisplay(input, this.income[key], { digits: 0 });
      input.addEventListener("focus", normalizeDisplayOnFocus);
      input.addEventListener("blur", () => setInputDisplay(input, this.income[key], { digits: 0 }));
      input.addEventListener("input", () => {
        this.income[key] = Math.max(0, parseNumericInput(input.value));
        this.updateComputed();
        this.onChange?.();
      });
    });
  }

  updateComputed() {
    const result = calculateRecognizedIncome(this.income);
    const rent = this.container.querySelector("[data-income-rent-recognized]");
    const total = this.container.querySelector("[data-income-total]");
    if (rent) rent.textContent = formatWan(result.recognizedRentWan, 0);
    if (total) total.textContent = formatWan(result.recurringRecognizedIncomeWan, 0);
  }

  getValue() {
    return structuredClone(this.income);
  }

  reset() {
    this.income = structuredClone(DEFAULT_INCOME);
    this.render();
    this.onChange?.();
  }

  clear() {
    this.income = structuredClone(DEFAULT_INCOME);
    this.render();
    this.onChange?.();
  }
}
