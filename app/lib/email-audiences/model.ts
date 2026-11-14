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
