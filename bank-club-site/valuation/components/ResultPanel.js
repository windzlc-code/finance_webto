import { formatNumber, formatWan, formatWanAmount, formatYuan } from "./formatters.js";

export class ResultPanel {
  constructor(container) {
    this.container = container;
  }

  render() {
    this.container.innerHTML = `
      <section class="loan-card result-capacity-card">
        <div class="loan-card-head">
          <h3>試算結果</h3>
          <span>標準：收支比 70% 以下</span>
        </div>
        <div class="capacity-result-main">
          <div>
            <small>收支比概算結果</small>
            <strong data-result-ratio>--</strong>
            <span>%</span>
          </div>
          <b data-result-status class="capacity-status capacity-status-neutral">無法計算</b>
        </div>
        <div class="capacity-kpi-grid">
          <div><span>貸款每月還款合計</span><strong data-total-monthly>0 元</strong></div>
          <div><span>合計負債支出</span><strong data-total-debt>0 萬元/年</strong></div>
          <div><span>經常性收入認列小計</span><strong data-recurring-income>0 萬元/年</strong></div>
          <div><span>金融資產加分收入</span><strong data-asset-income>0 萬元/年</strong></div>
          <div><span>合計可認列收入（收支比分母）</span><strong data-total-income>0 萬元/年</strong></div>
          <div><span>合計金融資產</span><strong data-asset-total>0 萬元</strong></div>
        </div>
      </section>
    `;
  }

  update(result) {
    this.setText("[data-total-monthly]", formatYuan(result.loans.totalMonthlyPaymentYuan));
    this.setText("[data-total-debt]", formatWan(result.loans.totalAnnualDebtWan, 0));
    this.setText("[data-recurring-income]", formatWan(result.income.recurringRecognizedIncomeWan, 0));
    this.setText("[data-asset-income]", formatWan(result.assets.assetConvertedIncomeWan, 0));
    this.setText("[data-total-income]", formatWan(result.totalRecognizedIncomeWan, 0));
    this.setText("[data-asset-total]", formatWanAmount(result.assets.totalFinancialAssetsWan, 0));
    const ratioNode = this.container.querySelector("[data-result-ratio]");
    if (ratioNode) {
      ratioNode.textContent = result.debtIncomeRatio == null
        ? "--"
        : formatNumber(result.debtIncomeRatio * 100, 0);
    }
    const statusNode = this.container.querySelector("[data-result-status]");
    if (statusNode) {
      statusNode.textContent = result.status;
      statusNode.className = `capacity-status ${statusClass(result.status)}`;
    }
  }

  setText(selector, text) {
    const node = this.container.querySelector(selector);
    if (node) node.textContent = text;
  }
}

function statusClass(status) {
  if (status === "符合標準") return "capacity-status-ok";
  if (status === "超過標準") return "capacity-status-warn";
  return "capacity-status-neutral";
}
