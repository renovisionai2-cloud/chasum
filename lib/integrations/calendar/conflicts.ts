import { createServiceClient } from "@/lib/supabase/service";

export async function hasExternalCalendarConflict(
  businessId: string,
  staffId: string,
  startTime: string,
  endTime: string,
  excludeAppointmentId?: string,
): Promise<boolean> {
  const supabase = createServiceClient();

  const { data: connections } = await supabase
    .from("calendar_connections")
    .select("id")
    .eq("business_id", businessId)
    .eq("sync_enabled", true)
    .or(`staff_id.is.null,staff_id.eq.${staffId}`);

  if (!connections?.length) return false;

  const connectionIds = connections.map((c) => c.id);

  let query = supabase
    .from("external_events")
    .select("id")
    .in("calendar_connection_id", connectionIds)
    .eq("is_busy", true)
    .lt("start_time", endTime)
    .gt("end_time", startTime);

  if (excludeAppointmentId) {
    query = query.or(`appointment_id.is.null,appointment_id.neq.${excludeAppointmentId}`);
  }

  const { data } = await query;
  return (data?.length ?? 0) > 0;
}
