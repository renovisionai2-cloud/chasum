import { FS_BUSINESS_CATEGORIES } from "@/lib/marketing/flagship-summer";
import {
  isApplyPlanIntentId,
  type ApplyPlanIntentId,
} from "@/lib/marketing/pricing";

export const APPLY_INDUSTRY_LABELS: readonly string[] =
  FS_BUSINESS_CATEGORIES.flatMap((category) =>
    category.industries.map((industry) => industry.label),
  );

const knownIndustryLabels = new Set(APPLY_INDUSTRY_LABELS);

export const APPLY_FIELD_ORDER = [
  "business_name",
  "industry",
  "employees",
  "locations",
  "current_software",
  "monthly_activity",
  "pain_point",
  "email",
] as const;

export type ApplyFieldId = (typeof APPLY_FIELD_ORDER)[number];

export type ApplyFieldErrors = Partial<Record<ApplyFieldId, string>>;

export const APPLY_DELIVERY_ERROR =
  "We couldn’t send your application right now. Please try again. If the problem continues, contact sales@chasumai.com.";

export type DesignPartnerSubmission = {
  businessName: string;
  industry: string;
  employees: string;
  locations: string;
  currentSoftware: string;
  painPoint: string;
  monthlyActivity: string;
  preferredPlan: ApplyPlanIntentId | "";
  email: string;
  phone: string;
  notes: string;
};

function readTrimmed(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export function isKnownApplyIndustry(value: string): boolean {
  return knownIndustryLabels.has(value);
}

export function readDesignPartnerSubmission(
  formData: FormData,
): DesignPartnerSubmission {
  const preferredPlanRaw = readTrimmed(formData, "preferred_plan");
  return {
    businessName: readTrimmed(formData, "business_name"),
    industry: readTrimmed(formData, "industry"),
    employees: readTrimmed(formData, "employees"),
    locations: readTrimmed(formData, "locations"),
    currentSoftware: readTrimmed(formData, "current_software"),
    painPoint: readTrimmed(formData, "pain_point"),
    monthlyActivity:
      readTrimmed(formData, "monthly_activity") ||
      readTrimmed(formData, "monthly_appointments"),
    preferredPlan: isApplyPlanIntentId(preferredPlanRaw)
      ? preferredPlanRaw
      : "",
    email: readTrimmed(formData, "email"),
    phone: readTrimmed(formData, "phone"),
    notes: readTrimmed(formData, "notes"),
  };
}

export function validateDesignPartnerSubmission(
  data: DesignPartnerSubmission,
): { ok: true } | { ok: false; errors: ApplyFieldErrors } {
  const errors: ApplyFieldErrors = {};

  if (!data.businessName) errors.business_name = "Enter your business name.";
  if (!data.industry || !isKnownApplyIndustry(data.industry)) {
    errors.industry = "Select a business type.";
  }
  if (!data.employees) errors.employees = "Enter your team size.";
  if (!data.locations) errors.locations = "Enter the number of locations.";
  if (!data.currentSoftware) {
    errors.current_software = "Tell us what software you use today.";
  }
  if (!data.monthlyActivity) {
    errors.monthly_activity = "Enter your approximate monthly customer activity.";
  }
  if (!data.painPoint) {
    errors.pain_point = "Tell us what you’d most like to improve.";
  }
  if (!data.email) {
    errors.email = "Enter your work email.";
  } else if (!data.email.includes("@")) {
    errors.email = "Enter a valid work email.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }
  return { ok: true };
}

export function firstInvalidApplyField(
  errors: ApplyFieldErrors,
): ApplyFieldId | null {
  return APPLY_FIELD_ORDER.find((field) => errors[field]) ?? null;
}

export function serverErrorFromApplyErrors(
  data: DesignPartnerSubmission,
  errors: ApplyFieldErrors,
): string {
  if (errors.email && data.email) {
    return "Please enter a valid email address.";
  }
  return "Please complete all required fields.";
}
