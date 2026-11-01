# MBA Scheduling — Stage A Completion

Date: 31 October 2026; verification completed approximately 11:45 UTC.
Result: **PASS — Stage A completed. Stop before Stage B.**

## Target and backup

Confirmed production Supabase project **The MBA**, reference `sbntzyivfhvogxiiysuh`, organization **Martin SaaS Lab**, production main branch, ca-central-1, ACTIVE_HEALTHY. The authenticated dashboard listed a physical backup dated **31 October 2026, 10:59:08 UTC**, with an enabled Restore action and earlier daily backups. It was approximately 41 minutes old when migration execution began. This establishes provider-managed restore availability; no destructive restore drill was performed. Screenshot is in the evidence folder.

Supabase database backups include database data and Storage metadata, not stored file contents. None of these migrations accesses or modifies Storage. The three publication records were last updated before this backup.

## Migration review and application

Reviewed exact release copies against RELEASE-MIGRATIONS.json; all four SHA-256 hashes matched. No DROP TABLE, TRUNCATE, existing-data deletion, modification of pre-existing business tables, production account configuration, or cron installation. Replacement functions, triggers and constraints are confined to newly introduced Scheduling objects. External dependencies are the existing UUID primary key public.consent_records(id), used by an optional foreign key, and public.set_updated_at(), used by a Scheduling trigger. Both were verified compatible before execution.

| Order | Version | Migration | Result |
|---|---|---|---|
| 1 | 20261101090000 | mba_scheduling | Applied |
| 2 | 20261102090000 | mba_scheduling_phase2e | Applied |
| 3 | 20261103090000 | mba_scheduling_phase2f | Applied |
| 4 | 20261104090000 | mba_scheduling_phase2g | Applied |

Before execution, production had 17 migration entries and zero Scheduling tables/functions. None of these four versions was present. Only these four scripts were submitted, in order, through Supabase apply_migration. No existing migration was reapplied. Final history contains the original 17 entries plus exactly these four approved versions.

The connector assigns execution-time versions automatically. Each newly created entry was aligned with its approved release filename by a guarded UPDATE matching its generated version and name, before proceeding to the next migration. Generated versions were 20261031113947, 20261031114103, 20261031114307 and 20261031114325 respectively. No original history entry was edited. Stored migration SQL MD5 values exactly match the corresponding local file bytes. The first connector request expired without applying anything; migration history was checked before a successful retry.

## Schema and permissions

- All **14 Scheduling tables** exist, with RLS enabled.
- No table grants to PUBLIC, anon or authenticated; zero RLS policies granting browser access. service_role has table access.
- All **15 operational Scheduling RPCs** deny execution to anon/authenticated and permit service_role. All are security invoker.
- Two trigger-only functions retain default EXECUTE privileges; they are security invoker trigger functions, not callable booking RPCs, and cannot bypass revoked table access.
- Expected three application triggers exist. Constraints, including overlap exclusion, idempotency uniqueness, foreign keys and check constraints, are present and validated.
- Scheduling tables are empty except the intended single sched_settings row. No meetings, bookings, Google authorization, external references, email attempts, worker heartbeats or webhook deliveries were created.
- pg_cron and pg_net remain uninstalled. No recovery jobs were configured.

## Existing data and live website

Before/after row counts and ordered full-row MD5 fingerprints are identical for **all 21 pre-existing public tables**, **20 Storage objects** and **3 Storage buckets**. This includes Publications, consent, resources, leads, assessments, Transition applications/bookings/invitation sends and intelligence data. Evidence contains only aggregate counts/fingerprints, not customer rows.

All three published books remain intact and listed on the live Publications page:
- Architecting Intelligence
- The Next Business Discipline
- How to Eat a Salami (and Grow Your Business Too)

Read-only HTTPS smoke checks returned **200** for homepage, /publications and /transition. The Publications HTML contains all three book-detail links. Production alias still points to deployment `dpl_EgbDJyDwJdofN3shCZTQ6yckehJG`, project `prj_XDFxc5oBVQXeqC29VsGSmPNKms1P`; existing application code was not replaced. Transition/Calendly source and runtime configuration were not changed. No forms, booking flows or invitation links were submitted as part of verification; external lifecycle behavior was deliberately not exercised.

## Issues, boundaries and next stage

No migration or integrity issue was found. Database-only preparation does not make Scheduling operational: deployment, production integration configuration, recovery infrastructure and controlled verification remain separate approved stages.

No production environment variables, OAuth settings, cron jobs, webhooks, deployments or public-booking switches were changed. No appointments, Google events, Zoom meetings or emails were created. No commits, pushes or merges occurred. Original mixed local work was preserved.

**Stopped at the Stage A boundary. Await separate authorization before any further production-changing action.**

Evidence: release-evidence/stage-a/verification.json and backup.png.
