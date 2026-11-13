import type { Metadata } from "next";
import { getAdminUser } from "@/app/lib/supabase/admin-session";
import { getBusinessPulse } from "@/app/lib/business-pulse/data";
import AdminShell from "@/app/components/admin/AdminShell";
import BusinessPulse from "@/app/components/admin/BusinessPulse";
import AdminLoginForm from "./AdminLoginForm";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminEntryPage() {
  const user = await getAdminUser();
  if (!user) return <AdminLoginForm />;
  const data = await getBusinessPulse().catch(() => null);
  return <AdminShell>{data ? <BusinessPulse data={data} /> :
    <section role="status" className="rounded-2xl border border-[#e6dcd4] bg-[#fffcf9] p-6">
      <h1 className="font-serif text-3xl">Business Pulse</h1>
      <p className="mt-2">Dashboard records are temporarily unavailable. Use the workspace navigation to open individual tools.</p>
    </section>}</AdminShell>;
}
