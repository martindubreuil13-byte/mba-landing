/**
 * Versioned consent wording for resource lead capture. The server resolves the
 * wording from this table by id and stores the exact text with every consent
 * record — the browser only ever sends the id, never the text.
 *
 * To change the wording (or replace the button-plus-disclosure with a checkbox):
 * add a NEW entry with a new id and point resource configs at it. Never edit a
 * published entry in place; old consent records keep the id they agreed to.
 *
 * LEGAL REVIEW REQUIRED before production launch.
 */
export type ConsentCopy = {
  id: string;
  /** How consent is captured. Stored as consent_records.method. */
  method: "button_disclosure" | "checkbox";
  buttonLabel: string;
  /** Short paragraph shown above the email field. */
  communityNote: string;
  /** Shown directly beside the form. "Privacy Policy" is rendered as a link. */
  disclosure: string;
  privacyLinkText: string;
};

export const CONSENT_COPY: Record<string, ConsentCopy> = {
  "resource-guide-consent-v1.0": {
    id: "resource-guide-consent-v1.0",
    method: "button_disclosure",
    buttonLabel: "Send me the guide + join the community",
    communityNote:
      "You will also join the Modern Business Architect community and receive occasional emails from Martin with practical ideas, new resources, updates and relevant offers.",
    disclosure:
      "By continuing, you agree to receive marketing emails from Martin Dubreuil and The Modern Business Architect. You can unsubscribe at any time and keep the guide. Read the Privacy Policy.",
    privacyLinkText: "Privacy Policy",
  },
  // v1.1: confirmed opt-in. The guide is delivered immediately; community emails
  // start only after the reader confirms their address from the email.
  "resource-guide-consent-v1.1": {
    id: "resource-guide-consent-v1.1",
    method: "button_disclosure",
    buttonLabel: "Send me the guide + join the community",
    communityNote:
      "You will also be invited to join the Modern Business Architect community: once you confirm your email address, you will receive occasional emails from Martin with practical ideas, new resources, updates and relevant offers.",
    disclosure:
      "By continuing, you agree to receive marketing emails from Martin Dubreuil and The Modern Business Architect once you confirm your email address. You can unsubscribe at any time and keep the guide. Read the Privacy Policy.",
    privacyLinkText: "Privacy Policy",
  },
};

export function getConsentCopy(id: string): ConsentCopy | null {
  return CONSENT_COPY[id] ?? null;
}

/** The exact text a visitor saw, as stored in consent_records.wording_text. */
export function consentEvidenceText(copy: ConsentCopy): string {
  return `[${copy.method}] ${copy.buttonLabel.toUpperCase()} →\n${copy.communityNote}\n${copy.disclosure}`;
}
