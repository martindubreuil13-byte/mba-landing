import { NextResponse } from "next/server";
import { getAdminUser } from "@/app/lib/supabase/admin-session";
import { getResourceById, isSlugTaken, updateResource } from "@/app/lib/resources/queries";
import { uploadCoverImage, uploadResourceFile } from "@/app/lib/resources/storage";
import { RESOURCE_TYPES } from "@/app/lib/resources/types";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await getResourceById(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const contentType = req.headers.get("content-type") ?? "";

  // Lightweight JSON PATCH: used for the publish/unpublish toggle.
  if (contentType.includes("application/json")) {
    const body = await req.json();
    const patch: Record<string, boolean> = {};
    if (typeof body.published === "boolean") patch.published = body.published;
    if (typeof body.featured === "boolean") patch.featured = body.featured;

    const resource = await updateResource(id, patch);
    return NextResponse.json({ success: true, resource });
  }

  // Full edit form: multipart, optionally replacing the file/cover.
  const formData = await req.formData();

  const title = String(formData.get("title") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const shortDescription = String(formData.get("short_description") ?? "").trim();
  const longDescription = String(formData.get("long_description") ?? "").trim();
  const resourceType = String(formData.get("resource_type") ?? "").trim();
  const audience = String(formData.get("audience") ?? "").trim();
  const published = formData.get("published") === "true";
  const featured = formData.get("featured") === "true";
  const file = formData.get("file");
  const cover = formData.get("cover");

  const slug = slugify(slugInput || title);

  const errors: Record<string, string> = {};
  if (!title) errors.title = "Title is required.";
  if (!slug) errors.slug = "Slug is required.";
  if (!shortDescription) errors.short_description = "Short description is required.";
  if (!RESOURCE_TYPES.includes(resourceType as (typeof RESOURCE_TYPES)[number])) {
    errors.resource_type = "Choose a resource type.";
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "Invalid submission", fieldErrors: errors }, { status: 400 });
  }

  if (slug !== existing.slug && (await isSlugTaken(slug, id))) {
    return NextResponse.json(
      { error: "Invalid submission", fieldErrors: { slug: "That slug is already in use." } },
      { status: 400 }
    );
  }

  const patch: Record<string, unknown> = {
    title,
    slug,
    short_description: shortDescription,
    long_description: longDescription || null,
    resource_type: resourceType,
    audience: audience || null,
    published,
    featured,
  };

  if (file instanceof File && file.size > 0) {
    const uploaded = await uploadResourceFile(file, slug);
    patch.file_path = uploaded.path;
    patch.file_name = uploaded.fileName;
  }

  if (cover instanceof File && cover.size > 0) {
    const uploaded = await uploadCoverImage(cover, slug);
    patch.cover_image_path = uploaded.path;
  }

  const resource = await updateResource(id, patch);
  return NextResponse.json({ success: true, resource });
}
