import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import { getCoverPreviewUrl, getPublicationAdmin } from "@/app/lib/publications/queries";
import { RELATED_INDEX } from "@/app/lib/publications/related-index";
import AdminShell from "@/app/components/admin/AdminShell";
import PublicationForm from "@/app/components/admin/publications/PublicationForm";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function EditPublicationPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const publication = await getPublicationAdmin(id);
  if (!publication) notFound();
  const coverPreviewUrl = await getCoverPreviewUrl(id);

  return (
    <AdminShell>
      <PublicationForm initial={publication} initialCoverPreviewUrl={coverPreviewUrl} relatedOptions={[...RELATED_INDEX]} />
    </AdminShell>
  );
}
