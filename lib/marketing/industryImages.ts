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
    "Physician consulting a patient in a modern private clinic with natural light",
    "center 28%",
  ),
  "legal-services": image(
    "legal-services",
    "Attorney consulting a client in an elegant executive law office",
    "center 40%",
  ),
  salons: image(
    "salons",
    "Professional stylist with a client in a luxury salon with natural light",
    "center",
  ),
  spas: image(
    "spas",
    "Therapist preparing a calm luxury spa treatment room for a client",
    "center 35%",
  ),
  gyms: image(
    "gyms",
    "Trainer working with a member in a boutique fitness studio",
    "center",
  ),
  automotive: image(
    "automotive",
    "Technician using diagnostics in a bright modern luxury service centre",
    "center 45%",
  ),
  "home-field-services": image(
    "home-field-services",
    "Professional contractor reviewing a renovation project on a tablet",
    "center",
  ),
  "photography-creative": image(
    "photography-creative",
    "Photographer directing a client in a modern creative studio",
    "center",
  ),
  "pet-services": image(
    "pet-services",
    "Veterinarian gently examining a dog in a bright modern veterinary clinic",
    "center 40%",
  ),
  cleaning: image(
    "cleaning",
    "Professional cleaning team maintaining a modern commercial office",
    "center",
  ),
  "professional-services": image(
    "professional-services",
    "Advisor meeting a client in a premium executive workspace",
    "center",
  ),
  education: image(
    "education",
    "Instructor with students in a bright modern learning environment",
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
