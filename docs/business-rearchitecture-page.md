# /business-rearchitecture page (V1)

Landing page for the Business Re-Architecture consulting offer aimed at established manufacturing and retail businesses (roughly 25–150 employees), prospected first in Vietnam, the Philippines and Cambodia. Built on branch `feat/business-rearchitecture`; not deployed.

## Where things live

| What | Where |
|---|---|
| Route, layout (metadata, JSON-LD) | `app/business-rearchitecture/` |
| All copy and data (single source for the page, FAQ markup and tests) | `app/business-rearchitecture/content.ts` |
| Page-scoped CSS (`bra-` prefix, reduced-motion safe) | `app/business-rearchitecture/rearchitecture.css` |
| Hero figure (server component, no JS) | `app/components/business-rearchitecture/HeroSchematic.tsx` |
| Opportunity Explorer (client, ARIA tabs) | `app/components/business-rearchitecture/OpportunityExplorer.tsx` |
| Isolated vs integrated schematic (client) | `app/components/business-rearchitecture/WholeBusiness.tsx` |
| Booking destination (pure decision, and the server wiring) | `app/business-rearchitecture/booking-destination.ts`, `booking-destination.server.ts` |
| Official logo (as supplied, unmodified) and its frame | `public/brand/mba-logo.png`, `app/components/business-rearchitecture/BrandMark.tsx` |
| Tests | `app/business-rearchitecture/content.test.ts`, `booking-destination.test.ts` |

Wiring outside the route: footer link (`Footer.tsx`), `sitemap-data.ts`, `llms.txt/route.ts`, release manifest (`scripts/production-routes.json`), analytics grouping as "Services" (`lib/intelligence/content.ts`), and a `rearchitecture` booking origin (`lib/booking.ts`). The page is deliberately **not** in `Navigation.tsx`.

## Booking and contact

The call to action is decided per request (the page is `force-dynamic`) from the facts the booking page itself uses:

1. Scheduling operations and public intake are both on (`schedulingIntakeEnabled()`), **and**
2. the introductory meeting type (`complementary-session`) is active and public (`getScheduling().publicMeetingType`, read-only).

- Both true: the CTA goes to `/book/complementary-session?source=rearchitecture`, the copy says "about 45 minutes, online", and a secondary "Prefer to write first?" link to `/lets-talk` is shown.
- Anything else (flags off, meeting type missing, inactive or invitation-only, or the lookup throws): the CTA goes to `/lets-talk`, the copy says to send a message, and the secondary link is hidden (no duplicate).
- The answer is remembered for 60 seconds (10 seconds after a failed lookup); the flags are checked on every request. The page never creates or changes a meeting type or a setting.
- Local development: the seed (`app/lib/scheduling/seed.ts`) now includes `complementary-session`. The seed is only used when `.prototype-data/scheduling.json` does not exist, so an existing local file keeps the old data (and the page correctly falls back to `/lets-talk`). Delete that file to reseed.
- Limitation: this proves the booking page will open. It does not prove there are free time slots or that Google/Zoom are healthy; a prospect who reaches the booking page in that state sees the booking page's own messages.

## Decisions for Martin

1. **Overlap with Program 08.** `/work/business-re-architecture` already exists as a generic, proposal-priced offer for "an established company or executive team". This page is a sharper, phased offer for manufacturing and retail SMEs under the same name. The two are not cross-linked; decide whether to link, rename or merge so a visitor does not meet two different descriptions.
2. **Logo (done).** The official logo (1254 x 1254 PNG, opaque maroon background, supplied 2026-11-23) is stored unchanged at `public/brand/mba-logo.png`; a test pins its SHA-256. It sits at the top of the hero. `BrandMark.tsx` shows only the band of the square that holds the artwork (rows 280 to 930) by CSS cropping, so the artwork is never recoloured, stretched or moved, and `next/image` serves a resized WebP (about 10 KB) instead of the 1.26 MB original. The navigation keeps its existing "MBA" text mark. No vector (SVG) version was supplied; one would be sharper at large sizes and could also serve as a favicon or share image, but none is needed for this release.
3. **"Introductory conversation".** The CTA reuses the complimentary 45-minute session. The copy says it is not the assessment, and that the assessment is paid. Confirm that is the intended first step for these prospects.
4. **Structured data.** `Service` lists Vietnam, Cambodia and the Philippines as `areaServed`, and `audience` as the SME profile. Confirm that claim is wanted. The visible wording says only that first engagements are focused on these markets and that work is remote with on-site visits as useful; it makes no claim of offices, local staff or local partners (guarded by a test). `FAQPage` mirrors the visible Q&A; Google shows FAQ rich results only for a few authoritative sites, so none should be expected.
5. **Share image.** The page uses the site-wide Open Graph image. A page-specific image is optional.
6. **Founding Client Program.** Copy states "three" places and "preferential introductory terms". No terms are defined anywhere; make sure they exist before prospects ask.

## Content gaps (recommended future articles; none are linked)

Explore Further links only to existing pages. There is currently nothing on:

- AI adoption versus business transformation, written for owners of established manufacturing or retail businesses.
- Business model design and innovation for established SMEs.
- Rethinking operations across functions (the "improving one department shouldn't hurt another" idea as an article).
- A manufacturing or retail example (only once a real, approved, anonymized business case exists; do not invent one).

## Prospecting material

PDF pamphlets and emails should link to `https://modernbusinessarchitect.com/business-rearchitecture`. Add `utm_source` / `utm_medium` / `utm_campaign` for tracking; Website Intelligence reads them (see `lib/intelligence/classify.ts`).
