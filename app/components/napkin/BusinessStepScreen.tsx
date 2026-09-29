"use client";

import { useState } from "react";
import StepShell from "./StepShell";
import { BUSINESS_STAGES, CURRENCIES, type BusinessStage } from "@/app/lib/napkin/config";

export type BusinessStepValues = {
  businessName: string;
  businessStage: BusinessStage;
  whatItSells: string;
  currency: string;
};

type Props = {
  index: number;
  total: number;
  initial: BusinessStepValues;
  onBack?: () => void;
  onContinue: (values: BusinessStepValues) => void;
};

const inputClass =
  "w-full border border-[#1a1816]/15 bg-white px-4 py-3 text-[#1a1816] focus:outline-none focus:border-[#6b1f1f] transition-colors";

export default function BusinessStepScreen({ index, total, initial, onBack, onContinue }: Props) {
  const [businessName, setBusinessName] = useState(initial.businessName);
  const [businessStage, setBusinessStage] = useState<BusinessStage | "">(initial.businessStage || "");
  const [whatItSells, setWhatItSells] = useState(initial.whatItSells);
  const [currency, setCurrency] = useState(initial.currency || "USD");
  const [error, setError] = useState("");

  const handleContinue = () => {
    if (!businessName.trim() || !businessStage || !whatItSells.trim()) {
      setError("A name, a stage and a one-sentence description are all needed to continue.");
      return;
    }
    onContinue({ businessName: businessName.trim(), businessStage: businessStage as BusinessStage, whatItSells: whatItSells.trim(), currency });
  };

  return (
    <StepShell stepLabel="The business" index={index} total={total} onBack={onBack}>
      <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-6">The business</p>
      <h2 className="text-2xl md:text-3xl font-light text-[#1a1816] mb-10">A little context.</h2>

      <div className="space-y-8">
        <div>
          <label htmlFor="np-businessName" className="block text-sm text-[#1a1816]/70 mb-2">
            What should we call this business or idea?
          </label>
          <input id="np-businessName" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={inputClass} placeholder="A working name is fine" />
        </div>

        <div>
          <label className="block text-sm text-[#1a1816]/70 mb-3">Is it an idea, a business being prepared, or an operating business?</label>
          <div className="space-y-2">
            {BUSINESS_STAGES.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setBusinessStage(opt.value)}
                aria-pressed={businessStage === opt.value}
                className={`w-full text-left border px-4 py-3 text-sm transition-colors ${
                  businessStage === opt.value ? "border-[#6b1f1f] bg-[#6b1f1f]/5 text-[#1a1816]" : "border-[#1a1816]/15 text-[#1a1816]/75 hover:border-[#1a1816]/30"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="np-whatItSells" className="block text-sm text-[#1a1816]/70 mb-2">
            In one sentence, what does it sell?
          </label>
          <input id="np-whatItSells" value={whatItSells} onChange={(e) => setWhatItSells(e.target.value)} className={inputClass} placeholder="A simple description" />
        </div>

        <div>
          <label htmlFor="np-currency" className="block text-sm text-[#1a1816]/70 mb-2">
            Which currency should we use?
          </label>
          <select id="np-currency" value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClass}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-[#1a1816]/40 mt-2">Currency affects formatting only — no exchange rates are applied.</p>
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
