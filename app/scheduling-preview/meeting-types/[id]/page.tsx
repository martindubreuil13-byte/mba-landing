import MeetingTypeEditView from "@/app/components/admin/scheduling/views/MeetingTypeEditView";
import { previewSchedulingContext } from "@/app/lib/scheduling/preview-page";

export default async function PreviewEditMeetingType({ params }: { params: Promise<{ id: string }> }) {
  const { data } = await previewSchedulingContext();
  return <MeetingTypeEditView data={data} id={(await params).id} />;
}
