import OverviewView from "@/app/components/admin/scheduling/views/OverviewView";
import { PREVIEW_ADMIN } from "@/app/components/admin/scheduling/admin-base";
import { previewSchedulingContext } from "@/app/lib/scheduling/preview-page";

export default async function PreviewOverview() {
  const { data, now } = await previewSchedulingContext();
  return <OverviewView base={PREVIEW_ADMIN} data={data} now={now} />;
}
