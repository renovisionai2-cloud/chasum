import {
  AUTH_CONFIRM_FAILURE_LOGIN_PATH,
  resolveAuthCallbackFailurePath,
} from "@/lib/auth/recovery";
import { sanitizeAuthNextPath } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { resolveAuthenticatedDestination } from "@/lib/tenancy/resolve-authenticated-destination";
import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const errorCode = searchParams.get("error_code");
  const next = sanitizeAuthNextPath(
    searchParams.get("next") ??
      (type === "recovery" ? "/reset-password" : "/dashboard"),
  );

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      const destination = await resolveAuthenticatedDestination(supabase, next);
      redirect(destination);
    }
  }

  redirect(
    resolveAuthCallbackFailurePath({
      type,
      next,
      errorCode,
      fallbackPath: AUTH_CONFIRM_FAILURE_LOGIN_PATH,
    }),
  );
}
