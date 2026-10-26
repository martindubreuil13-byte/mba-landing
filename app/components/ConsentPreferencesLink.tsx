"use client";

import { GA_AVAILABLE, OPEN_CONSENT_EVENT } from "@/app/components/ConsentManager";

/** "Analytics preferences": lets any visitor review or change the Google Analytics choice. Rendered only where GA exists. */
export default function ConsentPreferencesLink({ className = "" }: { className?: string }) {
  if (!GA_AVAILABLE) return null;
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))} className={`underline underline-offset-2 hover:text-[#1a1816] ${className}`}>
      Analytics preferences
    </button>
  );
}
