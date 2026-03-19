import { GlassCard } from "@/app/components/ui/GlassCard";

const questions = [
  "What is your team doing today that won’t still matter in 6 months?",
  "How much runway are you burning while you’re still figuring out what to build?",
  "If you could see the exact next move that saves time and money, would you take it?",
];

export function ReflectionSection() {
  return (
    <section className="relative px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <GlassCard className="p-10 text-center">
          <h2 className="text-2xl font-semibold text-white md:text-3xl">
            Ask yourself
          </h2>
          <div className="mt-8 space-y-4 text-left text-white/70">
            {questions.map((question) => (
              <p key={question} className="text-lg">
                <span className="font-semibold text-white">•</span> {question}
              </p>
            ))}
          </div>
        </GlassCard>
      </div>
    </section>
  );
}
