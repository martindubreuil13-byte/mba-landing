"use client";

import { useState } from "react";
import StepShell from "./StepShell";
import { formatCount } from "@/app/lib/napkin/format";
import type { ObservableUnits, SurvivalNumberResult } from "@/app/lib/napkin/types";
import { CONFIDENCE_LEVELS, REACHABILITY_OPTIONS, SEASONALITY_OPTIONS, type ConfidenceLevel, type ReachabilityAnswer, type SeasonalityAnswer } from "@/app/lib/napkin/config";

export type RealityCheckValues = {
  expectedMonthlyVolume: number | null;
  maxMonthlyCapacity: number | null;
  seasonality: SeasonalityAnswer | null;
  reachability: ReachabilityAnswer | null;
  priceConfidence: ConfidenceLevel | null;
  directCostConfidence: ConfidenceLevel | null;
  monthlyCostConfidence: ConfidenceLevel | null;
  volumeEvidence: string;
};

type Props = {
  index: number;
  total: number;
  survival: SurvivalNumberResult;
  observable: ObservableUnits;
  initial: RealityCheckValues;
  onBack?: () => void;
  onContinue: (values: RealityCheckValues) => void;
};

const inputClass =
  "w-full border border-[#1a1816]/15 bg-white px-4 py-3 text-[#1a1816] focus:outline-none focus:border-[#6b1f1f] transition-colors";

function ChoiceGroup<T extends string>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: readonly { value: T; label: string }[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset>
      <legend className="block text-sm text-[#1a1816]/70 mb-3">{legend}</legend>
      <div className="space-y-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={value === opt.value}
            className={`w-full text-left border px-4 py-3 text-sm transition-colors ${
              value === opt.value ? "border-[#6b1f1f] bg-[#6b1f1f]/5 text-[#1a1816]" : "border-[#1a1816]/15 text-[#1a1816]/75 hover:border-[#1a1816]/30"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default function RealityCheckStepScreen({ index, total, survival, observable, initial, onBack, onContinue }: Props) {
  const [expected, setExpected] = useState(initial.expectedMonthlyVolume !== null ? String(initial.expectedMonthlyVolume) : "");
  const [capacity, setCapacity] = useState(initial.maxMonthlyCapacity !== null ? String(initial.maxMonthlyCapacity) : "");
  const [seasonality, setSeasonality] = useState<SeasonalityAnswer | null>(initial.seasonality);
  const [reachability, setReachability] = useState<ReachabilityAnswer | null>(initial.reachability);
  const [priceConfidence, setPriceConfidence] = useState<ConfidenceLevel | null>(initial.priceConfidence);
  const [directCostConfidence, setDirectCostConfidence] = useState<ConfidenceLevel | null>(initial.directCostConfidence);
  const [monthlyCostConfidence, setMonthlyCostConfidence] = useState<ConfidenceLevel | null>(initial.monthlyCostConfidence);
  const [volumeEvidence, setVolumeEvidence] = useState(initial.volumeEvidence);
  const [error, setError] = useState("");

  const handleContinue = () => {
    if (!expected || !capacity || !seasonality || !reachability || !priceConfidence || !directCostConfidence || !monthlyCostConfidence) {
      setError("A few of these still need an answer before the result can be calculated.");
      return;
    }
    const expectedNumber = Number(expected);
    const capacityNumber = Number(capacity);
    if (!Number.isFinite(expectedNumber) || expectedNumber < 0 || !Number.isFinite(capacityNumber) || capacityNumber < 0) {
      setError("Expected volume and capacity must be valid numbers of zero or more.");
      return;
    }
    onContinue({
      expectedMonthlyVolume: expectedNumber,
      maxMonthlyCapacity: capacityNumber,
      seasonality,
      reachability,
      priceConfidence,
      directCostConfidence,
      monthlyCostConfidence,
      volumeEvidence: volumeEvidence.trim(),
    });
  };

  return (
    <StepShell stepLabel="Make the number face reality" index={index} total={total} onBack={onBack}>
      <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-6">Make the number face reality</p>
      <h2 className="text-2xl md:text-3xl font-light text-[#1a1816] mb-6">Does this hold up?</h2>

      <div className="border border-[#1a1816]/10 bg-[#faf8f6] px-5 py-5 mb-10" aria-label="Required operating volume">
        <p className="text-xs tracking-widest uppercase text-[#1a1816]/45 font-semibold mb-4">What the business requires</p>
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div><dt className="text-xs text-[#1a1816]/50">Required monthly volume</dt><dd className="text-2xl font-light text-[#6b1f1f]">{formatCount(survival.requiredPerMonthRounded)}</dd></div>
          {observable.perTradingDay !== null && <div><dt className="text-xs text-[#1a1816]/50">Required per trading day</dt><dd className="text-2xl font-light text-[#1a1816]">{formatCount(observable.perTradingDay)}</dd></div>}
          {observable.perOpeningHour !== null && <div><dt className="text-xs text-[#1a1816]/50">Required per opening hour</dt><dd className="text-2xl font-light text-[#1a1816]">{formatCount(observable.perOpeningHour)}</dd></div>}
        </dl>
      </div>

      <div className="space-y-8">
        <div>
          <label htmlFor="np-expected" className="block text-sm text-[#1a1816]/70 mb-2">
            What is the expected realistic monthly volume?
          </label>
          <input id="np-expected" type="number" inputMode="numeric" min={0} value={expected} onChange={(e) => setExpected(e.target.value)} className={inputClass} placeholder="0" />
        </div>

        <div>
          <label htmlFor="np-capacity" className="block text-sm text-[#1a1816]/70 mb-2">
            What is the maximum number the business could physically deliver in an ordinary month?
          </label>
          <input id="np-capacity" type="number" inputMode="numeric" min={0} value={capacity} onChange={(e) => setCapacity(e.target.value)} className={inputClass} placeholder="0" />
        </div>

        <ChoiceGroup legend="Is demand meaningfully seasonal?" options={SEASONALITY_OPTIONS} value={seasonality} onChange={setSeasonality} />
        <ChoiceGroup
          legend="Are enough customers reachable through the intended location, channel, or sales process?"
          options={REACHABILITY_OPTIONS}
          value={reachability}
          onChange={setReachability}
        />
        <ChoiceGroup legend="How confident are you in the selling price?" options={CONFIDENCE_LEVELS} value={priceConfidence} onChange={setPriceConfidence} />
        <ChoiceGroup legend="How confident are you in the direct costs?" options={CONFIDENCE_LEVELS} value={directCostConfidence} onChange={setDirectCostConfidence} />
        <ChoiceGroup legend="How confident are you in the monthly operating costs?" options={CONFIDENCE_LEVELS} value={monthlyCostConfidence} onChange={setMonthlyCostConfidence} />

        <div>
          <label htmlFor="np-evidence" className="block text-sm text-[#1a1816]/70 mb-2">
            What real evidence supports the expected transaction volume? <span className="text-[#1a1816]/40">(optional)</span>
          </label>
          <textarea id="np-evidence" value={volumeEvidence} onChange={(e) => setVolumeEvidence(e.target.value)} rows={3} className={`${inputClass} resize-none`} placeholder="e.g. foot traffic counts, waitlist signups, past sales…" />
        </div>
      </div>

      {error && (
        <p className="text-sm text-[#6b1f1f] mt-6" role="alert">
          {error}
        </p>
      )}

      <button onClick={handleContinue} className="mt-10 text-sm font-semibold tracking-widest uppercase text-white bg-[#6b1f1f] px-8 py-4 transition-all hover:bg-[#6b1f1f]/90">
        See my result →
      </button>
    </StepShell>
  );
}
