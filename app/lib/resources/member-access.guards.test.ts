import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const read = (p: string) => readFileSync(p, "utf8");
/** Code only: comments may legitimately describe the forbidden things. */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

/** Static guards for the security properties that must never regress. */
describe("member-access security guards (static)", () => {
  const route = code("app/api/resources/member-access/route.ts");

  it("the form endpoint never returns a download URL, request id, or any state-revealing field", () => {
    const responses = route.match(/NextResponse\.json\([^;]+;/g) ?? [];
    expect(responses.length).toBeGreaterThan(3);
    for (const r of responses) {
      expect(r).not.toMatch(/downloadUrl|backupUrl|requestId|request\.id|signed|member|suppress|unsubscrib|pending|existing/i);
    }
  });
  it("the form endpoint answers success with one fixed state for every outcome", () => {
    expect(code("app/api/resources/member-access/route.ts").match(/NextResponse\.json\(\{ success: true, state: "check_inbox" \}\)/g)?.length).toBe(2); // honeypot + real
    expect(route).not.toMatch(/result\.action/); // the branch taken is never exposed
  });
  it("the compatibility wrapper delegates to the same handler (no second code path)", () => {
    expect(read("app/api/resources/printable-guide/route.ts")).toMatch(/export \{ POST \} from "\.\.\/member-access\/route"/);
  });
  it("the download route refuses locked requests of member-access resources and verifies signed tokens", () => {
    const dl = code("app/api/resources/download/route.ts");
    expect(dl).toMatch(/benefit_fulfilled_at/);
    expect(dl).toMatch(/verifyDownloadToken/);
    expect(dl).toMatch(/resourceIdFromToken/);
    expect(dl).not.toMatch(/consent|opt_in|unsubscrib|suppress/i); // unsubscribing never revokes an unlocked request
  });
  it("only the confirmation POST route unlocks the benefit (the /confirm page is read-only)", () => {
    expect(read("app/api/confirm/route.ts")).toMatch(/fulfillMemberBenefit/);
    for (const f of ["app/confirm/page.tsx", "app/lib/resources/confirmation-context.ts"]) {
      expect(read(f)).not.toMatch(/fulfillMemberBenefit|confirmOptIn|\.update\(|\.insert\(/);
    }
  });
  it("the rejoin endpoint never creates a lead and answers identically for every address", () => {
    const rejoin = code("app/api/membership/rejoin/route.ts");
    expect(rejoin.match(/NextResponse\.json\(\{ success: true, state: "check_inbox" \}\)/g)?.length).toBe(2);
    const svc = read("app/lib/resources/member-access.ts");
    const fn = svc.slice(svc.indexOf("export async function requestRejoin"));
    expect(fn).not.toMatch(/\.insert\(|findOrCreateLead/);
    expect(fn).toMatch(/!== "opted_out"/);
  });
  it("the standard-form service never changes the consent of an unsubscribed or suppressed address", () => {
    const svc = read("app/lib/resources/member-access.ts");
    const blocked = svc.slice(svc.indexOf("not acted on: unsubscribed or suppressed"), svc.indexOf("const attribution = await resolveAttribution"));
    expect(blocked).not.toMatch(/requestOptIn|\.update\(|\.insert\(|sendMembership|sendDelivery/);
  });
  it("on-screen components receive no download URL from the form", () => {
    for (const f of ["app/components/resources/guide/ResourceLeadForm.tsx", "app/components/resources/guide/ResourceDeliverySuccess.tsx", "app/components/resources/guide/PrintableGuideCTA.tsx", "app/components/resources/guide/ResourceGuideProvider.tsx"]) {
      expect(read(f), f).not.toMatch(/downloadUrl|backupUrl|window\.location\.assign/);
    }
  });
});
