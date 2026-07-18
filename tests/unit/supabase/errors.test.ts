import { afterEach, describe, expect, it } from "vitest";
import {
  allowSoftSchemaFallback,
  isMissingSchemaError,
  isSoftSchemaFallbackAllowed,
} from "@/lib/supabase/errors";

describe("schema soft fallbacks", () => {
  afterEach(() => {
    delete process.env.CHASUM_ALLOW_SOFT_SCHEMA;
  });

  it("detects missing schema messages", () => {
    expect(isMissingSchemaError('relation "payments" does not exist')).toBe(true);
    expect(isMissingSchemaError("unique violation")).toBe(false);
  });

  it("disables soft fallbacks by default", () => {
    expect(allowSoftSchemaFallback()).toBe(false);
    expect(
      isSoftSchemaFallbackAllowed('relation "x" does not exist', "test"),
    ).toBe(false);
  });

  it("allows soft fallbacks only when explicitly enabled", () => {
    process.env.CHASUM_ALLOW_SOFT_SCHEMA = "1";
    expect(allowSoftSchemaFallback()).toBe(true);
    expect(
      isSoftSchemaFallbackAllowed('could not find the table "foo"', "test"),
    ).toBe(true);
  });
});
