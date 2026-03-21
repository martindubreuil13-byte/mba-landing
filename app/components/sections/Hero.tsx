"use client";

import { Button } from "@/app/components/ui/Button";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#020617] flex items-center pt-12 pb-12 lg:pt-24 lg:pb-24">

      {/* RIGHT IMAGE (DESKTOP ONLY - unchanged) */}
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

            {/* HEADLINE */}
            <h1 className="text-[2.2rem] sm:text-5xl md:text-6xl xl:text-[5rem] font-semibold leading-[1.08] tracking-[-0.04em]">

              <span className="block text-white/85">
                You don’t need another idea.
              </span>

              <span className="block mt-5 text-white">
                <span className="bg-gradient-to-r from-cyan-200 via-sky-100 to-white bg-clip-text text-transparent">
                  You need something
                </span>{" "}
                that actually works.
              </span>

            </h1>

            <p className="max-w-[560px] text-white/70 text-base md:text-lg leading-8 mt-8">
              Most people don’t fail because they lack intelligence or ambition.
              They fail because what they build isn’t structured to hold.
              So they start, stop, rethink—and stay in the same place.
            </p>

            {/* 🔥 PREMIUM CTA */}
            <div className="flex flex-col sm:flex-row items-start gap-4 mt-10">

              {/* PRIMARY CTA */}
              <a
                href="/qualify"
                className="px-5 py-2.5 rounded-md text-sm text-white border border-cyan-400/40 bg-cyan-400/10 backdrop-blur-sm hover:bg-cyan-400/20 transition"
              >
                Work With Me
              </a>

              {/* SECONDARY CTA */}
              <a
                href="#framework"
                className="text-sm text-white/60 hover:text-white transition underline-offset-4 hover:underline"
              >
                See the structure →
              </a>

            </div>

            {/* 🔥 MOBILE SIGNATURE BLOCK */}
            <div className="lg:hidden mt-14">

              {/* IMAGE */}
              <div className="relative w-full h-[260px] overflow-hidden rounded-xl">
                <img
                  src="/images/martin-profile.jpg"
                  alt="Martin Dubreuil"
                  className="absolute inset-0 w-full h-full object-cover object-[65%_center]"
                  style={{
                    filter: "grayscale(30%) contrast(110%) brightness(75%)",
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-black" />
              </div>

              {/* TEXT BLOCK */}
              <div className="mt-6 max-w-[90%] backdrop-blur-sm bg-white/[0.02] border border-white/5 rounded-xl p-5">

                <h2 className="text-white/90 text-2xl leading-tight font-serif">
                  An idea is not a business.
                  <br />
                  It becomes one when it’s{" "}
                  <span className="text-[#9BDCF2]">
                    structured to work
                  </span>.
                  <br />
                  <span className="text-white/80">
                    That’s what I design.
                  </span>
                </h2>

                <p className="mt-5 text-white/50 text-xs tracking-[0.12em] uppercase">
                  Martin Dubreuil
                </p>
              </div>

              {/* 🔥 PREMIUM AUTHORITY STRIP */}
              <div className="mt-6 flex flex-wrap items-center gap-5 text-[11px] tracking-[0.2em] uppercase text-white/60">

                <div className="flex items-center gap-2">
                  <span className="w-[1.5px] h-4 bg-cyan-300/70"></span>
                  30+ Years
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-[1.5px] h-4 bg-cyan-300/70"></span>
                  10 Markets
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-[1.5px] h-4 bg-cyan-300/70"></span>
                  Startups → Complex
                </div>

              </div>

            </div>
            {/* END MOBILE BLOCK */}

          </div>

          {/* RIGHT SPACER */}
          <div className="lg:col-span-5" />
        </div>
      </div>
    </section>
  );
}