"use client";
import { useState } from "react";
import { btnQuiet, label } from "@/app/components/scheduling/ui";
import { formatDateShort, formatTime } from "@/app/lib/scheduling/timezone";

/**
 * The deliberate workflow for a Zoom meeting whose creation has an UNKNOWN outcome. Zoom may already have created the meeting, so nothing here is a
 * "retry": the system will not create another meeting by itself, and neither will "Check Zoom again". Two explicit choices, each bound to the attempt
 * shown below (if a newer attempt exists the server refuses):
 *   - the administrator found the meeting in Zoom and enters its number, or
 *   - the administrator searched Zoom, found none, and accepts the risk of a duplicate.
 * An empty search is never taken as proof by the system; this is the administrator's evidence.
 */
export default function ZoomResolvePanel({ marker, since, tz, busy, onAdopt, onNone }: {
  marker: string; since: string; tz: string; busy: boolean;
  onAdopt: (meetingId: string) => void; onNone: () => void;
}) {
  const [meetingId, setMeetingId] = useState("");
  const [ack, setAck] = useState(false);
  const at = Date.parse(since);
  const input = "w-full border border-[#1a1816]/25 bg-white px-3 py-2 text-sm text-[#1a1816] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#6b1f1f]";
  return (
    <section aria-label="Resolve the Zoom meeting" className="mt-4 border border-[#8b2525]/30 bg-white/60 p-4 text-sm text-[#1a1816]/80">
      <h4 className="text-base text-[#8b2525]">Zoom creation outcome unknown</h4>
      <p className="mt-2 leading-relaxed">The request to create this meeting never reported whether it worked, so Zoom <strong>may already have created it</strong>. The system will not create another one by itself, and “Check Zoom again” will not either.</p>
      <dl className="mt-3 grid grid-cols-[90px_1fr] gap-x-3 gap-y-1">
        <dt className={label}>Attempt</dt><dd>{formatDateShort(at, tz)} {formatTime(at, tz)}</dd>
        <dt className={label}>Search for</dt><dd className="break-all font-mono text-xs">{marker}</dd>
      </dl>
      <p className="mt-3 leading-relaxed">In Zoom, search the host’s meetings (upcoming <em>and</em> past, every page) for that text in the agenda. An empty first page is not proof.</p>

      <div className="mt-4 border-t border-[#1a1816]/[.12] pt-3">
        <label htmlFor="zoom-meeting-id" className={label}>I found it: meeting number</label>
        <div className="mt-2 flex gap-2">
          <input id="zoom-meeting-id" className={input} inputMode="numeric" autoComplete="off" value={meetingId} onChange={(e) => setMeetingId(e.target.value.replace(/\D/g, "").slice(0, 20))} placeholder="e.g. 84026087373" />
          <button type="button" disabled={busy || meetingId.length < 6} onClick={() => onAdopt(meetingId)} className={btnQuiet}>Use this meeting</button>
        </div>
      </div>

      <div className="mt-4 border-t border-[#1a1816]/[.12] pt-3">
        <label className="flex items-start gap-2 leading-relaxed">
          <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-1" />
          <span>I searched Zoom and found no meeting for this booking, and I accept that if I am wrong a duplicate meeting will be created.</span>
        </label>
        <button type="button" disabled={busy || !ack} onClick={onNone} className={`mt-2 ${btnQuiet}`}>Allow a new meeting</button>
      </div>
    </section>
  );
}
