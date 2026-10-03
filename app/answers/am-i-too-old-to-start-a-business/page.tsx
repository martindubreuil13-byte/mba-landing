/* eslint-disable react/no-unescaped-entities */
"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";
import { DIRECT_ANSWER, INTRO, SECTIONS, CTA_HEADING } from "./content";

const H2_STYLE = { fontSize: "1.5rem", fontWeight: "300", marginTop: "3rem", marginBottom: "1.75rem", lineHeight: "1.4", color: "#1a1816" } as const;
const LINK_CLASS = "text-[#6b1f1f] border-b border-[#6b1f1f] hover:text-[#6b1f1f]/80 hover:border-[#6b1f1f]/80 transition-colors";

// Renders the content module's inline markup: **bold**, *italic*, [text](href).
function renderInline(text: string, keyPrefix = "i"): React.ReactNode[] {
  const pattern = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)]+)\)/g;
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let n = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const key = `${keyPrefix}-${n++}`;
    if (match[1] !== undefined) nodes.push(<strong key={key}>{renderInline(match[1], key)}</strong>);
    else if (match[2] !== undefined) nodes.push(<em key={key}>{match[2]}</em>);
    else nodes.push(<Link key={key} href={match[4]} className={LINK_CLASS}>{match[3]}</Link>);
    last = pattern.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

// Renders blocks separated by blank lines: paragraphs, "- " bullets, "1. " numbered lists and "> " quotes.
function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n{2,}/).map((block, i) => {
        const lines = block.split("\n");
        if (lines.every((l) => l.startsWith("- "))) {
          return (
            <ul key={i} style={{ marginBottom: "1.75rem", paddingLeft: "1.5rem", listStyleType: "disc" }}>
              {lines.map((l, j) => <li key={j} style={{ marginBottom: "0.35rem" }}>{renderInline(l.slice(2), `u${i}-${j}`)}</li>)}
            </ul>
          );
        }
        if (lines.every((l) => /^\d+\. /.test(l))) {
          return (
            <ol key={i} style={{ marginBottom: "1.75rem", paddingLeft: "1.5rem", listStyleType: "decimal" }}>
              {lines.map((l, j) => <li key={j} style={{ marginBottom: "0.35rem" }}>{renderInline(l.replace(/^\d+\. /, ""), `o${i}-${j}`)}</li>)}
            </ol>
          );
        }
        if (block.startsWith("### ")) {
          return <h3 key={i} style={{ fontSize: "1.25rem", fontWeight: "600", marginTop: "2rem", marginBottom: "0.75rem", lineHeight: "1.4", color: "#1a1816" }}>{renderInline(block.slice(4), `h${i}`)}</h3>;
        }
        if (block.startsWith("> ")) {
          return (
            <blockquote key={i} className="border-l-2 border-[#6b1f1f]/40 pl-5 md:pl-6" style={{ marginBottom: "1.75rem", fontStyle: "italic" }}>
              {renderInline(block.replace(/^> /gm, ""), `q${i}`)}
            </blockquote>
          );
        }
        return (
          <p key={i} style={{ marginBottom: "1.75rem" }}>
            {lines.map((l, j) => <React.Fragment key={j}>{j > 0 && <br />}{renderInline(l, `p${i}-${j}`)}</React.Fragment>)}
          </p>
        );
      })}
    </>
  );
}

export default function AnswerPage() {
  const [copyFeedback, setCopyFeedback] = React.useState(false);
  const answerUrl = "https://modernbusinessarchitect.com/answers/am-i-too-old-to-start-a-business";

  const handleShare = (platform: string) => {
    const encodedUrl = encodeURIComponent(answerUrl);

    const urls: Record<string, string> = {
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      copy: answerUrl,
    };

    if (platform === "copy") {
      navigator.clipboard.writeText(answerUrl);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } else if (urls[platform]) {
      window.open(urls[platform], "_blank", "width=600,height=400");
    }
  };

  return (
    <>
      <Navigation />
      <div className="h-16" />
      <main data-progressive-reveal className="w-full bg-white text-[#1a1816]">
        <article className="w-full px-6 md:px-12 lg:px-16 py-40 md:py-56">
          <div className="max-w-3xl mx-auto">
            <div className="space-y-8">
              <div>
                <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-6">Answer</p>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight tracking-tight mb-8">
                  Am I Too Old to Start a Business?
                </h1>
                <p id="direct-answer" className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1816]/80 border-l-2 border-[#6b1f1f] pl-5 md:pl-6">
                  {DIRECT_ANSWER}
                </p>
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="border-t border-[#1a1816]/8 pt-8 flex flex-col md:flex-row md:items-center md:gap-12"
              >
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-[#1a1816]/75">Martin Dubreuil</p>
                  <p className="text-sm text-[#1a1816]/65">October 3, 2026</p>
                </div>
              </motion.div>
            </div>
          </div>
        </article>

        <section className="w-full px-6 md:px-12 lg:px-16 py-24 md:py-32">
          <div className="max-w-3xl mx-auto">
            <div
              className="prose prose-lg max-w-none"
              style={{
                fontSize: "1.125rem",
                lineHeight: "1.8",
                color: "#1a1816",
              }}
            >

<Paragraphs text={INTRO} />

{SECTIONS.map((section) => (
  <section key={section.heading}>
    <h2 style={H2_STYLE}>{section.heading}</h2>
    <Paragraphs text={section.body} />
  </section>
))}


            </div>
          </div>
        </section>

        <section className="w-full px-6 md:px-12 lg:px-16 py-24 md:py-32 border-t border-[#1a1816]/8">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="space-y-8"
            >
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-light leading-snug text-[#1a1816]">
                {CTA_HEADING}
              </h2>
              <Link href="/lets-talk" className="inline-block">
                <motion.span
                  className="text-sm font-semibold tracking-widest uppercase text-[#6b1f1f] border-b-2 border-[#6b1f1f] pb-1 transition-all hover:border-[#6b1f1f]/60"
                  whileHover={{ x: 2 }}
                >
                  LET'S TALK ABOUT YOUR IDEA →
                </motion.span>
              </Link>
            </motion.div>
          </div>
        </section>

        <section className="w-full px-6 md:px-12 lg:px-16 py-24 md:py-32 border-t border-[#1a1816]/8">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="space-y-12"
            >
              <div className="space-y-4">
                <p className="text-sm text-[#1a1816]/60 tracking-widest uppercase">Share</p>
                <div className="flex flex-wrap gap-6">
                  <button
                    onClick={() => handleShare("linkedin")}
                    className="text-sm font-semibold tracking-widest uppercase text-[#6b1f1f] border-b-2 border-[#6b1f1f] pb-1 transition-all hover:border-[#6b1f1f]/60"
                  >
                    LinkedIn
                  </button>
                  <button
                    onClick={() => handleShare("facebook")}
                    className="text-sm font-semibold tracking-widest uppercase text-[#6b1f1f] border-b-2 border-[#6b1f1f] pb-1 transition-all hover:border-[#6b1f1f]/60"
                  >
                    Facebook
                  </button>
                  <button
                    onClick={() => handleShare("copy")}
                    className="text-sm font-semibold tracking-widest uppercase text-[#6b1f1f] border-b-2 border-[#6b1f1f] pb-1 transition-all hover:border-[#6b1f1f]/60"
                  >
                    {copyFeedback ? "Copied" : "Copy Link"}
                  </button>
                </div>
              </div>

              <div className="pt-8 border-t border-[#1a1816]/8 space-y-8">
                <p className="text-sm text-[#1a1816]/60 tracking-widest uppercase">Related</p>
                <div className="space-y-6">
                  {[
                    {
                      href: "/answers/what-kind-of-business-can-i-start-with-the-skills-i-already-have",
                      title: "What Kind of Business Can I Start With the Skills I Already Have?",
                      summary: "Choosing a customer, a problem and the simplest way to deliver a result before choosing a business model.",
                    },
                    {
                      href: "/answers/how-do-i-turn-my-years-of-experience-into-a-business",
                      title: "How Do I Turn My Years of Experience Into a Business?",
                      summary: "Turning professional experience into a specific, valuable offer a customer will pay for.",
                    },
                    {
                      href: "/answers/what-is-business-architecture",
                      title: "What Is Business Architecture?",
                      summary: "How a business connects customer, offer, pricing, economics and execution into one coherent system.",
                    },
                  ].map((item, i) => (
                    <Link key={item.href} href={item.href} className="group block">
                      <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 0.7, delay: i * 0.1 }}
                        viewport={{ once: true }}
                        className="space-y-2"
                      >
                        <h3 className="text-lg font-light text-[#1a1816] group-hover:text-[#6b1f1f] transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-sm text-[#1a1816]/65 leading-relaxed">{item.summary}</p>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="pt-8 border-t border-[#1a1816]/8 space-y-4">
                <Link href="/work" className="block">
                  <motion.span
                    className="text-sm font-semibold tracking-widest uppercase text-[#1a1816]/60 border-b-2 border-[#1a1816]/30 pb-1 transition-all hover:text-[#1a1816] hover:border-[#1a1816]/60"
                    whileHover={{ x: 2 }}
                  >
                    Explore business architecture work →
                  </motion.span>
                </Link>
                <Link href="/work-with-me" className="block">
                  <motion.span
                    className="text-sm font-semibold tracking-widest uppercase text-[#1a1816]/60 border-b-2 border-[#1a1816]/30 pb-1 transition-all hover:text-[#1a1816] hover:border-[#1a1816]/60"
                    whileHover={{ x: 2 }}
                  >
                    Explore ways to work together →
                  </motion.span>
                </Link>
                <Link href="/martin" className="block">
                  <motion.span
                    className="text-sm font-semibold tracking-widest uppercase text-[#1a1816]/60 border-b-2 border-[#1a1816]/30 pb-1 transition-all hover:text-[#1a1816] hover:border-[#1a1816]/60"
                    whileHover={{ x: 2 }}
                  >
                    About Martin Dubreuil →
                  </motion.span>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <div className="h-24 md:h-32" />
      </main>
    </>
  );
}
