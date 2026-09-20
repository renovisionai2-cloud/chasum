const SUPPORT_REFERENCE_PREFIX = "CHS-ERR-";
const SUPPORT_REFERENCE_RANDOM_LENGTH = 20;
export const SUPPORT_REFERENCE_MAX_LENGTH =
  SUPPORT_REFERENCE_PREFIX.length + SUPPORT_REFERENCE_RANDOM_LENGTH;
const SUPPORT_REFERENCE_PATTERN = new RegExp(
  `^${SUPPORT_REFERENCE_PREFIX}[A-F0-9]{${SUPPORT_REFERENCE_RANDOM_LENGTH}}$`,
);

function randomHex(length: number): string {
  const bytes = new Uint8Array(Math.ceil(length / 2));
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.getRandomValues) {
    throw new Error(
      "Secure randomness is unavailable for support reference generation.",
    );
  }
  cryptoApi.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, length)
    .toUpperCase();
}

/** Generate a non-identifying, support-safe diagnostic reference. */
export function createSupportReference(): string {
  return `${SUPPORT_REFERENCE_PREFIX}${randomHex(SUPPORT_REFERENCE_RANDOM_LENGTH)}`;
}

export function isValidSupportReference(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= SUPPORT_REFERENCE_MAX_LENGTH &&
    SUPPORT_REFERENCE_PATTERN.test(value)
  );
}

/** Normalize a user-provided reference, rejecting malformed values. */
export function normalizeSupportReference(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return isValidSupportReference(normalized) ? normalized : null;
}
