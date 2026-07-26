import { describe, expect, it } from "vitest";
import {
  isPrimaryNavActive,
  isResourcesNavActive,
  isSupportNavActive,
  normalizePathname,
} from "@/lib/marketing/nav-active";

describe("normalizePathname", () => {
  it("strips trailing slashes except root", () => {
    expect(normalizePathname("/")).toBe("/");
    expect(normalizePathname("/pricing/")).toBe("/pricing");
    expect(normalizePathname("/contact")).toBe("/contact");
  });
});

describe("isPrimaryNavActive", () => {
  it("activates only the matching route", () => {
    expect(isPrimaryNavActive("/pricing", "/pricing")).toBe(true);
    expect(isPrimaryNavActive("/contact", "/pricing")).toBe(false);
    expect(isPrimaryNavActive("/meet-summer", "/meet-summer")).toBe(true);
    expect(isPrimaryNavActive("/platform", "/platform")).toBe(true);
    expect(isPrimaryNavActive("/product-tour", "/platform")).toBe(false);
  });

  it("never activates hash-only homepage anchors by pathname", () => {
    expect(isPrimaryNavActive("/", "/#platform")).toBe(false);
    expect(isPrimaryNavActive("/pricing", "/#pricing")).toBe(false);
  });

  it("allows genuine nested section routes", () => {
    expect(isPrimaryNavActive("/platform/overview", "/platform")).toBe(true);
  });
});

describe("isSupportNavActive", () => {
  it("is active on contact, not on pricing", () => {
    expect(isSupportNavActive("/contact", "/contact")).toBe(true);
    expect(isSupportNavActive("/pricing", "/contact")).toBe(false);
    expect(isSupportNavActive("/contact/support", "/contact")).toBe(true);
  });
});

describe("isResourcesNavActive", () => {
  it("activates when a resource route is current", () => {
    const resources = ["/private-alpha", "/security", "/status"] as const;
    expect(isResourcesNavActive("/security", resources)).toBe(true);
    expect(isResourcesNavActive("/pricing", resources)).toBe(false);
    expect(isResourcesNavActive("/contact", resources)).toBe(false);
  });
});
