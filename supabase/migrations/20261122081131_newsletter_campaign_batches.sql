-- One campaign may contain any number of recipients. Each confirmed request
-- claims at most 25 of them; it never claims a previously attempted batch.
alter table public.email_campaigns
  drop constraint email_campaigns_recipients_check,
  drop constraint email_campaigns_selected_count_check,
  add constraint email_campaigns_recipients_check check (
    jsonb_typeof(recipients) = 'array' and jsonb_array_length(recipients) >= 1
  ),
  add constraint email_campaigns_selected_count_check check (selected_count >= 1),
  add column next_recipient_index integer not null default 0 check (next_recipient_index >= 0),
  add column send_claim uuid,
  add column send_claimed_at timestamptz;

create function public.claim_email_campaign_batch(
  campaign_id uuid, requested_offset integer, admin_id uuid, acknowledge_exceptions boolean default false
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  campaign public.email_campaigns%rowtype;
  token uuid := gen_random_uuid();
  batch jsonb;
begin
  select * into campaign from public.email_campaigns where id = campaign_id for update;
  if not found or admin_id is null or requested_offset is null or requested_offset < 0
    or campaign.completed_at is not null or campaign.send_claim is not null
    or requested_offset <> campaign.next_recipient_index
    or requested_offset >= jsonb_array_length(campaign.recipients) then return null; end if;
  if campaign.has_consent_exceptions and campaign.exceptions_acknowledged_by is null
    and not coalesce(acknowledge_exceptions, false) then return null; end if;
  if campaign.started_at is null then
    if requested_offset <> 0 or campaign.created_at < now() - interval '30 minutes' then return null; end if;
  elsif requested_offset = 0 then
    -- Includes interrupted campaigns started by the old sender. Never replay.
    return null;
  end if;
  select jsonb_agg(value order by ordinality) into batch
    from jsonb_array_elements(campaign.recipients) with ordinality
    where ordinality > requested_offset and ordinality <= requested_offset + 25;
  update public.email_campaigns set send_claim = token, send_claimed_at = now(),
    started_at = coalesce(started_at, now()),
    intelligence_started_at = coalesce(intelligence_started_at, now()),
    exceptions_acknowledged_by = case when acknowledge_exceptions
      then coalesce(exceptions_acknowledged_by, admin_id) else exceptions_acknowledged_by end
    where id = campaign_id;
  return jsonb_build_object('claimToken', token, 'subject', campaign.subject,
    'preview_text', campaign.preview_text, 'body_html', campaign.body_html,
    'body_text', campaign.body_text, 'recipients', batch);
end;
$$;

create function public.complete_email_campaign_batch(campaign_id uuid, claim_token uuid)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  campaign public.email_campaigns%rowtype;
  next_offset integer;
  recorded integer;
begin
  select * into campaign from public.email_campaigns where id = campaign_id for update;
  if not found or claim_token is null or campaign.send_claim is distinct from claim_token
    or campaign.completed_at is not null then return null; end if;
  next_offset := least(campaign.next_recipient_index + 25, jsonb_array_length(campaign.recipients));
  select count(*) into recorded
    from jsonb_array_elements(campaign.recipients) with ordinality as r(value, ordinality)
    join public.email_campaign_deliveries d on d.campaign_id = campaign.id and d.email = r.value->>'email'
    where r.ordinality > campaign.next_recipient_index and r.ordinality <= next_offset
      and d.status in ('sent', 'failed', 'unknown', 'excluded');
  if recorded <> next_offset - campaign.next_recipient_index then return null; end if;
  update public.email_campaigns set next_recipient_index = next_offset, send_claim = null,
    completed_at = case when next_offset = jsonb_array_length(recipients) then now() else null end
    where id = campaign_id;
  return jsonb_build_object('nextOffset', next_offset,
    'done', next_offset = jsonb_array_length(campaign.recipients));
end;
$$;

revoke all on function public.claim_email_campaign_batch(uuid, integer, uuid, boolean) from public, anon, authenticated;
revoke all on function public.complete_email_campaign_batch(uuid, uuid) from public, anon, authenticated;
grant execute on function public.claim_email_campaign_batch(uuid, integer, uuid, boolean) to service_role;
grant execute on function public.complete_email_campaign_batch(uuid, uuid) to service_role;
