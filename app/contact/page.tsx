"use client";

import { Button } from "@/app/components/ui/Button";

export default function ContactPage() {
  return (
    <section className="w-full px-6 md:px-12 lg:px-24 py-32">

      <div className="max-w-2xl flex flex-col items-start gap-10">

        {/* TITLE */}
        <h1 className="text-4xl md:text-5xl font-semibold leading-tight tracking-[-0.02em]">
          Let’s talk.
        </h1>

        {/* TEXT */}
        <p className="text-lg text-white/70 leading-relaxed max-w-xl">
          If you’re serious about building something that actually works,
          choose the easiest way to reach out.
        </p>

        {/* ACTIONS */}
        <div className="flex flex-col gap-4 w-full max-w-md">

          {/* WHATSAPP */}
          <a
            href="https://wa.me/66979211331"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
          >
            <Button variant="primary" size="lg" className="w-full">
              Message on WhatsApp
            </Button>
          </a>

          {/* EMAIL */}
          <a
            href="mailto:martin@mindrasolutions.com"
            className="w-full"
          >
            <Button
              variant="ghost"
              size="lg"
              className="w-full border border-white/20 hover:bg-white/5"
            >
              Send an Email
            </Button>
          </a>

          {/* CALENDLY */}
          <a
            href="https://calendly.com/martindubreuil/coaching_session"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
          >
            <Button
              variant="ghost"
              size="lg"
              className="w-full border border-white/20 hover:bg-white/5"
            >
              Book a Call
            </Button>
          </a>

        </div>

        {/* SUBTEXT */}
        <p className="text-sm text-white/40 max-w-md">
          No pressure. Just a quick conversation to see if this makes sense.
        </p>

      </div>

    </section>
  );
}