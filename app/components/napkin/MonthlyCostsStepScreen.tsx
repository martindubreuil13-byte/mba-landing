"use client";

import { useMemo, useState } from "react";
import StepShell from "./StepShell";
import CostItemsEditor from "./CostItemsEditor";
import { computeMonthlyOperatingCost } from "@/app/lib/napkin/calculations";
import { MONTHLY_COST_CATEGORY_PRESETS } from "@/app/lib/napkin/config";
import { formatCurrency } from "@/app/lib/napkin/format";
import type { CostLineItem } from "@/app/lib/napkin/types";

type Props = {
  index: number;
  total: number;
  currency: string;
  initialItems: CostLineItem[];
  onBack?: () => void;
  onContinue: (items: CostLineItem[]) => void;
};

export default function MonthlyCostsStepScreen({ index, total, currency, initialItems, onBack, onContinue }: Props) {
  const [items, setItems] = useState<CostLineItem[]>(initialItems);

  const monthlyTotal = useMemo(() => computeMonthlyOperatingCost(items, currency), [items, currency]);

  return (
    <StepShell stepLabel="Monthly cost of existing" index={index} total={total} onBack={onBack}>
      <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-6">Monthly cost of existing</p>
      <h2 className="text-2xl md:text-3xl font-light text-[#1a1816] mb-4">What does an ordinary month cost?</h2>
      <p className="text-base text-[#1a1816]/60 mb-2 leading-relaxed">
        These are the costs that arrive during an ordinary month whether customers appear or not.
      </p>
      <p className="text-sm text-[#1a1816]/55 mb-8 leading-relaxed">
        Include the income the founder reasonably needs. A business that works only because its owner is unpaid is
        being subsidized by the owner.
      </p>

      <CostItemsEditor items={items} onChange={setItems} presets={MONTHLY_COST_CATEGORY_PRESETS} currencySymbolHint={currency} amountLabel="Cost" />

      <div className="mt-8 border-t border-[#1a1816]/10 pt-6" aria-live="polite">
        <div className="flex items-baseline justify-between">
          <span className="text-base font-semibold text-[#1a1816]">Estimated monthly operating cost</span>
          <span className="text-xl font-light text-[#6b1f1f]">{formatCurrency(monthlyTotal, currency)}</span>
        </div>
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
