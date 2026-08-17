import type {
  CommerceInvoice,
  CommerceInvoiceLine,
} from "@/lib/commerce/types";

/**
 * Tax-exclusive amount to show on a service line when tax is itemized.
 * Does not rewrite stored `commerce_invoice_lines` rows.
 */
export function invoiceLineExclusiveCents(
  line: Pick<
    CommerceInvoiceLine,
    "quantity" | "unitAmountCents" | "totalCents" | "taxCents"
  >,
  invoice: Pick<
    CommerceInvoice,
    "subtotalCents" | "taxCents" | "totalCents" | "discountCents"
  >,
): number {
  const qty = Math.max(1, Number(line.quantity) || 1);
  const fromUnit = Math.round(Number(line.unitAmountCents) * qty);

  if (invoice.taxCents > 0) {
    if (fromUnit > 0 && fromUnit === invoice.subtotalCents) return fromUnit;
    const minusLineTax =
      Number(line.totalCents) - Number(line.taxCents ?? 0);
    if (minusLineTax === invoice.subtotalCents) return minusLineTax;
    if (
      Number(line.totalCents) === invoice.totalCents &&
      invoice.subtotalCents > 0
    ) {
      return invoice.subtotalCents;
    }
  }

  if (fromUnit > 0) return fromUnit;
  return Number(line.totalCents);
}

export function invoiceDocumentReconciles(invoice: {
  subtotalCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  lines: Array<
    Pick<
      CommerceInvoiceLine,
      "quantity" | "unitAmountCents" | "totalCents" | "taxCents"
    >
  >;
}): boolean {
  const lineSum = invoice.lines.reduce(
    (sum, line) => sum + invoiceLineExclusiveCents(line, invoice),
    0,
  );
  if (invoice.lines.length > 0 && lineSum !== invoice.subtotalCents) {
    return false;
  }
  return (
    invoice.subtotalCents + invoice.taxCents - invoice.discountCents ===
    invoice.totalCents
  );
}
