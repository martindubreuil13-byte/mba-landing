import Link from "next/link";
import { ArrowRight, CalendarDays, CircleAlert, FileText, LibraryBig, Mail, Users, ChartNoAxesCombined, ListTodo } from "lucide-react";
import type { getBusinessPulse } from "@/app/lib/business-pulse/data";
import { workspaceStamp } from "@/app/lib/relationships/model";
import "./business-pulse.css";

const destinations = [
  ["Contacts", "Inquiries, relationships and follow-ups", "/admin/leads", Users],
  ["Scheduling", "Appointments, calendar and availability", "/admin/scheduling", CalendarDays],
  ["Content", "Publications, guides, resources and programs", "/admin/content", LibraryBig],
  ["Email Studio", "Audience, composition and branded preview", "/admin/email", Mail],
  ["Website Intelligence", "Acquisition and conversion reports", "/admin/intelligence", ChartNoAxesCombined],
  ["More tools", "Assessments, worksheets and reader questions", "/admin/tools", FileText],
] as const;

const quickActions = [
  ["Find contact", "/admin/leads", Users], ["Compose email", "/admin/email", Mail],
  ["View calendar", "/admin/scheduling/calendar", CalendarDays], ["Manage content", "/admin/content", LibraryBig],
  ["Review inquiries", "/admin/inquiries", CircleAlert],
] as const;

type Pulse = Awaited<ReturnType<typeof getBusinessPulse>>;

export default function BusinessPulse({ data }: { data: Pulse }) {
  const { timeZone } = data;
  const max = Math.max(1, ...data.days.map(({ count }) => count ?? 0));
  const hasChart = data.days.every(({ count }) => count !== null);
  return <div className="pulse-workspace">
    <header className="pulse-head"><div>
      <p className="eyebrow">{new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeZone }).format()}</p>
      <h1>Business Pulse<span>.</span></h1>
    </div></header>
    {data.incomplete && <p role="status" className="mb-3 text-sm text-[#6b1f1f]">Some dashboard records are unavailable.</p>}
    <div className="pulse-layout">
      <section className="pulse-board" aria-labelledby="pulse-period">
        <div className="pulse-period"><div><p className="eyebrow">Last 7 days</p><h2 id="pulse-period">Your week in motion</h2></div><small>vs. previous 7 days</small></div>
        <div className="pulse-metrics">{data.metrics.map(({ label, value, previous, href }, index) => {
          const Icon = [Users, CalendarDays, Mail, FileText, ListTodo][index];
          const delta = value !== null && previous !== null ? value - previous : null;
          return <Link key={label} className="pulse-metric" href={href}>
            <Icon aria-hidden /><strong>{value ?? "—"}</strong><span>{label}</span>
            <small>{value === null ? "Unavailable" : index === 4 ? "Due through today" : delta === null ? "No comparison" : `${delta > 0 ? "+" : ""}${delta} vs prior week`}</small>
          </Link>;
        })}</div>
        <figure className="pulse-chart">
          <figcaption><strong>Guide downloads</strong><small>Download starts per 24 hours</small></figcaption>
          {hasChart ? <div className="pulse-bars" role="img" aria-label={data.days.map(({ at, count }) => `${workspaceStamp(at, timeZone)}: ${count}`).join("; ")}>
            {data.days.map(({ at, count }) => <div key={at}>
              <span className="bar" style={{ height: `${(count ?? 0) * 63 / max}px` }} title={`${count} downloads`} />
              <small>{new Intl.DateTimeFormat("en-GB", { day: "numeric", timeZone }).format(new Date(at))}</small>
            </div>)}
          </div> : <small>Chart unavailable</small>}
        </figure>
      </section>
      <section className="pulse-panel pulse-meetings"><p className="eyebrow">{timeZone.replaceAll("_", " ")}</p><h2>Upcoming meetings</h2>
        {data.meetings.length === 0 && <p className="mt-3 text-sm">No upcoming meetings in the records shown.</p>}
        {data.meetings.map((meeting) => <Link key={meeting.id} className="pulse-entry" href={"/admin/scheduling/bookings?booking=" + meeting.id + "#" + meeting.id}>
          <span className="tile-icon"><CalendarDays aria-hidden /></span><span><strong>{meeting.title}</strong><small>{meeting.guest} · {workspaceStamp(meeting.at, timeZone)}</small></span><ArrowRight aria-hidden />
        </Link>)}
      </section>
      <section className="pulse-panel pulse-feed"><p className="eyebrow">Latest first</p><h2>Activity feed</h2>
        {data.activity.length === 0 && <p className="mt-3 text-sm">No recent activity in the records shown.</p>}
        {data.activity.map((item) => <Link key={item.key} className="pulse-entry" href={item.href}>
          <span className="tile-icon"><FileText aria-hidden /></span><span><strong>{item.title}</strong><small>{item.detail}</small></span>
          <time dateTime={item.at}>{workspaceStamp(item.at, timeZone)}</time><ArrowRight aria-hidden />
        </Link>)}
      </section>
      <section className="pulse-panel pulse-attention"><p className="eyebrow">Owner action</p><h2>Needs attention</h2>
        {data.attention.length === 0 && <p className="mt-3 text-sm">No action required in the records checked.</p>}
        {data.attention.map((item) => <Link key={item.key} className="pulse-entry" href={item.href}>
          <span className="tile-icon"><CircleAlert aria-hidden /></span><span className="break-words"><strong>{item.title}</strong><small>{item.detail}</small></span><ArrowRight aria-hidden />
        </Link>)}
      </section>
    </div>
    <section className="pulse-actions"><h2>Quick actions</h2><div>{quickActions.map(([label, href, Icon]) =>
      <Link key={href} href={href}><Icon aria-hidden />{label}</Link>)}</div></section>
    <section className="pulse-destinations"><h2>Workspace</h2><div className="pulse-destination-grid">
      {destinations.map(([label, description, href, Icon]) => <Link key={href} className="pulse-card" href={href}>
        <span className="tile-icon"><Icon aria-hidden size={20} /></span><h3>{label}</h3><p>{description}</p>
      </Link>)}
    </div></section>
  </div>;
}
