"use client";

import { useState } from "react";

export default function QualifyPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <main className="min-h-screen bg-[#020617] text-white px-6 md:px-12 lg:px-16 py-20">

      <div className="max-w-2xl mx-auto">

        {/* HEADLINE */}
        <h1 className="text-3xl md:text-4xl font-semibold leading-tight tracking-[-0.02em]">
          This isn’t for everyone.
        </h1>

        {/* SUBTEXT */}
        <p className="mt-6 text-white/70 leading-relaxed">
          If you're serious about turning an idea into something structured,
          executable, and viable — this is where we start.
        </p>

        {/* HOW IT WORKS */}
        <div className="mt-10 text-white/70 text-sm space-y-3">
          <p>• You share your current situation</p>
          <p>• I review and assess if we’re a fit</p>
          <p>• If it makes sense, we move forward</p>
        </div>

        {/* FORM OR SUCCESS */}
        {!submitted ? (
          <form
            className="mt-12 flex flex-col gap-4 border border-white/10 rounded-xl p-6 bg-white/[0.02] backdrop-blur-sm"
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
          >

            <h2 className="text-lg font-semibold">
              Share your situation
            </h2>

            {/* NAME */}
            <input
              type="text"
              placeholder="Your name"
              required
              className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-300"
            />

            {/* EMAIL */}
            <input
              type="email"
              placeholder="Your email"
              required
              className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-300"
            />

            {/* SELECT */}
            <select
              required
              className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-300"
            >
              <option value="">Select your situation</option>
              <option>I have a business idea but no structure</option>
              <option>I started a business but need better structure</option>
              <option>I’m running a business but struggling to move forward</option>
              <option>Other</option>
            </select>

            {/* TEXTAREA */}
            <textarea
              placeholder="Tell me more about your situation"
              rows={4}
              required
              className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-300"
            />

            {/* SUBMIT */}
            <button
              type="submit"
              className="mt-4 bg-cyan-300 text-black font-semibold rounded-lg py-3 hover:bg-cyan-200 transition"
            >
              Submit
            </button>

          </form>
        ) : (
          /* SUCCESS MESSAGE */
          <div className="mt-12 border border-white/10 rounded-xl p-6 bg-white/[0.02] backdrop-blur-sm text-center">

            <h2 className="text-xl font-semibold">
              Got it.
            </h2>

            <p className="mt-4 text-white/70 text-sm leading-relaxed">
              I’ll review your situation and get back to you within 48 hours.
              <br /><br />
              If it makes sense, we’ll schedule a call and take it from there.
            </p>

          </div>
        )}

      </div>
    </main>
  );
}