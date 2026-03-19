import { GlassCard } from "@/app/components/ui/GlassCard";
import { SectionHeading } from "@/app/components/ui/SectionHeading";

export function WhoThisIsFor() {
  return (
    <section className="relative px-6 py-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <SectionHeading
          label="WHO THIS IS FOR"
          title="This isn’t for everyone."
          description="It’s for people who are done circling the same ideas."
        />

        <GlassCard className="p-10">
          <div className="space-y-6">
            <p className="text-sm text-white/70">
              This is for you if:
            </p>
            <ul className="space-y-3 text-sm text-white/70">
              <li>• You’ve been thinking about a business for a while… but nothing has fully taken shape</li>
              <li>• You start, stop, rethink, and never feel confident enough to commit</li>
              <li>• You know you’re capable of more… but your direction isn’t clear</li>
              <li>• You don’t want more information — you want something that actually makes sense</li>
              <li>• You’re tired of guessing what matters and what doesn’t</li>
            </ul>
            <p className="text-sm text-white/70">
              You don’t need more ideas. You need something you can actually build on.
            </p>

            <div className="border-t border-white/10 pt-8 text-sm text-white/70">
              <p>Most people stay here for years.</p>
              <p className="mt-3">
                Not because they lack intelligence.
                <br />
                Because nothing ever becomes clear enough to move.
              </p>
              <p className="mt-3">
                If you’re looking for motivation, shortcuts, or someone to do it for you…
                <br />
                this isn’t it.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </section>
  );
}
