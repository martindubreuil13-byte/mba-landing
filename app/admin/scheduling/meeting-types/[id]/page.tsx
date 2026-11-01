import MeetingTypeEditView from "@/app/components/admin/scheduling/views/MeetingTypeEditView";
import { adminSchedulingContext } from "@/app/lib/scheduling/admin-page";

export default async function EditMeetingType({ params }: { params: Promise<{ id: string }> }) {
  const { data } = await adminSchedulingContext();
  return <MeetingTypeEditView data={data} id={(await params).id} />;
}
