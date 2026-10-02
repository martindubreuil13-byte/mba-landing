import "server-only";

/**
 * Who Transition emails come from, go to and are replied to by.
 *
 * Business notifications deliberately do NOT use ADMIN_EMAIL: that variable controls who may sign in to the
 * admin area. A missing PROGRAM_ADMIN_EMAIL therefore means "no internal notification" (reported as a failure
 * on the application), never a fallback to ADMIN_EMAIL or to anyone else.
 */
export const DEFAULT_PROGRAM_FROM = "Martin Dubreuil <martin@mindrasolutions.com>";

const looksLikeAddress = (v: string) => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(v);

function address(name: string): string | null {
  const v = process.env[name]?.trim();
  return v && looksLikeAddress(v) ? v : null;
}

export function programFrom(): string {
  return process.env.PROGRAM_EMAIL_FROM?.trim() || DEFAULT_PROGRAM_FROM;
}

/** Reply-To for every customer-facing message. Absent = the header is omitted and replies reach the From address. */
export function programReplyTo(): string | null {
  return address("PROGRAM_REPLY_TO");
}

/** Recipient of the internal application notification, or null when it is not configured. */
export function programAdminTo(): string | null {
  return address("PROGRAM_ADMIN_EMAIL");
}
