import { getPlatformOwnerEmails, getSupabaseEnv } from "@/lib/env";
import { userHasAccessibleBusiness } from "@/lib/tenancy/accessible-business";
import {
  isEnvPlatformAdminEmail,
  resolveAuthenticatedGuestAuthRedirect,
  resolveDashboardAccessRedirect,
} from "@/lib/tenancy/post-auth-destination";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function redirectWithCookies(
  request: NextRequest,
  pathname: string,
  supabaseResponse: NextResponse,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  const redirectResponse = NextResponse.redirect(url);
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });
  return redirectResponse;
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isGuestOnlyAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password");

  const isResetPasswordRoute = pathname.startsWith("/reset-password");
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isOwnerRoute = pathname.startsWith("/owner");
  const isOnboardingRoute = pathname.startsWith("/onboarding");

  const env = getSupabaseEnv();

  if (!env) {
    if (
      isDashboardRoute ||
      isOwnerRoute ||
      isResetPasswordRoute ||
      isOnboardingRoute
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "supabase_not_configured");
      return NextResponse.redirect(url);
    }

    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (
    (isDashboardRoute || isOwnerRoute || isOnboardingRoute) &&
    !user
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (isResetPasswordRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/forgot-password";
    url.searchParams.set("error", "session_expired");
    return NextResponse.redirect(url);
  }

  if (user && (isGuestOnlyAuthRoute || isDashboardRoute || isOnboardingRoute)) {
    const hasAccessibleBusiness = await userHasAccessibleBusiness(
      supabase,
      user.id,
    );
    const isPlatformAdmin = isEnvPlatformAdminEmail(
      user.email,
      getPlatformOwnerEmails(),
    );

    if (isGuestOnlyAuthRoute) {
      return redirectWithCookies(
        request,
        resolveAuthenticatedGuestAuthRedirect({
          hasAccessibleBusiness,
          isPlatformAdmin,
        }),
        supabaseResponse,
      );
    }

    if (isDashboardRoute) {
      const redirectTo = resolveDashboardAccessRedirect({
        pathname,
        hasAccessibleBusiness,
        isPlatformAdmin,
      });
      if (redirectTo) {
        return redirectWithCookies(request, redirectTo, supabaseResponse);
      }
    }

    if (isOnboardingRoute && hasAccessibleBusiness) {
      return redirectWithCookies(request, "/dashboard", supabaseResponse);
    }
  }

  return supabaseResponse;
}
