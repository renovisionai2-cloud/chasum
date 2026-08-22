import { describe, expect, it } from "vitest";
import {
  catalogFormRevision,
  persistedFormRevision,
} from "@/lib/forms/persisted-form-revision";

describe("persistedFormRevision", () => {
  it("is deterministic and sorts object keys", () => {
    expect(persistedFormRevision({ b: 1, a: 2 })).toBe(
      persistedFormRevision({ a: 2, b: 1 }),
    );
  });

  it("does not collide when free-text contains pipe separators", () => {
    expect(persistedFormRevision(["a|b", "c"])).not.toBe(
      persistedFormRevision(["a", "b|c"]),
    );
  });

  it("keeps null and undefined equivalent, and distinct from empty string", () => {
    expect(persistedFormRevision({ name: null })).toBe(
      persistedFormRevision({ name: undefined }),
    );
    expect(persistedFormRevision({ name: null })).not.toBe(
      persistedFormRevision({ name: "" }),
    );
  });

  it("preserves boolean, number, and string distinctions", () => {
    expect(persistedFormRevision(true)).not.toBe(persistedFormRevision("true"));
    expect(persistedFormRevision(1)).not.toBe(persistedFormRevision("1"));
    expect(persistedFormRevision(1)).not.toBe(persistedFormRevision(true));
  });
});

describe("catalogFormRevision", () => {
  it("changes when a persisted catalog row is added", () => {
    const before = catalogFormRevision([]);
    const after = catalogFormRevision([
      { id: "tax-1", name: "HST", rate_bps: 1300, inclusive: false },
    ]);
    expect(before).not.toBe(after);
  });
});
