/**
 * Chase Operations Manager — contracts.
 * Chase recommends; owners decide. Never mutates business data.
 */

export type ChasePriority = "high" | "medium" | "low";

export type ChaseInsight = {
  id: string;
  title: string;
  body: string;
  priority: ChasePriority;
  category: "revenue" | "capacity" | "staff" | "customers" | "bookings" | "ops";
};

export type ChaseAlert = {
  id: string;
  title: string;
  body: string;
  severity: "info" | "warning" | "critical";
  /** ISO date when relevant */
  when?: string | null;
};

export type ChaseKpis = {
  todayRevenue: number;
  todayAppointments: number;
  weekBookings: number;
  staffUtilizationPct: number | null;
  availableCapacitySlots: number;
  noShows: number;
  cancellationRatePct: number | null;
  repeatCustomerRatePct: number | null;
  averageBookingValue: number;
  revenueWeekDeltaPct: number | null;
};

export type ChaseCustomerAnalytics = {
  newCustomers: number;
  returningCustomers: number;
  retentionRatePct: number;
  lifetimeValueAvg: number;
  inactive: Array<{ id: string; name: string; detail: string }>;
  overdueFollowUp: Array<{
    id: string;
    name: string;
    daysSince: number;
  }>;
  highValue: Array<{
    id: string;
    name: string;
    lifetimeSpend: number;
    visits: number;
  }>;
  averageVisitFrequency: number | null;
};

export type ChaseEmployeeAnalytics = {
  rows: Array<{
    id: string;
    name: string;
    completed: number;
    revenue: number;
    utilizationPct: number | null;
    averageServiceMinutes: number;
    cancellationRatePct: number | null;
    noShowRatePct: number | null;
    overtimeWarning: boolean;
  }>;
};

export type ChaseBookingAnalytics = {
  peakHours: Array<{ label: string; value: number }>;
  quietHours: Array<{ label: string; value: number }>;
  busyDays: Array<{ label: string; value: number }>;
  popularServices: Array<{ label: string; value: number }>;
  popularEmployees: Array<{ label: string; value: number }>;
  bookingLeadTimeDaysAvg: number | null;
  completed: number;
  cancelled: number;
  noShows: number;
};

export type ChaseSummerActivity = {
  bookingsCompleted: number;
  reschedules: number;
  cancellations: number;
  creates: number;
  note: string;
};

export type ChaseUpcomingClosure = {
  id: string;
  label: string;
  startsAt: string;
  endsAt?: string | null;
  kind: "business" | "staff";
};

/**
 * Forecasting extension points — no prediction models yet.
 * Future providers plug in here.
 */
export type ChaseForecastHooks = {
  revenueForecastReady: false;
  capacityForecastReady: false;
  staffDemandReady: false;
  seasonalTrendsReady: false;
  /** Reserved provider id once models ship */
  provider: "none";
};

export type ChaseOperationsSnapshot = {
  businessId: string;
  businessName: string;
  generatedAt: string;
  enabled: boolean;
  kpis: ChaseKpis;
  insights: ChaseInsight[];
  alerts: ChaseAlert[];
  customers: ChaseCustomerAnalytics;
  employees: ChaseEmployeeAnalytics;
  bookings: ChaseBookingAnalytics;
  summer: ChaseSummerActivity;
  upcomingClosures: ChaseUpcomingClosure[];
  forecast: ChaseForecastHooks;
  pendingConfirmations: number;
  outstandingDeposits: number;
};
