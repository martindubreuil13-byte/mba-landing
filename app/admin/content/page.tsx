import AdminShell from "@/app/components/admin/AdminShell";
import WorkspaceDirectory from "@/app/components/admin/WorkspaceDirectory";
import { requireAdmin } from "@/app/lib/supabase/admin-session";

export const metadata = { robots: { index: false, follow: false } };

export default async function ContentPage() {
  await requireAdmin();
  return <AdminShell><WorkspaceDirectory title="Content" entries={[
    ["Publications", "Catalog, covers and publishing", "/admin/publications"],
    ["Guides", "Access, downloads and performance", "/admin/guides"],
    ["Resources", "Upload and manage downloadable assets", "/admin/resources"],
    ["Programs", "Corporate Transition applications and responses", "/admin/programs/corporate-transition"],
  ]} /></AdminShell>;
}
