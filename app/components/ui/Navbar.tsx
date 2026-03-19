"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/Button";

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

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.isModal) {
      onContactClick();
    }
    setIsOpen(false);
  };

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#" className="text-xl font-semibold text-white">
          The Modern Business Architect
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNavClick(item)}
              className="text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              {item.label}
            </button>
          ))}
          <Button href="#offer" variant="primary" size="sm">
            Get Started
          </Button>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden"
          aria-label="Toggle menu"
        >
          <svg
            className="h-6 w-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-white/10 bg-black/95 backdrop-blur-md md:hidden">
          <div className="flex flex-col gap-4 px-6 py-4">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNavClick(item)}
                className="text-sm font-medium text-white/70 transition-colors hover:text-white"
              >
                {item.label}
              </button>
            ))}
            <Button href="#offer" variant="primary" size="sm" className="w-full">
              Get Started
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
