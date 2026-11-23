import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CTA_COPY, ENGAGEMENT_POINTS, EXPLORE_FURTHER, FAQS, FOUNDING, FUNCTIONS, HERO_HEADLINE, OUTCOMES, PHASES, SYSTEM_NODES } from "./content";
import { INTRO_BOOKING_MINUTES } from "@/app/lib/booking";
import { contentCategory } from "@/app/lib/intelligence/content";

const APP = path.resolve(__dirname, "..");
const read = (rel: string) => fs.readFileSync(path.join(APP, rel), "utf8");

/** A Next.js app-router URL exists when its directory holds a page file. */
const routeExists = (href: string) => fs.existsSync(path.join(APP, href.replace(/^\//, ""), "page.tsx"));

const allCopy = JSON.stringify({ OUTCOMES, FUNCTIONS, SYSTEM_NODES, PHASES, ENGAGEMENT_POINTS, FOUNDING, FAQS, EXPLORE_FURTHER });

describe("/business-rearchitecture content", () => {
  it("keeps the required headline exactly", () => {
    expect(HERO_HEADLINE).toBe("AI is changing business. What could it do for yours?");
  });

  it("has the four outcomes, six functions, three phases and twelve questions the brief asks for", () => {
    expect(OUTCOMES).toHaveLength(4);
    expect(FUNCTIONS.map((f) => f.short)).toEqual(["Sales", "Production", "Inventory", "Logistics", "Finance", "People"]);
    expect(PHASES.map((p) => p.name)).toEqual(["Decode", "Architect", "Make It Exist"]);
    expect(FAQS).toHaveLength(12);
  });

  it("every Explore Further link points at a page that exists", () => {
    expect(EXPLORE_FURTHER.length).toBeGreaterThanOrEqual(3);
    for (const l of EXPLORE_FURTHER) expect(routeExists(l.href), l.href).toBe(true);
  });

  it("every Explorer connection names a real function other than itself", () => {
    const ids = new Set(FUNCTIONS.map((f) => f.id));
    for (const f of FUNCTIONS) {
      expect(f.ripples.length).toBeGreaterThan(0);
      for (const r of f.ripples) {
        expect(ids.has(r.to), `${f.id} -> ${r.to}`).toBe(true);
        expect(r.to).not.toBe(f.id);
      }
    }
  });

  it("states no prices, durations, guarantees or testimonials", () => {
    expect(allCopy).not.toMatch(/[$€£]\s?\d|US\$|\bUSD\b|\bVND\b|\bPHP\b/);
    expect(allCopy).not.toMatch(/\b\d+\s?(weeks?|months?|days?)\b/i);
    expect(allCopy).not.toMatch(/guarantee(?!d?\s*financial)|\btestimonial\b|case study/i);
  });

  it("names the target markets without implying a local presence", () => {
    const page = read("business-rearchitecture/page.tsx");
    for (const text of [allCopy, page]) {
      expect(text).not.toMatch(/\boffices?\b|local (team|staff|employees|presence|partners?)|our team in|based in|on the ground|headquarter/i);
    }
    expect(page).toMatch(/first engagements are focused on businesses in/);
  });

  it("publishes no discount, percentage or price for the Founding Client Program", () => {
    expect(JSON.stringify(FOUNDING)).not.toMatch(/\d+\s?%|discount|[$€£]|\bfree\b(?! trial)|\d{2,}/i);
    expect(FOUNDING.terms).toMatch(/preferential introductory terms/);
  });

  it("never presents the assessment as free", () => {
    expect(allCopy).not.toMatch(/free (initial )?assessment|complimentary assessment/i);
    expect(FOUNDING.paid).toMatch(/paid/);
  });
});

describe("/business-rearchitecture wiring", () => {
  it("is in the sitemap, the footer and llms.txt, and is classed as a service page", () => {
    // The sitemap module needs the server runtime, so check the route list in its source; the sitemap route's own test covers generation.
    expect(read("sitemap-data.ts")).toContain('"/business-rearchitecture"');
    expect(read("components/Footer.tsx")).toContain('href="/business-rearchitecture"');
    expect(read("llms.txt/route.ts")).toContain("/business-rearchitecture");
    expect(contentCategory("/business-rearchitecture")).toBe("Services");
  });

  it("is NOT in the primary navigation", () => {
    // Only the mobile section label mentions it; there is no navigation link (neither the desktop bar nor the menu lists it).
    expect(read("components/Navigation.tsx")).not.toMatch(/href:\s*["']\/business-rearchitecture/);
  });

  it("the call to action takes its destination from the resolver, not from a hard-coded link", () => {
    const page = read("business-rearchitecture/page.tsx");
    expect(page).toContain("currentBookingDestination()");
    expect(page).not.toMatch(/href=["']\/book\//);
    expect(page).toContain('export const dynamic = "force-dynamic"');
    expect(routeExists("/lets-talk")).toBe(true);
  });

  it("shows the secondary 'write first' link only when the primary call to action is the booking page", () => {
    const page = read("business-rearchitecture/page.tsx");
    expect(page).toMatch(/destination\.kind === "booking" && \(\s*<Link\s+href=\{MESSAGE_PATH\}/);
    expect(page.match(/href=\{MESSAGE_PATH\}/g)).toHaveLength(1);
  });

  it("each destination has its own accurate wording", () => {
    expect(CTA_COPY.booking.hero).toContain(String(INTRO_BOOKING_MINUTES));
    expect(CTA_COPY.booking.footnote).toMatch(/Booking asks/);
    // The message path must not promise a booking page, a time slot or a duration.
    expect(JSON.stringify(CTA_COPY.message)).not.toMatch(/\bbook|\d+\s?minutes|choose a time|schedule/i);
    expect(CTA_COPY.message.hero).toMatch(/message/);
    for (const c of [CTA_COPY.booking, CTA_COPY.message]) expect(c.footnote).toMatch(/paid engagement/);
  });

  it("labels the mobile navigation RE-ARCHITECTURE for this page only, and leaves the default alone", () => {
    const nav = read("components/Navigation.tsx");
    expect(nav).toMatch(/pathname === "\/business-rearchitecture" \|\| pathname\.startsWith\("\/business-rearchitecture\/"\)\) return "RE-ARCHITECTURE"/);
    expect(nav).toMatch(/return "RE-ARCHITECTURE";\s*return "HOME";\s*\};/);
    expect(nav.match(/RE-ARCHITECTURE/g)).toHaveLength(1);
  });

  it("is listed in the release manifest so a release cannot silently drop it", () => {
    const manifest = JSON.parse(fs.readFileSync(path.resolve(APP, "../scripts/production-routes.json"), "utf8")) as { requiredFiles: string[] };
    expect(manifest.requiredFiles).toContain("app/business-rearchitecture/page.tsx");
    expect(manifest.requiredFiles).toContain("app/business-rearchitecture/layout.tsx");
  });
});

describe("official MBA logo", () => {
  const ROOT = path.resolve(APP, "..");
  const LOGO = path.join(ROOT, "public/brand/mba-logo.png");
  // SHA-256 of the file Martin supplied on 2026-11-23. If this changes, someone edited the official artwork: do not "fix" the test.
  const SUPPLIED_SHA256 = "793ac59c375e741a1a3dd2958a61903440ea69b16aea18773a5dd16e9287828e";

  it("is stored byte-for-byte as supplied", () => {
    expect(crypto.createHash("sha256").update(fs.readFileSync(LOGO)).digest("hex")).toBe(SUPPLIED_SHA256);
  });

  it("is shown in the hero without recolouring, filtering or distortion", () => {
    const mark = read("components/business-rearchitecture/BrandMark.tsx");
    expect(read("business-rearchitecture/page.tsx")).toMatch(/<BrandMark \/>/);
    expect(mark).toContain("/brand/mba-logo.png");
    expect(mark).toMatch(/alt=\{LOGO_ALT\}/);
    expect(mark).toContain("object-cover"); // crops, never stretches
    expect(mark).not.toMatch(/filter|invert|grayscale|hue-rotate|brightness|contrast|mix-blend|opacity|object-fill|scale-|rotate-/);
  });

  it("is part of the release manifest, so a release cannot silently drop it", () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts/production-routes.json"), "utf8")) as { requiredFiles: string[] };
    expect(manifest.requiredFiles).toContain("public/brand/mba-logo.png");
  });
});

