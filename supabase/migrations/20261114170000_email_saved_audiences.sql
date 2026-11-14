create table public.email_saved_audiences (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  search_query text not null default '' check (char_length(search_query) <= 254),
  tag_ids uuid[] not null default '{}'
);

alter table public.email_saved_audiences enable row level security;
revoke all on public.email_saved_audiences from public, anon, authenticated;
grant select, insert, update, delete on public.email_saved_audiences to service_role;
