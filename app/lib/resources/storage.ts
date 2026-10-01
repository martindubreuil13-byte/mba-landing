import "server-only";
import { getServiceClient } from "@/app/lib/supabase/service";

const COVERS_BUCKET = "resource-covers";
const FILES_BUCKET = "resource-files";

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "-").replace(/-+/g, "-");
}

export async function uploadResourceFile(file: File, slug: string) {
  const supabase = getServiceClient();
  const path = `${slug}/${Date.now()}-${sanitizeFileName(file.name)}`;

  const { error } = await supabase.storage.from(FILES_BUCKET).upload(path, file, {
    contentType: file.type || "application/pdf",
    upsert: false,
  });

  if (error) throw new Error(`Failed to upload resource file: ${error.message}`);

  return { path, fileName: file.name };
}

export async function uploadCoverImage(file: File, slug: string) {
  const supabase = getServiceClient();
  const path = `${slug}/${Date.now()}-${sanitizeFileName(file.name)}`;

  const { error } = await supabase.storage.from(COVERS_BUCKET).upload(path, file, {
    contentType: file.type || "image/png",
    upsert: false,
  });

  if (error) throw new Error(`Failed to upload cover image: ${error.message}`);

  return { path };
}

export async function deleteStorageObject(bucket: "covers" | "files", path: string) {
  const supabase = getServiceClient();
  await supabase.storage
    .from(bucket === "covers" ? COVERS_BUCKET : FILES_BUCKET)
    .remove([path]);
}

export function getPublicCoverUrl(path: string) {
  const supabase = getServiceClient();
  const {
    data: { publicUrl },
  } = supabase.storage.from(COVERS_BUCKET).getPublicUrl(path);
  return publicUrl;
}

/**
 * Cover URL for display: the uploaded cover if one exists, otherwise the
 * auto-generated typographic placeholder (see cover-image.tsx) rendered on
 * demand — no PDF-page-rendering step, no native dependency, always works.
 */
export function getResourceCoverUrl(resource: {
  cover_image_path: string | null;
  title: string;
  resource_type: string;
}) {
  if (resource.cover_image_path) {
    return getPublicCoverUrl(resource.cover_image_path);
  }
  const params = new URLSearchParams({
    title: resource.title,
    type: resource.resource_type,
  });
  return `/api/resources/cover?${params.toString()}`;
}

/**
 * Short-lived signed URL for the actual gated file. Only ever generated
 * server-side, and only after a lead has been captured for this request.
 */
export async function getSignedDownloadUrl(path: string, expiresInSeconds = 300, downloadFileName?: string) {
  const supabase = getServiceClient();
  const { data, error } = await supabase.storage
    .from(FILES_BUCKET)
    .createSignedUrl(path, expiresInSeconds, downloadFileName ? { download: downloadFileName } : undefined);

  if (error || !data) {
    throw new Error(`Failed to create signed download URL: ${error?.message}`);
  }

  return data.signedUrl;
}

/** Whether the gated file actually exists in storage (admin "PDF asset status"). */
export async function resourceFileExists(path: string): Promise<boolean> {
  const supabase = getServiceClient();
  const slash = path.lastIndexOf("/");
  const dir = slash >= 0 ? path.slice(0, slash) : "";
  const name = slash >= 0 ? path.slice(slash + 1) : path;
  const { data, error } = await supabase.storage.from(FILES_BUCKET).list(dir, { search: name, limit: 5 });
  if (error) return false;
  return (data ?? []).some((f) => f.name === name);
}
