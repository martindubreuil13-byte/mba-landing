create table public.contact_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 48),
  normalized_name text generated always as (lower(btrim(name))) stored unique
);
create table public.contact_tag_assignments (
  lead_id uuid not null references public.leads(id) on delete cascade,
  tag_id uuid not null references public.contact_tags(id) on delete cascade,
  primary key (lead_id, tag_id)
);
create index contact_tag_assignments_tag_idx on public.contact_tag_assignments (tag_id, lead_id);
alter table public.contact_tags enable row level security;
alter table public.contact_tag_assignments enable row level security;
revoke all on public.contact_tags, public.contact_tag_assignments from public, anon, authenticated, service_role;
grant select, insert on public.contact_tags to service_role;
grant select, insert, delete on public.contact_tag_assignments to service_role;
