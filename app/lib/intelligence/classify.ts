/**
 * Website Intelligence: traffic-source, device and browser classification. Pure functions, no I/O, so every rule is
 * unit-tested. Raw referrer + UTM values are stored next to the result, so a rule change can be re-applied later.
 *
 * Precedence (first match wins):
 *   1. AI assistant   : utm_source names a known AI platform, or the referrer host is on the AI domain list
 *   2. Known platform : utm_source names LinkedIn / Facebook / Instagram / Substack / Google, or the referrer host does
 *   3. Campaign       : any utm_medium or utm_campaign is present (and nothing above matched)
 *   4. Search / social / other referral by referrer host (own site excluded)
 *   5. Direct / unknown : no usable evidence. NEVER guessed to be AI or anything else.
 */

export const SOURCE_CATEGORIES = [
  "direct",
  "google_organic",
  "other_organic",
  "linkedin",
  "facebook",
  "instagram",
  "substack",
  "other_social",
  "ai_assistant",
  "other_referral",
  "campaign",
] as const;
export type SourceCategory = (typeof SOURCE_CATEGORIES)[number];

export const SOURCE_LABELS: Record<SourceCategory, string> = {
  direct: "Direct / unknown",
  google_organic: "Google organic",
  other_organic: "Other organic search",
  linkedin: "LinkedIn",
  facebook: "Facebook",
  instagram: "Instagram",
  substack: "Substack",
  other_social: "Other social",
  ai_assistant: "AI assistant",
  other_referral: "Other referral",
  campaign: "Campaign",
};

export type AiDomain = { domain: string; platform: string };

/** Defaults used when the wi_ai_referral_domains table is unreachable; the table is the editable source of truth. */
export const DEFAULT_AI_DOMAINS: AiDomain[] = [
  { domain: "chatgpt.com", platform: "ChatGPT" },
  { domain: "chat.openai.com", platform: "ChatGPT" },
  { domain: "claude.ai", platform: "Claude" },
  { domain: "perplexity.ai", platform: "Perplexity" },
  { domain: "gemini.google.com", platform: "Gemini" },
  { domain: "bard.google.com", platform: "Gemini" },
  { domain: "copilot.microsoft.com", platform: "Microsoft Copilot" },
  { domain: "copilot.cloud.microsoft", platform: "Microsoft Copilot" },
  { domain: "edgeservices.bing.com", platform: "Microsoft Copilot" },
  { domain: "chat.deepseek.com", platform: "DeepSeek" },
  { domain: "grok.com", platform: "Grok" },
  { domain: "meta.ai", platform: "Meta AI" },
  { domain: "you.com", platform: "You.com" },
  { domain: "phind.com", platform: "Phind" },
  { domain: "poe.com", platform: "Poe" },
  { domain: "chat.mistral.ai", platform: "Le Chat (Mistral)" },
  { domain: "duck.ai", platform: "Duck.ai" },
];

const SEARCH_ENGINES: Record<string, string> = {
  "bing.com": "Bing",
  "duckduckgo.com": "DuckDuckGo",
  "ecosia.org": "Ecosia",
  "search.yahoo.com": "Yahoo",
  "yahoo.com": "Yahoo",
  "brave.com": "Brave",
  "yandex.com": "Yandex",
  "yandex.ru": "Yandex",
  "baidu.com": "Baidu",
  "qwant.com": "Qwant",
  "startpage.com": "Startpage",
  "kagi.com": "Kagi",
};

const SOCIAL_HOSTS: Record<string, SourceCategory> = {
  "linkedin.com": "linkedin",
  "lnkd.in": "linkedin",
  "facebook.com": "facebook",
  "fb.com": "facebook",
  "l.facebook.com": "facebook",
  "m.facebook.com": "facebook",
  "instagram.com": "instagram",
  "l.instagram.com": "instagram",
  "substack.com": "substack",
  "twitter.com": "other_social",
  "x.com": "other_social",
  "t.co": "other_social",
  "reddit.com": "other_social",
  "youtube.com": "other_social",
  "tiktok.com": "other_social",
  "pinterest.com": "other_social",
  "threads.net": "other_social",
  "bsky.app": "other_social",
  "news.ycombinator.com": "other_social",
  "medium.com": "other_social",
  "quora.com": "other_social",
  "whatsapp.com": "other_social",
  "t.me": "other_social",
};

/** utm_source values (lower-case) that map to a category. */
const UTM_SOURCE_CATEGORY: Record<string, SourceCategory> = {
  linkedin: "linkedin",
  "linkedin.com": "linkedin",
  lnkd: "linkedin",
  facebook: "facebook",
  fb: "facebook",
  "facebook.com": "facebook",
  instagram: "instagram",
  ig: "instagram",
  substack: "substack",
  twitter: "other_social",
  x: "other_social",
  reddit: "other_social",
  youtube: "other_social",
  tiktok: "other_social",
};

/** utm_source values that name an AI platform without being a domain (domains are matched against the AI list). */
const UTM_AI_ALIASES: Record<string, string> = {
  chatgpt: "ChatGPT",
  openai: "ChatGPT",
  claude: "Claude",
  perplexity: "Perplexity",
  gemini: "Gemini",
  copilot: "Microsoft Copilot",
  grok: "Grok",
  deepseek: "DeepSeek",
};

export type SourceInput = {
  /** Referrer origin + path (no query), or null. */
  referrer: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  /** The site's own host(s); a referrer from these is an internal navigation, not a source. */
  ownHosts?: string[];
};

export type SourceResult = {
  category: SourceCategory;
  /** Specific origin: referring host, UTM source, or search engine name. Null for direct. */
  detail: string | null;
  aiPlatform: string | null;
  /** The exact evidence used, e.g. "referrer:chatgpt.com" or "utm_source:chatgpt.com". */
  evidence: string | null;
};

export function hostOf(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}

const hostMatches = (host: string, domain: string) => host === domain || host.endsWith(`.${domain}`);

function matchAi(candidate: string, aiDomains: AiDomain[]): AiDomain | undefined {
  const c = candidate.toLowerCase().replace(/^www\./, "");
  return aiDomains.find((d) => hostMatches(c, d.domain));
}

function searchEngine(host: string): string | null {
  if (/(^|\.)google\.[a-z.]{2,6}$/.test(host)) return "Google";
  for (const [domain, name] of Object.entries(SEARCH_ENGINES)) {
    if (hostMatches(host, domain)) return name;
  }
  return null;
}

export function classifySource(input: SourceInput, aiDomains: AiDomain[] = DEFAULT_AI_DOMAINS): SourceResult {
  const utmSource = input.utmSource?.trim().toLowerCase() || null;
  const hasCampaign = Boolean(input.utmMedium?.trim() || input.utmCampaign?.trim());
  let refHost = hostOf(input.referrer);
  if (refHost && (input.ownHosts ?? []).some((h) => hostMatches(refHost!, h.replace(/^www\./, "")))) refHost = null;

  // 1. AI assistant: explicit UTM first (ChatGPT adds utm_source=chatgpt.com), then the referrer host.
  if (utmSource) {
    const platform = matchAi(utmSource, aiDomains)?.platform ?? UTM_AI_ALIASES[utmSource];
    if (platform) return { category: "ai_assistant", detail: utmSource, aiPlatform: platform, evidence: `utm_source:${utmSource}` };
  }
  if (refHost) {
    const ai = matchAi(refHost, aiDomains);
    if (ai) return { category: "ai_assistant", detail: refHost, aiPlatform: ai.platform, evidence: `referrer:${refHost}` };
  }

  // 2. Explicit UTM source naming a known platform.
  if (utmSource) {
    const cat = UTM_SOURCE_CATEGORY[utmSource];
    if (cat) return { category: cat, detail: utmSource, aiPlatform: null, evidence: `utm_source:${utmSource}` };
    if (utmSource === "google" && !hasCampaign) return { category: "google_organic", detail: "Google", aiPlatform: null, evidence: "utm_source:google" };
  }

  // 3. Campaign traffic.
  if (hasCampaign || utmSource) {
    return { category: "campaign", detail: utmSource, aiPlatform: null, evidence: utmSource ? `utm_source:${utmSource}` : "utm_medium/campaign" };
  }

  // 4. Referrer host.
  if (refHost) {
    const engine = searchEngine(refHost);
    if (engine) {
      return { category: engine === "Google" ? "google_organic" : "other_organic", detail: engine, aiPlatform: null, evidence: `referrer:${refHost}` };
    }
    const social = Object.entries(SOCIAL_HOSTS).find(([domain]) => hostMatches(refHost!, domain));
    if (social) return { category: social[1], detail: refHost, aiPlatform: null, evidence: `referrer:${refHost}` };
    return { category: "other_referral", detail: refHost, aiPlatform: null, evidence: `referrer:${refHost}` };
  }

  // 5. Nothing usable: unknown. Deliberately not attributed to anything else.
  return { category: "direct", detail: null, aiPlatform: null, evidence: null };
}

export type DeviceCategory = "mobile" | "tablet" | "desktop";

export function deviceCategory(ua: string | null): DeviceCategory {
  if (!ua) return "desktop";
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) return "tablet";
  if (/mobi|iphone|ipod|android/i.test(ua)) return "mobile";
  return "desktop";
}

export function browserFamily(ua: string | null): string {
  if (!ua) return "Other";
  if (/edg(e|a|ios)?\//i.test(ua)) return "Edge";
  if (/opr\/|opera/i.test(ua)) return "Opera";
  if (/samsungbrowser/i.test(ua)) return "Samsung Internet";
  if (/firefox|fxios/i.test(ua)) return "Firefox";
  if (/chrome|crios|chromium/i.test(ua)) return "Chrome";
  if (/safari/i.test(ua)) return "Safari";
  return "Other";
}

/**
 * Known AI crawler / fetcher user agents. Used ONLY to keep them out of human visitor counts (they do not run
 * JavaScript, so they rarely reach the beacon anyway). It does NOT produce crawler metrics: that needs server-side
 * request logging, which v1 deliberately does not do.
 */
const AUTOMATION_PATTERN =
  /bot\b|bot\/|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|embedly|monitor|uptime|curl|wget|python-requests|httpclient|axios|node-fetch|playwright|puppeteer|phantomjs|selenium|gptbot|chatgpt-user|oai-searchbot|claudebot|claude-web|anthropic|perplexity|ccbot|bytespider|amazonbot|applebot|google-extended|googleother|cohere|diffbot/i;

export function isAutomatedUserAgent(ua: string | null): boolean {
  return !ua || AUTOMATION_PATTERN.test(ua);
}
