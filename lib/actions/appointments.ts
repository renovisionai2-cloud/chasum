"use server";

import { parseISO } from "date-fns";
import { getOrCreateBusiness } from "@/lib/actions/business";
import {
  getActiveLocationId,
  getLocationScope,
} from "@/lib/actions/location";
import {
  cancelBooking,
  createBooking,
  queryAppointmentsInRange,
  rescheduleBooking,
  resizeBooking,
  updateBooking,
  type MutationResult,
} from "@/lib/booking-engine";
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
    return { success: successMessage };
  }
  return {
    error:
      result.error ??
      result.conflicts?.[0]?.message ??
      "Booking could not be completed.",
  };
}

function revalidateCalendar() {
  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clients");
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
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

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
      .gte("start_time", todayStart.toISOString())
      .lte("start_time", todayEnd.toISOString()),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .match(apptFilter)
      .neq("status", "cancelled")
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

  if (!serviceId || !staffId || !customerId) {
    return { error: "All required fields must be filled." };
  }

  const startTime = parseAppointmentStart(formData);
  if (!startTime) {
    return { error: "Select an available time slot." };
  }

  const result = await createBooking({
    channel: "staff",
    businessId: business.id,
    locationId,
    serviceId,
    staffId,
    customerId,
    requestedStart: startTime.toISOString(),
    notes,
    requestedStatus: status,
    durationMinutes:
      Number.isFinite(durationOverride) && durationOverride > 0
        ? durationOverride
        : undefined,
    priceCents,
    packageId: packageId ?? undefined,
    packageName: packageName ?? undefined,
  });

  const action = mutationToAction(result, "Booked — you're all set.");
  if (result.phase === "success" && result.data?.appointmentId) {
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
    staffId,
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
