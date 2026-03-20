"use client";

const audience = [
  "You’ve already tried figuring it out alone—and it’s not compounding.",
  "You don’t lack ideas. You lack something that actually holds.",
  "You’re done restarting every few months.",
  "You’re willing to think deeper—not just move faster.",
];

const notAudience = [
  "You’re looking for shortcuts or quick wins.",
  "You want motivation without structure.",
  "You prefer consuming over building.",
  "You’re not ready to question how you think.",
];

export function WhoThisIsFor() {
  return (
    <section className="relative w-full overflow-hidden text-white">

      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#020617] to-black" />

      {/* Glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-120px] left-1/3 h-[320px] w-[320px] bg-cyan-500/10 blur-[120px]" />
        <div className="absolute bottom-[-140px] right-1/4 h-[300px] w-[300px] bg-blue-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 px-6 py-24 md:px-12 lg:px-20">

        {/* GRID */}
        <div className="mx-auto grid max-w-[1400px] items-start gap-16 lg:grid-cols-[1.1fr_0.9fr]">

          {/* LEFT */}
          <div className="space-y-8 max-w-[720px]">

            <p className="text-xs uppercase tracking-[0.28em] text-white/40">
              Read this carefully
            </p>

            <h2 className="text-5xl md:text-6xl xl:text-[5rem] font-semibold leading-[1.02] tracking-[-0.04em]">
              This isn’t for everyone.
            </h2>

            <p className="text-lg md:text-xl leading-relaxed text-white/75 max-w-[560px]">
              Most people don’t fail because they can’t succeed.
              They fail because they stay in patterns that never lead anywhere.
              This only works if you’re ready to step out of that.
            </p>

            <p className="text-xl md:text-2xl font-medium leading-relaxed text-white/90 max-w-[560px]">
              This only works if you’re ready to stop circling—and build something that actually holds.
            </p>

          </div>

          {/* RIGHT */}
          <div className="grid gap-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* FOR YOU */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-7 backdrop-blur-xl">
                <p className="mb-6 text-xs uppercase tracking-[0.24em] text-white/60">
                  For you if
                </p>

                <div className="space-y-5">
                  {audience.map((item) => (
                    <p key={item} className="text-base md:text-lg leading-relaxed text-white/90">
                      {item}
                    </p>
                  ))}
                </div>
              </div>

              {/* NOT FOR YOU */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-7 backdrop-blur-xl">
                <p className="mb-6 text-xs uppercase tracking-[0.24em] text-white/60">
                  Not for you if
                </p>

                <div className="space-y-5">
                  {notAudience.map((item) => (
                    <p key={item} className="text-base md:text-lg leading-relaxed text-white/90">
                      {item}
                    </p>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* MOBILE */}
        <div className="mt-16 grid gap-6 lg:hidden">

          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl">
            <p className="mb-5 text-xs uppercase tracking-[0.24em] text-white/60">
              For you if
            </p>
            <div className="space-y-4">
              {audience.map((item) => (
                <p key={item} className="text-base leading-relaxed text-white/90">
                  {item}
                </p>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl">
            <p className="mb-5 text-xs uppercase tracking-[0.24em] text-white/60">
              Not for you if
            </p>
            <div className="space-y-4">
              {notAudience.map((item) => (
                <p key={item} className="text-base leading-relaxed text-white/90">
                  {item}
                </p>
              ))}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}