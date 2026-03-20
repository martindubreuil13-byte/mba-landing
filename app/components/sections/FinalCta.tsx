import { Button } from "@/app/components/ui/Button";

interface FinalCtaProps {
  onContactClick: () => void;
}

export function FinalCta({ onContactClick }: FinalCtaProps) {
  return (
    <section
      id="final"
      className="w-full px-6 md:px-12 lg:px-20 py-32 text-center"
    >

      <div className="max-w-4xl mx-auto flex flex-col items-center gap-8">

        {/* HEADLINE */}
        <h2 className="text-4xl md:text-5xl font-semibold leading-tight tracking-[-0.02em]">
          At some point, thinking about it
          <span className="block text-white/60 mt-3">
            becomes more expensive than building it.
          </span>
        </h2>

        {/* BODY */}
        <p className="text-lg md:text-xl text-white/70 max-w-2xl leading-relaxed">
          You don’t need more ideas.
          <br />
          You don’t need more time.
          <br />
          You need something that actually works.
        </p>

        {/* ACTION */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 w-full max-w-md">

          <Button href="#offer" variant="primary" size="lg" className="w-full">
            Choose Your Path
          </Button>

          <Button
            onClick={onContactClick}
            variant="ghost"
            size="lg"
            className="w-full"
          >
            Talk to Martin
          </Button>

        </div>

        {/* SUBTEXT */}
        <p className="text-sm text-white/50 max-w-xl">
          If you're still unsure, a short conversation will make the next step obvious.
        </p>

      </div>

    </section>
  );
}