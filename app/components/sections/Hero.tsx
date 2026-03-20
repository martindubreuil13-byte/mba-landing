"use client";

import { Button } from "@/app/components/ui/Button";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#020617] flex items-center pt-24 pb-20 lg:pt-28 lg:pb-24">

      {/* RIGHT IMAGE */}
      <div className="absolute inset-y-0 right-0 w-[48%] min-w-[380px] hidden lg:block">
        <div
          className="h-full w-full bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/martin-profile.jpg')",
            filter: "grayscale(20%) contrast(110%) brightness(80%)",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-[#020617]/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/50 via-transparent to-[#020617]/10" />
      </div>

      {/* CONTENT */}
      <div className="relative z-10 w-full px-6 md:px-12 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center">

          {/* LEFT */}
          <div className="lg:col-span-7 flex flex-col justify-center">

            <p className="text-xs tracking-[0.25em] uppercase text-white/40 mb-6">
              Most founders don’t fail because of bad ideas.
            </p>

            <h1 className="text-[2.4rem] sm:text-5xl md:text-6xl xl:text-[5rem] font-semibold leading-[1.05] tracking-[-0.04em]">
              You don’t need another idea.
              <span className="block mt-4 bg-gradient-to-r from-cyan-200 via-sky-100 to-white bg-clip-text text-transparent">
                You need something that actually works.
              </span>
            </h1>

            <p className="max-w-[560px] text-white/70 text-base md:text-lg leading-8 mt-8">
              Most people don’t fail because they lack intelligence or ambition.
              They fail because what they build isn’t structured to hold.
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

          </div>

          {/* RIGHT SPACER */}
          <div className="lg:col-span-5" />
        </div>
      </div>
    </section>
  );
}