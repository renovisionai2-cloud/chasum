/**
 * Meet Summer — complete flagship experience copy (rebuild).
 * Engines reused: Discovery, Knowledge, Session Memory, Provider Registry.
 */

export const MEET_SUMMER_PROMPTS = [
  "I run an ultrasound clinic",
  "We have 4 employees",
  "We use Picktime",
  "Reporting is our biggest challenge",
] as const;

/** Chapter 1 — cinematic introduction */
export const MEET_SUMMER_CH1 = {
  brand: "Meet Summer",
  headline: "The Intelligence Behind Every Business Decision.",
  aside: "AI Business Assistant",
} as const;

/** Chapter 7 — operating system roadmap */
export const MEET_SUMMER_CH7 = {
  eyebrow: "Chapter 07",
  title: "The AI Business Operating System",
  lede: "Summer is only the beginning — one shared brain across every department.",
  phases: [
    {
      phase: "Today",
      items: ["Website Concierge", "AI Reception"],
    },
    {
      phase: "Next",
      items: [
        "CRM Intelligence",
        "Marketing Intelligence",
        "Billing Intelligence",
        "Reporting Intelligence",
      ],
    },
    {
      phase: "Future",
      items: ["Complete AI Business Operating System"],
    },
  ],
} as const;

/** Chapter 8 — close */
export const MEET_SUMMER_CH8 = {
  eyebrow: "Chapter 08",
  title: "Private Alpha",
  lede:
    "When you understand Summer, applying is the natural next step — not the destination.",
} as const;

/** Experience stage chapter labels (2–6 live in one intelligence surface) */
export const MEET_SUMMER_EXPERIENCE = {
  eyebrow: "Chapters 02–06",
  title: "Meet the intelligence layer.",
  lede:
    "Summer enters. She discovers your business. You watch her understand — then recommend with reasoning.",
} as const;

/** Visible intelligence labels shown beside the experience */
export const MEET_SUMMER_VISIBLE_INTEL = [
  "Understanding your business…",
  "Loading industry knowledge…",
  "Recognizing patterns…",
  "Comparing workflows…",
  "Preparing recommendations…",
  "Building personalized guidance…",
] as const;
