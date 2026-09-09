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

  it("preserves marketing_consent_at across unrelated updates and sms preference", async () => {
    const { createServiceClient } = await import("@/lib/supabase/service");
    const { consentTimestampForUpdate } = await import(
      "@/lib/crm/customer-payload"
    );
    const businessId = process.env.PKGB_BUSINESS_ID!;
    const supabase = createServiceClient();
    const email = `chasum-pkgb-ts-${Date.now()}@chasum.test.invalid`;
    const { data: created, error: createError } = await supabase
      .from("customers")
      .insert({
        business_id: businessId,
        name: "Package B Timestamp",
        email,
        phone: "5550100666",
        preferred_communication_method: "sms",
        marketing_consent: true,
        marketing_consent_at: "2026-01-15T12:00:00.000Z",
        notes: "chasum-pkgb-consent-ts-20260909",
      })
      .select("id, marketing_consent, marketing_consent_at")
      .single();
    expect(createError).toBeNull();
    const id = created!.id as string;
    try {
      const { data: existing } = await supabase
        .from("customers")
        .select("id, marketing_consent, marketing_consent_at")
        .eq("id", id)
        .eq("business_id", businessId)
        .maybeSingle();
      expect(String(existing?.marketing_consent_at ?? "")).toContain(
        "2026-01-15T12:00:00",
      );
      const preserved = consentTimestampForUpdate({
        nextConsent: true,
        existingConsent: Boolean(existing?.marketing_consent),
        existingAt: existing?.marketing_consent_at ?? null,
      });
      const { error: unrelatedError } = await supabase
        .from("customers")
        .update({
          name: "Package B Timestamp Updated",
          marketing_consent: true,
          marketing_consent_at: preserved,
        })
        .eq("id", id)
        .eq("business_id", businessId);
      expect(unrelatedError).toBeNull();
      const { data: afterUnrelated } = await supabase
        .from("customers")
        .select("marketing_consent_at, preferred_communication_method")
        .eq("id", id)
        .eq("business_id", businessId)
        .maybeSingle();
      expect(afterUnrelated?.marketing_consent_at).toBe(
        existing?.marketing_consent_at,
      );

      const cleared = consentTimestampForUpdate({
        nextConsent: false,
        existingConsent: true,
        existingAt: afterUnrelated?.marketing_consent_at ?? null,
      });
      await supabase
        .from("customers")
        .update({ marketing_consent: false, marketing_consent_at: cleared })
        .eq("id", id)
        .eq("business_id", businessId);
      const { data: afterFalse } = await supabase
        .from("customers")
        .select("marketing_consent, marketing_consent_at")
        .eq("id", id)
        .eq("business_id", businessId)
        .maybeSingle();
      expect(afterFalse?.marketing_consent).toBe(false);
      expect(afterFalse?.marketing_consent_at).toBeNull();

      const granted = consentTimestampForUpdate({
        nextConsent: true,
        existingConsent: false,
        existingAt: null,
      });
      await supabase
        .from("customers")
        .update({ marketing_consent: true, marketing_consent_at: granted })
        .eq("id", id)
        .eq("business_id", businessId);
      const { data: afterTrue } = await supabase
        .from("customers")
        .select("marketing_consent, marketing_consent_at")
        .eq("id", id)
        .eq("business_id", businessId)
        .maybeSingle();
      expect(afterTrue?.marketing_consent).toBe(true);
      expect(afterTrue?.marketing_consent_at).toBeTruthy();
      expect(afterTrue?.marketing_consent_at).not.toBe(
        existing?.marketing_consent_at,
      );

      const prefs = await loadCustomerCommPreferences(businessId, id, true);
      expect(prefs.preferredMethod).toBe("sms");
      expect(prefs.email).toBe(false);
      const business = await loadBusinessCommPreferences(businessId, true);
      expect(
        channelAllowed({
          channel: "email",
          business,
          customer: prefs,
          marketing: false,
        }),
      ).toBe(false);
      expect(
        channelAllowed({
          channel: "email",
          business,
          customer: prefs,
          marketing: true,
        }),
      ).toBe(false);
    } finally {
      await supabase
        .from("customers")
        .delete()
        .eq("id", id)
        .eq("business_id", businessId);
    }
  });
});
