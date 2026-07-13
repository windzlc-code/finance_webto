import { calculateCapacity } from "./mortgageCapacityCalculator.js?v=20260623-rate-term-linked";
import { LoanTable } from "./components/LoanTable.js?v=20260623-readonly-loan-name";
import { IncomeSection } from "./components/IncomeSection.js?v=20260621-asset-two-col";
import { AssetSection } from "./components/AssetSection.js?v=20260621-asset-two-col";
import { ResultPanel } from "./components/ResultPanel.js";

const root = document.getElementById("loanCapacityRoot");

if (root) {
  const shell = document.createElement("div");
  shell.className = "loan-capacity-layout";
  shell.innerHTML = `
    <div class="loan-capacity-inputs">
      <div data-loan-table></div>
      <div class="loan-capacity-side-grid">
        <div data-income-section></div>
        <div data-asset-section></div>
      </div>
      <div class="loan-action-row">
        <button id="loanRecalculateBtn" type="button" class="btn btn-main">重新計算</button>
        <button id="loanClearBtn" type="button" class="btn btn-ghost">清空</button>
        <button id="loanResetBtn" type="button" class="btn btn-case">恢復預設值</button>
      </div>
    </div>
    <aside data-result-panel></aside>
  `;
  root.append(shell);

  const resultPanel = new ResultPanel(shell.querySelector("[data-result-panel]"));
  let loanTable;
  let incomeSection;
  let assetSection;

  const applyMortgageState = (state = window.FoundMortgageCalculatorState || {}) => {
    if (!loanTable || !state) return;
    loanTable.applyMortgage({
      principalWan: state.loanAmountWan,
      annualRatePct: state.annualRatePct,
      months: state.totalMonths,
      loanYears: state.loanYears
    });
  };

  const recalculate = () => {
    const loans = loanTable.getValue();
    const income = incomeSection.getValue();
    const assets = assetSection.getValue();
    const mortgageMonths = loans[0]?.months || 0;
    assetSection.updateComputed(mortgageMonths);
    resultPanel.update(calculateCapacity({ loans, income, assets }));
  };

  loanTable = new LoanTable(shell.querySelector("[data-loan-table]"), recalculate);
  incomeSection = new IncomeSection(shell.querySelector("[data-income-section]"), recalculate);
  assetSection = new AssetSection(shell.querySelector("[data-asset-section]"), recalculate);

  resultPanel.render();
  loanTable.render();
  incomeSection.render();
  assetSection.render();
  recalculate();
  applyMortgageState();

  document.addEventListener("found:mortgage-calculator-updated", (event) => {
    applyMortgageState(event.detail || {});
  });

  document.getElementById("loanRecalculateBtn")?.addEventListener("click", recalculate);
  document.getElementById("loanClearBtn")?.addEventListener("click", () => {
    loanTable.clear();
    incomeSection.clear();
    assetSection.clear();
    applyMortgageState();
    recalculate();
  });
  document.getElementById("loanResetBtn")?.addEventListener("click", () => {
    loanTable.reset();
    incomeSection.reset();
    assetSection.reset();
    applyMortgageState();
    recalculate();
  });
}
