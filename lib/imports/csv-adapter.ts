import { createHash } from "node:crypto";
import { z } from "zod";
import {
  idEntityTypes,
  mappingSchema,
  type CanonicalPayload,
  type IdEntityType,
  type ImportRow,
  type MappingConfig,
  type Reference,
  type TargetSnapshot,
} from "./contracts";

export const CSV_ADAPTER_VERSION = "c2-csv-v1" as const;
export const CSV_MAX_ROWS = 5000;
export const CSV_MAX_COLUMNS = 100;
export const CSV_MAX_HEADER_CHARS = 256;
export const CSV_MAX_CELL_CHARS = 32 * 1024;

const columnRefSchema = z.object({
  index: z.number().int().min(0).max(CSV_MAX_COLUMNS - 1),
  header: z.string().max(CSV_MAX_HEADER_CHARS),
}).strict();
export type CsvColumnRef = z.infer<typeof columnRefSchema>;

const directTransformSchema = z.object({
  kind: z.literal("column"),
  column: columnRefSchema,
}).strict();
const concatTransformSchema = z.object({
  kind: z.literal("concat"),
  columns: z.array(columnRefSchema).min(1).max(4),
  separator: z.string().max(8).default(" "),
}).strict();
const integerTransformSchema = z.object({
  kind: z.literal("integer"),
  column: columnRefSchema,
}).strict();
const moneyMajorTransformSchema = z.object({
  kind: z.literal("moneyMajor"),
  column: columnRefSchema,
  decimalSeparator: z.enum([".", ","]),
}).strict();
const moneyMinorTransformSchema = z.object({
  kind: z.literal("moneyMinor"),
  column: columnRefSchema,
}).strict();
const durationTransformSchema = z.object({
  kind: z.literal("duration"),
  column: columnRefSchema,
  unit: z.enum(["minutes", "hours"]),
}).strict();
const staticTransformSchema = z.object({
  kind: z.literal("static"),
  value: z.string().max(CSV_MAX_CELL_CHARS),
}).strict();
export const csvDateFormats = [
  "ISO_8601",
  "ISO_LOCAL",
  "YYYY-MM-DD HH:mm",
  "DD/MM/YYYY HH:mm",
  "MM/DD/YYYY hh:mm a",
] as const;
const dateTimeTransformSchema = z.object({
  kind: z.literal("datetime"),
  column: columnRefSchema,
  format: z.enum(csvDateFormats),
}).strict();
const dateTimeColumnsTransformSchema = z.object({
  kind: z.literal("dateTimeColumns"),
  dateColumn: columnRefSchema,
  timeColumn: columnRefSchema,
  format: z.enum([
    "YYYY-MM-DD+HH:mm",
    "DD/MM/YYYY+HH:mm",
    "MM/DD/YYYY+hh:mm a",
  ]),
}).strict();

export const csvValueTransformSchema = z.discriminatedUnion("kind", [
  directTransformSchema,
  concatTransformSchema,
  integerTransformSchema,
  moneyMajorTransformSchema,
  moneyMinorTransformSchema,
  durationTransformSchema,
  staticTransformSchema,
  dateTimeTransformSchema,
  dateTimeColumnsTransformSchema,
]);
export type CsvValueTransform = z.infer<typeof csvValueTransformSchema>;

const referenceSchema = z.object({
  column: columnRefSchema,
  targetEntity: z.enum(["location", "service", "staff", "customer"]),
  mode: z.enum(["sourceExternalId", "explicitValue"]).default("explicitValue"),
  explicit: z.record(z.string().regex(/^[a-f0-9]{64}$/), z.uuid()).default({}),
}).strict();
export type CsvReferenceConfig = z.infer<typeof referenceSchema>;

const referenceListSchema = z.object({
  column: columnRefSchema,
  targetEntity: z.enum(["location", "service"]),
  mode: z.enum(["sourceExternalId", "explicitValue"]).default("explicitValue"),
  separator: z.string().min(1).max(4),
  explicit: z.record(z.string().regex(/^[a-f0-9]{64}$/), z.uuid()).default({}),
}).strict();
export type CsvReferenceListConfig = z.infer<typeof referenceListSchema>;

const exactFinancialSchema = z.object({
  kind: z.literal("EXACT"),
  currency: csvValueTransformSchema,
  priceCents: csvValueTransformSchema,
  taxCents: csvValueTransformSchema,
  discountCents: csvValueTransformSchema,
  depositCents: csvValueTransformSchema,
  amountPaidCents: csvValueTransformSchema,
  amountRefundedCents: csvValueTransformSchema,
}).strict();

export const csvAdapterConfigSchema = z.object({
  version: z.literal(CSV_ADAPTER_VERSION),
  entityType: z.enum(idEntityTypes),
  delimiter: z.enum([",", ";", "\t"]),
  sourceTimezone: z.string().trim().min(1).max(100),
  sourceCurrency: z.string().trim().min(3).max(3),
  sourceExternalIdColumn: columnRefSchema.optional(),
  fields: z.record(z.string(), csvValueTransformSchema),
  references: z.record(z.string(), z.union([referenceSchema, referenceListSchema])).default({}),
  appointmentFinancials: z.union([
    z.object({ kind: z.literal("NONE") }).strict(),
    z.object({ kind: z.literal("UNRECONCILED") }).strict(),
    exactFinancialSchema,
  ]).optional(),
}).strict();
export type CsvAdapterConfigV1 = z.infer<typeof csvAdapterConfigSchema>;

export type ParsedCsvRow = {
  ordinal: number;
  physicalRow: number;
  values: string[];
};

export type ParsedCsv = {
  delimiter: "," | ";" | "\t";
  headers: string[];
  rows: ParsedCsvRow[];
};

export type CsvDelimiterDetection = {
  delimiter: "," | ";" | "\t" | null;
  ambiguous: boolean;
  candidates: Array<{ delimiter: "," | ";" | "\t"; columns: number; consistentRows: number }>;
};

export type CsvReferenceValue = {
  field: string;
  targetEntity: "location" | "service" | "staff" | "customer";
  key: string;
  sample: string;
  resolvedId?: string;
  resolution: "source_ref" | "explicit" | "unresolved";
};

export class CsvAdapterError extends Error {
  constructor(
    public readonly code:
      | "INVALID_UTF8"
      | "BINARY_INPUT"
      | "MALFORMED_CSV"
      | "TOO_MANY_ROWS"
      | "TOO_MANY_COLUMNS"
      | "HEADER_TOO_LONG"
      | "CELL_TOO_LONG"
      | "AMBIGUOUS_DELIMITER"
      | "INVALID_CONFIG"
      | "INVALID_VALUE",
    public readonly row?: number,
    public readonly field?: string,
  ) {
    super(code);
  }
}

function decodeUtf8(bytes: Uint8Array): string {
  if (bytes.includes(0)) throw new CsvAdapterError("BINARY_INPUT");
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  } catch {
    throw new CsvAdapterError("INVALID_UTF8");
  }
}

function logicalEmpty(values: string[]) {
  return values.every((value) => value.trim() === "");
}

function parseText(text: string, delimiter: "," | ";" | "\t", rowLimit = CSV_MAX_ROWS): ParsedCsv {
  const records: Array<{ values: string[]; physicalRow: number }> = [];
  let field = "";
  let row: string[] = [];
  let quoted = false;
  let physicalLine = 1;
  let recordStartLine = 1;

  const pushField = () => {
    if (field.length > CSV_MAX_CELL_CHARS) throw new CsvAdapterError("CELL_TOO_LONG", recordStartLine);
    row.push(field);
    field = "";
    if (row.length > CSV_MAX_COLUMNS) throw new CsvAdapterError("TOO_MANY_COLUMNS", recordStartLine);
  };
  const pushRecord = () => {
    pushField();
    records.push({ values: row, physicalRow: recordStartLine });
    row = [];
    recordStartLine = physicalLine;
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
        if (char === "\n") physicalLine += 1;
        else if (char === "\r" && text[i + 1] !== "\n") physicalLine += 1;
      }
      if (field.length > CSV_MAX_CELL_CHARS) throw new CsvAdapterError("CELL_TOO_LONG", recordStartLine);
      continue;
    }

    if (char === '"' && field.length === 0) {
      quoted = true;
      continue;
    }
    if (char === delimiter) {
      pushField();
      continue;
    }
    if (char === "\r" || char === "\n") {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      pushRecord();
      physicalLine += 1;
      recordStartLine = physicalLine;
      continue;
    }
    if (char === '"') throw new CsvAdapterError("MALFORMED_CSV", recordStartLine);
    field += char;
    if (field.length > CSV_MAX_CELL_CHARS) throw new CsvAdapterError("CELL_TOO_LONG", recordStartLine);
  }

  if (quoted) throw new CsvAdapterError("MALFORMED_CSV", recordStartLine);
  if (field.length > 0 || row.length > 0) pushRecord();

  while (records.length && logicalEmpty(records[0].values)) records.shift();
  if (!records.length) throw new CsvAdapterError("MALFORMED_CSV");

  const [headerRecord, ...dataRecords] = records;
  if (headerRecord.values.length > CSV_MAX_COLUMNS) throw new CsvAdapterError("TOO_MANY_COLUMNS", headerRecord.physicalRow);
  if (headerRecord.values.some((header) => header.length > CSV_MAX_HEADER_CHARS)) {
    throw new CsvAdapterError("HEADER_TOO_LONG", headerRecord.physicalRow);
  }

  const data = dataRecords.filter((record) => !logicalEmpty(record.values));
  if (data.length > rowLimit) throw new CsvAdapterError("TOO_MANY_ROWS");
  const headers = headerRecord.values;
  const tooWide = data.find((record) => record.values.length > headers.length);
  if (tooWide) throw new CsvAdapterError("MALFORMED_CSV", tooWide.physicalRow);
  const rows = data.map((record, ordinal) => ({
    ordinal,
    physicalRow: record.physicalRow,
    values: Array.from({ length: headers.length }, (_, index) => record.values[index] ?? ""),
  }));
  if (rows.some((entry) => entry.values.length > CSV_MAX_COLUMNS)) throw new CsvAdapterError("TOO_MANY_COLUMNS");
  return { delimiter, headers, rows };
}

export function parseCsvBytes(bytes: Uint8Array, delimiter: "," | ";" | "\t"): ParsedCsv {
  return parseText(decodeUtf8(bytes), delimiter);
}

export function detectCsvDelimiter(bytes: Uint8Array): CsvDelimiterDetection {
  const text = decodeUtf8(bytes);
  const candidates = ([",", ";", "\t"] as const).map((delimiter) => {
    try {
      const parsed = parseText(text, delimiter);
      const sample = parsed.rows.slice(0, 25);
      const widths = sample.map((row) => row.values.length);
      const columns = parsed.headers.length;
      const consistentRows = widths.filter((width) => width === columns).length;
      return { delimiter, columns, consistentRows };
    } catch {
      return { delimiter, columns: 0, consistentRows: 0 };
    }
  });
  const viable = candidates.filter((candidate) => candidate.columns > 1 && candidate.consistentRows > 0);
  viable.sort((a, b) => b.consistentRows - a.consistentRows || b.columns - a.columns);
  const best = viable[0];
  if (!best) return { delimiter: null, ambiguous: true, candidates };
  const tied = viable.filter((candidate) =>
    candidate.consistentRows === best.consistentRows && candidate.columns === best.columns,
  );
  return { delimiter: tied.length === 1 ? best.delimiter : null, ambiguous: tied.length !== 1, candidates };
}

export function referenceValueKey(value: string): string {
  return createHash("sha256").update(value.trim()).digest("hex");
}

function cell(row: ParsedCsvRow, column: CsvColumnRef): string {
  return row.values[column.index] ?? "";
}

function parseUnsignedInteger(value: string): number {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) throw new CsvAdapterError("INVALID_VALUE");
  const parsed = Number(trimmed);
  if (!Number.isSafeInteger(parsed) || parsed > 2147483647) throw new CsvAdapterError("INVALID_VALUE");
  return parsed;
}

function parseMoneyMajor(value: string, separator: "." | ","): number {
  const trimmed = value.trim();
  const escaped = separator === "." ? "\\." : ",";
  const match = new RegExp(`^(\\d+)(?:${escaped}(\\d{1,2}))?$`).exec(trimmed);
  if (!match) throw new CsvAdapterError("INVALID_VALUE");
  const whole = BigInt(match[1]);
  const fraction = BigInt((match[2] ?? "").padEnd(2, "0"));
  const cents = whole * BigInt(100) + fraction;
  if (cents > BigInt(2147483647)) throw new CsvAdapterError("INVALID_VALUE");
  return Number(cents);
}

function parseDuration(value: string, unit: "minutes" | "hours"): number {
  if (unit === "minutes") {
    const minutes = parseUnsignedInteger(value);
    if (minutes < 1) throw new CsvAdapterError("INVALID_VALUE");
    return minutes;
  }
  const trimmed = value.trim();
  const match = /^(\d+)(?:\.(\d+))?$/.exec(trimmed);
  if (!match) throw new CsvAdapterError("INVALID_VALUE");
  const scale = BigInt(10) ** BigInt((match[2] ?? "").length);
  const numerator = BigInt(match[1]) * scale + BigInt(match[2] ?? "0");
  const minuteNumerator = numerator * BigInt(60);
  if (minuteNumerator % scale !== BigInt(0)) throw new CsvAdapterError("INVALID_VALUE");
  const minutes = minuteNumerator / scale;
  if (minutes < BigInt(1) || minutes > BigInt(2147483647)) throw new CsvAdapterError("INVALID_VALUE");
  return Number(minutes);
}

function validCivil(y: number, m: number, d: number, hh: number, mm: number, ss = 0) {
  const date = new Date(Date.UTC(y, m - 1, d, hh, mm, ss));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
    && date.getUTCHours() === hh && date.getUTCMinutes() === mm && date.getUTCSeconds() === ss;
}

function isoWall(y: number, m: number, d: number, hh: number, mm: number, ss = 0) {
  if (!validCivil(y, m, d, hh, mm, ss)) throw new CsvAdapterError("INVALID_VALUE");
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

function parseClock12(hour: string, minute: string, meridiem: string) {
  const h = Number(hour);
  const m = Number(minute);
  if (h < 1 || h > 12 || m < 0 || m > 59) throw new CsvAdapterError("INVALID_VALUE");
  const pm = meridiem.toLowerCase() === "pm";
  return { hour: (h % 12) + (pm ? 12 : 0), minute: m };
}

function parseDateTime(value: string, format: typeof csvDateFormats[number]): string {
  const v = value.trim();
  if (format === "ISO_8601") {
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(Z|[+-]\d{2}:\d{2})$/.exec(v);
    if (!match) throw new CsvAdapterError("INVALID_VALUE");
    const wall = isoWall(Number(match[1]), Number(match[2]), Number(match[3]), Number(match[4]), Number(match[5]), Number(match[6] ?? 0));
    return `${wall}${match[7]}`;
  }
  if (format === "ISO_LOCAL") {
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(v);
    if (!match) throw new CsvAdapterError("INVALID_VALUE");
    return isoWall(Number(match[1]), Number(match[2]), Number(match[3]), Number(match[4]), Number(match[5]), Number(match[6] ?? 0));
  }
  if (format === "YYYY-MM-DD HH:mm") {
    const match = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/.exec(v);
    if (!match) throw new CsvAdapterError("INVALID_VALUE");
    return isoWall(Number(match[1]), Number(match[2]), Number(match[3]), Number(match[4]), Number(match[5]));
  }
  if (format === "DD/MM/YYYY HH:mm") {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/.exec(v);
    if (!match) throw new CsvAdapterError("INVALID_VALUE");
    return isoWall(Number(match[3]), Number(match[2]), Number(match[1]), Number(match[4]), Number(match[5]));
  }
  const match = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*([APap][Mm])$/.exec(v);
  if (!match) throw new CsvAdapterError("INVALID_VALUE");
  const clock = parseClock12(match[4], match[5], match[6]);
  return isoWall(Number(match[3]), Number(match[1]), Number(match[2]), clock.hour, clock.minute);
}

function parseDateTimeColumns(
  dateValue: string,
  timeValue: string,
  format: "YYYY-MM-DD+HH:mm" | "DD/MM/YYYY+HH:mm" | "MM/DD/YYYY+hh:mm a",
): string {
  if (format === "YYYY-MM-DD+HH:mm") return parseDateTime(`${dateValue.trim()} ${timeValue.trim()}`, "YYYY-MM-DD HH:mm");
  if (format === "DD/MM/YYYY+HH:mm") return parseDateTime(`${dateValue.trim()} ${timeValue.trim()}`, "DD/MM/YYYY HH:mm");
  return parseDateTime(`${dateValue.trim()} ${timeValue.trim()}`, "MM/DD/YYYY hh:mm a");
}

function transformValue(row: ParsedCsvRow, transform: CsvValueTransform): string | number {
  switch (transform.kind) {
    case "column":
      return cell(row, transform.column).trim();
    case "concat":
      return transform.columns.map((column) => cell(row, column).trim()).filter(Boolean).join(transform.separator).trim();
    case "integer":
      return parseUnsignedInteger(cell(row, transform.column));
    case "moneyMajor":
      return parseMoneyMajor(cell(row, transform.column), transform.decimalSeparator);
    case "moneyMinor":
      return parseUnsignedInteger(cell(row, transform.column));
    case "duration":
      return parseDuration(cell(row, transform.column), transform.unit);
    case "static":
      return transform.value;
    case "datetime":
      return parseDateTime(cell(row, transform.column), transform.format);
    case "dateTimeColumns":
      return parseDateTimeColumns(cell(row, transform.dateColumn), cell(row, transform.timeColumn), transform.format);
  }
}

function requiredTransform(config: CsvAdapterConfigV1, field: string, row: ParsedCsvRow): string | number {
  const transform = config.fields[field];
  if (!transform) throw new CsvAdapterError("INVALID_CONFIG", row.physicalRow, field);
  try {
    return transformValue(row, transform);
  } catch (error) {
    if (error instanceof CsvAdapterError) throw new CsvAdapterError(error.code, row.physicalRow, field);
    throw error;
  }
}

function optionalTransform(config: CsvAdapterConfigV1, field: string, row: ParsedCsvRow): string | number | undefined {
  const transform = config.fields[field];
  if (!transform) return undefined;
  try {
    const value = transformValue(row, transform);
    return typeof value === "string" && value === "" ? undefined : value;
  } catch (error) {
    if (error instanceof CsvAdapterError) throw new CsvAdapterError(error.code, row.physicalRow, field);
    throw error;
  }
}

function refFor(
  config: CsvReferenceConfig,
  rawValue: string,
  sourceSystem: string,
  sourceAccountKey: string,
  snapshot: TargetSnapshot,
): { reference: Reference; detail: CsvReferenceValue } | null {
  const value = rawValue.trim();
  if (!value) return null;
  const key = referenceValueKey(value);
  if (config.mode === "sourceExternalId") {
    const match = snapshot.sourceRefs.find((candidate) =>
      candidate.sourceSystem === sourceSystem
      && candidate.sourceAccountKey === sourceAccountKey
      && candidate.entityType === config.targetEntity
      && candidate.sourceExternalId === value,
    );
    if (match) {
      return {
        reference: { existingId: match.chasumEntityId },
        detail: { field: "", targetEntity: config.targetEntity, key, sample: value, resolvedId: match.chasumEntityId, resolution: "source_ref" },
      };
    }
  }
  const explicit = config.explicit[key];
  if (explicit) {
    return {
      reference: { existingId: explicit },
      detail: { field: "", targetEntity: config.targetEntity, key, sample: value, resolvedId: explicit, resolution: "explicit" },
    };
  }
  return {
    reference: { sourceRowKey: `unresolved:${config.targetEntity}:${key.slice(0, 24)}` },
    detail: { field: "", targetEntity: config.targetEntity, key, sample: value, resolution: "unresolved" },
  };
}

function splitReferenceList(value: string, separator: string) {
  return value.split(separator).map((part) => part.trim()).filter(Boolean);
}

function normalizeStatusMapping(mapping: MappingConfig): MappingConfig {
  const statusMapping: MappingConfig["statusMapping"] = {};
  for (const [source, target] of Object.entries(mapping.statusMapping)) {
    const key = source.trim().toLowerCase();
    if (!key) continue;
    if (statusMapping[key] && statusMapping[key] !== target) throw new CsvAdapterError("INVALID_CONFIG");
    statusMapping[key] = target;
  }
  return mappingSchema.parse({ ...mapping, statusMapping });
}

function validateColumns(table: ParsedCsv, config: CsvAdapterConfigV1) {
  const refs: CsvColumnRef[] = [];
  if (config.sourceExternalIdColumn) refs.push(config.sourceExternalIdColumn);
  for (const transform of Object.values(config.fields)) {
    if (transform.kind === "column" || transform.kind === "integer" || transform.kind === "moneyMajor"
      || transform.kind === "moneyMinor" || transform.kind === "duration" || transform.kind === "datetime") {
      refs.push(transform.column);
    } else if (transform.kind === "concat") refs.push(...transform.columns);
    else if (transform.kind === "dateTimeColumns") refs.push(transform.dateColumn, transform.timeColumn);
  }
  for (const reference of Object.values(config.references)) refs.push(reference.column);
  for (const ref of refs) {
    if (ref.index >= table.headers.length || table.headers[ref.index] !== ref.header) throw new CsvAdapterError("INVALID_CONFIG");
  }
}

const allowedFields: Record<IdEntityType, Set<string>> = {
  location: new Set(["name", "slug", "timezone", "address", "phone"]),
  service: new Set(["name", "durationMinutes", "priceCents", "currency"]),
  staff: new Set(["name", "email", "phone"]),
  customer: new Set(["name", "email", "phone"]),
  appointment: new Set([
    "start", "end", "timezone", "sourceStatus", "notes",
    "financials.currency", "financials.priceCents", "financials.taxCents",
    "financials.discountCents", "financials.depositCents", "financials.amountPaidCents",
    "financials.amountRefundedCents",
  ]),
};

function assertConfig(config: CsvAdapterConfigV1) {
  for (const field of Object.keys(config.fields)) {
    if (!allowedFields[config.entityType].has(field)) throw new CsvAdapterError("INVALID_CONFIG");
  }
  const allowedReferences: Record<IdEntityType, Set<string>> = {
    location: new Set(),
    customer: new Set(),
    service: new Set(["locations"]),
    staff: new Set(["locations", "services"]),
    appointment: new Set(["location", "service", "staff", "customer"]),
  };
  for (const [field, reference] of Object.entries(config.references)) {
    if (!allowedReferences[config.entityType].has(field)) throw new CsvAdapterError("INVALID_CONFIG");
    if ((field === "locations") !== ("separator" in reference) && (field === "services") !== ("separator" in reference)) {
      if (field === "locations" || field === "services") throw new CsvAdapterError("INVALID_CONFIG");
    }
  }
}

export type CsvAdaptResult = {
  payload: CanonicalPayload;
  mapping: MappingConfig;
  referenceValues: CsvReferenceValue[];
};

export function adaptCsvToCanonical(input: {
  table: ParsedCsv;
  adapter: CsvAdapterConfigV1;
  mapping: MappingConfig;
  source: {
    sourceSystem: string;
    sourceAccountKey: string;
    sourceLabel?: string;
    inputChecksum: string;
  };
  target: {
    businessId: string;
    businessTimezone: string;
    businessCurrency: string;
  };
  snapshot: TargetSnapshot;
}): CsvAdaptResult {
  const adapter = csvAdapterConfigSchema.parse(input.adapter);
  const mapping = normalizeStatusMapping(mappingSchema.parse(input.mapping));
  if (adapter.delimiter !== input.table.delimiter) throw new CsvAdapterError("INVALID_CONFIG");
  assertConfig(adapter);
  validateColumns(input.table, adapter);

  const rows: ImportRow[] = [];
  const referenceValues: CsvReferenceValue[] = [];
  const sourceCurrency = adapter.sourceCurrency.trim().toUpperCase();
  const sourceTimezone = adapter.sourceTimezone.trim();

  const addReferenceDetail = (field: string, result: ReturnType<typeof refFor>) => {
    if (!result) return;
    referenceValues.push({ ...result.detail, field });
  };

  for (const sourceRow of input.table.rows) {
    const sourceRowKey = `${adapter.entityType}:${sourceRow.physicalRow}`;
    const sourceExternalId = adapter.sourceExternalIdColumn
      ? cell(sourceRow, adapter.sourceExternalIdColumn).trim() || undefined
      : undefined;
    const identity = { sourceRowKey, ...(sourceExternalId ? { sourceExternalId } : {}) };

    try {
      if (adapter.entityType === "location") {
        rows.push({
          ...identity,
          entityType: "location",
          name: String(requiredTransform(adapter, "name", sourceRow)),
          ...(optionalTransform(adapter, "slug", sourceRow) !== undefined ? { slug: String(optionalTransform(adapter, "slug", sourceRow)) } : {}),
          ...(optionalTransform(adapter, "timezone", sourceRow) !== undefined ? { timezone: String(optionalTransform(adapter, "timezone", sourceRow)) } : {}),
          ...(optionalTransform(adapter, "address", sourceRow) !== undefined ? { address: String(optionalTransform(adapter, "address", sourceRow)) } : {}),
          ...(optionalTransform(adapter, "phone", sourceRow) !== undefined ? { phone: String(optionalTransform(adapter, "phone", sourceRow)) } : {}),
        });
        continue;
      }

      if (adapter.entityType === "service") {
        const locations = adapter.references.locations;
        const resolved: Reference[] = [];
        if (locations && "separator" in locations) {
          for (const raw of splitReferenceList(cell(sourceRow, locations.column), locations.separator)) {
            const result = refFor(locations, raw, input.source.sourceSystem, input.source.sourceAccountKey, input.snapshot);
            if (result) {
              resolved.push(result.reference);
              addReferenceDetail("locations", result);
            }
          }
        }
        const serviceKey = sourceRowKey;
        rows.push({
          ...identity,
          entityType: "service",
          name: String(requiredTransform(adapter, "name", sourceRow)),
          durationMinutes: Number(requiredTransform(adapter, "durationMinutes", sourceRow)),
          priceCents: Number(requiredTransform(adapter, "priceCents", sourceRow)),
          currency: String(optionalTransform(adapter, "currency", sourceRow) ?? sourceCurrency),
          ...(resolved[0] ? { primaryLocation: resolved[0] } : {}),
        });
        resolved.forEach((location, index) => rows.push({
          entityType: "serviceLocation",
          sourceRowKey: `serviceLocation:${sourceRow.physicalRow}:${index}`,
          service: { sourceRowKey: serviceKey },
          location,
        }));
        continue;
      }

      if (adapter.entityType === "staff") {
        const locationRefs: Reference[] = [];
        const serviceRefs: Reference[] = [];
        const locations = adapter.references.locations;
        if (locations && "separator" in locations) {
          for (const raw of splitReferenceList(cell(sourceRow, locations.column), locations.separator)) {
            const result = refFor(locations, raw, input.source.sourceSystem, input.source.sourceAccountKey, input.snapshot);
            if (result) {
              locationRefs.push(result.reference);
              addReferenceDetail("locations", result);
            }
          }
        }
        const services = adapter.references.services;
        if (services && "separator" in services) {
          for (const raw of splitReferenceList(cell(sourceRow, services.column), services.separator)) {
            const result = refFor(services, raw, input.source.sourceSystem, input.source.sourceAccountKey, input.snapshot);
            if (result) {
              serviceRefs.push(result.reference);
              addReferenceDetail("services", result);
            }
          }
        }
        const staffKey = sourceRowKey;
        rows.push({
          ...identity,
          entityType: "staff",
          name: String(requiredTransform(adapter, "name", sourceRow)),
          ...(optionalTransform(adapter, "email", sourceRow) !== undefined ? { email: String(optionalTransform(adapter, "email", sourceRow)) } : {}),
          ...(optionalTransform(adapter, "phone", sourceRow) !== undefined ? { phone: String(optionalTransform(adapter, "phone", sourceRow)) } : {}),
          ...(locationRefs[0] ? { primaryLocation: locationRefs[0] } : {}),
        });
        locationRefs.forEach((location, index) => rows.push({
          entityType: "staffLocation",
          sourceRowKey: `staffLocation:${sourceRow.physicalRow}:${index}`,
          staff: { sourceRowKey: staffKey },
          location,
        }));
        serviceRefs.forEach((service, index) => rows.push({
          entityType: "staffService",
          sourceRowKey: `staffService:${sourceRow.physicalRow}:${index}`,
          staff: { sourceRowKey: staffKey },
          service,
        }));
        continue;
      }

      if (adapter.entityType === "customer") {
        rows.push({
          ...identity,
          entityType: "customer",
          name: String(requiredTransform(adapter, "name", sourceRow)),
          ...(optionalTransform(adapter, "email", sourceRow) !== undefined ? { email: String(optionalTransform(adapter, "email", sourceRow)) } : {}),
          ...(optionalTransform(adapter, "phone", sourceRow) !== undefined ? { phone: String(optionalTransform(adapter, "phone", sourceRow)) } : {}),
        });
        continue;
      }

      const appointmentReferences: Partial<Record<"location" | "service" | "staff" | "customer", Reference>> = {};
      for (const target of ["location", "service", "staff", "customer"] as const) {
        const reference = adapter.references[target];
        if (!reference || "separator" in reference) continue;
        const result = refFor(reference, cell(sourceRow, reference.column), input.source.sourceSystem, input.source.sourceAccountKey, input.snapshot);
        if (result) {
          appointmentReferences[target] = result.reference;
          addReferenceDetail(target, result);
        }
      }
      const sourceStatus = String(requiredTransform(adapter, "sourceStatus", sourceRow)).trim().toLowerCase();
      const financialConfig = adapter.appointmentFinancials ?? { kind: "NONE" as const };
      const financials = financialConfig.kind === "EXACT"
        ? {
          kind: "EXACT" as const,
          currency: String(transformValue(sourceRow, financialConfig.currency)).trim().toUpperCase(),
          priceCents: Number(transformValue(sourceRow, financialConfig.priceCents)),
          taxCents: Number(transformValue(sourceRow, financialConfig.taxCents)),
          discountCents: Number(transformValue(sourceRow, financialConfig.discountCents)),
          depositCents: Number(transformValue(sourceRow, financialConfig.depositCents)),
          amountPaidCents: Number(transformValue(sourceRow, financialConfig.amountPaidCents)),
          amountRefundedCents: Number(transformValue(sourceRow, financialConfig.amountRefundedCents)),
        }
        : { kind: financialConfig.kind };
      rows.push({
        ...identity,
        entityType: "appointment",
        ...appointmentReferences,
        start: String(requiredTransform(adapter, "start", sourceRow)),
        end: String(requiredTransform(adapter, "end", sourceRow)),
        ...(optionalTransform(adapter, "timezone", sourceRow) !== undefined ? { timezone: String(optionalTransform(adapter, "timezone", sourceRow)) } : {}),
        sourceStatus,
        financials,
        ...(optionalTransform(adapter, "notes", sourceRow) !== undefined ? { notes: String(optionalTransform(adapter, "notes", sourceRow)) } : {}),
      });
    } catch (error) {
      if (error instanceof CsvAdapterError) {
        throw new CsvAdapterError(error.code, error.row ?? sourceRow.physicalRow, error.field);
      }
      throw error;
    }
  }

  const payload: CanonicalPayload = {
    source: {
      schemaVersion: "1",
      sourceSystem: input.source.sourceSystem,
      sourceAccountKey: input.source.sourceAccountKey,
      ...(input.source.sourceLabel ? { sourceLabel: input.source.sourceLabel } : {}),
      sourceTimezone,
      sourceCurrency,
      inputChecksum: input.source.inputChecksum.toLowerCase(),
    },
    target: input.target,
    rows,
  };
  return {
    payload,
    mapping,
    referenceValues: Array.from(
      new Map(referenceValues.map((item) => [`${item.field}:${item.targetEntity}:${item.key}`, item])).values(),
    ),
  };
}
