import type { FinancialAmount } from "@/lib/commerce/financial-aggregate/types";
export type ReportType =
  | "executive"
  | "revenue"
  | "appointments"
  | "customers"
  | "employees"
  | "services"
  | "locations"
  | "financial"
  | "inventory";

export type ReportCadence = "daily" | "weekly" | "monthly" | "yearly";

export type ReportExportFormat = "csv" | "pdf" | "excel" | "print" | "email";

export type NamedMetric = {
  label: string;
  value: number;
  meta?: string;
};

export type ChartPoint = {
  label: string;
  value: number;
};

export type ExecutiveDashboard = {
  revenueToday: FinancialAmount;
  revenueWeek: FinancialAmount;
  revenueMonth: FinancialAmount;
  revenueYear: FinancialAmount;
  appointmentsToday: number;
  upcomingAppointments: number;
  newCustomers: number;
  returningCustomers: number;
  activeEmployees: number;
  outstandingInvoicesCents: FinancialAmount;
  membershipRevenueCents: FinancialAmount;
  giftCardRevenueCents: FinancialAmount;
};

export type AppointmentReport = {
  booked: number;
  completed: number;
  cancelled: number;
  noShows: number;
  rescheduled: number;
  waitlistConversions: number;
  averageBookingValue: number;
  peakHours: ChartPoint[];
  peakDays: ChartPoint[];
  bookingTrends: ChartPoint[];
};

export type CustomerReport = {
  newCustomers: number;
  returningCustomers: number;
  lifetimeValueAvg: FinancialAmount;
  retentionRate: number;
  growthSeries: ChartPoint[];
  birthdaysThisMonth: NamedMetric[];
  topCustomers: NamedMetric[];
  inactiveCustomers: NamedMetric[];
};

export type EmployeeReportRow = {
  id: string;
  name: string;
  revenue: number;
  completed: number;
  averageRating: number | null;
  averageServiceMinutes: number;
  commissionCents: null;
  productivity: number;
};

export type ServiceReport = {
  mostPopular: NamedMetric[];
  leastPopular: NamedMetric[];
  revenueByService: ChartPoint[];
  durationByService: ChartPoint[];
  packageSales: number;
  membershipSales: number;
  giftCardSales: number;
};

export type LocationReportRow = {
  id: string;
  name: string;
  revenue: FinancialAmount;
  appointments: number;
  customers: number;
  employees: number;
  occupancyPct: number;
  growthPct: null;
};

export type FinancialReport = {
  invoicesCents: FinancialAmount;
  paymentsCents: FinancialAmount;
  refundsCents: FinancialAmount;
  taxesCents: FinancialAmount;
  discountsCents: FinancialAmount;
  depositsCents: FinancialAmount;
  outstandingCents: FinancialAmount;
};

export type InventoryReport = {
  ready: false;
  productSales: number;
  stockLevels: number;
  lowInventory: number;
  supplierOrders: number;
  note: string;
};

export type RevenueBreakdown = {
  daily: ChartPoint[];
  weekly: ChartPoint[];
  monthly: ChartPoint[];
  quarterly: ChartPoint[];
  yearly: ChartPoint[];
  byEmployee: ChartPoint[];
  byLocation: ChartPoint[];
  byService: ChartPoint[];
  byCategory: ChartPoint[];
};

export type ReportSchedule = {
  id: string;
  business_id: string;
  name: string;
  report_type: ReportType;
  cadence: ReportCadence;
  recipients: string[];
  format: "csv" | "pdf" | "excel" | "email";
  enabled: boolean;
  last_sent_at: string | null;
  next_run_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Snapshot for Owner Platform, Business Dashboard, and future AI Workforce. */
export type BusinessIntelligenceSnapshot = {
  businessId: string;
  generatedAt: string;
  executive: ExecutiveDashboard;
  revenueMonth: FinancialAmount;
  appointmentsMonth: number;
  customerCount: number;
  topServices: NamedMetric[];
  locationCount: number;
};

export type ReportsBundle = {
  financialScope: string;
  currency: string;
  executive: ExecutiveDashboard;
  revenue: RevenueBreakdown;
  appointments: AppointmentReport;
  customers: CustomerReport;
  employees: EmployeeReportRow[];
  services: ServiceReport;
  locations: LocationReportRow[];
  financial: FinancialReport;
  inventory: InventoryReport;
  snapshot: BusinessIntelligenceSnapshot;
  schedules: ReportSchedule[];
};
