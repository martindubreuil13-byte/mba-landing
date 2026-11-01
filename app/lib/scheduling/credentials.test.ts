import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { randomBytes } from "node:crypto";
import { assertSchedulingRuntime } from "./release-gates";
import { checkKeyring, parseEnvFile } from "../../../scripts/check-scheduling-keyring.mjs";

/** Stage G: recovery-credential rotation support. No real secret is used; every value here is random and local. */
vi.mock("server-only", () => ({}));
vi.mock("@/app/lib/supabase/admin-session", () => ({ getAdminUser: vi.fn() }));
import { cronRoute } from "./http";

const secret = () => randomBytes(24).toString("base64url");   // 32 characters
const req = (bearer?: string) => new Request("http://localhost/api/cron/scheduling-sync", { headers: bearer ? { authorization: `Bearer ${bearer}` } : {} });
const ok = vi.fn(async () => new Response("ran"));

beforeEach(() => { ok.mockClear(); vi.stubEnv("SCHEDULING_PROTOTYPE", "true"); vi.stubEnv("VERCEL", ""); });
afterEach(() => vi.unstubAllEnvs());

describe("the recovery worker's bearer secret during a rotation", () => {
  it("accepts the current secret, and refuses anything else", async () => {
    const current = secret();
    vi.stubEnv("SCHEDULING_RECOVERY_SECRET", current);
    expect((await cronRoute(ok)(req(current), {})).status).toBe(200);
    expect((await cronRoute(ok)(req(secret()), {})).status).toBe(401);
    expect((await cronRoute(ok)(req(), {})).status).toBe(401);
    expect(ok).toHaveBeenCalledTimes(1);
  });
  it("accepts the previous secret ONLY while one is configured, so the scheduler can be switched after the application", async () => {
    const [current, previous] = [secret(), secret()];
    vi.stubEnv("SCHEDULING_RECOVERY_SECRET", current);
    expect((await cronRoute(ok)(req(previous), {})).status).toBe(401);
    vi.stubEnv("SCHEDULING_RECOVERY_SECRET_PREVIOUS", previous);
    expect((await cronRoute(ok)(req(previous), {})).status).toBe(200);
    expect((await cronRoute(ok)(req(current), {})).status).toBe(200);
    vi.stubEnv("SCHEDULING_RECOVERY_SECRET_PREVIOUS", "");
    expect((await cronRoute(ok)(req(previous), {})).status).toBe(401);   // retired: refused again
  });
  it("never accepts a short or empty previous secret, and an empty bearer never matches an empty setting", async () => {
    vi.stubEnv("SCHEDULING_RECOVERY_SECRET", secret());
    vi.stubEnv("SCHEDULING_RECOVERY_SECRET_PREVIOUS", "short");
    expect((await cronRoute(ok)(req("short"), {})).status).toBe(401);
    vi.stubEnv("SCHEDULING_RECOVERY_SECRET_PREVIOUS", "");
    expect((await cronRoute(ok)(new Request("http://localhost/x", { headers: { authorization: "Bearer " } }), {})).status).toBe(401);
  });
  it("a previous secret alone (no current one) opens nothing", async () => {
    const previous = secret();
    vi.stubEnv("SCHEDULING_RECOVERY_SECRET", "");
    vi.stubEnv("CRON_SECRET", "");
    vi.stubEnv("SCHEDULING_RECOVERY_SECRET_PREVIOUS", previous);
    expect((await cronRoute(ok)(req(previous), {})).status).toBe(401);
  });
  it("production refuses to start with a previous secret that is short or equal to the current one", () => {
    const base = { VERCEL_ENV: "production", NODE_ENV: "production", SCHEDULING_OPERATIONS_ENABLED: "true", SCHEDULING_BACKEND: "supabase", SCHEDULING_GOOGLE: "live", SCHEDULING_ZOOM: "live", SCHEDULING_EMAIL: "resend",
      SCHEDULING_RECOVERY_SECRET: secret(), SCHEDULING_GOOGLE_REDIRECT_URI: "https://modernbusinessarchitect.com/api/admin/scheduling/google/callback",
      SCHEDULING_EMAIL_FROM: "Martin Dubreuil <martin@mindrasolutions.com>", SCHEDULING_EMAIL_REPLY_TO: "martin@mindrasolutions.com" };
    expect(() => assertSchedulingRuntime({ ...base, SCHEDULING_RECOVERY_SECRET_PREVIOUS: "short" })).toThrow(/PREVIOUS/);
    expect(() => assertSchedulingRuntime({ ...base, SCHEDULING_RECOVERY_SECRET_PREVIOUS: base.SCHEDULING_RECOVERY_SECRET })).toThrow(/PREVIOUS/);
    expect(() => assertSchedulingRuntime({ ...base, SCHEDULING_RECOVERY_SECRET_PREVIOUS: secret() })).not.toThrow();
  });
});

describe("the offline key-ring check", () => {
  const key = () => randomBytes(32).toString("base64");
  const good = () => ({ SCHEDULING_TOKEN_KEY: key(), SCHEDULING_TOKEN_KEY_VERSION: "1", SCHEDULING_RECOVERY_SECRET: secret() });
  it("accepts a valid set and reports short fingerprints, never a value", () => {
    const env = good();
    const r = checkKeyring(env);
    expect(r.ok).toBe(true);
    const text = JSON.stringify(r);
    for (const v of Object.values(env)) if (v.length > 8) expect(text).not.toContain(v);
    expect(r.secrets.SCHEDULING_TOKEN_KEY.fingerprint).toMatch(/^[0-9a-f]{12}$/);
  });
  it("is stable: the same secret always has the same fingerprint, so a restored backup can be compared", () => {
    const env = good();
    expect(checkKeyring(env).secrets.SCHEDULING_TOKEN_KEY.fingerprint).toBe(checkKeyring({ ...env }).secrets.SCHEDULING_TOKEN_KEY.fingerprint);
  });
  it("flags a missing, short or malformed secret", () => {
    expect(checkKeyring({}).problems).toEqual(expect.arrayContaining(["SCHEDULING_TOKEN_KEY is missing", "SCHEDULING_RECOVERY_SECRET is missing"]));
    expect(checkKeyring({ ...good(), SCHEDULING_TOKEN_KEY: Buffer.from("short").toString("base64") }).ok).toBe(false);
    expect(checkKeyring({ ...good(), SCHEDULING_RECOVERY_SECRET: "tooshort" }).problems.join()).toMatch(/at least 32/);
  });
  it("validates a rotation pair: both keys valid, different, with different versions and an explicit previous version", () => {
    const env = { ...good(), SCHEDULING_TOKEN_KEY_VERSION: "2" };
    expect(checkKeyring({ ...env, SCHEDULING_TOKEN_KEY_PREVIOUS: key(), SCHEDULING_TOKEN_KEY_PREVIOUS_VERSION: "1" }).ok).toBe(true);
    expect(checkKeyring({ ...env, SCHEDULING_TOKEN_KEY_PREVIOUS: env.SCHEDULING_TOKEN_KEY, SCHEDULING_TOKEN_KEY_PREVIOUS_VERSION: "1" }).problems.join()).toMatch(/identical/);
    expect(checkKeyring({ ...env, SCHEDULING_TOKEN_KEY_PREVIOUS: key(), SCHEDULING_TOKEN_KEY_PREVIOUS_VERSION: "2" }).problems.join()).toMatch(/same version/);
    expect(checkKeyring({ ...env, SCHEDULING_TOKEN_KEY_PREVIOUS: key() }).problems.join()).toMatch(/PREVIOUS_VERSION must be set/);
  });
  it("refuses a recovery secret that equals the site-wide cron secret or its own previous value", () => {
    const env = good();
    expect(checkKeyring({ ...env, CRON_SECRET: env.SCHEDULING_RECOVERY_SECRET }).problems.join()).toMatch(/CRON_SECRET/);
    expect(checkKeyring({ ...env, SCHEDULING_RECOVERY_SECRET_PREVIOUS: env.SCHEDULING_RECOVERY_SECRET }).problems.join()).toMatch(/identical/);
  });
  it("reads an env file (quotes, comments, export) without evaluating it", () => {
    expect(parseEnvFile("# c\nexport A=\"x y\"\nB='z'\nC=plain\n  # D=hidden\n")).toEqual({ A: "x y", B: "z", C: "plain" });
  });
});
