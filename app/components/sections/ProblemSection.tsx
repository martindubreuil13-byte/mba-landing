import { GlassCard } from "@/app/components/ui/GlassCard";
import { SectionHeading } from "@/app/components/ui/SectionHeading";

export function ProblemSection() {
  return (
    <section className="relative px-6 py-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-14">
        <SectionHeading
          label="The gap"
          title='Most "good ideas" never become reality'
          description="When the architecture is missing, teams stall, budgets bleed, and teams chase the next shiny thing. Our lens focuses on what needs to exist before the first line of code is ever written."
        />

        <div className="grid gap-6 md:grid-cols-3">
          <GlassCard className="p-6 animate-fadeUp-delay-1">
            <h3 className="text-lg font-semibold text-white">Unclear alignment</h3>
            <p className="mt-3 text-sm text-white/70">
              Teams build in silos, deadlines slip, and every meeting becomes another status update.
            </p>
          </GlassCard>

          <GlassCard className="p-6 animate-fadeUp-delay-2">
            <h3 className="text-lg font-semibold text-white">Ideas without structure</h3>
            <p className="mt-3 text-sm text-white/70">
              Great concepts crumble when there’s no model to connect value, experience, and execution.
            </p>
          </GlassCard>

          <GlassCard className="p-6 animate-fadeUp-delay-3">
            <h3 className="text-lg font-semibold text-white">Execution without confidence</h3>
            <p className="mt-3 text-sm text-white/70">
              You ship too early or too late, and the market never engages because the logic isn’t clear.
            </p>
          </GlassCard>
        </div>
      </div>
    </section>
  );
}
