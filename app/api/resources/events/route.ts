import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/app/lib/rateLimit";
import { getResourceConfig } from "@/app/lib/resources/config";
import { CLIENT_EVENT_NAMES, CTA_LOCATIONS, SESSION_ID_PATTERN, type ClientEventName } from "@/app/lib/resources/events";
import { deviceTypeFromUserAgent, isDuplicateEvent, isLikelyBot, recordResourceEvent } from "@/app/lib/resources/event-store";
import { getPublishedResourceBySlug } from "@/app/lib/resources/queries";

// Anonymous analytics endpoint: generous but bounded per IP.
const RATE_LIMIT_WINDOW_SECONDS = 10 * 60;
const RATE_LIMIT_MAX_REQUESTS = 120;

function clean(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, maxLength);
  return trimmed || null;
}

/** Path only: strips any query string or fragment so nothing identifying is stored. */
function pathOnly(value: unknown) {
  const raw = clean(value, 300);
  if (!raw || !raw.startsWith("/")) return null;
  return raw.split(/[?#]/)[0];
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const name = body.event as ClientEventName;
  const slug = clean(body.slug, 200);
  const sessionId = typeof body.sessionId === "string" && SESSION_ID_PATTERN.test(body.sessionId) ? body.sessionId : null;
  if (!CLIENT_EVENT_NAMES.includes(name) || !slug || !sessionId) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  const ctaLocation = clean(body.ctaLocation, 20);
  if (ctaLocation && !(CTA_LOCATIONS as readonly string[]).includes(ctaLocation)) {
    return NextResponse.json({ error: "Invalid CTA location" }, { status: 400 });
  }

  // Bots and crawlers are acknowledged but never counted.
  const userAgent = req.headers.get("user-agent");
  if (isLikelyBot(userAgent)) return NextResponse.json({ success: true, counted: false });

  const ip = getClientIp(req);
  if (!(await checkRateLimit(`resource_events:${ip}`, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_MAX_REQUESTS))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // Only events for real, published, tracked resources are stored.
  if (!getResourceConfig(slug)) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  const resource = await getPublishedResourceBySlug(slug);
  if (!resource) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });

  if (await isDuplicateEvent(name, resource.id, sessionId)) {
    return NextResponse.json({ success: true, counted: false });
  }

  const attribution = (body.attribution ?? {}) as Record<string, unknown>;
  const referrerHost = (() => {
    const raw = clean(body.referrer, 500);
    if (!raw) return null;
    try {
      return new URL(raw).hostname.replace(/^www\./, "");
    } catch {
      return null;
    }
  })();

  await recordResourceEvent({
    name,
    resource,
    sessionId,
    ctaLocation,
    pageUrl: pathOnly(body.pagePath),
    referrer: referrerHost,
    utmSource: clean(attribution.source, 200),
    utmMedium: clean(attribution.medium, 200),
    utmCampaign: clean(attribution.campaign, 200),
    deviceType: deviceTypeFromUserAgent(userAgent),
  });

  return NextResponse.json({ success: true, counted: true });
}
