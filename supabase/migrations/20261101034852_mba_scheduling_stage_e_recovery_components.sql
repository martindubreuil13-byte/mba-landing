create extension if not exists pg_cron;
create extension if not exists pg_net;
create function public.sched_stage_e_provision_recovery(p_secret text) returns uuid language plpgsql security invoker set search_path='' as $$
begin
 if current_user <> 'service_role' then raise exception 'Service role required'; end if;
 if length(p_secret) < 32 then raise exception 'Invalid scoped credential'; end if;
 if exists(select 1 from vault.secrets where name='mba_scheduling_recovery') then raise exception 'Recovery entry already exists'; end if;
 return vault.create_secret(p_secret,'mba_scheduling_recovery','MBA Scheduling scoped recovery bearer; Stage E');
end $$;
revoke all on function public.sched_stage_e_provision_recovery(text) from public,anon,authenticated;
grant execute on function public.sched_stage_e_provision_recovery(text) to service_role;
notify pgrst,'reload schema';