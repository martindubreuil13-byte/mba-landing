"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ResourceWithRequestCount } from "@/app/lib/resources/queries";
import { resourceStatus, RESOURCE_STATUS_LABELS, type ResourceStatus } from "@/app/lib/resources/types";

const STATUS_FILTERS: (ResourceStatus | "all")[] = ["all", "draft", "published", "archived"];

const STATUS_COLOR: Record<ResourceStatus, string> = {
  published: "text-green-700",
  draft: "text-[#1a1816]/50",
  archived: "text-[#6b1f1f]",
};

export default function AdminResourcesTable({
  resources,
}: {
  resources: ResourceWithRequestCount[];
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<ResourceStatus | "all">("all");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const patchResource = async (id: string, patch: Record<string, boolean>) => {
    setPendingId(id);
    try {
      const res = await fetch(`/api/admin/resources/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
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

  const visible = resources.filter((r) => statusFilter === "all" || resourceStatus(r) === statusFilter);
  const counts = {
    all: resources.length,
    draft: resources.filter((r) => resourceStatus(r) === "draft").length,
    published: resources.filter((r) => resourceStatus(r) === "published").length,
    archived: resources.filter((r) => resourceStatus(r) === "archived").length,
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`text-xs tracking-widest uppercase px-3 py-2 border ${
              statusFilter === s
                ? "border-[#6b1f1f] text-[#6b1f1f] bg-[#6b1f1f]/5"
                : "border-[#1a1816]/15 text-[#1a1816]/60 hover:border-[#1a1816]/30"
            }`}
          >
            {s === "all" ? "All" : RESOURCE_STATUS_LABELS[s]} ({counts[s]})
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-[#1a1816]/60">No resources match this filter.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[820px]">
            <thead>
              <tr className="text-left border-b border-[#1a1816]/15 text-[#1a1816]/50 uppercase text-xs tracking-widest">
                <th className="py-3 pr-4">Title</th>
                <th className="py-3 pr-4">Type</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Requests</th>
                <th className="py-3 pr-4">Unique leads</th>
                <th className="py-3 pr-4">Last updated</th>
                <th className="py-3 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => {
                const status = resourceStatus(r);
                const expanded = expandedId === r.id;
                return (
                  <React.Fragment key={r.id}>
                    <tr className="border-b border-[#1a1816]/8 align-top">
                      <td className="py-3 pr-4">
                        <button
                          onClick={() => setExpandedId(expanded ? null : r.id)}
                          className="text-left hover:text-[#6b1f1f]"
                        >
                          {r.title}
                        </button>
                      </td>
                      <td className="py-3 pr-4 text-[#1a1816]/70">{r.resource_type}</td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs uppercase tracking-wide ${STATUS_COLOR[status]}`}>
                          {RESOURCE_STATUS_LABELS[status]}
                        </span>
                      </td>
                      <td className="py-3 pr-4">{r.request_count}</td>
                      <td className="py-3 pr-4">{r.unique_leads_count}</td>
                      <td className="py-3 pr-4 text-[#1a1816]/60 whitespace-nowrap">
                        {new Date(r.updated_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-4 whitespace-nowrap">
                          {status === "archived" ? (
                            <button
                              onClick={() => patchResource(r.id, { archived: false })}
                              disabled={pendingId === r.id}
                              className="text-[#6b1f1f] hover:underline disabled:opacity-50"
                            >
                              Restore
                            </button>
                          ) : (
                            <>
                              <Link href={`/admin/resources/${r.id}/edit`} className="text-[#6b1f1f] hover:underline">
                                Edit
                              </Link>
                              <button
                                onClick={() => patchResource(r.id, { published: !r.published })}
                                disabled={pendingId === r.id}
                                className="text-[#1a1816]/60 hover:text-[#1a1816] disabled:opacity-50"
                              >
                                {r.published ? "Unpublish" : "Publish"}
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Archive "${r.title}"? It will be hidden from the site and become read-only. Nothing is deleted.`)) {
                                    patchResource(r.id, { archived: true });
                                  }
                                }}
                                disabled={pendingId === r.id}
                                className="text-[#1a1816]/40 hover:text-[#6b1f1f] disabled:opacity-50"
                              >
                                Archive
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="border-b border-[#1a1816]/8 bg-[#faf8f6]">
                        <td colSpan={7} className="py-5 px-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-xs">
                            <div>
                              <p className="uppercase tracking-widest text-[#1a1816]/40 mb-1">Slug</p>
                              <p className="text-[#1a1816]/80">/resources/{r.slug}</p>
                            </div>
                            <div>
                              <p className="uppercase tracking-widest text-[#1a1816]/40 mb-1">Audience</p>
                              <p className="text-[#1a1816]/80">{r.audience || "—"}</p>
                            </div>
                            <div>
                              <p className="uppercase tracking-widest text-[#1a1816]/40 mb-1">File</p>
                              <p className="text-[#1a1816]/80 break-all">{r.file_name}</p>
                            </div>
                            <div>
                              <p className="uppercase tracking-widest text-[#1a1816]/40 mb-1">Created</p>
                              <p className="text-[#1a1816]/80">{new Date(r.created_at).toLocaleDateString()}</p>
                            </div>
                            {r.short_description && (
                              <div className="sm:col-span-2 md:col-span-4">
                                <p className="uppercase tracking-widest text-[#1a1816]/40 mb-1">Short description</p>
                                <p className="text-[#1a1816]/80">{r.short_description}</p>
                              </div>
                            )}
                          </div>
                          <a
                            href={`/resources/${r.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block mt-4 text-xs uppercase tracking-widest text-[#6b1f1f] underline"
                          >
                            View public page →
                          </a>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
