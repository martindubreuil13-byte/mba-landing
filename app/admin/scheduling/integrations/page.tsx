import IntegrationsView from "@/app/components/admin/scheduling/views/IntegrationsView";
import { REAL_ADMIN } from "@/app/components/admin/scheduling/admin-base";
import { adminSchedulingContext } from "@/app/lib/scheduling/admin-page";
import { getIntegrationStatus } from "@/app/lib/scheduling/instance";

export default async function IntegrationsPage({ searchParams }: { searchParams: Promise<{ google?: string; reason?: string }> }) {
  await adminSchedulingContext();
  return <IntegrationsView base={REAL_ADMIN} status={await getIntegrationStatus()} outcome={await searchParams} />;
}
