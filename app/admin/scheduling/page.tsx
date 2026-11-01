import OverviewView from "@/app/components/admin/scheduling/views/OverviewView";
import { REAL_ADMIN } from "@/app/components/admin/scheduling/admin-base";
import { adminSchedulingContext } from "@/app/lib/scheduling/admin-page";

export default async function SchedulingOverview() {
  const { data, now } = await adminSchedulingContext();
  return <OverviewView base={REAL_ADMIN} data={data} now={now} />;
}
