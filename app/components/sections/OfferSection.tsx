"use client";

import Link from "next/link";
import { Button } from "@/app/components/ui/Button";
import { GlassCard } from "@/app/components/ui/GlassCard";

const offers = [
  {
    name: "The Threshold",
    title: "Make the wrong move… and you lose months",
    subtitle:
      "For when you need clarity before committing. Challenge the idea before it costs you time.",
    price: "$399",
    cadence: "2 sessions",
    highlights: [
      "Pressure-test your idea from multiple angles",
      "Identify blind spots and structural risks",
      "Understand what building actually requires",
      "Leave with a clear go / no-go decision",
    ],
  },
  {
    name: "The Builder",
    title: "Most people build… then realize it doesn’t work",
    subtitle:
      "For when you need structure before execution. Design something that actually holds.",
    price: "$799",
    cadence: "4 weeks",
    highlights: [
      "Turn your idea into a working model",
      "Define a clear and logical execution path",
      "Remove early-stage chaos and guesswork",
      "Leave with a structured action system",
    ],
  },
  {
    name: "The Architect",
    title: "If you’re serious, this is where it starts",
    subtitle:
      "For when you’re ready to build properly. Not trying—building something real.",
    price: "$1,799",
    cadence: "12 weeks",
    highlights: [
      "Design a defensible business structure",
      "Align product, market, and execution",
      "Remove decision noise and confusion",
      "Execute with a real 90-day roadmap",
    ],
    strong: true,
  },
];

export function OfferSection() {
  return (
    <section id="offer" className="w-full px-6 md:px-12 lg:px-24 pt-16 pb-20">

      {/* 🔥 HEADING (REPOSITIONED) */}
      <div className="max-w-2xl mb-16">

        <p className="text-[11px] uppercase tracking-[0.28em] text-white/35">
          Levels of support
        </p>

        <h2 className="mt-4 text-3xl md:text-5xl font-semibold leading-[1.05] tracking-[-0.04em]">
          Start at the right level.
          <br />
          Build with the right structure.
        </h2>

        <p className="mt-6 text-base md:text-lg leading-7 text-white/65 max-w-[520px]">
          Not everyone needs the same level of support.
          But everyone needs the right one.
        </p>

      </div>

      {/* 🔥 GRID */}
      <div className="grid gap-6 lg:grid-cols-3 max-w-7xl mx-auto items-stretch">

        {offers.map((offer) => (
          <GlassCard
            key={offer.name}
            className={`flex flex-col p-8 h-full ${
              offer.strong
                ? "border-cyan-400/40 bg-white/[0.05]"
                : "border-white/5 bg-white/[0.02]"
            }`}
          >

            {/* HEADER */}
            <div className="min-h-[120px] flex flex-col justify-between">

              <p className="text-[11px] tracking-[0.22em] uppercase text-cyan-300">
                {offer.name}
              </p>

              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-white leading-snug">
                  {offer.title}
                </h3>

                <p className="text-sm text-white/50 leading-relaxed">
                  {offer.subtitle}
                </p>
              </div>

            </div>

            {/* PRICE (SOFTER) */}
            <div className="mt-6">
              <p className="text-lg text-white/80">
                {offer.price} ·{" "}
                <span className="text-white/40">{offer.cadence}</span>
              </p>
            </div>

            {/* DIVIDER */}
            <div className="w-full h-px bg-white/10 my-6" />

            {/* HIGHLIGHTS */}
            <div className="space-y-4">
              {offer.highlights.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="mt-[7px] h-[5px] w-[5px] rounded-full bg-cyan-300 shrink-0" />
                  <p className="text-sm text-white/80 leading-relaxed">
                    {item}
                  </p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="pt-8 mt-auto">
              <Link href="/qualify">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                >
                  Start here
                </Button>
              </Link>
            </div>

          </GlassCard>
        ))}

      </div>

      {/* 🔥 FOOTNOTE (UPGRADED) */}
      <p className="text-sm text-white/40 text-left max-w-xl mt-16 leading-relaxed">
        The wrong level of support creates expensive delay.
        The right one makes the next move obvious.
      </p>

    </section>
  );
}