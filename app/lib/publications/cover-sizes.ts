/** Pure cover sizing, shared by the image pipeline (server) and the cover component (client-safe). */
export const LARGE_WIDTH = 1200;
export const THUMB_WIDTH = 480;

/** Display dimensions of a derivative at `targetWidth` (never enlarged, ratio preserved). */
export function derivativeSize(width: number, height: number, targetWidth: number) {
  if (width <= targetWidth) return { width, height };
  return { width: targetWidth, height: Math.max(1, Math.round((height * targetWidth) / width)) };
}
