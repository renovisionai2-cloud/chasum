import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

describe("canonical active-business resolver", () => {
  it("never trusts a client business id without an authorized-list check", () => {
    const action = read("lib/actions/tenancy.ts");
    expect(action).toMatch(/isAuthorizedBusinessId/);
    expect(action).toMatch(/writeActiveBusinessCookie/);
    expect(action).toMatch(/locationCookieAfterBusinessSwitch/);
    expect(action).not.toMatch(/\.from\("businesses"\)[\s\S]{0,80}\.update\(/);
    expect(action).not.toMatch(/ensure_business_for_owner/);
  });

  it("resolves dashboard tenant from owner_id plus authorized memberships", () => {
    const src = read("lib/actions/business.ts");
    expect(src).toMatch(/listAuthorizedBusinesses/);
    expect(src).toMatch(/pickActiveBusiness/);
    expect(src).toMatch(/readActiveBusinessCookie/);
    expect(src).toMatch(/eq\("owner_id", userId\)/);
    expect(src).toMatch(/from\("business_members"\)/);
    expect(src).toMatch(/getBusinessBySlug/);
  });

  it("keeps public slug lookup separate from dashboard activation", () => {
    const src = read("lib/actions/business.ts");
    const slugFn = src.slice(src.indexOf("export async function getBusinessBySlug"));
    expect(slugFn).toMatch(/eq\("slug", slug\)/);
    expect(slugFn).not.toMatch(/requireUser/);
    expect(slugFn).not.toMatch(/readActiveBusinessCookie/);
  });
});

describe("core dashboard loaders stay on the selected authorized tenant", () => {
  const files = [
    "lib/actions/customers.ts",
    "lib/actions/appointments.ts",
    "lib/actions/commerce.ts",
    "lib/actions/reports.ts",
    "lib/actions/business-management.ts",
    "lib/actions/notification-retry.ts",
    "lib/actions/location.ts",
    "lib/actions/communications.ts",
    "lib/actions/employees.ts",
    "lib/actions/services.ts",
    "lib/actions/command-centre.ts",
  ];

  it.each(files)("%s uses getOrCreateBusiness", (path) => {
    const src = read(path);
    expect(src).toMatch(/getOrCreateBusiness/);
    expect(src).not.toMatch(/maybeSingle\(\)[\s\S]{0,40}from\("businesses"\)/);
  });

  it("does not let action files pick a raw first membership instead of the resolver", () => {
    const dir = join(root, "lib/actions");
    const skipped = new Set(["business.ts", "tenancy.ts"]);
    for (const name of readdirSync(dir)) {
      if (!name.endsWith(".ts") || skipped.has(name)) continue;
      const src = read(`lib/actions/${name}`);
      expect(src, name).not.toMatch(/from\("business_members"\)/);
    }
  });
});

describe("Platform Admin naming boundary", () => {
  it("labels the control plane Platform Admin without renaming routes", () => {
    expect(read("lib/dashboard/nav.ts")).toMatch(/label: "Platform Admin"/);
    expect(read("lib/dashboard/nav.ts")).toMatch(/href: "\/dashboard\/hq"/);
    expect(read("lib/command/registry.ts")).toMatch(/Open Platform Admin/);
    expect(read("lib/command/registry.ts")).toMatch(/href: "\/dashboard\/hq"/);
  });
});
