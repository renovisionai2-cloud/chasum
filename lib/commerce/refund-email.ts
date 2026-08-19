/**
 * Phase 6.0B / 6.2B — refund confirmation emails.
 * Customer confirmation is preserved. Business operational notification is
 * added for every succeeded refund. Email failure must never reverse a refund.
 */

import { formatStaffFacingInstant } from "@/lib/business/datetime";
import { formatCalendarDateParam } from "@/lib/calendar/date-param";
import { writeCommerceAudit } from "@/lib/commerce/audit";
import { recordedDeliveryStatus } from "@/lib/commerce/document-delivery-truth";
import { appointmentWorkspacePath } from "@/lib/commerce/document-paths";
import { mapRefund, mapTransaction } from "@/lib/commerce/mappers";
import { PAYMENT_METHOD_LABELS } from "@/lib/commerce/types";
import type { AppointmentTemplateContext } from "@/lib/communications/types";
import { getAppUrl } from "@/lib/env";
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

function asMetadata(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return { ...(raw as Record<string, unknown>) };
  }
  return {};
}

async function mergeRefundMetadata(input: {
  businessId: string;
  refundId: string;
  patch: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = createServiceClient();
    const { data: row } = await supabase
      .from("commerce_refunds")
      .select("metadata")
      .eq("id", input.refundId)
      .eq("business_id", input.businessId)
      .maybeSingle();
    const existing = asMetadata(row?.metadata);
    await supabase
      .from("commerce_refunds")
      .update({ metadata: { ...existing, ...input.patch } })
      .eq("id", input.refundId)
      .eq("business_id", input.businessId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!isSoftSchemaFallbackAllowed(message)) {
      logQueryError("commerce.refund.email.metadata", message);
    }
  }
}

async function peekLatestLogStatus(input: {
  businessId: string;
  templateKey: string;
  recipient: string;
  appointmentId?: string | null;
}): Promise<string | null> {
  try {
    const supabase = createServiceClient();
    let q = supabase
      .from("notification_logs")
      .select("status")
      .eq("business_id", input.businessId)
      .eq("template_key", input.templateKey)
      .eq("recipient", input.recipient)
      .order("created_at", { ascending: false })
      .limit(1);
    if (input.appointmentId) q = q.eq("appointment_id", input.appointmentId);
    const { data } = await q.maybeSingle();
    return data?.status != null ? String(data.status) : null;
  } catch {
    return null;
  }
}

function truthFromSend(input: {
  sendOk: boolean;
  logStatus: string | null;
}): RefundEmailStatus {
  const recorded = recordedDeliveryStatus({
    hasRecipient: true,
    logStatus: input.logStatus,
    rowEmailStatus: input.logStatus
      ? null
      : input.sendOk
        ? "sent"
        : "failed",
  });
  return recorded === "sent" ? "sent" : "failed";
}

export async function buildRefundEmailContext(input: {
  businessId: string;
  refundId: string;
  actorId?: string | null;
}): Promise<
  | {
      ok: true;
      context: AppointmentTemplateContext;
      appointmentId: string | null;
      customerId: string;
      customerEmail: string | null;
      metadata: Record<string, unknown>;
      businessRecipient: string | null;
      ownerNotificationsEnabled: boolean;
      emailNotificationsEnabled: boolean;
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

  const metadata = asMetadata(
    (refundRow as { metadata?: unknown }).metadata,
  );

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

  const customerEmail = customer?.email?.trim() || null;
  const customerId = customer?.id ?? refund.customerId;

  const { data: business } = await supabase
    .from("businesses")
    .select(
      "name, timezone, email, notification_email, owner_notifications_enabled, email_notifications_enabled",
    )
    .eq("id", input.businessId)
    .maybeSingle();

  const { data: priorRefunds } = await supabase
    .from("commerce_refunds")
    .select("amount_cents, status, id")
    .eq("transaction_id", refund.transactionId)
    .eq("status", "succeeded");

  const succeededRefunds = Array.isArray(priorRefunds) ? priorRefunds : [];
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
  let locationName: string | null = null;
  let invoiceNumber: string | null = null;
  let receiptNumber: string | null = null;
  let processedByName: string | null = null;

  if (tx.appointmentId) {
    const { data: appt } = await supabase
      .from("appointments")
      .select(
        "id, start_time, end_time, services(name), location:locations(timezone, name)",
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
        | { timezone?: string | null; name?: string | null }
        | { timezone?: string | null; name?: string | null }[]
        | null;
      const loc = Array.isArray(locRel) ? locRel[0] : locRel;
      locationTimezone = loc?.timezone?.trim() || null;
      locationName = loc?.name?.trim() || null;
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

  const { data: receipt } = await supabase
    .from("commerce_receipts")
    .select("receipt_number")
    .eq("transaction_id", refund.transactionId)
    .eq("business_id", input.businessId)
    .order("issued_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (receipt?.receipt_number) {
    receiptNumber = String(receipt.receipt_number);
  } else {
    receiptNumber =
      refund.providerReference?.trim() ||
      (refund.id ? `RF-${refund.id.slice(0, 8).toUpperCase()}` : null);
  }

  if (input.actorId) {
    const { data: staff } = await supabase
      .from("staff")
      .select("name")
      .eq("business_id", input.businessId)
      .eq("user_id", input.actorId)
      .maybeSingle();
    processedByName = staff?.name?.trim() || null;
  }

  const businessTimezone = business?.timezone?.trim() || null;
  const { resolveAppointmentEmailTimezone } = await import(
    "@/lib/communications/appointment-datetime"
  );
  const timezone = resolveAppointmentEmailTimezone({
    locationTimezone,
    businessTimezone,
  });

  const processedAt = refund.createdAt || new Date().toISOString();
  const refundDateLabel = format(new Date(processedAt), "MMM d, yyyy");
  const processedAtLabel = formatStaffFacingInstant(processedAt, timezone);

  const civilDate = startTime
    ? formatCalendarDateParam(new Date(startTime), timezone)
    : null;
  const actionUrl = tx.appointmentId
    ? `${getAppUrl()}${appointmentWorkspacePath(tx.appointmentId, civilDate)}`
    : `${getAppUrl()}/dashboard/payments`;

  const notificationEmail = business?.notification_email?.trim() || null;
  const businessEmail = business?.email?.trim() || null;

  return {
    ok: true,
    appointmentId: tx.appointmentId,
    customerId,
    customerEmail,
    metadata,
    businessRecipient: notificationEmail || businessEmail || null,
    ownerNotificationsEnabled: business?.owner_notifications_enabled !== false,
    emailNotificationsEnabled: business?.email_notifications_enabled !== false,
    context: {
      businessId: input.businessId,
      businessName: business?.name ?? "Business",
      customerName: customer?.name ?? "Customer",
      customerEmail,
      customerId,
      staffName: "Team",
      serviceName,
      startTime: startTime || "",
      endTime,
      timezone,
      locationTimezone,
      businessTimezone,
      locationName,
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
      refundReason: refund.reason?.trim() || null,
      processedByName,
      processedAtLabel,
      invoiceNumber,
      receiptNumber,
      appointmentId: tx.appointmentId ?? undefined,
      documentCurrency: tx.currency,
      actionUrl,
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
      actorId: input.actorId,
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

    if (!built.customerEmail) {
      await writeCommerceAudit({
        businessId: input.businessId,
        actorId: input.actorId,
        action: "refund.email",
        entityType: "commerce_refund",
        entityId: input.refundId,
        summary: "Refund email unavailable: Customer has no email on file.",
        afterState: { status: "unavailable" },
      }).catch(() => undefined);
      return {
        ok: false,
        status: "unavailable",
        error: "Customer has no email on file.",
      };
    }

    if (String(built.metadata.email_status ?? "") === "sent") {
      return { ok: true, status: "skipped", error: "Already sent." };
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

    const logStatus = await peekLatestLogStatus({
      businessId: input.businessId,
      templateKey: "commerce.refund",
      recipient: built.customerEmail,
      appointmentId: built.appointmentId,
    });
    const status = truthFromSend({ sendOk: result.ok, logStatus });
    await writeCommerceAudit({
      businessId: input.businessId,
      actorId: input.actorId,
      action: "refund.email",
      entityType: "commerce_refund",
      entityId: input.refundId,
      summary:
        status === "sent"
          ? `Refund confirmation emailed to ${built.customerEmail}`
          : `Refund email failed: ${result.error ?? "unknown"}`,
      afterState: {
        status,
        messageId: result.messageId ?? null,
        error: result.error ?? null,
      },
    }).catch(() => undefined);

    await mergeRefundMetadata({
      businessId: input.businessId,
      refundId: input.refundId,
      patch: {
        email_status: status,
        emailed_at: new Date().toISOString(),
        email_error: result.error ?? null,
      },
    });

    if (status !== "sent") {
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

/**
 * Business-side refund notification. Default-on when booking/payment
 * operational notifications are enabled. Never rolls back the refund.
 * Duplicate sends for the same refund row are skipped.
 */
export async function sendRefundBusinessNotification(input: {
  businessId: string;
  refundId: string;
  actorId?: string | null;
  /** Explicit Communications resend. Automatic processors must omit this. */
  forceResend?: boolean;
}): Promise<RefundEmailResult> {
  try {
    const built = await buildRefundEmailContext({
      businessId: input.businessId,
      refundId: input.refundId,
      actorId: input.actorId,
    });

    if (!built.ok) {
      await writeCommerceAudit({
        businessId: input.businessId,
        actorId: input.actorId,
        action: "refund.business_email",
        entityType: "commerce_refund",
        entityId: input.refundId,
        summary: `Business refund email ${built.status}: ${built.error}`,
        afterState: { status: built.status, error: built.error },
      }).catch(() => undefined);
      return { ok: false, status: built.status, error: built.error };
    }

    if (
      !input.forceResend &&
      String(built.metadata.business_email_status ?? "") === "sent"
    ) {
      return { ok: true, status: "skipped", error: "Already sent." };
    }

    if (!built.ownerNotificationsEnabled || !built.emailNotificationsEnabled) {
      await mergeRefundMetadata({
        businessId: input.businessId,
        refundId: input.refundId,
        patch: {
          business_email_status: "skipped",
          business_email_error: "Business operational notifications disabled.",
        },
      });
      return {
        ok: false,
        status: "skipped",
        error: "Business operational notifications are disabled.",
      };
    }

    if (!built.businessRecipient) {
      await mergeRefundMetadata({
        businessId: input.businessId,
        refundId: input.refundId,
        patch: {
          business_email_status: "unavailable",
          business_email_error: "No business notification email configured.",
        },
      });
      return {
        ok: false,
        status: "unavailable",
        error: "No business notification email configured.",
      };
    }

    const { sendEmail } = await import("@/lib/communications/delivery");
    const result = await sendEmail({
      businessId: input.businessId,
      to: built.businessRecipient,
      templateKey: "commerce.refund.business",
      customerId: built.customerId,
      appointmentId: built.appointmentId,
      skipPreferenceCheck: true,
      context: built.context,
    });

    const logStatus = await peekLatestLogStatus({
      businessId: input.businessId,
      templateKey: "commerce.refund.business",
      recipient: built.businessRecipient,
      appointmentId: built.appointmentId,
    });
    const status = truthFromSend({ sendOk: result.ok, logStatus });

    await writeCommerceAudit({
      businessId: input.businessId,
      actorId: input.actorId,
      action: "refund.business_email",
      entityType: "commerce_refund",
      entityId: input.refundId,
      summary:
        status === "sent"
          ? `Business refund notification emailed to ${built.businessRecipient}`
          : `Business refund notification failed: ${result.error ?? "unknown"}`,
      afterState: {
        status,
        messageId: result.messageId ?? null,
        error: result.error ?? null,
        recipient: built.businessRecipient,
      },
    }).catch(() => undefined);

    await mergeRefundMetadata({
      businessId: input.businessId,
      refundId: input.refundId,
      patch: {
        business_email_status: status,
        business_emailed_at: new Date().toISOString(),
        business_email_error: result.error ?? null,
      },
    });

    if (status !== "sent") {
      return {
        ok: false,
        status: "failed",
        error: result.error ?? "Could not send business refund notification.",
      };
    }
    return { ok: true, status: "sent" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logQueryError("commerce.refund.business_email", message);
    return { ok: false, status: "failed", error: message };
  }
}
