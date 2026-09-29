import "server-only";
import { getServiceClient } from "@/app/lib/supabase/service";
import { bandFor, OVERALL_BANDS } from "@/app/lib/assessment/config";
import { INTERPRETATION_LABELS, type InterpretationCategory } from "@/app/lib/napkin/config";

/**
 * Lightweight, read-only reporting for the Leads → Experiences/Insights
 * panel. Reuses the raw tables each feature already writes to — no new
 * schema, no duplicated data. Deliberately shallow: counts, recent items
 * and simple distributions only, per the "keep this reporting lightweight"
 * requirement. Anything needing the full record (all inputs, full
 * calculation) links out to the existing detail admin pages instead of
 * being reproduced here.
 */

export type CountBucket = { key: string; label: string; count: number };
export type RecentItem = { id: string; type: "napkin" | "reality_check"; label: string; detail: string; at: string; href: string };

export type ExperienceInsights = {
  napkin: {
    completed: number;
    communityJoined: number;
    subscribed: number;
    categories: CountBucket[];
    countries: CountBucket[];
    recent: RecentItem[];
  };
  realityCheck: {
    completed: number;
    avgScore: number | null;
    bands: CountBucket[];
    countries: CountBucket[];
    recent: RecentItem[];
  };
  combined: {
    totalCompletions: number;
    recent: RecentItem[];
  };
};

function bucketize(counts: Map<string, number>, labelFor: (key: string) => string): CountBucket[] {
  return [...counts.entries()]
    .map(([key, count]) => ({ key, label: labelFor(key), count }))
    .sort((a, b) => b.count - a.count);
}

export async function getExperienceInsights(): Promise<ExperienceInsights> {
  const supabase = getServiceClient();

  const [{ data: leadsData }, { data: napkinData }, { data: assessmentData }] = await Promise.all([
    supabase.from("leads").select("id, country, ongoing_content_opt_in"),
    supabase
      .from("napkin_submissions")
      .select("id, lead_id, created_at, joined_at, business_name, interpretation_category, marketing_consent")
      .order("created_at", { ascending: false }),
    supabase
      .from("assessments")
      .select("id, lead_id, created_at, completed_at, idea_name, overall_score")
      .order("created_at", { ascending: false }),
  ]);

  const countryByLead = new Map<string, string | null>();
  const optInByLead = new Map<string, boolean>();
  for (const l of leadsData ?? []) {
    countryByLead.set(l.id, l.country);
    optInByLead.set(l.id, l.ongoing_content_opt_in);
  }

  type NapkinRow = {
    id: string;
    lead_id: string | null;
    created_at: string;
    joined_at: string | null;
    business_name: string | null;
    interpretation_category: InterpretationCategory;
    marketing_consent: boolean;
  };
  const napkin = (napkinData ?? []) as NapkinRow[];

  const napkinCategoryCounts = new Map<string, number>();
  const napkinCountryCounts = new Map<string, number>();
  let napkinCommunityJoined = 0;
  let napkinSubscribed = 0;
  for (const n of napkin) {
    napkinCategoryCounts.set(n.interpretation_category, (napkinCategoryCounts.get(n.interpretation_category) ?? 0) + 1);
    if (n.lead_id) {
      const country = countryByLead.get(n.lead_id);
      if (country) napkinCountryCounts.set(country, (napkinCountryCounts.get(country) ?? 0) + 1);
      if (n.marketing_consent) {
        napkinCommunityJoined += 1;
        if (optInByLead.get(n.lead_id)) napkinSubscribed += 1;
      }
    }
  }

  const napkinRecent: RecentItem[] = napkin.slice(0, 8).map((n) => ({
    id: n.id,
    type: "napkin",
    label: n.business_name || "Untitled business or idea",
    detail: INTERPRETATION_LABELS[n.interpretation_category] ?? n.interpretation_category,
    at: n.joined_at ?? n.created_at,
    href: `/admin/napkin/${n.id}`,
  }));

  type AssessmentRow = {
    id: string;
    lead_id: string | null;
    created_at: string;
    completed_at: string | null;
    idea_name: string | null;
    overall_score: number;
  };
  const assessmentsAll = (assessmentData ?? []) as AssessmentRow[];
  const assessments = assessmentsAll.filter((a) => a.completed_at);

  const bandCounts = new Map<string, number>();
  const realityCountryCounts = new Map<string, number>();
  let scoreSum = 0;
  for (const a of assessments) {
    const band = bandFor(OVERALL_BANDS, a.overall_score).label;
    bandCounts.set(band, (bandCounts.get(band) ?? 0) + 1);
    scoreSum += a.overall_score;
    if (a.lead_id) {
      const country = countryByLead.get(a.lead_id);
      if (country) realityCountryCounts.set(country, (realityCountryCounts.get(country) ?? 0) + 1);
    }
  }

  const realityRecent: RecentItem[] = assessments.slice(0, 8).map((a) => ({
    id: a.id,
    type: "reality_check",
    label: a.idea_name || "(untitled idea)",
    detail: `${a.overall_score}/100`,
    at: a.completed_at as string,
    href: `/admin/assessments/${a.id}`,
  }));

  const combinedRecent = [...napkinRecent, ...realityRecent].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 10);

  return {
    napkin: {
      completed: napkin.length,
      communityJoined: napkinCommunityJoined,
      subscribed: napkinSubscribed,
      categories: bucketize(napkinCategoryCounts, (k) => INTERPRETATION_LABELS[k as InterpretationCategory] ?? k),
      countries: bucketize(napkinCountryCounts, (k) => k),
      recent: napkinRecent,
    },
    realityCheck: {
      completed: assessments.length,
      avgScore: assessments.length ? Math.round(scoreSum / assessments.length) : null,
      bands: bucketize(bandCounts, (k) => k),
      countries: bucketize(realityCountryCounts, (k) => k),
      recent: realityRecent,
    },
    combined: {
      totalCompletions: napkin.length + assessments.length,
      recent: combinedRecent,
    },
  };
}
