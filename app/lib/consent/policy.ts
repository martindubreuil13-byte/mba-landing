/**
 * The decision about Google Analytics, as a pure function so every branch is tested.
 *
 *   privacy signal (GPC / DNT)  -> never runs, no banner; this wins over everything, including an earlier "accept"
 *   stored "declined"           -> never runs
 *   stored "accepted"           -> runs
 *   no stored choice:
 *      location unknown yet     -> wait (nothing loads while the region is being determined)
 *      opt-in region (or unknown location) -> ask; nothing loads and no cookie is set until the visitor accepts
 *      elsewhere                -> runs; the visitor can still decline from "Analytics preferences"
 *
 * Website Intelligence (first-party, cookieless) does NOT use this decision: it is governed only by GPC/DNT.
 */
export const CONSENT_KEY = "mba_analytics_consent";
export const CONSENT_VERSION = 1;
export const CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

export type Choice = "granted" | "denied";
export type StoredConsent = { v: typeof CONSENT_VERSION; choice: Choice; at: number };

/** Returns the stored choice only if it is well-formed, current-version, not from the future and under 12 months old. */
export function parseStored(raw: string | null | undefined, now: number): StoredConsent | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as Partial<StoredConsent>;
    if (o?.v !== CONSENT_VERSION || (o.choice !== "granted" && o.choice !== "denied") || typeof o.at !== "number") return null;
    if (o.at > now + 60_000 || now - o.at > CONSENT_MAX_AGE_MS) return null;
    return { v: CONSENT_VERSION, choice: o.choice, at: o.at };
  } catch {
    return null;
  }
}

export const serializeChoice = (choice: Choice, now: number): string => JSON.stringify({ v: CONSENT_VERSION, choice, at: now } satisfies StoredConsent);

export type Decision = "blocked_signal" | "blocked_declined" | "load" | "ask" | "pending";

export function decide(input: { signal: boolean; stored: StoredConsent | null; required: boolean | null }): Decision {
  if (input.signal) return "blocked_signal";
  if (input.stored?.choice === "denied") return "blocked_declined";
  if (input.stored?.choice === "granted") return "load";
  if (input.required === null) return "pending";
  return input.required ? "ask" : "load";
}
