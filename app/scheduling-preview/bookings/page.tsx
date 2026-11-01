import BookingsView from "@/app/components/admin/scheduling/views/BookingsView";
import { previewSchedulingContext } from "@/app/lib/scheduling/preview-page";

export default async function PreviewBookings() {
  const { data, now } = await previewSchedulingContext();
  return <BookingsView data={data} now={now} />;
}
