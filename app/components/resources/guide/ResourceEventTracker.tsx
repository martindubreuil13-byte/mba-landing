"use client";

import React from "react";
import { READ_COMPLETED_MIN_SECONDS } from "@/app/lib/resources/events";
import { sendResourceEvent } from "@/app/lib/resources/client-events";

/**
 * Anonymous reading analytics. Renders nothing.
 *  - page view        on load (the server de-duplicates per session / 30 min)
 *  - read started     the first section after the cover scrolls into view
 *  - read completed   the final section is reached AND at least
 *                     READ_COMPLETED_MIN_SECONDS have passed since reading started.
 *                     A proxy for reading, not proof of it.
 */
export default function ResourceEventTracker({ slug }: { slug: string }) {
  React.useEffect(() => {
    sendResourceEvent("resource_page_view", slug);

    const startEl = document.querySelector("[data-read-start]");
    const endEl = document.querySelector("[data-read-end]");
    let startedAt: number | null = null;
    let completed = false;
    let endVisible = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tryComplete = () => {
      if (completed || startedAt === null || !endVisible) return;
      const elapsed = (Date.now() - startedAt) / 1000;
      if (elapsed >= READ_COMPLETED_MIN_SECONDS) {
        completed = true;
        sendResourceEvent("resource_read_completed", slug);
      } else if (!timer) {
        timer = setTimeout(() => {
          timer = null;
          tryComplete();
        }, (READ_COMPLETED_MIN_SECONDS - elapsed) * 1000 + 50);
      }
    };

    const startObserver = new IntersectionObserver(
      (entries) => {
        if (startedAt === null && entries.some((e) => e.isIntersecting)) {
          startedAt = Date.now();
          sendResourceEvent("resource_read_started", slug);
          startObserver.disconnect();
          tryComplete();
        }
      },
      { threshold: 0.25 }
    );
    const endObserver = new IntersectionObserver(
      (entries) => {
        endVisible = entries.some((e) => e.isIntersecting);
        tryComplete();
      },
      { threshold: 0.3 }
    );

    if (startEl) startObserver.observe(startEl);
    if (endEl) endObserver.observe(endEl);

    return () => {
      startObserver.disconnect();
      endObserver.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [slug]);

  return null;
}
