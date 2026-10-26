import { describe, expect, it } from "vitest";
import { formatRate, parseCsv, parseResultsCsv, parseUrls, resultSchema, summarize, type StoredResult } from "./benchmarks-model";

const QID = "0b9f1c1e-1c2d-4e5f-8a9b-0123456789ab";
const base = { question_id: QID, platform: "ChatGPT", asked_on: "2026-10-26" };

describe("result validation", () => {
  it("maps yes/no/blank to true/false/null and never invents an answer", () => {
    const r = resultSchema.parse({ ...base, mentions_business: "yes", mentions_martin: "no", cites_site: "", recommends_business: undefined, positioning: "partial" });
    expect([r.mentions_business, r.mentions_martin, r.cites_site, r.recommends_business, r.positioning]).toEqual([true, false, null, null, "partial"]);
  });
  it("rejects bad dates, short platforms, unknown tri-state values and oversize text", () => {
    expect(resultSchema.safeParse({ ...base, asked_on: "26/10/2026" }).success).toBe(false);
    expect(resultSchema.safeParse({ ...base, platform: "x" }).success).toBe(false);
    expect(resultSchema.safeParse({ ...base, mentions_business: "maybe" }).success).toBe(false);
    expect(resultSchema.safeParse({ ...base, excerpt: "x".repeat(1501) }).success).toBe(false);
  });
  it("keeps only http(s) URLs, de-duplicated and capped", () => {
    expect(parseUrls("https://a.com/x, javascript:alert(1) https://a.com/x|http://b.org ftp://c")).toEqual(["https://a.com/x", "http://b.org"]);
    expect(parseUrls(Array.from({ length: 30 }, (_, i) => `https://e.com/${i}`).join(" "))).toHaveLength(10);
  });
});

describe("summary", () => {
  const r = (o: Partial<StoredResult>): StoredResult => ({ platform: "ChatGPT", mentions_business: null, mentions_martin: null, cites_site: null, recommends_business: null, positioning: null, ...o });
  it("reports yes ÷ assessed, never counting 'not assessed' as no", () => {
    const [s] = summarize([r({ mentions_business: true, cites_site: true }), r({ mentions_business: false }), r({ mentions_business: null, positioning: "accurate" })]);
    expect(s.answers).toBe(3);
    expect(formatRate(s.mentions_business)).toBe("1/2");
    expect(formatRate(s.cites_site)).toBe("1/1");
    expect(formatRate(s.recommends_business)).toBe("—");
    expect(formatRate(s.positioning_accurate)).toBe("1/1");
  });
  it("groups per platform, largest first", () => {
    const out = summarize([r({}), r({ platform: "Claude" }), r({ platform: "Claude" })]);
    expect(out.map((s) => [s.platform, s.answers])).toEqual([["Claude", 2], ["ChatGPT", 1]]);
  });
});

describe("CSV import", () => {
  it("parses quoted fields, embedded commas/newlines and CRLF", () => {
    expect(parseCsv('a,b\r\n"x, y","line1\nline2"\r\n')).toEqual([["a", "b"], ["x, y", "line1\nline2"]]);
    expect(parseCsv('"he said ""hi"""')).toEqual([['he said "hi"']]);
  });
  const header = "question,platform,model,asked_on,mentions_business,mentions_martin,cites_site,recommends_business,positioning,cited_urls,notes";
  it("accepts valid rows", () => {
    const { rows, errors } = parseResultsCsv(`${header}\nWhat is business architecture?,ChatGPT,gpt-x,2026-10-26,yes,no,,yes,accurate,https://modernbusinessarchitect.com/answers/what-is-business-architecture,"ok, noted"\n`);
    expect(errors).toEqual([]);
    expect(rows[0].result).toMatchObject({ platform: "ChatGPT", mentions_business: true, mentions_martin: false, cites_site: null, positioning: "accurate", notes: "ok, noted" });
    expect(rows[0].result.cited_urls).toEqual(["https://modernbusinessarchitect.com/answers/what-is-business-architecture"]);
  });
  it("reports row-level errors and stores nothing from a bad file", () => {
    const bad = parseResultsCsv(`${header}\ntiny,ChatGPT,,2026-10-26,,,,,,,\nA long enough question?,C,,not-a-date,maybe,,,,,,\n`);
    expect(bad.errors).toHaveLength(2);
    expect(bad.errors[0]).toMatch(/Row 2/);
  });
  it("requires headers and bounds size", () => {
    expect(parseResultsCsv("question,platform\nx,y").errors[0]).toMatch(/asked_on/);
    expect(parseResultsCsv("").errors).toHaveLength(1);
    const many = `${header}\n` + Array.from({ length: 201 }, () => "A long enough question?,ChatGPT,,2026-10-26,,,,,,,").join("\n");
    expect(parseResultsCsv(many).errors[0]).toMatch(/At most 200/);
  });
});
