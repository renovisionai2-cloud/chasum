/**
 * Shared Chasum industry editorial photography.
 * Local WebP only — no remote hotlinks. Used by homepage tiles + Industries detail.
 */

export type IndustryImageSet = {
  id: string;
  /** Detail-card hero */
  hero: string;
  /** Homepage card / thumbnail crop */
  thumbnail: string;
  alt: string;
  objectPosition?: string;
  heroWidth: number;
  heroHeight: number;
  thumbWidth: number;
  thumbHeight: number;
};

const HERO_W = 1600;
const HERO_H = 1067;
const THUMB_W = 900;
const THUMB_H = 720;

function image(
  id: string,
  alt: string,
  objectPosition?: string,
): IndustryImageSet {
  return {
    id,
    hero: `/marketing/industries/${id}.webp`,
    thumbnail: `/marketing/industries/${id}-tile.webp`,
    alt,
    objectPosition,
    heroWidth: HERO_W,
    heroHeight: HERO_H,
    thumbWidth: THUMB_W,
    thumbHeight: THUMB_H,
  };
}

/**
 * Canonical asset registry (one entry per photo file id).
 */
export const INDUSTRY_IMAGE_ASSETS = {
  "medical-clinics": image(
    "medical-clinics",
    "Clinician speaking with a patient in a modern clinic reception",
    "center 30%",
  ),
  "legal-services": image(
    "legal-services",
    "Attorney consulting a client across a table in a modern law office",
    "center 40%",
  ),
  salons: image(
    "salons",
    "Stylist working with a client in a contemporary salon",
    "center",
  ),
  spas: image(
    "spas",
    "Calm spa therapy room prepared for a treatment session",
    "center 35%",
  ),
  gyms: image(
    "gyms",
    "Trainer coaching a member on the fitness floor",
    "center",
  ),
  automotive: image(
    "automotive",
    "Technician servicing a vehicle in a clean automotive bay",
    "center 45%",
  ),
  "home-field-services": image(
    "home-field-services",
    "Field technician reviewing today’s jobs on a tablet",
    "center",
  ),
  "photography-creative": image(
    "photography-creative",
    "Photographer directing a client during a studio session",
    "center",
  ),
  "pet-services": image(
    "pet-services",
    "Veterinary or grooming professional with a pet owner",
    "center 40%",
  ),
  cleaning: image(
    "cleaning",
    "Professional cleaner working in a commercial office",
    "center",
  ),
  "professional-services": image(
    "professional-services",
    "Consultant meeting a client in a modern office",
    "center",
  ),
  education: image(
    "education",
    "Instructor teaching students in a bright classroom",
    "center",
  ),
} as const satisfies Record<string, IndustryImageSet>;

export type IndustryImageId = keyof typeof INDUSTRY_IMAGE_ASSETS;

/**
 * Display-name → asset id. Homepage category labels map to the same
 * editorial assets as the Industries page (no duplicated paths).
 */
const INDUSTRY_IMAGE_ALIASES: Record<string, IndustryImageId> = {
  // Industries page
  "Medical Clinics": "medical-clinics",
  "Legal Services": "legal-services",
  Salons: "salons",
  Spas: "spas",
  Gyms: "gyms",
  Automotive: "automotive",
  "Home & Field Services": "home-field-services",
  "Photography & Creative": "photography-creative",
  "Pet Services": "pet-services",
  Cleaning: "cleaning",
  "Professional Services": "professional-services",
  // Homepage category labels
  Healthcare: "medical-clinics",
  "Beauty & Personal Care": "salons",
  "Fitness & Wellness": "gyms",
  "Home & Construction Services": "home-field-services",
  Education: "education",
};

export function getIndustryImage(
  name: string,
): IndustryImageSet | undefined {
  const id = INDUSTRY_IMAGE_ALIASES[name];
  if (!id) return undefined;
  return INDUSTRY_IMAGE_ASSETS[id];
}

/** Approved Industries page order (display names). */
export const INDUSTRIES_PAGE_ORDER = [
  "Medical Clinics",
  "Legal Services",
  "Salons",
  "Spas",
  "Gyms",
  "Home & Field Services",
  "Automotive",
  "Professional Services",
  "Photography & Creative",
  "Pet Services",
  "Cleaning",
] as const;
