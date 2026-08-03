"use server";

import {
  mapTransactionsToFinancialActivity,
  type AppointmentFinancialActivity,
} from "@/lib/commerce/appointment-financial-activity";
import { listTransactions } from "@/lib/commerce/payments";
import { getOrCreateBusiness } from "@/lib/actions/business";
import { createClient } from "@/lib/supabase/server";

/**
 * Load appointment financial activity for drawer/timeline surfaces.
 * Uses commerce_transactions (authoritative) and enriches from change-log
 * payment markers when present. No schema migration required.
 */
export async function loadAppointmentFinancialActivity(
  appointmentId: string,
): Promise<AppointmentFinancialActivity | null> {
  const id = appointmentId.trim();
  if (!id) return null;

  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { data: appt } = await supabase
    .from("appointments")
    .select("id, price_cents, tax_cents")
    .eq("id", id)
    .eq("business_id", business.id)
    .maybeSingle();

  if (!appt) return null;

  const appointmentTotalCents =
    Math.max(0, Number(appt.price_cents ?? 0)) +
    Math.max(0, Number(appt.tax_cents ?? 0));

  const [transactions, changeLog] = await Promise.all([
    listTransactions({
      businessId: business.id,
      appointmentId: id,
      limit: 40,
    }),
    supabase
      .from("appointment_change_log")
      .select("id, action, after_state, created_at")
      .eq("business_id", business.id)
      .eq("appointment_id", id)
      .order("created_at", { ascending: false })
      .limit(40),
  ]);

  const changeLogByTransactionId: Record<
    string,
    { source?: string | null; summary?: string | null }
  > = {};

  for (const row of changeLog.data ?? []) {
    const after = (row.after_state ?? {}) as Record<string, unknown>;
    const isPayment =
      after.type === "payment.recorded" ||
      typeof after.transactionId === "string" ||
      typeof after.amountCents === "number";
    if (!isPayment) continue;
    const txId =
      typeof after.transactionId === "string" ? after.transactionId : null;
    if (!txId) continue;
    changeLogByTransactionId[txId] = {
      source: typeof after.source === "string" ? after.source : null,
      summary: typeof after.summary === "string" ? after.summary : null,
    };
  }

  return mapTransactionsToFinancialActivity({
    appointmentId: id,
    timezone: business.timezone || "America/Toronto",
    transactions,
    appointmentTotalCents,
    changeLogByTransactionId,
  });
}
