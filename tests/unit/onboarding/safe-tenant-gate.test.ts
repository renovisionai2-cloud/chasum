import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { marketingPlanIdToDbKey } from "@/lib/marketing/pricing";

const root = process.cwd();

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

describe("signup and confirmation never create a business", () => {
  it("signup only stores preferred_plan metadata and does not call tenant RPC", () => {
    const src = read("lib/actions/auth.ts");
    expect(src).toMatch(/preferred_plan/);
    expect(src).not.toMatch(/ensure_business_for_owner/);
    expect(src).not.toMatch(/getOrCreateBusiness/);
    expect(src).not.toMatch(/createInitialBusinessAction/);
    expect(src).toMatch(/resolvePostAuthDestination/);
    expect(src).toMatch(/userHasAccessibleBusiness/);
  });

  it("auth callback does not create a business", () => {
    const src = read("app/auth/callback/route.ts");
    expect(src).not.toMatch(/ensure_business_for_owner/);
    expect(src).not.toMatch(/createInitialBusinessAction/);
    expect(src).toMatch(/userHasAccessibleBusiness/);
    expect(src).toMatch(/resolvePostAuthDestination/);
  });

  it("confirm route does not create a business", () => {
    const src = read("app/auth/confirm/route.ts");
    expect(src).not.toMatch(/ensure_business_for_owner/);
    expect(src).toMatch(/userHasAccessibleBusiness/);
  });
});

describe("dashboard zero-business access does not create a tenant", () => {
  it("dashboard layout retrieves only and redirects to onboarding", () => {
    const src = read("app/(dashboard)/layout.tsx");
    expect(src).toMatch(/getBusiness/);
    expect(src).toMatch(/BUSINESS_ONBOARDING_PATH/);
    expect(src).not.toMatch(/getOrCreateBusiness/);
    expect(src).not.toMatch(/ensure_business_for_owner/);
  });

  it("middleware does not create a business when routing login or dashboard", () => {
    const src = read("lib/supabase/middleware.ts");
    expect(src).toMatch(/userHasAccessibleBusiness/);
    expect(src).not.toMatch(/ensure_business_for_owner/);
    expect(src).not.toMatch(/rpc\(/);
    expect(src).toMatch(/resolveDashboardAccessRedirect/);
    expect(src).toMatch(/resolveAuthenticatedGuestAuthRedirect/);
  });
});

describe("business onboarding is explicit", () => {
  it("onboarding page load does not create rows", () => {
    const src = read("app/(onboarding)/onboarding/business/page.tsx");
    expect(src).toMatch(/getBusiness/);
    expect(src).not.toMatch(/createInitialBusinessAction/);
    expect(src).not.toMatch(/ensure_business_for_owner/);
    expect(src).not.toMatch(/getOrCreateBusiness/);
  });

  it("explicit submit creates the submitted name via ensure_business_for_owner once", () => {
    const src = read("lib/actions/create-initial-business.ts");
    expect(src.match(/ensure_business_for_owner/g)?.length).toBe(1);
    expect(src).toMatch(/p_name: parsed\.value\.name/);
    expect(src).not.toMatch(/full_name/);
    expect(src).not.toMatch(/My Business/);
    expect(src).not.toMatch(/create_default_location/);
    expect(src).not.toMatch(/stripe/i);
    expect(src).not.toMatch(/billing_invoices/);
    expect(src).not.toMatch(/Chasum HQ/);
    expect(src).not.toMatch(/operations@/);
    expect(src).not.toMatch(/admin@/);
  });

  it("validates timezone and currency before creating a tenant", () => {
    const src = read("lib/actions/create-initial-business.ts");
    expect(src).toMatch(/validateFirstBusinessInput/);
    expect(src.indexOf("validateFirstBusinessInput")).toBeLessThan(
      src.indexOf("ensure_business_for_owner"),
    );
    expect(src).not.toMatch(/America\/New_York/);
    expect(src).not.toMatch(/\|\|\s*"usd"/);
    expect(src).not.toMatch(/normalizeCurrency/);
    expect(src.indexOf("if (!parsed.ok)")).toBeLessThan(
      src.indexOf("ensure_business_for_owner"),
    );
  });

  it("stamps the submitted timezone and currency onto the business and location", () => {
    const src = read("lib/actions/create-initial-business.ts");
    expect(src).toMatch(/timezone: input\.timezone/);
    expect(src).toMatch(/currency: input\.currency/);
    expect(src).toMatch(/from\("locations"\)/);
    expect(src).toMatch(/update\(\{ timezone: input\.timezone \}\)/);
    expect(src).toMatch(/eq\("business_id", input\.businessId\)/);
    expect(src).toMatch(/from\("location_settings"\)/);
    expect(src).toMatch(/RECOMMENDED_NEW_BUSINESS_INTERVAL_MINUTES/);
  });

  it("does not hardcode a special-case tenant in onboarding UI", () => {
    const src = read("components/onboarding/create-business-form.tsx");
    expect(src).not.toMatch(/Chasum HQ/);
    expect(src).not.toMatch(/My Business/);
    expect(src).toMatch(/businessName/);
    expect(src).toMatch(/timezone/);
    expect(src).toMatch(/currency/);
    expect(src).not.toMatch(/defaultValue="America\/New_York"/);
    expect(src).not.toMatch(/defaultValue="usd"/);
    expect(src).not.toMatch(/defaultValue="America\/Toronto"/);
    expect(src).not.toMatch(/defaultValue="cad"/);
  });

  it("keeps duplicate-submit protection for users who already have a business", () => {
    const src = read("lib/actions/create-initial-business.ts");
    expect(src).toMatch(/getBusiness/);
    expect(src.indexOf("getBusiness")).toBeLessThan(
      src.indexOf("ensure_business_for_owner"),
    );
    expect(src).toMatch(/created\.owner_id !== user\.id/);
    expect(src).toMatch(/created\.name\.trim\(\) !== parsed\.value\.name/);
  });
});

describe("preferred plan metadata maps under the current DB model", () => {
  it("maps Free marketing metadata to starter", () => {
    expect(marketingPlanIdToDbKey("free")).toBe("starter");
  });

  it("applies preferred_plan after explicit create only", () => {
    const src = read("lib/actions/create-initial-business.ts");
    expect(src).toMatch(/preferred_plan/);
    expect(src).toMatch(/marketingPlanIdToDbKey/);
    expect(src).toMatch(/subscription_plan_key/);
  });
});

describe("Platform Admin path does not require a normal tenant", () => {
  it("onboarding offers Platform Admin without creating a business", () => {
    const page = read("app/(onboarding)/onboarding/business/page.tsx");
    const form = read("components/onboarding/create-business-form.tsx");
    expect(page).toMatch(/isPlatformOwner/);
    expect(form).toMatch(/showPlatformAdmin/);
    expect(form).toMatch(/PLATFORM_ADMIN_PATH/);
  });
});
