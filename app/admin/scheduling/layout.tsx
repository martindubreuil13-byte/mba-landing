import type { Metadata } from "next";
import AdminShell from "@/app/components/admin/AdminShell";
import { REAL_ADMIN } from "@/app/components/admin/scheduling/admin-base";
import SchedulingFrame from "@/app/components/admin/scheduling/SchedulingFrame";
import { requireSchedulingOperations } from "@/app/lib/scheduling/release-gates";
import { requireAdmin } from "@/app/lib/supabase/admin-session";

export const metadata: Metadata = { title: "Scheduling", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function SchedulingLayout({ children }: { children: React.ReactNode }) {
  requireSchedulingOperations();
  await requireAdmin();
  return <AdminShell><SchedulingFrame base={REAL_ADMIN}>{children}</SchedulingFrame></AdminShell>;
}
