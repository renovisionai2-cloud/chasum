import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createClient, providerSignOut, redirect } = vi.hoisted(() => ({
  createClient: vi.fn(),
  providerSignOut: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("next/navigation", () => ({ redirect }));

import { signOut } from "@/lib/actions/auth";

const ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;
const originalEnv: Record<(typeof ENV_KEYS)[number], string | undefined> = {
  NEXT_PUBLIC_SUPABASE_URL: undefined,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
};

const submitSignOut = () => signOut({}, new FormData());

describe("sign-out error handling", () => {
  beforeEach(() => {
    for (const key of ENV_KEYS) originalEnv[key] = process.env[key];
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    providerSignOut.mockReset();
    createClient.mockReset();
    redirect.mockReset();
    createClient.mockResolvedValue({ auth: { signOut: providerSignOut } });
    redirect.mockImplementation((url: string) => {
      throw new Error(`NEXT_REDIRECT:${url}`);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    for (const key of ENV_KEYS) {
      if (originalEnv[key] === undefined) delete process.env[key];
      else process.env[key] = originalEnv[key];
    }
  });

  it("uses the existing default global sign-out scope and redirects on success", async () => {
    providerSignOut.mockResolvedValue({ error: null });

    await expect(submitSignOut()).rejects.toThrow("NEXT_REDIRECT:/login");

    expect(providerSignOut).toHaveBeenCalledTimes(1);
    expect(providerSignOut).toHaveBeenCalledWith();
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("returns a safe visible error and does not redirect when Supabase rejects sign-out", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    providerSignOut.mockResolvedValue({
      error: {
        name: "AuthApiError",
        message: "SENSITIVE_PROVIDER_DETAIL",
        code: "session_not_found",
        status: 500,
      },
    });

    const result = await submitSignOut();

    expect(result).toEqual({
      error: "We couldn't sign you out. Please try again.",
    });
    expect(redirect).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith("[auth.signOut] sign_out_failed", {
      code: "session_not_found",
      status: 500,
    });
    expect(JSON.stringify(warn.mock.calls)).not.toContain(
      "SENSITIVE_PROVIDER_DETAIL",
    );
  });

  it("returns the same safe error when the provider call throws", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    providerSignOut.mockRejectedValue(
      new Error("SENSITIVE_THROWN_PROVIDER_DETAIL"),
    );

    await expect(submitSignOut()).resolves.toEqual({
      error: "We couldn't sign you out. Please try again.",
    });

    expect(redirect).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith("[auth.signOut] unexpected_failure");
    expect(JSON.stringify(error.mock.calls)).not.toContain(
      "SENSITIVE_THROWN_PROVIDER_DETAIL",
    );
  });

  it("returns the same safe error when creating the server client throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    createClient.mockRejectedValue(new Error("client construction failed"));

    await expect(submitSignOut()).resolves.toEqual({
      error: "We couldn't sign you out. Please try again.",
    });

    expect(providerSignOut).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("preserves the login redirect when Supabase is not configured", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    await expect(submitSignOut()).rejects.toThrow("NEXT_REDIRECT:/login");

    expect(createClient).not.toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("binds every sign-out surface to action state and renders returned errors", () => {
    const dashboard = readFileSync(
      path.join(process.cwd(), "components/dashboard/sidebar.tsx"),
      "utf8",
    );
    const owner = readFileSync(
      path.join(process.cwd(), "components/owner/shell.tsx"),
      "utf8",
    );
    const accessDenied = readFileSync(
      path.join(
        process.cwd(),
        "components/auth/access-denied-sign-out.tsx",
      ),
      "utf8",
    );
    const accessDeniedPage = readFileSync(
      path.join(process.cwd(), "app/(auth)/access-denied/page.tsx"),
      "utf8",
    );

    expect(dashboard.match(/useActionState\(\s*signOut,/g)).toHaveLength(2);
    expect(dashboard).not.toContain("<form action={signOut}>");
    expect(dashboard).toContain("state.error");
    expect(dashboard).toContain("signOutState.error");

    expect(owner.match(/useActionState\(\s*signOut,/g)).toHaveLength(1);
    expect(owner).not.toContain("<form action={signOut}>");
    expect(owner).toContain("signOutState.error");

    expect(accessDenied.match(/useActionState\(\s*signOut,/g)).toHaveLength(1);
    expect(accessDenied).toContain("state.error");
    expect(accessDeniedPage).toContain("<AccessDeniedSignOut />");
    expect(accessDeniedPage).not.toContain("<form action={signOut}>");
  });
});
