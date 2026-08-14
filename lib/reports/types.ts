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
  /**
   * Gross payments collected (dollars) when paymentsCollectedAvailable.
   * Legacy field name kept for bundle compatibility — UI must say payments collected.
   */
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
  /** Deferred — Chapter 10; do not mix recognition formulas. Always 0 in Ch2 correction. */
  revenueYear: number;
  paymentsCollectedAvailable: boolean;
  appointmentsToday: number;
  upcomingAppointments: number;
  newCustomers: number;
  returningCustomers: number;
  activeEmployees: number;
  /** Commerce SoT — same as Payments / Command Centre (cents). */
  outstandingInvoicesCents: number;
  outstandingInvoicesCount: number;
  outstandingInvoicesAvailable: boolean;
  membershipRevenueCents: number;
  showMembershipMetric: boolean;
  giftCardRevenueCents: number;
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
  lifetimeValueAvg: number;
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
  commissionCents: number;
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
  revenue: number;
  appointments: number;
  customers: number;
  employees: number;
  occupancyPct: number;
  growthPct: number;
};

export type FinancialReport = {
  invoicesCents: number;
  paymentsCents: number;
  refundsCents: number;
  taxesCents: number;
  discountsCents: number;
  depositsCents: number;
  outstandingCents: number;
  /** Deposits are included inside paymentsCents when using the commerce ledger. */
  paymentsIncludeDeposits: boolean;
  invoicesAreOutstandingCommerce: boolean;
  outstandingAreAppointmentBalances: boolean;
};

export type FinancialLedgerOverlay = {
  paymentsCollectedMonthCents: number;
  depositsCollectedMonthCents: number;
  refundsMonthCents: number;
  outstandingAppointmentBalancesCents: number;
  outstandingInvoicesCents: number;
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
  revenueMonth: number;
  appointmentsMonth: number;
  customerCount: number;
  topServices: NamedMetric[];
  locationCount: number;
};

export type ReportsBundle = {
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
