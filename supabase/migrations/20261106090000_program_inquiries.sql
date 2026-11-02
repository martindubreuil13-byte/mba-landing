-- Stored program inquiries and booking origins (additive, nothing existing is altered or dropped).
--
-- Until now /api/qualify only e-mailed the owner and kept nothing. With PROGRAM_INQUIRY_STORE_ENABLED on, each accepted inquiry is a durable row
-- here, the person is a row in `leads` (unchanged table, no marketing consent implied), and the owner / visitor e-mails are tracked so a retry
-- can never create a second row or a second e-mail.
--
-- Safe to apply before any code uses it: nothing reads or writes this table while the flag is off, and the previous release ignores it.
-- Rollback = switch the flags off (the table may stay). Dropping is possible only before booking_origins (Phase 2b) exists:
--   drop table if exists public.program_inquiries;
--
-- Access is server-only (service_role). RLS is enabled with no policies, so the browser roles can read and write nothing.

create table if not exists public.program_inquiries (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  -- Resolved from the program catalog on the server (never a client-supplied name or price); null = no program chosen.
  program_slug text,
  full_name text not null,
  situation text,
  -- The visitor's words. Blanked (not deleted) by the retention job; see message_purged_at.
  message text not null default '',
  attribution jsonb not null default '{}'::jsonb,
  -- Opaque, random, carries no personal data. Goes into the booking link; the booking page exchanges it for the visitor's own name and e-mail.
  booking_ref text not null,
  -- Retry safety: one submission, one row. Chosen by the browser per form (or derived on the server when absent).
  idempotency_key text not null,
  content_hash text not null,
  -- Owner notification: pending -> sending -> accepted | failed. 'failed' stays visible in admin and a retry may send again.
  owner_status text not null default 'pending' check (owner_status in ('pending', 'sending', 'accepted', 'failed')),
  owner_claimed_at timestamptz,
  -- Counts definite failures only; part of the provider idempotency key so a crash-and-retry reuses the same key.
  owner_attempts integer not null default 0,
  owner_message_id text,
  owner_error text,
  owner_accepted_at timestamptz,
  -- Visitor auto-reply: sent at most once. A failure never fails the inquiry.
  auto_reply_status text not null default 'pending' check (auto_reply_status in ('pending', 'sending', 'accepted', 'failed')),
  auto_reply_message_id text,
  auto_reply_error text,
  message_purged_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists program_inquiries_booking_ref_key on public.program_inquiries(booking_ref);
create unique index if not exists program_inquiries_idempotency_key_key on public.program_inquiries(idempotency_key);
create index if not exists program_inquiries_lead_idx on public.program_inquiries(lead_id);
create index if not exists program_inquiries_created_idx on public.program_inquiries(created_at desc);
-- The retention job and the admin "needs attention" view look at the unfinished minority.
create index if not exists program_inquiries_unpurged_idx on public.program_inquiries(created_at) where message_purged_at is null;
create index if not exists program_inquiries_owner_open_idx on public.program_inquiries(owner_status) where owner_status <> 'accepted';

drop trigger if exists program_inquiries_set_updated_at on public.program_inquiries;
create trigger program_inquiries_set_updated_at before update on public.program_inquiries
for each row execute function set_updated_at();

alter table public.program_inquiries enable row level security;
-- Intentionally no browser policies. Access is server-only through service_role.

-- Phase 2b: which inquiry or Transition application a booking came from. One row per booking (the booking id is the key), written after the booking
-- is committed and only when the booking page presented a valid, signed context (never a raw reference, which is not stored anywhere here).
-- A reschedule or cancellation changes the booking row itself, so this link keeps pointing at the right booking. Deleting an inquiry or application
-- leaves the booking and its link row, with the origin cleared.
create table if not exists public.booking_origins (
  booking_id uuid primary key references public.sched_bookings(id) on delete cascade,
  origin_type text not null check (origin_type in ('application', 'inquiry')),
  application_id uuid references public.program_applications(id) on delete set null,
  inquiry_id uuid references public.program_inquiries(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  linked_at timestamptz not null default now(),
  check (application_id is null or inquiry_id is null)
);
create index if not exists booking_origins_inquiry_idx on public.booking_origins(inquiry_id) where inquiry_id is not null;
create index if not exists booking_origins_application_idx on public.booking_origins(application_id) where application_id is not null;
alter table public.booking_origins enable row level security;
-- Intentionally no browser policies. Access is server-only through service_role.
