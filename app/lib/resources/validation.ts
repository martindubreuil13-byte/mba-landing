/** Shared (client + server) email validation with human error messages. */
export type EmailCheck = { ok: true; email: string } | { ok: false; message: string };

// Practical, not RFC-complete: one @, no spaces, a dotted domain, no empty labels.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export function validateEmail(raw: unknown): EmailCheck {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) return { ok: false, message: "Enter your email address so I know where to send the guide." };
  if (value.length > 254) return { ok: false, message: "That email address is too long. Check it and try again." };
  if (!value.includes("@")) return { ok: false, message: "That email is missing an “@”. It should look like name@example.com." };
  if (!EMAIL_PATTERN.test(value)) return { ok: false, message: "That email address does not look right. Check for typos, for example a missing “.com”." };
  return { ok: true, email: value.toLowerCase() };
}
