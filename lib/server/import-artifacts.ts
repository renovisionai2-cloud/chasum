import "server-only";

import { z } from "zod";
import { resolveBusinessForUser } from "@/lib/actions/business";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { idEntityTypes, payloadSchema, rowSchema } from "@/lib/imports/contracts";
import { cleanupArtifactBatch } from "./import-artifact-cleanup";
import {
  ARTIFACT_REQUEST_TIMEOUT_MS, artifactBoundary, artifactDigest, artifactRpc, checkArtifactBytes, downloadArtifact,
  IMPORT_ARTIFACT_BUCKET, IMPORT_ARTIFACT_MAX_BYTES, ImportArtifactError, SIGNED_UPLOAD_TTL_SECONDS,
} from "./import-artifact-storage";

const sha = z.string().regex(/^[a-f0-9]{64}$/);
const text = (max: number) => z.string().trim().min(1).max(max).refine(s => !/[\p{Cc}]/u.test(s));
const sourceInput = z.object({ sourceSystem: text(200), displayLabel: text(120) }).strict();
const uploadInput = z.object({ sourceId: z.uuid(), entityType: z.enum(idEntityTypes) }).strict();
const sourceView = z.object({ id: z.uuid(), sourceSystem: z.string(), displayLabel: z.string(), createdAt: z.string() }).strict();
const artifactSchema = z.object({
  id: z.uuid(), business_id: z.uuid(), created_by: z.uuid(), source_id: z.uuid(), entity_type: z.enum(idEntityTypes),
  state: z.enum(["upload_pending", "raw_verified", "freezing", "reviewed_frozen", "cleanup_pending", "deleted"]),
  raw_object_key: z.string(), raw_sha256: sha.nullable(), raw_size_bytes: z.number().nullable(),
  raw_expires_at: z.string(), created_at: z.string(), upload_quiesce_at: z.string(),
  reviewed_object_key: z.string().nullable(), reviewed_sha256: sha.nullable(), reviewed_size_bytes: z.number().nullable(),
  reviewed_expires_at: z.string().nullable(), lease_token: z.uuid().nullable(),
  import_run_id: z.uuid().nullable(),
  source_system: z.string().optional(), source_account_key: z.string().optional(),
});
// Validate ownership/source and bounded shape without rebuilding, normalizing or
// reserializing the exact bytes. Full operational review remains A/B2/C2's job.
const reviewedPlanSchema = z.object({
  preview: z.object({ normalized: payloadSchema, previewHash: sha, snapshotHash: sha }).passthrough(),
  rows: z.array(z.object({ row: rowSchema, outcome: z.object({}).passthrough() }).passthrough()).max(5000),
}).passthrough();

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new ImportArtifactError("INVALID_INPUT");
  return result.data;
}

/** Fresh user verification on EVERY owner entry, before any service client.
 * No supplied actor/Business; membership, Trusted Admin and Platform Admin
 * alone cannot pass the explicit primary-owner comparison.
 */
async function ownerContext() {
  const session = await createClient();
  const { data: { user }, error } = await session.auth.getUser();
  if (error || !user) throw new ImportArtifactError("OWNER_REQUIRED");
  const business = await resolveBusinessForUser(user.id);
  if (!business || business.owner_id !== user.id) throw new ImportArtifactError("OWNER_REQUIRED");
  return { service: createServiceClient({ requestTimeoutMs: ARTIFACT_REQUEST_TIMEOUT_MS }), p_business: business.id, p_actor: user.id };
}
type Owner = Awaited<ReturnType<typeof ownerContext>>;
function authority(auth: Owner) { return { p_business: auth.p_business, p_actor: auth.p_actor }; }
async function access(auth: Owner, id: string, kind: "raw" | "reviewed") {
  const row = artifactSchema.parse(await artifactRpc(auth.service, "c1_access_artifact", {
    ...authority(auth), p_artifact: id, p_kind: kind,
  }));
  if (row.id !== id || row.business_id !== auth.p_business || row.created_by !== auth.p_actor)
    throw new ImportArtifactError("OWNER_REQUIRED");
  return row;
}

export async function createImportSource(input: unknown) {
  return artifactBoundary(async () => {
    const auth = await ownerContext();
    const value = parse(sourceInput, input);
    // SQL generates source_account_key; no input path accepts one.
    return sourceView.parse(await artifactRpc(auth.service, "c1_create_source", {
      ...authority(auth), p_system: value.sourceSystem, p_label: value.displayLabel,
    }));
  });
}

export async function listImportSources() {
  return artifactBoundary(async () => {
    const auth = await ownerContext();
    return z.array(sourceView).parse(await artifactRpc(auth.service, "c1_list_sources", authority(auth)));
  });
}

/** Capability for one new random path only. Provider TTL is fixed at 2 hours;
 * not single-use. Never reissue on an existing row, never enable upsert.
 */
export async function createImportArtifactUpload(input: unknown) {
  return artifactBoundary(async () => {
    const auth = await ownerContext();
    const value = parse(uploadInput, input);
    const artifact = artifactSchema.parse(await artifactRpc(auth.service, "c1_create_artifact", {
      ...authority(auth), p_source: value.sourceId, p_entity: value.entityType,
    }));
    // Issuance is limited to the first minute. The database keeps a five-minute
    // margin before final raw deletion; do not issue after a stalled DB call.
    if (Date.now() >= Date.parse(artifact.created_at) + 60_000) throw new ImportArtifactError();
    const { data, error } = await auth.service.storage.from(IMPORT_ARTIFACT_BUCKET)
      .createSignedUploadUrl(artifact.raw_object_key, { upsert: false });
    if (error || !data || data.path !== artifact.raw_object_key) throw new ImportArtifactError();
    // Read provider expiry only to fail closed on unexpected lifetime/latency.
    // This is NOT a substitute for provider signature verification.
    const token = parse(z.string(), data.token);
    const claims = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8")) as { exp?: number };
    if (!Number.isSafeInteger(claims.exp) || claims.exp! * 1000 <= Date.now()
      || claims.exp! * 1000 > Date.parse(artifact.upload_quiesce_at) - 60_000)
      throw new ImportArtifactError();
    return {
      artifactId: artifact.id, bucket: IMPORT_ARTIFACT_BUCKET, path: data.path, token,
      expiresAt: new Date(claims.exp! * 1000).toISOString(),
      providerTtlSeconds: SIGNED_UPLOAD_TTL_SECONDS, maxBytes: IMPORT_ARTIFACT_MAX_BYTES,
    };
  });
}

export async function verifyImportArtifactUpload(artifactId: string) {
  return artifactBoundary(async () => {
    const auth = await ownerContext();
    const id = parse(z.uuid(), artifactId);
    const artifact = await access(auth, id, "raw");
    if (artifact.state !== "upload_pending") throw new ImportArtifactError();
    const actual = await downloadArtifact(auth.service, artifact.raw_object_key, false);
    await artifactRpc(auth.service, "c1_verify_raw", {
      ...authority(auth), p_artifact: id, p_sha: actual.sha256,
      p_size: actual.bytes.byteLength, p_media: actual.media,
    });
    return { artifactId: id, sha256: actual.sha256, sizeBytes: actual.bytes.byteLength };
  });
}

/** Private raw read for future C2 parsing. Never emits a bearer download URL. */
export async function readVerifiedImportSource(artifactId: string) {
  return artifactBoundary(async () => {
    const auth = await ownerContext();
    const id = parse(z.uuid(), artifactId);
    const artifact = await access(auth, id, "raw");
    if (artifact.state !== "raw_verified") throw new ImportArtifactError();
    const actual = await downloadArtifact(auth.service, artifact.raw_object_key, false);
    if (actual.sha256 !== artifact.raw_sha256 || actual.bytes.byteLength !== artifact.raw_size_bytes) throw new ImportArtifactError();
    await access(await ownerContext(), id, "raw"); // owner/time/state recheck after I/O
    return { bytes: actual.bytes, sha256: actual.sha256, sourceId: artifact.source_id,
      sourceSystem: artifact.source_system!, sourceAccountKey: artifact.source_account_key!, entityType: artifact.entity_type };
  });
}

/** Exact OperationalPlan JSON supplied by future C2 SERVER logic, not a Server
 * Action. No parsing/mapping UI, preparation or second B2 writer is introduced.
 */
export async function freezeReviewedImportPlan(artifactId: string, reviewedBytes: Uint8Array) {
  return artifactBoundary(async () => {
    const auth = await ownerContext();
    const id = parse(z.uuid(), artifactId);
    if (!(reviewedBytes instanceof Uint8Array)) throw new ImportArtifactError("INVALID_INPUT");
    const bytes = Buffer.from(reviewedBytes); // isolate from caller mutation during awaits
    checkArtifactBytes(bytes);
    let json: unknown;
    try { json = JSON.parse(bytes.toString("utf8")); }
    catch { throw new ImportArtifactError("INVALID_INPUT"); }
    const plan = parse(reviewedPlanSchema, json);
    const artifact = await access(auth, id, "raw");
    const { source, target } = plan.preview.normalized;
    if (artifact.state !== "raw_verified" || target.businessId !== artifact.business_id
      || source.sourceSystem !== artifact.source_system || source.sourceAccountKey !== artifact.source_account_key
      || source.inputChecksum !== artifact.raw_sha256) throw new ImportArtifactError("INVALID_INPUT");
    const allowed = [artifact.entity_type, ...(artifact.entity_type === "service" ? ["serviceLocation"]
      : artifact.entity_type === "staff" ? ["staffLocation", "staffService"] : [])];
    if ([...plan.rows.map(r => r.row), ...plan.preview.normalized.rows].some(r => !allowed.includes(r.entityType)))
      throw new ImportArtifactError("INVALID_INPUT");
    const digest = artifactDigest(bytes);
    const reserved = artifactSchema.parse(await artifactRpc(auth.service, "c1_reserve_reviewed", {
      ...authority(auth), p_artifact: id, p_sha: digest, p_size: bytes.byteLength,
      p_preview: plan.preview.previewHash, p_snapshot: plan.preview.snapshotHash,
    }));
    if (!reserved.reviewed_object_key || !reserved.lease_token) throw new ImportArtifactError();
    // No fresh Storage write may begin after a stalled reservation response.
    if (!reserved.reviewed_expires_at || Date.now() >= Date.parse(reserved.reviewed_expires_at) - 72 * 60 * 60 * 1000 + 60_000)
      throw new ImportArtifactError();
    const uploaded = await auth.service.storage.from(IMPORT_ARTIFACT_BUCKET).upload(reserved.reviewed_object_key, bytes, {
      contentType: "application/json", cacheControl: "0", upsert: false,
    });
    if (uploaded.error) throw new ImportArtifactError();
    const stored = await downloadArtifact(auth.service, reserved.reviewed_object_key, true);
    if (stored.sha256 !== digest || stored.bytes.byteLength !== bytes.byteLength) throw new ImportArtifactError();
    await artifactRpc(auth.service, "c1_finish_reviewed", {
      ...authority(await ownerContext()), p_artifact: id, p_token: reserved.lease_token,
    });
    // Failure remains durably discoverable; successful freeze does not depend
    // on an immediately healthy deletion provider. Cron retries autonomously.
    try { await cleanupArtifactBatch(auth.service, id); }
    catch { /* No upstream error, key or payload is logged. */ }
    return { artifactId: id, sha256: digest, expiresAt: reserved.reviewed_expires_at! };
  });
}

export async function readReviewedImportPlan(artifactId: string) {
  return artifactBoundary(async () => {
    const auth = await ownerContext();
    const id = parse(z.uuid(), artifactId);
    const artifact = await access(auth, id, "reviewed");
    if (!artifact.reviewed_object_key) throw new ImportArtifactError();
    const actual = await downloadArtifact(auth.service, artifact.reviewed_object_key, true);
    if (actual.sha256 !== artifact.reviewed_sha256 || actual.bytes.byteLength !== artifact.reviewed_size_bytes)
      throw new ImportArtifactError();
    const confirmed = await access(await ownerContext(), id, "reviewed");
    return {
      bytes: actual.bytes,
      sha256: actual.sha256,
      artifactId: confirmed.id,
      importRunId: confirmed.import_run_id,
    };
  });
}

export async function bindImportArtifactToRun(artifactId: string, runId: string) {
  return artifactBoundary(async () => {
    const auth = await ownerContext();
    await artifactRpc(auth.service, "c1_bind_run", {
      ...authority(auth), p_artifact: parse(z.uuid(), artifactId), p_run: parse(z.uuid(), runId),
    });
  });
}
