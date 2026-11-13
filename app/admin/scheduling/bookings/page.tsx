import BookingsView from "@/app/components/admin/scheduling/views/BookingsView";
import { adminSchedulingContext } from "@/app/lib/scheduling/admin-page";

export default async function BookingsPage({ searchParams }: { searchParams: Promise<{ booking?: string }> }) {
  const { data, now } = await adminSchedulingContext();
  const { booking } = await searchParams;
  return <BookingsView data={data} now={now} booking={booking} />;
}
