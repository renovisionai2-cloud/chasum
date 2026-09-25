// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({
  getUser: vi.fn(),
  business: vi.fn(),
  service: vi.fn(),
  rpc: vi.fn(),
  listSources: vi.fn(),
  readRaw: vi.fn(),
  freeze: vi.fn(),
  bind: vi.fn(),
  preview: vi.fn(),
  prepare: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: mock.getUser } }),
}));
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: mock.service,
}));
vi.mock("@/lib/actions/business", () => ({
  resolveBusinessForUser: mock.business,
}));vi.mock("@/lib/server/import-artifacts", () => ({
  listImportSources: mock.listSources,
  readVerifiedImportSource: mock.readRaw,
  freezeReviewedImportPlan: mock.freeze,
  bindImportArtifactToRun: mock.bind,
}));
vi.mock("@/lib/server/import-writer", () => ({
  previewGovernedImport: mock.preview,
  prepareGovernedImport: mock.prepare,
}));

import { lockC2ReviewedImport } from "@/lib/server/import-c2";

const businessId = "10000000-0000-4000-8000-000000000001";
const actor = "20000000-0000-4000-8000-000000000001";
const artifactId = "30000000-0000-4000-8000-000000000001";
const runId = "40000000-0000-4000-8000-000000000001";
const previewHash = "a".repeat(64);
const snapshotHash = "b".repeat(64);
const commitGuardHash = "c".repeat(64);
const reviewedSha = "d".repeat(64);

const payload = {
  source: {
    schemaVersion: "1",
    sourceSystem: "other_csv",
    sourceAccountKey: "source-account",
    sourceTimezone: "UTC",
    sourceCurrency: "CAD",
    inputChecksum: "e".repeat(64),
  },
  target: {
    businessId,
    businessTimezone: "UTC",
    businessCurrency: "CAD",
  },
  rows: [{
    entityType: "customer",
    sourceRowKey: "customer:2",
    name: "Synthetic Customer",
    email: "synthetic@example.test",
  }],
};

const row = {
  row: payload.rows[0],
  outcome: {
    entityType: "customer",
    sourceRowKey: "customer:2",
    sourceRowHash: "f".repeat(64),
    status: "READY",
    plannedAction: "CREATE",
    reasonCodes: [],
    dependencies: {},
  },
};
const plan = {
  preview: {
    version: "1",
    previewHash,
    snapshotHash,
    normalized: payload,
    outcomes: [row.outcome],
    counts: { READY: 1 },
  },
  rows: [row],
  locationSlugs: [],
};

const adapter = {
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
};
const mapping = { version: "c2-mapping-v1", statusMapping: {}, links: [] };

beforeEach(() => {
  vi.clearAllMocks();
  mock.getUser.mockResolvedValue({ data: { user: { id: actor } }, error: null });
  mock.business.mockResolvedValue({
    id: businessId,
    owner_id: actor,
    timezone: "UTC",
    currency: "CAD",
  });
  mock.rpc.mockResolvedValue({
    data: {
      business: { id: businessId, timezone: "UTC", currency: "CAD", planKey: "professional" },
      capacity: { maxLocations: 3, maxStaff: 3, activeLocations: 1, activeStaff: 1 },
      snapshot: { businessId, entities: [], assignments: [], sourceRefs: [] },
      fingerprint: "0".repeat(64),
    },
    error: null,
  });
  mock.service.mockReturnValue({ rpc: mock.rpc });
  mock.readRaw.mockResolvedValue({
    bytes: Buffer.from("name,email\nSynthetic Customer,synthetic@example.test\n"),
    sha256: "e".repeat(64),
    sourceId: "50000000-0000-4000-8000-000000000001",
    sourceSystem: "other_csv",
    sourceAccountKey: "source-account",
    entityType: "customer",
  });
  mock.preview.mockResolvedValue({
    plan,
    capacity: { maxLocations: 3, maxStaff: 3, activeLocations: 1, activeStaff: 1 },
  });
  mock.prepare.mockResolvedValue({
    review: { runId, previewHash, snapshotHash, commitGuardHash },
    plan,
    capacity: { maxLocations: 3, maxStaff: 3, activeLocations: 1, activeStaff: 1 },
  });
  mock.freeze.mockResolvedValue({
    artifactId,
    sha256: reviewedSha,
    expiresAt: "2026-09-27T00:00:00Z",
  });
  mock.bind.mockResolvedValue(undefined);
});

it("locks in prepare, freeze, then bind order without operational commit", async () => {
  const result = await lockC2ReviewedImport({
    artifactId,
    adapter,
    mapping,
    displayedPreviewHash: previewHash,
    displayedSnapshotHash: snapshotHash,
  });

  expect(result).toMatchObject({
    state: "ready_for_import",
    runId,
    reviewedSha256: reviewedSha,
  });
  expect(mock.preview).toHaveBeenCalledTimes(1);
  expect(mock.prepare).toHaveBeenCalledTimes(1);
  expect(mock.freeze).toHaveBeenCalledTimes(1);
  expect(mock.bind).toHaveBeenCalledTimes(1);
  expect(mock.prepare.mock.invocationCallOrder[0])
    .toBeLessThan(mock.freeze.mock.invocationCallOrder[0]);
  expect(mock.freeze.mock.invocationCallOrder[0])
    .toBeLessThan(mock.bind.mock.invocationCallOrder[0]);

  const frozenBytes = mock.freeze.mock.calls[0][1] as Uint8Array;
  const envelope = JSON.parse(Buffer.from(frozenBytes).toString("utf8"));
  expect(envelope).toMatchObject({
    schemaVersion: "c2-reviewed-v1",
    review: { runId, previewHash, snapshotHash, commitGuardHash },
    mapping,
    adapter,
    preview: { previewHash, snapshotHash },
    locationSlugs: [],
  });
});

it("requires review again before preparing when displayed hashes changed", async () => {
  await expect(lockC2ReviewedImport({
    artifactId,
    adapter,
    mapping,
    displayedPreviewHash: "9".repeat(64),
    displayedSnapshotHash: snapshotHash,
  })).rejects.toMatchObject({ code: "REVIEW_AGAIN" });

  expect(mock.prepare).not.toHaveBeenCalled();
  expect(mock.freeze).not.toHaveBeenCalled();
  expect(mock.bind).not.toHaveBeenCalled();
});

it("rejects non-canonical durable source-system identity", async () => {
  mock.readRaw.mockResolvedValueOnce({
    bytes: Buffer.from("name,email\nSynthetic Customer,synthetic@example.test\n"),
    sha256: "e".repeat(64),
    sourceId: "50000000-0000-4000-8000-000000000001",
    sourceSystem: "custom_vendor",
    sourceAccountKey: "source-account",
    entityType: "customer",
  });
  await expect(lockC2ReviewedImport({
    artifactId,
    adapter,
    mapping,
    displayedPreviewHash: previewHash,
    displayedSnapshotHash: snapshotHash,
  })).rejects.toMatchObject({ code: "SOURCE_NOT_SUPPORTED" });
  expect(mock.preview).not.toHaveBeenCalled();
});