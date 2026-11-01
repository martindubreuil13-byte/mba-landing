import { NewMeetingTypeView } from "@/app/components/admin/scheduling/views/MeetingTypeEditView";
import { adminSchedulingContext } from "@/app/lib/scheduling/admin-page";

export default async function NewMeetingType() {
  await adminSchedulingContext();
  return <NewMeetingTypeView />;
}
