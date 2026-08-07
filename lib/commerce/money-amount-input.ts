/**
 * Draft helpers for high-quality monetary text inputs.
 * While focused: plain editable numeric text (may be temporarily empty/partial).
 * On blur/commit: normalize to cents for accounting.
 */

/** Display dollars with two decimals from integer cents. */
export function formatMoneyAmountDraft(cents: number): string {
  const safe = Number.isFinite(cents) ? Math.max(0, Math.round(cents)) : 0;
  return (safe / 100).toFixed(2);
}

/**
 * Whether a keystroke draft is allowed while editing.
 * Empty and partial decimals ("", ".", "5", "50.", "50.5", "50.50") are ok.
 */
export function isAllowedMoneyAmountDraft(raw: string): boolean {
  if (raw === "") return true;
  return /^\d*\.?\d{0,2}$/.test(raw);
}

/**
 * Parse a draft to cents. Returns null for empty/incomplete drafts
 * that should not yet update committed accounting state as a final value.
 * Incomplete trailing "." is treated as incomplete (null).
 */
export function parseMoneyAmountDraft(raw: string): number | null {
  const t = raw.trim();
  if (t === "" || t === ".") return null;
  if (!isAllowedMoneyAmountDraft(t)) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

/** Normalize draft on blur: empty → 0 cents, otherwise parse or keep previous. */
export function normalizeMoneyAmountDraft(
  raw: string,
  fallbackCents = 0,
): { cents: number; display: string } {
  const parsed = parseMoneyAmountDraft(raw);
  if (parsed == null) {
    if (raw.trim() === "" || raw.trim() === ".") {
      return { cents: 0, display: formatMoneyAmountDraft(0) };
    }
    const safe = Number.isFinite(fallbackCents)
      ? Math.max(0, Math.round(fallbackCents))
      : 0;
    return { cents: safe, display: formatMoneyAmountDraft(safe) };
  }
  return { cents: parsed, display: formatMoneyAmountDraft(parsed) };
}
