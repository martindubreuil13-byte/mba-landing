import type { AdminPublication } from "@/app/lib/publications/types";

export type ApiResult =
  | { ok: true; publication?: AdminPublication; previewUrl?: string | null }
  | { ok: false; status: number; code?: string; error: string; fieldErrors?: Record<string, string> };

/** One place for admin calls: JSON in, a typed result out, never a thrown network error. */
export async function adminFetch(url: string, init: { method: string; json?: unknown; form?: FormData }): Promise<ApiResult> {
  try {
    const res = await fetch(url, {
      method: init.method,
      headers: init.json !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: init.form ?? (init.json !== undefined ? JSON.stringify(init.json) : undefined),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, status: res.status, code: data.code, error: data.error ?? "Something went wrong.", fieldErrors: data.fieldErrors };
    }
    return { ok: true, publication: data.publication, previewUrl: data.previewUrl };
  } catch {
    return { ok: false, status: 0, error: "Couldn't reach the server. Check your connection and try again." };
  }
}
