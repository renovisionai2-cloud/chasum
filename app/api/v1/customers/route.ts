import { NextRequest } from "next/server";
import { isApiAuth, requireApiAuth } from "@/lib/api/guard";
import { apiSuccess, apiError } from "@/lib/api/response";
import { createServiceClient } from "@/lib/supabase/service";
import {
  createCustomerBodySchema,
  formatZodError,
} from "@/lib/validation/schemas";

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(request, "read");
  if (!isApiAuth(auth)) return auth;

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
  const auth = await requireApiAuth(request, "write");
  if (!isApiAuth(auth)) return auth;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const parsed = createCustomerBodySchema.safeParse(json);
  if (!parsed.success) {
    return apiError(formatZodError(parsed.error), 400);
  }
  const body = parsed.data;
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
