/* eslint-disable react/no-unescaped-entities */
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

type Result = { href: string; type: string; title: string; description: string };

type State =
  | { status: "idle" }
  | { status: "searching" }
  | { status: "results"; results: Result[] }
  | { status: "nomatch" }
  | { status: "error"; message: string };

type AskState = "closed" | "open" | "sending" | "sent";

const INITIAL_RESULTS = 3;

// Private or utility pages where a site-wide discovery prompt doesn't belong.
const EXCLUDED_PREFIXES = ["/admin", "/contact", "/resources/business-idea-reality-check/result"];

const INPUT_CLASS =
  "w-full mt-2 border-b-2 border-[#1a1816]/20 bg-transparent text-lg leading-relaxed text-[#1a1816] placeholder-[#1a1816]/30 focus:outline-none focus:border-[#6b1f1f] py-2 transition";
const LABEL_CLASS = "text-sm tracking-widest uppercase text-[#1a1816]/50 font-medium";
const ACTION_CLASS =
  "text-sm font-semibold tracking-widest uppercase text-[#6b1f1f] border-b-2 border-[#6b1f1f] pb-1 transition-all hover:border-[#6b1f1f]/60 disabled:opacity-60";

function ctaFor(type: string) {
  return type === "Free Resource" ? "View →" : "Read →";
}

export default function PickMyBrain() {
  const pathname = usePathname();
  const [query, setQuery] = React.useState("");
  const [lastQuery, setLastQuery] = React.useState("");
  const [searchId, setSearchId] = React.useState<string | null>(null);
  const [state, setState] = React.useState<State>({ status: "idle" });
  const [showAll, setShowAll] = React.useState(false);

  const [ask, setAsk] = React.useState<AskState>("closed");
  const [question, setQuestion] = React.useState("");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [askErrors, setAskErrors] = React.useState<Record<string, string>>({});
  const [askError, setAskError] = React.useState("");

  const inputRef = React.useRef<HTMLInputElement>(null);

  // A new page is a new context: start clean rather than carrying over the
  // previous page's search.
  React.useEffect(() => {
    setQuery("");
    setLastQuery("");
    setSearchId(null);
    setState({ status: "idle" });
    setAsk("closed");
  }, [pathname]);

  if (EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  const runSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.replace(/\s+/g, " ").trim();
    if (trimmed.length < 2) {
      inputRef.current?.focus();
      return;
    }
    // Same question again, answer already on screen: nothing new to fetch.
    if (trimmed.toLowerCase() === lastQuery.toLowerCase() && (state.status === "results" || state.status === "nomatch")) {
      return;
    }

    // On phones, drop the keyboard so the results are actually visible.
    inputRef.current?.blur();
    setState({ status: "searching" });
    setShowAll(false);
    setAsk("closed");
    setAskErrors({});
    setAskError("");

    try {
      const res = await fetch("/api/pick-my-brain/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, pagePath: pathname }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({ status: "error", message: data.error || "Something went wrong. Try again." });
        return;
      }
      setLastQuery(trimmed);
      setSearchId(data.searchId ?? null);
      setQuestion(trimmed);
      setState(data.matched ? { status: "results", results: data.results } : { status: "nomatch" });
    } catch {
      setState({ status: "error", message: "Something went wrong. Try again." });
    }
  };

  const trackClick = (href: string) => {
    if (!searchId) return;
    const payload = JSON.stringify({ searchId, href });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/pick-my-brain/click", payload);
    else fetch("/api/pick-my-brain/click", { method: "POST", body: payload, keepalive: true }).catch(() => {});
  };

  const openAsk = () => {
    setQuestion(lastQuery || query);
    setAsk("open");
  };

  const submitAsk = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const honeypot = (e.currentTarget.elements.namedItem("website") as HTMLInputElement | null)?.value ?? "";
    setAsk("sending");
    setAskErrors({});
    setAskError("");
    try {
      const res = await fetch("/api/pick-my-brain/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, name, email, searchId, pagePath: pathname, website: honeypot }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAskErrors(data.fieldErrors ?? {});
        setAskError(data.fieldErrors ? "" : data.error || "Something went wrong. Please try again.");
        setAsk("open");
        return;
      }
      setAsk("sent");
    } catch {
      setAskError("Something went wrong. Please try again.");
      setAsk("open");
    }
  };

  const results = state.status === "results" ? state.results : [];
  const visible = showAll ? results : results.slice(0, INITIAL_RESULTS);
  const hidden = results.length - visible.length;

  return (
    <section
      aria-labelledby="pick-my-brain-heading"
      className="w-full bg-[#f5f1ed] text-[#1a1816] border-t border-[#1a1816]/8 px-6 md:px-12 lg:px-16 pt-20 pb-20 md:pt-24 md:pb-28"
    >
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl">
          <h2 id="pick-my-brain-heading" className="text-4xl md:text-5xl font-light leading-tight tracking-tight">
            PICK MY BRAIN.
          </h2>
          <p className="mt-6 text-lg md:text-xl leading-relaxed text-[#1a1816]/70">
            I've written about a lot of what goes into starting and building a business. The answer may already be
            here. If it isn't, challenge accepted.
          </p>

          <form role="search" onSubmit={runSearch} className="mt-12 md:mt-14">
            <label htmlFor="pick-my-brain-query" className="sr-only">
              Ask a question or type a topic
            </label>
            <div className="flex items-end gap-4 border-b-2 border-[#1a1816]/20 focus-within:border-[#6b1f1f] transition">
              <input
                ref={inputRef}
                id="pick-my-brain-query"
                type="search"
                enterKeyHint="search"
                autoComplete="off"
                maxLength={200}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a question or type a topic…"
                className="flex-1 min-w-0 bg-transparent text-xl md:text-2xl font-light leading-relaxed text-[#1a1816] placeholder-[#1a1816]/30 focus:outline-none py-3 [&::-webkit-search-cancel-button]:hidden"
              />
              <button
                type="submit"
                aria-label="Search"
                disabled={state.status === "searching"}
                className="shrink-0 pb-3 text-2xl md:text-3xl font-light text-[#6b1f1f] transition-transform hover:translate-x-0.5 disabled:opacity-40"
              >
                →
              </button>
            </div>
          </form>

          <div aria-live="polite" className="mt-12">
            <AnimatePresence mode="wait">
              {state.status === "searching" && (
                <motion.p
                  key="searching"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm tracking-widest uppercase text-[#1a1816]/40"
                >
                  Looking…
                </motion.p>
              )}

              {state.status === "error" && (
                <motion.p key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-[#6b1f1f]">
                  {state.message}
                </motion.p>
              )}

              {state.status === "results" && (
                <motion.div
                  key={`results-${lastQuery}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <ul className="border-t border-[#1a1816]/10">
                    {visible.map((result) => (
                      <li key={result.href} className="border-b border-[#1a1816]/10">
                        <Link href={result.href} onClick={() => trackClick(result.href)} className="group block py-7 md:py-8">
                          <p className="text-xs tracking-widest uppercase text-[#6b1f1f] font-semibold">{result.type}</p>
                          <h3 className="mt-3 text-xl md:text-2xl font-light leading-snug text-[#1a1816] group-hover:text-[#6b1f1f] transition-colors">
                            {result.title}
                          </h3>
                          <p className="mt-2 text-sm md:text-base text-[#1a1816]/65 leading-relaxed">{result.description}</p>
                          <span className="inline-block mt-4 text-xs font-semibold tracking-widest uppercase text-[#6b1f1f] border-b border-[#6b1f1f] pb-0.5">
                            {ctaFor(result.type)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 flex flex-wrap items-baseline gap-x-8 gap-y-4">
                    {hidden > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowAll(true)}
                        className="text-xs font-semibold tracking-widest uppercase text-[#1a1816]/60 border-b border-[#1a1816]/30 pb-0.5 hover:text-[#1a1816] hover:border-[#1a1816]/60 transition"
                      >
                        {hidden} more
                      </button>
                    )}
                    {ask === "closed" && (
                      <p className="text-sm text-[#1a1816]/55">
                        Not quite it?{" "}
                        <button
                          type="button"
                          onClick={openAsk}
                          className="text-[#6b1f1f] border-b border-[#6b1f1f] hover:text-[#6b1f1f]/80 transition-colors"
                        >
                          Ask Martin
                        </button>
                        .
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {state.status === "nomatch" && (
                <motion.div
                  key={`nomatch-${lastQuery}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="border-t border-[#1a1816]/10 pt-10"
                >
                  <p className="text-3xl md:text-4xl font-light leading-tight tracking-tight">YOU GOT ME.</p>
                  <p className="mt-5 text-lg leading-relaxed text-[#1a1816]/70">
                    I haven't written about that yet. Challenge accepted.
                  </p>
                  {ask === "closed" && (
                    <button type="button" onClick={openAsk} className={`mt-8 ${ACTION_CLASS}`}>
                      Ask Martin →
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {(ask === "open" || ask === "sending") && (
                <motion.form
                  key="ask"
                  onSubmit={submitAsk}
                  noValidate
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mt-12 space-y-8"
                >
                  <p className="text-base text-[#1a1816]/65 leading-relaxed">
                    Send it my way. It may become one of the next questions I answer.
                  </p>

                  {/* Honeypot — hidden from real visitors */}
                  <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
                    <label htmlFor="pmb-website">Website</label>
                    <input id="pmb-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
                  </div>

                  <div>
                    <label htmlFor="pmb-question" className={LABEL_CLASS}>
                      Question
                    </label>
                    <textarea
                      id="pmb-question"
                      rows={3}
                      maxLength={1000}
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      className={`${INPUT_CLASS} resize-none`}
                      disabled={ask === "sending"}
                    />
                    {askErrors.question && <p className="text-sm text-[#6b1f1f] mt-1">{askErrors.question}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label htmlFor="pmb-name" className={LABEL_CLASS}>
                        Name
                      </label>
                      <input
                        id="pmb-name"
                        type="text"
                        autoComplete="name"
                        maxLength={100}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={INPUT_CLASS}
                        disabled={ask === "sending"}
                      />
                      {askErrors.name && <p className="text-sm text-[#6b1f1f] mt-1">{askErrors.name}</p>}
                    </div>
                    <div>
                      <label htmlFor="pmb-email" className={LABEL_CLASS}>
                        Email
                      </label>
                      <input
                        id="pmb-email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        maxLength={200}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={INPUT_CLASS}
                        disabled={ask === "sending"}
                      />
                      {askErrors.email && <p className="text-sm text-[#6b1f1f] mt-1">{askErrors.email}</p>}
                    </div>
                  </div>

                  {askError && <p className="text-sm text-[#6b1f1f]">{askError}</p>}

                  <div className="flex flex-wrap items-baseline gap-x-8 gap-y-4 pt-2">
                    <button type="submit" disabled={ask === "sending"} className={ACTION_CLASS}>
                      {ask === "sending" ? "Sending…" : "Send it →"}
                    </button>
                    <p className="text-xs text-[#1a1816]/45">
                      Used only for this question. See{" "}
                      <Link href="/privacy" className="underline hover:text-[#1a1816]/70">
                        privacy
                      </Link>
                      .
                    </p>
                  </div>
                </motion.form>
              )}

              {ask === "sent" && (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mt-12"
                >
                  <p className="text-2xl md:text-3xl font-light tracking-tight">GOT IT.</p>
                  <p className="mt-4 text-base text-[#1a1816]/65 leading-relaxed">
                    It's on the list of questions worth answering.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
