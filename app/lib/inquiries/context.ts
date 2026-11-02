import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { secretFor } from "./form-token";

/**
 * A short-lived, signed note of WHERE a booking visitor came from ("inquiry <id>" or "application <id>"). The booking page receives it when it
 * exchanges the visitor's private reference, keeps it in memory, and sends it with the booking so the booking can be linked to its origin.
 * It holds only an internal row id and an expiry (no name, e-mail or reference), and is accepted for two hours. It is signed with a key of its own.
 *
 * The context is issued whatever the age of the reference: an old reference no longer pre-fills the form, but it still proves where the visitor came from.
 */
export type Origin = { kind: "inquiry" | "application"; id: string };
const VERSION = "bc1";
const TTL_MS = 2 * 3_600_000;
const sign = (payload: string) => createHmac("sha256", secretFor("context")).update(payload).digest("base64url");
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function signContext(origin: Origin, now: number = Date.now()): string {
  const body = Buffer.from(JSON.stringify([origin.kind === "inquiry" ? "i" : "a", origin.id, Math.floor((now + TTL_MS) / 1000)])).toString("base64url");
  return `${VERSION}.${body}.${sign(`${VERSION}.${body}`)}`;
}

export function verifyContext(token: unknown, now: number = Date.now()): Origin | null {
  if (typeof token !== "string" || token.length > 400) return null;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== VERSION) return null;
  const expected = Buffer.from(sign(`${parts[0]}.${parts[1]}`));
  const given = Buffer.from(parts[2]);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const [k, id, exp] = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as [string, string, number];
    if ((k !== "i" && k !== "a") || typeof id !== "string" || !UUID.test(id) || !Number.isFinite(exp) || exp * 1000 < now) return null;
    return { kind: k === "i" ? "inquiry" : "application", id };
  } catch { return null; }
}
