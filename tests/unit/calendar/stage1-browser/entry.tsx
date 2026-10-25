// Local synthetic data only. run.mjs rejects non-loopback traffic and all writes.
import { createRoot } from "react-dom/client";
import CalendarPage from "@/app/(dashboard)/dashboard/calendar/page";
import { DashboardShell } from "@/components/dashboard/shell";
import { ThemeProvider } from "@/providers/theme-provider";
import { location, customer, service, staff } from "../cal01-fixtures";
import type { LocationScope } from "@/lib/location/constants";
import type { AppointmentWithRelations } from "@/lib/types/booking";
import "@/app/globals.css";

const fixtureWindow = window as typeof window & {
  __fixtureActions: Record<string, (...args: never[]) => unknown>;
  __render: () => Promise<void>;
};
const locations = [{ ...location, name: "North Studio" }, { ...location, id: "loc2", name: "South Studio", is_default: false }];
const services = [
  { ...service, name: "Consultation", color: "#2563eb" },
  { ...service, id: "svc2", name: "Follow-up session", color: "#7c3aed", location_id: "loc2", service_locations: [{ location_id: "loc2" }] },
];
const members = ["Ava Mitchell", "Priya Shah", "Nina Cooper"].map((name, i) => ({
  ...staff, id: i ? `staff${i}` : "staff", name, color: ["#2563eb", "#7c3aed", "#0d9488"][i],
  staff_locations: [{ location_id: "loc" }, { location_id: "loc2" }],
  staff_services: [{ service_id: "svc" }, { service_id: "svc2" }],
}));
const names = ["Sofia Bennett", "Emma Wilson", "Lily Peterson", "Olivia Brooks", "Ava Robinson", "Isabella Moore", "Amelia Carter", "Charlotte Reed", "Harper Johnson"];
const appointments: AppointmentWithRelations[] = names.map((name, i) => {
  const employee = members[i % 3];
  const start = new Date(`2026-10-26T${String(13 + Math.floor(i / 3) * 2).padStart(2, "0")}:00:00Z`);
  return {
    id: `appt${i}`, business_id: "biz", customer_id: "cust", service_id: "svc", staff_id: employee.id, location_id: "loc",
    customer: { ...customer, name }, service: services[0], staff: employee,
    status: i === 1 ? "completed" : i === 3 ? "arrived" : "confirmed",
    notes: null, start_time: start.toISOString(), end_time: new Date(+start + 45 * 60000).toISOString(),
    created_at: "2026-01-01", updated_at: "2026-01-01",
  } as AppointmentWithRelations;
});
let scope: LocationScope = { mode: "single", locationId: "loc" };
const scopedAppointments = () => scope.mode === "single" && scope.locationId === "loc2" ? [] : appointments;
fixtureWindow.__fixtureActions = {
  getOrCreateBusiness: () => ({ id: "biz", timezone: "America/Toronto", currency: "cad" }),
  getLocations: () => locations,
  getLocationScope: () => scope,
  setLocationScope: (value: string) => { scope = value === "ALL" ? { mode: "all" } : { mode: "single", locationId: value }; },
  getBookingIntervalMinutes: () => 30,
  getAppointments: scopedAppointments,
  getOperatorServiceCatalog: () => services,
  getStaff: () => members,
  getEligibleStaffForBooking: () => members,
  getCustomers: () => [customer],
  getMorningBrief: () => ({
    todayAppointments: scopedAppointments().length, todayRevenue: { state: "UNKNOWN", reason: "Synthetic local fixture" },
    staffWorking: 3, availableSlots: 0, waitlistCount: 0, noShows: 0, outstandingPayments: null, pendingConfirmations: 1, customersToday: 9,
    summer: { bookingsToday: 0, reschedulesToday: 0, confirmationsToday: 0 },
    chase: { revenueDeltaPct: null, recommendation: "Review pending confirmations.", availableSlots: 0, overdueCustomers: null },
  }),
  getDashboardStats: () => ({ todayCount: 9, yesterdayCount: 9, lastWeekSameDayCount: 9, weekCount: 9, previousWeekCount: 9, pendingConfirmations: 1, upcoming: [], customerCount: 9 }),
  getWaitlistEntries: () => [], getStaffDayOverlays: () => [], listTaxRates: () => [],
};
const root = createRoot(document.getElementById("root")!);
fixtureWindow.__render = async () => {
  const params = Object.fromEntries(new URLSearchParams(window.location.search));
  const content = await CalendarPage({ searchParams: Promise.resolve({ date: "2026-10-26", ...params }) });
  root.render(<ThemeProvider><DashboardShell userEmail="operator@invalid.test" locations={locations} locationScope={scope}
    locationQuota={{ plan: "starter", currentCount: 2, canAdd: true }}>{content}</DashboardShell></ThemeProvider>);
};
void fixtureWindow.__render();
