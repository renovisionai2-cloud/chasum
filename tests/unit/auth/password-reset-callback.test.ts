import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { readFileSync } from "node:fs";
import path from "node:path";

const exchangeCodeForSession = vi.fn();
const verifyOtp = vi.fn();
const getUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      exchangeCodeForSession,
      verifyOtp,
      getUser,
    },
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

const ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

const originalEnv: Record<string, string | undefined> = {};

describe("password reset callback hardening", () => {
  beforeEach(() => {
    for (const key of ENV_KEYS) {
      originalEnv[key] = process.env[key];
    }
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    exchangeCodeForSession.mockReset();
    verifyOtp.mockReset();
    getUser.mockReset();
  });

  afterEach(() => {
    cleanup();
    for (const key of ENV_KEYS) {
      if (originalEnv[key] === undefined) delete process.env[key];
      else process.env[key] = originalEnv[key];
    }
  });

  it("redirects recovery token_hash success to /reset-password via verifyOtp", async () => {
    verifyOtp.mockResolvedValue({ data: {}, error: null });
    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new Request(
        "https://chasum.vercel.app/auth/callback?token_hash=TEST_RECOVERY_HASH_DO_NOT_LOG&type=recovery",
      ),
    );

    expect(verifyOtp).toHaveBeenCalledTimes(1);
    expect(verifyOtp).toHaveBeenCalledWith({
      type: "recovery",
      token_hash: "TEST_RECOVERY_HASH_DO_NOT_LOG",
    });
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://chasum.vercel.app/reset-password",
    );
  });

  it("redirects recovery token_hash failure to login without logging the hash", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    verifyOtp.mockResolvedValue({
      data: {},
      error: { status: 403, code: "otp_expired" },
    });
    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new Request(
        "https://chasum.vercel.app/auth/callback?token_hash=TEST_RECOVERY_HASH_DO_NOT_LOG&type=recovery",
      ),
    );

    expect(verifyOtp).toHaveBeenCalledTimes(1);
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://chasum.vercel.app/login?error=auth_callback_failed",
    );

    const logged = warn.mock.calls.map((args) => args.map(String).join(" ")).join("\n");
    expect(logged).toContain("otp_verify_failed");
    expect(logged).not.toContain("TEST_RECOVERY_HASH_DO_NOT_LOG");
    expect(logged).not.toContain("token_hash=TEST_RECOVERY_HASH_DO_NOT_LOG");
    warn.mockRestore();
  });

  it("uses verifyOtp for token_hash recovery without PKCE code exchange", async () => {
    verifyOtp.mockResolvedValue({ data: {}, error: null });
    const { GET } = await import("@/app/auth/callback/route");
    await GET(
      new Request(
        "https://chasum.vercel.app/auth/callback?token_hash=TEST_RECOVERY_HASH_DO_NOT_LOG&type=recovery",
      ),
    );

    expect(verifyOtp).toHaveBeenCalled();
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("keeps email confirmation token_hash success on the existing dashboard path", async () => {
    verifyOtp.mockResolvedValue({ data: {}, error: null });
    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new Request(
        "https://chasum.vercel.app/auth/callback?token_hash=TEST_EMAIL_HASH_DO_NOT_LOG&type=email",
      ),
    );

    expect(verifyOtp).toHaveBeenCalledWith({
      type: "email",
      token_hash: "TEST_EMAIL_HASH_DO_NOT_LOG",
    });
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "https://chasum.vercel.app/dashboard",
    );
  });

  it("honors a safe next path for email confirmation", async () => {
    verifyOtp.mockResolvedValue({ data: {}, error: null });
    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new Request(
        "https://chasum.vercel.app/auth/callback?token_hash=TEST_EMAIL_HASH_DO_NOT_LOG&type=email&next=%2Fdashboard%2Fservices",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://chasum.vercel.app/dashboard/services",
    );
  });

  it("classifies missing auth params without exchanging a code", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new Request(
        "https://chasum.vercel.app/auth/callback?next=%2Freset-password",
      ),
    );

    expect(exchangeCodeForSession).not.toHaveBeenCalled();
    expect(verifyOtp).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "https://chasum.vercel.app/login?error=auth_callback_failed",
    );
    expect(warn.mock.calls.map((args) => args.map(String).join(" ")).join("\n")).toContain(
      "missing_auth_params",
    );
    warn.mockRestore();
  });

  it("sends unauthenticated /reset-password to forgot-password session_expired", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    const ResetPasswordPage = (await import("@/app/(auth)/reset-password/page"))
      .default;

    await expect(ResetPasswordPage()).rejects.toThrow(
      "NEXT_REDIRECT:/forgot-password?error=session_expired",
    );
  });

  it("shows a visible reset-link failure on login and links to forgot-password", async () => {
    const { render, screen } = await import("@testing-library/react");
    const LoginPage = (await import("@/app/(auth)/login/page")).default;
    const ui = await LoginPage({
      searchParams: Promise.resolve({ error: "auth_callback_failed" }),
    });
    render(ui);

    expect(
      screen.getByText(
        /that sign-in, invitation, or reset link didn't work or has expired/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /request a new one/i }),
    ).toHaveAttribute("href", "/forgot-password");
  });

  it("preserves supabase_not_configured login copy", async () => {
    const { render, screen } = await import("@testing-library/react");
    const LoginPage = (await import("@/app/(auth)/login/page")).default;
    const ui = await LoginPage({
      searchParams: Promise.resolve({ error: "supabase_not_configured" }),
    });
    render(ui);

    expect(screen.getByText(/supabase is not configured/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/that reset link didn't work or has expired/i),
    ).not.toBeInTheDocument();
  });

  it("keeps session_expired messaging on forgot-password only", () => {
    const forgot = readFileSync(
      path.join(process.cwd(), "app/(auth)/forgot-password/page.tsx"),
      "utf8",
    );
    const login = readFileSync(
      path.join(process.cwd(), "app/(auth)/login/page.tsx"),
      "utf8",
    );
    expect(forgot).toContain('error === "session_expired"');
    expect(forgot).toContain("Your reset link has expired. Please request a new one.");
    expect(login).not.toContain("session_expired");
  });

  it("does not redesign callback branching", () => {
    const source = readFileSync(
      path.join(process.cwd(), "app/auth/callback/route.ts"),
      "utf8",
    );
    expect(source).toMatch(/if \(code\) \{[\s\S]*exchangeCodeForSession\(code\)/);
    expect(source).toMatch(
      /\} else if \(tokenHash && type\) \{[\s\S]*verifyOtp\(\{/,
    );
    expect(source).toContain(
      'return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)',
    );
  });
});
