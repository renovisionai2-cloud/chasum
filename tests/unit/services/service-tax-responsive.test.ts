// @vitest-environment node
import { readFile, mkdir } from "node:fs/promises";
import { writeSync } from "node:fs";
import { resolve } from "node:path";
import { createServer, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import ts from "typescript";
import { chromium, webkit, type Browser } from "playwright-core";
import { afterAll, beforeAll, expect, it } from "vitest";
import { closeServiceTaxFixture } from "./service-tax-teardown";

// Real ServicesManager, dialog, form and application CSS. All action modules are
// synthetic, mutations throw, and browser requests may only reach this server.
const root = process.cwd();
let server: ViteDevServer;
let origin: string;
const browsers: Record<string, Browser> = {};
const entry = `
import React from 'react'; import {createRoot} from 'react-dom/client';
import {ServicesManager} from '@/components/services/services-manager';
import {parseServiceTaxInput} from '@/lib/commerce/tax-rate-percent';
import '@/app/globals.css';
window.__parseTax = form => parseServiceTaxInput(new FormData(form));
const service = {id:'service-a',business_id:'tenant-a',location_id:'location-a',name:'Synthetic service',duration_minutes:30,price:116,color:'#2563eb',is_active:true,online_booking:true,booking_visibility:'online',taxable:true,tax_rate_bps:13,service_locations:[]};
createRoot(document.getElementById('root')).render(<ServicesManager services={[service]} locations={[{id:'location-a',name:'Synthetic location',is_active:true,is_default:true}]} categories={[]} staff={[]} selectedLocationId="location-a" />);
`;

beforeAll(async () => {
  server = await createServer({
    root, configFile: false, define: { "process.env": "{}" },
    resolve: { alias: { "@": root } },
    plugins: [{
      name: "tax-synthetic-boundaries", enforce: "pre",
      configureServer(vite) {
        vite.middlewares.use(async (req, res, next) => {
          if (req.url?.split("?")[0] !== "/__tax") return next();
          res.setHeader("Content-Type", "text/html");
          res.end(await vite.transformIndexHtml("/__tax", '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/@id/virtual:tax-entry"></script></body></html>'));
        });
      },
      resolveId(id) {
        if (id === "virtual:tax-entry") return "\0tax:entry";
        if (id.startsWith(root + "/")) id = "@/" + id.slice(root.length + 1);
        if (id.startsWith("@/lib/actions/") || ["next/navigation", "next/link", "@/providers/toast-provider"].includes(id)) return "\0tax:" + id;
        if (id.includes("supabase") || id === "server-only") throw new Error("Hosted module forbidden: " + id);
      },
      async load(id) {
        if (id === "\0tax:entry") return entry;
        if (!id.startsWith("\0tax:")) return;
        const original = id.slice(5);
        if (original === "next/navigation") return `export const useRouter=()=>({refresh(){}});export const usePathname=()=>'/dashboard/services';`;
        if (original === "next/link") return `import React from 'react';export default function Link({children,...props}){return React.createElement('a',props,children)}`;
        if (original === "@/providers/toast-provider") return `export const useToast=()=>({toast(){}});`;
        const source = await readFile(resolve(root, original.replace("@/", "") + ".ts"), "utf8");
        const ast = ts.createSourceFile(original, source, ts.ScriptTarget.Latest, true);
        const names = ast.statements.flatMap((statement) => {
          if (!ts.canHaveModifiers(statement) || !ts.getModifiers(statement)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) return [];
          return ts.isFunctionDeclaration(statement) && statement.name ? [statement.name.text] : [];
        });
        return names.map((name) => `export async function ${name}(){${name.startsWith("get") || name.startsWith("list") ? "return []" : "throw new Error('Mutation forbidden')"}}`).join("\n");
      },
      transform(code, id) {
        if (id === "\0tax:entry") return ts.transpileModule(code, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext } }).outputText;
      },
    }, react()],
    server: { host: "127.0.0.1", port: 0, watch: { ignored: ["**/.next/**"] } },
  });
  await server.listen();
  const address = server.httpServer!.address();
  if (!address || typeof address === "string") throw new Error("Missing local port");
  origin = `http://127.0.0.1:${address.port}`;
  browsers.chromium = await chromium.launch();
  browsers.webkit = await webkit.launch();
}, 120_000);

afterAll(async () => {
  await closeServiceTaxFixture({ chromium: browsers.chromium, webkit: browsers.webkit, vite: server,
    emit: (event) => writeSync(2, "[service-tax-teardown] " + JSON.stringify(event) + "\n"),
  });
}, 45_000);

for (const engine of ["chromium", "webkit"]) {
  for (const width of [390, 834, 1440]) {
    for (const theme of ["light", "dark"]) {
      it(`${engine} ${width}px ${theme}: existing low rate, percent entry and inheritance remain usable`, async () => {
        const context = await browsers[engine].newContext({ viewport: { width, height: 1000 } });
        const external: string[] = [], errors: string[] = [];
        await context.route("**/*", (route) => {
          if (new URL(route.request().url()).origin !== origin) { external.push(route.request().url()); return route.abort(); }
          return route.continue();
        });
        const page = await context.newPage();
        page.on("pageerror", (error) => errors.push(error.message));
        try {
          await page.goto(origin + "/__tax");
          await page.evaluate((dark) => document.documentElement.classList.toggle("dark", dark), theme === "dark");
          await page.getByRole("button", { name: "Edit Synthetic service", exact: true }).click();
          const rate = page.getByLabel("Custom tax rate (%)", { exact: true });
          await rate.waitFor({ state: "visible" });
          expect(await page.getByRole("checkbox", { name: "Taxable", exact: true }).count()).toBe(0);
          expect(await page.locator('[name="taxable"]').count()).toBe(0);
          expect(await page.getByText("Tax exemptions are not currently supported. The tax rate above applies.", { exact: true }).count()).toBe(1);
          expect(await rate.inputValue()).toBe("0.13");
          const parse = () => page.evaluate(() => {
            const form = document.querySelector<HTMLInputElement>('[name="tax_mode"]')!.form!;
            return (window as unknown as { __parseTax: (form: HTMLFormElement) => unknown }).__parseTax(form);
          });
          expect(await parse()).toEqual({ ok: true, rateBps: 13 });
          await rate.fill("13");
          expect(await parse()).toEqual({ ok: true, rateBps: 1300 });
          await rate.scrollIntoViewIfNeeded();
          await rate.focus();
          expect(await rate.evaluate((element) => document.activeElement === element)).toBe(true);
          const rect = await rate.boundingBox();
          expect(rect!.height).toBeGreaterThanOrEqual(44);
          expect(rect!.x).toBeGreaterThanOrEqual(0);
          expect(rect!.x + rect!.width).toBeLessThanOrEqual(width);
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
          const evidence = process.env.CHASUM_TAX_EVIDENCE;
          if (evidence) {
            await mkdir(evidence, { recursive: true });
            await page.screenshot({ path: resolve(evidence, `service-tax-${engine}-${width}-${theme}.png`) });
          }
          await page.getByLabel("Tax rate", { exact: true }).selectOption("inherit");
          expect(await rate.count()).toBe(0);
          expect(await parse()).toEqual({ ok: true, rateBps: 0 });
          expect(await page.locator('[name="tax_rate_bps"]').count()).toBe(0);
          expect(external).toEqual([]); expect(errors).toEqual([]);
        } finally { await context.close(); }
      }, 60_000);
    }
  }
}
