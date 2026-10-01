"use client";

import React from "react";
import type { CtaLocation } from "@/app/lib/resources/events";
import ResourceDeliverySuccess from "./ResourceDeliverySuccess";
import ResourceLeadForm from "./ResourceLeadForm";
import { useGuideExperience } from "./ResourceGuideProvider";

type Props = {
  location: CtaLocation;
  heading?: string;
  body: string;
  button: string;
  /** Optional second action, e.g. READ ONLINE at the top of the page. */
  secondary?: { label: string; href: string };
};

const BUTTON =
  "inline-block text-sm font-semibold tracking-widest uppercase px-6 sm:px-8 py-4 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b1f1f]";

/**
 * A printable-guide call to action. Opens the shared ResourceLeadForm inline
 * (no modal, no popup). Once the guide has been delivered every CTA on the page
 * turns into a quiet "download again" link.
 */
export default function PrintableGuideCTA({ location, heading, body, button, secondary }: Props) {
  const { openLocation, delivered, openForm } = useGuideExperience();
  const isOpen = openLocation === location;

  return (
    <div data-cta-location={location} className="border border-[#1a1816]/10 bg-[#f5f1ed] p-6 md:p-10">
      {isOpen && delivered ? (
        <ResourceDeliverySuccess delivered={delivered} />
      ) : isOpen ? (
        <ResourceLeadForm location={location} />
      ) : delivered ? (
        <div className="space-y-3">
          <p className="text-base text-[#1a1816]/75">You already have the printable guide.</p>
          <a href={delivered.backupUrl} className={`${BUTTON} text-white bg-[#6b1f1f] hover:bg-[#6b1f1f]/90`}>
            Download the PDF →
          </a>
        </div>
      ) : (
        <div className="space-y-5">
          {heading && <h2 className="text-2xl md:text-3xl font-light text-[#1a1816]">{heading}</h2>}
          <p className="text-base md:text-lg leading-relaxed text-[#1a1816]/80 max-w-2xl">{body}</p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {secondary && (
              <a href={secondary.href} className={`${BUTTON} text-[#6b1f1f] border border-[#6b1f1f] hover:bg-[#6b1f1f]/5`}>
                {secondary.label}
              </a>
            )}
            <button
              type="button"
              onClick={() => openForm(location)}
              aria-expanded={false}
              className={`${BUTTON} text-white bg-[#6b1f1f] hover:bg-[#6b1f1f]/90 text-left`}
            >
              {button}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
