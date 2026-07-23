import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  getAppUrl,
  getAppUrlFromRequestHeaders,
  getAuthCallbackUrl,
  getPasswordResetRedirectUrl,
  normalizeSupabaseUrl,
  sanitizeAuthNextPath,
  getSupabaseEnv,
} from "@/lib/env";

const KEYS = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "VERCEL_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
  "VERCEL_ENV",
  "NODE_ENV",
] as const;

describe("auth redirect URL helpers", () => {
  const original: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of KEYS) {
      original[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of KEYS) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    }
  });

  it("normalizes APP_URL without protocol and strips trailing slash", () => {
    process.env.NEXT_PUBLIC_APP_URL = "chasum.vercel.app/";
    expect(getAppUrl()).toBe("https://chasum.vercel.app");
  });

  it("falls back to Vercel production host when APP_URL is localhost in production", () => {
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    process.env.VERCEL_ENV = "production";
    process.env.NODE_ENV = "production";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "chasum.vercel.app";
    expect(getAppUrl()).toBe("https://chasum.vercel.app");
  });

  it("builds a valid password reset redirectTo", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://chasum.vercel.app";
    expect(getPasswordResetRedirectUrl()).toBe(
      "https://chasum.vercel.app/auth/callback?next=%2Freset-password",
    );
    expect(getAuthCallbackUrl("/reset-password")).toBe(
      getPasswordResetRedirectUrl(),
    );
  });

  it("prefers request origin override for password reset redirectTo", () => {
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    expect(
      getPasswordResetRedirectUrl("https://chasum.vercel.app"),
    ).toBe(
      "https://chasum.vercel.app/auth/callback?next=%2Freset-password",
    );
  });

  it("reads app origin from forwarded request headers", () => {
    const headers = new Headers({
      "x-forwarded-host": "chasum.vercel.app",
      "x-forwarded-proto": "https",
    });
    expect(getAppUrlFromRequestHeaders(headers)).toBe(
      "https://chasum.vercel.app",
    );
  });

  it("ignores localhost request hosts", () => {
    const headers = new Headers({ host: "localhost:3000" });
    expect(getAppUrlFromRequestHeaders(headers)).toBeNull();
  });

  it("sanitizes unsafe next paths", () => {
    expect(sanitizeAuthNextPath("/reset-password")).toBe("/reset-password");
    expect(sanitizeAuthNextPath("https://evil.example")).toBe("/dashboard");
    expect(sanitizeAuthNextPath("//evil.example")).toBe("/dashboard");
  });
});

describe("normalizeSupabaseUrl", () => {
  it("strips /rest/v1 which causes Invalid path on Auth recover", () => {
    expect(
      normalizeSupabaseUrl("https://abc.supabase.co/rest/v1"),
    ).toBe("https://abc.supabase.co");
    expect(
      normalizeSupabaseUrl("https://abc.supabase.co/rest/v1/"),
    ).toBe("https://abc.supabase.co");
  });

  it("strips other API path prefixes and trailing slashes", () => {
    expect(normalizeSupabaseUrl("https://abc.supabase.co/auth/v1")).toBe(
      "https://abc.supabase.co",
    );
    expect(normalizeSupabaseUrl("https://abc.supabase.co/")).toBe(
      "https://abc.supabase.co",
    );
  });

  it("leaves a clean project origin unchanged", () => {
    expect(normalizeSupabaseUrl("https://abc.supabase.co")).toBe(
      "https://abc.supabase.co",
    );
  });

  it("normalizes via getSupabaseEnv", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL =
      "https://abc.supabase.co/rest/v1";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    expect(getSupabaseEnv()?.url).toBe("https://abc.supabase.co");
  });
});
