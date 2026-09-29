-- Pick My Brain: site search analytics and Ask Martin questions.
-- Searches deliberately store no IP, user agent or identity — only the
-- query and what happened. Name/email exist only on pmb_questions, and
-- only when a visitor voluntarily submits Ask Martin.
create table public.pmb_searches (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  query text not null,
  normalized_query text not null,
  matched boolean not null,
  result_count integer not null default 0,
  results jsonb not null default '[]'::jsonb,
  top_href text,
  clicked_href text,
  clicked_at timestamptz,
  page_path text
);

create index pmb_searches_created_at_idx on public.pmb_searches (created_at desc);
create index pmb_searches_normalized_query_idx on public.pmb_searches (normalized_query);

create table public.pmb_questions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  question text not null,
  name text not null,
  email text not null,
  search_id uuid references public.pmb_searches(id) on delete set null,
  page_path text,
  email_sent boolean not null default false
);

create index pmb_questions_created_at_idx on public.pmb_questions (created_at desc);

-- Same model as the other tables: RLS on, no policies, so only the
-- server's service-role client can read or write.
alter table public.pmb_searches enable row level security;
alter table public.pmb_questions enable row level security;
;
