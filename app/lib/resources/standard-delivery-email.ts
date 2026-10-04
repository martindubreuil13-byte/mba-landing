import "server-only";
import { renderResourceEmail } from "./email-layout";
import { resourceNoun } from "./optin";

/**
 * The standard delivery email for every normal gated resource (the generic request form). Built on the shared
 * MBA email layout (warm-white card, burgundy accent, Georgia headings, table + inline styles, hidden preview text),
 * the same one the guide and membership emails use. Resource-specific details are injected; nothing here is
 * specific to one resource.
 *
 * It is a TRANSACTIONAL delivery email: it is sent whatever marketing choice the person made and carries no
 * marketing copy. The unsubscribe link appears only for someone who is currently subscribed.
 *
 * Resources with their own flow (e.g. Build the Bridge First, with its confirmation architecture) have their own
 * emails and do not use this.
 */

type ResourceForEmail = { title: string; short_description?: string | null; resource_type?: string | null };

/** Button wording by resource type. Anything unmapped says "resource". */
function ctaLabel(resourceType: string | null | undefined): string {
  if (resourceType === "Tool") return "ACCESS THE TOOL";
  return `DOWNLOAD THE ${resourceNoun(resourceType).toUpperCase()}`;
}

/** Descriptions are plain text, but a resource may use the site's [text](/path) link markup; keep only the words. */
function plainDescription(value: string | null | undefined): string {
  return (value ?? "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/\s+/g, " ").trim();
}

export type StandardDeliveryEmailInput = {
  resource: ResourceForEmail;
  /** What the person typed (or the lead's stored first name). Falls back to a neutral greeting. */
  firstName?: string | null;
  /** The exact download link, unchanged from what the request flow generates. */
  downloadUrl: string;
  privacyUrl: string;
  /** Present only when the recipient is currently subscribed to marketing emails. */
  unsubscribeUrl?: string | null;
};

export function buildStandardDeliveryEmail(input: StandardDeliveryEmailInput) {
  const { resource } = input;
  const noun = resourceNoun(resource.resource_type);
  const name = (input.firstName ?? "").trim();
  const description = plainDescription(resource.short_description);
  const subscribed = Boolean(input.unsubscribeUrl);

  const subject = `Your ${noun}: ${resource.title}`;
  const preview = `Your copy of ${resource.title} is ready to download.`;
  const { html, text } = renderResourceEmail({
    preview,
    heading: `Your ${noun} is ready.`,
    blocks: [
      { type: "p", text: name ? `Hi ${name},` : "Hi there," },
      { type: "p", text: "Here's your copy of:" },
      { type: "title", text: resource.title },
      ...(description ? [{ type: "p" as const, text: description }] : []),
      { type: "cta", label: ctaLabel(resource.resource_type), url: input.downloadUrl },
      { type: "small", text: "Keep this email. You can use the button above to access your copy.", plainText: "Keep this email. You can use the link above to access your copy." },
    ],
    privacyUrl: input.privacyUrl,
    ...(subscribed ? { unsubscribeUrl: input.unsubscribeUrl!, unsubscribeLabel: "Unsubscribe" } : {}),
    reason: subscribed
      ? `You are receiving this because you asked for ${resource.title} and are subscribed to emails from The Modern Business Architect.`
      : `You received this one-off email because you requested ${resource.title} from The Modern Business Architect.`,
  });

  return { subject, html, text };
}
