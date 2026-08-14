/**
 * Phase 6.1 — bounded front-desk appointment loaders.
 * Uses existing appointments + money-contract stamps. No RPC / schema.
 */

import {
  formatFrontDeskWhen,
  mapFrontDeskAppointment,
  sortFrontDeskAppointments,
} from "@/lib/commerce/front-desk";
import type { FrontDeskAppointmentOption } from "@/lib/commerce/front-desk";
import { unwrapRelation } from "@/lib/supabase/relations";
import { createClient } from "@/lib/supabase/server";

const APPT_SELECT = `
  id, customer_id, start_time, status, payment_status, notes,
  price_cents, tax_cents, deposit_cents, amount_paid_cents, amount_refunded_cents,
  services(name, price, deposit_cents, deposit_required),
  customer:customers(id, name, email, phone),
  staff:staff(name),
  location:locations(name)
`;

type ApptRow = Record<string, unknown>;

function mapRow(
  row: ApptRow,
  timeZone: string,
): FrontDeskAppointmentOption | null {
  const customer = unwrapRelation(row.customer) as {
    id?: string;
    name?: string | null;
    email?: string | null;
  } | null;
  const service = unwrapRelation(row.services) as { name?: string } | null;
  const staff = unwrapRelation(row.staff) as { name?: string } | null;
  const location = unwrapRelation(row.location) as { name?: string } | null;
  const customerId = String(row.customer_id ?? customer?.id ?? "");
  if (!customerId) return null;
  return mapFrontDeskAppointment({
    id: String(row.id),
    customerId,
    customerName: customer?.name?.trim() || "Customer",
    customerEmail: customer?.email ?? null,
    serviceName: service?.name?.trim() || "Appointment",
    startTime: String(row.start_time ?? ""),
    timeZone,
    locationName: location?.name ?? null,
    staffName: staff?.name ?? null,
    appointmentStatus: String(row.status ?? ""),
    stamps: {
      price_cents: Number(row.price_cents ?? 0),
      tax_cents: Number(row.tax_cents ?? 0),
      deposit_cents: Number(row.deposit_cents ?? 0),
      amount_paid_cents: Number(row.amount_paid_cents ?? 0),
      amount_refunded_cents: Number(row.amount_refunded_cents ?? 0),
      payment_status: String(row.payment_status ?? ""),
      status: String(row.status ?? ""),
      services: row.services,
    },
  });
}

export async function listFrontDeskAppointmentsForCustomer(input: {
  businessId: string;
  customerId: string;
  timeZone: string;
  includeAppointmentId?: string | null;
}): Promise<FrontDeskAppointmentOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(APPT_SELECT)
    .eq("business_id", input.businessId)
    .eq("customer_id", input.customerId)
    .neq("status", "cancelled")
    .order("start_time", { ascending: false })
    .limit(40);

  if (error || !data) return [];
  const mapped = data
    .map((row) => mapRow(row as ApptRow, input.timeZone))
    .filter((row): row is FrontDeskAppointmentOption => Boolean(row));

  const collectible = mapped.filter(
    (row) => row.remainingCents > 0 || row.depositDueNowCents > 0,
  );
  const includeId = input.includeAppointmentId?.trim();
  if (includeId && !collectible.some((row) => row.id === includeId)) {
    const extra = mapped.find((row) => row.id === includeId);
    if (extra) collectible.push(extra);
  }
  return sortFrontDeskAppointments(collectible);
}

export async function getFrontDeskAppointmentContext(input: {
  businessId: string;
  appointmentId: string;
  timeZone: string;
}): Promise<FrontDeskAppointmentOption | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(APPT_SELECT)
    .eq("business_id", input.businessId)
    .eq("id", input.appointmentId)
    .maybeSingle();
  if (error || !data) return null;
  return mapRow(data as ApptRow, input.timeZone);
}

export async function listOutstandingAppointmentBalances(input: {
  businessId: string;
  timeZone: string;
}): Promise<FrontDeskAppointmentOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(APPT_SELECT)
    .eq("business_id", input.businessId)
    .neq("status", "cancelled")
    .in("payment_status", [
      "unpaid",
      "deposit_required",
      "deposit_paid",
      "partially_paid",
    ])
    .order("start_time", { ascending: true })
    .limit(80);

  if (error || !data) return [];
  return sortFrontDeskAppointments(
    data
      .map((row) => mapRow(row as ApptRow, input.timeZone))
      .filter((row): row is FrontDeskAppointmentOption =>
        Boolean(row && row.remainingCents > 0),
      ),
  ).slice(0, 40);
}

export async function listOutstandingDeposits(input: {
  businessId: string;
  timeZone: string;
}): Promise<FrontDeskAppointmentOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(APPT_SELECT)
    .eq("business_id", input.businessId)
    .neq("status", "cancelled")
    .in("payment_status", ["unpaid", "deposit_required", "deposit_paid"])
    .order("start_time", { ascending: true })
    .limit(80);

  if (error || !data) return [];
  return sortFrontDeskAppointments(
    data
      .map((row) => mapRow(row as ApptRow, input.timeZone))
      .filter((row): row is FrontDeskAppointmentOption =>
        Boolean(row && row.depositDueNowCents > 0),
      ),
  ).slice(0, 40);
}

export async function listAppointmentLabels(input: {
  businessId: string;
  appointmentIds: string[];
  timeZone: string;
}): Promise<Map<string, string>> {
  const ids = [...new Set(input.appointmentIds.filter(Boolean))].slice(0, 40);
  const map = new Map<string, string>();
  if (ids.length === 0) return map;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(
      "id, start_time, services(name)",
    )
    .eq("business_id", input.businessId)
    .in("id", ids);
  if (error || !data) return map;
  for (const row of data) {
    const service = unwrapRelation(
      (row as { services?: unknown }).services,
    ) as { name?: string } | null;
    const when = formatFrontDeskWhen(
      String((row as { start_time?: string }).start_time ?? ""),
      input.timeZone,
    );
    map.set(
      String(row.id),
      `${service?.name?.trim() || "Appointment"}${when ? ` · ${when}` : ""}`,
    );
  }
  return map;
}
