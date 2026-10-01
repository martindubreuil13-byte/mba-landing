"use client";

import React from "react";
import { sendResourceEvent } from "@/app/lib/resources/client-events";
import type { CtaLocation } from "@/app/lib/resources/events";

export type ConsentProps = {
  id: string;
  buttonLabel: string;
  communityNote: string;
  disclosure: string;
  privacyLinkText: string;
};

export type DeliveredState = {
  downloadUrl: string;
  backupUrl: string;
  emailStatus: "queued" | "failed" | "already_sent";
  consent: "pending_confirmation" | "existing" | "not_applied";
  /** The CTA the visitor used; its panel shows the full success state. */
  location: CtaLocation;
};

type Ctx = {
  slug: string;
  title: string;
  consent: ConsentProps;
  openLocation: CtaLocation | null;
  delivered: DeliveredState | null;
  openForm: (location: CtaLocation) => void;
  closeForm: () => void;
  completeDelivery: (state: DeliveredState) => void;
};

const GuideContext = React.createContext<Ctx | null>(null);

export function useGuideExperience(): Ctx {
  const ctx = React.useContext(GuideContext);
  if (!ctx) throw new Error("useGuideExperience must be used inside ResourceGuideProvider");
  return ctx;
}

/**
 * Shared state for every printable-guide CTA on the page. All CTAs open the
 * SAME form component (one at a time) and share the delivered state, so there
 * is one form, one consent wording and one analytics path.
 */
export default function ResourceGuideProvider({
  slug,
  title,
  consent,
  children,
}: {
  slug: string;
  title: string;
  consent: ConsentProps;
  children: React.ReactNode;
}) {
  const [openLocation, setOpenLocation] = React.useState<CtaLocation | null>(null);
  const [delivered, setDelivered] = React.useState<DeliveredState | null>(null);

  const value = React.useMemo<Ctx>(
    () => ({
      slug,
      title,
      consent,
      openLocation,
      delivered,
      openForm: (location) => {
        sendResourceEvent("resource_cta_clicked", slug, location);
        setOpenLocation(location);
      },
      closeForm: () => setOpenLocation(null),
      completeDelivery: (state) => {
        setDelivered(state);
        setOpenLocation(state.location);
      },
    }),
    [slug, title, consent, openLocation, delivered]
  );

  return <GuideContext.Provider value={value}>{children}</GuideContext.Provider>;
}
