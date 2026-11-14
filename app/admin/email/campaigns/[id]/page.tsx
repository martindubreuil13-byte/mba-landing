import { deliveryOutcome } from "@/app/lib/email-studio/intelligence";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdminShell from "@/app/components/admin/AdminShell";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import { isUuid } from "@/app/lib/relationships/model";
import { campaignDetails } from "@/app/lib/email-studio/campaign-history";
import { renderNewsletterEmail } from "@/app/lib/email-studio/render";

const outcomes: Record<string, string> = {
  sent: "Accepted by provider", failed: "Failed", excluded: "Excluded",
  unknown: "Unknown provider outcome", attempting: "Attempt recorded · outcome unknown",
};

export default async function CampaignDetails({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const campaign = await campaignDetails(id);
  if (!campaign) notFound();
  const { recipients, exclusions } = campaign;
  const count = (status: string) => recipients.filter(({ delivery }) => delivery?.status === status).length;
  const accepted = count("sent");
  const failed = count("failed");
  const excluded = count("excluded") + Object.values(exclusions as Record<string, number>).reduce((sum, value) => sum + value, 0);
  const outstanding = campaign.selected_count - accepted - failed - excluded;

  const eventCount = (...types: string[]) => new Set(campaign.campaign_provider_events
    .filter((event) => types.includes(event.event_type)).map((event) => event.lead_id)).size;
  const { engagement } = campaign;
  return <AdminShell>
    <main className="mx-auto grid max-w-4xl gap-5">
      <Link className="text-[#6b1f1f] underline" href="/admin/email#campaign-history">Back to campaign history</Link>
      <header>
        <h1 className="break-words font-serif text-3xl">{campaign.subject}</h1>
        <p>Send started {new Date(campaign.started_at).toLocaleString("en-GB", { timeZone: "Asia/Bangkok" })} (Bangkok)</p>
        {campaign.preview_text && <p>Preview text · {campaign.preview_text}</p>}
        {campaign.editor_operations ? <Link className="mt-2 inline-block rounded-lg bg-[#6b1f1f] px-4 py-2 text-white" href={`/admin/email?duplicate=${id}`}>Duplicate</Link> :
          <p className="mt-2 text-sm">Editable source was not saved for this campaign.</p>}
      </header>
      <section className="rounded-xl border border-[#e6dcd4] bg-[#fffcf9] p-4">
        <h2 className="font-serif text-xl">Recorded results</h2>
        <p>{campaign.selected_count} selected · {accepted} accepted by provider · {failed} failed · {excluded} excluded</p>
        <p>{outstanding} unconfirmed or unattempted. Provider acceptance does not confirm delivery.</p>
        <ul>{Object.entries(exclusions as Record<string, number>).map(([reason, number]) => <li key={reason}>{number} · {reason}</li>)}</ul>
      </section>
      <section className="rounded-xl border border-[#e6dcd4] bg-[#fffcf9] p-4">
        <h2 className="font-serif text-xl">Campaign intelligence</h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            ["Confirmed delivered", campaign.delivered || "Unconfirmed"],
            ["Provider bounced / failed", eventCount("email.bounced", "email.failed", "email.suppressed") || "None recorded"],
            ["Complaints", eventCount("email.complained") || "None recorded"],
            ["Unsubscribes", campaign.intelligence_started_at ? eventCount("unsubscribe") : "Unavailable"],
            ["Observed clicks", engagement?.clicks ?? "Unavailable"],
            ["Unique email copies clicked", engagement?.unique ?? "Unavailable"],
            ["Likely automated requests", engagement?.suspected ?? "Unavailable"],
            ["Attributed bookings", engagement?.bookings ?? "Unavailable"],
          ].map(([label, value]) => <div key={label} className="rounded-lg bg-white p-2"><dt className="text-sm">{label}</dt><dd className="font-medium">{value}</dd></div>)}
        </dl>
        <p className="mt-3 text-sm">Counts use recorded events. Observed clicks can still include automated requests. Bookings without reliable attribution are unknown.</p>
        {!!engagement?.destinations.length && <ul className="mt-3 divide-y divide-[#e6dcd4]">{engagement.destinations.map((row) =>
          <li className="break-all py-2 text-sm" key={row.destination}>{row.destination} · {row.clicks} observed · {row.unique_clicks} unique</li>)}</ul>}
      </section>
      <section className="min-w-0">
        <h2 className="mb-2 font-serif text-xl">Original email</h2>
        {campaign.body_html ? <iframe title="Original newsletter" sandbox="" className="h-[34rem] w-full rounded-xl border border-[#e6dcd4] bg-white"
          srcDoc={renderNewsletterEmail(campaign.subject, campaign.body_html, { previewText: campaign.preview_text })} /> : <p>Original email content is unavailable.</p>}
      </section>
      <section className="rounded-xl border border-[#e6dcd4] bg-[#fffcf9] p-4">
        <h2 className="font-serif text-xl">Recipient outcomes</h2>
        <ul className="divide-y divide-[#e6dcd4]">{recipients.map(({ id, email, delivery }) => <li key={id} className="grid gap-1 py-2 sm:grid-cols-2">
          <span className="break-all">{email}</span>
          <span>{outcomes[delivery?.status ?? ""] ?? "No send attempt recorded"}
          {delivery?.status === "sent" && ` · ${deliveryOutcome(campaign.campaign_provider_events.filter((event) => event.lead_id === id).map((event) => event.event_type))}`}
          {delivery?.reason && ` · ${delivery.reason}`}{delivery?.provider_block && ` · ${delivery.provider_block.replace("email.", "")}`}</span>
        </li>)}
        {campaign.unrecorded?.map((lead) => <li key={lead} className="break-all py-2">{campaign.excludedNames.get(lead) ?? "Unavailable contact"} · Excluded at review</li>)}</ul>
        {!campaign.unrecorded && excluded > count("excluded") && <p>Individual review exclusions were not saved for this campaign. Recorded reasons appear above.</p>}
      </section>
    </main>
  </AdminShell>;
}
