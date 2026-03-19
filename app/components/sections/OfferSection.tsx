"use client";

import { Button } from "@/app/components/ui/Button";
import { GlassCard } from "@/app/components/ui/GlassCard";
import { SectionHeading } from "@/app/components/ui/SectionHeading";
import { Icon } from "@/app/components/ui/Icon";
import { Compass, BarChart3, Shield, MapPin } from "lucide-react";

const thresholdHighlights = [
  {
    icon: Compass,
    label: "Walk away with a clear yes/no decision",
  },
  {
    icon: Shield,
    label: "Know what you're risking and what you're protecting",
  },
  {
    icon: BarChart3,
    label: "Spot the leaks in your logic before you ship",
  },
  {
    icon: MapPin,
    label: "Leave with a next-step plan you can actually execute",
  },
];

export function OfferSection() {
  return (
    <section id="offer" className="relative px-6 py-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-14">
        <SectionHeading
          label="Programs"
          title="There are only two real questions:"
          description="Should you build this? And if yes — how do you build it so it actually works?"
        />

        <div className="grid gap-8 lg:grid-cols-2">
          <GlassCard className="relative p-8 shadow-[0_28px_80px_-28px_rgba(0,0,0,0.6)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_32px_100px_-32px_rgba(0,0,0,0.8)] hover:shadow-cyan-400/20 hover:ring-1 hover:ring-cyan-400/30">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-cyan-200/90">
                  The Threshold
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-white">
                  Before you commit time, money, or energy…
                </h3>
                <p className="mt-4 text-base leading-relaxed text-white/80">
                  You need to know if this even makes sense. The Threshold is a decision filter.
                </p>
                <p className="mt-4 text-base leading-relaxed text-white/80">
                  Not motivation. Not coaching. Clarity.
                </p>
                <p className="mt-2 text-sm text-white/60">
                  AI assists with analysis; you still decide.
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
                  Investment
                </span>
                <span className="text-3xl font-semibold text-white">$399</span>
                <span className="text-xs text-white/50">(two 1-on-1 sessions)</span>
              </div>
            </div>

            <div className="mt-8 grid gap-4">
              {thresholdHighlights.map((item) => (
                <div key={item.label} className="flex items-start gap-4">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/80 via-sky-300/60 to-indigo-400/60 text-white shadow-[0_12px_32px_-18px_rgba(0,0,0,0.6)]">
                    <Icon icon={item.icon} className="h-5 w-5" />
                  </div>
                  <p className="text-base text-white/80">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button href="#final" variant="primary" size="lg" className="w-full">
                Lock in The Threshold
              </Button>
              <Button href="#contact" variant="secondary" size="lg" className="w-full">
                Talk to Martin
              </Button>
            </div>

            <div className="mt-8 rounded-2xl bg-white/5 p-5 text-base text-white/70">
              <p className="font-medium text-white">What this isn’t</p>
              <ul className="mt-2 space-y-2">
                <li>• Motivation or reassurance</li>
                <li>• Guarantees of success</li>
                <li>• Someone to do it for you</li>
              </ul>
            </div>
          </GlassCard>

          <GlassCard className="relative p-8 shadow-[0_28px_80px_-28px_rgba(0,0,0,0.6)] ring-1 ring-cyan-300/40 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_32px_100px_-32px_rgba(0,0,0,0.8)] hover:shadow-cyan-400/20 hover:ring-1 hover:ring-cyan-400/50">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-cyan-200/90">
                  The Architect
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-white">
                  If the direction is clear…
                </h3>
                <p className="mt-4 text-base leading-relaxed text-white/80">
                  Most ideas don't fail in execution. They fail because nothing was designed to hold.
                </p>
                <p className="mt-4 text-base leading-relaxed text-white/80">
                  The Architect turns your idea into something buildable.
                </p>
                <p className="mt-2 text-sm text-white/60">
                  AI assists with analysis; you still decide.
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
                  Investment
                </span>
                <span className="text-3xl font-semibold text-white">$1,799</span>
                <span className="text-xs text-white/50">(12-week program)</span>
              </div>
            </div>

              <div className="mt-8 grid gap-4">
                <div className="flex items-start gap-4">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/60 via-cyan-400/40 to-sky-400/40 text-white shadow-[0_12px_32px_-18px_rgba(0,0,0,0.6)]">
                    <Icon icon={Compass} className="h-5 w-5" />
                  </div>
                  <p className="text-base text-white/80">A clear, defensible model that gets everyone aligned</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/60 via-sky-400/40 to-indigo-400/40 text-white shadow-[0_12px_32px_-18px_rgba(0,0,0,0.6)]">
                    <Icon icon={BarChart3} className="h-5 w-5" />
                  </div>
                  <p className="text-base text-white/80">A justified go-to-market narrative that reduces risk</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-400/60 via-fuchsia-400/40 to-purple-400/40 text-white shadow-[0_12px_32px_-18px_rgba(0,0,0,0.6)]">
                    <Icon icon={Shield} className="h-5 w-5" />
                  </div>
                  <p className="text-base text-white/80">A playbook that turns uncertainty into predictable execution</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-400/60 via-pink-400/40 to-rose-400/40 text-white shadow-[0_12px_32px_-18px_rgba(0,0,0,0.6)]">
                    <Icon icon={MapPin} className="h-5 w-5" />
                  </div>
                  <p className="text-base text-white/80">A 90-day roadmap that actually gets shipped</p>
                </div>
              </div>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button href="#contact" variant="primary" size="lg" className="w-full">
                Apply for The Architect
              </Button>
              <Button href="#" variant="secondary" size="lg" className="w-full">
                Talk to Martin
              </Button>
            </div>

            <div className="mt-8 rounded-2xl bg-white/5 p-5 text-sm text-white/60">
              <p className="font-medium text-white">Entry condition</p>
              <ul className="mt-2 space-y-2">
                <li>• You’ve committed to building something real</li>
                <li>• You’ve defined ambition and direction</li>
                <li>• You accept the cost, effort, and uncertainty</li>
              </ul>
            </div>
          </GlassCard>
        </div>

        <p className="mx-auto max-w-2xl text-center text-sm text-white/50">
          Not sure which program is right for you? Book a quick call and we’ll help you choose the best next step.
        </p>
      </div>
    </section>
  );
}
