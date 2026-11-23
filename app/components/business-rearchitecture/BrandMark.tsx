import Image from "next/image";

/**
 * The official MBA logo, shown exactly as supplied (public/brand/mba-logo.png, never edited or recoloured).
 *
 * The supplied file is a square with a lot of empty background above and below the artwork. The frame below shows only the band that
 * holds the artwork, at the file's own width, by cropping with CSS: no pixel of the artwork is changed, scaled non-uniformly or moved.
 * Band: rows 280 to 930 of 1254 (the artwork spans rows 364 to 840). object-position y = 280 / (1254 - 650) = 46.4%.
 */
export const LOGO_SRC = "/brand/mba-logo.png";
export const LOGO_ALT = "The Modern Business Architect";

export default function BrandMark() {
  return (
    <div className="relative aspect-[1254/650] w-60 overflow-hidden md:w-72">
      <Image
        src={LOGO_SRC}
        alt={LOGO_ALT}
        fill
        priority
        sizes="(min-width: 768px) 288px, 240px"
        className="object-cover object-[50%_46.4%]"
      />
    </div>
  );
}
