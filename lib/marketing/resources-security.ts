/**
 * Security — trust page for business owners (not engineering docs).
 * STATUS: APPROVED · COMPLETE · VERSION: Security v1 · STATE: Locked
 * See docs/marketing/SECURITY_V1_LOCK.md
 */

export const SECURITY_PAGE = {
  eyebrow: "Security",
  headline: "Security Designed Around Your Business",
  lede: "Your business data matters. Chasum is designed with careful safeguards from the start—so you can focus on customers with confidence.",
} as const;

export const SECURITY_CARDS = [
  {
    title: "Secure Authentication",
    detail:
      "Accounts use Supabase-powered authentication with secure sign-in and session handling.",
    icon: "auth" as const,
  },
  {
    title: "Protected Business Data",
    detail:
      "Business data is organized within its own workspace, with access controls designed to keep it separate from other businesses.",
    icon: "workspace" as const,
  },
  {
    title: "Encrypted Connections",
    detail: "Connections to Chasum use HTTPS.",
    icon: "encrypt" as const,
  },
  {
    title: "Trusted Infrastructure",
    detail:
      "Chasum uses established cloud providers for hosting, authentication, data storage, and communications.",
    icon: "cloud" as const,
  },
  {
    title: "Managed Data Infrastructure",
    detail: "Business data is stored using managed cloud infrastructure.",
    icon: "data" as const,
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
