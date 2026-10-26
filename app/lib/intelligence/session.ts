/**
 * Per-tab analytics session, kept in sessionStorage only (cleared when the tab closes; no cookie, no localStorage).
 * A session ends after 30 minutes of inactivity: the next page view in that tab starts a new one. Pure + storage
 * injected, so expiry is unit-tested.
 */
export const SESSION_IDLE_MS = 30 * 60 * 1000;
export const SESSION_KEY = "mba_wi";

export type Entry = { ref: string | null; us: string | null; um: string | null; uc: string | null; ut: string | null; land: string };
export type StoredSession = { id: string; last: number; seq: number; entry: Entry };

export function resumeOrStart(
  stored: StoredSession | null,
  now: number,
  makeId: () => string,
  makeEntry: () => Entry
): { session: StoredSession; isNew: boolean } {
  if (stored && now - stored.last < SESSION_IDLE_MS && stored.id && stored.entry) {
    return { session: { ...stored, last: now }, isNew: false };
  }
  return { session: { id: makeId(), last: now, seq: 0, entry: makeEntry() }, isNew: true };
}
