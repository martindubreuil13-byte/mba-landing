"use client";

import { GlassCard } from "@/app/components/ui/GlassCard";
import { SectionHeading } from "@/app/components/ui/SectionHeading";
import { Icon } from "@/app/components/ui/Icon";
import { Lightbulb, Building, Zap } from "lucide-react";

const steps = [
  {
    title: "Idea",
    description:
      "Get laser-focused on the change you want to create. Define the problem, the customer, and the value path before anything else.",
    icon: Lightbulb,
  },
  {
    title: "Architecture",
    description:
      "Design the system that turns intent into repeatable results. Align goals, roles, and opportunities into a real blueprint.",
    icon: Building,
    highlight: true,
  },
  {
    title: "Execution",
    description:
      "Operationalize with clear checkpoints, metrics, and decisions. Growth happens when everything moves together.",
    icon: Zap,
  },
];

export function FrameworkSection() {
  return (
    <section id="framework" className="relative w-full text-white">

      {/* FULL WIDTH CONTAINER */}
      <div className="px-6 py-28 md:px-12 lg:px-20">

        {/* HEADING (LEFT ALIGNED = STRONGER) */}
        <div className="max-w-3xl mb-16">
          <SectionHeading
            label="Framework"
            title="Idea → Architecture → Execution"
            description="A system designed to turn ambition into structure—and structure into momentum."
            align="left"
          />
        </div>

        {/* FLOW GRID */}
        <div className="relative grid gap-6 lg:grid-cols-3">

          {steps.map((step, index) => (
            <GlassCard
              key={step.title}
              variant="default"
              className={`relative flex flex-col gap-6 p-8 ${
                step.highlight
                  ? "scale-[1.04] border-white/20 bg-white/[0.07]"
                  : "opacity-90"
              }`}
            >

              {/* STEP NUMBER */}
              <span className="text-xs uppercase tracking-[0.2em] text-white/40">
                0{index + 1}
              </span>

              {/* ICON */}
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                <Icon icon={step.icon} className="h-6 w-6 text-white" />
              </div>

              {/* TITLE */}
              <h3 className="text-xl md:text-2xl font-semibold">
                {step.title}
              </h3>

              {/* DESCRIPTION */}
              <p className="text-base md:text-lg leading-relaxed text-white/75">
                {step.description}
              </p>

              {/* SUBTLE ARROW (FLOW INDICATOR) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute right-[-18px] top-1/2 -translate-y-1/2 text-white/20 text-2xl">
                  →
                </div>
              )}

            </GlassCard>
          ))}

        </div>

      </div>
    </section>
  );
}