"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/app/lib/supabase/browser";

export default function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    const supabase = getBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError("Incorrect email or password.");
      setLoading(false);
      return;
    }

    router.push("/admin/resources");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#f5f1ed] text-[#1a1816] flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
        <p className="text-sm font-semibold tracking-widest uppercase text-center">Admin</p>
        <div>
          <label htmlFor="email" className="block text-sm text-[#1a1816]/70 mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-[#1a1816]/15 bg-white px-4 py-3 focus:outline-none focus:border-[#6b1f1f]"
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm text-[#1a1816]/70 mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-[#1a1816]/15 bg-white px-4 py-3 focus:outline-none focus:border-[#6b1f1f]"
            autoComplete="current-password"
          />
        </div>
        {error && <p className="text-sm text-[#6b1f1f]">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full text-sm font-semibold tracking-widest uppercase text-white bg-[#6b1f1f] px-8 py-4 hover:bg-[#6b1f1f]/90 disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
