import type {
  AppointmentReport,
  BusinessIntelligenceSnapshot,
  CustomerReport,
  EmployeeReportRow,
  ExecutiveDashboard,
  FinancialReport,
  InventoryReport,
  LocationReportRow,
  NamedMetric,
  ChartPoint,
  RevenueBreakdown,
  ServiceReport,
} from "@/lib/reports/types";

export type ReportAppointmentRow = {
  id: string;
  status: string;
  start_time: string;
  end_time: string;
  created_at?: string;
  updated_at?: string;
  location_id: string | null;
  staff_id: string | null;
  customer_id: string | null;
  service_id: string | null;
  price_cents?: number | null;
  tax_cents?: number | null;
  discount_cents?: number | null;
  deposit_cents?: number | null;
  amount_paid_cents?: number | null;
  payment_status?: string | null;
  service?: {
    id?: string;
    name?: string;
    price?: number;
    category?: string | null;
    duration_minutes?: number;
  } | null;
  staff?: { id?: string; name?: string; commission_rate_bps?: number | null } | null;
  customer?: {
    id?: string;
    name?: string;
    created_at?: string;
    date_of_birth?: string | null;
  } | null;
  location?: { id?: string; name?: string } | null;
};

export type ReportCustomerRow = {
  id: string;
  name: string;
  created_at: string;
  last_activity_at?: string | null;
  date_of_birth?: string | null;
};

export type ReportPaymentRow = {
  amount_cents: number;
  status: string;
  occurred_at: string;
  customer_id: string | null;
};

function moneyFromAppt(a: ReportAppointmentRow): number {
  if (a.price_cents != null && a.price_cents > 0) return a.price_cents / 100;
  return Number(a.service?.price ?? 0);
}

function inRange(iso: string, start: Date, end: Date) {
  const t = new Date(iso).getTime();
  return t >= start.getTime() && t <= end.getTime();
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function startOfWeek(d: Date) {
  const x = startOfDay(d);
  const day = x.getDay();
  x.setDate(x.getDate() - day);
  return x;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfYear(d: Date) {
  return new Date(d.getFullYear(), 0, 1);
}

function isCancelledOrNoShow(a: ReportAppointmentRow) {
  return a.status === "cancelled" || a.status === "no_show";
}

/** Booked work that should appear in volume KPIs (not only completed). */
function activeBookings(appts: ReportAppointmentRow[]) {
  return appts.filter((a) => !isCancelledOrNoShow(a));
}

/**
 * Revenue recognition — shared source of truth for dashboards/reports.
 * Counts completed visits OR any visit where money was collected.
 */
function recognizesRevenue(a: ReportAppointmentRow): boolean {
  if (isCancelledOrNoShow(a)) return false;
  if (a.status === "completed") return true;
  const paid = Number(a.amount_paid_cents ?? a.deposit_cents ?? 0);
  if (paid > 0) return true;
  const ps = String(a.payment_status ?? "");
  return ["deposit_paid", "partially_paid", "fully_paid"].includes(ps);
}

function completed(appts: ReportAppointmentRow[]) {
  return appts.filter((a) => a.status === "completed");
}

function revenueAppts(appts: ReportAppointmentRow[]) {
  return appts.filter(recognizesRevenue);
}

function sumRevenue(appts: ReportAppointmentRow[]) {
  return revenueAppts(appts).reduce((s, a) => {
    const paid = Number(a.amount_paid_cents ?? 0);
    if (paid > 0) return s + paid / 100;
    return s + moneyFromAppt(a);
  }, 0);
}

function topN(map: Map<string, number>, n: number): ChartPoint[] {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([label, value]) => ({ label, value: Math.round(value * 100) / 100 }));
}

function namedTop(
  map: Map<string, { label: string; value: number; meta?: string }>,
  n: number,
): NamedMetric[] {
  return [...map.values()]
    .sort((a, b) => b.value - a.value)
    .slice(0, n)
    .map((x) => ({
      label: x.label,
      value: Math.round(x.value * 100) / 100,
      meta: x.meta,
    }));
}

export function buildExecutive(input: {
  now: Date;
  appointments: ReportAppointmentRow[];
  customers: ReportCustomerRow[];
  activeEmployees: number;
  outstandingInvoicesCents: number;
  membershipRevenueCents: number;
  giftCardRevenueCents: number;
}): ExecutiveDashboard {
  const { now, appointments, customers } = input;
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);

  const todayAppts = appointments.filter(
    (a) =>
      a.status !== "cancelled" &&
      inRange(a.start_time, todayStart, todayEnd),
  );
  const upcoming = appointments.filter(
    (a) =>
      a.status !== "cancelled" &&
      new Date(a.start_time).getTime() >= now.getTime(),
  );

  const monthCustomerIds = new Set(
    customers
      .filter((c) => inRange(c.created_at, monthStart, now))
      .map((c) => c.id),
  );
  const bookedThisMonth = activeBookings(
    appointments.filter((a) => inRange(a.start_time, monthStart, now)),
  );
  const returning = new Set(
    bookedThisMonth
      .filter((a) => a.customer_id && !monthCustomerIds.has(a.customer_id))
      .map((a) => a.customer_id as string),
  );

  return {
    revenueToday: sumRevenue(
      appointments.filter((a) => inRange(a.start_time, todayStart, todayEnd)),
    ),
    revenueWeek: sumRevenue(
      appointments.filter((a) => inRange(a.start_time, weekStart, now)),
    ),
    revenueMonth: sumRevenue(
      appointments.filter((a) => inRange(a.start_time, monthStart, now)),
    ),
    revenueYear: sumRevenue(
      appointments.filter((a) => inRange(a.start_time, yearStart, now)),
    ),
    appointmentsToday: todayAppts.length,
    upcomingAppointments: upcoming.length,
    newCustomers: monthCustomerIds.size,
    returningCustomers: returning.size,
    activeEmployees: input.activeEmployees,
    outstandingInvoicesCents: input.outstandingInvoicesCents,
    membershipRevenueCents: input.membershipRevenueCents,
    giftCardRevenueCents: input.giftCardRevenueCents,
  };
}

export function buildRevenueBreakdown(
  appointments: ReportAppointmentRow[],
  now: Date,
): RevenueBreakdown {
  const yearStart = startOfYear(now);
  const yearAppts = appointments.filter((a) =>
    inRange(a.start_time, yearStart, now),
  );
  const done = revenueAppts(yearAppts);

  const daily = new Map<string, number>();
  const weekly = new Map<string, number>();
  const monthly = new Map<string, number>();
  const quarterly = new Map<string, number>();
  const yearly = new Map<string, number>();
  const byEmployee = new Map<string, number>();
  const byLocation = new Map<string, number>();
  const byService = new Map<string, number>();
  const byCategory = new Map<string, number>();

  for (const a of done) {
    const d = new Date(a.start_time);
    const money = moneyFromAppt(a);
    const dayKey = d.toISOString().slice(0, 10);
    daily.set(dayKey, (daily.get(dayKey) ?? 0) + money);

    const week = startOfWeek(d);
    const weekKey = week.toISOString().slice(0, 10);
    weekly.set(weekKey, (weekly.get(weekKey) ?? 0) + money);

    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthly.set(monthKey, (monthly.get(monthKey) ?? 0) + money);

    const q = Math.floor(d.getMonth() / 3) + 1;
    const qKey = `${d.getFullYear()} Q${q}`;
    quarterly.set(qKey, (quarterly.get(qKey) ?? 0) + money);

    const yKey = String(d.getFullYear());
    yearly.set(yKey, (yearly.get(yKey) ?? 0) + money);

    const emp = a.staff?.name ?? "Unassigned";
    byEmployee.set(emp, (byEmployee.get(emp) ?? 0) + money);
    const loc = a.location?.name ?? "No location";
    byLocation.set(loc, (byLocation.get(loc) ?? 0) + money);
    const svc = a.service?.name ?? "Unknown";
    byService.set(svc, (byService.get(svc) ?? 0) + money);
    const cat = a.service?.category?.trim() || "Uncategorized";
    byCategory.set(cat, (byCategory.get(cat) ?? 0) + money);
  }

  const last14 = [...daily.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-14)
    .map(([label, value]) => ({
      label: label.slice(5),
      value: Math.round(value * 100) / 100,
    }));

  return {
    daily: last14,
    weekly: topN(weekly, 12).reverse(),
    monthly: [...monthly.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, value]) => ({
        label,
        value: Math.round(value * 100) / 100,
      })),
    quarterly: [...quarterly.entries()].map(([label, value]) => ({
      label,
      value: Math.round(value * 100) / 100,
    })),
    yearly: [...yearly.entries()].map(([label, value]) => ({
      label,
      value: Math.round(value * 100) / 100,
    })),
    byEmployee: topN(byEmployee, 12),
    byLocation: topN(byLocation, 12),
    byService: topN(byService, 12),
    byCategory: topN(byCategory, 12),
  };
}

export function buildAppointmentReport(
  appointments: ReportAppointmentRow[],
  waitlistConversions: number,
  now: Date,
): AppointmentReport {
  const monthStart = startOfMonth(now);
  const month = appointments.filter((a) =>
    inRange(a.start_time, monthStart, now),
  );
  const done = completed(month);
  const booked = activeBookings(month);
  const valued = revenueAppts(month);
  const hourMap = new Map<string, number>();
  const dayMap = new Map<string, number>();
  const trend = new Map<string, number>();

  for (const a of booked) {
    const d = new Date(a.start_time);
    const hour = `${String(d.getHours()).padStart(2, "0")}:00`;
    hourMap.set(hour, (hourMap.get(hour) ?? 0) + 1);
    const day = d.toLocaleDateString("en-US", { weekday: "short" });
    dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
    const key = d.toISOString().slice(0, 10);
    trend.set(key, (trend.get(key) ?? 0) + 1);
  }

  const rescheduled = month.filter((a) => {
    if (!a.created_at || !a.updated_at) return false;
    return (
      a.status !== "cancelled" &&
      new Date(a.updated_at).getTime() - new Date(a.created_at).getTime() >
        60_000 &&
      a.start_time !== a.created_at
    );
  }).length;

  const avg =
    valued.length === 0
      ? 0
      : valued.reduce((s, a) => s + moneyFromAppt(a), 0) / valued.length;

  return {
    booked: booked.length,
    completed: done.length,
    cancelled: month.filter((a) => a.status === "cancelled").length,
    noShows: month.filter((a) => a.status === "no_show").length,
    rescheduled,
    waitlistConversions,
    averageBookingValue: Math.round(avg * 100) / 100,
    peakHours: topN(
      new Map([...hourMap].map(([k, v]) => [k, v])),
      8,
    ),
    peakDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      .filter((d) => dayMap.has(d))
      .map((d) => ({ label: d, value: dayMap.get(d) ?? 0 })),
    bookingTrends: [...trend.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14)
      .map(([label, value]) => ({ label: label.slice(5), value })),
  };
}

export function buildCustomerReport(
  customers: ReportCustomerRow[],
  appointments: ReportAppointmentRow[],
  payments: ReportPaymentRow[],
  now: Date,
): CustomerReport {
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);
  const newCustomers = customers.filter((c) =>
    inRange(c.created_at, monthStart, now),
  ).length;

  const spent = new Map<string, number>();
  for (const p of payments.filter((x) => x.status === "paid" || x.status === "recorded")) {
    if (!p.customer_id) continue;
    spent.set(
      p.customer_id,
      (spent.get(p.customer_id) ?? 0) + p.amount_cents / 100,
    );
  }
  for (const a of completed(appointments)) {
    if (!a.customer_id) continue;
    if (spent.has(a.customer_id)) continue;
    spent.set(
      a.customer_id,
      (spent.get(a.customer_id) ?? 0) + moneyFromAppt(a),
    );
  }

  const returning = new Set<string>();
  const counts = new Map<string, number>();
  for (const a of completed(appointments)) {
    if (!a.customer_id) continue;
    counts.set(a.customer_id, (counts.get(a.customer_id) ?? 0) + 1);
  }
  for (const [id, n] of counts) {
    if (n > 1) returning.add(id);
  }

  const withSpend = [...spent.values()];
  const ltv =
    withSpend.length === 0
      ? 0
      : withSpend.reduce((s, v) => s + v, 0) / withSpend.length;

  const active90 = customers.filter((c) => {
    const last = c.last_activity_at ?? c.created_at;
    return now.getTime() - new Date(last).getTime() < 90 * 86400000;
  }).length;
  const retention =
    customers.length === 0
      ? 0
      : Math.round((active90 / customers.length) * 1000) / 10;

  const growth = new Map<string, number>();
  for (const c of customers.filter((x) =>
    inRange(x.created_at, yearStart, now),
  )) {
    const key = new Date(c.created_at).toISOString().slice(0, 7);
    growth.set(key, (growth.get(key) ?? 0) + 1);
  }

  const month = now.getMonth();
  const birthdays: NamedMetric[] = customers
    .filter((c) => {
      if (!c.date_of_birth) return false;
      const d = new Date(c.date_of_birth + "T00:00:00");
      return d.getMonth() === month;
    })
    .slice(0, 20)
    .map((c) => ({
      label: c.name,
      value: Number((c.date_of_birth ?? "").slice(8, 10)),
      meta: c.date_of_birth ?? undefined,
    }));

  const nameById = new Map(customers.map((c) => [c.id, c.name]));
  const top = namedTop(
    new Map(
      [...spent.entries()].map(([id, value]) => [
        id,
        { label: nameById.get(id) ?? "Customer", value },
      ]),
    ),
    10,
  );

  const inactive = customers
    .filter((c) => {
      const last = c.last_activity_at ?? c.created_at;
      return now.getTime() - new Date(last).getTime() > 90 * 86400000;
    })
    .slice(0, 10)
    .map((c) => ({
      label: c.name,
      value: Math.round(
        (now.getTime() - new Date(c.last_activity_at ?? c.created_at).getTime()) /
          86400000,
      ),
      meta: "days inactive",
    }));

  return {
    newCustomers,
    returningCustomers: returning.size,
    lifetimeValueAvg: Math.round(ltv * 100) / 100,
    retentionRate: retention,
    growthSeries: [...growth.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, value]) => ({ label, value })),
    birthdaysThisMonth: birthdays,
    topCustomers: top,
    inactiveCustomers: inactive,
  };
}

export function buildEmployeeReports(
  appointments: ReportAppointmentRow[],
  staff: {
    id: string;
    name: string;
    commission_rate_bps?: number | null;
    is_active?: boolean;
  }[],
  now: Date,
): EmployeeReportRow[] {
  const monthStart = startOfMonth(now);
  const month = appointments.filter((a) =>
    inRange(a.start_time, monthStart, now),
  );
  const rows: EmployeeReportRow[] = [];

  for (const s of staff.filter((x) => x.is_active !== false)) {
    const theirs = month.filter((a) => a.staff_id === s.id);
    const booked = activeBookings(theirs);
    const done = completed(theirs);
    const revenue = sumRevenue(theirs);
    const minutes = booked.reduce((sum, a) => {
      const start = new Date(a.start_time).getTime();
      const end = new Date(a.end_time).getTime();
      const dur =
        end > start
          ? (end - start) / 60000
          : a.service?.duration_minutes ?? 0;
      return sum + dur;
    }, 0);
    const rate = s.commission_rate_bps ?? 0;
    rows.push({
      id: s.id,
      name: s.name,
      revenue: Math.round(revenue * 100) / 100,
      completed: Math.max(done.length, booked.length),
      averageRating: null,
      averageServiceMinutes:
        booked.length === 0 ? 0 : Math.round(minutes / booked.length),
      commissionCents: Math.round(revenue * 100 * (rate / 10000)),
      productivity: booked.length,
    });
  }

  return rows.sort((a, b) => b.revenue - a.revenue);
}

export function buildServiceReport(
  appointments: ReportAppointmentRow[],
  packageCount: number,
  membershipCount: number,
  giftCardCount: number,
  now: Date,
): ServiceReport {
  const monthStart = startOfMonth(now);
  const done = revenueAppts(
    appointments.filter((a) => inRange(a.start_time, monthStart, now)),
  );
  const counts = new Map<string, number>();
  const revenue = new Map<string, number>();
  const duration = new Map<string, number>();

  for (const a of done) {
    const name = a.service?.name ?? "Unknown";
    counts.set(name, (counts.get(name) ?? 0) + 1);
    revenue.set(name, (revenue.get(name) ?? 0) + moneyFromAppt(a));
    duration.set(
      name,
      a.service?.duration_minutes ?? duration.get(name) ?? 0,
    );
  }

  const popular = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return {
    mostPopular: popular.slice(0, 8).map(([label, value]) => ({
      label,
      value,
      meta: "bookings",
    })),
    leastPopular: popular
      .slice(-5)
      .reverse()
      .map(([label, value]) => ({ label, value, meta: "bookings" })),
    revenueByService: topN(revenue, 10),
    durationByService: [...duration.entries()]
      .slice(0, 10)
      .map(([label, value]) => ({ label, value })),
    packageSales: packageCount,
    membershipSales: membershipCount,
    giftCardSales: giftCardCount,
  };
}

export function buildLocationReports(
  appointments: ReportAppointmentRow[],
  locations: { id: string; name: string }[],
  staffByLocation: Map<string, number>,
  now: Date,
): LocationReportRow[] {
  const monthStart = startOfMonth(now);
  const prevStart = startOfMonth(
    new Date(now.getFullYear(), now.getMonth() - 1, 1),
  );
  const prevEnd = new Date(monthStart.getTime() - 1);

  return locations.map((loc) => {
    const month = appointments.filter(
      (a) =>
        a.location_id === loc.id && inRange(a.start_time, monthStart, now),
    );
    const prev = appointments.filter(
      (a) =>
        a.location_id === loc.id &&
        inRange(a.start_time, prevStart, prevEnd),
    );
    const customers = new Set(
      month.map((a) => a.customer_id).filter(Boolean),
    );
    const rev = sumRevenue(month);
    const prevRev = sumRevenue(prev);
    const growth =
      prevRev === 0
        ? rev > 0
          ? 100
          : 0
        : Math.round(((rev - prevRev) / prevRev) * 1000) / 10;
    const slots = 8 * 30;
    const occupancy = Math.min(
      100,
      Math.round((month.filter((a) => a.status !== "cancelled").length / slots) * 1000) /
        10,
    );

    return {
      id: loc.id,
      name: loc.name,
      revenue: Math.round(rev * 100) / 100,
      appointments: month.filter((a) => a.status !== "cancelled").length,
      customers: customers.size,
      employees: staffByLocation.get(loc.id) ?? 0,
      occupancyPct: occupancy,
      growthPct: growth,
    };
  });
}

export function buildFinancial(
  appointments: ReportAppointmentRow[],
  payments: ReportPaymentRow[],
  now: Date,
): FinancialReport {
  const monthStart = startOfMonth(now);
  const monthAppts = appointments.filter((a) =>
    inRange(a.start_time, monthStart, now),
  );
  const monthPay = payments.filter((p) =>
    inRange(p.occurred_at, monthStart, now),
  );

  const paymentsCents = monthPay
    .filter((p) => p.status === "paid" || p.status === "recorded")
    .reduce((s, p) => s + p.amount_cents, 0);
  const refundsCents = monthPay
    .filter((p) => p.status === "refunded")
    .reduce((s, p) => s + p.amount_cents, 0);
  const outstandingCents = monthPay
    .filter((p) => p.status === "pending")
    .reduce((s, p) => s + p.amount_cents, 0);

  const taxesCents = monthAppts.reduce(
    (s, a) => s + (a.tax_cents ?? 0),
    0,
  );
  const discountsCents = monthAppts.reduce(
    (s, a) => s + (a.discount_cents ?? 0),
    0,
  );
  const depositsCents = monthAppts.reduce(
    (s, a) => s + (a.deposit_cents ?? 0),
    0,
  );
  const invoicesCents = Math.round(sumRevenue(monthAppts) * 100);

  return {
    invoicesCents,
    paymentsCents,
    refundsCents,
    taxesCents,
    discountsCents,
    depositsCents,
    outstandingCents,
  };
}

export function buildInventoryPlaceholder(): InventoryReport {
  return {
    ready: false,
    productSales: 0,
    stockLevels: 0,
    lowInventory: 0,
    supplierOrders: 0,
    note: "Inventory reporting is future-ready — product catalog coming soon.",
  };
}

export function buildSnapshot(input: {
  businessId: string;
  executive: ExecutiveDashboard;
  appointmentsMonth: number;
  customerCount: number;
  topServices: NamedMetric[];
  locationCount: number;
}): BusinessIntelligenceSnapshot {
  return {
    businessId: input.businessId,
    generatedAt: new Date().toISOString(),
    executive: input.executive,
    revenueMonth: input.executive.revenueMonth,
    appointmentsMonth: input.appointmentsMonth,
    customerCount: input.customerCount,
    topServices: input.topServices,
    locationCount: input.locationCount,
  };
}

export function rowsToCsv(
  headers: string[],
  rows: (string | number | null | undefined)[][],
): string {
  const escape = (v: string | number | null | undefined) => {
    const s = v == null ? "" : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  return [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join(
    "\n",
  );
}
