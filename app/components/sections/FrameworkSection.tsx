import { GlassCard } from "@/app/components/ui/GlassCard";
import { SectionHeading } from "@/app/components/ui/SectionHeading";

const stepData = [
  {
    title: "Idea",
    description:
      "Get laser-focused on the change you want to create. We map the problem, the customer, and the value path before anything else.",
    accent: "from-cyan-300 to-sky-300",
  },
  {
    title: "Architecture",
    description:
      "Design the system that turns intent into repeatable results. We align goals, roles, and opportunity into an execution-ready blueprint.",
    accent: "from-emerald-300 to-cyan-300",
  },
  {
    title: "Execution",
    description:
      "Operationalize the plan with clear checkpoints, metrics, and decisions. Growth happens when teams move together.",
    accent: "from-indigo-300 to-fuchsia-300",
  },
];

export function FrameworkSection() {
  return (
    <section id="framework" className="relative px-6 py-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-14">
        <SectionHeading
          label="Framework"
          title="Idea → Architecture → Execution"
          description="A three-phase system that turns messy ambition into a repeatable way to build, learn, and scale."
        />

        <div className="relative">
          {/* Timeline connector for desktop */}
          <div className="absolute top-1/2 left-1/2 hidden h-0.5 w-full max-w-4xl -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-cyan-400/50 via-emerald-400/50 to-indigo-400/50 md:block" />

          <div className="grid gap-6 md:grid-cols-3">
            {stepData.map((step, index) => (
              <GlassCard
                key={step.title}
                className={
                  "relative p-6 transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_28px_60px_-24px_rgba(0,0,0,0.6)] " +
                  (index === 0 ? "animate-fadeUp-delay-1" : index === 1 ? "animate-fadeUp-delay-2" : "animate-fadeUp-delay-3")
                }
              >
                {/* Timeline dot */}
                <div className="absolute -top-3 left-1/2 hidden h-6 w-6 -translate-x-1/2 rounded-full border-4 border-black bg-gradient-to-br from-cyan-400 to-indigo-400 md:block" />

                <div
                  className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br ${step.accent} p-3 text-black shadow-[0_15px_40px_-22px_rgba(0,0,0,0.55)]`}
                >
                  <span className="text-lg font-semibold">{step.title.charAt(0)}</span>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/70">{step.description}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
