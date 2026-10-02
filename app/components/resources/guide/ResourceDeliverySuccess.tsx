"use client";

import React from "react";
import Link from "next/link";
import { useGuideExperience } from "./ResourceGuideProvider";

/**
 * The state after the form is accepted. Deliberately identical for every outcome (new address, pending, already a
 * member, unsubscribed, suppressed): it never shows a download and never says which case applied.
 */
export default function ResourceDeliverySuccess() {
  const { checkInbox } = useGuideExperience();
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  React.useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="space-y-4" role="status">
      <h3 ref={headingRef} tabIndex={-1} className="text-2xl md:text-3xl font-light text-[#1a1816] outline-none">
        {checkInbox.heading}
      </h3>
      <p className="text-base leading-relaxed text-[#1a1816]/75 max-w-xl">{checkInbox.body}</p>
      <p className="text-sm leading-relaxed text-[#1a1816]/60 max-w-xl">
        {checkInbox.hint}{" "}
        <Link href="/rejoin" className="underline underline-offset-2 hover:text-[#1a1816]">
          Unsubscribed in the past? Rejoin here.
        </Link>
      </p>
    </div>
  );
}
