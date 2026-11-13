# Business Pulse release handoff

Production alias was verified on 13 November 2026 as the mba-site deployment
`dpl_7JWoSGqopcBfdkyJ74XVPYn4Pvzi` at Git revision `5ce6ba1`.
The production ledger has 26 versions and lacks the CRM review column and task
table. The sole new release migration is
`20261113100000_relationship_workspace.sql`. Preserve the publications ledger
alias and the historical scheduling recovery entries. Do not run a blanket
migration push against the mismatched history.

Before production, verify a restorable backup/recovery point, validate the
candidate against a production-shaped ledger on isolated Supabase, and run the
authenticated desktop/mobile admin walkthrough and local-db suites. Confirm
production flags and current Git main through the existing release workflow.
Keep Email Studio preview-only. It uses a conservative recorded opt-in count
and cannot send messages.

Deploy through the existing mba-site workflow only after those checks pass.
Smoke-test authenticated Home, existing records and specialist routes, and
read-only public booking availability. Avoid real sends or bookings. If the
release regresses, restore the previously verified Vercel deployment after
confirming its alias and health. Leave the additive task/review schema in place
so rollback preserves any new admin work. Confirm the public site and booking
picker again after rollback.
