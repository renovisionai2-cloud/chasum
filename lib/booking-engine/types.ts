/**
 * Booking Engine Foundation — shared contracts.
 * Surfaces (staff, public, Summer, API) speak BookingIntent.
 * SQL RPCs remain authoritative for slot validation.
 */

import type { AppointmentStatus } from "@/lib/types/booking";

// —— Channels & intent ——

export type BookingChannel =
  | "staff"
  | "reception"
  | "public"
  | "summer"
  | "api";

export type BookingIntent = {
  channel: BookingChannel;
  businessId: string;
  locationId: string;
  serviceId: string;
  staffId: string;
  /** Required for create/update mutations; optional for validate-only calls */
  customerId?: string;
  resourceIds?: string[];
  /** ISO timestamptz */
  requestedStart: string;
  /** ISO timestamptz — derived from duration when omitted */
  requestedEnd?: string;
  notes?: string | null;
  requestedStatus?: AppointmentStatus;
  /** Minutes override (staff duration override / resize context) */
  durationMinutes?: number;
  /** Commercial stamp — package or service price in cents */
  priceCents?: number;
  depositCents?: number;
  packageId?: string;
  packageName?: string;
  /** Exclude self when validating updates / reschedules */
  excludeAppointmentId?: string;
  roomId?: string | null;
};

export type RescheduleIntent = {
  channel: BookingChannel;
  businessId: string;
  appointmentId: string;
  requestedStart: string;
  staffId?: string;
  locationId?: string;
};

export type ResizeIntent = {
  channel: BookingChannel;
  businessId: string;
  appointmentId: string;
  requestedEnd: string;
};

export type CancelIntent = {
  channel: BookingChannel;
  businessId: string;
  appointmentId: string;
  reason?: string | null;
};

export type UpdateBookingIntent = BookingIntent & {
  appointmentId: string;
};

export type PreviewSlotsInput = {
  channel: BookingChannel;
  businessId: string;
  locationId: string;
  serviceId: string;
  staffId: string;
  /** YYYY-MM-DD */
  date: string;
  excludeAppointmentId?: string;
};

// —— Availability context (composed from Business / Services / Employees) ——

export type AvailabilityContext = {
  businessId: string;
  locationId: string;
  serviceId: string;
  staffId: string;
  channel: BookingChannel;
  /** IANA timezone from location → business */
  timezone: string | null;
  /** Grid step from location_settings */
  intervalMinutes: number;
  /** Service duration in minutes (staff override applied when present) */
  durationMinutes: number;
  cleanupMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  minNoticeMinutes: number | null;
  maxBookingDaysAhead: number | null;
  maxAppointmentsPerDay: number | null;
  allowDoubleBooking: boolean;
  acceptOnlineBookings: boolean;
  bookingVisibility: "online" | "hidden" | "internal" | null;
  confirmationMode: "inherit" | "auto_confirm" | "require_approval" | null;
  priorityScheduling: number;
  serviceActive: boolean;
  staffActive: boolean;
  /** Effective end = start + duration (cleanup/buffers applied by RPC candidate expansion) */
  composedAt: string;
};

/** Soft signals for UI / Summer — never invent availability */
export type SlotWarning = {
  code: BookingConflictCode | "LIMITED_AVAILABILITY" | "SHORT_NOTICE" | "PRIORITY_STAFF";
  message: string;
};

export type SlotAvailabilityReason =
  | "AVAILABLE"
  | "FILTERED_MIN_NOTICE"
  | "FILTERED_MAX_WINDOW"
  | "RPC_EMPTY";

// —— Conflicts ——

export type BookingConflictCode =
  | "STAFF_BUSY"
  | "RESOURCE_BUSY"
  | "OUTSIDE_BUSINESS_HOURS"
  | "OUTSIDE_EMPLOYEE_HOURS"
  | "VACATION"
  | "LUNCH_BREAK"
  | "SERVICE_BLACKOUT"
  | "BUSINESS_CLOSURE"
  | "MIN_NOTICE"
  | "MAX_BOOKING_WINDOW"
  | "MAX_APPOINTMENTS"
  | "DOUBLE_BOOKING"
  | "NOT_AUTHORIZED"
  | "UNKNOWN";

export type BookingConflictReport = {
  code: BookingConflictCode;
  message: string;
  severity: "error" | "warning";
  recoverable: boolean;
  appointmentId?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
};

/** @deprecated Prefer BookingConflictReport — kept for existing resource helpers */
export type ConflictKind =
  | "employee"
  | "room"
  | "resource"
  | "vacation"
  | "holiday"
  | "double_booking";

/** @deprecated Prefer BookingConflictReport */
export type BookingConflict = {
  kind: ConflictKind;
  message: string;
  appointmentId?: string;
  resourceId?: string;
};

// —— Mutation result (optimistic UI contract) ——

export type MutationPhase = "pending" | "success" | "rollback" | "conflict";

export type MutationResult<T = { appointmentId: string }> = {
  phase: MutationPhase;
  data?: T;
  conflicts?: BookingConflictReport[];
  error?: string;
  events?: BookingDomainEvent[];
};

export type SlotCandidate = {
  /** ISO timestamptz */
  start: string;
  /** ISO timestamptz — start + duration */
  end: string;
  /** Employee */
  staffId: string;
  locationId: string;
  serviceId: string;
  /** Required / suggested resources (extension point; empty until resource scheduling) */
  resourceIds: string[];
  /** 0–100 preference score (priority, earliness, scarcity) */
  score: number;
  reason: SlotAvailabilityReason;
  warnings: SlotWarning[];
};

export type PreviewSlotsResult = {
  slots: SlotCandidate[];
  context: AvailabilityContext;
  conflicts?: BookingConflictReport[];
  /** Day-level explanation when zero slots */
  emptyReason?: BookingConflictReport;
};

export type ValidateBookingResult =
  | { ok: true; context: AvailabilityContext; endTime: string }
  | { ok: false; conflicts: BookingConflictReport[]; context?: AvailabilityContext };

// —— Domain events ——

export type BookingDomainEventType =
  | "appointment.created"
  | "appointment.updated"
  | "appointment.cancelled"
  | "appointment.rescheduled"
  | "appointment.completed"
  | "appointment.no_show"
  | "appointment.checked_in";

export type BookingDomainEvent = {
  type: BookingDomainEventType;
  businessId: string;
  appointmentId: string;
  channel: BookingChannel;
  occurredAt: string;
  payload?: Record<string, unknown>;
};

// —— Legacy resource / portal types (unchanged contracts) ——

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
