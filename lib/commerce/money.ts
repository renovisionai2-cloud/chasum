/** Shared money formatting — inherits business currency. */

const CURRENCY_META: Record<
  string,
  { code: string; symbol: string; locale: string }
> = {
  usd: { code: "USD", symbol: "$", locale: "en-US" },
  cad: { code: "CAD", symbol: "$", locale: "en-CA" },
  eur: { code: "EUR", symbol: "€", locale: "en-IE" },
  gbp: { code: "GBP", symbol: "£", locale: "en-GB" },
  aud: { code: "AUD", symbol: "$", locale: "en-AU" },
};

export const BUSINESS_CURRENCIES = [
  { value: "cad", label: "CAD — Canadian Dollar" },
  { value: "usd", label: "USD — US Dollar" },
  { value: "gbp", label: "GBP — British Pound" },
  { value: "eur", label: "EUR — Euro" },
  { value: "aud", label: "AUD — Australian Dollar" },
] as const;

export function normalizeCurrency(raw: string | null | undefined): string {
  const key = String(raw ?? "usd").trim().toLowerCase();
  return CURRENCY_META[key] ? key : "usd";
}

export function currencyCode(raw: string | null | undefined): string {
  return CURRENCY_META[normalizeCurrency(raw)].code;
}

export function formatMoneyCents(
  cents: number,
  currency?: string | null,
): string {
  const meta = CURRENCY_META[normalizeCurrency(currency)];
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat(meta.locale, {
      style: "currency",
      currency: meta.code,
      minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${meta.symbol}${amount.toFixed(cents % 100 === 0 ? 0 : 2)}`;
  }
}

export function formatMoneyDollars(
  amount: number,
  currency?: string | null,
): string {
  return formatMoneyCents(Math.round(amount * 100), currency);
}
