export type AudienceRules = { search_query: string; tag_ids: string[] };
export type SavedAudience = AudienceRules & { id: string; name: string };

export function matchingContacts<T extends { name: string; email: string; tags: string[] }>(
  contacts: T[], rules: AudienceRules,
) {
  const query = rules.search_query.trim().toLowerCase();
  return contacts.filter((contact) =>
    rules.tag_ids.every((id) => contact.tags.includes(id)) &&
    (contact.name.toLowerCase().includes(query) || contact.email.toLowerCase().includes(query)));
}

export function addMatching(ids: string[], matching: { id: string }[]) {
  return [...new Set([...ids, ...matching.map(({ id }) => id)])];
}

export function exclusionCounts(contacts: { state: string; reason: string }[]) {
  const counts = new Map<string, number>();
  for (const contact of contacts) {
    if (contact.state !== "Eligible") counts.set(contact.reason, (counts.get(contact.reason) ?? 0) + 1);
  }
  return counts;
}

/** Do the filters on screen differ from the ones saved with this audience? (Tag order does not matter; surrounding spaces in the search do not.) */
export function filtersChanged(saved: AudienceRules, current: AudienceRules) {
  const tags = new Set(saved.tag_ids);
  return saved.search_query.trim() !== current.search_query.trim()
    || tags.size !== new Set(current.tag_ids).size || current.tag_ids.some((id) => !tags.has(id));
}

/** A short description of a set of filters, for confirmations such as "Update “Prospects” to: Search: acme + Tag A". */
export function describeFilters(rules: AudienceRules, tagNames: Map<string, string>) {
  const tags = rules.tag_ids.map((id) => tagNames.get(id) ?? "unavailable tag");
  const parts = [rules.search_query.trim() && `Search: ${rules.search_query.trim()}`, tags.length && tags.join(" + ")].filter(Boolean);
  return parts.join(" · ") || "No filters (all contacts)";
}
