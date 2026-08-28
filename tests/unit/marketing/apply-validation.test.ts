import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { submitDesignPartnerApplication } from "@/lib/actions/design-partner";
import {
  APPLY_INDUSTRY_LABELS,
  firstInvalidApplyField,
  readDesignPartnerSubmission,
  validateDesignPartnerSubmission,
} from "@/lib/marketing/apply-validation";

vi.mock("@/lib/env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/env")>();
  return {
    ...actual,
    getResendApiKey: () => null,
  };
});

function filledForm(overrides: Record<string, string> = {}): FormData {
  const formData = new FormData();
  formData.set("business_name", "Northshore Clinic");
  formData.set("industry", "Hair Salon");
  formData.set("employees", "6–20");
  formData.set("locations", "2");
  formData.set("current_software", "Fresha");
  formData.set("monthly_activity", "120 visits");
  formData.set("pain_point", "Scheduling and payments");
  formData.set("email", "owner@example.com");
  formData.set("phone", "");
  formData.set("notes", "");
  for (const [key, value] of Object.entries(overrides)) {
    formData.set(key, value);
  }
  return formData;
}

describe("Apply field validation", () => {
  it("rejects empty industry", () => {
    const data = readDesignPartnerSubmission(filledForm({ industry: "" }));
    const result = validateDesignPartnerSubmission(data);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.industry).toBe("Select a business type.");
    }
  });

  it("rejects unknown industry values", () => {
    const data = readDesignPartnerSubmission(
      filledForm({ industry: "Not A Real Business Type" }),
    );
    const result = validateDesignPartnerSubmission(data);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.industry).toBe("Select a business type.");
    }
  });

  it("accepts and preserves a known industry including Other", () => {
    expect(APPLY_INDUSTRY_LABELS).toContain("Hair Salon");
    expect(APPLY_INDUSTRY_LABELS).toContain(
      "Other Appointment-Based Business",
    );
    const data = readDesignPartnerSubmission(
      filledForm({ industry: "Other Appointment-Based Business" }),
    );
    expect(data.industry).toBe("Other Appointment-Based Business");
    expect(validateDesignPartnerSubmission(data).ok).toBe(true);
  });

  it("preserves professional preferred_plan", () => {
    const data = readDesignPartnerSubmission(
      filledForm({ preferred_plan: "professional" }),
    );
    expect(data.preferredPlan).toBe("professional");
    expect(validateDesignPartnerSubmission(data).ok).toBe(true);
  });

  it("preserves business preferred_plan", () => {
    const data = readDesignPartnerSubmission(
      filledForm({ preferred_plan: "business" }),
    );
    expect(data.preferredPlan).toBe("business");
    expect(validateDesignPartnerSubmission(data).ok).toBe(true);
  });

  it("strips enterprise and garbage preferred_plan values", () => {
    expect(
      readDesignPartnerSubmission(filledForm({ preferred_plan: "enterprise" }))
        .preferredPlan,
    ).toBe("");
    expect(
      readDesignPartnerSubmission(filledForm({ preferred_plan: "random" }))
        .preferredPlan,
    ).toBe("");
  });

  it("returns a missing required field error", () => {
    const data = readDesignPartnerSubmission(
      filledForm({ business_name: "" }),
    );
    const result = validateDesignPartnerSubmission(data);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.business_name).toBe("Enter your business name.");
      expect(firstInvalidApplyField(result.errors)).toBe("business_name");
    }
  });

  it("rejects invalid email with field-specific copy", () => {
    const empty = validateDesignPartnerSubmission(
      readDesignPartnerSubmission(filledForm({ email: "" })),
    );
    expect(empty.ok).toBe(false);
    if (!empty.ok) {
      expect(empty.errors.email).toBe("Enter your work email.");
    }

    const invalid = validateDesignPartnerSubmission(
      readDesignPartnerSubmission(filledForm({ email: "not-an-email" })),
    );
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) {
      expect(invalid.errors.email).toBe("Enter a valid work email.");
    }
  });
});

describe("design-partner server action", () => {
  it("rejects empty industry authoritatively", async () => {
    const state = await submitDesignPartnerApplication(
      {},
      filledForm({ industry: "" }),
    );
    expect(state.ok).toBeUndefined();
    expect(state.error).toBe("Please complete all required fields.");
  });

  it("accepts a valid known industry", async () => {
    const state = await submitDesignPartnerApplication(
      {},
      filledForm({ industry: "Hair Salon" }),
    );
    expect(state).toEqual({ ok: true });
  });

  it("round-trips professional preferred_plan without billing mutation", async () => {
    const state = await submitDesignPartnerApplication(
      {},
      filledForm({ preferred_plan: "professional" }),
    );
    expect(state).toEqual({ ok: true });
    const parsed = readDesignPartnerSubmission(
      filledForm({ preferred_plan: "professional" }),
    );
    expect(parsed.preferredPlan).toBe("professional");
  });

  it("round-trips business preferred_plan", async () => {
    const parsed = readDesignPartnerSubmission(
      filledForm({ preferred_plan: "business" }),
    );
    expect(parsed.preferredPlan).toBe("business");
    const state = await submitDesignPartnerApplication(
      {},
      filledForm({ preferred_plan: "business" }),
    );
    expect(state).toEqual({ ok: true });
  });

  it("discards enterprise preferred_plan before acceptance", async () => {
    const parsed = readDesignPartnerSubmission(
      filledForm({ preferred_plan: "enterprise" }),
    );
    expect(parsed.preferredPlan).toBe("");
    const state = await submitDesignPartnerApplication(
      {},
      filledForm({ preferred_plan: "enterprise" }),
    );
    expect(state).toEqual({ ok: true });
  });

  it("returns an error for a missing required field", async () => {
    const state = await submitDesignPartnerApplication(
      {},
      filledForm({ employees: "" }),
    );
    expect(state.error).toBe("Please complete all required fields.");
  });

  it("rejects invalid email", async () => {
    const state = await submitDesignPartnerApplication(
      {},
      filledForm({ email: "owner.example.com" }),
    );
    expect(state.error).toBe("Please enter a valid email address.");
  });

  it("contains no billing, subscription, tenant, or account mutation", () => {
    const source = readFileSync(
      path.join(process.cwd(), "lib/actions/design-partner.ts"),
      "utf8",
    );
    expect(source).toContain("preferred_plan");
    expect(source).toContain("Interested plan");
    expect(source).not.toMatch(/subscription_plan_key/);
    expect(source).not.toMatch(/@\/lib\/billing/);
    expect(source).not.toMatch(/changePlan|assignPlan|stripe/i);
    expect(source).not.toMatch(/createClient|from "@\/lib\/supabase/);
    expect(source).not.toMatch(/\btenant\b/i);
    expect(source).not.toMatch(/insert\(|upsert\(/);
  });
});

describe("Meet Summer shared-form lock", () => {
  it("keeps FlagshipAlpha on default DesignPartnerForm props", () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        "components/marketing/flagship-summer/flagship-alpha.tsx",
      ),
      "utf8",
    );
    expect(source).toContain("<DesignPartnerForm />");
    expect(source).not.toContain("inlineValidation");
    expect(source).not.toContain("showRequiredMarkers");
    expect(source).not.toContain("successNote");
  });
});
