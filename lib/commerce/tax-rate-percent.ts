/**
 * Human-facing tax percent ↔ basis points.
 * Form input is a percentage (13 = 13%). Storage is rate_bps (1300).
 */

export type PercentParseResult =
  | { ok: true; percent: number; rateBps: number }
  | { ok: false; error: string };

/**
 * Parse a rate % field from the tax form.
 * Accepts "13", "13.0", "13%", and whitespace. Rejects empty, NaN, negative,
 * and unreasonable values. Does not treat "0.13" as 13% — that would be 0.13%.
 */
export function parseTaxPercentInput(
  raw: FormDataEntryValue | null | undefined,
): PercentParseResult {
  if (raw == null) {
    return { ok: false, error: "Tax rate (%) is required." };
  }
  let text = String(raw).trim();
  if (!text) {
    return { ok: false, error: "Tax rate (%) is required." };
  }
  // Normalize common percent notation: "13%" → "13"
  if (text.endsWith("%")) {
    text = text.slice(0, -1).trim();
  }
  // Strip thousands separators / spaces but keep decimal point
  text = text.replace(/,/g, "").replace(/\s+/g, "");
  if (!/^-?\d+(\.\d+)?$/.test(text)) {
    return {
      ok: false,
      error: 'Enter a valid rate like 13 or 13% (not blank or "13 percent").',
    };
  }
  const percent = Number(text);
  if (!Number.isFinite(percent)) {
    return { ok: false, error: "Enter a valid tax rate percentage." };
  }
  if (percent < 0) {
    return { ok: false, error: "Tax rate cannot be negative." };
  }
  if (percent > 100) {
    return {
      ok: false,
      error: "Tax rate looks too high. Enter 13 for 13%, not basis points.",
    };
  }
  // Guard: accidental "0" after stripping bad input should still be allowed for non-taxable,
  // but require explicit 0 rather than silent NaN→0.
  const rateBps = Math.round(percent * 100);
  return { ok: true, percent, rateBps };
}

/** Legacy helper — prefer parseTaxPercentInput for validation. */
export function bpsFromPercentInput(
  raw: FormDataEntryValue | null | undefined,
): number {
  const parsed = parseTaxPercentInput(raw);
  return parsed.ok ? parsed.rateBps : 0;
}

/** Display rate_bps as a human percent string, e.g. 1300 → "13.00%". */
export function formatTaxRatePercent(rateBps: number | null | undefined): string {
  const bps = Math.max(0, Math.round(Number(rateBps ?? 0)));
  return `${(bps / 100).toFixed(2)}%`;
}
