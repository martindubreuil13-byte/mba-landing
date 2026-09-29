-- Free Resources + Lead Capture system: core schema
create extension if not exists pgcrypto;

-- ============================================================
-- RESOURCES
-- ============================================================
create table if not exists resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  short_description text not null,
  long_description text,
  resource_type text not null,
  audience text,
  file_path text not null,
  file_name text not null,
  cover_image_path text,
  published boolean not null default false,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists resources_slug_idx on resources (slug);
create index if not exists resources_published_idx on resources (published);

-- ============================================================
-- LEADS
-- email is the dedup key: one row per person, upserted across
-- every resource request. ongoing_content_opt_in is only ever
-- flipped true->false by an explicit, separate withdrawal action
-- (never by a returning visitor simply leaving the box unchecked).
-- ============================================================
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  email text not null unique,
  country text,
  ongoing_content_opt_in boolean not null default false,
  ongoing_content_opt_in_at timestamptz,
  ongoing_content_opt_out_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_email_idx on leads (email);
create index if not exists leads_opt_in_idx on leads (ongoing_content_opt_in);

-- ============================================================
-- RESOURCE REQUESTS
-- One row per (lead, download event). A lead requesting the same
-- resource twice, or a different resource, always adds a new row
-- here -- it never creates a new lead.
-- ============================================================
create table if not exists resource_requests (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads (id) on delete cascade,
  resource_id uuid not null references resources (id) on delete cascade,
  requested_at timestamptz not null default now(),
  opted_in_this_request boolean not null default false,
  source text,
  campaign text,
  medium text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text
);

create index if not exists resource_requests_lead_idx on resource_requests (lead_id);
create index if not exists resource_requests_resource_idx on resource_requests (resource_id);
create index if not exists resource_requests_requested_at_idx on resource_requests (requested_at);

-- ============================================================
-- updated_at maintenance
-- ============================================================
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists resources_set_updated_at on resources;
create trigger resources_set_updated_at
before update on resources
for each row execute function set_updated_at();

drop trigger if exists leads_set_updated_at on leads;
create trigger leads_set_updated_at
before update on leads
for each row execute function set_updated_at();

-- ============================================================
-- Row Level Security
-- Locked down by default: no anon/authenticated policies at all.
-- All application access goes through the Next.js server using the
-- service_role key (which bypasses RLS). Nothing here is queryable
-- directly by a browser client.
-- ============================================================
alter table resources enable row level security;
alter table leads enable row level security;
alter table resource_requests enable row level security;

-- ============================================================
-- Storage buckets
-- resource-covers: public read (needed for OG/social preview images
--   and visible thumbnails) -- covers are never sensitive.
-- resource-files: fully private. Downloads are only ever issued via
--   short-lived signed URLs generated server-side after a lead is
--   captured. No public or authenticated policy exists for it, so
--   only the service_role key (server-only) can read/write it.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('resource-covers', 'resource-covers', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('resource-files', 'resource-files', false)
on conflict (id) do nothing;

drop policy if exists "Public read access to resource covers" on storage.objects;
create policy "Public read access to resource covers"
on storage.objects for select
using (bucket_id = 'resource-covers');
;
