import CalendarView from "@/app/components/admin/scheduling/views/CalendarView";
import { adminSchedulingContext } from "@/app/lib/scheduling/admin-page";

export default async function CalendarPage() {
  const { data, now } = await adminSchedulingContext();
  return <CalendarView data={data} now={now} />;
}
