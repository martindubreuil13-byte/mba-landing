export const PROGRAM_KEY = "corporate-transition";
import { INTRO_BOOKING_URL } from "@/app/lib/booking";
/** Alias of the central introductory-booking link (app/lib/booking.ts). Do not put a Calendly URL here. */
export const CALENDLY_URL = INTRO_BOOKING_URL;
// The optional community invitation shown AFTER the application is submitted (never inside the questionnaire).
// COMMUNITY_WORDING and COMMUNITY_FOOTNOTE are exactly what the visitor sees beside the two buttons; both are stored,
// with this version, as the consent evidence. Change either and the version MUST change (a new entry, never an edit).
export const COMMUNITY_CONSENT_VERSION = "transition-community-v1";
export const COMMUNITY_QUESTION = "Would you like occasional emails with practical advice, ideas, guides, and resources?";
export const COMMUNITY_DECLINE_LABEL = "No, thanks";
export const COMMUNITY_JOIN_LABEL = "Yes, count me in";
export const COMMUNITY_WORDING = `I'm building a community of people who want to create something of their own. ${COMMUNITY_QUESTION} — ${COMMUNITY_JOIN_LABEL}`;
export const COMMUNITY_FOOTNOTE = "Optional. Unsubscribe anytime. Your consultation is not affected by your choice.";

export const employmentOptions = [
  "Executive / C-suite", "Director / senior leader", "Manager", "Experienced specialist / professional",
  "Consultant employed by an organization", "Other employed professional", "Business owner / entrepreneur",
  "Unemployed / between roles", "Other",
] as const;
export const experienceOptions = ["Less than 5 years", "5–10 years", "10–15 years", "15–20 years", "20+ years"] as const;
export const stageOptions = [
  "I know I want to build something of my own, but I don’t have a business idea yet.",
  "I have several ideas or possibilities and don’t know which one to pursue.",
  "I have one business idea I’m seriously considering.",
  "I’ve started researching or testing an idea while keeping my job.",
  "I’ve already started building something on the side.",
] as const;
export const timingOptions = ["Within the next 6 months", "6–12 months", "1–2 years", "More than 2 years from now", "I don’t know yet"] as const;

export type TransitionAnswers = {
  employment: string; employmentOther?: string; experience: string; stage: string; timing: string;
  motivation: string; help: string; country: string; firstName: string; lastName: string;
  email: string; linkedin?: string;
};

export type Attribution = { source?: string | null; medium?: string | null; campaign?: string | null; referrer?: string | null; utm_source?: string | null; utm_medium?: string | null; utm_campaign?: string | null; utm_content?: string | null };

/** Shown when a required long-text answer is empty or whitespace-only. There is deliberately no minimum length. */
export const ANSWER_REQUIRED_MESSAGE = "Please answer this question.";

export function cleanText(value: unknown, max: number) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }

export function validateApplication(value: unknown): { data?: TransitionAnswers; errors?: Record<string, string> } {
  const b = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const data: TransitionAnswers = {
    employment: cleanText(b.employment, 100), employmentOther: cleanText(b.employmentOther, 200),
    experience: cleanText(b.experience, 40), stage: cleanText(b.stage, 180), timing: cleanText(b.timing, 80),
    motivation: cleanText(b.motivation, 1500), help: cleanText(b.help, 1500), country: cleanText(b.country, 100),
    firstName: cleanText(b.firstName, 100), lastName: cleanText(b.lastName, 100), email: cleanText(b.email, 200).toLowerCase(),
    linkedin: cleanText(b.linkedin, 300),
  };
  const errors: Record<string, string> = {};
  if (!employmentOptions.includes(data.employment as never)) errors.employment = "Choose your current professional situation.";
  if (data.employment === "Other" && !data.employmentOther) errors.employmentOther = "Tell us briefly about your situation.";
  if (!experienceOptions.includes(data.experience as never)) errors.experience = "Choose your experience.";
  if (!stageOptions.includes(data.stage as never)) errors.stage = "Choose where you are right now.";
  if (!timingOptions.includes(data.timing as never)) errors.timing = "Choose a timeframe.";
  if (!data.motivation) errors.motivation = ANSWER_REQUIRED_MESSAGE;
  if (!data.help) errors.help = ANSWER_REQUIRED_MESSAGE;
  if (!data.country) errors.country = "Enter your country.";
  if (!data.firstName) errors.firstName = "Enter your first name.";
  if (!data.lastName) errors.lastName = "Enter your last name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Enter a valid email address.";
  if (data.linkedin && !/^https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\//i.test(data.linkedin)) errors.linkedin = "Enter a LinkedIn profile URL, or leave this blank.";
  return Object.keys(errors).length ? { errors } : { data };
}

/**
 * There is no screening: every valid application is saved and offered the booking link immediately. The three-way
 * INVITE / REVIEW / NOT_FIT decision, the AI assessment and the TRANSITION_AUTO_QUALIFICATION switch no longer exist for
 * new submissions. Historical applications keep their stored assessment and statuses untouched.
 */

/**
 * Response template for an applicant who does not fit the original Corporate Transition criteria, offered as a
 * starting point in the Admin "Response" form. It says "I've reviewed your application", so it is NEVER sent
 * automatically: it goes out only when Martin chooses it and presses Send after reviewing the application.
 */
export const CONVERSATION_INVITE_SUBJECT = "Let’s have a conversation";
export const CONVERSATION_INVITE_CALENDLY_URL = INTRO_BOOKING_URL;

export function conversationInviteDraft(firstName: string): string {
  return `Hi ${firstName},

Thank you for taking the time to share your background and situation.

This program was originally designed for professionals transitioning from corporate employment into entrepreneurship, so your circumstances may not fit the original criteria.

However, I’ve reviewed your application, and I believe a conversation could still be worthwhile.

I’d be happy to offer you 30 minutes of my time to explore your situation, discuss your options, and see whether I can offer some useful guidance.

No fees, no obligations, and no sales pitch. Just an honest conversation.

You can book a time here:

${CONVERSATION_INVITE_CALENDLY_URL}

Looking forward to speaking with you.

Martin`;
}
