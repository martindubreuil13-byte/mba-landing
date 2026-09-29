"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import CoffeeShopExamplePanel from "./CoffeeShopExamplePanel";

export default function IntroScreen({ onStart }: { onStart: () => void }) {
  const [exampleOpen, setExampleOpen] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-2xl">
      <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold mb-6">The Napkin Principle</p>
      <h1 className="text-4xl md:text-5xl font-light leading-tight tracking-tight text-[#1a1816] mb-8">
        Before you build the business, make the economics face reality.
      </h1>
      <p className="text-lg leading-relaxed text-[#1a1816]/75 mb-5">
        A business idea is not economically viable simply because customers like it—or even because every sale makes money.
      </p>
      <p className="text-lg leading-relaxed text-[#1a1816]/75 mb-8">
        Each transaction must leave enough behind. Enough of those transactions must realistically happen. Together,
        they must carry the cost of the business existing at all.
      </p>
      <p className="text-base leading-relaxed text-[#1a1816]/70 mb-4">The Napkin Principle reduces that question to five pieces of simple arithmetic:</p>
      <ul className="space-y-2 mb-8 text-base text-[#1a1816]/65 list-disc pl-5">
        <li>What will the customer pay?</li>
        <li>What will one transaction cost to produce and deliver?</li>
        <li>How much remains?</li>
        <li>What will the business cost to operate?</li>
        <li>Can enough profitable transactions realistically happen?</li>
      </ul>
      <p className="text-base leading-relaxed text-[#1a1816]/70 mb-10">
        By the end of this exercise, you will know the number your idea must produce—and which assumptions need to face reality before you invest further.
      </p>

      <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
        <button
          onClick={onStart}
          className="text-sm font-semibold tracking-widest uppercase text-white bg-[#6b1f1f] px-8 py-4 transition-all hover:bg-[#6b1f1f]/90"
        >
          Test the economics of your idea →
        </button>
        <button
          type="button"
          onClick={() => setExampleOpen(true)}
          className="text-sm text-[#1a1816]/60 underline hover:text-[#1a1816] transition-colors"
        >
          See how it works with a coffee shop
        </button>
      </div>

      <p className="text-xs leading-relaxed text-[#1a1816]/45 mt-10 max-w-xl">
        This is a preliminary economic screen, not a complete financial forecast or a guarantee that a business is viable. See the{" "}
        <a href="/privacy" className="underline hover:text-[#1a1816]">
          privacy policy
        </a>
        .
      </p>

      <CoffeeShopExamplePanel open={exampleOpen} onClose={() => setExampleOpen(false)} />
    </motion.div>
  );
}
