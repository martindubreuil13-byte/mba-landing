"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import PickMyBrain from "@/app/components/PickMyBrain";
import ConsentPreferencesLink from "@/app/components/ConsentPreferencesLink";

export default function Footer() {
  const pathname = usePathname();

  // The homepage is a single full-screen composition with no site footer. It still gets a slim legal strip so the privacy notice and
  // "Analytics preferences" are reachable from every public page, before and after a visitor has made a choice.
  if (pathname === "/") {
    return (
      // The hero above is `sticky` and stays pinned over the viewport for the whole page, so the strip must paint above it (z-20) or it is unreachable.
      <footer className="relative z-20 w-full bg-[#f5f1ed] px-6 py-6 text-xs text-[#1a1816]/65 md:px-12 lg:px-16">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2">
          <span>© 2026</span>
          <Link href="/privacy" className="underline underline-offset-2 hover:text-[#1a1816] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b1f1f]">
            Privacy
          </Link>
          <ConsentPreferencesLink />
        </div>
      </footer>
    );
  }

  return (
    <>
    <PickMyBrain />
    <footer className="w-full bg-[#f5f1ed] text-[#1a1816]">
      <div className="px-6 md:px-12 lg:px-16 py-6 md:py-5">
        <div className="max-w-6xl mx-auto">
          {/* Desktop layout */}
          <div className="hidden md:flex flex-wrap items-center gap-3 text-xs text-[#1a1816]/75">
            <Link href="/answers" className="hover:text-[#1a1816] transition-colors">
              Answers
            </Link>
            <span>·</span>
            <Link href="/resources" className="hover:text-[#1a1816] transition-colors">
              Free Resources
            </Link>
            <span>·</span>
            <Link href="/work" className="hover:text-[#1a1816] transition-colors">
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
            <span className="ml-auto flex items-center gap-4 text-[#1a1816]/65">
              <ConsentPreferencesLink />
              <span>© 2026</span>
            </span>
          </div>

          {/* Mobile layout */}
          <div className="md:hidden space-y-6">
            <nav className="space-y-4 text-xs text-[#1a1816]/75">
              <Link href="/answers" className="block hover:text-[#1a1816] transition-colors">
                Answers
              </Link>
              <Link href="/resources" className="block hover:text-[#1a1816] transition-colors">
                Free Resources
              </Link>
              <Link href="/work" className="block hover:text-[#1a1816] transition-colors">
                Ways to Work Together
              </Link>
              <a
                href="https://www.linkedin.com/in/martin-dubreuil-ba643724/"
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:text-[#1a1816] transition-colors"
              >
                LinkedIn
              </a>
              <a
                href="https://dubreuil.substack.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:text-[#1a1816] transition-colors"
              >
                Substack
              </a>
              <Link href="/martin" className="block hover:text-[#1a1816] transition-colors">
                Martin
              </Link>
              <Link href="/lets-talk" className="block hover:text-[#1a1816] transition-colors">
                Let&apos;s Talk
              </Link>
            </nav>

            <div className="pt-6 border-t border-[#1a1816]/8">
              <span className="text-xs text-[#1a1816]/65">© 2026</span>
              <ConsentPreferencesLink className="ml-4 text-xs text-[#1a1816]/65" />
            </div>
          </div>
        </div>
      </div>
    </footer>
    </>
  );
}
