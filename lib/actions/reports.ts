"use server";

import { getOrCreateBusiness } from "@/lib/actions/business";
import { getLocationScope } from "@/lib/actions/location";
import { normalizeCurrency } from "@/lib/commerce/money";
import { withLocationFilter } from "@/lib/location/constants";
import {
  buildAppointmentReport,
  buildCustomerReport,
  buildEmployeeReports,
  buildExecutive,
  buildFinancial,
  buildInventoryPlaceholder,
  buildLocationReports,
  buildRevenueBreakdown,
  buildServiceReport,
  buildSnapshot,
  rowsToCsv,
  type ReportAppointmentRow,
  type ReportCustomerRow,
  type ReportPaymentRow,
} from "@/lib/reports/compute";
import type {
  ReportCadence,
  ReportExportFormat,
  ReportSchedule,
  ReportType,
  ReportsBundle,
  BusinessIntelligenceSnapshot,
} from "@/lib/reports/types";
import { logQueryError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types/booking";
import { revalidatePath } from "next/cache";

function revalidateReports() {
  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard");
}

async function listSchedules(businessId: string): Promise<ReportSchedule[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("report_schedules")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (error) {
    logQueryError("report-schedules", error.message);
    return [];
  }
  return (data as ReportSchedule[]) ?? [];
}

/** Full BI bundle for Dashboard → Reports (location-scoped). */
export async function getReportsBundle(): Promise<ReportsBundle> {
  const business = await getOrCreateBusiness();
  const scope = await getLocationScope();
  const supabase = await createClient();
  const now = new Date();
  const yearAgo = new Date(now);
  yearAgo.setFullYear(now.getFullYear() - 1);

  const apptSelectFull = `
      id, status, start_time, end_time, created_at, updated_at,
      location_id, staff_id, customer_id, service_id,
      price_cents, tax_cents, discount_cents, deposit_cents,
      amount_paid_cents, payment_status,
      service:services(id, name, price, category, duration_minutes),
      staff:staff(id, name, commission_rate_bps),
      customer:customers(id, name, created_at, date_of_birth),
      location:locations(id, name)
    `;
  const apptSelectCompat = `
      id, status, start_time, end_time, created_at, updated_at,
      location_id, staff_id, customer_id, service_id,
      service:services(id, name, price, category, duration_minutes),
      staff:staff(id, name),
      customer:customers(id, name, created_at, date_of_birth),
      location:locations(id, name)
    `;

  let apptQuery = supabase
    .from("appointments")
    .select(apptSelectFull)
    .eq("business_id", business.id)
    .gte("start_time", yearAgo.toISOString())
    .order("start_time");

  apptQuery = withLocationFilter(apptQuery, scope);

  const [
    apptResPrimary,
    customersRes,
    staffResPrimary,
    locationsRes,
    paymentsRes,
    waitlistRes,
    giftRes,
    membershipRes,
    packageRes,
  ] = await Promise.all([
    apptQuery,
    supabase
      .from("customers")
      .select("id, name, created_at, last_activity_at, date_of_birth")
      .eq("business_id", business.id),
    supabase
      .from("staff")
      .select("id, name, commission_rate_bps, is_active, location_id")
      .eq("business_id", business.id),
    supabase
      .from("locations")
      .select("id, name")
      .eq("business_id", business.id)
      .eq("is_active", true),
    supabase
      .from("customer_payment_events")
      .select("amount_cents, status, occurred_at, customer_id")
      .eq("business_id", business.id)
      .gte("occurred_at", yearAgo.toISOString()),
    supabase
      .from("waitlists")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .eq("status", "booked"),
    supabase
      .from("gift_cards")
      .select("initial_balance_cents, balance_cents, status")
      .eq("business_id", business.id),
    supabase
      .from("memberships")
      .select("price_cents, is_active")
      .eq("business_id", business.id),
    supabase
      .from("service_packages")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .eq("is_active", true),
  ]);

  let appointments: ReportAppointmentRow[] =
    (apptResPrimary.data as ReportAppointmentRow[] | null) ?? [];
  if (apptResPrimary.error) {
    logQueryError("reports-appointments", apptResPrimary.error.message);
    let fallback = supabase
      .from("appointments")
      .select(apptSelectCompat)
      .eq("business_id", business.id)
      .gte("start_time", yearAgo.toISOString())
      .order("start_time");
    fallback = withLocationFilter(fallback, scope);
    const apptResFallback = await fallback;
    if (apptResFallback.error) {
      logQueryError("reports-appointments-fallback", apptResFallback.error.message);
    } else {
      appointments = (apptResFallback.data as ReportAppointmentRow[] | null) ?? [];
    }
  }

  let staffRows: Array<{
    id: string;
    name: string;
    is_active?: boolean | null;
    location_id?: string | null;
    commission_rate_bps?: number | null;
  }> = (staffResPrimary.data as typeof staffRows | null) ?? [];
  if (staffResPrimary.error) {
    logQueryError("reports-staff", staffResPrimary.error.message);
    const staffFallback = await supabase
      .from("staff")
      .select("id, name, is_active, location_id")
      .eq("business_id", business.id);
    if (staffFallback.error) {
      logQueryError("reports-staff-fallback", staffFallback.error.message);
    } else {
      staffRows = (staffFallback.data as typeof staffRows | null) ?? [];
    }
  }

  const customers = (customersRes.data as ReportCustomerRow[] | null) ?? [];
  if (customersRes.error) {
    logQueryError("reports-customers", customersRes.error.message);
  }
  const payments = (
    paymentsRes.error
      ? []
      : ((paymentsRes.data as ReportPaymentRow[] | null) ?? [])
  );
  if (paymentsRes.error) {
    logQueryError("reports-payments", paymentsRes.error.message);
  }
  const staff = staffRows.map((s) => ({
    ...s,
    commission_rate_bps: s.commission_rate_bps ?? null,
  }));
  const locations = locationsRes.data ?? [];

  const giftCards = giftRes.error ? [] : (giftRes.data ?? []);
  if (giftRes.error) logQueryError("reports-gift-cards", giftRes.error.message);
  const memberships = membershipRes.error ? [] : (membershipRes.data ?? []);
  if (membershipRes.error) {
    logQueryError("reports-memberships", membershipRes.error.message);
  }
  const giftCardRevenueCents = giftCards.reduce(
    (s, g) =>
      s +
      Math.max(
        0,
        Number(g.initial_balance_cents ?? 0) - Number(g.balance_cents ?? 0),
      ),
    0,
  );
  const membershipRevenueCents = memberships
    .filter((m) => m.is_active)
    .reduce((s, m) => s + Number(m.price_cents ?? 0), 0);

  const outstandingInvoicesCents = payments
    .filter((p) => p.status === "pending")
    .reduce((s, p) => s + p.amount_cents, 0);

  const activeEmployees = staff.filter((s) => s.is_active !== false).length;

  const executive = buildExecutive({
    now,
    appointments,
    customers,
    activeEmployees,
    outstandingInvoicesCents,
    membershipRevenueCents,
    giftCardRevenueCents,
  });

  const revenue = buildRevenueBreakdown(appointments, now);
  const appointmentsReport = buildAppointmentReport(
    appointments,
    waitlistRes.count ?? 0,
    now,
  );
  const customersReport = buildCustomerReport(
    customers,
    appointments,
    payments,
    now,
  );
  const employees = buildEmployeeReports(
    appointments,
    staff.map((s) => ({
      id: s.id,
      name: s.name,
      commission_rate_bps: s.commission_rate_bps,
      is_active: s.is_active ?? undefined,
    })),
    now,
  );

  const services = buildServiceReport(
    appointments,
    packageRes.error ? 0 : (packageRes.count ?? 0),
    memberships.filter((m) => m.is_active).length,
    giftCards.length,
    now,
  );

  const staffByLocation = new Map<string, number>();
  for (const s of staff) {
    if (!s.location_id) continue;
    staffByLocation.set(
      s.location_id,
      (staffByLocation.get(s.location_id) ?? 0) + 1,
    );
  }

  const scopedLocations =
    scope.mode === "single"
      ? locations.filter((l) => l.id === scope.locationId)
      : locations;

  const locationsReport = buildLocationReports(
    appointments,
    scopedLocations,
    staffByLocation,
    now,
  );
  const financial = buildFinancial(appointments, payments, now);
  const inventory = buildInventoryPlaceholder();
  const schedules = await listSchedules(business.id);

  const snapshot = buildSnapshot({
    businessId: business.id,
    executive,
    appointmentsMonth: appointmentsReport.completed + appointmentsReport.cancelled,
    customerCount: customers.length,
    topServices: services.mostPopular.slice(0, 5),
    locationCount: locations.length,
  });

  return {
    currency: normalizeCurrency(business.currency),
    executive,
    revenue,
    appointments: appointmentsReport,
    customers: customersReport,
    employees,
    services,
    locations: locationsReport,
    financial,
    inventory,
    snapshot,
    schedules,
  };
}

/** Shared snapshot for Owner Platform hooks, Overview, and future AI Workforce. */
export async function getBusinessIntelligenceSnapshot(): Promise<BusinessIntelligenceSnapshot> {
  const bundle = await getReportsBundle();
  return bundle.snapshot;
}

export async function upsertReportSchedule(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const report_type = String(formData.get("report_type") ?? "executive") as ReportType;
  const cadence = String(formData.get("cadence") ?? "weekly") as ReportCadence;
  const format = String(formData.get("format") ?? "email") as
    | "csv"
    | "pdf"
    | "excel"
    | "email";
  const recipientsRaw = String(formData.get("recipients") ?? "").trim();
  const recipients = recipientsRaw
    .split(/[,;\s]+/)
    .map((e) => e.trim())
    .filter(Boolean);

  if (!name) return { error: "Schedule name is required." };
  if (recipients.length === 0) {
    return { error: "Add at least one email recipient." };
  }

  const payload = {
    business_id: business.id,
    name,
    report_type,
    cadence,
    format,
    recipients,
    enabled: formData.get("enabled") === "on" || formData.get("enabled") === "true",
  };

  const { error } = id
    ? await supabase
        .from("report_schedules")
        .update(payload)
        .eq("id", id)
        .eq("business_id", business.id)
    : await supabase.from("report_schedules").insert(payload);

  if (error) {
    return {
      error: error.message.includes("report_schedules")
        ? "Apply migration 021_reports_analytics to enable scheduled reports."
        : error.message,
    };
  }

  revalidateReports();
  return { success: id ? "Schedule updated." : "Schedule created." };
}

export async function deleteReportSchedule(id: string): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const { error } = await supabase
    .from("report_schedules")
    .delete()
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) return { error: error.message };
  revalidateReports();
  return { success: "Schedule deleted." };
}

export async function logReportExport(input: {
  reportType: ReportType;
  format: ReportExportFormat;
  rowCount: number;
}): Promise<ActionState> {
  const business = await getOrCreateBusiness();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("report_exports").insert({
    business_id: business.id,
    report_type: input.reportType,
    format: input.format,
    row_count: input.rowCount,
    created_by: user?.id ?? null,
  });

  if (error && !error.message.includes("report_exports")) {
    return { error: error.message };
  }
  return { success: "Export logged." };
}

export async function buildReportCsv(
  reportType: ReportType,
): Promise<{ csv: string; filename: string } | { error: string }> {
  const bundle = await getReportsBundle();
  let headers: string[] = [];
  let rows: (string | number)[][] = [];

  switch (reportType) {
    case "executive": {
      const e = bundle.executive;
      headers = ["Metric", "Value"];
      rows = [
        ["Revenue Today", e.revenueToday],
        ["Revenue Week", e.revenueWeek],
        ["Revenue Month", e.revenueMonth],
        ["Revenue Year", e.revenueYear],
        ["Appointments Today", e.appointmentsToday],
        ["Upcoming", e.upcomingAppointments],
        ["New Customers", e.newCustomers],
        ["Returning Customers", e.returningCustomers],
        ["Active Employees", e.activeEmployees],
        ["Outstanding Invoices ($)", e.outstandingInvoicesCents / 100],
        ["Membership Revenue ($)", e.membershipRevenueCents / 100],
        ["Gift Card Revenue ($)", e.giftCardRevenueCents / 100],
      ];
      break;
    }
    case "revenue":
      headers = ["Dimension", "Label", "Value"];
      rows = [
        ...bundle.revenue.byEmployee.map((r) => ["Employee", r.label, r.value]),
        ...bundle.revenue.byLocation.map((r) => ["Location", r.label, r.value]),
        ...bundle.revenue.byService.map((r) => ["Service", r.label, r.value]),
        ...bundle.revenue.byCategory.map((r) => ["Category", r.label, r.value]),
      ];
      break;
    case "appointments": {
      const a = bundle.appointments;
      headers = ["Metric", "Value"];
      rows = [
        ["Completed", a.completed],
        ["Cancelled", a.cancelled],
        ["No Shows", a.noShows],
        ["Rescheduled", a.rescheduled],
        ["Waitlist Conversions", a.waitlistConversions],
        ["Average Booking Value", a.averageBookingValue],
      ];
      break;
    }
    case "customers":
      headers = ["Customer", "Metric", "Value"];
      rows = [
        ...bundle.customers.topCustomers.map((c) => [
          c.label,
          "Lifetime value",
          c.value,
        ]),
        ...bundle.customers.inactiveCustomers.map((c) => [
          c.label,
          "Days inactive",
          c.value,
        ]),
      ];
      break;
    case "employees":
      headers = [
        "Employee",
        "Revenue",
        "Completed",
        "Avg minutes",
        "Commission ($)",
        "Productivity",
      ];
      rows = bundle.employees.map((e) => [
        e.name,
        e.revenue,
        e.completed,
        e.averageServiceMinutes,
        e.commissionCents / 100,
        e.productivity,
      ]);
      break;
    case "services":
      headers = ["Service", "Bookings / Revenue"];
      rows = [
        ...bundle.services.mostPopular.map((s) => [s.label, s.value]),
        ...bundle.services.revenueByService.map((s) => [
          `${s.label} revenue`,
          s.value,
        ]),
      ];
      break;
    case "locations":
      headers = [
        "Location",
        "Revenue",
        "Appointments",
        "Customers",
        "Employees",
        "Occupancy %",
        "Growth %",
      ];
      rows = bundle.locations.map((l) => [
        l.name,
        l.revenue,
        l.appointments,
        l.customers,
        l.employees,
        l.occupancyPct,
        l.growthPct,
      ]);
      break;
    case "financial": {
      const f = bundle.financial;
      headers = ["Metric", "Amount ($)"];
      rows = [
        ["Invoices", f.invoicesCents / 100],
        ["Payments", f.paymentsCents / 100],
        ["Refunds", f.refundsCents / 100],
        ["Taxes", f.taxesCents / 100],
        ["Discounts", f.discountsCents / 100],
        ["Deposits", f.depositsCents / 100],
        ["Outstanding", f.outstandingCents / 100],
      ];
      break;
    }
    case "inventory":
      headers = ["Metric", "Value"];
      rows = [
        ["Product Sales", 0],
        ["Stock Levels", 0],
        ["Low Inventory", 0],
        ["Supplier Orders", 0],
        ["Note", bundle.inventory.note],
      ];
      break;
    default:
      return { error: "Unknown report type." };
  }

  await logReportExport({
    reportType,
    format: "csv",
    rowCount: rows.length,
  });

  return {
    csv: rowsToCsv(headers, rows),
    filename: `chasum-${reportType}-${new Date().toISOString().slice(0, 10)}.csv`,
  };
}
