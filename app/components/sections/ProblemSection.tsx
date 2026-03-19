import { GlassCard } from "@/app/components/ui/GlassCard";
import { SectionHeading } from "@/app/components/ui/SectionHeading";
import { Icon } from "@/app/components/ui/Icon";
import { AlertTriangle, Puzzle, Target } from "lucide-react";

export function ProblemSection() {
  return (
    <section className="relative px-6 py-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-14">
        <SectionHeading
          label="The cost of inaction"
          title="Good ideas die in the gap"
          description="Without a clear architecture, every week becomes an expensive experiment. Teams drift, decisions stall, and the runway burns while the product stays unfinished."
        />

        <div className="grid gap-6 md:grid-cols-3">
          <GlassCard className="p-6 animate-fadeUp-delay-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-red-400/20 to-orange-400/20 p-2">
                <Icon icon={AlertTriangle} className="h-5 w-5 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Teams rowing different directions</h3>
            </div>
            <p className="text-sm text-white/70">
              Every misaligned sprint wastes weeks. You’re paying for coordination, not progress.
            </p>
          </GlassCard>

          <GlassCard className="p-6 animate-fadeUp-delay-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-400/20 to-red-400/20 p-2">
                <Icon icon={Puzzle} className="h-5 w-5 text-yellow-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">You’re building the wrong thing</h3>
            </div>
            <p className="text-sm text-white/70">
              If the model isn’t clear, every decision is a guess and every launch is a bet you can’t afford to lose.
            </p>
          </GlassCard>

          <GlassCard className="p-6 animate-fadeUp-delay-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-orange-400/20 to-red-400/20 p-2">
                <Icon icon={Target} className="h-5 w-5 text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">You keep rerunning the same experiments</h3>
            </div>
            <p className="text-sm text-white/70">
              Without a clear architecture, every iteration feels like a roll of the dice—until the runway runs out.
            </p>
          </GlassCard>
        </div>
      </div>
    </section>
  );
}
