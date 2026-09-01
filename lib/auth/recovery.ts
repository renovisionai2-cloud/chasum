import { isPasswordRecoveryPath } from "@/lib/tenancy/post-auth-destination";

export const AUTH_RECOVERY_ERROR_PATH = "/auth/recovery-error";
export const FORGOT_PASSWORD_PATH = "/forgot-password";
export const LOGIN_PATH = "/login";
export const AUTH_CALLBACK_FAILURE_LOGIN_PATH =
  "/login?error=auth_callback_failed";
export const AUTH_CONFIRM_FAILURE_LOGIN_PATH =
  "/login?error=auth_confirm_failed";

/** Login and signup stay guest-only. Forgot-password must remain reachable while signed in. */
export function isGuestOnlyAuthPath(pathname: string): boolean {
  return pathname.startsWith("/login") || pathname.startsWith("/signup");
}

export function isRecoveryCallbackAttempt(input: {
  type?: string | null;
  next?: string | null;
  errorCode?: string | null;
}): boolean {
  if (input.type?.trim().toLowerCase() === "recovery") return true;
  if (isPasswordRecoveryPath(input.next ?? "")) return true;
  return input.errorCode?.trim().toLowerCase() === "otp_expired";
}

/**
 * Failed recovery never falls through to /login (middleware would send an
 * already-signed-in unrelated session to /dashboard).
 */
export function resolveAuthCallbackFailurePath(input: {
  type?: string | null;
  next?: string | null;
  errorCode?: string | null;
  fallbackPath: string;
}): string {
  if (isRecoveryCallbackAttempt(input)) {
    return AUTH_RECOVERY_ERROR_PATH;
  }
  return input.fallbackPath;
}
