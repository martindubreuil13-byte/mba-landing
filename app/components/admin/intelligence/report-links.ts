import { isoDay, type RangePreset, type ResolvedRange } from "@/app/lib/intelligence/ranges";

export type ReportParams = Record<string, string | string[] | undefined>;

export function reportFilters(params: ReportParams = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "range" || key === "from" || key === "to" || value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value]) query.append(key, item);
  }
  return query;
}

export function reportHref(path: string, params: ReportParams, range: ResolvedRange | RangePreset) {
  const query = reportFilters(params);
  if (typeof range === "string") {
    query.set("range", range);
  } else if (range.key === "custom") {
    query.set("from", isoDay(range.from));
    query.set("to", isoDay(new Date(range.to.getTime() - 86_400_000)));
  } else {
    query.set("range", range.key);
  }
  return `${path}?${query}`;
}
