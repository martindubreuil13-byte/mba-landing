"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function Footer() {
  const pathname = usePathname();

  // Don't render footer on homepage
  if (pathname === "/") {
    return null;
  }

  return (
    <footer className="w-full bg-[#f5f1ed] text-[#1a1816]">
      <div className="px-6 md:px-12 lg:px-16 py-6 md:py-5">
        <div className="max-w-6xl mx-auto">
          {/* Desktop layout */}
          <div className="hidden md:flex flex-wrap items-center gap-3 text-xs text-[#1a1816]/60">
            <Link href="/answers" className="hover:text-[#1a1816] transition-colors">
              Q&A
            </Link>
            <span>·</span>
            <Link href="/work-with-me" className="hover:text-[#1a1816] transition-colors">
              Ways to Work Together
            </Link>
            <span>·</span>
            <a
              href="https://www.linkedin.com/in/martin-dubreuil-ba643724/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#1a1816] transition-colors"
            >
              LinkedIn
            </a>
            <span>·</span>
            <a
              href="https://dubreuil.substack.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#1a1816] transition-colors"
            >
              Substack
            </a>
            <span>·</span>
            <Link href="/martin" className="hover:text-[#1a1816] transition-colors">
              Martin
            </Link>
            <span>·</span>
            <Link href="/lets-talk" className="hover:text-[#1a1816] transition-colors">
              Let&apos;s Talk
            </Link>
            <span className="ml-auto text-[#1a1816]/40">© 2026</span>
          </div>

          {/* Mobile layout */}
          <div className="md:hidden space-y-4">
            <div className="flex flex-wrap gap-3 text-xs text-[#1a1816]/60">
              <Link href="/answers" className="hover:text-[#1a1816] transition-colors">
                Q&A
              </Link>
              <span>·</span>
              <a
                href="https://www.linkedin.com/in/martin-dubreuil-ba643724/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#1a1816] transition-colors"
              >
                LinkedIn
              </a>
              <span>·</span>
              <a
                href="https://dubreuil.substack.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#1a1816] transition-colors"
              >
                Substack
              </a>
              <span>·</span>
              <Link href="/martin" className="hover:text-[#1a1816] transition-colors">
                Martin
              </Link>
              <span>·</span>
              <Link href="/lets-talk" className="hover:text-[#1a1816] transition-colors">
                Let&apos;s Talk
              </Link>
            </div>

            <div className="flex items-center justify-between text-xs">
              <Link href="/work-with-me" className="hover:text-[#1a1816] transition-colors text-[#1a1816]/60">
                Ways to Work Together
              </Link>
              <span className="text-[#1a1816]/40">© 2026</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
