/** Constants safe to import from client components (no Node APIs). */
export const DEMO_REFERENCE = "demo-confirmation";

/** Buffer choices offered for every meeting type (minutes). The database enforces the same list. */
export const BUFFER_OPTIONS = [0, 15, 30, 45, 60] as const;
export const DEFAULT_BUFFER_BEFORE = 0;
/** Default: 30 minutes kept clear after a meeting. */
export const DEFAULT_BUFFER_AFTER = 30;
export const isBufferOption = (n: unknown): n is (typeof BUFFER_OPTIONS)[number] => typeof n === "number" && (BUFFER_OPTIONS as readonly number[]).includes(n);

/** Recorded as a booking's sync note while only the host's own notification is waiting for a retry (the booking itself is fully synchronised). */
export const OWNER_RETRY_NOTE = "A notification to the host will be retried.";
