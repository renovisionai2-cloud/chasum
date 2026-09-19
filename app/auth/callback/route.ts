import { getSupabaseEnv, sanitizeAuthNextPath } from "@/lib/env";
import { logger } from "@/lib/observability/logger";
import { createAuthCallbackClient } from "@/lib/supabase/auth-callback";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

type CallbackFailureClassification =
  | "code_exchange_failed"
  | "otp_verify_failed"
  | "missing_auth_params";

function authErrorFields(error: { status?: number; code?: string } | null) {
  return {
    errorStatus: typeof error?.status === "number" ? error.status : undefined,
    errorCode: typeof error?.code === "string" ? error.code : undefined,
  };
}

function logAuthCallbackFailure(
  classification: CallbackFailureClassification,
  details: {
    codePresent: boolean;
    hashPresent: boolean;
    authType: EmailOtpType | null;
    error?: { status?: number; code?: string } | null;
  },
) {
  logger.warn("auth.callback", classification, {
    classification,
    codePresent: details.codePresent,
    hashPresent: details.hashPresent,
    authType: details.authType,
    ...authErrorFields(details.error ?? null),
  });
}

export async function GET(request: Request) {
  if (!getSupabaseEnv()) {
    const { origin } = new URL(request.url);
    return NextResponse.redirect(
      `${origin}/login?error=supabase_not_configured`,
    );
  }

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = sanitizeAuthNextPath(
    searchParams.get("next") ??
      (type === "recovery" ? "/reset-password" : "/dashboard"),
  );

  const { supabase, redirectWithAuthCookies } =
    createAuthCallbackClient(request);

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return redirectWithAuthCookies(`${origin}${next}`);
    }
    logAuthCallbackFailure("code_exchange_failed", {
      codePresent: true,
      hashPresent: Boolean(tokenHash),
      authType: type,
      error,
    });
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      return redirectWithAuthCookies(`${origin}${next}`);
    }
    logAuthCallbackFailure("otp_verify_failed", {
      codePresent: false,
      hashPresent: true,
      authType: type,
      error,
    });
  } else {
    logAuthCallbackFailure("missing_auth_params", {
      codePresent: Boolean(code),
      hashPresent: Boolean(tokenHash),
      authType: type,
    });
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
