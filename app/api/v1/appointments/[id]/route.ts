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
import { captureBookingFailure } from "@/lib/observability/logger";

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

  const { data, error } = await supabase
    .from("appointments")
    .update(body)
    .eq("id", id)
    .eq("business_id", auth.businessId)
    .select("*")
    .single();

  if (error || !data) {
    if (error) {
      await captureBookingFailure(error, {
        businessId: auth.businessId,
        appointmentId: id,
      });
    }
    return apiNotFound();
  }

  const { handleAppointmentEvent } = await import(
    "@/lib/integrations/notifications/orchestrator"
  );
  const event = body.status === "cancelled" ? "cancelled" : "updated";
  await handleAppointmentEvent(id, event);

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

  const { error } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("business_id", auth.businessId);

  if (error) return apiNotFound();

  const { handleAppointmentEvent } = await import(
    "@/lib/integrations/notifications/orchestrator"
  );
  await handleAppointmentEvent(id, "cancelled");

  return apiSuccess({ id, status: "cancelled" });
}
