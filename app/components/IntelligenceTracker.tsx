"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackIntelligencePageview } from "@/app/lib/intelligence/client";

/** First-party, cookieless page-view collection for Website Intelligence (see app/lib/intelligence/client.ts). */
export default function IntelligenceTracker() {
  const pathname = usePathname();
  useEffect(() => {
    trackIntelligencePageview(pathname);
  }, [pathname]);
  return null;
}
