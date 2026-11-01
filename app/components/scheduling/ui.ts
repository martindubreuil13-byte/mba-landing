/**
 * Shared look for MBA Scheduling (public pages and admin). Ivory ground, ink text, oxblood used sparingly,
 * hairline rules instead of boxes, small tracked capitals for labels, light-weight display type.
 */
export const eyebrow = "text-[11px] uppercase tracking-[.3em] text-[#6b1f1f]";
export const label = "text-[11px] uppercase tracking-[.22em] text-[#1a1816]/50";
export const hair = "border-[#1a1816]/[.12]";
export const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b1f1f]";
export const btnPrimary = `inline-flex items-center justify-center gap-3 bg-[#6b1f1f] px-9 py-4 text-[11px] uppercase tracking-[.24em] text-white transition duration-200 hover:bg-[#561919] disabled:cursor-not-allowed disabled:opacity-35 ${focusRing}`;
export const btnQuiet = `inline-flex items-center justify-center gap-2 border border-[#1a1816]/25 px-6 py-3 text-[11px] uppercase tracking-[.2em] text-[#1a1816] transition duration-200 hover:border-[#6b1f1f] hover:text-[#6b1f1f] disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`;
export const btnDanger = `inline-flex items-center justify-center gap-2 border border-[#8b2525]/40 px-6 py-3 text-[11px] uppercase tracking-[.2em] text-[#8b2525] transition duration-200 hover:bg-[#8b2525] hover:text-white disabled:opacity-40 ${focusRing}`;
export const textLink = `text-[#6b1f1f] underline decoration-[#6b1f1f]/30 underline-offset-4 transition hover:decoration-[#6b1f1f] ${focusRing}`;
export const field = "w-full border-0 border-b border-[#1a1816]/25 bg-transparent px-0 py-3 text-base text-[#1a1816] placeholder:text-[#1a1816]/30 transition focus:border-[#6b1f1f] focus:outline-none focus-visible:ring-0";
