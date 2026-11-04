# Production releases

Production must contain the merged history of article/content changes AND Scheduling, Inquiries and Publications. Never assume the tip of main represents the currently live build: check Vercel's domain mapping and deployment metadata first. November 3's article-only deployment replaced a CLI release whose commits had never reached main.

## Release procedure

1. Fetch origin. Start from current main in a clean checkout. Merge complete feature branches through review. Never deploy the old dirty mba-site prototype checkout. Preserve existing local work.
2. Compare the live deployment identity with the previous release record. If its commit is unknown or is not an ancestor of the candidate, reconcile it before shipping. Run `npm run release:check` with full Git history.
3. Run `SCHEDULING_DB_TESTS=0 npm test`, typecheck, lint and build. Database integration tests need a separate disposable local database, never production.
4. Vercel project mba-site (`prj_XDFxc5oBVQXeqC29VsGSmPNKms1P`), team `team_xkjfMQVPT7NitvHLzx4zA8vh`. Source build settings are in vercel.json; production flags are saved in Vercel, not command-line-only overrides. Never copy production secrets into source or preview.
5. Automatic custom-domain assignment is disabled. Stage a production-target build of the exact reviewed commit without assigning domains. Confirm domain mappings did not move. Check Publications, article pages, booking page, admin authentication and webhook/cron authentication. For a flag-off rehearsal, stage a separate production build with intake=false while keeping operations=true; do not alter the live deployment's state.
6. Promote the verified production build, then explicitly disable automatic custom-domain assignment again (promotion may re-enable it). Verify the canonical domain points to that deployment. Confirm public booking availability without making an appointment, all admin sections, recovery heartbeat, provider connections and webhook health. No test booking or mail is required for a source-only release.
7. Record commit, deployment ID, previous known-good deployment, flag state and checks. Advance the route manifest deliberately for added routes. Removing a protected route requires a reviewed manifest change.

## Configuration and recovery

Operations=true; backend=supabase; Google/Zoom=live; email=resend; inquiry store=true. Public intake must be explicitly true or false according to the approved operational state. Prototype and email test mode must never be true in production. Keep existing credentials, databases, migrations and provider subscriptions. The build fails if required routes, admin links or production mode settings are missing.

For an incident, roll back to the last schema-compatible working production deployment and verify the domain mapping. Reconcile its source into main before the next release. Do not drop tables or reset credentials. Review queued work and provider/webhook failures after an outage; a restored page alone does not prove every missed event has recovered.

## November 4 recovery

Known working deployment: dpl_HXsFy5iYvmAJQqit2G4HzTA6H7vP; source d69282e (feat/phase2-complete in mba-scheduling-release). Recovery merges this full release with origin/main 9d45ea1 (article 013). Original working directories are retained. No schema migration is needed for this combined source release.
