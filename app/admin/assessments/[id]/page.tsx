import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import { getAssessmentAdminDetail } from "@/app/lib/assessment/queries";
import { QUESTION_BY_CODE } from "@/app/lib/assessment/config";
import AdminShell from "@/app/components/admin/AdminShell";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="text-xs tracking-widest uppercase text-[#1a1816]/50 font-semibold mb-3">{title}</h2>
      {children}
    </div>
  );
}

export default async function AdminAssessmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const a = await getAssessmentAdminDetail(id);
  if (!a) notFound();

  return (
    <AdminShell>
      <Link href="/admin/assessments" className="text-xs tracking-widest uppercase text-[#1a1816]/50 hover:text-[#1a1816]">
        ← All assessments
      </Link>

      <div className="flex items-baseline justify-between flex-wrap gap-4 mt-6 mb-10">
        <div>
          <h1 className="text-2xl font-light">{a.idea_name || "(untitled idea)"}</h1>
          <p className="text-[#1a1816]/60 text-sm mt-1">
            {a.lead_first_name} — {a.lead_email} — stage: {a.business_stage}
          </p>
        </div>
        <div className="text-right">
          <p className="text-4xl font-light">{a.overall_score}<span className="text-lg text-[#1a1816]/40">/100</span></p>
          <p className="text-xs text-[#1a1816]/50">
            {a.completed_at ? new Date(a.completed_at).toLocaleString() : "Not completed"}
          </p>
        </div>
      </div>

      {a.material_negative_evidence?.triggered && (
        <div className="border border-[#6b1f1f] bg-[#6b1f1f]/5 px-6 py-5 mb-10">
          <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-2">Material negative evidence</p>
          <ul className="space-y-1">
            {a.material_negative_evidence.items.map((item, i) => (
              <li key={i} className="text-sm text-[#1a1816]/80">
                {item.category} ({item.sourceQuestion}): &ldquo;{item.quote}&rdquo;
              </li>
            ))}
          </ul>
        </div>
      )}

      <Section title="Dimension scores">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {a.dimension_scores.map((d) => (
            <div key={d.key} className="border border-[#1a1816]/10 bg-white px-4 py-3">
              <p className="text-lg font-light">{d.percent}%</p>
              <p className="text-xs text-[#1a1816]/50">{d.name}</p>
              <p className="text-xs text-[#1a1816]/40">{d.band}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Context">
        <p className="text-sm text-[#1a1816]/80">{a.idea_description || "—"}</p>
        {a.location && <p className="text-sm text-[#1a1816]/50 mt-1">Location: {a.location}</p>}
      </Section>

      <Section title="Critical-gap flags">
        <p className="text-sm text-[#1a1816]/80">{a.critical_flags.length ? a.critical_flags.join(", ") : "None"}</p>
      </Section>

      <Section title="Contradictions">
        <p className="text-sm text-[#1a1816]/80">{a.contradictions.length ? a.contradictions.join(", ") : "None"}</p>
      </Section>

      <Section title="Evidence Debt">
        <p className="text-sm text-[#1a1816]/80">
          {a.evidence_debt?.level} — {a.evidence_debt?.rationale}
        </p>
      </Section>

      <Section title="Strongest signal">
        <p className="text-sm text-[#1a1816]/80">
          {a.strongest_signal?.finding} — {a.strongest_signal?.evidence}
        </p>
      </Section>

      <Section title="Biggest exposure">
        <p className="text-sm text-[#1a1816]/80">
          {a.biggest_exposure?.finding} — {a.biggest_exposure?.rationale}
        </p>
      </Section>

      <Section title="Priority investigation">
        <p className="text-sm text-[#1a1816]/80">{a.priority_investigation?.action}</p>
      </Section>

      {a.generated_assessment_text ? (
        <Section title="Generated assessment (participant-facing)">
          <div className="space-y-3 text-sm text-[#1a1816]/80">
            <p><strong>What I see:</strong> {a.generated_assessment_text.whatISee}</p>
            <p><strong>Strongest signal:</strong> {a.generated_assessment_text.strongestSignal}</p>
            <p><strong>Biggest exposure:</strong> {a.generated_assessment_text.biggestExposure}</p>
            <p><strong>Next actions:</strong> {a.generated_assessment_text.nextActions.join(" / ")}</p>
          </div>
        </Section>
      ) : (
        <Section title="Generated assessment (participant-facing)">
          <p className="text-sm text-[#6b1f1f]">
            Generation status: {a.generation_status}{a.generation_error ? ` — ${a.generation_error}` : ""}
          </p>
        </Section>
      )}

      <Section title="All 13 responses">
        <div className="space-y-4">
          {Object.entries(a.raw_answers).map(([code, value]) => (
            <div key={code} className="border-b border-[#1a1816]/8 pb-3">
              <p className="text-xs uppercase tracking-widest text-[#1a1816]/40">
                {code.toUpperCase()} — {QUESTION_BY_CODE[code]?.prompt}
              </p>
              <p className="text-sm text-[#1a1816]/85 mt-1">{value}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Attribution">
        <p className="text-sm text-[#1a1816]/70">
          {[a.source, a.medium, a.campaign].filter(Boolean).join(" / ") || "—"}
          {a.referrer ? ` — referrer: ${a.referrer}` : ""}
        </p>
      </Section>

      {a.cta_clicked && (
        <Section title="CTA activity">
          <p className="text-sm text-[#1a1816]/70">
            {a.cta_clicked} — {a.cta_clicked_at ? new Date(a.cta_clicked_at).toLocaleString() : ""}
          </p>
        </Section>
      )}

      <p className="text-xs text-[#1a1816]/30">Assessment version: {a.assessment_version}</p>
    </AdminShell>
  );
}
