import "server-only";
import type { createServiceClient } from "@/lib/supabase/service";
import { logger } from "@/lib/observability/logger";

export type AppointmentNotificationContext = {
  appointment: {
    id: string;
    business_id: string;
    location_id: string;
    customer_id: string;
    service_id: string;
    staff_id: string | null;
    start_time: string;
    end_time: string;
    status: string;
  };
  customer: { id: string; name: string; email: string | null; phone: string | null };
  service: { id: string; name: string };
  staff: { id: string; name: string; email: string | null } | null;
  location: { id: string; name: string };
};

/** Load all identities before any notification side effect; never embed unscoped relations. */
export async function loadAppointmentNotificationContext(
  client: ReturnType<typeof createServiceClient>,
  appointmentId: string,
  businessId: string,
): Promise<AppointmentNotificationContext | null> {
  const { data: appointment, error } = await client.from("appointments")
    .select("id,business_id,location_id,customer_id,service_id,staff_id,start_time,end_time,status")
    .eq("id", appointmentId).eq("business_id", businessId).maybeSingle();
  if (error) throw new Error("Unable to load appointment notification context");
  if (!appointment) return null;

  const reconciliationRequired = (): never => {
    logger.warn("notifications", "appointment_reconciliation_required", {
      appointmentId: appointment.id, businessId: appointment.business_id,
    });
    throw new Error("Appointment requires data reconciliation");
  };
  if (![appointment.business_id, appointment.location_id, appointment.customer_id, appointment.service_id]
    .every((id) => typeof id === "string" && id.length > 0) ||
    !(appointment.staff_id === null || (typeof appointment.staff_id === "string" && appointment.staff_id.length > 0))) {
    reconciliationRequired();
  }

  const [customer, service, staff, location] = await Promise.all([
    client.from("customers").select("id,name,email,phone")
      .eq("id", appointment.customer_id).eq("business_id", businessId).maybeSingle(),
    client.from("services").select("id,name")
      .eq("id", appointment.service_id).eq("business_id", businessId).maybeSingle(),
    // Explicit null is the existing unassigned-staff representation; a missing referenced row is an error.
    appointment.staff_id === null ? Promise.resolve({ data: null, error: null }) :
      client.from("staff").select("id,name,email")
        .eq("id", appointment.staff_id).eq("business_id", businessId).maybeSingle(),
    client.from("locations").select("id,name")
      .eq("id", appointment.location_id).eq("business_id", businessId).maybeSingle(),
  ]);
  if ([customer, service, staff, location].some((result) => result.error)) {
    throw new Error("Unable to load appointment notification context");
  }
  if (!customer.data || !service.data || !location.data || (appointment.staff_id !== null && !staff.data)) {
    reconciliationRequired();
  }
  return {
    appointment,
    customer: customer.data!, service: service.data!, staff: staff.data, location: location.data!,
  };
}
