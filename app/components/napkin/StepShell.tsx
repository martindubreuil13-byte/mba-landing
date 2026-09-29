"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type Props = {
  stepLabel: string;
  index: number;
  total: number;
  onBack?: () => void;
  children: ReactNode;
};

/** Shared header (Back + progress bar) for every input-collecting step of the flow, mirroring QuestionScreen's layout in the Business Idea Reality Check. */
export default function StepShell({ stepLabel, index, total, onBack, children }: Props) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="max-w-xl">
      <div className="flex items-center gap-4 mb-8">
        {onBack ? (
          <button type="button" onClick={onBack} className="text-xs tracking-widest uppercase text-[#1a1816]/40 hover:text-[#1a1816]">
            ← Back
          </button>
        ) : (
          <span />
        )}
        <div className="flex-1 h-px bg-[#1a1816]/10" />
        <p className="text-xs tracking-widest uppercase text-[#1a1816]/40 whitespace-nowrap">
          Step {index + 1} of {total}
        </p>
      </div>
      <div className="h-0.5 bg-[#1a1816]/8 mb-10" role="progressbar" aria-valuenow={index + 1} aria-valuemin={1} aria-valuemax={total} aria-label={stepLabel}>
        <div className="h-full bg-[#6b1f1f] transition-all duration-500" style={{ width: `${((index + 1) / total) * 100}%` }} />
      </div>
      {children}
    </motion.div>
  );
}
