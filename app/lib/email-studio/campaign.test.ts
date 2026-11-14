import { expect, it, vi } from "vitest";
import { deliverOnce, reviewRecipients, revalidateRecipient } from "./campaign";

it("normalizes and deduplicates eligible addresses and excludes unknown and archived contacts", () => {
  const eligible = { id: "a", email: " One@Example.com ", state: "Eligible", reason: "Verified" };
  const review = reviewRecipients(["a", "b", "c", "d", "a"], [
    eligible, { ...eligible, id: "b", email: "one@example.com" }, { ...eligible, id: "c", state: "Unknown", reason: "Missing proof" },
  ]);
  expect(review.recipients).toEqual([{ id: "a", email: "one@example.com" }]);
  expect(review.exclusions).toEqual({ "Duplicate email address": 1, "Missing proof": 1, "Archived or unavailable": 1 });
  expect(revalidateRecipient(review.recipients[0], [{ ...eligible, email: "new@example.com" }])).toBe("Address changed since review");
});

it("records a transport failure as unknown without retrying and continues to the next recipient", async () => {
  const finish = vi.fn();
  const send = vi.fn().mockRejectedValueOnce(new Error("network")).mockResolvedValueOnce({ status: "sent" });
  const input = { recheck: async () => null, claim: async () => {}, send, finish };
  await deliverOnce(input);
  await deliverOnce(input);
  expect(finish.mock.calls).toEqual([[{ status: "unknown" }], [{ status: "sent" }]]);
});

it("requires matching, documented evidence and refuses a newly blocked recipient", () => {
  const contact = { id: "reviewed", email: "fixture@example.com", state: "Unknown", reason: "Missing evidence" };
  const review = { id: contact.id, email: contact.email, basis: "express_permission" as const,
    reason: "Permission recorded separately", evidence: "Signed newsletter consent held in the owner archive" };
  const audit = { adminId: "owner", reviewedAt: "2026-11-14T00:00:00Z" };
  expect(reviewRecipients([contact.id], [contact]).recipients).toEqual([]);
  const included = reviewRecipients([contact.id], [contact], [review], audit).recipients;
  expect(included[0].exception).toMatchObject(audit);
  const blocked = { ...contact, state: "Not eligible", reason: "Suppressed" };
  expect(reviewRecipients([contact.id], [blocked], [review], audit).recipients).toEqual([]);
  expect(revalidateRecipient(included[0], [blocked])).toBe("Suppressed");
  expect(revalidateRecipient(included[0], [contact])).toBeNull();
  expect(reviewRecipients([contact.id], [{ ...contact, email: "changed@example.com" }], [review], audit).recipients).toEqual([]);
});
