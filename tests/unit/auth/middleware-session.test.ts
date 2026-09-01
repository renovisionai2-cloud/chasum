import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { AUTH_RECOVERY_ERROR_PATH } from "@/lib/auth/recovery";
import { config } from "@/middleware";

const getSupabaseEnv = vi.fn();
const getPlatformOwnerEmails = vi.fn();
const userHasAccessibleBusiness = vi.fn();
const getUser = vi.fn();

vi.mock("@/lib/env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/env")>();
  return {
    ...actual,
    getSupabaseEnv: (...args: unknown[]) => getSupabaseEnv(...args),
    getPlatformOwnerEmails: (...args: unknown[]) =>
      getPlatformOwnerEmails(...args),
  };
});

vi.mock("@/lib/tenancy/accessible-business", () => ({
  userHasAccessibleBusiness: (...args: unknown[]) =>
    userHasAccessibleBusiness(...args),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: {
      getUser: (...args: unknown[]) => getUser(...args),
    },
  }),
}));

import { updateSession } from "@/lib/supabase/middleware";

function requestFor(path: string) {
  return new NextRequest(new URL(path, "http://localhost:3000"));
}

function redirectPath(response: Response) {
  const location = response.headers.get("location");
  if (!location) return null;
  return new URL(location).pathname;
}

describe("auth session middleware recovery policy", () => {
  beforeEach(() => {
    getSupabaseEnv.mockReset();
    getPlatformOwnerEmails.mockReset();
    userHasAccessibleBusiness.mockReset();
    getUser.mockReset();
    getSupabaseEnv.mockReturnValue({
      url: "https://example.supabase.co",
      anonKey: "anon",
    });
    getPlatformOwnerEmails.mockReturnValue([]);
  });

  it("includes recovery-error in the matcher so session cookies can refresh without a guest redirect", () => {
    expect(config.matcher).toContain("/auth/recovery-error");
    expect(config.matcher).toContain("/login");
    expect(config.matcher).toContain("/forgot-password");
  });

  it("keeps an authenticated user on recovery-error instead of dashboard", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-a", email: "a@example.com" } },
    });
    userHasAccessibleBusiness.mockResolvedValue(true);

    const response = await updateSession(
      requestFor(AUTH_RECOVERY_ERROR_PATH),
    );

    expect(redirectPath(response)).toBeNull();
    expect(userHasAccessibleBusiness).not.toHaveBeenCalled();
  });

  it("still redirects an authenticated user away from /login", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-a", email: "a@example.com" } },
    });
    userHasAccessibleBusiness.mockResolvedValue(true);

    const response = await updateSession(requestFor("/login"));

    expect(redirectPath(response)).toBe("/dashboard");
  });

  it("lets an authenticated user open /forgot-password to request a new reset link", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-a", email: "a@example.com" } },
    });
    userHasAccessibleBusiness.mockResolvedValue(true);

    const response = await updateSession(requestFor("/forgot-password"));

    expect(redirectPath(response)).toBeNull();
    expect(userHasAccessibleBusiness).not.toHaveBeenCalled();
  });

  it("still sends an unauthenticated /reset-password visit to forgot-password", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const response = await updateSession(requestFor("/reset-password"));

    expect(redirectPath(response)).toBe("/forgot-password");
    expect(new URL(response.headers.get("location") ?? "").searchParams.get("error")).toBe(
      "session_expired",
    );
  });
});
