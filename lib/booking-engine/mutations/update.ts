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

const TERMINAL_ERROR = "Cancelled appointments are terminal.";
const NOTES_ONLY_ERROR = "Cancelled appointments can only update notes.";
const USE_CANCEL_ERROR = "Use Cancel appointment to cancel this appointment.";

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

export async function updateBooking(
  intent: UpdateBookingIntent,
): Promise<MutationResult<{ appointmentId: string }>> {
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
    status === "pending" || status === "confirmed" || !intent.requestedStatus
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

  // Status transitions keep their dedicated events. A real start- or end-time
  // move on an otherwise open appointment is a reschedule so Reception Save
  // reuses appointment.rescheduled communication orchestration.
  const eventType =
    resolvedStatus === "completed"
      ? "appointment.completed"
      : resolvedStatus === "no_show"
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
