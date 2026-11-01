import { schedulingIntakeEnabled } from "@/app/lib/scheduling/release-gates";
import { isProductionDeployment } from "@/app/lib/deployment";
import { AdminProvider } from "./AdminContext";
import type { AdminBase } from "./admin-base";
import SchedulingNav from "./SchedulingNav";
import { eyebrow } from "@/app/components/scheduling/ui";

/** Heading, notice and tabs around every scheduling admin screen, for both the real admin and the preview. */
export default function SchedulingFrame({ base, children }: { base: AdminBase; children: React.ReactNode }) {
  return (
    <AdminProvider base={base}>
      <p className={eyebrow}>MBA Scheduling</p>
      <h1 className="mt-3 text-4xl font-light tracking-tight md:text-5xl">Scheduling</h1>
      {base.preview
        ? <p role="note" className="mb-8 mt-4 max-w-3xl border-l-2 border-[#6b1f1f] pl-4 text-sm leading-relaxed text-[#1a1816]/65">Local preview of the admin. Development only, no sign-in, simulated data. Everything here is interactive, but nothing real is read, sent or booked.</p>
        : <p role="note" className="mb-8 mt-4 max-w-3xl text-sm leading-relaxed text-[#1a1816]/55">{isProductionDeployment() ? `Production administration · New booking intake ${schedulingIntakeEnabled() ? "open" : "closed"}. Recovery remains available.` : "Local development. The Integrations page shows the current connections."}</p>}
      <SchedulingNav />
      {children}
    </AdminProvider>
  );
}
