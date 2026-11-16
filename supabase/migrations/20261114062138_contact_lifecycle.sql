-- Add without a default first so historical rows retain their existing classification.
alter table public.leads add column contact_lifecycle text
  check (contact_lifecycle in ('new', 'qualified', 'prospect', 'client', 'inactive'));
alter table public.leads alter column contact_lifecycle set default 'new';
