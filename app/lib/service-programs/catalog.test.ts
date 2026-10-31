import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CTA_BESPOKE, CTA_FIXED, CTA_REASSURANCE, PROGRAMS, formatPrice, metaDescription, programPath, programFromHash, hashFor, ctaHref } from "./catalog";

describe("program catalog", () => {
  it("has eight uniquely numbered programs, 01 to 08", () => {
    expect(PROGRAMS.map((p) => p.number)).toEqual(["01", "02", "03", "04", "05", "06", "07", "08"]);
    expect(new Set(PROGRAMS.map((p) => p.slug)).size).toBe(8);
  });

  it("matches the locked pricing", () => {
    expect(Object.fromEntries(PROGRAMS.map((p) => [p.number, formatPrice(p)]))).toEqual({
      "01": "US$199", "02": "US$299", "03": "US$1,999", "04": "US$1,399",
      "05": "US$5,999", "06": "By proposal", "07": "US$699", "08": "By proposal",
    });
  });

  it("keeps the seven-day qualifier with Program 07's timeline", () => {
    const p = PROGRAMS.find((x) => x.number === "07")!;
    expect(p.durationQualifier).toMatch(/provided the necessary information is available/);
    expect(p.note).toMatch(/US\$200 an hour/);
  });

  it("round-trips deep-link hashes and rejects junk", () => {
    for (const p of PROGRAMS) expect(programFromHash(hashFor(p))).toBe(p);
    expect(programFromHash("#program-09")).toBeUndefined();
    expect(programFromHash("#programs")).toBeUndefined();
  });

  it("never links to a fake checkout or booking URL", () => {
    for (const p of PROGRAMS) expect(ctaHref(p)).toMatch(/^\/lets-talk\?program=/);
  });

  it("does not hard-code program prices elsewhere in the work experience", () => {
    const root = path.resolve(__dirname, "../../..");
    for (const f of ["app/work/page.tsx", "app/work/[slug]/page.tsx", "app/components/service-programs/ProgramSlider.tsx", "app/components/service-programs/ProgramSections.tsx", "app/components/service-programs/ProgramLinks.tsx"]) {
      expect(fs.readFileSync(path.join(root, f), "utf8"), f).not.toMatch(/US\$\s?\d|\$\d{3}/);
    }
  });
});

import { programsStructuredData } from "@/app/components/service-programs/structured-data";

describe("structured data", () => {
  const nodes = programsStructuredData()["@graph"] as Array<{ "@id": string; name: string; url: string; provider: Array<{ "@id": string }>; offers?: { price: number; priceCurrency: string } }>;
  const num = (n: { name: string }) => PROGRAMS.find((p) => p.name === n.name)!.number;
  it("offers exist exactly for the six fixed-fee programs, with catalog prices", () => {
    const priced = nodes.filter((n) => n.offers).map((n) => [num(n), n.offers!.price]);
    expect(priced).toEqual([["01", 199], ["02", 299], ["03", 1999], ["04", 1399], ["05", 5999], ["07", 699]]);
    for (const n of nodes) if (n.offers) expect(n.offers.priceCurrency).toBe("USD");
  });
  it("never invents a price for bespoke programs", () => {
    for (const id of ["06", "08"]) expect(nodes.find((n) => num(n) === id)!.offers).toBeUndefined();
  });
});

describe("conversion language", () => {
  it("uses conversation CTAs only, never purchase language", () => {
    for (const p of PROGRAMS) {
      expect(p.cta.label).toBe(p.pricing.kind === "fixed" ? CTA_FIXED : CTA_BESPOKE);
      expect(p.cta.label).not.toMatch(/buy|purchase|start this program|checkout|book now|enroll|pay/i);
    }
    expect(CTA_FIXED).toBe("I\u2019m interested \u2014 Let\u2019s talk");
    expect(CTA_BESPOKE).toBe("Discuss my project");
    expect(CTA_REASSURANCE).toBe("Free initial conversation. No payment or commitment.");
  });
});

describe("program pages and discoverability", () => {
  const nodes = programsStructuredData()["@graph"] as Array<{ "@id": string; url: string; provider: Array<{ "@id": string }> }>;
  it("each program has a dedicated /work/<slug> URL used by its Service node", () => {
    PROGRAMS.forEach((p, i) => {
      expect(programPath(p)).toBe(`/work/${p.slug}`);
      expect(nodes[i].url.endsWith(`/work/${p.slug}`)).toBe(true);
      expect(nodes[i]["@id"]).toBe(`${nodes[i].url}#service`);
    });
  });
  it("names the existing organization and principal as provider", () => {
    for (const n of nodes) expect(n.provider.map((x) => x["@id"]).sort()).toEqual([
      "https://modernbusinessarchitect.com/#business", "https://modernbusinessarchitect.com/#martin"]);
  });
  it("titles are unique and descriptions carry the catalog price or 'by written proposal'", () => {
    expect(new Set(PROGRAMS.map((p) => p.seoTitle)).size).toBe(8);
    for (const p of PROGRAMS) {
      const d = metaDescription(p);
      expect(d).toContain(p.pricing.kind === "fixed" ? formatPrice(p) : "Priced by written proposal");
      expect(d.length).toBeLessThan(330);
    }
  });
  it("sitemap and llms.txt list every program URL", async () => {
    const root = path.resolve(__dirname, "../../..");
    const sm = fs.readFileSync(path.join(root, "app/sitemap-data.ts"), "utf8");
    const llms = fs.readFileSync(path.join(root, "app/llms.txt/route.ts"), "utf8");
    expect(sm).toMatch(/PROGRAMS\.map\(programPath\)/);
    expect(llms).toMatch(/programPath\(p\)/);
    expect(llms).toMatch(/guarantee|independent programs/);
  });
});

describe("selector labels and card copy", () => {
  it("uses the approved first-person situation labels, in order", () => {
    expect(PROGRAMS.map((p) => p.hook)).toEqual([
      "I'm thinking about starting a business",
      "I want a business, but have no idea",
      "I have an idea. Will it work?",
      "I have an idea. I want to launch fast",
      "I'm building something more complex",
      "I have a plan. I need to make it happen",
      "My business is running, but something's wrong",
      "My company needs a major change",
    ]);
  });
  it("has a shorter tablet label, a one-sentence audience and a receive line for every program", () => {
    for (const p of PROGRAMS) {
      expect(p.hookShort.length).toBeLessThan(p.hook.length);
      expect(p.who.split(/[.!?]\s/).length).toBe(1);
      expect(p.receive.length).toBeGreaterThan(10);
    }
  });
  it("keeps scope limits visible on the card where the label could mislead", () => {
    expect(PROGRAMS[3].receive).toMatch(/Launch, website, MVP and campaigns are not included/);
    expect(PROGRAMS[6].receive).toMatch(/implementation help is separate/);
  });
});
