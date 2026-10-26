"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { onRouteChange } from "@/app/lib/consent/ga";
import { rememberFirstTouch } from "@/app/lib/first-touch";

/**
 * Sends the manual GA4 page_view for every route (initial loads and client-side navigations alike), with UUID-shaped path
 * segments redacted. GA4's own automatic page_view is disabled in the config (`send_page_view: false`), so this is the only
 * source: no code path sends a raw UUID-bearing URL. `onRouteChange` does nothing until GA has been allowed to start, and never
 * sends admin pages (see app/lib/consent/ga.ts).
 */
export default function AnalyticsPageview() {
  const pathname = usePathname();

  useEffect(() => {
    rememberFirstTouch(); // no-op after the first page view of the session
    onRouteChange(pathname);
  }, [pathname]);

  return null;
}
