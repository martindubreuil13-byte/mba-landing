import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const send = vi.fn();
vi.mock("@/app/lib/email-client", () => ({ createResend: () => ({ emails: { send } }) }));

const valid = {
  name: "Ada <b>Test</b>",
  email: "ada@example.com",
  situation: "Program 03: Pre-Architecture",
  message: "Hello",
  program: { slug: "pre-architecture", name: "IGNORED", price: "$1" },
  attribution: { source: "linkedin", medium: "social", campaign: "launch", entryPage: "/lets-talk" },
};
const post = async (body: unknown) => {
  const { POST } = await import("./route");
  return POST(new Request("http://localhost/api/qualify", { method: "POST", body: JSON.stringify(body) }));
};

describe("/api/qualify", () => {
  beforeEach(() => {
    send.mockReset();
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("INQUIRY_NOTIFY_EMAIL", "");
  });

  it("returns success only when the provider accepted the notification, and sends program + attribution to the owner", async () => {
    send.mockResolvedValue({ data: { id: "msg_1" }, error: null });
    const res = await post(valid);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, autoReply: true });
    const admin = send.mock.calls[0][0];
    expect(admin.to).toBe("martin@mindrasolutions.com");
    expect(admin.subject).toBe("New MBA inquiry · Pre-Architecture · US$1,999");
    expect(admin.replyTo).toBe("ada@example.com"); // replying to the notification reaches the prospect
    expect(admin.html).toContain("Pre-Architecture");
    expect(admin.html).toContain("linkedin"); // attribution
    expect(admin.html).not.toContain("IGNORED"); // program facts come from the catalog, not the client
    expect(admin.html).toContain("&lt;b&gt;Test&lt;/b&gt;"); // submitted name is escaped
    expect(admin.text).toContain("Hello"); // plain-text alternative carries the message
    const confirmation = send.mock.calls[1][0];
    expect(confirmation.to).toBe("ada@example.com");
    expect(confirmation.subject).toBe("Your next move — Modern Business Architect");
    expect(confirmation.html).toContain("Pre-Architecture");
    expect(confirmation.text).toContain("Book our first conversation");
    // the confirmation is not a receipt: none of the submitted fields are echoed back
    for (const echoed of ["ada@example.com", "Hello", "Program 03", "linkedin"]) {
      expect(confirmation.html).not.toContain(echoed);
      expect(confirmation.text).not.toContain(echoed);
    }
  });

  it("is NOT a success when the email policy blocks the send (returned error, not thrown)", async () => {
    send.mockResolvedValue({ data: null, error: { name: "application_error", message: "disabled", statusCode: 403 } });
    const res = await post(valid);
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ success: false, code: "email_disabled" });
    expect(send).toHaveBeenCalledTimes(1); // no auto-reply attempted after the owner notification failed
  });

  it("is NOT a success when the provider rejects the send", async () => {
    send.mockResolvedValue({ data: null, error: { name: "validation_error", message: "domain not verified", statusCode: 403 } });
    const res = await post(valid);
    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ success: false, code: "provider_rejected" });
  });

  it("is NOT a success when the provider call throws", async () => {
    send.mockRejectedValue(new Error("network down"));
    expect((await post(valid)).status).toBe(502);
  });

  it("is NOT a success when the provider returns neither id nor error", async () => {
    send.mockResolvedValue({ data: null, error: null });
    expect((await post(valid)).status).toBe(502);
  });

  it("still succeeds if only the visitor auto-reply fails, and says so", async () => {
    send.mockResolvedValueOnce({ data: { id: "msg_1" }, error: null }).mockResolvedValueOnce({ data: null, error: { name: "x", message: "bad to", statusCode: 422 } });
    const res = await post(valid);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, autoReply: false });
  });

  it("rejects missing or invalid fields before sending anything", async () => {
    for (const bad of [{ ...valid, email: "nope" }, { ...valid, name: " " }, { ...valid, message: "" }, null, "x"]) {
      expect((await post(bad)).status).toBe(400);
    }
    expect(send).not.toHaveBeenCalled();
  });

  it("honours INQUIRY_NOTIFY_EMAIL", async () => {
    vi.stubEnv("INQUIRY_NOTIFY_EMAIL", "owner@example.com");
    send.mockResolvedValue({ data: { id: "m" }, error: null });
    await post(valid);
    expect(send.mock.calls[0][0].to).toBe("owner@example.com");
  });

  it("ignores an unknown program slug", async () => {
    send.mockResolvedValue({ data: { id: "m" }, error: null });
    await post({ ...valid, program: { slug: "<script>" } });
    expect(send.mock.calls[0][0].html).not.toContain("<script>");
    expect(send.mock.calls[0][0].subject).toBe("New MBA inquiry · Program 03: Pre-Architecture");
  });
});
