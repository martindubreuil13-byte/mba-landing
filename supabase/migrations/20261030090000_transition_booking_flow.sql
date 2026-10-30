-- Corporate Transition: direct-booking flow (no screening).
-- ADDITIVE and non-destructive. Nothing is dropped; historical assessment data and statuses are untouched.
--
-- 1. New applications carry no AI assessment, so the two NOT NULL assessment columns become nullable. Their CHECK
--    constraints still validate every value that is present (a NULL passes a CHECK).
-- 2. Opaque identifiers on the application:
--      booking_ref    goes into the Calendly link (utm_content) and comes back in Calendly's webhook payload; it is how
--                     a booking is matched to the application. Random, carries no personal data.
--      receipt_token  never leaves the applicant's browser; lets the confirmation screen be restored after a refresh
--                     and authorises the optional community choice. Kept apart from booking_ref because Calendly sees that one.
-- 3. community_choice records what the applicant clicked on the confirmation screen (consent itself lives in
--    leads + consent_records, as for every other form).
-- 4. meeting_at is the start of the booked conversation (summary of program_bookings).
-- 5. program_invitation_sends: one row per attempt to email the booking invitation (first send, manual resends).
-- 6. program_bookings: one row per Calendly invitee, written only from verified Calendly webhook events.

alter table public.program_applications
  alter column ai_route drop not null,
  alter column ai_confidence drop not null;

alter table public.program_applications
  add column if not exists booking_ref text,
  add column if not exists receipt_token text,
  add column if not exists community_choice text,
  add column if not exists community_choice_at timestamptz,
  add column if not exists meeting_at timestamptz;

alter table public.program_applications
  drop constraint if exists program_applications_community_choice_check;
alter table public.program_applications
  add constraint program_applications_community_choice_check
  check (community_choice is null or community_choice in ('declined', 'joined', 'confirmation_sent', 'confirmation_failed', 'not_applied'));

create unique index if not exists program_applications_booking_ref_key on public.program_applications(booking_ref) where booking_ref is not null;
create unique index if not exists program_applications_receipt_token_key on public.program_applications(receipt_token) where receipt_token is not null;

create table if not exists public.program_invitation_sends (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.program_applications(id) on delete cascade,
  -- initial = the first SUCCESSFUL invitation; resend = any later one. A failed first attempt stays 'initial' until one is accepted.
  kind text not null check (kind in ('initial', 'resend')),
  -- accepted = the email provider took the message; failed = it (or the environment's email policy) refused it.
  status text not null check (status in ('pending', 'accepted', 'failed')),
  provider_message_id text,
  error text,
  -- Final delivery outcome, set only from the signed Resend webhook. Null until the provider reports one.
  delivery_status text check (delivery_status is null or delivery_status in ('delivered', 'bounced', 'failed')),
  delivery_updated_at timestamptz,
  attempted_at timestamptz not null default now()
);
alter table public.program_invitation_sends drop constraint if exists program_invitation_sends_status_check;
alter table public.program_invitation_sends add constraint program_invitation_sends_status_check check (status in ('pending', 'accepted', 'failed'));
create unique index if not exists program_invitation_sends_pending_key on public.program_invitation_sends(application_id) where status = 'pending';
create index if not exists program_invitation_sends_application_idx on public.program_invitation_sends(application_id, attempted_at desc);
create index if not exists program_invitation_sends_provider_idx on public.program_invitation_sends(provider_message_id) where provider_message_id is not null;
alter table public.program_invitation_sends enable row level security;
-- Intentionally no browser policies. Access is server-only through service_role.

create table if not exists public.program_bookings (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.program_applications(id) on delete set null,
  booking_ref text,
  -- Calendly's own identifier of the invitee. Unique: a repeated webhook delivery updates this row, never adds one.
  calendly_invitee_uri text not null unique,
  calendly_event_uri text,
  status text not null check (status in ('active', 'canceled')),
  start_time timestamptz,
  end_time timestamptz,
  booked_at timestamptz,
  canceled_at timestamptz,
  -- true when this invitee was cancelled only because it was moved to a new time (the replacement is its own row).
  rescheduled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists program_bookings_application_idx on public.program_bookings(application_id);
drop trigger if exists program_bookings_set_updated_at on public.program_bookings;
create trigger program_bookings_set_updated_at before update on public.program_bookings
for each row execute function set_updated_at();
alter table public.program_bookings enable row level security;
-- Intentionally no browser policies. Access is server-only through service_role.
