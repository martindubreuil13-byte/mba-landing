import { RELATED_KIND_LABEL, relatedEntry } from "@/app/lib/publications/related-index";
import type { PublicPublication } from "@/app/lib/publications/types";

export function formatPublicationDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", year: "numeric", month: "long", day: "numeric" });
}

export function languageName(code: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** The publication date as the reader should see it: the exact date if known, else the year, else nothing. */
export function publicationDateLabel(p: Pick<PublicPublication, "publicationDate" | "publicationYear">): string | null {
  if (p.publicationDate) return formatPublicationDate(p.publicationDate);
  if (p.publicationYear) return String(p.publicationYear);
  return null;
}

export const availabilityLabel = (a: PublicPublication["availability"]) => (a === "available" ? "Available" : "Forthcoming");

export function paragraphs(text: string): string[] {
  return text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
}

export function relatedGroups(paths: string[]) {
  const groups = new Map<string, Array<{ path: string; title: string }>>();
  for (const path of paths) {
    const entry = relatedEntry(path);
    if (!entry) continue;
    const label = RELATED_KIND_LABEL[entry.kind];
    groups.set(label, [...(groups.get(label) ?? []), { path: entry.path, title: entry.title }]);
  }
  return [...groups.entries()].map(([label, items]) => ({ label, items }));
}
