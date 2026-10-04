/**
 * The standard lead form for every gated resource: first name + email, then TWO explicit actions.
 *
 *  - join:          deliver the resource AND record marketing consent (the click is the affirmative act).
 *  - resource_only: deliver the resource and record NO marketing consent. It is not an unsubscribe.
 *
 * Shared by the browser form and the server route so the wording a visitor saw is exactly the wording that is
 * stored as consent evidence. To change the wording, add a NEW version constant and keep the old text for the
 * records that agreed to it; never edit a published version in place.
 *
 * Client-safe: no server-only imports.
 */
import { validateEmail } from "@/app/lib/resources/validation";

export const OPTIN_VERSION = "resource_optin_v2";

export type MarketingChoice = "join" | "resource_only";

export function isMarketingChoice(value: unknown): value is MarketingChoice {
  return value === "join" || value === "resource_only";
}

const NOUNS: Record<string, string> = {
  Guide: "guide",
  "Field Guide": "field guide",
  Checklist: "checklist",
  Worksheet: "worksheet",
  Template: "template",
  Report: "report",
  Tool: "tool",
};

/** A sensible label for the resource, from the resource_type the data model already carries. */
export function resourceNoun(resourceType: string | null | undefined): string {
  return (resourceType && NOUNS[resourceType]) || "resource";
}

export type OptinCopy = {
  explanation: string;
  primaryLabel: string;
  secondaryLabel: string;
};

export function optinCopy(resourceType: string | null | undefined): OptinCopy {
  const noun = resourceNoun(resourceType);
  return {
    explanation: `Get the ${noun} and join my shortlist for occasional ideas on building, testing and architecting businesses. Unsubscribe anytime.`,
    primaryLabel: `GET THE ${noun.toUpperCase()} + KEEP ME ON THE SHORTLIST`,
    secondaryLabel: `JUST SEND ME THE ${noun.toUpperCase()}`,
  };
}

/** The exact text a visitor saw, stored in consent_records.wording_text. */
export function optinEvidenceText(resourceType: string | null | undefined): string {
  const copy = optinCopy(resourceType);
  return `[button_disclosure] ${copy.explanation}\nCHOICE 1: ${copy.primaryLabel}\nCHOICE 2: ${copy.secondaryLabel}`;
}

export const FIRST_NAME_MAX = 100;

export type OptinFieldErrors = { firstName?: string; email?: string };

/** Human-readable validation shared by the form and the route. `firstName` and `email` are the cleaned values. */
export function validateOptinFields(input: { firstName: unknown; email: unknown }):
  | { ok: true; firstName: string; email: string }
  | { ok: false; errors: OptinFieldErrors } {
  const errors: OptinFieldErrors = {};
  const firstName = typeof input.firstName === "string" ? input.firstName.trim().replace(/\s+/g, " ") : "";
  if (!firstName) errors.firstName = "Please enter your first name.";
  else if (firstName.length > FIRST_NAME_MAX) errors.firstName = "That first name is a little long. Please shorten it.";

  const emailCheck = validateEmail(input.email);
  if (!emailCheck.ok) errors.email = "Please enter a valid email address.";

  if (errors.firstName || errors.email || !emailCheck.ok) return { ok: false, errors };
  return { ok: true, firstName, email: emailCheck.email };
}
