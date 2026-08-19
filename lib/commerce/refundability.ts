import type {
  CommerceRefund,
  CommerceTransaction,
  TransactionKind,
  TransactionStatus,
} from "@/lib/commerce/types";

const REFUNDABLE_KINDS: ReadonlySet<TransactionKind> = new Set([
  "payment",
  "deposit",
]);

const REFUNDABLE_STATUSES: ReadonlySet<TransactionStatus> = new Set([
  "succeeded",
  "partially_refunded",
]);

/** Payment/deposit rows that may still accept a refund. Never refund ledger rows. */
export function isRefundableTransaction(
  tx: Pick<CommerceTransaction, "kind" | "status">,
): boolean {
  return REFUNDABLE_KINDS.has(tx.kind) && REFUNDABLE_STATUSES.has(tx.status);
}

export function alreadyRefundedCents(
  transactionId: string,
  refunds: Array<Pick<CommerceRefund, "transactionId" | "amountCents" | "status">>,
): number {
  return refunds
    .filter(
      (r) => r.transactionId === transactionId && r.status === "succeeded",
    )
    .reduce((sum, r) => sum + Math.max(0, r.amountCents), 0);
}

/** Remaining refundable amount for a payment transaction (never negative). */
export function remainingRefundableCents(
  tx: Pick<CommerceTransaction, "id" | "amountCents">,
  refunds: Array<Pick<CommerceRefund, "transactionId" | "amountCents" | "status">>,
): number {
  return Math.max(0, tx.amountCents - alreadyRefundedCents(tx.id, refunds));
}

export function humanizeRefundError(message: string | null | undefined): string {
  const raw = (message ?? "").trim();
  if (!raw) return "The refund could not be completed.";
  const lower = raw.toLowerCase();
  if (
    lower.includes("exceeds remaining") &&
    (lower.includes("$0.00") || lower.includes("(0)"))
  ) {
    return "This payment has already been fully refunded.";
  }
  if (lower.includes("exceeds remaining")) {
    return "Refund amount exceeds the remaining refundable amount.";
  }
  if (lower.includes("only succeeded")) {
    return "This payment cannot be refunded in its current state.";
  }
  if (lower.includes("not found")) {
    return "That payment could not be found.";
  }
  if (lower.includes("must be greater than zero") || lower.includes("amount must")) {
    return "Enter a refund amount greater than zero.";
  }
  if (lower.includes("reason is required") || lower.includes("choose a refund reason")) {
    return "Choose a refund reason.";
  }
  if (lower.includes("explain the refund reason")) {
    return "Explain the refund reason in a few words.";
  }
  if (lower.includes("short explanation")) {
    return "Choose a refund reason and add a short explanation if needed.";
  }
  // Prefer known human messages; avoid dumping provider/SQL payloads.
  if (raw.length > 180 || /uuid|sql|postgres|stripe|relation\s+\w+|does not exist/i.test(raw)) {
    return "The refund could not be completed.";
  }
  return raw;
}
