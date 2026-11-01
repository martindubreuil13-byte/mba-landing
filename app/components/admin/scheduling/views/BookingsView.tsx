import BookingsTable from "../BookingsTable";
import { bookingRows } from "@/app/lib/scheduling/admin-views";
import type { SchedulingData } from "@/app/lib/scheduling/types";

export default function BookingsView({ data, now }: { data: SchedulingData; now: number }) {
  return <BookingsTable rows={bookingRows(data, now)} homeTimeZone={data.settings.homeTimeZone} nowIso={new Date(now).toISOString()} />;
}
