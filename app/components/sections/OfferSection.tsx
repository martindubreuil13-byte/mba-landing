"use client";

import { Button } from "@/app/components/ui/Button";
import { GlassCard } from "@/app/components/ui/GlassCard";
import { SectionHeading } from "@/app/components/ui/SectionHeading";

const offers = [
  {
    name: "The Threshold",
    title: "Make the wrong move… and you lose months",
    subtitle:
      "Most ideas don’t fail because they’re bad. They fail because no one challenged them early.",
    price: "$399",
    cadence: "2 sessions",
    highlights: [
      "Understand what entrepreneurship really demands",
      "Explore your idea from multiple angles",
      "Identify risks, gaps, and blind spots",
      "Get a clear yes / no decision",
    ],
    cta: "See how it works",
    variant: "default",
  },
  {
    name: "The Builder",
    title: "Most people build… then realize it doesn’t work",
    subtitle:
      "Structure before speed. Or pay for it later.",
    price: "$799",
    cadence: "4 weeks",
    highlights: [
      "Turn your idea into a working model",
      "Define execution steps that actually make sense",
      "Avoid early-stage chaos",
      "Leave with a clear action system",
    ],
    cta: "See how it works",
    variant: "default",
  },
  {
    name: "The Architect",
    title: "If you’re serious, this is where it starts",
    subtitle:
      "Not about trying. About building something that actually holds.",
    price: "$1,799",
    cadence: "12 weeks",
    highlights: [
      "Design a defensible business structure",
      "Align product, market, and execution",
      "Remove guesswork from decisions",
      "Ship with a real 90-day roadmap",
    ],
    cta: "See how it works",
    variant: "strong",
  },
];

interface Props {
  onContactClick: () => void;
}

export function OfferSection({ onContactClick }: Props) {
  return (
    <section id="offer" className="w-full px-6 md:px-12 lg:px-24 py-32">

      {/* HEADING — PUSHED FULL LEFT */}
      <div className="mb-24 max-w-none">
        <SectionHeading
          label="Programs"
          title="Three paths. One decision."
          description="You don’t need more information. You need the right level of decision."
          align="left"
        />
      </div>

      {/* GRID */}
      <div className="grid gap-8 lg:grid-cols-3 max-w-7xl mx-auto items-stretch">

        {offers.map((offer) => (
          <GlassCard
            key={offer.name}
            variant={offer.variant as any}
            className={`flex flex-col p-10 h-full ${
              offer.variant === "strong"
                ? "scale-[1.03] border-cyan-400/40"
                : ""
            }`}
          >

            {/* HEADER */}
            <div className="min-h-[120px] flex flex-col justify-between">
              <p className="text-xs tracking-[0.18em] uppercase text-cyan-300">
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

            {/* PRICE */}
            <div className="mt-6 min-h-[70px] flex flex-col justify-center">
              <p className="text-4xl font-semibold text-white">
                {offer.price}
              </p>
              <p className="text-sm text-white/50 mt-1">
                {offer.cadence}
              </p>
            </div>

            {/* DIVIDER */}
            <div className="w-full h-px bg-white/10 my-8" />

            {/* HIGHLIGHTS */}
            <div className="space-y-5">
              {offer.highlights.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="mt-2 h-2 w-2 rounded-full bg-cyan-300 shrink-0" />
                  <p className="text-sm text-white/80 leading-relaxed">
                    {item}
                  </p>
                </div>
              ))}
            </div>

            {/* CTA — CLEAR SEPARATION */}
            <div className="flex flex-col gap-4 pt-8 mt-auto">
              <Button variant="primary" size="lg" className="w-full">
                {offer.cta}
              </Button>

              <Button
                onClick={onContactClick}
                variant="ghost"
                size="md"
                className="w-full border border-white/20 hover:border-cyan-400/40 hover:bg-white/5"
              >
                Schedule a quick call
              </Button>
            </div>

          </GlassCard>
        ))}

      </div>

      {/* FOOTNOTE */}
      <p className="text-sm text-white/40 text-left max-w-xl mt-20 leading-relaxed">
        If you're hesitating, you're probably trying to solve the wrong level of problem.
        Pick a path, and it becomes obvious very quickly.
      </p>

    </section>
  );
}