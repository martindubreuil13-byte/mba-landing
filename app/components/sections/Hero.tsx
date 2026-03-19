import { Button } from "@/app/components/ui/Button";

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-6 py-24">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-28 -top-28 h-80 w-80 rounded-full bg-gradient-to-br from-cyan-400/35 via-indigo-400/15 to-transparent blur-3xl" />
        <div className="absolute -right-28 top-1/2 h-96 w-96 rounded-full bg-gradient-to-tr from-emerald-400/30 via-sky-400/10 to-transparent blur-3xl" />
        <div className="absolute left-1/2 top-24 h-96 w-96 -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-300/15 via-fuchsia-300/10 to-transparent blur-3xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-6xl flex-col items-start gap-10">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1 text-sm font-semibold tracking-wide text-white/70 ring-1 ring-white/10 animate-fadeUp">
          Premium business architecture for visionary founders
        </p>
        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white md:text-6xl animate-fadeUp">
          <span className="block">You don’t need another idea.</span>
          <span className="block bg-gradient-to-r from-cyan-200 via-sky-100 to-indigo-200 bg-clip-text text-transparent">
            You need architecture.
          </span>
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-white/70 md:text-xl animate-fadeUp">
          Turn what’s in your head into something that actually works. Build clarity, confidence,
          and momentum with a premium framework that aligns strategy, story, and execution.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row animate-fadeUp">
          <Button href="#offer" variant="primary" size="lg">
            Start Building
          </Button>
          <Button href="#framework" variant="secondary" size="lg">
            See the Framework
          </Button>
        </div>
      </div>
    </section>
  );
}
