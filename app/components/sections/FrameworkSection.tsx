"use client";

const steps = [
  {
    title: "Arrival",
    description:
      "Define the outcome before anything moves. What are we building, why does it matter, and what does success actually look like?",
  },
  {
    title: "Architecture",
    description:
      "Reverse engineer the path. Milestones, constraints, and enablers—designed to make progress structured, not accidental.",
    highlight: true,
  },
  {
    title: "Assembly",
    description:
      "Break it down until execution becomes inevitable. Small, precise steps—so progress starts from day one.",
  },
];

export function FrameworkSection() {
  return (
    <section id="framework" className="relative w-full text-white bg-[#020617]">

      <div className="px-6 pt-12 pb-16 md:px-12 lg:px-20">

        {/* HEADER */}
        <div className="max-w-2xl mb-12">

          <p className="text-[11px] uppercase tracking-[0.28em] text-white/35">
            Framework
          </p>

          <h2 className="mt-4 text-3xl md:text-5xl font-semibold leading-[1.05] tracking-[-0.04em]">
            Arrival → Architecture → Assembly
          </h2>

          <p className="mt-6 text-base md:text-lg leading-7 text-white/65 max-w-[520px]">
            Most people start building too early.
            This system forces clarity, structure, and momentum—before effort is wasted.
          </p>

        </div>

        {/* FLOW */}
        <div className="flex flex-col gap-12 max-w-[640px]">

          {steps.map((step, index) => (
            <div key={step.title} className="relative">

              {/* TOP LINE */}
              <div className="mb-4 h-[1px] w-10 bg-cyan-300/60" />

              {/* STEP LABEL */}
              <p className="text-[11px] tracking-[0.2em] uppercase text-white/30 mb-2">
                0{index + 1}
              </p>

              {/* TITLE */}
              <h3
                className={`text-xl md:text-2xl font-semibold ${
                  step.highlight ? "text-white" : "text-white/85"
                }`}
              >
                {step.title}
              </h3>

              {/* DESCRIPTION */}
              <p className="mt-2 text-base leading-relaxed text-white/65">
                {step.description}
              </p>

              {/* FLOW CONNECTOR */}
              {index < steps.length - 1 && (
                <div className="mt-8 text-white/20 text-lg">
                  ↓
                </div>
              )}

            </div>
          ))}

        </div>

      </div>
    </section>
  );
}