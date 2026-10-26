import { addMinutes, parseISO } from "date-fns";
import {
  resolveRequestedStatus,
  validateBooking,
} from "@/lib/booking-engine/availability";
import { findRoomConflicts, logAppointmentChange } from "@/lib/booking-engine/conflicts";
import {
  createBookingEvent,
  emitBookingEvent,
} from "@/lib/booking-engine/events";
import { scheduledRangeChanged } from "@/lib/booking-engine/scheduled-range";
import type {
  MutationResult,
  UpdateBookingIntent,
} from "@/lib/booking-engine/types";
import { createClient } from "@/lib/supabase/server";
import { resolveAppointmentStatusWorkflow, type AppointmentStatus } from "@/lib/types/booking";

const TERMINAL_ERROR = "Cancelled appointments are terminal.";
const NOTES_ONLY_ERROR = "Cancelled appointments can only update notes.";
const USE_CANCEL_ERROR = "Use Cancel appointment to cancel this appointment.";
const FINANCIAL_ATTRIBUTION_CONSTRAINT =
  "commerce_transactions_appt_business_customer_financial_fk";
const FINANCIAL_ATTRIBUTION_ERROR =
  "This appointment has financial history, so its customer cannot be changed. Create a new appointment for the correct customer; handle any refund or reversal separately.";

function isFinancialAttributionConstraintError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as Record<string, unknown>;
  if (candidate.code !== "23503") return false;

  if (candidate.constraint === FINANCIAL_ATTRIBUTION_CONSTRAINT) return true;
  if (typeof candidate.message !== "string") return false;
  return candidate.message.includes(
    `constraint "${FINANCIAL_ATTRIBUTION_CONSTRAINT}"`,
  );
}

function sameRef(left: unknown, right: unknown): boolean {
  const a = left == null || left === "" ? null : String(left);
  const c = right == null || right === "" ? null : String(right);
  return a === c;
}

function normalizeNotes(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value);
  return text.length === 0 ? null : text;
}

function requestedEndIso(
  intent: UpdateBookingIntent,
  existingEnd: unknown,
): string {
  if (typeof intent.requestedEnd === "string" && intent.requestedEnd) {
    return intent.requestedEnd;
  }
  if (
    typeof intent.durationMinutes === "number" &&
    Number.isFinite(intent.durationMinutes) &&
    intent.durationMinutes > 0
  ) {
    return addMinutes(
      parseISO(intent.requestedStart),
      intent.durationMinutes,
    ).toISOString();
  }
  return typeof existingEnd === "string" ? existingEnd : intent.requestedStart;
}

function durationMinutesChanged(
  intent: UpdateBookingIntent,
  existing: Record<string, unknown>,
): boolean {
  if (
    typeof intent.durationMinutes !== "number" ||
    !Number.isFinite(intent.durationMinutes) ||
    intent.durationMinutes <= 0
  ) {
    return false;
  }
  if (
    typeof existing.start_time !== "string" ||
    typeof existing.end_time !== "string"
  ) {
    return true;
  }
  const startMs = Date.parse(existing.start_time);
  const endMs = Date.parse(existing.end_time);
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return true;
  return endMs - startMs !== intent.durationMinutes * 60_000;
}

function cancelledOperationalFieldsChanged(
  intent: UpdateBookingIntent,
  existing: Record<string, unknown>,
): boolean {
  const requestedEnd = requestedEndIso(intent, existing.end_time);
  const requestedRoom =
    intent.roomId === undefined ? existing.room_id : intent.roomId;
  return (
    !sameRef(intent.customerId ?? existing.customer_id, existing.customer_id) ||
    !sameRef(intent.serviceId, existing.service_id) ||
    !sameRef(intent.staffId, existing.staff_id) ||
    !sameRef(intent.locationId, existing.location_id) ||
    !sameRef(requestedRoom, existing.room_id) ||
    durationMinutesChanged(intent, existing) ||
    scheduledRangeChanged({
      existingStart: existing.start_time,
      requestedStart: intent.requestedStart,
      existingEnd: existing.end_time,
      requestedEnd,
    })
  );
}

const STATUS_ONLY_KEYS = new Set([
  "operation", "channel", "appointmentId", "businessId", "requestedStatus",
  "locationId", "serviceId", "staffId", "customerId", "requestedStart",
  "requestedEnd", "notes", "roomId", "durationMinutes", "excludeAppointmentId",
]);
const STATUS_CHANGED_ERROR = "Appointment changed or access is no longer available. Reload before trying again.";

/** N06: session/RLS writer inside the canonical engine, never a scheduling bypass flag. */
async function updateStatusOnly(
  supabase: Awaited<ReturnType<typeof createClient>>,
  intent: UpdateBookingIntent,
  existing: Record<string, unknown>,
  beforeState: Record<string, unknown>,
): Promise<MutationResult<{ appointmentId: string }>> {
  if (existing.booking_operation_id != null) {
    return { phase: "rollback", error: "This appointment requires the protected booking lifecycle workflow. Its status was not changed." };
  }
  if (
    intent.channel !== "staff" ||
    Object.keys(intent).some((key) => !STATUS_ONLY_KEYS.has(key)) ||
    (intent.excludeAppointmentId !== undefined && intent.excludeAppointmentId !== intent.appointmentId) ||
    typeof intent.requestedStart !== "string" || !Number.isFinite(Date.parse(intent.requestedStart)) ||
    (intent.requestedEnd !== undefined &&
      (typeof intent.requestedEnd !== "string" || !Number.isFinite(Date.parse(intent.requestedEnd)))) ||
    (intent.durationMinutes !== undefined &&
      (typeof intent.durationMinutes !== "number" || !Number.isFinite(intent.durationMinutes) || intent.durationMinutes <= 0)) ||
    (intent.customerId !== undefined && !sameRef(intent.customerId, existing.customer_id)) ||
    !sameRef(intent.serviceId, existing.service_id) ||
    !sameRef(intent.staffId, existing.staff_id) ||
    !sameRef(intent.locationId, existing.location_id) ||
    (intent.roomId !== undefined && !sameRef(intent.roomId, existing.room_id)) ||
    durationMinutesChanged(intent, existing) ||
    scheduledRangeChanged({
      existingStart: existing.start_time,
      requestedStart: intent.requestedStart,
      existingEnd: existing.end_time,
      requestedEnd: intent.requestedEnd ?? (typeof existing.end_time === "string" ? existing.end_time : ""),
    }) ||
    (intent.notes !== undefined && normalizeNotes(intent.notes) !== normalizeNotes(existing.notes))
  ) {
    return { phase: "rollback", error: "Status-only actions cannot change appointment details. Save those edits separately." };
  }

  const target = intent.requestedStatus;
  const validStatuses = resolveAppointmentStatusWorkflow(null);
  if (!target || ![...validStatuses, "pending"].includes(target)) {
    return { phase: "rollback", error: "Choose a valid appointment status." };
  }
  if (existing.status === "cancelled") return { phase: "rollback", error: TERMINAL_ERROR };
  if (target === "cancelled") return { phase: "rollback", error: USE_CANCEL_ERROR };
  // A retry acknowledges current state; it must not replay events, audit or writes.
  if (target === existing.status) {
    return { phase: "success", data: { appointmentId: intent.appointmentId }, events: [] };
  }

  const { data: business, error: businessError } = await supabase
    .from("businesses").select("appointment_status_workflow").eq("id", intent.businessId).maybeSingle();
  if (businessError || !business) return { phase: "rollback", error: "Appointment workflow could not be verified." };
  const workflow = resolveAppointmentStatusWorkflow(business.appointment_status_workflow);
  const currentIndex = workflow.indexOf(existing.status as AppointmentStatus);
  if (
    existing.status === "completed" || existing.status === "no_show" ||
    (!(existing.status === "pending" && target === "confirmed") &&
      (!workflow.includes(target) || currentIndex < 0 ||
        (target !== "no_show" && workflow.indexOf(target) <= currentIndex)))
  ) {
    return { phase: "rollback", error: "This status change requires an explicit workflow correction." };
  }
  const start = Date.parse(String(existing.start_time));
  const end = Date.parse(String(existing.end_time));
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start ||
      typeof existing.updated_at !== "string" || !Number.isFinite(Date.parse(existing.updated_at))) {
    return { phase: "rollback", error: "Appointment state could not be verified. Reload before trying again." };
  }
  // Policy B: at the scheduled start or later; the planned end is not a completion gate.
  if (target === "completed" && start > Date.now()) {
    return { phase: "rollback", error: "Appointments cannot be completed before their scheduled start." };
  }

  let saved;
  try {
    let query = supabase.from("appointments").update({ status: target })
      .eq("id", intent.appointmentId).eq("business_id", intent.businessId);
    // Compare the observed row, not just ID: a concurrent cancellation, edit or
    // payment/cache update must cause a refresh rather than a stale success.
    for (const column of ["status", "updated_at", "start_time", "end_time", "staff_id", "location_id", "service_id", "customer_id", "room_id", "notes", "booking_operation_id"]) {
      if (column === "booking_operation_id" && !(column in existing)) continue; // pre-#158 schema
      query = existing[column] == null ? query.is(column, null) : query.eq(column, existing[column]);
    }
    saved = await query.select("id, status").maybeSingle();
  } catch {
    return { phase: "conflict", error: "Appointment status could not be confirmed. Reload before trying again." };
  }
  if (saved.error) {
    return { phase: "conflict", error: "Appointment status could not be confirmed. Reload before trying again." };
  }
  if (!saved.data || saved.data.id !== intent.appointmentId || saved.data.status !== target) {
    return { phase: "conflict", error: STATUS_CHANGED_ERROR };
  }

  const event = createBookingEvent({
    type: target === "completed" ? "appointment.completed" : target === "no_show" ? "appointment.no_show" : "appointment.updated",
    businessId: intent.businessId,
    appointmentId: intent.appointmentId,
    channel: intent.channel,
    payload: { beforeState },
  });
  let warning: string | undefined;
  const followUpWarning = "Appointment status saved, but follow-up processing could not be confirmed. Reload to review it.";
  try { await emitBookingEvent(event); } catch { warning = followUpWarning; }
  try {
    await logAppointmentChange({
      businessId: intent.businessId,
      appointmentId: intent.appointmentId,
      action: "update",
      beforeState,
      afterState: { start_time: existing.start_time, end_time: existing.end_time, status: target },
    });
  } catch { warning = followUpWarning; }
  return { phase: "success", data: { appointmentId: intent.appointmentId }, events: [event], ...(warning ? { warning } : {}) };
}

export async function updateBooking(
  intent: UpdateBookingIntent,
): Promise<MutationResult<{ appointmentId: string }>> {
  if (intent.operation !== undefined && intent.operation !== "status-only") {
    return { phase: "rollback", error: "Unsupported appointment operation." };
  }
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", intent.appointmentId)
    .eq("business_id", intent.businessId)
    .maybeSingle();

  if (!existing) {
    return { phase: "rollback", error: "Appointment not found." };
  }

  const beforeState = {
    start_time: existing.start_time,
    end_time: existing.end_time,
    staff_id: existing.staff_id,
    location_id: existing.location_id,
    status: existing.status,
    notes: existing.notes,
  };

  if (intent.operation === "status-only") {
    return updateStatusOnly(supabase, intent, existing, beforeState);
  }

  if (existing.status === "cancelled") {
    if (intent.requestedStatus && intent.requestedStatus !== "cancelled") {
      return { phase: "rollback", error: TERMINAL_ERROR };
    }
    if (cancelledOperationalFieldsChanged(intent, existing)) {
      return { phase: "rollback", error: NOTES_ONLY_ERROR };
    }

    const nextNotes = normalizeNotes(
      intent.notes === undefined ? existing.notes : intent.notes,
    );
    if (nextNotes === normalizeNotes(existing.notes)) {
      return {
        phase: "success",
        data: { appointmentId: intent.appointmentId },
        events: [],
      };
    }

    const { error } = await supabase
      .from("appointments")
      .update({ notes: nextNotes })
      .eq("id", intent.appointmentId)
      .eq("business_id", intent.businessId);

    if (error) return { phase: "rollback", error: error.message };

    await logAppointmentChange({
      businessId: intent.businessId,
      appointmentId: intent.appointmentId,
      action: "update",
      beforeState: {
        status: "cancelled",
        notes: existing.notes,
      },
      afterState: {
        status: "cancelled",
        notes: nextNotes,
      },
    });

    return {
      phase: "success",
      data: { appointmentId: intent.appointmentId },
      events: [],
    };
  }

  const status =
    intent.requestedStatus ?? (existing.status as string) ?? "pending";

  if (status === "cancelled") {
    return { phase: "rollback", error: USE_CANCEL_ERROR };
  }

  const validation = await validateBooking({
    ...intent,
    excludeAppointmentId: intent.appointmentId,
  });
  if (!validation.ok) {
    return {
      phase: "conflict",
      conflicts: validation.conflicts,
      error: validation.conflicts[0]?.message,
    };
  }

  if (intent.roomId) {
    const roomConflicts = await findRoomConflicts({
      businessId: intent.businessId,
      roomId: intent.roomId,
      startIso: intent.requestedStart,
      endIso: validation.endTime,
      excludeAppointmentId: intent.appointmentId,
    });
    if (roomConflicts.length > 0) {
      return {
        phase: "conflict",
        conflicts: roomConflicts,
        error: roomConflicts[0]?.message,
      };
    }
  }

  const resolvedStatus =
    status === "pending" || status === "confirmed"
      ? resolveRequestedStatus(validation.context, status)
      : status;

  const { error } = await supabase
    .from("appointments")
    .update({
      service_id: intent.serviceId,
      staff_id: intent.staffId || null,
      customer_id: intent.customerId ?? existing.customer_id,
      location_id: intent.locationId,
      start_time: intent.requestedStart,
      end_time: validation.endTime,
      status: resolvedStatus,
      notes: intent.notes ?? null,
      room_id: intent.roomId ?? existing.room_id ?? null,
    })
    .eq("id", intent.appointmentId)
    .eq("business_id", intent.businessId);

  if (error) {
    if (isFinancialAttributionConstraintError(error)) {
      return { phase: "rollback", error: FINANCIAL_ATTRIBUTION_ERROR };
    }
    return { phase: "rollback", error: error.message };
  }

  const previousStartTime =
    typeof existing.start_time === "string" ? existing.start_time : undefined;
  const previousEndTime =
    typeof existing.end_time === "string" ? existing.end_time : undefined;
  const rangeChanged = scheduledRangeChanged({
    existingStart: existing.start_time,
    requestedStart: intent.requestedStart,
    existingEnd: existing.end_time,
    requestedEnd: validation.endTime,
  });

  // Only real status transitions take precedence over a start- or end-time move.
  const statusTransitioned = existing.status !== resolvedStatus;
  const eventType =
    statusTransitioned && resolvedStatus === "completed"
      ? "appointment.completed"
      : statusTransitioned && resolvedStatus === "no_show"
        ? "appointment.no_show"
        : rangeChanged
          ? "appointment.rescheduled"
          : "appointment.updated";

  const event = await emitBookingEvent(
    createBookingEvent({
      type: eventType,
      businessId: intent.businessId,
      appointmentId: intent.appointmentId,
      channel: intent.channel,
      payload: {
        beforeState,
        ...(eventType === "appointment.rescheduled"
          ? { previousStartTime, previousEndTime }
          : {}),
      },
    }),
  );

  await logAppointmentChange({
    businessId: intent.businessId,
    appointmentId: intent.appointmentId,
    action: eventType === "appointment.rescheduled" ? "reschedule" : "update",
    beforeState,
    afterState: {
      start_time: intent.requestedStart,
      end_time: validation.endTime,
      status: resolvedStatus,
    },
  });

  return {
    phase: "success",
    data: { appointmentId: intent.appointmentId },
    events: [event],
  };
}
