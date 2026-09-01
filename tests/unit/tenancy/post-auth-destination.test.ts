import { describe, expect, it } from "vitest";
import { sanitizeAuthNextPath } from "@/lib/env";
import {
  BUSINESS_ONBOARDING_PATH,
  DASHBOARD_PATH,
  PLATFORM_ADMIN_PATH,
  isEnvPlatformAdminEmail,
  resolveAuthenticatedGuestAuthRedirect,
  resolveDashboardAccessRedirect,
  resolveLoginRedirect,
  resolvePostAuthDestination,
} from "@/lib/tenancy/post-auth-destination";

describe("post-auth destination", () => {
  it("sends a zero-business user to business onboarding", () => {
    expect(
      resolvePostAuthDestination({
        hasAccessibleBusiness: false,
        requestedPath: "/dashboard",
      }),
    ).toBe(BUSINESS_ONBOARDING_PATH);
  });

  it("does not force an existing-business user through onboarding", () => {
    expect(
      resolvePostAuthDestination({
        hasAccessibleBusiness: true,
        requestedPath: "/dashboard",
      }),
    ).toBe(DASHBOARD_PATH);
    expect(
      resolvePostAuthDestination({
        hasAccessibleBusiness: true,
        requestedPath: BUSINESS_ONBOARDING_PATH,
      }),
    ).toBe(DASHBOARD_PATH);
  });

  it("honors an existing-business dashboard deep link", () => {
    expect(
      resolvePostAuthDestination({
        hasAccessibleBusiness: true,
        requestedPath: "/dashboard/calendar",
      }),
    ).toBe("/dashboard/calendar");
    expect(
      resolvePostAuthDestination({
        hasAccessibleBusiness: true,
        requestedPath: "/dashboard/customers?x=1",
      }),
    ).toBe("/dashboard/customers?x=1");
  });

  it("keeps GVM-style existing membership on dashboard, not onboarding", () => {
    expect(
      resolvePostAuthDestination({
        hasAccessibleBusiness: true,
        requestedPath: "/dashboard",
      }),
    ).toBe(DASHBOARD_PATH);
  });

  it("preserves password recovery", () => {
    expect(
      resolvePostAuthDestination({
        hasAccessibleBusiness: false,
        requestedPath: "/reset-password",
      }),
    ).toBe("/reset-password");
    expect(
      resolvePostAuthDestination({
        hasAccessibleBusiness: true,
        requestedPath: "/reset-password",
      }),
    ).toBe("/reset-password");
  });

  it("sends Platform Admin zero-business identities to /owner, not /dashboard/hq", () => {
    expect(PLATFORM_ADMIN_PATH).toBe("/owner");
    expect(
      resolvePostAuthDestination({
        hasAccessibleBusiness: false,
        isPlatformAdmin: true,
        requestedPath: "/dashboard",
      }),
    ).toBe("/owner");
    expect(
      resolveAuthenticatedGuestAuthRedirect({
        hasAccessibleBusiness: false,
        isPlatformAdmin: true,
      }),
    ).toBe("/owner");
  });

  it("does not treat an arbitrary email as Platform Admin", () => {
    expect(
      isEnvPlatformAdminEmail("operations@example.com", ["owner@example.com"]),
    ).toBe(false);
  });
});

describe("dashboard access without a tenant", () => {
  it("redirects a zero-business operator away from the product dashboard", () => {
    expect(
      resolveDashboardAccessRedirect({
        pathname: "/dashboard",
        hasAccessibleBusiness: false,
      }),
    ).toBe(BUSINESS_ONBOARDING_PATH);
  });

  it("sends zero-business Platform Admin from /dashboard and /dashboard/hq to /owner", () => {
    expect(
      resolveDashboardAccessRedirect({
        pathname: "/dashboard",
        hasAccessibleBusiness: false,
        isPlatformAdmin: true,
      }),
    ).toBe("/owner");
    expect(
      resolveDashboardAccessRedirect({
        pathname: "/dashboard/hq",
        hasAccessibleBusiness: false,
        isPlatformAdmin: true,
      }),
    ).toBe("/owner");
  });

  it("lets a Platform Admin stay on /owner without creating a tenant", () => {
    expect(
      resolveDashboardAccessRedirect({
        pathname: "/owner",
        hasAccessibleBusiness: false,
        isPlatformAdmin: true,
      }),
    ).toBeNull();
  });

  it("lets an existing-business user stay on dashboard", () => {
    expect(
      resolveDashboardAccessRedirect({
        pathname: "/dashboard",
        hasAccessibleBusiness: true,
      }),
    ).toBeNull();
  });
});

describe("login redirect sanitization at the post-auth boundary", () => {
  it("falls back unsafe absolute, protocol-relative, and scheme URLs", () => {
    expect(sanitizeAuthNextPath("https://evil.example")).toBe("/dashboard");
    expect(sanitizeAuthNextPath("//evil.example")).toBe("/dashboard");
    expect(sanitizeAuthNextPath("javascript:alert(1)")).toBe("/dashboard");
    expect(sanitizeAuthNextPath("data:text/html,hi")).toBe("/dashboard");
  });

  it("preserves safe internal dashboard paths", () => {
    expect(sanitizeAuthNextPath("/dashboard")).toBe("/dashboard");
    expect(sanitizeAuthNextPath("/dashboard/customers?x=1")).toBe(
      "/dashboard/customers?x=1",
    );
  });

  it("does not send a sanitized malicious redirect off-origin after login", () => {
    expect(
      resolveLoginRedirect("https://evil.example", {
        hasAccessibleBusiness: true,
      }),
    ).toBe("/dashboard");
    expect(
      resolveLoginRedirect("//evil.example", { hasAccessibleBusiness: true }),
    ).toBe("/dashboard");
    expect(
      resolveLoginRedirect("javascript:alert(1)", {
        hasAccessibleBusiness: true,
      }),
    ).toBe("/dashboard");
    expect(
      resolveLoginRedirect("data:text/html,hi", {
        hasAccessibleBusiness: true,
      }),
    ).toBe("/dashboard");
  });

  it("sends a signup-created zero-business user to explicit onboarding", () => {
    expect(
      resolveLoginRedirect("/dashboard", {
        hasAccessibleBusiness: false,
      }),
    ).toBe(BUSINESS_ONBOARDING_PATH);
  });
});
