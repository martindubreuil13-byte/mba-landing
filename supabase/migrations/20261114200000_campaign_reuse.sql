alter table public.email_campaigns
  add column editor_operations jsonb,
  add column selected_contact_ids uuid[];
