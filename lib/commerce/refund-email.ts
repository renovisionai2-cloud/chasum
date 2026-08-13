/**
 * Phase 6.0B — customer refund confirmation email.
 * Bound to the exact commerce_refunds row + original payment transaction.
 * Email failure must never reverse a successful refund.
 */

import { writeCommerceAudit } from "@/lib/commerce/audit";
import { mapRefund, mapTransaction } from "@/lib/commerce/mappers";
import { PAYMENT_METHOD_LABELS } from "@/lib/commerce/types";
import type { AppointmentTemplateContext } from "@/lib/communications/types";
import { logQueryError, isSoftSchemaFallbackAllowed } from "@/lib/supabase/errors";
import { createServiceClient } from "@/lib/supabase/service";
import { format } from "date-fns";

export type RefundEmailStatus =
  | "sent"
  | "failed"
  | "unavailable"
  | "skipped";

export type RefundEmailResult = {
  ok: boolean;
  status: RefundEmailStatus;
  error?: string;
};

function methodLabel(method: string): string {
  return method in PAYMENT_METHOD_LABELS
    ? PAYMENT_METHOD_LABELS[method as keyof typeof PAYMENT_METHOD_LABELS]
    : method.replace(/_/g, " ");
}

function tenderNote(method: string, provider: string): string {
  if (provider === "stripe") {
    return "Your refund has been submitted. Card statement timing depends on your bank.";
  }
  const label = methodLabel(method).toLowerCase();
  return `Chasum recorded this ${label} refund for the business. Settlement follows the original payment method.`;
}

export async function buildRefundEmailContext(input: {
  businessId: string;
  refundId: string;
}): Promise<
  | {
      ok: true;
      context: AppointmentTemplateContext;
      appointmentId: string | null;
      customerId: string;
      customerEmail: string;
    }
  | { ok: false; error: string; status: RefundEmailStatus }
> {
  const supabase = createServiceClient();
  const { data: refundRow, error } = await supabase
    .from("commerce_refunds")
    .select("*")
    .eq("id", input.refundId)
    .eq("business_id", input.businessId)
    .maybeSingle();

  if (error || !refundRow) {
    return {
      ok: false,
      error: error?.message ?? "Refund not found.",
      status: "failed",
    };
  }

  const refund = mapRefund(refundRow as Record<string, unknown>);
  if (refund.status !== "succeeded") {
    return {
      ok: false,
      error: "Refund is not completed.",
      status: "skipped",
    };
  }

  const { data: txRow, error: txErr } = await supabase
    .from("commerce_transactions")
    .select("*")
    .eq("id", refund.transactionId)
    .eq("business_id", input.businessId)
    .maybeSingle();

  if (txErr || !txRow) {
    return {
      ok: false,
      error: txErr?.message ?? "Original payment not found.",
      status: "failed",
    };
  }

  const tx = mapTransaction(txRow as Record<string, unknown>);

  const { data: customer } = await supabase
    .from("customers")
    .select("id, name, email")
    .eq("id", refund.customerId)
    .maybeSingle();

  if (!customer?.email?.trim()) {
    return {
      ok: false,
      error: "Customer has no email on file.",
      status: "unavailable",
    };
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("name, timezone")
    .eq("id", input.businessId)
    .maybeSingle();

  const { data: priorRefunds } = await supabase
    .from("commerce_refunds")
    .select("amount_cents, status, id")
    .eq("transaction_id", refund.transactionId)
    .eq("status", "succeeded");

  const succeededRefunds = priorRefunds ?? [];
  const totalRefunded = succeededRefunds.reduce(
    (sum, row) => sum + Math.max(0, Number(row.amount_cents ?? 0)),
    0,
  );
  const previouslyRefunded = Math.max(0, totalRefunded - refund.amountCents);
  const remainingRefundable = Math.max(0, tx.amountCents - totalRefunded);

  let serviceName = "Payment";
  let startTime = "";
  let endTime: string | null = null;
  let locationTimezone: string | null = null;
  let invoiceNumber: string | null = null;

  if (tx.appointmentId) {
    const { data: appt } = await supabase
      .from("appointments")
      .select(
        "id, start_time, end_time, services(name), location:locations(timezone)",
      )
      .eq("id", tx.appointmentId)
      .eq("business_id", input.businessId)
      .maybeSingle();
    if (appt) {
      const serviceRel = appt.services as
        | { name?: string }
        | { name?: string }[]
        | null;
      const service = Array.isArray(serviceRel) ? serviceRel[0] : serviceRel;
      serviceName = service?.name?.trim() || "Appointment";
      startTime = String(appt.start_time ?? "");
      endTime = appt.end_time ? String(appt.end_time) : null;
      const locRel = (appt as { location?: unknown }).location as
        | { timezone?: string | null }
        | { timezone?: string | null }[]
        | null;
      const loc = Array.isArray(locRel) ? locRel[0] : locRel;
      locationTimezone = loc?.timezone?.trim() || null;
    }
  }

  if (tx.invoiceId) {
    const { data: inv } = await supabase
      .from("commerce_invoices")
      .select("invoice_number")
      .eq("id", tx.invoiceId)
      .eq("business_id", input.businessId)
      .maybeSingle();
    invoiceNumber = inv?.invoice_number ? String(inv.invoice_number) : null;
  }

  const businessTimezone = business?.timezone?.trim() || null;
  const { resolveAppointmentEmailTimezone } = await import(
    "@/lib/communications/appointment-datetime"
  );
  const timezone = resolveAppointmentEmailTimezone({
    locationTimezone,
    businessTimezone,
  });

  const refundDateLabel = format(
    new Date(refund.createdAt || Date.now()),
    "MMM d, yyyy",
  );

  // Human reference only — never expose raw transaction UUID as primary content.
  const reference =
    refund.providerReference?.trim() ||
    (refund.id ? `RF-${refund.id.slice(0, 8).toUpperCase()}` : null);

  return {
    ok: true,
    appointmentId: tx.appointmentId,
    customerId: customer.id,
    customerEmail: customer.email.trim(),
    context: {
      businessId: input.businessId,
      businessName: business?.name ?? "Business",
      customerName: customer.name ?? "Customer",
      customerEmail: customer.email.trim(),
      customerId: customer.id,
      staffName: "Team",
      serviceName,
      startTime: startTime || "",
      endTime,
      timezone,
      locationTimezone,
      businessTimezone,
      amountCents: refund.amountCents,
      paymentMethodLabel: methodLabel(tx.method),
      paymentStatusLabel:
        refund.refundType === "full" ? "Full refund" : "Partial refund",
      refundTypeLabel:
        refund.refundType === "full" ? "Full refund" : "Partial refund",
      originalPaymentCents: tx.amountCents,
      previouslyRefundedCents: previouslyRefunded,
      remainingRefundableCents: remainingRefundable,
      refundDateLabel,
      refundTenderNote: tenderNote(tx.method, tx.provider),
      invoiceNumber,
      receiptNumber: reference,
      appointmentId: tx.appointmentId ?? undefined,
    },
  };
}

/**
 * Send refund confirmation immediately after a succeeded refund.
 * Never throws to callers — failures become status + logs only.
 */
export async function sendRefundConfirmationEmail(input: {
  businessId: string;
  refundId: string;
  actorId?: string | null;
}): Promise<RefundEmailResult> {
  try {
    const built = await buildRefundEmailContext({
      businessId: input.businessId,
      refundId: input.refundId,
    });

    if (!built.ok) {
      await writeCommerceAudit({
        businessId: input.businessId,
        actorId: input.actorId,
        action: "refund.email",
        entityType: "commerce_refund",
        entityId: input.refundId,
        summary: `Refund email ${built.status}: ${built.error}`,
        afterState: { status: built.status, error: built.error },
      }).catch(() => undefined);
      return { ok: false, status: built.status, error: built.error };
    }

    const { sendEmail } = await import("@/lib/communications/delivery");
    const result = await sendEmail({
      businessId: input.businessId,
      to: built.customerEmail,
      templateKey: "commerce.refund",
      customerId: built.customerId,
      appointmentId: built.appointmentId,
      skipPreferenceCheck: true,
      context: built.context,
    });

    const status: RefundEmailStatus = result.ok ? "sent" : "failed";
    await writeCommerceAudit({
      businessId: input.businessId,
      actorId: input.actorId,
      action: "refund.email",
      entityType: "commerce_refund",
      entityId: input.refundId,
      summary: result.ok
        ? `Refund confirmation emailed to ${built.customerEmail}`
        : `Refund email failed: ${result.error ?? "unknown"}`,
      afterState: {
        status,
        messageId: result.messageId ?? null,
        error: result.error ?? null,
      },
    }).catch(() => undefined);

    // Best-effort metadata stamp when column exists — no migration.
    try {
      const supabase = createServiceClient();
      await supabase
        .from("commerce_refunds")
        .update({
          metadata: {
            email_status: status,
            emailed_at: new Date().toISOString(),
            email_error: result.error ?? null,
          },
        })
        .eq("id", input.refundId)
        .eq("business_id", input.businessId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!isSoftSchemaFallbackAllowed(message)) {
        logQueryError("commerce.refund.email.metadata", message);
      }
    }

    if (!result.ok) {
      return {
        ok: false,
        status: "failed",
        error: result.error ?? "Could not send refund email.",
      };
    }
    return { ok: true, status: "sent" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logQueryError("commerce.refund.email", message);
    return { ok: false, status: "failed", error: message };
  }
}
