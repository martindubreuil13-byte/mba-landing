import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const script = resolve("scripts/check-release.mjs");
const manifest = JSON.parse(readFileSync("scripts/production-routes.json", "utf8"));
const fixtures: string[] = [];
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "mba-release-guard-"));
  fixtures.push(root);
  for (const path of manifest.requiredFiles) { mkdirSync(dirname(join(root, path)), { recursive: true }); writeFileSync(join(root, path), ""); }
  mkdirSync(join(root, "app/components/admin"), { recursive: true });
  writeFileSync(join(root, "app/components/admin/AdminShell.tsx"), '<a href="/admin/publications"/><a href="/admin/scheduling"/><a href="/admin/inquiries"/>');
  return root;
}
const run = (cwd: string, env: Record<string, string> = {}) => spawnSync(process.execPath, [script], { cwd, env: { VERCEL_ENV: "preview", ...env }, encoding: "utf8" });
afterEach(() => { for (const root of fixtures.splice(0)) rmSync(root, { recursive: true, force: true }); });
describe("production capability release guard", () => {
  it("accepts the complete existing application", () => expect(run(fixture()).status).toBe(0));
  it("rejects a release missing Scheduling routes", () => {
    const root = fixture(); rmSync(join(root, "app/admin/scheduling/page.tsx"));
    const result = run(root); expect(result.status).not.toBe(0); expect(result.stderr).toContain("app/admin/scheduling/page.tsx");
  });
  it("rejects a release that hides Inquiries navigation", () => {
    const root = fixture(); writeFileSync(join(root, "app/components/admin/AdminShell.tsx"), '<a href="/admin/publications"/><a href="/admin/scheduling"/>');
    const result = run(root); expect(result.status).not.toBe(0); expect(result.stderr).toContain("admin navigation: /admin/inquiries");
  });
  it("rejects production when operation flags were omitted", () => {
    const result = run(fixture(), { VERCEL_ENV: "production" });
    expect(result.status).not.toBe(0); expect(result.stderr).toContain("SCHEDULING_OPERATIONS_ENABLED=true");
  });
});
