import { z } from "zod";
import type { PlannedAction, ReasonCode } from "./contracts";

export const C2_REVIEW_SCHEMA_VERSION = "c2-reviewed-v1" as const;
export const C2_MAPPING_VERSION = "c2-mapping-v1" as const;

export const C2_SOURCE_SYSTEMS = [
  { key: "picktime", label: "Picktime" },
  { key: "fresha", label: "Fresha" },
  { key: "square", label: "Square" },
  { key: "jane", label: "Jane" },
  { key: "vagaro", label: "Vagaro" },
  { key: "other_csv", label: "Other CSV" },
] as const;

export const c2SourceSystemSchema = z.enum(
  C2_SOURCE_SYSTEMS.map((source) => source.key) as [
    (typeof C2_SOURCE_SYSTEMS)[number]["key"],
    ...(typeof C2_SOURCE_SYSTEMS)[number]["key"][],
  ],
);
export type C2SourceSystem = z.infer<typeof c2SourceSystemSchema>;

export const C2_REVIEW_CATEGORIES = [
  "Will create",
  "Will link",
  "Already exists / skip",
  "Needs review",
  "Blocked",
] as const;
export type C2ReviewCategory = (typeof C2_REVIEW_CATEGORIES)[number];
export function reviewCategoryForAction(action: PlannedAction): C2ReviewCategory {
  switch (action) {
    case "CREATE":
      return "Will create";
    case "LINK_EXISTING":
      return "Will link";
    case "SKIP":
      return "Already exists / skip";
    case "REVIEW":
      return "Needs review";
    case "BLOCK":
      return "Blocked";
  }
}

export type C2ReviewRow = {
  sourceRowKey: string;
  physicalRow?: number;
  entityType: string;
  category: C2ReviewCategory;
  status: string;
  reasonCodes: ReasonCode[];
  sourceLabel?: string;
  sourceDetail?: string;
};

export type C2AttentionRow = {
  physicalRow: number;
  issue: "Needs review" | "Blocked";
  reasons: ReasonCode[];
  values: string[];
};

export function hasFormulaPrefix(value: string): boolean {
  return /^[\s\u00a0]*[=+\-@]/u.test(value);
}

export function neutralizeSpreadsheetCell(value: string): string {
  return hasFormulaPrefix(value) ? `'${value}` : value;
}
function csvCell(value: string): string {
  const safe = neutralizeSpreadsheetCell(value);
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

export function buildAttentionCsv(headers: string[], rows: C2AttentionRow[]): string {
  const header = ["Original row", "Issue", "Reasons", ...headers].map(csvCell).join(",");
  const body = rows.map((row) => [
    String(row.physicalRow),
    row.issue,
    row.reasons.join(" | "),
    ...row.values,
  ].map(csvCell).join(","));
  return [header, ...body].join("\r\n");
}

export function sourceSystemLabel(key: C2SourceSystem): string {
  return C2_SOURCE_SYSTEMS.find((source) => source.key === key)?.label ?? key;
}

export const reviewedEnvelopeSchema = z.object({
  schemaVersion: z.literal(C2_REVIEW_SCHEMA_VERSION),
  review: z.object({
    runId: z.uuid(),
    previewHash: z.string().regex(/^[a-f0-9]{64}$/),
    snapshotHash: z.string().regex(/^[a-f0-9]{64}$/),
    commitGuardHash: z.string().regex(/^[a-f0-9]{64}$/),
  }).strict(),
  mapping: z.unknown(),
  adapter: z.unknown(),
  preview: z.unknown(),
  rows: z.array(z.unknown()).max(5000),
  locationSlugs: z.array(z.string()),
}).passthrough();
