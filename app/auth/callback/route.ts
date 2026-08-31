import { getSupabaseEnv, sanitizeAuthNextPath } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { resolveAuthenticatedDestination } from "@/lib/tenancy/resolve-authenticated-destination";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

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

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const destination = await resolveAuthenticatedDestination(supabase, next);
      return NextResponse.redirect(`${origin}${destination}`);
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      const destination = await resolveAuthenticatedDestination(supabase, next);
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
