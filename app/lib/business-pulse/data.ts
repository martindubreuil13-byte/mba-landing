import "server-only";
import { getServiceClient } from "@/app/lib/supabase/service";
import { automationExceptions, businessTimeZone } from "@/app/lib/relationships/queries";
import { inquiryHref, workspaceToday } from "@/app/lib/relationships/model";

export async function getBusinessPulse(now = new Date()) {
  const db = getServiceClient();
  const timeZone = await businessTimeZone();
  const today = workspaceToday(timeZone, now);
  // Two equal rolling windows. Date-only task deadlines use the business calendar.
  const start = new Date(now.getTime() - 7 * 864e5).toISOString();
  const prior = new Date(now.getTime() - 14 * 864e5).toISOString();
  const end = now.toISOString();
  const series = [
    ["New leads", "leads", "created_at", "/admin/leads"],
    ["Meetings booked", "sched_bookings", "created_at", "/admin/scheduling/bookings"],
    ["New inquiries", "program_inquiries", "created_at", "/admin/inquiries"],
    ["Guide downloads", "resource_events", "created_at", "/admin/guides"],
  ] as const;
  const metrics = await Promise.all(series.map(async ([label, table, field, href]) => {
    function count(from: string, to: string) {
      const query = db.from(table).select("*", { count: "exact", head: true }).gte(field, from).lt(field, to);
      if (table === "sched_bookings") return query.eq("demo", false);
      if (table === "resource_events") return query.eq("event_name", "resource_download_started").in("resource_type", ["Guide", "Field Guide"]);
      return query;
    }
    const [current, previous] = await Promise.all([count(start, end), count(prior, start)]);
    return { label, href, value: current.error ? null : current.count, previous: previous.error ? null : previous.count };
  }));
  const [due, tasks, meetings, inquiries, applications, downloads, recentBookings, exceptions] = await Promise.all([
    db.from("contact_tasks").select("*", { head: true, count: "exact" }).is("completed_at", null).lte("due_date", today),
    db.from("contact_tasks").select("id, lead_id, description, due_date").is("completed_at", null).lte("due_date", today).order("due_date").limit(5),
    db.from("sched_bookings").select("id, reference, start_at, sched_attendees(name), sched_meeting_types(name)").eq("demo", false).eq("status", "confirmed").gte("start_at", end).order("start_at").limit(4),
    db.from("program_inquiries").select("id, created_at, full_name").order("created_at", { ascending: false }).limit(5),
    db.from("program_applications").select("id, submitted_at").order("submitted_at", { ascending: false }).limit(5),
    db.from("resource_events").select("id, created_at, lead_id, resource_slug").eq("event_name", "resource_download_started").in("resource_type", ["Guide", "Field Guide"]).order("created_at", { ascending: false }).limit(5),
    db.from("sched_bookings").select("id, reference, created_at").eq("demo", false).order("created_at", { ascending: false }).limit(5),
    automationExceptions().catch(() => null),
  ]);
  const days = await Promise.all(Array.from({ length: 7 }, async (_, index) => {
    const from = new Date(now.getTime() - (7 - index) * 864e5).toISOString();
    const to = new Date(now.getTime() - (6 - index) * 864e5).toISOString();
    const { count, error } = await db.from("resource_events").select("*", { head: true, count: "exact" })
      .eq("event_name", "resource_download_started").in("resource_type", ["Guide", "Field Guide"]).gte("created_at", from).lt("created_at", to);
    return { at: from, count: error ? null : count };
  }));
  return {
    timeZone, days, metrics: [...metrics, { label: "Follow-ups due", href: "/admin/inquiries/tasks", value: due.error ? null : due.count, previous: null }],
    meetings: (meetings.data ?? []).map((row) => ({
      id: row.id, reference: row.reference, at: row.start_at,
      title: (Array.isArray(row.sched_meeting_types) ? row.sched_meeting_types[0] : row.sched_meeting_types)?.name ?? "Appointment",
      guest: row.sched_attendees?.[0]?.name ?? "Guest",
    })),
    activity: [
      ...(inquiries.data ?? []).map((row) => ({ key: "i" + row.id, at: row.created_at, title: "New inquiry", detail: row.full_name, href: inquiryHref(row.id) })),
      ...(applications.data ?? []).map((row) => ({ key: "a" + row.id, at: row.submitted_at, title: "Program application", detail: "Corporate Transition", href: "/admin/programs/corporate-transition/" + row.id })),
      ...(downloads.data ?? []).map((row) => ({ key: "d" + row.id, at: row.created_at, title: "Guide download started", detail: row.resource_slug, href: row.lead_id ? "/admin/leads/" + row.lead_id : "/admin/guides" })),
      ...(recentBookings.data ?? []).map((row) => ({ key: "b" + row.id, at: row.created_at, title: "Meeting booked", detail: row.reference, href: "/admin/scheduling/bookings?booking=" + row.id + "#" + row.id })),
    ].sort((a,b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, 6),
    attention: [
      ...(tasks.data ?? []).map((row) => ({ key: row.id, title: row.description, detail: "Due " + row.due_date, href: "/admin/leads/" + row.lead_id + "#task:" + row.id })),
      ...(exceptions ?? []).filter((row) => row.state === "Action Required").slice(0, 4)
        .map((row) => ({ key: row.key, title: row.label, detail: row.reference ?? "Automation exception", href: row.href ?? "/admin/inquiries/exceptions" })),
    ],
    incomplete: [due, tasks, meetings, inquiries, applications, downloads, recentBookings].some((result) => result.error) || exceptions === null,
  };
}
