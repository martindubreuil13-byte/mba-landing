import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const script = resolve("scripts/verify-migration-history.mjs");
const norm = (sql: string) => createHash("md5").update(sql.replace(/;/g, "").replace(/\s+/g, "")).digest("hex");
const dirs: string[] = [];
afterEach(() => { for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true }); });

type Rec = { version: string; name: string; statementCount: number; normalizedMd5: string | null };
/** A throwaway migrations directory and records snapshot, so the script is exercised without touching the real ones. */
function fixture(files: Record<string, string>, records: Rec[], acknowledged: object = {}) {
  const root = mkdtempSync(join(tmpdir(), "mba-migration-history-")); dirs.push(root);
  const migrations = join(root, "migrations"); mkdirSync(migrations);
  for (const [name, sql] of Object.entries(files)) writeFileSync(join(migrations, name), sql);
  const snapshot = join(root, "records.json");
  writeFileSync(snapshot, JSON.stringify({ capturedAt: "2031-01-01", acknowledged, records }));
  return { migrations, snapshot };
}
const run = (f: { migrations: string; snapshot: string }, ...extra: string[]) =>
  spawnSync(process.execPath, [script, "--migrations", f.migrations, "--records", f.snapshot, ...extra], { encoding: "utf8" });
const rec = (version: string, name: string, sql: string): Rec => ({ version, name, statementCount: 1, normalizedMd5: norm(sql) });

const A = "create table a (id int);\ncreate index a_idx on a (id);";
const B = "alter table a add column b text;";

describe("migration history verification (read-only)", () => {
  it("passes on the repository's real migration files against the committed production-records snapshot", () => {
    const result = spawnSync(process.execPath, [script, "--strict"], { encoding: "utf8" });
    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
    const snapshot = JSON.parse(readFileSync("docs/supabase/production-migration-records.json", "utf8"));
    const files = readdirSync("supabase/migrations").filter((f) => f.endsWith(".sql"));
    // Every recorded migration has a file with the identical version and name, and there is no extra file.
    expect(files.sort()).toEqual(snapshot.records.map((r: Rec) => `${r.version}_${r.name}.sql`).sort());
    expect(result.stdout).toContain(`Production records: ${snapshot.records.length}`);
  });

  it("accepts files whose SQL equals the record, ignoring only layout and semicolons", () => {
    const f = fixture({ "20310101000001_a.sql": A, "20310101000002_b.sql": `${B}\n\n` }, [rec("20310101000001", "a", A.replace(/\n/g, " ")), rec("20310101000002", "b", B.replace(";", ""))]);
    const r = run(f); expect(r.status).toBe(0); expect(r.stdout).toContain("SQL identical to the recorded SQL: 2");
  });

  it("rejects a file whose version differs from the production record, and says which file has the name", () => {
    const f = fixture({ "20310101000009_a.sql": A }, [rec("20310101000001", "a", A)]);
    const r = run(f); expect(r.status).toBe(1);
    expect(r.stderr).toContain("20310101000001 a: no file with this version; a file with the same name has version 20310101000009");
  });

  it("rejects a production record that has no file at all", () => {
    const f = fixture({ "20310101000001_a.sql": A }, [rec("20310101000001", "a", A), rec("20310101000002", "b", B)]);
    const r = run(f); expect(r.status).toBe(1); expect(r.stderr).toContain("20310101000002 b: recorded in production but no file exists");
  });

  it("rejects a file with the right version but a different name", () => {
    const f = fixture({ "20310101000001_other.sql": A }, [rec("20310101000001", "a", A)]);
    const r = run(f); expect(r.status).toBe(1); expect(r.stderr).toContain('file is named "other" but production recorded "a"');
  });

  it("rejects SQL that differs from what production recorded, even by one word", () => {
    const f = fixture({ "20310101000001_a.sql": A.replace("create index", "create unique index") }, [rec("20310101000001", "a", A)]);
    const r = run(f); expect(r.status).toBe(1); expect(r.stderr).toContain("the file's SQL differs from the SQL production recorded");
  });

  it("accepts a content difference only when the snapshot acknowledges it, and reports it", () => {
    const f = fixture({ "20310101000001_a.sql": `${A}\n-- edited later\n`.replace("a_idx", "a_idx2") }, [rec("20310101000001", "a", A)], { contentDeviations: { "20310101000001": "edited after apply" } });
    const r = run(f); expect(r.status).toBe(0); expect(r.stdout).toContain("KNOWN DEVIATION  20310101000001 a: edited after apply");
  });

  it("fails on a record with no stored SQL unless it is acknowledged, then lists it as unverifiable", () => {
    const none: Rec = { version: "20310101000001", name: "a", statementCount: 0, normalizedMd5: null };
    const f = fixture({ "20310101000001_a.sql": A }, [none]);
    const r = run(f); expect(r.status).toBe(1); expect(r.stderr).toContain("production stored no SQL for this record and it is not acknowledged");
    const g = fixture({ "20310101000001_a.sql": A }, [none], { noStoredStatements: { "20310101000001": "no statements stored" } });
    const ok = run(g); expect(ok.status).toBe(0); expect(ok.stdout).toContain("UNVERIFIABLE     20310101000001 a");
  });

  it("treats a new file with no production record as pending: a warning, or an error with --strict", () => {
    const f = fixture({ "20310101000001_a.sql": A, "20310101000002_new.sql": B }, [rec("20310101000001", "a", A)]);
    const r = run(f); expect(r.status).toBe(0); expect(r.stderr).toContain("pending: 20310101000002_new.sql");
    const s = run(f, "--strict"); expect(s.status).toBe(1); expect(s.stderr).toContain("pending: 20310101000002_new.sql");
  });

  it("rejects file names the Supabase CLI would silently skip, and duplicated versions", () => {
    const f = fixture({ "20310101000001_a.sql": A, "notes.sql": B, "2031_short.sql": B, "20310101000001_dup.sql": B }, [rec("20310101000001", "a", A)]);
    const r = run(f); expect(r.status).toBe(1);
    expect(r.stderr).toContain("notes.sql"); expect(r.stderr).toContain("2031_short.sql"); expect(r.stderr).toContain("two files share version 20310101000001");
  });

  it("never claims more than it checked", () => {
    const f = fixture({ "20310101000001_a.sql": A }, [rec("20310101000001", "a", A)]);
    const r = run(f); expect(r.stdout).toContain("did not read the live schema"); expect(r.stdout).toContain("says nothing about how the Supabase CLI will behave");
  });
});
