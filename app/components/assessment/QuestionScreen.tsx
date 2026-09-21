"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { AssessmentQuestion } from "@/app/lib/assessment/config";

type Props = {
  question: AssessmentQuestion;
  index: number;
  total: number;
  value: string;
  onAnswer: (value: string) => void;
  onBack: () => void;
};

/**
 * Rendered with `key={question.code}` by the parent, so this remounts
 * (and `draft` re-initializes from `value`) on every question change —
 * no effect-based state sync needed.
 */
export default function QuestionScreen({ question, index, total, value, onAnswer, onBack }: Props) {
  const [draft, setDraft] = useState(value);

  const handleChoice = (v: string) => {
    // Auto-advance for closed questions, but not so fast it feels rushed.
    onAnswer(v);
  };

  return (
    <motion.div
      key={question.code}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-xl"
    >
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="text-xs tracking-widest uppercase text-[#1a1816]/40 hover:text-[#1a1816]">
          ← Back
        </button>
        <div className="flex-1 h-px bg-[#1a1816]/10" />
        <p className="text-xs tracking-widest uppercase text-[#1a1816]/40 whitespace-nowrap">
          Question {index + 1} of {total}
        </p>
      </div>
      <div className="h-0.5 bg-[#1a1816]/8 mb-10">
        <div className="h-full bg-[#6b1f1f] transition-all duration-500" style={{ width: `${((index + 1) / total) * 100}%` }} />
      </div>

      <h2 className="text-2xl md:text-3xl font-light text-[#1a1816] mb-3 leading-snug">{question.prompt}</h2>
      {question.helper && <p className="text-base text-[#1a1816]/60 mb-3 leading-relaxed">{question.helper}</p>}
      {question.kind === "open" && question.example && (
        <p className="text-sm text-[#1a1816]/45 italic mb-8 leading-relaxed">{question.example}</p>
      )}

      {question.kind === "closed" ? (
        <div className="space-y-3 mt-8">
          {question.options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleChoice(opt.value)}
              className={`w-full text-left border px-5 py-4 text-sm md:text-base transition-colors ${
                value === opt.value
                  ? "border-[#6b1f1f] bg-[#6b1f1f]/5 text-[#1a1816]"
                  : "border-[#1a1816]/15 text-[#1a1816]/80 hover:border-[#1a1816]/30"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            autoFocus
            className="w-full border border-[#1a1816]/15 bg-white px-4 py-3 text-[#1a1816] focus:outline-none focus:border-[#6b1f1f] transition-colors resize-none text-base leading-relaxed"
            placeholder="Answer in a sentence or two…"
          />
          <button
            onClick={() => draft.trim() && onAnswer(draft.trim())}
            disabled={draft.trim().length < 2}
            className="mt-6 text-sm font-semibold tracking-widest uppercase text-white bg-[#6b1f1f] px-8 py-4 transition-all hover:bg-[#6b1f1f]/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue →
          </button>
        </div>
      )}
    </motion.div>
  );
}
