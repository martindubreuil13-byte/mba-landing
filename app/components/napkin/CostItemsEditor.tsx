"use client";

import { useId, useState } from "react";
import type { CostLineItem } from "@/app/lib/napkin/types";

type Props = {
  items: CostLineItem[];
  onChange: (items: CostLineItem[]) => void;
  presets: readonly string[];
  currencySymbolHint: string;
  amountLabel?: string;
};

let counter = 0;
function nextId() {
  counter += 1;
  return `item-${Date.now()}-${counter}`;
}

const inputClass =
  "w-full border border-[#1a1816]/15 bg-white px-3 py-2.5 text-[#1a1816] focus:outline-none focus:border-[#6b1f1f] transition-colors text-sm";

export default function CostItemsEditor({ items, onChange, presets, currencySymbolHint, amountLabel = "Amount" }: Props) {
  const [customLabel, setCustomLabel] = useState("");
  const [amountDrafts, setAmountDrafts] = useState<Record<string, string>>({});
  const groupId = useId();

  const activeLabels = new Set(items.map((i) => i.label));
  const availablePresets = presets.filter((p) => !activeLabels.has(p));

  const addItem = (label: string) => {
    if (!label.trim()) return;
    onChange([...items, { id: nextId(), label: label.trim(), amount: 0 }]);
  };

  const updateItem = (id: string, patch: Partial<CostLineItem>) => {
    onChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const removeItem = (id: string) => {
    onChange(items.filter((i) => i.id !== id));
  };

  return (
    <div>
      <fieldset>
        <legend className="sr-only">Cost line items</legend>
        <div className="space-y-3" role="group" aria-labelledby={groupId}>
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <input
                type="text"
                value={item.label}
                onChange={(e) => updateItem(item.id, { label: e.target.value })}
                aria-label="Cost line item name"
                className={`${inputClass} flex-1`}
              />
              <div className="flex items-center gap-1 w-32 shrink-0">
                <span className="text-sm text-[#1a1816]/40">{currencySymbolHint}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*[.]?[0-9]*"
                  value={amountDrafts[item.id] ?? (item.amount === 0 ? "" : String(item.amount))}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setAmountDrafts((current) => ({ ...current, [item.id]: raw }));
                    if (raw === "") {
                      updateItem(item.id, { amount: 0 });
                      return;
                    }
                    const numeric = Number(raw);
                    if (Number.isFinite(numeric) && numeric >= 0) updateItem(item.id, { amount: numeric });
                  }}
                  aria-label={`${amountLabel} for ${item.label || "line item"}`}
                  placeholder="0.00"
                  className={inputClass}
                />
              </div>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                aria-label={`Remove ${item.label || "line item"}`}
                className="text-[#1a1816]/35 hover:text-[#6b1f1f] text-lg leading-none px-1 shrink-0"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </fieldset>

      {items.length === 0 && <p className="text-sm text-[#1a1816]/45 italic mb-2">No line items yet — add any that apply below.</p>}

      {availablePresets.length > 0 && (
        <div className="mt-6">
          <p id={groupId} className="text-xs tracking-widest uppercase text-[#1a1816]/40 mb-3">
            Add a suggested category
          </p>
          <div className="flex flex-wrap gap-2">
            {availablePresets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => addItem(preset)}
                className="text-sm border border-[#1a1816]/15 px-3 py-1.5 text-[#1a1816]/70 hover:border-[#6b1f1f] hover:text-[#1a1816] transition-colors"
              >
                + {preset}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        <input
          type="text"
          value={customLabel}
          onChange={(e) => setCustomLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem(customLabel);
              setCustomLabel("");
            }
          }}
          placeholder="Or add your own cost…"
          aria-label="Custom cost line item name"
          className={`${inputClass} flex-1`}
        />
        <button
          type="button"
          onClick={() => {
            addItem(customLabel);
            setCustomLabel("");
          }}
          disabled={!customLabel.trim()}
          className="text-sm font-semibold text-[#6b1f1f] px-3 py-2.5 border border-[#6b1f1f]/30 hover:bg-[#6b1f1f]/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}
