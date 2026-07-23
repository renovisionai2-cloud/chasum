import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  getAppUrl,
  getAuthCallbackUrl,
  getPasswordResetRedirectUrl,
  sanitizeAuthNextPath,
} from "@/lib/env";

const KEYS = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SITE_URL",
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

  it("sanitizes unsafe next paths", () => {
    expect(sanitizeAuthNextPath("/reset-password")).toBe("/reset-password");
    expect(sanitizeAuthNextPath("https://evil.example")).toBe("/dashboard");
    expect(sanitizeAuthNextPath("//evil.example")).toBe("/dashboard");
  });
});
