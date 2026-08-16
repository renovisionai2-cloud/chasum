import {
  resolveRequestedStatus,
  validateBooking,
} from "@/lib/booking-engine/availability";
import { findRoomConflicts, logAppointmentChange } from "@/lib/booking-engine/conflicts";
import {
  createBookingEvent,
  emitBookingEvent,
} from "@/lib/booking-engine/events";
import type {
  MutationResult,
  UpdateBookingIntent,
} from "@/lib/booking-engine/types";
import { isUnchangedExistingSchedule } from "@/lib/booking-engine/schedule-hold";
import { createClient } from "@/lib/supabase/server";

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
  };

  const status =
    intent.requestedStatus ?? (existing.status as string) ?? "pending";

  if (status !== "cancelled") {
    const holdSchedule = isUnchangedExistingSchedule(existing, intent);
    let endTime = String(existing.end_time ?? intent.requestedStart);
    let resolvedStatus = status;

    if (!holdSchedule) {
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
      endTime = validation.endTime ?? endTime;
      resolvedStatus =
        status === "pending" ||
        status === "confirmed" ||
        !intent.requestedStatus
          ? resolveRequestedStatus(validation.context, status)
          : status;
    }

    if (intent.roomId) {
      const roomConflicts = await findRoomConflicts({
        businessId: intent.businessId,
        roomId: intent.roomId,
        startIso: intent.requestedStart,
        endIso: endTime,
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

    const { error } = await supabase
      .from("appointments")
      .update({
        service_id: intent.serviceId,
        staff_id: intent.staffId || null,
        customer_id: intent.customerId ?? existing.customer_id,
        location_id: intent.locationId,
        start_time: intent.requestedStart,
        end_time: endTime,
        status: resolvedStatus,
        notes: intent.notes ?? null,
        room_id: intent.roomId ?? existing.room_id ?? null,
      })
      .eq("id", intent.appointmentId)
      .eq("business_id", intent.businessId);

    if (error) {
      return { phase: "rollback", error: error.message };
    }

    const eventType =
      resolvedStatus === "completed"
        ? "appointment.completed"
        : resolvedStatus === "no_show"
          ? "appointment.no_show"
          : "appointment.updated";

    const event = await emitBookingEvent(
      createBookingEvent({
        type: eventType,
        businessId: intent.businessId,
        appointmentId: intent.appointmentId,
        channel: intent.channel,
        payload: { beforeState },
      }),
    );

    await logAppointmentChange({
      businessId: intent.businessId,
      appointmentId: intent.appointmentId,
      action: "update",
      beforeState,
      afterState: {
        start_time: intent.requestedStart,
        end_time: endTime,
        status: resolvedStatus,
      },
    });

    return {
      phase: "success",
      data: { appointmentId: intent.appointmentId },
      events: [event],
    };
  }

  const { error } = await supabase
    .from("appointments")
    .update({
      status: "cancelled",
      notes: intent.notes ?? existing.notes,
    })
    .eq("id", intent.appointmentId)
    .eq("business_id", intent.businessId);

  if (error) return { phase: "rollback", error: error.message };

  const event = await emitBookingEvent(
    createBookingEvent({
      type: "appointment.cancelled",
      businessId: intent.businessId,
      appointmentId: intent.appointmentId,
      channel: intent.channel,
    }),
  );

  return {
    phase: "success",
    data: { appointmentId: intent.appointmentId },
    events: [event],
  };
}
