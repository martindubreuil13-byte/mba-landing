"use client";

import React from "react";
import { sendResourceEvent } from "@/app/lib/resources/client-events";
import type { CtaLocation } from "@/app/lib/resources/events";

export type ConsentProps = {
  id: string;
  heading: string;
  benefitIntro: string;
  buttonLabel: string;
  communityNote: string;
  disclosure: string;
  privacyLinkText: string;
};

/** Copy for the neutral "check your inbox" state (identical for every outcome). */
export type CheckInboxCopy = { heading: string; body: string; hint: string };

/**
 * The form was accepted. This state is the same for every address: it carries no download URL and nothing that says
 * whether the address is new, pending, already a member, unsubscribed or suppressed.
 */
export type SubmittedState = {
  /** The CTA the visitor used; its panel shows the check-inbox state. */
  location: CtaLocation;
};

type Ctx = {
  slug: string;
  title: string;
  consent: ConsentProps;
  checkInbox: CheckInboxCopy;
  openLocation: CtaLocation | null;
  submitted: SubmittedState | null;
  openForm: (location: CtaLocation) => void;
  closeForm: () => void;
  completeSubmission: (state: SubmittedState) => void;
};

const GuideContext = React.createContext<Ctx | null>(null);

export function useGuideExperience(): Ctx {
  const ctx = React.useContext(GuideContext);
  if (!ctx) throw new Error("useGuideExperience must be used inside ResourceGuideProvider");
  return ctx;
}

/**
 * Shared state for every member-benefit CTA on the page. All CTAs open the
 * SAME form component (one at a time) and share the delivered state, so there
 * is one form, one consent wording and one analytics path.
 */
export default function ResourceGuideProvider({
  slug,
  title,
  consent,
  checkInbox,
  children,
}: {
  slug: string;
  title: string;
  consent: ConsentProps;
  checkInbox: CheckInboxCopy;
  children: React.ReactNode;
}) {
  const [openLocation, setOpenLocation] = React.useState<CtaLocation | null>(null);
  const [submitted, setSubmitted] = React.useState<SubmittedState | null>(null);

  const value = React.useMemo<Ctx>(
    () => ({
      slug,
      title,
      consent,
      checkInbox,
      openLocation,
      submitted,
      openForm: (location) => {
        sendResourceEvent("resource_cta_clicked", slug, location);
        setOpenLocation(location);
      },
      closeForm: () => setOpenLocation(null),
      completeSubmission: (state) => {
        setSubmitted(state);
        setOpenLocation(state.location);
      },
    }),
    [slug, title, consent, checkInbox, openLocation, submitted]
  );

  return <GuideContext.Provider value={value}>{children}</GuideContext.Provider>;
}
