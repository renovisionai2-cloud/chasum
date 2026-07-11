import { NextRequest } from "next/server";
import { authenticateApiKey, requireScope } from "@/lib/api/auth";
import {
  apiSuccess,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
} from "@/lib/api/response";
import { createServiceClient } from "@/lib/supabase/service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  const auth = await authenticateApiKey(request.headers.get("authorization"));
  if (!auth) return apiUnauthorized();
  if (!requireScope(auth.scopes, "read")) return apiForbidden();

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
  const auth = await authenticateApiKey(request.headers.get("authorization"));
  if (!auth) return apiUnauthorized();
  if (!requireScope(auth.scopes, "write")) return apiForbidden();

  const { id } = await context.params;
  const body = await request.json();
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("appointments")
    .update(body)
    .eq("id", id)
    .eq("business_id", auth.businessId)
    .select("*")
    .single();

  if (error || !data) return apiNotFound();

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
  const auth = await authenticateApiKey(request.headers.get("authorization"));
  if (!auth) return apiUnauthorized();
  if (!requireScope(auth.scopes, "write")) return apiForbidden();

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
