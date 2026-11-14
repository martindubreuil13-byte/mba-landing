import { expect, it } from "vitest";
import { marketingEligibility } from "./eligibility";

const stamp = "2026-11-14T00:00:00Z";
const lead = { ongoing_content_opt_in: true, ongoing_content_opt_in_at: stamp, ongoing_content_opt_out_at: null, suppressed_at: null };
const evidence = { action: "opt_in", created_at: stamp, wording_version: "v1", wording_text: "Send me updates" };

it("requires matching affirmative evidence and rejects incomplete or conflicting consent", () => {
  expect(marketingEligibility(lead, [evidence]).state).toBe("Eligible");
  expect(marketingEligibility(lead, []).state).toBe("Unknown");
  expect(marketingEligibility(lead, [{...evidence, wording_text: ""}]).state).toBe("Unknown");
  expect(marketingEligibility({ ...lead, ongoing_content_opt_in: false }, [evidence]).state).toBe("Unknown");
  expect(marketingEligibility({ ...lead, ongoing_content_opt_in: false }, []).state).toBe("Not eligible");
  expect(marketingEligibility({ ...lead, suppressed_at: stamp }, [evidence]).reason).toBe("Suppressed");
  expect(marketingEligibility({ ...lead, ongoing_content_opt_out_at: stamp }, [evidence]).state).toBe("Unknown");
});
