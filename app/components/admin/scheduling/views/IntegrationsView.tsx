import DisconnectGoogleButton from "../DisconnectGoogleButton";
import type { AdminBase } from "../admin-base";
import { btnPrimary, btnQuiet, eyebrow, label, textLink } from "@/app/components/scheduling/ui";
import type { IntegrationStatus } from "@/app/lib/scheduling/integration-types";

const OUTCOMES: Record<string, string> = {
  connected: "Google Calendar is connected.",
  state_invalid: "That sign-in link expired or was already used. Please connect again.",
  no_refresh_token: "Google did not return a long-lived credential. Remove this app's access in your Google account, then connect again.",
  scope_missing: "Calendar permission was not granted. Connect again and allow every requested permission.",
  identity_invalid: "Google could not verify the designated owner account. No credentials were saved.",
  denied: "Access was not granted.",
  exchange_failed: "Google refused the connection. Check the client id and secret.",
  failed: "The connection could not be completed. See the server log.",
};

const Dot = ({ tone }: { tone: "ok" | "warn" | "off" | "bad" }) => <span aria-hidden className={`mr-2 inline-block h-2 w-2 rounded-full ${tone === "ok" ? "bg-[#2f5d3a]" : tone === "bad" ? "bg-[#8b2525]" : tone === "warn" ? "bg-[#b07a1f]" : "bg-[#1a1816]/25"}`} />;
const Block = ({ title, state, children }: { title: string; state: React.ReactNode; children?: React.ReactNode }) => (
  <section className="grid gap-x-12 gap-y-3 border-t border-[#1a1816]/[.12] py-8 md:grid-cols-[220px_1fr]">
    <h2 className={eyebrow}>{title}</h2>
    <div><p className="text-lg font-light">{state}</p><div className="mt-3 space-y-3 text-sm leading-relaxed text-[#1a1816]/65">{children}</div></div>
  </section>
);
const Missing = ({ names }: { names: string[] }) => names.length ? <p>Still needed in the environment: <span className="font-mono text-xs text-[#1a1816]">{names.join(", ")}</span></p> : null;

export default function IntegrationsView({ base, status, outcome }: { base: AdminBase; status: IntegrationStatus; outcome?: { google?: string; reason?: string } }) {
  const g = status.google;
  const message = outcome?.google === "connected" ? OUTCOMES.connected : outcome?.google === "error" ? OUTCOMES[outcome.reason ?? "failed"] ?? OUTCOMES.failed : null;
  return (
    <div>
      <p className="mb-8 max-w-2xl text-sm leading-relaxed text-[#1a1816]/60">Where scheduling gets its calendar, its meetings and its emails. Nothing is live unless it is switched on in the server&rsquo;s environment; this page only shows the state and, for Google, lets you connect or reconnect.</p>
      {message && <p role="status" className={`mb-8 border-l-2 pl-4 text-sm ${outcome?.google === "connected" ? "border-[#2f5d3a]" : "border-[#8b2525]"}`}>{message}</p>}
      {base.preview && <p role="note" className="mb-8 border-l-2 border-[#1a1816]/25 pl-4 text-sm text-[#1a1816]/65">The preview shows the simulated set-up only. Real integration state is shown in the signed-in admin.</p>}

      <Block title="Google Calendar" state={<><Dot tone={g.state === "connected" ? "ok" : g.state === "needs_reauth" || g.state === "revoked" ? "bad" : g.state === "mock" ? "off" : "warn"} />{{ mock: "Simulated (mock)", not_configured: "Not configured", not_connected: "Not connected", connected: "Connected", needs_reauth: "Needs to be reconnected", revoked: "Disconnected" }[g.state]}</>}>
        {g.state === "mock" && <p>Availability comes from a pretend calendar and nothing is written to Google. Set <span className="font-mono text-xs text-[#1a1816]">SCHEDULING_GOOGLE=live</span> with the Google credentials to use a real calendar.</p>}
        {g.state === "not_configured" && <Missing names={status.missing.google} />}
        {g.accountEmail && <p>Account: <span className="text-[#1a1816]">{g.accountEmail}</span>{g.connectedAt ? ` · connected ${g.connectedAt.slice(0, 10)}` : ""}</p>}
        {g.lastError && (g.state === "needs_reauth" || g.state === "revoked") && <p className="text-[#8b2525]">{g.lastError} Bookings cannot be taken until it is reconnected, and existing bookings are unaffected.</p>}
        {!base.preview && (g.state === "not_connected" || g.state === "needs_reauth" || g.state === "revoked" || g.state === "connected") && (
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <a className={g.state === "connected" ? btnQuiet : btnPrimary} href={`${base.api}/google/connect`}>{g.state === "connected" ? "Reconnect" : g.state === "not_connected" ? "Connect Google Calendar" : "Reconnect Google Calendar"}</a>
            {g.state === "connected" && <DisconnectGoogleButton />}
          </div>
        )}
        {!base.preview && g.state !== "mock" && <p className="text-xs text-[#1a1816]/45">Redirect URI to register in Google Cloud: <span className="font-mono">{g.redirectUri}</span></p>}
      </Block>

      <Block title="Zoom" state={<><Dot tone={status.zoom.state === "connected" ? "ok" : status.zoom.state === "mock" ? "off" : "warn"} />{{ mock: "Simulated (mock)", not_configured: "Not configured", connected: "Connected (authentication verified)", connection_failed: "Connection check failed" }[status.zoom.state]}</>}>
        {status.zoom.state === "mock" && <p>Meeting links are simulated (clearly fake). Set <span className="font-mono text-xs text-[#1a1816]">SCHEDULING_ZOOM=live</span> with a Server-to-Server OAuth app to create real meetings.</p>}
        {status.zoom.state === "not_configured" && <Missing names={status.missing.zoom} />}
        {status.zoom.state === "connected" && <p>Server-to-Server OAuth authentication and read-only access to the configured host were verified. No meeting was created.</p>}
        {status.zoom.state === "connection_failed" && <p>Zoom authentication or access to the configured host could not be verified. Check the credentials, app activation and scopes.</p>}
      </Block>

      <Block title="Booking emails" state={<><Dot tone={status.email.state === "configured" ? "ok" : status.email.state === "simulated" ? "off" : "warn"} />{{ simulated: "Simulated (nothing is sent)", not_configured: "Not configured", configured: "Sending through Resend" }[status.email.state]}</>}>
        {status.email.state === "simulated" && <p>Messages are composed and shown in the outbox on the Overview, never delivered. Set <span className="font-mono text-xs text-[#1a1816]">SCHEDULING_EMAIL=resend</span> to send them.</p>}
        {status.email.state === "not_configured" && <Missing names={status.missing.email} />}
        {status.email.from && <p>From: <span className="text-[#1a1816]">{status.email.from}</span>. Transactional only: confirmations, new times, cancellations and Zoom details. Marketing consent is separate and never inferred.</p>}
        {status.email.testMode && <p className="text-[#8b2525]">Test mode is on. Real delivery goes to the single developer test address only; every other message is simulated and never sent.</p>}
      </Block>

      <Block title="Storage" state={<><Dot tone={status.backend.state === "supabase" ? "ok" : status.backend.state === "file" ? "off" : "warn"} />{{ file: "Local prototype file", not_configured: "Supabase: not configured", supabase: "Supabase (Postgres)" }[status.backend.state]}</>}>
        {status.backend.state === "file" && <p>Data lives in a local JSON file. Set <span className="font-mono text-xs text-[#1a1816]">SCHEDULING_BACKEND=supabase</span> to use the database, where double bookings are prevented by a constraint.</p>}
        {status.backend.state === "not_configured" && <Missing names={status.missing.backend} />}
      </Block>
      {status.recovery && (
        <Block title="Recovery worker" state={<><Dot tone={status.recovery.state === "ok" ? "ok" : "warn"} />{{ ok: "Running", stale: "Not running", never: "Not seen yet" }[status.recovery.state]}</>}>
          {status.recovery.state === "ok" && status.recovery.ageSeconds !== null && <p>Last sweep {status.recovery.ageSeconds < 90 ? `${status.recovery.ageSeconds} second${status.recovery.ageSeconds === 1 ? "" : "s"}` : `${Math.round(status.recovery.ageSeconds / 60)} minutes`} ago{status.recovery.lastSummary ? `: ${status.recovery.lastSummary.processed} booking${status.recovery.lastSummary.processed === 1 ? "" : "s"} processed, ${status.recovery.lastSummary.reconciled} re-queued, ${status.recovery.lastSummary.conflictsFlagged} conflict${status.recovery.lastSummary.conflictsFlagged === 1 ? "" : "s"} flagged.` : "."}</p>}
          {status.recovery.state === "stale" && status.recovery.ageSeconds !== null && <p className="text-[#8b2525]">The last sweep was {Math.round(status.recovery.ageSeconds / 60)} minutes ago. Bookings whose background work was interrupted will wait until it runs again, or until you press “Retry now” on them.</p>}
          {status.recovery.state === "never" && <p>No sweep has run yet. The scheduled sweep (<span className="font-mono text-xs text-[#1a1816]">/api/cron/scheduling-sync</span>) is what finishes bookings whose background work was interrupted; until it is set up, use “Retry now” on a booking that is stuck.</p>}
        </Block>
      )}
      <p className="border-t border-[#1a1816]/[.12] pt-6 text-xs text-[#1a1816]/45"><span className={label}>Recovery</span> <span className="ml-2">Anything that fails is retried automatically with growing delays. A booking that gives up shows “Retry now” in its drawer.</span> <a className={textLink} href={`${base.routes}/bookings`}>Bookings →</a></p>
    </div>
  );
}
