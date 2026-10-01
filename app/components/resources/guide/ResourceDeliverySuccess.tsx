"use client";

import React from "react";
import type { DeliveredState } from "./ResourceGuideProvider";

const EMAIL_LINE: Record<DeliveredState["emailStatus"], string> = {
  queued: "I have also sent a copy to your inbox. If the download does not begin, use the button below.",
  already_sent: "A copy is already in your inbox from a moment ago. If the download does not begin, use the button below.",
  failed: "I could not send the email copy just now, so keep this page open. If the download does not begin, use the button below.",
};

export default function ResourceDeliverySuccess({ delivered }: { delivered: DeliveredState }) {
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  React.useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="space-y-5" role="status">
      <h3 ref={headingRef} tabIndex={-1} className="text-2xl md:text-3xl font-light text-[#1a1816] outline-none">
        Your printable guide is downloading.
      </h3>
      <p className="text-base leading-relaxed text-[#1a1816]/70 max-w-xl">{EMAIL_LINE[delivered.emailStatus]}</p>
      {delivered.consent === "pending_confirmation" && delivered.emailStatus !== "failed" && (
        <p className="text-sm leading-relaxed text-[#1a1816]/60 max-w-xl">
          To start receiving community emails, confirm your address from the link in that email. The guide is yours either way.
        </p>
      )}
      <a
        href={delivered.backupUrl}
        className="inline-block text-sm font-semibold tracking-widest uppercase text-white bg-[#6b1f1f] px-8 py-4 transition-colors hover:bg-[#6b1f1f]/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b1f1f]"
      >
        Download the PDF →
      </a>
    </div>
  );
}
