/** Check supplied display metadata; never reprice or repair a stored appointment. */
export function storedTaxDisplay(input: {
  subtotalCents?: number | null;
  taxCents?: number | null;
  appointmentTotalCents?: number | null;
  taxRateBps?: number | null;
  taxLabel?: string | null;
}) {
  const { subtotalCents: subtotal, taxCents: tax, taxRateBps: bps, appointmentTotalCents: total } = input;
  const amountsKnown = subtotal != null && tax != null && Number.isSafeInteger(subtotal) && Number.isSafeInteger(tax) && subtotal >= 0 && tax >= 0;
  const totalMismatch = amountsKnown && total != null && total !== subtotal + tax;
  const rateMatches = amountsKnown && bps != null && Number.isSafeInteger(bps) && bps >= 0 && (
    Math.round(subtotal * bps / 10_000) === tax ||
    // Inclusive extraction can differ by a cent from tax on the rounded net.
    Math.round((subtotal + tax) * bps / (10_000 + bps)) === tax
  );
  const label = input.taxLabel?.trim() || "Tax";
  return {
    heading: rateMatches && !totalMismatch
      ? `${label} (${(bps! / 100).toFixed(bps! % 100 === 0 ? 0 : 2)}%)`
      : "Tax",
    // Missing/contradictory rate metadata does not make internally consistent
    // stored amounts wrong. A neutral Tax label does not claim rate provenance.
    totalMismatch,
  };
}
