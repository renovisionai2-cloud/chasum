// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { mappingSchema, idEntityTypes } from "@/lib/imports/contracts";
import { CSV_MAX_ROWS } from "@/lib/imports/csv-adapter";
import { ImportContractError, previewImport } from "@/lib/imports/preview";

// Exercise the actual action error boundary without loading any hosted client.
vi.mock("@/lib/server/import-artifacts", () => ({}));
vi.mock("@/lib/server/import-artifact-storage", () => ({ ImportArtifactError: class extends Error {} }));
vi.mock("@/lib/server/import-writer", () => ({ GovernedImportError: class extends Error {} }));
vi.mock("@/lib/server/import-c2", async () => {
  const { mappingSchema: schema } = await import("@/lib/imports/contracts");
  return {
    C2ImportError: class extends Error {},
    previewC2Artifact: ({ mapping }: { mapping: unknown }) => schema.parse(mapping),
  };
});
import { previewC2ImportAction } from "@/lib/actions/import-c2";

const uuid = "11111111-1111-4111-8111-111111111111";
const link = (i: number) => ({ entityType: "customer" as const, sourceRowKey: `customer:${i}`, existingId: uuid });
const mapping = (links: unknown) => ({ version: "c2-mapping-v1", statusMapping: { booked: "confirmed" }, links });

describe("import mapping resource bound", () => {
  it("preserves empty mappings, all supported link types and trimming", () => {
    expect(mappingSchema.parse(mapping([])).links).toEqual([]);
    const links = idEntityTypes.map((entityType, i) => ({ ...link(i), entityType, sourceRowKey: `  row-${i}  ` }));
    expect(mappingSchema.parse(mapping(links)).links.map(l => l.sourceRowKey)).toEqual(idEntityTypes.map((_, i) => `row-${i}`));
  });

  it("accepts one link for every row at the existing import maximum", () => {
    expect(CSV_MAX_ROWS).toBe(5000);
    const links = Array.from({ length: CSV_MAX_ROWS }, (_, i) => link(i));
    expect(mappingSchema.parse(mapping(links)).links).toEqual(links);
  });

  it.each([5001, 10000, 100000])("rejects %i links with one size issue before reading elements", size => {
    const links = Array.from({ length: size }, () => ({}));
    Object.defineProperty(links, 0, { get() { throw new Error("Oversized input must not be walked"); } });
    const result = mappingSchema.safeParse(mapping(links));
    expect(result.success).toBe(false);
    if (result.success) throw new Error("Expected validation failure");
    expect(result.error.issues).toHaveLength(1);
    expect(result.error.issues[0]).toMatchObject({ code: "too_big", origin: "array", maximum: 5000, inclusive: true, path: ["links"] });
  });

  it("rejects one over the maximum even when every link is valid", () => {
    const result = mappingSchema.safeParse(mapping(Array.from({ length: 5001 }, (_, i) => link(i))));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.map(i => i.code)).toEqual(["too_big"]);
  });

  it("preserves bounded field-level error accumulation at the maximum", () => {
    const result = mappingSchema.safeParse(mapping(Array.from({ length: 5000 }, () => ({}))));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toHaveLength(15000);
      expect(result.error.issues.every(i => i.path[0] === "links" && Number(i.path[1]) < 5000)).toBe(true);
    }
  });

  it.each([null, {}, "links", [null], [[link(0)]], [{ ...link(0), existingId: {} }]])("preserves rejection of alternate malformed input %j", links => {
    expect(mappingSchema.safeParse(mapping(links)).success).toBe(false);
  });

  it("applies the size guard when nested and keeps ordinary field/strictness errors", () => {
    const result = z.object({ mapping: mappingSchema }).safeParse({ mapping: mapping(Array(10000).fill(null)) });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues).toMatchObject([{ code: "too_big", path: ["mapping", "links"] }]);
    const bad = mappingSchema.safeParse(mapping([{ ...link(0), existingId: "not-a-uuid", extra: true }]));
    expect(bad.success).toBe(false);
    if (!bad.success) expect(bad.error.issues.map(i => i.code)).toEqual(["invalid_format", "unrecognized_keys"]);
  });

  it("keeps the pure preview INVALID_ROOT contract", () => {
    const payload = {
      source: { schemaVersion: "1", sourceSystem: "fixture", sourceAccountKey: "local", sourceTimezone: "UTC", sourceCurrency: "CAD", inputChecksum: "a".repeat(64) },
      target: { businessId: uuid, businessTimezone: "UTC", businessCurrency: "CAD" }, rows: [],
    };
    expect(() => previewImport(payload, { businessId: uuid, entities: [], assignments: [], sourceRefs: [] }, mapping(Array(5001).fill(null)), "2026-10-31T00:00:00Z"))
      .toThrow(new ImportContractError("INVALID_ROOT"));
  });

  it("keeps the Server Action INVALID_INPUT response without leaking validation details", async () => {
    await expect(previewC2ImportAction({ artifactId: uuid, adapter: {}, mapping: mapping(Array(10000).fill({})) }))
      .resolves.toEqual({ ok: false, code: "INVALID_INPUT", error: "The import setup is incomplete or invalid." });
  });
});
