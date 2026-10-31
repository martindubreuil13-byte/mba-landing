import "server-only";
import { getServiceClient } from "@/app/lib/supabase/service";
import { derivativeSize, LARGE_WIDTH } from "./cover-sizes";
import { CoverError, processCoverImage } from "./images";
import {
  downloadPrivate,
  isOwnedPrivatePath,
  isOwnedPublicPath,
  newAssetVersion,
  PRIVATE_BUCKET,
  PUBLIC_BUCKET,
  publicCoverUrl,
  removeObjects,
  signedPreviewUrl,
  sweepOrphans,
  uploadPrivateSource,
  uploadPublicDerivatives,
} from "./storage";
import type {
  AdminPublication,
  PublicationAvailability,
  PublicationContentInput,
  PublicPublication,
} from "./types";
import {
  parseStoredEditions,
  parseStoredRelated,
  parseStoredRetailers,
  parseStoredThemes,
  publishBlockers,
  readinessSubjectFromAdmin,
  type FieldErrors,
} from "./validation";

/**
 * Publications: data access. Every function here uses the server-only service client, so callers must have
 * authenticated first (admin routes via withPublicationsAdmin; public pages only ever call the public reads, which
 * project an explicit column list and filter on published = true).
 */

// ---------------------------------------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------------------------------------

export type PublicationErrorCode =
  | "not_found"
  | "stale"
  | "stale_list"
  | "invalid"
  | "slug_taken"
  | "not_published"
  | "cover_invalid"
  | "storage"
  | "conflict";

/** A failure that is safe to show to the admin as-is. */
export class PublicationError extends Error {
  constructor(
    public status: number,
    public code: PublicationErrorCode,
    message: string,
    public fieldErrors?: FieldErrors
  ) {
    super(message);
    this.name = "PublicationError";
  }
}

const STALE_MESSAGE = "This title was changed somewhere else since you opened it. Reload to see the latest version, then re-apply your edit.";

// ---------------------------------------------------------------------------------------------------------
// Rows
// ---------------------------------------------------------------------------------------------------------

type Row = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  author: string | null;
  introduction: string | null;
  description: string | null;
  readership: string | null;
  themes: unknown;
  availability: string;
  publication_year: number | null;
  publication_date: string | null;
  publisher: string | null;
  language: string | null;
  editions: unknown;
  retailers: unknown;
  related: unknown;
  cover_source_path: string | null;
  cover_path: string | null;
  cover_thumb_path: string | null;
  cover_width: number | null;
  cover_height: number | null;
  cover_alt: string | null;
  published: boolean;
  published_at: string | null;
  featured: boolean;
  sort_order: number;
  revision: number;
  created_at: string;
  updated_at: string;
};

/** Explicit projections: nothing is ever selected with `*`. */
const ADMIN_COLUMNS =
  "id, slug, title, subtitle, author, introduction, description, readership, themes, availability, publication_year, publication_date, publisher, language, editions, retailers, related, cover_source_path, cover_path, cover_thumb_path, cover_width, cover_height, cover_alt, published, published_at, featured, sort_order, revision, created_at, updated_at";
/** Public: no private asset path, no revision, no sort/created fields beyond what rendering needs. */
const PUBLIC_COLUMNS =
  "id, slug, title, subtitle, author, introduction, description, readership, themes, availability, publication_year, publication_date, publisher, language, editions, retailers, related, cover_path, cover_thumb_path, cover_width, cover_height, cover_alt, featured, updated_at";

const ORDER = [
  { column: "sort_order", ascending: true },
  { column: "created_at", ascending: true },
  { column: "id", ascending: true },
] as const;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: string) => UUID_RE.test(value);

function asAvailability(value: string): PublicationAvailability {
  return value === "available" ? "available" : "forthcoming";
}

function toAdmin(row: Row): AdminPublication {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    author: row.author,
    introduction: row.introduction,
    description: row.description,
    readership: row.readership,
    themes: parseStoredThemes(row.themes),
    availability: asAvailability(row.availability),
    publicationYear: row.publication_year,
    publicationDate: row.publication_date,
    publisher: row.publisher,
    language: row.language,
    editions: parseStoredEditions(row.editions),
    retailers: parseStoredRetailers(row.retailers),
    related: parseStoredRelated(row.related),
    hasCover: isOwnedPrivatePath(row.id, row.cover_source_path),
    coverWidth: row.cover_width,
    coverHeight: row.cover_height,
    coverAlt: row.cover_alt,
    published: row.published,
    publishedAt: row.published_at,
    featured: row.featured,
    sortOrder: row.sort_order,
    revision: row.revision,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

type PublicRow = Pick<
  Row,
  | "id" | "slug" | "title" | "subtitle" | "author" | "introduction" | "description" | "readership" | "themes" | "availability"
  | "publication_year" | "publication_date" | "publisher" | "language" | "editions" | "retailers" | "related" | "cover_path"
  | "cover_thumb_path" | "cover_width" | "cover_height" | "cover_alt" | "featured" | "updated_at"
>;

/** Null when a stored row is not fit to show publicly (never expected, but the database is not the last line of defence). */
function toPublic(row: PublicRow): PublicPublication | null {
  const author = row.author?.trim();
  const introduction = row.introduction?.trim();
  const description = row.description?.trim();
  if (!author || !introduction || !description) return null;

  const hasCover =
    isOwnedPublicPath(row.id, row.cover_path) &&
    isOwnedPublicPath(row.id, row.cover_thumb_path) &&
    row.cover_width !== null &&
    row.cover_height !== null;

  return {
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    author,
    introduction,
    description,
    readership: row.readership,
    themes: parseStoredThemes(row.themes),
    availability: asAvailability(row.availability),
    publicationYear: row.publication_year,
    publicationDate: row.publication_date,
    publisher: row.publisher,
    language: row.language,
    editions: parseStoredEditions(row.editions),
    retailers: parseStoredRetailers(row.retailers),
    related: parseStoredRelated(row.related),
    cover: hasCover
      ? {
          src: publicCoverUrl(row.cover_path!),
          thumbSrc: publicCoverUrl(row.cover_thumb_path!),
          width: row.cover_width!,
          height: row.cover_height!,
          alt: row.cover_alt?.trim() || `Cover of ${row.title}`,
        }
      : null,
    featured: row.featured,
    updatedAt: row.updated_at,
  };
}

// ---------------------------------------------------------------------------------------------------------
// Public reads (published only)
// ---------------------------------------------------------------------------------------------------------

export async function listPublishedPublications(): Promise<PublicPublication[]> {
  let query = getServiceClient().from("publications").select(PUBLIC_COLUMNS).eq("published", true);
  for (const o of ORDER) query = query.order(o.column, { ascending: o.ascending });
  const { data, error } = await query;
  if (error) throw new Error(`Failed to load publications: ${error.message}`);
  return ((data ?? []) as unknown as PublicRow[]).map(toPublic).filter((p): p is PublicPublication => p !== null);
}

export async function getPublishedPublicationBySlug(slug: string): Promise<PublicPublication | null> {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 80) return null;
  const { data, error } = await getServiceClient()
    .from("publications")
    .select(PUBLIC_COLUMNS)
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (error) throw new Error(`Failed to load publication: ${error.message}`);
  return data ? toPublic(data as unknown as PublicRow) : null;
}

export async function getFeaturedPublication(): Promise<PublicPublication | null> {
  const { data, error } = await getServiceClient()
    .from("publications")
    .select(PUBLIC_COLUMNS)
    .eq("published", true)
    .eq("featured", true)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Failed to load the featured publication: ${error.message}`);
  return data ? toPublic(data as unknown as PublicRow) : null;
}

/** Sitemap: slugs and modification times of published titles only. */
export async function listPublishedForSitemap(): Promise<Array<{ slug: string; updatedAt: string }>> {
  const { data, error } = await getServiceClient().from("publications").select("slug, updated_at").eq("published", true);
  if (error) throw new Error(`Failed to load publications for the sitemap: ${error.message}`);
  return (data ?? []).map((r) => ({ slug: r.slug as string, updatedAt: r.updated_at as string }));
}

/** The OG image needs the public derivative itself; published titles only. */
export async function getPublishedCoverPathBySlug(
  slug: string
): Promise<{ title: string; author: string; coverPath: string | null; coverWidth: number; coverHeight: number } | null> {
  const p = await getPublishedRaw(slug);
  if (!p) return null;
  const hasCover = isOwnedPublicPath(p.id, p.cover_path) && p.cover_width !== null && p.cover_height !== null;
  const size = hasCover ? derivativeSize(p.cover_width!, p.cover_height!, LARGE_WIDTH) : { width: 0, height: 0 };
  return { title: p.title, author: p.author!, coverPath: hasCover ? p.cover_path : null, coverWidth: size.width, coverHeight: size.height };
}

async function getPublishedRaw(slug: string): Promise<Row | null> {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 80) return null;
  const { data, error } = await getServiceClient()
    .from("publications")
    .select(ADMIN_COLUMNS)
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (error) throw new Error(`Failed to load publication: ${error.message}`);
  const row = data as unknown as Row | null;
  return row && row.author?.trim() ? row : null;
}

// ---------------------------------------------------------------------------------------------------------
// Admin reads
// ---------------------------------------------------------------------------------------------------------

export async function listPublicationsAdmin(): Promise<AdminPublication[]> {
  let query = getServiceClient().from("publications").select(ADMIN_COLUMNS);
  for (const o of ORDER) query = query.order(o.column, { ascending: o.ascending });
  const { data, error } = await query;
  if (error) throw new Error(`Failed to load publications: ${error.message}`);
  return ((data ?? []) as unknown as Row[]).map(toAdmin);
}

async function getRow(id: string): Promise<Row | null> {
  if (!isUuid(id)) return null;
  const { data, error } = await getServiceClient().from("publications").select(ADMIN_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error(`Failed to load publication: ${error.message}`);
  return (data as unknown as Row | null) ?? null;
}

export async function getPublicationAdmin(id: string): Promise<AdminPublication | null> {
  const row = await getRow(id);
  return row ? toAdmin(row) : null;
}

/** Short-lived signed URL of the private original, for the admin editor. Null when there is no cover. */
export async function getCoverPreviewUrl(id: string): Promise<string | null> {
  const row = await getRow(id);
  if (!row || !isOwnedPrivatePath(row.id, row.cover_source_path)) return null;
  return signedPreviewUrl(row.cover_source_path);
}

/** Saved content, shaped like the public model, with the cover served through a short-lived signed URL. */
export async function getPublicationPreview(id: string): Promise<{ publication: PublicPublication; admin: AdminPublication } | null> {
  const row = await getRow(id);
  if (!row) return null;
  const admin = toAdmin(row);
  let cover: PublicPublication["cover"] = null;
  if (admin.hasCover && row.cover_source_path && row.cover_width && row.cover_height) {
    const url = await signedPreviewUrl(row.cover_source_path);
    if (url) cover = { src: url, thumbSrc: url, width: row.cover_width, height: row.cover_height, alt: row.cover_alt?.trim() || `Cover of ${row.title}` };
  }
  return {
    admin,
    publication: {
      slug: row.slug,
      title: row.title,
      subtitle: row.subtitle,
      author: row.author ?? "",
      introduction: row.introduction ?? "",
      description: row.description ?? "",
      readership: row.readership,
      themes: admin.themes,
      availability: admin.availability,
      publicationYear: row.publication_year,
      publicationDate: row.publication_date,
      publisher: row.publisher,
      language: row.language,
      editions: admin.editions,
      retailers: admin.retailers,
      related: admin.related,
      cover,
      featured: row.featured,
      updatedAt: row.updated_at,
    },
  };
}

// ---------------------------------------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------------------------------------

const nullIfEmpty = (value: string) => (value ? value : null);

function contentColumns(input: PublicationContentInput) {
  return {
    title: input.title,
    slug: input.slug,
    subtitle: nullIfEmpty(input.subtitle),
    author: nullIfEmpty(input.author),
    introduction: nullIfEmpty(input.introduction),
    description: nullIfEmpty(input.description),
    readership: nullIfEmpty(input.readership),
    themes: input.themes,
    availability: input.availability,
    publication_year: input.publicationYear,
    publication_date: input.publicationDate,
    publisher: nullIfEmpty(input.publisher),
    language: nullIfEmpty(input.language),
    editions: input.editions,
    retailers: input.retailers,
    related: input.related,
    cover_alt: nullIfEmpty(input.coverAlt),
  };
}

const slugTaken = () => new PublicationError(409, "slug_taken", "That URL slug is already used by another title.", { slug: "That URL slug is already used by another title." });

function mapWriteError(error: { code?: string; message: string }): PublicationError {
  if (error.code === "23505") return slugTaken();
  if (error.code === "23514") return new PublicationError(422, "invalid", "That change isn't allowed for this title in its current state.");
  return new PublicationError(500, "storage", "The change could not be saved. Nothing was changed.");
}

/** Minimal draft: title and slug only. */
export async function createPublication(title: string, slug: string): Promise<AdminPublication> {
  const { data, error } = await getServiceClient().from("publications").insert({ title, slug }).select(ADMIN_COLUMNS).single();
  if (error) throw mapWriteError(error);
  return toAdmin(data as unknown as Row);
}

async function requireFresh(id: string, expectedRevision: number): Promise<Row> {
  const row = await getRow(id);
  if (!row) throw new PublicationError(404, "not_found", "That title no longer exists.");
  if (row.revision !== expectedRevision) throw new PublicationError(409, "stale", STALE_MESSAGE);
  return row;
}

/** Optimistic update: succeeds only if the row is still at `expectedRevision`. */
async function updateAtRevision(id: string, expectedRevision: number, patch: Record<string, unknown>): Promise<Row> {
  const { data, error } = await getServiceClient()
    .from("publications")
    .update(patch)
    .eq("id", id)
    .eq("revision", expectedRevision)
    .select(ADMIN_COLUMNS)
    .maybeSingle();
  if (error) throw mapWriteError(error);
  if (!data) {
    const exists = await getRow(id);
    throw exists ? new PublicationError(409, "stale", STALE_MESSAGE) : new PublicationError(404, "not_found", "That title no longer exists.");
  }
  return data as unknown as Row;
}

export async function updatePublicationContent(id: string, expectedRevision: number, input: PublicationContentInput): Promise<AdminPublication> {
  const row = await requireFresh(id, expectedRevision);

  if (row.published) {
    // Live edit: the title must stay publishable.
    const candidate = { ...readinessSubjectFromAdmin(toAdmin(row)), ...{
      title: input.title,
      slug: input.slug,
      author: input.author,
      introduction: input.introduction,
      description: input.description,
      availability: input.availability,
      retailers: input.retailers,
      coverAlt: input.coverAlt,
    } };
    const blockers = publishBlockers(candidate);
    if (Object.keys(blockers).length > 0) {
      throw new PublicationError(422, "invalid", "This title is live, so these fields can't be left incomplete. Unpublish it first, or complete them.", blockers);
    }
  }

  return toAdmin(await updateAtRevision(id, expectedRevision, contentColumns(input)));
}

export async function publishPublication(id: string, expectedRevision: number): Promise<AdminPublication> {
  const row = await requireFresh(id, expectedRevision);
  if (row.published) return toAdmin(row);

  const blockers = publishBlockers(readinessSubjectFromAdmin(toAdmin(row)));
  if (Object.keys(blockers).length > 0) {
    throw new PublicationError(422, "invalid", "This title isn't ready to publish yet.", blockers);
  }

  // Public cover derivatives are created now, from the private original, and exist only while the title is live.
  let derivatives: { largePath: string; thumbPath: string } | null = null;
  if (isOwnedPrivatePath(row.id, row.cover_source_path)) {
    const source = await downloadPrivate(row.cover_source_path);
    if (!source) throw new PublicationError(500, "storage", "The saved cover could not be read. Upload it again, then publish.");
    try {
      const processed = await processCoverImage(source);
      derivatives = await uploadPublicDerivatives(row.id, newAssetVersion(), processed);
    } catch (error) {
      if (error instanceof CoverError) throw new PublicationError(422, "cover_invalid", error.message);
      throw new PublicationError(500, "storage", "The cover could not be prepared for publication. Nothing was changed.");
    }
  }

  try {
    const updated = await updateAtRevision(id, expectedRevision, {
      published: true,
      cover_path: derivatives?.largePath ?? null,
      cover_thumb_path: derivatives?.thumbPath ?? null,
    });
    return toAdmin(updated);
  } catch (error) {
    if (derivatives) await removeObjects(PUBLIC_BUCKET, [derivatives.largePath, derivatives.thumbPath]);
    throw error;
  }
}

export async function unpublishPublication(id: string, expectedRevision: number): Promise<AdminPublication> {
  const row = await requireFresh(id, expectedRevision);
  if (!row.published) return toAdmin(row);

  const updated = await updateAtRevision(id, expectedRevision, {
    published: false,
    featured: false,
    cover_path: null,
    cover_thumb_path: null,
  });
  // Public derivatives are withdrawn. Copies already cached by browsers or search engines may persist.
  await removeObjects(PUBLIC_BUCKET, [row.cover_path ?? "", row.cover_thumb_path ?? ""]);
  return toAdmin(updated);
}

export async function setFeaturedPublication(id: string, featured: boolean): Promise<AdminPublication> {
  if (!isUuid(id)) throw new PublicationError(404, "not_found", "That title no longer exists.");
  const { error } = await getServiceClient().rpc("set_featured_publication", { p_id: id, p_featured: featured });
  if (error) {
    if (error.message.includes("publication_not_found")) throw new PublicationError(404, "not_found", "That title no longer exists.");
    if (error.message.includes("publication_not_published")) throw new PublicationError(409, "not_published", "Only a published title can be featured.");
    throw new PublicationError(500, "storage", "The featured title could not be changed. Nothing was changed.");
  }
  const row = await getRow(id);
  if (!row) throw new PublicationError(404, "not_found", "That title no longer exists.");
  return toAdmin(row);
}

/** `expected` is the order the admin was looking at; `desired` the order they want. Atomic and stale-checked. */
export async function reorderPublications(expected: string[], desired: string[]): Promise<void> {
  const { error } = await getServiceClient().rpc("reorder_publications", { p_expected: expected, p_desired: desired });
  if (!error) return;
  if (error.message.includes("publication_list_stale")) {
    throw new PublicationError(409, "stale_list", "The catalogue changed since you loaded it. Reload to see the current order.");
  }
  if (error.message.includes("publication_order_invalid")) throw new PublicationError(400, "invalid", "That order isn't valid.");
  throw new PublicationError(500, "storage", "The order could not be changed. Nothing was changed.");
}

/** Replace (or first upload of) the cover. The new asset is saved and referenced BEFORE the old one is removed. */
export async function replaceCover(id: string, expectedRevision: number, file: Buffer): Promise<AdminPublication> {
  const row = await requireFresh(id, expectedRevision);

  let processed;
  try {
    processed = await processCoverImage(file);
  } catch (error) {
    if (error instanceof CoverError) throw new PublicationError(422, "cover_invalid", error.message);
    throw error;
  }

  const version = newAssetVersion();
  const sourcePath = await uploadPrivateSource(row.id, version, processed.source).catch(() => {
    throw new PublicationError(500, "storage", "The cover could not be stored. Nothing was changed.");
  });

  let derivatives: { largePath: string; thumbPath: string } | null = null;
  let saved: Row;
  try {
    if (row.published) derivatives = await uploadPublicDerivatives(row.id, version, processed);
    saved = await updateAtRevision(id, expectedRevision, {
      cover_source_path: sourcePath,
      cover_width: processed.source.width,
      cover_height: processed.source.height,
      cover_path: derivatives?.largePath ?? null,
      cover_thumb_path: derivatives?.thumbPath ?? null,
    });
  } catch (error) {
    // The new asset never became referenced: take it back out.
    await removeObjects(PRIVATE_BUCKET, [sourcePath]);
    if (derivatives) await removeObjects(PUBLIC_BUCKET, [derivatives.largePath, derivatives.thumbPath]);
    throw error instanceof PublicationError ? error : new PublicationError(500, "storage", "The cover could not be saved. Nothing was changed.");
  }

  // Only now that the replacement is saved is the previous cover removed.
  await removeObjects(PRIVATE_BUCKET, [row.cover_source_path ?? ""]);
  await removeObjects(PUBLIC_BUCKET, [row.cover_path ?? "", row.cover_thumb_path ?? ""]);
  await sweepOrphans(id, [saved.cover_source_path, saved.cover_path, saved.cover_thumb_path]);
  return toAdmin(saved);
}

export async function removeCover(id: string, expectedRevision: number): Promise<AdminPublication> {
  const row = await requireFresh(id, expectedRevision);
  const saved = await updateAtRevision(id, expectedRevision, {
    cover_source_path: null,
    cover_width: null,
    cover_height: null,
    cover_path: null,
    cover_thumb_path: null,
    cover_alt: null,
  });
  await removeObjects(PRIVATE_BUCKET, [row.cover_source_path ?? ""]);
  await removeObjects(PUBLIC_BUCKET, [row.cover_path ?? "", row.cover_thumb_path ?? ""]);
  await sweepOrphans(id, [saved.cover_source_path, saved.cover_path, saved.cover_thumb_path]);
  return toAdmin(saved);
}

/** Drafts only: a published title must be unpublished first. */
export async function deletePublication(id: string, expectedRevision: number): Promise<void> {
  const row = await requireFresh(id, expectedRevision);
  if (row.published) throw new PublicationError(409, "conflict", "Unpublish this title before deleting it.");
  const { data, error } = await getServiceClient().from("publications").delete().eq("id", id).eq("published", false).eq("revision", expectedRevision).select("id");
  if (error) throw mapWriteError(error);
  if (!data || data.length === 0) throw new PublicationError(409, "stale", STALE_MESSAGE);
  await removeAllAssets(id);
}

async function removeAllAssets(id: string) {
  const supabase = getServiceClient();
  for (const bucket of [PRIVATE_BUCKET, PUBLIC_BUCKET]) {
    const store = supabase.storage.from(bucket);
    const { data: versions } = await store.list(`publications/${id}`, { limit: 100 });
    const paths: string[] = [];
    for (const version of versions ?? []) {
      const { data: files } = await store.list(`publications/${id}/${version.name}`, { limit: 20 });
      for (const file of files ?? []) paths.push(`publications/${id}/${version.name}/${file.name}`);
    }
    await removeObjects(bucket, paths);
  }
}
