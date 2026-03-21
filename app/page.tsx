"use client";

import { Navbar } from "./components/ui/Navbar";
import Reveal from "./components/Reveal";

import { Hero } from "./components/sections/Hero";
import Proof from "./components/Proof";
import { ProblemSection } from "./components/sections/ProblemSection";
import { WhoThisIsFor } from "./components/sections/WhoThisIsFor";
import { FrameworkSection } from "./components/sections/FrameworkSection";
import { OfferSection } from "./components/sections/OfferSection";
import { FinalCta } from "./components/sections/FinalCta";

export default function Home() {
  return (
    <>
      {/* NAVBAR */}
      <Navbar />

      {/* MAIN CONTENT */}
      <main className="w-full overflow-x-hidden bg-[#020617] pt-20">

        {/* HERO (no animation — instant impact) */}
        <section className="w-full">
          <Hero />
        </section>

        {/* PROOF (first reveal — builds trust) */}
        <section className="w-full">
          <Reveal>
            <Proof />
          </Reveal>
        </section>

        {/* PROBLEM */}
        <section className="w-full">
          <Reveal>
            <ProblemSection />
          </Reveal>
        </section>

        {/* WHO THIS IS FOR */}
        <section className="w-full">
          <Reveal>
            <WhoThisIsFor />
          </Reveal>
        </section>

        {/* FRAMEWORK (important — keep reveal) */}
        <section className="w-full">
          <Reveal>
            <FrameworkSection />
          </Reveal>
        </section>

        {/* OFFER (decision moment) */}
        <section className="w-full">
          <Reveal>
            <OfferSection />
          </Reveal>
        </section>

        {/* FINAL CTA (strong finish) */}
        <section className="w-full">
          <Reveal>
            <FinalCta />
          </Reveal>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-8 text-center text-xs uppercase tracking-[0.14em] text-white/40">
        © {new Date().getFullYear()} Modern Business Architect
      </footer>
    </>
  );
}