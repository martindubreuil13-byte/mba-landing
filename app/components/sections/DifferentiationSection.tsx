import { GlassCard } from "@/app/components/ui/GlassCard";
import { SectionHeading } from "@/app/components/ui/SectionHeading";

const points = [
  {
    title: "Systems first, not tools first",
    description:
      "We start with the architecture that makes tools and teams work, not the other way around. This avoids bloated stacks and aimless roadmaps.",
  },
  {
    title: "Business logic meets product design",
    description:
      "Every decision is traced back to customer value, revenue levers, and what your market actually understands.",
  },
  {
    title: "Built for leaders who ship",
    description:
      "Our templates and routines make execution predictable, so you can scale without losing control.",
  },
];

export function DifferentiationSection() {
  return (
    <section className="relative px-6 py-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-14">
        <SectionHeading
          label="Why this works"
          title="Differentiation that scales across teams"
          description="We unify strategy, product, and operations in a single language so you can move faster and stay aligned.
          "
        />

        <div className="grid gap-6 md:grid-cols-3">
          {points.map((point, index) => (
            <GlassCard key={point.title} className={"p-6 " + (index === 0 ? "animate-fadeUp-delay-1" : index === 1 ? "animate-fadeUp-delay-2" : "animate-fadeUp-delay-3")}>
              <h3 className="text-lg font-semibold text-white">{point.title}</h3>
              <p className="mt-3 text-sm text-white/70">{point.description}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
