import { NextRequest } from "next/server";
import { isApiAuth, requireApiAuth } from "@/lib/api/guard";
import { apiSuccess, apiError } from "@/lib/api/response";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request, "read");
  if (!isApiAuth(auth)) return auth;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("staff")
    .select("*, staff_services(service_id)")
    .eq("business_id", auth.businessId)
    .order("name");

  if (error) return apiError(error.message, 500);
  return apiSuccess(data);
}
