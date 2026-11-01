import AdminCalendar from "../AdminCalendar";
import { bookingRows } from "@/app/lib/scheduling/admin-views";
import type { SchedulingData } from "@/app/lib/scheduling/types";
import { localDate } from "@/app/lib/scheduling/timezone";

export default function CalendarView({ data, now }: { data: SchedulingData; now: number }) {
  return <AdminCalendar rows={bookingRows(data)} homeTimeZone={data.settings.homeTimeZone} today={localDate(now, data.settings.homeTimeZone)} nowIso={new Date(now).toISOString()} />;
}
