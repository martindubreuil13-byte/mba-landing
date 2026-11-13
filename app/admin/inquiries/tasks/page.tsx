import Link from "next/link";
import AdminShell from "@/app/components/admin/AdminShell";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import { businessTimeZone, listTasks } from "@/app/lib/relationships/queries";
import { workspaceToday } from "@/app/lib/relationships/model";
import { TaskList } from "@/app/components/admin/RelationshipTasks";

export const dynamic = "force-dynamic";

export default async function FollowUps({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  await requireAdmin();
  const { view } = await searchParams;
  const timeZone = await businessTimeZone();
  const today = workspaceToday(timeZone);
  const tasks = (await listTasks()).filter((task) => {
    if (view === "completed") return Boolean(task.completed_at);
    if (task.completed_at) return false;
    if (view === "overdue") return task.due_date !== null && task.due_date < today;
    if (view === "upcoming") return task.due_date !== null && task.due_date >= today;
    return true;
  });
  return <AdminShell>
    <Link href="/admin/inquiries" className="text-sm text-[#6b1f1f] hover:underline">← Inquiries &amp; applications</Link>
    <h1 className="my-6 text-4xl font-light">Follow-ups</h1>
    <nav aria-label="Follow-up filters" className="mb-6 flex flex-wrap gap-4 text-sm text-[#6b1f1f]">
      {[["open", "Open"], ["overdue", "Overdue"], ["upcoming", "Upcoming"], ["completed", "Completed"]].map(([key, label]) => (
        <Link key={key} aria-current={(view ?? "open") === key ? "page" : undefined}
          href={"/admin/inquiries/tasks?view=" + key} className="rounded-full border border-[#6b1f1f]/20 px-4 py-2 aria-[current=page]:bg-[#6b1f1f] aria-[current=page]:text-white">{label}</Link>
      ))}
    </nav>
    <p className="mb-4 text-xs text-black/65">Due dates use {timeZone}.</p>
    <TaskList tasks={tasks} today={today} linkContacts />
  </AdminShell>;
}
