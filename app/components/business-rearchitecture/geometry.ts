/** Tiny helpers for the page's SVG schematics. Coordinates are rounded so server and browser always render identical markup. */
export type Point = { x: number; y: number };

export const round = (n: number) => Math.round(n * 10) / 10;

/** `count` points evenly spaced on a circle, the first at 12 o'clock, going clockwise. */
export function ringPoints(count: number, cx: number, cy: number, r: number): Point[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / count;
    return { x: round(cx + r * Math.cos(angle)), y: round(cy + r * Math.sin(angle)) };
  });
}
