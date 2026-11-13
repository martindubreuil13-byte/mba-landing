import BookingsTable from "../BookingsTable";
import { bookingRows } from "@/app/lib/scheduling/admin-views";
import type { SchedulingData } from "@/app/lib/scheduling/types";

export default function BookingsView({ data, now, booking }: { data: SchedulingData; now: number; booking?: string }) {
  return <BookingsTable key={booking} booking={booking} rows={bookingRows(data, now)} homeTimeZone={data.settings.homeTimeZone} nowIso={new Date(now).toISOString()} />;
}
