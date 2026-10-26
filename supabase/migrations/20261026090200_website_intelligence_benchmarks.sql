-- Website Intelligence v1: AI recommendation / citation benchmark FOUNDATION. Manual recording only.
-- Nothing here calls any AI provider; results are entered by a person (or imported) with the method noted. Completely
-- separate from visitor analytics tables. Service-role access only.

create table public.wi_benchmark_questions (
  id         uuid primary key default gen_random_uuid(),
  question   text not null check (char_length(question) between 5 and 500),
  topic      text,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.wi_benchmark_results (
  id            uuid primary key default gen_random_uuid(),
  question_id   uuid not null references public.wi_benchmark_questions (id) on delete cascade,
  -- Which assistant and exactly how it was asked, so results are comparable and reproducible by a human.
  platform      text not null check (char_length(platform) between 2 and 60),
  model_label   text,
  method        text not null default 'manual' check (method in ('manual', 'import')),
  asked_on      date not null default current_date,
  -- Observations (null = not assessed). These describe ONE recorded answer, not all answers an assistant gives.
  mentions_business   boolean,
  mentions_martin     boolean,
  cites_site          boolean,
  recommends_business boolean,
  positioning         text check (positioning in ('accurate', 'partial', 'inaccurate')),
  cited_urls    text[] not null default '{}',
  excerpt       text check (excerpt is null or char_length(excerpt) <= 1500),
  notes         text check (notes is null or char_length(notes) <= 1500),
  recorded_at   timestamptz not null default now()
);
create index wi_benchmark_results_question_idx on public.wi_benchmark_results (question_id, asked_on desc);
create index wi_benchmark_results_platform_idx on public.wi_benchmark_results (platform, asked_on desc);

alter table public.wi_benchmark_questions enable row level security;
alter table public.wi_benchmark_results enable row level security;

-- ROLLBACK:
--   drop table if exists public.wi_benchmark_results, public.wi_benchmark_questions;
