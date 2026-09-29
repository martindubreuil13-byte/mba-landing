/** Framework-agnostic constants shared by server queries and client components — no "server-only" here. */

export const PMB_STATUSES = ["new", "reviewing", "planned", "answered", "archived"] as const;
export type PmbQuestionStatus = (typeof PMB_STATUSES)[number];
export const PMB_STATUS_LABELS: Record<PmbQuestionStatus, string> = {
  new: "New",
  reviewing: "Reviewing",
  planned: "Planned",
  answered: "Answered",
  archived: "Archived",
};
