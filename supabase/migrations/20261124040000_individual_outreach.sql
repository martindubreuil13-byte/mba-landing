-- Individual outreach: one email to one person from Email Studio, alongside the weekly newsletter.
-- Additive only. Existing campaigns, functions and policies are untouched, and newsletter behaviour does not change.

-- An individual send is a one-recipient campaign, so it reuses the campaign machinery (the atomic claim, delivery records, unsubscribe,
-- provider events and history). `kind` tells them apart, and the constraint makes "one at a time" a database rule, not just a UI habit.
alter table public.email_campaigns
  add column kind text not null default 'newsletter' check (kind in ('newsletter', 'outreach')),
  add constraint email_campaigns_outreach_single_recipient check (kind = 'newsletter' or jsonb_array_length(recipients) = 1);

-- Saved outreach drafts: each has its own recipient, subject and message. A draft is a work in progress, not a record of sending.
-- `campaign_id` points at the most recent review snapshot made from the draft; whether the draft was sent is read from that campaign
-- (started_at), so a draft can never be sent twice even if nothing else was updated.
create table public.email_outreach_drafts (
  id uuid primary key default gen_random_uuid(),
  recipient_email text not null default '' check (char_length(recipient_email) <= 254),
  recipient_name text not null default '' check (char_length(recipient_name) <= 120),
  lead_id uuid references public.leads(id) on delete set null,
  subject text not null default '' check (char_length(subject) <= 180),
  preview_text text not null default '' check (char_length(preview_text) <= 160),
  editor_operations jsonb not null default '[]'
    check (jsonb_typeof(editor_operations) = 'array' and jsonb_array_length(editor_operations) <= 1500),
  campaign_id uuid references public.email_campaigns(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index email_outreach_drafts_updated_idx on public.email_outreach_drafts (updated_at desc);
create index email_outreach_drafts_campaign_idx on public.email_outreach_drafts (campaign_id) where campaign_id is not null;

alter table public.email_outreach_drafts enable row level security;
revoke all on public.email_outreach_drafts from public, anon, authenticated;
grant select, insert, update, delete on public.email_outreach_drafts to service_role;
