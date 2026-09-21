import "server-only";
import OpenAI from "openai";

/**
 * Privileged, server-only OpenAI client. Never import this from a Client
 * Component — mirrors the guard pattern used by getServiceClient() for
 * Supabase. Used only for (a) classifying the assessment's four open
 * answers into the master spec's rubric levels, and (b) writing the
 * participant-facing interpretation prose from already-computed
 * deterministic facts. It never determines a score.
 */
export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI is not configured: set OPENAI_API_KEY.");
  }
  return new OpenAI({ apiKey });
}

// Defaults updated 2026-09-21 after a live 7-scenario comparison against
// gpt-4o-mini/gpt-4o (rubric compliance, scoring stability, latency,
// interpretation quality — see session notes). Override via env vars
// without touching this file.
export const CLASSIFY_MODEL = process.env.OPENAI_CLASSIFY_MODEL || "gpt-5.4-mini";
export const INTERPRET_MODEL = process.env.OPENAI_INTERPRET_MODEL || "gpt-5.4";
