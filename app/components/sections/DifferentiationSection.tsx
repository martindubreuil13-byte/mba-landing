"use client";

export function DifferentiationSection() {
  return (
    <section className="relative w-full bg-[#020617] text-white">

      <div className="px-6 py-16 md:px-12 lg:px-16">

        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14">

          {/* LEFT */}
          <div className="lg:col-span-6 max-w-[560px] space-y-6">

            <p className="text-xs uppercase tracking-[0.28em] text-white/40">
              Why this is different
            </p>

            <h2 className="text-3xl md:text-5xl font-semibold leading-[1.05] tracking-[-0.04em]">
              This isn’t advice.
              <br />
              It’s a system that forces progress.
            </h2>

            <p className="text-base md:text-lg text-white/70 leading-7">
              Most people stay stuck in thinking loops because nothing connects.
              This removes that.
            </p>

          </div>

          {/* RIGHT — CONTRAST LIST */}
          <div className="lg:col-span-6 space-y-6">

            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <p className="text-white/40">Most approaches</p>
              <p className="text-white/90 text-right">Give you ideas</p>
            </div>

            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <p className="text-white/40">This approach</p>
              <p className="text-white/90 text-right">Forces decisions</p>
            </div>

            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <p className="text-white/40">Most people</p>
              <p className="text-white/90 text-right">Keep restarting</p>
            </div>

            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <p className="text-white/40">With this</p>
              <p className="text-white/90 text-right">Progress compounds</p>
            </div>

            <div className="flex items-start justify-between">
              <p className="text-white/40">Without structure</p>
              <p className="text-white/90 text-right">Effort gets wasted</p>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}