import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const exchangeCodeForSession = vi.fn();
const verifyOtp = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      exchangeCodeForSession,
      verifyOtp,
    },
  }),
}));

const ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;
const originalEnv: Record<string, string | undefined> = {};

describe("trusted operator invitation callback", () => {
  beforeEach(() => {
    for (const key of ENV_KEYS) originalEnv[key] = process.env[key];
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    exchangeCodeForSession.mockReset();
    verifyOtp.mockReset();
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (originalEnv[key] === undefined) delete process.env[key];
      else process.env[key] = originalEnv[key];
    }
  });

  it("lets User B's invitation code replace the current session and land on dashboard", async () => {
    exchangeCodeForSession.mockResolvedValue({ data: {}, error: null });
    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new Request(
        "https://chasum.vercel.app/auth/callback?code=USER_B_INVITE_CODE&next=%2Fdashboard",
      ),
    );
    expect(exchangeCodeForSession).toHaveBeenCalledWith("USER_B_INVITE_CODE");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://chasum.vercel.app/dashboard",
    );
  });

  it("does not send an expired invitation into a previous tenant dashboard without exchanging", async () => {
    exchangeCodeForSession.mockResolvedValue({
      data: {},
      error: { status: 403, code: "otp_expired" },
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new Request(
        "https://chasum.vercel.app/auth/callback?code=EXPIRED_INVITE&next=%2Fdashboard",
      ),
    );
    expect(response.headers.get("location")).toBe(
      "https://chasum.vercel.app/login?error=auth_callback_failed",
    );
    expect(warn.mock.calls.join(" ")).not.toContain("EXPIRED_INVITE");
    warn.mockRestore();
  });

  it("verifies a magiclink token_hash and redirects to dashboard", async () => {
    verifyOtp.mockResolvedValue({ data: {}, error: null });
    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new Request(
        "https://chasum.vercel.app/auth/callback?token_hash=TEST_HASH&type=magiclink&next=%2Fdashboard",
      ),
    );
    expect(verifyOtp).toHaveBeenCalledTimes(1);
    expect(verifyOtp).toHaveBeenCalledWith({
      token_hash: "TEST_HASH",
      type: "magiclink",
    });
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://chasum.vercel.app/dashboard",
    );
  });

  it("verifies an invite token_hash and redirects to dashboard", async () => {
    verifyOtp.mockResolvedValue({ data: {}, error: null });
    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new Request(
        "https://chasum.vercel.app/auth/callback?token_hash=TEST_INVITE_HASH&type=invite&next=%2Fdashboard",
      ),
    );
    expect(verifyOtp).toHaveBeenCalledWith({
      token_hash: "TEST_INVITE_HASH",
      type: "invite",
    });
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "https://chasum.vercel.app/dashboard",
    );
  });

  it("redirects a failed magiclink token_hash without logging the token", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    verifyOtp.mockResolvedValue({
      data: {},
      error: { status: 403, code: "otp_expired" },
    });
    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new Request(
        "https://chasum.vercel.app/auth/callback?token_hash=TEST_HASH&type=magiclink&next=%2Fdashboard",
      ),
    );
    expect(response.headers.get("location")).toBe(
      "https://chasum.vercel.app/login?error=auth_callback_failed",
    );
    const logged = warn.mock.calls.map((args) => args.map(String).join(" ")).join("\n");
    expect(logged).toContain("otp_verify_failed");
    expect(logged).not.toContain("TEST_HASH");
    expect(logged).not.toContain("token_hash=TEST_HASH");
    warn.mockRestore();
  });
});
