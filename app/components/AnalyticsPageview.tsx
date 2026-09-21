"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/app/lib/analytics";

const UUID_SEGMENT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Replaces UUID-shaped path segments (assessment results, admin detail
 * pages, and any future dynamic route of this shape) with `:id` before
 * anything reaches analytics — GA should know a private result was viewed,
 * not which one. */
function sanitizePath(pathname: string) {
  return pathname
    .split("/")
    .map((segment) => (UUID_SEGMENT.test(segment) ? ":id" : segment))
    .join("/");
}

/**
 * Fires GA4 page_view manually with a sanitized path, for every route
 * (including this SPA's client-side navigations, which the previous
 * automatic-pageview-only setup never tracked at all). The root layout's
 * gtag config call has `send_page_view: false` so this is the ONLY source
 * of page_view events — deliberately, so no code path can send a raw
 * UUID-bearing URL to analytics.
 */
export default function AnalyticsPageview() {
  const pathname = usePathname();
  const lastSent = useRef<string | null>(null);

  useEffect(() => {
    const sanitizedPath = sanitizePath(pathname);
    if (lastSent.current === sanitizedPath) return;
    lastSent.current = sanitizedPath;

    const sanitizedUrl =
      typeof window !== "undefined" ? `${window.location.origin}${sanitizedPath}${window.location.search}` : sanitizedPath;

    trackEvent("page_view", {
      page_path: sanitizedPath,
      page_location: sanitizedUrl,
      page_title: typeof document !== "undefined" ? document.title : undefined,
    });
  }, [pathname]);

  return null;
}
