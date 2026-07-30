/**
 * Official marketing positioning for Summer.
 *
 * Summer is the product / face of Chasum.
 * AI Business Manager is her primary role.
 * AI Receptionist is one capability within that role — keep that phrase only
 * when copy specifically means answering calls, booking, or customer inquiries.
 */

export const SUMMER_NAME = "Summer" as const;

/** Primary title pair for heroes / identity lines */
export const SUMMER_PRIMARY_TITLE = "Summer" as const;
export const SUMMER_PRIMARY_ROLE = "Your AI Business Manager" as const;

/** Compact identity strings for UI chrome */
export const SUMMER_IDENTITY =
  "Summer — Chasum's AI Business Manager" as const;
export const SUMMER_IDENTITY_SHORT = "Summer · AI Business Manager" as const;
export const SUMMER_ROLE_SHORT = "AI Business Manager" as const;

/** Supporting message for Meet Summer / intro sections */
export const SUMMER_SUPPORTING_MESSAGE =
  "Meet Summer, the AI Business Manager behind Chasum. She helps businesses discover Chasum, get set up, answer customer questions, manage appointments, support staff, automate repetitive work, and grow every day." as const;

/** Shorter supporting line when space is tight */
export const SUMMER_SUPPORTING_MESSAGE_SHORT =
  "Meet Summer, the AI Business Manager behind Chasum. She helps you discover, launch, operate, support customers, and grow—from one AI-powered experience." as const;

/** Plan / feature list label (overall inclusion of Summer) */
export const SUMMER_FEATURE_LABEL = "Summer — AI Business Manager" as const;

/** Capability phrasing when specifically describing reception work */
export const SUMMER_RECEPTION_CAPABILITY = "AI Receptionist" as const;

export const SUMMER_FAQ = {
  whoIsSummer: {
    q: "Who is Summer?",
    a: "Summer is Chasum's AI Business Manager. She helps you discover Chasum, get your business running, answer customer questions, automate everyday work, support your team, and help your business grow.",
  },
  onlyPhoneCalls: {
    q: "Does Summer only answer phone calls?",
    a: "No. Handling customer questions and appointment requests is only one of Summer's AI Receptionist capabilities (grounded chat and messaging where configured; voice calling is not available yet). She also assists with onboarding guidance, scheduling, customer communication, product guidance, automation, staff training, reporting, and business growth.",
  },
  teachChasum: {
    q: "Can Summer teach me how to use Chasum?",
    a: "Yes. Summer guides new users through setup, explains features, answers “How do I…” questions, and helps teams learn the platform.",
  },
  everyPlan: {
    q: "Is Summer included in every plan?",
    a: "Summer — Chasum's AI Business Manager — starts with Professional and is included in Business and Enterprise. Free focuses on core scheduling and email communication.",
  },
} as const;
