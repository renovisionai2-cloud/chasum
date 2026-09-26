/**
 * Approved subscription list prices in integer minor units.
 * Pure presentation data for any client; runtime catalog and offer enrollment
 * remain separate. These constants do not assign eligibility or change a plan.
 */
export const SUBSCRIPTION_CURRENCY = "CAD";
export const MONTHS_PER_YEAR = 12;
export const ANNUAL_PAID_MONTHS = 10;

export const STANDARD_MONTHLY_PRICES = {
  professional: 7900,
  business: 14900,
} as const;

export type PricedSubscriptionPlan = keyof typeof STANDARD_MONTHLY_PRICES;

/** Fixed lifetime recurring rates for the first 25 businesses signing up for Alpha. */
export const FIRST_25_ALPHA_OFFER = {
  businessLimit: 25,
  monthlyPriceCents: {
    professional: 5900,
    business: 12900,
  },
} as const;

export function annualPriceCents(monthlyPriceCents: number): number {
  return monthlyPriceCents * ANNUAL_PAID_MONTHS;
}

export function calculateAlphaSavings(plan: PricedSubscriptionPlan) {
  const regularMonthlyCents = STANDARD_MONTHLY_PRICES[plan];
  const alphaMonthlyCents = FIRST_25_ALPHA_OFFER.monthlyPriceCents[plan];
  const regularYearAtMonthlyCents = regularMonthlyCents * MONTHS_PER_YEAR;
  const alphaYearAtMonthlyCents = alphaMonthlyCents * MONTHS_PER_YEAR;
  const annualTotalCents = annualPriceCents(alphaMonthlyCents);
  return {
    regularMonthlyCents,
    alphaMonthlyCents,
    regularYearAtMonthlyCents,
    lifetimeSavingPerMonthCents: regularMonthlyCents - alphaMonthlyCents,
    lifetimeSavingPerYearCents: regularYearAtMonthlyCents - alphaYearAtMonthlyCents,
    alphaYearAtMonthlyCents,
    additionalAnnualSavingCents: alphaYearAtMonthlyCents - annualTotalCents,
    annualTotalCents,
    combinedAnnualSavingCents: regularYearAtMonthlyCents - annualTotalCents,
  };
}

/** Subscription list-price display only; never relabel historical money. */
export function formatCadFromCents(cents: number): string {
  return `${SUBSCRIPTION_CURRENCY} ${new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: SUBSCRIPTION_CURRENCY,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100)}`;
}
