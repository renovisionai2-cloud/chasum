import { currencyCode, normalizeCurrency } from "@/lib/commerce/money";

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
