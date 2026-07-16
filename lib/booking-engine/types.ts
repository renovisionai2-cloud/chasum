/**
 * Booking Engine 2.0 — shared types for calendar, portal, resources, conflicts.
 * Integrates with CRM, Communication, Employees, Locations (no breaking FK changes).
 */

export type BookingResourceType = "room" | "equipment" | "vehicle" | "other";

export type BookingResource = {
  id: string;
  business_id: string;
  location_id: string | null;
  resource_type: BookingResourceType;
  name: string;
  capacity: number | null;
  color: string;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type AppointmentCommercial = {
  room_id?: string | null;
  color?: string | null;
  price_cents?: number | null;
  tax_cents?: number;
  discount_cents?: number;
  deposit_cents?: number;
  invoice_number?: string | null;
  internal_notes?: string | null;
  custom_fields?: Record<string, unknown>;
  travel_minutes?: number;
  timezone?: string | null;
};

export type ConflictKind =
  | "employee"
  | "room"
  | "resource"
  | "vacation"
  | "holiday"
  | "double_booking";

export type BookingConflict = {
  kind: ConflictKind;
  message: string;
  appointmentId?: string;
  resourceId?: string;
};

export type CalendarViewMode =
  | "day"
  | "week"
  | "month"
  | "agenda"
  | "timeline"
  | "resource"
  | "locations"
  | "employees";

export type PortalAppointment = {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  service?: { name?: string; price?: number } | null;
  staff?: { name?: string } | null;
  location?: { name?: string } | null;
  invoice_number?: string | null;
  price_cents?: number | null;
  deposit_cents?: number | null;
};
