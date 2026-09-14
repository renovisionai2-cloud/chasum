import { NextRequest } from "next/server";
import { isApiAuth, requireApiAuth } from "@/lib/api/guard";
import {
  apiSuccess,
  apiNotFound,
  apiError,
} from "@/lib/api/response";
import { createServiceClient } from "@/lib/supabase/service";
import {
  formatZodError,
  patchAppointmentBodySchema,
} from "@/lib/validation/schemas";
import { captureBookingFailure, logger } from "@/lib/observability/logger";
import { validateAppointmentReferences } from "@/lib/api/appointment-references";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  const auth = await requireApiAuth(request, "read");
  if (!isApiAuth(auth)) return auth;

  const { id } = await context.params;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("appointments")
    .select(
      "*, service:services(id, name), staff:staff(id, name), customer:customers(id, name, email)",
    )
    .eq("id", id)
    .eq("business_id", auth.businessId)
    .eq("customer.business_id", auth.businessId)
    .eq("service.business_id", auth.businessId)
    .eq("staff.business_id", auth.businessId)
    .single();

  if (error || !data) return apiNotFound();
  return apiSuccess(data);
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  const auth = await requireApiAuth(request, "write");
  if (!isApiAuth(auth)) return auth;

  const { id } = await context.params;
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const parsed = patchAppointmentBodySchema.safeParse(json);
  if (!parsed.success) {
    return apiError(formatZodError(parsed.error), 400);
  }
  const body = parsed.data;
  if (Object.keys(body).length === 0) {
    return apiError("No updatable fields provided", 400);
  }

  const supabase = createServiceClient();

  const { data: current, error: readError } = await supabase
    .from("appointments")
    .select("location_id,customer_id,service_id,staff_id,start_time,end_time,status,updated_at")
    .eq("id", id)
    .eq("business_id", auth.businessId)
    .maybeSingle();
  if (readError) return apiError("Unable to read appointment", 503);
  if (!current) return apiNotFound();

  const effective = { ...current, ...body };
  const schedulingChanged =
    (["location_id", "service_id", "staff_id"] as const).some(
      (key) => effective[key].toLowerCase() !== current[key].toLowerCase(),
    ) ||
    // Compare exactly: JavaScript and PostgreSQL parse offsets/precision differently.
    // A different representation must pass PostgreSQL slot validation before writing.
    (["start_time", "end_time"] as const).some(
      (key) => effective[key] !== current[key],
    ) || (current.status === "cancelled" && effective.status !== "cancelled");
  const validated = await validateAppointmentReferences({
    client: supabase,
    businessId: auth.businessId,
    references: effective,
    // Historical notes/completion/cancellation need ownership, not currently active catalog entries.
    requireActive: { location: schedulingChanged, service: schedulingChanged, staff: schedulingChanged },
  });
  if (!validated.ok) return apiError(validated.error, validated.status);
  if (schedulingChanged) {
    const validation = await supabase.rpc("validate_appointment_slot", {
      p_business_id: auth.businessId,
      p_location_id: validated.references.location_id,
      p_service_id: validated.references.service_id,
      p_staff_id: validated.references.staff_id,
      p_start_time: effective.start_time,
      p_end_time: effective.end_time,
      p_exclude_appointment_id: id,
    });
    if (validation.error) {
      await captureBookingFailure(validation.error, { businessId: auth.businessId, appointmentId: id });
      return apiError(validation.error.message, 400);
    }
  }

  const { data, error } = await supabase
    .from("appointments")
    .update({ ...body, ...validated.references })
    .eq("id", id)
    .eq("business_id", auth.businessId)
    .eq("updated_at", current.updated_at)
    .select("*")
    .maybeSingle();

  if (error || !data) {
    if (error) {
      await captureBookingFailure(error, {
        businessId: auth.businessId,
        appointmentId: id,
      });
    }
    return apiError(error ? "Unable to update appointment" : "Appointment changed; reload and retry", error ? 400 : 409);
  }

  // PATCH can also cancel: repeating that state must not create another cancellation occurrence.
  if (current.status === "cancelled" && body.status === "cancelled") return apiSuccess(data);

  const { handleAppointmentEvent } = await import(
    "@/lib/integrations/notifications/orchestrator"
  );
  const event = body.status === "cancelled" ? "cancelled" : "updated";
  await handleAppointmentEvent(id, event, { businessId: auth.businessId });

  return apiSuccess(data);
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
) {
  const auth = await requireApiAuth(request, "write");
  if (!isApiAuth(auth)) return auth;

  const { id } = await context.params;
  const supabase = createServiceClient();

  const { data: current, error: readError } = await supabase
    .from("appointments")
    .select("id,location_id,customer_id,service_id,staff_id,status,updated_at")
    .eq("id", id)
    .eq("business_id", auth.businessId)
    .maybeSingle();
  if (readError) return apiError("Unable to read appointment", 503);
  if (!current) return apiNotFound();

  // Retained references must be explicit: cancellation must never resolve a new location.
  const hasReferences = [current.location_id, current.customer_id, current.service_id, current.staff_id]
    .every((value) => typeof value === "string" && value.length > 0);
  const validated = hasReferences ? await validateAppointmentReferences({
    client: supabase,
    businessId: auth.businessId,
    references: current,
    requireActive: { location: false, service: false, staff: false },
  }) : null;
  if (!validated?.ok) {
    if (validated?.status === 503) return apiError("Unable to validate appointment", 503);
    logger.warn("booking", "appointment_reconciliation_required", {
      businessId: auth.businessId, appointmentId: current.id,
    });
    return apiError("Appointment requires data reconciliation", 409);
  }
  if (current.status === "cancelled") {
    return apiSuccess({ id: current.id, status: "cancelled" });
  }

  const { data, error } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("business_id", auth.businessId)
    .eq("updated_at", current.updated_at)
    .neq("status", "cancelled")
    .select("id")
    .maybeSingle();

  if (error) return apiError("Unable to cancel appointment", 503);
  if (!data) return apiError("Appointment changed; reload and retry", 409);

  const { handleAppointmentEvent } = await import(
    "@/lib/integrations/notifications/orchestrator"
  );
  await handleAppointmentEvent(data.id, "cancelled", { businessId: auth.businessId });

  return apiSuccess({ id: data.id, status: "cancelled" });
}
