/**
 * CRM customer write helpers. Kept out of the `"use server"` module so they
 * are not treated as Server Actions.
 *
 * Membership writes stay gated until the composite-FK design ships. Default OFF.
 */

export const CUSTOMER_MEMBERSHIP_WRITES_ENABLED = false;

export const CUSTOMER_PROFILE_CONFLICT =
  "This customer was updated in another session. Refresh the profile and review before saving.";

export const CUSTOMER_CONSENT_INVALID =
  "Marketing consent update is invalid. Refresh the profile and try again.";

export const CUSTOMER_CONSENT_UNAVAILABLE =
  "Marketing consent could not be saved. Refresh the profile and try again.";

export const CUSTOMER_VERSION_REQUIRED =
  "This customer profile is out of date. Refresh and review before saving.";

export type ConsentWriteIntent =
  | { kind: "omit" }
  | { kind: "grant" }
  | { kind: "revoke" }
  | { kind: "invalid"; error: string };

function consentFlag(value: FormDataEntryValue): "true" | "false" | "bad" {
  if (value === "on" || value === "true" || value === "grant") return "true";
  if (value === "false" || value === "off" || value === "revoke") return "false";
  return "bad";
}

/**
 * Explicit consent-edit contract for CRM updates.
 * Absence of marketing_consent_intent means the save is a profile edit, not a
 * consent change — even if a stale marketing_consent field is present.
 */
export function parseConsentWriteIntent(formData: FormData): ConsentWriteIntent {
  const intents = formData
    .getAll("marketing_consent_intent")
    .map((value) => String(value).trim())
    .filter(Boolean);
  const unique = [...new Set(intents)];
  if (unique.length === 0) return { kind: "omit" };
  if (unique.length !== 1) return { kind: "invalid", error: CUSTOMER_CONSENT_INVALID };
  const intent = unique[0];
  if (intent !== "edit" && intent !== "grant" && intent !== "revoke") {
    return { kind: "invalid", error: CUSTOMER_CONSENT_INVALID };
  }

  const flags = formData.getAll("marketing_consent");
  if (intent === "grant") {
    if (flags.some((value) => consentFlag(value) === "false")) {
      return { kind: "invalid", error: CUSTOMER_CONSENT_INVALID };
    }
    return { kind: "grant" };
  }
  if (intent === "revoke") {
    if (flags.some((value) => consentFlag(value) === "true")) {
      return { kind: "invalid", error: CUSTOMER_CONSENT_INVALID };
    }
    return { kind: "revoke" };
  }

  if (flags.length === 0) return { kind: "revoke" };
  if (flags.length === 1) {
    const parsed = consentFlag(flags[0]!);
    if (parsed === "true") return { kind: "grant" };
    if (parsed === "false") return { kind: "revoke" };
  }
  return { kind: "invalid", error: CUSTOMER_CONSENT_INVALID };
}

/** Exact DB timestamptz from the form snapshot. Do not re-serialize. */
export function parseExpectedCustomerVersion(
  formData: FormData,
): { ok: true; updatedAt: string } | { ok: false; error: string } {
  const values = formData
    .getAll("expected_updated_at")
    .map((value) => String(value).trim())
    .filter(Boolean);
  if (values.length !== 1) {
    return { ok: false, error: CUSTOMER_VERSION_REQUIRED };
  }
  return { ok: true, updatedAt: values[0]! };
}

export function crmCustomerFormSnapshotKey(customer: {
  id: string;
  updated_at: string;
}): string {
  return `${customer.id}:${customer.updated_at}`;
}

const CUSTOMER_OPTIONAL_WRITE_COLUMNS = [
  "marketing_consent_at",
  "marketing_consent",
  "membership_id",
] as const;

function composeName(
  first?: string | null,
  last?: string | null,
  fallback?: string | null,
) {
  const composed = [first, last].filter(Boolean).join(" ").trim();
  return composed || fallback?.trim() || "";
}

function messageNamesColumn(message: string, column: string): boolean {
  const escaped = column.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^a-z0-9_])${escaped}(?:[^a-z0-9_]|$)`, "i").test(
    message,
  );
}

export function stripMissingCustomerWriteColumns<
  T extends Record<string, unknown>,
>(payload: T, errorMessage: string): T {
  const next = { ...payload };
  for (const column of CUSTOMER_OPTIONAL_WRITE_COLUMNS) {
    if (messageNamesColumn(errorMessage, column) && column in next) {
      delete next[column];
    }
  }
  return next;
}

export function parseCustomerPayload(
  formData: FormData,
  options?: { consentTimestampMode?: "create" | "defer" },
) {
  const firstName = (formData.get("first_name") as string)?.trim() || null;
  const lastName = (formData.get("last_name") as string)?.trim() || null;
  const preferredName = (formData.get("preferred_name") as string)?.trim() || null;
  const legacyName = (formData.get("name") as string)?.trim() || null;
  const name = composeName(firstName, lastName, legacyName);

  const tagsRaw = (formData.get("tags") as string) || "";
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const isVip =
    formData.get("is_vip") === "on" || formData.get("is_vip") === "true";
  let crmStatus = (formData.get("crm_status") as string)?.trim() || "active";
  if (isVip && crmStatus === "active") crmStatus = "vip";

  const payload: Record<string, unknown> = {
    name,
    first_name: firstName,
    last_name: lastName,
    preferred_name: preferredName,
    email: (formData.get("email") as string)?.trim() || "",
    phone: (formData.get("phone") as string)?.trim() || null,
    address: (formData.get("address") as string)?.trim() || null,
    photo_url: (formData.get("photo_url") as string)?.trim() || null,
    date_of_birth: (formData.get("date_of_birth") as string)?.trim() || null,
    gender: (formData.get("gender") as string)?.trim() || null,
    emergency_contact_name:
      (formData.get("emergency_contact_name") as string)?.trim() || null,
    emergency_contact_phone:
      (formData.get("emergency_contact_phone") as string)?.trim() || null,
    emergency_contact_relationship:
      (formData.get("emergency_contact_relationship") as string)?.trim() || null,
    preferred_communication_method:
      (formData.get("preferred_communication_method") as string)?.trim() || null,
    crm_status: crmStatus,
    assigned_staff_id: (formData.get("assigned_staff_id") as string)?.trim() || null,
    preferred_location_id:
      (formData.get("preferred_location_id") as string)?.trim() || null,
    is_vip: isVip,
    anniversary_date: (formData.get("anniversary_date") as string)?.trim() || null,
    loyalty_status: (formData.get("loyalty_status") as string)?.trim() || "standard",
    referral_source: (formData.get("referral_source") as string)?.trim() || null,
    notes: (formData.get("notes") as string)?.trim() || null,
    tags,
    last_activity_at: new Date().toISOString(),
  };

  if ((options?.consentTimestampMode ?? "create") === "create") {
    const marketingConsent =
      formData.get("marketing_consent") === "on" ||
      formData.get("marketing_consent") === "true";
    payload.marketing_consent = marketingConsent;
    payload.marketing_consent_at = marketingConsent
      ? new Date().toISOString()
      : null;
  }

  if (CUSTOMER_MEMBERSHIP_WRITES_ENABLED) {
    payload.membership_id =
      (formData.get("membership_id") as string)?.trim() || null;
  }

  return payload;
}

/** Transition-only timestamp for CRM updates. Never rotates an existing grant. */
export function consentTimestampForUpdate(input: {
  nextConsent: boolean;
  existingConsent: boolean;
  existingAt: string | null;
  now?: string;
}): string | null {
  if (input.nextConsent && !input.existingConsent) {
    return input.now ?? new Date().toISOString();
  }
  if (!input.nextConsent) return null;
  return input.existingAt;
}
