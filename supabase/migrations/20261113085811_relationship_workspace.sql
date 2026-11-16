-- Additive admin workspace. Roll back by disabling the UI before considering data removal.
alter table public.program_inquiries
  add column review_state text not null default 'new'
    check (review_state in ('new', 'reviewed', 'follow_up', 'closed'));

create table public.contact_tasks (
  id uuid primary key,
  lead_id uuid not null references public.leads(id) on delete cascade,
  inquiry_id uuid references public.program_inquiries(id) on delete set null,
  description text not null check (char_length(btrim(description)) between 1 and 1000),
  due_date date,
  created_at timestamptz not null default now(),
  created_by uuid not null,
  completed_at timestamptz
);
create index contact_tasks_lead_idx on public.contact_tasks (lead_id, created_at desc);
create index contact_tasks_open_due_idx on public.contact_tasks (due_date) where completed_at is null;
alter table public.contact_tasks enable row level security;
revoke all on public.contact_tasks from public, anon, authenticated, service_role;
grant select, insert, update on public.contact_tasks to service_role;
