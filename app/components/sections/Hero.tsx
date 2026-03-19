import { Button } from "@/app/components/ui/Button";

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-6 py-24">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-28 -top-28 h-80 w-80 rounded-full bg-gradient-to-br from-cyan-400/35 via-indigo-400/15 to-transparent blur-3xl" />
        <div className="absolute -right-28 top-1/2 h-96 w-96 rounded-full bg-gradient-to-tr from-emerald-400/30 via-sky-400/10 to-transparent blur-3xl" />
        <div className="absolute left-1/2 top-24 h-96 w-96 -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-300/15 via-fuchsia-300/10 to-transparent blur-3xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-7xl mx-auto flex-col items-start gap-10">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1 text-sm font-semibold tracking-wide text-white/70 ring-1 ring-white/10 animate-fadeUp">
          Most founders don’t fail because of bad ideas.
        </p>
        <h1 className="text-5xl font-bold leading-tight tracking-tight text-white md:text-7xl animate-fadeUp">
          <span className="block">They fail because nothing is</span>
          <span className="block bg-gradient-to-r from-cyan-200 via-sky-100 to-indigo-200 bg-clip-text text-transparent">
            structured enough to work.
          </span>
        </h1>
        <p className="max-w-3xl text-xl leading-relaxed text-white/80 md:text-2xl animate-fadeUp">
          You don’t need more inspiration. You need something that actually holds.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row animate-fadeUp">
          <Button href="#offer" variant="primary" size="lg" className="text-lg px-8 py-4">
            Build Something That Works
          </Button>
          <Button href="#framework" variant="secondary" size="lg" className="text-lg px-8 py-4">
            See the system
          </Button>
        </div>

        {/* Profile Image Section */}
        <div className="w-full max-w-6xl animate-fadeUp">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-3xl" />
            <div className="relative glass rounded-3xl p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-indigo-400/20 rounded-full blur-xl" />
                  <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden ring-2 ring-white/20">
                    <img
                      src="/images/martin-profile.jpg"
                      alt="Martin - The Modern Business Architect"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to placeholder if image doesn't exist
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.nextElementSibling) {
                          (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                        }
                      }}
                    />
                    {/* Fallback placeholder */}
                    <div className="w-full h-full bg-gradient-to-br from-cyan-400/20 to-indigo-400/20 flex items-center justify-center" style={{ display: 'none' }}>
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-400 flex items-center justify-center">
                        <span className="text-2xl md:text-3xl font-bold text-white">MBA</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    Martin - The Modern Business Architect
                  </h3>
                  <p className="text-lg text-white/80 mb-4">
                    With 30+ years of experience across 10 countries, I've built and scaled businesses
                    from startups to corporations. As a business owner and entrepreneur, I've helped
                    hundreds of founders avoid the costly mistakes that derail most ventures.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    <span className="px-3 py-1 bg-cyan-400/10 text-cyan-300 rounded-full text-sm font-medium">
                      30+ Years Experience
                    </span>
                    <span className="px-3 py-1 bg-indigo-400/10 text-indigo-300 rounded-full text-sm font-medium">
                      10 Countries
                    </span>
                    <span className="px-3 py-1 bg-emerald-400/10 text-emerald-300 rounded-full text-sm font-medium">
                      Business Owner
                    </span>
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
