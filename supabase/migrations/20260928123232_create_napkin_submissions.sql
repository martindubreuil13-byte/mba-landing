create table public.napkin_submissions (
  id uuid primary key default gen_random_uuid(),

  form_version text not null default 'napkin-principle-v1.0',
  calculation_version text not null default 'napkin-calc-v1.0',

  lead_id uuid references public.leads(id),
  created_at timestamptz not null default now(),
  joined_at timestamptz,

  -- Flattened fields used for admin listing/filtering. The full structured
  -- answers and computed result live in the jsonb columns below and are
  -- always recomputed/validated server-side before being written here.
  business_name text,
  currency text not null default 'USD',
  selling_price numeric not null,
  money_remaining_per_transaction numeric not null,
  monthly_operating_cost numeric not null,
  required_transactions_per_month integer,
  interpretation_category text not null,

  raw_inputs jsonb not null,
  calculation_result jsonb not null,

  consent_copy_version text,
  consent_at timestamptz,
  marketing_consent boolean not null default false,

  source text,
  medium text,
  campaign text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,

  email_sent boolean not null default false,
  email_sent_at timestamptz,
  email_error text,

  cta_clicked text,
  cta_clicked_at timestamptz
);

alter table public.napkin_submissions enable row level security;

create index napkin_submissions_lead_id_idx on public.napkin_submissions (lead_id);
create index napkin_submissions_created_at_idx on public.napkin_submissions (created_at desc);
;
