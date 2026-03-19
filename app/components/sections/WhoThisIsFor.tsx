import { GlassCard } from "@/app/components/ui/GlassCard";
import { SectionHeading } from "@/app/components/ui/SectionHeading";

const profiles = [
  {
    title: "You’re stuck shipping features and not progress",
    description:
      "You feel busy, but nothing changes. The work is real, the outcomes are not. You need a map that turns activity into acceleration.",
  },
  {
    title: "You’ve lost runway to misaligned work",
    description:
      "Teams pull in different directions, deadlines slide, and momentum dies. You need a shared language and clear decision points.",
  },
  {
    title: "You know you could move faster if the path was clear",
    description:
      "You’re tired of guessing what matters. You need a repeatable system that makes trade-offs obvious and progress inevitable.",
  },
];

export function WhoThisIsFor() {
  return (
    <section className="relative px-6 py-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <SectionHeading
          label="Who this is for"
          title="Not for everyone. For people who mean it."
          description="If you’re ready to stop making the same mistakes and start building with leverage, this is for you."
        />

        <div className="grid gap-6 md:grid-cols-3">
          {profiles.map((profile, index) => (
            <GlassCard
              key={profile.title}
              className={
                "p-6 " +
                (index === 0
                  ? "animate-fadeUp-delay-1"
                  : index === 1
                  ? "animate-fadeUp-delay-2"
                  : "animate-fadeUp-delay-3")
              }
            >
              <h3 className="text-lg font-semibold text-white">{profile.title}</h3>
              <p className="mt-3 text-sm text-white/70">{profile.description}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
