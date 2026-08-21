import { BUSINESS_CURRENCIES } from "@/lib/commerce/money";
import { TIMEZONES } from "@/lib/constants/timezones";
import { validateBusinessName } from "@/lib/onboarding/business-name";

const TIMEZONE_SET = new Set(TIMEZONES);
const CURRENCY_SET = new Set<string>(
  BUSINESS_CURRENCIES.map((row) => row.value),
);

export type FirstBusinessFieldValidation<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export type FirstBusinessInput = {
  name: string;
  timezone: string;
  currency: string;
};

export type FirstBusinessValidation =
  | { ok: true; value: FirstBusinessInput }
  | { ok: false; error: string };

/**
 * Explicit IANA timezone. Never falls back to America/New_York.
 */
export function validateBusinessTimezone(
  value: string | null | undefined,
): FirstBusinessFieldValidation<string> {
  const timezone = (value ?? "").trim();
  if (!timezone) {
    return {
      ok: false,
      error: "Select the timezone your business uses.",
    };
  }
  if (!TIMEZONE_SET.has(timezone)) {
    return {
      ok: false,
      error: "Select a supported timezone.",
    };
  }
  return { ok: true, value: timezone };
}

/**
 * Explicit business currency. Canonical stored value is lowercase
 * (CAD → cad). Never falls back to usd.
 */
export function validateBusinessCurrency(
  value: string | null | undefined,
): FirstBusinessFieldValidation<string> {
  const currency = (value ?? "").trim().toLowerCase();
  if (!currency) {
    return {
      ok: false,
      error: "Select the currency your business uses.",
    };
  }
  if (!CURRENCY_SET.has(currency)) {
    return {
      ok: false,
      error: "Select a supported currency.",
    };
  }
  return { ok: true, value: currency };
}

export function validateFirstBusinessInput(input: {
  name: string | null | undefined;
  timezone: string | null | undefined;
  currency: string | null | undefined;
}): FirstBusinessValidation {
  const name = validateBusinessName(input.name);
  if (!name.ok) {
    return { ok: false, error: name.error };
  }

  const timezone = validateBusinessTimezone(input.timezone);
  if (!timezone.ok) return timezone;

  const currency = validateBusinessCurrency(input.currency);
  if (!currency.ok) return currency;

  return {
    ok: true,
    value: {
      name: name.name,
      timezone: timezone.value,
      currency: currency.value,
    },
  };
}
