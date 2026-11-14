export function marketingEligibility(lead: {
  ongoing_content_opt_in: boolean; ongoing_content_opt_in_at: string | null;
  ongoing_content_opt_out_at: string | null; suppressed_at: string | null;
}, evidence: { action: string; created_at: string; wording_version: string | null; wording_text: string | null }[]) {
  const latest = evidence.find((row) => row.action === "opt_in" || row.action === "opt_out");
  if (lead.suppressed_at) return { state: "Not eligible", reason: "Suppressed" } as const;
  if (lead.ongoing_content_opt_out_at || latest?.action === "opt_out") {
    return lead.ongoing_content_opt_in
      ? { state: "Unknown", reason: "Opt-in conflicts with an unsubscribe record" } as const
      : { state: "Not eligible", reason: "Unsubscribed" } as const;
  }
  if (!lead.ongoing_content_opt_in) return latest?.action === "opt_in"
    ? { state: "Unknown", reason: "Opt-in evidence conflicts with subscription status" } as const
    : { state: "Not eligible", reason: "No verified permission" } as const;
  if (!lead.ongoing_content_opt_in_at || latest?.action !== "opt_in" || !latest.wording_version || !latest.wording_text?.trim() ||
      Date.parse(latest.created_at) !== Date.parse(lead.ongoing_content_opt_in_at)) {
    return { state: "Unknown", reason: "Incomplete consent evidence" } as const;
  }
  return { state: "Eligible", reason: "Recorded marketing opt-in" } as const;
}
