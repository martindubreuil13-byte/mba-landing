"use client";

import { useState } from "react";

import { Navbar } from "./components/ui/Navbar";
import { ContactModal } from "./components/ui/ContactModal";

import { Hero } from "./components/sections/Hero";
import { ProblemSection } from "./components/sections/ProblemSection";
import { WhoThisIsFor } from "./components/sections/WhoThisIsFor";
import { FrameworkSection } from "./components/sections/FrameworkSection";
// ❌ Removed DifferentiationSection import
import { OfferSection } from "./components/sections/OfferSection";
import { FinalCta } from "./components/sections/FinalCta";

export default function Home() {
  const [isContactOpen, setIsContactOpen] = useState(false);

  return (
    <>
      <Navbar onContactClick={() => setIsContactOpen(true)} />

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

        {/* ❌ DIFFERENTIATION REMOVED */}

        {/* OFFER */}
        <section className="w-full">
          <OfferSection onContactClick={() => setIsContactOpen(true)} />
        </section>

        {/* FINAL CTA */}
        <section className="w-full">
          <FinalCta onContactClick={() => setIsContactOpen(true)} />
        </section>

      </main>

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />

      <footer className="border-t border-white/10 py-8 text-center text-xs uppercase tracking-[0.14em] text-white/40">
        © {new Date().getFullYear()} Modern Business Architect
      </footer>
    </>
  );
}