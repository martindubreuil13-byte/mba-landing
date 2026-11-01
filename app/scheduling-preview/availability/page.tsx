import AvailabilityView from "@/app/components/admin/scheduling/views/AvailabilityView";
import { PREVIEW_ADMIN } from "@/app/components/admin/scheduling/admin-base";
import { previewSchedulingContext } from "@/app/lib/scheduling/preview-page";

export default async function PreviewAvailability({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { service, data, now } = await previewSchedulingContext();
  return <AvailabilityView base={PREVIEW_ADMIN} service={service} data={data} now={now} typeId={(await searchParams).type} />;
}
