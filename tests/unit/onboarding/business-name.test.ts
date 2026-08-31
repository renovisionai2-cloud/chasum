import { describe, expect, it } from "vitest";
import {
  preferredSlugForBusinessName,
  validateBusinessName,
} from "@/lib/onboarding/business-name";

describe("explicit business name validation", () => {
  it("requires the submitted name and trims it", () => {
    expect(validateBusinessName("  Chasum HQ  ")).toEqual({
      ok: true,
      name: "Chasum HQ",
    });
  });

  it("rejects empty and whitespace-only names", () => {
    expect(validateBusinessName("")).toMatchObject({ ok: false });
    expect(validateBusinessName("   ")).toMatchObject({ ok: false });
    expect(validateBusinessName(null)).toMatchObject({ ok: false });
  });

  it("keeps the exact characters the user entered", () => {
    const parsed = validateBusinessName("GVM Test");
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.name).toBe("GVM Test");
  });

  it("does not substitute My Business or an email prefix", () => {
    expect(validateBusinessName("")).not.toMatchObject({ name: "My Business" });
    expect(validateBusinessName("operations")).toEqual({
      ok: true,
      name: "operations",
    });
  });
});

describe("business slug from submitted name", () => {
  it("slugifies the entered name rather than a display name", () => {
    expect(preferredSlugForBusinessName("Chasum HQ", "user-1")).toBe(
      "chasum-hq",
    );
  });

  it("does not use an email prefix when the name slugifies", () => {
    expect(
      preferredSlugForBusinessName("Northshore Clinic", "aaaaaaaa-bbbb"),
    ).toBe("northshore-clinic");
  });
});
