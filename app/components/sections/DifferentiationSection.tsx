import { GlassCard } from "@/app/components/ui/GlassCard";
import { SectionHeading } from "@/app/components/ui/SectionHeading";

const points = [
  {
    title: "Architecture first, not feature first",
    description:
      "If the system isn’t in place, tools are just noise. We build the structure that makes every move deliberate.",
  },
  {
    title: "Every choice is a lever",
    description:
      "We trace every decision back to a measurable outcome so you can trade fast without losing the plot.",
  },
  {
    title: "Made for people who actually ship",
    description:
      "You don’t need more meetings. You need a plan that forces choices and makes progress inevitable.",
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
