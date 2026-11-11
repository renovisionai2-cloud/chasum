import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { createServer } from "node:http";
import { mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import os from "node:os";

const root = process.cwd(), out = resolve(process.argv[2] || "../evidence");
const req = createRequire(resolve(root, "package.json"));
const source = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const tree = execFileSync("git", ["rev-parse", "HEAD^{tree}"], { encoding: "utf8" }).trim();
if (source !== "f72af50366224ac2630053e16d4b0cac443ff253" || tree !== "cffaea928abe6c58626a631ea92333857b7cf4b6") throw new Error("Wrong immutable source");
await mkdir(out, { recursive: true });
const { build } = await import(pathToFileURL(req.resolve("vite")));
const { default: react } = await import(pathToFileURL(req.resolve("@vitejs/plugin-react")));
const { chromium, webkit } = req("playwright-core");
const { expect } = req("@playwright/test");
const report = { source, tree, platform: os.platform(), release: os.release(), arch: os.arch(), node: process.version, playwright: req("playwright-core/package.json").version, records: [], cleanup: [], errors: [] };
const save = () => writeFile(resolve(out, "clipboard.json"), JSON.stringify(report, null, 2) + "\n");
await save();
const bundle = await build({
  root, configFile: false, logLevel: "error", resolve: { alias: { "@": root } },
  define: { "process.env.NODE_ENV": '"development"' },
  plugins: [react(), { name: "synthetic-only", enforce: "pre", resolveId(id) {
    if (/supabase|server-only|\/lib\/actions\//.test(id)) throw new Error("Hosted module forbidden: " + id);
  } }],
  build: { write: false, minify: false, lib: { entry: resolve(root, "tests/unit/booking/payment-input-browser/entry.tsx"), formats: ["es"], fileName: "entry" } },
});
const code = (Array.isArray(bundle) ? bundle[0] : bundle).output.find(item => item.type === "chunk").code;
const server = createServer((request, response) => {
  if (request.method !== "GET") { response.writeHead(405).end(); return; }
  if (request.url === "/entry.js") { response.setHeader("Content-Type", "text/javascript"); response.end(code); return; }
  if (request.url === "/") { response.setHeader("Content-Type", "text/html"); response.end('<div id="root"></div><script type="module" src="/entry.js"></script>'); return; }
  response.writeHead(404).end();
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
const origin = "http://127.0.0.1:" + server.address().port;
try {
  for (const [engine, type] of Object.entries({ chromium, webkit })) {
    const browser = await type.launch();
    try {
      for (const editable of [false, true]) {
        const record = { engine, version: browser.version(), editableSource: editable, shortcuts: process.platform === "darwin" ? ["Meta+c", "Meta+v"] : ["Control+c", "Control+v"], errors: [], blockedRequests: [] };
        report.records.push(record);
        const context = await browser.newContext({ serviceWorkers: "block" });
        const page = await context.newPage();
        page.setDefaultTimeout(1500);
        page.on("pageerror", error => record.errors.push(error.message));
        await context.route("**/*", route => {
          const r = route.request();
          if (r.url().startsWith(origin + "/") && r.method() === "GET") return route.continue();
          record.blockedRequests.push({ url: r.url(), method: r.method() }); return route.abort();
        });
        try {
          await page.addInitScript(() => {
            window.__clipboardEvents = [];
            const safe = text => text === "12.34" || text === "" || text == null ? text : { unexpectedTextLength: text.length };
            for (const type of ["keydown", "keyup", "copy", "paste", "beforeinput", "input"]) {
              document.addEventListener(type, event => {
                const target = event.target;
                const item = {
                  type, key: event.key, code: event.code, ctrl: event.ctrlKey, meta: event.metaKey, trusted: event.isTrusted,
                  inputType: event.inputType, data: safe(event.data), text: safe(event.clipboardData?.getData("text/plain")),
                  types: event.clipboardData ? [...event.clipboardData.types] : undefined,
                  target: target.id || target.getAttribute?.("aria-label"), activeElement: document.activeElement?.id || document.activeElement?.getAttribute("aria-label"),
                  value: target.value, selectionStart: target.selectionStart, selectionEnd: target.selectionEnd, defaultPrevented: event.defaultPrevented,
                };
                window.__clipboardEvents.push(item);
                queueMicrotask(() => { item.afterDispatch = { value: target.value, cents: document.querySelector('[name="payment_amount_cents"]')?.value, defaultPrevented: event.defaultPrevented }; });
              }, true);
            }
          });
          await page.goto(origin);
          const amount = page.getByLabel("Amount", { exact: true }), pasteSource = page.getByLabel("Paste source");
          await expect(amount).toHaveValue("50.00");
          await amount.fill("57.00");
          if (editable) await pasteSource.evaluate(input => { input.readOnly = false; });
          await pasteSource.selectText();
          record.sourceBeforeCopy = await pasteSource.evaluate(input => ({ value: input.value, readOnly: input.readOnly, start: input.selectionStart, end: input.selectionEnd, focused: document.activeElement === input }));
          record.amountBeforePaste = await amount.inputValue();
          // Preserve the existing native sequence; no readText, delay, permission
          // grant, synthetic event, fill or evaluation between copy and paste.
          await pasteSource.press(record.shortcuts[0]);
          await amount.selectText();
          await amount.press(record.shortcuts[1]);
          try {
            await expect(amount).toHaveValue("12.34", { timeout: 1500 });
            await expect(page.locator('[name="payment_amount_cents"]')).toHaveValue("1234", { timeout: 1500 });
            record.nativeReactAssertion = "PASS";
          } catch (error) { record.nativeReactAssertion = "FAIL"; record.assertionError = error.message; process.exitCode = 1; }
          record.reactResult = await page.evaluate(() => ({
            value: document.querySelector("#booking_payment_amount").value,
            cents: document.querySelector('[name="payment_amount_cents"]').value,
            events: [...window.__clipboardEvents],
          }));
          await save();
          // Independent native DOM control distinguishes insertion failures from
          // React/application filtering. This is outside the unchanged test suite.
          await page.evaluate(() => {
            window.__clipboardEvents = [];
            const input = document.createElement("input");
            input.id = "native-paste-control"; input.setAttribute("aria-label", "Native paste control"); input.value = "57.00";
            document.body.append(input);
          });
          const control = page.getByLabel("Native paste control");
          await pasteSource.selectText();
          await pasteSource.press(record.shortcuts[0]);
          await control.selectText();
          await control.press(record.shortcuts[1]);
          record.plainInputResult = await control.inputValue();
          record.plainInputEvents = await page.evaluate(() => window.__clipboardEvents);
          // Read only AFTER both native observations to avoid changing their
          // permissions/focus/timing. Never grant permissions or write via API.
          record.clipboardAPI = await page.evaluate(async () => {
            const available = !!navigator.clipboard?.readText;
            if (!available) return { available, result: "UNSUPPORTED" };
            return Promise.race([
              navigator.clipboard.readText().then(text => ({ available, result: "READ", text: text === "12.34" || text === "" ? text : { unexpectedTextLength: text.length } }), error => ({ available, result: "REJECTED", name: error.name, message: error.message })),
              new Promise(done => setTimeout(() => done({ available, result: "UNSETTLED_AFTER_1000MS" }), 1000)),
            ]);
          });
          if (record.errors.length || record.blockedRequests.length) process.exitCode = 1;
        } catch (error) {
          record.executionError = error.stack || error.message; process.exitCode = 1;
        } finally {
          await save();
          await context.close();
          record.contextClosed = true;
          await save();
        }
        console.log(JSON.stringify(record));
      }
    } finally {
      const began = performance.now();
      report.cleanup.push({ engine, event: "browser-close-begin", at: new Date().toISOString() }); await save();
      await browser.close();
      report.cleanup.push({ engine, event: "browser-close-complete", durationMs: performance.now() - began }); await save();
    }
  }
} catch (error) {
  report.errors.push(error.stack || error.message); process.exitCode = 1;
} finally {
  await new Promise((done, fail) => server.close(error => error ? fail(error) : done()));
  await save();
}
