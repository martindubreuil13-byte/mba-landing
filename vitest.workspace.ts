import { configDefaults, defineWorkspace } from "vitest/config";

/**
 * The scheduling suites that talk to the LOCAL Supabase stack share one database, and the sync sweep is deliberately global ("everything that is
 * due"), so two of these files running at the same moment would steal each other's bookings. They run one file at a time in their own project;
 * every other test file stays parallel.
 */
const LOCAL_DB_TESTS = [
  "app/lib/scheduling/background.test.ts",
  "app/lib/scheduling/contract.test.ts",
  "app/lib/scheduling/kill.test.ts",
  "app/lib/scheduling/supabase-service.test.ts",
  "app/lib/inquiries/local-db.test.ts",
];

/**
 * The independent audit's own reproducers (docs/mba-scheduling/audit). They assert the UNSAFE behaviour the audit found, so after the Phase 2E fixes
 * the P1 ones fail by design: they are evidence of the old defects, not a regression suite. They are kept out of the normal run and can be run on
 * demand to see the before/after: `AUDIT_REPRODUCERS=1 npx vitest run --project audit-original`. The same scenarios, asserting the safe outcome,
 * live in app/lib/scheduling/remediation.test.ts.
 */
const AUDIT_ORIGINAL = ["docs/mba-scheduling/audit/**"];

export default defineWorkspace([
  { extends: "./vitest.config.ts", test: { name: "unit", exclude: [...configDefaults.exclude, ...LOCAL_DB_TESTS, ...AUDIT_ORIGINAL] } },
  ...(process.env.AUDIT_REPRODUCERS === "1" ? [{ extends: "./vitest.config.ts", test: { name: "audit-original", include: ["docs/mba-scheduling/audit/independent-audit.test.ts", "docs/mba-scheduling/audit/phase2e/independent-reaudit.test.ts", "docs/mba-scheduling/audit/phase2f/independent-verification.test.ts"] } }] : []),
  { extends: "./vitest.config.ts", test: { name: "local-db", include: LOCAL_DB_TESTS, pool: "forks", poolOptions: { forks: { singleFork: true } } } },
]);
