"use server";

import { addDays, parseISO } from "date-fns";
import { getOrCreateBusiness } from "@/lib/actions/business";
import {
  getActiveLocationId,
  getLocationScope,
} from "@/lib/actions/location";
import {
  cancelBooking,
  createBooking,
  explainConflicts,
  queryAppointmentsInRange,
  rescheduleBooking,
  resizeBooking,
  updateBooking,
  type MutationResult,
} from "@/lib/booking-engine";
import {
  endOfBusinessDay,
  startOfBusinessMonth,
  startOfBusinessWeek,
} from "@/lib/business/datetime";
import { businessDayBounds } from "@/lib/dashboard/appointments-today";
import { CALENDAR_MUTATION_REVALIDATE_PATHS } from "@/lib/reports/revalidate-paths";
import { createClient } from "@/lib/supabase/server";
import type { ActionState, AppointmentStatus } from "@/lib/types/booking";
import { revalidatePath } from "next/cache";
import { enqueueWaitlistNotification } from "@/lib/integrations/automation/waitlist";

function parseAppointmentStart(formData: FormData): Date | null {
  const startTime = formData.get("start_time") as string | null;
  if (startTime) return parseISO(startTime);

  const date = formData.get("date") as string;
  const time = formData.get("time") as string;
  if (date && time) return parseISO(`${date}T${time}`);

  return null;
}

function mutationToAction(
  result: MutationResult,
  successMessage: string,
): ActionState {
  if (result.phase === "success") {
    return {
      success: successMessage,
      appointmentId: result.data?.appointmentId,
    };
  }
  return {
    error:
      explainConflicts(result.conflicts) ??
      result.error ??
      result.conflicts?.[0]?.message ??
      "Booking could not be completed.",
  };
}

function revalidateCalendar() {
  for (const path of CALENDAR_MUTATION_REVALIDATE_PATHS) {
    revalidatePath(path);
  }
}

export async function getAppointments(start: string, end: string) {
  const business = await getOrCreateBusiness();
  const scope = await getLocationScope();
  return queryAppointmentsInRange({
    businessId: business.id,
    startIso: start,
    endIso: end,
    scope,
  });
}

export async function getDashboardStats() {
  const business = await getOrCreateBusiness();
  const scope = await getLocationScope();
  const supabase = await createClient();

  const now = new Date();
  const locale = {
    timezone: business.timezone,
    currency: business.currency,
  };
  const { dayStart: todayStart, dayEnd: todayEnd } = businessDayBounds(
    now,
    locale,
  );

  const weekStart = startOfBusinessWeek(now, locale);
  const weekEnd = endOfBusinessDay(addDays(weekStart, 6), locale);

  const monthStart = startOfBusinessMonth(now, locale);
  const nextMonthStart = startOfBusinessMonth(addDays(monthStart, 35), locale);
  const monthEnd = new Date(nextMonthStart.getTime() - 1);

  function appointmentFilter() {
    return scope.mode === "single"
      ? { business_id: business.id, location_id: scope.locationId }
      : { business_id: business.id };
  }

  const apptFilter = appointmentFilter();

  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const yesterdayEnd = new Date(todayEnd);
  yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);

  const lastWeekSameDayStart = new Date(todayStart);
  lastWeekSameDayStart.setDate(lastWeekSameDayStart.getDate() - 7);
  const lastWeekSameDayEnd = new Date(todayEnd);
  lastWeekSameDayEnd.setDate(lastWeekSameDayEnd.getDate() - 7);

  const previousWeekStart = new Date(weekStart);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);
  const previousWeekEnd = new Date(weekStart);
  previousWeekEnd.setMilliseconds(-1);

  const previousMonthStart = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1,
  );
  const previousMonthEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    0,
    23,
    59,
    59,
  );

  const [
    todayRes,
    weekRes,
    customersRes,
    upcomingRes,
    todayApptsRes,
    newCustomersRes,
    revenueRes,
    weekSeriesRes,
    yesterdayRes,
    lastWeekSameDayRes,
    previousWeekRes,
    previousMonthRevenueRes,
    pendingRes,
    todayCompletedRevenueRes,
    recentCustomersRes,
    recentBookingsRes,
    businessAlertsRes,
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .match(apptFilter)
      .neq("status", "cancelled")
      .neq("status", "no_show")
      .gte("start_time", todayStart.toISOString())
      .lte("start_time", todayEnd.toISOString()),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .match(apptFilter)
      .neq("status", "cancelled")
      .neq("status", "no_show")
      .gte("start_time", weekStart.toISOString())
      .lte("start_time", weekEnd.toISOString()),
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id),
    supabase
      .from("appointments")
      .select(`*, service:services(name), customer:customers(name), location:locations(name)`)
      .match(apptFilter)
      .neq("status", "cancelled")
      .gte("start_time", now.toISOString())
      .order("start_time")
      .limit(5),
    supabase
      .from("appointments")
      .select(`*, service:services(name, color, price), customer:customers(name), staff:staff(name), location:locations(name)`)
      .match(apptFilter)
      .neq("status", "cancelled")
      .gte("start_time", todayStart.toISOString())
      .lte("start_time", todayEnd.toISOString())
      .order("start_time"),
    supabase
      .from("customers")
      .select("id, name, email, created_at")
      .eq("business_id", business.id)
      .gte("created_at", monthStart.toISOString())
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("appointments")
      .select(
        "status, price_cents, amount_paid_cents, deposit_cents, payment_status, service:services(price)",
      )
      .match(apptFilter)
      .neq("status", "cancelled")
      .neq("status", "no_show")
      .gte("start_time", monthStart.toISOString())
      .lte("start_time", monthEnd.toISOString()),
    supabase
      .from("appointments")
      .select("start_time")
      .match(apptFilter)
      .neq("status", "cancelled")
      .gte("start_time", weekStart.toISOString())
      .lte("start_time", weekEnd.toISOString()),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .match(apptFilter)
      .neq("status", "cancelled")
      .gte("start_time", yesterdayStart.toISOString())
      .lte("start_time", yesterdayEnd.toISOString()),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .match(apptFilter)
      .neq("status", "cancelled")
      .gte("start_time", lastWeekSameDayStart.toISOString())
      .lte("start_time", lastWeekSameDayEnd.toISOString()),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .match(apptFilter)
      .neq("status", "cancelled")
      .gte("start_time", previousWeekStart.toISOString())
      .lte("start_time", previousWeekEnd.toISOString()),
    supabase
      .from("appointments")
      .select(
        "status, price_cents, amount_paid_cents, deposit_cents, payment_status, service:services(price)",
      )
      .match(apptFilter)
      .neq("status", "cancelled")
      .neq("status", "no_show")
      .gte("start_time", previousMonthStart.toISOString())
      .lte("start_time", previousMonthEnd.toISOString()),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .match(apptFilter)
      .eq("status", "pending")
      .gte("start_time", now.toISOString()),
    supabase
      .from("appointments")
      .select(
        "status, price_cents, amount_paid_cents, deposit_cents, payment_status, service:services(price)",
      )
      .match(apptFilter)
      .neq("status", "cancelled")
      .neq("status", "no_show")
      .gte("start_time", todayStart.toISOString())
      .lte("start_time", todayEnd.toISOString()),
    supabase
      .from("customers")
      .select("id, name, email, created_at")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("appointments")
      .select(
        `id, start_time, status, created_at, service:services(name), customer:customers(name), location:locations(name)`,
      )
      .match(apptFilter)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("notifications")
      .select("id, title, body, created_at, read_at")
      .eq("business_id", business.id)
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const monthCustomersRes = await supabase
    .from("customers")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id)
    .gte("created_at", monthStart.toISOString());

  type RevenueApptRow = {
    status?: string | null;
    price_cents?: number | null;
    amount_paid_cents?: number | null;
    deposit_cents?: number | null;
    payment_status?: string | null;
    service: { price?: number } | null;
  };

  const { sumRecognizedRevenueDollars } = await import(
    "@/lib/commerce/recognize"
  );

  const revenue = sumRecognizedRevenueDollars(
    (revenueRes.data as RevenueApptRow[] | null) ?? [],
  );
  const previousMonthRevenue = sumRecognizedRevenueDollars(
    (previousMonthRevenueRes.data as RevenueApptRow[] | null) ?? [],
  );
  const todayRevenue = sumRecognizedRevenueDollars(
    (todayCompletedRevenueRes.data as RevenueApptRow[] | null) ?? [],
  );

  const weekDayCounts = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    const y = day.getFullYear();
    const m = String(day.getMonth() + 1).padStart(2, "0");
    const d = String(day.getDate()).padStart(2, "0");
    const key = `${y}-${m}-${d}`;
    const count = (weekSeriesRes.data ?? []).filter((a) => {
      const start = new Date(a.start_time);
      const ay = start.getFullYear();
      const am = String(start.getMonth() + 1).padStart(2, "0");
      const ad = String(start.getDate()).padStart(2, "0");
      return `${ay}-${am}-${ad}` === key;
    }).length;
    return {
      label: day.toLocaleDateString("en-US", { weekday: "short" }),
      value: count,
    };
  });

  return {
    todayCount: todayRes.count ?? 0,
    yesterdayCount: yesterdayRes.count ?? 0,
    lastWeekSameDayCount: lastWeekSameDayRes.count ?? 0,
    weekCount: weekRes.count ?? 0,
    previousWeekCount: previousWeekRes.count ?? 0,
    customerCount: customersRes.count ?? 0,
    newCustomersThisMonth: monthCustomersRes.count ?? 0,
    upcoming: upcomingRes.data ?? [],
    todayAppointments: todayApptsRes.data ?? [],
    newCustomers: newCustomersRes.data ?? [],
    recentCustomers: recentCustomersRes.data ?? [],
    recentBookings: recentBookingsRes.data ?? [],
    businessAlerts: businessAlertsRes.data ?? [],
    monthlyRevenue: revenue,
    previousMonthRevenue,
    todayRevenue,
    pendingConfirmations: pendingRes.count ?? 0,
    weekDayCounts,
  };
}

export async function createAppointment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();

  const serviceId = formData.get("service_id") as string;
  const staffId = formData.get("staff_id") as string;
  const customerId = formData.get("customer_id") as string;
  const notes = (formData.get("notes") as string) || null;
  const status =
    (formData.get("status") as AppointmentStatus) || "pending";
  const locationFromForm = (formData.get("location_id") as string) || null;
  const locationId = locationFromForm || (await getActiveLocationId());
  const durationOverride = Number(formData.get("duration_minutes"));

  const packageId = String(formData.get("package_id") ?? "").trim() || null;
  const packageName = String(formData.get("package_name") ?? "").trim() || null;
  const priceCentsRaw = Number(formData.get("price_cents"));
  const priceCents =
    Number.isFinite(priceCentsRaw) && priceCentsRaw > 0 ? priceCentsRaw : undefined;
  const taxCentsRaw = Number(formData.get("tax_cents"));
  const taxCents =
    Number.isFinite(taxCentsRaw) && taxCentsRaw >= 0
      ? Math.round(taxCentsRaw)
      : undefined;
  const depositCentsRaw = Number(formData.get("deposit_cents"));
  const depositCents =
    Number.isFinite(depositCentsRaw) && depositCentsRaw >= 0
      ? Math.round(depositCentsRaw)
      : undefined;

  const paymentMode = String(formData.get("payment_mode") ?? "none").trim();
  const paymentAmountRaw = Number(formData.get("payment_amount_cents"));
  const paymentAmountCents =
    Number.isFinite(paymentAmountRaw) && paymentAmountRaw > 0
      ? Math.round(paymentAmountRaw)
      : 0;
  const paymentMethodRaw = String(formData.get("payment_method") ?? "cash");
  const paymentNote = String(formData.get("payment_note") ?? "").trim() || null;
  const paymentSendReceipt =
    String(formData.get("payment_send_receipt") ?? "") === "1";
  const paymentIdempotencyKey =
    String(formData.get("payment_idempotency_key") ?? "").trim() || null;

  if (!serviceId || !customerId) {
    return { error: "Customer and service are required." };
  }

  const startTime = parseAppointmentStart(formData);
  if (!startTime) {
    return { error: "Select an available time slot." };
  }

  const resolvedStaffId = staffId?.trim() ? staffId : null;
  const { assertNamedStaffRequired } = await import(
    "@/lib/booking/optional-staff"
  );
  const staffGate = assertNamedStaffRequired(resolvedStaffId, "reception");
  if (staffGate) {
    return { error: staffGate };
  }

  const result = await createBooking({
    channel: "staff",
    businessId: business.id,
    locationId,
    serviceId,
    staffId: resolvedStaffId,
    customerId,
    requestedStart: startTime.toISOString(),
    notes,
    requestedStatus: status,
    durationMinutes:
      Number.isFinite(durationOverride) && durationOverride > 0
        ? durationOverride
        : undefined,
    priceCents,
    taxCents,
    depositCents,
    packageId: packageId ?? undefined,
    packageName: packageName ?? undefined,
  });

  const action = mutationToAction(result, "Booked — you're all set.");
  if (result.phase === "success" && result.data?.appointmentId) {
    const appointmentId = result.data.appointmentId;
    action.appointmentId = appointmentId;

    // Record optional payment after appointment succeeds (never duplicate appointment).
    if (paymentMode !== "none" && paymentAmountCents > 0) {
      try {
        const { recordCommercePayment, listTransactions, parsePaymentMethod } =
          await import("@/lib/commerce");
        const { normalizeCurrency, formatMoneyCents } = await import("@/lib/commerce/money");
        const { paymentKindForAmount } = await import(
          "@/lib/commerce/booking-financials"
        );
        const { PAYMENT_METHOD_LABELS } = await import("@/lib/commerce/types");
        const { logAppointmentChange } = await import(
          "@/lib/booking-engine/conflicts"
        );
        const existing = await listTransactions({
          businessId: business.id,
          appointmentId,
          limit: 20,
        });
        const alreadyRecorded = existing.some(
          (tx) =>
            tx.status === "succeeded" &&
            tx.amountCents === paymentAmountCents &&
            (paymentIdempotencyKey
              ? tx.description?.includes(paymentIdempotencyKey)
              : true),
        );
        const appointmentTotalForKind =
          (priceCents ?? 0) + (taxCents ?? 0) || paymentAmountCents;
        const method = parsePaymentMethod(paymentMethodRaw);
        const methodLabel = PAYMENT_METHOD_LABELS[method] ?? method;

        if (alreadyRecorded) {
          action.payment = {
            status: "recorded",
            amountCents: paymentAmountCents,
            detail: "Payment already recorded.",
            transactionId: existing[0]?.id ?? null,
            receiptStatus: paymentSendReceipt
              ? "skipped"
              : "not_requested",
          };
        } else {
          const kind = paymentKindForAmount(
            paymentAmountCents,
            depositCents ?? 0,
            appointmentTotalForKind,
          );
          const payResult = await recordCommercePayment({
            businessId: business.id,
            customerId,
            appointmentId,
            amountCents: paymentAmountCents,
            method,
            kind,
            currency: normalizeCurrency(business.currency),
            description: [
              paymentNote,
              paymentIdempotencyKey
                ? `booking:${paymentIdempotencyKey}`
                : null,
            ]
              .filter(Boolean)
              .join(" · ") || null,
            ensureInvoice: true,
            forceManual: true,
            sendReceiptEmail: false,
          });
          if (payResult.ok) {
            action.payment = {
              status: "recorded",
              amountCents: paymentAmountCents,
              transactionId: payResult.transaction?.id ?? null,
              detail: `Recorded ${kind === "deposit" ? "deposit" : "payment"}.`,
              receiptStatus: paymentSendReceipt
                ? "not_applicable"
                : "not_requested",
            };

            // Use allowed change-log action `update` (CHECK constraint has no
            // payment.recorded). Marker `type` keeps financial events queryable
            // without a schema migration.
            await logAppointmentChange({
              businessId: business.id,
              appointmentId,
              action: "update",
              afterState: {
                type: "payment.recorded",
                amountCents: paymentAmountCents,
                method,
                methodLabel,
                kind,
                transactionId: payResult.transaction?.id ?? null,
                source: "booking_confirm",
                summary: `Deposit recorded — ${formatMoneyCents(paymentAmountCents, business.currency)} by ${methodLabel}`,
              },
            });

            if (paymentSendReceipt && payResult.transaction?.id) {
              try {
                const {
                  createReceiptForTransaction,
                  sendPaymentReceiptNow,
                } = await import("@/lib/commerce/receipts");
                const receipt = await createReceiptForTransaction({
                  businessId: business.id,
                  transactionId: payResult.transaction.id,
                  actorId: null,
                });
                if (receipt?.id) {
                  // Financials/service name come from receipt → transaction →
                  // appointment — never from stale form/catalog state.
                  const receiptResult = await sendPaymentReceiptNow({
                    businessId: business.id,
                    receiptId: receipt.id,
                    appointmentId,
                    idempotencyKey: paymentIdempotencyKey,
                  });
                  action.payment.receiptStatus = receiptResult.ok
                    ? "sent"
                    : "failed";
                  action.payment.receiptDetail = receiptResult.ok
                    ? receiptResult.skipped
                      ? "Receipt already sent."
                      : "Receipt email sent."
                    : receiptResult.error ?? "Receipt email failed.";
                } else {
                  action.payment.receiptStatus = "failed";
                  action.payment.receiptDetail =
                    "Receipt record could not be created.";
                }
              } catch (receiptErr) {
                console.error(
                  "[booking] receipt after payment failed",
                  receiptErr,
                );
                action.payment.receiptStatus = "failed";
                action.payment.receiptDetail =
                  receiptErr instanceof Error
                    ? receiptErr.message
                    : "Receipt email failed.";
              }
            }
          } else {
            action.payment = {
              status: "failed",
              amountCents: paymentAmountCents,
              detail: payResult.error ?? "Payment was not recorded.",
              canRetry: true,
              receiptStatus: "not_applicable",
            };
            action.success =
              "Appointment confirmed — payment could not be recorded. Use Collect payment to retry.";
          }
        }
      } catch (payErr) {
        console.error("[booking] payment after create failed", payErr);
        action.payment = {
          status: "failed",
          amountCents: paymentAmountCents,
          detail:
            payErr instanceof Error
              ? payErr.message
              : "Payment was not recorded.",
          canRetry: true,
          receiptStatus: "not_applicable",
        };
        action.success =
          "Appointment confirmed — payment could not be recorded. Use Collect payment to retry.";
      }
    } else {
      action.payment = {
        status: "skipped",
        receiptStatus: "not_applicable",
      };
    }

    try {
      const { deliverBookingNotifications } = await import(
        "@/lib/notifications/booking-delivery"
      );
      const report = await deliverBookingNotifications(appointmentId);
      action.notifications = report.items;
    } catch (err) {
      // Booking stays confirmed — notification failure is partial success.
      console.error("[notifications] flush after create failed", err);
      action.notifications = [
        {
          channel: "customer_email",
          status: "failed",
          label: "Customer email",
          detail:
            err instanceof Error
              ? err.message
              : "Email could not be sent.",
          canRetry: true,
        },
        {
          channel: "business_email",
          status: "failed",
          label: "Business email",
          detail: "Email could not be sent.",
          canRetry: true,
        },
      ];
    }

    // Surface payment receipt as its own success-panel channel.
    const receiptStatus = action.payment?.receiptStatus ?? "not_applicable";
    action.notifications = [
      ...(action.notifications ?? []),
      {
        channel: "payment_receipt",
        status:
          receiptStatus === "sent"
            ? "sent"
            : receiptStatus === "failed"
              ? "failed"
              : receiptStatus === "not_requested"
                ? "not_requested"
                : "not_applicable",
        label: "Payment receipt",
        detail: action.payment?.receiptDetail ?? null,
        canRetry: receiptStatus === "failed",
      },
    ];

    revalidateCalendar();
  }
  return action;
}

export async function updateAppointment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const id = formData.get("id") as string;

  const serviceId = formData.get("service_id") as string;
  const staffId = formData.get("staff_id") as string;
  const customerId = formData.get("customer_id") as string;
  const status = formData.get("status") as AppointmentStatus;
  const notes = (formData.get("notes") as string) || null;
  const locationFromForm = (formData.get("location_id") as string) || null;
  const durationOverride = Number(formData.get("duration_minutes"));

  if (!serviceId || !customerId) {
    return { error: "Customer and service are required." };
  }

  const startTime = parseAppointmentStart(formData);
  if (!startTime) {
    return { error: "Select an available time slot." };
  }

  const { data: existing } = await supabase
    .from("appointments")
    .select("location_id")
    .eq("id", id)
    .eq("business_id", business.id)
    .maybeSingle();

  if (!existing) return { error: "Appointment not found." };

  const locationId = locationFromForm || existing.location_id;

  const result = await updateBooking({
    channel: "staff",
    appointmentId: id,
    businessId: business.id,
    locationId,
    serviceId,
    staffId: staffId?.trim() ? staffId : null,
    customerId,
    requestedStart: startTime.toISOString(),
    notes,
    requestedStatus: status,
    durationMinutes:
      Number.isFinite(durationOverride) && durationOverride > 0
        ? durationOverride
        : undefined,
    excludeAppointmentId: id,
  });

  const action = mutationToAction(result, "Changes saved.");
  if (result.phase === "success") {
    revalidateCalendar();
  }
  return action;
}

export async function cancelAppointment(id: string): Promise<ActionState> {
  const business = await getOrCreateBusiness();

  const result = await cancelBooking({
    channel: "staff",
    businessId: business.id,
    appointmentId: id,
  });

  const action = mutationToAction(result, "Appointment cancelled.");
  if (result.phase === "success") {
    await enqueueWaitlistNotification(business.id, id);
    try {
      const {
        deliverCancellationNotifications,
        cancellationCustomerEmailNote,
      } = await import("@/lib/notifications/booking-delivery");
      const report = await deliverCancellationNotifications(id);
      action.notifications = report.items;
      action.success = `${action.success ?? "Appointment cancelled."}${cancellationCustomerEmailNote(report)}`;
    } catch (err) {
      console.error("[notifications] cancellation email failed", err);
      action.success = `${action.success ?? "Appointment cancelled."} Customer email could not be sent.`;
    }
    revalidateCalendar();
  }
  return action;
}

export async function rescheduleAppointment(
  id: string,
  newStartTime: string,
  options?: { staffId?: string; locationId?: string },
): Promise<ActionState> {
  const business = await getOrCreateBusiness();

  const result = await rescheduleBooking({
    channel: "staff",
    businessId: business.id,
    appointmentId: id,
    requestedStart: newStartTime,
    staffId: options?.staffId,
    locationId: options?.locationId,
  });

  const action = mutationToAction(result, "Rescheduled.");
  if (result.phase === "success") {
    revalidateCalendar();
  }
  return action;
}

/** Quick status transitions for Day View Control Center (check-in / complete / no-show). */
export async function setAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("appointments")
    .select(
      "id, location_id, service_id, staff_id, customer_id, start_time, end_time, notes, status",
    )
    .eq("id", id)
    .eq("business_id", business.id)
    .maybeSingle();

  if (!existing) return { error: "Appointment not found." };

  const result = await updateBooking({
    channel: "staff",
    appointmentId: id,
    businessId: business.id,
    locationId: existing.location_id as string,
    serviceId: existing.service_id as string,
    staffId: existing.staff_id as string,
    customerId: existing.customer_id as string,
    requestedStart: existing.start_time as string,
    requestedEnd: existing.end_time as string,
    notes: (existing.notes as string | null) ?? null,
    requestedStatus: status,
    excludeAppointmentId: id,
  });

  const action = mutationToAction(result, "Changes saved.");
  if (result.phase === "success") {
    revalidateCalendar();
  }
  return action;
}

/** Change appointment end time while keeping start — validated by booking engine. */
export async function resizeAppointment(
  id: string,
  newEndTime: string,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();

  const result = await resizeBooking({
    channel: "staff",
    businessId: business.id,
    appointmentId: id,
    requestedEnd: newEndTime,
  });

  const action = mutationToAction(result, "Duration updated.");
  if (result.phase === "success") {
    revalidateCalendar();
  }
  return action;
}

export async function getPublicAppointments(
  businessId: string,
  start: string,
  end: string,
) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_public_appointments", {
    p_business_id: businessId,
    p_start: start,
    p_end: end,
  });

  if (error) throw new Error(error.message);
  return data ?? [];
}
