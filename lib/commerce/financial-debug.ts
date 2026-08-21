/**
 * Preview-safe financial diagnostics — surfaces resolver inputs/outputs
 * so testers can see why inclusive vs exclusive was chosen.
 */

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
): string[] {
  const money = (c: number) => `$${(c / 100).toFixed(2)}`;
  return [
    `Tax mode: ${d.effectiveInclusive ? "Inclusive" : "Exclusive"}`,
    `Source: ${d.source}`,
    `Rate: ${d.taxLabel ?? "Tax"} (${(d.rateBps / 100).toFixed(d.rateBps % 100 === 0 ? 0 : 2)}%)`,
    `Catalog: ${money(d.catalogPriceCents)}`,
    `Subtotal: ${money(d.subtotalCents)}`,
    `Tax: ${money(d.taxCents)}`,
    `Total: ${money(d.totalCents)}`,
    `Deposit: ${money(d.depositCents)}`,
    `After $${(d.depositCents / 100).toFixed(2)} deposit: ${money(d.remainingIfDepositPaidCents)}`,
  ];
}
