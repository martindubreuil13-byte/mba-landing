import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { SchedulingData } from "./types";
import type { SchedulingStore } from "./store";
import { buildSeedData } from "./seed";

/**
 * The Phase 1 prototype data store: one JSON file under .prototype-data/ (git-ignored). It is deliberately NOT a database
 * table, so nothing here can touch Supabase, production or otherwise. Next.js can load a route in several module
 * instances inside one process, so the file is re-read on every operation and the lock lives on globalThis.
 */

const LOCKS = Symbol.for("mba.scheduling.locks");
type LockMap = Map<string, Promise<unknown>>;
function lockFor(file: string): { get: () => Promise<unknown>; set: (p: Promise<unknown>) => void } {
  const g = globalThis as unknown as Record<symbol, LockMap>;
  g[LOCKS] ??= new Map();
  return { get: () => g[LOCKS].get(file) ?? Promise.resolve(), set: (p) => { g[LOCKS].set(file, p); } };
}

export class FileStore implements SchedulingStore {
  constructor(private file: string, private now: () => number = () => Date.now()) {}

  static defaultPath() { return path.join(process.cwd(), ".prototype-data", "scheduling.json"); }

  private async load(): Promise<SchedulingData> {
    try {
      return JSON.parse(fs.readFileSync(this.file, "utf8")) as SchedulingData;
    } catch {
      const seeded = await buildSeedData(this.now());
      this.write(seeded);
      return seeded;
    }
  }

  private write(data: SchedulingData) {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const tmp = `${this.file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, this.file);
  }

  async read() { return this.load(); }

  mutate<T>(fn: (data: SchedulingData) => T | Promise<T>): Promise<T> {
    const lock = lockFor(this.file);
    const run = async () => {
      const draft = await this.load();
      const result = await fn(draft);
      this.write(draft);
      return result;
    };
    const next = lock.get().then(run, run);
    lock.set(next.catch(() => undefined));
    return next;
  }

  async replace(data: SchedulingData) {
    const lock = lockFor(this.file);
    const next = lock.get().then(() => this.write(data));
    lock.set(next.catch(() => undefined));
    await next;
  }
}
