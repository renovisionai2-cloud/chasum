/**
 * Shared customer contact identity for staff-created records.
 *
 * Email is a reachable address, never an identity substitute.
 * Phone display text is preserved. Comparisons use digits only.
 * Phone numbers are not unique. No country-specific normalizer.
 */

export const MIN_USABLE_PHONE_DIGITS = 7;
export const LEGACY_PLACEHOLDER_DOMAIN = "chasum.local";

export const CONTACT_REQUIRED_MESSAGE =
  "Add a phone number or an email so you can reach this customer.";

export const EMAIL_INVALID_MESSAGE =
  "Enter a valid email address, or leave email empty and use a phone number.";

export const EMAIL_PLACEHOLDER_MESSAGE =
  "Enter a real email address. A phone number is enough when there is no email.";

export const EMAIL_REMOVAL_MESSAGE =
  "Add a phone number before removing the email, so you can still reach this customer.";

export const SHARED_PHONE_WARNING =
  "This phone number is already on file. Use the existing customer, or create a separate person if this is someone else — a shared phone is not merged automatically.";

export const DUPLICATE_LOOKUP_FAILED =
  "Could not check for an existing customer. Nothing was saved.";

export const PHONE_MATCH_PAGE_SIZE = 1000;
export const PHONE_MATCH_MAX_ROWS = 20_000;

export function phoneDigits(value: string | null | undefined): string {
  return String(value ?? "").replace(/\D/g, "");
}

export function normalizePhoneDisplay(
  value: string | null | undefined,
): string | null {
  const trimmed = String(value ?? "").trim();
  return trimmed || null;
}

export function isUsablePhone(value: string | null | undefined): boolean {
  return phoneDigits(value).length >= MIN_USABLE_PHONE_DIGITS;
}

/** Exact digits equality. Suffix and prefix overlap are not a match. */
export function phonesMatchExactly(
  left: string | null | undefined,
  right: string | null | undefined,
): boolean {
  const a = phoneDigits(left);
  const b = phoneDigits(right);
  return a.length >= MIN_USABLE_PHONE_DIGITS && a === b;
}

export function normalizeEmail(
  value: string | null | undefined,
): string | null {
  const trimmed = String(value ?? "").trim().toLowerCase();
  return trimmed || null;
}

export function isLegacyPlaceholderEmail(
  value: string | null | undefined,
): boolean {
  const email = normalizeEmail(value);
  if (!email) return false;
  const at = email.lastIndexOf("@");
  if (at < 1) return false;
  return email.slice(at + 1) === LEGACY_PLACEHOLDER_DOMAIN;
}

function isWellFormedEmail(email: string): boolean {
  if (/\s/.test(email)) return false;
  const parts = email.split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || !domain || !domain.includes(".")) return false;
  if (domain.startsWith(".") || domain.endsWith(".")) return false;
  return true;
}

/** NULL, blank, malformed, and @chasum.local addresses are not recipients. */
export function isEligibleCustomerEmail(
  value: string | null | undefined,
): boolean {
  const email = normalizeEmail(value);
  if (!email || isLegacyPlaceholderEmail(email)) return false;
  return isWellFormedEmail(email);
}

export function eligibleEmailOrBlank(
  value: string | null | undefined,
): string {
  const email = normalizeEmail(value);
  return email && isEligibleCustomerEmail(email) ? email : "";
}

export function customerEmailLabel(
  email: string | null | undefined,
): string {
  return isEligibleCustomerEmail(email)
    ? (normalizeEmail(email) ?? "No email on file")
    : "No email on file";
}

export type EmailFieldRead =
  | { kind: "omit" }
  | { kind: "set"; email: string | null }
  | { kind: "invalid"; error: string; reason: "malformed" | "placeholder" };

/** Absent field is omit. Present empty is an explicit clear. Never returns "". */
export function readEmailField(formData: FormData): EmailFieldRead {
  if (!formData.has("email")) return { kind: "omit" };
  const normalized = normalizeEmail(String(formData.get("email") ?? ""));
  if (!normalized) return { kind: "set", email: null };
  if (isLegacyPlaceholderEmail(normalized)) {
    return {
      kind: "invalid",
      reason: "placeholder",
      error: EMAIL_PLACEHOLDER_MESSAGE,
    };
  }
  if (!isWellFormedEmail(normalized)) {
    return {
      kind: "invalid",
      reason: "malformed",
      error: EMAIL_INVALID_MESSAGE,
    };
  }
  return { kind: "set", email: normalized };
}

export type PhoneFieldRead =
  | { kind: "omit" }
  | { kind: "set"; phone: string | null };

export function readPhoneField(formData: FormData): PhoneFieldRead {
  if (!formData.has("phone")) return { kind: "omit" };
  return {
    kind: "set",
    phone: normalizePhoneDisplay(String(formData.get("phone") ?? "")),
  };
}

export type ContactValidation =
  | { ok: true; email: string | null; phone: string | null }
  | { ok: false; error: string };

/**
 * Create contract: at least one eligible email or usable phone.
 * Empty email becomes null. A typed-but-invalid email is rejected,
 * not discarded.
 */
export function validateCreateContact(input: {
  email?: string | null;
  phone?: string | null;
}): ContactValidation {
  const phone = normalizePhoneDisplay(input.phone);
  const email = normalizeEmail(input.email);

  if (email && isLegacyPlaceholderEmail(email)) {
    return { ok: false, error: EMAIL_PLACEHOLDER_MESSAGE };
  }
  if (email && !isWellFormedEmail(email)) {
    return { ok: false, error: EMAIL_INVALID_MESSAGE };
  }

  const eligibleEmail = email && isEligibleCustomerEmail(email) ? email : null;
  if (!eligibleEmail && !isUsablePhone(phone)) {
    if (phone) {
      return {
        ok: false,
        error:
          "Enter a phone number with at least 7 digits, or an email address, so you can reach this customer.",
      };
    }
    return { ok: false, error: CONTACT_REQUIRED_MESSAGE };
  }

  return { ok: true, email: eligibleEmail, phone };
}

export type EmailUpdateResolution =
  | { omit: true }
  | { omit: false; email: string | null }
  | { error: string };

/**
 * Update contract.
 * Absent, consent-only, and re-posted legacy placeholders do not write email.
 * An explicit empty field clears to NULL only when a usable phone remains.
 */
export function resolveEmailUpdate(input: {
  field: EmailFieldRead;
  existingEmail: string | null | undefined;
  nextPhone: string | null | undefined;
  consentOnly: boolean;
}): EmailUpdateResolution {
  if (input.consentOnly || input.field.kind === "omit") return { omit: true };
  if (input.field.kind === "invalid") {
    if (
      input.field.reason === "placeholder" &&
      (isLegacyPlaceholderEmail(input.existingEmail) ||
        input.existingEmail == null)
    ) {
      return { omit: true };
    }
    return { error: input.field.error };
  }
  if (input.field.email === null) {
    if (isLegacyPlaceholderEmail(input.existingEmail)) return { omit: true };
    if (!isUsablePhone(input.nextPhone)) {
      return { error: EMAIL_REMOVAL_MESSAGE };
    }
    return { omit: false, email: null };
  }
  return { omit: false, email: input.field.email };
}

export type PhoneCandidateRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
};

/**
 * Deterministic full scan of one business. A failed or truncated page is
 * not "no matches".
 */
export async function collectExactPhoneMatches(input: {
  digits: string;
  fetchPage: (
    from: number,
    pageSize: number,
  ) => Promise<{
    data: PhoneCandidateRow[] | null;
    error: { message: string } | null;
  }>;
  pageSize?: number;
  maxRows?: number;
}): Promise<
  { ok: true; matches: PhoneCandidateRow[] } | { ok: false; error: string }
> {
  if (!isUsablePhone(input.digits)) return { ok: true, matches: [] };

  const pageSize = input.pageSize ?? PHONE_MATCH_PAGE_SIZE;
  const maxRows = input.maxRows ?? PHONE_MATCH_MAX_ROWS;
  const matches: PhoneCandidateRow[] = [];
  let seen = 0;

  for (let from = 0; seen < maxRows; from += pageSize) {
    let page: {
      data: PhoneCandidateRow[] | null;
      error: { message: string } | null;
    };
    try {
      page = await input.fetchPage(from, pageSize);
    } catch {
      return { ok: false, error: DUPLICATE_LOOKUP_FAILED };
    }
    if (page.error || !page.data) {
      return { ok: false, error: DUPLICATE_LOOKUP_FAILED };
    }
    for (const row of page.data) {
      if (phonesMatchExactly(row.phone, input.digits)) matches.push(row);
    }
    seen += page.data.length;
    if (page.data.length < pageSize) return { ok: true, matches };
    if (seen >= maxRows) return { ok: false, error: DUPLICATE_LOOKUP_FAILED };
  }

  return { ok: false, error: DUPLICATE_LOOKUP_FAILED };
}
