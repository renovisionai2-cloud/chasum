import { describe, expect, it } from "vitest";
import {
  VERIFIED_PLATFORM_EMAIL_FROM,
  extractSenderDomain,
  resolveEmailFromAddress,
  validateEmailFromAddress,
} from "@/lib/communications/email-from";

describe("email-from resolution", () => {
  it("falls back to verified chasumai.com when EMAIL_FROM is missing", () => {
    const resolved = resolveEmailFromAddress({});
    expect(resolved.from).toBe(VERIFIED_PLATFORM_EMAIL_FROM);
    expect(resolved.domain).toBe("chasumai.com");
    expect(resolved.source).toBe("platform_fallback");
  });

  it("rejects legacy chasum.app and falls back to chasumai.com", () => {
    const resolved = resolveEmailFromAddress({
      EMAIL_FROM: "Chasum <notifications@chasum.app>",
    });
    expect(resolved.from).toBe(VERIFIED_PLATFORM_EMAIL_FROM);
    expect(extractSenderDomain(resolved.from)).toBe("chasumai.com");
  });

  it("accepts verified EMAIL_FROM on chasumai.com", () => {
    const resolved = resolveEmailFromAddress({
      EMAIL_FROM: "Chasum <notifications@chasumai.com>",
    });
    expect(resolved.from).toBe("Chasum <notifications@chasumai.com>");
    expect(resolved.source).toBe("env");
  });

  it("validates blocked and invalid domains", () => {
    expect(
      validateEmailFromAddress("Chasum <notifications@chasum.app>"),
    ).toMatch(/not authorized|chasumai/i);
    expect(
      validateEmailFromAddress("Chasum <notifications@chasumai.com>"),
    ).toBeNull();
  });
});
