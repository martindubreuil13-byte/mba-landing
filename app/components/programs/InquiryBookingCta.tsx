import { INTRO_BOOKING_MINUTES, introBookingPath } from "@/app/lib/booking";

/**
 * Shown on the inquiry form's success screen. The inquiry is already with Martin either way; this offers the free complimentary session now. It is
 * an offer, not a confirmation: nothing is booked until the visitor picks a time on the booking page. `autoReplySent` is true only when the
 * visitor's confirmation email (which carries the same link) was actually accepted by the email provider.
 */
export default function InquiryBookingCta({ programSlug, autoReplySent }: { programSlug?: string | null; autoReplySent: boolean }) {
  return (
    <>
      <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
        If you&apos;d like to start sooner, you can choose a time for a free {INTRO_BOOKING_MINUTES}-minute Zoom conversation.{autoReplySent ? " I've also emailed you this link, so you can book later." : ""}
      </p>
      <a
        href={introBookingPath(null, programSlug ? `inquiry-${programSlug}` : "inquiry")}
        className="inline-block bg-[#6b1f1f] px-8 py-4 text-center text-xs uppercase tracking-[.2em] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b1f1f]"
      >
        Book Your Complimentary Session
      </a>
    </>
  );
}
