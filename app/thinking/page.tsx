/* eslint-disable react/no-unescaped-entities */
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";

export default function ThinkingPage() {
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

        {/* ============================================================
            ARTICLES
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-32 md:py-44 border-t border-[#1a1816]/8">
          <div className="max-w-6xl">

            {/* Article 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="max-w-3xl mb-20 md:mb-28"
            >
              <Link href="/thinking/your-business-idea-is-worth-nothing" className="group block">
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="space-y-8"
                >
                  <div>
                    <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-6">Business Idea Architecture</p>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight text-[#1a1816] group-hover:text-[#6b1f1f] transition-colors">
                      Your Business Idea Is Worth Nothing
                    </h2>
                  </div>

                  <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    viewport={{ once: true }}
                    className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1816]/70"
                  >
                    An idea doesn't become valuable because you had it. First, it has to survive reality.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    viewport={{ once: true }}
                    className="border-t border-[#1a1816]/8 pt-8 flex items-center gap-4"
                  >
                    <div className="flex flex-col gap-1">
                      <p className="text-sm text-[#1a1816]/60">Martin Dubreuil</p>
                      <p className="text-sm text-[#1a1816]/50">August 25, 2026</p>
                    </div>
                  </motion.div>
                </motion.div>
              </Link>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.5 }}
                viewport={{ once: true }}
                className="mt-12"
              >
                <Link href="/thinking/your-business-idea-is-worth-nothing" className="inline-block">
                  <motion.span
                    className="text-sm font-semibold tracking-widest uppercase text-[#6b1f1f] border-b-2 border-[#6b1f1f] pb-1 transition-all hover:border-[#6b1f1f]/60 cursor-pointer"
                    whileHover={{ x: 2 }}
                  >
                    Read →
                  </motion.span>
                </Link>
              </motion.div>
            </motion.div>

            {/* Article 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="max-w-3xl ml-auto md:max-w-2xl"
            >
              <Link href="/thinking/an-app-is-not-a-business" className="group block">
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="space-y-8"
                >
                  <div>
                    <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-6">Business Architecture</p>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight text-[#1a1816] group-hover:text-[#6b1f1f] transition-colors">
                      An App Is Not a Business
                    </h2>
                  </div>

                  <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    viewport={{ once: true }}
                    className="text-lg md:text-xl font-light leading-relaxed text-[#1a1816]/75"
                  >
                    Building something is not the same as building a business. The difference lies in customers, acquisition, economics, adaptability and the architecture around the product.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    viewport={{ once: true }}
                    className="border-t border-[#1a1816]/8 pt-8 flex items-center gap-4"
                  >
                    <div className="flex flex-col gap-1">
                      <p className="text-sm text-[#1a1816]/60">Martin Dubreuil</p>
                      <p className="text-sm text-[#1a1816]/50">August 25, 2026</p>
                    </div>
                  </motion.div>
                </motion.div>
              </Link>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.5 }}
                viewport={{ once: true }}
                className="mt-12"
              >
                <Link href="/thinking/an-app-is-not-a-business" className="inline-block">
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
