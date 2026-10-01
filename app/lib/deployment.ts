/**
 * Where is this code running? Everything that must behave differently outside
 * production (indexing, analytics, email, links, database) asks here, so the rule
 * lives in one place. Dependency-free on purpose: next.config.ts and tests import it too.
 *
 * FAIL CLOSED: "production" has to be positively asserted, and NODE_ENV never counts
 * (local builds, `next start` and preview servers all run with NODE_ENV=production).
 *
 *   On Vercel (VERCEL or VERCEL_ENV is set):  production only if VERCEL_ENV === "production".
 *       "preview", "development", an unknown value or a missing VERCEL_ENV are all non-production.
 *       APP_ENV is ignored here, so it can neither promote a preview nor demote production.
 *   Anywhere else:                             production only if APP_ENV === "production".
 *       APP_ENV=preview is preview; anything else (including nothing) is development.
 */
export type DeploymentEnv = "production" | "preview" | "development";

type Env = Record<string, string | undefined>;

export function deploymentEnv(env: Env = process.env): DeploymentEnv {
  const onVercel = Boolean(env.VERCEL || env.VERCEL_ENV);
  if (onVercel) {
    if (env.VERCEL_ENV === "production") return "production";
    if (env.VERCEL_ENV === "development") return "development";
    return "preview";
  }
  if (env.APP_ENV === "production") return "production";
  if (env.APP_ENV === "preview") return "preview";
  return "development";
}

export const isProductionDeployment = (env: Env = process.env) => deploymentEnv(env) === "production";

/** Value for the X-Robots-Tag header and the robots meta tag outside production. */
export const NOINDEX_DIRECTIVE = "noindex, nofollow";

/**
 * Origin for links inside emails and API responses.
 *  - production: APP_BASE_URL if set, else the canonical site (unchanged behaviour)
 *  - elsewhere:  APP_BASE_URL, else this deployment's own URL. NEVER the production
 *    domain, so a preview can never hand out links that land on production.
 */
export function appBaseUrl(canonicalSiteUrl: string, env: Env = process.env): string {
  const explicit = env.APP_BASE_URL?.trim();
  if (isProductionDeployment(env)) return (explicit || canonicalSiteUrl).replace(/\/$/, "");
  if (explicit) return explicit.replace(/\/$/, "");
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/**
 * The production Supabase project. Not a secret (it is the host of the public
 * API URL). A non-production deployment must never talk to it.
 */
export const PRODUCTION_SUPABASE_REF_DEFAULT = "sbntzyivfhvogxiiysuh";

export function isProductionDatabaseUrl(url: string | undefined, env: Env = process.env): boolean {
  if (!url) return false;
  const ref = env.PRODUCTION_SUPABASE_PROJECT_REF?.trim() || PRODUCTION_SUPABASE_REF_DEFAULT;
  try {
    return new URL(url).hostname.split(".")[0].toLowerCase() === ref.toLowerCase();
  } catch {
    return url.toLowerCase().includes(ref.toLowerCase());
  }
}

export class IsolatedDatabaseRequiredError extends Error {
  constructor() {
    super(
      "This non-production deployment is configured with the production database. Refusing to connect: " +
        "set NEXT_PUBLIC_SUPABASE_URL / keys to an isolated Supabase project for preview environments."
    );
    this.name = "IsolatedDatabaseRequiredError";
  }
}

/** Throws unless the Supabase URL is safe for this deployment. Production is never restricted. */
export function assertDatabaseAllowed(url: string | undefined, env: Env = process.env): void {
  if (!isProductionDeployment(env) && isProductionDatabaseUrl(url, env)) throw new IsolatedDatabaseRequiredError();
}

/**
 * Same rule for code that runs in the browser, where server env vars do not exist.
 * next.config.ts bakes the build-time deployment into NEXT_PUBLIC_DEPLOYMENT_ENV; a
 * missing or unrecognised value is treated as non-production (fail closed).
 */
export function assertDatabaseAllowedForDeployment(deployment: string | undefined, url: string | undefined, env: Env = {}): void {
  if (deployment !== "production" && isProductionDatabaseUrl(url, env)) throw new IsolatedDatabaseRequiredError();
}
