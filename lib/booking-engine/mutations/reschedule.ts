import { addMinutes, parseISO } from "date-fns";
import { validateBooking } from "@/lib/booking-engine/availability";
import { logAppointmentChange } from "@/lib/booking-engine/conflicts";
import {
  createBookingEvent,
  emitBookingEvent,
} from "@/lib/booking-engine/events";
import type {
  MutationResult,
  RescheduleIntent,
} from "@/lib/booking-engine/types";
import { createClient } from "@/lib/supabase/server";

export async function rescheduleBooking(
  intent: RescheduleIntent,
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
    return { phase: "rollback", error: "Cancelled appointments cannot be rescheduled." };
  }

  const durationMinutes = Math.max(
    5,
    Math.round(
      (parseISO(appointment.end_time as string).getTime() -
        parseISO(appointment.start_time as string).getTime()) /
        60_000,
    ),
  );

  const staffId = intent.staffId ?? (appointment.staff_id as string);
  const locationId = intent.locationId ?? (appointment.location_id as string);
  const endTime = addMinutes(parseISO(intent.requestedStart), durationMinutes);

  const validation = await validateBooking({
    channel: intent.channel,
    businessId: intent.businessId,
    locationId,
    serviceId: appointment.service_id as string,
    staffId,
    customerId: appointment.customer_id as string,
    requestedStart: intent.requestedStart,
    requestedEnd: endTime.toISOString(),
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
    staff_id: appointment.staff_id,
    location_id: appointment.location_id,
  };

  const { error } = await supabase
    .from("appointments")
    .update({
      start_time: intent.requestedStart,
      end_time: validation.endTime,
      staff_id: staffId,
      location_id: locationId,
    })
    .eq("id", intent.appointmentId)
    .eq("business_id", intent.businessId);

  if (error) {
    return { phase: "rollback", error: error.message };
  }

  await logAppointmentChange({
    businessId: intent.businessId,
    appointmentId: intent.appointmentId,
    action: "reschedule",
    beforeState,
    afterState: {
      start_time: intent.requestedStart,
      end_time: validation.endTime,
      staff_id: staffId,
      location_id: locationId,
    },
  });

  const event = await emitBookingEvent(
    createBookingEvent({
      type: "appointment.rescheduled",
      businessId: intent.businessId,
      appointmentId: intent.appointmentId,
      channel: intent.channel,
      payload: {
        beforeState,
        previousStartTime:
          typeof beforeState.start_time === "string"
            ? beforeState.start_time
            : undefined,
      },
    }),
  );

  return {
    phase: "success",
    data: { appointmentId: intent.appointmentId },
    events: [event],
  };
}
