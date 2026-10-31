import type { Metadata } from "next";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import AdminShell from "@/app/components/admin/AdminShell";
import NewPublicationForm from "@/app/components/admin/publications/NewPublicationForm";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function NewPublicationPage() {
  await requireAdmin();
  return (
    <AdminShell>
      <h1 className="text-2xl font-light mb-2">Add publication</h1>
      <p className="mb-8 max-w-xl text-sm text-[#1a1816]/60">
        Start with a title. It is saved as a draft that nobody else can see; you add the rest, upload the cover and publish from the next screen.
      </p>
      <NewPublicationForm />
    </AdminShell>
  );
}
