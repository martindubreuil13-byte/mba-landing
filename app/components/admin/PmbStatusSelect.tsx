"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PMB_STATUSES, PMB_STATUS_LABELS, type PmbQuestionStatus } from "@/app/lib/pick-my-brain/constants";

export default function PmbStatusSelect({ id, status }: { id: string; status: PmbQuestionStatus }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const handleChange = async (next: string) => {
    setPending(true);
    try {
      const res = await fetch(`/api/admin/pick-my-brain/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <select
      value={status}
      onChange={(e) => handleChange(e.target.value)}
      disabled={pending}
      className="border border-[#1a1816]/15 px-2 py-1 text-xs disabled:opacity-50"
    >
      {PMB_STATUSES.map((s) => (
        <option key={s} value={s}>
          {PMB_STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}
