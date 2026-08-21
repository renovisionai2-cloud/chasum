import { getPlatformOwnerEmails, getSupabaseEnv, sanitizeAuthNextPath } from "@/lib/env";
import { isPlatformOwner } from "@/lib/owner/auth";
import { createClient } from "@/lib/supabase/server";
import { userHasAccessibleBusiness } from "@/lib/tenancy/accessible-business";
import {
  BUSINESS_ONBOARDING_PATH,
  isEnvPlatformAdminEmail,
  resolvePostAuthDestination,
} from "@/lib/tenancy/post-auth-destination";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

async function resolveAuthenticatedDestination(
  supabase: ServerSupabase,
  next: string,
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return "/login";
  }

  const hasAccessibleBusiness = await userHasAccessibleBusiness(
    supabase,
    user.id,
  );
  const isPlatformAdmin =
    (await isPlatformOwner(user)) ||
    isEnvPlatformAdminEmail(user.email, getPlatformOwnerEmails());

  return resolvePostAuthDestination({
    hasAccessibleBusiness,
    isPlatformAdmin,
    requestedPath: next,
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
      (type === "recovery" ? "/reset-password" : BUSINESS_ONBOARDING_PATH),
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

