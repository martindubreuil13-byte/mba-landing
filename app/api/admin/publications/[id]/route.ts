import { NextResponse } from "next/server";
import { withPublicationsAdmin } from "@/app/lib/publications/admin-route";
import { deletePublication, PublicationError, updatePublicationContent } from "@/app/lib/publications/queries";
import { readJsonBody } from "@/app/lib/publications/request-guards";
import { validatePublicationContent } from "@/app/lib/publications/validation";

type Ctx = { params: Promise<{ id: string }> };

function expectedRevision(body: Record<string, unknown>): number {
  const value = body.expectedRevision;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new PublicationError(400, "invalid", "Missing revision. Reload the page and try again.");
  }
  return value;
}

/** Save the editable content of a title (draft or live). Optimistic: fails with 409 if the title changed meanwhile. */
export const PATCH = withPublicationsAdmin<Ctx>(async (request, { params }) => {
  const { id } = await params;
  const body = await readJsonBody(request);
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new PublicationError(400, "invalid", "Invalid request.");
  const revision = expectedRevision(body as Record<string, unknown>);

  const result = validatePublicationContent(body);
  if (!result.ok) throw new PublicationError(422, "invalid", "Some fields need attention.", result.fieldErrors);

  const publication = await updatePublicationContent(id, revision, result.value);
  return NextResponse.json({ ok: true, publication });
});

/** Delete a draft. Published titles must be unpublished first. */
export const DELETE = withPublicationsAdmin<Ctx>(async (request, { params }) => {
  const { id } = await params;
  const body = await readJsonBody(request);
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new PublicationError(400, "invalid", "Invalid request.");
  await deletePublication(id, expectedRevision(body as Record<string, unknown>));
  return NextResponse.json({ ok: true });
});
