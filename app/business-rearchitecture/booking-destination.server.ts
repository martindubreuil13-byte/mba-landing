import "server-only";
import { getScheduling } from "@/app/lib/scheduling/instance";
import { schedulingIntakeEnabled } from "@/app/lib/scheduling/release-gates";
import { createBookingDestinationResolver } from "./booking-destination";

/**
 * Real wiring for the page's call to action. It only reads: it asks the scheduling service whether the introductory meeting type is
 * currently bookable by the public, exactly as the booking page does, and never creates or changes a meeting type or a setting.
 * The scheduling service is not touched at all while the flags are off (previews, local runs with scheduling disabled).
 */
export const currentBookingDestination = createBookingDestinationResolver({
  intakeEnabled: () => schedulingIntakeEnabled(),
  lookup: (slug) => getScheduling().publicMeetingType(slug),
});
