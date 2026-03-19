import { Button } from "@/app/components/ui/Button";

interface FinalCtaProps {
  onContactClick: () => void;
}

export function FinalCta({ onContactClick }: FinalCtaProps) {
  return (
    <section id="contact" className="relative px-6 pb-24 pt-16">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 text-center">
        <div className="glass-strong rounded-3xl border-white/10 p-10 text-white/90 shadow-[0_28px_80px_-28px_rgba(0,0,0,0.6)]">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Stop wasting time on ideas that won't work
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/70">
            Get the architecture that turns your vision into a business that actually scales.
            Join 50+ founders who've avoided the $100K+ mistakes that kill most startups.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <Button href="#offer" variant="primary" size="lg">
              Get Your Architecture Blueprint
            </Button>
            <Button onClick={onContactClick} variant="secondary" size="lg">
              Talk to Martin
            </Button>
          </div>
        </div>

        <p className="max-w-xl text-sm text-white/50">
          **Pro tip:** Share this page with your leadership team and use it as a shared model for
          how you align roadmap, revenue, and customer experience.
        </p>
      </div>
    </section>
  );
}
