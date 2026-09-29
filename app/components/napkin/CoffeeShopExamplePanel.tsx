/* eslint-disable react/no-unescaped-entities */
"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { COFFEE_SHOP_EXAMPLE } from "@/app/lib/napkin/config";
import { formatCurrency, formatNumber } from "@/app/lib/napkin/format";

export default function CoffeeShopExamplePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const ex = COFFEE_SHOP_EXAMPLE;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="coffee-shop-example-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-[#1a1816]/60 flex items-start md:items-center justify-center p-4 md:p-8 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="bg-white max-w-xl w-full p-8 md:p-10 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <p id="coffee-shop-example-title" className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold">
                Worked example
              </p>
              <button ref={closeRef} type="button" onClick={onClose} aria-label="Close example" className="text-[#1a1816]/40 hover:text-[#1a1816] text-xl leading-none">
                ×
              </button>
            </div>

            <h2 className="text-2xl font-light text-[#1a1816] mb-6">The coffee-shop napkin</h2>

            <div className="mb-8">
              <p className="text-sm font-semibold text-[#1a1816] mb-3">One cup</p>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-[#1a1816]/8">
                    <td className="py-1.5 text-[#1a1816]/70">Price</td>
                    <td className="py-1.5 text-right font-medium">{formatCurrency(ex.transaction.price, "USD")}</td>
                  </tr>
                  {ex.transaction.costs.map((c) => (
                    <tr key={c.label} className="border-b border-[#1a1816]/8">
                      <td className="py-1.5 text-[#1a1816]/70">{c.label}</td>
                      <td className="py-1.5 text-right text-[#1a1816]/70">−{formatCurrency(c.amount, "USD")}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="py-1.5 font-semibold text-[#1a1816]">Money remaining</td>
                    <td className="py-1.5 text-right font-semibold text-[#6b1f1f]">{formatCurrency(ex.transaction.moneyRemaining, "USD")}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mb-8">
              <p className="text-sm font-semibold text-[#1a1816] mb-3">One ordinary month</p>
              <p className="text-sm text-[#1a1816]/70">Total monthly operating cost: <span className="font-semibold text-[#1a1816]">{formatCurrency(ex.month.total, "USD")}</span></p>
            </div>

            <div className="mb-8 bg-[#faf8f6] border border-[#1a1816]/8 px-5 py-5">
              <p className="text-sm text-[#1a1816]/80 leading-relaxed">
                {formatCurrency(ex.month.total, "USD")} ÷ {formatCurrency(ex.transaction.moneyRemaining, "USD")} = <strong>{formatNumber(ex.requiredPerMonth)} cups per month</strong>
              </p>
              <p className="text-sm text-[#1a1816]/80 leading-relaxed mt-1">
                {formatNumber(ex.requiredPerMonth)} ÷ {ex.tradingDaysPerMonth} trading days = <strong>{ex.requiredPerDay} cups per day</strong>
              </p>
              <p className="text-sm text-[#1a1816]/80 leading-relaxed mt-1">
                {ex.requiredPerDay} ÷ {ex.openingHoursPerDay} opening hours = <strong>approximately {ex.requiredPerHour} cups per hour</strong>
              </p>
            </div>

            <p className="text-sm text-[#1a1816]/70 leading-relaxed mb-2">
              The street appears capable of supporting approximately {ex.streetCapacityPerDay} cups per day. The business requires {ex.requiredPerDay}.
            </p>
            <p className="text-base font-semibold text-[#1a1816] mb-6">“{ex.conclusion}”</p>
            <p className="text-sm text-[#1a1816]/60 leading-relaxed">
              This doesn't necessarily kill the idea — it identifies what must change: location, rent, labour, price, average spend, opening hours, format, target customer, or another part of the architecture.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
