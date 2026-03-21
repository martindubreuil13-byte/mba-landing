"use client";

import Link from "next/link";

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#020617]/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 h-[72px] flex items-center justify-between">

        {/* LOGO */}
        <div className="text-white text-xs tracking-[0.25em] uppercase">
          Modern Business Architect
        </div>

        {/* CTA */}
        <Link href="/qualify">
          <button className="px-4 py-2 rounded-md text-sm text-white border border-cyan-400/40 bg-cyan-400/10 backdrop-blur-sm hover:bg-cyan-400/20 transition">
            See If You Qualify
          </button>
        </Link>

      </div>
    </header>
  );
}