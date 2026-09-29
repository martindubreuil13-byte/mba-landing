"use client";

import { motion } from "framer-motion";
import { trackEvent } from "@/app/lib/analytics";
import { INTERPRETATION_LABELS, PRELIMINARY_DISCLAIMER } from "@/app/lib/napkin/config";
import { formatCount, formatCurrency } from "@/app/lib/napkin/format";
import type { NapkinCalculationResult, NapkinInputs } from "@/app/lib/napkin/types";

type Props = {
  inputs: NapkinInputs;
  result: NapkinCalculationResult;
  submissionId: string | null;
};

function recordCta(submissionId: string | null, cta: string) {
  trackEvent("napkin_cta_clicked", { cta });
  if (!submissionId) return;
  fetch("/api/napkin/cta", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ submissionId, cta }),
  }).catch(() => {});
}

function diffLabel(actual: number | null, required: number | null, unit: string): string {
  if (actual === null || required === null) return "Not enough information yet.";
  const diff = actual - required;
  if (diff === 0) return `Exactly meets the requirement.`;
  if (diff > 0) return `${formatCount(diff)} ${unit} above the requirement.`;
  return `${formatCount(Math.abs(diff))} ${unit} short of the requirement.`;
}

export default function SnapshotView({ inputs, result, submissionId }: Props) {
  const { contribution, survival, observable, interpretation } = result;
  const currency = inputs.currency;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-2xl">
      <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-4">Your Napkin Breakdown</p>
      {inputs.businessName && <h1 className="text-3xl md:text-4xl font-light text-[#1a1816] mb-2">{inputs.businessName}</h1>}
      <p className="text-base text-[#1a1816]/60 mb-10">
        Core item or transaction: {inputs.transactionSingular || "—"}
        {inputs.whatItSells ? ` — ${inputs.whatItSells}` : ""}
      </p>

      {/* THE TRANSACTION */}
      <section className="border-t border-b border-[#1a1816]/10 py-8 mb-10">
        <h2 className="text-xs tracking-widest uppercase text-[#1a1816]/50 font-semibold mb-5">One transaction</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-[#1a1816]/65">Average selling price</dt>
            <dd className="font-medium text-[#1a1816]">{formatCurrency(inputs.sellingPrice, currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[#1a1816]/65">Direct cost per transaction</dt>
            <dd className="font-medium text-[#1a1816]">{formatCurrency(contribution.totalDirectCost, currency)}</dd>
          </div>
          <div className="flex justify-between border-t border-[#1a1816]/8 pt-2 mt-2">
            <dt className="font-semibold text-[#1a1816]">Money remaining per transaction</dt>
            <dd className="text-lg font-light text-[#6b1f1f]">{formatCurrency(contribution.moneyRemainingPerTransaction, currency)}</dd>
          </div>
          {contribution.contributionPercent !== null && (
            <div className="flex justify-between">
              <dt className="text-[#1a1816]/50">Contribution</dt>
              <dd className="text-[#1a1816]/50">{contribution.contributionPercent}%</dd>
            </div>
          )}
        </dl>
      </section>

      {/* THE SURVIVAL NUMBER */}
      <section className="mb-10">
        <h2 className="text-xs tracking-widest uppercase text-[#1a1816]/50 font-semibold mb-5">Your survival number</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-[#1a1816]/65">Monthly operating cost</dt>
            <dd className="font-medium text-[#1a1816]">{formatCurrency(survival.monthlyOperatingCost, currency)}</dd>
          </div>
          <div className="flex justify-between border-t border-[#1a1816]/8 pt-2 mt-2">
            <dt className="font-semibold text-[#1a1816]">Required monthly volume</dt>
            <dd className="text-lg font-light text-[#6b1f1f]">{formatCount(survival.requiredPerMonthRounded)}</dd>
          </div>
          {observable.perTradingDay !== null && (
            <div className="flex justify-between">
              <dt className="text-[#1a1816]/50">Per trading day</dt>
              <dd className="text-[#1a1816]/50">{formatCount(observable.perTradingDay)}</dd>
            </div>
          )}
          {observable.perOpeningHour !== null && (
            <div className="flex justify-between">
              <dt className="text-[#1a1816]/50">Per opening hour</dt>
              <dd className="text-[#1a1816]/50">{formatCount(observable.perOpeningHour)}</dd>
            </div>
          )}
          {observable.perCapacityUnit !== null && (
            <div className="flex justify-between">
              <dt className="text-[#1a1816]/50">Per {inputs.capacityUnitLabel || "capacity unit"} / day</dt>
              <dd className="text-[#1a1816]/50">{formatCount(observable.perCapacityUnit)}</dd>
            </div>
          )}
        </dl>
      </section>

      {/* REALITY CHECK */}
      <section className="mb-10">
        <h2 className="text-xs tracking-widest uppercase text-[#1a1816]/50 font-semibold mb-5">Against reality</h2>
        <dl className="space-y-2 text-sm mb-4">
          <div className="flex justify-between">
            <dt className="text-[#1a1816]/65">Expected realistic volume</dt>
            <dd className="font-medium text-[#1a1816]">{formatCount(inputs.expectedMonthlyVolume)} / month</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[#1a1816]/65">Maximum delivery capacity</dt>
            <dd className="font-medium text-[#1a1816]">{formatCount(inputs.maxMonthlyCapacity)} / month</dd>
          </div>
        </dl>
        <p className="text-sm text-[#1a1816]/70 leading-relaxed">
          <strong className="text-[#1a1816]">Expected vs. required:</strong> {diffLabel(inputs.expectedMonthlyVolume, survival.requiredPerMonthRounded, "transactions")}
        </p>
        <p className="text-sm text-[#1a1816]/70 leading-relaxed mt-1">
          <strong className="text-[#1a1816]">Capacity vs. required:</strong> {diffLabel(inputs.maxMonthlyCapacity, survival.requiredPerMonthRounded, "transactions")}
        </p>
      </section>

      {/* WEAKEST ASSUMPTION */}
      <section className="mb-10">
        <h2 className="text-xs tracking-widest uppercase text-[#1a1816]/50 font-semibold mb-3">The weakest assumption</h2>
        <p className="text-base leading-relaxed text-[#1a1816]/85">{interpretation.weakestAssumption.label}</p>
      </section>

      {/* INTERPRETATION */}
      <section className="mb-10 border border-[#1a1816]/10 px-6 py-6 bg-[#faf8f6]">
        <h2 className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-2">Preliminary interpretation</h2>
        <p className="text-lg font-light text-[#1a1816] mb-3">{INTERPRETATION_LABELS[interpretation.category]}</p>
        <p className="text-sm leading-relaxed text-[#1a1816]/80">{interpretation.summary}</p>
      </section>

      <p className="text-xs text-[#1a1816]/45 leading-relaxed mb-14">{PRELIMINARY_DISCLAIMER}</p>

      {/* FINAL CTA */}
      <div className="border-t border-[#1a1816]/10 pt-10">
        <h2 className="text-2xl font-light text-[#1a1816] mb-3">The calculation is simple. The decision may not be.</h2>
        <p className="text-base leading-relaxed text-[#1a1816]/70 mb-6">
          The Napkin Principle shows what must be true for the economics to work. It does not prove that customers
          will buy, that the required volume can be reached, or that the business can deliver it sustainably. If the
          result exposed a gap — or an assumption you cannot yet defend — the next step is to examine the
          architecture of the business.
        </p>
        <a
          href="/lets-talk"
          onClick={() => recordCta(submissionId, "discuss_with_martin")}
          className="inline-block text-sm font-semibold tracking-widest uppercase text-white bg-[#6b1f1f] px-8 py-4 text-center transition-all hover:bg-[#6b1f1f]/90"
        >
          Discuss the business with Martin →
        </a>
      </div>
    </motion.div>
  );
}
