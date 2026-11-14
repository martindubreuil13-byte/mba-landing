import sharp from "sharp";
import { beforeEach, expect, it, vi } from "vitest";
import { POST } from "./route";

const mocks = vi.hoisted(() => ({
  admin: vi.fn(),
  upload: vi.fn(),
  from: vi.fn(),
}));
vi.mock("@/app/lib/supabase/admin-session", () => ({ getAdminUser: mocks.admin }));
vi.mock("@/app/lib/supabase/service", () => ({ getServiceClient: () => ({ storage: { from: mocks.from } }) }));

function request(body: Uint8Array<ArrayBuffer>, origin = "https://mba.example") {
  return new Request("https://mba.example/api/admin/email/images", {
    method: "POST", headers: { origin, host: "mba.example" }, body,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.admin.mockResolvedValue({ id: "admin" });
  mocks.upload.mockResolvedValue({ error: null });
  mocks.from.mockReturnValue({ upload: mocks.upload, getPublicUrl: (path: string) => ({ data: { publicUrl: "https://static.example/" + path } }) });
});

it("rejects anonymous, cross-origin, oversized, and unsupported uploads before storage", async () => {
  const invalid = new TextEncoder().encode("<svg/>");
  mocks.admin.mockResolvedValueOnce(null);
  expect((await POST(request(invalid))).status).toBe(401);
  expect((await POST(request(invalid, "https://other.example"))).status).toBe(403);
  expect((await POST(request(new Uint8Array(3 * 1024 * 1024 + 1)))).status).toBe(413);
  expect((await POST(request(invalid))).status).toBe(400);
  expect(mocks.from).not.toHaveBeenCalled();
});

it.each(["jpeg", "png", "webp"] as const)("normalizes %s into an immutable PNG object", async (format) => {
  const data = await sharp({ create: { width: 1300, height: 650, channels: 3, background: "#654321" } }).toFormat(format).toBuffer();
  const result = await POST(request(new Uint8Array(data)));
  expect(result.status).toBe(200);
  expect(mocks.from).toHaveBeenCalledWith("resource-covers");
  const [path, uploaded, options] = mocks.upload.mock.calls[0];
  expect(path).toMatch(/^newsletter\/[\w-]+\.png$/);
  expect(options).toEqual({ contentType: "image/png", upsert: false });
  expect(await sharp(uploaded).metadata()).toMatchObject({ format: "png", width: 1200, height: 600 });
});
