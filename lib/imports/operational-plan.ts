import { locationSlug } from "../location/slug";
import { entityTypes, mappingSchema, payloadSchema, type ImportRow, type MappingConfig, type Preview, type RowOutcome, type TargetSnapshot } from "./contracts";
import { compare } from "./hash";
import { ImportContractError, previewImport } from "./preview";

export interface OperationalRow {
  row: ImportRow;
  outcome: RowOutcome;
  mappedStatus?: MappingConfig["statusMapping"][string];
}
export interface OperationalPlan {
  preview: Preview;
  rows: OperationalRow[];
  locationSlugs: string[];
}

/** B2 overlays commit restrictions without changing Package A source truth. */
export function buildOperationalPlan(input: unknown, snapshot: TargetSnapshot, mappingInput: unknown, asOf: string): OperationalPlan {
  const payload = payloadSchema.parse(input);
  const mapping = mappingSchema.parse(mappingInput);
  payload.rows = payload.rows.map(row => row.entityType === "location"
    ? { ...row, slug: locationSlug(row.slug ?? row.name) } : row);
  // B1's durable locator must identify exactly one physical row.
  if (new Set(payload.rows.map(row => row.sourceRowKey)).size !== payload.rows.length)
    throw new ImportContractError("DUPLICATE_ROW_KEY");
  const preview = previewImport(payload, snapshot, mapping, asOf);
  const rows = preview.normalized.rows.map(row => {
    const original = preview.outcomes.find(o => o.entityType === row.entityType && o.sourceRowKey === row.sourceRowKey)!;
    const outcome = { ...original, reasonCodes: [...original.reasonCodes] };
    if (row.entityType === "location" && !row.slug) {
      outcome.status = "INVALID";
      outcome.plannedAction = "BLOCK";
      outcome.reasonCodes = [...new Set([...outcome.reasonCodes, "INVALID_ROW" as const])].sort();
    }
    if (row.entityType === "appointment" && (row.financials.kind !== "EXACT" || row.financials.discountCents !== 0)) {
      outcome.status = "WARNING";
      outcome.plannedAction = "REVIEW";
      outcome.reasonCodes = [...new Set([...outcome.reasonCodes, "FINANCIAL_RECONCILIATION_REQUIRED" as const])].sort();
    }
    return { row, outcome, ...(row.entityType === "appointment" && mapping.statusMapping[row.sourceStatus]
      ? { mappedStatus: mapping.statusMapping[row.sourceStatus] } : {}) };
  }).sort((a, b) => entityTypes.indexOf(a.row.entityType) - entityTypes.indexOf(b.row.entityType) || compare(a.row.sourceRowKey, b.row.sourceRowKey));
  return { preview, rows, locationSlugs: rows.filter(r => r.row.entityType === "location" && r.outcome.plannedAction === "CREATE").map(r => (r.row as Extract<ImportRow, { entityType: "location" }>).slug!).sort(compare) };
}
