/**
 * Locale foundation — prepare for global expansion without shipping translations yet.
 * Business language + currency → BCP-47 locale for dates and money.
 */

import { normalizeCurrency } from "@/lib/commerce/money";

const LANGUAGE_LOCALES: Record<string, string> = {
  en: "en-US",
  "en-us": "en-US",
  "en-ca": "en-CA",
  "en-gb": "en-GB",
  "en-au": "en-AU",
  fr: "fr-CA",
  "fr-ca": "fr-CA",
  "fr-fr": "fr-FR",
  es: "es-ES",
  de: "de-DE",
};

const CURRENCY_FALLBACK_LOCALE: Record<string, string> = {
  usd: "en-US",
  cad: "en-CA",
  gbp: "en-GB",
  eur: "en-IE",
  aud: "en-AU",
};

export type BusinessLocaleInput = {
  language?: string | null;
  currency?: string | null;
  timezone?: string | null;
};

export function normalizeLanguage(raw: string | null | undefined): string {
  const key = String(raw ?? "en").trim().toLowerCase();
  if (!key) return "en";
  return key;
}

/** BCP-47 locale for Intl date/number formatting. */
export function getBusinessLocale(input: BusinessLocaleInput): string {
  const lang = normalizeLanguage(input.language);
  if (LANGUAGE_LOCALES[lang]) return LANGUAGE_LOCALES[lang];
  const base = lang.split("-")[0] ?? "en";
  if (LANGUAGE_LOCALES[base]) return LANGUAGE_LOCALES[base];
  return CURRENCY_FALLBACK_LOCALE[normalizeCurrency(input.currency)] ?? "en-US";
}

export function getBusinessTimezone(
  input: BusinessLocaleInput & { locationTimezone?: string | null },
): string {
  const tz =
    input.locationTimezone?.trim() ||
    input.timezone?.trim() ||
    "America/Toronto";
  try {
    // Validate IANA timezone
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return tz;
  } catch {
    return "America/Toronto";
  }
}

export function formatBusinessDate(
  iso: string | Date,
  input: BusinessLocaleInput & { locationTimezone?: string | null },
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat(getBusinessLocale(input), {
    timeZone: getBusinessTimezone(input),
    dateStyle: "medium",
    ...options,
  }).format(date);
}

export function formatBusinessTime(
  iso: string | Date,
  input: BusinessLocaleInput & { locationTimezone?: string | null },
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat(getBusinessLocale(input), {
    timeZone: getBusinessTimezone(input),
    timeStyle: "short",
    ...options,
  }).format(date);
}

export function formatBusinessDateTime(
  iso: string | Date,
  input: BusinessLocaleInput & { locationTimezone?: string | null },
): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat(getBusinessLocale(input), {
    timeZone: getBusinessTimezone(input),
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
