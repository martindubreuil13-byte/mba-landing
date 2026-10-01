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
    opening: string[];
    /** Shown to readers who are already subscribed. */
    communityNote: string;
    /** Shown above the confirm button to readers whose community signup awaits confirmation. */
    confirmNote: string;
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
      opening: [
        "Here is your printable copy of Build the Bridge First.",
        "Download it, work through the exercises and keep it for whenever the idea of building something of your own becomes more than a passing thought.",
      ],
      confirmNote:
        "One more step if you would like to join the Modern Business Architect community: confirm your email address and I will send you occasional emails with practical ideas, new resources, updates and relevant offers. If you do not confirm, I will not email you again beyond this message, and the guide stays yours.",
      communityNote:
        "You are also now part of the Modern Business Architect community: occasional emails from me with practical ideas, new resources, updates and relevant offers. If that is not for you, the unsubscribe link below ends it and the guide stays yours.",
    },
  },
];

export function getResourceConfig(slug: string): ResourceConfig | null {
  return CONFIGS.find((c) => c.slug === slug) ?? null;
}

export function listResourceConfigs(): ResourceConfig[] {
  return CONFIGS;
}
