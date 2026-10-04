/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * A small in-memory stand-in for the Supabase query builder, covering exactly the calls the lead / resource /
 * consent code makes. It enforces the two database rules the consent logic depends on: `leads.email` is unique,
 * and `consent_records` is append-only. It is for tests only; it is not a general PostgREST emulator.
 */
import { randomUUID } from "node:crypto";

type Row = Record<string, any>;
type Result = { data: any; error: { message: string; code?: string } | null };

export class FakeDb {
  tables: Record<string, Row[]> = {
    leads: [],
    resources: [],
    resource_requests: [],
    consent_records: [],
    assessments: [],
    napkin_submissions: [],
    pmb_questions: [],
  };

  insertCount: Record<string, number> = {};
  failNextInsertInto: string | null = null;

  client() {
    return { from: (table: string) => new Query(this, table) };
  }
}

type Filter = (row: Row) => boolean;

function parseOr(expr: string): Filter {
  const parts = expr.split(",").map((part) => {
    const [col, op, ...rest] = part.split(".");
    const value = rest.join(".");
    return (row: Row) => {
      const v = row[col] ?? null;
      if (op === "is" && value === "null") return v === null;
      if (op === "not" && rest[0] === "is" && rest[1] === "null") return v !== null;
      if (op === "eq") return String(v) === value;
      if (op === "lt") return v !== null && v < value;
      throw new Error(`fake supabase: unsupported or() clause ${part}`);
    };
  });
  return (row) => parts.some((p) => p(row));
}

class Query implements PromiseLike<Result> {
  private filters: Filter[] = [];
  private action: "select" | "insert" | "update" = "select";
  private payload: Row | Row[] | null = null;
  private selectCols = "*";
  private returning = false;
  private mode: "single" | "maybe" | null = null;
  private orderBy: { col: string; asc: boolean } | null = null;
  private limitN: number | null = null;

  constructor(private db: FakeDb, private table: string) {}

  select(cols = "*") {
    if (this.action === "select") this.selectCols = cols;
    else this.returning = true;
    return this;
  }
  insert(payload: Row | Row[]) { this.action = "insert"; this.payload = payload; return this; }
  update(payload: Row) { this.action = "update"; this.payload = payload; return this; }
  eq(col: string, value: unknown) { this.filters.push((r) => r[col] === value); return this; }
  neq(col: string, value: unknown) { this.filters.push((r) => r[col] !== value); return this; }
  is(col: string, value: null) { this.filters.push((r) => (r[col] ?? null) === value); return this; }
  not(col: string, op: string, value: null) {
    if (op !== "is") throw new Error("fake supabase: only not(col,'is',null)");
    this.filters.push((r) => (r[col] ?? null) !== value);
    return this;
  }
  ilike(col: string, value: string) { this.filters.push((r) => String(r[col] ?? "").toLowerCase() === value.toLowerCase()); return this; }
  or(expr: string) { this.filters.push(parseOr(expr)); return this; }
  order(col: string, opts?: { ascending?: boolean }) { this.orderBy = { col, asc: opts?.ascending !== false }; return this; }
  limit(n: number) { this.limitN = n; return this; }
  maybeSingle() { this.mode = "maybe"; return this; }
  // PostgREST .single() errors unless exactly one row.
  singleRow() { this.mode = "single"; return this; }

  private embed(row: Row): Row {
    const out = { ...row };
    if (/resource:resources\(/.test(this.selectCols) || /resource:resources\(/.test(String(this.selectCols))) {
      const key = this.table === "consent_records" ? "source_resource_id" : "resource_id";
      out.resource = this.db.tables.resources.find((r) => r.id === row[key]) ?? null;
    }
    return out;
  }

  private run(): Result {
    const rows = this.db.tables[this.table];
    if (!rows) return { data: null, error: { message: `fake supabase: unknown table ${this.table}` } };
    const match = (r: Row) => this.filters.every((f) => f(r));
    const now = new Date().toISOString();

    if (this.action === "insert") {
      if (this.db.failNextInsertInto === this.table) {
        this.db.failNextInsertInto = null;
        return { data: null, error: { message: "simulated insert failure" } };
      }
      const incoming = (Array.isArray(this.payload) ? this.payload : [this.payload!]) as Row[];
      const created: Row[] = [];
      for (const item of incoming) {
        const row: Row = { id: randomUUID(), created_at: now, ...item };
        if (this.table === "leads") {
          if (rows.some((r) => r.email === row.email)) return { data: null, error: { message: "duplicate key value violates unique constraint leads_email_key", code: "23505" } };
          Object.assign(row, { country: null, ongoing_content_opt_in_at: null, ongoing_content_opt_out_at: null, suppressed_at: null, consent_requested_at: null, updated_at: now }, item, { id: row.id, created_at: now });
        }
        if (this.table === "resource_requests") Object.assign(row, { requested_at: now, benefit_fulfilled_at: null, ...item, id: row.id });
        rows.push(row);
        created.push(row);
      }
      this.db.insertCount[this.table] = (this.db.insertCount[this.table] ?? 0) + created.length;
      return this.finish(created);
    }

    if (this.action === "update") {
      if (this.table === "consent_records") return { data: null, error: { message: "consent_records is append-only" } };
      const hit = rows.filter(match);
      for (const r of hit) Object.assign(r, this.payload, { updated_at: now });
      return this.returning ? this.finish(hit) : { data: null, error: null };
    }

    let hit = rows.filter(match);
    if (this.orderBy) {
      const { col, asc } = this.orderBy;
      hit = [...hit].sort((a, b) => (a[col] < b[col] ? -1 : a[col] > b[col] ? 1 : 0) * (asc ? 1 : -1));
    }
    if (this.limitN != null) hit = hit.slice(0, this.limitN);
    return this.finish(hit);
  }

  private finish(hit: Row[]): Result {
    const out = hit.map((r) => this.embed(r));
    if (this.mode === "maybe") return { data: out[0] ?? null, error: null };
    if (this.mode === "single") {
      if (out.length !== 1) return { data: null, error: { message: "JSON object requested, multiple (or no) rows returned" } };
      return { data: out[0], error: null };
    }
    return { data: out, error: null };
  }

  then<R1 = Result, R2 = never>(onfulfilled?: ((v: Result) => R1 | PromiseLike<R1>) | null, onrejected?: ((e: unknown) => R2 | PromiseLike<R2>) | null) {
    return Promise.resolve().then(() => this.run()).then(onfulfilled, onrejected);
  }
}

// supabase-js exposes `.single()`; alias it to the internal name so the builder reads like the real one.
(Query.prototype as any).single = function (this: Query) { return (this as any).singleRow(); };
