"use client";

import { Button } from "@/app/components/ui/Button";
import { GlassCard } from "@/app/components/ui/GlassCard";
import { SectionHeading } from "@/app/components/ui/SectionHeading";

const offers = [
  {
    name: "The Threshold",
    title: "Should you even build this?",
    price: "$399",
    cadence: "2 sessions",
    highlights: [
      "Clear yes / no decision",
      "Identify risks before you commit",
      "Find flaws in your thinking early",
      "Walk away with a concrete next step",
    ],
    cta: "Start with The Threshold",
    variant: "default",
  },
  {
    name: "The Builder",
    title: "Get momentum. Start building the right way",
    price: "$799",
    cadence: "4 weeks",
    highlights: [
      "Turn your idea into a working structure",
      "Define your first execution steps clearly",
      "Avoid early-stage chaos and wasted effort",
      "Leave with a focused action plan",
    ],
    cta: "Start Building",
    variant: "default",
  },
  {
    name: "The Architect",
    title: "Turn your idea into something real",
    price: "$1,799",
    cadence: "12 weeks",
    highlights: [
      "Build a structured, defensible model",
      "Align product, market, and execution",
      "Reduce uncertainty with clear decisions",
      "Ship with a real 90-day roadmap",
    ],
    cta: "Apply for The Architect",
    variant: "strong",
  },
];

interface Props {
  onContactClick: () => void;
}

export function OfferSection({ onContactClick }: Props) {
  return (
    <section id="offer" className="w-full px-6 md:px-12 lg:px-24 py-28">

      {/* HEADING */}
      <div className="max-w-5xl mx-auto mb-20 text-center">
        <SectionHeading
          label="Programs"
          title="Three paths. One decision."
          description="Validate your idea, start building, or structure it properly to scale."
          align="center"
        />
      </div>

      {/* OFFERS */}
      <div className="grid gap-10 lg:grid-cols-3 max-w-7xl mx-auto">

        {offers.map((offer) => (
          <GlassCard
            key={offer.name}
            variant={offer.variant as any}
            className="flex flex-col gap-8 text-left p-10 h-full"
          >

            {/* HEADER */}
            <div className="space-y-3">
              <p className="eyebrow text-sm">{offer.name}</p>
              <h3 className="text-2xl font-semibold leading-snug">
                {offer.title}
              </h3>
            </div>

            {/* PRICE */}
            <div>
              <p className="text-3xl font-semibold">{offer.price}</p>
              <p className="text-sm text-white/60 mt-1">{offer.cadence}</p>
            </div>

            {/* HIGHLIGHTS */}
            <div className="space-y-4">
              {offer.highlights.map((item) => (
                <div key={item} className="flex gap-3">
                  <span className="mt-2 h-2 w-2 rounded-full bg-cyan-300 shrink-0" />
                  <p className="text-base text-white/80 leading-relaxed">
                    {item}
                  </p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col gap-4 pt-4 mt-auto">
              <Button variant="primary" size="lg" className="w-full">
                {offer.cta}
              </Button>

              <Button
                onClick={onContactClick}
                variant="ghost"
                size="md"
                className="w-full"
              >
                Talk to Martin
              </Button>
            </div>

          </GlassCard>
        ))}

      </div>

      {/* FOOTNOTE */}
      <p className="text-base text-white/50 text-center max-w-2xl mx-auto mt-16">
        Not sure which path fits your situation? A short conversation will make the next step obvious.
      </p>

    </section>
  );
}