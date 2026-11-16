-- Publications: books and similar long-form works shown at /publications.
-- Additive only. Independent of `resources` (which is a gated-download lead magnet and requires a file).
--
-- Access model: RLS is ON with NO policies and every privilege is revoked from anon/authenticated,
-- so the table is reachable only through the server-only service-role client (same pattern as the
-- other MBA tables). The public site reads published rows with an explicit column list.

create extension if not exists pgcrypto;

create table if not exists publications (
  id uuid primary key default gen_random_uuid(),

  -- Identity
  slug text not null,
  title text not null,
  subtitle text,
  author text,

  -- Public text
  introduction text,
  description text,
  readership text,
  themes jsonb not null default '[]'::jsonb,

  -- Bibliographic facts (all optional; never invented)
  availability text not null default 'forthcoming',
  publication_year smallint,
  publication_date date,
  publisher text,
  language text,
  editions jsonb not null default '[]'::jsonb,      -- [{ "format": "Paperback", "isbn": "9780000000000" | null }]
  retailers jsonb not null default '[]'::jsonb,     -- [{ "name": "...", "url": "https://..." }], array order = display order
  related jsonb not null default '[]'::jsonb,       -- ["/thinking/...", "/answers/...", "/work/..."] local paths only

  -- Cover. The original lives in the private bucket and is only ever shown to the admin through a short-lived
  -- signed URL. The public derivatives (resource-covers/publications/<id>/<version>/...) exist ONLY while the
  -- title is published (enforced by publications_public_cover_only_when_published).
  cover_source_path text,
  cover_path text,
  cover_thumb_path text,
  cover_width integer,
  cover_height integer,
  cover_alt text,

  -- Lifecycle (availability and publication state are independent)
  published boolean not null default false,
  published_at timestamptz,
  featured boolean not null default false,
  sort_order integer not null default 0,

  revision integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint publications_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 2 and 80),
  constraint publications_title_length check (char_length(btrim(title)) between 1 and 200),
  constraint publications_subtitle_length check (subtitle is null or char_length(subtitle) <= 300),
  constraint publications_author_length check (author is null or char_length(author) <= 200),
  constraint publications_introduction_length check (introduction is null or char_length(introduction) <= 2000),
  constraint publications_description_length check (description is null or char_length(description) <= 12000),
  constraint publications_readership_length check (readership is null or char_length(readership) <= 600),
  constraint publications_publisher_length check (publisher is null or char_length(publisher) <= 200),
  constraint publications_language_format check (language is null or language ~ '^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$'),
  constraint publications_cover_alt_length check (cover_alt is null or char_length(cover_alt) <= 300),
  constraint publications_availability_values check (availability in ('forthcoming', 'available')),
  constraint publications_year_range check (publication_year is null or publication_year between 1400 and 2200),

  -- Bounded arrays. Element-level validation happens in the application and again whenever stored data is read.
  constraint publications_themes_shape check (jsonb_typeof(themes) = 'array' and jsonb_array_length(themes) <= 12 and octet_length(themes::text) <= 2000),
  constraint publications_editions_shape check (jsonb_typeof(editions) = 'array' and jsonb_array_length(editions) <= 10 and octet_length(editions::text) <= 4000),
  constraint publications_retailers_shape check (jsonb_typeof(retailers) = 'array' and jsonb_array_length(retailers) <= 20 and octet_length(retailers::text) <= 12000),
  constraint publications_retailers_https check (not jsonb_path_exists(retailers, '$[*] ? (!(@.url like_regex "^https://"))')),
  constraint publications_related_shape check (jsonb_typeof(related) = 'array' and jsonb_array_length(related) <= 12 and octet_length(related::text) <= 3000),
  constraint publications_related_local check (not jsonb_path_exists(related, '$[*] ? (!(@ like_regex "^/[a-z0-9/-]+$"))')),

  -- Cover columns move together.
  constraint publications_cover_dimensions check (
    (cover_source_path is null and cover_width is null and cover_height is null)
    or (cover_source_path is not null and cover_width between 1 and 20000 and cover_height between 1 and 20000)
  ),
  constraint publications_public_cover_only_when_published check (
    published or (cover_path is null and cover_thumb_path is null)
  ),
  constraint publications_public_cover_needs_source check (
    (cover_path is null and cover_thumb_path is null) or (cover_source_path is not null and cover_path is not null and cover_thumb_path is not null)
  ),

  -- Published rows carry complete public text (the application also checks, with friendlier messages).
  constraint publications_published_complete check (
    not published or (
      char_length(btrim(coalesce(author, ''))) > 0
      and char_length(btrim(coalesce(introduction, ''))) > 0
      and char_length(btrim(coalesce(description, ''))) > 0
    )
  ),
  -- Only a published title can be the featured one.
  constraint publications_featured_implies_published check (not featured or published)
);

-- Slug is unique (the check above already forces lower-case, the index makes that explicit and case-insensitive).
create unique index if not exists publications_slug_key on publications (lower(slug));
-- At most one featured title, ever.
create unique index if not exists publications_single_featured on publications ((true)) where featured;
create index if not exists publications_catalogue_idx on publications (sort_order, created_at, id) where published;

-- ---------------------------------------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------------------------------------

-- New titles go to the end of the catalogue. Serialised so two simultaneous creates cannot share a position.
create or replace function publications_before_insert()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  perform pg_advisory_xact_lock(hashtext('publications_order'));
  select coalesce(max(sort_order), -1) + 1 into new.sort_order from publications;
  new.revision := 1;
  return new;
end;
$$;

-- `revision` is the optimistic-concurrency token. It is bumped by the database on every change to the
-- title itself (content, publication state, cover) and NOT by a pure re-ordering, so moving a title in the
-- catalogue never makes someone's open edit form stale. Clients cannot set it.
create or replace function publications_before_update()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if (to_jsonb(new) - 'sort_order' - 'updated_at' - 'revision' - 'published_at')
     is distinct from (to_jsonb(old) - 'sort_order' - 'updated_at' - 'revision' - 'published_at') then
    new.revision := old.revision + 1;
    new.updated_at := now();
  else
    new.revision := old.revision;
    new.updated_at := old.updated_at;
  end if;
  if new.published and not old.published and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists publications_before_insert_trg on publications;
create trigger publications_before_insert_trg
before insert on publications
for each row execute function publications_before_insert();

drop trigger if exists publications_before_update_trg on publications;
create trigger publications_before_update_trg
before update on publications
for each row execute function publications_before_update();

-- ---------------------------------------------------------------------------------------------------------
-- Atomic operations (called only by the server with the service-role key)
-- ---------------------------------------------------------------------------------------------------------

-- Makes exactly one title featured (or clears the feature). Single transaction: there is never a moment with
-- two featured titles, and a feature can never be left on an unpublished title.
create or replace function set_featured_publication(p_id uuid, p_featured boolean)
returns void
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_published boolean;
begin
  perform pg_advisory_xact_lock(hashtext('publications_featured'));

  select published into v_published from publications where id = p_id for update;
  if not found then
    raise exception 'publication_not_found';
  end if;

  if p_featured then
    if not v_published then
      raise exception 'publication_not_published';
    end if;
    update publications set featured = false where featured and id <> p_id;
    update publications set featured = true where id = p_id and not featured;
  else
    update publications set featured = false where id = p_id and featured;
  end if;
end;
$$;

-- Re-orders the whole catalogue in one transaction. `p_expected` is the order the admin was looking at; if the
-- catalogue has changed since (a title added/removed or moved elsewhere) nothing is written and the caller
-- gets `publication_list_stale`.
create or replace function reorder_publications(p_expected uuid[], p_desired uuid[])
returns void
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_current uuid[];
begin
  perform pg_advisory_xact_lock(hashtext('publications_order'));

  select coalesce(array_agg(id order by sort_order, created_at, id), '{}'::uuid[]) into v_current from publications;

  if v_current is distinct from p_expected then
    raise exception 'publication_list_stale';
  end if;
  if coalesce(array_length(p_desired, 1), 0) <> coalesce(array_length(v_current, 1), 0)
     or exists (select 1 from unnest(p_desired) d group by d having count(*) > 1)
     or exists (select 1 from unnest(p_desired) d where d <> all (v_current)) then
    raise exception 'publication_order_invalid';
  end if;

  update publications p
  set sort_order = o.position - 1
  from unnest(p_desired) with ordinality as o(id, position)
  where p.id = o.id and p.sort_order is distinct from o.position - 1;
end;
$$;

-- ---------------------------------------------------------------------------------------------------------
-- Privileges: nothing for anon / authenticated, ever.
-- ---------------------------------------------------------------------------------------------------------
alter table publications enable row level security;
revoke all on table publications from anon, authenticated;
grant all on table publications to service_role;

revoke all on function publications_before_insert() from public, anon, authenticated;
revoke all on function publications_before_update() from public, anon, authenticated;
revoke all on function set_featured_publication(uuid, boolean) from public, anon, authenticated;
revoke all on function reorder_publications(uuid[], uuid[]) from public, anon, authenticated;
grant execute on function set_featured_publication(uuid, boolean) to service_role;
grant execute on function reorder_publications(uuid[], uuid[]) to service_role;

-- ---------------------------------------------------------------------------------------------------------
-- Storage: private bucket for the (sanitised) cover originals. No storage policies exist for it, so only the
-- service-role key can read or write it; the admin sees a cover through a short-lived signed URL.
-- Public derivatives are written to the existing public `resource-covers` bucket under publications/<id>/.
-- ---------------------------------------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('publication-assets', 'publication-assets', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
