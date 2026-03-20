"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/Button";
import { cn } from "@/app/lib/utils";

const navItems = [
  { label: "Framework", href: "#framework" },
  { label: "Programs", href: "#offer" },
  { label: "Contact", href: "#contact", isModal: true },
];

interface NavbarProps {
  onContactClick: () => void;
}

export function Navbar({ onContactClick }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed inset-x-0 top-0 z-50">
      <div className="site-shell pt-4">
        <div className="glass flex items-center justify-between rounded-full px-4 py-3 md:px-5">
          <a href="#" className="text-sm font-semibold tracking-[0.08em] text-white md:text-base">
            The Modern Business Architect
          </a>

          <div className="hidden items-center gap-3 md:flex">
            {navItems.map((item) =>
              item.isModal ? (
                <button
                  key={item.label}
                  onClick={() => {
                    onContactClick();
                    setIsOpen(false);
                  }}
                  className="rounded-full px-4 py-2 text-sm font-medium text-white/72 transition-colors hover:text-white"
                >
                  {item.label}
                </button>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  className="rounded-full px-4 py-2 text-sm font-medium text-white/72 transition-colors hover:text-white"
                >
                  {item.label}
                </a>
              ),
            )}
            <Button href="#offer" variant="primary" size="sm">
              Get Started
            </Button>
          </div>

          <button
            onClick={() => setIsOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white md:hidden"
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>

        <div
          className={cn(
            "glass mt-3 overflow-hidden rounded-[1.5rem] transition-[max-height,opacity] duration-200 md:hidden",
            isOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0",
          )}
        >
          <div className="flex flex-col gap-2 px-4 py-4">
            {navItems.map((item) =>
              item.isModal ? (
                <button
                  key={item.label}
                  onClick={() => {
                    onContactClick();
                    setIsOpen(false);
                  }}
                  className="rounded-2xl px-4 py-3 text-left text-sm font-medium text-white/72 transition-colors hover:bg-white/[0.04] hover:text-white"
                >
                  {item.label}
                </button>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="rounded-2xl px-4 py-3 text-sm font-medium text-white/72 transition-colors hover:bg-white/[0.04] hover:text-white"
                >
                  {item.label}
                </a>
              ),
            )}
            <Button href="#offer" variant="primary" size="sm" className="mt-2 w-full">
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
