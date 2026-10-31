import { NextResponse } from "next/server";
import { MAX_COVER_REQUEST_BYTES } from "@/app/lib/publications/images";
import { withPublicationsAdmin } from "@/app/lib/publications/admin-route";
import { getCoverPreviewUrl, PublicationError, removeCover, replaceCover } from "@/app/lib/publications/queries";
import { BodyTooLargeError, readBodyBytes, readJsonBody } from "@/app/lib/publications/request-guards";

type Ctx = { params: Promise<{ id: string }> };

const revisionOf = (value: unknown) => {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isInteger(n) || n < 1) throw new PublicationError(400, "invalid", "Missing revision. Reload the page and try again.");
  return n;
};

/**
 * Upload or replace the cover (multipart: `file` + `expectedRevision`). The whole request is capped below the
 * 4.5 MB platform ceiling and read with a hard limit, so an oversized body is refused before it is buffered.
 */
export const POST = withPublicationsAdmin<Ctx>(async (request, { params }) => {
  const { id } = await params;
  if (!/^multipart\/form-data\b/i.test(request.headers.get("content-type") ?? "")) {
    throw new PublicationError(400, "invalid", "Send the cover as a file upload.");
  }

  let form: FormData;
  try {
    const bytes = await readBodyBytes(request, MAX_COVER_REQUEST_BYTES);
    form = await new Response(bytes, { headers: { "content-type": request.headers.get("content-type")! } }).formData();
  } catch (error) {
    if (error instanceof BodyTooLargeError) {
      throw new PublicationError(413, "cover_invalid", "That file is too large. Covers must be under 3.8 MB; export a smaller version.");
    }
    throw new PublicationError(400, "invalid", "The upload could not be read.");
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) throw new PublicationError(400, "invalid", "Choose an image file.");
  const publication = await replaceCover(id, revisionOf(form.get("expectedRevision")), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ ok: true, publication, previewUrl: await getCoverPreviewUrl(id) });
});

/** Remove the cover (the title then uses the text-only layout). */
export const DELETE = withPublicationsAdmin<Ctx>(async (request, { params }) => {
  const { id } = await params;
  const body = (await readJsonBody(request)) as { expectedRevision?: unknown } | null;
  if (!body) throw new PublicationError(400, "invalid", "Invalid request.");
  const publication = await removeCover(id, revisionOf(body.expectedRevision));
  return NextResponse.json({ ok: true, publication, previewUrl: null });
});
