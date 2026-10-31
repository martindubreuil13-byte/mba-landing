import { describe, expect, it } from "vitest";
import {
  checkRetailer,
  isValidIsoDate,
  isValidSlug,
  normalizeIsbn,
  parseStoredEditions,
  parseStoredRelated,
  parseStoredRetailers,
  parseStoredThemes,
  publishBlockers,
  publishWarnings,
  slugify,
  validateEditions,
  validatePublicationContent,
  validateRelated,
  validateRetailers,
  type ReadinessSubject,
} from "./validation";

describe("slugs", () => {
  it("normalises titles into URL-safe slugs", () => {
    expect(slugify("Architecting Intelligence: A Field Guide!")).toBe("architecting-intelligence-a-field-guide");
    expect(slugify("  Café & Création ")).toBe("cafe-and-creation");
    expect(slugify("---")).toBe("");
  });
  it("accepts only lower-case hyphenated slugs of a sane length", () => {
    expect(isValidSlug("my-book-2")).toBe(true);
    for (const bad of ["", "a", "My-Book", "my--book", "-my-book", "my-book-", "my_book", "my book", "../etc", "a".repeat(81)]) {
      expect(isValidSlug(bad), bad).toBe(false);
    }
  });
});

describe("ISBN", () => {
  it("accepts valid ISBN-13 and ISBN-10 (with an X check digit), with or without hyphens", () => {
    expect(normalizeIsbn("978-0-306-40615-7")).toBe("9780306406157");
    expect(normalizeIsbn("ISBN 9780306406157")).toBe("9780306406157");
    expect(normalizeIsbn("0-306-40615-2")).toBe("0306406152");
    expect(normalizeIsbn("0-8044-2957-X")).toBe("080442957X");
  });
  it("rejects wrong checksums, wrong lengths and junk", () => {
    for (const bad of ["9780306406158", "0306406153", "12345", "abcdefghijklm", "", "978030640615X"]) {
      expect(normalizeIsbn(bad), bad).toBeNull();
    }
    expect(normalizeIsbn(undefined)).toBeNull();
  });
  it("keeps one ISBN per format, never one for the whole work", () => {
    const { editions, errors } = validateEditions([
      { format: "Paperback", isbn: "978-0-306-40615-7" },
      { format: "eBook", isbn: "" },
    ]);
    expect(errors).toEqual([]);
    expect(editions).toEqual([{ format: "Paperback", isbn: "9780306406157" }, { format: "eBook", isbn: null }]);
  });
  it("flags an ISBN without a format, a bad ISBN and a duplicate", () => {
    expect(validateEditions([{ format: "", isbn: "9780306406157" }]).errors).toHaveLength(1);
    expect(validateEditions([{ format: "Paperback", isbn: "9780306406158" }]).errors[0]).toMatch(/not a valid ISBN/);
    expect(validateEditions([{ format: "A", isbn: "9780306406157" }, { format: "B", isbn: "9780306406157" }]).errors.join(" ")).toMatch(/twice/);
  });
});

describe("retailer links", () => {
  const ok = (url: string) => checkRetailer({ name: "Shop", url });
  it("accepts a plain https link and normalises it", () => {
    expect(ok("https://www.example-books.com/title/123?ref=abc")).toEqual({ ok: true, retailer: { name: "Shop", url: "https://www.example-books.com/title/123?ref=abc" } });
    expect(ok("  https://Bookshop.org/a  ")).toMatchObject({ ok: true });
  });
  it.each([
    ["http://shop.com/x", "https"],
    ["javascript:alert(1)", "https"],
    ["data:text/html,<script>alert(1)</script>", "https"],
    ["file:///etc/passwd", "https"],
    ["ftp://shop.com/x", "https"],
    ["//shop.com/x", "valid link"],
    ["shop.com/x", "valid link"],
    ["https://user:pass@shop.com/x", "username or password"],
    ["https://user@shop.com/x", "username or password"],
    ["https://shop.com:8443/x", "port"],
    ["https://localhost/x", "public web address"],
    ["https://localhost.localdomain/x", "public web address"],
    ["https://127.0.0.1/x", "public web address"],
    ["https://10.0.0.5/x", "public web address"],
    ["https://169.254.169.254/latest/meta-data", "public web address"],
    ["https://[::1]/x", "public web address"],
    ["https://2130706433/x", "public web address"],
    ["https://printer.local/x", "public web address"],
    ["https://intranet/x", "public web address"],
    ["https://shop.internal/x", "public web address"],
    ["https://shop.com/" + "a".repeat(500), "too long"],
  ])("rejects %s", (url, reason) => {
    const result = ok(url);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain(reason);
  });
  it("drops completely blank rows, rejects half-filled ones, caps the list", () => {
    expect(validateRetailers([{ name: "", url: "" }, { name: "A", url: "https://a.com/x" }]).retailers).toHaveLength(1);
    expect(validateRetailers([{ name: "A", url: "" }]).errors).toHaveLength(1);
    expect(validateRetailers([{ name: "", url: "https://a.com/x" }]).errors).toHaveLength(1);
    const many = Array.from({ length: 21 }, (_, i) => ({ name: `S${i}`, url: `https://s${i}.com/x` }));
    expect(validateRetailers(many).errors.join(" ")).toMatch(/at most 20/);
    expect(validateRetailers("nope").errors).toHaveLength(1);
  });
  it("preserves the order the admin set", () => {
    const { retailers } = validateRetailers([
      { name: "Z", url: "https://z.com/x" },
      { name: "A", url: "https://a.com/x" },
    ]);
    expect(retailers.map((r) => r.name)).toEqual(["Z", "A"]);
  });
  it("treats names as text: control characters are stripped, markup is not interpreted here", () => {
    const r = checkRetailer({ name: "Shop\u0000\n<b>x</b>", url: "https://a.com/x" });
    expect(r.ok && r.retailer.name).toBe("Shop <b>x</b>");
  });
  it("re-validates stored data on read, dropping anything unsafe", () => {
    const stored = [
      { name: "Good", url: "https://good.com/a" },
      { name: "Bad", url: "javascript:alert(1)" },
      { name: "Worse", url: "http://insecure.com" },
      "garbage",
      null,
    ];
    expect(parseStoredRetailers(stored)).toEqual([{ name: "Good", url: "https://good.com/a" }]);
    expect(parseStoredRetailers("not an array")).toEqual([]);
  });
});

describe("related links", () => {
  it("accepts only known local pages", () => {
    expect(validateRelated(["/thinking/architecting-intelligence", "/thinking/architecting-intelligence"]).related).toEqual(["/thinking/architecting-intelligence"]);
    expect(validateRelated(["https://evil.com/x"]).errors).toHaveLength(1);
    expect(validateRelated(["//evil.com"]).errors).toHaveLength(1);
    expect(validateRelated(["/thinking/does-not-exist"]).errors).toHaveLength(1);
    expect(validateRelated(["/admin/publications"]).errors).toHaveLength(1);
  });
  it("drops removed pages from stored data", () => {
    expect(parseStoredRelated(["/thinking/architecting-intelligence", "/thinking/gone", 5])).toEqual(["/thinking/architecting-intelligence"]);
  });
});

describe("dates, themes", () => {
  it("accepts real calendar dates only", () => {
    expect(isValidIsoDate("2026-02-28")).toBe(true);
    expect(isValidIsoDate("2024-02-29")).toBe(true);
    for (const bad of ["2026-02-30", "2026-13-01", "26-01-01", "2026-1-1", "", "1200-01-01"]) expect(isValidIsoDate(bad), bad).toBe(false);
  });
  it("trims, de-duplicates and bounds themes", () => {
    expect(parseStoredThemes([" A ", "a", "", "B"])).toEqual(["A", "a", "B"]);
  });
});

describe("whole-form validation", () => {
  const base = { title: "A Book", slug: "a-book" };
  it("accepts a minimal draft: title only (slug derived)", () => {
    const r = validatePublicationContent({ title: "A Book" });
    expect(r.ok && r.value.slug).toBe("a-book");
    expect(r.ok && r.value.availability).toBe("forthcoming");
  });
  it("rejects a missing title, a bad slug, bad availability, a mismatched year/date and an unknown language", () => {
    const r = validatePublicationContent({ title: "  ", slug: "Bad Slug", availability: "sold", publicationYear: 2025, publicationDate: "2026-01-01", language: "english!" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.fieldErrors).sort()).toEqual(["availability", "language", "publicationYear", "slug", "title"]);
  });
  it("bounds every text field", () => {
    const r = validatePublicationContent({ ...base, introduction: "x".repeat(2001), description: "x".repeat(12001), subtitle: "x".repeat(301) });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.fieldErrors).sort()).toEqual(["description", "introduction", "subtitle"]);
  });
  it("surfaces list errors against the right field", () => {
    const r = validatePublicationContent({ ...base, retailers: [{ name: "A", url: "http://a.com" }], editions: [{ format: "P", isbn: "1" }], related: ["/nope"] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.fieldErrors).sort()).toEqual(["editions", "related", "retailers"]);
  });
  it("rejects non-object bodies", () => {
    expect(validatePublicationContent(null).ok).toBe(false);
    expect(validatePublicationContent([]).ok).toBe(false);
    expect(validatePublicationContent("x").ok).toBe(false);
  });
});

describe("publish readiness", () => {
  const complete: ReadinessSubject = {
    title: "T", slug: "t-book", author: "A", introduction: "I", description: "D", availability: "forthcoming",
    retailers: [], hasCover: false, coverAlt: null, publicationYear: null, publicationDate: null, editions: [],
  };
  it("a forthcoming title with the required text needs no retailer, ISBN or date", () => {
    expect(publishBlockers(complete)).toEqual({});
  });
  it("requires author, introduction and description, and treats whitespace as empty", () => {
    expect(Object.keys(publishBlockers({ ...complete, author: " ", introduction: null, description: "" })).sort()).toEqual(["author", "description", "introduction"]);
  });
  it("an available title needs a place to get it", () => {
    expect(Object.keys(publishBlockers({ ...complete, availability: "available" }))).toEqual(["retailers"]);
    expect(publishBlockers({ ...complete, availability: "available", retailers: [{ name: "A", url: "https://a.com/x" }] })).toEqual({});
  });
  it("warns about a missing cover (text-only layout is allowed) and about thin bibliographic data", () => {
    expect(publishWarnings(complete).join(" ")).toMatch(/text-only/);
    expect(publishWarnings({ ...complete, hasCover: true, coverAlt: "" }).join(" ")).toMatch(/screen readers/);
    expect(publishWarnings({ ...complete, hasCover: true, coverAlt: "x", availability: "available" }).join(" ")).toMatch(/no publication year/i);
    expect(publishWarnings({ ...complete, hasCover: true, coverAlt: "x" })).toEqual([]);
  });
});

describe("stored editions", () => {
  it("drops malformed entries and invalid ISBNs on read", () => {
    expect(parseStoredEditions([{ format: "Paperback", isbn: "9780306406157" }, { format: "", isbn: "x" }, { format: "eBook", isbn: "123" }, 4])).toEqual([
      { format: "Paperback", isbn: "9780306406157" },
      { format: "eBook", isbn: null },
    ]);
  });
});
