import { NextResponse } from "next/server";
import {
  getCronSecret,
  getResendApiKey,
  getServiceRoleKey,
  getSupabaseEnv,
  getTwilioConfig,
  isProductionRuntime,
} from "@/lib/env";

/**
 * Lightweight production readiness probe — no secrets in the response.
 * Used during GVM go-live verification.
 */
export async function GET() {
  const supabase = Boolean(getSupabaseEnv());
  const serviceRole = Boolean(getServiceRoleKey());
  const email = Boolean(getResendApiKey());
  const cronSecret = Boolean(getCronSecret());
  const sms = Boolean(getTwilioConfig());
  const production = isProductionRuntime();

  const requiredOk = supabase && serviceRole && email && cronSecret;
  const ok = production ? requiredOk : supabase && serviceRole;

  return NextResponse.json(
    {
      ok,
      production,
      checks: {
        supabase,
        serviceRole,
        email: email ? "configured" : "missing",
        cronSecret: cronSecret ? "configured" : "missing",
        sms: sms ? "configured" : "optional_missing",
      },
      timestamp: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 },
  );
}
