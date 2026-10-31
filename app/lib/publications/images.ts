import "server-only";
import sharp from "sharp";

/**
 * Publications: cover image processing.
 *
 * The browser's label (file name, Content-Type) is never trusted. The bytes are sniffed, fully decoded, rotated to
 * their display orientation, stripped of all metadata (EXIF, GPS, ICC, XMP) and re-encoded. What is stored is
 * always our own encoding of the pixels, never the uploaded file. Only JPEG, PNG and WebP are accepted: no SVG
 * (script-capable), no GIF/AVIF/TIFF, no animation.
 */

/** Total multipart request cap. Vercel rejects function request bodies above 4.5 MB, so we stay safely below it. */
export const MAX_COVER_REQUEST_BYTES = 4_000_000;
/** The image file itself (the rest of the request is form overhead). */
export const MAX_COVER_FILE_BYTES = 3_800_000;
export const MIN_COVER_SIDE = 300;
export const MAX_COVER_SIDE = 8000;
export const MAX_COVER_PIXELS = 40_000_000;

export { LARGE_WIDTH, THUMB_WIDTH, derivativeSize } from "./cover-sizes";
import { LARGE_WIDTH, THUMB_WIDTH } from "./cover-sizes";

export class CoverError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CoverError";
  }
}

export type CoverFormat = "jpeg" | "png" | "webp";

/** Identifies the format from the file's magic bytes. */
export function sniffImageFormat(bytes: Uint8Array): CoverFormat | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) return "png";
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return "webp";
  return null;
}

export type EncodedImage = { buffer: Buffer; width: number; height: number };

export type ProcessedCover = {
  /** Sanitised full-size original, same format family as the upload. Stored privately. */
  source: EncodedImage & { contentType: string; extension: string };
  /** Public derivatives (WebP). Only ever written to the public bucket while the title is published. */
  large: EncodedImage;
  thumb: EncodedImage;
};

const CONTENT_TYPE: Record<CoverFormat, { contentType: string; extension: string }> = {
  jpeg: { contentType: "image/jpeg", extension: "jpg" },
  png: { contentType: "image/png", extension: "png" },
  webp: { contentType: "image/webp", extension: "webp" },
};

function base(input: Buffer) {
  // failOn "error": truncated or corrupt data is rejected instead of silently half-decoded.
  return sharp(input, { limitInputPixels: MAX_COVER_PIXELS, failOn: "error", animated: false });
}

export async function processCoverImage(input: Buffer): Promise<ProcessedCover> {
  if (input.length === 0) throw new CoverError("That file is empty.");
  if (input.length > MAX_COVER_FILE_BYTES) throw new CoverError("Cover images must be 3.8 MB or smaller. Export a smaller version and try again.");

  const format = sniffImageFormat(input);
  if (!format) throw new CoverError("Cover images must be JPEG, PNG or WebP.");

  let meta: sharp.Metadata;
  try {
    meta = await base(input).metadata();
  } catch {
    throw new CoverError("That file isn't a valid JPEG, PNG or WebP image.");
  }
  if (meta.format !== format) throw new CoverError("The file's contents don't match its image type.");
  if ((meta.pages ?? 1) > 1) throw new CoverError("Animated images can't be used as a cover.");

  // Display dimensions: EXIF orientations 5–8 swap width and height.
  let width = meta.width ?? 0;
  let height = meta.height ?? 0;
  if (meta.orientation && meta.orientation >= 5) [width, height] = [height, width];
  if (!width || !height) throw new CoverError("That image has no readable dimensions.");
  if (Math.min(width, height) < MIN_COVER_SIDE) throw new CoverError(`The cover is too small: each side must be at least ${MIN_COVER_SIDE}px.`);
  if (Math.max(width, height) > MAX_COVER_SIDE) throw new CoverError(`The cover is too large: each side must be at most ${MAX_COVER_SIDE}px.`);

  try {
    // Full decode + auto-orient + sRGB. sharp drops all metadata unless asked to keep it.
    const oriented = await base(input).rotate().toColourspace("srgb").toBuffer({ resolveWithObject: true });
    const decoded = oriented.data;
    const sourceInfo = oriented.info;

    const sourcePipeline = sharp(decoded, { limitInputPixels: MAX_COVER_PIXELS, failOn: "error" });
    const encodedSource =
      format === "jpeg"
        ? await sourcePipeline.jpeg({ quality: 92, mozjpeg: true }).toBuffer({ resolveWithObject: true })
        : format === "png"
          ? await sourcePipeline.png({ compressionLevel: 9 }).toBuffer({ resolveWithObject: true })
          : await sourcePipeline.webp({ quality: 92 }).toBuffer({ resolveWithObject: true });

    const derive = async (targetWidth: number): Promise<EncodedImage> => {
      const out = await sharp(decoded, { limitInputPixels: MAX_COVER_PIXELS, failOn: "error" })
        .resize({ width: targetWidth, withoutEnlargement: true })
        .webp({ quality: 86 })
        .toBuffer({ resolveWithObject: true });
      return { buffer: out.data, width: out.info.width, height: out.info.height };
    };

    return {
      source: {
        buffer: encodedSource.data,
        width: sourceInfo.width,
        height: sourceInfo.height,
        ...CONTENT_TYPE[format],
      },
      large: await derive(LARGE_WIDTH),
      thumb: await derive(THUMB_WIDTH),
    };
  } catch (error) {
    if (error instanceof CoverError) throw error;
    throw new CoverError("That image could not be read completely. It may be damaged. Export it again and retry.");
  }
}
