import RelationshipForm from "./RelationshipForm";
import { saveEmailPreference } from "@/app/lib/contact-tags/preference-actions";
import { emailPreferenceHistory, recipientCandidates } from "@/app/lib/contact-tags/data";
import { preferenceLabel } from "@/app/lib/contact-tags/preferences";

const field = "w-full rounded-lg border border-[#daccc1] bg-white px-3 py-2";
const labels = { subscribe: "Record offline opt-in", unsubscribe: "Mark unsubscribed", exception: "Document exception", remove: "Remove exception" };

export default async function EmailPreferences({ id, email, archived }: { id: string; email: string; archived: boolean }) {
  const data = await Promise.all([recipientCandidates([id]), emailPreferenceHistory(id)]).catch(() => null);
  const candidate = data?.[0][0];
  const history = data?.[1];
  const status = candidate && preferenceLabel(candidate.state, candidate.reason);
  const entries = [...(history?.audit ?? []).map((row) => ({
    id: row.id, date: row.created_at, label: labels[row.action as keyof typeof labels],
    note: [row.details.source, row.details.receivedAt, row.details.reason, row.details.basis, row.details.evidence, row.details.expiresAt, row.email, "Admin " + row.admin_id].filter(Boolean).join(" · "),
  })), ...(history?.evidence ?? []).filter((row) => !["admin_offline", "admin_manual"].includes(row.source_type)).map((row) => ({
    id: row.id, date: row.created_at, label: ({ opt_in: "Opt-in", opt_out: "Opt-out" } as Record<string, string>)[row.action] ?? "Opt-in requested", note: row.source_type || row.method,
  }))].sort((a, b) => b.date.localeCompare(a.date));
  const operations = (status === "Unknown" ? ["subscribe", "exception", "unsubscribe"] : status === "Subscribed" ? ["unsubscribe"] : []) as (keyof typeof labels)[];
  if (candidate?.administrativeException) operations.push("remove");
  return <section className="mb-5 rounded-2xl border border-[#e6dcd4] bg-[#fffcf9] p-5 shadow-sm">
    <h2 className="font-serif text-xl">Email Preferences</h2>
    <p className="mt-2 font-medium text-[#6b1f1f]">{archived ? "Archived · excluded from campaigns" : status ?? "Status unavailable"}</p>
    {candidate && <p className="text-sm">{candidate.reason}</p>}
    {entries[0] && <p className="mt-1 text-sm">Latest record · {entries[0].label} · {entries[0].date.slice(0, 10)} · {entries[0].note.split(" · ")[0]}</p>}
    {candidate?.administrativeException && <p className="mt-2 text-sm">Administrative exception expires {candidate.administrativeException.expiresAt.slice(0, 10)} UTC. Campaign review is still required.</p>}
    {!archived && operations.map((operation) => <details key={operation} className="mt-3">
      <summary className="cursor-pointer text-sm text-[#6b1f1f]">{labels[operation]}</summary>
      <RelationshipForm action={saveEmailPreference} success="Email preference saved." className="mt-2 grid max-w-xl gap-2 text-sm">
        <input type="hidden" name="lead" value={id} /><input type="hidden" name="email" value={email} /><input type="hidden" name="operation" value={operation} />
        {operation === "subscribe" ? <>
          <label>Source<input name="source" required maxLength={300} className={field} /></label>
          <label>Date consent was received<input type="date" name="receivedAt" required className={field} /></label>
          <label>Actual permission wording<textarea name="evidence" required maxLength={1000} className={field} /></label>
        </> : <label>Reason<input name="reason" required maxLength={500} className={field} /></label>}
        {operation === "exception" && <>
          <label>Basis<select name="basis" required className={field}><option value="">Choose a basis</option><option value="express_permission">Documented express permission</option><option value="documented_applicable_basis">Other documented applicable basis</option></select></label>
          <label>Evidence and reference<textarea name="evidence" required maxLength={1000} className={field} /></label>
          <label>Expires at start of date (UTC)<input name="expiresAt" type="date" required className={field} /></label>
        </>}
        <button className="w-fit rounded-lg bg-[#6b1f1f] px-4 py-2 text-white">Save</button>
      </RelationshipForm>
    </details>)}
    <details className="mt-3"><summary className="cursor-pointer text-sm text-[#6b1f1f]">Preference history</summary>
      {entries.length ? <ul className="mt-2 divide-y divide-[#e6dcd4] text-sm">{entries.map((entry) => <li className="break-words py-2" key={entry.id}>{entry.date.slice(0, 10)} · {entry.label} · {entry.note}</li>)}</ul> : <p className="text-sm">{history ? "No preference history recorded." : "History unavailable."}</p>}
    </details>
  </section>;
}
