import type { CtaLocation } from "./events";

/**
 * Per-resource configuration for the lead-capture experience. Converting the
 * next guide = add one entry here (including its `access` block), add its content
 * under ./guides, and make sure the `resources` row has its file. No new routes,
 * consent logic or email templates are needed: the member-access service reads
 * everything resource-specific from here. See docs/member-access/conversion-checklist.md.
 *
 * Product rule: "Useful for everyone. More useful for members."
 *   public layer  - available with no email, login or consent (the online guide)
 *   member layer  - unlocked only after the reader CONFIRMS free membership (the printable PDF)
 *
 * Resource kinds are deliberately broader than "guide" so worksheets, surveys,
 * assessments and tools can plug into the same events / consent / lead model.
 */
export type ResourceKind = "guide" | "worksheet" | "survey" | "assessment" | "tool";

export type CtaCopy = {
  /** Button label. */
  button: string;
  heading?: string;
  body: string;
};

/** Everything that makes a resource a "public layer + free-member layer" resource. */
export type ResourceAccessConfig = {
  /** Key into CONSENT_COPY: the versioned wording of the membership request form. */
  consentCopyId: string;
  /** The part anyone can use without email, login or consent. */
  publicLayer: { kind: "online-guide"; summary: string };
  /** What confirmed members unlock. Described to the visitor BEFORE they enter an email. */
  memberBenefit: {
    kind: "asset-download";
    /** Short name used in emails and pages, e.g. "printable guide". */
    label: string;
    summary: string;
  };
  /** Confirmed members who ask again get the benefit by email at once (never on screen: that would leak membership). */
  activeMembersReceiveByEmail: true;
  /** The state shown after the form is submitted. Identical for every outcome (no enumeration). */
  checkInbox: { heading: string; body: string; hint: string };
  /** Email asking a new / pending person to confirm. */
  confirmationEmail: {
    subject: (title: string) => string;
    preview: string;
    heading: string;
    paragraphs: string[];
    button: string;
    ignoreNote: string;
  };
  /** The /confirm page for requests that came from this resource. GET only explains; the button POSTs. */
  confirmationPage: { heading: string; intro: string; details: string; button: string; doneHeading: string; doneBody: string; downloadButton: string };
  /** Labels used in Admin for this resource's member benefit. */
  analytics: { benefitLabel: string };
};

export type ResourceConfig = {
  slug: string;
  kind: ResourceKind;
  /** How the page is built. Only "online-guide" exists so far. */
  experience: "online-guide";
  /** Public layer / member layer / consent / emails. */
  access: ResourceAccessConfig;
  /** Email template key (see delivery-email.ts). */
  emailTemplate: "guide-delivery";
  /** What the printable file is called to the reader. */
  printableName: string;
  /** Reading time shown to readers / in structured data, ISO-8601 duration. */
  timeRequired: string;
  /** Section id after which the mid-guide CTA appears (after the first real exercise). */
  midCtaAfterSectionId: string;
  cta: Record<CtaLocation, CtaCopy>;
  /** Email wording specific to this resource. */
  email: {
    subject: (title: string) => string;
    /** Inbox preview text (hidden in the body). */
    previewText: string;
    /** Subtitle under the title. */
    tagline: string;
    /** Opening paragraphs before the download button (the form collects email only, so no salutation name). */
    opening: string[];
    /** Body paragraphs after the download button; a paragraph may carry a bold lead-in. */
    body: { lead?: string; text: string }[];
    /** The "small suggestion" box. */
    suggestion: { heading: string; text: string };
    /** Shown to readers who are already subscribed. */
    communityNote: string;
    /** Optional community confirmation block, shown only while a signup awaits confirmation. */
    confirm: { heading: string; text: string; button: string; reassurance: string };
    signoff: { name: string; role: string; tagline: string };
  };
};

const CONFIGS: ResourceConfig[] = [
  {
    slug: "build-the-bridge-first",
    kind: "guide",
    experience: "online-guide",
    access: {
      consentCopyId: "resource-guide-consent-v1.2",
      publicLayer: { kind: "online-guide", summary: "The complete guide, readable online with no email, login or consent." },
      memberBenefit: {
        kind: "asset-download",
        label: "printable guide",
        summary: "The printable PDF to download, print, complete and keep.",
      },
      activeMembersReceiveByEmail: true,
      checkInbox: {
        heading: "Check your inbox",
        body: "If this address can receive the guide, an email is on its way with a link to confirm. Open it and press the confirmation button to unlock the printable PDF.",
        hint: "Nothing after a few minutes? Check your spam folder. You can keep reading the guide online in the meantime.",
      },
      confirmationEmail: {
        subject: () => "Confirm your email to unlock Build the Bridge First",
        preview: "One click to confirm and unlock your printable guide.",
        heading: "One step to unlock your printable guide",
        paragraphs: [
          "Hello,",
          "You asked for the printable edition of Build the Bridge First. It is available to free members of The Modern Business Architect community.",
          "Confirm your email below to become a member. Your PDF unlocks the moment you confirm, and I will also email you a download link that stays valid, so you can come back to it.",
          "As a member you may receive occasional ideas, resources, tools and invitations from me. You can unsubscribe at any time, and anything you have unlocked stays yours.",
        ],
        button: "Confirm and unlock the guide",
        ignoreNote: "If you did not ask for this, ignore this email. Nothing will be unlocked and nothing further will be sent.",
      },
      confirmationPage: {
        heading: "Unlock the printable guide",
        intro: "Press the button to confirm your email address. You become a free member of the Modern Business Architect community, and the printable PDF of Build the Bridge First unlocks straight away.",
        details: "As a member you may receive occasional emails from Martin Dubreuil: practical ideas, new resources, updates and relevant offers. You can unsubscribe at any time, and anything you have unlocked stays yours.",
        button: "Confirm and unlock the guide →",
        doneHeading: "You are in.",
        doneBody: "Your download is starting. I have also emailed you a link that stays valid, so you can come back to the guide whenever you like. You will now receive occasional emails from Martin; you can unsubscribe at any time.",
        downloadButton: "Download the PDF →",
      },
      analytics: { benefitLabel: "Printable guide" },
    },
    emailTemplate: "guide-delivery",
    printableName: "printable guide",
    timeRequired: "PT30M",
    midCtaAfterSectionId: "page-2",
    cta: {
      top: {
        button: "Unlock the printable guide",
        body: "Read the complete guide here, free. Free members of the community also get the printable PDF to download, print and keep.",
      },
      "mid-guide": {
        body: "Prefer to work directly on the exercises? Free members get the printable PDF to download, print and complete.",
        button: "Unlock the printable guide →",
      },
      end: {
        heading: "Keep the work you have started.",
        body: "The printable edition gives you space to complete every exercise and assemble your Entrepreneurial Direction Brief. It is free for members of the Modern Business Architect community.",
        button: "Unlock the printable guide →",
      },
    },
    email: {
      subject: () => "Your guide is ready: Build the Bridge First",
      previewText: "A practical guide for deciding what to build before leaving what you know.",
      tagline: "A practical guide for your move from corporate life to entrepreneurship",
      opening: ["Hello,", "Here it is.", "You can download your copy of Build the Bridge First below and keep it for whenever you need to think clearly about what comes next."],
      body: [
        { text: "This guide is not designed to convince you to quit your job." },
        { text: "It is designed to help you answer a more useful question:" },
        { lead: "What would need to be true for your next move to become a credible business, not simply an escape?", text: "" },
        { text: "Take your time with it. Write in it. Challenge your assumptions. You do not need to have the perfect idea yet." },
        { text: "You need a better way to recognize the right one." },
      ],
      suggestion: {
        heading: "A small suggestion",
        text: "Do not read the guide only once. Return to the three questions whenever a new idea appears. A promising business should become clearer under examination, not more dependent on enthusiasm.",
      },
      communityNote: "As a member you may receive occasional practical notes from The Modern Business Architect. The unsubscribe link below ends that at any time, and the guide stays yours.",
      confirm: {
        heading: "Would you like to stay connected?",
        text: "If you would like occasional practical notes, new tools and invitations from The Modern Business Architect, confirm your email below. Confirming is optional, and it is what switches those emails on.",
        button: "Yes, keep me in the community",
        reassurance: "No noise. No daily campaign. Just useful material when I have something worth sending. You can download the guide whether or not you confirm.",
      },
      signoff: { name: "Martin Dubreuil", role: "The Modern Business Architect", tagline: "Business architecture for people building what comes next" },
    },
  },
];

export function getResourceConfig(slug: string): ResourceConfig | null {
  return CONFIGS.find((c) => c.slug === slug) ?? null;
}

export function listResourceConfigs(): ResourceConfig[] {
  return CONFIGS;
}
