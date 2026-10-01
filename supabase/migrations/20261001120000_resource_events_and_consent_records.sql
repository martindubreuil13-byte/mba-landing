-- Resource lead-capture foundation (pilot: Build the Bridge First).
--
-- ADDITIVE ONLY: two new tables, new nullable / defaulted columns on existing
-- tables, and inserts into the new consent_records table. No existing column is
-- altered, dropped or rewritten, and no existing consent value is changed.
--
-- Shared by every resource type (guides now; surveys, assessments and tools
-- later). Nothing here is guide-specific.

-- ============================================================
-- leads: lead workflow status + activity + suppression
--
-- Three concepts are deliberately kept apart:
--   lead_status      -> sales/relationship workflow (this column)
--   consent status   -> DERIVED in code from ongoing_content_opt_in(+_at/_out_at),
--                       consent_requested_at and suppressed_at; never stored twice,
--                       so it cannot drift
--   resource activity-> resource_events / resource_requests
-- ============================================================
alter table public.leads
  add column if not exists lead_status text not null default 'new',
  add column if not exists last_activity_at timestamptz,
  add column if not exists suppressed_at timestamptz,
  add column if not exists suppression_reason text,
  -- Set when an explicit opt-in request is awaiting email confirmation (confirmed opt-in).
  -- Marketing is only active once ongoing_content_opt_in becomes true.
  add column if not exists consent_requested_at timestamptz;

alter table public.leads
  drop constraint if exists leads_lead_status_check;
alter table public.leads
  add constraint leads_lead_status_check
  check (lead_status in ('new', 'engaged', 'qualified', 'contacted', 'converted', 'archived'));

-- Existing rows: last activity is the later of the lead's own update time and
-- any resource request. Does not touch consent columns.
update public.leads l
set last_activity_at = greatest(
  l.updated_at,
  coalesce((select max(r.requested_at) from public.resource_requests r where r.lead_id = l.id), l.updated_at)
)
where l.last_activity_at is null;

-- ============================================================
-- resource_requests: attribution + delivery tracking
--
-- delivery_status is the EMAIL state only (not lead status, not consent):
--   not_tracked  rows that predate delivery tracking (default for old rows)
--   accepted     our app accepted the request, email not yet handed to Resend
--   queued       Resend API accepted the message and returned an id
--   sent         provider webhook: email.sent
--   delivered    provider webhook: email.delivered  (only this means delivered)
--   bounced      provider webhook: email.bounced
--   failed       Resend API error, or webhook email.failed / suppressed
-- ============================================================
alter table public.resource_requests
  add column if not exists resource_action text not null default 'download',
  add column if not exists session_id text,
  add column if not exists cta_location text,
  add column if not exists source_page_url text,
  add column if not exists delivery_status text not null default 'not_tracked',
  add column if not exists delivery_provider_id text,
  add column if not exists delivery_error text,
  add column if not exists delivery_updated_at timestamptz,
  add column if not exists download_count integer not null default 0,
  add column if not exists first_download_at timestamptz,
  add column if not exists last_download_at timestamptz;

alter table public.resource_requests
  drop constraint if exists resource_requests_delivery_status_check;
alter table public.resource_requests
  add constraint resource_requests_delivery_status_check
  check (delivery_status in ('not_tracked', 'accepted', 'queued', 'sent', 'delivered', 'bounced', 'failed'));

create index if not exists resource_requests_delivery_provider_idx
  on public.resource_requests (delivery_provider_id) where delivery_provider_id is not null;

-- ============================================================
-- consent_records: append-only evidence log.
-- One row per consent EVENT. Rows are never updated.
--   opt_in_requested  explicit form submission; marketing NOT yet active (pending)
--   opt_in            consent is active: email confirmation, or legacy / checkbox consent
--   opt_out           unsubscribe, cancelled pending request, or spam complaint
-- The wording column stores the exact text displayed, so wording can change
-- later (or become a checkbox) without touching this model.
-- Evidence columns are nullable: legacy rows honestly record what is unknown.
-- ============================================================
create table if not exists public.consent_records (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  action text not null check (action in ('opt_in_requested', 'opt_in', 'opt_out')),
  wording_version text not null,
  wording_text text,
  method text not null check (method in ('button_disclosure', 'checkbox', 'email_confirmation', 'unsubscribe_link', 'spam_complaint', 'legacy')),
  -- For an email_confirmation opt_in: the opt_in_requested row it confirms.
  related_record_id uuid references public.consent_records (id) on delete set null,
  source_type text,
  source_resource_id uuid references public.resources (id) on delete set null,
  source_url text,
  cta_location text,
  ip_hash text,
  user_agent_hash text,
  created_at timestamptz not null default now()
);

create index if not exists consent_records_lead_idx on public.consent_records (lead_id, created_at desc);

create or replace function public.consent_records_block_update()
returns trigger
language plpgsql
as $$
begin
  raise exception 'consent_records is append-only';
end;
$$;

drop trigger if exists consent_records_no_update on public.consent_records;
create trigger consent_records_no_update
before update on public.consent_records
for each row execute function public.consent_records_block_update();

alter table public.consent_records enable row level security;

-- Legacy history: one honest row per existing consent fact. Wording, source,
-- method evidence, CTA, IP and user agent are unknown and are left NULL; the
-- timestamp is the one already stored on the lead. Nothing is invented.
insert into public.consent_records (lead_id, action, wording_version, method, created_at)
select l.id, 'opt_in', 'legacy', 'legacy', l.ongoing_content_opt_in_at
from public.leads l
where l.ongoing_content_opt_in_at is not null
  and not exists (select 1 from public.consent_records c where c.lead_id = l.id and c.wording_version = 'legacy' and c.action = 'opt_in');

insert into public.consent_records (lead_id, action, wording_version, method, created_at)
select l.id, 'opt_out', 'legacy', 'legacy', l.ongoing_content_opt_out_at
from public.leads l
where l.ongoing_content_opt_out_at is not null
  and not exists (select 1 from public.consent_records c where c.lead_id = l.id and c.wording_version = 'legacy' and c.action = 'opt_out');

-- ============================================================
-- resource_events: shared event stream (anonymous + identified).
-- Works for any resource type. No email, name or IP is stored here; page_url
-- is path-only (no query string). session_id is a random per-browser-tab
-- identifier generated client-side.
-- ============================================================
create table if not exists public.resource_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null check (event_name ~ '^resource_[a-z_]+$'),
  resource_id uuid not null references public.resources (id) on delete cascade,
  resource_slug text not null,
  resource_type text not null,
  session_id text,
  lead_id uuid references public.leads (id) on delete set null,
  request_id uuid references public.resource_requests (id) on delete set null,
  cta_location text,
  page_url text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  device_type text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists resource_events_resource_time_idx on public.resource_events (resource_id, created_at desc);
create index if not exists resource_events_session_idx on public.resource_events (session_id, resource_id, event_name);
create index if not exists resource_events_lead_idx on public.resource_events (lead_id) where lead_id is not null;

alter table public.resource_events enable row level security;

-- Same access model as every other table: RLS on, no policies; only the
-- server's service-role client can read or write.
