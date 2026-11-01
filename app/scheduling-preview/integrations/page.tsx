import IntegrationsView from "@/app/components/admin/scheduling/views/IntegrationsView";
import { PREVIEW_ADMIN } from "@/app/components/admin/scheduling/admin-base";
import { MOCK_STATUS } from "@/app/lib/scheduling/integration-types";
import { previewSchedulingContext } from "@/app/lib/scheduling/preview-page";

/** The preview shows the simulated set-up only: it never reads real integration state. */
export default async function PreviewIntegrations() {
  await previewSchedulingContext();
  return <IntegrationsView base={PREVIEW_ADMIN} status={MOCK_STATUS} />;
}
