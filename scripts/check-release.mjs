import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
const manifest = JSON.parse(readFileSync(new URL("./production-routes.json", import.meta.url)));
const missing = manifest.requiredFiles.filter(path => !existsSync(path));
const nav = readFileSync("app/components/admin/AdminShell.tsx", "utf8");
for (const path of ["/admin/publications", "/admin/scheduling", "/admin/inquiries"]) {
  if (!nav.includes(`href="${path}"`)) missing.push(`admin navigation: ${path}`);
}
if (missing.length) throw new Error(`Release removes production capabilities:\n${missing.join("\n")}`);
if (process.argv.includes("--ancestry")) {
  // Requires full Git history. Refuse a release assembled on an older main.
  execFileSync("git", ["merge-base", "--is-ancestor", manifest.baseline, "HEAD"]);
  execFileSync("git", ["merge-base", "--is-ancestor", "origin/main", "HEAD"]);
  if (execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim()) throw new Error("Release checkout must be clean.");
}
if (process.env.VERCEL_ENV === "production") {
  const required = { SCHEDULING_OPERATIONS_ENABLED: "true", SCHEDULING_BACKEND: "supabase", SCHEDULING_GOOGLE: "live", SCHEDULING_ZOOM: "live", SCHEDULING_EMAIL: "resend", PROGRAM_INQUIRY_STORE_ENABLED: "true" };
  for (const [key, value] of Object.entries(required)) {
    if (process.env[key] !== value) throw new Error(`Production release requires ${key}=${value}; fix saved project configuration before building.`);
  }
  if (!["true", "false"].includes(process.env.SCHEDULING_PUBLIC_INTAKE_ENABLED)) throw new Error("Explicit public intake setting required.");
  if (process.env.SCHEDULING_PROTOTYPE === "true" || process.env.SCHEDULING_EMAIL_TEST_MODE === "true") throw new Error("Production cannot use development Scheduling flags.");
}
console.log(`Release guard passed: ${manifest.requiredFiles.length} production route files and all three admin tabs present.`);
