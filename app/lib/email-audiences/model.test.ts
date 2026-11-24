import { describe, expect, it } from "vitest";
import { addMatching, describeFilters, exclusionCounts, filtersChanged, matchingContacts } from "./model";

const contacts = [
  { id: "1", name: "Ana Lee", email: "ana@example.com", tags: ["founders", "sme"] },
  { id: "2", name: "Jane Doe", email: "jane@example.com", tags: ["founders"] },
  { id: "3", name: "Jo Lee", email: "jo@example.net", tags: ["sme"] },
];

describe("audience rules", () => {
  it("combines case insensitive name or email search with all selected tags", () => {
    expect(matchingContacts(contacts, { search_query: " LEE ", tag_ids: ["founders", "sme"] })).toEqual([contacts[0]]);
    expect(matchingContacts(contacts, { search_query: "example.net", tag_ids: [] })).toEqual([contacts[2]]);
  });
  it("recomputes saved rules from live assignments, including removed tags", () => {
    const rules = { search_query: "", tag_ids: ["founders"] };
    expect(matchingContacts(contacts, rules)).toHaveLength(2);
    expect(matchingContacts([
      { ...contacts[0], tags: [] }, contacts[1], { ...contacts[2], tags: ["founders", "sme"] },
    ], rules).map(({ id }) => id)).toEqual(["2", "3"]);
    expect(matchingContacts(contacts, { ...rules, tag_ids: ["removed"] })).toEqual([]);
  });
  it("unions all 61 matches regardless of display page", () => {
    const all = Array.from({ length: 61 }, (_, index) => ({ id: String(index) }));
    expect(addMatching(["outside", "0"], all)).toEqual(["outside", ...all.map(({ id }) => id)]);
  });
  it("counts unknown and ineligible recipients separately by reason", () => {
    expect([...exclusionCounts([
      { state: "Eligible", reason: "Opt-in" }, { state: "Unknown", reason: "Incomplete" },
      { state: "Not eligible", reason: "Suppressed" }, { state: "Not eligible", reason: "Suppressed" },
    ])]).toEqual([["Incomplete", 1], ["Suppressed", 2]]);
  });
});

describe("saved audience filters", () => {
  const saved = { search_query: "acme", tag_ids: ["a", "b"] };
  it("sees a change in search or tags, but not in tag order or surrounding spaces", () => {
    expect(filtersChanged(saved, { search_query: " acme ", tag_ids: ["b", "a"] })).toBe(false);
    expect(filtersChanged(saved, { search_query: "acme corp", tag_ids: ["a", "b"] })).toBe(true);
    expect(filtersChanged(saved, { search_query: "acme", tag_ids: ["a"] })).toBe(true);
    expect(filtersChanged(saved, { search_query: "acme", tag_ids: ["a", "b", "c"] })).toBe(true);
    expect(filtersChanged(saved, { search_query: "acme", tag_ids: ["a", "c"] })).toBe(true);
    expect(filtersChanged({ search_query: "", tag_ids: [] }, { search_query: "  ", tag_ids: [] })).toBe(false);
  });
  it("describes filters in words, naming tags that no longer exist", () => {
    const names = new Map([["a", "Founders"]]);
    expect(describeFilters({ search_query: " acme ", tag_ids: ["a"] }, names)).toBe("Search: acme · Founders");
    expect(describeFilters({ search_query: "", tag_ids: ["a", "gone"] }, names)).toBe("Founders + unavailable tag");
    expect(describeFilters({ search_query: "", tag_ids: [] }, names)).toBe("No filters (all contacts)");
  });
});

