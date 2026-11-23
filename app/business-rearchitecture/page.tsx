import Link from "next/link";
import { Compass, Hourglass, Receipt, TrendingUp, type LucideIcon } from "lucide-react";
import Navigation from "@/app/components/Navigation";
import BrandMark from "@/app/components/business-rearchitecture/BrandMark";
import HeroSchematic from "@/app/components/business-rearchitecture/HeroSchematic";
import OpportunityExplorer from "@/app/components/business-rearchitecture/OpportunityExplorer";
import WholeBusiness from "@/app/components/business-rearchitecture/WholeBusiness";
import { MESSAGE_PATH } from "./booking-destination";
import { currentBookingDestination } from "./booking-destination.server";
import {
  AUDIENCE,
  CTA_COPY,
  ENGAGEMENT_POINTS,
  EXPLORE_FURTHER,
  FAQS,
  FOUNDING,
  MARKETS,
  OUTCOMES,
  PHASES,
  PHASES_NOTE,
} from "./content";
import "./rearchitecture.css";

const OUTCOME_ICONS: Record<(typeof OUTCOMES)[number]["id"], LucideIcon> = {
  profit: TrendingUp,
  time: Hourglass,
  cost: Receipt,
  compete: Compass,
};

const ring = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6b1f1f]";
const eyebrow = "text-xs font-semibold uppercase tracking-[.22em] text-[#6b1f1f]";
const h2Class = "mt-4 max-w-3xl text-3xl font-light leading-[1.12] tracking-tight [text-wrap:balance] md:text-5xl";
const section = "px-6 py-20 md:px-12 md:py-28 lg:px-16";

function PrimaryCta({ href, className = "" }: { href: string; className?: string }) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-14 items-center justify-center bg-[#6b1f1f] px-8 text-base font-semibold text-[#f5f1ed] transition-colors hover:bg-[#561919] motion-reduce:transition-none ${ring} ${className}`}
    >
      Let&rsquo;s explore your business
    </Link>
  );
}

// Which destination the call to action uses depends on the live Scheduling state, so this page is rendered per request, not at build time.
export const dynamic = "force-dynamic";

export default async function BusinessReArchitecturePage() {
  const destination = await currentBookingDestination();
  const copy = destination.kind === "booking" ? CTA_COPY.booking : CTA_COPY.message;
  const markets = `${MARKETS.slice(0, -1).join(", ")} and ${MARKETS[MARKETS.length - 1]}`;

  return (
    <>
      <Navigation />
      <div className="h-16" />

      <main className="w-full bg-[#f5f1ed] text-[#1a1816]">
        {/* 1. Hero */}
        <section aria-labelledby="hero-heading" className="px-6 pb-16 pt-10 md:px-12 md:pb-24 md:pt-16 lg:px-16">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-16">
            <div>
              <BrandMark />
              <p className={`mt-8 ${eyebrow}`}>Business Re-Architecture</p>
              <h1 id="hero-heading" className="mt-6 text-4xl font-light leading-[1.06] tracking-tight [text-wrap:balance] md:text-6xl">
                AI is changing business. <span className="text-[#6b1f1f]">What could it do for yours?</span>
              </h1>
              <div className="mt-8 max-w-xl space-y-5 text-lg leading-relaxed text-[#1a1816]/85">
                <p>
                  Your business has experience. Your people have knowledge. Today&rsquo;s technology opens possibilities that didn&rsquo;t exist when your
                  business was built.
                </p>
                <p>We help you discover those opportunities, design smarter ways of working, and bring the right changes to life.</p>
              </div>
              <div className="mt-10 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:gap-8">
                <PrimaryCta href={destination.href} />
                <a
                  href="#approach"
                  className={`inline-flex min-h-11 items-center justify-center text-base text-[#1a1816] underline decoration-[#1a1816]/40 underline-offset-[6px] transition-colors hover:text-[#6b1f1f] hover:decoration-[#6b1f1f] ${ring}`}
                >
                  See how we work
                </a>
              </div>
              <p className="mt-6 max-w-xl text-sm leading-relaxed text-[#1a1816]/70">
                {copy.hero} For {AUDIENCE.charAt(0).toLowerCase() + AUDIENCE.slice(1)}.
              </p>
            </div>
            <HeroSchematic />
          </div>
        </section>

        {/* Positioning statement */}
        <div className="border-y border-[#1a1816]/12 bg-white px-6 py-10 md:px-12 lg:px-16">
          <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-[auto_1fr] md:items-baseline md:gap-12">
            <p className="text-2xl font-light tracking-tight text-[#6b1f1f] md:text-3xl">We don&rsquo;t sell AI tools.</p>
            <p className="max-w-3xl text-lg leading-relaxed text-[#1a1816]/85">
              We help businesses discover where they could become more efficient, profitable, productive and competitive by rethinking how their people,
              processes, decisions, information and technology work together. AI is one possible enabler, not necessarily the answer.
            </p>
          </div>
        </div>

        {/* 2. Outcomes */}
        <section aria-labelledby="outcomes-heading" className={`bg-white ${section}`}>
          <div className="mx-auto max-w-6xl">
            <p className={eyebrow}>What we help you pursue</p>
            <h2 id="outcomes-heading" className={h2Class}>
              Four things most owners want more of.
            </h2>
            <ul className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {OUTCOMES.map((o) => {
                const Icon = OUTCOME_ICONS[o.id];
                return (
                  <li key={o.id} className="bra-rise border-t border-[#1a1816]/25 pt-6">
                    <Icon aria-hidden="true" size={34} strokeWidth={1.1} className="text-[#6b1f1f]" />
                    <h3 className="mt-6 text-xl font-medium">{o.title}</h3>
                    <p className="mt-2 text-base leading-relaxed text-[#1a1816]/80">{o.body}</p>
                  </li>
                );
              })}
            </ul>
            <p className="mt-12 max-w-2xl text-sm leading-relaxed text-[#1a1816]/65">
              These are outcomes we help you look for and work towards. We don&rsquo;t guarantee financial results: what is possible depends on your business.
            </p>
          </div>
        </section>

        {/* 3. Opportunity Explorer */}
        <section id="explorer" aria-labelledby="explorer-heading" className={`scroll-mt-16 ${section}`}>
          <div className="mx-auto max-w-6xl">
            <p className={eyebrow}>Opportunity Explorer</p>
            <h2 id="explorer-heading" className={h2Class}>
              Where could your business work better?
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#1a1816]/80">
              Choose a part of the business to see the kind of opportunity we look for, and notice how quickly it reaches the rest.
            </p>
            <div className="mt-12">
              <OpportunityExplorer />
            </div>
          </div>
        </section>

        {/* 4. Three-phase approach */}
        <section id="approach" aria-labelledby="approach-heading" className={`scroll-mt-16 bg-white ${section}`}>
          <div className="mx-auto max-w-6xl">
            <p className={eyebrow}>Our approach</p>
            <h2 id="approach-heading" className={h2Class}>
              Three phases. One decision at a time.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#1a1816]/80">
              We design the whole business. We implement progressively. After each phase, the next step is your decision.
            </p>

            <ol className="mt-16 grid lg:grid-cols-3">
              {PHASES.map((p, i) => (
                <li
                  key={p.number}
                  className="bra-rise relative border-l border-[#6b1f1f]/45 pb-14 pl-10 last:pb-0 lg:border-l-0 lg:border-t lg:pb-0 lg:pl-0 lg:pr-10 lg:pt-12 lg:last:pr-0"
                >
                  <span
                    aria-hidden="true"
                    className="absolute -left-5 top-0 grid h-10 w-10 place-items-center rounded-full border border-[#6b1f1f] bg-white text-xs font-semibold tracking-wider text-[#6b1f1f] lg:-top-5 lg:left-0"
                  >
                    {p.number}
                  </span>
                  {i < PHASES.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="absolute -left-[7px] bottom-5 h-3.5 w-3.5 rotate-45 border border-[#6b1f1f] bg-white lg:right-[13px] lg:bottom-auto lg:left-auto lg:-top-[7px]"
                    />
                  )}
                  <h3 className="text-sm font-semibold uppercase tracking-[.24em] text-[#6b1f1f]">
                    <span className="sr-only">Phase {p.number}: </span>
                    {p.name}
                  </h3>
                  <p className="mt-4 text-2xl font-light leading-snug tracking-tight">{p.tagline}</p>
                  <p className="mt-4 text-base leading-relaxed text-[#1a1816]/80">{p.body}</p>
                  <div className="mt-6 border-t border-[#1a1816]/20 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#1a1816]/60">Deliverable</p>
                    <p className="mt-1.5 text-base font-medium leading-snug">{p.deliverable}</p>
                  </div>
                </li>
              ))}
            </ol>

            <p className="mt-14 flex max-w-3xl gap-4 border-l-2 border-[#6b1f1f] pl-5 text-lg leading-relaxed text-[#1a1816]">{PHASES_NOTE}</p>
          </div>
        </section>

        {/* 5. Why the whole business matters */}
        <section id="whole-business" aria-labelledby="whole-heading" className={`scroll-mt-16 ${section}`}>
          <div className="mx-auto max-w-6xl">
            <p className={eyebrow}>Why the whole business matters</p>
            <h2 id="whole-heading" className={h2Class}>
              Improving one department shouldn&rsquo;t create problems somewhere else.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#1a1816]/80">
              Sales, procurement, inventory, operations, logistics, finance and management depend on each other, and on the information that flows between
              them. We design the business as a connected system, then implement improvements progressively.
            </p>
            <div className="mt-12">
              <WholeBusiness />
            </div>
          </div>
        </section>

        {/* 6. How engagements work */}
        <section id="engagements" aria-labelledby="engagements-heading" className={`scroll-mt-16 bg-white ${section}`}>
          <div className="mx-auto max-w-6xl">
            <p className={eyebrow}>How engagements work</p>
            <h2 id="engagements-heading" className={h2Class}>
              Simple, and scoped one step at a time.
            </h2>
            <ul className="mt-14 grid gap-x-12 gap-y-10 md:grid-cols-2">
              {ENGAGEMENT_POINTS.map((e) => (
                <li key={e.title} className="bra-rise border-t border-[#1a1816]/25 pt-5">
                  <h3 className="text-xl font-medium">{e.title}</h3>
                  <p className="mt-2 text-base leading-relaxed text-[#1a1816]/80">{e.body}</p>
                </li>
              ))}
            </ul>
            <p className="mt-12 max-w-2xl text-base leading-relaxed text-[#1a1816]/75">
              We don&rsquo;t publish fixed prices. After an introductory conversation, we can tell you whether we can help and how an engagement would be scoped.
            </p>
          </div>
        </section>

        {/* 7. Founding Client Program */}
        <section id="founding-clients" aria-labelledby="founding-heading" className="scroll-mt-16 bg-[#6b1f1f] px-6 py-20 text-[#f5f1ed] md:px-12 md:py-28 lg:px-16">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:items-center lg:gap-20">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#f5f1ed]/75">Founding Client Program</p>
              <h2 id="founding-heading" className="mt-4 max-w-3xl text-3xl font-light leading-[1.12] tracking-tight [text-wrap:balance] md:text-5xl">
                {FOUNDING.heading}
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#f5f1ed]/90">{FOUNDING.body}</p>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[#f5f1ed]/90">{FOUNDING.terms}</p>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#f5f1ed]/85">{FOUNDING.noCommitment}</p>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#f5f1ed]/85">{FOUNDING.paid}</p>
              <Link
                href={destination.href}
                className="mt-8 inline-flex min-h-12 items-center border border-[#f5f1ed] px-7 text-base font-semibold text-[#f5f1ed] transition-colors hover:bg-[#f5f1ed] hover:text-[#6b1f1f] motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f5f1ed]"
              >
                Ask about founding terms
              </Link>
            </div>
            <div aria-hidden="true" className="hidden lg:block">
              <svg viewBox="0 0 220 220" className="h-auto w-full max-w-[260px]" fill="none" stroke="#f5f1ed">
                <circle cx={110} cy={110} r={100} strokeOpacity={0.25} strokeDasharray="2 6" />
                {[0, 1, 2].map((i) => {
                  const a = -Math.PI / 2 + (2 * Math.PI * i) / 3;
                  const x = Math.round((110 + 68 * Math.cos(a)) * 10) / 10;
                  const y = Math.round((110 + 68 * Math.sin(a)) * 10) / 10;
                  return <circle key={i} cx={x} cy={y} r={26} strokeWidth={1.4} />;
                })}
                <path d="M110 42L51.1 144M110 42L168.9 144M51.1 144H168.9" strokeOpacity={0.35} />
                <circle cx={110} cy={110} r={4} fill="#f5f1ed" stroke="none" />
              </svg>
            </div>
          </div>
        </section>

        {/* 8. FAQ */}
        <section id="faq" aria-labelledby="faq-heading" className={`scroll-mt-16 ${section}`}>
          <div className="mx-auto max-w-4xl">
            <p className={eyebrow}>Questions</p>
            <h2 id="faq-heading" className={h2Class}>
              What business owners ask us.
            </h2>
            <div className="bra-faq mt-12 border-t border-[#1a1816]/25">
              {FAQS.map((f) => (
                <details key={f.q} className="group border-b border-[#1a1816]/25">
                  <summary className={`flex min-h-16 cursor-pointer items-center justify-between gap-6 py-4 text-left text-lg font-medium leading-snug ${ring}`}>
                    <span>{f.q}</span>
                    <svg aria-hidden="true" viewBox="0 0 16 16" width={16} height={16} className="shrink-0 text-[#6b1f1f]" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path d="M2 8H14" />
                      <path d="M8 2V14" className="bra-faq-plus-v" />
                    </svg>
                  </summary>
                  <p className="max-w-3xl pb-6 text-base leading-relaxed text-[#1a1816]/85">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 9. Explore further */}
        <section id="explore-further" aria-labelledby="explore-heading" className={`scroll-mt-16 bg-white ${section}`}>
          <div className="mx-auto max-w-6xl">
            <p className={eyebrow}>Explore further</p>
            <h2 id="explore-heading" className={h2Class}>
              The thinking behind the approach.
            </h2>
            <ul className="mt-12 grid gap-8 md:grid-cols-3">
              {EXPLORE_FURTHER.map((l) => (
                <li key={l.href} className="border-t border-[#1a1816]/25 pt-5">
                  <Link href={l.href} className={`group block ${ring}`}>
                    <span className="text-xs font-semibold uppercase tracking-[.2em] text-[#1a1816]/60">{l.kicker}</span>
                    <span className="mt-2 block text-xl font-medium leading-snug group-hover:text-[#6b1f1f]">{l.title}</span>
                    <span className="mt-2 block text-base leading-relaxed text-[#1a1816]/75">{l.blurb}</span>
                    <span className="mt-4 inline-block text-sm text-[#6b1f1f] underline underline-offset-4">Read more</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 10. Final invitation */}
        <section id="start" aria-labelledby="start-heading" className={`scroll-mt-16 ${section}`}>
          <div className="mx-auto max-w-6xl">
            <h2 id="start-heading" className="max-w-3xl text-3xl font-light leading-[1.12] tracking-tight [text-wrap:balance] md:text-5xl">
              Let&rsquo;s explore your business.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#1a1816]/80">
              A conversation about how your business works today and what you&rsquo;d like to improve. We&rsquo;ll tell you honestly whether we think we can
              help.
            </p>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#1a1816]/75">
              Our first engagements are focused on businesses in {markets}. We work with you remotely, with on-site visits arranged when they are useful.
            </p>
            <div className="mt-10 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:gap-8">
              <PrimaryCta href={destination.href} />
              {destination.kind === "booking" && (
                <Link
                  href={MESSAGE_PATH}
                  className={`inline-flex min-h-11 items-center justify-center text-base text-[#1a1816] underline decoration-[#1a1816]/40 underline-offset-[6px] transition-colors hover:text-[#6b1f1f] hover:decoration-[#6b1f1f] ${ring}`}
                >
                  Prefer to write first? Send a message
                </Link>
              )}
            </div>
            <p className="mt-6 max-w-xl text-sm leading-relaxed text-[#1a1816]/65">{copy.footnote}</p>
          </div>
        </section>
      </main>
    </>
  );
}
