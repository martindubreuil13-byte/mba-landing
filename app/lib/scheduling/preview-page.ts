import "server-only";
import { getPreviewScheduling } from "./preview-instance";
import { requireSchedulingPreview } from "./preview";

/** The preview's equivalent of adminSchedulingContext: development-only guard, then the simulated data. No sign-in, no database, and never the real service (see preview-instance.ts). */
export async function previewSchedulingContext() {
  await requireSchedulingPreview();
  const service = getPreviewScheduling();
  return { service, data: await service.readAll(), now: service.now() };
}
