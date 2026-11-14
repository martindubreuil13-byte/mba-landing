import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { getAdminUser } from "@/app/lib/supabase/admin-session";
import { getServiceClient } from "@/app/lib/supabase/service";
import { BodyTooLargeError, isSameOriginRequest, readBodyBytes } from "@/app/lib/publications/request-guards";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!(await getAdminUser())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSameOriginRequest(request.headers)) return Response.json({ error: "Cross-site request refused." }, { status: 403 });
  let image: Buffer;
  try {
    const bytes = await readBodyBytes(request, 3 * 1024 * 1024);
    const input = sharp(bytes, { limitInputPixels: 20_000_000 });
    const { format } = await input.metadata();
    if (!["jpeg", "png", "webp"].includes(format ?? "")) throw new Error("Unsupported image");
    image = await input.rotate().resize({ width: 1200, height: 1600, fit: "inside", withoutEnlargement: true }).png().toBuffer();
  } catch (error) {
    return Response.json({ error: "Choose a valid JPG, PNG, or WebP up to 3 MB and 20 megapixels." },
      { status: error instanceof BodyTooLargeError ? 413 : 400 });
  }
  const bucket = getServiceClient().storage.from("resource-covers");
  const path = "newsletter/" + randomUUID() + ".png";
  const { error } = await bucket.upload(path, image, { contentType: "image/png", upsert: false });
  if (error) return Response.json({ error: "Image upload failed. Try again." }, { status: 502 });
  return Response.json({ url: bucket.getPublicUrl(path).data.publicUrl });
}
