#!/usr/bin/env node
/**
 * Read-only check that the migration files in git line up with what production recorded as applied.
 *
 *   node scripts/verify-migration-history.mjs [--strict] [--records <json>] [--migrations <dir>]
 *
 * It never connects to a database and never writes anything. "Production records" are the committed snapshot
 * docs/supabase/production-migration-records.json (version, name, statement count and a hash of the SQL text Supabase stored for each applied
 * migration). Regenerate the snapshot with the read-only query in docs/supabase/MIGRATION-HISTORY.md.
 *
 * What it proves: every recorded migration has a file with the SAME version and name, and wherever Supabase stored the SQL, the file's SQL equals it
 * (layout and semicolons ignored). What it does NOT prove: that the live schema matches the files, that the CLI behaves a particular way, or
 * anything about records that stored no SQL (those are listed as unverifiable and must be acknowledged in the snapshot).
 *
 * Exit 1 on any unexpected difference. A file with no production record is "pending" (a new, not-yet-applied migration): a warning, or an error
 * with --strict.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const argv = process.argv.slice(2);
const opt = (name, fallback) => { const i = argv.indexOf(name); return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback; };
const strict = argv.includes("--strict");
const recordsPath = resolve(opt("--records", "docs/supabase/production-migration-records.json"));
const migrationsDir = resolve(opt("--migrations", "supabase/migrations"));

const normalizedMd5 = (text) => createHash("md5").update(text.replace(/;/g, "").replace(/\s+/g, "")).digest("hex");

const errors = [];
const warnings = [];
const lines = [];

if (!existsSync(recordsPath)) { console.error(`Production records snapshot not found: ${recordsPath}`); process.exit(1); }
if (!existsSync(migrationsDir)) { console.error(`Migrations directory not found: ${migrationsDir}`); process.exit(1); }
const snapshot = JSON.parse(readFileSync(recordsPath, "utf8"));
const records = snapshot.records ?? [];
const noStatementsOk = snapshot.acknowledged?.noStoredStatements ?? {};
const deviationsOk = snapshot.acknowledged?.contentDeviations ?? {};

// Files. The Supabase CLI silently skips anything that does not match <14 digits>_<name>.sql, so a misnamed file would never be applied.
const byVersion = new Map();
for (const entry of readdirSync(migrationsDir).sort()) {
  const m = /^(\d{14})_(.+)\.sql$/.exec(entry);
  if (!m) { errors.push(`file name does not match <version>_<name>.sql (the CLI would skip it): ${entry}`); continue; }
  if (byVersion.has(m[1])) { errors.push(`two files share version ${m[1]}: ${byVersion.get(m[1]).file} and ${entry}`); continue; }
  byVersion.set(m[1], { file: entry, name: m[2], sql: readFileSync(join(migrationsDir, entry), "utf8") });
}
const byName = new Map();
for (const [version, f] of byVersion) byName.set(f.name, [...(byName.get(f.name) ?? []), version]);

const counts = { identical: 0, unverifiable: 0, knownDeviation: 0 };
for (const r of records) {
  const f = byVersion.get(r.version);
  if (!f) {
    const sameName = (byName.get(r.name) ?? []).filter((v) => !records.some((x) => x.version === v && x.name === r.name));
    errors.push(sameName.length
      ? `${r.version} ${r.name}: no file with this version; a file with the same name has version ${sameName.join(", ")}`
      : `${r.version} ${r.name}: recorded in production but no file exists`);
    continue;
  }
  if (f.name !== r.name) { errors.push(`${r.version}: file is named "${f.name}" but production recorded "${r.name}"`); continue; }
  if (r.statementCount > 0 && r.normalizedMd5) {
    if (normalizedMd5(f.sql) === r.normalizedMd5) {
      counts.identical += 1;
      if (deviationsOk[r.version]) warnings.push(`${r.version} ${r.name}: acknowledged as a content deviation but the SQL now matches; remove the acknowledgement`);
    } else if (deviationsOk[r.version]) { counts.knownDeviation += 1; lines.push(`KNOWN DEVIATION  ${r.version} ${r.name}: ${deviationsOk[r.version]}`); }
    else errors.push(`${r.version} ${r.name}: the file's SQL differs from the SQL production recorded`);
  } else if (noStatementsOk[r.version]) { counts.unverifiable += 1; lines.push(`UNVERIFIABLE     ${r.version} ${r.name}: ${noStatementsOk[r.version]}`); }
  else errors.push(`${r.version} ${r.name}: production stored no SQL for this record and it is not acknowledged in the snapshot`);
}
for (const v of Object.keys(noStatementsOk)) if (!records.some((r) => r.version === v)) warnings.push(`${v}: acknowledged but not in the records snapshot`);

const recorded = new Set(records.map((r) => r.version));
const pending = [...byVersion].filter(([v]) => !recorded.has(v)).map(([, f]) => f.file);
for (const file of pending) (strict ? errors : warnings).push(`pending: ${file} has no production record (not yet applied, or the snapshot is out of date)`);

console.log(`Production records: ${records.length} (snapshot of ${snapshot.capturedAt ?? "unknown date"}). Migration files: ${byVersion.size}.`);
console.log(`  SQL identical to the recorded SQL: ${counts.identical}`);
console.log(`  Acknowledged content deviation:    ${counts.knownDeviation}`);
console.log(`  Unverifiable (no stored SQL):      ${counts.unverifiable}`);
console.log(`  Pending files (no record):         ${pending.length}`);
for (const l of lines) console.log(l);
for (const w of warnings) console.warn(`WARNING: ${w}`);
if (errors.length) {
  console.error(`\nMigration history check FAILED (${errors.length}):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log("\nOK. This compared recorded SQL text only. It did not read the live schema and says nothing about how the Supabase CLI will behave.");
