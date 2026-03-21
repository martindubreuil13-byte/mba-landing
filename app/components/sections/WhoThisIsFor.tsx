"use client";

const patterns = [
  "You stay busy—but nothing actually locks in.",
  "You revisit the same idea—but never commit.",
  "You start, stop, rethink—and reset again.",
  "You consume more than you build.",
];

export function WhoThisIsFor() {
  return (
    <section className="relative w-full overflow-hidden bg-[#020617] text-white">

      {/* SUBTLE BACKGROUND */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-100px] left-1/3 h-[220px] w-[220px] bg-cyan-500/5 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full px-6 md:px-12 lg:px-16 pt-8 pb-14 md:pt-12 md:pb-20">

        <div className="max-w-[720px]">

          <p className="text-[11px] uppercase tracking-[0.28em] text-white/35">
            Look closely
          </p>

          <h2 className="mt-4 text-3xl md:text-5xl font-semibold leading-[1.05] tracking-[-0.04em]">
            If this feels familiar,
            <br />
            that’s the problem.
          </h2>

          <p className="mt-6 text-base md:text-lg leading-7 text-white/65 max-w-[520px]">
            Most people don’t lack ideas. They lack structure.
            So they stay in motion—without actually moving forward.
          </p>

        </div>

        {/* LIST (EDITORIAL STYLE) */}
        <div className="mt-12 flex flex-col gap-5 max-w-[640px]">

          {patterns.map((item, index) => (
<div
  key={item}
  className="flex items-start gap-4 text-white/80"
>
  
              <span className="mt-[6px] w-[6px] h-[6px] bg-cyan-300 rounded-full" />
              <p className="text-base leading-relaxed">
                {item}
              </p>
            </div>
          ))}

        </div>

        {/* CONCLUSION */}
        <div className="mt-12 max-w-[640px]">
          <p className="text-lg text-white/90">
            This doesn’t fix itself.
          </p>
          <p className="mt-2 text-white/50">
            It compounds.
          </p>
        </div>

      </div>
    </section>
  );
}