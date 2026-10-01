import { appBaseUrl as resolveBaseUrl } from "@/app/lib/deployment";
import { SITE_URL } from "@/app/lib/seo";

/**
 * Origin used for links inside emails and API responses. Production leaves
 * APP_BASE_URL unset and gets the canonical site; any other environment gets its
 * own URL, never the production domain (see deployment.ts).
 */
export function appBaseUrl(): string {
  return resolveBaseUrl(SITE_URL);
}
