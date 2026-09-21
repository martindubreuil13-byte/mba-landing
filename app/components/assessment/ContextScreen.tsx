"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { STAGE_OPTIONS, type StageCode } from "@/app/lib/assessment/config";
import type { AssessmentContext } from "@/app/lib/assessment/types";

type Props = {
  initial: AssessmentContext;
  onContinue: (context: AssessmentContext) => void;
};

const inputClass =
  "w-full border border-[#1a1816]/15 bg-white px-4 py-3 text-[#1a1816] focus:outline-none focus:border-[#6b1f1f] transition-colors";

export default function ContextScreen({ initial, onContinue }: Props) {
  const [ideaName, setIdeaName] = useState(initial.ideaName);
  const [ideaDescription, setIdeaDescription] = useState(initial.ideaDescription);
  const [stage, setStage] = useState<StageCode | "">(initial.stage || "");
  const [location, setLocation] = useState(initial.location || "");
  const [error, setError] = useState("");

  const handleContinue = () => {
    if (!ideaName.trim() || !ideaDescription.trim() || !stage) {
      setError("A working name, a one-sentence description and your current stage are all needed to continue.");
      return;
    }
    onContinue({ ideaName: ideaName.trim(), ideaDescription: ideaDescription.trim(), stage: stage as StageCode, location: location.trim() || null });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-xl">
      <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-6">Before we start</p>
      <h2 className="text-2xl md:text-3xl font-light text-[#1a1816] mb-10">A little context.</h2>

      <div className="space-y-8">
        <div>
          <label className="block text-sm text-[#1a1816]/70 mb-2">What do you call the idea or business?</label>
          <input value={ideaName} onChange={(e) => setIdeaName(e.target.value)} className={inputClass} placeholder="A working name is fine" />
        </div>

        <div>
          <label className="block text-sm text-[#1a1816]/70 mb-2">In one sentence, what is it?</label>
          <input value={ideaDescription} onChange={(e) => setIdeaDescription(e.target.value)} className={inputClass} placeholder="A simple description" />
        </div>

        <div>
          <label className="block text-sm text-[#1a1816]/70 mb-3">Where are you today?</label>
          <div className="space-y-2">
            {STAGE_OPTIONS.map((opt) => (
              <button
                key={opt.code}
                type="button"
                onClick={() => setStage(opt.code)}
                className={`w-full text-left border px-4 py-3 text-sm transition-colors ${
                  stage === opt.code
                    ? "border-[#6b1f1f] bg-[#6b1f1f]/5 text-[#1a1816]"
                    : "border-[#1a1816]/15 text-[#1a1816]/75 hover:border-[#1a1816]/30"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-[#1a1816]/70 mb-2">
            Where are you based? <span className="text-[#1a1816]/40">(optional)</span>
          </label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} placeholder="City, country" />
        </div>
      </div>

      {error && <p className="text-sm text-[#6b1f1f] mt-6">{error}</p>}

      <button
        onClick={handleContinue}
        className="mt-10 text-sm font-semibold tracking-widest uppercase text-white bg-[#6b1f1f] px-8 py-4 transition-all hover:bg-[#6b1f1f]/90"
      >
        Continue →
      </button>
    </motion.div>
  );
}
