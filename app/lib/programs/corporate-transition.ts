export const PROGRAM_KEY = "corporate-transition";
export const CALENDLY_URL = "https://calendly.com/martindubreuil/coaching_session";
// v2 (confirmed opt-in): the box only REQUESTS marketing. One confirmation email is sent and marketing starts only
// after the applicant confirms. v1 ("corporate-transition-shortlist-v1") did not say so and never sent that email.
// The label and the footnote below are exactly what the visitor sees; both are stored as the consent wording.
export const CONSENT_VERSION = "corporate-transition-shortlist-v2";
export const CONSENT_WORDING = "Keep me on Martin’s shortlist for useful ideas, resources and occasional updates. I understand I will get one email asking me to confirm, and I am only subscribed once I do.";
export const CONSENT_FOOTNOTE = "Submitting permits transactional messages about this application. It does not subscribe you to marketing unless you check the box and then confirm from the email we send you.";

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
  email: string; linkedin?: string; marketingConsent: boolean;
};

export type Attribution = { source?: string | null; medium?: string | null; campaign?: string | null; referrer?: string | null; utm_source?: string | null; utm_medium?: string | null; utm_campaign?: string | null; utm_content?: string | null };

export function cleanText(value: unknown, max: number) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }

export function validateApplication(value: unknown): { data?: TransitionAnswers; errors?: Record<string, string> } {
  const b = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const data: TransitionAnswers = {
    employment: cleanText(b.employment, 100), employmentOther: cleanText(b.employmentOther, 200),
    experience: cleanText(b.experience, 40), stage: cleanText(b.stage, 180), timing: cleanText(b.timing, 80),
    motivation: cleanText(b.motivation, 1500), help: cleanText(b.help, 1500), country: cleanText(b.country, 100),
    firstName: cleanText(b.firstName, 100), lastName: cleanText(b.lastName, 100), email: cleanText(b.email, 200).toLowerCase(),
    linkedin: cleanText(b.linkedin, 300), marketingConsent: b.marketingConsent === true,
  };
  const errors: Record<string, string> = {};
  if (!employmentOptions.includes(data.employment as never)) errors.employment = "Choose your current professional situation.";
  if (data.employment === "Other" && !data.employmentOther) errors.employmentOther = "Tell us briefly about your situation.";
  if (!experienceOptions.includes(data.experience as never)) errors.experience = "Choose your experience.";
  if (!stageOptions.includes(data.stage as never)) errors.stage = "Choose where you are right now.";
  if (!timingOptions.includes(data.timing as never)) errors.timing = "Choose a timeframe.";
  if (data.motivation.length < 20) errors.motivation = "Please share a little more (at least 20 characters).";
  if (data.help.length < 20) errors.help = "Please share a little more (at least 20 characters).";
  if (!data.country) errors.country = "Enter your country.";
  if (!data.firstName) errors.firstName = "Enter your first name.";
  if (!data.lastName) errors.lastName = "Enter your last name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Enter a valid email address.";
  if (data.linkedin && !/^https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\//i.test(data.linkedin)) errors.linkedin = "Enter a LinkedIn profile URL, or leave this blank.";
  return Object.keys(errors).length ? { errors } : { data };
}
