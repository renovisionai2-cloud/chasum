/**
 * Forecasting extension points for Chase.
 * No prediction models — reserved for future providers.
 */

import type { ChaseForecastHooks } from "@/lib/chase/types";

export const CHASE_FORECAST_HOOKS: ChaseForecastHooks = {
  revenueForecastReady: false,
  capacityForecastReady: false,
  staffDemandReady: false,
  seasonalTrendsReady: false,
  provider: "none",
};

export type ChaseForecastProvider = {
  readonly name: string;
  readonly ready: boolean;
  /** Future: return projected revenue series */
  forecastRevenue?(input: {
    businessId: string;
    horizonDays: number;
  }): Promise<Array<{ date: string; value: number }>>;
  /** Future: return capacity demand */
  forecastCapacity?(input: {
    businessId: string;
    horizonDays: number;
  }): Promise<Array<{ date: string; bookedMinutes: number }>>;
};

class NullForecastProvider implements ChaseForecastProvider {
  readonly name = "null";
  readonly ready = false;
}

let provider: ChaseForecastProvider = new NullForecastProvider();

export function getChaseForecastProvider(): ChaseForecastProvider {
  return provider;
}

/** Register a real forecast provider when models ship. */
export function registerChaseForecastProvider(next: ChaseForecastProvider) {
  provider = next;
}
