import { isProductionDeployment } from "@/app/lib/deployment";
import type { Metadata } from "next";
import Link from "next/link";
import { readModes } from "@/app/lib/scheduling/integrations";
import { requireSchedulingOperations } from "@/app/lib/scheduling/release-gates";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function BookLayout({ children }: { children: React.ReactNode }) {
  requireSchedulingOperations();
  // Say what is actually simulated: the banner must never claim a mock for something that is live (or the reverse).
  const m = readModes();
  const live = [m.google === "live" && "Google Calendar", m.zoom === "live" && "Zoom", m.email === "resend" && "email"].filter(Boolean) as string[];
  const simulated = [m.google !== "live" && "calendar", m.zoom !== "live" && "Zoom", m.email !== "resend" && "email"].filter(Boolean) as string[];
  const banner = live.length === 0 ? "Local prototype · simulated calendar, Zoom and email" : `Local development · live: ${live.join(", ")}${simulated.length ? ` · simulated: ${simulated.join(", ")}` : ""}`;
  return (
    <div className="min-h-screen bg-[#f5f1ed] text-[#1a1816]">
      {!isProductionDeployment() && <p role="note" className="bg-[#6b1f1f]/[.06] px-4 py-2 text-center text-[10px] uppercase tracking-[.26em] text-[#6b1f1f]/80">{banner}</p>}
      <header className="mx-auto max-w-7xl px-6 pt-9 md:px-10">
        <div className="flex items-center justify-between border-b border-[#1a1816]/[.12] pb-6">
          <Link href="/" className="text-[11px] uppercase tracking-[.34em] text-[#1a1816]/85 transition hover:text-[#6b1f1f]">The Modern Business Architect</Link>
        </div>
      </header>
      {children}
    </div>
  );
}
