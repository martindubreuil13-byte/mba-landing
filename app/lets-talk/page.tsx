/* eslint-disable react/no-unescaped-entities */
"use client";

import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import Navigation from "@/app/components/Navigation";

const SITUATIONS = [
  {
    id: 1,
    title: "I want to start a business.",
    subtitle: "But I don't know what yet.",
  },
  {
    id: 2,
    title: "I have an idea.",
    subtitle: "But I don't know if there's really a business inside it.",
  },
  {
    id: 3,
    title: "I've started building something.",
    subtitle: "But I'm not sure how to turn it into a business or take it to market.",
  },
  {
    id: 4,
    title: "I already have a business.",
    subtitle: "But something isn't working.",
  },
  {
    id: 5,
    title: "None of those quite fit.",
    subtitle: "That's probably worth a conversation too.",
  },
];

export default function LetsTalkPage() {
  const [selectedSituation, setSelectedSituation] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const conversationRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  const handleSituationSelect = (id: number) => {
    setSelectedSituation(id);
  };

  // Scroll to conversation/form when situation is selected
  useEffect(() => {
    if (selectedSituation && conversationRef.current) {
      setTimeout(() => {
        conversationRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [selectedSituation]);

  // Scroll to success message when submission completes
  useEffect(() => {
    if (submitStatus === "success" && successRef.current) {
      setTimeout(() => {
        successRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, [submitStatus]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!formData.name.trim()) {
      setErrorMessage("Please enter your name.");
      return;
    }

    if (!formData.email.trim()) {
      setErrorMessage("Please enter your email.");
      return;
    }

    if (!validateEmail(formData.email)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!formData.message.trim()) {
      setErrorMessage("Please tell us what you're trying to figure out.");
      return;
    }

    if (!selectedSituation) {
      setErrorMessage("Please select where you are right now.");
      return;
    }

    setSubmitStatus("loading");
    setIsSubmitting(true);

    try {
      const selectedSituationText = SITUATIONS.find((s) => s.id === selectedSituation)?.title || "Unknown";

      const response = await fetch("/api/qualify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          situation: selectedSituationText,
          message: formData.message,
        }),
      });

      if (response.ok) {
        setSubmitStatus("success");
        setFormData({ name: "", email: "", message: "" });
        setSelectedSituation(null);
      } else {
        setSubmitStatus("error");
        setErrorMessage("Something went wrong. Please try again or email martin@mindrasolutions.com");
      }
    } catch (error) {
      setSubmitStatus("error");
      setErrorMessage("Something went wrong. Please try again or email martin@mindrasolutions.com");
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navigation />

      {/* PAGE PADDING */}
      <div className="h-16" />

      <div className="w-full bg-white text-[#1a1816]">

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
              <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-8">Conversation</p>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-light leading-tight tracking-tight mb-12">
                Let's talk.
              </h1>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="space-y-4"
              >
                <p className="text-2xl md:text-3xl lg:text-4xl font-light leading-tight text-[#1a1816]">
                  You don't need to have it figured out.
                </p>

                <p className="text-2xl md:text-3xl lg:text-4xl font-light leading-tight text-[#6b1f1f]">
                  That's rather the point.
                </p>
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            RECOGNITION — SITUATION SELECTORS
        */}

        <section className="w-full px-6 md:px-12 lg:px-16 py-24 md:py-36 border-t border-[#1a1816]/8">
          <div className="max-w-6xl">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-50px" }}
              className="max-w-3xl"
            >
              <h2 className="text-lg md:text-xl font-light leading-relaxed text-[#1a1816] mb-16">
                Where are you right now?
              </h2>

              <div className="space-y-6">
                {SITUATIONS.map((situation, index) => (
                  <motion.button
                    key={situation.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    onClick={() => handleSituationSelect(situation.id)}
                    className={`w-full text-left p-6 border-t transition-all focus:outline-none ${
                      selectedSituation === situation.id
                        ? "border-[#6b1f1f] border-t-2"
                        : "border-[#1a1816]/8 hover:bg-[#f5f1ed]/30 focus:bg-[#f5f1ed]/20"
                    }`}
                  >
                    <div className="flex items-start gap-8">
                      <p className={`text-lg font-light flex-shrink-0 transition-colors ${
                        selectedSituation === situation.id ? "text-[#6b1f1f]" : "text-[#1a1816]/50"
                      }`}>
                        {String(situation.id).padStart(2, "0")}
                      </p>
                      <div className="flex-grow">
                        <p className={`text-lg md:text-xl font-light leading-tight transition-colors ${
                          selectedSituation === situation.id ? "text-[#6b1f1f]" : "text-[#1a1816]"
                        }`}>
                          {situation.title}
                        </p>
                        <p className={`text-base md:text-lg leading-relaxed mt-2 transition-colors ${
                          selectedSituation === situation.id ? "text-[#1a1816]/70" : "text-[#1a1816]/50"
                        }`}>
                          {situation.subtitle}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>

          </div>
        </section>

        {/* ============================================================
            CONVERSATION SECTION (appears when situation selected)
        */}

        {selectedSituation && (
          <motion.section
            ref={conversationRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full px-6 md:px-12 lg:px-16 py-24 md:py-36 border-t border-[#1a1816]/8 scroll-mt-32"
          >
            <div className="max-w-6xl">

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="max-w-3xl space-y-8"
              >
                <h3 className="text-lg md:text-xl font-light leading-relaxed text-[#1a1816]">
                  Good. Let's start there.
                </h3>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="border-t border-[#1a1816]/8 pt-6 space-y-6"
                >
                  <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60">
                    You don't need to prepare a pitch or have all the answers.
                  </p>

                  <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60">
                    Tell me where you are, what you're trying to do, and what's getting in the way.
                  </p>

                  <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60">
                    Then we'll have a conversation.
                  </p>

                  <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60">
                    Entrepreneur to entrepreneur.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="border-t border-[#1a1816]/8 pt-6 space-y-6"
                >
                  <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60">
                    It may lead to working together.
                  </p>

                  <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60">
                    It may not.
                  </p>

                  <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60">
                    Either way, it'll be a good conversation.
                  </p>
                </motion.div>
              </motion.div>

            </div>
          </motion.section>
        )}

        {/* ============================================================
            FORM
        */}

        {selectedSituation && submitStatus !== "success" && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="w-full px-6 md:px-12 lg:px-16 py-24 md:py-36 border-t border-[#1a1816]/8"
          >
            <div className="max-w-3xl">

              <form onSubmit={handleSubmit} className="space-y-8">

                {/* NAME FIELD */}
                <div>
                  <label htmlFor="name" className="text-sm tracking-widest uppercase text-[#1a1816]/50 font-medium">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder=""
                    className="w-full mt-2 border-b-2 border-[#1a1816]/20 bg-transparent text-lg leading-relaxed text-[#1a1816] placeholder-[#1a1816]/30 focus:outline-none focus:border-[#6b1f1f] py-2 transition"
                    disabled={isSubmitting}
                  />
                </div>

                {/* EMAIL FIELD */}
                <div>
                  <label htmlFor="email" className="text-sm tracking-widest uppercase text-[#1a1816]/50 font-medium">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder=""
                    className="w-full mt-2 border-b-2 border-[#1a1816]/20 bg-transparent text-lg leading-relaxed text-[#1a1816] placeholder-[#1a1816]/30 focus:outline-none focus:border-[#6b1f1f] py-2 transition"
                    disabled={isSubmitting}
                  />
                </div>

                {/* MESSAGE FIELD */}
                <div>
                  <label htmlFor="message" className="text-sm tracking-widest uppercase text-[#1a1816]/50 font-medium">
                    What are you trying to figure out?
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder=""
                    rows={6}
                    className="w-full mt-2 border-b-2 border-[#1a1816]/20 bg-transparent text-lg leading-relaxed text-[#1a1816] placeholder-[#1a1816]/30 focus:outline-none focus:border-[#6b1f1f] py-2 transition resize-none"
                    disabled={isSubmitting}
                  />
                </div>

                {/* ERROR MESSAGE */}
                {submitStatus === "error" && errorMessage && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 border-l-2 border-[#6b1f1f]/30 bg-[#6b1f1f]/5 text-[#6b1f1f] text-sm"
                  >
                    {errorMessage}
                  </motion.div>
                )}

                {/* SUBMIT BUTTON */}
                <div className="pt-8">
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={!isSubmitting ? { x: 2 } : {}}
                    className="text-sm font-semibold tracking-widest uppercase text-[#6b1f1f] border-b-2 border-[#6b1f1f] pb-1 transition-all hover:border-[#6b1f1f]/60 disabled:opacity-60"
                  >
                    {isSubmitting ? "Sending..." : "START THE CONVERSATION →"}
                  </motion.button>
                </div>

              </form>

              {/* DIRECT EMAIL OPTION */}
              <div className="mt-16 pt-12 border-t border-[#1a1816]/8">
                <p className="text-sm text-[#1a1816]/50 mb-3">
                  Prefer email?
                </p>
                <a
                  href="mailto:martin@mindrasolutions.com"
                  className="text-sm font-semibold tracking-widest uppercase text-[#6b1f1f] border-b-2 border-[#6b1f1f] pb-1 hover:border-[#6b1f1f]/60 transition inline-block"
                >
                  martin@mindrasolutions.com
                </a>
              </div>

            </div>
          </motion.section>
        )}

        {/* ============================================================
            SUCCESS STATE
        */}

        {selectedSituation && submitStatus === "success" && (
          <motion.section
            ref={successRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="w-full px-6 md:px-12 lg:px-16 py-32 md:py-44 border-t border-[#1a1816]/8 scroll-mt-32"
          >
            <div className="max-w-3xl">

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="space-y-6"
              >
                <p className="text-5xl md:text-6xl lg:text-7xl font-light leading-tight text-[#1a1816] mb-8">
                  Got it.
                </p>

                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  Thanks for reaching out.
                </p>

                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
                  I'll read what you sent and get back to you personally within 48 hours.
                </p>

                <div className="border-t border-[#1a1816]/8 pt-8 mt-8">
                  <p className="text-lg md:text-xl font-light leading-relaxed text-[#1a1816]">
                    Martin
                  </p>
                </div>
              </motion.div>

            </div>
          </motion.section>
        )}

        {/* ============================================================
            CLOSING
        */}

        {selectedSituation && submitStatus === "success" && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="w-full px-6 md:px-12 lg:px-16 py-24 md:py-36 border-t border-[#1a1816]/8"
          >
            <div className="max-w-3xl">

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="space-y-4"
              >
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60">
                  You don't need a perfect idea.
                </p>

                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60">
                  You need an honest place to start.
                </p>
              </motion.div>

            </div>
          </motion.section>
        )}

        {/* CLOSING STATEMENT — Show if no selection yet or after success */}
        {(!selectedSituation || submitStatus === "success") && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-50px" }}
            className="w-full px-6 md:px-12 lg:px-16 py-40 md:py-56 border-t border-[#1a1816]/8"
          >
            <div className="max-w-3xl">

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="space-y-4"
              >
                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60">
                  You don't need a perfect idea.
                </p>

                <p className="text-lg md:text-xl leading-relaxed text-[#1a1816]/60">
                  You need an honest place to start.
                </p>
              </motion.div>

            </div>
          </motion.section>
        )}

        {/* Breathing room */}
        <div className="h-24 md:h-32" />

      </div>
    </>
  );
}
