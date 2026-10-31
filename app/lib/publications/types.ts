/**
 * Publications: shared types. Safe to import from client components (no server-only code).
 *
 * Two shapes on purpose:
 *  - PublicPublication: the ONLY shape the public site ever sees. It is built from an explicit column list and
 *    contains no admin fields, no private asset paths, no revision.
 *  - AdminPublication: the full row, for the signed-in admin.
 */

export type PublicationAvailability = "forthcoming" | "available";

export type PublicationEdition = {
  /** Free text, e.g. "Paperback", "Hardcover", "eBook (EPUB)". */
  format: string;
  /** Digits only (ISBN-10 may end in X). Each format carries its own ISBN; null when not assigned or not known. */
  isbn: string | null;
};

export type PublicationRetailer = {
  /** Exactly as typed, rendered as plain text. */
  name: string;
  /** Normalised absolute https URL. */
  url: string;
};

export type PublicationCoverView = {
  /** Large derivative (or, in the admin preview, a short-lived signed URL to the original). */
  src: string;
  /** Smaller derivative for catalogue rows; equals `src` in the admin preview. */
  thumbSrc: string;
  /** Intrinsic ratio of the (uncropped) cover. */
  width: number;
  height: number;
  alt: string;
};

export type PublicPublication = {
  slug: string;
  title: string;
  subtitle: string | null;
  author: string;
  introduction: string;
  description: string;
  readership: string | null;
  themes: string[];
  availability: PublicationAvailability;
  publicationYear: number | null;
  /** YYYY-MM-DD */
  publicationDate: string | null;
  publisher: string | null;
  language: string | null;
  editions: PublicationEdition[];
  retailers: PublicationRetailer[];
  /** Validated local paths (Thinking / Answers / services). */
  related: string[];
  cover: PublicationCoverView | null;
  featured: boolean;
  updatedAt: string;
};

export type AdminPublication = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  author: string | null;
  introduction: string | null;
  description: string | null;
  readership: string | null;
  themes: string[];
  availability: PublicationAvailability;
  publicationYear: number | null;
  publicationDate: string | null;
  publisher: string | null;
  language: string | null;
  editions: PublicationEdition[];
  retailers: PublicationRetailer[];
  related: string[];
  hasCover: boolean;
  coverWidth: number | null;
  coverHeight: number | null;
  coverAlt: string | null;
  published: boolean;
  publishedAt: string | null;
  featured: boolean;
  sortOrder: number;
  revision: number;
  createdAt: string;
  updatedAt: string;
};

/** The editable fields, as the admin form sends them. Everything but `title` and `slug` may be empty in a draft. */
export type PublicationContentInput = {
  title: string;
  slug: string;
  subtitle: string;
  author: string;
  introduction: string;
  description: string;
  readership: string;
  themes: string[];
  availability: PublicationAvailability;
  publicationYear: number | null;
  publicationDate: string | null;
  publisher: string;
  language: string;
  editions: PublicationEdition[];
  retailers: PublicationRetailer[];
  related: string[];
  coverAlt: string;
};
