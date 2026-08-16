import { formatCalendarDateParam } from "@/lib/calendar/date-param";
import { formatStaffFacingInstant } from "@/lib/business/datetime";
import {
  appointmentWorkspacePath,
  collectPaymentPath,
  customerWorkspacePath,
  invoiceWorkspacePath,
  receiptWorkspacePath,
} from "@/lib/commerce/document-paths";
import { documentCurrencyMismatch } from "@/lib/commerce/document-currency";
import { mapInvoice, mapReceipt, mapTransaction } from "@/lib/commerce/mappers";
import {
  appointmentCollectibleMoneyFromStamps,
  INVOICE_STATUS_UI,
  isCommerceInvoiceRecord,
} from "@/lib/commerce/money-contract";
import { formatMoneyCentsExact, normalizeCurrency } from "@/lib/commerce/money";
import {
  isRefundableTransaction,
  remainingRefundableCents,
} from "@/lib/commerce/refundability";
import {
  PAYMENT_METHOD_LABELS,
  type CommerceInvoice,
  type CommerceRefund,
} from "@/lib/commerce/types";
import { createClient } from "@/lib/supabase/server";

export type InvoiceWorkspaceModel = {
  invoice: CommerceInvoice;
  invoiceNumber: string;
  statusLabel: string;
  currencyStored: string;
  currencyCode: string;
  businessCurrency: string;
  currencyMismatch: boolean;
  timezone: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  customerHref: string;
  businessName: string;
  businessLegalName: string | null;
  businessEmail: string | null;
  businessPhone: string | null;
  businessAddress: string | null;
  businessLogoUrl: string | null;
  taxNumber: string | null;
  issueDateLabel: string;
  dueDateLabel: string | null;
  notes: string | null;
  serviceName: string | null;
  appointmentWhen: string | null;
  appointmentHref: string | null;
  locationName: string | null;
  staffName: string | null;
  money: {
    subtotal: string;
    discount: string;
    tax: string;
    total: string;
    paid: string;
    refunded: string;
    balance: string;
  };
  collectibleRemainingCents: number;
  collectHref: string | null;
  payments: Array<{
    label: string;
    amount: string;
    method: string;
    when: string;
    receiptHref: string | null;
    receiptNumber: string | null;
  }>;
  receipts: Array<{ number: string; href: string; amount: string }>;
  emailStatus: "sent" | "failed" | "no_recipient" | "never_sent";
  emailDetail: string | null;
};

export type ReceiptWorkspaceModel = {
  receiptNumber: string;
  currencyStored: string;
  currencyCode: string;
  businessCurrency: string;
  currencyMismatch: boolean;
  timezone: string;
  amount: string;
  kindLabel: string;
  methodLabel: string;
  paidAt: string;
  issuedAt: string;
  emailStatus: string;
  customerName: string;
  customerHref: string;
  serviceName: string | null;
  appointmentWhen: string | null;
  appointmentHref: string | null;
  locationName: string | null;
  staffName: string | null;
  invoiceNumber: string | null;
  invoiceHref: string | null;
  appointmentSubtotal: string | null;
  appointmentTax: string | null;
  appointmentTotal: string | null;
  thisPayment: string;
  totalPaidAfter: string | null;
  balanceAfter: string | null;
  refundHref: string | null;
};

function money(cents: number, currency: string) {
  return formatMoneyCentsExact(cents, currency);
}

function formatAddress(row: {
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
} | null): string | null {
  if (!row) return null;
  const parts = [
    row.address_line1,
    row.address_line2,
    [row.city, row.state].filter(Boolean).join(", "),
    row.postal_code,
  ].filter((p) => Boolean(p && String(p).trim()));
  return parts.length ? parts.join(", ") : null;
}

function formatCivilDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(`${value}T12:00:00`);
  if (!Number.isFinite(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export async function loadInvoiceWorkspace(input: {
  businessId: string;
  invoiceNumber: string;
}): Promise<InvoiceWorkspaceModel | null> {
  const number = decodeURIComponent(input.invoiceNumber).trim();
  if (!number || number.startsWith("appt:")) return null;

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("commerce_invoices")
    .select("*")
    .eq("business_id", input.businessId)
    .eq("invoice_number", number)
    .maybeSingle();

  if (!row || !isCommerceInvoiceRecord(String(row.id))) return null;

  const { data: lines } = await supabase
    .from("commerce_invoice_lines")
    .select("*")
    .eq("invoice_id", row.id)
    .order("sort_order");

  const mapped = mapInvoice(
    row as Record<string, unknown>,
    (lines ?? []).map((l) => ({
      id: String((l as { id: string }).id),
      description: String((l as { description?: string }).description ?? "Service"),
      quantity: Number((l as { quantity?: number }).quantity ?? 1),
      unitAmountCents: Number((l as { unit_amount_cents?: number }).unit_amount_cents ?? 0),
      taxCents: Number((l as { tax_cents?: number }).tax_cents ?? 0),
      discountCents: Number((l as { discount_cents?: number }).discount_cents ?? 0),
      totalCents: Number((l as { total_cents?: number }).total_cents ?? 0),
      serviceId: ((l as { service_id?: string | null }).service_id as string) ?? null,
    })),
  );

  const stored = normalizeCurrency(mapped.currency);
  const [{ data: business }, { data: customer }] = await Promise.all([
    supabase
      .from("businesses")
      .select(
        "name, legal_name, email, phone, currency, timezone, logo_url, tax_number, address_line1, address_line2, city, state, postal_code",
      )
      .eq("id", input.businessId)
      .maybeSingle(),
    supabase
      .from("customers")
      .select("id, name, email, phone")
      .eq("id", mapped.customerId)
      .maybeSingle(),
  ]);

  const businessCurrency = normalizeCurrency(business?.currency);
  const timezone = business?.timezone?.trim() || "America/Toronto";
  const snapCust = mapped.customerSnapshot as {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  };

  let serviceName: string | null = mapped.lines[0]?.description ?? null;
  let appointmentWhen: string | null = null;
  let appointmentHref: string | null = null;
  let locationName: string | null = null;
  let staffName: string | null = null;
  let collectibleRemainingCents = 0;
  let isCollectible = false;

  if (mapped.appointmentId) {
    const { data: appt } = await supabase
      .from("appointments")
      .select(
        "id, start_time, status, price_cents, tax_cents, discount_cents, deposit_cents, amount_paid_cents, amount_refunded_cents, payment_status, location:locations(name), staff:staff(name), service:services(name)",
      )
      .eq("id", mapped.appointmentId)
      .eq("business_id", input.businessId)
      .maybeSingle();
    if (appt) {
      const svc = appt.service as { name?: string } | { name?: string }[] | null;
      const svcRow = Array.isArray(svc) ? svc[0] : svc;
      serviceName = svcRow?.name ?? serviceName;
      appointmentWhen = formatStaffFacingInstant(String(appt.start_time), timezone);
      appointmentHref = appointmentWorkspacePath(
        String(appt.id),
        formatCalendarDateParam(new Date(String(appt.start_time)), timezone),
      );
      const loc = appt.location as { name?: string } | { name?: string }[] | null;
      locationName = (Array.isArray(loc) ? loc[0] : loc)?.name ?? null;
      const st = appt.staff as { name?: string } | { name?: string }[] | null;
      staffName = (Array.isArray(st) ? st[0] : st)?.name ?? null;
      const moneyStamps = appointmentCollectibleMoneyFromStamps({
        ...appt,
        services: appt.service,
      });
      collectibleRemainingCents = moneyStamps.collectibleRemainingBalanceCents;
      isCollectible = moneyStamps.isCollectible;
    }
  }

  const { data: txRows } = await supabase
    .from("commerce_transactions")
    .select("*")
    .eq("business_id", input.businessId)
    .eq("invoice_id", mapped.id)
    .order("occurred_at", { ascending: true });

  const { data: receiptRows } = await supabase
    .from("commerce_receipts")
    .select("*")
    .eq("business_id", input.businessId)
    .eq("invoice_id", mapped.id)
    .order("issued_at", { ascending: true });

  const receipts = (receiptRows ?? []).map((r) =>
    mapReceipt(r as Record<string, unknown>),
  );
  const receiptByTx = new Map(receipts.map((r) => [r.transactionId, r]));

  const payments = (txRows ?? [])
    .map((r) => mapTransaction(r as Record<string, unknown>))
    .filter(
      (t) =>
        t.status === "succeeded" &&
        (t.kind === "payment" || t.kind === "deposit"),
    )
    .map((t) => {
      const rec = receiptByTx.get(t.id);
      return {
        label: t.kind === "deposit" ? "Deposit" : "Payment",
        amount: money(t.amountCents, t.currency),
        method: PAYMENT_METHOD_LABELS[t.method] ?? t.method,
        when: formatStaffFacingInstant(t.occurredAt, timezone),
        receiptHref: rec ? receiptWorkspacePath(rec.receiptNumber) : null,
        receiptNumber: rec?.receiptNumber ?? null,
      };
    });

  const customerEmail =
    customer?.email?.trim() || snapCust.email?.trim() || null;
  let emailStatus: InvoiceWorkspaceModel["emailStatus"] = customerEmail
    ? "never_sent"
    : "no_recipient";
  let emailDetail: string | null = customerEmail
    ? null
    : "Customer has no email on file.";

  if (customerEmail) {
    const { data: logs } = await supabase
      .from("notification_logs")
      .select("status, sent_at, error_message, created_at")
      .eq("business_id", input.businessId)
      .eq("template_key", "commerce.invoice")
      .eq("recipient", customerEmail)
      .order("created_at", { ascending: false })
      .limit(8);
    const log = (logs ?? []).find((l) => {
      const st = String(l.status ?? "");
      return st === "sent" || st === "delivered" || st === "failed";
    });
    if (log) {
      const st = String(log.status);
      emailStatus = st === "failed" ? "failed" : "sent";
      emailDetail = log.sent_at
        ? `Last ${emailStatus} ${formatStaffFacingInstant(String(log.sent_at), timezone)}`
        : (log.error_message as string | null);
    }
  }

  const collectHref =
    mapped.appointmentId &&
    mapped.customerId &&
    isCollectible &&
    collectibleRemainingCents > 0
      ? collectPaymentPath({
          customerId: mapped.customerId,
          appointmentId: mapped.appointmentId,
        })
      : null;

  return {
    invoice: mapped,
    invoiceNumber: mapped.invoiceNumber,
    statusLabel: INVOICE_STATUS_UI[mapped.status] ?? mapped.status,
    currencyStored: stored,
    currencyCode: stored.toUpperCase(),
    businessCurrency,
    currencyMismatch: documentCurrencyMismatch(stored, businessCurrency),
    timezone,
    customerName: customer?.name?.trim() || snapCust.name || "Customer",
    customerEmail,
    customerPhone: customer?.phone?.trim() || snapCust.phone || null,
    customerHref: customerWorkspacePath(mapped.customerId),
    businessName: business?.name ?? "Business",
    businessLegalName: business?.legal_name ?? null,
    businessEmail: business?.email ?? null,
    businessPhone: business?.phone ?? null,
    businessAddress: formatAddress(business),
    businessLogoUrl: business?.logo_url ?? null,
    taxNumber: business?.tax_number ?? null,
    issueDateLabel: formatCivilDate(mapped.issueDate) ?? mapped.issueDate,
    dueDateLabel: formatCivilDate(mapped.dueDate),
    notes: mapped.notes,
    serviceName,
    appointmentWhen,
    appointmentHref,
    locationName,
    staffName,
    money: {
      subtotal: money(mapped.subtotalCents, stored),
      discount: money(mapped.discountCents, stored),
      tax: money(mapped.taxCents, stored),
      total: money(mapped.totalCents, stored),
      paid: money(mapped.amountPaidCents, stored),
      refunded: money(mapped.amountRefundedCents, stored),
      balance: money(mapped.balanceCents, stored),
    },
    collectibleRemainingCents,
    collectHref,
    payments,
    receipts: receipts.map((r) => ({
      number: r.receiptNumber,
      href: receiptWorkspacePath(r.receiptNumber),
      amount: money(r.amountCents, r.currency),
    })),
    emailStatus,
    emailDetail,
  };
}

export async function loadReceiptWorkspace(input: {
  businessId: string;
  receiptNumber: string;
}): Promise<ReceiptWorkspaceModel | null> {
  const number = decodeURIComponent(input.receiptNumber).trim();
  if (!number) return null;
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("commerce_receipts")
    .select("*")
    .eq("business_id", input.businessId)
    .eq("receipt_number", number)
    .maybeSingle();
  if (!row) return null;

  const receipt = mapReceipt(row as Record<string, unknown>);
  const stored = normalizeCurrency(receipt.currency);

  const [{ data: business }, { data: customer }, { data: txRow }] =
    await Promise.all([
      supabase
        .from("businesses")
        .select("currency, timezone")
        .eq("id", input.businessId)
        .maybeSingle(),
      supabase
        .from("customers")
        .select("id, name")
        .eq("id", receipt.customerId)
        .maybeSingle(),
      supabase
        .from("commerce_transactions")
        .select("*")
        .eq("id", receipt.transactionId)
        .eq("business_id", input.businessId)
        .maybeSingle(),
    ]);

  const timezone = business?.timezone?.trim() || "America/Toronto";
  const businessCurrency = normalizeCurrency(business?.currency);
  const tx = txRow ? mapTransaction(txRow as Record<string, unknown>) : null;

  let serviceName: string | null = null;
  let appointmentWhen: string | null = null;
  let appointmentHref: string | null = null;
  let locationName: string | null = null;
  let staffName: string | null = null;
  let appointmentSubtotal: string | null = null;
  let appointmentTax: string | null = null;
  let appointmentTotal: string | null = null;
  let totalPaidAfter: string | null = null;
  let balanceAfter: string | null = null;
  let invoiceNumber: string | null = null;
  let invoiceHref: string | null = null;

  if (receipt.invoiceId) {
    const { data: inv } = await supabase
      .from("commerce_invoices")
      .select("invoice_number")
      .eq("id", receipt.invoiceId)
      .eq("business_id", input.businessId)
      .maybeSingle();
    if (inv?.invoice_number) {
      invoiceNumber = String(inv.invoice_number);
      invoiceHref = invoiceWorkspacePath(invoiceNumber);
    }
  }

  const appointmentId = tx?.appointmentId ?? null;
  if (appointmentId) {
    const { data: appt } = await supabase
      .from("appointments")
      .select(
        "id, start_time, price_cents, tax_cents, location:locations(name), staff:staff(name), service:services(name)",
      )
      .eq("id", appointmentId)
      .eq("business_id", input.businessId)
      .maybeSingle();
    if (appt) {
      const svc = appt.service as { name?: string } | { name?: string }[] | null;
      serviceName = (Array.isArray(svc) ? svc[0] : svc)?.name ?? null;
      appointmentWhen = formatStaffFacingInstant(String(appt.start_time), timezone);
      appointmentHref = appointmentWorkspacePath(
        String(appt.id),
        formatCalendarDateParam(new Date(String(appt.start_time)), timezone),
      );
      const loc = appt.location as { name?: string } | { name?: string }[] | null;
      locationName = (Array.isArray(loc) ? loc[0] : loc)?.name ?? null;
      const st = appt.staff as { name?: string } | { name?: string }[] | null;
      staffName = (Array.isArray(st) ? st[0] : st)?.name ?? null;
      const sub = Math.max(0, Number(appt.price_cents ?? 0));
      const tax = Math.max(0, Number(appt.tax_cents ?? 0));
      appointmentSubtotal = money(sub, stored);
      appointmentTax = money(tax, stored);
      appointmentTotal = money(sub + tax, stored);

      const { data: apptTx } = await supabase
        .from("commerce_transactions")
        .select("*")
        .eq("appointment_id", appointmentId)
        .eq("business_id", input.businessId)
        .order("occurred_at", { ascending: true });
      let running = 0;
      for (const raw of apptTx ?? []) {
        const t = mapTransaction(raw as Record<string, unknown>);
        if (
          t.status !== "succeeded" ||
          (t.kind !== "payment" && t.kind !== "deposit")
        ) {
          continue;
        }
        running += t.amountCents;
        if (t.id === receipt.transactionId) {
          totalPaidAfter = money(running, stored);
          balanceAfter = money(Math.max(0, sub + tax - running), stored);
          break;
        }
      }
    }
  }

  let refundHref: string | null = null;
  if (tx && appointmentId && isRefundableTransaction(tx)) {
    const { data: refunds } = await supabase
      .from("commerce_refunds")
      .select("transaction_id, amount_cents, status")
      .eq("transaction_id", tx.id);
    const remaining = remainingRefundableCents(
      tx,
      (refunds ?? []).map((r) => ({
        transactionId: String(r.transaction_id),
        amountCents: Number(r.amount_cents ?? 0),
        status: (String(r.status ?? "succeeded") as CommerceRefund["status"]),
      })),
    );
    if (remaining > 0) {
      refundHref = appointmentHref;
    }
  }

  const emailLabel =
    receipt.emailStatus === "sent"
      ? "Sent"
      : receipt.emailStatus === "failed"
        ? "Failed"
        : receipt.emailStatus === "queued"
          ? "Queued"
          : "Not sent";

  return {
    receiptNumber: receipt.receiptNumber,
    currencyStored: stored,
    currencyCode: stored.toUpperCase(),
    businessCurrency,
    currencyMismatch: documentCurrencyMismatch(stored, businessCurrency),
    timezone,
    amount: money(receipt.amountCents, stored),
    kindLabel: tx?.kind === "deposit" ? "Deposit" : "Payment",
    methodLabel: PAYMENT_METHOD_LABELS[receipt.method] ?? receipt.method,
    paidAt: formatStaffFacingInstant(receipt.issuedAt, timezone),
    issuedAt: formatStaffFacingInstant(receipt.issuedAt, timezone),
    emailStatus: emailLabel,
    customerName: customer?.name?.trim() || "Customer",
    customerHref: customerWorkspacePath(receipt.customerId),
    serviceName,
    appointmentWhen,
    appointmentHref,
    locationName,
    staffName,
    invoiceNumber,
    invoiceHref,
    appointmentSubtotal,
    appointmentTax,
    appointmentTotal,
    thisPayment: money(receipt.amountCents, stored),
    totalPaidAfter,
    balanceAfter,
    refundHref,
  };
}

export function canCollectFromInvoice(model: {
  collectHref: string | null;
  collectibleRemainingCents: number;
}): boolean {
  return Boolean(model.collectHref) && model.collectibleRemainingCents > 0;
}
