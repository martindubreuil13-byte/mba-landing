"use client";
import { useCallback, useState } from "react";

type Toast = { id: number; text: string; tone: "ok" | "error" };

/** Small, dependency-free toasts so every prototype action visibly does something. */
export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((text: string, tone: Toast["tone"] = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5200);
  }, []);
  const node = (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 z-[70] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div key={t.id} role={t.tone === "error" ? "alert" : "status"} className={`pointer-events-auto max-w-md px-5 py-3 text-sm shadow-[0_10px_30px_-12px_rgba(26,24,22,.45)] ${t.tone === "error" ? "border border-[#8b2525]/40 bg-[#f5f1ed] text-[#8b2525]" : "bg-[#1a1816] text-[#f5f1ed]"}`}>{t.text}</div>
      ))}
    </div>
  );
  return { push, node };
}

export async function postJson(path: string, body?: unknown, method = "POST"): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  try {
    const r = await fetch(path, { method, headers: { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
    const data = await r.json().catch(() => ({}));
    return { ok: r.ok, data };
  } catch { return { ok: false, data: { error: "Could not reach the server." } }; }
}
