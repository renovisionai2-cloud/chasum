// @vitest-environment node
import { createServer, type Server } from "node:http";
import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { build } from "vite";
import react from "@vitejs/plugin-react";
import { chromium, webkit, type Browser } from "playwright-core";
import { expect as playwrightExpect } from "@playwright/test";
import { afterAll, beforeAll, expect, it } from "vitest";
import { createLifecycleDiagnostic } from "./payment-input-browser/lifecycle-diagnostic";

// Real component + built application CSS/fonts. Synthetic form only; no actions,
// database, provider, credentials, customer data, or hosted network access.
const browserExpect = playwrightExpect.configure({ timeout: 1500 });
const root = process.cwd();
const evidence = process.env.CHASUM_N02_EVIDENCE;
const browsers: Record<string, Browser> = {};
const lifecycle = createLifecycleDiagnostic(browsers);
const metrics: unknown[] = [];
let server: Server;
let origin: string;

beforeAll(async () => {
  const bundle = await build({
    root, configFile: false, logLevel: "error",
    resolve: { alias: { "@": root } },
    define: { "process.env.NODE_ENV": '\"development\"' },
    plugins: [react(), { name: "no-hosted-modules", enforce: "pre", resolveId(id) {
      if (/supabase|server-only|\/lib\/actions\//.test(id)) throw new Error(`Hosted module forbidden in N02 fixture: ${id}`);
    } }],
    build: { write: false, minify: false, lib: {
      entry: resolve(root, "tests/unit/booking/payment-input-browser/entry.tsx"), formats: ["es"], fileName: "entry",
    } },
  });
  const output = Array.isArray(bundle) ? bundle[0] : bundle;
  if (!("output" in output)) throw new Error("Missing fixture bundle");
  const code = output.output.find(item => item.type === "chunk")?.code;
  if (!code) throw new Error("Missing fixture JavaScript");
  const staticRoot = resolve(root, ".next/static");
  const cssFiles = (await readdir(staticRoot, { recursive: true })).filter(name => name.endsWith(".css"));
  expect(cssFiles.length, "Run npm run build first").toBeGreaterThan(0);
  const css = (await Promise.all(cssFiles.map(name => readFile(resolve(staticRoot, name), "utf8")))).join("\n");
  expect(css).toContain("font-family:Inter");
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><style>:root{--font-geist-sans:Inter,system-ui,sans-serif;--font-geist-mono:"JetBrains Mono",monospace}body{font-family:Inter,system-ui,sans-serif}</style></head><body><div id="root"></div><script type="module" src="/entry.js"></script></body></html>`;
  server = createServer(async (req, res) => {
    try {
      const path = new URL(req.url ?? "/", "http://localhost").pathname;
      if (req.method !== "GET") { res.writeHead(405).end(); return; }
      if (path === "/") { res.setHeader("Content-Type", "text/html"); res.end(html); return; }
      if (path === "/entry.js") { res.setHeader("Content-Type", "text/javascript"); res.end(code); return; }
      if (path === "/style.css") { res.setHeader("Content-Type", "text/css"); res.end(css.replaceAll("../media/", "/_next/static/media/")); return; }
      const file = resolve(staticRoot, "." + path.replace(/^\/_next\/static/, ""));
      if (path.startsWith("/_next/static/") && file.startsWith(staticRoot + sep) && file.endsWith(".woff2")) {
        res.setHeader("Content-Type", "font/woff2"); res.end(await readFile(file)); return;
      }
      res.writeHead(404).end();
    } catch { res.writeHead(500).end(); }
  });
  lifecycle.attachServer(server);
  await new Promise<void>(done => server.listen(0, "127.0.0.1", done));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Missing local fixture port");
  origin = `http://127.0.0.1:${address.port}`;
  lifecycle.emit("BROWSER_LAUNCH_BEGIN", { browser: "chromium" });
  browsers.chromium = await chromium.launch();
  lifecycle.attachBrowser("chromium", browsers.chromium);
  lifecycle.emit("BROWSER_LAUNCH_COMPLETE", { browser: "chromium" });
  lifecycle.emit("BROWSER_LAUNCH_BEGIN", { browser: "webkit" });
  browsers.webkit = await webkit.launch();
  lifecycle.attachBrowser("webkit", browsers.webkit);
  lifecycle.emit("BROWSER_LAUNCH_COMPLETE", { browser: "webkit" });
  if (evidence) await mkdir(evidence, { recursive: true });
});

afterAll(async () => {
  lifecycle.beginHook();
  try {
    // Original concurrent closes, order, assertions and 10-second hook limit.
    const closed = await Promise.allSettled(Object.entries(browsers).map(([name, browser]) =>
      lifecycle.observe(name + ".close", () => browser.close())));
    if (server) await lifecycle.observe("http.close", () =>
      new Promise<void>((done, fail) => server.close(error => error ? fail(error) : done())));
    if (evidence) await lifecycle.observe("evidence.write", () =>
      writeFile(resolve(evidence, "browser-metrics.json"), JSON.stringify(metrics, null, 2) + "\n"));
    for (const result of closed) if (result.status === "rejected") throw result.reason;
    lifecycle.endHook("resolved");
  } catch (error) {
    lifecycle.endHook("rejected");
    throw error;
  }
});

for (const engine of ["chromium", "webkit"]) for (const width of [320, 390, 834, 1280]) for (const theme of ["light", "dark"]) {
  it(`${engine} ${width}px ${theme}: edit, paste, caret, blur, submit and controls`, async () => {
    const context = await browsers[engine].newContext({ viewport: { width, height: 900 }, colorScheme: theme as "light" | "dark", serviceWorkers: "block" });
    const page = await context.newPage();
    page.setDefaultTimeout(1500);
    const errors: string[] = [], external: string[] = [], writes: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    await context.route("**/*", route => {
      const request = route.request();
      if (!request.url().startsWith(origin + "/")) { external.push(request.url()); return route.abort(); }
      if (request.method() !== "GET") { writes.push(request.method()); return route.abort(); }
      return route.continue();
    });
    try {
      await page.goto(origin);
      await page.evaluate(dark => document.documentElement.classList.toggle("dark", dark), theme === "dark");
      await page.evaluate(() => document.fonts.ready);
      const amount = page.getByLabel("Amount", { exact: true });
      const hidden = (name: string) => page.locator(`input[name="${name}"]`);
      await browserExpect(amount).toHaveValue("50.00");
      await browserExpect(amount).toHaveAttribute("inputmode", "decimal");
      await amount.fill("");
      await browserExpect(amount).toHaveValue("");
      await browserExpect(hidden("payment_amount_cents")).toHaveValue("0");
      await browserExpect(hidden("payment_mode")).toHaveValue("custom");
      for (const [text, cents] of [["75.00", "7500"], ["10.25", "1025"], ["0.01", "1"], [".5", "50"]]) {
        await amount.fill("");
        await amount.pressSequentially(text);
        await browserExpect(amount).toHaveValue(text);
        await browserExpect(hidden("payment_amount_cents")).toHaveValue(cents);
      }
      await amount.fill("10.");
      await browserExpect(amount).toHaveValue("10.");
      await amount.press("Tab");
      await browserExpect(amount).toHaveValue("10.00");
      await amount.fill("50.00");
      // Home scrolls the document in macOS WebKit; arrows move the text caret.
      for (let step = 0; step < 5; step++) await amount.press("ArrowLeft");
      await amount.press("ArrowRight");
      await amount.press("Delete");
      await amount.pressSequentially("7");
      await browserExpect(amount).toHaveValue("57.00");
      expect(await amount.evaluate(input => (input as HTMLInputElement).selectionStart)).toBe(2);
      await browserExpect(hidden("payment_amount_cents")).toHaveValue("5700");
      // Use native browser copy/paste, not a finished-value change event.
      const modifier = process.platform === "darwin" ? "Meta" : "Control";
      const source = page.getByLabel("Paste source");
      await source.selectText();
      await source.press(`${modifier}+c`);
      await amount.selectText();
      await amount.press(`${modifier}+v`);
      await browserExpect(amount).toHaveValue("12.34");
      await browserExpect(hidden("payment_amount_cents")).toHaveValue("1234");
      await amount.pressSequentially("a");
      await browserExpect(amount).toHaveValue("12.34");
      await amount.fill("12.345");
      await browserExpect(amount).toHaveValue("12.34");
      await amount.press("Enter");
      await browserExpect(page.getByTestId("count")).toHaveText("0");
      await page.getByLabel("Payment method").selectOption("e_transfer");
      await page.getByLabel("Reference / note").fill("synthetic reference");
      await page.getByRole("checkbox", { name: /send payment receipt/i }).check();
      await page.getByRole("button", { name: "Submit synthetic booking" }).click();
      const submitted = JSON.parse(await page.getByTestId("submitted").innerText());
      expect(submitted).toMatchObject({ payment_mode: "custom", payment_amount_cents: "1234", payment_method: "e_transfer", payment_note: "synthetic reference", payment_send_receipt: "1", payment_idempotency_key: "n02-synthetic-key", price_cents: "10000", tax_cents: "1300", deposit_cents: "5000" });
      await page.getByRole("radio", { name: /record .*deposit/i }).check();
      await browserExpect(amount).toHaveValue("50.00");
      await browserExpect(hidden("payment_mode")).toHaveValue("deposit");
      await amount.fill("18.50");
      await browserExpect(hidden("payment_mode")).toHaveValue("custom");
      await page.getByRole("radio", { name: /pay in full/i }).check();
      await browserExpect(amount).toHaveValue("113.00");
      await page.getByRole("radio", { name: "Record a different amount" }).check();
      await browserExpect(amount).toHaveValue("113.00");
      await page.getByRole("button", { name: "Parent amount" }).click();
      await browserExpect(amount).toHaveValue("25.00");
      await page.getByRole("button", { name: "Parent price" }).click();
      await browserExpect(amount).toHaveValue("80.00");
      await browserExpect(hidden("price_cents")).toHaveValue("20000");
      await browserExpect(hidden("tax_cents")).toHaveValue("2600");
      const dimensions = await page.evaluate(() => {
        const controls = [...document.querySelectorAll<HTMLElement>('#booking_payment_amount,#booking_payment_method,#booking_payment_note,[aria-label="Payment"] label:has(input[type="radio"])')].map(element => {
          const box = element.getBoundingClientRect();
          return { height: box.height, left: box.left, right: box.right };
        });
        const receipt = document.querySelector('input[type="checkbox"]')?.closest("label")?.getBoundingClientRect();
        return { controls, receiptTargetHeight: receipt?.height ?? null, overflow: document.documentElement.scrollWidth > innerWidth };
      });
      expect(dimensions.overflow).toBe(false);
      expect(dimensions.controls).toHaveLength(7);
      for (const control of dimensions.controls) {
        expect(control.height).toBeGreaterThanOrEqual(44);
        expect(control.left).toBeGreaterThanOrEqual(0);
        expect(control.right).toBeLessThanOrEqual(width);
      }
      if (evidence) await page.screenshot({ path: resolve(evidence, `${engine}-${width}-${theme}.png`), fullPage: true });
      await page.getByRole("radio", { name: "No payment now" }).check();
      await browserExpect(amount).toHaveCount(0);
      await browserExpect(hidden("payment_amount_cents")).toHaveValue("0");
      expect(errors).toEqual([]); expect(external).toEqual([]); expect(writes).toEqual([]);
      metrics.push({ engine, width, theme, ...dimensions, errors, external, writes });
    } finally { await context.close(); }
  });
}
