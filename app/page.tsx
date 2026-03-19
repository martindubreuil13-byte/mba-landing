"use client";

import { DifferentiationSection } from "./components/sections/DifferentiationSection";
import { FinalCta } from "./components/sections/FinalCta";
import { FrameworkSection } from "./components/sections/FrameworkSection";
import { Hero } from "./components/sections/Hero";
import { OfferSection } from "./components/sections/OfferSection";
import { ProblemSection } from "./components/sections/ProblemSection";
import { ReflectionSection } from "./components/sections/ReflectionSection";
import { WhoThisIsFor } from "./components/sections/WhoThisIsFor";
import { ContactModal } from "./components/ui/ContactModal";
import { Navbar } from "./components/ui/Navbar";
import { useState } from "react";

export default function Home() {
  const [isContactOpen, setIsContactOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(81,163,255,0.18),transparent_55%),radial-gradient(circle_at_20%_80%,rgba(30,255,188,0.14),transparent_52%),#05060e] text-white">
      <Navbar onContactClick={() => setIsContactOpen(true)} />
      <Hero />
      <WhoThisIsFor />
      <ProblemSection />
      <ReflectionSection />
      <FrameworkSection />
      <DifferentiationSection />
      <OfferSection />
      <FinalCta onContactClick={() => setIsContactOpen(true)} />

      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />

      <footer className="border-t border-white/10 py-10 text-center text-xs text-white/55">
        © {new Date().getFullYear()} Modern Business Architect — Built with clarity.
      </footer>
    </main>
  );
}
