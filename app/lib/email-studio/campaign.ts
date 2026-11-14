import { z } from "zod";

export const campaignLimit = 25;
export type CampaignRecipient = { id: string; email: string };
type Candidate = CampaignRecipient & { state: string; reason: string };

export function reviewRecipients(ids: string[], contacts: Candidate[]) {
  const byId = new Map(contacts.map((contact) => [contact.id, contact]));
  const recipients: CampaignRecipient[] = [];
  const reasons = new Map<string, number>();
  const seen = new Set<string>();
  function exclude(reason: string) {
    reasons.set(reason, (reasons.get(reason) ?? 0) + 1);
  }
  for (const id of new Set(ids)) {
    const contact = byId.get(id);
    if (!contact) { exclude("Archived or unavailable"); continue; }
    if (contact.state !== "Eligible") { exclude(contact.reason); continue; }
    const email = contact.email.trim().toLowerCase();
    if (!z.email().safeParse(email).success) { exclude("Invalid email address"); continue; }
    if (seen.has(email)) { exclude("Duplicate email address"); continue; }
    seen.add(email);
    recipients.push({ id, email });
  }
  return { recipients, exclusions: Object.fromEntries(reasons) };
}

export function revalidateRecipient(recipient: CampaignRecipient, contacts: Candidate[]) {
  const contact = contacts.find(({ id }) => id === recipient.id);
  if (!contact) return "Archived or unavailable since review";
  if (contact.email.trim().toLowerCase() !== recipient.email) return "Address changed since review";
  return contact.state === "Eligible" ? null : contact.reason;
}

type Delivery = { status: "sent" | "failed" | "unknown"; provider_id?: string };

export async function deliverOnce(input: {
  recheck: () => Promise<string | null>;
  claim: () => Promise<void>;
  send: () => Promise<Delivery>;
  finish: (result: Delivery | {status: "excluded"; reason: string}) => Promise<void>;
}) {
  const reason = await input.recheck();
  if (reason) { await input.finish({ status: "excluded", reason }); return; }
  await input.claim();
  let outcome: Delivery;
  try { outcome = await input.send(); }
  catch { outcome = { status: "unknown" }; }
  await input.finish(outcome);
}
