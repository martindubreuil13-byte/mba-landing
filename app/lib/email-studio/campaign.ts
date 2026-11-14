import { z } from "zod";

export const campaignLimit = 25;
export const exceptionEvidence = z.strictObject({
  basis: z.enum(["express_permission", "documented_applicable_basis"]),
  reason: z.string().trim().min(10).max(500),
  evidence: z.string().trim().min(15).max(1000),
});
export type ExceptionEvidence = z.infer<typeof exceptionEvidence>;
export type ExceptionReview = ExceptionEvidence & { id: string; email: string };
export type CampaignRecipient = { id: string; email: string; exception?: ExceptionEvidence & { adminId: string; reviewedAt: string } };
type Candidate = CampaignRecipient & { state: string; reason: string };

export function reviewRecipients(ids: string[], contacts: Candidate[], reviews: ExceptionReview[] = [], audit?: { adminId: string; reviewedAt: string }) {
  const byId = new Map(contacts.map((contact) => [contact.id, contact]));
  const recipients: CampaignRecipient[] = [];
  const reasons = new Map<string, number>();
  const seen = new Set<string>();
  function exclude(reason: string) {
    reasons.set(reason, (reasons.get(reason) ?? 0) + 1);
  }
  const byReview = new Map(reviews.map((review) => [review.id, review]));
  // Prefer verified subscriptions if two records share an address.
  const uniqueIds = [...new Set(ids)].sort((a, b) =>
    Number(byId.get(b)?.state === "Eligible") - Number(byId.get(a)?.state === "Eligible"));
  for (const id of uniqueIds) {
    const contact = byId.get(id);
    if (!contact) { exclude("Archived or unavailable"); continue; }
    const email = contact.email.trim().toLowerCase();
    const review = byReview.get(id);
    const exception = audit && contact.state === "Unknown" && review?.email === email
      ? { basis: review.basis, reason: review.reason, evidence: review.evidence, ...audit } : undefined;
    if (contact.state !== "Eligible" && !exception) { exclude(contact.reason); continue; }
    if (!z.email().safeParse(email).success) { exclude("Invalid email address"); continue; }
    if (seen.has(email)) { exclude("Duplicate email address"); continue; }
    seen.add(email);
    recipients.push(exception ? { id, email, exception } : { id, email });
  }
  return { recipients, exclusions: Object.fromEntries(reasons) };
}

export function revalidateRecipient(recipient: CampaignRecipient, contacts: Candidate[]) {
  const contact = contacts.find(({ id }) => id === recipient.id);
  if (!contact) return "Archived or unavailable since review";
  if (contact.email.trim().toLowerCase() !== recipient.email) return "Address changed since review";
  return contact.state === "Eligible" || (recipient.exception && contact.state === "Unknown") ? null : contact.reason;
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
