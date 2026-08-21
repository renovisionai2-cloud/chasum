/**
 * Compatibility layer for industry photography.
 * Canonical source: `lib/marketing/industryImages.ts`.
 */

import {
  getIndustryImage,
  type IndustryImageSet,
} from "@/lib/marketing/industryImages";

export type IndustryVisual = {
  id: string;
  src: string;
  tileSrc: string;
  alt: string;
  objectPosition?: string;
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
};

function toVisual(image: IndustryImageSet): IndustryVisual {
  return {
    id: image.id,
    src: image.hero,
    tileSrc: image.thumbnail,
    alt: image.alt,
    objectPosition: image.objectPosition,
    width: image.heroWidth,
    height: image.heroHeight,
    tileWidth: image.thumbWidth,
    tileHeight: image.thumbHeight,
  };
}

export function getIndustryDetailVisual(
  industryName: string,
): IndustryVisual | undefined {
  const image = getIndustryImage(industryName);
  return image ? toVisual(image) : undefined;
}

export function getHomepageIndustryTileVisual(
  tileName: string,
): IndustryVisual | undefined {
  const image = getIndustryImage(tileName);
  return image ? toVisual(image) : undefined;
}

/** @deprecated Prefer getIndustryImage / INDUSTRY_IMAGE_ASSETS */
export const INDUSTRY_DETAIL_VISUALS: Record<string, IndustryVisual> = {};
/** @deprecated Prefer getIndustryImage / INDUSTRY_IMAGE_ASSETS */
export const HOMEPAGE_INDUSTRY_TILE_VISUALS: Record<string, IndustryVisual> = {};

// Populate legacy maps from the shared registry aliases used in UI.
for (const name of [
  "Medical Clinics",
  "Legal Services",
  "Salons",
  "Spas",
  "Gyms",
  "Automotive Services",
  "Home & Field Services",
  "Photography & Creative",
  "Pet Services",
  "Cleaning",
  "Professional Services",
  "Healthcare",
  "Beauty & Personal Care",
  "Fitness & Wellness",
  "Home & Construction Services",
  "Education",
] as const) {
  const visual = getIndustryDetailVisual(name);
  if (!visual) continue;
  if (
    name === "Healthcare" ||
    name === "Beauty & Personal Care" ||
    name === "Fitness & Wellness" ||
    name === "Home & Construction Services" ||
    name === "Education"
  ) {
    HOMEPAGE_INDUSTRY_TILE_VISUALS[name] = visual;
  } else {
    INDUSTRY_DETAIL_VISUALS[name] = visual;
    HOMEPAGE_INDUSTRY_TILE_VISUALS[name] = visual;
  }
}
