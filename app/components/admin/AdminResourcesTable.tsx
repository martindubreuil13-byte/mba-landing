"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ResourceWithRequestCount } from "@/app/lib/resources/queries";

export default function AdminResourcesTable({
  resources,
}: {
  resources: ResourceWithRequestCount[];
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const togglePublished = async (id: string, published: boolean) => {
    setPendingId(id);
    try {
      const res = await fetch(`/api/admin/resources/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !published }),
      });
      if (res.ok) router.refresh();
    } finally {
      setPendingId(null);
    }
  };

  if (resources.length === 0) {
    return (
      <p className="text-[#1a1816]/60">
        No resources yet.{" "}
        <Link href="/admin/resources/new" className="text-[#6b1f1f] underline">
          Add the first one
        </Link>
        .
      </p>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left border-b border-[#1a1816]/15 text-[#1a1816]/50 uppercase text-xs tracking-widest">
          <th className="py-3 pr-4">Title</th>
          <th className="py-3 pr-4">Type</th>
          <th className="py-3 pr-4">Status</th>
          <th className="py-3 pr-4">Requests</th>
          <th className="py-3 pr-4">Created</th>
          <th className="py-3 pr-4"></th>
        </tr>
      </thead>
      <tbody>
        {resources.map((r) => (
          <tr key={r.id} className="border-b border-[#1a1816]/8">
            <td className="py-3 pr-4">
              <Link href={`/resources/${r.slug}`} className="hover:text-[#6b1f1f]" target="_blank">
                {r.title}
              </Link>
            </td>
            <td className="py-3 pr-4 text-[#1a1816]/70">{r.resource_type}</td>
            <td className="py-3 pr-4">
              <span
                className={
                  r.published
                    ? "text-xs uppercase tracking-wide text-green-700"
                    : "text-xs uppercase tracking-wide text-[#1a1816]/40"
                }
              >
                {r.published ? "Published" : "Draft"}
              </span>
            </td>
            <td className="py-3 pr-4">{r.request_count}</td>
            <td className="py-3 pr-4 text-[#1a1816]/60">
              {new Date(r.created_at).toLocaleDateString()}
            </td>
            <td className="py-3 pr-4 flex items-center gap-4">
              <Link href={`/admin/resources/${r.id}/edit`} className="text-[#6b1f1f] hover:underline">
                Edit
              </Link>
              <button
                onClick={() => togglePublished(r.id, r.published)}
                disabled={pendingId === r.id}
                className="text-[#1a1816]/60 hover:text-[#1a1816] disabled:opacity-50"
              >
                {r.published ? "Unpublish" : "Publish"}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
