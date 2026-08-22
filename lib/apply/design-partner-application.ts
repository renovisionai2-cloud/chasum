/**
 * /apply design-partner application parsing and persistence mapping.
 * Does not create auth users, businesses, subscriptions, or Stripe objects.
 */

export const DESIGN_PARTNER_APPLICATIONS_TABLE =
  "design_partner_applications" as const;

/**
 * True only when Postgres/PostgREST reports that the
 * design_partner_applications TABLE is missing (037 unapplied).
 * Does not treat missing columns, RLS, permissions, or generic failures
 * as an unapplied migration. Shared isMissingSchemaError() is intentionally
 * not used here — it matches any "does not exist" substring.
 */
export function isDesignPartnerApplicationsTableMissing(
  error: { code?: string | null; message?: string | null } | unknown,
): boolean {
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code?: string | null }).code ?? "")
      : "";
  const message =
    typeof error === "string"
      ? error
      : error && typeof error === "object" && "message" in error
        ? String((error as { message?: string | null }).message ?? "")
        : error instanceof Error
          ? error.message
          : "";
  if (!message && !code) return false;

  const m = message.toLowerCase();
  if (/\bcolumn\b/.test(m) && m.includes("does not exist")) return false;
  if (m.includes("permission denied")) return false;
  if (m.includes("row-level security") || m.includes("rls policy")) {
    return false;
  }
  if (m.includes("violates") && m.includes("constraint")) return false;

  const table = DESIGN_PARTNER_APPLICATIONS_TABLE;
  const namesMissingTable =
    new RegExp(
      `relation\\s+"(?:public\\.)?${table}"\\s+does not exist`,
      "i",
    ).test(message) ||
    new RegExp(
      `could not find the table ['"](?:public\\.)?${table}['"]`,
      "i",
    ).test(message) ||
    new RegExp(
      `could not find the relation ['"](?:public\\.)?${table}['"]`,
      "i",
    ).test(message);

  if (code === "42P01" || code === "PGRST205") {
    return namesMissingTable;
  }
  return namesMissingTable;
}

export const DESIGN_PARTNER_STATUSES = [
  "received",
  "reviewing",
  "accepted",
  "declined",
  "waitlisted",
] as const;

export type DesignPartnerStatus = (typeof DESIGN_PARTNER_STATUSES)[number];

export type DesignPartnerApplicationInput = {
  businessName: string;
  industry: string;
  employees: string;
  locations: string;
  currentSoftware: string;
  monthlyAppointments: string;
  painPoint: string;
  email: string;
  phone: string;
  notes: string;
};

export type DesignPartnerApplicationRow = {
  business_name: string;
  industry: string;
  employees: string;
  locations: string;
  current_software: string;
  monthly_appointments: string;
  pain_point: string;
  contact_email: string;
  contact_phone: string | null;
  notes: string | null;
  requested_plan_key: null;
  status: "received";
  source: "apply";
};

export type DesignPartnerParseResult =
  | { ok: true; value: DesignPartnerApplicationInput }
  | { ok: false; error: string };

function required(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function optional(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export function parseDesignPartnerApplication(
  formData: FormData,
): DesignPartnerParseResult {
  const value: DesignPartnerApplicationInput = {
    businessName: required(formData, "business_name"),
    industry: required(formData, "industry"),
    employees: required(formData, "employees"),
    locations: required(formData, "locations"),
    currentSoftware: required(formData, "current_software"),
    painPoint: required(formData, "pain_point"),
    monthlyAppointments: required(formData, "monthly_appointments"),
    email: required(formData, "email"),
    phone: optional(formData, "phone"),
    notes: optional(formData, "notes"),
  };

  if (
    !value.businessName ||
    !value.industry ||
    !value.employees ||
    !value.locations ||
    !value.currentSoftware ||
    !value.painPoint ||
    !value.monthlyAppointments ||
    !value.email
  ) {
    return { error: "Please complete all required fields.", ok: false };
  }

  if (!value.email.includes("@")) {
    return { error: "Please enter a valid email address.", ok: false };
  }

  return { ok: true, value };
}

export function toDesignPartnerApplicationRow(
  input: DesignPartnerApplicationInput,
): DesignPartnerApplicationRow {
  return {
    business_name: input.businessName,
    industry: input.industry,
    employees: input.employees,
    locations: input.locations,
    current_software: input.currentSoftware,
    monthly_appointments: input.monthlyAppointments,
    pain_point: input.painPoint,
    contact_email: input.email,
    contact_phone: input.phone || null,
    notes: input.notes || null,
    requested_plan_key: null,
    status: "received",
    source: "apply",
  };
}

export function designPartnerNotificationText(
  input: DesignPartnerApplicationInput,
  submittedAt: string,
): string {
  return [
    "New Chasum Private Alpha / Design Partner application",
    "",
    `Business: ${input.businessName}`,
    `Business type: ${input.industry}`,
    `Team size: ${input.employees}`,
    `Locations: ${input.locations}`,
    `Current software: ${input.currentSoftware}`,
    `Monthly appointments: ${input.monthlyAppointments}`,
    `Improve: ${input.painPoint}`,
    `Email: ${input.email}`,
    `Phone: ${input.phone || "(not provided)"}`,
    `Notes: ${input.notes || "(none)"}`,
    `Submitted: ${submittedAt}`,
  ].join("\n");
}
