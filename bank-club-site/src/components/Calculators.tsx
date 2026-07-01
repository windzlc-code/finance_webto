"use client";

import { useMemo, useState } from "react";

function monthlyPayment(amount: number, annualRate: number, years: number) {
  const months = years * 12;
  const monthlyRate = annualRate / 100 / 12;
  if (!Number.isFinite(amount) || !Number.isFinite(annualRate) || !Number.isFinite(years)) return 0;
  if (amount <= 0 || years <= 0 || annualRate < 0 || months <= 0) return 0;
  if (annualRate === 0) return amount / months;
  return (amount * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
}

function formatCurrency(value: number) {
  return Math.round(value).toLocaleString("zh-TW");
}

export function LoanCalculator({ title = "月付粗估工具" }: { title?: string }) {
  const [amount, setAmount] = useState(800000);
  const [rate, setRate] = useState(3.2);
  const [years, setYears] = useState(7);
  const payment = useMemo(() => monthlyPayment(amount, rate, years), [amount, rate, years]);
  const totalPayment = payment * years * 12;
  const totalInterest = Math.max(totalPayment - amount, 0);

  return (
    <div className="calculator">
      <h3>{title}</h3>
      <div className="calc-grid">
        <label>
          貸款金額
          <input
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            inputMode="numeric"
            min="0"
            step="10000"
            type="number"
          />
        </label>
        <label>
          年利率 %
          <input
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            inputMode="decimal"
            min="0"
            step="0.01"
            type="number"
          />
        </label>
        <label>
          年限
          <input
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            inputMode="numeric"
            min="1"
            step="1"
            type="number"
          />
        </label>
      </div>
      <div className="calc-result" aria-live="polite">
        <strong data-testid="calculator-monthly-payment">每月約 NT$ {formatCurrency(payment)}</strong>
        <span data-testid="calculator-total-payment">總還款約 NT$ {formatCurrency(totalPayment)}</span>
        <span data-testid="calculator-total-interest">利息約 NT$ {formatCurrency(totalInterest)}</span>
      </div>
      <p>僅為粗估參考，實際額度、利率、年限、費用與核准結果以銀行最終審核為準；總費用年百分率不等於貸款利率。</p>
    </div>
  );
}
