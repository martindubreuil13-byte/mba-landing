/** MBA Scheduling: shared types. Everything stored is plain JSON so the prototype file store and a future Supabase table share one shape. */

/** A wall-clock span in the administrator's home zone, "HH:MM" - "HH:MM". */
export type TimeWindow = { start: string; end: string };

export type Availability = {
  /** Working windows per weekday, 0 = Sunday ... 6 = Saturday. A missing or empty day is closed. */
  weekly: Record<string, TimeWindow[]>;
  /** Recurring daily gaps removed from every working window (lunch and so on). */
  breaks: TimeWindow[];
  /** Whole days with no availability, "YYYY-MM-DD" in the home zone. */
  daysOff: string[];
  /** Date-specific replacement of that day's working windows ("YYYY-MM-DD" -> windows). */
  overrides: Record<string, TimeWindow[]>;
  /** How far ahead (in home-zone days, counting today) a visitor can book. */
  bookingWindowDays: number;
};

export type MeetingFormat = "zoom";
export type Visibility = "public" | "invitation";

export type MeetingType = {
  id: string;
  slug: string;
  name: string;
  description: string;
  durationMinutes: number;
  format: MeetingFormat;
  /** Shown to visitors, for example "Complimentary". Optional: pricing is not part of Phase 1. */
  priceLabel?: string;
  visibility: Visibility;
  /** Required in the link (?invite=) for invitation-only types. Never sent to visitors. */
  inviteCode?: string;
  availability: Availability;
  minNoticeHours: number;
  /** One of BUFFER_OPTIONS. Free time kept clear before / after this meeting, against EVERY other meeting type and Google event. */
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  /** null = unlimited. Counted per home-zone day across confirmed bookings of this type. */
  maxPerDay: number | null;
  /** Spacing between offered start times. */
  slotIntervalMinutes: number;
  /** An inactive type has no public page and is kept for history. */
  active: boolean;
};

export type CommunityState = "unseen" | "shown" | "declined" | "joined" | "dismissed";

export type BookingEvent = { at: string; kind: "created" | "rescheduled" | "canceled" | "confirmation_resent" | "calendar_conflict"; detail: string };

export type Booking = {
  id: string;
  /** Opaque 144-bit token. It is the only thing in a public URL: no name, email or sequence number. */
  reference: string;
  meetingTypeId: string;
  startUtc: string;
  endUtc: string;
  guestName: string;
  guestEmail: string;
  guestMessage: string;
  /** The zone the guest chose, used to show their confirmation in their own time. */
  guestTimeZone: string;
  status: "confirmed" | "canceled";
  /** Where the visitor came from, when the link said so (?source=). */
  source: string | null;
  /** Projection of the Zoom external reference: simulated (mock), ready (real), pending (not created yet), failed (gave up). */
  zoom: { status: "simulated" | "ready" | "pending" | "failed"; meetingId: string | null; joinUrl: string | null; /** Set while a create call has no known outcome: Zoom may already hold a meeting for this booking. */ uncertainSince?: string | null };
  community: { state: CommunityState; at?: string };
  idempotencyKey: string;
  createdAt: string;
  events: BookingEvent[];
  /** Bumped on every reschedule and cancellation. External systems and emails are synchronised per version. */
  version?: number;
  /** The buffers in force when it was booked. Later edits to the meeting type never move an existing booking. */
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
  /** Synchronisation with Zoom, Google Calendar and email (see sync.ts). */
  sync?: SyncState;
  /** Fingerprint of the request that created it, so a reused idempotency key with different content is refused. */
  requestHash?: string;
  /** True for the seeded sample bookings. */
  demo?: boolean;
};

export type SyncState = { status: "ok" | "pending" | "failed"; attempts: number; nextAttemptAt: string | null; lastError: string | null };

export type ExternalProvider = "google" | "zoom";
/** The booking's counterpart in an external system: one Google Calendar event, one Zoom meeting. */
export type ExternalRef = {
  bookingId: string;
  provider: ExternalProvider;
  externalId: string | null;
  url: string | null;
  status: "pending" | "synced" | "failed" | "deleted";
  /** The booking version this reference was last brought up to date with. */
  syncedVersion: number;
  etag?: string | null;
  /** What the external object currently reflects (booking version + Zoom link), so we know when it is stale. */
  contentKey?: string | null;
  attempts: number;
  lastError: string | null;
  updatedAt: string;
  /** Zoom only: when a create call was last STARTED and has no recorded outcome yet. A crash or lost response leaves it set, which tells recovery to look for the meeting before creating another. */
  createIntentAt?: string | null;
  /** Zoom only: how many create calls ended with an unknown outcome (timeout, lost response, 5xx). Bounded: recovery stops creating and asks a human. */
  createUnknown?: number;
};

export type GuestEmailKind = "confirmation" | "confirmation_resend" | "reschedule" | "cancellation" | "zoom_details";
/** Notifications to the owner (the host). Separate messages, separate templates, tracked and retried independently of the guest's. */
export type OwnerEmailKind = "owner_new_booking" | "owner_rescheduled" | "owner_canceled";
export type EmailKind = GuestEmailKind | OwnerEmailKind;
export type EmailAttempt = {
  id: string;
  bookingId: string;
  kind: EmailKind;
  version: number;
  to: string;
  status: "accepted" | "failed";
  providerMessageId: string | null;
  error: string | null;
  includedZoom: boolean;
  idempotencyKey: string;
  deliveryStatus?: "delivered" | "bounced" | "failed" | null;
  attemptedAt: string;
};

export type ActivityKind =
  | "booking_created" | "booking_canceled" | "booking_rescheduled" | "confirmation_resent"
  | "meeting_type_saved" | "availability_saved" | "settings_saved" | "community_choice" | "zoom_failed" | "sync_failed" | "owner_notification_failed" | "zoom_review" | "calendar_conflict" | "google_connected" | "prototype_reset";
export type ActivityEntry = { id: string; at: string; kind: ActivityKind; summary: string; bookingId?: string };

/** A message that WOULD have been sent. Phase 1 never sends email; this is its record. */
export type OutboxMessage = { id: string; at: string; kind: EmailKind; bookingId: string; to: string; subject: string; body: string; simulated: boolean };

export type ConsentRecord = { id: string; at: string; bookingId: string; email: string; choice: "joined" | "declined" | "dismissed"; wordingVersion: string; wording: string; /** Where the answer was given, for example "booking_confirmation". */ source: string; simulated: boolean };

export type Settings = {
  homeTimeZone: string;
  /** Prototype switches that make the reliability paths visible. */
  simulate: { googleOutage: boolean; zoomFailure: boolean };
  /** When owner notifications were first switched on. Only transitions at or after it can produce an owner message (see SchedulingRepository.activateOwnerNotifications). */
  ownerNotifySince?: string | null;
};

export type SchedulingData = {
  version: 1;
  settings: Settings;
  meetingTypes: MeetingType[];
  bookings: Booking[];
  activity: ActivityEntry[];
  outbox: OutboxMessage[];
  consents: ConsentRecord[];
  /** idempotency key -> booking id */
  idempotency: Record<string, string>;
  externalRefs?: ExternalRef[];
  emailAttempts?: EmailAttempt[];
  /** Zoom meetings condemned for deletion (see SchedulingRepository.condemnZoomMeeting). */
  zoomTombstones?: Array<{ externalId: string; bookingId: string; reason: string; status: "pending" | "deleted" }>;
  /** Webhook inbox: "provider|key" -> state of that delivery (see SchedulingRepository.beginWebhook). */
  webhookSeen?: Record<string, WebhookEntry>;
  /** The recovery worker's last sweep. */
  lastSweep?: { at: string; summary: SweepSummary };
};

export type WebhookEntry = { status: "processing" | "processed" | "failed"; seenAt: string; claimedAt: string | null; attempts: number; token?: string | null; lastError?: string | null; processedAt?: string };

/** What one sweep of the recovery worker did. */
export type SweepSummary = { reconciled: number; processed: number; succeeded: number; failed: number; skipped: number; conflictsFlagged: number; /** When the calendar was last scanned for conflicts (the scan is rate limited). */ conflictScanAt: string | null; /** When the host's Zoom meetings were last scanned for duplicates (rate limited like the conflict scan). */ zoomScanAt?: string | null; zoomDuplicatesRemoved?: number; /** Meetings whose time or length in Zoom did not match the booking (re-queued for correction), and bookings re-queued because Zoom listed a meeting for them. */ zoomStaleFound?: number; zoomRequeued?: number; /** Recorded meetings whose time or length Zoom could not confirm (incomplete answer), and recorded meetings Zoom says no longer exist. Both are re-queued. */ zoomUnverified?: number; zoomMissing?: number };

/** [start, end) in epoch milliseconds. before / after are the buffers the event itself requires around it. */
export type BusyInterval = { start: number; end: number; before: number; after: number; label?: string };
export type Slot = { startUtc: string; endUtc: string };
