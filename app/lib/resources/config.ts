import type { CtaLocation } from "./events";

/**
 * Per-resource configuration for the lead-capture experience. Converting the
 * next guide = add one entry here, add its content under ./guides, and (if it
 * has a PDF) make sure the `resources` row has its file. See
 * docs/resource-lead-capture/convert-next-guide.md.
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

export type ResourceConfig = {
  slug: string;
  kind: ResourceKind;
  /** How the page is built. Only "online-guide" exists in the pilot. */
  experience: "online-guide";
  /** Key into CONSENT_COPY. */
  consentCopyId: string;
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
    consentCopyId: "resource-guide-consent-v1.1",
    emailTemplate: "guide-delivery",
    printableName: "printable guide",
    timeRequired: "PT30M",
    midCtaAfterSectionId: "page-2",
    cta: {
      top: {
        button: "Get the printable guide",
        body: "Read it here, or download, print and keep the PDF to complete every exercise.",
      },
      "mid-guide": {
        body: "Prefer to work directly on the exercises? Get the printable PDF to download, print and keep.",
        button: "Get the printable guide →",
      },
      end: {
        heading: "Keep the work you have started.",
        body: "The printable edition gives you space to complete every exercise and assemble your Entrepreneurial Direction Brief.",
        button: "Get the printable guide →",
      },
    },
    email: {
      subject: (title) => `Your guide: ${title}`,
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
      communityNote: "You are also on the list for occasional practical notes from The Modern Business Architect. The unsubscribe link below ends that at any time, and the guide stays yours.",
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
