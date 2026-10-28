// @vitest-environment node
import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { createLogger, createServer, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import ts from "typescript";
import { chromium, webkit, type Browser, type BrowserContext, type Page, type Request, type Response, type ConsoleMessage } from "playwright-core";
import { afterAll, beforeAll, expect, it } from "vitest";

// Actual Calendar/BookingSheet/dashboard/CSS, with the already accepted synthetic
// read fixture. No fixture file or application integration is edited by this test.
const root = process.cwd();
const evidence = process.env.CHASUM_M1C_EVIDENCE;
const commit = "0123456789abcdef0123456789abcdef01234567";
const identity = { commit, commitShort: commit.slice(0, 7), env: "preview", production: false };
const results: unknown[] = [];
let server: ViteDevServer;
const browsers: Record<string, Browser> = {};
let origin: string;

// Observers only: no transforms, prewarming, readiness waits or navigation retries.
const diagnosticEpoch = performance.now();
const elapsed = () => Math.round((performance.now() - diagnosticEpoch) * 10) / 10;
type DiagnosticEvent = { event: string; atMs: number; [key: string]: unknown };
function diagnosticBuffer(limit: number) {
  const events: DiagnosticEvent[] = [];
  let dropped = 0;
  return {
    add(event: string, detail: Record<string, unknown> = {}) {
      if (events.length === limit) { events.shift(); dropped++; }
      events.push({ event, atMs: elapsed(), ...detail });
    },
    snapshot: () => ({ events: [...events], dropped }),
  };
}
function diagnosticPath(value: string) {
  if (value.startsWith("\0badge:")) return "/@id/" + value.slice(1).split("?")[0].slice(0, 140);
  const local = value.startsWith(root + "/") ? value.slice(root.length) : value;
  try {
    const url = new URL(local, origin || "http://127.0.0.1");
    return url.origin === (origin || "http://127.0.0.1") ? url.pathname.slice(0, 160) : "[external]";
  } catch { return "[unparseable path]"; }
}
function diagnosticText(value: unknown) {
  return String(value instanceof Error ? value.message : value)
    .replace(/(?:https?|wss?):\/\/[^\s<>"']+/g, (url) => diagnosticPath(url))
    .replace(/\?[^\s<>"']+/g, "?[redacted]")
    .replace(/[\w.+-]+@[\w.-]+/g, "[email]")
    .replace(/\b(?:Bearer\s+\S+|eyJ[\w.-]+)\b/gi, "[credential]")
    .replace(/\b(authorization|cookie|token|password|secret)\s*[:=]\s*[^\n]+/gi, "$1=[redacted]")
    .replaceAll(root, "[fixture]").slice(0, 240);
}
function emitDiagnostic(payload: Record<string, unknown>) {
  // Logging must never replace the error being investigated, even if a sink fails.
  try {
    const json = JSON.stringify(payload);
    console.info("[m1c-navigation] " + (json.length <= 32_000 ? json : JSON.stringify({
      event: "DIAGNOSTIC_OUTPUT_LIMIT", truncated: true, jsonPrefix: json.slice(0, 30_000),
    })));
  } catch {
    try { process.stderr.write('[m1c-navigation] {"event":"DIAGNOSTIC_COLLECTION_FAILED","phase":"emit"}\n'); } catch { /* Keep the original error. */ }
  }
}
const lifecycle = diagnosticBuffer(24);
const serverRequests = diagnosticBuffer(32);
const serverErrors = diagnosticBuffer(8);
type TransformObservation = { path: string; startedAtMs: number; completedAtMs?: number; elapsedMs?: number; observations: number };
const transforms = new Map<string, TransformObservation>();
let omittedTransforms = 0;
function observeTransform(id: string, complete: boolean) {
  const path = diagnosticPath(id);
  if (!(path.endsWith(".css") || path.endsWith(".tsx") || path.includes("badge:entry") || path.includes("/.vite/deps/"))) return;
  const previous = transforms.get(path);
  if (complete) {
    if (previous) {
      previous.completedAtMs = elapsed();
      previous.elapsedMs = Math.round((previous.completedAtMs - previous.startedAtMs) * 10) / 10;
    }
  } else if (previous || transforms.size < 80) {
    transforms.set(path, { path, startedAtMs: elapsed(), observations: (previous?.observations ?? 0) + 1 });
  } else omittedTransforms++;
}
function preparationSnapshot() {
  const observed = [...transforms.values()];
  return {
    // Pre/post user hooks bracket CSS processing, not Vite's entire pipeline.
    measurement: "Vite pre/post user transform-hook window; later internal hooks are not included",
    css: transforms.get("/app/globals.css") ?? "NOT_OBSERVED",
    pending: observed.filter((item) => item.completedAtMs === undefined).slice(0, 20),
    slowest: observed.filter((item) => item.completedAtMs !== undefined).sort((a, b) => b.elapsedMs! - a.elapsedMs!).slice(0, 8),
    observedCount: observed.length, omittedTransforms,
    modulesPrepared: "NOT_OBSERVABLE: per-module hook completion is not whole-graph readiness",
    dependencyOptimizer: "NOT_OBSERVABLE: dependency requests/transforms do not establish optimizer completion",
    tailwindSubphases: "NOT_OBSERVABLE through these hooks; existing DEBUG=tailwindcss can provide separate timings",
  };
}
const successfulNavigations = new Map<string, number>();
function navigationDiagnostics(page: Page, engine: string, label: string, contextCreatedAtMs: number) {
  let navigationFailed = false;
  return {
    async navigate<T>(action: () => Promise<T>): Promise<T> {
      const milestones = diagnosticBuffer(12), requests = diagnosticBuffer(48), failures = diagnosticBuffer(12);
      type Resource = { path: string; type: string; startedAtMs: number; status?: number; responseAtMs?: number };
      const pending = new Map<Request, Resource>();
      const counts = { started: 0, completed: 0, failed: 0, omitted: 0, dependencyRequests: 0 };
      let firstModulePath: string | undefined;
      let firstCss = false;
      const onRequest = (request: Request) => {
        counts.started++;
        const resource = { path: diagnosticPath(request.url()), type: request.resourceType(), startedAtMs: elapsed() };
        if (pending.size < 128) pending.set(request, resource); else counts.omitted++;
        if (resource.path.includes("/.vite/deps/")) counts.dependencyRequests++;
        requests.add("REQUEST_STARTED", resource);
        if (!firstModulePath && resource.type === "script") { firstModulePath = resource.path; milestones.add("FIRST_MODULE_REQUEST", resource); }
        if (!firstCss && resource.path === "/app/globals.css") { firstCss = true; milestones.add("APPLICATION_CSS_REQUEST", resource); }
      };
      const onResponse = (response: Response) => {
        const resource = pending.get(response.request());
        if (resource) { resource.status = response.status(); resource.responseAtMs = elapsed(); }
        if (response.status() >= 400) failures.add("HTTP_ERROR", { path: diagnosticPath(response.url()), status: response.status() });
      };
      const finishRequest = (request: Request, failed: boolean) => {
        const resource = pending.get(request);
        if (failed) counts.failed++; else counts.completed++;
        const detail = { ...resource, path: diagnosticPath(request.url()), durationMs: resource ? Math.round((elapsed() - resource.startedAtMs) * 10) / 10 : null };
        requests.add(failed ? "REQUEST_FAILED" : "REQUEST_COMPLETED", detail);
        if (failed) failures.add("REQUEST_FAILED", { ...detail, error: diagnosticText(request.failure()?.errorText) });
        if (detail.path === "/app/globals.css") milestones.add(failed ? "APPLICATION_CSS_REQUEST_FAILED" : "APPLICATION_CSS_REQUEST_COMPLETED", detail);
        if (detail.path === firstModulePath) milestones.add(failed ? "FIRST_MODULE_REQUEST_FAILED" : "FIRST_MODULE_REQUEST_COMPLETED", detail);
        pending.delete(request);
      };
      const onFinished = (request: Request) => finishRequest(request, false);
      const onFailed = (request: Request) => finishRequest(request, true);
      const onPageError = (error: Error) => failures.add("PAGE_ERROR", { message: diagnosticText(error) });
      const onConsole = (message: ConsoleMessage) => {
        if (message.type() === "error") failures.add("CONSOLE_ERROR", { message: diagnosticText(message.text()) });
      };
      const onDom = () => milestones.add("DOM_CONTENT_LOADED");
      const onLoad = () => milestones.add("BROWSER_DOCUMENT_LOADED");
      const onCrash = () => failures.add("PAGE_CRASH");
      page.on("request", onRequest); page.on("response", onResponse);
      page.on("requestfinished", onFinished); page.on("requestfailed", onFailed);
      page.on("pageerror", onPageError); page.on("console", onConsole);
      page.on("domcontentloaded", onDom); page.on("load", onLoad); page.on("crash", onCrash);
      milestones.add("CONTEXT_CREATED", { atMs: contextCreatedAtMs });
      const navigationStartedAtMs = elapsed();
      milestones.add("NAVIGATION_BEGIN");
      try {
        // The caller retains the exact original page.goto arguments/defaults.
        const result = await action();
        milestones.add("NAVIGATION_SUCCEEDED");
        const successes = (successfulNavigations.get(engine) ?? 0) + 1;
        successfulNavigations.set(engine, successes);
        if (successes <= 2 || process.env.CHASUM_M1C_DIAGNOSTICS_VERBOSE === "1") emitDiagnostic({
          event: "NAVIGATION_SUMMARY", engine, label, navigationStartedAtMs, durationMs: elapsed() - navigationStartedAtMs,
          counts, milestones: milestones.snapshot(), lifecycle: lifecycle.snapshot(), preparation: preparationSnapshot(),
        });
        return result;
      } catch (error) {
        navigationFailed = true;
        milestones.add("NAVIGATION_FAILED");
        try {
          // Emit synchronously BEFORE any best-effort browser RPC or cleanup.
          emitDiagnostic({ event: "NAVIGATION_FAILURE", engine, label, error: diagnosticText(error),
            currentPath: diagnosticPath(page.url()), durationMs: elapsed() - navigationStartedAtMs,
            pending: [...pending.values()].slice(0, 32), pendingCount: pending.size, counts,
            failures: failures.snapshot(), lifecycle: lifecycle.snapshot(), preparation: preparationSnapshot(),
            milestones: milestones.snapshot(), serverErrors: serverErrors.snapshot(),
            serverRequests: serverRequests.snapshot(), recentRequests: requests.snapshot(),
          });
          let deadline: ReturnType<typeof setTimeout> | undefined;
          try {
            // A collection deadline only; never a navigation/readiness wait.
            const state = await Promise.race([
              page.evaluate(() => ({ readyState: document.readyState, rootPresent: Boolean(document.getElementById("root")) })),
              new Promise<string>((resolve) => { deadline = setTimeout(() => resolve("NOT_OBSERVABLE: diagnostic RPC deadline"), 250); }),
            ]);
            emitDiagnostic({ event: "FAILURE_DOCUMENT_STATE", engine, label, state });
          } finally { clearTimeout(deadline); }
        } catch (collectionError) {
          emitDiagnostic({ event: "DIAGNOSTIC_COLLECTION_FAILED", engine, label, message: diagnosticText(collectionError) });
        }
        throw error;
      } finally {
        page.off("request", onRequest); page.off("response", onResponse);
        page.off("requestfinished", onFinished); page.off("requestfailed", onFailed);
        page.off("pageerror", onPageError); page.off("console", onConsole);
        page.off("domcontentloaded", onDom); page.off("load", onLoad); page.off("crash", onCrash);
      }
    },
    async closeContext(context: BrowserContext) {
      try { await context.close(); }
      catch (error) {
        if (!navigationFailed) throw error;
        emitDiagnostic({ event: "CONTEXT_CLEANUP_FAILED", engine, label, message: diagnosticText(error) });
      }
    },
  };
}


beforeAll(async () => {
  lifecycle.add("FIXTURE_SETUP_BEGIN");
  if (evidence) await mkdir(evidence, { recursive: true });
  const fontBuild = resolve(root, ".next/static");
  const cssFiles = (await readdir(fontBuild, { recursive: true })).filter((name) => name.endsWith(".css"));
  const fontRules = (await Promise.all(cssFiles.map((name) => readFile(resolve(fontBuild, name), "utf8"))))
    .flatMap((css) => css.match(/@font-face\{[^}]*\}/g) ?? [])
    .filter((rule) => /font-family:(Inter|JetBrains)/.test(rule));
  expect(fontRules.length, "Run npm run build first for the actual application fonts").toBeGreaterThan(0);
  const fontCss = fontRules.join("\n").replaceAll("../media/", "/__badge_fonts/").replaceAll("/_next/static/media/", "/__badge_fonts/") +
    '\n:root{--font-geist-sans:Inter,system-ui,sans-serif;--font-geist-mono:"JetBrains Mono",monospace}';
  const fontNames = [...new Set([...fontCss.matchAll(/\/__badge_fonts\/([\w.-]+\.woff2)/g)].map((match) => match[1]))];
  const fonts = new Map(await Promise.all(fontNames.map(async (name) => [name, await readFile(resolve(fontBuild, "media", name))] as const)));
  const fixture = await readFile(resolve(root, "tests/unit/calendar/isolated-browser/entry.tsx"), "utf8");
  expect(fixture.split("{content}</DashboardShell>")).toHaveLength(2);
  const entry = 'import { PreviewBuildBadge } from "@/components/system/preview-build-badge";\n' + fixture
    .replace('"../cal01-fixtures"', '"@/tests/unit/calendar/cal01-fixtures"')
    .replace("{content}</DashboardShell>", "{content}<PreviewBuildBadge /></DashboardShell>")
    .replace('userEmail="operator@invalid.test"', 'userEmail={new URLSearchParams(window.location.search).get("email") || "Operator.LongIdentity+reception.synthetic@example.invalid"}')
    .replace('name: "South Studio", is_default: false }];', 'name: "Lakeshore Community Wellness Studio — East Annex", is_default: false }].slice(0, new URLSearchParams(window.location.search).get("locations") === "one" ? 1 : 2);');
  const logger = createLogger();
  const logError = logger.error.bind(logger);
  logger.error = (message, options) => {
    serverErrors.add("VITE_ERROR", { message: diagnosticText(message) });
    logError(message, options);
  };
  lifecycle.add("SERVER_CREATE_BEGIN");
  server = await createServer({
    customLogger: logger,
    root, configFile: false, define: { "process.env": "{}" },
    plugins: [{
      name: "badge-local-boundaries", enforce: "pre",
      configureServer(vite) {
        let firstHtml = true;
        vite.middlewares.use((req, res, next) => {
          const path = diagnosticPath(req.url || "/");
          const startedAtMs = elapsed();
          const initialHtml = path === "/__badge" && firstHtml;
          if (initialHtml) { firstHtml = false; lifecycle.add("FIRST_HTML_REQUEST"); }
          serverRequests.add("SERVER_REQUEST", { path });
          res.once("finish", () => {
            serverRequests.add("SERVER_RESPONSE_SENT", { path, status: res.statusCode, durationMs: elapsed() - startedAtMs });
            if (initialHtml) lifecycle.add("FIRST_HTML_RESPONSE_SENT", { status: res.statusCode });
          });
          res.once("close", () => {
            if (!res.writableFinished) serverErrors.add("SERVER_RESPONSE_CLOSED_EARLY", { path, durationMs: elapsed() - startedAtMs });
          });
          next();
        });
        vite.middlewares.use(async (req, res, next) => {
          const path = req.url?.split("?")[0];
          if (path === "/__badge") {
            res.setHeader("Content-Type", "text/html");
            res.end(await vite.transformIndexHtml("/__badge", '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/__badge_fonts.css"></head><body><div id="root"></div><script type="module" src="/@id/virtual:badge-entry"></script></body></html>'));
            return;
          }
          if (path === "/api/build-info") {
            res.setHeader("Content-Type", "application/json");
            res.setHeader("Cache-Control", "no-store");
            res.end(JSON.stringify(identity)); return;
          }
          if (path === "/__badge_fonts.css") {
            res.setHeader("Content-Type", "text/css"); res.end(fontCss); return;
          }
          const font = path?.match(/^\/__badge_fonts\/([\w.-]+\.woff2)$/);
          if (font && fonts.has(font[1])) {
            res.setHeader("Content-Type", "font/woff2");
            res.end(fonts.get(font[1])); return;
          }
          next();
        });
      },
      resolveId(id) {
        if (id === "virtual:badge-entry") return "\0badge:entry";
        if (id.startsWith(root + "/")) id = "@/" + id.slice(root.length + 1);
        if (id.startsWith("@/lib/actions/") || ["next/navigation", "next/link", "next/image", "@/providers/toast-provider"].includes(id)) return "\0badge:" + id;
        if (id.includes("supabase") || id === "server-only") throw new Error("Hosted module forbidden: " + id);
      },
      async load(id) {
        if (id === "\0badge:entry") return { code: entry, map: null };
        if (!id.startsWith("\0badge:")) return;
        const original = id.slice(7);
        if (original === "next/navigation") return `const navigate=url=>{const next=new URL(url,location.origin);history.replaceState(null,'','/__badge'+next.search);window.__render?.()};export const useRouter=()=>({refresh(){window.__render?.()},push:navigate,replace:navigate});export const usePathname=()=>'/dashboard/calendar';export const useSearchParams=()=>new URLSearchParams(location.search);`;
        if (original === "next/link") return `import React from 'react';export default function Link({children,...props}){return React.createElement('a',props,children)}`;
        if (original === "next/image") return `import React from 'react';export default function Image({fill,priority,unoptimized,...props}){return React.createElement('img',props)}`;
        if (original === "@/providers/toast-provider") return `export const useToast=()=>({toast(){}});`;
        const source = await readFile(resolve(root, original.replace("@/", "") + ".ts"), "utf8");
        const ast = ts.createSourceFile(original, source, ts.ScriptTarget.Latest, true);
        const names = ast.statements.flatMap((statement) => {
          if (ts.isExportDeclaration(statement) && statement.exportClause && ts.isNamedExports(statement.exportClause)) return statement.exportClause.elements.filter((item) => !item.isTypeOnly).map((item) => item.name.text);
          if (!ts.canHaveModifiers(statement) || !ts.getModifiers(statement)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) return [];
          if (ts.isFunctionDeclaration(statement) && statement.name) return [statement.name.text];
          if (ts.isVariableStatement(statement)) return statement.declarationList.declarations.map((declaration) => declaration.name.getText(ast));
          return [];
        });
        return `const call=async(name,args)=>{
          // Only reads used by this fixture are allowed, including existing reads
          // during Sheet opening. Sign out and all mutations are rejected.
          if(name.startsWith('get') || ['listTaxRates','setLocationScope'].includes(name)) {
            if(window.__fixtureActions?.[name]) return window.__fixtureActions[name](...args);
          }
          switch(name){
            case 'previewBookingSheetAvailability':return {slots:[],alternativeStaff:[],alternativeDays:[]};
            case 'getBookingSheetCustomerSnapshot':case 'getNextAvailableSlot':case 'getCustomerProfile':return null;
            case 'listPackages':return [];
            default:await window.__recordWriteAttempt(name);throw new Error('Rejected action: '+name);
          }
        };` + names.map((name) => `export const ${name}=(...args)=>call('${name}',args);`).join("\n");
      },
      transform(code, id) {
        observeTransform(id, false);
        if (id === "\0badge:entry") return ts.transpileModule(code, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext } }).outputText;
      },
    }, react(), {
      name: "badge-diagnostic-transform-end", enforce: "post",
      transform(_code, id) { observeTransform(id, true); },
    }], resolve: { alias: { "@": root } },
    server: { host: "127.0.0.1", port: 0, watch: { ignored: ["**/.next/**", "**/docs/validation/**"] } },
  });
  lifecycle.add("SERVER_CREATE_COMPLETE");
  lifecycle.add("SERVER_LISTEN_BEGIN");
  await server.listen();
  lifecycle.add("SERVER_LISTEN_COMPLETE");
  const address = server.httpServer!.address();
  if (!address || typeof address === "string") throw new Error("Missing local port");
  origin = `http://127.0.0.1:${address.port}`;
  lifecycle.add("SERVER_BOUND", { address: address.address, port: address.port });
  lifecycle.add("BROWSER_LAUNCH_BEGIN", { engine: "chromium" });
  browsers.chromium = await chromium.launch();
  lifecycle.add("BROWSER_LAUNCH_COMPLETE", { engine: "chromium" });
  lifecycle.add("BROWSER_LAUNCH_BEGIN", { engine: "webkit" });
  browsers.webkit = await webkit.launch();
  lifecycle.add("BROWSER_LAUNCH_COMPLETE", { engine: "webkit" });
}, 120_000);

afterAll(async () => {
  lifecycle.add("FIXTURE_TEARDOWN_BEGIN");
  const cleanupErrors: unknown[] = [];
  for (const browser of Object.values(browsers)) {
    try { await browser.close(); } catch (error) { cleanupErrors.push(error); }
  }
  try { await server?.close(); } catch (error) { cleanupErrors.push(error); }
  lifecycle.add("FIXTURE_TEARDOWN_COMPLETE", { cleanupErrors: cleanupErrors.length });
  emitDiagnostic({ event: "FIXTURE_LIFECYCLE", lifecycle: lifecycle.snapshot() });
  if (cleanupErrors.length) throw new AggregateError(cleanupErrors, "M1C fixture cleanup failed");
  if (evidence) await writeFile(resolve(evidence, "browser-results.json"), JSON.stringify(results, null, 2) + "\n");
});

const sizes = [[320, 740], [375, 812], [390, 844], [639, 900], [640, 900], [647, 900], [767, 900], [768, 1024], [834, 1112], [1023, 900], [1024, 900], [1366, 768], [1440, 900], [667, 320], [844, 390]];
for (const engine of ["chromium", "webkit"]) for (const theme of ["light", "dark"] as const) {
  it.each(sizes)(`${engine} M1C/Reception at %ipx × %ipx (${theme})`, async (width, height) => {
    const context = await browsers[engine].newContext({ viewport: { width, height }, hasTouch: width < 1024, isMobile: width < 1024, colorScheme: theme, timezoneId: "America/Toronto" });
    const contextCreatedAtMs = elapsed();
    const errors: string[] = [], writes: string[] = [], external: string[] = [];
    const states: unknown[] = [];
    await context.exposeFunction("__recordWriteAttempt", (name: string) => writes.push(name));
    await context.route("**/*", (route) => {
      if (new URL(route.request().url()).origin !== origin) { external.push(route.request().url()); return route.abort(); }
      if (route.request().method() !== "GET") { writes.push(route.request().method()); return route.abort(); }
      return route.continue();
    });
    const page = await context.newPage();
    const diagnostics = navigationDiagnostics(page, engine, `${width}x${height} ${theme}`, contextCreatedAtMs);
    page.on("pageerror", (error) => errors.push(error.message));
    const oneLocation = width % 2 === 1;
    const capture = async (state: string) => {
      const metrics = await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth,
        bodyWidth: document.body.scrollWidth, viewport: innerWidth, scrollX,
        visualOffset: visualViewport?.offsetLeft, visualScale: visualViewport?.scale,
        bodyOverflow: document.body.style.overflow,
      }));
      expect(metrics.documentWidth, state + JSON.stringify(metrics)).toBe(metrics.clientWidth);
      expect(metrics.bodyWidth).toBeLessThanOrEqual(metrics.viewport);
      expect(metrics.scrollX).toBe(0); expect(metrics.visualOffset).toBe(0);
      states.push({ state, ...metrics });
      if (evidence && [390, 834, 1440].includes(width)) await page.screenshot({ path: resolve(evidence, `${engine}-${width}-${theme}-${state}.png`) });
    };
    const hit = async (selector: import("playwright-core").Locator) => selector.evaluate((element) => {
      const r = element.getBoundingClientRect();
      return element.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
    });
    try {
      await page.clock.setFixedTime(new Date("2026-10-26T12:00:00Z"));
      if (engine === "chromium" && width < 1024) {
        const cdp = await context.newCDPSession(page);
        await cdp.send("Emulation.setSafeAreaInsetsOverride", { insets: { bottom: 34 } });
      }
      await diagnostics.navigate(() => page.goto(origin + `/__badge?locations=${oneLocation ? "one" : "multiple"}`));
      await page.getByLabel("Build information").waitFor();
      await page.evaluate(async (dark) => { document.documentElement.classList.toggle("dark", dark); await document.fonts.ready; }, theme === "dark");
      expect(await page.getByRole("dialog").count()).toBe(0);
      expect(await page.getByText("Payment information not verified", { exact: true }).count()).toBeGreaterThan(0);
      const avatar = page.getByRole("button", { name: /^Account, signed in as/ });
      expect(await avatar.count()).toBe(1);
      const bounds = (await avatar.boundingBox())!;
      expect(bounds.width).toBeGreaterThanOrEqual(44); expect(bounds.height).toBeGreaterThanOrEqual(44);
      expect(await hit(avatar)).toBe(true);
      expect(await page.locator('header.sticky').evaluate((element) => element.getBoundingClientRect().height)).toBe(64);
      expect(await hit(page.getByRole("button", { name: "Communications" }))).toBe(true);
      expect(await hit(page.getByRole("button", { name: /Switch to (dark|light) mode/ }))).toBe(true);
      await capture("closed");
      // Real pointer/touch and keyboard activations, with the actual shared Sheet.
      if (width < 1024) await avatar.tap(); else { await avatar.focus(); await page.keyboard.press("Enter"); }
      const account = page.getByRole("dialog", { name: "Account", exact: true });
      await account.waitFor();
      const close = account.getByRole("button", { name: "Close", exact: true });
      const signOut = account.getByRole("button", { name: "Sign out", exact: true });
      await expect.poll(() => close.evaluate((element) => element === document.activeElement)).toBe(true);
      expect(await account.getByText("Operator.LongIdentity+reception.synthetic@example.invalid", { exact: true }).count()).toBe(1);
      expect(await page.locator("header.sticky").evaluate((header) => !!header.querySelector('[role="dialog"]'))).toBe(false);
      expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");
      await page.keyboard.press("Shift+Tab"); expect(await signOut.evaluate((element) => element === document.activeElement)).toBe(true);
      await page.keyboard.press("Tab"); expect(await close.evaluate((element) => element === document.activeElement)).toBe(true);
      await signOut.scrollIntoViewIfNeeded(); expect(await hit(signOut)).toBe(true);
      await capture("account-open");
      await page.keyboard.press("Escape");
      expect(await account.count()).toBe(0); expect(await avatar.evaluate((element) => element === document.activeElement)).toBe(true);
      expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
      await page.keyboard.press("Space"); await account.waitFor();
      await page.getByRole("button", { name: "Close panel", exact: true }).click({ position: { x: 5, y: 5 } });
      expect(await account.count()).toBe(0);
      await avatar.click(); await account.waitFor(); await close.click(); expect(await account.count()).toBe(0);

      if (width < 1024) {
        for (const openerName of ["Open menu", "More navigation"]) {
          const opener = page.getByRole("button", { name: openerName, exact: true });
          await opener.click();
          const drawer = page.getByRole("dialog", { name: "Dashboard navigation" });
          await drawer.evaluate(async (element) => { await Promise.all(element.getAnimations().map((animation) => animation.finished)); });
          const drawerClose = drawer.getByRole("button", { name: "Close menu" });
          const drawerSignOut = drawer.getByRole("button", { name: "Sign out", exact: true });
          expect(await hit(drawerClose)).toBe(true); expect(await hit(drawerSignOut)).toBe(true);
          const closeContrast = await drawerClose.evaluate((element) => {
            const canvas = document.createElement("canvas"), ctx = canvas.getContext("2d")!;
            function luminance(color: string) {
              ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1);
              return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3).map((channel) => channel / 255)
                .map((v) => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
                .reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
            }
            const foreground = luminance(getComputedStyle(element).color);
            const background = luminance(getComputedStyle(element.closest('[role="dialog"]')!.querySelector('aside')!).backgroundColor);
            return (Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05);
          });
          expect(closeContrast).toBeGreaterThanOrEqual(3);
          expect(await drawerClose.evaluate((element) => element === document.activeElement)).toBe(true);
          expect(await page.locator('nav[aria-label="Primary"]').evaluate((element) => (element as HTMLElement).inert)).toBe(true);
          await page.keyboard.press("Shift+Tab"); expect(await drawerSignOut.evaluate((element) => element === document.activeElement)).toBe(true);
          await page.keyboard.press("Tab"); expect(await drawerClose.evaluate((element) => element === document.activeElement)).toBe(true);
          const geometry = await drawer.evaluate((element) => {
            const aside = element.querySelector('aside')!, nav = aside.querySelector('nav')!, action = [...aside.querySelectorAll('button')].find((button) => button.textContent?.trim() === 'Sign out')!;
            return { padding: parseFloat(getComputedStyle(aside).paddingBottom), navHeight: nav.clientHeight, navScrollHeight: nav.scrollHeight, navOverflow: getComputedStyle(nav).overflowY, bottom: action.getBoundingClientRect().bottom, viewportHeight: innerHeight, layer: getComputedStyle(element.parentElement!).zIndex };
          });
          expect(geometry.layer).toBe("55"); expect(geometry.bottom).toBeLessThanOrEqual(height - geometry.padding);
          expect(geometry.navOverflow).toBe("auto"); expect(geometry.navHeight).toBeGreaterThan(0);
          if (engine === "chromium") expect(geometry.padding).toBe(34);
          states.push({ state: "drawer-geometry", openerName, ...geometry });
          if (openerName === "More navigation") await capture("drawer-open");
          await page.keyboard.press("Escape");
          expect(await drawer.count()).toBe(0); expect(await opener.evaluate((element) => element === document.activeElement)).toBe(true);
          expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
        }
        // Viewport/toolbars shrink then a desktop crossing must clear modal state.
        await page.getByRole("button", { name: "More navigation" }).click();
        await page.setViewportSize({ width, height: Math.max(300, height - 70) });
        expect(await hit(page.getByRole("dialog", { name: "Dashboard navigation" }).getByRole("button", { name: "Sign out", exact: true }))).toBe(true);
        await page.setViewportSize({ width: 1024, height });
        await expect.poll(() => page.getByRole("dialog").count()).toBe(0);
        // CSS hides the drawer before React's media-query close effect commits.
        // Wait for lifecycle cleanup, not merely the hidden dialog's role count.
        await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("");
        await expect.poll(() => avatar.evaluate((element) => element === document.activeElement)).toBe(true);
        await page.setViewportSize({ width, height });
      }
      await page.getByRole("button", { name: "New appointment", exact: true }).click();
      const booking = page.getByRole("dialog"); await booking.waitFor();
      await page.locator("#bs-notes").fill("Continuous local M1C notes");
      await page.locator("#bs-notes").pressSequentially(" retain focus");
      expect(await page.locator("#bs-notes").inputValue()).toBe("Continuous local M1C notes retain focus");
      expect(await page.locator("#bs-notes").evaluate((element) => element === document.activeElement)).toBe(true);
      await capture("booking-open");
      await page.keyboard.press("Escape"); expect(await page.getByRole("dialog").count()).toBe(0);
      expect(await page.locator("#calendar-jump-date").inputValue()).toBe("2026-10-26");
      await capture("closed-after");
      expect(errors).toEqual([]); expect(writes).toEqual([]); expect(external).toEqual([]);
      results.push({ engine, width, height, theme, oneLocation, safeAreaBottom: engine === "chromium" && width < 1024 ? 34 : 0, states, errors, writes, external });
    } finally { await diagnostics.closeContext(context); }
  }, 60_000);
}


for (const engine of ["chromium", "webkit"]) it.each([390, 834])(`${engine} identity, Location and cross-view continuity at %ipx`, async (width) => {
  const context = await browsers[engine].newContext({ viewport: { width, height: 900 }, hasTouch: true, isMobile: true, timezoneId: "America/Toronto" });
  const contextCreatedAtMs = elapsed();
  const errors: string[] = [], writes: string[] = [], external: string[] = [];
  await context.exposeFunction("__recordWriteAttempt", (name: string) => writes.push(name));
  await context.route("**/*", (route) => {
    if (new URL(route.request().url()).origin !== origin || route.request().method() !== "GET") { external.push(route.request().url()); return route.abort(); }
    return route.continue();
  });
  const page = await context.newPage(); page.on("pageerror", (error) => errors.push(error.message));
  const diagnostics = navigationDiagnostics(page, engine, `${width}px continuity`, contextCreatedAtMs);
  const transitions: string[] = [];
  try {
    await page.clock.setFixedTime(new Date("2026-10-26T12:00:00Z"));
    for (const [locations, email] of [["one", "a@invalid.test"], ["multiple", "A.very.long.synthetic.operator.identity+account.regression@example.invalid"]]) {
      await diagnostics.navigate(() => page.goto(origin + `/__badge?locations=${locations}&email=${encodeURIComponent(email)}`));
      await page.getByLabel("Build information").waitFor();
      const avatar = page.getByRole("button", { name: `Account, signed in as ${email}`, exact: true });
      await avatar.click();
      const account = page.getByRole("dialog", { name: "Account", exact: true });
      expect(await account.getByText(email, { exact: true }).count()).toBe(1);
      await page.keyboard.press("Escape");
      expect(await account.count()).toBe(0);
      expect(await page.locator("#calendar-jump-date").inputValue()).toBe("2026-10-26");
      if (locations === "multiple") {
        if (width < 640) {
          await page.getByRole("button", { name: "Workspace location: North Studio", exact: true }).click();
          await page.getByRole("dialog", { name: "Workspace location", exact: true }).getByRole("button", { name: "Lakeshore Community Wellness Studio — East Annex", exact: true }).click();
          await expect.poll(() => page.getByRole("dialog").count()).toBe(0);
        } else await page.getByRole("combobox", { name: "Switch location" }).selectOption("loc2");
        await avatar.click(); await account.waitFor(); await page.keyboard.press("Escape");
        const retained = width < 640
          ? await page.getByRole("button", { name: "Workspace location: Lakeshore Community Wellness Studio — East Annex", exact: true }).count() === 1
          : await page.getByRole("combobox", { name: "Switch location" }).inputValue() === "loc2";
        expect(retained).toBe(true);
        for (const view of ["week", "month", "agenda", "day"]) {
          await page.getByRole("combobox", { name: "Calendar view" }).selectOption(view);
          await expect.poll(() => new URL(page.url()).searchParams.get("view")).toBe(view);
          await expect.poll(() => page.locator("#calendar-jump-date").inputValue()).toBe("2026-10-26");
          expect(new URL(page.url()).searchParams.get("date")).toBe("2026-10-26");
          if (view === "week" && width === 390) {
            const nested = await page.evaluate(() => {
              const scroller = [...document.querySelectorAll<HTMLElement>('main div')].find((element) => getComputedStyle(element).overflowX === "auto" && element.scrollWidth > element.clientWidth);
              if (!scroller) return null;
              scroller.scrollTo({ left: 150, behavior: "instant" });
              return { scrollLeft: scroller.scrollLeft, width: scroller.clientWidth, content: scroller.scrollWidth, pageX: scrollX };
            });
            expect(nested).not.toBeNull(); expect(nested!.scrollLeft).toBeGreaterThan(0); expect(nested!.pageX).toBe(0);
          }
          expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
          transitions.push(view);
        }
      }
    }
    expect(errors).toEqual([]); expect(writes).toEqual([]); expect(external).toEqual([]);
    results.push({ engine, width, test: "short/long identity, one/multiple Locations, local scope retention, cross-view continuity", transitions, errors, writes, external });
  } finally { await diagnostics.closeContext(context); }
}, 60_000);
