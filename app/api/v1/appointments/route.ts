import { NextRequest } from "next/server";
import { isApiAuth, requireApiAuth } from "@/lib/api/guard";
import { apiSuccess, apiError } from "@/lib/api/response";
import { createServiceClient } from "@/lib/supabase/service";
import {
  createAppointmentBodySchema,
  formatZodError,
} from "@/lib/validation/schemas";
import { captureBookingFailure } from "@/lib/observability/logger";
import { validateAppointmentReferences } from "@/lib/api/appointment-references";

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request, "read");
  if (!isApiAuth(auth)) return auth;

  const supabase = createServiceClient();
  const start = request.nextUrl.searchParams.get("start");
  const end = request.nextUrl.searchParams.get("end");

  let query = supabase
    .from("appointments")
    .select(
      "id, start_time, end_time, status, notes, service:services(id, name), staff:staff(id, name), customer:customers(id, name, email)",
    )
    .eq("business_id", auth.businessId)
    .eq("customer.business_id", auth.businessId)
    .eq("service.business_id", auth.businessId)
    .eq("staff.business_id", auth.businessId)
    .order("start_time");

  if (start) query = query.gte("start_time", start);
  if (end) query = query.lte("start_time", end);

  const { data, error } = await query;
  if (error) return apiError(error.message, 500);

  return apiSuccess(data);
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth(request, "write");
  if (!isApiAuth(auth)) return auth;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const parsed = createAppointmentBodySchema.safeParse(json);
  if (!parsed.success) {
    return apiError(formatZodError(parsed.error), 400);
  }
  const body = parsed.data;
  const supabase = createServiceClient();

  const validated = await validateAppointmentReferences({
    client: supabase,
    businessId: auth.businessId,
    references: body,
  });
  if (!validated.ok) return apiError(validated.error, validated.status);
  const references = validated.references;

  const validation = await supabase.rpc("validate_appointment_slot", {
    p_business_id: auth.businessId,
    p_location_id: references.location_id,
    p_service_id: references.service_id,
    p_staff_id: references.staff_id,
    p_start_time: body.start_time,
    p_end_time: body.end_time,
  });

  if (validation.error) {
    await captureBookingFailure(validation.error, {
      businessId: auth.businessId,
      channel: "api",
    });
    return apiError(validation.error.message, 400);
  }

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      business_id: auth.businessId,
      ...references,
      start_time: body.start_time,
      end_time: body.end_time,
      status: body.status ?? "pending",
      notes: body.notes ?? null,
    })
    .select("*")
    .single();

  if (error) {
    await captureBookingFailure(error, {
      businessId: auth.businessId,
      channel: "api",
    });
    return apiError(error.message, 400);
  }

  const { handleAppointmentEvent } = await import(
    "@/lib/integrations/notifications/orchestrator"
  );
  await handleAppointmentEvent(data.id, "created", { businessId: auth.businessId });

  return apiSuccess(data, 201);
}
