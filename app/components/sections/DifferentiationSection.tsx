"use client";

import { GlassCard } from "@/app/components/ui/GlassCard";

const points = [
  {
    title: "Architecture first, not feature first",
    description:
      "If the system isn’t in place, tools are just noise. We build the structure that makes every move deliberate.",
  },
  {
    title: "Every choice is a lever",
    description:
      "We trace every decision back to a measurable outcome so you can move fast without losing direction.",
  },
  {
    title: "Built for people who actually ship",
    description:
      "You don’t need more thinking loops. You need a system that forces decisions and turns intent into momentum.",
  },
];

export function DifferentiationSection() {
  return (
    <section className="relative w-full overflow-hidden text-white">

      {/* BACKGROUND — MATCHES SITE FLOW */}
      <div className="absolute inset-0 bg-[#020617]" />

      {/* SOFTER BLUE GLOW (LESS AGGRESSIVE, MORE BLEND) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.12),transparent_60%)]" />

      {/* CONTENT */}
      <div className="relative z-10 px-6 md:px-12 lg:px-24 py-28">

        <div className="grid gap-16 lg:grid-cols-2 items-start max-w-7xl mx-auto">

          {/* LEFT */}
          <div className="space-y-6">

            <p className="text-xs uppercase tracking-[0.28em] text-white/40">
              Why this works
            </p>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.05] tracking-[-0.03em]">
              This isn’t advice.
              <br />
              It’s a system.
            </h2>

            <p className="text-lg md:text-xl leading-relaxed text-white/75 max-w-xl">
              Most approaches give you ideas, frameworks, or motivation.
              None of that compounds if it’s not connected.
            </p>

            <p className="text-lg md:text-xl font-medium leading-relaxed text-white/90 max-w-xl">
              This works because everything is built to align, reinforce, and move together.
            </p>

          </div>

          {/* RIGHT */}
          <div className="grid gap-6">

            {points.map((point, index) => (
              <GlassCard
                key={point.title}
                className="p-8 flex flex-col gap-4 bg-white/[0.06] border border-white/10"
              >
                <span className="text-xs uppercase tracking-[0.2em] text-white/40">
                  0{index + 1}
                </span>

                <h3 className="text-xl md:text-2xl font-semibold leading-snug">
                  {point.title}
                </h3>

                <p className="text-base md:text-lg leading-relaxed text-white/75">
                  {point.description}
                </p>

              </GlassCard>
            ))}

          </div>

        </div>

      </div>
    </section>
  );
}