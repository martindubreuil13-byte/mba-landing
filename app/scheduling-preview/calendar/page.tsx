import CalendarView from "@/app/components/admin/scheduling/views/CalendarView";
import { previewSchedulingContext } from "@/app/lib/scheduling/preview-page";

export default async function PreviewCalendar() {
  const { data, now } = await previewSchedulingContext();
  return <CalendarView data={data} now={now} />;
}
