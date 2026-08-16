"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import {
  createInvoiceForAppointment,
  formatInvoiceText,
  getCommerceDashboardSnapshot,
  getCustomerCommerceAccount,
  getInvoiceById,
  getReceiptById,
  listTransactions,
  listRefunds,
  parsePaymentMethod,
  processCommerceRefund,
  queueReceiptEmail,
  recordCommercePayment,
} from "@/lib/commerce";
import { humanizeRefundError } from "@/lib/commerce/refundability";
import {
  assertCollectiblePaymentAmount,
  humanizePaymentError,
} from "@/lib/commerce/front-desk";
import {
  getFrontDeskAppointmentContext,
  listAppointmentLabels,
  listFrontDeskAppointmentsForCustomer,
  listOutstandingAppointmentBalances,
  listOutstandingDeposits,
} from "@/lib/commerce/front-desk-queries";
import { sendPaymentReceiptNow } from "@/lib/commerce/receipts";
import { centsToDollars } from "@/lib/commerce/types";
import { normalizeCurrency } from "@/lib/commerce/money";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type CommerceActionState = {
  error?: string;
  success?: string;
  clientSecret?: string | null;
  requiresAction?: boolean;
  /** Phase 6.0B — refund confirmation email outcome (never rolls back refund). */
  emailStatus?: "sent" | "failed" | "unavailable" | "skipped";
  receiptStatus?: "sent" | "failed" | "unavailable" | "queued" | "skipped";
  receiptId?: string | null;
  remainingCents?: number;
  amountCents?: number;
  method?: string;
};

function revalidateCommerce(customerId?: string | null) {
  revalidatePath("/dashboard/payments");
  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/workforce/chase");
  revalidatePath("/dashboard/reports");
  if (customerId) revalidatePath(`/dashboard/clients/${customerId}`);
}

export async function loadCommerceDashboard() {
  const business = await getOrCreateBusiness();
  return getCommerceDashboardSnapshot(business.id, business.name, {
    currency: business.currency,
    timezone: business.timezone,
  });
}

export async function loadCustomerCommerceAccount(customerId: string) {
  const business = await getOrCreateBusiness();
  return getCustomerCommerceAccount(business.id, customerId);
}

export async function loadFrontDeskAppointmentsForCustomer(
  customerId: string,
  includeAppointmentId?: string | null,
) {
  const business = await getOrCreateBusiness();
  return listFrontDeskAppointmentsForCustomer({
    businessId: business.id,
    customerId,
    timeZone: business.timezone ?? "America/Toronto",
    includeAppointmentId,
  });
}

export async function loadFrontDeskAppointmentContext(appointmentId: string) {
  const business = await getOrCreateBusiness();
  return getFrontDeskAppointmentContext({
    businessId: business.id,
    appointmentId,
    timeZone: business.timezone ?? "America/Toronto",
  });
}

export async function loadOutstandingQueues() {
  const business = await getOrCreateBusiness();
  const timeZone = business.timezone ?? "America/Toronto";
  const [balances, deposits] = await Promise.all([
    listOutstandingAppointmentBalances({
      businessId: business.id,
      timeZone,
    }),
    listOutstandingDeposits({ businessId: business.id, timeZone }),
  ]);
  return { balances, deposits, currency: business.currency ?? "cad" };
}

export async function loadAppointmentLabels(appointmentIds: string[]) {
  const business = await getOrCreateBusiness();
  const map = await listAppointmentLabels({
    businessId: business.id,
    appointmentIds,
    timeZone: business.timezone ?? "America/Toronto",
  });
  return Object.fromEntries(map);
}

export async function loadAppointmentLedger(appointmentId: string) {
  const business = await getOrCreateBusiness();
  const [history, refunds] = await Promise.all([
    listTransactions({
      businessId: business.id,
      appointmentId,
      limit: 40,
    }),
    listRefunds({ businessId: business.id, limit: 80 }),
  ]);
  return { history, refunds };
}

export async function recordPaymentAction(
  _prev: CommerceActionState,
  formData: FormData,
): Promise<CommerceActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const customerId = String(formData.get("customer_id") ?? "");
  const appointmentId = String(formData.get("appointment_id") ?? "") || null;
  const invoiceId = String(formData.get("invoice_id") ?? "") || null;
  const amountRaw = String(formData.get("amount") ?? "").replace(/[^0-9.]/g, "");
  const amount = Number(amountRaw);
  const method = parsePaymentMethod(formData.get("method"));
  const description = String(formData.get("description") ?? "").trim() || null;
  const kindRaw = String(formData.get("kind") ?? "");
  const forceManual = String(formData.get("force_manual") ?? "") === "1";
  const giftCardCode =
    String(formData.get("gift_card_code") ?? "").trim() || null;
  const giftCardId = String(formData.get("gift_card_id") ?? "").trim() || null;
  const amountCents = Math.round(amount * 100);

  if (!customerId || Number.isNaN(amount) || amount <= 0) {
    return { error: "Choose a customer and enter a valid amount." };
  }

  if (!appointmentId && !invoiceId) {
    return {
      error:
        "There is no outstanding balance to collect. Record payment from the appointment.",
    };
  }

  if (appointmentId) {
    const ctx = await getFrontDeskAppointmentContext({
      businessId: business.id,
      appointmentId,
      timeZone: business.timezone ?? "America/Toronto",
    });
    if (!ctx) {
      return { error: "Appointment not found." };
    }
    if (ctx.customerId !== customerId) {
      return { error: "This appointment does not belong to the selected customer." };
    }
    const cap = assertCollectiblePaymentAmount({
      amountCents,
      remainingCents: ctx.remainingCents,
    });
    if (!cap.ok) return { error: cap.error };
  }

  const result = await recordCommercePayment({
    businessId: business.id,
    customerId,
    appointmentId,
    invoiceId,
    amountCents,
    method,
    description,
    kind: kindRaw === "deposit" ? "deposit" : "payment",
    currency: normalizeCurrency(business.currency),
    actorId: user?.id ?? null,
    ensureInvoice: Boolean(appointmentId),
    forceManual,
    giftCardCode,
    giftCardId,
    sendReceiptEmail: false,
  });

  if (!result.ok) {
    return {
      error: humanizePaymentError(
        result.error ?? "This payment could not be recorded.",
      ),
      clientSecret: result.clientSecret,
      requiresAction: result.requiresAction,
    };
  }

  revalidateCommerce(customerId);

  let remainingCents: number | undefined;
  if (appointmentId) {
    const after = await getFrontDeskAppointmentContext({
      businessId: business.id,
      appointmentId,
      timeZone: business.timezone ?? "America/Toronto",
    });
    remainingCents = after?.remainingCents;
  }

  let receiptStatus: CommerceActionState["receiptStatus"] = "skipped";
  let receiptId: string | null = null;
  const txId = result.transaction?.id;
  if (txId) {
    const { data: receiptRow } = await supabase
      .from("commerce_receipts")
      .select("id, email_status")
      .eq("business_id", business.id)
      .eq("transaction_id", txId)
      .maybeSingle();
    if (receiptRow?.id) {
      receiptId = String(receiptRow.id);
      const emailed = await sendPaymentReceiptNow({
        businessId: business.id,
        receiptId,
        appointmentId,
      });
      if (emailed.ok) {
        receiptStatus = emailed.skipped ? "queued" : "sent";
        if (emailed.skipped) receiptStatus = "sent";
      } else if (/no email/i.test(emailed.error ?? "")) {
        receiptStatus = "unavailable";
      } else {
        receiptStatus = "failed";
      }
    }
  }

  const money = centsToDollars(
    amountCents,
    result.transaction?.currency ?? business.currency ?? "cad",
  );
  const receiptNote =
    receiptStatus === "sent"
      ? " Receipt sent."
      : receiptStatus === "unavailable"
        ? " Receipt could not be emailed (no email on file)."
        : receiptStatus === "failed"
          ? " Receipt email could not be sent."
          : "";
  const remainingNote =
    remainingCents != null
      ? remainingCents <= 0
        ? " Balance is paid in full."
        : ` Remaining balance ${centsToDollars(remainingCents, business.currency)}.`
      : "";

  return {
    success: `Payment recorded — ${money}.${remainingNote}${receiptNote}`,
    receiptStatus,
    receiptId,
    remainingCents,
    amountCents,
    method,
  };
}

export async function createInvoiceAction(
  appointmentId: string,
): Promise<CommerceActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const result = await createInvoiceForAppointment({
    businessId: business.id,
    appointmentId,
    actorId: user?.id ?? null,
  });

  if (!result.invoice) {
    return { error: result.error ?? "Could not create invoice." };
  }

  revalidateCommerce(result.invoice.customerId);
  return { success: `Invoice ${result.invoice.invoiceNumber} ready.` };
}

export async function refundPaymentAction(
  _prev: CommerceActionState,
  formData: FormData,
): Promise<CommerceActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const transactionId = String(formData.get("transaction_id") ?? "");
  const amountRaw = String(formData.get("amount") ?? "").replace(/[^0-9.]/g, "");
  const amount = Number(amountRaw);
  const reason = String(formData.get("reason") ?? "").trim();
  const approval = String(formData.get("approval") ?? "approved");

  if (!transactionId || Number.isNaN(amount) || amount <= 0) {
    return {
      error: !transactionId
        ? "Select a payment to refund."
        : "Enter a refund amount greater than zero.",
    };
  }

  const result = await processCommerceRefund({
    businessId: business.id,
    transactionId,
    amountCents: Math.round(amount * 100),
    reason,
    approvalStatus:
      approval === "pending"
        ? "pending"
        : approval === "rejected"
          ? "rejected"
          : "approved",
    actorId: user?.id ?? null,
  });

  if (!result.ok) {
    return {
      error: humanizeRefundError(result.error ?? "The refund could not be completed."),
    };
  }

  revalidateCommerce(result.refund?.customerId);
  const refunded = result.refund?.amountCents ?? Math.round(amount * 100);
  const money = centsToDollars(
    refunded,
    result.refund?.currency ?? business.currency ?? "usd",
  );
  const emailStatus = result.emailStatus ?? "skipped";
  const emailNote =
    emailStatus === "sent"
      ? " Customer confirmation sent."
      : emailStatus === "unavailable"
        ? " Customer email could not be sent (no email on file)."
        : emailStatus === "failed"
          ? " Customer email could not be sent."
          : "";
  return {
    success: `Refunded ${money}.${emailNote}`,
    emailStatus,
  };
}

export async function downloadInvoiceTextAction(
  invoiceId: string,
): Promise<{ text?: string; error?: string }> {
  const business = await getOrCreateBusiness();
  const invoice = await getInvoiceById(business.id, invoiceId);
  if (!invoice) return { error: "Invoice not found." };
  // Ensure lines loaded
  const full = await getInvoiceById(business.id, invoiceId);
  return { text: formatInvoiceText(full ?? invoice) };
}

export async function downloadReceiptTextAction(
  receiptId: string,
): Promise<{ text?: string; error?: string }> {
  const business = await getOrCreateBusiness();
  const receipt = await getReceiptById(business.id, receiptId);
  if (!receipt) return { error: "Receipt not found." };
  return { text: receipt.bodyText };
}

export async function queueReceiptEmailAction(
  receiptId: string,
): Promise<CommerceActionState> {
  const business = await getOrCreateBusiness();
  const result = await queueReceiptEmail(business.id, receiptId);
  if (!result.ok) return { error: result.error };
  revalidatePath("/dashboard/payments");
  return { success: "Receipt queued for email (delivery ships later)." };
}

export async function listRecentTransactionsAction(limit = 40) {
  const business = await getOrCreateBusiness();
  return listTransactions({ businessId: business.id, limit });
}
