import { expect, it } from "vitest";
import { contactProfile } from "./profile";
import { marketingEligibility } from "./eligibility";

it("trims names, normalizes email, and rejects an invalid address", () => {
  expect(contactProfile.parse({ first_name: " Ada ", last_name: " Lovelace ", email: " ADA@example.com " }))
    .toEqual({ first_name: "Ada", last_name: "Lovelace", email: "ada@example.com" });
  expect(contactProfile.safeParse({ first_name: "", last_name: "", email: "a@b.com,c@d.com" }).success).toBe(false);
});

it("does not transfer marketing permission to a corrected address", () => {
  const optIn = "2026-11-13T12:00:00Z";
  const lead = { ongoing_content_opt_in: true, ongoing_content_opt_in_at: optIn, ongoing_content_opt_out_at: null, suppressed_at: null, contact_email_changed_at: "2026-11-14T12:00:00Z" };
  const evidence = { action: "opt_in", created_at: optIn, wording_text: "Subscribe", wording_version: "1" };
  expect(marketingEligibility(lead, [evidence]).state).toBe("Unknown");
});
