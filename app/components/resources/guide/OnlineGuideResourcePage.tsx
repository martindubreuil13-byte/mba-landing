import React from "react";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";
import ResourceCover from "@/app/components/resources/ResourceCover";
import type { ConsentCopy } from "@/app/lib/resources/consent-copy";
import type { ResourceConfig } from "@/app/lib/resources/config";
import type { GuideContent } from "@/app/lib/resources/guides/types";
import PrintableGuideCTA from "./PrintableGuideCTA";
import ResourceEventTracker from "./ResourceEventTracker";
import ResourceGuideProvider from "./ResourceGuideProvider";
import ResourceViewer from "./ResourceViewer";

type Props = {
  slug: string;
  title: string;
  shortDescription: string;
  longDescription: string | null;
  resourceType: string;
  audience: string | null;
  coverUrl: string;
  config: ResourceConfig;
  content: GuideContent;
  consent: ConsentCopy;
};

const LINK = "text-[#6b1f1f] border-b border-[#6b1f1f] hover:text-[#6b1f1f]/80 hover:border-[#6b1f1f]/80 transition-colors";

// Descriptions are plain text; [text](/path) is the one supported piece of markup.
function inline(text: string) {
  const parts: React.ReactNode[] = [];
  const pattern = /\[([^\]]+)\]\((\/(?!\/)[^)\s]*)\)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(
      <Link key={match.index} href={match[2]} className={LINK}>
        {match[1]}
      </Link>
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

/** Paragraphs, with consecutive "- item" lines rendered as a real list. */
function Description({ text }: { text: string }) {
  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="space-y-5 text-base md:text-lg leading-relaxed text-[#1a1816]/80 max-w-2xl">
      {blocks.map((block, i) => {
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
        const intro: string[] = [];
        const items: string[] = [];
        for (const line of lines) {
          if (line.startsWith("- ")) items.push(line.slice(2));
          else if (items.length === 0) intro.push(line);
          else items[items.length - 1] += ` ${line}`;
        }
        return (
          <React.Fragment key={i}>
            {intro.length > 0 && <p>{inline(intro.join(" "))}</p>}
            {items.length > 0 && (
              <ul className="list-disc pl-5 space-y-2 marker:text-[#6b1f1f]">
                {items.map((item) => (
                  <li key={item}>{inline(item)}</li>
                ))}
              </ul>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/**
 * Resource page with the complete guide readable online and the printable PDF
 * offered as the keep-and-complete edition. The whole page, guide included, is
 * server-rendered; only the CTAs, form and anonymous tracker are client code.
 */
export default function OnlineGuideResourcePage(props: Props) {
  const { slug, title, config, content, consent } = props;
  const consentProps = {
    id: consent.id,
    buttonLabel: consent.buttonLabel.toUpperCase(),
    communityNote: consent.communityNote,
    disclosure: consent.disclosure,
    privacyLinkText: consent.privacyLinkText,
  };

  return (
    <>
      <Navigation />
      <div className="h-16" />
      <main className="w-full bg-white text-[#1a1816]">
        <ResourceGuideProvider slug={slug} title={title} consent={consentProps}>
          <ResourceEventTracker slug={slug} />

          <article className="w-full px-6 md:px-12 lg:px-16 pt-24 md:pt-32 pb-16 md:pb-24">
            <div className="max-w-5xl mx-auto">
              <header className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-10 md:gap-16">
                <div className="w-full max-w-[220px] md:max-w-[280px]">
                  <ResourceCover coverUrl={props.coverUrl} title={title} />
                </div>
                <div className="space-y-8">
                  <div>
                    <div className="flex items-baseline gap-3 mb-6">
                      <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold">{props.resourceType}</p>
                      {props.audience && <p className="text-xs tracking-widest uppercase text-[#1a1816]/40">{props.audience}</p>}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-light leading-tight tracking-tight mb-6">{title}</h1>
                    <p className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1816]/80">{props.shortDescription}</p>
                  </div>
                  <PrintableGuideCTA
                    location="top"
                    body={config.cta.top.body}
                    button={config.cta.top.button}
                    secondary={{ label: "Read online", href: "#guide" }}
                  />
                  {props.longDescription && <Description text={props.longDescription} />}
                </div>
              </header>
            </div>
          </article>

          <section aria-label={`${title}: the complete guide`} className="w-full px-4 md:px-12 lg:px-16 pb-16 md:pb-24 bg-white">
            <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
              <ResourceViewer
                content={content}
                midCtaAfterSectionId={config.midCtaAfterSectionId}
                midCta={<PrintableGuideCTA location="mid-guide" body={config.cta["mid-guide"].body} button={config.cta["mid-guide"].button} />}
              />
              <PrintableGuideCTA
                location="end"
                heading={config.cta.end.heading}
                body={config.cta.end.body}
                button={config.cta.end.button}
              />
            </div>
          </section>
        </ResourceGuideProvider>
      </main>
    </>
  );
}
