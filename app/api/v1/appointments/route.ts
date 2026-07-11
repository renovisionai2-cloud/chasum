import { NextRequest } from "next/server";
import { authenticateApiKey, requireScope } from "@/lib/api/auth";
import { apiSuccess, apiUnauthorized, apiForbidden, apiError } from "@/lib/api/response";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request.headers.get("authorization"));
  if (!auth) return apiUnauthorized();
  if (!requireScope(auth.scopes, "read")) return apiForbidden();

  const supabase = createServiceClient();
  const start = request.nextUrl.searchParams.get("start");
  const end = request.nextUrl.searchParams.get("end");

  let query = supabase
    .from("appointments")
    .select(
      "id, start_time, end_time, status, notes, service:services(id, name), staff:staff(id, name), customer:customers(id, name, email)",
    )
    .eq("business_id", auth.businessId)
    .order("start_time");

  if (start) query = query.gte("start_time", start);
  if (end) query = query.lte("start_time", end);

  const { data, error } = await query;
  if (error) return apiError(error.message, 500);

  return apiSuccess(data);
}

export async function POST(request: NextRequest) {
  const auth = await authenticateApiKey(request.headers.get("authorization"));
  if (!auth) return apiUnauthorized();
  if (!requireScope(auth.scopes, "write")) return apiForbidden();

  const body = await request.json();
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      business_id: auth.businessId,
      service_id: body.service_id,
      staff_id: body.staff_id,
      customer_id: body.customer_id,
      start_time: body.start_time,
      end_time: body.end_time,
      status: body.status ?? "pending",
      notes: body.notes ?? null,
    })
    .select("*")
    .single();

  if (error) return apiError(error.message, 400);

  const { handleAppointmentEvent } = await import(
    "@/lib/integrations/notifications/orchestrator"
  );
  await handleAppointmentEvent(data.id, "created");

  return apiSuccess(data, 201);
}
