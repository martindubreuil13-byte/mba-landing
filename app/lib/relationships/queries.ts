import "server-only";
import { getServiceClient } from "@/app/lib/supabase/service";
import { OWNER_CLAIM_STALE_MS } from "@/app/lib/inquiries/store";
import { inquiryHref, mailException, workspaceStamp, type ExceptionState } from "./model";
import type { ActivityEvent } from "@/app/lib/leads/admin-queries";

export async function businessTimeZone() {
  const { data, error } = await getServiceClient().from("sched_settings")
    .select("home_time_zone").limit(1).maybeSingle();
  if (error) throw new Error("Business time zone could not be loaded.");
  return data?.home_time_zone || "Asia/Bangkok";
}

export async function relationshipEvents(leadId: string, timeZone = "Asia/Bangkok"): Promise<ActivityEvent[]> {
  const db = getServiceClient();
  const [inquiries, applications, origins, consent] = await Promise.all([
    db.from("program_inquiries").select("id, created_at, program_slug").eq("lead_id", leadId),
    db.from("program_applications").select("id, submitted_at").eq("lead_id", leadId),
    db.from("booking_origins").select("booking_id, inquiry_id, application_id, lead_id")
      .eq("lead_id", leadId),
    db.from("consent_records").select("created_at, action, source_type, wording_version").eq("lead_id", leadId),
  ]);
  if ([inquiries, applications, origins, consent].some((result) => result.error)) {
    throw new Error("Relationship history could not be loaded.");
  }
  const inquiryIds = new Set((inquiries.data ?? []).map((row) => row.id));
  const applicationIds = new Set((applications.data ?? []).map((row) => row.id));
  const bookingIds = (origins.data ?? [])
    .filter((row) => (!row.inquiry_id || inquiryIds.has(row.inquiry_id)) &&
      (!row.application_id || applicationIds.has(row.application_id)))
    .map((row) => row.booking_id);
  const bookings = bookingIds.length ? await db.from("sched_bookings")
    .select("id, reference, created_at, start_at, canceled_at").in("id", bookingIds).eq("demo", false) : null;
  if (bookings?.error) throw new Error("Appointment history could not be loaded.");

  return [
    ...(inquiries.data ?? []).map((row): ActivityEvent => ({
      kind: "inquiry", at: row.created_at, title: "Inquiry received",
      description: row.program_slug?.replaceAll("-", " ") ?? "General inquiry",
      href: inquiryHref(row.id),
    })),
    ...(applications.data ?? []).map((row): ActivityEvent => ({
      kind: "application", at: row.submitted_at, title: "Corporate Transition application",
      description: "Application submitted", href: "/admin/programs/corporate-transition/" + row.id,
    })),
    ...(bookings?.data ?? []).flatMap((row): ActivityEvent[] => {
      const booking: ActivityEvent = {
        kind: "booking", at: row.created_at, title: "Appointment booked",
        description: "Scheduled for " + workspaceStamp(row.start_at, timeZone) + (row.reference ? " · Booking " + row.reference : ""),
        href: null,
      };
      return row.canceled_at ? [booking, { ...booking, at: row.canceled_at, title: "Appointment canceled" }] : [booking];
    }),
    ...(consent.data ?? []).map((row): ActivityEvent => ({
      kind: "consent", at: row.created_at, title: "Consent: " + row.action.replaceAll("_", " "),
      description: [row.source_type?.replaceAll("_", " "), row.wording_version].filter(Boolean).join(" · "),
      href: null,
    })),
  ];
}

export async function listTasks(leadId?: string) {
  let query = getServiceClient().from("contact_tasks")
    .select("id, lead_id, description, due_date, completed_at")
    .order("due_date", { nullsFirst: false }).order("created_at", { ascending: false });
  if (leadId) query = query.eq("lead_id", leadId);
  const { data, error } = await query;
  if (error) throw new Error("Follow-ups could not be loaded.");
  return data;
}

export async function automationExceptions() {
  const stale = new Date(Date.now() - OWNER_CLAIM_STALE_MS).toISOString();
  const db = getServiceClient();
  const [inquiries, bookings, delivery, schedulingMail] = await Promise.all([
    db.from("program_inquiries").select("id, updated_at, owner_status, auto_reply_status, owner_claimed_at")
      .or(`owner_status.eq.failed,auto_reply_status.eq.failed,and(owner_status.eq.sending,owner_claimed_at.lt.${stale})`).order("updated_at", { ascending: false }).limit(100),
    db.from("sched_bookings").select("id, reference, updated_at, sync_status, sync_next_attempt_at").eq("demo", false)
      .or("sync_status.eq.failed,and(sync_status.eq.pending,sync_last_error.not.is.null,sync_next_attempt_at.not.is.null)").order("updated_at", { ascending: false }).limit(100),
    db.from("resource_requests").select("id, lead_id, delivery_updated_at, requested_at, delivery_status")
      .in("delivery_status", ["failed", "bounced"]).order("delivery_updated_at", { ascending: false }).limit(100),
    db.from("sched_email_attempts").select("id, booking_id, kind, version, status, delivery_status, delivery_updated_at, attempted_at, sched_bookings!inner(demo, version, reference, sync_status, sync_next_attempt_at)")
      .eq("sched_bookings.demo", false).order("attempted_at", { ascending: false }).order("id", { ascending: false }).limit(300),
  ]);
  if ([inquiries, bookings, delivery, schedulingMail].some((result) => result.error)) throw new Error("Automation exceptions could not be loaded.");
  type Exception = { key: string; at: string; label: string; state: ExceptionState; href: string | null; reference?: string };
  const attempts = new Map<string, NonNullable<typeof schedulingMail.data>>();
  for (const attempt of schedulingMail.data ?? []) {
    const booking = Array.isArray(attempt.sched_bookings) ? attempt.sched_bookings[0] : attempt.sched_bookings;
    if (booking?.version !== attempt.version) continue;
    const key = [attempt.booking_id, attempt.kind, attempt.version].join(":");
    const group = attempts.get(key) ?? [];
    group.push(attempt);
    attempts.set(key, group);
  }
  const mail: Exception[] = [];
  for (const [latest, ...earlier] of attempts.values()) {
    const booking = Array.isArray(latest.sched_bookings) ? latest.sched_bookings[0] : latest.sched_bookings;
    const failedEarlier = earlier.some((row) => {
      const outcomeAt = row.delivery_updated_at ?? row.attempted_at;
      return Date.parse(outcomeAt) < Date.parse(latest.attempted_at) &&
        (row.status === "failed" || row.delivery_status === "failed" || row.delivery_status === "bounced");
    });
    const retryScheduled = booking?.sync_status === "pending" && Boolean(booking.sync_next_attempt_at);
    const lateFailure = earlier.find((row) =>
      (row.delivery_status === "failed" || row.delivery_status === "bounced") &&
      Date.parse(row.delivery_updated_at ?? row.attempted_at) >= Date.parse(latest.attempted_at));
    if (lateFailure && latest.status === "accepted" && latest.delivery_status !== "delivered") {
      mail.push({
        key: "mail:" + lateFailure.id, at: lateFailure.delivery_updated_at ?? lateFailure.attempted_at,
        label: "Appointment email", state: "Action Required", href: null, reference: booking?.reference ?? latest.booking_id,
      });
      continue;
    }
    const state = mailException(latest, failedEarlier, retryScheduled);
    if (state) mail.push({
      key: "mail:" + latest.id, at: latest.attempted_at, label: "Appointment email",
      state, href: null, reference: booking?.reference ?? latest.booking_id,
    });
  }
  const items: Exception[] = [
    ...(inquiries.data ?? []).map((row): Exception => ({
      key: "inquiry:" + row.id, at: row.updated_at,
      label: row.owner_status === "failed" ? "Inquiry notification failed" :
        row.owner_status === "sending" && row.owner_claimed_at && row.owner_claimed_at < stale
          ? "Inquiry notification claim expired" : "Inquiry reply failed",
      state: "Action Required", href: inquiryHref(row.id),
    })),
    ...(bookings.data ?? []).map((row): Exception => ({
      key: "booking:" + row.id, at: row.updated_at, label: "Appointment synchronization",
      state: row.sync_status === "pending" ? "Recovering" : "Action Required", href: null, reference: row.reference,
    })),
    ...(delivery.data ?? []).map((row): Exception => ({
      key: "resource:" + row.id, at: row.delivery_updated_at ?? row.requested_at,
      label: row.delivery_status === "bounced" ? "Resource delivery bounced" : "Resource delivery failed",
      state: "Action Required", href: null, reference: row.id,
    })),
    ...mail,
  ];
  return items.sort((a, b) => b.at.localeCompare(a.at));
}
