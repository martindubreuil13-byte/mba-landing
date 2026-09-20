"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import ResourceCover from "./ResourceCover";

export type ResourceListItem = {
  slug: string;
  title: string;
  short_description: string;
  resource_type: string;
  audience: string | null;
  coverUrl: string;
};

export default function ResourcesIndexList({ resources }: { resources: ResourceListItem[] }) {
  if (resources.length === 0) {
    return (
      <p className="text-[#1a1816]/60 max-w-xl">
        The first resource is on its way. Check back shortly.
      </p>
    );
  }

  return (
    <div className="max-w-4xl">
      {resources.map((resource) => (
        <motion.div
          key={resource.slug}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true, margin: "-50px" }}
          className="mb-20 md:mb-28"
        >
          <Link href={`/resources/${resource.slug}`} className="group block">
            <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
              <div className="w-40 md:w-48 shrink-0">
                <ResourceCover coverUrl={resource.coverUrl} title={resource.title} />
              </div>
              <div className="space-y-4 flex-1">
                <div className="flex items-baseline gap-3">
                  <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold">
                    {resource.resource_type}
                  </p>
                  {resource.audience && (
                    <p className="text-xs tracking-widest uppercase text-[#1a1816]/40">
                      {resource.audience}
                    </p>
                  )}
                </div>
                <h2 className="text-2xl md:text-3xl font-light leading-tight text-[#1a1816] group-hover:text-[#6b1f1f] transition-colors">
                  {resource.title}
                </h2>
                <p className="text-base md:text-lg leading-relaxed text-[#1a1816]/75">
                  {resource.short_description}
                </p>
                <motion.span
                  className="inline-block text-sm font-semibold tracking-widest uppercase text-[#6b1f1f] border-b-2 border-[#6b1f1f] pb-1 transition-all hover:border-[#6b1f1f]/60"
                  whileHover={{ x: 2 }}
                >
                  Get it free →
                </motion.span>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
