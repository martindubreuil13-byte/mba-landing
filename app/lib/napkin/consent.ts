/**
 * Single source of truth for the community-invitation consent copy shown
 * next to the join button, and the version tag stored with every consent
 * record. Bump CONSENT_COPY_VERSION whenever CONSENT_STATEMENT changes so
 * historical submissions keep the exact wording they actually agreed to.
 */

export const CONSENT_COPY_VERSION = "napkin-consent-v1.0";

export const CONSENT_STATEMENT =
  "By joining, you agree to receive emails from The Modern Business Architect. You can unsubscribe at any time.";
