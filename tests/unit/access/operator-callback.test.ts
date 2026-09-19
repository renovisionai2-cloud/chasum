import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextResponse } from "next/server";

const authMocks = vi.hoisted(() => {
  const state: {
    cookies: {
      getAll: () => { name: string; value: string }[];
      setAll: (
        cookies: {
          name: string;
          value: string;
          options: Record<string, unknown>;
        }[],
        headers: Record<string, string>,
      ) => void;
    } | null;
  } = { cookies: null };
  return {
    state,
    exchangeCodeForSession: vi.fn(),
    verifyOtp: vi.fn(),
  };
});

vi.mock("@supabase/ssr", () => ({
  createServerClient: (
    _url: string,
    _key: string,
    opts: {
      cookies: NonNullable<(typeof authMocks)["state"]["cookies"]>;
    },
  ) => {
    authMocks.state.cookies = opts.cookies;
    return {
      auth: {
        exchangeCodeForSession: (code: string) =>
          authMocks.exchangeCodeForSession(code),
        verifyOtp: (args: unknown) => authMocks.verifyOtp(args),
      },
    };
  },
}));

const ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;
const originalEnv: Record<string, string | undefined> = {};

const USER_A_COOKIE_NAME = "sb-test-auth-token";
const USER_A_SESSION_COOKIE = "USER_A_SESSION_COOKIE";
const USER_B_SESSION_COOKIE = "USER_B_SESSION_COOKIE";
const SYNTHETIC_USER_B_HASH = "SYNTHETIC_USER_B_HASH";

function setCookieHeader(response: NextResponse) {
  return response.headers.getSetCookie();
}

function cookieNameValue(header: string) {
  const pair = header.split(";", 1)[0] ?? "";
  const eq = pair.indexOf("=");
  if (eq <= 0) return { name: "", value: "" };
  let value = pair.slice(eq + 1);
  try {
    value = decodeURIComponent(value);
  } catch {
    /* keep raw */
  }
  return { name: pair.slice(0, eq), value };
}

function cookieValues(response: NextResponse) {
  const out: Record<string, string> = {};
  for (const header of setCookieHeader(response)) {
    const parsed = cookieNameValue(header);
    if (parsed.name) out[parsed.name] = parsed.value;
  }
  return out;
}

async function writeSessionCookies(
  cookies: {
    name: string;
    value: string;
    options?: Record<string, unknown>;
  }[],
  headers: Record<string, string> = {},
) {
  authMocks.state.cookies?.setAll(
    cookies.map((cookie) => ({
      name: cookie.name,
      value: cookie.value,
      options: cookie.options ?? { path: "/", httpOnly: true },
    })),
    headers,
  );
}

describe("trusted operator invitation callback", () => {
  beforeEach(() => {
    for (const key of ENV_KEYS) originalEnv[key] = process.env[key];
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    authMocks.exchangeCodeForSession.mockReset();
    authMocks.verifyOtp.mockReset();
    authMocks.state.cookies = null;
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (originalEnv[key] === undefined) delete process.env[key];
      else process.env[key] = originalEnv[key];
    }
  });

  it("lets User B's invitation code replace the current session and land on dashboard", async () => {
    authMocks.exchangeCodeForSession.mockResolvedValue({
      data: {},
      error: null,
    });
    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new Request(
        "https://chasum.vercel.app/auth/callback?code=USER_B_INVITE_CODE&next=%2Fdashboard",
      ),
    );
    expect(authMocks.exchangeCodeForSession).toHaveBeenCalledWith(
      "USER_B_INVITE_CODE",
    );
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://chasum.vercel.app/dashboard",
    );
  });

  it("does not send an expired invitation into a previous tenant dashboard without exchanging", async () => {
    authMocks.exchangeCodeForSession.mockResolvedValue({
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
    authMocks.verifyOtp.mockResolvedValue({ data: {}, error: null });
    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new Request(
        "https://chasum.vercel.app/auth/callback?token_hash=TEST_HASH&type=magiclink&next=%2Fdashboard",
      ),
    );
    expect(authMocks.verifyOtp).toHaveBeenCalledTimes(1);
    expect(authMocks.verifyOtp).toHaveBeenCalledWith({
      token_hash: "TEST_HASH",
      type: "magiclink",
    });
    expect(authMocks.exchangeCodeForSession).not.toHaveBeenCalled();
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://chasum.vercel.app/dashboard",
    );
  });

  it("verifies an invite token_hash and redirects to dashboard", async () => {
    authMocks.verifyOtp.mockResolvedValue({ data: {}, error: null });
    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new Request(
        "https://chasum.vercel.app/auth/callback?token_hash=TEST_INVITE_HASH&type=invite&next=%2Fdashboard",
      ),
    );
    expect(authMocks.verifyOtp).toHaveBeenCalledWith({
      token_hash: "TEST_INVITE_HASH",
      type: "invite",
    });
    expect(authMocks.exchangeCodeForSession).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "https://chasum.vercel.app/dashboard",
    );
  });

  it("redirects a failed magiclink token_hash without logging the token", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    authMocks.verifyOtp.mockResolvedValue({
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
    const logged = warn.mock.calls
      .map((args) => args.map(String).join(" "))
      .join("\n");
    expect(logged).toContain("otp_verify_failed");
    expect(logged).not.toContain("TEST_HASH");
    expect(logged).not.toContain("token_hash=TEST_HASH");
    warn.mockRestore();
  });
});

describe("auth callback response cookie propagation", () => {
  beforeEach(() => {
    for (const key of ENV_KEYS) originalEnv[key] = process.env[key];
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    authMocks.exchangeCodeForSession.mockReset();
    authMocks.verifyOtp.mockReset();
    authMocks.state.cookies = null;
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (originalEnv[key] === undefined) delete process.env[key];
      else process.env[key] = originalEnv[key];
    }
  });

  it("puts User B's magiclink session cookie on the dashboard redirect", async () => {
    authMocks.verifyOtp.mockImplementation(async () => {
      await writeSessionCookies([
        {
          name: USER_A_COOKIE_NAME,
          value: USER_B_SESSION_COOKIE,
          options: { path: "/", httpOnly: true },
        },
      ]);
      return { data: {}, error: null };
    });
    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new Request(
        `https://chasum.vercel.app/auth/callback?token_hash=${SYNTHETIC_USER_B_HASH}&type=magiclink&next=%2Fdashboard`,
        { headers: { cookie: `${USER_A_COOKIE_NAME}=${USER_A_SESSION_COOKIE}` } },
      ),
    );

    expect(authMocks.verifyOtp).toHaveBeenCalledWith({
      token_hash: SYNTHETIC_USER_B_HASH,
      type: "magiclink",
    });
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://chasum.vercel.app/dashboard",
    );
    expect(response.headers.get("location")).not.toContain(SYNTHETIC_USER_B_HASH);
    expect(cookieValues(response)[USER_A_COOKIE_NAME]).toBe(
      USER_B_SESSION_COOKIE,
    );
    expect(cookieValues(response)[USER_A_COOKIE_NAME]).not.toBe(
      USER_A_SESSION_COOKIE,
    );
    expect(setCookieHeader(response).join(";")).toContain(USER_B_SESSION_COOKIE);
    expect(setCookieHeader(response).join(";")).not.toContain(
      USER_A_SESSION_COOKIE,
    );
  });

  it("puts User B's invite session cookie on the dashboard redirect", async () => {
    authMocks.verifyOtp.mockImplementation(async () => {
      await writeSessionCookies([
        {
          name: USER_A_COOKIE_NAME,
          value: USER_B_SESSION_COOKIE,
          options: { path: "/", httpOnly: true },
        },
      ]);
      return { data: {}, error: null };
    });
    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new Request(
        `https://chasum.vercel.app/auth/callback?token_hash=${SYNTHETIC_USER_B_HASH}&type=invite&next=%2Fdashboard`,
      ),
    );

    expect(authMocks.verifyOtp).toHaveBeenCalledWith({
      token_hash: SYNTHETIC_USER_B_HASH,
      type: "invite",
    });
    expect(response.headers.get("location")).toBe(
      "https://chasum.vercel.app/dashboard",
    );
    expect(cookieValues(response)[USER_A_COOKIE_NAME]).toBe(
      USER_B_SESSION_COOKIE,
    );
  });

  it("puts the exchanged session cookie on the code-exchange redirect", async () => {
    authMocks.exchangeCodeForSession.mockImplementation(async () => {
      await writeSessionCookies([
        {
          name: USER_A_COOKIE_NAME,
          value: USER_B_SESSION_COOKIE,
          options: { path: "/", httpOnly: true },
        },
      ]);
      return { data: {}, error: null };
    });
    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new Request(
        "https://chasum.vercel.app/auth/callback?code=USER_B_INVITE_CODE&next=%2Fdashboard",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://chasum.vercel.app/dashboard",
    );
    expect(cookieValues(response)[USER_A_COOKIE_NAME]).toBe(
      USER_B_SESSION_COOKIE,
    );
  });

  it("replaces an incoming User A session cookie with User B on the response", async () => {
    authMocks.verifyOtp.mockImplementation(async () => {
      expect(authMocks.state.cookies?.getAll()).toEqual([
        { name: USER_A_COOKIE_NAME, value: USER_A_SESSION_COOKIE },
      ]);
      await writeSessionCookies([
        {
          name: USER_A_COOKIE_NAME,
          value: USER_B_SESSION_COOKIE,
          options: { path: "/", httpOnly: true, maxAge: 3600 },
        },
      ]);
      return { data: {}, error: null };
    });
    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new Request(
        `https://chasum.vercel.app/auth/callback?token_hash=${SYNTHETIC_USER_B_HASH}&type=magiclink&next=%2Fdashboard`,
        { headers: { cookie: `${USER_A_COOKIE_NAME}=${USER_A_SESSION_COOKIE}` } },
      ),
    );

    const values = cookieValues(response);
    expect(values[USER_A_COOKIE_NAME]).toBe(USER_B_SESSION_COOKIE);
    expect(Object.values(values)).not.toContain(USER_A_SESSION_COOKIE);
    expect(response.headers.get("location")).toBe(
      "https://chasum.vercel.app/dashboard",
    );
  });

  it("forwards chunked auth cookies and a removal entry onto the response", async () => {
    const expires = new Date("2020-01-01T00:00:00.000Z");
    authMocks.verifyOtp.mockImplementation(async () => {
      await writeSessionCookies([
        {
          name: "sb-test-auth-token.0",
          value: "USER_B_CHUNK_0",
          options: { path: "/", httpOnly: true },
        },
        {
          name: "sb-test-auth-token.1",
          value: "USER_B_CHUNK_1",
          options: { path: "/", httpOnly: true },
        },
        {
          name: USER_A_COOKIE_NAME,
          value: "",
          options: { path: "/", maxAge: 0, expires },
        },
      ]);
      return { data: {}, error: null };
    });
    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new Request(
        `https://chasum.vercel.app/auth/callback?token_hash=${SYNTHETIC_USER_B_HASH}&type=magiclink&next=%2Fdashboard`,
        { headers: { cookie: `${USER_A_COOKIE_NAME}=${USER_A_SESSION_COOKIE}` } },
      ),
    );

    const values = cookieValues(response);
    expect(values["sb-test-auth-token.0"]).toBe("USER_B_CHUNK_0");
    expect(values["sb-test-auth-token.1"]).toBe("USER_B_CHUNK_1");
    expect(values[USER_A_COOKIE_NAME]).toBe("");
    const header = setCookieHeader(response).join("\n");
    expect(header).toMatch(/sb-test-auth-token\.0=USER_B_CHUNK_0/i);
    expect(header).toMatch(/sb-test-auth-token\.1=USER_B_CHUNK_1/i);
    expect(header.toLowerCase()).toMatch(/max-age=0/);
  });

  it("copies safe cache headers and ignores Location overrides from setAll", async () => {
    authMocks.verifyOtp.mockImplementation(async () => {
      await writeSessionCookies(
        [
          {
            name: USER_A_COOKIE_NAME,
            value: USER_B_SESSION_COOKIE,
            options: { path: "/" },
          },
        ],
        {
          "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
          Expires: "0",
          Pragma: "no-cache",
          Location: "https://evil.example/steal",
          "Set-Cookie": "injected=1",
          "X-Evil": "nope",
        },
      );
      return { data: {}, error: null };
    });
    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new Request(
        `https://chasum.vercel.app/auth/callback?token_hash=${SYNTHETIC_USER_B_HASH}&type=magiclink&next=%2Fdashboard`,
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://chasum.vercel.app/dashboard",
    );
    expect(response.headers.get("location")).not.toContain("evil.example");
    expect(response.headers.get("cache-control")).toBe(
      "private, no-cache, no-store, must-revalidate, max-age=0",
    );
    expect(response.headers.get("expires")).toBe("0");
    expect(response.headers.get("pragma")).toBe("no-cache");
    expect(response.headers.get("x-evil")).toBeNull();
    expect(setCookieHeader(response).join(";")).not.toContain("injected=1");
  });

  it("does not emit User B cookies or log secrets on verifyOtp failure", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    authMocks.verifyOtp.mockImplementation(async () => {
      await writeSessionCookies([
        {
          name: USER_A_COOKIE_NAME,
          value: USER_B_SESSION_COOKIE,
          options: { path: "/" },
        },
      ]);
      return { data: {}, error: { status: 403, code: "otp_expired" } };
    });
    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new Request(
        `https://chasum.vercel.app/auth/callback?token_hash=${SYNTHETIC_USER_B_HASH}&type=magiclink&next=%2Fdashboard`,
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://chasum.vercel.app/login?error=auth_callback_failed",
    );
    expect(cookieValues(response)[USER_A_COOKIE_NAME]).toBeUndefined();
    expect(setCookieHeader(response).join(";")).not.toContain(
      USER_B_SESSION_COOKIE,
    );
    const logged = warn.mock.calls
      .map((args) => args.map(String).join(" "))
      .join("\n");
    expect(logged).toContain("otp_verify_failed");
    expect(logged).not.toContain(SYNTHETIC_USER_B_HASH);
    expect(logged).not.toContain(USER_B_SESSION_COOKIE);
    warn.mockRestore();
  });

  it("does not emit User B cookies or log the auth code on exchange failure", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    authMocks.exchangeCodeForSession.mockImplementation(async () => {
      await writeSessionCookies([
        {
          name: USER_A_COOKIE_NAME,
          value: USER_B_SESSION_COOKIE,
          options: { path: "/" },
        },
      ]);
      return { data: {}, error: { status: 400, code: "code_exchange_failed" } };
    });
    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new Request(
        "https://chasum.vercel.app/auth/callback?code=SYNTHETIC_AUTH_CODE&next=%2Fdashboard",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://chasum.vercel.app/login?error=auth_callback_failed",
    );
    expect(cookieValues(response)[USER_A_COOKIE_NAME]).toBeUndefined();
    const logged = warn.mock.calls
      .map((args) => args.map(String).join(" "))
      .join("\n");
    expect(logged).toContain("code_exchange_failed");
    expect(logged).not.toContain("SYNTHETIC_AUTH_CODE");
    expect(logged).not.toContain(USER_B_SESSION_COOKIE);
    warn.mockRestore();
  });

  it("emits two same-name Set-Cookie headers with different scopes", async () => {
    authMocks.verifyOtp.mockImplementation(async () => {
      await writeSessionCookies([
        {
          name: USER_A_COOKIE_NAME,
          value: "",
          options: { domain: ".example.com", path: "/", maxAge: 0 },
        },
        {
          name: USER_A_COOKIE_NAME,
          value: "",
          options: { path: "/", maxAge: 0 },
        },
      ]);
      return { data: {}, error: null };
    });
    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new Request(
        `https://chasum.vercel.app/auth/callback?token_hash=${SYNTHETIC_USER_B_HASH}&type=magiclink&next=%2Fdashboard`,
      ),
    );

    const headers = setCookieHeader(response);
    expect(headers).toHaveLength(2);
    expect(headers[0]).toMatch(/sb-test-auth-token=/);
    expect(headers[0]).toMatch(/Domain=\.example\.com/i);
    expect(headers[0].toLowerCase()).toMatch(/max-age=0/);
    expect(headers[1]).toMatch(/sb-test-auth-token=/);
    expect(headers[1]).not.toMatch(/Domain=/i);
    expect(headers[1].toLowerCase()).toMatch(/max-age=0/);
  });

  it("preserves clear/clear/set order for the same cookie name", async () => {
    authMocks.verifyOtp.mockImplementation(async () => {
      await writeSessionCookies([
        {
          name: USER_A_COOKIE_NAME,
          value: "",
          options: { domain: ".example.com", path: "/", maxAge: 0 },
        },
        {
          name: USER_A_COOKIE_NAME,
          value: "",
          options: { path: "/", maxAge: 0 },
        },
        {
          name: USER_A_COOKIE_NAME,
          value: USER_B_SESSION_COOKIE,
          options: { path: "/", httpOnly: true, maxAge: 3600 },
        },
      ]);
      return { data: {}, error: null };
    });
    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new Request(
        `https://chasum.vercel.app/auth/callback?token_hash=${SYNTHETIC_USER_B_HASH}&type=magiclink&next=%2Fdashboard`,
        { headers: { cookie: `${USER_A_COOKIE_NAME}=${USER_A_SESSION_COOKIE}` } },
      ),
    );

    const headers = setCookieHeader(response);
    expect(headers).toHaveLength(3);
    expect(headers[0]).toMatch(/Domain=\.example\.com/i);
    expect(headers[0].toLowerCase()).toMatch(/max-age=0/);
    expect(headers[1]).not.toMatch(/Domain=/i);
    expect(headers[1].toLowerCase()).toMatch(/max-age=0/);
    expect(headers[2]).toContain(USER_B_SESSION_COOKIE);
    expect(headers[2]).not.toMatch(/Domain=/i);
    expect(response.cookies.getAll().length).toBeLessThan(headers.length);
  });

  it("forwards Partitioned on the serialized Set-Cookie", async () => {
    authMocks.verifyOtp.mockImplementation(async () => {
      await writeSessionCookies([
        {
          name: USER_A_COOKIE_NAME,
          value: USER_B_SESSION_COOKIE,
          options: { path: "/", httpOnly: true, secure: true, partitioned: true },
        },
      ]);
      return { data: {}, error: null };
    });
    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new Request(
        `https://chasum.vercel.app/auth/callback?token_hash=${SYNTHETIC_USER_B_HASH}&type=magiclink&next=%2Fdashboard`,
      ),
    );

    expect(setCookieHeader(response).join("\n")).toMatch(/;\s*Partitioned/i);
  });

  it("forwards Priority=High on the serialized Set-Cookie", async () => {
    authMocks.verifyOtp.mockImplementation(async () => {
      await writeSessionCookies([
        {
          name: USER_A_COOKIE_NAME,
          value: USER_B_SESSION_COOKIE,
          options: { path: "/", httpOnly: true, priority: "high" },
        },
      ]);
      return { data: {}, error: null };
    });
    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new Request(
        `https://chasum.vercel.app/auth/callback?token_hash=${SYNTHETIC_USER_B_HASH}&type=magiclink&next=%2Fdashboard`,
      ),
    );

    expect(setCookieHeader(response).join("\n")).toMatch(/;\s*Priority=High/i);
  });
});
