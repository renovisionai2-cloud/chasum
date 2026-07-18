import { writeCommerceAudit } from "@/lib/commerce/audit";
import { mapInvoice, mapInvoiceLine } from "@/lib/commerce/mappers";
import type { CommerceInvoice } from "@/lib/commerce/types";
import { logQueryError, isSoftSchemaFallbackAllowed } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";
import { addDays, format } from "date-fns";

async function nextInvoiceNumber(businessId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("commerce_invoice_sequences")
    .select("next_number, prefix")
    .eq("business_id", businessId)
    .maybeSingle();

  if (!existing) {
    const { error } = await supabase.from("commerce_invoice_sequences").insert({
      business_id: businessId,
      next_number: 2,
      prefix: "INV",
    });
    if (error) {
      if (isSoftSchemaFallbackAllowed(error.message)) return null;
      logQueryError("commerce.invoice.seq", error.message);
      return null;
    }
    return "INV-0001";
  }

  const n = Number(existing.next_number ?? 1);
  const prefix = String(existing.prefix ?? "INV");
  await supabase
    .from("commerce_invoice_sequences")
    .update({ next_number: n + 1, updated_at: new Date().toISOString() })
    .eq("business_id", businessId);

  return `${prefix}-${String(n).padStart(4, "0")}`;
}

export async function createInvoiceForAppointment(input: {
  businessId: string;
  appointmentId: string;
  actorId?: string | null;
  dueInDays?: number;
}): Promise<{ invoice: CommerceInvoice | null; error?: string }> {
  const supabase = await createClient();

  const { data: appt, error: apptErr } = await supabase
    .from("appointments")
    .select(
      "id, business_id, customer_id, service_id, price_cents, tax_cents, discount_cents, deposit_cents, invoice_number, payment_status, amount_paid_cents, services(name, price)",
    )
    .eq("id", input.appointmentId)
    .eq("business_id", input.businessId)
    .maybeSingle();

  if (apptErr || !appt) {
    return { invoice: null, error: apptErr?.message ?? "Appointment not found." };
  }

  // Prefer existing invoice for this appointment
  const { data: existing } = await supabase
    .from("commerce_invoices")
    .select("*")
    .eq("appointment_id", input.appointmentId)
    .eq("business_id", input.businessId)
    .maybeSingle();

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
      .select("name, email, phone")
      .eq("id", input.businessId)
      .maybeSingle(),
  ]);

  const priceCents =
    Number(appt.price_cents ?? 0) ||
    Math.round(Number(serviceRow?.price ?? 0) * 100);
  const taxCents = Number(appt.tax_cents ?? 0);
  const discountCents = Number(appt.discount_cents ?? 0);
  const subtotal = Math.max(0, priceCents - taxCents + discountCents);
  // Normalize: treat price_cents as service total before tax when tax separate
  const lineUnit = Math.max(0, priceCents - taxCents);
  const total = Math.max(0, priceCents);
  const amountPaid = Number(appt.amount_paid_cents ?? appt.deposit_cents ?? 0);
  const balance = Math.max(0, total - amountPaid);

  const invoiceNumber =
    (appt.invoice_number as string | null) ||
    (await nextInvoiceNumber(input.businessId));

  if (!invoiceNumber) {
    return {
      invoice: null,
      error:
        "Commerce schema not ready. Apply migration 028_commerce_platform.",
    };
  }

  const status =
    balance <= 0 ? "paid" : amountPaid > 0 ? "partial" : ("open" as const);
  const issueDate = format(new Date(), "yyyy-MM-dd");
  const dueDate = format(
    addDays(new Date(), input.dueInDays ?? 7),
    "yyyy-MM-dd",
  );

  const { data: inv, error: invErr } = await supabase
    .from("commerce_invoices")
    .insert({
      business_id: input.businessId,
      customer_id: appt.customer_id,
      appointment_id: input.appointmentId,
      invoice_number: invoiceNumber,
      status,
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

  if (invErr || !inv) {
    if (invErr && isSoftSchemaFallbackAllowed(invErr.message)) {
      return {
        invoice: null,
        error:
          "Commerce schema not ready. Apply migration 028_commerce_platform.",
      };
    }
    return { invoice: null, error: invErr?.message ?? "Could not create invoice." };
  }

  await supabase.from("commerce_invoice_lines").insert({
    business_id: input.businessId,
    invoice_id: inv.id,
    sort_order: 0,
    description: serviceRow?.name ?? "Service",
    quantity: 1,
    unit_amount_cents: lineUnit || total,
    tax_cents: taxCents,
    discount_cents: discountCents,
    total_cents: total,
    service_id: appt.service_id,
  });

  if (!appt.invoice_number) {
    await supabase
      .from("appointments")
      .update({ invoice_number: invoiceNumber })
      .eq("id", input.appointmentId);
  }

  await writeCommerceAudit({
    businessId: input.businessId,
    actorId: input.actorId,
    action: "invoice.created",
    entityType: "commerce_invoice",
    entityId: String(inv.id),
    summary: `Invoice ${invoiceNumber} created for appointment`,
    afterState: { invoice_number: invoiceNumber, total_cents: total },
  });

  const invoice = await getInvoiceById(input.businessId, String(inv.id));
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
  const biz = invoice.businessSnapshot;
  const cust = invoice.customerSnapshot;
  const lines = [
    `INVOICE ${invoice.invoiceNumber}`,
    `Status: ${invoice.status}`,
    `Issue: ${invoice.issueDate}`,
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
      (l) =>
        `  ${l.description} × ${l.quantity} — $${(l.totalCents / 100).toFixed(2)}`,
    ),
    "",
    `Subtotal: $${(invoice.subtotalCents / 100).toFixed(2)}`,
    `Tax: $${(invoice.taxCents / 100).toFixed(2)}`,
    `Discount: $${(invoice.discountCents / 100).toFixed(2)}`,
    `Total: $${(invoice.totalCents / 100).toFixed(2)}`,
    `Paid: $${(invoice.amountPaidCents / 100).toFixed(2)}`,
    `Balance: $${(invoice.balanceCents / 100).toFixed(2)}`,
  ].filter(Boolean);

  return lines.join("\n");
}
