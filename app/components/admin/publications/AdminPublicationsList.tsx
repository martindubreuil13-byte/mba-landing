"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AdminPublication } from "@/app/lib/publications/types";
import { adminFetch } from "./api";

export default function AdminPublicationsList({ initial }: { initial: AdminPublication[] }) {
  const router = useRouter();
  const [items, setItems] = React.useState(initial);
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<{ text: string; stale?: boolean } | null>(null);

  React.useEffect(() => setItems(initial), [initial]);

  const move = async (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (busy || target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setBusy(true);
    setMessage(null);
    const result = await adminFetch("/api/admin/publications/reorder", {
      method: "POST",
      json: { expected: items.map((i) => i.id), order: next.map((i) => i.id) },
    });
    if (!result.ok) {
      setMessage({ text: result.error, stale: result.code === "stale_list" });
    } else {
      setItems(next);
      router.refresh();
    }
    setBusy(false);
  };

  if (items.length === 0) {
    return <p className="text-sm text-[#1a1816]/60">No publications yet. Add the first one.</p>;
  }

  return (
    <div>
      {message && (
        <div className="mb-6 border border-[#6b1f1f]/30 bg-white p-4 text-sm text-[#6b1f1f]" role="alert">
          {message.text}{" "}
          {message.stale && (
            <button type="button" onClick={() => router.refresh()} className="underline underline-offset-2 font-semibold">
              Reload the list
            </button>
          )}
        </div>
      )}
      <p className="mb-4 max-w-2xl text-xs text-[#1a1816]/55">
        This order is the public catalogue order. Drafts keep their place and appear there once published. Exactly one published title can be
        featured on the homepage.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#1a1816]/15 text-xs uppercase tracking-widest text-[#1a1816]/55">
              <th scope="col" className="py-3 pr-4 font-medium">Order</th>
              <th scope="col" className="py-3 pr-4 font-medium">Title</th>
              <th scope="col" className="py-3 pr-4 font-medium">Status</th>
              <th scope="col" className="py-3 pr-4 font-medium">Availability</th>
              <th scope="col" className="py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p, index) => (
              <tr key={p.id} className="border-b border-[#1a1816]/10 align-top">
                <td className="py-4 pr-4 whitespace-nowrap">
                  <span className="mr-2 text-[#1a1816]/50">{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={busy || index === 0}
                    aria-label={`Move “${p.title}” up`}
                    className="px-2 py-1 border border-[#1a1816]/15 disabled:opacity-30 hover:border-[#6b1f1f]"
                  >
                    ↑
                  </button>{" "}
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={busy || index === items.length - 1}
                    aria-label={`Move “${p.title}” down`}
                    className="px-2 py-1 border border-[#1a1816]/15 disabled:opacity-30 hover:border-[#6b1f1f]"
                  >
                    ↓
                  </button>
                </td>
                <td className="py-4 pr-4">
                  <Link href={`/admin/publications/${p.id}/edit`} className="font-medium text-[#1a1816] hover:text-[#6b1f1f] [overflow-wrap:anywhere]">
                    {p.title}
                  </Link>
                  <div className="mt-1 font-mono text-xs text-[#1a1816]/45">/publications/{p.slug}</div>
                </td>
                <td className="py-4 pr-4 whitespace-nowrap">
                  <span className={p.published ? "text-[#6b1f1f] font-semibold" : "text-[#1a1816]/60"}>{p.published ? "Published" : "Draft"}</span>
                  {p.featured && <span className="ml-2 border border-[#6b1f1f] px-2 py-0.5 text-xs uppercase tracking-widest text-[#6b1f1f]">Featured</span>}
                </td>
                <td className="py-4 pr-4 whitespace-nowrap capitalize">{p.availability}</td>
                <td className="py-4 whitespace-nowrap">
                  <Link href={`/admin/publications/${p.id}/edit`} className="mr-4 underline underline-offset-4 hover:text-[#6b1f1f]">Edit</Link>
                  <Link href={`/admin/publications/${p.id}/preview`} className="underline underline-offset-4 hover:text-[#6b1f1f]">Preview</Link>
                  {p.published && (
                    <Link href={`/publications/${p.slug}`} target="_blank" className="ml-4 underline underline-offset-4 hover:text-[#6b1f1f]">
                      View live
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
