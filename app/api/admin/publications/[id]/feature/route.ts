import { NextResponse } from "next/server";
import { withPublicationsAdmin } from "@/app/lib/publications/admin-route";
import { PublicationError, setFeaturedPublication } from "@/app/lib/publications/queries";
import { readJsonBody } from "@/app/lib/publications/request-guards";

type Ctx = { params: Promise<{ id: string }> };

/** Feature this title on the homepage (replacing any other), or clear the feature. Atomic in the database. */
export const POST = withPublicationsAdmin<Ctx>(async (request, { params }) => {
  const { id } = await params;
  const body = (await readJsonBody(request)) as { featured?: unknown } | null;
  if (!body || typeof body.featured !== "boolean") throw new PublicationError(400, "invalid", "Invalid request.");
  const publication = await setFeaturedPublication(id, body.featured);
  return NextResponse.json({ ok: true, publication });
});
