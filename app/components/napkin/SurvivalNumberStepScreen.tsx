"use client";

import { useMemo, useState } from "react";
import StepShell from "./StepShell";
import { computeObservableUnits, computeSurvivalNumber } from "@/app/lib/napkin/calculations";
import { formatCount, formatCurrency } from "@/app/lib/napkin/format";

export type RhythmValues = {
  tradingDaysPerMonth: number | null;
  openingHoursPerDay: number | null;
  capacityUnits: number | null;
  capacityUnitLabel: string | null;
};

type Props = {
  index: number;
  total: number;
  currency: string;
  transactionLabel: string;
  moneyRemainingPerTransaction: number;
  monthlyOperatingCost: number;
  initial: RhythmValues;
  onBack?: () => void;
  onContinue: (values: RhythmValues) => void;
};

const inputClass =
  "w-full border border-[#1a1816]/15 bg-white px-4 py-3 text-[#1a1816] focus:outline-none focus:border-[#6b1f1f] transition-colors";

export default function SurvivalNumberStepScreen({
  index,
  total,
  currency,
  transactionLabel,
  moneyRemainingPerTransaction,
  monthlyOperatingCost,
  initial,
  onBack,
  onContinue,
}: Props) {
  const [tradingDays, setTradingDays] = useState(initial.tradingDaysPerMonth !== null ? String(initial.tradingDaysPerMonth) : "");
  const [openingHours, setOpeningHours] = useState(initial.openingHoursPerDay !== null ? String(initial.openingHoursPerDay) : "");
  const [capacityUnits, setCapacityUnits] = useState(initial.capacityUnits !== null ? String(initial.capacityUnits) : "");
  const [capacityLabel, setCapacityLabel] = useState(initial.capacityUnitLabel || "");
  const [error, setError] = useState("");

  const survival = useMemo(
    () => computeSurvivalNumber(monthlyOperatingCost, moneyRemainingPerTransaction, currency),
    [monthlyOperatingCost, moneyRemainingPerTransaction, currency]
  );

  const rhythm = useMemo(
    () => ({
      tradingDaysPerMonth: tradingDays ? Number(tradingDays) : null,
      openingHoursPerDay: openingHours ? Number(openingHours) : null,
      capacityUnits: capacityUnits ? Number(capacityUnits) : null,
    }),
    [tradingDays, openingHours, capacityUnits]
  );

  const observable = useMemo(() => computeObservableUnits(survival.requiredPerMonthExact, rhythm), [survival.requiredPerMonthExact, rhythm]);

  const handleContinue = () => {
    const provided = [tradingDays, openingHours, capacityUnits].filter(Boolean).map(Number);
    if (provided.some((value) => !Number.isFinite(value) || value <= 0)) {
      setError("Any operating rhythm you provide must be a valid number greater than zero.");
      return;
    }
    setError("");
    onContinue({
      tradingDaysPerMonth: rhythm.tradingDaysPerMonth,
      openingHoursPerDay: rhythm.openingHoursPerDay,
      capacityUnits: rhythm.capacityUnits,
      capacityUnitLabel: capacityLabel.trim() || null,
    });
  };

  return (
    <StepShell stepLabel="The survival number" index={index} total={total} onBack={onBack}>
      <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-6">The survival number</p>
      <h2 className="text-2xl md:text-3xl font-light text-[#1a1816] mb-2">How many transactions does the business need?</h2>
      <p className="text-sm text-[#1a1816]/50 mb-8">Core item or transaction: {transactionLabel || "Not specified"}</p>

      <div className="border border-[#1a1816]/10 bg-[#faf8f6] px-6 py-6 mb-10" aria-live="polite">
        {survival.requiredPerMonthRounded === null ? (
          <p className="text-base text-[#6b1f1f] leading-relaxed">
            Money remaining per transaction is zero or negative — no transaction volume, however large, can
            cover this monthly cost. Consider going back to adjust price or direct costs.
          </p>
        ) : (
          <>
            <p className="text-sm text-[#1a1816]/60 mb-1">Your survival number</p>
            <p className="text-3xl md:text-4xl font-light text-[#1a1816]">
              {formatCount(survival.requiredPerMonthRounded)} <span className="text-lg text-[#1a1816]/50">transactions / month</span>
            </p>
            <p className="text-xs text-[#1a1816]/45 mt-2">
              {formatCurrency(monthlyOperatingCost, currency)} ÷ {formatCurrency(moneyRemainingPerTransaction, currency)} per transaction
            </p>
          </>
        )}
      </div>

      <p className="text-sm text-[#1a1816]/60 mb-6">Tell us the rhythm of the business to translate this into daily terms.</p>

      <div className="space-y-6">
        <div>
          <label htmlFor="np-tradingDays" className="block text-sm text-[#1a1816]/70 mb-2">
            Trading or working days per month
          </label>
          <input id="np-tradingDays" type="number" inputMode="numeric" min={0} value={tradingDays} onChange={(e) => setTradingDays(e.target.value)} className={inputClass} placeholder="e.g. 25" />
        </div>
        <div>
          <label htmlFor="np-openingHours" className="block text-sm text-[#1a1816]/70 mb-2">
            Opening hours per day <span className="text-[#1a1816]/40">(if relevant)</span>
          </label>
          <input id="np-openingHours" type="number" inputMode="numeric" min={0} value={openingHours} onChange={(e) => setOpeningHours(e.target.value)} className={inputClass} placeholder="e.g. 11" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="np-capacityUnits" className="block text-sm text-[#1a1816]/70 mb-2">
              Number of capacity units <span className="text-[#1a1816]/40">(if relevant)</span>
            </label>
            <input id="np-capacityUnits" type="number" inputMode="numeric" min={0} value={capacityUnits} onChange={(e) => setCapacityUnits(e.target.value)} className={inputClass} placeholder="e.g. 3" />
          </div>
          <div>
            <label htmlFor="np-capacityLabel" className="block text-sm text-[#1a1816]/70 mb-2">
              What are they called?
            </label>
            <input id="np-capacityLabel" value={capacityLabel} onChange={(e) => setCapacityLabel(e.target.value)} className={inputClass} placeholder="locations, consultants, seats…" />
          </div>
        </div>
      </div>

      {survival.requiredPerMonthRounded !== null && (observable.perTradingDay !== null || observable.perOpeningHour !== null || observable.perCapacityUnit !== null) && (
        <div className="mt-8 border-t border-[#1a1816]/10 pt-6 grid grid-cols-2 sm:grid-cols-3 gap-6" aria-live="polite">
          {observable.perTradingDay !== null && (
            <div>
              <p className="text-2xl font-light text-[#1a1816]">{formatCount(observable.perTradingDay)}</p>
              <p className="text-xs text-[#1a1816]/50">per trading day</p>
            </div>
          )}
          {observable.perOpeningHour !== null && (
            <div>
              <p className="text-2xl font-light text-[#1a1816]">{formatCount(observable.perOpeningHour)}</p>
              <p className="text-xs text-[#1a1816]/50">per opening hour</p>
            </div>
          )}
          {observable.perCapacityUnit !== null && (
            <div>
              <p className="text-2xl font-light text-[#1a1816]">{formatCount(observable.perCapacityUnit)}</p>
              <p className="text-xs text-[#1a1816]/50">per {capacityLabel.trim() || "capacity unit"} / day</p>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-[#6b1f1f] mt-6" role="alert">{error}</p>}

      <button onClick={handleContinue} className="mt-10 text-sm font-semibold tracking-widest uppercase text-white bg-[#6b1f1f] px-8 py-4 transition-all hover:bg-[#6b1f1f]/90">
        Continue →
      </button>
    </StepShell>
  );
}
