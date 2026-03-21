"use client";

export default function Proof() {
  return (
    <section className="bg-[#020617] px-6 md:px-12 lg:px-16 mt-16">

      {/* SECTION LABEL */}
      <p className="text-white/30 uppercase text-[11px] tracking-[0.3em] mb-6">
        CONFIRMED IN PRACTICE
      </p>

      {/* GRID */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

        {/* REVIEW 1 */}
        <div className="border border-white/5 rounded-xl p-5 bg-white/[0.015] backdrop-blur-sm">
          <div className="text-cyan-200 text-xs mb-2">★★★★★</div>
          <p className="text-white/90 text-sm leading-relaxed">
            “Thanks to Martin’s approach and creative marketing, my business grew by 25% in just 6 months. He doesn’t just advise—he commits fully to your success.”
          </p>
          <p className="mt-4 text-white/40 text-[11px] tracking-wide">
            — Domenic Pietroforte, Montreal
          </p>
        </div>

        {/* REVIEW 2 */}
        <div className="border border-white/5 rounded-xl p-5 bg-white/[0.015] backdrop-blur-sm">
          <div className="text-cyan-200 text-xs mb-2">★★★★★</div>
          <p className="text-white/90 text-sm leading-relaxed">
            “Martin helped me clarify my direction quickly and focus on what actually mattered. The sessions were clear, grounded, and extremely effective.”
          </p>
          <p className="mt-4 text-white/40 text-[11px] tracking-wide">
            — Abdullahi Yakubu, Nigeria
          </p>
        </div>

        {/* REVIEW 3 */}
        <div className="border border-white/5 rounded-xl p-5 bg-white/[0.015] backdrop-blur-sm">
          <div className="text-cyan-200 text-xs mb-2">★★★★★</div>
          <p className="text-white/90 text-sm leading-relaxed">
            “I trust Martin completely to guide me through complex decisions. His advice is always thoughtful, practical—and exactly what’s needed.”
          </p>
          <p className="mt-4 text-white/40 text-[11px] tracking-wide">
            — Barrie Moss, United Kingdom
          </p>
        </div>

      </div>

      {/* GOOGLE LINK */}
      <div className="mt-8 text-white/40 text-xs">
        Rated 5.0 on Google ·{" "}
        <a
          href="https://share.google/BtvLeooUQuh6stlFq"
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-200 hover:underline"
        >
          Read all reviews
        </a>
      </div>

    </section>
  );
}