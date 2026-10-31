import { derivativeSize, LARGE_WIDTH, THUMB_WIDTH } from "@/app/lib/publications/cover-sizes";
import type { PublicationCoverView } from "@/app/lib/publications/types";

/**
 * The cover, exactly as supplied: never cropped, never stretched. The intrinsic ratio is declared so the layout
 * does not jump while it loads. `thumb` selects the smaller derivative for catalogue rows.
 */
export default function PublicationCover({
  cover,
  sizes,
  priority = false,
  className = "",
}: {
  cover: PublicationCoverView;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const large = derivativeSize(cover.width, cover.height, LARGE_WIDTH);
  const thumb = derivativeSize(cover.width, cover.height, THUMB_WIDTH);
  const sameFile = cover.src === cover.thumbSrc;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- fixed-size derivatives from our own storage; the ratio is declared
    <img
      src={cover.src}
      srcSet={sameFile ? undefined : `${cover.thumbSrc} ${thumb.width}w, ${cover.src} ${large.width}w`}
      sizes={sameFile ? undefined : sizes}
      width={large.width}
      height={large.height}
      alt={cover.alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
      className={`block h-auto w-full bg-[#1a1816]/[0.04] shadow-[0_1px_2px_rgba(26,24,22,0.12),0_18px_40px_-18px_rgba(26,24,22,0.35)] ${className}`}
    />
  );
}
