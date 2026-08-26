/* eslint-disable react/no-unescaped-entities */
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";

export default function AnswersPage() {
  return (
    <>
      <Navigation />

      {/* PAGE PADDING */}
      <div className="h-16" />

      <main data-progressive-reveal className="w-full bg-white text-[#1a1816]">

        {/* ============================================================
            OPENING
        */}

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

        {/* ============================================================
            ANSWERS LIST
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-32 md:py-44 border-t border-[#1a1816]/8">
          <div className="max-w-6xl">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="max-w-3xl"
            >
              <Link href="/answers/what-is-business-architecture" className="group block">
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="space-y-8"
                >
                  <div>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight text-[#1a1816] group-hover:text-[#6b1f1f] transition-colors">
                      What is Business Architecture?
                    </h2>
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    viewport={{ once: true }}
                    className="border-t border-[#1a1816]/8 pt-8 flex items-center gap-4"
                  >
                    <div className="flex flex-col gap-1">
                      <p className="text-sm text-[#1a1816]/60">Martin Dubreuil</p>
                      <p className="text-sm text-[#1a1816]/50">August 26, 2026</p>
                    </div>
                  </motion.div>
                </motion.div>
              </Link>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
                viewport={{ once: true }}
                className="mt-12"
              >
                <Link href="/answers/what-is-business-architecture" className="inline-block">
                  <motion.span
                    className="text-sm font-semibold tracking-widest uppercase text-[#6b1f1f] border-b-2 border-[#6b1f1f] pb-1 transition-all hover:border-[#6b1f1f]/60 cursor-pointer"
                    whileHover={{ x: 2 }}
                  >
                    Read →
                  </motion.span>
                </Link>
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* Answer 2 */}
        <section className="w-full px-6 md:px-12 lg:px-16 py-32 md:py-44">
          <div className="max-w-6xl">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="max-w-3xl ml-auto md:max-w-2xl"
            >
              <Link href="/answers/what-does-a-business-architect-do" className="group block">
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="space-y-8"
                >
                  <div>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight text-[#1a1816] group-hover:text-[#6b1f1f] transition-colors">
                      What Does a Business Architect Do?
                    </h2>
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    viewport={{ once: true }}
                    className="border-t border-[#1a1816]/8 pt-8 flex items-center gap-4"
                  >
                    <div className="flex flex-col gap-1">
                      <p className="text-sm text-[#1a1816]/60">Martin Dubreuil</p>
                      <p className="text-sm text-[#1a1816]/50">August 26, 2026</p>
                    </div>
                  </motion.div>
                </motion.div>
              </Link>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
                viewport={{ once: true }}
                className="mt-12"
              >
                <Link href="/answers/what-does-a-business-architect-do" className="inline-block">
                  <motion.span
                    className="text-sm font-semibold tracking-widest uppercase text-[#6b1f1f] border-b-2 border-[#6b1f1f] pb-1 transition-all hover:border-[#6b1f1f]/60 cursor-pointer"
                    whileHover={{ x: 2 }}
                  >
                    Read →
                  </motion.span>
                </Link>
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* Breathing room */}
        <div className="h-24 md:h-32" />

      </main>
    </>
  );
}
