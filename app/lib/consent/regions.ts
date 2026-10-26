/**
 * Where Google Analytics needs the visitor's opt-in BEFORE it runs. Decided by where the VISITOR is, not where the business is
 * established (which this code does not assume). Opt-in is required for the EEA, the UK and Switzerland (ePrivacy / GDPR style
 * rules), Brazil, and Quebec (Law 25). When the location is unknown the answer is "required": the safe default.
 *
 * This is a conservative starting list, not legal advice: have counsel confirm it, then edit these two constants. Everywhere
 * else, GA runs unless the visitor sends a privacy signal or declines through "Analytics preferences".
 */
export const CONSENT_REQUIRED_COUNTRIES: ReadonlySet<string> = new Set([
  // EU member states
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
  // rest of the EEA, the UK, Switzerland
  "IS", "LI", "NO", "GB", "CH",
  // other opt-in regimes
  "BR",
]);

/** ISO 3166-2 subdivisions inside otherwise opt-out countries that require opt-in. */
export const CONSENT_REQUIRED_REGIONS: ReadonlySet<string> = new Set(["CA-QC"]);

export function consentRequiredFor(country: string | null | undefined, region?: string | null): boolean {
  const c = (country ?? "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(c)) return true; // unknown location: ask
  if (CONSENT_REQUIRED_COUNTRIES.has(c)) return true;
  if (c === "CA") {
    const r = (region ?? "").trim().toUpperCase();
    return r === "" || CONSENT_REQUIRED_REGIONS.has(`CA-${r}`); // Canada with no region information: ask
  }
  return false;
}
