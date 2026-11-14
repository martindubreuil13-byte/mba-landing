import { contactTags, recipientCandidates } from "@/app/lib/contact-tags/data";
import AdminShell from "@/app/components/admin/AdminShell";
import EmailComposer from "@/app/components/admin/EmailComposer";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import { getServiceClient } from "@/app/lib/supabase/service";

export const metadata = { robots: { index: false, follow: false } };

export default async function EmailStudioPage() {
  await requireAdmin();
  const db = getServiceClient();
  const storageOrigin = new URL(db.storage.from("resource-covers").getPublicUrl("newsletter").data.publicUrl).origin;
  const [contacts, tagData] = await Promise.all([
    recipientCandidates().catch(() => null), contactTags().catch(() => null),
  ]);
  return <AdminShell>
    <h1 className="mb-5 font-serif text-4xl tracking-tight">Email Studio</h1>
    <EmailComposer storageOrigin={storageOrigin} recipients={{ contacts: contacts ?? [], tags: tagData?.tags ?? [], available: contacts !== null }} />
  </AdminShell>;
}
