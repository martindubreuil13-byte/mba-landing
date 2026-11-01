import { NewMeetingTypeView } from "@/app/components/admin/scheduling/views/MeetingTypeEditView";
import { previewSchedulingContext } from "@/app/lib/scheduling/preview-page";

export default async function PreviewNewMeetingType() {
  await previewSchedulingContext();
  return <NewMeetingTypeView />;
}
