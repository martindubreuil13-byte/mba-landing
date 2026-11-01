import type { SchedulingData } from "./types";

/**
 * Persistence boundary. Phase 1 has an in-memory store (tests) and a JSON-file store (the local prototype, see
 * file-store.ts). Phase 2 implements the same interface over Supabase, where `mutate` becomes a transaction plus an
 * exclusion constraint on (meeting host, time range), which is what really prevents double bookings across servers.
 *
 * `mutate` is serialised: concurrent callers run one at a time, each sees the previous one's result, and a callback that
 * throws changes nothing. That is the prototype's double-booking guarantee.
 */
export interface SchedulingStore {
  read(): Promise<SchedulingData>;
  mutate<T>(fn: (data: SchedulingData) => T | Promise<T>): Promise<T>;
  replace(data: SchedulingData): Promise<void>;
}

export class MemoryStore implements SchedulingStore {
  private data: SchedulingData;
  private tail: Promise<unknown> = Promise.resolve();
  constructor(initial: SchedulingData) { this.data = structuredClone(initial); }

  async read() { return structuredClone(this.data); }

  mutate<T>(fn: (data: SchedulingData) => T | Promise<T>): Promise<T> {
    const run = async () => {
      const draft = structuredClone(this.data);
      const result = await fn(draft);
      this.data = draft;
      return result;
    };
    const next = this.tail.then(run, run);
    this.tail = next.catch(() => undefined);
    return next;
  }

  async replace(data: SchedulingData) { this.data = structuredClone(data); }
}
