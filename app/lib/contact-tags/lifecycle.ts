export const lifecycleLabels = {
  new: "New Lead", qualified: "Qualified", prospect: "Active Prospect", client: "Client", inactive: "Inactive",
} as const;

export function isLifecycle(value: unknown): value is keyof typeof lifecycleLabels {
  return typeof value === "string" && Object.hasOwn(lifecycleLabels, value);
}

export function lifecycleLabel(value: unknown, historical?: string) {
  return isLifecycle(value) ? lifecycleLabels[value] : ({
    qualified: "Qualified", engaged: "Engaged", contacted: "Contacted", converted: "Converted", archived: "Archived",
  } as Record<string, string>)[historical ?? ""] ?? "Unclassified";
}
