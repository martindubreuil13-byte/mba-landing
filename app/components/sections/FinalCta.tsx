"use client";

import Link from "next/link";
import { Button } from "@/app/components/ui/Button";

export function FinalCta() {
  return (
    <section
      id="final"
      className="w-full px-6 md:px-12 lg:px-24 pt-12 pb-16"
    >
      <div className="max-w-2xl flex flex-col items-start gap-8">

        {/* HEADLINE */}
        <h2 className="text-3xl md:text-5xl font-semibold leading-[1.1] tracking-[-0.03em]">
          At some point,
          <span className="block mt-3">
            not deciding becomes the real risk.
          </span>
        </h2>

        {/* BODY */}
        <p className="text-base md:text-lg text-white/65 leading-relaxed">
          You’ve thought about it long enough.
          What’s missing isn’t another idea.
          It’s a structure you can actually move with.
        </p>

        {/* PRIMARY CTA */}
        <div className="pt-4 w-full max-w-sm">
          <Link href="/qualify" className="w-full">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
            >
              Start here
            </Button>
          </Link>
        </div>

        {/* SECONDARY CTA */}
        <Link
          href="/contact"
          className="text-sm text-white/50 hover:text-white transition underline-offset-4 hover:underline"
        >
          Ask me anything before you decide →
        </Link>

        {/* SUBTEXT */}
        <p className="text-sm text-white/35 leading-relaxed">
          If you’re serious, the next step becomes obvious very quickly.
        </p>

      </div>
    </section>
  );
}