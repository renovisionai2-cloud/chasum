/**
 * Central mapping for Chasum industry photography.
 * Assets live under /public/marketing/industries (local WebP only — no remote hotlinks).
 */

export type IndustryVisual = {
  id: string;
  /** Full-bleed / detail hero source */
  src: string;
  /** Homepage tile crop */
  tileSrc: string;
  alt: string;
  /** CSS object-position when the subject needs a stronger focal point */
  objectPosition?: string;
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
};

const DETAIL_W = 1600;
const DETAIL_H = 1067;
const TILE_W = 800;
const TILE_H = 560;

function visual(
  id: string,
  alt: string,
  objectPosition?: string,
): IndustryVisual {
  return {
    id,
    src: `/marketing/industries/${id}.webp`,
    tileSrc: `/marketing/industries/${id}-tile.webp`,
    alt,
    objectPosition,
    width: DETAIL_W,
    height: DETAIL_H,
    tileWidth: TILE_W,
    tileHeight: TILE_H,
  };
}

/** Detail-card heroes keyed by INDUSTRIES[].name */
export const INDUSTRY_DETAIL_VISUALS: Record<string, IndustryVisual> = {
  "Medical Clinics": visual(
    "medical-clinics",
    "Modern clinic care team in a calm reception environment with no readable patient information",
    "center",
  ),
  "Legal Services": visual(
    "legal-services",
    "Modern law office consultation setting with no readable confidential documents",
    "center 40%",
  ),
  Salons: visual(
    "salons",
    "Contemporary salon floor with active service and reception workflow",
    "center",
  ),
  Spas: visual(
    "spas",
    "Calm professional spa treatment environment with soft natural light",
    "center 35%",
  ),
  Gyms: visual(
    "gyms",
    "Modern fitness facility with trainer and member context at the floor",
    "center",
  ),
  Automotive: visual(
    "automotive",
    "Clean automotive service environment with advisor and vehicle context",
    "center 45%",
  ),
  "Home & Field Services": visual(
    "home-field-services",
    "Field technician reviewing work on a tablet at a job site",
    "center",
  ),
  "Photography & Creative": visual(
    "photography-creative",
    "Working photography studio with production equipment and calm focus",
    "center",
  ),
  "Pet Services": visual(
    "pet-services",
    "Modern pet-care environment with attentive professional service context",
    "center 40%",
  ),
  Cleaning: visual(
    "cleaning",
    "Organized professional cleaning service workflow in a bright interior",
    "center",
  ),
  "Professional Services": visual(
    "professional-services",
    "Modern advisor meeting with a client in a professional office setting",
    "center",
  ),
};

/**
 * Homepage category tiles — broader labels mapped deliberately to industry photography.
 * Healthcare → Medical Clinics / healthcare businesses
 * Legal Services → law firms (dedicated; not folded into Professional Services)
 * Professional Services → accountants, consultants and similar practices
 */
export const HOMEPAGE_INDUSTRY_TILE_VISUALS: Record<string, IndustryVisual> = {
  Healthcare: visual(
    "healthcare",
    "Modern healthcare clinic corridor and care environment",
    "center",
  ),
  "Legal Services": visual(
    "legal-services",
    "Modern law office consultation setting with no readable confidential documents",
    "center 40%",
  ),
  "Beauty & Personal Care": visual(
    "beauty-personal-care",
    "Contemporary beauty salon with active service workflow",
    "center",
  ),
  "Fitness & Wellness": visual(
    "fitness-wellness",
    "Modern fitness facility with trainers and members in motion",
    "center",
  ),
  "Home & Construction Services": visual(
    "home-construction",
    "Construction and home-service crew coordinating work on site",
    "center",
  ),
  Automotive: visual(
    "automotive",
    "Clean automotive service environment with advisor and vehicle context",
    "center 45%",
  ),
  "Professional Services": visual(
    "professional-services",
    "Modern advisor meeting with a client in a professional office setting",
    "center",
  ),
  "Photography & Creative": visual(
    "photography-creative",
    "Working photography studio with production equipment and calm focus",
    "center",
  ),
  "Pet Services": visual(
    "pet-services",
    "Modern pet-care environment with attentive professional service context",
    "center 40%",
  ),
  Education: visual(
    "education",
    "Calm instructional environment supporting scheduling and communication",
    "center",
  ),
};

export function getIndustryDetailVisual(
  industryName: string,
): IndustryVisual | undefined {
  return INDUSTRY_DETAIL_VISUALS[industryName];
}

export function getHomepageIndustryTileVisual(
  tileName: string,
): IndustryVisual | undefined {
  return HOMEPAGE_INDUSTRY_TILE_VISUALS[tileName];
}
