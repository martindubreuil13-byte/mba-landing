import AdminShell from "@/app/components/admin/AdminShell";
import EmailComposer from "@/app/components/admin/EmailComposer";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import { getServiceClient } from "@/app/lib/supabase/service";

export const metadata = { robots: { index: false, follow: false } };

export default async function EmailStudioPage() {
  await requireAdmin();
  const { count, error } = await getServiceClient().from("leads").select("id", { head: true, count: "exact" })
    .eq("ongoing_content_opt_in", true).not("ongoing_content_opt_in_at", "is", null)
    .is("ongoing_content_opt_out_at", null).is("suppressed_at", null);
  return <AdminShell>
    <h1 className="mb-5 font-serif text-4xl tracking-tight">Email Studio</h1>
    <EmailComposer audienceCount={error ? null : count} />
  </AdminShell>;
}
