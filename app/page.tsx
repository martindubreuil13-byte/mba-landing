"use client";

import { useState } from "react";

import { Navbar } from "./components/ui/Navbar";
import { ContactModal } from "./components/ui/ContactModal";

import { Hero } from "./components/sections/Hero";
import { ProblemSection } from "./components/sections/ProblemSection";
import { WhoThisIsFor } from "./components/sections/WhoThisIsFor";
import { FrameworkSection } from "./components/sections/FrameworkSection";
import { DifferentiationSection } from "./components/sections/DifferentiationSection";
import { OfferSection } from "./components/sections/OfferSection";
import { FinalCta } from "./components/sections/FinalCta";

export default function Home() {
  const [isContactOpen, setIsContactOpen] = useState(false);

  return (
    <>
      <Navbar onContactClick={() => setIsContactOpen(true)} />

      <main className="w-full overflow-x-hidden bg-[#020617]">

        {/* HERO */}
        <section className="w-full">
          <Hero />
        </section>

        {/* PROBLEM */}
        <section className="w-full">
          <ProblemSection />
        </section>

        {/* SOFT TRANSITION */}
        <div className="h-16 bg-gradient-to-b from-transparent to-[#020617]" />

        {/* WHO THIS IS FOR */}
        <section className="w-full">
          <WhoThisIsFor />
        </section>

        {/* FRAMEWORK */}
        <section className="w-full">
          <FrameworkSection />
        </section>

        {/* SOFT TRANSITION */}
        <div className="h-16 bg-gradient-to-b from-[#020617] to-[#020617]" />

        {/* DIFFERENTIATION */}
        <section className="w-full">
          <DifferentiationSection />
        </section>

        {/* OFFER */}
        <section className="w-full">
          <OfferSection onContactClick={() => setIsContactOpen(true)} />
        </section>

        {/* FINAL CTA */}
        <section className="w-full">
          <FinalCta onContactClick={() => setIsContactOpen(true)} />
        </section>

      </main>

      {/* CONTACT MODAL */}
      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-8 text-center text-xs uppercase tracking-[0.14em] text-white/40">
        © {new Date().getFullYear()} Modern Business Architect
      </footer>
    </>
  );
}