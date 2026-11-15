// @vitest-environment node
import type { ViteDevServer } from "vite";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { prepareServiceTaxFixture, TAX_PREPARATION_TIMEOUT_MS } from "./service-tax-readiness";

function fixture() {
  const graph: Record<string, { file: string; importedModules: Set<{ url: string }> } | undefined> = {
    "/app/globals.css": { file: "/app/globals.css", importedModules: new Set([{ url: "/watched-server-file.ts" }]) },
    "/@vite/client": { file: "/vite/client.js", importedModules: new Set() },
    "virtual:tax-entry": { file: "\0tax:entry", importedModules: new Set([{ url: "/component.tsx" }]) },
    "/component.tsx": { file: "/component.tsx", importedModules: new Set([{ url: "virtual:tax-entry" }]) },
  };
  const client = {
    transformRequest: vi.fn(async (url: string): Promise<{ code: string } | null> => ({ code: url })),
    moduleGraph: { getModuleByUrl: vi.fn(async (url: string) => graph[url]) },
    waitForRequestsIdle: vi.fn(async () => undefined),
  };
  return { client, server: { environments: { client } } as unknown as ViteDevServer };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => { expect(vi.getTimerCount()).toBe(0); vi.useRealTimers(); });

it("prepares CSS and the entry graph, handles cycles, and never executes CSS watch dependencies", async () => {
  const { server, client } = fixture();
  await expect(prepareServiceTaxFixture(server)).resolves.toBe(4);
  expect(client.transformRequest.mock.calls.map(([url]) => url)).toEqual([
    "/app/globals.css", "/@vite/client", "virtual:tax-entry", "/component.tsx",
  ]);
  expect(client.waitForRequestsIdle).toHaveBeenCalledOnce();
});

it("propagates a transform failure without declaring readiness", async () => {
  const { server, client } = fixture();
  const failure = new Error("synthetic compilation failed");
  client.transformRequest.mockRejectedValueOnce(failure);
  await expect(prepareServiceTaxFixture(server)).rejects.toBe(failure);
  expect(client.waitForRequestsIdle).not.toHaveBeenCalled();
});

it("fails closed when a transform produces no module", async () => {
  const { server, client } = fixture();
  client.transformRequest.mockResolvedValueOnce(null);
  await expect(prepareServiceTaxFixture(server)).rejects.toThrow("returned no module");
});

it("fails closed when the transformed module is absent from the graph", async () => {
  const { server, client } = fixture();
  client.moduleGraph.getModuleByUrl.mockResolvedValueOnce(undefined);
  await expect(prepareServiceTaxFixture(server)).rejects.toThrow("did not register module");
});

it("bounds a stalled transform and stops traversal if it resolves after the deadline", async () => {
  const { server, client } = fixture();
  let finish!: (result: { code: string }) => void;
  client.transformRequest.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
  const run = prepareServiceTaxFixture(server);
  const failed = expect(run).rejects.toThrow("pending: /app/globals.css");
  await vi.advanceTimersByTimeAsync(TAX_PREPARATION_TIMEOUT_MS);
  await failed;
  finish({ code: "late" });
  await vi.advanceTimersByTimeAsync(0);
  expect(client.transformRequest).toHaveBeenCalledOnce();
  expect(client.moduleGraph.getModuleByUrl).not.toHaveBeenCalled();
  expect(client.waitForRequestsIdle).not.toHaveBeenCalled();
});

it("does not report completion until the static import crawl settles", async () => {
  const { server, client } = fixture();
  let finish!: () => void;
  client.waitForRequestsIdle.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
  let completed = false;
  const run = prepareServiceTaxFixture(server).then(() => { completed = true; });
  await vi.advanceTimersByTimeAsync(0);
  expect(completed).toBe(false);
  finish();
  await run;
  expect(completed).toBe(true);
});

it("includes the static import crawl in the same deadline and consumes late rejection", async () => {
  const { server, client } = fixture();
  let rejectLate!: (reason: Error) => void;
  client.waitForRequestsIdle.mockImplementationOnce(() => new Promise((_, reject) => { rejectLate = reject; }));
  const run = prepareServiceTaxFixture(server);
  const failed = expect(run).rejects.toThrow("pending: static import crawl");
  await vi.advanceTimersByTimeAsync(TAX_PREPARATION_TIMEOUT_MS);
  await failed;
  rejectLate(new Error("late rejection"));
  await vi.advanceTimersByTimeAsync(0);
});
