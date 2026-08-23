"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  const getCurrentSectionName = () => {
    if (pathname === "/") return "HOME";
    if (pathname.startsWith("/work")) return "WORK";
    if (pathname.startsWith("/martin")) return "MARTIN";
    if (pathname.startsWith("/cases")) return "CASES";
    if (pathname.startsWith("/thinking")) return "THINKING";
    if (pathname.startsWith("/lets-talk")) return "LET'S TALK";
    return "HOME";
  };

  const baseClass = "text-xs tracking-wide transition";
  const activeClass = "font-semibold text-[#6b1f1f]";
  const inactiveClass = "text-[#1a1816]/50 hover:text-[#1a1816]/80";

  const navLinks = [
    { href: "/", label: "HOME" },
    { href: "/work", label: "WORK" },
    { href: "/martin", label: "MARTIN" },
    { href: "/cases", label: "CASES" },
    { href: "/thinking", label: "THINKING" },
    { href: "/lets-talk", label: "LET'S TALK" },
  ];

  return (
    <>
      {/* DESKTOP NAVIGATION */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 border-b border-[#1a1816]/8 px-6 md:px-12 lg:px-16 h-16 items-center justify-between bg-white/95 backdrop-blur-sm">
        <Link href="/" className="text-xs tracking-widest font-medium hover:opacity-60 transition">MBA</Link>
        <div className="flex gap-8 text-xs tracking-wide">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${baseClass} ${isActive(link.href) ? activeClass : inactiveClass}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* MOBILE NAVIGATION */}
      <nav className="flex md:hidden fixed top-0 left-0 right-0 z-50 border-b border-[#1a1816]/8 px-6 h-16 items-center justify-between bg-white/95 backdrop-blur-sm">
        <Link href="/" className="text-xs tracking-widest font-medium hover:opacity-60 transition">MBA</Link>
        <div className="text-xs tracking-wide text-[#1a1816]/70">
          {getCurrentSectionName()}
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-xs tracking-wide text-[#1a1816] hover:text-[#6b1f1f] transition font-medium"
        >
          MENU
        </button>
      </nav>

      {/* MOBILE MENU MODAL */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-white/98 backdrop-blur-sm flex flex-col md:hidden"
          >
            {/* Menu Header */}
            <div className="h-16 border-b border-[#1a1816]/8 px-6 flex items-center justify-between">
              <div className="text-xs tracking-widest font-medium">MENU</div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs tracking-wide text-[#1a1816]/50 hover:text-[#1a1816] transition"
              >
                CLOSE
              </button>
            </div>

            {/* Menu Items */}
            <div className="flex-1 px-6 py-12 flex flex-col gap-8">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`text-lg md:text-xl font-light leading-relaxed transition ${
                      isActive(link.href)
                        ? "text-[#6b1f1f] font-semibold"
                        : "text-[#1a1816]/70 hover:text-[#1a1816]"
                    }`}
                  >
                    {link.label === "LET'S TALK" ? (
                      <span className={isActive(link.href) ? "text-[#6b1f1f]" : ""}>
                        {link.label} →
                      </span>
                    ) : (
                      link.label
                    )}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
