import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import { listPublicationsAdmin } from "@/app/lib/publications/queries";
import AdminShell from "@/app/components/admin/AdminShell";
import AdminPublicationsList from "@/app/components/admin/publications/AdminPublicationsList";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPublicationsPage() {
  await requireAdmin();
  const publications = await listPublicationsAdmin();

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-light">Publications</h1>
        <Link
          href="/admin/publications/new"
          className="text-sm font-semibold tracking-widest uppercase text-white bg-[#6b1f1f] px-5 py-3 hover:bg-[#6b1f1f]/90"
        >
          Add publication
        </Link>
      </div>
      <AdminPublicationsList initial={publications} />
    </AdminShell>
  );
}
