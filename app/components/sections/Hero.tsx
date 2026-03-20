"use client";

import { Button } from "@/app/components/ui/Button";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-black flex items-center pt-20 pb-16 lg:pt-24 lg:pb-20">

      {/* RIGHT IMAGE */}
      <div className="absolute inset-y-0 right-0 w-[48%] min-w-[380px] hidden lg:block">
        <div
          className="h-full w-full bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/martin-profile.jpg')",
            filter: "grayscale(22%) contrast(108%) brightness(82%)",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/25 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/15" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_50%,transparent_58%,black_100%)]" />
      </div>

      {/* CONTENT */}
      <div className="relative z-10 w-full px-6 md:px-12 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-10">

          {/* LEFT */}
          <div className="lg:col-span-7 flex flex-col justify-center">

            <p className="text-xs tracking-[0.25em] uppercase text-white/40 mb-6">
              Most founders don’t fail because of bad ideas.
            </p>

            <h1 className="text-[2.5rem] sm:text-5xl md:text-6xl xl:text-[5.2rem] font-semibold leading-[1.02] tracking-[-0.04em]">
              You don’t need another idea.
              <span className="block mt-4 bg-gradient-to-r from-cyan-200 via-sky-100 to-white bg-clip-text text-transparent">
                You need something that actually works.
              </span>
            </h1>

            <p className="max-w-[560px] text-white/70 text-base md:text-lg leading-8 mt-8">
              Most people don’t fail because they lack intelligence or ambition.
              They fail because nothing they build is structured to hold.
              So they start, stop, rethink—and stay in the same place.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 mt-10">
              <Button href="#offer" variant="primary" size="lg">
                Build Something That Works
              </Button>
              <Button href="#framework" variant="secondary" size="lg">
                See How It Works
              </Button>
            </div>

            {/* MOBILE INSIGHT */}
            <div className="lg:hidden mt-10 border-l border-cyan-400/40 pl-4">
              <p className="text-sm text-white/70 leading-6">
                I’ve spent decades watching the same pattern repeat: smart people, good ideas—and nothing that actually holds.
              </p>
              <p className="text-sm text-white/70 leading-6 mt-3">
                Not because they lack talent. Because what they’re building isn’t structured to work.
              </p>
              <p className="text-sm text-white/90 leading-6 mt-3 font-medium">
                I design businesses that can actually stand.
              </p>
              <div className="mt-3 flex items-center gap-3">
                <span className="text-sm font-semibold">Martin</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">
                  MBA
                </span>
              </div>
            </div>

          </div>

          {/* RIGHT SPACER */}
          <div className="lg:col-span-5" />
        </div>

        {/* DESKTOP INSIGHT */}
        <div className="hidden lg:block absolute left-[54%] bottom-[60px] max-w-[520px]">

          <div className="relative">

            {/* Accent */}
            <div className="absolute left-0 top-3 bottom-3 w-px bg-gradient-to-b from-cyan-300/90 via-sky-200/50 to-transparent" />

            {/* Box */}
            <div className="ml-4 px-6 py-3 rounded-xl bg-white/[0.035] backdrop-blur-xl shadow-[0_20px_60px_-35px_rgba(0,0,0,0.95)]">

              <p className="text-sm text-white/70 leading-6">
                I’ve spent decades watching the same pattern repeat: smart people, good ideas—and nothing that actually holds. Not because they lack talent, but because what they’re building isn’t structured to work.
              </p>

              <p className="text-sm text-white/90 leading-6 mt-3 font-medium">
                I design businesses that can actually stand.
              </p>

              <div className="mt-2 flex items-center gap-3">
                <span className="text-sm font-semibold">Martin</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">
                  MBA
                </span>
              </div>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
}