import { INTRO_BOOKING_PATH, introBookingPath } from "@/app/lib/booking";

/**
 * Where this page's call to action sends a visitor.
 *
 * The introductory booking link is only worth showing when it will actually open a booking page. A valid-looking URL is not proof of that:
 * `/book/...` answers 404 when Scheduling operations or public intake are off, and also when its meeting type is missing, inactive or
 * invitation-only. So the destination is decided from the same facts the booking page itself uses, and anything doubtful (including a
 * failed lookup) falls back to `/lets-talk`, the site's inquiry form, so a prospect always has a usable way to get in touch.
 *
 * This module is pure (dependencies are passed in) so it can be tested; the real wiring is in booking-destination.server.ts.
 */

export const MESSAGE_PATH = "/lets-talk";
/** The slug of the meeting type behind the introductory booking link. Derived from that link so the two cannot drift apart. */
export const INTRO_MEETING_SLUG = INTRO_BOOKING_PATH.split("/").pop() as string;

export type BookingDestination =
  | { kind: "booking"; href: string }
  | { kind: "message"; href: typeof MESSAGE_PATH; reason: "intake_off" | "meeting_type_unavailable" | "lookup_failed" };

export type DestinationDeps = {
  /** Scheduling operations and public intake are both on (the booking page's own gate). */
  intakeEnabled: () => boolean;
  /** The booking page's own lookup: ok only for an active, public meeting type. */
  lookup: (slug: string) => Promise<{ ok: true } | { ok: false; reason?: string }>;
  now?: () => number;
};

const FOUND_TTL_MS = 60_000;
const FAILED_TTL_MS = 10_000;

/** A resolver that remembers its answer briefly, so a busy page does not read the scheduling store on every view. */
export function createBookingDestinationResolver(deps: DestinationDeps) {
  const now = deps.now ?? Date.now;
  let cached: { value: BookingDestination; until: number } | null = null;

  return async function resolve(): Promise<BookingDestination> {
    if (!deps.intakeEnabled()) return { kind: "message", href: MESSAGE_PATH, reason: "intake_off" };
    if (cached && cached.until > now()) return cached.value;

    let value: BookingDestination;
    let ttl = FOUND_TTL_MS;
    try {
      const found = await deps.lookup(INTRO_MEETING_SLUG);
      value = found.ok
        ? { kind: "booking", href: introBookingPath(null, "rearchitecture") }
        : { kind: "message", href: MESSAGE_PATH, reason: "meeting_type_unavailable" };
    } catch {
      value = { kind: "message", href: MESSAGE_PATH, reason: "lookup_failed" };
      ttl = FAILED_TTL_MS;
    }
    cached = { value, until: now() + ttl };
    return value;
  };
}
