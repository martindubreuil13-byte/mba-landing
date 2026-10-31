import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import { getPublicationPreview } from "@/app/lib/publications/queries";
import { publishBlockers, publishWarnings, readinessSubjectFromAdmin } from "@/app/lib/publications/validation";
import AdminShell from "@/app/components/admin/AdminShell";
import PublicationDetail from "@/app/components/publications/PublicationDetail";
import PublicationCatalogue from "@/app/components/publications/PublicationCatalogue";
import FeaturedPublication from "@/app/components/publications/FeaturedPublication";

export const metadata: Metadata = { robots: { index: false, follow: false }, title: "Preview" };
export const dynamic = "force-dynamic";

/**
 * Authenticated preview of the SAVED content, built from the same components as the public site. It is never
 * cached or indexed; the cover comes from the private bucket through a short-lived signed URL.
 */
export default async function PublicationPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const preview = await getPublicationPreview(id);
  if (!preview) notFound();
  const { publication, admin } = preview;

  const subject = readinessSubjectFromAdmin(admin);
  const blockers = Object.values(publishBlockers(subject));
  const warnings = publishWarnings(subject);
  const savedAt = new Date(admin.updatedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

  return (
    <AdminShell>
      <div className="mb-8 border border-[#6b1f1f]/30 bg-white p-5 text-sm">
        <p className="font-semibold text-[#6b1f1f]">Preview of saved content</p>
        <p className="mt-2 text-[#1a1816]/75">
          This shows what was last <strong>saved</strong> (revision {admin.revision}, {savedAt}). Edits you have typed but not saved are not
          included. The cover is loaded from a private link that expires in a few minutes, so reload the page if it disappears.
        </p>
        <p className="mt-2 text-[#1a1816]/75">
          Status: <strong>{admin.published ? "Published (live)" : "Draft (not visible to the public)"}</strong>
          {admin.featured ? ", featured on the homepage" : ""}.
        </p>
        {blockers.length > 0 ? (
          <ul className="mt-3 list-disc pl-5 text-[#6b1f1f]">
            {blockers.map((b) => <li key={b}>{b}</li>)}
          </ul>
        ) : null}
        {warnings.length > 0 ? (
          <ul className="mt-3 list-disc pl-5 text-[#1a1816]/70">
            {warnings.map((w) => <li key={w}>{w}</li>)}
          </ul>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-5 text-xs uppercase tracking-widest">
          <Link href={`/admin/publications/${admin.id}/edit`} className="font-semibold text-[#6b1f1f] underline underline-offset-4">Back to editing</Link>
          <Link href="/admin/publications" className="text-[#1a1816]/60 hover:text-[#1a1816]">All publications</Link>
        </div>
      </div>

      <div className="-mx-6 md:-mx-12 bg-[#f5f1ed]">
        <p className="px-6 pt-6 text-xs font-semibold uppercase tracking-widest text-[#1a1816]/45 md:px-12">Publication page</p>
        <PublicationDetail publication={publication} />

        <div className="border-t border-[#1a1816]/15 px-6 pb-16 pt-10 md:px-12 lg:px-16">
          <p className="mb-8 text-xs font-semibold uppercase tracking-widest text-[#1a1816]/45">In the catalogue</p>
          <div className="mx-auto max-w-6xl">
            <PublicationCatalogue publications={[publication]} />
          </div>
        </div>

        <div className="border-t border-[#1a1816]/15 pt-10">
          <p className="px-6 pb-4 text-xs font-semibold uppercase tracking-widest text-[#1a1816]/45 md:px-12">
            On the homepage {admin.featured ? "" : "(shown only if this title is published and featured)"}
          </p>
          <FeaturedPublication publication={publication} />
        </div>
      </div>
    </AdminShell>
  );
}
