"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import type { CommerceActionState } from "@/lib/actions/commerce";
import { sendInvoiceEmail } from "@/lib/commerce/invoice-email";
import { sendPaymentReceiptNow } from "@/lib/commerce/receipts";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function sendInvoiceEmailAction(
  invoiceNumber: string,
): Promise<CommerceActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const result = await sendInvoiceEmail({
    businessId: business.id,
    invoiceNumber,
    actorId: user?.id ?? null,
  });
  revalidatePath(`/dashboard/payments/invoices/${encodeURIComponent(invoiceNumber)}`);
  if (!result.ok) {
    return { error: result.error ?? "Invoice email could not be sent." };
  }
  return { success: "Invoice emailed." };
}

export async function resendReceiptFromWorkspaceAction(
  receiptNumber: string,
): Promise<CommerceActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const { data: receipt } = await supabase
    .from("commerce_receipts")
    .select("id, transaction_id, email_status")
    .eq("business_id", business.id)
    .eq("receipt_number", receiptNumber)
    .maybeSingle();
  if (!receipt?.id) return { error: "Receipt not found." };

  const { data: tx } = await supabase
    .from("commerce_transactions")
    .select("appointment_id")
    .eq("id", receipt.transaction_id)
    .maybeSingle();

  if (
    String(receipt.email_status) === "sent" ||
    String(receipt.email_status) === "queued"
  ) {
    await supabase
      .from("commerce_receipts")
      .update({ email_status: "failed" })
      .eq("id", receipt.id)
      .eq("business_id", business.id)
      .in("email_status", ["sent", "queued"]);
  }

  const emailed = await sendPaymentReceiptNow({
    businessId: business.id,
    receiptId: String(receipt.id),
    appointmentId: tx?.appointment_id ? String(tx.appointment_id) : null,
    idempotencyKey: `workspace-resend:${receiptNumber}`,
  });
  revalidatePath(`/dashboard/payments/receipts/${encodeURIComponent(receiptNumber)}`);
  if (!emailed.ok) {
    return { error: emailed.error ?? "Receipt email could not be sent." };
  }
  return {
    success: emailed.skipped ? "Receipt already sent." : "Receipt sent.",
  };
}
