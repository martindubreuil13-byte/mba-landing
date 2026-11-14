alter table public.leads
  add column last_name text,
  add column contact_archived_at timestamptz,
  add column contact_email_changed_at timestamptz;

create unique index leads_normalized_email_unique on public.leads (lower(btrim(email)));

create function public.track_contact_email_change() returns trigger
language plpgsql set search_path = '' as $$
begin
  if lower(btrim(old.email)) is distinct from lower(btrim(new.email)) then
    new.contact_email_changed_at := clock_timestamp();
  end if;
  return new;
end;
$$;

create trigger track_contact_email_change before update of email on public.leads
for each row execute function public.track_contact_email_change();
