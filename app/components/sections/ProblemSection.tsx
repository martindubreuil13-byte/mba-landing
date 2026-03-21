"use client";

const problemCards = [
  "You stay busy—but nothing actually locks in.",
  "You revisit the same idea—but never commit.",
  "You start, stop, rethink—and reset again.",
  "Time moves. Effort compounds. Results don’t.",
];

export function ProblemSection() {
  return (
    <section className="relative w-full overflow-hidden bg-[#020617] text-white">

      {/* SUBTLE BACKGROUND */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[#020617]" />
        <div className="absolute right-[-120px] top-[-120px] h-[320px] w-[320px] rounded-full bg-cyan-500/8 blur-[100px]" />
      </div>

      {/* CONTENT */}
      <div className="relative z-10 w-full px-6 md:px-12 lg:px-16 py-14 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">

          {/* LEFT SIDE */}
          <div className="lg:col-span-7 max-w-[640px]">

            <p className="text-[11px] uppercase tracking-[0.28em] text-white/35">
              The real cost
            </p>

            <h2 className="mt-4 text-3xl md:text-5xl font-semibold leading-[1.05] tracking-[-0.04em]">
              The cost of staying here
            </h2>

            <p className="mt-6 text-base md:text-lg leading-7 text-white/65 max-w-[520px]">
              Nothing breaks overnight. That’s what makes it dangerous.
              The drift is quiet. The loss is gradual.
            </p>

            <div className="mt-10">
              <p className="text-lg font-medium text-white/90">
                At some point, the cost isn’t failure.
              </p>
              <p className="mt-2 text-base text-white/50">
                It’s staying in the same place.
              </p>
            </div>

          </div>

          {/* RIGHT SIDE — EDITORIAL STACK (NO GRID) */}
          <div className="lg:col-span-5 flex flex-col gap-4">

            {problemCards.map((card, index) => (
              <div
                key={card}
                className={`
                  rounded-xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-md min-h-[110px]
                  transition hover:bg-white/[0.04]
                  ${index === 1 ? "ml-3" : ""}
                  ${index === 2 ? "ml-1" : ""}
                `}
              >
                <div className="mb-3 h-[1px] w-8 bg-cyan-300/60" />
                <p className="text-sm md:text-base leading-6 text-white/85">
                  {card}
                </p>
              </div>
            ))}

          </div>

        </div>
      </div>
    </section>
  );
}