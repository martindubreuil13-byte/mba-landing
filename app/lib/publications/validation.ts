/**
 * Publications: validation and normalisation. Pure functions, safe in client and server code.
 *
 * Two levels:
 *  - validatePublicationContent(): what a DRAFT may contain (every present value is well-formed and bounded).
 *  - publishBlockers() / publishWarnings(): what a PUBLISHED title must contain, and what is worth a second look.
 *
 * Retailer links are free-form (name + https URL). Nothing is fetched from them, ever.
 */

import { isValidRelatedPath } from "./related-index";
import type {
  AdminPublication,
  PublicationAvailability,
  PublicationContentInput,
  PublicationEdition,
  PublicationRetailer,
} from "./types";

export const LIMITS = {
  title: 200,
  subtitle: 300,
  author: 200,
  introduction: 2000,
  description: 12000,
  readership: 600,
  publisher: 200,
  coverAlt: 300,
  theme: 60,
  themes: 12,
  editionFormat: 40,
  editions: 10,
  retailerName: 60,
  retailerUrl: 500,
  retailers: 20,
  related: 12,
  slugMin: 2,
  slugMax: 80,
} as const;

export const AVAILABILITIES: readonly PublicationAvailability[] = ["forthcoming", "available"];

export type FieldErrors = Record<string, string>;

/** Strips control characters (keeps newlines/tabs only where `multiline`), trims, normalises line endings. */
export function cleanText(value: unknown, multiline = false): string {
  if (typeof value !== "string") return "";
  let text = value.replace(/\r\n?/g, "\n");
  text = multiline ? text.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "") : text.replace(/[\u0000-\u001f\u007f]/g, " ");
  if (multiline) text = text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n");
  else text = text.replace(/\s+/g, " ");
  return text.trim();
}

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, LIMITS.slugMax)
    .replace(/-+$/g, "");
}

export function isValidSlug(slug: string): boolean {
  return slug.length >= LIMITS.slugMin && slug.length <= LIMITS.slugMax && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

// ---------------------------------------------------------------------------------------------------------
// ISBN
// ---------------------------------------------------------------------------------------------------------

/** Digits only (ISBN-10 may end in X), or null if it is not a valid ISBN-10 / ISBN-13 (checksum included). */
export function normalizeIsbn(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const compact = input.replace(/^isbn(-1[03])?:?\s*/i, "").replace(/[\s-]/g, "").toUpperCase();
  if (/^\d{13}$/.test(compact)) {
    let sum = 0;
    for (let i = 0; i < 12; i++) sum += Number(compact[i]) * (i % 2 === 0 ? 1 : 3);
    return (10 - (sum % 10)) % 10 === Number(compact[12]) ? compact : null;
  }
  if (/^\d{9}[\dX]$/.test(compact)) {
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += Number(compact[i]) * (10 - i);
    sum += compact[9] === "X" ? 10 : Number(compact[9]);
    return sum % 11 === 0 ? compact : null;
  }
  return null;
}

// ---------------------------------------------------------------------------------------------------------
// Retailers
// ---------------------------------------------------------------------------------------------------------

/** Hosts that can never be a public bookstore: localhost, bare names, IP literals, internal TLDs. */
function isPublicHostname(host: string): boolean {
  if (!host.includes(".")) return false;
  if (host.startsWith("[") || host.includes(":")) return false; // IPv6 literal
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false; // IPv4 literal
  if (/^\d+$/.test(host.split(".").pop() ?? "")) return false; // numeric TLD (shorthand IPv4 forms)
  if (host.split(".").includes("localhost")) return false;
  if (/\.(local|localhost|localdomain|internal|intranet|private|lan|home|corp|test|invalid|example|onion|arpa)$/.test(host)) return false;
  return /\.([a-z]{2,}|xn--[a-z0-9-]{2,})$/.test(host);
}

export type RetailerCheck = { ok: true; retailer: PublicationRetailer } | { ok: false; error: string };

export function checkRetailer(input: unknown): RetailerCheck {
  if (typeof input !== "object" || input === null) return { ok: false, error: "Not a valid retailer entry." };
  const raw = input as Record<string, unknown>;
  const name = cleanText(raw.name);
  const urlText = typeof raw.url === "string" ? raw.url.trim() : "";
  const label = name || "A retailer";

  if (!name) return { ok: false, error: "Enter the retailer or platform name." };
  if (name.length > LIMITS.retailerName) return { ok: false, error: `“${name.slice(0, 20)}…”: the name must be ${LIMITS.retailerName} characters or fewer.` };
  if (!urlText) return { ok: false, error: `${label}: enter the book's link.` };
  if (urlText.length > LIMITS.retailerUrl) return { ok: false, error: `${label}: the link is too long.` };

  let url: URL;
  try {
    url = new URL(urlText);
  } catch {
    return { ok: false, error: `${label}: that isn't a valid link (include https://).` };
  }
  if (url.protocol !== "https:") return { ok: false, error: `${label}: the link must start with https://.` };
  if (url.username || url.password) return { ok: false, error: `${label}: the link can't contain a username or password.` };
  if (url.port) return { ok: false, error: `${label}: the link can't specify a port.` };
  if (!isPublicHostname(url.hostname.toLowerCase())) return { ok: false, error: `${label}: that isn't a public web address.` };
  const normalized = url.toString();
  if (normalized.length > LIMITS.retailerUrl) return { ok: false, error: `${label}: the link is too long.` };
  return { ok: true, retailer: { name, url: normalized } };
}

/** Rows left completely blank are dropped; every other row must be valid or the whole list is rejected. */
export function validateRetailers(input: unknown): { retailers: PublicationRetailer[]; errors: string[] } {
  if (!Array.isArray(input)) return { retailers: [], errors: ["Retailers must be a list."] };
  if (input.length > LIMITS.retailers * 2) return { retailers: [], errors: [`Add at most ${LIMITS.retailers} retailers.`] };
  const retailers: PublicationRetailer[] = [];
  const errors: string[] = [];
  for (const entry of input) {
    const e = (entry ?? {}) as Record<string, unknown>;
    const blank = !cleanText(e.name) && (typeof e.url !== "string" || !e.url.trim());
    if (blank) continue;
    const result = checkRetailer(entry);
    if (result.ok) retailers.push(result.retailer);
    else errors.push(result.error);
  }
  if (retailers.length > LIMITS.retailers) errors.push(`Add at most ${LIMITS.retailers} retailers.`);
  return { retailers, errors };
}

/** Stored data is untrusted too: re-validate every entry on read so a hand-edited row never yields a bad public link. */
export function parseStoredRetailers(raw: unknown): PublicationRetailer[] {
  if (!Array.isArray(raw)) return [];
  const out: PublicationRetailer[] = [];
  for (const entry of raw.slice(0, LIMITS.retailers)) {
    const result = checkRetailer(entry);
    if (result.ok) out.push(result.retailer);
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------
// Editions (format + its own ISBN)
// ---------------------------------------------------------------------------------------------------------

export function validateEditions(input: unknown): { editions: PublicationEdition[]; errors: string[] } {
  if (!Array.isArray(input)) return { editions: [], errors: ["Editions must be a list."] };
  if (input.length > LIMITS.editions * 2) return { editions: [], errors: [`Add at most ${LIMITS.editions} editions.`] };
  const editions: PublicationEdition[] = [];
  const errors: string[] = [];
  for (const entry of input) {
    const e = (entry ?? {}) as Record<string, unknown>;
    const format = cleanText(e.format);
    const isbnText = typeof e.isbn === "string" ? e.isbn.trim() : "";
    if (!format && !isbnText) continue;
    if (!format) {
      errors.push("Each ISBN needs its format (for example Paperback or eBook).");
      continue;
    }
    if (format.length > LIMITS.editionFormat) {
      errors.push(`“${format.slice(0, 20)}…”: the format must be ${LIMITS.editionFormat} characters or fewer.`);
      continue;
    }
    let isbn: string | null = null;
    if (isbnText) {
      isbn = normalizeIsbn(isbnText);
      if (!isbn) {
        errors.push(`${format}: “${isbnText.slice(0, 24)}” is not a valid ISBN (check the digits).`);
        continue;
      }
    }
    editions.push({ format, isbn });
  }
  if (editions.length > LIMITS.editions) errors.push(`Add at most ${LIMITS.editions} editions.`);
  const seen = new Set<string>();
  for (const ed of editions) {
    if (!ed.isbn) continue;
    if (seen.has(ed.isbn)) errors.push(`The ISBN ${ed.isbn} is listed twice.`);
    seen.add(ed.isbn);
  }
  return { editions, errors };
}

export function parseStoredEditions(raw: unknown): PublicationEdition[] {
  if (!Array.isArray(raw)) return [];
  const out: PublicationEdition[] = [];
  for (const entry of raw.slice(0, LIMITS.editions)) {
    const e = (entry ?? {}) as Record<string, unknown>;
    const format = cleanText(e.format);
    if (!format || format.length > LIMITS.editionFormat) continue;
    const isbn = typeof e.isbn === "string" && e.isbn ? normalizeIsbn(e.isbn) : null;
    out.push({ format, isbn });
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------
// Themes, related, dates
// ---------------------------------------------------------------------------------------------------------

export function validateThemes(input: unknown): { themes: string[]; errors: string[] } {
  if (!Array.isArray(input)) return { themes: [], errors: ["Themes must be a list."] };
  const themes: string[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const entry of input) {
    const theme = cleanText(entry);
    if (!theme) continue;
    if (theme.length > LIMITS.theme) {
      errors.push(`“${theme.slice(0, 20)}…”: a theme must be ${LIMITS.theme} characters or fewer.`);
      continue;
    }
    const key = theme.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    themes.push(theme);
  }
  if (themes.length > LIMITS.themes) errors.push(`Add at most ${LIMITS.themes} themes.`);
  return { themes, errors };
}

export function parseStoredThemes(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((t) => cleanText(t))
    .filter((t) => t.length > 0 && t.length <= LIMITS.theme)
    .slice(0, LIMITS.themes);
}

export function validateRelated(input: unknown): { related: string[]; errors: string[] } {
  if (!Array.isArray(input)) return { related: [], errors: ["Related links must be a list."] };
  const related: string[] = [];
  const errors: string[] = [];
  for (const entry of input) {
    if (typeof entry !== "string" || !entry) continue;
    if (!isValidRelatedPath(entry)) {
      errors.push(`“${entry.slice(0, 40)}” is not a page that can be linked from a publication.`);
      continue;
    }
    if (!related.includes(entry)) related.push(entry);
  }
  if (related.length > LIMITS.related) errors.push(`Add at most ${LIMITS.related} related links.`);
  return { related, errors };
}

/** Drops anything that is no longer a known local page, so a renamed or removed article never becomes a dead link. */
export function parseStoredRelated(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((p): p is string => typeof p === "string" && isValidRelatedPath(p)).slice(0, LIMITS.related);
}

/** Strict calendar date, YYYY-MM-DD. */
export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d && y >= 1400 && y <= 2200;
}

export function isValidLanguage(value: string): boolean {
  return /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(value) && value.length <= 35;
}

// ---------------------------------------------------------------------------------------------------------
// Whole-form validation (draft level)
// ---------------------------------------------------------------------------------------------------------

export type ContentValidation =
  | { ok: true; value: PublicationContentInput }
  | { ok: false; fieldErrors: FieldErrors };

function textField(
  body: Record<string, unknown>,
  key: string,
  max: number,
  label: string,
  errors: FieldErrors,
  multiline = false
): string {
  const raw = body[key];
  if (raw === undefined || raw === null) return "";
  if (typeof raw !== "string") {
    errors[key] = `${label} must be text.`;
    return "";
  }
  const value = cleanText(raw, multiline);
  if (value.length > max) {
    errors[key] = `${label} must be ${max.toLocaleString("en-US")} characters or fewer.`;
  }
  return value;
}

export function validatePublicationContent(body: unknown): ContentValidation {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return { ok: false, fieldErrors: { _form: "Invalid request." } };
  const b = body as Record<string, unknown>;
  const errors: FieldErrors = {};

  const title = textField(b, "title", LIMITS.title, "The title", errors);
  if (!title && !errors.title) errors.title = "Title is required.";

  const slugRaw = typeof b.slug === "string" ? b.slug.trim() : "";
  const slug = slugRaw ? slugRaw.toLowerCase() : slugify(title);
  if (!isValidSlug(slug)) {
    errors.slug = `The URL slug must be ${LIMITS.slugMin}–${LIMITS.slugMax} characters: lower-case letters, numbers and single hyphens.`;
  }

  const subtitle = textField(b, "subtitle", LIMITS.subtitle, "The subtitle", errors);
  const author = textField(b, "author", LIMITS.author, "The author", errors);
  const introduction = textField(b, "introduction", LIMITS.introduction, "The introduction", errors, true);
  const description = textField(b, "description", LIMITS.description, "The description", errors, true);
  const readership = textField(b, "readership", LIMITS.readership, "Readership", errors, true);
  const publisher = textField(b, "publisher", LIMITS.publisher, "The publisher", errors);
  const coverAlt = textField(b, "coverAlt", LIMITS.coverAlt, "The cover description", errors);

  const availability = b.availability === undefined ? "forthcoming" : b.availability;
  if (!AVAILABILITIES.includes(availability as PublicationAvailability)) errors.availability = "Choose forthcoming or available.";

  let publicationYear: number | null = null;
  if (b.publicationYear !== undefined && b.publicationYear !== null && b.publicationYear !== "") {
    const year = typeof b.publicationYear === "number" ? b.publicationYear : Number(b.publicationYear);
    if (!Number.isInteger(year) || year < 1400 || year > 2200) errors.publicationYear = "Enter a four-digit year.";
    else publicationYear = year;
  }

  let publicationDate: string | null = null;
  if (typeof b.publicationDate === "string" && b.publicationDate.trim()) {
    const date = b.publicationDate.trim();
    if (!isValidIsoDate(date)) errors.publicationDate = "Enter a real date.";
    else publicationDate = date;
  }
  if (publicationDate && publicationYear !== null && Number(publicationDate.slice(0, 4)) !== publicationYear) {
    errors.publicationYear = "The year doesn't match the exact date. Clear one of them.";
  }

  let language = "";
  if (typeof b.language === "string" && b.language.trim()) {
    language = b.language.trim();
    if (!isValidLanguage(language)) errors.language = "Use a language code such as en, fr or fr-CA.";
  }

  const themes = validateThemes(b.themes ?? []);
  if (themes.errors.length) errors.themes = themes.errors.join(" ");
  const editions = validateEditions(b.editions ?? []);
  if (editions.errors.length) errors.editions = editions.errors.join(" ");
  const retailers = validateRetailers(b.retailers ?? []);
  if (retailers.errors.length) errors.retailers = retailers.errors.join(" ");
  const related = validateRelated(b.related ?? []);
  if (related.errors.length) errors.related = related.errors.join(" ");

  if (Object.keys(errors).length > 0) return { ok: false, fieldErrors: errors };

  return {
    ok: true,
    value: {
      title,
      slug,
      subtitle,
      author,
      introduction,
      description,
      readership,
      themes: themes.themes,
      availability: availability as PublicationAvailability,
      publicationYear,
      publicationDate,
      publisher,
      language,
      editions: editions.editions,
      retailers: retailers.retailers,
      related: related.related,
      coverAlt,
    },
  };
}

// ---------------------------------------------------------------------------------------------------------
// Publish readiness
// ---------------------------------------------------------------------------------------------------------

/** The subset of a publication that readiness depends on (works for both the saved row and a candidate edit). */
export type ReadinessSubject = {
  title: string;
  slug: string;
  author: string | null | undefined;
  introduction: string | null | undefined;
  description: string | null | undefined;
  availability: PublicationAvailability;
  retailers: PublicationRetailer[];
  hasCover: boolean;
  coverAlt: string | null | undefined;
  publicationYear: number | null;
  publicationDate: string | null;
  editions: PublicationEdition[];
};

export function readinessSubjectFromAdmin(p: AdminPublication): ReadinessSubject {
  return {
    title: p.title,
    slug: p.slug,
    author: p.author,
    introduction: p.introduction,
    description: p.description,
    availability: p.availability,
    retailers: p.retailers,
    hasCover: p.hasCover,
    coverAlt: p.coverAlt,
    publicationYear: p.publicationYear,
    publicationDate: p.publicationDate,
    editions: p.editions,
  };
}

/** Things that stop a title from going (or staying) live. Forthcoming titles need no retailer, ISBN or date. */
export function publishBlockers(p: ReadinessSubject): FieldErrors {
  const errors: FieldErrors = {};
  if (!p.title.trim()) errors.title = "A published title needs a title.";
  if (!isValidSlug(p.slug)) errors.slug = "A published title needs a valid URL slug.";
  if (!p.author?.trim()) errors.author = "Add the author before publishing.";
  if (!p.introduction?.trim()) errors.introduction = "Add the introduction before publishing.";
  if (!p.description?.trim()) errors.description = "Add the editorial description before publishing.";
  if (p.availability === "available" && p.retailers.length === 0) {
    errors.retailers = "A title marked Available needs at least one place to get it. Add a link, or mark it Forthcoming.";
  }
  return errors;
}

/** Not blockers: worth a second look before readers see it. */
export function publishWarnings(p: ReadinessSubject): string[] {
  const warnings: string[] = [];
  if (!p.hasCover) warnings.push("No cover image. The page will use a deliberate text-only layout.");
  else if (!p.coverAlt?.trim()) warnings.push("The cover has no description for screen readers. Add one.");
  if (p.availability === "available") {
    if (p.publicationYear === null && !p.publicationDate) warnings.push("Available, but no publication year or date is set.");
    if (p.editions.length > 0 && p.editions.every((e) => !e.isbn)) warnings.push("No ISBN recorded for any format.");
    if (p.editions.length === 0) warnings.push("No formats or ISBNs recorded.");
  }
  return warnings;
}
