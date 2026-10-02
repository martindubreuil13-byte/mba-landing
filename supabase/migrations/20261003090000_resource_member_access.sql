-- Member-access model for lead magnets: the member benefit (PDF, report, template...) unlocks only after the
-- reader confirms their membership. This migration adds the per-request unlock state.
--
-- ADDITIVE ONLY: one nullable column and one partial index on resource_requests. Nothing is dropped, renamed or
-- changed in an existing column, and no lead, consent or event row is touched.
--
--   benefit_fulfilled_at  NULL  = locked: a membership request that is waiting for confirmation (no download is allowed)
--                         set   = unlocked: the benefit was issued (confirmed member, or issued before this change)
--
-- Backfill (data change, new column only): every request that exists today was handed its download immediately
-- under consent v1.0/v1.1, so its already-issued link must keep working. They are marked fulfilled at their own
-- request time. No email is sent by this migration and no consent value is read or changed.
alter table public.resource_requests
  add column if not exists benefit_fulfilled_at timestamptz;

update public.resource_requests
set benefit_fulfilled_at = requested_at
where benefit_fulfilled_at is null;

-- Finds the locked requests of a lead for a resource when they confirm.
create index if not exists resource_requests_locked_idx
  on public.resource_requests (lead_id, resource_id)
  where benefit_fulfilled_at is null;

-- ROLLBACK (manual, safe: the app code only reads this column through the member-access service):
--   drop index if exists public.resource_requests_locked_idx;
--   alter table public.resource_requests drop column if exists benefit_fulfilled_at;
-- Roll the application back FIRST (or at the same time), otherwise code that still selects the column errors.
