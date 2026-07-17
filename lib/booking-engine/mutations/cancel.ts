import { logAppointmentChange } from "@/lib/booking-engine/conflicts";
import {
  createBookingEvent,
  emitBookingEvent,
} from "@/lib/booking-engine/events";
import type { CancelIntent, MutationResult } from "@/lib/booking-engine/types";
import { createClient } from "@/lib/supabase/server";

export async function cancelBooking(
  intent: CancelIntent,
): Promise<MutationResult<{ appointmentId: string }>> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("appointments")
    .select("id, status, start_time, end_time")
    .eq("id", intent.appointmentId)
    .eq("business_id", intent.businessId)
    .maybeSingle();

  if (!existing) {
    return { phase: "rollback", error: "Appointment not found." };
  }

  if (existing.status === "cancelled") {
    return {
      phase: "success",
      data: { appointmentId: intent.appointmentId },
    };
  }

  const { error } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", intent.appointmentId)
    .eq("business_id", intent.businessId);

  if (error) {
    return { phase: "rollback", error: error.message };
  }

  await logAppointmentChange({
    businessId: intent.businessId,
    appointmentId: intent.appointmentId,
    action: "cancel",
    beforeState: {
      status: existing.status,
      start_time: existing.start_time,
      end_time: existing.end_time,
    },
    afterState: {
      status: "cancelled",
      reason: intent.reason ?? null,
    },
  });

  const event = await emitBookingEvent(
    createBookingEvent({
      type: "appointment.cancelled",
      businessId: intent.businessId,
      appointmentId: intent.appointmentId,
      channel: intent.channel,
      payload: { reason: intent.reason ?? null },
    }),
  );

  return {
    phase: "success",
    data: { appointmentId: intent.appointmentId },
    events: [event],
  };
}
