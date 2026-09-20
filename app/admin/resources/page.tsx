import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import { listAllResourcesAdmin } from "@/app/lib/resources/queries";
import AdminShell from "@/app/components/admin/AdminShell";
import AdminResourcesTable from "@/app/components/admin/AdminResourcesTable";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminResourcesPage() {
  await requireAdmin();
  const resources = await listAllResourcesAdmin();

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-light">Resources</h1>
        <Link
          href="/admin/resources/new"
          className="text-sm font-semibold tracking-widest uppercase text-white bg-[#6b1f1f] px-5 py-3 hover:bg-[#6b1f1f]/90"
        >
          Add Resource
        </Link>
      </div>
      <AdminResourcesTable resources={resources} />
    </AdminShell>
  );
}
