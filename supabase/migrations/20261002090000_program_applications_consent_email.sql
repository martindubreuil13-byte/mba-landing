-- Corporate Transition: record the delivery state of the marketing-consent CONFIRMATION email.
-- ADDITIVE ONLY: two new columns with safe defaults. Existing rows read 'not_sent', which is truthful:
-- no confirmation email was ever sent for applications made before this change.
--   not_sent  no confirmation email was needed or has been attempted
--   queued    the email provider accepted the confirmation email
--   failed    the provider (or the environment's email policy) refused it; consent_email_error says why
alter table public.program_applications
  add column if not exists consent_email_status text not null default 'not_sent',
  add column if not exists consent_email_error text;

alter table public.program_applications
  drop constraint if exists program_applications_consent_email_status_check;
alter table public.program_applications
  add constraint program_applications_consent_email_status_check
  check (consent_email_status in ('not_sent', 'queued', 'failed'));
