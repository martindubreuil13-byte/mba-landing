import type { Metadata } from "next";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import AdminShell from "@/app/components/admin/AdminShell";
import ResourceForm from "@/app/components/admin/ResourceForm";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function NewResourcePage() {
  await requireAdmin();

  return (
    <AdminShell>
      <h1 className="text-2xl font-light mb-8">Add Resource</h1>
      <ResourceForm mode="create" />
    </AdminShell>
  );
}
