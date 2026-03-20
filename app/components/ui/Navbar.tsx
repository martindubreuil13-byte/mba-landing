"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#020617]/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* LOGO */}
        <div className="text-sm tracking-[0.18em] uppercase text-white font-medium">
          Modern Business Architect
        </div>

        {/* DESKTOP NAV */}
        <nav className="hidden md:flex items-center gap-8 text-sm text-white/70">

          <Link href="#framework" className="hover:text-white transition">
            Framework
          </Link>

          <Link href="#program" className="hover:text-white transition">
            Program
          </Link>

          {/* REAL CONTACT LINK */}
          <Link href="/contact" className="hover:text-white transition">
            Contact
          </Link>

          {/* MAIN CTA */}
          <Link href="/contact">
            <button className="ml-4 px-5 py-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white text-sm font-medium hover:opacity-90 transition">
              Get Started
            </button>
          </Link>
        </nav>

        {/* MOBILE MENU BUTTON */}
        <button
          className="md:hidden text-white"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* MOBILE MENU */}
      {isOpen && (
        <div className="md:hidden bg-[#020617] border-t border-white/10 px-6 py-6 flex flex-col gap-4 text-white/80">

          <Link href="#framework" onClick={() => setIsOpen(false)}>
            Framework
          </Link>

          <Link href="#program" onClick={() => setIsOpen(false)}>
            Program
          </Link>

          <Link href="/contact" onClick={() => setIsOpen(false)}>
            Contact
          </Link>

          <Link href="/contact" onClick={() => setIsOpen(false)}>
            <button className="mt-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white text-sm font-medium">
              Get Started
            </button>
          </Link>
        </div>
      )}
    </header>
  );
}