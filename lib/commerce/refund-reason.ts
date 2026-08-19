/**
 * Phase 6.2B — structured refund reasons without a schema change.
 * Stored in the existing commerce_refunds.reason text column.
 * Historical rows are not rewritten.
 */

export const REFUND_REASON_OPTIONS = [
  { code: "customer_cancellation", label: "Customer cancellation" },
  { code: "service_issue", label: "Service issue" },
  { code: "duplicate_payment", label: "Duplicate payment" },
  { code: "overpayment", label: "Overpayment" },
  { code: "goodwill_adjustment", label: "Goodwill adjustment" },
  { code: "scheduling_issue", label: "Scheduling issue" },
  { code: "service_not_provided", label: "Service not provided" },
  { code: "other", label: "Other" },
] as const;

export type RefundReasonCode = (typeof REFUND_REASON_OPTIONS)[number]["code"];

const LABEL_BY_CODE = new Map(
  REFUND_REASON_OPTIONS.map((row) => [row.code, row.label] as const),
);

const MEANINGLESS = /^(n\/?a+|none|nil|idk|tbd|-+\.?|\.+|test)$/i;

export function isRefundReasonCode(value: string): value is RefundReasonCode {
  return LABEL_BY_CODE.has(value as RefundReasonCode);
}

export function composeRefundReason(input: {
  code?: string | null;
  detail?: string | null;
}): { ok: true; reason: string } | { ok: false; error: string } {
  const code = String(input.code ?? "").trim();
  const detail = String(input.detail ?? "").trim();
  if (!isRefundReasonCode(code)) {
    return { ok: false, error: "Choose a refund reason." };
  }
  if (code === "other") {
    if (detail.length < 8 || MEANINGLESS.test(detail)) {
      return {
        ok: false,
        error: "Explain the refund reason in a few words.",
      };
    }
    return { ok: true, reason: `Other: ${detail}` };
  }
  const extra = detail.length > 0 ? ` — ${detail}` : "";
  return { ok: true, reason: `${LABEL_BY_CODE.get(code)}${extra}` };
}

/** Accept structured labels or Other: detail. Reject empty / “na”. */
export function validateStoredRefundReason(
  raw: string | null | undefined,
): { ok: true; reason: string } | { ok: false; error: string } {
  const reason = String(raw ?? "").trim();
  if (!reason) return { ok: false, error: "A refund reason is required." };
  if (MEANINGLESS.test(reason) || reason.length < 8) {
    return {
      ok: false,
      error: "Choose a refund reason and add a short explanation if needed.",
    };
  }
  if (/^other:\s*/i.test(reason)) {
    const detail = reason.replace(/^other:\s*/i, "").trim();
    if (detail.length < 8 || MEANINGLESS.test(detail)) {
      return {
        ok: false,
        error: "Explain the refund reason in a few words.",
      };
    }
  }
  return { ok: true, reason };
}
