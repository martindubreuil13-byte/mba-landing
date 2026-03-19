import { SectionHeading } from "@/app/components/ui/SectionHeading";

export function WhoThisIsFor() {
  return (
    <section className="relative px-6 py-24">
      <div className="mx-auto flex max-w-4xl flex-col gap-12">
        <SectionHeading
          label="WHO THIS IS FOR"
          title="This isn’t for everyone."
          description="It’s for people who are done circling the same ideas."
        />

        <div className="rounded-2xl bg-white/5 border border-white/10 p-10 md:p-12">
          <div className="space-y-8">
            <p className="text-base font-semibold text-white/90">
              This is for you if:
            </p>
            <ul className="space-y-5 text-lg text-white/80 leading-relaxed">
              <li>• You’ve been thinking about a business for a while… but nothing has fully taken shape</li>
              <li>• You start, stop, rethink, and never feel confident enough to commit</li>
              <li>• You know you’re capable of more… but your direction isn’t clear</li>
              <li>• You don’t want more information — you want something that actually makes sense</li>
              <li>• You’re tired of guessing what matters and what doesn’t</li>
            </ul>
            <p className="text-lg leading-relaxed text-white/90 font-medium">
              You don’t need more ideas. You need something you can actually build on.
            </p>

            <div className="pt-6 border-t border-white/20 space-y-6 text-lg text-white/80 leading-relaxed">
              <p>Most people stay here for years.</p>
              <p>
                Not because they lack intelligence.
                <br />
                Because nothing ever becomes clear enough to move.
              </p>
              <p>
                If you’re looking for motivation, shortcuts, or someone to do it for you…
                <br />
                this isn’t it.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
