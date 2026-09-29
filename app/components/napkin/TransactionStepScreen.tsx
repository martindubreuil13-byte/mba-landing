"use client";

import { useState } from "react";
import StepShell from "./StepShell";

export type TransactionStepValues = {
  transactionSingular: string;
  transactionPlural: string;
  sellingPrice: number;
};

type Props = {
  index: number;
  total: number;
  initial: TransactionStepValues;
  currency: string;
  onBack?: () => void;
  onContinue: (values: TransactionStepValues) => void;
};

const inputClass =
  "w-full border border-[#1a1816]/15 bg-white px-4 py-3 text-[#1a1816] focus:outline-none focus:border-[#6b1f1f] transition-colors";

export default function TransactionStepScreen({ index, total, initial, currency, onBack, onContinue }: Props) {
  const [transactionLabel, setTransactionLabel] = useState(initial.transactionSingular || initial.transactionPlural);
  const [price, setPrice] = useState(initial.sellingPrice > 0 ? String(initial.sellingPrice) : "");
  const [error, setError] = useState("");

  const handleContinue = () => {
    const numeric = Number(price);
    if (!transactionLabel.trim()) {
      setError("Name the transaction — what does the customer actually buy?");
      return;
    }
    if (!price || !Number.isFinite(numeric) || numeric <= 0) {
      setError("Enter a realistic average price greater than zero.");
      return;
    }
    onContinue({
      transactionSingular: transactionLabel.trim(),
      transactionPlural: transactionLabel.trim(),
      sellingPrice: numeric,
    });
  };

  return (
    <StepShell stepLabel="The core transaction" index={index} total={total} onBack={onBack}>
      <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-6">Define the core transaction</p>
      <h2 className="text-2xl md:text-3xl font-light text-[#1a1816] mb-4">What is the core item or transaction?</h2>
      <p className="text-base text-[#1a1816]/60 mb-3 leading-relaxed">
        This may be one specific product or service, or a realistic average across a group of similar transactions.
      </p>

      <div className="space-y-8">
        <div>
          <label htmlFor="np-transaction" className="block text-sm text-[#1a1816]/70 mb-2">Core item or transaction</label>
          <input id="np-transaction" value={transactionLabel} onChange={(e) => setTransactionLabel(e.target.value)} className={inputClass} placeholder="Burger meal, consulting project, monthly subscription, retained client" />
        </div>

        <div>
          <label htmlFor="np-price" className="block text-sm text-[#1a1816]/70 mb-2">
            What is its estimated average selling price?
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#1a1816]/50 w-14">{currency}</span>
            <input
              id="np-price"
              type="text"
              inputMode="decimal"
              pattern="[0-9]*[.]?[0-9]*"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={inputClass}
              placeholder="0.00"
            />
          </div>
          <p className="text-xs text-[#1a1816]/45 mt-2">Use a realistic average rather than the highest possible price.</p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-[#6b1f1f] mt-6" role="alert">
          {error}
        </p>
      )}

      <button onClick={handleContinue} className="mt-10 text-sm font-semibold tracking-widest uppercase text-white bg-[#6b1f1f] px-8 py-4 transition-all hover:bg-[#6b1f1f]/90">
        Continue →
      </button>
    </StepShell>
  );
}
