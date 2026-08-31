import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readRepo(rel: string): string {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("safe tenant onboarding source contracts", () => {
  it("does not call ensure_business_for_owner from getOrCreateBusiness or dashboard layout", () => {
    const business = readRepo("lib/actions/business.ts");
    const layout = readRepo("app/(dashboard)/layout.tsx");
    const auth = readRepo("lib/actions/auth.ts");

    expect(business).not.toMatch(/ensure_business_for_owner/);
    expect(layout).not.toMatch(/ensure_business_for_owner/);
    expect(layout).not.toMatch(/getOrCreateBusiness/);
    expect(auth).not.toMatch(/ensure_business_for_owner/);
    expect(auth).toMatch(/resolveLoginRedirect/);
    expect(auth).toMatch(/sanitizeAuthNextPath|resolveLoginRedirect/);
  });

  it("creates tenants only from the explicit onboarding action", () => {
    const create = readRepo("lib/actions/create-initial-business.ts");
    expect(create).toMatch(/ensure_business_for_owner/);
    expect(create).toMatch(/getBusiness\(\)/);
    expect(create).not.toMatch(/subscription_plan_key/);
    expect(create).not.toMatch(/user_metadata/);
  });

  it("ships /onboarding/business and routes Platform Admins to /owner", () => {
    const dest = readRepo("lib/tenancy/post-auth-destination.ts");
    expect(dest).toMatch('PLATFORM_ADMIN_PATH = "/owner"');
    expect(dest).not.toMatch('PLATFORM_ADMIN_PATH = "/dashboard/hq"');
    expect(
      readFileSync(
        path.join(
          process.cwd(),
          "app/(onboarding)/onboarding/business/page.tsx",
        ),
        "utf8",
      ),
    ).toMatch(/CreateBusinessForm/);
  });

  it("preserves GVM membership preference order in resolveBusinessForUser", () => {
    const business = readRepo("lib/actions/business.ts");
    expect(business).toMatch(/private_alpha_enabled/);
    expect(business).toMatch(/Private Alpha co-owner membership/);
    expect(business).toMatch(/primary owner_id/);
  });
});
