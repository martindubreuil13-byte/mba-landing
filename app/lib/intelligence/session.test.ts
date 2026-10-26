import { describe, expect, it } from "vitest";
import { resumeOrStart, SESSION_IDLE_MS, type Entry } from "./session";

const entry: Entry = { ref: null, us: null, um: null, uc: null, ut: null, land: "/" };
let n = 0;
const mk = () => `w-session-id-${++n}-xxxxxxxx`;

describe("session expiry", () => {
  it("starts a session when none is stored", () => {
    expect(resumeOrStart(null, 1000, mk, () => entry).isNew).toBe(true);
  });
  it("continues a session inside the idle window and keeps the original entry", () => {
    const first = resumeOrStart(null, 1000, mk, () => entry).session;
    const next = resumeOrStart(first, 1000 + SESSION_IDLE_MS - 1, mk, () => ({ ...entry, land: "/other" }));
    expect(next.isNew).toBe(false);
    expect(next.session.id).toBe(first.id);
    expect(next.session.entry.land).toBe("/");
  });
  it("expires after 30 minutes idle and starts a new session with a fresh entry", () => {
    const first = resumeOrStart(null, 1000, mk, () => entry).session;
    const next = resumeOrStart(first, 1000 + SESSION_IDLE_MS, mk, () => ({ ...entry, land: "/later" }));
    expect(next.isNew).toBe(true);
    expect(next.session.id).not.toBe(first.id);
    expect(next.session.entry.land).toBe("/later");
  });
});
