import type { ViteDevServer } from "vite";

export const TAX_PREPARATION_TIMEOUT_MS = 60_000;

// Use the same real module graph as navigation, before its 30s load budget.
// transformRequest propagates compilation failures (warmupRequest swallows them).
export async function prepareServiceTaxFixture(vite: ViteDevServer): Promise<number> {
  const client = vite.environments.client;
  const prepared = new Set<string>();
  const pending = new Set<string>();
  let active = true;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const assertActive = () => {
    if (!active) throw new Error("Service tax preparation deadline exceeded");
  };
  const prepare = async (url: string): Promise<void> => {
    assertActive();
    if (prepared.has(url)) return;
    prepared.add(url);
    pending.add(url);
    try {
      const result = await client.transformRequest(url);
      assertActive();
      if (!result) throw new Error("Service tax preparation returned no module: " + url);
      const entryModule = await client.moduleGraph.getModuleByUrl(url);
      assertActive();
      if (!entryModule) throw new Error("Service tax preparation did not register module: " + url);
      // CSS imports include Tailwind's watched files. Its transform awaits
      // PostCSS; those watched files must not be executed as application modules.
      if (!entryModule.file?.endsWith(".css")) {
        await Promise.all([...entryModule.importedModules].map((dependency) => prepare(dependency.url)));
      }
    } finally { pending.delete(url); }
  };
  try {
    return await Promise.race([
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(
          `Service tax preparation timed out after ${TAX_PREPARATION_TIMEOUT_MS}ms; pending: ${[...pending].slice(0, 8).join(", ") || "static import crawl"}`,
        )), TAX_PREPARATION_TIMEOUT_MS);
      }),
      (async () => {
        await prepare("/app/globals.css");
        await prepare("/@vite/client");
        await prepare("virtual:tax-entry");
        await client.waitForRequestsIdle();
        assertActive();
        return prepared.size;
      })(),
    ]);
  } finally {
    active = false;
    clearTimeout(timer);
  }
}
