import MeetingTypesView from "@/app/components/admin/scheduling/views/MeetingTypesView";
import { REAL_ADMIN } from "@/app/components/admin/scheduling/admin-base";
import { adminSchedulingContext } from "@/app/lib/scheduling/admin-page";

export default async function MeetingTypesPage() {
  const { data } = await adminSchedulingContext();
  return <MeetingTypesView base={REAL_ADMIN} data={data} />;
}
