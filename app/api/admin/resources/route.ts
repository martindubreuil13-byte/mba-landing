import { NextResponse } from "next/server";
import { getAdminUser } from "@/app/lib/supabase/admin-session";
import { createResource, isSlugTaken } from "@/app/lib/resources/queries";
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

export async function POST(req: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
  if (!(file instanceof File) || file.size === 0) {
    errors.file = "A file is required.";
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "Invalid submission", fieldErrors: errors }, { status: 400 });
  }

  if (await isSlugTaken(slug)) {
    return NextResponse.json(
      { error: "Invalid submission", fieldErrors: { slug: "That slug is already in use." } },
      { status: 400 }
    );
  }

  const { path: filePath, fileName } = await uploadResourceFile(file as File, slug);

  let coverImagePath: string | null = null;
  if (cover instanceof File && cover.size > 0) {
    const uploaded = await uploadCoverImage(cover, slug);
    coverImagePath = uploaded.path;
  }

  const resource = await createResource({
    title,
    slug,
    short_description: shortDescription,
    long_description: longDescription || null,
    resource_type: resourceType,
    audience: audience || null,
    file_path: filePath,
    file_name: fileName,
    cover_image_path: coverImagePath,
    published,
    featured,
  });

  return NextResponse.json({ success: true, resource });
}
