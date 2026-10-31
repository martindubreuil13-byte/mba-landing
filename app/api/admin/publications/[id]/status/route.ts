import { NextResponse } from "next/server";
import { withPublicationsAdmin } from "@/app/lib/publications/admin-route";
import { PublicationError, publishPublication, unpublishPublication } from "@/app/lib/publications/queries";
import { readJsonBody } from "@/app/lib/publications/request-guards";

type Ctx = { params: Promise<{ id: string }> };

/** Publish or unpublish. Publishing re-validates the saved content; unpublishing also clears the featured flag. */
export const POST = withPublicationsAdmin<Ctx>(async (request, { params }) => {
  const { id } = await params;
  const body = (await readJsonBody(request)) as { action?: unknown; expectedRevision?: unknown } | null;
  if (!body || typeof body !== "object") throw new PublicationError(400, "invalid", "Invalid request.");
  const revision = body.expectedRevision;
  if (typeof revision !== "number" || !Number.isInteger(revision) || revision < 1) {
    throw new PublicationError(400, "invalid", "Missing revision. Reload the page and try again.");
  }
  if (body.action !== "publish" && body.action !== "unpublish") throw new PublicationError(400, "invalid", "Unknown action.");

  const publication = body.action === "publish" ? await publishPublication(id, revision) : await unpublishPublication(id, revision);
  return NextResponse.json({ ok: true, publication });
});
