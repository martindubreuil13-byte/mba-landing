import AdminShell from "@/app/components/admin/AdminShell";
import WorkspaceDirectory from "@/app/components/admin/WorkspaceDirectory";
import { requireAdmin } from "@/app/lib/supabase/admin-session";

export const metadata = { robots: { index: false, follow: false } };

export default async function ToolsPage() {
  await requireAdmin();
  return <AdminShell><WorkspaceDirectory title="More tools" entries={[
    ["Website Intelligence", "Acquisition and conversion reports", "/admin/intelligence"],
    ["Pick My Brain", "Reader questions and search activity", "/admin/pick-my-brain"],
    ["Assessments", "Business Idea Reality Check submissions", "/admin/assessments"],
    ["Napkin submissions", "Worksheet and follow-up history", "/admin/napkin"],
    ["Automation exceptions", "Recorded failures and recovery", "/admin/inquiries/exceptions"],
  ]} /></AdminShell>;
}
