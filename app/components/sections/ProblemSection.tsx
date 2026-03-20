"use client";

const problemCards = [
  "You stay busy—but nothing actually locks in.",
  "You revisit the same idea—but never commit.",
  "You start, stop, rethink—and reset again.",
  "Time moves. Effort compounds. Results don’t.",
];

export function ProblemSection() {
  return (
    <section className="relative w-full overflow-hidden bg-black text-white">
      
      {/* Gradient bridge from previous section */}
      <div className="pointer-events-none absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-black/0 to-black" />

      {/* Background atmosphere */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-[#020617] to-black" />
        <div className="absolute -right-24 top-[-120px] h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute -left-20 bottom-[-120px] h-[360px] w-[360px] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 px-6 pt-12 pb-24 md:px-12 lg:px-20 lg:pt-16 lg:pb-28">
        <div className="mx-auto grid max-w-[1400px] items-start gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(520px,0.95fr)] lg:gap-20">
          
          {/* LEFT SIDE */}
          <div className="max-w-[760px]">
            <p className="text-xs uppercase tracking-[0.24em] text-white/38">
              The real cost
            </p>

            <h2 className="mt-5 text-4xl font-semibold leading-[1.02] tracking-[-0.04em] md:text-6xl xl:text-[5.1rem]">
              The cost of
              <br />
              staying here
            </h2>

            <p className="mt-8 max-w-[620px] text-base leading-8 text-white/68 md:text-lg">
              Nothing breaks overnight. That’s what makes it dangerous.
              The drift is quiet. The loss is gradual. And most of the time,
              it looks exactly like this:
            </p>

            <div className="mt-14 max-w-[560px]">
              <p className="text-xl font-medium text-white/92">
                At some point, the cost isn’t failure.
              </p>
              <p className="mt-2 text-base leading-7 text-white/52 md:text-lg">
                It’s staying in the same place.
              </p>
            </div>
          </div>

          {/* RIGHT SIDE — CLEAN EQUAL CARDS */}
          <div className="hidden lg:grid grid-cols-2 gap-5">
            {problemCards.map((card) => (
              <div
                key={card}
                className="min-h-[180px] rounded-2xl border border-white/12 bg-white/[0.06] p-6 backdrop-blur-xl shadow-[0_24px_60px_-36px_rgba(0,0,0,0.95)]"
              >
                <div className="mb-4 h-[2px] w-8 bg-cyan-400" />
                <p className="text-base leading-7 text-white/86">
                  {card}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* MOBILE VERSION */}
        <div className="mt-14 grid gap-4 lg:hidden">
          {problemCards.map((card) => (
            <div
              key={card}
              className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl"
            >
              <div className="mb-3 h-[2px] w-7 bg-cyan-400" />
              <p className="text-base leading-7 text-white/84">{card}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}