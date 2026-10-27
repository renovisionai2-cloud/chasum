// @vitest-environment node
import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createServer, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import ts from "typescript";
import { chromium, type Browser } from "playwright-core";
import { afterAll, beforeAll, expect, it } from "vitest";

// Actual Calendar/BookingSheet/dashboard/CSS, with the already accepted synthetic
// read fixture. No fixture file or application integration is edited by this test.
const root = process.cwd();
const evidence = process.env.CHASUM_BADGE_EVIDENCE;
const commit = "0123456789abcdef0123456789abcdef01234567";
const identity = { commit, commitShort: commit.slice(0, 7), env: "preview", production: false };
const results: unknown[] = [];
let server: ViteDevServer;
let browser: Browser;
let origin: string;

beforeAll(async () => {
  if (evidence) await mkdir(evidence, { recursive: true });
  const fontBuild = resolve(root, ".next/static");
  const cssFiles = (await readdir(resolve(fontBuild, "chunks"))).filter((name) => name.endsWith(".css"));
  const fontRules = (await Promise.all(cssFiles.map((name) => readFile(resolve(fontBuild, "chunks", name), "utf8"))))
    .flatMap((css) => css.match(/@font-face\{[^}]*\}/g) ?? [])
    .filter((rule) => /font-family:(Inter|JetBrains)/.test(rule));
  expect(fontRules.length, "Run npm run build first for the actual application fonts").toBeGreaterThan(0);
  const fontCss = fontRules.join("\n").replaceAll("../media/", "/__badge_fonts/") +
    '\n:root{--font-geist-sans:Inter,system-ui,sans-serif;--font-geist-mono:"JetBrains Mono",monospace}';
  const fontNames = [...new Set([...fontCss.matchAll(/\/__badge_fonts\/([\w.-]+\.woff2)/g)].map((match) => match[1]))];
  const fonts = new Map(await Promise.all(fontNames.map(async (name) => [name, await readFile(resolve(fontBuild, "media", name))] as const)));
  const fixture = await readFile(resolve(root, "tests/unit/calendar/isolated-browser/entry.tsx"), "utf8");
  expect(fixture.split("{content}</DashboardShell>")).toHaveLength(2);
  const entry = 'import { PreviewBuildBadge } from "@/components/system/preview-build-badge";\n' + fixture
    .replace('"../cal01-fixtures"', '"@/tests/unit/calendar/cal01-fixtures"')
    .replace("{content}</DashboardShell>", "{content}<PreviewBuildBadge /></DashboardShell>");
  server = await createServer({
    root, configFile: false, define: { "process.env": "{}" },
    plugins: [{
      name: "badge-local-boundaries", enforce: "pre",
      configureServer(vite) {
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
          if(name.startsWith('get') || ['listTaxRates'].includes(name)) {
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
        if (id === "\0badge:entry") return ts.transpileModule(code, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext } }).outputText;
      },
    }, react()], resolve: { alias: { "@": root } },
    server: { host: "127.0.0.1", port: 0, watch: { ignored: ["**/.next/**", "**/docs/validation/**"] } },
  });
  await server.listen();
  const address = server.httpServer!.address();
  if (!address || typeof address === "string") throw new Error("Missing local port");
  origin = `http://127.0.0.1:${address.port}`;
  browser = await chromium.launch();
}, 120_000);

afterAll(async () => {
  await browser?.close();
  await server?.close();
  if (evidence) await writeFile(resolve(evidence, "containment-results.json"), JSON.stringify(results, null, 2) + "\n");
});

const sizes = [[390, 844], [639, 900], [640, 900], [767, 900], [768, 900], [834, 1112], [1023, 900], [1024, 900], [1366, 768], [1440, 900]];
for (const theme of ["light", "dark"] as const) {
  it.each(sizes)(`contains the footer and application controls at %ipx × %ipx (${theme})`, async (width, height) => {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: width < 1024, isMobile: width < 1024, colorScheme: theme, timezoneId: "America/Toronto" });
    const errors: string[] = [], writes: string[] = [], external: string[] = [];
    let identityRequests = 0;
    await context.exposeFunction("__recordWriteAttempt", (name: string) => writes.push(name));
    await context.route("**/*", (route) => {
      const request = route.request();
      if (new URL(request.url()).origin !== origin) { external.push(request.url()); return route.abort(); }
      if (request.method() !== "GET") { writes.push(request.method() + " " + request.url()); return route.abort(); }
      if (new URL(request.url()).pathname === "/api/build-info") identityRequests++;
      return route.continue();
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    const capture = async (state: string) => {
      if (evidence && [390, 834, 1366, 1440].includes(width)) await page.screenshot({ path: resolve(evidence, `${width}-${theme}-${state}.png`), animations: state === "drawer" ? "allow" : "disabled" });
    };
    try {
      await page.clock.setFixedTime(new Date("2026-10-26T12:00:00Z"));
      await page.goto(origin + "/__badge");
      const footer = page.getByLabel("Build information");
      await footer.waitFor();
      await page.evaluate(async (dark) => { document.documentElement.classList.toggle("dark", dark); await document.fonts.ready; }, theme === "dark");
      expect(await page.evaluate(() => document.fonts.check("12px Inter"))).toBe(true);
      expect(await page.getByRole("dialog").count()).toBe(0);
      await capture("closed");
      // A normal-flow footer is reachable at the document end; other content
      // may naturally scroll behind the existing fixed navigation en route.
      await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
      const details = page.getByRole("link", { name: "Build details", exact: true });
      await details.focus();
      await page.keyboard.press("Tab");
      await page.keyboard.press("Shift+Tab");
      const metrics = await footer.evaluate((element) => {
        const style = getComputedStyle(element), box = element.getBoundingClientRect();
        const link = element.querySelector("a")!, text = element.querySelector("p")!;
        const linkBox = link.getBoundingClientRect(), linkStyle = getComputedStyle(link);
        const nav = document.querySelector('nav[aria-label="Primary"]')!;
        const navBox = nav.getBoundingClientRect();
        const intersects = (a: DOMRect, b: DOMRect) => a.x < b.right && a.right > b.x && a.y < b.bottom && a.bottom > b.y;
        const color = (value: string) => {
          const canvas = document.createElement("canvas"), ctx = canvas.getContext("2d")!;
          ctx.fillStyle = value; ctx.fillRect(0, 0, 1, 1);
          const rgb = [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3).map((v) => v / 255);
          return rgb.map((v) => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
        };
        const background = color(getComputedStyle(document.documentElement).getPropertyValue("--background"));
        const contrast = (value: string) => { const foreground = color(value); return (Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05); };
        const labels = [...nav.querySelectorAll("span")].filter((el) => el.getBoundingClientRect().width > 0);
        return {
          position: style.position, zIndex: style.zIndex, height: box.height, marginBottom: style.marginBottom, bottom: box.bottom, navTop: navBox.top, scrollY, scrollHeight: document.documentElement.scrollHeight,
          afterContent: box.top >= element.previousElementSibling!.getBoundingClientRect().bottom,
          overflow: document.documentElement.scrollWidth - innerWidth,
          linkHeight: linkBox.height, linkFocused: document.activeElement === link,
          linkHit: link.contains(document.elementFromPoint(linkBox.x + linkBox.width / 2, linkBox.y + linkBox.height / 2)),
          focusVisible: link.matches(":focus-visible"), focusShadow: linkStyle.boxShadow,
          textContrast: contrast(getComputedStyle(text).color), linkContrast: contrast(linkStyle.color),
          navVisible: navBox.width > 0, navOverlap: navBox.width > 0 && intersects(box, navBox),
          obscuredNavLabels: labels.filter((el) => { const r = el.getBoundingClientRect(); return !el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)); }).map((el) => el.textContent),
        };
      });
      expect(metrics.position).toBe("static"); expect(metrics.zIndex).toBe("auto");
      expect(metrics.height).toBeLessThanOrEqual(80); expect(metrics.afterContent).toBe(true);
      expect(metrics.overflow).toBe(0); expect(metrics.linkHeight).toBeGreaterThanOrEqual(44);
      expect(metrics.linkHit).toBe(true); expect(metrics.linkFocused).toBe(true);
      expect(metrics.focusVisible).toBe(true); expect(metrics.focusShadow).not.toBe("none");
      expect(metrics.textContrast).toBeGreaterThanOrEqual(4.5); expect(metrics.linkContrast).toBeGreaterThanOrEqual(4.5);
      expect(metrics.navVisible).toBe(width < 1024); expect(metrics.navOverlap, JSON.stringify(metrics)).toBe(false);
      expect(metrics.obscuredNavLabels).toEqual([]);
      if (metrics.navVisible) expect(metrics.navTop - metrics.bottom).toBeGreaterThanOrEqual(4); // Keep the focus ring visible too.
      await capture("footer-focused");

      if (width < 1024) {
        await page.getByRole("button", { name: "More navigation", exact: true }).click();
        await page.getByRole("dialog", { name: "Dashboard navigation" }).evaluate(async (dialog) => {
          await Promise.all(dialog.getAnimations().map((animation) => animation.finished));
        });
        const closeHit = await page.getByRole("button", { name: "Close menu", exact: true }).evaluate((button) => {
          const r = button.getBoundingClientRect();
          return button.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
        });
        expect(closeHit).toBe(true);
      }
      const signOut = (width < 1024 ? page.getByRole("dialog", { name: "Dashboard navigation" }) : page.locator("aside").first()).getByRole("button", { name: "Sign out", exact: true });
      const account = await signOut.evaluate((button) => {
        const rect = button.getBoundingClientRect(), footer = document.querySelector('footer[aria-label="Build information"]')!;
        const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
        const footerBox = footer.getBoundingClientRect();
        return {
          obscuredByDiagnostic: footer.contains(hit), signOutHit: button.contains(hit),
          hitNavigation: hit?.closest("nav")?.getAttribute("aria-label") ?? null,
          footerBoxOverlap: rect.x < footerBox.right && rect.right > footerBox.x && rect.y < footerBox.bottom && rect.bottom > footerBox.y,
        };
      });
      expect(account.obscuredByDiagnostic).toBe(false);
      // Do not manufacture full account acceptance: inherited z-50 bottom-nav
      // collision is separate and intentionally remains visible in evidence.
      if (width >= 1024) { expect(account.signOutHit).toBe(true); expect(account.footerBoxOverlap).toBe(false); }
      if (width < 1024) { await capture("drawer"); await page.keyboard.press("Escape"); }

      await page.getByRole("button", { name: "New appointment", exact: true }).click();
      const sheet = page.getByRole("dialog");
      await sheet.waitFor();
      await page.locator("#bs-notes").fill("Local badge containment notes");
      await page.locator("#bs-notes").pressSequentially(" intact");
      expect(await page.locator("#bs-notes").inputValue()).toBe("Local badge containment notes intact");
      expect(await page.locator("#bs-notes").evaluate((el) => el === document.activeElement)).toBe(true);
      const sheetMetrics = await sheet.evaluate((element) => {
        const footer = document.querySelector('footer[aria-label="Build information"]')!;
        const controls = [...element.querySelectorAll("button, input, textarea, select")].filter((control) => {
          const r = control.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.y >= 0 && r.bottom <= innerHeight;
        });
        return { overflow: document.documentElement.scrollWidth - innerWidth,
          diagnosticOverControls: controls.filter((control) => { const r = control.getBoundingClientRect(); return footer.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)); }).length,
          testedControls: controls.length };
      });
      expect(sheetMetrics.overflow).toBe(0); expect(sheetMetrics.diagnosticOverControls).toBe(0);
      expect(sheetMetrics.testedControls).toBeGreaterThan(0);
      await capture("booking-open");
      await page.keyboard.press("Escape");
      expect(await page.getByRole("dialog").count()).toBe(0);
      expect(await footer.count()).toBe(1); expect(identityRequests).toBe(1);
      await details.focus();
      await page.keyboard.press("Enter");
      await page.waitForURL(origin + "/api/build-info");
      expect(JSON.parse(await page.locator("body").innerText())).toEqual(identity);
      expect(identityRequests).toBe(2); // One component read, one deliberate link navigation.
      expect(errors).toEqual([]); expect(writes).toEqual([]); expect(external).toEqual([]);
      results.push({ width, height, theme, metrics, account, sheetMetrics, identityRequests, errors, writes, external, keyboardDetailsFullSha: commit });
    } finally { await context.close(); }
  }, 60_000);
}
