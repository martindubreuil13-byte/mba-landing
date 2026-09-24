"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";
import ResourceCover from "@/app/components/resources/ResourceCover";
import ResourceRequestForm from "@/app/components/resources/ResourceRequestForm";

type Props = {
  slug: string;
  title: string;
  shortDescription: string;
  longDescription: string | null;
  resourceType: string;
  audience: string | null;
  coverUrl: string;
};

// Descriptions are plain text. The one piece of markup supported is an
// internal link, written [text](/path), so a resource can point to the
// thinking behind it. Only site-relative paths become links.
function renderParagraph(text: string) {
  const parts: React.ReactNode[] = [];
  const pattern = /\[([^\]]+)\]\((\/(?!\/)[^)\s]*)\)/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(
      <Link
        key={match.index}
        href={match[2]}
        className="text-[#6b1f1f] border-b border-[#6b1f1f] hover:text-[#6b1f1f]/80 hover:border-[#6b1f1f]/80 transition-colors"
      >
        {match[1]}
      </Link>
    );
    last = match.index + match[0].length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export default function ResourceDetailView({
  slug,
  title,
  shortDescription,
  longDescription,
  resourceType,
  audience,
  coverUrl,
}: Props) {
  const paragraphs = (longDescription ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <>
      <Navigation />
      <div className="h-16" />
      <main data-progressive-reveal className="w-full bg-white text-[#1a1816]">
        <article className="w-full px-6 md:px-12 lg:px-16 py-40 md:py-56">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-12 md:gap-16"
            >
              <div className="w-full max-w-[280px]">
                <ResourceCover coverUrl={coverUrl} title={title} />
              </div>

              <div className="space-y-8">
                <div>
                  <div className="flex items-baseline gap-3 mb-6">
                    <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold">
                      {resourceType}
                    </p>
                    {audience && (
                      <p className="text-xs tracking-widest uppercase text-[#1a1816]/40">
                        {audience}
                      </p>
                    )}
                  </div>
                  <h1 className="text-4xl md:text-5xl font-light leading-tight tracking-tight mb-6">
                    {title}
                  </h1>
                  <p className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1816]/80">
                    {shortDescription}
                  </p>
                </div>

                {paragraphs.length > 0 && (
                  <div className="space-y-5 text-base md:text-lg leading-relaxed text-[#1a1816]/80 max-w-2xl">
                    {paragraphs.map((p, i) => (
                      <p key={i}>{renderParagraph(p)}</p>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </article>

        {/* FORM */}
        <section className="w-full px-6 md:px-12 lg:px-16 py-24 md:py-32 border-t border-[#1a1816]/8 bg-[#f5f1ed]">
          <div className="max-w-xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="border border-[#1a1816]/10 bg-white p-8 md:p-12 space-y-8"
            >
              <div>
                <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-3">
                  Get the free resource
                </p>
                <h2 className="text-2xl md:text-3xl font-light text-[#1a1816]">{title}</h2>
              </div>
              <ResourceRequestForm resourceSlug={slug} resourceTitle={title} />
            </motion.div>
          </div>
        </section>

        <div className="h-24 md:h-32" />
      </main>
    </>
  );
}
