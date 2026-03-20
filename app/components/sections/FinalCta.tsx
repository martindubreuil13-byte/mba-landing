"use client";

import Link from "next/link";
import { Button } from "@/app/components/ui/Button";

export function FinalCta() {
  return (
    <section
      id="final"
      className="w-full px-6 md:px-12 lg:px-24 py-16"
    >
      <div className="max-w-none flex flex-col items-start gap-10">

        {/* HEADLINE */}
        <h2 className="text-4xl md:text-5xl font-semibold leading-tight tracking-[-0.02em]">
          At some point,
          <span className="block mt-3">
            not deciding becomes the real risk.
          </span>
        </h2>

        {/* BODY */}
        <p className="text-lg md:text-xl text-white/70 max-w-2xl leading-relaxed">
          You’ve thought about it long enough.
          <br />
          What’s missing isn’t another idea.
          <br />
          It’s a structure you can actually move with.
        </p>

        {/* CTA */}
        <div className="pt-6 w-full max-w-sm">
          <Link href="/contact" className="w-full">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
            >
              See if you qualify
            </Button>
          </Link>
        </div>

        {/* SUBTEXT */}
        <p className="text-sm text-white/40 max-w-xl leading-relaxed">
          This isn’t for everyone. But if you’re serious, you’ll know.
        </p>

      </div>
    </section>
  );
}