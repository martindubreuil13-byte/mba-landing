import "server-only";
import { hasAdminSessionCookie } from "@/app/lib/consent/signals";
import { checkRateLimit } from "@/app/lib/rateLimit";
import { deploymentEnv, type DeploymentEnv } from "@/app/lib/deployment";
import { getServiceClient } from "@/app/lib/supabase/service";
import { browserFamily, classifySource, deviceCategory, isAutomatedUserAgent, DEFAULT_AI_DOMAINS, type AiDomain } from "./classify";
import { MAX_BODY_BYTES, parseCollectBody, type CleanBatch } from "./payload";

// Abuse bounds. Keyed by the random per-tab session id plus global buckets: nothing about the visitor's network address is
// used or stored. A client that rotates session ids is bounded by the global caps, which also bound how fast an unauthenticated
// attacker could grow the database (worst case 40,000 beacons, about 40 MB, per day). Legitimate traffic for this site is far
// below them; if the site outgrows them, raise the constants. When exceeded, analytics drop; the site itself is unaffected.
const RATE_WINDOW_SECONDS = 60;
const RATE_MAX_BEACONS_PER_SESSION = 90;
const RATE_MAX_BEACONS_PER_HOUR = 5_000;
const RATE_MAX_BEACONS_PER_DAY = 40_000;
const AI_DOMAIN_TTL_MS = 5 * 60 * 1000;

let aiCache: { at: number; domains: AiDomain[] } | null = null;

/** The editable AI-domain list (wi_ai_referral_domains), cached briefly; built-in defaults if the table is unreachable. */
export async function loadAiDomains(now = Date.now()): Promise<AiDomain[]> {
  if (aiCache && now - aiCache.at < AI_DOMAIN_TTL_MS) return aiCache.domains;
  try {
    const { data, error } = await getServiceClient().from("wi_ai_referral_domains").select("domain, platform").eq("active", true);
    if (error || !data?.length) throw error ?? new Error("empty");
    aiCache = { at: now, domains: data as AiDomain[] };
  } catch {
    aiCache = { at: now, domains: DEFAULT_AI_DOMAINS };
  }
  return aiCache.domains;
}

/**
 * Browsers attach Origin to cross-site POSTs. A beacon whose Origin is another site is not our tracker (it is another page
 * trying to inject data), so it is acknowledged and dropped. Same-origin requests, and clients that send no Origin, pass.
 */
export function isCrossSite(headers: Headers): boolean {
  const origin = headers.get("origin");
  const host = headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host !== host;
  } catch {
    return true;
  }
}

export type CollectOutcome =
  | { status: 204 }
  | { status: 400 | 413 | 429 | 202 };

export function buildSessionRow(batch: CleanBatch, headers: Headers, aiDomains: AiDomain[], environment: DeploymentEnv = deploymentEnv()) {
  const ua = headers.get("user-agent") ?? "";
  const host = headers.get("host")?.split(":")[0] ?? "";
  const source = classifySource(
    {
      referrer: batch.entry.referrer,
      utmSource: batch.entry.utmSource,
      utmMedium: batch.entry.utmMedium,
      utmCampaign: batch.entry.utmCampaign,
      ownHosts: host ? [host] : [], // the browser already omits same-origin referrers; this is the server-side backstop
    },
    aiDomains
  );
  const country = headers.get("x-vercel-ip-country");
  return {
    id: batch.sid,
    environment,
    landing_path: batch.entry.landingPath,
    referrer: batch.entry.referrer,
    referrer_host: batch.entry.referrerHost,
    utm_source: batch.entry.utmSource,
    utm_medium: batch.entry.utmMedium,
    utm_campaign: batch.entry.utmCampaign,
    utm_content: batch.entry.utmContent,
    source_category: source.category,
    source_detail: source.detail,
    ai_platform: source.aiPlatform,
    source_evidence: source.evidence,
    device: deviceCategory(ua),
    browser: browserFamily(ua),
    country: country && /^[A-Za-z]{2}$/.test(country) ? country.toUpperCase() : null,
  };
}

/** Handles one beacon. Never throws; the response carries no body so nothing about the data model leaks. */
export async function handleCollect(req: Request): Promise<CollectOutcome> {
  if (isCrossSite(req.headers)) return { status: 204 };
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) return { status: 413 };
  const text = await req.text();
  if (text.length > MAX_BODY_BYTES) return { status: 413 };

  const batch = parseCollectBody(text);
  if (!batch) return { status: 400 };

  // Accepted but never counted: automation, AI crawlers, and the signed-in admin.
  if (isAutomatedUserAgent(req.headers.get("user-agent"))) return { status: 204 };
  if (hasAdminSessionCookie(req.headers.get("cookie"))) return { status: 204 };
  if (!batch.pageviews.length && !batch.leaves.length && !batch.events.length) return { status: 204 };

  try {
    const ok = await Promise.all([
      checkRateLimit(`wi:s:${batch.sid}`, RATE_WINDOW_SECONDS, RATE_MAX_BEACONS_PER_SESSION),
      checkRateLimit("wi:hour", 3_600, RATE_MAX_BEACONS_PER_HOUR),
      checkRateLimit("wi:day", 86_400, RATE_MAX_BEACONS_PER_DAY),
    ]);
    if (ok.some((allowed) => !allowed)) return { status: 429 };
  } catch {
    // Database unavailable or refused (e.g. a non-production deployment pointed at production): record nothing.
    return { status: 202 };
  }

  try {
    const session = buildSessionRow(batch, req.headers, await loadAiDomains());
    const { error } = await getServiceClient().rpc("wi_ingest", {
      p: { session, pageviews: batch.pageviews, leaves: batch.leaves, events: batch.events },
    });
    if (error) throw new Error(error.message);
    return { status: 204 };
  } catch (error) {
    console.error("Website Intelligence ingest failed:", error instanceof Error ? error.message : error);
    return { status: 202 };
  }
}
