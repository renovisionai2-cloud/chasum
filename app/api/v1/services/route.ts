import { NextRequest } from "next/server";
import { authenticateApiKey, requireScope } from "@/lib/api/auth";
import { apiSuccess, apiUnauthorized, apiForbidden, apiError } from "@/lib/api/response";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(_request: NextRequest) {
  const auth = await authenticateApiKey(_request.headers.get("authorization"));
  if (!auth) return apiUnauthorized();
  if (!requireScope(auth.scopes, "read")) return apiForbidden();

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", auth.businessId)
    .order("name");

  if (error) return apiError(error.message, 500);
  return apiSuccess(data);
}
