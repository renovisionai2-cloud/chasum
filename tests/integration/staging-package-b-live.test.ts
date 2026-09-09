// @vitest-environment node
/**
 * Opt-in Staging live check. Skipped unless CHASUM_STAGING_PACKAGE_B=1.
 * Does not enqueue jobs or invoke the worker.
 */
import { describe, expect, it } from "vitest";
import {
  channelAllowed,
  loadBusinessCommPreferences,
  loadCustomerCommPreferences,
} from "@/lib/communications/preferences";

const STAGING_REF = "wnfahklzaxirftyskctd";
const PROD_REF = "kxcydvhswkuzepwzzinq";
const enabled = process.env.CHASUM_STAGING_PACKAGE_B === "1";

describe.skipIf(!enabled)("Package B Staging preference loader", () => {
  it("preserves preferred method, forces marketing false, and stays tenant-scoped", async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    expect(url).toContain(STAGING_REF);
    expect(url).not.toContain(PROD_REF);
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").not.toContain(PROD_REF);

    const businessId = process.env.PKGB_BUSINESS_ID!;
    const customerId = process.env.PKGB_CUSTOMER_ID!;
    const knownId = process.env.PKGB_KNOWN_CUSTOMER_ID!;
    const foreignBusinessId = process.env.PKGB_FOREIGN_BUSINESS_ID!;

    const known = await loadCustomerCommPreferences(businessId, knownId, true);
    expect(known.marketing).toBe(false);
    expect(known.preferredMethod).toBeNull();
    expect(known.email).toBe(true);

    const prefs = await loadCustomerCommPreferences(businessId, customerId, true);
    expect(prefs.preferredMethod).toBe("email");
    expect(prefs.email).toBe(true);
    expect(prefs.sms).toBe(false);
    expect(prefs.marketing).toBe(false);

    const business = await loadBusinessCommPreferences(businessId, true);
    expect(
      channelAllowed({
        channel: "email",
        business,
        customer: prefs,
        marketing: false,
      }),
    ).toBe(true);
    expect(
      channelAllowed({
        channel: "email",
        business,
        customer: prefs,
        marketing: true,
      }),
    ).toBe(false);

    const foreign = await loadCustomerCommPreferences(
      foreignBusinessId,
      customerId,
      true,
    );
    expect(foreign.preferredMethod).toBeNull();
    expect(foreign.marketing).toBe(false);
  });
});
