import MeetingTypesView from "@/app/components/admin/scheduling/views/MeetingTypesView";
import { PREVIEW_ADMIN } from "@/app/components/admin/scheduling/admin-base";
import { previewSchedulingContext } from "@/app/lib/scheduling/preview-page";

export default async function PreviewMeetingTypes() {
  const { data } = await previewSchedulingContext();
  return <MeetingTypesView base={PREVIEW_ADMIN} data={data} />;
}
