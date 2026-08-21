export const BUSINESS_NAME_MIN_LENGTH = 2;
export const BUSINESS_NAME_MAX_LENGTH = 80;

export type BusinessNameValidation =
  | { ok: true; name: string }
  | { ok: false; error: string };

/**
 * Explicit first-tenant names only. Never infers from display name, email, or
 * a "My Business" placeholder.
 */
export function validateBusinessName(
  value: string | null | undefined,
): BusinessNameValidation {
  const name = (value ?? "").trim().replace(/\s+/g, " ");
  if (!name) {
    return {
      ok: false,
      error: "Enter the name of your business to continue.",
    };
  }
  if (name.length < BUSINESS_NAME_MIN_LENGTH) {
    return {
      ok: false,
      error: `Business name must be at least ${BUSINESS_NAME_MIN_LENGTH} characters.`,
    };
  }
  if (name.length > BUSINESS_NAME_MAX_LENGTH) {
    return {
      ok: false,
      error: `Business name must be ${BUSINESS_NAME_MAX_LENGTH} characters or fewer.`,
    };
  }
  return { ok: true, name };
}

export function slugifyBusinessName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

/**
 * Slug is derived from the submitted business name only.
 * A technical fallback is used solely when the name cannot form a usable slug.
 */
export function preferredSlugForBusinessName(
  name: string,
  userId: string,
): string {
  const fromName = slugifyBusinessName(name);
  if (fromName.length >= 3) return fromName;
  const idPart = userId.replace(/-/g, "").slice(0, 8);
  return `biz-${idPart || "owner"}`;
}
