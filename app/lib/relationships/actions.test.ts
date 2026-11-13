import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTask, reviewInquiry, setTaskCompletion } from "./actions";

const mocks = vi.hoisted(() => {
  const result = { error: null, data: { id: "matched" } };
  const query = {
    update: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result), maybeSingle: vi.fn().mockResolvedValue(result),
    upsert: vi.fn().mockResolvedValue(result), is: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
  };
  return { admin: vi.fn(), db: vi.fn(() => ({ from: vi.fn(() => query) })), query };
});

vi.mock("@/app/lib/supabase/admin-session", () => ({ requireAdmin: mocks.admin }));
vi.mock("@/app/lib/supabase/service", () => ({ getServiceClient: mocks.db }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const id = "a1234567-1234-1234-1234-123456789abc";
const lead = "b1234567-1234-1234-1234-123456789abc";

function form(fields: Record<string, string>) {
  const result = new FormData();
  for (const [key, value] of Object.entries(fields)) result.set(key, value);
  return result;
}

describe("relationship mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.admin.mockResolvedValue({ id: lead });
  });

  it("guards every write before accessing the privileged client", async () => {
    mocks.admin.mockRejectedValue(new Error("Unauthorized"));
    for (const action of [reviewInquiry, createTask, setTaskCompletion]) {
      await expect(action(new FormData())).rejects.toThrow("Unauthorized");
    }
    expect(mocks.db).not.toHaveBeenCalled();
  });

  it("updates review state independently of delivery and booking", async () => {
    await expect(reviewInquiry(form({ id, state: "follow_up" }))).resolves.toBeNull();
    expect(mocks.query.update).toHaveBeenCalledWith({ review_state: "follow_up" });
    await expect(reviewInquiry(form({ id, state: "booked" }))).resolves.toMatch(/Invalid/);
  });

  it("returns user-facing server feedback without exposing database errors", async () => {
    mocks.query.single.mockResolvedValueOnce({ data: null, error: { message: "private database detail" } });
    await expect(reviewInquiry(form({ id, state: "reviewed" }))).resolves.toBe("Inquiry review could not be saved.");
  });

  it("rejects an inquiry belonging to another contact", async () => {
    mocks.query.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    await expect(createTask(form({ id, lead, inquiry: id, description: "Call back" }))).resolves.toMatch(/belonging/);
    expect(mocks.query.upsert).not.toHaveBeenCalled();
  });

  it("does not report success when the task no longer exists", async () => {
    mocks.query.maybeSingle.mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: null });
    await expect(setTaskCompletion(form({ id, lead, operation: "complete" }))).resolves.toMatch(/unavailable/);
  });

  it("creates a retry-safe task and guards completion and reopen by state", async () => {
    await createTask(form({ id, lead, description: "Call back" }));
    expect(mocks.query.upsert).toHaveBeenCalledWith(expect.objectContaining({ id, lead_id: lead }), { onConflict: "id", ignoreDuplicates: true });
    await setTaskCompletion(form({ id, lead, operation: "complete" }));
    expect(mocks.query.is).toHaveBeenCalledWith("completed_at", null);
    await setTaskCompletion(form({ id, lead, operation: "reopen" }));
    expect(mocks.query.not).toHaveBeenCalledWith("completed_at", "is", null);
  });
});
