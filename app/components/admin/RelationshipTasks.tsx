import RelationshipForm from "./RelationshipForm";
import Link from "next/link";
import { randomUUID } from "node:crypto";
import { createTask, setTaskCompletion } from "@/app/lib/relationships/actions";
import { taskDateState } from "@/app/lib/relationships/model";
import type { listTasks } from "@/app/lib/relationships/queries";

type Tasks = Awaited<ReturnType<typeof listTasks>>;

export function TaskList({ tasks, today, linkContacts = false }: { tasks: Tasks; today: string; linkContacts?: boolean }) {
  if (!tasks.length) return <p className="text-sm text-black/60">No follow-ups in this view.</p>;
  return <ul className="space-y-3">
    {tasks.map((task) => <li key={task.id} id={"task:" + task.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm">
      <div className="min-w-0">
        <p className="break-words text-sm">{task.description}</p>
        <p className="mt-1 text-xs text-black/60">{taskDateState(task.due_date, task.completed_at, today)}{task.due_date ? " · " + task.due_date : ""}</p>
        {linkContacts && <Link href={"/admin/leads/" + task.lead_id + "#task:" + task.id} className="text-xs text-[#6b1f1f] hover:underline">Open contact →</Link>}
      </div>
      <RelationshipForm action={setTaskCompletion} success={task.completed_at ? "Follow-up reopened." : "Follow-up completed."}>
        <input type="hidden" name="id" value={task.id} />
        <input type="hidden" name="lead" value={task.lead_id} />
        <button name="operation" value={task.completed_at ? "reopen" : "complete"} className="rounded-lg border border-[#6b1f1f]/20 px-3 py-2 text-sm text-[#6b1f1f] hover:bg-[#6b1f1f]/5">
          {task.completed_at ? "Reopen" : "Mark complete"}
        </button>
      </RelationshipForm>
    </li>)}
  </ul>;
}

export function FollowUpForm({ lead, inquiry }: { lead: string; inquiry?: string }) {
  return <RelationshipForm action={createTask} success="Follow-up added." reset className="mb-4 flex flex-wrap items-end gap-3 rounded-2xl border border-[#6b1f1f]/10 bg-white p-4 shadow-sm">
    <input type="hidden" name="id" value={randomUUID()} />
    <input type="hidden" name="lead" value={lead} />
    {inquiry && <input type="hidden" name="inquiry" value={inquiry} />}
    <label className="grid min-w-0 grow gap-1 text-sm">Description
      <input name="description" required maxLength={1000} className="w-full rounded-lg border border-black/20 p-2" />
    </label>
    <label className="grid gap-1 text-sm">Due date
      <input type="date" name="due" className="rounded-lg border border-black/20 p-2" />
    </label>
    <button className="rounded-lg bg-[#6b1f1f] px-4 py-2 text-sm text-white hover:bg-[#501717]">Add follow-up</button>
    {inquiry && <p className="w-full text-xs text-black/60">Linked to the selected inquiry.</p>}
  </RelationshipForm>;
}
