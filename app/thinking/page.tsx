/* eslint-disable react/no-unescaped-entities */
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";

export default function ThinkingPage() {
  const articles = [
    {
      href: "/thinking/the-being-economy",
      category: "Business Architecture",
      number: "007",
      title: "The Being Economy",
      standfirst: "As AI makes knowledge cheaper and execution more abundant, human judgment, trust, reputation, relationships and accountability may become more economically valuable.",
      date: "September 5, 2026",
      featured: true,
    },
    {
      href: "/thinking/the-brutal-truth-about-startup-fundraising",
      category: "Business Architecture",
      number: "006",
      title: "The Brutal Truth About Startup Fundraising",
      standfirst: "Most early founders who think they have a fundraising problem don't. They have a business-readiness problem — and investors can usually see it before they can.",
      date: "August 26, 2026",
      featured: false,
    },
    {
      href: "/thinking/your-life-is-perfectly-designed-to-kill-your-business-before-it-starts",
      category: "Founder Architecture",
      number: "005",
      title: "Your Life Is Perfectly Designed to Kill Your Business Before It Starts",
      standfirst: "Most aspiring entrepreneurs don't have a motivation problem. They have a structural problem. Their current life leaves no room for the business they keep saying they want to build.",
      date: "August 26, 2026",
      featured: false,
    },
    {
      href: "/thinking/the-fastest-way-to-build-the-wrong-business",
      category: "Business Architecture",
      number: "004",
      title: "The Fastest Way to Build the Wrong Business",
      standfirst: "Most entrepreneurs don't build businesses in the wrong direction because they're lazy. They do it because they start building before they've worked out what needs to exist.",
      date: "August 26, 2026",
      featured: false,
    },
    {
      href: "/thinking/your-corporate-experience-may-be-working-against-you",
      category: "Founder Architecture",
      number: "003",
      title: "Your Corporate Experience May Be Working Against You",
      standfirst: "Leading an established business and creating one from nothing are different games. The experience that made you successful in one can quietly make you dangerous in the other.",
      date: "August 26, 2026",
      featured: false,
    },
    {
      href: "/thinking/an-app-is-not-a-business",
      category: "Business Architecture",
      number: "002",
      title: "An App Is Not a Business",
      standfirst: "Building something is not the same as building a business. The difference lies in customers, acquisition, economics, adaptability and the architecture around the product.",
      date: "August 25, 2026",
      featured: false,
    },
    {
      href: "/thinking/your-business-idea-is-worth-nothing",
      category: "Business Idea Architecture",
      number: "001",
      title: "Your Business Idea Is Worth Nothing",
      standfirst: "An idea doesn't become valuable because you had it. First, it has to survive reality.",
      date: "August 25, 2026",
      featured: false,
    },
  ];

  return (
    <>
      <Navigation />
      <div className="h-16" />
      <main data-progressive-reveal className="w-full bg-white text-[#1a1816]">

        {/* OPENING */}
        <section className="w-full px-6 md:px-12 lg:px-16 py-40 md:py-56">
          <div className="max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="max-w-3xl"
            >
              <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-8">Thinking</p>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-light leading-tight tracking-tight mb-12">
                Entrepreneurial business architecture.
              </h1>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                viewport={{ once: true }}
                className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70"
              >
                How we find the right business for an entrepreneur, test whether the idea has a real chance, work out how the business should work, and make it exist.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* ARTICLES - LEFT-ALIGNED SEQUENTIAL FLOW */}
        <section className="w-full px-6 md:px-12 lg:px-16 py-32 md:py-44 border-t border-[#1a1816]/8">
          <div className="max-w-6xl">

            {articles.map((article, index) => (
              <motion.div
                key={article.number}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                viewport={{ once: true, margin: "-50px" }}
                className={`mb-20 md:mb-28 lg:mb-32 ${article.featured ? "" : ""}`}
              >
                <Link href={article.href} className="group block">
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                    viewport={{ once: true }}
                    className="space-y-6 max-w-2xl"
                  >
                    {/* Category + Number Label */}
                    <div className="flex items-baseline gap-3">
                      <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold">
                        {article.category}
                      </p>
                      <p className="text-xs tracking-widest uppercase text-[#1a1816]/40">
                        {article.number}
                      </p>
                    </div>

                    {/* Title - Two-tier hierarchy */}
                    <h2
                      className={`font-light leading-tight text-[#1a1816] group-hover:text-[#6b1f1f] transition-colors ${
                        article.featured
                          ? "text-3xl md:text-4xl lg:text-5xl"
                          : "text-2xl md:text-3xl lg:text-4xl"
                      }`}
                    >
                      {article.title}
                    </h2>

                    {/* Standfirst */}
                    <p
                      className={`leading-relaxed text-[#1a1816]/75 ${
                        article.featured ? "text-lg md:text-xl" : "text-base md:text-lg"
                      }`}
                    >
                      {article.standfirst}
                    </p>

                    {/* Author + Date */}
                    <div className="border-t border-[#1a1816]/8 pt-6 flex items-center gap-4">
                      <div className="flex flex-col gap-1">
                        <p className="text-sm text-[#1a1816]/60">Martin Dubreuil</p>
                        <p className="text-sm text-[#1a1816]/50">{article.date}</p>
                      </div>
                    </div>
                  </motion.div>
                </Link>

                {/* Read Link */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.15 }}
                  viewport={{ once: true }}
                  className="mt-8"
                >
                  <Link href={article.href} className="inline-block">
                    <motion.span
                      className="text-sm font-semibold tracking-widest uppercase text-[#6b1f1f] border-b-2 border-[#6b1f1f] pb-1 transition-all hover:border-[#6b1f1f]/60 cursor-pointer"
                      whileHover={{ x: 2 }}
                    >
                      Read →
                    </motion.span>
                  </Link>
                </motion.div>
              </motion.div>
            ))}

          </div>
        </section>

        {/* Breathing room */}
        <div className="h-24 md:h-32" />

      </main>
    </>
  );
}
