import "server-only";
import { randomUUID } from "node:crypto";
import { getServiceClient } from "@/app/lib/supabase/service";
import type { ProcessedCover } from "./images";

/**
 * Publications: cover storage.
 *
 *  - publication-assets (PRIVATE): the sanitised original. Only the service-role key can read it; the admin sees it
 *    through a short-lived signed URL. It is never made public.
 *  - resource-covers (PUBLIC, shared with Resources): the optimised derivatives, under publications/<id>/<version>/,
 *    written only while a title is published. Resource covers use other prefixes and are never touched here.
 *
 * Every path is generated here (id + random version), never taken from user input.
 */

export const PRIVATE_BUCKET = "publication-assets";
export const PUBLIC_BUCKET = "resource-covers";

/** Signed preview URLs are short-lived. */
export const PREVIEW_URL_SECONDS = 300;
/** Objects younger than this are never swept as orphans: they may belong to an upload that is still in flight. */
const ORPHAN_MIN_AGE_MS = 15 * 60 * 1000;

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

export const newAssetVersion = () => randomUUID();

export const privateSourcePath = (id: string, version: string, extension: string) => `publications/${id}/${version}/source.${extension}`;
export const publicLargePath = (id: string, version: string) => `publications/${id}/${version}/cover-1200.webp`;
export const publicThumbPath = (id: string, version: string) => `publications/${id}/${version}/cover-480.webp`;

/** A stored path is only trusted if it has exactly the shape we generate AND belongs to this publication. */
export function isOwnedPrivatePath(id: string, path: string | null | undefined): path is string {
  return typeof path === "string" && new RegExp(`^publications/${id}/${UUID}/source\\.(jpg|png|webp)$`).test(path);
}
export function isOwnedPublicPath(id: string, path: string | null | undefined): path is string {
  return typeof path === "string" && new RegExp(`^publications/${id}/${UUID}/cover-(1200|480)\\.webp$`).test(path);
}

export async function uploadPrivateSource(id: string, version: string, source: ProcessedCover["source"]): Promise<string> {
  const path = privateSourcePath(id, version, source.extension);
  const { error } = await getServiceClient().storage.from(PRIVATE_BUCKET).upload(path, source.buffer, {
    contentType: source.contentType,
    upsert: false,
    cacheControl: "0",
  });
  if (error) throw new Error(`Failed to store the cover: ${error.message}`);
  return path;
}

export async function uploadPublicDerivatives(id: string, version: string, cover: Pick<ProcessedCover, "large" | "thumb">) {
  const supabase = getServiceClient();
  const largePath = publicLargePath(id, version);
  const thumbPath = publicThumbPath(id, version);
  const upload = (path: string, body: Buffer) =>
    supabase.storage.from(PUBLIC_BUCKET).upload(path, body, { contentType: "image/webp", upsert: false, cacheControl: "31536000" });

  const [a, b] = await Promise.all([upload(largePath, cover.large.buffer), upload(thumbPath, cover.thumb.buffer)]);
  if (a.error || b.error) {
    await removeObjects(PUBLIC_BUCKET, [largePath, thumbPath]);
    throw new Error(`Failed to publish the cover: ${(a.error ?? b.error)!.message}`);
  }
  return { largePath, thumbPath };
}

/** Best effort: never throws, returns whether the removal call succeeded. */
export async function removeObjects(bucket: string, paths: string[]): Promise<boolean> {
  const unique = [...new Set(paths.filter(Boolean))];
  if (unique.length === 0) return true;
  try {
    const { error } = await getServiceClient().storage.from(bucket).remove(unique);
    return !error;
  } catch {
    return false;
  }
}

export async function downloadPrivate(path: string): Promise<Buffer | null> {
  const { data, error } = await getServiceClient().storage.from(PRIVATE_BUCKET).download(path);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}

export async function downloadPublic(path: string): Promise<Buffer | null> {
  const { data, error } = await getServiceClient().storage.from(PUBLIC_BUCKET).download(path);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}

export async function signedPreviewUrl(path: string): Promise<string | null> {
  const { data, error } = await getServiceClient().storage.from(PRIVATE_BUCKET).createSignedUrl(path, PREVIEW_URL_SECONDS);
  if (error || !data) return null;
  return data.signedUrl;
}

export function publicCoverUrl(path: string): string {
  return getServiceClient().storage.from(PUBLIC_BUCKET).getPublicUrl(path).data.publicUrl;
}

/**
 * Removes objects under this publication that no row references any more (a crash between "upload" and "save"
 * can leave one). Only objects older than ORPHAN_MIN_AGE_MS are considered, so a concurrent upload is never
 * deleted. Reference-checked against the row the caller just read. Never throws.
 */
export async function sweepOrphans(id: string, referenced: Array<string | null>): Promise<number> {
  const keep = new Set(referenced.filter((p): p is string => Boolean(p)));
  let removed = 0;
  try {
    const supabase = getServiceClient();
    for (const bucket of [PRIVATE_BUCKET, PUBLIC_BUCKET]) {
      const store = supabase.storage.from(bucket);
      const { data: versions } = await store.list(`publications/${id}`, { limit: 100 });
      const doomed: string[] = [];
      for (const version of versions ?? []) {
        const dir = `publications/${id}/${version.name}`;
        const { data: files } = await store.list(dir, { limit: 20 });
        for (const file of files ?? []) {
          const path = `${dir}/${file.name}`;
          const created = file.created_at ? Date.parse(file.created_at) : NaN;
          if (!keep.has(path) && Number.isFinite(created) && Date.now() - created > ORPHAN_MIN_AGE_MS) doomed.push(path);
        }
      }
      if (doomed.length && (await removeObjects(bucket, doomed))) removed += doomed.length;
    }
  } catch {
    // cleanup is opportunistic
  }
  return removed;
}
