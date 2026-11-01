import AvailabilityView from "@/app/components/admin/scheduling/views/AvailabilityView";
import { REAL_ADMIN } from "@/app/components/admin/scheduling/admin-base";
import { adminSchedulingContext } from "@/app/lib/scheduling/admin-page";

export default async function AvailabilityPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { service, data, now } = await adminSchedulingContext();
  return <AvailabilityView base={REAL_ADMIN} service={service} data={data} now={now} typeId={(await searchParams).type} />;
}
