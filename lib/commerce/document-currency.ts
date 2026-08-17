import {
  currencyCode,
  formatMoneyCentsExact,
  normalizeCurrency,
} from "@/lib/commerce/money";

/** Stored document currency vs business operating currency. Never relabel. */
export function documentCurrencyMismatch(
  storedCurrency: string | null | undefined,
  businessCurrency: string | null | undefined,
): boolean {
  return (
    normalizeCurrency(storedCurrency) !== normalizeCurrency(businessCurrency)
  );
}

export function documentCurrencyCode(
  storedCurrency: string | null | undefined,
): string {
  return currencyCode(storedCurrency);
}

/**
 * Customer-facing document amounts.
 * Matching business currency: normal exact cents.
 * Mismatch: prefix ISO code so USD is never implied as CAD.
 */
export function formatDocumentMoneyCents(
  cents: number,
  storedCurrency: string | null | undefined,
  businessCurrency?: string | null,
): string {
  const amount = formatMoneyCentsExact(cents, storedCurrency);
  if (!documentCurrencyMismatch(storedCurrency, businessCurrency)) {
    return amount;
  }
  const code = documentCurrencyCode(storedCurrency);
  if (amount.startsWith(code) || amount.startsWith(`${code} `)) {
    return amount;
  }
  return `${code} ${amount}`;
}

/** Email/table money with an explicit ISO code (never silent `$` for USD). */
export function formatDocumentEmailMoney(
  cents: number,
  storedCurrency: string | null | undefined,
): string {
  const code = documentCurrencyCode(storedCurrency);
  const amount = (cents / 100).toFixed(2);
  return `${code} $${amount}`;
}
