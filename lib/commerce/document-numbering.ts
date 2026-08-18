/**
 * Phase 6.2B — human-readable commerce document numbers.
 *
 * Invoice numbers: INV-0001 scoped per business (commerce_invoice_sequences).
 * Receipt numbers: RCT-0001 scoped per business (max existing + 1).
 *
 * Existing unique (business_id, invoice_number) / (business_id, receipt_number)
 * prevent committed duplicates. Sequence CAS + retry is app-level hardening.
 * True gapless allocation still wants an atomic SQL function (PO / migration).
 */

export const DEFAULT_INVOICE_PREFIX = "INV";
export const DEFAULT_RECEIPT_PREFIX = "RCT";
export const DOCUMENT_NUMBER_WIDTH = 4;
export const DOCUMENT_NUMBER_ALLOCATE_ATTEMPTS = 8;

export function formatPaddedDocumentNumber(
  prefix: string,
  n: number,
  width = DOCUMENT_NUMBER_WIDTH,
): string {
  const safe = Math.max(1, Math.floor(n));
  return `${prefix}-${String(safe).padStart(width, "0")}`;
}

export function parsePaddedDocumentNumber(
  value: string,
  prefix: string,
): number | null {
  const trimmed = value.trim();
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = trimmed.match(new RegExp(`^${escaped}-(\\d+)$`, "i"));
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function nextPaddedDocumentNumber(
  existing: string[],
  prefix: string,
  width = DOCUMENT_NUMBER_WIDTH,
): string {
  let max = 0;
  for (const value of existing) {
    const n = parsePaddedDocumentNumber(value, prefix);
    if (n != null && n > max) max = n;
  }
  return formatPaddedDocumentNumber(prefix, max + 1, width);
}

/**
 * Optimistic sequence claim: only succeed when the row still holds `observedNext`.
 * A lost CAS must retry — never emit the same n.
 */
export function claimOptimisticSequenceNumber(input: {
  observedNext: number;
  updatedRows: number;
}): { claimed: number | null; retry: boolean } {
  const n = Math.floor(input.observedNext);
  if (!Number.isFinite(n) || n < 1) {
    return { claimed: null, retry: true };
  }
  if (input.updatedRows === 1) {
    return { claimed: n, retry: false };
  }
  return { claimed: null, retry: true };
}

/** count(*)+1 reuses a number after a delete; max+1 does not. */
export function countPlusOneRisk(input: {
  remainingCount: number;
  maxExistingNumber: number;
}): { countPlusOne: number; maxPlusOne: number; wouldReuse: boolean } {
  const countPlusOne = input.remainingCount + 1;
  const maxPlusOne = input.maxExistingNumber + 1;
  return {
    countPlusOne,
    maxPlusOne,
    wouldReuse: countPlusOne < maxPlusOne,
  };
}
