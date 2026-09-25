// @vitest-environment node
import { describe, expect, it } from "vitest";
import { c3ReviewedEnvelopeSchema } from "@/lib/imports/c3-contract";

const businessId = "10000000-0000-4000-8000-000000000001";
const runId = "20000000-0000-4000-8000-000000000001";
const previewHash = "a".repeat(64);
const snapshotHash = "b".repeat(64);
const commitGuardHash = "c".repeat(64);
const checksum = "d".repeat(64);
const rowHash = "e".repeat(64);

function envelope() {
  const row = {
    entityType: "customer" as const,
    sourceRowKey: "customer:2",
    sourceExternalId: "customer-001",
    name: "Synthetic Customer",
    email: "synthetic@example.invalid",
  };
  const outcome = {
    entityType: "customer" as const,
    sourceRowKey: "customer:2",
    sourceExternalId: "customer-001",
    sourceRowHash: rowHash,
    status: "READY" as const,
    plannedAction: "CREATE" as const,
    reasonCodes: [],
    dependencies: {},
  };
  return {
    schemaVersion: "c2-reviewed-v1",
    review: { runId, previewHash, snapshotHash, commitGuardHash },
    mapping: { version: "c2-mapping-v1", statusMapping: {}, links: [] },
    adapter: {
      version: "c2-csv-v1",
      entityType: "customer",
      delimiter: ",",
      sourceTimezone: "UTC",
      sourceCurrency: "CAD",
      fields: {
        name: { kind: "column", column: { index: 0, header: "name" } },
        email: { kind: "column", column: { index: 1, header: "email" } },
      },
      references: {},
    },
    preview: {
      version: "1",
      previewHash,
      snapshotHash,
      normalized: {
        source: {
          schemaVersion: "1",
          sourceSystem: "other_csv",
          sourceAccountKey: "source-account",
          sourceTimezone: "UTC",
          sourceCurrency: "CAD",
          inputChecksum: checksum,
        },
        target: {
          businessId,
          businessTimezone: "UTC",
          businessCurrency: "CAD",
        },
        rows: [row],
      },
      outcomes: [outcome],
      counts: { READY: 1, WARNING: 0, DUPLICATE_EXISTING: 0, DUPLICATE_IN_FILE: 0, INVALID: 0, UNRESOLVED_REFERENCE: 0, SKIPPED: 0 },
    },
    rows: [{ row, outcome }],
    locationSlugs: [],
  };
}

describe("C3 reviewed envelope", () => {
  it("strictly parses exact C2 reviewed operational truth", () => {
    expect(c3ReviewedEnvelopeSchema.parse(envelope())).toMatchObject({
      schemaVersion: "c2-reviewed-v1",
      review: { runId, previewHash, snapshotHash, commitGuardHash },
    });
  });

  it("rejects an unrecognized top-level authority field", () => {
    expect(() => c3ReviewedEnvelopeSchema.parse({
      ...envelope(),
      businessId,
    })).toThrow();
  });

  it("rejects browser-shaped mapping instructions outside Package A contract", () => {
    const value = envelope();
    expect(() => c3ReviewedEnvelopeSchema.parse({
      ...value,
      mapping: { ...value.mapping, sourceTimezone: "America/Toronto" },
    })).toThrow();
  });

  it("rejects malformed operational outcomes and unsupported rows", () => {
    const value = envelope();
    expect(() => c3ReviewedEnvelopeSchema.parse({
      ...value,
      rows: [{
        ...value.rows[0],
        outcome: { ...value.rows[0].outcome, entityType: "customer", existingId: "not-a-uuid" },
      }],
    })).toThrow();
  });

  it("rejects a permissive C1-only envelope that lacks C3 review authority", () => {
    const value = envelope();
    const storageOnly = {
      schemaVersion: value.schemaVersion,
      preview: value.preview,
      rows: value.rows,
      locationSlugs: value.locationSlugs,
    };
    expect(() => c3ReviewedEnvelopeSchema.parse(storageOnly)).toThrow();
  });
});
