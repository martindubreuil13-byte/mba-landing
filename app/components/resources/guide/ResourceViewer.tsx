import React from "react";
import Link from "next/link";
import type {
  Aside,
  BriefSection,
  CoverSection,
  ExerciseBlock,
  FieldItem,
  GuideContent,
  GuideSection,
  GuideStage,
  HeadingPart,
  InvitationSection,
  OutputBlock,
  StandardSection,
} from "@/app/lib/resources/guides/types";

/**
 * Renders a structured guide as semantic, server-rendered HTML: real headings,
 * paragraphs, lists and tables, no JavaScript needed to read any of it. The
 * online guide is read-only (exercise marks and lines are visual only); the
 * printable PDF is the working edition.
 */

const LABEL = "text-[11px] tracking-[0.2em] uppercase font-semibold text-[#6b1f1f]";

function Heading({ parts, id }: { parts: HeadingPart[]; id: string }) {
  return (
    <h2 id={id} className="text-3xl md:text-5xl font-light leading-tight tracking-tight text-[#1a1816] max-w-3xl">
      {parts.map((p, i) =>
        typeof p === "string" ? (
          <React.Fragment key={i}>{p}</React.Fragment>
        ) : (
          <strong key={i} className="font-semibold text-[#6b1f1f]">
            {p.em}
          </strong>
        )
      )}
    </h2>
  );
}

/** "page 8" becomes a link to that section; nothing else about the text changes. */
function Text({ children }: { children: string }) {
  const parts: React.ReactNode[] = [];
  const pattern = /\bpage (\d+)\b/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(children)) !== null) {
    if (match.index > last) parts.push(children.slice(last, match.index));
    parts.push(
      <a key={match.index} href={`#page-${match[1]}`} className="underline underline-offset-2 decoration-[#6b1f1f]/40 hover:decoration-[#6b1f1f]">
        {match[0]}
      </a>
    );
    last = match.index + match[0].length;
  }
  if (last < children.length) parts.push(children.slice(last));
  return <>{parts}</>;
}

function Mark({ shape }: { shape: "circle" | "square" }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-4 w-4 sm:h-5 sm:w-5 border border-[#1a1816]/40 bg-[#f5f1ed] ${shape === "circle" ? "rounded-full" : ""}`}
    />
  );
}

function Rule({ tall }: { tall?: boolean }) {
  return <span aria-hidden="true" className={`block border-b border-[#1a1816]/30 ${tall ? "h-10" : "h-7"} w-full`} />;
}

function Fields({ items }: { items: FieldItem[] }) {
  return (
    <dl className="space-y-5">
      {items.map((item) => (
        <div key={item.label} className="grid gap-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:gap-6 md:items-end">
          <dt className={`text-sm leading-snug text-[#1a1816] ${item.strong ? "font-semibold" : ""} ${item.italic ? "italic" : ""}`}>
            <Text>{item.label}</Text>
          </dt>
          <dd aria-hidden="true">
            <Rule tall={item.tall} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

function AsideBox({ aside }: { aside: Aside }) {
  return (
    <aside aria-label={aside.label} className="border border-[#1a1816]/20 bg-[#faf8f5] p-5 text-sm leading-relaxed text-[#1a1816]/85 self-start">
      <p className={`${LABEL} mb-3`}>{aside.label}</p>
      {aside.paragraphs?.map((p) => (
        <p key={p}>
          <Text>{p}</Text>
        </p>
      ))}
      {aside.schedule && (
        <ul className="space-y-3">
          {aside.schedule.map((s) => (
            <li key={s.time} className="grid grid-cols-[3.2rem_1fr] gap-2">
              <span className="font-semibold text-[#1a1816]">{s.time}</span>
              <span>{s.text}</span>
            </li>
          ))}
        </ul>
      )}
      {aside.grades && (
        <ul className="space-y-3">
          {aside.grades.map((g) => (
            <li key={g.text} className="grid grid-cols-[1.6rem_1fr] gap-2">
              <span className="font-semibold text-[#6b1f1f]">{g.grade}</span>
              <span>{g.text}</span>
            </li>
          ))}
        </ul>
      )}
      {aside.closing && <p className="mt-4 italic text-[#1a1816]/70">{aside.closing}</p>}
    </aside>
  );
}

function ExerciseBlocks({ blocks }: { blocks: ExerciseBlock[] }) {
  return (
    <div className="space-y-8">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "choice-grid":
            return (
              <ul key={i} className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {block.items.map((item) => (
                  <li key={item} className="flex items-center gap-3 border border-[#1a1816]/20 bg-[#f5f1ed] px-3 py-3 text-sm">
                    <Mark shape="circle" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            );
          case "fields":
            return <Fields key={i} items={block.items} />;
          case "choice-row":
            return (
              <div key={i} className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3">
                <p className="text-sm font-semibold text-[#1a1816] max-w-md">
                  <Text>{block.label}</Text>
                </p>
                <ul className="flex items-center gap-6">
                  {block.options.map((o) => (
                    <li key={o} className="flex items-center gap-2 text-sm">
                      <Mark shape="circle" />
                      {o}
                    </li>
                  ))}
                </ul>
              </div>
            );
          case "matrix":
            return (
              <div key={i} className="overflow-x-auto -mx-1 px-1">
                <table className="w-full min-w-[17rem] border-collapse text-xs sm:text-sm table-fixed sm:table-auto">
                  <caption className="sr-only">{block.caption}</caption>
                  <thead>
                    <tr className="align-bottom">
                      <th scope="col" className="text-left font-normal pb-3 pr-2 sm:pr-4 text-[9px] sm:text-[11px] tracking-[0.1em] sm:tracking-[0.15em] uppercase text-[#1a1816]/50 w-[36%] sm:w-[38%]">
                        {block.rowHeader}
                      </th>
                      {block.columns.map((c) => (
                        <th key={c.label} scope="col" className="pb-3 px-0.5 sm:px-2 text-center text-[8px] sm:text-[11px] leading-tight tracking-[0.04em] sm:tracking-[0.15em] uppercase font-semibold text-[#6b1f1f] align-bottom">
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row) => (
                      <tr key={row.label} className="border-t border-[#1a1816]/15">
                        <th scope="row" className={`text-left py-3 pr-2 sm:pr-4 align-middle ${row.strong ? "font-semibold" : "font-normal"}`}>
                          <Text>{row.label}</Text>
                        </th>
                        {block.columns.map((c) => (
                          <td key={c.label} className="py-3 px-0.5 sm:px-2 text-center align-middle">
                            {row.lineOnly && c.mark !== "line" ? null : c.mark === "line" ? <Rule /> : <Mark shape={c.mark} />}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "cards":
            return (
              <ul key={i} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {block.items.map((card) => (
                  <li key={card.title} className="border border-[#1a1816]/20 bg-[#f5f1ed] p-4">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <h3 className="text-sm font-semibold">{card.title}</h3>
                      <Mark shape="circle" />
                    </div>
                    <ul className="space-y-1 text-xs text-[#1a1816]/80">
                      {card.details.map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            );
          case "quadrants":
            return (
              <ol key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {block.items.map((q) => (
                  <li key={q.n} className="border border-[#1a1816]/20 bg-[#f5f1ed] p-4">
                    <p className="text-sm font-semibold mb-5">
                      <span className="text-[#6b1f1f] mr-3">{q.n}</span>
                      {q.label}
                    </p>
                    <Rule />
                    <Rule />
                  </li>
                ))}
              </ol>
            );
          case "note":
            return (
              <p key={i} className="text-xs italic text-[#1a1816]/60 -mt-4">
                {block.text}
              </p>
            );
        }
      })}
    </div>
  );
}

function OutputBox({ label, blocks }: { label: string; blocks: OutputBlock[] }) {
  return (
    <section aria-label={`Output: ${label}`} className="border border-[#6b1f1f] bg-[#f5f1ed] p-5 md:p-6 space-y-5">
      <h3 className="text-[11px] tracking-[0.2em] uppercase font-semibold">
        <span className="text-[#6b1f1f] mr-3">Output</span>
        {label}
      </h3>
      {blocks.map((b, i) => {
        if (b.type === "fields") return <Fields key={i} items={b.items} />;
        if (b.type === "sentence")
          return (
            <div key={i} className="space-y-4">
              <p className="text-sm italic text-[#1a1816]/75 leading-relaxed">{b.text}</p>
              {Array.from({ length: b.lines ?? 0 }).map((_, n) => (
                <Rule key={n} />
              ))}
            </div>
          );
        return (
          <ol key={i} className="space-y-4">
            {Array.from({ length: b.count }).map((_, n) => (
              <li key={n} className="grid grid-cols-[1.5rem_1fr] items-end gap-2" aria-label={`Line ${n + 1}`}>
                <span className="text-sm font-semibold text-[#6b1f1f]">{n + 1}</span>
                <Rule />
              </li>
            ))}
          </ol>
        );
      })}
    </section>
  );
}

const STAGES: GuideStage[] = ["you", "direction", "evidence"];

function StageStrip({ active, labels }: { active: GuideStage; labels: Record<GuideStage, string> }) {
  return (
    <ol aria-label="Stages of the guide" className="hidden sm:flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-[#1a1816]/40">
      {STAGES.map((s, i) => (
        <li key={s} aria-current={s === active ? "step" : undefined} className={s === active ? "font-semibold text-[#6b1f1f]" : ""}>
          {i > 0 && <span aria-hidden="true" className="mr-2">→</span>}
          {labels[s]}
        </li>
      ))}
    </ol>
  );
}

function PageHeader({ page, kicker, stage, labels }: { page: number; kicker: string; stage?: GuideStage; labels: Record<GuideStage, string> }) {
  return (
    <div className="flex items-center justify-between gap-4 mb-8 md:mb-12">
      <p className="text-[11px] tracking-[0.2em] uppercase text-[#1a1816]/50">
        <span className="font-semibold text-[#6b1f1f] mr-4">{String(page).padStart(2, "0")}</span>
        {kicker}
      </p>
      {stage && <StageStrip active={stage} labels={labels} />}
    </div>
  );
}

const PAGE = "scroll-mt-24 border border-[#1a1816]/10 bg-[#f5f1ed] p-6 md:p-12";

function Cover({ s }: { s: CoverSection }) {
  return (
    <section id={s.id} aria-labelledby={`${s.id}-title`} className={PAGE}>
      <PageHeader page={s.page} kicker={s.kicker} labels={{ you: "", direction: "", evidence: "" }} />
      <Heading id={`${s.id}-title`} parts={s.heading} />
      <p className="mt-8 text-lg md:text-xl text-[#1a1816]/85 max-w-xl leading-relaxed">{s.subtitle}</p>
      <p className="mt-5 text-[11px] tracking-[0.2em] uppercase text-[#1a1816]/55">{s.byline}</p>
      <p className="mt-2 text-xs text-[#1a1816]/50">{s.meta}</p>
      <p className="mt-10 text-lg text-[#1a1816] max-w-2xl leading-relaxed">{s.lead}</p>
      <p className="mt-5 text-sm md:text-base text-[#1a1816]/75 max-w-2xl leading-relaxed">{s.intro}</p>

      <ol className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
        {s.stages.map((st) => (
          <li key={st.title} className="border-t border-[#1a1816] pt-3">
            <p className={LABEL}>{st.label}</p>
            <h3 className="text-2xl font-light mt-2">{st.title}</h3>
            <p className="text-sm font-semibold mt-3">{st.subtitle}</p>
            <ul className="mt-2 space-y-1 text-xs text-[#1a1816]/75">
              {st.questions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-[#1a1816]/55">
              Output: <strong className="text-[#6b1f1f]">{st.output}</strong>
            </p>
          </li>
        ))}
      </ol>

      <p className="mt-10 text-sm italic text-[#1a1816]/65 max-w-2xl leading-relaxed">{s.closing}</p>

      <div className="mt-10 -mx-6 md:-mx-12 -mb-6 md:-mb-12 bg-[#e8dfd6] px-6 md:px-12 py-8">
        <h3 className={`${LABEL} mb-3`}>{s.beforeYouBegin.label}</h3>
        <p className="text-sm text-[#1a1816]">
          <Text>{s.beforeYouBegin.text}</Text>
        </p>
        <div aria-hidden="true" className="mt-6">
          <Rule />
        </div>
      </div>
    </section>
  );
}

function Standard({ s, labels, readStart }: { s: StandardSection; labels: Record<GuideStage, string>; readStart?: boolean }) {
  return (
    <section id={s.id} aria-labelledby={`${s.id}-title`} className={PAGE} {...(readStart ? { "data-read-start": "" } : {})}>
      <PageHeader page={s.page} kicker={s.kicker} stage={s.stage} labels={labels} />
      <Heading id={`${s.id}-title`} parts={s.heading} />
      <div className="mt-8 grid gap-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-4 text-base leading-relaxed text-[#1a1816]/85 max-w-xl">
          {s.body.map((p) => (
            <p key={p}>
              <Text>{p}</Text>
            </p>
          ))}
        </div>
        <AsideBox aside={s.aside} />
      </div>

      <div className="mt-10 -mx-6 md:-mx-12 bg-[#e8dfd6] px-6 md:px-12 py-8 space-y-8">
        <div>
          <h3 className={`${LABEL} mb-3`}>Exercise</h3>
          <p className="text-sm leading-relaxed text-[#1a1816]">
            <Text>{s.exercise.instruction}</Text>
          </p>
        </div>
        <ExerciseBlocks blocks={s.exercise.blocks} />
        {s.outputs.map((o) => (
          <OutputBox key={o.label} label={o.label} blocks={o.blocks} />
        ))}
      </div>
      {s.footnote && (
        <p className="mt-6 text-xs italic text-[#1a1816]/60">
          <Text>{s.footnote}</Text>
        </p>
      )}
    </section>
  );
}

function Brief({ s, labels }: { s: BriefSection; labels: Record<GuideStage, string> }) {
  return (
    <section id={s.id} aria-labelledby={`${s.id}-title`} className={PAGE}>
      <PageHeader page={s.page} kicker={s.kicker} stage={s.stage} labels={labels} />
      <Heading id={`${s.id}-title`} parts={s.heading} />
      <div className="mt-8 grid gap-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-4 text-base leading-relaxed text-[#1a1816]/85 max-w-xl">
          {s.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        <AsideBox aside={s.aside} />
      </div>

      <div className="mt-10 -mx-6 md:-mx-12 bg-[#e8dfd6] px-6 md:px-12 py-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-6">
          <h3 className={LABEL}>{s.direction.label}</h3>
          <p className="text-[11px] tracking-[0.15em] uppercase text-[#1a1816]/45">{s.direction.hint}</p>
        </div>
        <Fields items={s.direction.items} />
      </div>
      <div className="mt-8">
        <h3 className={`${LABEL} mb-6`}>{s.nextMove.label}</h3>
        <Fields items={s.nextMove.items} />
      </div>
      <p className="mt-6 text-xs italic text-[#1a1816]/60">{s.footnote}</p>
    </section>
  );
}

function Invitation({ s }: { s: InvitationSection }) {
  return (
    <section id={s.id} aria-labelledby={`${s.id}-title`} data-read-end className="scroll-mt-24 bg-[#1a1816] text-white p-6 md:p-12">
      <p className="text-[11px] tracking-[0.2em] uppercase text-white/60 mb-10 md:mb-16">
        <span className="font-semibold mr-4">{String(s.page).padStart(2, "0")}</span>
        {s.kicker}
      </p>
      <h2 id={`${s.id}-title`} className="text-3xl md:text-5xl font-light leading-tight max-w-3xl">
        {s.heading}
      </h2>
      <div className="mt-10 space-y-6 max-w-2xl text-base md:text-lg leading-relaxed text-white/85">
        {s.paragraphs.map((p) => (
          <p key={p.text} className={p.strong ? "font-semibold text-white" : ""}>
            {p.text}
          </p>
        ))}
      </div>
      <p className="mt-10 text-xl md:text-2xl font-light max-w-2xl leading-snug">{s.closing}</p>
      <div className="mt-12 border-t border-white/30 pt-6">
        <p className="font-semibold">
          <Link href={s.link.href} className="hover:underline underline-offset-4">
            {s.link.label}
          </Link>
        </p>
        <p className="mt-2 text-sm">
          <Link href={s.link.href} className="underline underline-offset-4 text-white/80 hover:text-white">
            {s.link.display}
          </Link>
        </p>
        <p className="mt-8 text-[11px] tracking-[0.2em] uppercase text-white/55">{s.signature}</p>
      </div>
    </section>
  );
}

export default function ResourceViewer({
  content,
  midCtaAfterSectionId,
  midCta,
}: {
  content: GuideContent;
  midCtaAfterSectionId: string;
  midCta: React.ReactNode;
}) {
  const render = (s: GuideSection, index: number) => {
    switch (s.kind) {
      case "cover":
        return <Cover key={s.id} s={s} />;
      case "standard":
        return <Standard key={s.id} s={s} labels={content.stageLabels} readStart={index === 1} />;
      case "brief":
        return <Brief key={s.id} s={s} labels={content.stageLabels} />;
      case "invitation":
        return <Invitation key={s.id} s={s} />;
    }
  };

  return (
    <div id="guide" className="scroll-mt-24 space-y-6 md:space-y-8">
      {content.sections.map((s, i) => (
        <React.Fragment key={s.id}>
          {render(s, i)}
          {s.id === midCtaAfterSectionId && midCta}
        </React.Fragment>
      ))}
    </div>
  );
}
