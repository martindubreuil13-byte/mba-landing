# MBA CRM Chunk 4B · Functional and visual QA

13 November 2026 · Isolated branch `feat/crm-relationship-workspace`

**Result: SQL and unit QA passed. Authenticated browser and visual sign-off remain blocked.** Feature code was left as found.

## Verification

| Check | Result |
|---|---|
| Unit project | 1,357 passed, 18 skipped across 109 files. Includes mocked inquiry, booking, scheduling/email, review mutation, task and exception checks. |
| TypeScript and targeted lint | Passed. |
| Isolated PostgreSQL 17 | Existing Chunk 4A migration was already applied. Synthetic inquiry defaulted to New and moved through Reviewed, Follow-up Needed and Closed. Owner delivery status remained pending during review. Created an inquiry-linked overdue task, completed it and reopened it. Rolled back fixtures and stopped the socket-only cluster. |
| SQL access | Both browser roles saw zero inquiry rows. Anonymous task SELECT and authenticated task UPDATE grants were absent. The service role performed the synthetic mutations. |
| Full Supabase and authenticated walkthrough | Blocked. Docker Desktop daemon socket is missing, ports 54321/54322 do not accept connections, and the isolated checkout has no local Supabase env file. Plain PostgreSQL has no Auth or PostgREST session flow. No isolated admin identity was available. No production fallback was used. |
| Screenshots and viewport tests | Desktop and mobile screenshots unavailable. Authenticated persistence, real keyboard/focus behavior, desktop/tablet/mobile rendering, overflow and touch targets remain unverified. |

Scheduling and email regression coverage used mocks. Live calendar, Zoom, Resend and webhook behavior were outside this QA. The existing exception unit fixture verifies a bounced scheduling email appears and superseded or previous-version attempts are excluded. It does not exercise real PostgREST filtering or a full matrix of temporary and terminal states. Source filters require recorded failure/bounce or an expired inquiry claim; absent records alone do not generate cards.

## Interaction and design review

**Estimated from source**, starting at Inquiries & Applications with the target card visible. Open review select, choose a state, save, open contact, focus description, add task, complete, reopen, return via admin navigation and open Automation Exceptions. That is about **10 pointer activations**, plus typing, optional date selection and any scrolling. Opening the message adds one activation. Timeline inspection requires no control activation, though follow-ups precede it in the contact layout. Native select interaction can vary by device. No click count was measured in a running browser.

The oxblood links and controls, white rounded cards on the existing light admin shell, generous gaps, subtle shadows and restrained hover transitions fit the editorial direction. Native disclosure keeps long inquiry messages out of the scan path. Icons help orient Follow-ups and Exceptions, while the contact timeline is a stack of similar cards and has limited visual differentiation by event type. Repeating a select and Save button on each card creates the strongest conventional CRM feel, particularly when many routine inquiries are visible. Keep the existing design for review and validate density with realistic fixtures.

Controls have text labels and use native form, link and disclosure semantics. Filter links expose the current view. Empty states are present. There are no explicit mutation pending indicators or inline outcome messages, and server-action failures throw generic errors. Focus styling relies largely on native behavior. Source colors such as 45–50% dark text merit contrast measurement against the actual backgrounds. Responsive classes collapse the inquiry grid and wrap controls; this establishes intended layout, with rendered behavior still open. Inquiry dates use Toronto, exceptions and task deadlines use Bangkok, and contact event timestamps use server defaults. This can cause conflicting dates around midnight.

## Ranked findings and Chunk 4C refinements

| Rank | Finding | Recommended refinement |
|---|---|---|
| Critical | None observed in the checks performed. | Keep authenticated security QA as a release gate. |
| High | Auth, PostgREST query behavior and persistence across reloads have no authenticated end-to-end verification. | Start an isolated local Supabase stack with synthetic identities and provider stubs. Verify anonymous/non-admin denial and the full owner workflow before release. |
| High | Exceptions can show a failed scheduling email attempt while sync recovery remains pending. Cards do not distinguish retryable, stalled and terminal cases. Generic scheduling and resource links do not identify the affected record. | Use existing retry/terminal evidence to label severity and next action, and deep-link to the affected record where supported. Test pending retry, recovered send, missing data, dual inquiry failures and terminal bounce using real queries. |
| Medium | Review and task forms lack pending, success and actionable error feedback. | Add concise inline status, preserve input on failure and verify keyboard focus after submissions. |
| Medium | Toronto, Bangkok and server-default date presentation differ. | Choose and label a consistent workspace timezone. Keep due dates date-only. |
| Medium | Inquiry and exception anchors can target rows outside the bounded inquiry list. | Add stable record navigation or a direct lookup for source links. |
| Low | Repeated review controls and visually uniform timeline cards reduce scanability. Muted text, focus and touch sizes still need measurement. | Test at 1440, 768 and 390 px with synthetic data. Keep routine activity quiet and prioritize follow-up and exception actions. |

**Next QA pass** — Use the isolated migration and synthetic data. Walk through review, contact history, task creation, completion, reopening and exceptions. Reload after mutations to verify persistence. Check keyboard order, visible focus, contrast, screen width and timestamps, then capture desktop and mobile screenshots. Await approval before making any corrections.
