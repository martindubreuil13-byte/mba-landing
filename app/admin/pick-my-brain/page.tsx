import type { Metadata } from "next";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import { getPickMyBrainReport } from "@/app/lib/pick-my-brain/queries";
import AdminShell from "@/app/components/admin/AdminShell";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function StatTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border border-[#1a1816]/10 bg-white px-5 py-4">
      <p className="text-2xl font-light">{value}</p>
      <p className="text-xs uppercase tracking-widest text-[#1a1816]/50 mt-1">{label}</p>
    </div>
  );
}

function Section({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <section className="mb-16">
      <h2 className="text-sm font-semibold tracking-widest uppercase text-[#1a1816]">{title}</h2>
      <p className="text-sm text-[#1a1816]/55 mt-1 mb-5">{note}</p>
      {children}
    </section>
  );
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

export default async function AdminPickMyBrainPage() {
  await requireAdmin();
  const report = await getPickMyBrainReport();
  const { totals } = report;
  const opportunities = report.unanswered.filter((g) => g.count >= 2);

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="text-2xl font-light">Pick My Brain</h1>
        <p className="text-sm text-[#1a1816]/50">Searches from the last {report.windowDays} days</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-14">
        <StatTile label="Searches" value={totals.searches} />
        <StatTile label="Found something" value={totals.matched} />
        <StatTile label="Unanswered" value={totals.unmatched} />
        <StatTile
          label="Clicked a result"
          value={totals.matched ? `${Math.round((totals.clicked / totals.matched) * 100)}%` : "—"}
        />
        <StatTile label="Ask Martin" value={totals.questions} />
      </div>

      <Section
        title="Content opportunities"
        note="Unanswered searches that came up more than once. Similar wordings are grouped."
      >
        {opportunities.length === 0 ? (
          <p className="text-sm text-[#1a1816]/50">Nothing recurring yet.</p>
        ) : (
          <ul className="border-t border-[#1a1816]/10">
            {opportunities.map((g) => (
              <li key={g.key} className="border-b border-[#1a1816]/8 py-4 flex items-baseline gap-6">
                <span className="text-2xl font-light w-10 shrink-0">{g.count}</span>
                <div>
                  <p className="text-base">{g.label}</p>
                  {g.examples.length > 1 && (
                    <p className="text-xs text-[#1a1816]/50 mt-1">Also asked as: {g.examples.slice(1).join(" · ")}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Ask Martin" note="Questions visitors chose to send you, with their details.">
        {report.questions.length === 0 ? (
          <p className="text-sm text-[#1a1816]/50">No questions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-[#1a1816]/15 text-[#1a1816]/50 uppercase text-xs tracking-widest">
                  <th className="py-3 pr-4">Question</th>
                  <th className="py-3 pr-4">Name</th>
                  <th className="py-3 pr-4">Email</th>
                  <th className="py-3 pr-4">Asked on</th>
                  <th className="py-3 pr-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {report.questions.map((q) => (
                  <tr key={q.id} className="border-b border-[#1a1816]/8 align-top">
                    <td className="py-3 pr-4 max-w-md whitespace-pre-wrap">{q.question}</td>
                    <td className="py-3 pr-4">{q.name}</td>
                    <td className="py-3 pr-4 text-[#1a1816]/70">
                      <a href={`mailto:${q.email}`} className="hover:text-[#6b1f1f]">
                        {q.email}
                      </a>
                    </td>
                    <td className="py-3 pr-4 text-[#1a1816]/60">{q.page_path ?? "—"}</td>
                    <td className="py-3 pr-4 text-[#1a1816]/60 whitespace-nowrap">{formatDate(q.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Unanswered" note="Every search that found nothing good enough to show.">
        {report.unanswered.length === 0 ? (
          <p className="text-sm text-[#1a1816]/50">None yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-[#1a1816]/15 text-[#1a1816]/50 uppercase text-xs tracking-widest">
                  <th className="py-3 pr-4">Search</th>
                  <th className="py-3 pr-4">Times</th>
                  <th className="py-3 pr-4">Last</th>
                </tr>
              </thead>
              <tbody>
                {report.unanswered.map((g) => (
                  <tr key={g.key} className="border-b border-[#1a1816]/8 align-top">
                    <td className="py-3 pr-4">
                      {g.label}
                      {g.examples.length > 1 && (
                        <span className="block text-xs text-[#1a1816]/50 mt-1">{g.examples.slice(1).join(" · ")}</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">{g.count}</td>
                    <td className="py-3 pr-4 text-[#1a1816]/60 whitespace-nowrap">{formatDate(g.lastAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section
        title="What people are asking"
        note="Searches that found something, grouped by the piece that came up first."
      >
        {report.asking.length === 0 ? (
          <p className="text-sm text-[#1a1816]/50">No searches yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-[#1a1816]/15 text-[#1a1816]/50 uppercase text-xs tracking-widest">
                  <th className="py-3 pr-4">Content</th>
                  <th className="py-3 pr-4">Searches</th>
                  <th className="py-3 pr-4">Clicked</th>
                  <th className="py-3 pr-4">Asked as</th>
                </tr>
              </thead>
              <tbody>
                {report.asking.map((d) => (
                  <tr key={d.href} className="border-b border-[#1a1816]/8 align-top">
                    <td className="py-3 pr-4">
                      <span className="block text-xs uppercase tracking-widest text-[#6b1f1f]">{d.type}</span>
                      <a href={d.href} className="hover:text-[#6b1f1f]">
                        {d.title}
                      </a>
                    </td>
                    <td className="py-3 pr-4">{d.searches}</td>
                    <td className="py-3 pr-4">{d.clicks}</td>
                    <td className="py-3 pr-4 text-[#1a1816]/60">{d.examples.join(" · ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Recent searches" note="The last 50, newest first.">
        {report.recent.length === 0 ? (
          <p className="text-sm text-[#1a1816]/50">No searches yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-[#1a1816]/15 text-[#1a1816]/50 uppercase text-xs tracking-widest">
                  <th className="py-3 pr-4">Search</th>
                  <th className="py-3 pr-4">Result</th>
                  <th className="py-3 pr-4">Clicked</th>
                  <th className="py-3 pr-4">Page</th>
                  <th className="py-3 pr-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {report.recent.map((s) => (
                  <tr key={s.id} className="border-b border-[#1a1816]/8 align-top">
                    <td className="py-3 pr-4">{s.query}</td>
                    <td className="py-3 pr-4 text-[#1a1816]/70">
                      {s.matched ? `${s.results[0]?.title ?? "—"}${s.result_count > 1 ? ` +${s.result_count - 1}` : ""}` : (
                        <span className="text-[#6b1f1f]">No match</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-[#1a1816]/70">{s.clicked_href ?? "—"}</td>
                    <td className="py-3 pr-4 text-[#1a1816]/60">{s.page_path ?? "—"}</td>
                    <td className="py-3 pr-4 text-[#1a1816]/60 whitespace-nowrap">{formatDate(s.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </AdminShell>
  );
}
