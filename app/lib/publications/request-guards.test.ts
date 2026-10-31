import { describe, expect, it } from "vitest";
import { BodyTooLargeError, isSameOriginRequest, readBodyBytes, readJsonBody } from "./request-guards";

const h = (init: Record<string, string>) => new Headers(init);

describe("same-origin check", () => {
  it("accepts a matching Origin and host", () => {
    expect(isSameOriginRequest(h({ origin: "https://site.com", host: "site.com" }))).toBe(true);
    expect(isSameOriginRequest(h({ origin: "http://localhost:3000", host: "localhost:3000", "sec-fetch-site": "same-origin" }))).toBe(true);
    expect(isSameOriginRequest(h({ origin: "https://site.com", "x-forwarded-host": "site.com", host: "internal:3000" }))).toBe(true);
  });
  it("refuses a missing, foreign or malformed Origin, and a cross-site fetch", () => {
    expect(isSameOriginRequest(h({ host: "site.com" }))).toBe(false);
    expect(isSameOriginRequest(h({ origin: "https://evil.com", host: "site.com" }))).toBe(false);
    expect(isSameOriginRequest(h({ origin: "https://site.com.evil.com", host: "site.com" }))).toBe(false);
    expect(isSameOriginRequest(h({ origin: "null", host: "site.com" }))).toBe(false);
    expect(isSameOriginRequest(h({ origin: "https://site.com", host: "site.com", "sec-fetch-site": "cross-site" }))).toBe(false);
    expect(isSameOriginRequest(h({ origin: "https://site.com" }))).toBe(false);
  });
});

describe("bounded bodies", () => {
  const post = (body: BodyInit, headers: Record<string, string> = {}) => new Request("http://x/", { method: "POST", body, headers });
  it("reads a body within the cap", async () => {
    expect((await readBodyBytes(post("hello"), 10)).length).toBe(5);
  });
  it("refuses by Content-Length before reading", async () => {
    await expect(readBodyBytes(post("x", { "content-length": "999999" }), 100)).rejects.toBeInstanceOf(BodyTooLargeError);
  });
  it("refuses a streamed body that exceeds the cap even without a Content-Length", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(new Uint8Array(60));
        c.enqueue(new Uint8Array(60));
        c.close();
      },
    });
    const req = new Request("http://x/", { method: "POST", body: stream, duplex: "half" } as RequestInit);
    await expect(readBodyBytes(req, 100)).rejects.toBeInstanceOf(BodyTooLargeError);
  });
  it("parses JSON only when declared as JSON", async () => {
    expect(await readJsonBody(post('{"a":1}', { "content-type": "application/json" }))).toEqual({ a: 1 });
    expect(await readJsonBody(post('{"a":1}', { "content-type": "text/plain" }))).toBeNull();
    expect(await readJsonBody(post("{oops", { "content-type": "application/json" }))).toBeNull();
    await expect(readJsonBody(post("x".repeat(200), { "content-type": "application/json" }), 100)).rejects.toBeInstanceOf(BodyTooLargeError);
  });
});
