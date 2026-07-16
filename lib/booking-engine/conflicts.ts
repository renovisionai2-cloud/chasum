import type { BookingConflict } from "@/lib/booking-engine/types";
import { createClient } from "@/lib/supabase/server";

/**
 * Soft conflict helpers for Booking Engine 2.0.
 * Hard prevention remains in validate_appointment_slot / staff gist exclusion.
 */
export async function findRoomConflicts(input: {
  businessId: string;
  roomId: string;
  startIso: string;
  endIso: string;
  excludeAppointmentId?: string;
}): Promise<BookingConflict[]> {
  const supabase = await createClient();
  let query = supabase
    .from("appointments")
    .select("id, start_time, end_time")
    .eq("business_id", input.businessId)
    .eq("room_id", input.roomId)
    .neq("status", "cancelled")
    .lt("start_time", input.endIso)
    .gt("end_time", input.startIso);

  if (input.excludeAppointmentId) {
    query = query.neq("id", input.excludeAppointmentId);
  }

  const { data, error } = await query;
  if (error) {
    // Column may not exist pre-migration
    return [];
  }

  return (data ?? []).map((row) => ({
    kind: "room" as const,
    message: "Room is already booked for this time.",
    appointmentId: row.id as string,
    resourceId: input.roomId,
  }));
}

export async function logAppointmentChange(input: {
  businessId: string;
  appointmentId: string;
  action: string;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  createdBy?: string | null;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("appointment_change_log").insert({
    business_id: input.businessId,
    appointment_id: input.appointmentId,
    action: input.action,
    before_state: input.beforeState ?? null,
    after_state: input.afterState ?? null,
    created_by: input.createdBy ?? null,
  });
  if (error) {
    console.error("[booking-engine] change log:", error.message);
  }
}

export function netAppointmentTotalCents(input: {
  priceCents?: number | null;
  taxCents?: number | null;
  discountCents?: number | null;
}): number {
  const price = input.priceCents ?? 0;
  const tax = input.taxCents ?? 0;
  const discount = input.discountCents ?? 0;
  return Math.max(0, price + tax - discount);
}
