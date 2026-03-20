"use client";

import { Navbar } from "./components/ui/Navbar";

import { Hero } from "./components/sections/Hero";
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

        {/* HERO */}
        <section className="w-full">
          <Hero />
        </section>

        {/* PROBLEM */}
        <section className="w-full">
          <ProblemSection />
        </section>

        {/* WHO THIS IS FOR */}
        <section className="w-full">
          <WhoThisIsFor />
        </section>

        {/* FRAMEWORK */}
        <section className="w-full">
          <FrameworkSection />
        </section>

        {/* OFFER */}
        <section className="w-full">
          <OfferSection />
        </section>

        {/* FINAL CTA */}
        <section className="w-full">
          <FinalCta />
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-8 text-center text-xs uppercase tracking-[0.14em] text-white/40">
        © {new Date().getFullYear()} Modern Business Architect
      </footer>
    </>
  );
}