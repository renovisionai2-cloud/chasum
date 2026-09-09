/**
 * CRM customer write helpers. Kept out of the `"use server"` module so they
 * are not treated as Server Actions.
 *
 * Membership writes stay gated until the composite-FK design ships. Default OFF.
 */

export const CUSTOMER_MEMBERSHIP_WRITES_ENABLED = false;

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

export function parseCustomerPayload(formData: FormData) {
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

  const marketingConsent =
    formData.get("marketing_consent") === "on" ||
    formData.get("marketing_consent") === "true";

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
    marketing_consent: marketingConsent,
    marketing_consent_at: marketingConsent ? new Date().toISOString() : null,
    referral_source: (formData.get("referral_source") as string)?.trim() || null,
    notes: (formData.get("notes") as string)?.trim() || null,
    tags,
    last_activity_at: new Date().toISOString(),
  };

  if (CUSTOMER_MEMBERSHIP_WRITES_ENABLED) {
    payload.membership_id =
      (formData.get("membership_id") as string)?.trim() || null;
  }

  return payload;
}
