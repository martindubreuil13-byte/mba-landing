create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  assessment_version text not null default 'business-idea-reality-check-v1.0',

  -- Lead linkage. Nullable until the result gate: a completed, scored
  -- assessment is durable (and stored) even if the participant abandons
  -- before giving their name/email.
  lead_id uuid references public.leads(id),

  created_at timestamptz not null default now(),
  completed_at timestamptz,

  -- Context (not scored)
  idea_name text,
  idea_description text,
  business_stage text not null,
  location text,

  -- Raw participant input, keyed by question code (q01..q13)
  raw_answers jsonb not null,

  -- Deterministic scoring output
  question_scores jsonb not null,
  dimension_scores jsonb not null,
  overall_score integer not null,

  -- Open-answer semantic classification (LLM, constrained to rubric)
  open_answer_classifications jsonb,
  evidence_tags jsonb,
  evidence_direction jsonb,

  -- Deterministic interpretation flags
  critical_flags jsonb not null default '[]'::jsonb,
  contradictions jsonb not null default '[]'::jsonb,
  material_negative_evidence jsonb not null default '{"triggered": false, "items": []}'::jsonb,
  evidence_debt jsonb,

  strongest_signal jsonb,
  biggest_exposure jsonb,
  priority_investigation jsonb,

  -- LLM-written participant-facing prose
  generated_assessment_text jsonb,
  generation_status text not null default 'pending',
  generation_error text,

  -- Attribution
  source text,
  medium text,
  campaign text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,

  -- Lightweight CTA tracking
  cta_clicked text,
  cta_clicked_at timestamptz
);

create index assessments_lead_id_idx on public.assessments(lead_id);
create index assessments_created_at_idx on public.assessments(created_at desc);

alter table public.assessments enable row level security;
-- No public policies: this table is only ever accessed via the service-role
-- client from trusted server code, matching leads/resources/resource_requests.
;
