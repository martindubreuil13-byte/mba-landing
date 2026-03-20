"use client";

const audience = [
  {
    title: "You’ve been sitting on an idea",
    desc: "And you know it’s time to build it.",
  },
  {
    title: "You lack structure",
    desc: "Not ideas, but something that actually holds.",
  },
  {
    title: "You’re done restarting",
    desc: "You want traction, not another reset.",
  },
];

const notAudience = [
  {
    title: "You want quick wins",
    desc: "Not the reality of building a business.",
  },
  {
    title: "You prefer consuming",
    desc: "More than actually building.",
  },
  {
    title: "You avoid commitment",
    desc: "Time, focus, and execution.",
  },
];

export function WhoThisIsFor() {
  return (
    <section className="relative w-full overflow-hidden bg-[#020617] text-white">

      {/* SUBTLE GLOW */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-100px] left-1/3 h-[220px] w-[220px] bg-cyan-500/5 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full px-6 md:px-12 lg:px-16 py-16 md:py-20">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">

          {/* LEFT */}
          <div className="lg:col-span-7 max-w-[640px] space-y-6">

            <p className="text-xs uppercase tracking-[0.28em] text-white/40">
              Read this carefully
            </p>

            <h2 className="text-3xl md:text-5xl font-semibold leading-[1.05] tracking-[-0.04em]">
              If you’re not serious about building a business, this isn’t for you.
            </h2>

            <p className="text-base md:text-lg leading-7 text-white/70 max-w-[520px]">
              Most people don’t fail because they can’t build a business.
              They fail because they never commit to building one properly.
            </p>

            <p className="text-lg md:text-xl font-medium leading-relaxed text-white/90 max-w-[520px]">
              This only works if you’re ready to stop circling.
            </p>

            <p className="text-lg md:text-xl font-medium leading-relaxed text-white/90 max-w-[520px]">
              And actually build something real that holds.
            </p>

          </div>

          {/* RIGHT — PERFECTLY BALANCED BLOCK */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-6 h-full">

            {/* FOR YOU */}
            <div className="flex flex-col h-full">
              <p className="mb-4 text-xs uppercase tracking-[0.24em] text-cyan-400">
                This is for you if
              </p>

              <div className="flex flex-col justify-between h-full gap-4">
                {audience.map((item) => (
                  <div
                    key={item.title}
                    className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] p-5 flex flex-col justify-center"
                  >
                    <p className="text-sm font-medium text-white/90">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-white/50">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* NOT FOR YOU */}
            <div className="flex flex-col h-full">
              <p className="mb-4 text-xs uppercase tracking-[0.24em] text-cyan-400">
                This will frustrate you if
              </p>

              <div className="flex flex-col justify-between h-full gap-4">
                {notAudience.map((item) => (
                  <div
                    key={item.title}
                    className="flex-1 rounded-xl border border-white/10 bg-white/[0.02] p-5 flex flex-col justify-center"
                  >
                    <p className="text-sm font-medium text-white/80">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-white/50">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}