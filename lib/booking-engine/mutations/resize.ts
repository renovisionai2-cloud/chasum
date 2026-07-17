import { parseISO } from "date-fns";
import { validateBooking } from "@/lib/booking-engine/availability";
import { logAppointmentChange } from "@/lib/booking-engine/conflicts";
import {
  createBookingEvent,
  emitBookingEvent,
} from "@/lib/booking-engine/events";
import type { MutationResult, ResizeIntent } from "@/lib/booking-engine/types";
import { createClient } from "@/lib/supabase/server";

export async function resizeBooking(
  intent: ResizeIntent,
): Promise<MutationResult<{ appointmentId: string }>> {
  const supabase = await createClient();
  const { data: appointment } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", intent.appointmentId)
    .eq("business_id", intent.businessId)
    .maybeSingle();

  if (!appointment) {
    return { phase: "rollback", error: "Appointment not found." };
  }
  if (appointment.status === "cancelled") {
    return { phase: "rollback", error: "Cancelled appointments cannot be resized." };
  }

  const startTime = parseISO(appointment.start_time as string);
  const endTime = parseISO(intent.requestedEnd);
  if (endTime.getTime() <= startTime.getTime()) {
    return { phase: "rollback", error: "End time must be after start time." };
  }

  const durationMinutes = Math.max(
    5,
    Math.round((endTime.getTime() - startTime.getTime()) / 60_000),
  );

  const validation = await validateBooking({
    channel: intent.channel,
    businessId: intent.businessId,
    locationId: appointment.location_id as string,
    serviceId: appointment.service_id as string,
    staffId: appointment.staff_id as string,
    customerId: appointment.customer_id as string,
    requestedStart: appointment.start_time as string,
    requestedEnd: intent.requestedEnd,
    durationMinutes,
    excludeAppointmentId: intent.appointmentId,
  });

  if (!validation.ok) {
    return {
      phase: "conflict",
      conflicts: validation.conflicts,
      error: validation.conflicts[0]?.message,
    };
  }

  const beforeState = {
    start_time: appointment.start_time,
    end_time: appointment.end_time,
  };

  const { error } = await supabase
    .from("appointments")
    .update({ end_time: intent.requestedEnd })
    .eq("id", intent.appointmentId)
    .eq("business_id", intent.businessId);

  if (error) {
    return { phase: "rollback", error: error.message };
  }

  await logAppointmentChange({
    businessId: intent.businessId,
    appointmentId: intent.appointmentId,
    action: "resize",
    beforeState,
    afterState: {
      start_time: appointment.start_time,
      end_time: intent.requestedEnd,
    },
  });

  const event = await emitBookingEvent(
    createBookingEvent({
      type: "appointment.updated",
      businessId: intent.businessId,
      appointmentId: intent.appointmentId,
      channel: intent.channel,
      payload: { action: "resize", beforeState },
    }),
  );

  return {
    phase: "success",
    data: { appointmentId: intent.appointmentId },
    events: [event],
  };
}
