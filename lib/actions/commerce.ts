"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import {
  createInvoiceForAppointment,
  formatInvoiceText,
  getBookingPaymentSummary,
  getCommerceDashboardSnapshot,
  getCustomerCommerceAccount,
  getInvoiceById,
  getReceiptById,
  listTransactions,
  parsePaymentMethod,
  processCommerceRefund,
  queueReceiptEmail,
  recordCommercePayment,
} from "@/lib/commerce";
import { normalizeCurrency } from "@/lib/commerce/money";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type CommerceActionState = {
  error?: string;
  success?: string;
  clientSecret?: string | null;
  requiresAction?: boolean;
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
  return getCommerceDashboardSnapshot(business.id, business.name);
}

export async function loadCustomerCommerceAccount(customerId: string) {
  const business = await getOrCreateBusiness();
  return getCustomerCommerceAccount(business.id, customerId);
}

export async function loadBookingPaymentSummary(appointmentId: string) {
  const business = await getOrCreateBusiness();
  return getBookingPaymentSummary(business.id, appointmentId);
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

  if (!customerId || Number.isNaN(amount) || amount <= 0) {
    return { error: "Customer and a valid amount are required." };
  }

  const result = await recordCommercePayment({
    businessId: business.id,
    customerId,
    appointmentId,
    invoiceId,
    amountCents: Math.round(amount * 100),
    method,
    description,
    kind: kindRaw === "deposit" ? "deposit" : "payment",
    currency: normalizeCurrency(business.currency),
    actorId: user?.id ?? null,
    ensureInvoice: Boolean(appointmentId),
    forceManual,
    giftCardCode,
    giftCardId,
  });

  if (!result.ok) {
    return { error: result.error ?? "Could not record payment." };
  }

  revalidateCommerce(customerId);

  if (result.requiresAction) {
    return {
      success: "Card payment requires customer confirmation.",
      clientSecret: result.clientSecret,
      requiresAction: true,
    };
  }

  return { success: "Payment saved." };
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
    return { error: "Transaction and refund amount are required." };
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
    return { error: result.error ?? "Refund failed." };
  }

  revalidateCommerce(result.refund?.customerId);
  return { success: "Refund processed." };
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
