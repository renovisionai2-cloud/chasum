/**
 * Why Private Alpha — story-driven design partner page.
 * STATUS: APPROVED · VERSION: Resources v1 · STATE: Locked
 * See docs/marketing/RESOURCES_V1_LOCK.md
 */

export const PRIVATE_ALPHA_PAGE = {
  eyebrow: "Why Private Alpha",
  headline: "Help Build the Future of Business Management",
  lede: "Chasum is being built alongside real businesses. Every feature begins with real customer feedback. Instead of releasing hundreds of features at once, we're focused on solving real business problems one step at a time.",
} as const;

export const PRIVATE_ALPHA_STORY = [
  "Joining now means you help shape the product while it grows—and you get a partner who listens.",
  "We work with a limited number of design partners so every conversation matters. Your day-to-day reality guides what we build next.",
] as const;

export const PRIVATE_ALPHA_BENEFITS = {
  title: "Design Partners Receive",
  subtitle:
    "Private Alpha is an invitation to build with us—not a finished, self-serve product launch.",
  cards: [
    {
      title: "Early access",
      detail:
        "Use Chasum in your business before public launch and grow with the platform.",
      icon: "early" as const,
    },
    {
      title: "Direct influence",
      detail:
        "Your feedback shapes product decisions—so what we ship solves problems you actually have.",
      icon: "influence" as const,
    },
    {
      title: "Priority support",
      detail:
        "Talk with the people building Chasum when something matters for your day-to-day work.",
      icon: "support" as const,
    },
    {
      title: "Personal onboarding",
      detail:
        "We help set up your business the right way, so you start with confidence—not a blank setup screen.",
      icon: "onboarding" as const,
    },
    {
      title: "Shape Summer",
      detail:
        "Help guide how Summer—our AI Business Manager—supports real customer conversations and operations.",
      icon: "summer" as const,
    },
    {
      title: "Founding partner terms",
      detail:
        "Access, pricing, and included capabilities are confirmed clearly during onboarding—including founding terms for design partners.",
      icon: "terms" as const,
    },
  ],
} as const;

export const PRIVATE_ALPHA_STEPS = {
  title: "How Private Alpha Works",
  subtitle: "A clear path from application to partnership.",
  steps: [
    {
      step: 1,
      title: "Apply",
      detail: "Tell us about your business and how you work today.",
    },
    {
      step: 2,
      title: "Meet our team",
      detail: "Walk through Chasum together and confirm it’s a good fit.",
    },
    {
      step: 3,
      title: "Set up your business",
      detail: "We help configure scheduling, customers, and your workflows.",
    },
    {
      step: 4,
      title: "Use Chasum",
      detail: "Run real appointments and day-to-day work in the product.",
    },
    {
      step: 5,
      title: "Share feedback",
      detail: "Tell us what’s working and what still gets in your way.",
    },
    {
      step: 6,
      title: "Watch Chasum improve",
      detail: "See your input turn into clearer, stronger capabilities over time.",
    },
  ],
} as const;

export const PRIVATE_ALPHA_CLOSING = {
  title: "Ready to build with us?",
  lede: "Private Alpha is for business owners who want a partner—not just another piece of software.",
} as const;
