import RelationshipForm from "./RelationshipForm";
import { updateContactTag } from "@/app/lib/contact-tags/actions";

export default function ContactTags({ leadId, tags, assigned }: {
  leadId: string; tags: { id: string; name: string }[]; assigned: string[];
}) {
  const field = "rounded-lg border border-[#daccc1] bg-white px-2 py-1.5";
  return <section className="mb-8 space-y-3 rounded-2xl border border-[#e6dcd4] bg-[#fffcf9] p-4 shadow-sm">
    <h2 className="font-serif text-xl">Tags</h2>
    <div className="flex flex-wrap gap-2">
      {tags.filter((tag) => assigned.includes(tag.id)).map((tag) => <RelationshipForm key={tag.id} action={updateContactTag} success="Tag removed.">
        <input type="hidden" name="lead" value={leadId} /><input type="hidden" name="tag" value={tag.id} />
        <button name="operation" value="remove" aria-label={"Remove tag " + tag.name}
          className="rounded-full bg-[#f3e7e2] px-3 py-1 text-sm text-[#6b1f1f]">{tag.name} ×</button>
      </RelationshipForm>)}
      {assigned.length === 0 && <p className="text-sm text-[#655951]">No tags assigned.</p>}
    </div>
    <div className="flex flex-wrap gap-4 text-sm">
      <RelationshipForm action={updateContactTag} success="Tag assigned." className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="lead" value={leadId} />
        <label className="grid gap-1">Existing tag<select name="tag" className={field} required defaultValue="">
          <option value="">Choose a tag</option>
          {tags.filter((tag) => !assigned.includes(tag.id)).map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
        </select></label>
        <button name="operation" value="assign" className="px-2 py-1.5 text-[#6b1f1f]">Assign</button>
      </RelationshipForm>
      <RelationshipForm action={updateContactTag} success="Tag created and assigned." reset className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="lead" value={leadId} />
        <label className="grid gap-1">New tag<input name="name" maxLength={48} required className={field} placeholder="e.g. Founder" /></label>
        <button name="operation" value="create" className="px-2 py-1.5 text-[#6b1f1f]">Create and assign</button>
      </RelationshipForm>
    </div>
  </section>;
}
