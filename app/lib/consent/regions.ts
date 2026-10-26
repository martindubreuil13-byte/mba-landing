/**
 * Where this site ASKS for the visitor's opt-in BEFORE Google Analytics runs. Decided by where the VISITOR is, not where the business
 * is established (which this code does not assume). The list is the EEA, the UK, Switzerland, Brazil and Quebec, plus any visitor whose
 * location is unknown (the safe default).
 *
 * ASSUMPTION, NOT A LEGAL DETERMINATION: this is a conservative engineering starting point. It is not guaranteed to be complete or
 * sufficient for any jurisdiction. See docs/website-intelligence/legal-review.md; have counsel confirm it, then edit these constants.
 * Everywhere else, GA runs unless the visitor sends a privacy signal or declines through "Analytics preferences".
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
