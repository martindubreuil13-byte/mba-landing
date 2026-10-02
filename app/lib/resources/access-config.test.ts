import { describe, expect, it } from "vitest";
import { getConsentCopy } from "./consent-copy";
import { getResourceConfig, listResourceConfigs } from "./config";
import { CONSENT_COPY } from "./consent-copy";

describe("every configured resource defines both layers", () => {
  for (const config of listResourceConfigs()) {
    describe(config.slug, () => {
      const a = config.access;
      it("has a public layer and a described member benefit", () => {
        expect(a.publicLayer.summary.length).toBeGreaterThan(10);
        expect(a.memberBenefit.summary.length).toBeGreaterThan(10);
        expect(a.memberBenefit.label.length).toBeGreaterThan(2);
      });
      it("points at an existing consent wording whose form explains the member benefit before the email is entered", () => {
        const c = getConsentCopy(a.consentCopyId)!;
        expect(c).toBeTruthy();
        expect(c.heading).toBeTruthy();
        expect(c.benefitIntro).toMatch(/free to read/i);
        expect(c.benefitIntro).toMatch(/members/i);
        expect(c.disclosure).toMatch(/only when you confirm/i);
      });
      it("never promises an instant download from the form", () => {
        const c = getConsentCopy(a.consentCopyId)!;
        const everything = [c.buttonLabel, c.communityNote, c.disclosure, c.benefitIntro ?? "", a.checkInbox.body, ...Object.values(config.cta).map((x) => x.body + x.button)].join(" ");
        expect(everything).not.toMatch(/downloads? (immediately|instantly|now)|instant download|immediately download/i);
      });
      it("has confirmation email and page copy that make the confirmation POST explicit", () => {
        expect(a.confirmationEmail.button.length).toBeGreaterThan(3);
        expect(a.confirmationPage.button).toMatch(/confirm/i);
        expect(a.confirmationEmail.paragraphs.join(" ")).toMatch(/confirm/i);
      });
      it("tells active members the benefit arrives by email", () => {
        expect(a.activeMembersReceiveByEmail).toBe(true);
      });
    });
  }
  it("the Build the Bridge First pilot is configured on consent v1.2", () => {
    expect(getResourceConfig("build-the-bridge-first")!.access.consentCopyId).toBe("resource-guide-consent-v1.2");
  });
});

describe("consent versions are append-only", () => {
  it("keeps v1.0 and v1.1 exactly as published (existing records keep the wording they agreed to)", () => {
    expect(CONSENT_COPY["resource-guide-consent-v1.1"].buttonLabel).toBe("Email me the printable guide");
    expect(CONSENT_COPY["resource-guide-consent-v1.1"].communityNote).toBe("We’ll email your guide and invite you to confirm whether you’d like to join the Modern Business Architect community.");
    expect(CONSENT_COPY["resource-guide-consent-v1.0"].buttonLabel).toBe("Send me the guide + join the community");
  });
  it("v1.2 and the rejoin wording are new entries", () => {
    expect(CONSENT_COPY["resource-guide-consent-v1.2"].id).toBe("resource-guide-consent-v1.2");
    expect(CONSENT_COPY["membership-rejoin-v1.0"].id).toBe("membership-rejoin-v1.0");
  });
});
