import { afterEach, expect, it, vi } from "vitest";
const rpc = vi.hoisted(() => vi.fn());
vi.mock("server-only", () => ({}));
vi.mock("@/app/lib/supabase/service", () => ({ getServiceClient: () => ({ rpc }) }));
vi.mock("@/app/lib/leads/consent", () => ({ applyOptOut: vi.fn() }));
import { createUnsubscribeToken } from "@/app/lib/napkin/unsubscribe";
import { POST } from "./route";

afterEach(() => vi.unstubAllEnvs());

it("suppresses a signed campaign recipient via the page or one-click endpoint and refuses tampering", async () => {
  vi.stubEnv("NAPKIN_UNSUBSCRIBE_SECRET", "fixture");
  rpc.mockResolvedValue({ data: true });
  const id = "8ab4b9aa-e272-48d6-8861-b25198fa7b12";
  const token = createUnsubscribeToken(id, true);
  const url = "https://modernbusinessarchitect.com/api/unsubscribe";
  expect((await POST(new Request(url + "?token=" + token + "bad", { method: "POST" }))).status).toBe(400);
  expect(rpc).not.toHaveBeenCalled();
  expect((await POST(new Request(url, { method: "POST", body: JSON.stringify({ token }) }))).status).toBe(200);
  expect((await POST(new Request(url + "?token=" + token, { method: "POST", body: "List-Unsubscribe=One-Click" }))).status).toBe(200);
  expect(rpc).toHaveBeenCalledTimes(2);
  expect(rpc).toHaveBeenCalledWith("suppress_newsletter_recipient", { recipient_id: id });
});
