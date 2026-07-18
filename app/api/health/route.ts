import { NextResponse } from "next/server";
import {
  getCronSecret,
  getResendApiKey,
  getServiceRoleKey,
  getStripeSecretKey,
  getSupabaseEnv,
  getTwilioConfig,
  isProductionRuntime,
} from "@/lib/env";
import { isSentryEnabled } from "@/lib/observability/sentry";
import { checkRateLimit, clientIpFromHeaders, rateLimitHeaders } from "@/lib/security/rate-limit";
import { allowSoftSchemaFallback } from "@/lib/supabase/errors";

/**
 * Lightweight production readiness probe — no secrets in the response.
 */
export async function GET(request: Request) {
  const ip = clientIpFromHeaders(request.headers);
  const limit = checkRateLimit({
    key: `health:${ip}`,
    limit: 60,
    windowMs: 60_000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, error: "Rate limit exceeded" },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  const started = Date.now();
  const supabase = Boolean(getSupabaseEnv());
  const serviceRole = Boolean(getServiceRoleKey());
  const email = Boolean(getResendApiKey());
  const cronSecret = Boolean(getCronSecret());
  const sms = Boolean(getTwilioConfig());
  const stripe = Boolean(getStripeSecretKey());
  const sentry = isSentryEnabled();
  const production = isProductionRuntime();
  const softSchema = allowSoftSchemaFallback();

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
        stripe: stripe ? "configured" : "optional_missing",
        sentry: sentry ? "configured" : "optional_missing",
        softSchemaFallbacks: softSchema ? "enabled" : "disabled",
      },
      latencyMs: Date.now() - started,
      timestamp: new Date().toISOString(),
    },
    { status: ok ? 200 : 503, headers: rateLimitHeaders(limit) },
  );
}
