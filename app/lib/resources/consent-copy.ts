/**
 * Versioned consent wording for resource lead capture. The server resolves the
 * wording from this table by id and stores the exact text with every consent
 * record — the browser only ever sends the id, never the text.
 *
 * To change the wording: add a NEW entry with a new id and point resource configs at it.
 * Never edit a published entry in place; old consent records keep the id they agreed to.
 *
 *  v1.0 / v1.1  published (the guide's PDF downloaded immediately). Kept for the history of existing records.
 *  v1.2         member-access model: the form requests free membership, the benefit unlocks on confirmation.
 *               DRAFT wording, not legally approved.
 *  membership-rejoin-v1.0  the explicit rejoin flow for unsubscribed addresses.
 */
export type ConsentCopy = {
  id: string;
  /** How consent is captured. Stored as consent_records.method. */
  method: "button_disclosure" | "checkbox";
  /** Form heading (what the visitor is unlocking). */
  heading?: string;
  /** One sentence that separates the public layer from the member benefit, shown above the field. */
  benefitIntro?: string;
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
  // v1.1: confirmed opt-in. The guide is delivered immediately; the email invites the reader to confirm, and
  // community emails start only after that explicit confirmation (the POST on the confirmation page).
  "resource-guide-consent-v1.1": {
    id: "resource-guide-consent-v1.1",
    method: "button_disclosure",
    buttonLabel: "Email me the printable guide",
    communityNote:
      "We’ll email your guide and invite you to confirm whether you’d like to join the Modern Business Architect community.",
    disclosure:
      "The confirmation invitation is optional. Marketing emails begin only if you actively confirm. You can keep the guide either way and unsubscribe at any time. Read the Privacy Policy.",
    privacyLinkText: "Privacy Policy",
  },
  // v1.2: member-access. Submitting the form is a request to become a free member; nothing is unlocked and no
  // marketing starts until the reader confirms from the email.
  "resource-guide-consent-v1.2": {
    id: "resource-guide-consent-v1.2",
    method: "button_disclosure",
    heading: "Unlock the printable guide",
    benefitIntro:
      "The guide is free to read online, and it stays that way. Free members of the Modern Business Architect community also get the printable PDF to download, print, complete and keep.",
    buttonLabel: "Email me a confirmation link",
    communityNote:
      "Enter your email and we’ll send you a link to confirm. When you confirm, you become a free member: the PDF unlocks, and you may receive occasional ideas, resources and invitations from Martin.",
    disclosure:
      "Membership is free and starts only when you confirm from the email. You can unsubscribe at any time and keep anything you have already unlocked. Read the Privacy Policy.",
    privacyLinkText: "Privacy Policy",
  },
  // Explicit rejoin for someone who previously unsubscribed. Never used by a resource form.
  "membership-rejoin-v1.0": {
    id: "membership-rejoin-v1.0",
    method: "button_disclosure",
    heading: "Rejoin the community",
    benefitIntro: "If you unsubscribed in the past and would like to hear from Martin again, you can rejoin here. It is your choice, and it is free.",
    buttonLabel: "Email me a confirmation link",
    communityNote: "We’ll send one email with a link to confirm. Nothing changes until you confirm.",
    disclosure:
      "Rejoining is free and starts only when you confirm from the email. You can unsubscribe at any time and keep anything you have already unlocked. Read the Privacy Policy.",
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
