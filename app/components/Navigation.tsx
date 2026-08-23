/* eslint-disable react/no-unescaped-entities */
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  const baseClass = "text-xs tracking-wide transition";
  const activeClass = "font-semibold text-[#6b1f1f]";
  const inactiveClass = "text-[#1a1816]/50 hover:text-[#1a1816]/80";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1a1816]/8 px-6 md:px-12 lg:px-16 h-16 flex items-center justify-between bg-white/95 backdrop-blur-sm">
      <Link href="/" className="text-xs tracking-widest font-medium hover:opacity-60 transition">MBA</Link>
      <div className="flex gap-8 text-xs tracking-wide">
        <Link
          href="/"
          className={`${baseClass} ${isActive("/") ? activeClass : inactiveClass}`}
        >
          HOME
        </Link>
        <Link
          href="/work"
          className={`${baseClass} ${isActive("/work") ? activeClass : inactiveClass}`}
        >
          WORK
        </Link>
        <Link
          href="/martin"
          className={`${baseClass} ${isActive("/martin") ? activeClass : inactiveClass}`}
        >
          MARTIN
        </Link>
        <Link
          href="/cases"
          className={`${baseClass} ${isActive("/cases") ? activeClass : inactiveClass}`}
        >
          CASES
        </Link>
        <Link
          href="/thinking"
          className={`${baseClass} ${isActive("/thinking") ? activeClass : inactiveClass}`}
        >
          THINKING
        </Link>
        <Link
          href="/lets-talk"
          className={`${baseClass} ${isActive("/lets-talk") ? activeClass : inactiveClass}`}
        >
          LET'S TALK
        </Link>
      </div>
    </nav>
  );
}
