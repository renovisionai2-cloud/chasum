/** Local component/browser validation only. No Auth/database/provider connection.
 * Run after npm run build: node tests/browser/tenant-identity-smoke.mjs
 * The actual onboarding page + form are bundled with explicit backend stubs.
 */
import { build } from "vite";
import react from "@vitejs/plugin-react";
import { chromium } from "@playwright/test";
import { readFile, readdir, mkdir } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import assert from "node:assert/strict";
const root = process.cwd();
const output =
  process.env.UI_EVIDENCE_DIR ?? path.join(os.tmpdir(), "chasum-issue72-ui");
await mkdir(output, { recursive: true });
const stubs = {
  "@/lib/actions/tenant-identity": `export async function submitBusinessIdentity(_, form) { window.__calls.push(Object.fromEntries(form)); return form.get('intent')==='join_existing' ? {existing:true} : {review:true}; }`,
  "@/lib/actions/business": `export async function requireUser(){return {id:'synthetic-user',email_confirmed_at:'2026-01-01',app_metadata:{}}} export async function resolveBusinessForUser(){return null}`,
  "@/lib/env": `export function getSupabaseEnv(){return {url:'https://unused.invalid'}}`,
  "next/navigation": `export function redirect(path){throw new Error(path)}`,
  "next/link": `import React from 'react'; export default function Link({children,...props}){return React.createElement('a',props,children)}`,
};
const entry = "\0identity-fixture";
const bundled = await build({
  configFile: false,
  logLevel: "warn",
  resolve: { alias: { "@": root } },
  plugins: [
    react(),
    {
      name: "no-backend",
      enforce: "pre",
      resolveId(id) {
        if (id === "identity-fixture" || id === root + "/identity-fixture")
          return entry;
        const key = id.startsWith(root + "/")
          ? "@/" + id.slice(root.length + 1)
          : id;
        if (key in stubs) return "\0stub:" + key;
      },
      load(id) {
        if (id === entry)
          return `import React from 'react';import{createRoot}from'react-dom/client';import Page from '${root}/app/onboarding/business/page.tsx';window.__calls=[];Page().then(page=>createRoot(document.getElementById('root')).render(page));`;
        if (id.startsWith("\0stub:")) return stubs[id.slice(6)];
      },
    },
  ],
  build: {
    write: false,
    lib: {
      entry: "identity-fixture",
      formats: ["iife"],
      name: "IdentityFixture",
    },
    minify: false,
  },
  define: { "process.env.NODE_ENV": '"production"' },
});
const javascript = (Array.isArray(bundled) ? bundled[0] : bundled).output.find(
  (item) => item.type === "chunk",
).code;
const cssFiles = (await readdir(".next/static/chunks")).filter((f) =>
  f.endsWith(".css"),
);
const css = (
  await Promise.all(
    cssFiles.map((f) => readFile(".next/static/chunks/" + f, "utf8")),
  )
).join("\n");
const browser = await chromium.launch({ headless: true });
try {
  for (const width of [375, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    // All network requests blocked, including fonts. Actual app CSS is inline.
    await page.route("**/*", (route) => route.abort());
    async function load() {
      await page.setContent(
        '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div></body></html>',
      );
      await page.addStyleTag({ content: css });
      await page.addScriptTag({ content: javascript });
      await page
        .getByRole("heading", { name: "Connect to your business" })
        .waitFor();
    }
    await load();
    assert(
      await page
        .getByRole("button", { name: "Continue with existing business" })
        .isDisabled(),
    );
    await page.keyboard.press("Tab");
    await page.keyboard.press("Space");
    assert(
      await page
        .getByLabel("My business is already on Chasum / I need access")
        .isChecked(),
    );
    await page
      .getByRole("button", { name: "Continue with existing business" })
      .click();
    await page
      .getByRole("heading", { name: "Get access to your existing business" })
      .waitFor();
    assert.equal(
      await page.evaluate(() => window.__calls[0].intent),
      "join_existing",
    );
    await load();
    await page.getByLabel("Create a new business", { exact: true }).check();
    await page
      .getByRole("button", { name: "Confirm and create business" })
      .click();
    assert.equal(
      await page.evaluate(() => window.__calls.length),
      0,
      "required fields block submission",
    );
    for (const [label, value] of Object.entries({
      "Business name": "Synthetic Studio",
      "Business email": "fictional@example.test",
      "Business phone (include country code)": "+1 416 555 0123",
      City: "Toronto",
      "State / province / region": "Ontario",
      "Country code (for example CA or US)": "CA",
    }))
      await page.getByLabel(label, { exact: true }).fill(value);
    await page.getByRole("checkbox").check();
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      "no horizontal overflow",
    );
    await page.screenshot({
      path: path.join(output, `new-business-${width}.png`),
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Confirm and create business" })
      .click();
    await page
      .getByRole("heading", { name: "Let’s confirm your business identity" })
      .waitFor();
    assert.equal(
      await page.getByRole("button").count(),
      0,
      "review has no override",
    );
    assert.equal(
      await page
        .getByRole("link", { name: "Contact Chasum Support" })
        .getAttribute("href"),
      "/contact",
    );
    assert.deepEqual(errors, []);
    await page.screenshot({
      path: path.join(output, `review-${width}.png`),
      fullPage: true,
    });
    await page.close();
    console.log(
      `PASS ${width}px: explicit choice, keyboard, required inputs, submit intent, review stop, support link, no overflow, zero backend traffic`,
    );
  }
  console.log(`Evidence: ${output}`);
} finally {
  await browser.close();
}
