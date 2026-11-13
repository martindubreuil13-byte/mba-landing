# MBA admin visual prototype

Open index.html in a browser. The five primary destinations are Home, Contacts, Scheduling, Content and Email Studio. More tools illustrates secondary access for Website Intelligence, Pick My Brain, Assessments and Napkin submissions. Sample task and email draft changes live in memory until reload.

## Production adoption after visual approval

- Reconcile the isolated branch against the then-current production source and preserve work in the original checkout. Separate presentation changes from any existing CRM migration.
- Connect the approved surfaces to existing protected admin pages and queries. Preserve route access for all specialist functions, including inquiry review, exceptions, booking operations and existing content editors. Reuse existing Supabase records and contact IDs. Keep Email Studio sending disabled within this design scope.
- Review the production migration ledger and validate any additive release candidate in isolated Supabase. Run access-control and regression checks and verify desktop/mobile workflows using synthetic data.
- Prepare a recoverable release commit and record the current production deployment for rollback. After the release checks pass and rollout is authorized, deploy to the existing mba-site Vercel project.
- Smoke-test sign-in, existing contact and business record access, specialist navigation, and read-only scheduling and content views. Avoid real sends, bookings and provider changes. If a regression appears, restore the recorded deployment and preserve data from any additive schema change.

## Business Pulse 3.0

Home uses compact top navigation and an asymmetric layout. Weekly KPIs compare 7–13 November with the prior week. The follow-up count is a point-in-time snapshot. The download chart totals 34 sample downloads. Routine activity and items needing owner attention are separate. Meetings and activity link to sample details, and Add contact is an in-memory demo. Existing secondary views remain available for visual review.
