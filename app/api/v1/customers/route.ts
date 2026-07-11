import { NextRequest } from "next/server";
import { authenticateApiKey, requireScope } from "@/lib/api/auth";
import { apiSuccess, apiUnauthorized, apiForbidden, apiError } from "@/lib/api/response";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request.headers.get("authorization"));
  if (!auth) return apiUnauthorized();
  if (!requireScope(auth.scopes, "read")) return apiForbidden();

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("business_id", auth.businessId)
    .order("name");

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
    .from("customers")
    .insert({
      business_id: auth.businessId,
      name: body.name,
      email: body.email,
      phone: body.phone ?? null,
      notes: body.notes ?? null,
    })
    .select("*")
    .single();

  if (error) return apiError(error.message, 400);
  return apiSuccess(data, 201);
}
