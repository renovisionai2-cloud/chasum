/**
 * Preview-safe financial diagnostics — surfaces resolver inputs/outputs
 * so testers can see why inclusive vs exclusive was chosen.
 */

import { formatMoneyCentsExact } from "@/lib/commerce/money";

export type FinancialDebugSnapshot = {
  catalogPriceCents: number;
  rateBps: number;
  taxLabel: string | null;
  taxable: boolean;
  storedInclusive: boolean;
  effectiveInclusive: boolean;
  source: string;
  taxRateId: string | null;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  depositCents: number;
  remainingIfDepositPaidCents: number;
};

export function formatFinancialDebugLines(
  d: FinancialDebugSnapshot,
  currency?: string | null,
): string[] {
  const money = (c: number) => formatMoneyCentsExact(c, currency);
  return [
    `Tax mode: ${d.effectiveInclusive ? "Inclusive" : "Exclusive"}`,
    `Source: ${d.source}`,
    `Rate: ${d.taxLabel ?? "Tax"} (${(d.rateBps / 100).toFixed(d.rateBps % 100 === 0 ? 0 : 2)}%)`,
    `Catalog: ${money(d.catalogPriceCents)}`,
    `Subtotal: ${money(d.subtotalCents)}`,
    `Tax: ${money(d.taxCents)}`,
    `Total: ${money(d.totalCents)}`,
    `Deposit: ${money(d.depositCents)}`,
    `After ${money(d.depositCents)} deposit: ${money(d.remainingIfDepositPaidCents)}`,
  ];
}
