-- Extensible program application records. People remain canonical in leads.
create table if not exists public.program_applications (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  program_key text not null,
  answers jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  ai_route text not null check (ai_route in ('INVITE', 'REVIEW', 'NOT_FIT')),
  ai_confidence text not null check (ai_confidence in ('HIGH', 'MEDIUM', 'LOW')),
  ai_reasoning jsonb not null default '[]'::jsonb,
  ai_concerns jsonb not null default '[]'::jsonb,
  ai_pre_call_summary text not null default '',
  status text not null check (status in ('INVITED', 'UNDER_REVIEW', 'NOT_FIT', 'BOOKED', 'DECLINED')),
  manual_decision text check (manual_decision is null or manual_decision in ('INVITE', 'CONCERN', 'DECLINE')),
  response_draft text,
  response_sent text,
  response_sent_at timestamptz,
  response_email_status text not null default 'not_sent' check (response_email_status in ('not_sent', 'queued', 'failed')),
  response_email_error text,
  applicant_email_status text not null default 'not_sent' check (applicant_email_status in ('not_sent', 'queued', 'failed')),
  applicant_email_error text,
  admin_notification_status text not null default 'not_sent' check (admin_notification_status in ('not_sent', 'queued', 'failed')),
  admin_notification_error text,
  booking_status text not null default 'unsupported' check (booking_status in ('unsupported', 'not_booked', 'booked')),
  booked_at timestamptz,
  attribution jsonb not null default '{}'::jsonb,
  marketing_consent_requested boolean not null default false,
  marketing_consent_requested_at timestamptz,
  idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists program_applications_lead_idx on public.program_applications(lead_id);
create index if not exists program_applications_program_submitted_idx on public.program_applications(program_key, submitted_at desc);
create index if not exists program_applications_status_idx on public.program_applications(program_key, status);

drop trigger if exists program_applications_set_updated_at on public.program_applications;
create trigger program_applications_set_updated_at before update on public.program_applications
for each row execute function set_updated_at();

alter table public.program_applications enable row level security;
-- Intentionally no browser policies. Access is server-only through service_role.
