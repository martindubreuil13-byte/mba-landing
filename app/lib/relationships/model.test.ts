import { describe, expect, it } from "vitest";
import { isDateOnly, isReviewState, mailException, taskDateState, workspaceToday } from "./model";

describe("relationship workspace status", () => {
  it("accepts only the four review states", () => {
    for (const state of ["new", "reviewed", "follow_up", "closed"]) expect(isReviewState(state)).toBe(true);
    expect(isReviewState("confirmed")).toBe(false);
    expect(isReviewState("constructor")).toBe(false);
  });

  it("separates overdue, due today, upcoming, and completed work", () => {
    const today = "2026-11-13";
    expect(taskDateState("2026-11-12", null, today)).toBe("Overdue");
    expect(taskDateState(today, null, today)).toBe("Due today");
    expect(taskDateState("2026-11-14", null, today)).toBe("Upcoming");
    expect(taskDateState("2026-11-12", today, today)).toBe("Completed");
    expect(taskDateState(null, null, today)).toBe("No due date");
  });
});

it("uses the business date at the Bangkok midnight boundary", () => {
  const before = new Date("2026-11-12T16:59:59Z");
  const after = new Date("2026-11-12T17:00:00Z");
  expect(workspaceToday("Asia/Bangkok", before)).toBe("2026-11-12");
  expect(workspaceToday("Asia/Bangkok", after)).toBe("2026-11-13");
  expect(taskDateState("2026-11-12", null, workspaceToday("Asia/Bangkok", after))).toBe("Overdue");
  expect(isDateOnly("2026-02-29")).toBe(false);
});

it("separates a queued retry, terminal failure, and explicit successful recovery", () => {
  const attempt = { status: "failed", delivery_status: null, kind: "confirmation" };
  expect(mailException(attempt, false, true)).toBe("Recovering");
  expect(mailException(attempt, false, false)).toBe("Action Required");
  expect(mailException({ ...attempt, status: "accepted", delivery_status: "bounced" }, true, true)).toBe("Action Required");
  expect(mailException({ ...attempt, status: "accepted" }, true, false)).toBe("Resolved");
  expect(mailException({ ...attempt, status: "accepted" }, false, false)).toBeNull();
});
