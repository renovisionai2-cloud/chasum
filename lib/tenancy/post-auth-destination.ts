import { sanitizeAuthNextPath } from "@/lib/env";

export const BUSINESS_ONBOARDING_PATH = "/onboarding/business";
export const DASHBOARD_PATH = "/dashboard";
/** Platform Admin / Control Centre — not /dashboard/hq, not the Chasum HQ tenant. */
export const PLATFORM_ADMIN_PATH = "/owner";

export function isPasswordRecoveryPath(path: string): boolean {
  return path.startsWith("/reset-password");
}

export function isPlatformControlPath(path: string): boolean {
  return path === "/owner" || path.startsWith("/owner/");
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
 * Existing accessible business → dashboard (or a safe requested internal path).
 * Zero-business Platform Admin → /owner.
 * Otherwise → /onboarding/business.
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
 * /owner is allowed through so Platform Admin can use the control plane.
 * /dashboard/hq is not a zero-business admin landing (legacy surface).
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

/** Sanitize a Login form redirect, then apply the onboarding gate. */
export function resolveLoginRedirect(
  rawRedirect: string | null | undefined,
  input: { hasAccessibleBusiness: boolean; isPlatformAdmin?: boolean },
): string {
  return resolvePostAuthDestination({
    hasAccessibleBusiness: input.hasAccessibleBusiness,
    isPlatformAdmin: input.isPlatformAdmin,
    requestedPath: rawRedirect,
  });
}
