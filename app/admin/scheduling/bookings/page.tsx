import BookingsView from "@/app/components/admin/scheduling/views/BookingsView";
import { adminSchedulingContext } from "@/app/lib/scheduling/admin-page";

export default async function BookingsPage() {
  const { data, now } = await adminSchedulingContext();
  return <BookingsView data={data} now={now} />;
}
