/**
 * Security — trust page for business owners (not engineering docs).
 * STATUS: APPROVED · VERSION: Resources v1 · STATE: Locked
 * See docs/marketing/RESOURCES_V1_LOCK.md
 */

export const SECURITY_PAGE = {
  eyebrow: "Security",
  headline: "Security Built Into Chasum",
  lede: "Your business data matters. Chasum is designed with careful safeguards from the start—so you can focus on customers with confidence.",
} as const;

export const SECURITY_CARDS = [
  {
    title: "Secure Authentication",
    detail:
      "Your account is protected using modern authentication and encrypted sessions.",
    icon: "auth" as const,
  },
  {
    title: "Protected Business Data",
    detail: "Every business has its own secure workspace.",
    icon: "workspace" as const,
  },
  {
    title: "Encrypted Connections",
    detail: "All communication is encrypted using HTTPS.",
    icon: "encrypt" as const,
  },
  {
    title: "Trusted Infrastructure",
    detail:
      "Built on trusted cloud providers including Supabase, Stripe, Twilio, and Resend.",
    icon: "cloud" as const,
  },
  {
    title: "Automatic Backups",
    detail:
      "Business data is backed up using managed cloud infrastructure.",
    icon: "backup" as const,
  },
  {
    title: "Continuous Security Improvements",
    detail:
      "Security evolves alongside Chasum as we continue building.",
    icon: "improve" as const,
  },
] as const;

export const SECURITY_TRANSPARENCY = {
  title: "Private Alpha Transparency",
  subtitle:
    "We would rather be clear than impressive. Trust grows from honesty.",
  points: [
    "We don't claim certifications we haven't earned.",
    "We continuously improve security as Chasum grows.",
    "We follow responsible engineering practices.",
    "We value transparency over marketing language.",
  ],
  note: "Private Alpha is not a finished enterprise security program. Production-critical guarantees, when needed, are confirmed in writing during onboarding—not as vague public promises.",
} as const;

export const SECURITY_SUPPORT = {
  title: "Questions about security?",
  body: "Check System Status for service notes, or contact us if you need to report a concern.",
} as const;
