// @vitest-environment node
import { readFileSync } from "node:fs";
import { StorageClient } from "@supabase/storage-js";
import { describe, expect, it, vi } from "vitest";

const migration = "supabase/migrations/20260923205834_issue_73_package_c1_private_artifacts.sql";
const sql = readFileSync(migration, "utf8").replace(/--[^\n]*/g, "");
const seam = readFileSync("lib/server/import-artifacts.ts", "utf8");
const storage = readFileSync("lib/server/import-artifact-storage.ts", "utf8");
const cleanup = readFileSync("lib/server/import-artifact-cleanup.ts", "utf8");
const route = readFileSync("app/api/cron/cleanup-import-artifacts/route.ts", "utf8");

describe("C1 Storage/ACL source contract (not live Storage RLS evidence)", () => {
  it("creates a dedicated private, size-limited bucket without widening Storage policies", () => {
    expect(sql).toMatch(/insert into storage\.buckets\(id,name,public,file_size_limit,allowed_mime_types\)\s*values\('import-artifacts','import-artifacts',false,10485760,/i);
    expect(sql).not.toMatch(/(?:create|alter)\s+policy\b/i);
    expect(sql).not.toMatch(/grant\s+[^;]+\s+on\s+storage\./i);
    expect(sql).not.toContain("business-assets");
    expect(sql).toContain("C1_BUCKET_DRIFT");
  });

  it("forces RLS and revokes client table privileges while allowing only service reads", () => {
    for (const table of ["data_import_sources", "data_import_artifacts"]) {
      expect(sql).toContain(`alter table public.${table} enable row level security`);
      expect(sql).toContain(`alter table public.${table} force row level security`);
    }
    expect(sql).toMatch(/revoke all on public\.data_import_sources,public\.data_import_artifacts from public,anon,authenticated,service_role/i);
    expect(sql).toMatch(/grant select on public\.data_import_sources,public\.data_import_artifacts to service_role/i);
    expect(sql).not.toMatch(/grant\s+(?:all|insert|update|delete)\s+on\s+(?:public\.)?data_import/i);
    expect(sql).toContain("revoke all on function %s from public,anon,authenticated,service_role");
    expect(sql).toContain("grant execute on function %s to service_role");
    expect(sql).toContain("has_function_privilege");
    expect(sql).toContain("has_table_privilege");
    expect(sql).toContain("C1_ACL_DRIFT");
  });

  it("keeps uploads create-only and private reads server-only without public/download URLs", () => {
    expect(seam).toMatch(/createSignedUploadUrl\(artifact\.raw_object_key,\s*\{ upsert: false \}\)/);
    expect(seam).toMatch(/contentType: "application\/json", cacheControl: "0", upsert: false/);
    for (const source of [seam, storage, cleanup]) {
      expect(source).toContain('import "server-only"');
      expect(source).not.toMatch(/getPublicUrl|createSignedUrl\(|createSignedUrls\(|"use server"/);
      expect(source).not.toMatch(/console\.(?:log|info|warn|error)|logger\.|captureException|captureMessage/);
    }
    expect(storage).toContain('IMPORT_ARTIFACT_BUCKET = "import-artifacts"');
  });

  it("keeps cleanup hourly, bounded, and independent of communication workers", () => {
    const vercel = JSON.parse(readFileSync("vercel.json", "utf8"));
    expect(vercel.crons.filter((cron: { path: string }) => cron.path === "/api/cron/cleanup-import-artifacts"))
      .toEqual([{ path: "/api/cron/cleanup-import-artifacts", schedule: "0 * * * *" }]);
    expect(storage).toContain("CLEANUP_BATCH_SIZE = 25");
    expect(cleanup).toContain("p_limit: artifactId ? 1 : CLEANUP_BATCH_SIZE");
    expect(sql).toContain("p_limit>25");
    for (const source of [cleanup, route]) expect(source).not.toMatch(/background_jobs|worker_reliability|processPendingJobs|integrations\/jobs/);
  });
});

// The following calls use the installed SDK with an entirely mocked fetch.
// They prove emitted HTTP requests only. Provider signature verification,
// expiry, path substitution, replay/upsert denial, and public-read denial MUST
// still be tested against an explicitly authorized hosted disposable fixture.
describe("installed signed-upload SDK transport only; NOT provider security proof", () => {
  const origin = "https://synthetic.example.invalid/storage/v1";
  const path = "00000000-0000-4000-8000-000000000001/00000000-0000-4000-8000-000000000002/raw/00000000-0000-4000-8000-000000000003";
  const token = "synthetic-fixed-signed-capability";
  function fixture() {
    const calls: { url: URL; method: string; headers: Headers; body: unknown }[] = [];
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      calls.push({ url, method: init?.method ?? "GET", headers: new Headers(init?.headers), body: init?.body });
      return new Response(JSON.stringify(init?.method === "POST"
        ? { url: `/object/upload/sign/import-artifacts/${path}?token=${token}` }
        : { Key: `import-artifacts/${path}` }), { status: 200, headers: { "Content-Type": "application/json" } });
    });
    const client = new StorageClient(origin, { Authorization: "Bearer synthetic-service" }, fetcher);
    return { bucket: client.from("import-artifacts"), calls };
  }

  it("issues one exact-object POST without an upsert grant", async () => {
    const { bucket, calls } = fixture();
    const result = await bucket.createSignedUploadUrl(path, { upsert: false });
    expect(result.error).toBeNull();
    expect(result.data).toMatchObject({ path, token });
    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe("POST");
    expect(calls[0].url.href).toBe(`${origin}/object/upload/sign/import-artifacts/${path}`);
    expect(calls[0].url.search).toBe("");
    expect(calls[0].headers.has("x-upsert")).toBe(false);
    expect(calls[0].body).toBe("{}");
  });

  it("malicious upload options cannot rewrite the prior create-only issuance; client headers remain untrusted", async () => {
    const { bucket, calls } = fixture();
    const signed = await bucket.createSignedUploadUrl(path, { upsert: false });
    expect(signed.data).not.toBeNull();
    await bucket.uploadToSignedUrl(path, signed.data!.token, new Uint8Array([97, 10]), { upsert: true, contentType: "text/csv" });
    expect(calls).toHaveLength(2);
    expect(calls[0].headers.has("x-upsert")).toBe(false);
    expect(calls[1].method).toBe("PUT");
    expect(calls[1].headers.get("x-upsert")).toBe("true");
    expect(calls[1].url.pathname).toBe(`/storage/v1/object/upload/sign/import-artifacts/${path}`);
    expect(calls[1].url.searchParams.get("token")).toBe(token);
    // A transport mock cannot establish that Storage rejects this overwrite.
  });

  it("records a substituted path using the same token for the mandatory later hosted attack test", async () => {
    const { bucket, calls } = fixture();
    await bucket.createSignedUploadUrl(path, { upsert: false });
    const substituted = path.replace(/000000000003$/, "000000000004");
    await bucket.uploadToSignedUrl(substituted, token, new Uint8Array([97, 10]), { upsert: false });
    expect(calls[0].url.pathname.endsWith(path)).toBe(true);
    expect(calls[1].url.pathname.endsWith(substituted)).toBe(true);
    expect(calls[1].url.searchParams.get("token")).toBe(token);
    // Deliberately no assertion claiming that the mocked provider denied it.
  });
});
