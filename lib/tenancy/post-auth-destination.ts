import { sanitizeAuthNextPath } from "@/lib/env";

export const BUSINESS_ONBOARDING_PATH = "/onboarding/business";
export const DASHBOARD_PATH = "/dashboard";
export const PLATFORM_ADMIN_PATH = "/dashboard/hq";

export function isPasswordRecoveryPath(path: string): boolean {
  return path.startsWith("/reset-password");
}

export function isPlatformControlPath(path: string): boolean {
  return path.startsWith("/dashboard/hq") || path.startsWith("/owner");
}

export function isEnvPlatformAdminEmail(
  email: string | null | undefined,
  allowlist: string[],
): boolean {
  const normalized = email?.trim().toLowerCase() ?? "";
  if (!normalized) return false;
  return allowlist.includes(normalized);
}

/**
 * Server-side destination after authentication. Never creates a tenant.
 *
 * Users with an accessible business keep dashboard access.
 * Zero-business users go to first-business onboarding.
 * Platform Admin identities are not forced to create a normal tenant.
 */
export function resolvePostAuthDestination(input: {
  hasAccessibleBusiness: boolean;
  isPlatformAdmin?: boolean;
  requestedPath?: string | null;
}): string {
  const requested = sanitizeAuthNextPath(input.requestedPath ?? null);

  if (isPasswordRecoveryPath(requested)) {
    return requested;
  }

  if (input.hasAccessibleBusiness) {
    if (requested.startsWith(BUSINESS_ONBOARDING_PATH)) {
      return DASHBOARD_PATH;
    }
    if (
      requested.startsWith("/dashboard") ||
      requested.startsWith("/owner")
    ) {
      return requested;
    }
    return DASHBOARD_PATH;
  }

  if (input.isPlatformAdmin) {
    if (isPlatformControlPath(requested)) {
      return requested;
    }
    return PLATFORM_ADMIN_PATH;
  }

  return BUSINESS_ONBOARDING_PATH;
}

/** Login/signup while already authenticated — no tenant creation. */
export function resolveAuthenticatedGuestAuthRedirect(input: {
  hasAccessibleBusiness: boolean;
  isPlatformAdmin?: boolean;
}): string {
  return resolvePostAuthDestination({
    hasAccessibleBusiness: input.hasAccessibleBusiness,
    isPlatformAdmin: input.isPlatformAdmin,
    requestedPath: DASHBOARD_PATH,
  });
}

/**
 * Dashboard product routes require an accessible business.
 * `/dashboard/hq` is allowed through so Platform Admin can gate at the page.
 * Returns a redirect path, or null when the request may continue.
 */
export function resolveDashboardAccessRedirect(input: {
  pathname: string;
  hasAccessibleBusiness: boolean;
  isPlatformAdmin?: boolean;
}): string | null {
  if (input.hasAccessibleBusiness) return null;
  if (isPlatformControlPath(input.pathname)) return null;
  if (input.isPlatformAdmin) return PLATFORM_ADMIN_PATH;
  return BUSINESS_ONBOARDING_PATH;
}
