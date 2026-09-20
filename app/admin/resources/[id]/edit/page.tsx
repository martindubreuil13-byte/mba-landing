import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import { getResourceById } from "@/app/lib/resources/queries";
import AdminShell from "@/app/components/admin/AdminShell";
import ResourceForm from "@/app/components/admin/ResourceForm";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function EditResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const resource = await getResourceById(id);
  if (!resource) notFound();

  return (
    <AdminShell>
      <h1 className="text-2xl font-light mb-8">Edit Resource</h1>
      <ResourceForm mode="edit" resource={resource} />
    </AdminShell>
  );
}
