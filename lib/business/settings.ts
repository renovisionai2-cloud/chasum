/** Business AI configuration (Summer + Chase). Config only — no model calls here. */

export type SummerAiConfig = {
  enabled: boolean;
  greeting: string;
  tone: "professional" | "friendly" | "concise" | "warm";
  escalation: string;
  business_knowledge: string;
};

export type ChaseAiConfig = {
  enabled: boolean;
  daily_summary: boolean;
  weekly_summary: boolean;
  recommendations: boolean;
  business_analytics: boolean;
};

export type BusinessAiSettings = {
  summer: SummerAiConfig;
  chase: ChaseAiConfig;
};

export const DEFAULT_AI_SETTINGS: BusinessAiSettings = {
  summer: {
    enabled: false,
    greeting: "",
    tone: "professional",
    escalation: "",
    business_knowledge: "",
  },
  chase: {
    enabled: false,
    daily_summary: true,
    weekly_summary: true,
    recommendations: true,
    business_analytics: true,
  },
};

export function parseAiSettings(raw: unknown): BusinessAiSettings {
  const base = structuredClone(DEFAULT_AI_SETTINGS);
  if (!raw || typeof raw !== "object") return base;
  const obj = raw as Record<string, unknown>;
  const summer = (obj.summer ?? {}) as Partial<SummerAiConfig>;
  const chase = (obj.chase ?? {}) as Partial<ChaseAiConfig>;
  return {
    summer: {
      enabled: Boolean(summer.enabled ?? base.summer.enabled),
      greeting: String(summer.greeting ?? base.summer.greeting),
      tone:
        summer.tone === "friendly" ||
        summer.tone === "concise" ||
        summer.tone === "warm"
          ? summer.tone
          : "professional",
      escalation: String(summer.escalation ?? base.summer.escalation),
      business_knowledge: String(
        summer.business_knowledge ?? base.summer.business_knowledge,
      ),
    },
    chase: {
      enabled: Boolean(chase.enabled ?? base.chase.enabled),
      daily_summary: Boolean(chase.daily_summary ?? base.chase.daily_summary),
      weekly_summary: Boolean(chase.weekly_summary ?? base.chase.weekly_summary),
      recommendations: Boolean(
        chase.recommendations ?? base.chase.recommendations,
      ),
      business_analytics: Boolean(
        chase.business_analytics ?? base.chase.business_analytics,
      ),
    },
  };
}

export const BUSINESS_TYPES = [
  "Sole proprietorship",
  "Partnership",
  "LLC",
  "Corporation",
  "Nonprofit",
  "Franchise",
  "Other",
] as const;

export const BUSINESS_LANGUAGES = [
  { value: "en", label: "English" },
  { value: "fr", label: "French" },
  { value: "es", label: "Spanish" },
  { value: "de", label: "German" },
  { value: "pt", label: "Portuguese" },
] as const;

export type BusinessClosureType =
  | "holiday"
  | "vacation"
  | "temporary"
  | "special_hours";

export type BusinessClosure = {
  id: string;
  business_id: string;
  location_id: string | null;
  closure_type: BusinessClosureType;
  name: string;
  starts_at: string;
  ends_at: string;
  open_time: string | null;
  close_time: string | null;
  is_recurring: boolean;
  notes: string | null;
  created_at: string;
};

export type BusinessDocument = {
  id: string;
  business_id: string;
  name: string;
  file_url: string;
  file_type: string | null;
  created_at: string;
};

export type BookingPageBranding = {
  headline?: string;
  show_logo?: boolean;
  show_cover?: boolean;
  primary_button_label?: string;
};

export function parseBookingPageBranding(raw: unknown): BookingPageBranding {
  if (!raw || typeof raw !== "object") {
    return {
      headline: "",
      show_logo: true,
      show_cover: true,
      primary_button_label: "Book now",
    };
  }
  const o = raw as Record<string, unknown>;
  return {
    headline: String(o.headline ?? ""),
    show_logo: o.show_logo !== false,
    show_cover: o.show_cover !== false,
    primary_button_label: String(o.primary_button_label ?? "Book now"),
  };
}
