"use client";
export default function ErrorState({ reset }: { error: Error; reset: () => void }) {
  return <div className="min-h-screen bg-[#f5f1ed] p-10"><h1 className="text-2xl font-light">Napkin Principle</h1><p className="mt-4 text-[#6b1f1f]">The submissions could not be loaded.</p><button onClick={reset} className="mt-4 underline">Try again</button></div>;
}

