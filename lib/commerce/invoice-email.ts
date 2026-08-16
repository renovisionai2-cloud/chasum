import { writeCommerceAudit } from "@/lib/commerce/audit";
import { loadInvoiceWorkspace } from "@/lib/commerce/document-workspace";
import { logQueryError } from "@/lib/supabase/errors";
import type { AppointmentTemplateContext } from "@/lib/communications/types";

export type InvoiceEmailStatus = "sent" | "failed" | "unavailable" | "skipped";

export async function sendInvoiceEmail(input: {
  businessId: string;
  invoiceNumber: string;
  actorId?: string | null;
}): Promise<{ ok: boolean; status: InvoiceEmailStatus; error?: string }> {
  const model = await loadInvoiceWorkspace({
    businessId: input.businessId,
    invoiceNumber: input.invoiceNumber,
  });
  if (!model) {
    return { ok: false, status: "failed", error: "Invoice not found." };
  }
  if (!model.customerEmail) {
    return {
      ok: false,
      status: "unavailable",
      error: "Customer has no email on file.",
    };
  }

  const inv = model.invoice;
  const context: AppointmentTemplateContext = {
    businessId: input.businessId,
    businessName: model.businessName,
    customerName: model.customerName,
    customerEmail: model.customerEmail,
    customerPhone: model.customerPhone,
    customerId: inv.customerId,
    staffName: model.staffName ?? "Team",
    serviceName: model.serviceName ?? "Service",
    startTime: new Date().toISOString(),
    timezone: model.timezone,
    businessTimezone: model.timezone,
    locationName: model.locationName,
    amountCents: inv.totalCents,
    subtotalCents: inv.subtotalCents,
    taxCents: inv.taxCents,
    appointmentTotalCents: inv.totalCents,
    depositPaidCents: inv.amountPaidCents,
    remainingBalanceCents: inv.balanceCents,
    invoiceNumber: inv.invoiceNumber,
    paymentStatusLabel: model.statusLabel,
    notes: model.notes,
    invoicePaidCents: inv.amountPaidCents,
    invoiceBalanceCents: inv.balanceCents,
    invoiceIssueDate: model.issueDateLabel,
    invoiceDueDate: model.dueDateLabel,
    documentCurrency: model.currencyStored,
  };

  try {
    const { sendEmail } = await import("@/lib/communications/delivery");
    const result = await sendEmail({
      businessId: input.businessId,
      to: model.customerEmail,
      templateKey: "commerce.invoice",
      customerId: inv.customerId,
      appointmentId: inv.appointmentId,
      skipPreferenceCheck: true,
      context,
    });
    await writeCommerceAudit({
      businessId: input.businessId,
      actorId: input.actorId,
      action: result.ok ? "invoice.emailed" : "invoice.email_failed",
      entityType: "commerce_invoice",
      entityId: inv.id,
      summary: result.ok
        ? `Invoice ${inv.invoiceNumber} emailed`
        : `Invoice ${inv.invoiceNumber} email failed`,
    });
    if (!result.ok) {
      return {
        ok: false,
        status: "failed",
        error: result.error ?? "Invoice email could not be sent.",
      };
    }
    return { ok: true, status: "sent" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logQueryError("commerce.invoice.email", message);
    return { ok: false, status: "failed", error: "Invoice email could not be sent." };
  }
}
