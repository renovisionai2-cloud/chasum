import { describe, expect, it } from "vitest";
import {
  collectExactPhoneMatches,
  CONTACT_REQUIRED_MESSAGE,
  customerEmailLabel,
  eligibleEmailOrBlank,
  isEligibleCustomerEmail,
  isLegacyPlaceholderEmail,
  phonesMatchExactly,
  readEmailField,
  resolveEmailUpdate,
  validateCreateContact,
} from "@/lib/customers/contact-identity";

function form(entries: Record<string, string | undefined>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    if (value !== undefined) data.set(key, value);
  }
  return data;
}

describe("contact identity", () => {
  it("stores a missing email as null and accepts a usable phone", () => {
    const result = validateCreateContact({ email: "  ", phone: "+44 20 7946 0958" });
    expect(result).toEqual({
      ok: true,
      email: null,
      phone: "+44 20 7946 0958",
    });
  });

  it("accepts name-equivalent contact of email only and lowercases it", () => {
    expect(validateCreateContact({ email: " Ada@Example.INVALID " })).toEqual({
      ok: true,
      email: "ada@example.invalid",
      phone: null,
    });
  });

  it("rejects name-only contact", () => {
    const result = validateCreateContact({ email: "", phone: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe(CONTACT_REQUIRED_MESSAGE);
  });

  it("never treats an empty string as an email", () => {
    expect(readEmailField(form({ email: "   " }))).toEqual({
      kind: "set",
      email: null,
    });
    expect(readEmailField(form({}))).toEqual({ kind: "omit" });
  });

  it("rejects manufactured and malformed addresses", () => {
    expect(isLegacyPlaceholderEmail("phone.4165550100@chasum.local")).toBe(true);
    expect(isEligibleCustomerEmail("phone.4165550100@chasum.local")).toBe(false);
    expect(isEligibleCustomerEmail(null)).toBe(false);
    expect(isEligibleCustomerEmail("not-an-email")).toBe(false);
    expect(validateCreateContact({ email: "phone.1@chasum.local" }).ok).toBe(false);
    expect(eligibleEmailOrBlank("phone.1@chasum.local")).toBe("");
    expect(customerEmailLabel("phone.1@chasum.local")).toBe("No email on file");
    expect(customerEmailLabel(null)).toBe("No email on file");
  });

  it("matches exact digits only and preserves display text", () => {
    expect(phonesMatchExactly("(416) 555-0100", "4165550100")).toBe(true);
    expect(phonesMatchExactly("5550100", "4165550100")).toBe(false);
    expect(phonesMatchExactly("+44 20 7946 0958", "442079460958")).toBe(true);
    expect(phonesMatchExactly("123", "123")).toBe(false);
  });

  it("does not clear email when the field is absent or consent-only", () => {
    expect(
      resolveEmailUpdate({
        field: { kind: "omit" },
        existingEmail: "ada@example.invalid",
        nextPhone: null,
        consentOnly: false,
      }),
    ).toEqual({ omit: true });
    expect(
      resolveEmailUpdate({
        field: { kind: "set", email: null },
        existingEmail: null,
        nextPhone: "4165550100",
        consentOnly: true,
      }),
    ).toEqual({ omit: true });
  });

  it("clears a real email only when a usable phone remains", () => {
    expect(
      resolveEmailUpdate({
        field: { kind: "set", email: null },
        existingEmail: "ada@example.invalid",
        nextPhone: "4165550100",
        consentOnly: false,
      }),
    ).toEqual({ omit: false, email: null });
    const blocked = resolveEmailUpdate({
      field: { kind: "set", email: null },
      existingEmail: "ada@example.invalid",
      nextPhone: "123",
      consentOnly: false,
    });
    expect("error" in blocked).toBe(true);
  });

  it("leaves a legacy placeholder untouched when the form reposts it", () => {
    expect(
      resolveEmailUpdate({
        field: {
          kind: "invalid",
          reason: "placeholder",
          error: "nope",
        },
        existingEmail: "phone.4165550100@chasum.local",
        nextPhone: "4165550100",
        consentOnly: false,
      }),
    ).toEqual({ omit: true });
  });

  it("fails closed when a phone page errors or the scan is truncated", async () => {
    const failed = await collectExactPhoneMatches({
      digits: "4165550100",
      fetchPage: async () => ({ data: null, error: { message: "db down" } }),
    });
    expect(failed.ok).toBe(false);

    const rows = Array.from({ length: 60 }, (_, i) => ({
      id: `c-${String(i).padStart(3, "0")}`,
      name: `Person ${i}`,
      email: null,
      phone: i === 55 ? "(416) 555-0100" : `555000${i}`,
    }));
    const found = await collectExactPhoneMatches({
      digits: "4165550100",
      pageSize: 25,
      fetchPage: async (from, pageSize) => ({
        data: rows.slice(from, from + pageSize),
        error: null,
      }),
    });
    expect(found.ok).toBe(true);
    if (found.ok) expect(found.matches.map((row) => row.id)).toEqual(["c-055"]);

    const truncated = await collectExactPhoneMatches({
      digits: "4165550100",
      pageSize: 10,
      maxRows: 20,
      fetchPage: async (from, pageSize) => ({
        data: rows.slice(from, from + pageSize),
        error: null,
      }),
    });
    expect(truncated.ok).toBe(false);
  });
});
