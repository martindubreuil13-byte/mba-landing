"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

type NavbarProps = {
  onContactClick?: () => void;
};

export function Navbar({ onContactClick }: NavbarProps) {
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
          <a href="#" className="hover:text-white transition">
            Framework
          </a>
          <a href="#" className="hover:text-white transition">
            Program
          </a>
          <a href="#" className="hover:text-white transition">
            Contact
          </a>

          <button
            onClick={onContactClick}
            className="ml-4 px-4 py-2 rounded-full bg-white text-black text-sm font-medium hover:opacity-90 transition"
          >
            Get Started
          </button>
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
          <a href="#" onClick={() => setIsOpen(false)}>
            Framework
          </a>
          <a href="#" onClick={() => setIsOpen(false)}>
            Program
          </a>
          <a href="#" onClick={() => setIsOpen(false)}>
            Contact
          </a>

          <button
            onClick={() => {
              setIsOpen(false);
              onContactClick?.();
            }}
            className="mt-2 px-4 py-2 rounded-full bg-white text-black text-sm font-medium"
          >
            Get Started
          </button>
        </div>
      )}
    </header>
  );
}