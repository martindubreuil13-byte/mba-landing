import { NextResponse } from "next/server";
import { withPublicationsAdmin } from "@/app/lib/publications/admin-route";
import { isUuid, PublicationError, reorderPublications } from "@/app/lib/publications/queries";
import { readJsonBody } from "@/app/lib/publications/request-guards";

const isIdList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.length <= 500 && value.every((v) => typeof v === "string" && isUuid(v));

/** `expected` is the order the admin was looking at, `order` the new one. Atomic; 409 if the catalogue changed meanwhile. */
export const POST = withPublicationsAdmin(async (request) => {
  const body = (await readJsonBody(request)) as { expected?: unknown; order?: unknown } | null;
  if (!body || !isIdList(body.expected) || !isIdList(body.order)) throw new PublicationError(400, "invalid", "Invalid request.");
  await reorderPublications(body.expected, body.order);
  return NextResponse.json({ ok: true });
});
