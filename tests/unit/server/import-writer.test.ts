// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ getUser: vi.fn(), business: vi.fn(), rpc: vi.fn(), service: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { getUser: mock.getUser } }) }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: mock.service }));
vi.mock("@/lib/actions/business", () => ({ resolveBusinessForUser: mock.business }));
import { previewGovernedImport, prepareGovernedImport, beginGovernedImport, commitGovernedImportBatch, finishGovernedImport, resumeGovernedImport } from "@/lib/server/import-writer";
import { buildOperationalPlan } from "@/lib/imports/operational-plan";
const biz = "11111111-1111-4111-8111-111111111111", actor = "22222222-2222-4222-8222-222222222222", run = "33333333-3333-4333-8333-333333333333", token = "44444444-4444-4444-8444-444444444444";
const context = { business: { id: biz, timezone: "UTC", currency: "CAD", planKey: "professional" }, capacity: { maxLocations: 3, maxStaff: 3, activeLocations: 1, activeStaff: 1 }, fingerprint: "a".repeat(64), snapshot: { businessId: biz, entities: [], assignments: [], sourceRefs: [] } };
const input = { source: { schemaVersion: "1", sourceSystem: "test", sourceAccountKey: "account", sourceTimezone: "UTC", sourceCurrency: "CAD", inputChecksum: "b".repeat(64) }, target: { businessId: biz, businessTimezone: "UTC", businessCurrency: "CAD" }, rows: [{ entityType: "customer", sourceRowKey: "c", name: "Synthetic Customer", email: "customer@example.test" }] };
const mapping = { version: "1", statusMapping: {}, links: [] };
const plan = () => buildOperationalPlan(input, context.snapshot, mapping, "2026-09-23T00:00:00Z");
const review = () => ({ runId: run, previewHash: plan().preview.previewHash, snapshotHash: plan().preview.snapshotHash, commitGuardHash: "c".repeat(64) });
beforeEach(() => {
  vi.clearAllMocks(); mock.getUser.mockResolvedValue({ data: { user: { id: actor } }, error: null });
  mock.business.mockResolvedValue({ id: biz, owner_id: actor }); mock.service.mockReturnValue({ rpc: mock.rpc });
  mock.rpc.mockImplementation(async (name: string) => ({ data: name === "get_data_import_context" ? context : name === "prepare_data_import_run" ? { runId: run, commitGuardHash: "c".repeat(64) } : name === "begin_data_import_commit" ? token : name === "finish_data_import_run" ? "completed" : [], error: null }));
});
it("previews read-only with fresh owner context and creates no durable run", async () => {
  const result = await previewGovernedImport(
    { ...input, target: { ...input.target, businessCurrency: "USD" } },
    mapping,
  );
  expect(result.plan.preview.normalized.target.businessCurrency).toBe("CAD");
  expect(mock.rpc.mock.calls.map(([name]) => name)).toEqual(["get_data_import_context"]);
});

it("prepares using authoritative Business currency and persists only via governed RPC", async () => {
  const result = await prepareGovernedImport({ ...input, target: { ...input.target, businessCurrency: "USD" } }, mapping);
  expect(result.review).toEqual(review());
  expect(mock.rpc.mock.calls.map(([name]) => name)).toEqual(["get_data_import_context", "prepare_data_import_run"]);
  expect(mock.rpc.mock.calls[1][1]).toMatchObject({ p_business: biz, p_actor: actor, p_target_fingerprint: context.fingerprint });
});
it("begin reauthenticates and reruns preview before DB CAS", async () => {
  expect(await beginGovernedImport(input, mapping, review())).toEqual({ leaseToken: token, rows: plan().rows });
  expect(mock.getUser).toHaveBeenCalledTimes(1);
  expect(mock.rpc.mock.calls.map(([name]) => name)).toEqual(["get_data_import_context", "begin_data_import_commit"]);
});
it.each(["previewHash", "snapshotHash"] as const)("rejects changed reviewed %s before begin", async field => {
  await expect(beginGovernedImport(input, mapping, { ...review(), [field]: "0".repeat(64) })).rejects.toThrow("Review a fresh preview");
  expect(mock.rpc).toHaveBeenCalledTimes(1);
});
it.each(["admin", "platform-admin", "foreign-owner"])("does not create privileged client for non-primary %s", async () => {
  mock.business.mockResolvedValue({ id: biz, owner_id: "someone-else" });
  await expect(prepareGovernedImport(input, mapping)).rejects.toThrow("primary business owner");
  expect(mock.service).not.toHaveBeenCalled();
});
it("no authenticated actor means no privileged client", async () => {
  mock.getUser.mockResolvedValue({ data: { user: null }, error: null });
  await expect(commitGovernedImportBatch(run, token, [])).rejects.toThrow("primary business owner");
  expect(mock.service).not.toHaveBeenCalled();
});
it("rejects foreign upload target", async () => {
  await expect(prepareGovernedImport({ ...input, target: { ...input.target, businessId: actor } }, mapping)).rejects.toThrow("primary business owner");
  expect(mock.rpc).toHaveBeenCalledTimes(1);
});
it("every batch and finish independently rechecks session and Business authority", async () => {
  await commitGovernedImportBatch(run, token, []);
  await finishGovernedImport(run, token);
  expect(mock.getUser).toHaveBeenCalledTimes(2); expect(mock.business).toHaveBeenCalledTimes(2);
  expect(mock.rpc.mock.calls[0][1]).toMatchObject({ p_actor: actor, p_business: biz, p_token: token });
  mock.business.mockResolvedValue({ id: biz, owner_id: "revoked" });
  await expect(finishGovernedImport(run, token)).rejects.toThrow("primary business owner");
  expect(mock.rpc).toHaveBeenCalledTimes(2);
});
it("reclaim sends original reviewed rows without rebuilding self-mutated snapshot", async () => {
  expect(await resumeGovernedImport(review(), plan().rows)).toBe(token);
  expect(mock.rpc.mock.calls).toHaveLength(1);
  expect(mock.rpc.mock.calls[0][1]).toMatchObject({ p_resume: true, p_rows: plan().rows });
});
it("does not expose raw PostgreSQL/PII errors", async () => {
  mock.rpc.mockResolvedValue({ data: null, error: { message: "unexpected: customer@example.test" } });
  await expect(commitGovernedImportBatch(run, token, [])).rejects.toThrow("Keep the reviewed source");
});
it("limits each batch to 50 rows", async () => {
  await expect(commitGovernedImportBatch(run, token, Array(51).fill(plan().rows[0]))).rejects.toThrow("invalid");
  expect(mock.service).not.toHaveBeenCalled();
});
