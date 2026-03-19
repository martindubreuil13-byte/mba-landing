import { Button } from "@/app/components/ui/Button";

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-6 py-24">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-28 -top-28 h-80 w-80 rounded-full bg-gradient-to-br from-cyan-400/35 via-indigo-400/15 to-transparent blur-3xl" />
        <div className="absolute -right-28 top-1/2 h-96 w-96 rounded-full bg-gradient-to-tr from-emerald-400/30 via-sky-400/10 to-transparent blur-3xl" />
        <div className="absolute left-1/2 top-24 h-96 w-96 -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-300/15 via-fuchsia-300/10 to-transparent blur-3xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-7xl mx-auto flex-col items-center gap-16">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1 text-sm font-semibold tracking-wide text-white/70 ring-1 ring-white/10 animate-fadeUp">
          Most founders don’t fail because of bad ideas.
        </p>
        <h1 className="text-6xl font-bold leading-tight tracking-tight text-white md:text-8xl animate-fadeUp">
          <span className="block">You don’t need another idea.</span>
          <span className="block bg-gradient-to-r from-cyan-200 via-sky-100 to-indigo-200 bg-clip-text text-transparent">
            You need something that actually works.
          </span>
        </h1>
        <p className="max-w-3xl text-xl leading-relaxed text-white/80 md:text-2xl animate-fadeUp">
          Most people don’t fail because they lack intelligence or ambition.
          <br />
          They fail because nothing they build is structured to hold.
          <br />
          So they start, stop, rethink… and stay in the same place.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row animate-fadeUp">
          <Button href="#offer" variant="primary" size="lg" className="text-lg px-8 py-4">
            Build Something That Works
          </Button>
          <Button href="#framework" variant="secondary" size="lg" className="text-lg px-8 py-4">
            See How It Works
          </Button>
        </div>

        {/* About Martin Section */}
        <div className="w-full max-w-7xl animate-fadeUp">
          <div className="relative overflow-hidden glass rounded-3xl">
            {/* Background Image with Gradient Fade */}
            <div className="absolute inset-0">
              <img
                src="/images/martin-profile.jpg"
                alt="Martin - The Modern Business Architect"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-2/3 h-full object-contain opacity-60"
                onError={(e) => {
                  // Fallback to placeholder if image doesn't exist
                  e.currentTarget.style.display = 'none';
                  if (e.currentTarget.nextElementSibling) {
                    (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                  }
                }}
              />
              {/* Fallback placeholder */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2/3 h-full bg-gradient-to-br from-cyan-400/20 to-indigo-400/20 flex items-center justify-center" style={{ display: 'none' }}>
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-400 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">MBA</span>
                </div>
              </div>
              {/* Subtle gradient overlay - only on left half */}
              <div className="absolute left-0 top-0 w-1/2 h-full bg-gradient-to-r from-slate-900/40 via-slate-900/20 to-transparent" />
              {/* Face highlight for better visibility */}
              <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-1/3 h-1/2 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-full blur-sm" />
            </div>

            {/* Content */}
            <div className="relative z-10 p-8 md:p-16">
              <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
                {/* Spacer for mobile - image is background */}
                <div className="md:w-1/2 md:invisible md:h-0"></div>

                {/* Text Content */}
                <div className="md:w-2/5 text-center md:text-left">
                  <div className="relative">
                    {/* Subtle glow behind text */}
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 via-indigo-400/5 to-transparent rounded-2xl blur-xl" />
                    <div className="relative glass rounded-2xl p-6 md:p-8 shadow-2xl shadow-black/20 border border-white/5">
                      <h3 className="text-2xl md:text-3xl font-bold text-white mb-6">
                        Martin — The Modern Business Architect
                      </h3>
                      <div className="space-y-4 text-lg text-white/90 leading-relaxed">
                        <p>
                          I've spent decades watching the same pattern repeat.
                        </p>
                        <p>
                          Smart people.<br />
                          Good ideas.<br />
                          And nothing that actually holds.
                        </p>
                        <p>
                          Not because they lack talent.
                        </p>
                        <p>
                          Because what they're building isn't structured to work.
                        </p>
                        <p>
                          I've worked across industries, countries, and business stages.
                        </p>
                        <p>
                          The problem is always the same:
                        </p>
                        <p className="font-semibold text-white">
                          Execution without architecture.
                        </p>
                        <p>
                          That's why I don't coach ideas.
                        </p>
                        <p className="font-semibold text-white">
                          I design businesses that can actually stand.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
