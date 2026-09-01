import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AUTH_CALLBACK_FAILURE_LOGIN_PATH,
  AUTH_CONFIRM_FAILURE_LOGIN_PATH,
  AUTH_RECOVERY_ERROR_PATH,
  FORGOT_PASSWORD_PATH,
  isGuestOnlyAuthPath,
  isRecoveryCallbackAttempt,
  resolveAuthCallbackFailurePath,
} from "@/lib/auth/recovery";

const getSupabaseEnv = vi.fn();
const createClient = vi.fn();
const resolveAuthenticatedDestination = vi.fn();
const exchangeCodeForSession = vi.fn();
const verifyOtp = vi.fn();

vi.mock("@/lib/env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/env")>();
  return {
    ...actual,
    getSupabaseEnv: (...args: unknown[]) => getSupabaseEnv(...args),
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: (...args: unknown[]) => createClient(...args),
}));

vi.mock("@/lib/tenancy/resolve-authenticated-destination", () => ({
  resolveAuthenticatedDestination: (...args: unknown[]) =>
    resolveAuthenticatedDestination(...args),
}));

import { GET as callbackGET } from "@/app/auth/callback/route";

describe("recovery callback failure destination", () => {
  it("sends failed recovery with no session to the dedicated recovery-error path", () => {
    expect(
      resolveAuthCallbackFailurePath({
        type: "recovery",
        next: "/reset-password",
        fallbackPath: AUTH_CALLBACK_FAILURE_LOGIN_PATH,
      }),
    ).toBe(AUTH_RECOVERY_ERROR_PATH);
    expect(AUTH_RECOVERY_ERROR_PATH).toBe("/auth/recovery-error");
    expect(AUTH_RECOVERY_ERROR_PATH).not.toBe("/dashboard");
    expect(AUTH_RECOVERY_ERROR_PATH).not.toBe("/login");
  });

  it("sends failed recovery to recovery-error even when another account is signed in", () => {
    expect(
      resolveAuthCallbackFailurePath({
        next: "/reset-password",
        errorCode: "otp_expired",
        fallbackPath: AUTH_CALLBACK_FAILURE_LOGIN_PATH,
      }),
    ).toBe(AUTH_RECOVERY_ERROR_PATH);
    expect(isGuestOnlyAuthPath(AUTH_RECOVERY_ERROR_PATH)).toBe(false);
  });

  it("does not treat recovery-error as a guest-only route that middleware would send to dashboard", () => {
    expect(isGuestOnlyAuthPath("/login")).toBe(true);
    expect(isGuestOnlyAuthPath("/signup")).toBe(true);
    expect(isGuestOnlyAuthPath(FORGOT_PASSWORD_PATH)).toBe(false);
    expect(isGuestOnlyAuthPath(AUTH_RECOVERY_ERROR_PATH)).toBe(false);
    expect(isGuestOnlyAuthPath("/dashboard")).toBe(false);
  });

  it("keeps non-recovery callback failures on the existing login error path", () => {
    expect(
      resolveAuthCallbackFailurePath({
        type: "email",
        next: "/dashboard",
        fallbackPath: AUTH_CALLBACK_FAILURE_LOGIN_PATH,
      }),
    ).toBe(AUTH_CALLBACK_FAILURE_LOGIN_PATH);
    expect(
      resolveAuthCallbackFailurePath({
        type: "email",
        next: "/dashboard",
        fallbackPath: AUTH_CONFIRM_FAILURE_LOGIN_PATH,
      }),
    ).toBe(AUTH_CONFIRM_FAILURE_LOGIN_PATH);
  });

  it("does not turn an open-redirect next into an off-origin failure destination", () => {
    expect(
      resolveAuthCallbackFailurePath({
        type: "recovery",
        next: "https://evil.example",
        fallbackPath: AUTH_CALLBACK_FAILURE_LOGIN_PATH,
      }),
    ).toBe(AUTH_RECOVERY_ERROR_PATH);
    expect(
      isRecoveryCallbackAttempt({
        type: "recovery",
        next: "//evil.example",
      }),
    ).toBe(true);
  });
});

describe("auth callback GET recovery routing", () => {
  beforeEach(() => {
    getSupabaseEnv.mockReset();
    createClient.mockReset();
    resolveAuthenticatedDestination.mockReset();
    exchangeCodeForSession.mockReset();
    verifyOtp.mockReset();
    getSupabaseEnv.mockReturnValue({
      url: "https://example.supabase.co",
      anonKey: "anon",
    });
    createClient.mockResolvedValue({
      auth: {
        exchangeCodeForSession,
        verifyOtp,
      },
    });
  });

  it("redirects a failed recovery code exchange to recovery-error, not dashboard", async () => {
    exchangeCodeForSession.mockResolvedValue({
      error: { message: "access_denied", code: "otp_expired" },
    });

    const response = await callbackGET(
      new Request(
        "http://localhost:3000/auth/callback?code=bad&next=%2Freset-password",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/auth/recovery-error",
    );
    expect(response.headers.get("location")).not.toContain("/dashboard");
    expect(response.headers.get("location")).not.toContain("otp_expired");
    expect(response.headers.get("location")).not.toContain("access_denied");
    expect(response.headers.get("location")).not.toContain(
      "auth_callback_failed",
    );
    expect(resolveAuthenticatedDestination).not.toHaveBeenCalled();
  });

  it("redirects an expired recovery OTP to recovery-error without exposing raw codes", async () => {
    const response = await callbackGET(
      new Request(
        "http://localhost:3000/auth/callback?error=access_denied&error_code=otp_expired&error_description=Email%20link%20is%20invalid%20or%20has%20expired",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/auth/recovery-error",
    );
    expect(response.headers.get("location")).not.toContain("otp_expired");
    expect(resolveAuthenticatedDestination).not.toHaveBeenCalled();
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("redirects a failed token-hash recovery to recovery-error", async () => {
    verifyOtp.mockResolvedValue({
      error: { message: "Token has expired or is invalid" },
    });

    const response = await callbackGET(
      new Request(
        "http://localhost:3000/auth/callback?token_hash=stale&type=recovery&next=%2Freset-password",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/auth/recovery-error",
    );
    expect(resolveAuthenticatedDestination).not.toHaveBeenCalled();
  });

  it("still routes a successful recovery to /reset-password", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });
    resolveAuthenticatedDestination.mockResolvedValue("/reset-password");

    const response = await callbackGET(
      new Request(
        "http://localhost:3000/auth/callback?code=good&next=%2Freset-password",
      ),
    );

    expect(resolveAuthenticatedDestination).toHaveBeenCalledTimes(1);
    expect(resolveAuthenticatedDestination.mock.calls[0]?.[1]).toBe(
      "/reset-password",
    );
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/reset-password",
    );
  });

  it("does not follow an off-origin next on recovery failure", async () => {
    exchangeCodeForSession.mockResolvedValue({
      error: { message: "invalid" },
    });

    const response = await callbackGET(
      new Request(
        "http://localhost:3000/auth/callback?code=bad&type=recovery&next=https://evil.example",
      ),
    );

    const location = response.headers.get("location") ?? "";
    expect(location).toBe("http://localhost:3000/auth/recovery-error");
    expect(location).not.toContain("evil.example");
  });
});
