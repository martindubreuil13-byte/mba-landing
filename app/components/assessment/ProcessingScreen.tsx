"use client";

import { motion } from "framer-motion";

export default function ProcessingScreen() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="max-w-md py-24 text-center mx-auto">
      <motion.div
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        className="text-sm tracking-widest uppercase text-[#6b1f1f] font-semibold"
      >
        Assessing the evidence…
      </motion.div>
    </motion.div>
  );
}
