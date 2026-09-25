import "server-only";

import { z } from "zod";
import { resolveBusinessForUser } from "@/lib/actions/business";
import {
  C2_REVIEW_CATEGORIES,
  C2_REVIEW_SCHEMA_VERSION,
  c2SourceSystemSchema,
  reviewCategoryForAction,
  type C2AttentionRow,
  type C2ReviewCategory,
  type C2ReviewRow,
} from "@/lib/imports/c2-contract";
import {
  adaptCsvToCanonical,
  csvAdapterConfigSchema,
  detectCsvDelimiter,
  parseCsvBytes,
  type CsvAdapterConfigV1,
  type ParsedCsv,
} from "@/lib/imports/csv-adapter";
import { mappingSchema, snapshotSchema, type MappingConfig } from "@/lib/imports/contracts";
import {
  bindImportArtifactToRun,
  freezeReviewedImportPlan,
  listImportSources,
  readVerifiedImportSource,
} from "@/lib/server/import-artifacts";
import { prepareGovernedImport, previewGovernedImport } from "@/lib/server/import-writer";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const uuid = z.uuid();
const sha = z.string().regex(/^[a-f0-9]{64}$/);
export const c2DelimiterSchema = z.enum([",", ";", "\t"]);
export type C2Delimiter = z.infer<typeof c2DelimiterSchema>;
const contextSchema = z.object({
  business: z.object({
    id: z.uuid(),
    timezone: z.string(),
    currency: z.string(),
    planKey: z.string(),
  }),
  capacity: z.object({
    maxLocations: z.number().int().nullable(),
    maxStaff: z.number().int().nullable(),
    activeLocations: z.number().int(),
    activeStaff: z.number().int(),
  }),
  snapshot: snapshotSchema,
  fingerprint: sha,
});

export class C2ImportError extends Error {
  constructor(
    public readonly code:
      | "OWNER_REQUIRED"
      | "INVALID_INPUT"
      | "SOURCE_NOT_SUPPORTED"
      | "PARSE_FAILED"
      | "REVIEW_AGAIN"
      | "UNAVAILABLE",
  ) {
    super(code);
  }
}

async function ownerContext() {
  const session = await createClient();
  const { data: { user }, error } = await session.auth.getUser();
  if (error || !user) throw new C2ImportError("OWNER_REQUIRED");
  const business = await resolveBusinessForUser(user.id);
  if (!business || business.owner_id !== user.id) throw new C2ImportError("OWNER_REQUIRED");
  return { actor: user.id, business, service: createServiceClient() };
}

async function governedContext() {
  const auth = await ownerContext();
  const { data, error } = await auth.service.rpc("get_data_import_context", {
    p_business: auth.business.id,
    p_actor: auth.actor,
  });
  if (error) throw new C2ImportError("UNAVAILABLE");
  return { auth, context: contextSchema.parse(data) };
}
function physicalRowFromKey(sourceRowKey: string): number | undefined {
  const match = /^[^:]+:(\d+)/.exec(sourceRowKey);
  const value = match ? Number(match[1]) : Number.NaN;
  return Number.isSafeInteger(value) && value > 0 ? value : undefined;
}

function reviewProjection(table: ParsedCsv, plan: Awaited<ReturnType<typeof previewGovernedImport>>["plan"]) {
  const normalized = new Map(plan.preview.normalized.rows.map((row) => [
    `${row.entityType}:${row.sourceRowKey}`,
    row,
  ]));
  const reviewRows: C2ReviewRow[] = plan.rows.map(({ outcome }) => {
    const row = normalized.get(`${outcome.entityType}:${outcome.sourceRowKey}`);
    const sourceLabel = row && "name" in row ? row.name
      : row?.entityType === "appointment" ? row.start : undefined;
    const sourceDetail = row?.entityType === "customer" ? row.email
      : row?.entityType === "staff" ? row.email
      : undefined;
    return {
      sourceRowKey: outcome.sourceRowKey,
      physicalRow: physicalRowFromKey(outcome.sourceRowKey),
      entityType: outcome.entityType,
      category: reviewCategoryForAction(outcome.plannedAction),
      status: outcome.status,
      reasonCodes: outcome.reasonCodes,
      ...(sourceLabel ? { sourceLabel } : {}),
      ...(sourceDetail ? { sourceDetail } : {}),
    };
  });
  const counts = Object.fromEntries(C2_REVIEW_CATEGORIES.map((category) => [category, 0])) as Record<C2ReviewCategory, number>;
  reviewRows.forEach((row) => { counts[row.category] += 1; });

  const issues = new Map<number, { issue: "Needs review" | "Blocked"; reasons: Set<C2ReviewRow["reasonCodes"][number]> }>();
  for (const row of reviewRows) {
    if (!row.physicalRow || (row.category !== "Needs review" && row.category !== "Blocked")) continue;
    const current = issues.get(row.physicalRow) ?? {
      issue: row.category,
      reasons: new Set<C2ReviewRow["reasonCodes"][number]>(),
    };
    if (row.category === "Blocked") current.issue = "Blocked";
    row.reasonCodes.forEach((reason) => current.reasons.add(reason));
    issues.set(row.physicalRow, current);
  }
  const byPhysical = new Map(table.rows.map((row) => [row.physicalRow, row]));
  const attentionRows: C2AttentionRow[] = [...issues.entries()].flatMap(([physicalRow, issue]) => {
    const original = byPhysical.get(physicalRow);
    return original ? [{
      physicalRow,
      issue: issue.issue,
      reasons: [...issue.reasons].sort(),
      values: original.values,
    }] : [];
  });
  return { reviewRows, counts, attentionRows };
}
async function readAndAdapt(input: {
  artifactId: string;
  adapter: unknown;
  mapping: unknown;
}) {
  const artifactId = uuid.parse(input.artifactId);
  const adapter = csvAdapterConfigSchema.parse(input.adapter);
  const mapping = mappingSchema.parse(input.mapping);
  const raw = await readVerifiedImportSource(artifactId);
  const sourceSystem = c2SourceSystemSchema.safeParse(raw.sourceSystem);
  if (!sourceSystem.success) throw new C2ImportError("SOURCE_NOT_SUPPORTED");
  if (raw.entityType !== adapter.entityType) throw new C2ImportError("INVALID_INPUT");
  let table: ParsedCsv;
  try {
    table = parseCsvBytes(raw.bytes, adapter.delimiter);
  } catch {
    throw new C2ImportError("PARSE_FAILED");
  }
  const { context } = await governedContext();
  const adapted = adaptCsvToCanonical({
    table,
    adapter,
    mapping,
    source: {
      sourceSystem: sourceSystem.data,
      sourceAccountKey: raw.sourceAccountKey,
      inputChecksum: raw.sha256,
    },
    target: {
      businessId: context.business.id,
      businessTimezone: context.business.timezone,
      businessCurrency: context.business.currency,
    },
    snapshot: context.snapshot,
  });
  return { raw, table, adapter, mapping: adapted.mapping, payload: adapted.payload, referenceValues: adapted.referenceValues };
}

export async function getC2ImportSetup() {
  const { auth } = await governedContext();
  const sources = (await listImportSources()).filter((source) => c2SourceSystemSchema.safeParse(source.sourceSystem).success);
  const businessId = auth.business.id;
  const [locations, services, staff] = await Promise.all([
    auth.service.from("locations").select("id,name").eq("business_id", businessId).order("name").limit(1000),
    auth.service.from("services").select("id,name").eq("business_id", businessId).order("name").limit(1000),
    auth.service.from("staff").select("id,name").eq("business_id", businessId).order("name").limit(1000),
  ]);
  if (locations.error || services.error || staff.error) throw new C2ImportError("UNAVAILABLE");
  return {
    business: {
      id: businessId,
      timezone: auth.business.timezone,
      currency: String(auth.business.currency ?? "").toUpperCase(),
    },
    sources,
    targets: {
      location: locations.data ?? [],
      service: services.data ?? [],
      staff: staff.data ?? [],
    },
  };
}
export async function inspectC2Artifact(artifactIdInput: unknown, requestedDelimiter?: unknown) {
  const artifactId = uuid.parse(artifactIdInput);
  const raw = await readVerifiedImportSource(artifactId);
  const sourceSystem = c2SourceSystemSchema.safeParse(raw.sourceSystem);
  if (!sourceSystem.success) throw new C2ImportError("SOURCE_NOT_SUPPORTED");
  const detected = detectCsvDelimiter(raw.bytes);
  const delimiter = requestedDelimiter == null
    ? detected.delimiter
    : c2DelimiterSchema.parse(requestedDelimiter);
  if (!delimiter) {
    return {
      artifactId,
      entityType: raw.entityType,
      sha256: raw.sha256,
      sourceSystem: sourceSystem.data,
      delimiter: null,
      detection: detected,
      headers: [],
      samples: [],
      rowCount: null,
    };
  }
  let table: ParsedCsv;
  try {
    table = parseCsvBytes(raw.bytes, delimiter);
  } catch {
    throw new C2ImportError("PARSE_FAILED");
  }
  return {
    artifactId,
    entityType: raw.entityType,
    sha256: raw.sha256,
    sourceSystem: sourceSystem.data,
    delimiter,
    detection: detected,
    headers: table.headers.map((header, index) => ({ index, header })),
    samples: table.rows.slice(0, 5).map((row) => ({ physicalRow: row.physicalRow, values: row.values })),
    rowCount: table.rows.length,
  };
}

export async function previewC2Artifact(input: { artifactId: string; adapter: unknown; mapping: unknown }) {
  const adapted = await readAndAdapt(input);
  const governed = await previewGovernedImport(adapted.payload, adapted.mapping);
  const projected = reviewProjection(adapted.table, governed.plan);
  const sourceStatuses = Array.from(new Set(
    governed.plan.preview.normalized.rows
      .filter((row) => row.entityType === "appointment")
      .map((row) => row.sourceStatus),
  )).sort();
  return {
    previewHash: governed.plan.preview.previewHash,
    snapshotHash: governed.plan.preview.snapshotHash,
    capacity: governed.capacity,
    counts: projected.counts,
    reviewRows: projected.reviewRows,
    attentionRows: projected.attentionRows,
    headers: adapted.table.headers,
    referenceValues: adapted.referenceValues,
    sourceStatuses,
    locationSlugs: governed.plan.locationSlugs,
  };
}
export async function searchC2Customers(queryInput: unknown) {
  const query = z.string().trim().min(2).max(120).parse(queryInput);
  const { auth } = await governedContext();
  const safe = query.replace(/[\\%_]/g, (value) => `\\${value}`);
  const base = auth.service
    .from("customers")
    .select("id,name,email,phone")
    .eq("business_id", auth.business.id)
    .limit(8);
  const result = query.includes("@")
    ? await base.ilike("email", safe)
    : await base.ilike("name", `${safe}%`);
  if (result.error) throw new C2ImportError("UNAVAILABLE");
  return result.data ?? [];
}

export async function lockC2ReviewedImport(input: {
  artifactId: string;
  adapter: unknown;
  mapping: unknown;
  displayedPreviewHash: string;
  displayedSnapshotHash: string;
}) {
  const displayedPreviewHash = sha.parse(input.displayedPreviewHash);
  const displayedSnapshotHash = sha.parse(input.displayedSnapshotHash);
  const adapted = await readAndAdapt(input);
  const current = await previewGovernedImport(adapted.payload, adapted.mapping);
  if (
    current.plan.preview.previewHash !== displayedPreviewHash
    || current.plan.preview.snapshotHash !== displayedSnapshotHash
  ) {
    throw new C2ImportError("REVIEW_AGAIN");
  }

  const prepared = await prepareGovernedImport(adapted.payload, adapted.mapping);
  if (
    prepared.plan.preview.previewHash !== displayedPreviewHash
    || prepared.plan.preview.snapshotHash !== displayedSnapshotHash
  ) {
    throw new C2ImportError("REVIEW_AGAIN");
  }
  const envelope = {
    schemaVersion: C2_REVIEW_SCHEMA_VERSION,
    review: prepared.review,
    mapping: adapted.mapping,
    adapter: adapted.adapter,
    preview: prepared.plan.preview,
    rows: prepared.plan.rows,
    locationSlugs: prepared.plan.locationSlugs,
  } as const;
  const frozen = await freezeReviewedImportPlan(
    uuid.parse(input.artifactId),
    Buffer.from(JSON.stringify(envelope), "utf8"),
  );
  await bindImportArtifactToRun(uuid.parse(input.artifactId), prepared.review.runId);
  return {
    state: "ready_for_import" as const,
    runId: prepared.review.runId,
    previewHash: prepared.review.previewHash,
    snapshotHash: prepared.review.snapshotHash,
    commitGuardHash: prepared.review.commitGuardHash,
    reviewedSha256: frozen.sha256,
    reviewedExpiresAt: frozen.expiresAt,
  };
}

export function parseC2Adapter(input: unknown): CsvAdapterConfigV1 {
  return csvAdapterConfigSchema.parse(input);
}

export function parseC2Mapping(input: unknown): MappingConfig {
  return mappingSchema.parse(input);
}
