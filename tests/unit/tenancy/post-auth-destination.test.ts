import { describe, expect, it } from "vitest";
import {
  BUSINESS_ONBOARDING_PATH,
  DASHBOARD_PATH,
  PLATFORM_ADMIN_PATH,
  isEnvPlatformAdminEmail,
  resolveAuthenticatedGuestAuthRedirect,
  resolveDashboardAccessRedirect,
  resolvePostAuthDestination,
} from "@/lib/tenancy/post-auth-destination";

describe("post-auth destination", () => {
  it("sends a confirmed zero-business user to business onboarding", () => {
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
  });

  it("keeps multi-business users on the dashboard product, not onboarding", () => {
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
  });

  it("sends Platform Admin-only identities to the control plane, not tenant creation", () => {
    expect(
      resolvePostAuthDestination({
        hasAccessibleBusiness: false,
        isPlatformAdmin: true,
        requestedPath: "/dashboard",
      }),
    ).toBe(PLATFORM_ADMIN_PATH);
    expect(
      resolveAuthenticatedGuestAuthRedirect({
        hasAccessibleBusiness: false,
        isPlatformAdmin: true,
      }),
    ).toBe(PLATFORM_ADMIN_PATH);
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

  it("does not create a tenant while allowing Platform Admin routes through", () => {
    expect(
      resolveDashboardAccessRedirect({
        pathname: "/dashboard/hq",
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
