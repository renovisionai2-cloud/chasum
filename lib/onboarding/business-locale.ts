import { TIMEZONES } from "@/lib/constants/timezones";
import { BUSINESS_CURRENCIES, normalizeCurrency } from "@/lib/commerce/money";

const TIMEZONE_SET = new Set(TIMEZONES);
const CURRENCY_SET = new Set(
  BUSINESS_CURRENCIES.map((row) => row.value.toLowerCase()),
);

export const DEFAULT_ONBOARDING_TIMEZONE = "America/Toronto";
export const DEFAULT_ONBOARDING_CURRENCY = "cad";

export function validateOnboardingTimezone(
  value: string | null | undefined,
): string | null {
  const timezone = (value ?? "").trim();
  if (!timezone || !TIMEZONE_SET.has(timezone)) return null;
  return timezone;
}

export function validateOnboardingCurrency(
  value: string | null | undefined,
): string | null {
  const currency = normalizeCurrency(value);
  if (!CURRENCY_SET.has(currency)) return null;
  return currency;
}
