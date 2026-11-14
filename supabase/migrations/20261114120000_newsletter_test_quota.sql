create table public.newsletter_test_attempts (attempted_at timestamptz not null);
alter table public.newsletter_test_attempts enable row level security;
revoke all on public.newsletter_test_attempts from public, anon, authenticated, service_role;
grant select, insert, delete on public.newsletter_test_attempts to service_role;

create function public.reserve_newsletter_test_send() returns boolean
language plpgsql set search_path = '' as $$
declare stamp timestamptz;
begin
  perform pg_catalog.pg_advisory_xact_lock(196084135, 31841);
  stamp := pg_catalog.clock_timestamp();
  delete from public.newsletter_test_attempts where attempted_at <= stamp - interval '24 hours';
  if (select count(*) from public.newsletter_test_attempts) >= 5 then return false; end if;
  insert into public.newsletter_test_attempts values (stamp);
  return true;
end;
$$;
revoke all on function public.reserve_newsletter_test_send() from public, anon, authenticated, service_role;
grant execute on function public.reserve_newsletter_test_send() to service_role;
