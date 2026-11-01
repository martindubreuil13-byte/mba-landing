import type { Metadata } from "next";
import Link from "next/link";
import { PREVIEW_ADMIN } from "@/app/components/admin/scheduling/admin-base";
import SchedulingFrame from "@/app/components/admin/scheduling/SchedulingFrame";
import { requireSchedulingPreview } from "@/app/lib/scheduling/preview";

export const metadata: Metadata = { title: "Scheduling preview", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Development-only, sign-in-free preview of the scheduling admin. Same components as /admin/scheduling, simulated data only.
 * 404 in every non-development context (see app/lib/scheduling/preview.ts). It does not use AdminShell, the admin session or Supabase.
 */
export default async function PreviewLayout({ children }: { children: React.ReactNode }) {
  await requireSchedulingPreview();
  return (
    <div className="min-h-screen bg-[#f5f1ed] text-[#1a1816]">
      <p role="note" className="bg-[#6b1f1f] px-4 py-2 text-center text-[11px] uppercase tracking-[.22em] text-white">Local development preview · no sign-in · simulated data only</p>
      <header className="flex items-center justify-between border-b border-[#1a1816]/[.12] px-6 py-5 md:px-12">
        <p className="text-xs uppercase tracking-[.3em]">The Modern Business Architect <span className="text-[#1a1816]/40">· Admin preview</span></p>
        <Link href="/book/discovery-conversation" className="text-xs uppercase tracking-[.2em] text-[#1a1816]/55 hover:text-[#6b1f1f]">View public booking page →</Link>
      </header>
      <main className="px-6 py-12 md:px-12"><SchedulingFrame base={PREVIEW_ADMIN}>{children}</SchedulingFrame></main>
    </div>
  );
}
