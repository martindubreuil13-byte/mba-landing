"use client";

import { motion } from "framer-motion";
import { trackEvent } from "@/app/lib/analytics";
import type { ResultViewData } from "@/app/lib/assessment/present";

type Props = {
  data: ResultViewData;
  assessmentId?: string;
  paidCtaUrl?: string | null;
};

function recordCta(assessmentId: string | undefined, cta: string) {
  trackEvent("assessment_cta_clicked", { cta });
  if (!assessmentId) return;
  fetch("/api/assessment/cta", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assessmentId, cta }),
  }).catch(() => {});
}

export default function ResultView({ data, assessmentId, paidCtaUrl }: Props) {
  const text = data.generatedAssessmentText;
  const degraded = data.generationStatus !== "ok" || !text;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-2xl">
      <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-4">
        Business Idea Reality Check{data.firstName ? ` — for ${data.firstName}` : ""}
      </p>
      {data.ideaName && <h1 className="text-3xl md:text-4xl font-light text-[#1a1816] mb-2">{data.ideaName}</h1>}
      {data.ideaDescription && <p className="text-base text-[#1a1816]/60 mb-10">{data.ideaDescription}</p>}

      <div className="border-t border-b border-[#1a1816]/10 py-10 mb-10">
        <p className="text-6xl md:text-7xl font-light text-[#1a1816] leading-none">{data.overallScore}<span className="text-2xl text-[#1a1816]/40">/100</span></p>
        <p className="text-sm tracking-widest uppercase text-[#6b1f1f] font-semibold mt-3">{data.overallBand}</p>
        <p className="text-sm text-[#1a1816]/55 mt-4 leading-relaxed max-w-md">
          This score measures the maturity of the evidence behind the potential business case. It
          is not a prediction of success.
        </p>
      </div>

      {data.materialNegativeEvidence?.triggered && (
        <div className="border border-[#6b1f1f] bg-[#6b1f1f]/5 px-6 py-5 mb-10">
          <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-2">Material negative evidence</p>
          <p className="text-sm text-[#1a1816]/80 leading-relaxed">
            Something in your own answers meaningfully challenges the hypothesis — this matters
            more than the numeric score above.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 mb-12">
        {data.dimensionScores.map((d) => (
          <div key={d.key}>
            <div className="flex items-baseline justify-between mb-1">
              <p className="text-sm text-[#1a1816]/70">{d.name}</p>
              <p className="text-sm text-[#1a1816]/50">{d.percent}%</p>
            </div>
            <div className="h-1 bg-[#1a1816]/8">
              <div className="h-full bg-[#6b1f1f]" style={{ width: `${d.percent}%` }} />
            </div>
            <p className="text-xs text-[#1a1816]/45 mt-1">{d.band}</p>
          </div>
        ))}
      </div>

      <section className="mb-10">
        <h2 className="text-xs tracking-widest uppercase text-[#1a1816]/50 font-semibold mb-3">What I see</h2>
        <p className="text-base leading-relaxed text-[#1a1816]/85">
          {text?.whatISee ??
            "The written interpretation isn't available for this result, but the deterministic scores and flags above are complete and accurate."}
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xs tracking-widest uppercase text-[#1a1816]/50 font-semibold mb-3">Strongest signal</h2>
        <p className="text-base leading-relaxed text-[#1a1816]/85">
          {text?.strongestSignal ?? `${data.strongestSignal?.finding} — ${data.strongestSignal?.evidence}`}
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xs tracking-widest uppercase text-[#1a1816]/50 font-semibold mb-3">Biggest exposure</h2>
        <p className="text-base leading-relaxed text-[#1a1816]/85">
          {text?.biggestExposure ?? `${data.biggestExposure?.finding} — ${data.biggestExposure?.rationale}`}
        </p>
      </section>

      <section className="mb-14">
        <h2 className="text-xs tracking-widest uppercase text-[#1a1816]/50 font-semibold mb-3">What I would do next</h2>
        <ul className="space-y-2">
          {(text?.nextActions ?? [data.priorityInvestigation?.action ?? ""]).filter(Boolean).map((action, i) => (
            <li key={i} className="text-base leading-relaxed text-[#1a1816]/85 flex gap-3">
              <span className="text-[#6b1f1f]">—</span>
              <span>{action}</span>
            </li>
          ))}
        </ul>
      </section>

      {degraded && (
        <p className="text-xs text-[#1a1816]/40 mb-10">
          The written interpretation for this result is temporarily unavailable — the score and
          flags above come directly from the deterministic assessment engine and are unaffected.
        </p>
      )}

      <div className="border-t border-[#1a1816]/10 pt-10 flex flex-col sm:flex-row gap-4">
        <a
          href="/lets-talk"
          onClick={() => recordCta(assessmentId, "discuss_with_martin")}
          className="text-sm font-semibold tracking-widest uppercase text-white bg-[#6b1f1f] px-8 py-4 text-center transition-all hover:bg-[#6b1f1f]/90"
        >
          Discuss my results with Martin →
        </a>
        {paidCtaUrl && (
          <a
            href={paidCtaUrl}
            onClick={() => recordCta(assessmentId, "paid_assessment")}
            className="text-sm font-semibold tracking-widest uppercase text-[#1a1816] border border-[#1a1816]/20 px-8 py-4 text-center transition-all hover:border-[#1a1816]/40"
          >
            Get a Business Idea Assessment — $97
          </a>
        )}
      </div>
    </motion.div>
  );
}
