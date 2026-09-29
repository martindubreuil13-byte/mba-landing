"use client";

import { useMemo, useState } from "react";
import StepShell from "./StepShell";
import CostItemsEditor from "./CostItemsEditor";
import { computeContribution } from "@/app/lib/napkin/calculations";
import { DIRECT_COST_CATEGORY_PRESETS } from "@/app/lib/napkin/config";
import { formatCurrency } from "@/app/lib/napkin/format";
import type { CostLineItem } from "@/app/lib/napkin/types";

type Props = {
  index: number;
  total: number;
  sellingPrice: number;
  currency: string;
  initialItems: CostLineItem[];
  onBack?: () => void;
  onContinue: (items: CostLineItem[]) => void;
};

export default function DirectCostsStepScreen({ index, total, sellingPrice, currency, initialItems, onBack, onContinue }: Props) {
  const [items, setItems] = useState<CostLineItem[]>(initialItems);

  const live = useMemo(() => computeContribution(sellingPrice, items, currency), [sellingPrice, items, currency]);

  return (
    <StepShell stepLabel="Direct costs" index={index} total={total} onBack={onBack}>
      <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-6">Direct costs</p>
      <h2 className="text-2xl md:text-3xl font-light text-[#1a1816] mb-4">What does one transaction cost you?</h2>
      <p className="text-base text-[#1a1816]/60 mb-8 leading-relaxed">
        Direct costs are the costs that appear or increase when one more transaction happens.
      </p>

      <CostItemsEditor items={items} onChange={setItems} presets={DIRECT_COST_CATEGORY_PRESETS} currencySymbolHint={currency} amountLabel="Cost" />

      <div className="mt-8 border-t border-[#1a1816]/10 pt-6" aria-live="polite">
        <div className="flex items-baseline justify-between text-sm text-[#1a1816]/70 mb-1">
          <span>Selling price</span>
          <span>{formatCurrency(sellingPrice, currency)}</span>
        </div>
        <div className="flex items-baseline justify-between text-sm text-[#1a1816]/70 mb-3">
          <span>− Direct cost per transaction</span>
          <span>{formatCurrency(live.totalDirectCost, currency)}</span>
        </div>
        <div className="flex items-baseline justify-between border-t border-[#1a1816]/10 pt-3">
          <span className="text-base font-semibold text-[#1a1816]">= Money remaining per transaction</span>
          <span className="text-xl font-light text-[#6b1f1f]">{formatCurrency(live.moneyRemainingPerTransaction, currency)}</span>
        </div>
        {live.contributionPercent !== null && (
          <p className="text-xs text-[#1a1816]/45 mt-1">Contribution per transaction: {live.contributionPercent}%</p>
        )}
        <p className="text-sm text-[#1a1816]/55 mt-4 leading-relaxed">
          This is not profit. This money must first carry the monthly cost of the business.
        </p>
      </div>

      <button
        onClick={() => onContinue(items)}
        className="mt-10 text-sm font-semibold tracking-widest uppercase text-white bg-[#6b1f1f] px-8 py-4 transition-all hover:bg-[#6b1f1f]/90"
      >
        Continue →
      </button>
    </StepShell>
  );
}
