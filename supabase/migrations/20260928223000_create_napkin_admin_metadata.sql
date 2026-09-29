create table if not exists public.napkin_admin_metadata (
  submission_id uuid primary key references public.napkin_submissions(id) on delete cascade,
  internal_status text not null default 'new' check (internal_status in (
    'new', 'reviewed', 'worth_contacting', 'contacted',
    'conversation_booked', 'not_currently_relevant', 'archived'
  )),
  private_notes text not null default '',
  updated_at timestamptz not null default now(),
  updated_by text
);

alter table public.napkin_admin_metadata enable row level security;

comment on table public.napkin_admin_metadata is
  'Private admin workflow state kept separate from immutable Napkin Principle submissions.';
