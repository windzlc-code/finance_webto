import { DEFAULT_ASSETS, calculateFinancialAssets } from "../mortgageCapacityCalculator.js";
import { formatWan, formatWanAmount, normalizeDisplayOnFocus, parseNumericInput, setInputDisplay } from "./formatters.js";

const ASSET_FIELDS = [
  { key: "cathayPolicyWan", label: "國壽保單保價" },
  { key: "otherPolicyWan", label: "他行保單保價" },
  { key: "stockWan", label: "股票淨值" },
  { key: "fundWan", label: "基金淨值" },
  { key: "bondWan", label: "債券淨值" },
  { key: "depositWan", label: "定存淨值" }
];

export class AssetSection {
  constructor(container, onChange) {
    this.container = container;
    this.onChange = onChange;
    this.assets = structuredClone(DEFAULT_ASSETS);
    this.mortgageMonths = 0;
  }

  render() {
    this.container.innerHTML = `
      <section class="loan-card">
        <div class="loan-card-head">
          <h3>金融資產</h3>
          <span>淨值單位：萬元</span>
        </div>
        <div class="capacity-field-grid asset-field-grid">
          ${ASSET_FIELDS.map((field) => `
            <div class="capacity-field">
              <label for="asset-${field.key}">${field.label}</label>
              <div class="capacity-input-with-unit">
                <input id="asset-${field.key}" data-asset-field="${field.key}" inputmode="decimal" />
                <span>萬元</span>
              </div>
            </div>
          `).join("")}
        </div>
        <div class="capacity-subtotal">
          <span>合計金融資產</span><strong data-asset-total>0 萬元</strong>
          <span>本次房貸年數</span><strong data-asset-loan-years>--</strong>
          <span>金融資產加分收入</span><strong data-asset-income>0 萬元/年</strong>
        </div>
      </section>
    `;
    this.bindEvents();
    this.updateComputed(this.mortgageMonths);
  }

  bindEvents() {
    this.container.querySelectorAll("[data-asset-field]").forEach((input) => {
      const key = input.dataset.assetField;
      setInputDisplay(input, this.assets[key], { digits: 0 });
      input.addEventListener("focus", normalizeDisplayOnFocus);
      input.addEventListener("blur", () => setInputDisplay(input, this.assets[key], { digits: 0 }));
      input.addEventListener("input", () => {
        this.assets[key] = Math.max(0, parseNumericInput(input.value));
        this.updateComputed(this.mortgageMonths);
        this.onChange?.();
      });
    });
  }

  updateComputed(mortgageMonths = 0) {
    this.mortgageMonths = mortgageMonths;
    const result = calculateFinancialAssets(this.assets, mortgageMonths);
    const total = this.container.querySelector("[data-asset-total]");
    const loanYears = this.container.querySelector("[data-asset-loan-years]");
    const income = this.container.querySelector("[data-asset-income]");
    if (total) total.textContent = formatWanAmount(result.totalFinancialAssetsWan, 0);
    if (loanYears) loanYears.textContent = result.mortgageTermYears > 0 ? `${formatWanless(result.mortgageTermYears)} 年` : "--";
    if (income) income.textContent = formatWan(result.assetConvertedIncomeWan, 0);
  }

  getValue() {
    return structuredClone(this.assets);
  }

  reset() {
    this.assets = structuredClone(DEFAULT_ASSETS);
    this.render();
    this.onChange?.();
  }

  clear() {
    this.assets = structuredClone(DEFAULT_ASSETS);
    this.render();
    this.onChange?.();
  }
}

function formatWanless(value) {
  return Number(value).toLocaleString("zh-TW", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}
