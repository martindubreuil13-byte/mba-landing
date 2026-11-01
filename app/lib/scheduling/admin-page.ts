import "server-only";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import { getScheduling } from "./instance";
import { requireSchedulingOperations } from "./release-gates";

/** Every scheduling admin page starts here: prototype switch, then the existing admin authentication, then the data. */
export async function adminSchedulingContext() {
  requireSchedulingOperations();
  await requireAdmin();
  const service = getScheduling();
  const data = await service.readAll();
  return { service, data, now: service.now() };
}
