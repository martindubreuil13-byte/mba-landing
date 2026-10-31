import { NextResponse } from "next/server";
import { withPublicationsAdmin } from "@/app/lib/publications/admin-route";
import { createPublication, PublicationError } from "@/app/lib/publications/queries";
import { readJsonBody } from "@/app/lib/publications/request-guards";
import { cleanText, isValidSlug, LIMITS, slugify } from "@/app/lib/publications/validation";

/** Create a minimal draft: just a title (and optionally a slug). Everything else is added on the edit page. */
export const POST = withPublicationsAdmin(async (request) => {
  const body = (await readJsonBody(request)) as { title?: unknown; slug?: unknown } | null;
  if (!body || typeof body !== "object") throw new PublicationError(400, "invalid", "Invalid request.");

  const title = cleanText(body.title);
  if (!title) throw new PublicationError(422, "invalid", "Title is required.", { title: "Title is required." });
  if (title.length > LIMITS.title) throw new PublicationError(422, "invalid", "That title is too long.", { title: `The title must be ${LIMITS.title} characters or fewer.` });

  const slugInput = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
  const slug = slugInput || slugify(title);
  if (!isValidSlug(slug)) {
    throw new PublicationError(422, "invalid", "That URL slug isn't valid.", {
      slug: `The URL slug must be ${LIMITS.slugMin}–${LIMITS.slugMax} characters: lower-case letters, numbers and single hyphens.`,
    });
  }

  const publication = await createPublication(title, slug);
  return NextResponse.json({ ok: true, publication }, { status: 201 });
});
