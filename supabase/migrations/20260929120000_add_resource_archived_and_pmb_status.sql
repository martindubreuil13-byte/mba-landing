-- Admin re-architecture: adds the two fields needed for the simplified
-- Resources (Draft/Published/Archived) and Pick My Brain (status) views.
-- Both are additive, nullable-free-with-safe-defaults columns — existing
-- rows are unaffected and no data is migrated or destroyed.

alter table public.resources
  add column if not exists archived boolean not null default false;

alter table public.pmb_questions
  add column if not exists status text not null default 'new';

alter table public.pmb_questions
  add constraint pmb_questions_status_check
  check (status = any (array['new', 'reviewing', 'planned', 'answered', 'archived']));
