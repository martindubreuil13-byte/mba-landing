import { buildTheBridgeFirst } from "./build-the-bridge-first";
import type { GuideContent } from "./types";

const GUIDES: GuideContent[] = [buildTheBridgeFirst];

export function getGuideContent(slug: string): GuideContent | null {
  return GUIDES.find((g) => g.slug === slug) ?? null;
}
