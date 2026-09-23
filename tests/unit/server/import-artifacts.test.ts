// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { StorageClient } from "@supabase/storage-js";
const mock = vi.hoisted(() => ({ user: vi.fn(), business: vi.fn(), service: vi.fn(), rpc: vi.fn(),
  from: vi.fn(), sign: vi.fn(), info: vi.fn(), download: vi.fn(), upload: vi.fn(), remove: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { getUser: mock.user } }) }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: mock.service }));
vi.mock("@/lib/actions/business", () => ({ resolveBusinessForUser: mock.business }));
import { bindImportArtifactToRun, createImportArtifactUpload, createImportSource, freezeReviewedImportPlan,
  listImportSources, readReviewedImportPlan, readVerifiedImportSource, verifyImportArtifactUpload } from "@/lib/server/import-artifacts";
import { cleanupArtifactBatch, cleanupImportArtifacts } from "@/lib/server/import-artifact-cleanup";
import { artifactDigest, deleteArtifactObject, IMPORT_ARTIFACT_MAX_BYTES } from "@/lib/server/import-artifact-storage";

const business = "10000000-0000-4000-8000-000000000001", actor = "20000000-0000-4000-8000-000000000001";
const id = "30000000-0000-4000-8000-000000000001", sourceId = "40000000-0000-4000-8000-000000000001";
const token = "50000000-0000-4000-8000-000000000001", run = "60000000-0000-4000-8000-000000000001";
const rawKey = `${business}/${id}/raw/${token}`, reviewedKey = `${business}/${id}/reviewed/${token}`;
const now = new Date("2026-09-23T12:00:00Z");
const raw = Buffer.from("name,email\nSynthetic Person,synthetic@example.test\n");
const rawSha = createHash("sha256").update(raw).digest("hex");
const source = { id: sourceId, sourceSystem: "fixture", displayLabel: "Synthetic workspace", createdAt: now.toISOString() };
const baseRow = () => ({ id, business_id: business, created_by: actor, source_id: sourceId, entity_type: "customer",
  state: "upload_pending", raw_object_key: rawKey, raw_sha256: null as string | null, raw_size_bytes: null as number | null,
  raw_expires_at: "2026-09-24T12:00:00Z", created_at: now.toISOString(), upload_quiesce_at: "2026-09-23T14:05:00Z",
  reviewed_object_key: null as string | null, reviewed_sha256: null as string | null, reviewed_size_bytes: null as number | null,
  reviewed_expires_at: null as string | null, lease_token: null as string | null, source_system: "fixture", source_account_key: sourceId });
let artifact: ReturnType<typeof baseRow>;
let objects: Map<string, { bytes: Buffer; media: string }>;
const service = { rpc: mock.rpc, storage: { from: mock.from } };
const jwt = (exp = Math.floor(now.getTime() / 1000) + 7200) => `header.${Buffer.from(JSON.stringify({ exp })).toString("base64url")}.synthetic-signature`;
const plan = () => ({ preview: { normalized: {
  source: { schemaVersion: "1", sourceSystem: "fixture", sourceAccountKey: sourceId, sourceTimezone: "UTC", sourceCurrency: "EUR", inputChecksum: rawSha },
  target: { businessId: business, businessTimezone: "UTC", businessCurrency: "EUR" }, rows: [],
}, previewHash: "a".repeat(64), snapshotHash: "b".repeat(64) }, rows: [], locationSlugs: [] });
const verified = () => { artifact.state = "raw_verified"; artifact.raw_sha256 = rawSha; artifact.raw_size_bytes = raw.length; };
const frozen = () => {
  verified(); artifact.state = "reviewed_frozen"; artifact.reviewed_object_key = reviewedKey;
  const bytes = Buffer.from(JSON.stringify(plan(), null, 2));
  artifact.reviewed_sha256 = artifactDigest(bytes); artifact.reviewed_size_bytes = bytes.length;
  artifact.reviewed_expires_at = "2026-09-26T12:00:00Z";
  objects.set(reviewedKey, { bytes, media: "application/json" }); return bytes;
};
const claim = (changes = {}) => ({ id, lease_token: token, raw_object_key: rawKey,
  reviewed_object_key: reviewedKey, raw_due: true, reviewed_due: false, ...changes });

beforeEach(() => {
  vi.resetAllMocks(); vi.useFakeTimers(); vi.setSystemTime(now);
  artifact = baseRow(); objects = new Map([[rawKey, { bytes: raw, media: "text/csv" }]]);
  mock.user.mockResolvedValue({ data: { user: { id: actor } }, error: null });
  mock.business.mockResolvedValue({ id: business, owner_id: actor }); mock.service.mockReturnValue(service);
  mock.from.mockReturnValue({ createSignedUploadUrl: mock.sign, info: mock.info, download: mock.download, upload: mock.upload, remove: mock.remove });
  mock.sign.mockImplementation(async (path: string) => ({ data: { path, token: jwt(), signedUrl: "https://synthetic.invalid/SECRET" }, error: null }));
  mock.info.mockImplementation(async (key: string) => {
    const object = objects.get(key);
    return object ? { data: { size: object.bytes.length, contentType: object.media }, error: null }
      : { data: null, error: { status: 400, statusCode: "NoSuchKey", message: "private provider details" } };
  });
  mock.download.mockImplementation(async (key: string) => ({ data: objects.has(key) ? new Blob([objects.get(key)!.bytes], { type: objects.get(key)!.media }) : null, error: null }));
  mock.upload.mockImplementation(async (key: string, bytes: Buffer, options: { contentType: string }) => {
    objects.set(key, { bytes: Buffer.from(bytes), media: options.contentType }); return { data: { path: key }, error: null };
  });
  mock.remove.mockImplementation(async (keys: string[]) => { keys.forEach(key => objects.delete(key)); return { data: [], error: null }; });
  mock.rpc.mockImplementation(async (name: string, args: Record<string, unknown>) => {
    if (name === "c1_create_source") return { data: source, error: null };
    if (name === "c1_list_sources") return { data: [source], error: null };
    if (name === "c1_reserve_reviewed") {
      artifact = { ...artifact, state: "freezing", reviewed_object_key: reviewedKey, reviewed_sha256: args.p_sha as string,
        reviewed_size_bytes: args.p_size as number, reviewed_expires_at: "2026-09-26T12:00:00Z", lease_token: token };
    }
    if (name === "c1_finish_reviewed") artifact.state = "reviewed_frozen";
    if (name === "c1_claim_cleanup") return { data: [], error: null };
    return { data: { ...artifact }, error: null };
  });
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

const entries = [
  () => createImportSource({ sourceSystem: "fixture", displayLabel: "Synthetic workspace" }),
  () => listImportSources(), () => createImportArtifactUpload({ sourceId, entityType: "customer" }),
  () => verifyImportArtifactUpload(id), () => readVerifiedImportSource(id),
  () => freezeReviewedImportPlan(id, Buffer.from(JSON.stringify(plan()))),
  () => readReviewedImportPlan(id), () => bindImportArtifactToRun(id, run),
];
describe.each(entries)("owner entry %s", entry => {
  it("denies missing session before any privileged client", async () => {
    mock.user.mockResolvedValue({ data: { user: null }, error: null });
    await expect(entry()).rejects.toMatchObject({ code: "OWNER_REQUIRED" }); expect(mock.service).not.toHaveBeenCalled();
  });
  it("denies member/admin/platform authority without primary ownership", async () => {
    mock.business.mockResolvedValue({ id: business, owner_id: run });
    await expect(entry()).rejects.toMatchObject({ code: "OWNER_REQUIRED" }); expect(mock.service).not.toHaveBeenCalled();
  });
});
it("creates trimmed source display fields without accepting a key", async () => {
  expect(await createImportSource({ sourceSystem: " fixture ", displayLabel: " Synthetic workspace " })).toEqual(source);
  expect(mock.rpc).toHaveBeenCalledWith("c1_create_source", { p_business: business, p_actor: actor, p_system: "fixture", p_label: "Synthetic workspace" });
  await expect(createImportSource({ sourceSystem: "fixture", displayLabel: "Synthetic", sourceAccountKey: actor })).rejects.toMatchObject({ code: "INVALID_INPUT" });
  expect(mock.rpc).toHaveBeenCalledTimes(1);
});
it.each(["", "x".repeat(121), "line\nlabel"])("rejects invalid label %s", async displayLabel => {
  await expect(createImportSource({ sourceSystem: "fixture", displayLabel })).rejects.toMatchObject({ code: "INVALID_INPUT" });
  expect(mock.rpc).not.toHaveBeenCalled();
});
it("lists only projected safe display fields", async () => { expect(await listImportSources()).toEqual([source]); });
it("issues one exact path capability, with no upsert and no URL response", async () => {
  const result = await createImportArtifactUpload({ sourceId, entityType: "customer" });
  expect(mock.sign).toHaveBeenCalledExactlyOnceWith(rawKey, { upsert: false });
  expect(mock.from).toHaveBeenCalledWith("import-artifacts");
  expect(result).toMatchObject({ artifactId: id, path: rawKey, token: jwt(), providerTtlSeconds: 7200, maxBytes: 10485760 });
  expect(result).not.toHaveProperty("signedUrl");
  expect(mock.rpc.mock.invocationCallOrder[0]).toBeLessThan(mock.sign.mock.invocationCallOrder[0]);
});
it.each([0, Math.floor(now.getTime() / 1000) + 7500])("refuses expired or unexpectedly long provider expiry %s", async exp => {
  mock.sign.mockResolvedValue({ data: { path: rawKey, token: jwt(exp) }, error: null });
  await expect(createImportArtifactUpload({ sourceId, entityType: "customer" })).rejects.toMatchObject({ code: "UNAVAILABLE" });
});
it("does not sign after a stalled create reservation", async () => {
  artifact.created_at = "2026-09-23T11:50:00Z";
  await expect(createImportArtifactUpload({ sourceId, entityType: "customer" })).rejects.toMatchObject({ code: "UNAVAILABLE" });
  expect(mock.sign).not.toHaveBeenCalled();
});
it("rejects filename, business and actor supplied to upload intent", async () => {
  await expect(createImportArtifactUpload({ sourceId, entityType: "customer", businessId: business, actorId: actor, filename: "PII.csv" }))
    .rejects.toMatchObject({ code: "INVALID_INPUT" }); expect(mock.sign).not.toHaveBeenCalled();
});
it("verifies actual bytes, not metadata size or caller hash", async () => {
  mock.info.mockResolvedValue({ data: { size: 1, contentType: "text/csv; charset=utf-8" }, error: null });
  expect(await verifyImportArtifactUpload(id)).toEqual({ artifactId: id, sha256: rawSha, sizeBytes: raw.length });
  expect(mock.rpc).toHaveBeenLastCalledWith("c1_verify_raw", { p_business: business, p_actor: actor, p_artifact: id, p_sha: rawSha, p_size: raw.length, p_media: "text/csv" });
});
it.each([Buffer.from([0, 1, 2]), Buffer.from([0xc3, 0x28]), Buffer.alloc(IMPORT_ARTIFACT_MAX_BYTES + 1, 65), Buffer.alloc(0)])("rejects unsafe or out-of-bound raw bytes", async bytes => {
  objects.set(rawKey, { bytes, media: "text/csv" });
  await expect(verifyImportArtifactUpload(id)).rejects.toMatchObject({ code: "INVALID_INPUT" });
  expect(mock.rpc.mock.calls.some(([name]) => name === "c1_verify_raw")).toBe(false);
});
it("rejects oversize bytes even if provider metadata claims small", async () => {
  mock.info.mockResolvedValue({ data: { size: 1, contentType: "text/csv" }, error: null });
  objects.set(rawKey, { bytes: Buffer.alloc(IMPORT_ARTIFACT_MAX_BYTES + 1, 65), media: "text/csv" });
  await expect(verifyImportArtifactUpload(id)).rejects.toMatchObject({ code: "INVALID_INPUT" });
});
it.each(["application/pdf", "image/png", "application/json"])("rejects non-CSV media posture %s", async media => {
  objects.set(rawKey, { bytes: raw, media }); await expect(verifyImportArtifactUpload(id)).rejects.toMatchObject({ code: "INVALID_INPUT" });
});
it("missing object fails safely without exposing provider body", async () => {
  objects.clear(); await expect(verifyImportArtifactUpload(id)).rejects.toThrow("unavailable or expired");
  expect(mock.download).not.toHaveBeenCalled();
});
it("fails foreign artifact response before private object access", async () => {
  artifact.business_id = run;
  await expect(verifyImportArtifactUpload(id)).rejects.toMatchObject({ code: "OWNER_REQUIRED" }); expect(mock.info).not.toHaveBeenCalled();
});
it("reverification cannot update already-verified metadata", async () => {
  verified(); await expect(verifyImportArtifactUpload(id)).rejects.toMatchObject({ code: "UNAVAILABLE" }); expect(mock.info).not.toHaveBeenCalled();
});
it("private raw read verifies hash and reauthenticates after I/O", async () => {
  verified(); const result = await readVerifiedImportSource(id);
  expect(result.bytes).toEqual(raw); expect(result.sourceAccountKey).toEqual(sourceId); expect(mock.user).toHaveBeenCalledTimes(2);
});
it("raw read rejects modified bytes", async () => {
  verified(); objects.set(rawKey, { bytes: Buffer.from("changed"), media: "text/csv" });
  await expect(readVerifiedImportSource(id)).rejects.toMatchObject({ code: "UNAVAILABLE" });
});
it("freezes exact original JSON bytes privately, then attempts raw cleanup", async () => {
  verified(); const bytes = Buffer.from(JSON.stringify(plan(), null, 2));
  const result = await freezeReviewedImportPlan(id, bytes);
  expect(objects.get(reviewedKey)!.bytes).toEqual(bytes);
  expect(mock.upload).toHaveBeenCalledWith(reviewedKey, bytes, { contentType: "application/json", cacheControl: "0", upsert: false });
  expect(result.sha256).toEqual(artifactDigest(bytes));
  const names = mock.rpc.mock.calls.map(([name]) => name);
  expect(names).toEqual(["c1_access_artifact", "c1_reserve_reviewed", "c1_finish_reviewed", "c1_claim_cleanup"]);
  expect(mock.rpc.mock.calls[1][1]).not.toHaveProperty("plan");
  expect(JSON.stringify(mock.rpc.mock.calls[1][1])).not.toContain("normalized");
});
it.each(["business", "source", "checksum", "entity"])("rejects reviewed %s mismatch before reserving or uploading", async kind => {
  verified(); const value = plan();
  if (kind === "business") value.preview.normalized.target.businessId = run;
  if (kind === "source") value.preview.normalized.source.sourceAccountKey = run;
  if (kind === "checksum") value.preview.normalized.source.inputChecksum = "f".repeat(64);
  if (kind === "entity") artifact.entity_type = "staff";
  if (kind === "entity") (value.preview.normalized.rows as unknown[]).push({ entityType: "customer", sourceRowKey: "1", name: "Synthetic" });
  await expect(freezeReviewedImportPlan(id, Buffer.from(JSON.stringify(value)))).rejects.toMatchObject({ code: "INVALID_INPUT" });
  expect(mock.upload).not.toHaveBeenCalled();
});
it("freeze upload failure preserves reserved metadata and never deletes raw", async () => {
  verified(); mock.upload.mockResolvedValue({ error: { message: "SECRET CUSTOMER DETAILS" }, data: null });
  await expect(freezeReviewedImportPlan(id, Buffer.from(JSON.stringify(plan())))).rejects.toThrow("unavailable or expired");
  expect(mock.rpc.mock.calls.map(([name]) => name)).toEqual(["c1_access_artifact", "c1_reserve_reviewed"]);
  expect(mock.remove).not.toHaveBeenCalled(); expect(artifact.reviewed_object_key).toBe(reviewedKey);
});
it("does not freeze if private upload read-back hash differs", async () => {
  verified(); mock.upload.mockImplementation(async () => { objects.set(reviewedKey, { bytes: Buffer.from("{}"), media: "application/json" }); return { error: null }; });
  await expect(freezeReviewedImportPlan(id, Buffer.from(JSON.stringify(plan())))).rejects.toMatchObject({ code: "UNAVAILABLE" });
  expect(mock.rpc.mock.calls.some(([name]) => name === "c1_finish_reviewed")).toBe(false);
});
it("reads reviewed exact bytes and rejects ownership change after download", async () => {
  const bytes = frozen(); expect((await readReviewedImportPlan(id)).bytes).toEqual(bytes);
  mock.business.mockResolvedValueOnce({ id: business, owner_id: actor }).mockResolvedValueOnce({ id: business, owner_id: run });
  await expect(readReviewedImportPlan(id)).rejects.toMatchObject({ code: "OWNER_REQUIRED" });
});
it("read fails closed when DB says deadline expired, without regenerating plan", async () => {
  frozen(); mock.rpc.mockResolvedValue({ data: null, error: { message: "C1_UNAVAILABLE" } });
  await expect(readReviewedImportPlan(id)).rejects.toMatchObject({ code: "UNAVAILABLE" }); expect(mock.download).not.toHaveBeenCalled();
});
it("binding only delegates metadata after auth; no B2 writer invoked", async () => {
  await bindImportArtifactToRun(id, run);
  expect(mock.rpc).toHaveBeenCalledExactlyOnceWith("c1_bind_run", { p_business: business, p_actor: actor, p_artifact: id, p_run: run });
});
it("sanitizes thrown transport errors and never logs payload or label", async () => {
  const log = vi.spyOn(console, "error"); mock.rpc.mockRejectedValue(new Error("SECRET URL/token CUSTOMER NAME"));
  await expect(listImportSources()).rejects.toThrow("unavailable or expired"); expect(log).not.toHaveBeenCalled();
});

describe("cleanup with mocked Storage; provider behavior is a hosted gate", () => {
  it.each([
    { status: 400, statusCode: "404" },
    { status: 400, statusCode: 404 },
    { status: 400, statusCode: "NoSuchKey" },
    { status: 400, statusCode: "ObjectNotFound" },
    { status: 404 },
  ])("confirms exact absence for %j", async error => {
    mock.info.mockResolvedValue({ data: null, error });
    expect(await deleteArtifactObject(service as never, rawKey)).toBe(true);
    expect(mock.remove).toHaveBeenCalledExactlyOnceWith([rawKey]);
    expect(mock.info).toHaveBeenCalledExactlyOnceWith(rawKey);
    expect(mock.remove.mock.invocationCallOrder[0]).toBeLessThan(mock.info.mock.invocationCallOrder[0]);
  });
  it.each([
    { status: 400 },
    { status: 400, statusCode: "InvalidRequest" },
    { status: 400, statusCode: "400" },
    { status: 400, statusCode: 400 },
    { status: 401, statusCode: "InvalidJWT" },
    { status: 403, statusCode: "AccessDenied" },
    { status: 500, statusCode: "InternalError" },
    { status: 503, statusCode: "SlowDown" },
    { message: "Object not found" },
    new TypeError("fetch failed"),
    {},
    null,
  ])("fails closed without confirmed absence for %j", async error => {
    mock.info.mockResolvedValue({ data: null, error });
    expect(await deleteArtifactObject(service as never, rawKey)).toBe(false);
  });
  it.each([null, { status: 400, statusCode: "404" }])("rejects still-present data even with error %j", async error => {
    mock.info.mockResolvedValue({ data: { size: 1 }, error });
    expect(await deleteArtifactObject(service as never, rawKey)).toBe(false);
  });
  it.each([{ status: 500 }, { status: 400, statusCode: "404" }])("rejects remove errors before checking absence: %j", async error => {
    mock.remove.mockResolvedValue({ data: null, error });
    expect(await deleteArtifactObject(service as never, rawKey)).toBe(false);
    expect(mock.info).not.toHaveBeenCalled();
  });
  it.each(["remove", "info"] as const)("fails closed when %s throws a transport error", async operation => {
    mock[operation].mockRejectedValue(new TypeError("fetch failed"));
    expect(await deleteArtifactObject(service as never, rawKey)).toBe(false);
    if (operation === "remove") expect(mock.info).not.toHaveBeenCalled();
  });
  it.each(["404", 404])("accepts installed SDK HTTP 400 / body statusCode %j with mocked transport", async statusCode => {
    const origin = "https://synthetic.example.invalid/storage/v1";
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ statusCode, error: "not_found", message: "Object not found" }),
        { status: 400, headers: { "Content-Type": "application/json" } }));
    const storage = new StorageClient(origin, {}, fetcher);
    expect(await deleteArtifactObject({ storage } as never, rawKey)).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[0]).toEqual([`${origin}/object/import-artifacts`, expect.objectContaining({ method: "DELETE", body: JSON.stringify({ prefixes: [rawKey] }) })]);
    expect(fetcher.mock.calls[1]).toEqual([`${origin}/object/info/import-artifacts/${rawKey}`, expect.objectContaining({ method: "GET" })]);
  });
  it("records hosted-shaped raw absence while retaining the private reviewed object", async () => {
    frozen();
    mock.rpc.mockImplementation(async name => ({ data: name === "c1_claim_cleanup" ? [claim()] : null, error: null }));
    mock.info.mockResolvedValue({ data: null, error: { status: 400, statusCode: "404" } });
    expect(await cleanupArtifactBatch(service as never)).toEqual({ claimed: 1, confirmed: 1, failed: 0 });
    expect(objects.has(rawKey)).toBe(false);
    expect(objects.has(reviewedKey)).toBe(true);
    expect(mock.remove).toHaveBeenCalledExactlyOnceWith([rawKey]);
    expect(mock.rpc).toHaveBeenLastCalledWith("c1_finish_cleanup", { p_artifact: id, p_token: token, p_raw_deleted: true, p_reviewed_deleted: false });
  });
  it("confirms remove plus exact absence before metadata finalize", async () => {
    mock.rpc.mockImplementation(async name => ({ data: name === "c1_claim_cleanup" ? [claim()] : null, error: null }));
    expect(await cleanupArtifactBatch(service as never)).toEqual({ claimed: 1, confirmed: 1, failed: 0 });
    expect(mock.remove).toHaveBeenCalledExactlyOnceWith([rawKey]);
    expect(mock.rpc.mock.calls[1]).toEqual(["c1_finish_cleanup", { p_artifact: id, p_token: token, p_raw_deleted: true, p_reviewed_deleted: false }]);
    expect(mock.info.mock.invocationCallOrder[0]).toBeLessThan(mock.rpc.mock.invocationCallOrder[1]);
  });
  it("Storage deletion failure keeps metadata pending and allows independent cleanup", async () => {
    const secondKey = `${business}/${run}/raw/${token}`;
    mock.rpc.mockImplementation(async name => ({ data: name === "c1_claim_cleanup" ? [claim(), claim({ id: run, raw_object_key: secondKey })] : null, error: null }));
    mock.remove.mockResolvedValueOnce({ error: { message: "private provider details" }, data: null });
    expect(await cleanupArtifactBatch(service as never)).toEqual({ claimed: 2, confirmed: 1, failed: 1 });
    expect(mock.rpc.mock.calls.filter(([name]) => name === "c1_finish_cleanup").map(([, args]) => args.p_raw_deleted).sort()).toEqual([false, true]);
  });
  it("records raw failure and reviewed success independently", async () => {
    frozen(); mock.rpc.mockImplementation(async name => ({ data: name === "c1_claim_cleanup" ? [claim({ reviewed_due: true })] : null, error: null }));
    mock.remove.mockResolvedValueOnce({ error: { message: "fail" } });
    expect(await cleanupArtifactBatch(service as never)).toMatchObject({ failed: 1 });
    expect(mock.rpc).toHaveBeenLastCalledWith("c1_finish_cleanup", expect.objectContaining({ p_raw_deleted: false, p_reviewed_deleted: true }));
  });
  it("does not treat ambiguous 400 or still-present object as absence", async () => {
    mock.info.mockResolvedValue({ data: null, error: { status: 400, statusCode: "InvalidRequest" } });
    expect(await deleteArtifactObject(service as never, rawKey)).toBe(false);
    mock.info.mockResolvedValue({ data: { size: 1 }, error: null });
    expect(await deleteArtifactObject(service as never, rawKey)).toBe(false);
  });
  it("already absent deletion is idempotent and exact keys remain unchanged", async () => {
    objects.clear(); expect(await deleteArtifactObject(service as never, rawKey)).toBe(true);
    expect(await deleteArtifactObject(service as never, rawKey)).toBe(true);
    expect(mock.remove.mock.calls).toEqual([[[rawKey]], [[rawKey]]]);
  });
  it("metadata failure and lost lease are counted safely", async () => {
    mock.rpc.mockImplementation(async name => name === "c1_claim_cleanup" ? { data: [claim()], error: null } : { data: null, error: { message: "C1_LEASE_LOST" } });
    expect(await cleanupArtifactBatch(service as never)).toEqual({ claimed: 1, confirmed: 0, failed: 1 });
  });
  it("dedicated worker uses fixed batch and bounded service client", async () => {
    expect(await cleanupImportArtifacts()).toEqual({ claimed: 0, confirmed: 0, failed: 0 });
    expect(mock.service).toHaveBeenCalledExactlyOnceWith({ requestTimeoutMs: 10000 });
    expect(mock.rpc).toHaveBeenCalledExactlyOnceWith("c1_claim_cleanup", { p_limit: 25, p_artifact: null });
  });
});
