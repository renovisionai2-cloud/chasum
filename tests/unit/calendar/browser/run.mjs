// node tests/unit/calendar/browser/run.mjs [evidence-directory]
// Real Calendar, Reception, Booking Sheet and CSS; deterministic in-memory server boundaries.
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import ts from 'typescript';
import { chromium, expect } from '@playwright/test';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = process.cwd();
const output = resolve(process.argv[2] || '/private/tmp/chasum-cal01-evidence');
await mkdir(output, { recursive: true });
const actionRuntime = `
const call = async (name, args) => {
  window.__calls ||= []; window.__calls.push({ name, args });
  switch(name) {
    case 'previewBookingSheetAvailability': return { slots: [{start: args[0].date + 'T16:30:00.000Z', end: args[0].date + 'T17:00:00.000Z'}], alternativeStaff: [], alternativeDays: [] };
    case 'getBookingSheetCustomerSnapshot': case 'getNextAvailableSlot': case 'getCustomerProfile': return null;
    case 'loadAppointmentFinancialActivity': return { data: null, error: null };
    case 'loadAppointmentCommunicationsAction': return {items: []};
    case 'listPackages': case 'getCustomers': case 'getEligibleStaffForBooking': case 'getDashboardAvailableSlots': return [];
    default: await window.__recordWriteAttempt(name); throw new Error('Synthetic boundary rejected ' + name);
  }
};`;
const server = await createServer({
  root, configFile: false, define: { "process.env": "{}" }, plugins: [{
    name: 'cal01-synthetic-boundaries', enforce: 'pre',
    resolveId(id) {
      if (id.startsWith(root + "/")) id = "@/" + id.slice(root.length + 1);
      if (id.startsWith('@/lib/actions/')) return '\0cal01:' + id;
      if (['next/navigation', 'next/link', 'next/image', '@/providers/toast-provider'].includes(id)) return '\0cal01:' + id;
      if (id.includes('supabase') || id === 'server-only') throw new Error('Hosted module forbidden in fixture: ' + id);
    },
    async load(id) {
      if (!id.startsWith('\0cal01:')) return;
      const original = id.slice(7);
      if (original === 'next/navigation') return `export const useRouter = () => ({refresh(){}, push(url){window.__navigation=url}}); export const usePathname=()=>'/dashboard/calendar'; export const useSearchParams=()=>new URLSearchParams();`;
      if (original === 'next/image') return `import React from 'react'; export default function Image({fill,priority,unoptimized,...props}) {return React.createElement('img',props)}`;
      if (original === 'next/link') return `import React from 'react'; export default function Link({children,...props}) {return React.createElement('a',props,children)}`;
      if (original === '@/providers/toast-provider') return `export const useToast=()=>({toast(){}});`;
      const file = await readFile(resolve(root, original.replace('@/', '') + '.ts'), 'utf8');
      const ast = ts.createSourceFile(original, file, ts.ScriptTarget.Latest, true);
      const names = ast.statements.filter(s => ts.isFunctionDeclaration(s) && s.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)).map(s => s.name.text);
      return actionRuntime + names.map(n => `export const ${n}=(...args)=>call('${n}',args);`).join('\n');
    },
  }, react()], resolve: { alias: { '@': root } }, server: { host: '127.0.0.1', port: 0 },
});
await server.listen();
const address = server.httpServer.address();
const origin = `http://127.0.0.1:${address.port}`;
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const [name, width, height] of [['desktop',1440,1000], ['tablet',834,1112], ['phone',390,844]]) {
    const context = await browser.newContext({ viewport: { width, height }, timezoneId: 'America/Los_Angeles' });
    const writes = [];
    await context.exposeFunction('__recordWriteAttempt', name => writes.push(name));
    await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    const page = await context.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    const open = async query => {
      await page.goto(origin + '/tests/unit/calendar/browser/index.html' + query);
      await expect(page.getByRole('button', {name: width < 640 ? 'New' : 'New appointment', exact: true})).toBeVisible();
    };
    const close = async () => { await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0); };
    await open('');
    await expect(page.getByRole('heading', {name:'Reception', exact:true})).toHaveCount(0);
    await page.screenshot({path:resolve(output, `${name}-day.png`), fullPage:true});
    if (width < 768) await page.getByRole('button',{name:'Add appointment on 2026-10-20'}).click();
    else {
      const slot = page.locator('[data-staff-column="staff"] button').nth(5);
      const box = await slot.boundingBox(); await slot.click({position:{x:box.width/2,y:box.height/2+1}});
    }
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('#bs-service')).toHaveValue('');
    await expect(page.locator('[name="start_time"]')).toHaveValue(width < 768 ? '' : '2026-10-20T16:30:00.000Z');
    await expect(page.locator('[name="staff_id"]')).toHaveValue(width < 768 ? '' : 'staff');
    await page.screenshot({path:resolve(output, `${name}-sheet.png`), fullPage:true});
    await close();
    await open('?view=month');
    await page.getByRole('button',{name:'Open October 20',exact:true}).click();
    expect(await page.evaluate(()=>window.__navigation)).toBe('/dashboard/calendar?view=day&date=2026-10-20');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    const add=page.getByRole('button',{name:'Add appointment on October 20, 2026',exact:true});
    await add.focus(); await page.keyboard.press('Enter');
    await expect(page.locator('[name="start_time"]')).toHaveValue('');
    await expect(page.locator('[name="date"]')).toHaveValue('2026-10-20');
    await expect(page.locator('#bs-service')).toHaveValue('');
    await close();
    await page.screenshot({path:resolve(output,`${name}-month.png`),fullPage:true});
    await open('?view=week&all');
    const weekSlot=page.locator('button.min-h-\\[56px\\]').nth(5 * 7 + 2); // Tuesday noon in the existing Week grid.
    await expect(weekSlot).toBeVisible();
    const weekBox = await weekSlot.boundingBox();
    await weekSlot.click({position:{x:weekBox.width/2, y:weekBox.height/2+1}});
    await expect(page.locator('[name="start_time"]')).toHaveValue('2026-10-20T16:30:00.000Z');
    await expect(page.locator('#bs-location')).toHaveValue('');
    await expect(page.locator('[name="staff_id"]')).toHaveValue('');
    await page.locator('#bs-location').selectOption('loc');
    await expect(page.locator('#bs-service')).toHaveValue('');
    await page.locator('#bs-service').selectOption('svc');
    await page.locator('#bs-location').selectOption('loc2');
    await expect(page.locator('#bs-service')).toHaveValue('');
    await page.screenshot({path:resolve(output,`${name}-week-location.png`),fullPage:true});
    await close();
    await open('?view=month&existing');
    await page.getByRole('button',{name:/12:30 PM Test Customer/}).click();
    await expect(page.locator('#bs-service')).toHaveCount(0);
    await expect(page.getByText('Test Customer',{exact:true}).first()).toBeVisible();
    results.push({name,width,height,errors,writes});
    expect(errors).toEqual([]); expect(results.at(-1).writes).toEqual([]);
    await context.close();
  }
  await writeFile(resolve(output,'results.json'),JSON.stringify(results,null,2));
  console.log(JSON.stringify({result:'PASS',output,results},null,2));
} finally { await browser.close(); await server.close(); }
