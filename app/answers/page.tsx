/* eslint-disable react/no-unescaped-entities */
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";

export default function AnswersPage() {
  const answers = [
    {
      href: "/answers/i-built-an-app-how-do-i-turn-it-into-a-business",
      number: "006",
      title: "I Built an App. How Do I Turn It Into a Business?",
      date: "September 4, 2026",
      featured: true,
    },
    {
      href: "/answers/how-do-i-get-investors-for-my-business-idea",
      number: "005",
      title: "How Do I Get Investors for My Business Idea?",
      date: "September 4, 2026",
      featured: false,
    },
    {
      href: "/answers/i-have-a-business-idea-but-no-money-what-should-i-do",
      number: "004",
      title: "I Have a Business Idea but No Money. What Should I Do?",
      date: "September 4, 2026",
      featured: false,
    },
    {
      href: "/answers/how-do-i-know-if-my-business-idea-is-actually-viable",
      number: "003",
      title: "How Do I Know If My Business Idea Is Actually Viable?",
      date: "August 26, 2026",
      featured: false,
    },
    {
      href: "/answers/what-does-a-business-architect-do",
      number: "002",
      title: "What Does a Business Architect Do?",
      date: "August 26, 2026",
      featured: false,
    },
    {
      href: "/answers/what-is-business-architecture",
      number: "001",
      title: "What Is Business Architecture?",
      date: "August 26, 2026",
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
              <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-8">Answers</p>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-light leading-tight tracking-tight mb-12">
                Questions worth answering properly.
              </h1>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                viewport={{ once: true }}
                className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70"
              >
                Clear answers about building, testing and architecting businesses.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* ANSWERS - LEFT-ALIGNED SEQUENTIAL FLOW */}
        <section className="w-full px-6 md:px-12 lg:px-16 py-32 md:py-44 border-t border-[#1a1816]/8">
          <div className="max-w-6xl">

            {answers.map((answer, index) => (
              <motion.div
                key={answer.number}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                viewport={{ once: true, margin: "-50px" }}
                className="mb-20 md:mb-28 lg:mb-32"
              >
                <Link href={answer.href} className="group block">
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                    viewport={{ once: true }}
                    className="space-y-6 max-w-2xl"
                  >
                    {/* Answer Number Label */}
                    <div className="flex items-baseline gap-2">
                      <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold">
                        Answer {answer.number}
                      </p>
                    </div>

                    {/* Title - Two-tier hierarchy */}
                    <h2
                      className={`font-light leading-tight text-[#1a1816] group-hover:text-[#6b1f1f] transition-colors ${
                        answer.featured
                          ? "text-3xl md:text-4xl lg:text-5xl"
                          : "text-2xl md:text-3xl lg:text-4xl"
                      }`}
                    >
                      {answer.title}
                    </h2>

                    {/* Author + Date */}
                    <div className="border-t border-[#1a1816]/8 pt-6 flex items-center gap-4">
                      <div className="flex flex-col gap-1">
                        <p className="text-sm text-[#1a1816]/60">Martin Dubreuil</p>
                        <p className="text-sm text-[#1a1816]/50">{answer.date}</p>
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
                  <Link href={answer.href} className="inline-block">
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
