import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { CoverError, MAX_COVER_FILE_BYTES, processCoverImage, sniffImageFormat } from "./images";

/** Synthetic covers: a flat colour with a distinct stripe so orientation is observable. */
async function make(width: number, height: number, format: "jpeg" | "png" | "webp", opts: { orientation?: number; exif?: boolean } = {}) {
  let img = sharp({ create: { width, height, channels: 3, background: "#6b1f1f" } })
    .composite([{ input: { create: { width: Math.max(1, Math.floor(width / 4)), height: height, channels: 3, background: "#f5f1ed" } }, left: 0, top: 0 }]);
  if (opts.exif) img = img.withExif({ IFD0: { Copyright: "SECRET-OWNER", Artist: "SECRET-ARTIST" } });
  if (opts.orientation) img = img.withMetadata({ orientation: opts.orientation });
  return img[format]().toBuffer();
}

describe("format sniffing", () => {
  it("identifies by magic bytes, not by label", async () => {
    expect(sniffImageFormat(await make(400, 600, "jpeg"))).toBe("jpeg");
    expect(sniffImageFormat(await make(400, 600, "png"))).toBe("png");
    expect(sniffImageFormat(await make(400, 600, "webp"))).toBe("webp");
    expect(sniffImageFormat(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))).toBeNull();
    expect(sniffImageFormat(Buffer.from("GIF89a....."))).toBeNull();
    expect(sniffImageFormat(Buffer.from("%PDF-1.7"))).toBeNull();
    expect(sniffImageFormat(Buffer.alloc(0))).toBeNull();
  });
});

describe("cover processing", () => {
  it("accepts JPEG, PNG and WebP and produces a sanitised source plus WebP derivatives", async () => {
    for (const format of ["jpeg", "png", "webp"] as const) {
      const out = await processCoverImage(await make(1600, 2400, format));
      expect(sniffImageFormat(out.source.buffer)).toBe(format);
      expect(out.source).toMatchObject({ width: 1600, height: 2400 });
      expect(sniffImageFormat(out.large.buffer)).toBe("webp");
      expect(out.large.width).toBe(1200);
      expect(out.large.height).toBe(1800); // ratio preserved: never cropped or stretched
      expect(out.thumb.width).toBe(480);
      expect(out.thumb.height).toBe(720);
    }
  });
  it("never enlarges a small cover", async () => {
    const out = await processCoverImage(await make(400, 600, "png"));
    expect(out.large).toMatchObject({ width: 400, height: 600 });
    expect(out.thumb).toMatchObject({ width: 400, height: 600 });
  });
  it("strips EXIF/metadata from the stored source and from every derivative", async () => {
    const upload = await make(800, 1200, "jpeg", { exif: true });
    expect((await sharp(upload).metadata()).exif).toBeDefined();
    expect(upload.includes(Buffer.from("SECRET-OWNER"))).toBe(true);

    const out = await processCoverImage(upload);
    for (const image of [out.source.buffer, out.large.buffer, out.thumb.buffer]) {
      expect((await sharp(image).metadata()).exif).toBeUndefined();
      expect(image.includes(Buffer.from("SECRET-OWNER"))).toBe(false);
      expect(image.includes(Buffer.from("SECRET-ARTIST"))).toBe(false);
    }
  });
  it("bakes the EXIF orientation into the pixels (display dimensions, no orientation tag left)", async () => {
    const upload = await make(800, 1200, "jpeg", { orientation: 6 }); // stored landscape-shaped data? 6 = rotate 90°
    const display = await sharp(upload).metadata();
    expect(display.orientation).toBe(6);
    const out = await processCoverImage(upload);
    expect(out.source.width).toBe(1200);
    expect(out.source.height).toBe(800);
    expect((await sharp(out.source.buffer).metadata()).orientation).toBeUndefined();
    expect(out.large.width / out.large.height).toBeCloseTo(1.5, 1);
  });
  it("rejects SVG, GIF, PDF and arbitrary bytes", async () => {
    for (const bad of [
      Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'),
      Buffer.from("GIF89a" + "x".repeat(100)),
      Buffer.from("%PDF-1.7 " + "x".repeat(100)),
      Buffer.from("just some text".repeat(20)),
    ]) {
      await expect(processCoverImage(bad)).rejects.toBeInstanceOf(CoverError);
    }
  });
  it("rejects an empty file and a file over the byte cap", async () => {
    await expect(processCoverImage(Buffer.alloc(0))).rejects.toThrow(/empty/);
    await expect(processCoverImage(Buffer.alloc(MAX_COVER_FILE_BYTES + 1, 1))).rejects.toThrow(/3\.8 MB/);
  });
  it("rejects truncated / corrupt image data (full decode, not just a header)", async () => {
    const good = await make(1200, 1800, "jpeg");
    await expect(processCoverImage(good.subarray(0, Math.floor(good.length / 2)))).rejects.toBeInstanceOf(CoverError);
    const png = await make(1200, 1800, "png");
    const corrupted = Buffer.from(png);
    corrupted.fill(0x41, Math.floor(png.length / 2), Math.floor(png.length / 2) + 400);
    await expect(processCoverImage(corrupted)).rejects.toBeInstanceOf(CoverError);
  });
  it("rejects a cover that is too small or too large", async () => {
    await expect(processCoverImage(await make(200, 300, "png"))).rejects.toThrow(/too small/);
    await expect(processCoverImage(await make(8100, 400, "png"))).rejects.toThrow(/too large/);
  });
  it("rejects a decompression bomb by pixel count", async () => {
    // 7000 x 7000 = 49 MP > 40 MP, tiny on disk
    const bomb = await sharp({ create: { width: 7000, height: 7000, channels: 3, background: "#000" } }).png({ compressionLevel: 9 }).toBuffer();
    expect(bomb.length).toBeLessThan(MAX_COVER_FILE_BYTES);
    await expect(processCoverImage(bomb)).rejects.toBeInstanceOf(CoverError);
  });
  it("rejects an animated WebP", async () => {
    const frame = (background: string) => sharp({ create: { width: 400, height: 600, channels: 3, background } }).png().toBuffer();
    const animated = await sharp([await frame("#f00"), await frame("#00f")], { join: { animated: true } }).webp({ loop: 0, delay: [100, 100] }).toBuffer();
    expect((await sharp(animated).metadata()).pages).toBe(2);
    await expect(processCoverImage(animated)).rejects.toThrow(/Animated/);
  });
});
