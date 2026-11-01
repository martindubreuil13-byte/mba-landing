/**
 * A recovery-test worker that gets killed. Run by kill.test.ts through vite-node, NEVER by the application:
 *   vite-node --config kill-child.vite.config.ts kill-child.ts <zoom|zoom-update|scan-before-delete|google|webhook-claimed|webhook-processed> <bookingId|webhookKey> <worldFile> <signalFile>
 * It runs the real BookingSync against the LOCAL database with file-backed mock providers, and at the chosen point it announces itself and
 * then never returns, so the test can SIGKILL the process at exactly that moment: after the provider has done its work, before the booking's record of it is saved.
 */
import fs from "node:fs";
import { SupabaseRepository } from "../adapters/supabase-repository";
import { createSimulatedEmail } from "../providers";
import { SchedulingService } from "../service";
import { createFileCalendar, createFileZoom } from "./file-mocks";
import { localDbClient, readLocalDbEnv } from "./local-db";

const [, , point, bookingId, worldFile, signalFile] = process.argv;
const env = readLocalDbEnv();
if (!env || !point || !bookingId || !worldFile || !signalFile) { console.error("needs the LOCAL database settings and four arguments"); process.exit(2); }

// A timer keeps the event loop alive: without it Node notices nothing is pending and exits by itself, racing the parent's SIGKILL.
const hang = async () => { fs.writeFileSync(signalFile, "ready"); setInterval(() => undefined, 1000); await new Promise<never>(() => undefined); };
const repo = new SupabaseRepository((await localDbClient(env)) as never);
const svc = new SchedulingService({
  repo, email: createSimulatedEmail(),
  zoom: createFileZoom(worldFile, point === "zoom" ? { afterCreate: hang } : point === "zoom-update" ? { afterUpdate: hang } : point === "scan-before-delete" ? { beforeDelete: hang } : {}),
  calendar: createFileCalendar(worldFile, point === "google" ? { afterUpsert: hang } : {}),
});
if (point === "webhook-claimed" || point === "webhook-processed") {
  // bookingId carries the webhook key here. Claim the delivery; for "processed" also finish it; then hang to be killed.
  const at = new Date().toISOString();
  const claim = await repo.beginWebhook("zoom", bookingId, at, 120);
  console.log(claim.state);
  if (point === "webhook-processed") await repo.finishWebhook("zoom", bookingId, claim.token!, true, null, at);
  await hang();
}
if (point === "scan-before-delete") { await svc.sync.scanZoom(); console.log("finished without being killed"); process.exit(0); }
await svc.sync.run(bookingId);
console.log("finished without being killed");
