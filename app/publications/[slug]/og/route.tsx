import { ImageResponse } from "next/og";
import sharp from "sharp";
import { getPublishedCoverPathBySlug } from "@/app/lib/publications/queries";
import { downloadPublic } from "@/app/lib/publications/storage";

export const dynamic = "force-dynamic";

const size = { width: 1200, height: 630 };

/**
 * Share image for one publication: the real, uncropped cover on the MBA ivory ground when there is one, a quiet
 * typographic card when not. Published titles only; anything else is a plain 404 that reveals nothing.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getPublishedCoverPathBySlug(slug);
  if (!p) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

  // ImageResponse (satori) cannot draw WebP, so the stored derivative is re-encoded as a PNG sized for the card.
  let cover: { src: string; width: number; height: number } | null = null;
  if (p.coverPath) {
    const bytes = await downloadPublic(p.coverPath);
    if (bytes) {
      try {
        const png = await sharp(bytes).resize({ height: 518, withoutEnlargement: true }).png().toBuffer({ resolveWithObject: true });
        cover = { src: `data:image/png;base64,${png.data.toString("base64")}`, width: png.info.width, height: png.info.height };
      } catch {
        cover = null; // fall back to the typographic card
      }
    }
  }

  const ground = "#f5f1ed";
  const ink = "#1a1816";
  const oxblood = "#6b1f1f";

  const element = cover && cover.width && cover.height ? (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", background: ground, padding: "56px 88px" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={cover.src} alt="" height={cover.height} width={cover.width} style={{ height: cover.height, width: cover.width, boxShadow: "0 18px 40px rgba(26,24,22,0.28)" }} />
      <div style={{ display: "flex", flexDirection: "column", marginLeft: 72, flex: 1 }}>
        <div style={{ fontSize: 22, letterSpacing: 4, textTransform: "uppercase", color: oxblood }}>Publication</div>
        <div style={{ fontSize: p.title.length > 40 ? 52 : 68, lineHeight: 1.08, color: ink, marginTop: 28, fontFamily: "serif" }}>{p.title}</div>
        <div style={{ fontSize: 26, color: ink, opacity: 0.7, marginTop: 28 }}>{p.author}</div>
      </div>
    </div>
  ) : (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", background: ground, padding: "0 96px", borderLeft: `10px solid ${oxblood}` }}>
      <div style={{ fontSize: 22, letterSpacing: 4, textTransform: "uppercase", color: oxblood }}>Publication</div>
      <div style={{ fontSize: p.title.length > 40 ? 64 : 84, lineHeight: 1.06, color: ink, marginTop: 32, fontFamily: "serif" }}>{p.title}</div>
      <div style={{ fontSize: 30, color: ink, opacity: 0.7, marginTop: 36 }}>{p.author}</div>
    </div>
  );

  return new ImageResponse(element, {
    ...size,
    headers: { "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=3600" },
  });
}
