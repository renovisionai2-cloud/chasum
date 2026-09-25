import { describe, expect, it } from "vitest";
import {
  adaptCsvToCanonical,
  detectCsvDelimiter,
  parseCsvBytes,
  type CsvAdapterConfigV1,
} from "@/lib/imports/csv-adapter";

const businessId = "10000000-0000-4000-8000-000000000001";
const locationId = "20000000-0000-4000-8000-000000000001";
const checksum = "a".repeat(64);
const mapping = { version: "c2-mapping-v1", statusMapping: {}, links: [] };
const target = {
  businessId,
  businessTimezone: "UTC",
  businessCurrency: "CAD",
};
const emptySnapshot = {
  businessId,
  entities: [],
  assignments: [],
  sourceRefs: [],
};

function ref(index: number, header: string) {
  return { index, header };
}
describe("C2 CSV parser", () => {
  it("accepts UTF-8 BOM, CRLF and quoted multiline cells", () => {
    const bytes = Buffer.from("\ufeffname,note\r\nAda,\"line one\r\nline two\"\r\n");
    const parsed = parseCsvBytes(bytes, ",");

    expect(parsed.headers).toEqual(["name", "note"]);
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0]).toMatchObject({
      physicalRow: 2,
      values: ["Ada", "line one\r\nline two"],
    });
  });

  it("detects a delimiter on files larger than the 25-row sampling window", () => {
    const rows = Array.from({ length: 40 }, (_, i) => String(i) + ",Name " + String(i));
    const detected = detectCsvDelimiter(Buffer.from(["id,name", ...rows].join("\n")));
    expect(detected).toMatchObject({ delimiter: ",", ambiguous: false });
  });

  it("rejects rows wider than the observed header", () => {
    expect(() => parseCsvBytes(Buffer.from("a,b\n1,2,3\n"), ","))
      .toThrowError(expect.objectContaining({ code: "MALFORMED_CSV" }));
  });
});
describe("C2 CSV adapter", () => {
  it("uses opaque physical-row locators and preserves a real external ID only when mapped", () => {
    const table = parseCsvBytes(
      Buffer.from("external,name,email\nabc-7,Ada Lovelace,ada@example.test\n"),
      ",",
    );
    const adapter: CsvAdapterConfigV1 = {
      version: "c2-csv-v1",
      entityType: "customer",
      delimiter: ",",
      sourceTimezone: "UTC",
      sourceCurrency: "CAD",
      sourceExternalIdColumn: ref(0, "external"),
      fields: {
        name: { kind: "column", column: ref(1, "name") },
        email: { kind: "column", column: ref(2, "email") },
      },
      references: {},
    };
    const result = adaptCsvToCanonical({
      table, adapter, mapping, target, snapshot: emptySnapshot,
      source: {
        sourceSystem: "other_csv",
        sourceAccountKey: "source-account",
        inputChecksum: checksum,
      },
    });
    expect(result.payload.rows).toEqual([
      expect.objectContaining({
        entityType: "customer",
        sourceRowKey: "customer:2",
        sourceExternalId: "abc-7",
        name: "Ada Lovelace",
      }),
    ]);
    expect(result.payload.rows[0].sourceRowKey).not.toContain("Ada");
    expect(result.payload.rows[0].sourceRowKey).not.toContain("@");
  });

  it("converts explicit decimal-comma major units with integer-safe money parsing", () => {
    const table = parseCsvBytes(
      Buffer.from("name;price;duration\nConsultation;19,95;60\n"),
      ";",
    );
    const adapter: CsvAdapterConfigV1 = {
      version: "c2-csv-v1",
      entityType: "service",
      delimiter: ";",
      sourceTimezone: "UTC",
      sourceCurrency: "CAD",
      fields: {
        name: { kind: "column", column: ref(0, "name") },
        priceCents: { kind: "moneyMajor", column: ref(1, "price"), decimalSeparator: "," },
        durationMinutes: { kind: "duration", column: ref(2, "duration"), unit: "minutes" },
        currency: { kind: "static", value: "CAD" },
      },
      references: {},
    };
    const result = adaptCsvToCanonical({
      table, adapter, mapping, target, snapshot: emptySnapshot,
      source: {
        sourceSystem: "other_csv",
        sourceAccountKey: "source-account",
        inputChecksum: checksum,
      },
    });
    expect(result.payload.rows[0]).toMatchObject({
      entityType: "service",
      priceCents: 1995,
      durationMinutes: 60,
      currency: "CAD",
    });
  });

  it("normalizes source appointment status before Package A status lookup", () => {
    const table = parseCsvBytes(
      Buffer.from("status,start,end\n CONFIRMED ,2026-10-01T10:00,2026-10-01T10:30\n"),
      ",",
    );
    const adapter: CsvAdapterConfigV1 = {
      version: "c2-csv-v1",
      entityType: "appointment",
      delimiter: ",",
      sourceTimezone: "UTC",
      sourceCurrency: "CAD",
      fields: {
        sourceStatus: { kind: "column", column: ref(0, "status") },
        start: { kind: "datetime", column: ref(1, "start"), format: "ISO_LOCAL" },
        end: { kind: "datetime", column: ref(2, "end"), format: "ISO_LOCAL" },
        timezone: { kind: "static", value: "UTC" },
      },
      references: {},
      appointmentFinancials: { kind: "NONE" },
    };
    const result = adaptCsvToCanonical({
      table,
      adapter,
      mapping: {
        version: "c2-mapping-v1",
        statusMapping: { " CONFIRMED ": "confirmed" },
        links: [],
      },
      target,
      snapshot: emptySnapshot,
      source: {
        sourceSystem: "other_csv",
        sourceAccountKey: "source-account",
        inputChecksum: checksum,
      },
    });
    expect(result.mapping.statusMapping).toEqual({ confirmed: "confirmed" });
    expect(result.payload.rows[0]).toMatchObject({
      entityType: "appointment",
      sourceStatus: "confirmed",
    });
  });

  it("resolves same-source relationship IDs before explicit browser mappings", () => {
    const table = parseCsvBytes(
      Buffer.from("name,duration,price,locations\nService,30,1000,loc-7\n"),
      ",",
    );
    const adapter: CsvAdapterConfigV1 = {
      version: "c2-csv-v1",
      entityType: "service",
      delimiter: ",",
      sourceTimezone: "UTC",
      sourceCurrency: "CAD",
      fields: {
        name: { kind: "column", column: ref(0, "name") },
        durationMinutes: { kind: "duration", column: ref(1, "duration"), unit: "minutes" },
        priceCents: { kind: "moneyMinor", column: ref(2, "price") },
        currency: { kind: "static", value: "CAD" },
      },
      references: {
        locations: {
          column: ref(3, "locations"),
          targetEntity: "location",
          mode: "sourceExternalId",
          separator: "|",
          explicit: {},
        },
      },
    };
    const snapshot = {
      ...emptySnapshot,
      sourceRefs: [{
        businessId,
        sourceSystem: "other_csv",
        sourceAccountKey: "source-account",
        entityType: "location" as const,
        sourceExternalId: "loc-7",
        sourceRowHash: "b".repeat(64),
        chasumEntityId: locationId,
      }],
    };
    const result = adaptCsvToCanonical({
      table, adapter, mapping, target, snapshot,
      source: {
        sourceSystem: "other_csv",
        sourceAccountKey: "source-account",
        inputChecksum: checksum,
      },
    });
    expect(result.referenceValues[0]).toMatchObject({
      targetEntity: "location",
      resolution: "source_ref",
      resolvedId: locationId,
    });
    expect(result.payload.rows).toContainEqual(expect.objectContaining({
      entityType: "serviceLocation",
      location: { existingId: locationId },
    }));
  });
});
