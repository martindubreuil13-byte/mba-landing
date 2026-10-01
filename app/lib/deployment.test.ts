import { describe, expect, it } from "vitest";
import { appBaseUrl, assertDatabaseAllowed, assertDatabaseAllowedForDeployment, deploymentEnv, isProductionDatabaseUrl, isProductionDeployment, IsolatedDatabaseRequiredError } from "./deployment";

const SITE = "https://modernbusinessarchitect.com";
const PROD_DB = "https://sbntzyivfhvogxiiysuh.supabase.co";

describe("deploymentEnv (fails closed)", () => {
  it("on Vercel, only VERCEL_ENV=production is production", () => {
    expect(deploymentEnv({ VERCEL_ENV: "production" })).toBe("production");
    expect(deploymentEnv({ VERCEL: "1", VERCEL_ENV: "production" })).toBe("production");
    expect(deploymentEnv({ VERCEL_ENV: "preview" })).toBe("preview");
    expect(deploymentEnv({ VERCEL_ENV: "development" })).toBe("development");
  });
  it("on Vercel, a missing or unknown VERCEL_ENV is a preview, never production", () => {
    expect(deploymentEnv({ VERCEL: "1" })).toBe("preview");
    expect(deploymentEnv({ VERCEL: "1", NODE_ENV: "production" })).toBe("preview");
    expect(deploymentEnv({ VERCEL_ENV: "staging" })).toBe("preview");
  });
  it("on Vercel, APP_ENV can neither promote a preview nor demote production", () => {
    expect(deploymentEnv({ VERCEL_ENV: "preview", APP_ENV: "production" })).toBe("preview");
    expect(deploymentEnv({ VERCEL_ENV: "production", APP_ENV: "preview" })).toBe("production");
  });
  it("NODE_ENV=production by itself is never production", () => {
    expect(deploymentEnv({ NODE_ENV: "production" })).toBe("development");
    expect(isProductionDeployment({ NODE_ENV: "production" })).toBe(false);
  });
  it("outside Vercel, production needs an explicit APP_ENV=production", () => {
    expect(deploymentEnv({ APP_ENV: "production" })).toBe("production");
    expect(deploymentEnv({ APP_ENV: "production", NODE_ENV: "production" })).toBe("production");
    expect(deploymentEnv({ APP_ENV: "preview" })).toBe("preview");
    expect(deploymentEnv({ APP_ENV: "prod" })).toBe("development");
    expect(deploymentEnv({ APP_ENV: "PRODUCTION" })).toBe("development");
    expect(deploymentEnv({})).toBe("development");
  });
  it("only 'production' is production", () => {
    expect(isProductionDeployment({ VERCEL_ENV: "production" })).toBe(true);
    expect(isProductionDeployment({ VERCEL_ENV: "preview" })).toBe(false);
    expect(isProductionDeployment({})).toBe(false);
  });
});

describe("appBaseUrl", () => {
  it("production keeps the canonical site unless APP_BASE_URL is set", () => {
    expect(appBaseUrl(SITE, { VERCEL_ENV: "production" })).toBe(SITE);
    expect(appBaseUrl(SITE, { VERCEL_ENV: "production", APP_BASE_URL: "https://example.test/" })).toBe("https://example.test");
  });
  it("a preview uses APP_BASE_URL, else its own deployment URL, and never the production domain", () => {
    expect(appBaseUrl(SITE, { VERCEL_ENV: "preview", APP_BASE_URL: "https://preview.example.test/" })).toBe("https://preview.example.test");
    expect(appBaseUrl(SITE, { VERCEL_ENV: "preview", VERCEL_URL: "mba-git-feature-x.vercel.app" })).toBe("https://mba-git-feature-x.vercel.app");
    expect(appBaseUrl(SITE, { VERCEL_ENV: "preview" })).toBe("http://localhost:3000");
    expect(appBaseUrl(SITE, {})).not.toContain("modernbusinessarchitect.com");
  });
});

describe("production database guard", () => {
  it("recognises the production project by host", () => {
    expect(isProductionDatabaseUrl(PROD_DB)).toBe(true);
    expect(isProductionDatabaseUrl("https://SBNTZYIVFHVOGXIIYSUH.supabase.co/")).toBe(true);
    expect(isProductionDatabaseUrl("https://otherproject123.supabase.co")).toBe(false);
    expect(isProductionDatabaseUrl("http://127.0.0.1:54321")).toBe(false);
    expect(isProductionDatabaseUrl(undefined)).toBe(false);
  });
  it("can be pointed at a different production ref", () => {
    expect(isProductionDatabaseUrl("https://abc.supabase.co", { PRODUCTION_SUPABASE_PROJECT_REF: "abc" })).toBe(true);
  });
  it("refuses production data in preview and development, never in production", () => {
    expect(() => assertDatabaseAllowed(PROD_DB, { VERCEL_ENV: "preview" })).toThrow(IsolatedDatabaseRequiredError);
    expect(() => assertDatabaseAllowed(PROD_DB, { NODE_ENV: "development" })).toThrow(/isolated Supabase project/);
    expect(() => assertDatabaseAllowed(PROD_DB, { NODE_ENV: "production" })).toThrow(IsolatedDatabaseRequiredError);
    expect(() => assertDatabaseAllowed(PROD_DB, { VERCEL: "1" })).toThrow(IsolatedDatabaseRequiredError);
    expect(() => assertDatabaseAllowed(PROD_DB, { VERCEL_ENV: "production" })).not.toThrow();
    expect(() => assertDatabaseAllowed(PROD_DB, { APP_ENV: "production" })).not.toThrow();
    expect(() => assertDatabaseAllowed("https://isolated.supabase.co", { VERCEL_ENV: "preview" })).not.toThrow();
  });
});

describe("production database guard in the browser bundle", () => {
  it("fails closed: only an explicit 'production' build may use the production project", () => {
    expect(() => assertDatabaseAllowedForDeployment("production", PROD_DB)).not.toThrow();
    for (const deployment of ["preview", "development", "", undefined, "prod"]) {
      expect(() => assertDatabaseAllowedForDeployment(deployment, PROD_DB)).toThrow(IsolatedDatabaseRequiredError);
    }
    expect(() => assertDatabaseAllowedForDeployment("preview", "https://isolated.supabase.co")).not.toThrow();
  });
});
