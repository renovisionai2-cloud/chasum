import { describe, expect, it } from "vitest";
import {
  createSupportReference,
  isValidSupportReference,
  normalizeSupportReference,
  SUPPORT_REFERENCE_MAX_LENGTH,
} from "@/lib/observability/correlation";

describe("support references", () => {
  it("generates bounded, non-identifying references", () => {
    const first = createSupportReference();
    const second = createSupportReference();
    expect(isValidSupportReference(first)).toBe(true);
    expect(isValidSupportReference(second)).toBe(true);
    expect(first).not.toBe(second);
    expect(first).toHaveLength(SUPPORT_REFERENCE_MAX_LENGTH);
    expect(first).toMatch(/^CHS-ERR-[A-F0-9]{20}$/);
    expect(first).not.toContain("550e8400-e29b-41d4-a716-446655440000");
  });

  it("rejects malformed, embedded-whitespace, and oversized input", () => {
    expect(normalizeSupportReference("CHS-ERR-ABC DEF")).toBeNull();
    expect(normalizeSupportReference("CHS-ERR-ABC")).toBeNull();
    expect(normalizeSupportReference(`CHS-ERR-${"A".repeat(500)}`)).toBeNull();
    expect(normalizeSupportReference("customer-123")).toBeNull();
  });

  it("normalizes a valid inbound reference without changing its identity", () => {
    const reference = createSupportReference().toLowerCase();
    expect(normalizeSupportReference(`  ${reference} `)).toBe(
      reference.toUpperCase(),
    );
  });
});
