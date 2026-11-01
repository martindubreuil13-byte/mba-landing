import { isProductionDeployment } from "@/app/lib/deployment";
import type { SchedulingService } from "./service";

/**
 * Every administrative action, in one place. The real admin API (/api/admin/scheduling, behind the existing admin
 * authentication) and the development-only preview API (/api/scheduling-preview) are both thin wrappers around this, so the
 * two can never drift apart. It knows nothing about who is calling.
 */
export type ActionResult = { status: number; body: Record<string, unknown> };

const ok = (body: Record<string, unknown> = { success: true }): ActionResult => ({ status: 200, body });
const err = (status: number, error: string): ActionResult => ({ status, body: { error } });
const s = (v: unknown, max = 500) => (typeof v === "string" ? v.slice(0, max) : "");

export async function adminAction(service: SchedulingService, method: string, path: string[], url: URL, body: Record<string, unknown>): Promise<ActionResult> {
  const [a, b, c] = path;
  if (isProductionDeployment() && (a === "reset" || a === "settings" && body.simulate !== undefined)) return err(404, "Not found");
  const only = (m: string) => (method === m ? null : err(405, "Method not allowed."));

  if (a === "slots" && path.length === 1) {
    const bad = only("GET"); if (bad) return bad;
    const q = url.searchParams;
    return ok({ slots: await service.adminSlots(q.get("typeId") ?? "", q.get("from") ?? "", q.get("to") ?? "", q.get("exclude") ?? undefined) });
  }
  if (a === "bookings" && b && path.length === 3) {
    const bad = only("POST"); if (bad) return bad;
    if (c === "cancel") { await service.cancelBooking(b); return ok(); }
    if (c === "reschedule") { await service.rescheduleBooking(b, s(body.startUtc, 40)); return ok(); }
    if (c === "resend") return ok({ success: true, ...(await service.resendConfirmation(b)) });
    if (c === "resolve-zoom") {
      // The deliberate workflow for a Zoom create with an unknown outcome. Never implied by "retry-sync".
      const intentAt = s(body.intentAt, 40);
      const r = body.action === "adopt" ? await service.resolveUncertainZoom(b, { action: "adopt", meetingId: s(body.meetingId, 30), intentAt })
        : body.action === "none-exists" ? await service.resolveUncertainZoom(b, { action: "none-exists", intentAt, acknowledgeDuplicateRisk: body.acknowledgeDuplicateRisk === true })
        : null;
      if (!r) return { status: 400, body: { error: "Choose adopt or none-exists.", code: "invalid_input" } };
      return ok({ success: true, synced: r.ok, errors: r.errors });
    }
    if (c === "retry-sync") { const r = await service.retrySync(b); return ok({ success: true, synced: r.ok, errors: r.errors }); }
  }
  if (a === "meeting-types" && path.length === 1) {
    const bad = only("POST"); if (bad) return bad;
    return ok({ meetingType: await service.saveMeetingType(body) });
  }
  if (a === "availability" && b && path.length === 2) {
    const bad = only("PUT"); if (bad) return bad;
    return ok({ availability: await service.saveAvailability(b, body) });
  }
  if (a === "settings" && path.length === 1) {
    const bad = only("PUT"); if (bad) return bad;
    const simulate = body.simulate && typeof body.simulate === "object" ? (body.simulate as { googleOutage?: boolean; zoomFailure?: boolean }) : undefined;
    return ok({ settings: await service.saveSettings({ homeTimeZone: body.homeTimeZone, simulate }) });
  }
  if (a === "reset" && path.length === 1) {
    const bad = only("POST"); if (bad) return bad;
    const ref = s(body.replayCommunity, 80);
    if (ref) await service.replayCommunity(ref); else await service.resetPrototype();
    return ok();
  }
  return err(404, "Not found");
}
