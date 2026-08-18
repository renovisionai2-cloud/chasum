import { writeCommerceAudit } from "@/lib/commerce/audit";
import { pickCanonicalRow } from "@/lib/commerce/document-identity";
import {
  claimOptimisticSequenceNumber,
  DEFAULT_INVOICE_PREFIX,
  DOCUMENT_NUMBER_ALLOCATE_ATTEMPTS,
  formatPaddedDocumentNumber,
} from "@/lib/commerce/document-numbering";
import { mapInvoice, mapInvoiceLine } from "@/lib/commerce/mappers";
import { formatMoneyCents, normalizeCurrency } from "@/lib/commerce/money";
import { invoiceAmountsFromAppointmentStamps } from "@/lib/commerce/money-contract";
import type { CommerceInvoice } from "@/lib/commerce/types";
import {
  logQueryError,
  isSoftSchemaFallbackAllowed,
  isUniqueViolation,
} from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";
import { calendarDateInTimezone } from "@/lib/business/datetime";
import { addCommerceCivilDays } from "@/lib/commerce/document-dates";

type InvoiceRow = Record<string, unknown> & {
  id: string;
  created_at?: string;
  appointment_id?: string | null;
  invoice_number?: string;
};

function canonicalInvoiceRow(rows: InvoiceRow[]): InvoiceRow | null {
  return pickCanonicalRow(
    rows,
    (row) => String(row.created_at ?? ""),
    (row) => String(row.id),
  );
}

async function loadInvoicesForAppointment(
  businessId: string,
  appointmentId: string,
): Promise<InvoiceRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("commerce_invoices")
    .select("*")
    .eq("appointment_id", appointmentId)
    .eq("business_id", businessId);
  if (error) {
    if (!isSoftSchemaFallbackAllowed(error.message)) {
      logQueryError("commerce.invoice.by_appointment", error.message);
    }
    return [];
  }
  return (data ?? []) as InvoiceRow[];
}

/**
 * Allocate the next INV-n for this business.
 * CAS on commerce_invoice_sequences.next_number — a lost race retries.
 * Does not fake gapless uniqueness without the existing unique(business_id, invoice_number).
 */
async function nextInvoiceNumber(businessId: string): Promise<string | null> {
  const supabase = await createClient();

  for (let attempt = 0; attempt < DOCUMENT_NUMBER_ALLOCATE_ATTEMPTS; attempt++) {
    const { data: existing, error: readErr } = await supabase
      .from("commerce_invoice_sequences")
      .select("next_number, prefix")
      .eq("business_id", businessId)
      .maybeSingle();

    if (readErr) {
      if (isSoftSchemaFallbackAllowed(readErr.message)) return null;
      logQueryError("commerce.invoice.seq", readErr.message);
      return null;
    }

    if (!existing) {
      const { error } = await supabase.from("commerce_invoice_sequences").insert({
        business_id: businessId,
        next_number: 2,
        prefix: DEFAULT_INVOICE_PREFIX,
      });
      if (!error) {
        return formatPaddedDocumentNumber(DEFAULT_INVOICE_PREFIX, 1);
      }
      if (isUniqueViolation(error)) continue;
      if (isSoftSchemaFallbackAllowed(error.message)) return null;
      logQueryError("commerce.invoice.seq", error.message);
      return null;
    }

    const n = Number(existing.next_number ?? 1);
    const prefix = String(existing.prefix ?? DEFAULT_INVOICE_PREFIX);
    const { data: claimed } = await supabase
      .from("commerce_invoice_sequences")
      .update({ next_number: n + 1, updated_at: new Date().toISOString() })
      .eq("business_id", businessId)
      .eq("next_number", n)
      .select("next_number")
      .maybeSingle();

    const result = claimOptimisticSequenceNumber({
      observedNext: n,
      updatedRows: claimed ? 1 : 0,
    });
    if (result.claimed != null) {
      return formatPaddedDocumentNumber(prefix, result.claimed);
    }
  }

  logQueryError(
    "commerce.invoice.seq",
    "Could not allocate an invoice number after retries.",
  );
  return null;
}

export async function createInvoiceForAppointment(input: {
  businessId: string;
  appointmentId: string;
  actorId?: string | null;
  dueInDays?: number;
}): Promise<{ invoice: CommerceInvoice | null; error?: string }> {
  const supabase = await createClient();

  const apptSelectFull =
    "id, business_id, customer_id, service_id, price_cents, tax_cents, discount_cents, deposit_cents, invoice_number, payment_status, amount_paid_cents, amount_refunded_cents, services(name, price)";
  const apptSelectCompat =
    "id, business_id, customer_id, service_id, deposit_cents, invoice_number, services(name, price)";

  let { data: appt, error: apptErr } = await supabase
    .from("appointments")
    .select(apptSelectFull)
    .eq("id", input.appointmentId)
    .eq("business_id", input.businessId)
    .maybeSingle();

  if (
    apptErr &&
    (apptErr.message.includes("payment_status") ||
      apptErr.message.includes("price_cents") ||
      apptErr.message.includes("amount_paid") ||
      apptErr.message.includes("tax_cents") ||
      apptErr.message.includes("discount_cents") ||
      apptErr.message.includes("amount_refunded"))
  ) {
    const fallback = await supabase
      .from("appointments")
      .select(apptSelectCompat)
      .eq("id", input.appointmentId)
      .eq("business_id", input.businessId)
      .maybeSingle();
    appt = fallback.data
      ? ({
          ...fallback.data,
          price_cents: null,
          tax_cents: 0,
          discount_cents: 0,
          payment_status: null,
          amount_paid_cents: Number(fallback.data.deposit_cents ?? 0),
          amount_refunded_cents: 0,
        } as typeof appt)
      : null;
    apptErr = fallback.error;
  }

  if (apptErr || !appt) {
    return {
      invoice: null,
      error: apptErr?.message?.includes("payment_status")
        ? "Couldn't load this appointment for invoicing. Payments may not be fully set up yet."
        : (apptErr?.message ?? "Appointment not found."),
    };
  }

  // Prefer the earliest existing invoice for this appointment. Do not create a second.
  const existingRows = await loadInvoicesForAppointment(
    input.businessId,
    input.appointmentId,
  );
  const existing = canonicalInvoiceRow(existingRows);
  if (existing) {
    const invoice = await getInvoiceById(input.businessId, String(existing.id));
    return { invoice };
  }

  const service = appt.services as
    | { name?: string; price?: number }
    | { name?: string; price?: number }[]
    | null;
  const serviceRow = Array.isArray(service) ? service[0] : service;

  const [{ data: customerRow }, { data: businessRow }] = await Promise.all([
    supabase
      .from("customers")
      .select("id, name, email, phone")
      .eq("id", appt.customer_id)
      .maybeSingle(),
    supabase
      .from("businesses")
      .select("name, email, phone, currency, legal_name, timezone")
      .eq("id", input.businessId)
      .maybeSingle(),
  ]);

  const money = invoiceAmountsFromAppointmentStamps({
    price_cents: appt.price_cents,
    tax_cents: appt.tax_cents,
    deposit_cents: appt.deposit_cents,
    amount_paid_cents: appt.amount_paid_cents,
    amount_refunded_cents: (appt as { amount_refunded_cents?: number | null })
      .amount_refunded_cents,
    services: appt.services,
  });
  const discountCents = Number(appt.discount_cents ?? 0);
  const subtotal = money.subtotalCents;
  const taxCents = money.taxCents;
  const lineUnit = money.subtotalCents;
  const total = money.totalCents;
  const amountPaid = money.amountPaidCents;
  const balance = money.balanceCents;
  const documentCurrency = normalizeCurrency(businessRow?.currency);
  const businessTimezone = businessRow?.timezone?.trim() || "America/Toronto";

  const stampedNumber = (appt.invoice_number as string | null)?.trim() || null;
  const status =
    balance <= 0 ? "paid" : amountPaid > 0 ? "partial" : ("open" as const);
  const issueDate = calendarDateInTimezone(new Date(), businessTimezone);
  const dueDate = addCommerceCivilDays(issueDate, input.dueInDays ?? 7);

  let inv: InvoiceRow | null = null;
  let invoiceNumber = stampedNumber;
  let invErr: { code?: string; message?: string } | null = null;

  for (let attempt = 0; attempt < DOCUMENT_NUMBER_ALLOCATE_ATTEMPTS; attempt++) {
    const raced = canonicalInvoiceRow(
      await loadInvoicesForAppointment(input.businessId, input.appointmentId),
    );
    if (raced) {
      const invoice = await getInvoiceById(input.businessId, String(raced.id));
      return { invoice };
    }

    if (!invoiceNumber) {
      invoiceNumber = await nextInvoiceNumber(input.businessId);
    }
    if (!invoiceNumber) {
      return {
        invoice: null,
        error:
          "Payments aren't fully set up yet. Contact support to finish commerce setup.",
      };
    }

    const inserted = await supabase
      .from("commerce_invoices")
      .insert({
        business_id: input.businessId,
        customer_id: appt.customer_id,
        appointment_id: input.appointmentId,
        invoice_number: invoiceNumber,
        status,
        currency: documentCurrency,
        issue_date: issueDate,
        due_date: dueDate,
        subtotal_cents: lineUnit || subtotal,
        tax_cents: taxCents,
        discount_cents: discountCents,
        total_cents: total,
        amount_paid_cents: amountPaid,
        balance_cents: balance,
        paid_at: balance <= 0 ? new Date().toISOString() : null,
        business_snapshot: {
          name: businessRow?.name ?? null,
          email: businessRow?.email ?? null,
          phone: businessRow?.phone ?? null,
        },
        customer_snapshot: {
          name: customerRow?.name ?? null,
          email: customerRow?.email ?? null,
          phone: customerRow?.phone ?? null,
        },
      })
      .select("*")
      .single();

    if (inserted.data) {
      inv = inserted.data as InvoiceRow;
      invErr = null;
      break;
    }

    invErr = inserted.error;
    if (inserted.error && isSoftSchemaFallbackAllowed(inserted.error.message)) {
      return {
        invoice: null,
        error:
          "Payments aren't fully set up yet. Contact support to finish commerce setup.",
      };
    }
    if (inserted.error && isUniqueViolation(inserted.error)) {
      const afterRace = canonicalInvoiceRow(
        await loadInvoicesForAppointment(input.businessId, input.appointmentId),
      );
      if (afterRace) {
        const invoice = await getInvoiceById(
          input.businessId,
          String(afterRace.id),
        );
        return { invoice };
      }
      invoiceNumber = null;
      continue;
    }
    break;
  }

  if (invErr || !inv) {
    return { invoice: null, error: invErr?.message ?? "Could not create invoice." };
  }

  const createdNumber = String(inv.invoice_number ?? invoiceNumber);

  const afterInsert = canonicalInvoiceRow(
    await loadInvoicesForAppointment(input.businessId, input.appointmentId),
  );
  if (afterInsert && String(afterInsert.id) !== String(inv.id)) {
    const invoice = await getInvoiceById(input.businessId, String(afterInsert.id));
    return { invoice };
  }

  await supabase.from("commerce_invoice_lines").insert({
    business_id: input.businessId,
    invoice_id: inv.id,
    sort_order: 0,
    description: serviceRow?.name ?? "Service",
    quantity: 1,
    unit_amount_cents: lineUnit || subtotal,
    tax_cents: taxCents,
    discount_cents: discountCents,
    total_cents: lineUnit || subtotal,
    service_id: appt.service_id,
  });

  if (!appt.invoice_number) {
    await supabase
      .from("appointments")
      .update({ invoice_number: createdNumber })
      .eq("id", input.appointmentId);
  }

  await writeCommerceAudit({
    businessId: input.businessId,
    actorId: input.actorId,
    action: "invoice.created",
    entityType: "commerce_invoice",
    entityId: String(inv.id),
    summary: `Invoice ${createdNumber} created for appointment`,
    afterState: { invoice_number: createdNumber, total_cents: total },
  });

  const invoice = await getInvoiceById(input.businessId, String(inv.id));

  const { createCommerceEvent, emitCommerceEvent } = await import(
    "@/lib/commerce/events"
  );
  await emitCommerceEvent(
    createCommerceEvent({
      type: "invoice.generated",
      businessId: input.businessId,
      customerId: String(appt.customer_id),
      appointmentId: input.appointmentId,
      entityId: String(inv.id),
      payload: {
        invoice_number: createdNumber,
        total_cents: total,
      },
    }),
  );

  return { invoice };
}

export async function getInvoiceById(
  businessId: string,
  invoiceId: string,
): Promise<CommerceInvoice | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("commerce_invoices")
    .select("*")
    .eq("id", invoiceId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) {
    if (!isSoftSchemaFallbackAllowed(error.message)) {
      logQueryError("commerce.invoice.get", error.message);
    }
    return null;
  }
  if (!data) return null;

  const { data: lines } = await supabase
    .from("commerce_invoice_lines")
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("sort_order");

  return mapInvoice(
    data as Record<string, unknown>,
    (lines ?? []).map((l) => mapInvoiceLine(l as Record<string, unknown>)),
  );
}

export async function listInvoices(input: {
  businessId: string;
  customerId?: string;
  status?: string;
  limit?: number;
}): Promise<CommerceInvoice[]> {
  const supabase = await createClient();
  let q = supabase
    .from("commerce_invoices")
    .select("*")
    .eq("business_id", input.businessId)
    .order("issue_date", { ascending: false })
    .limit(input.limit ?? 50);

  if (input.customerId) q = q.eq("customer_id", input.customerId);
  if (input.status) q = q.eq("status", input.status);

  const { data, error } = await q;
  if (error) {
    if (!isSoftSchemaFallbackAllowed(error.message)) {
      logQueryError("commerce.invoice.list", error.message);
    }
    return [];
  }

  return (data ?? []).map((row) =>
    mapInvoice(row as Record<string, unknown>, []),
  );
}

export function formatInvoiceText(invoice: CommerceInvoice): string {
  const biz = invoice.businessSnapshot as {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  const cust = invoice.customerSnapshot as {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  const currency = invoice.currency;
  const money = (cents: number) => formatMoneyCents(cents, currency);
  const statusLabels: Record<string, string> = {
    open: "Open",
    partial: "Partially paid",
    paid: "Paid",
    overdue: "Overdue",
    void: "Void",
    draft: "Draft",
  };
  const lines = [
    `Invoice ${invoice.invoiceNumber}`,
    `Status: ${statusLabels[invoice.status] ?? invoice.status}`,
    `Issued: ${invoice.issueDate}`,
    invoice.dueDate ? `Due: ${invoice.dueDate}` : null,
    "",
    `From: ${biz.name ?? "Business"}`,
    biz.email ? `Email: ${biz.email}` : null,
    biz.phone ? `Phone: ${biz.phone}` : null,
    "",
    `Bill to: ${cust.name ?? "Customer"}`,
    cust.email ? `Email: ${cust.email}` : null,
    cust.phone ? `Phone: ${cust.phone}` : null,
    "",
    "Services",
    ...invoice.lines.map(
      (l) => `  ${l.description} × ${l.quantity} — ${money(l.totalCents)}`,
    ),
    "",
    `Subtotal: ${money(invoice.subtotalCents)}`,
    `Tax: ${money(invoice.taxCents)}`,
    `Discount: ${money(invoice.discountCents)}`,
    `Total: ${money(invoice.totalCents)}`,
    `Paid: ${money(invoice.amountPaidCents)}`,
    `Refunded: ${money(invoice.amountRefundedCents)}`,
    `Net paid: ${money(Math.max(0, invoice.amountPaidCents - invoice.amountRefundedCents))}`,
    `Stored invoice balance: ${money(invoice.balanceCents)}`,
    "",
    `Thank you for visiting ${biz.name ?? "us"}. We look forward to seeing you again.`,
  ].filter(Boolean);

  return lines.join("\n");
}
