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
  }, react()], resolve: { alias: { '@': root } }, server: { host: '127.0.0.1', port: 0, watch: { ignored: ['**/.next/**'] } },
});
await server.listen();
const address = server.httpServer.address();
const origin = `http://127.0.0.1:${address.port}`;
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const [name, width, height] of [['desktop',1440,1000], ['tablet',834,1112], ['phone',390,844]]) {
    const context = await browser.newContext({ viewport: { width, height }, timezoneId: 'America/Los_Angeles', hasTouch: width < 1024, isMobile: width < 1024 });
    const writes = [];
    await context.exposeFunction('__recordWriteAttempt', name => writes.push(name));
    await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    const page = await context.newPage();
    await page.clock.setFixedTime(new Date('2026-10-20T16:00:00Z'));
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    const open = async query => {
      await page.goto(origin + '/tests/unit/calendar/browser/index.html' + query);
      await expect(page.getByRole('button', {name: 'New appointment', exact: true})).toBeVisible();
    };
    const close = async () => { await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0); };
    await open('');
    await expect(page.getByRole('heading', {name:'Reception', exact:true})).toHaveCount(0);
    // Full-page capture of a tall page resets touch emulation in this Chromium.
    // Keep touch screenshots at the actual device viewport; assert media below.
    await page.screenshot({path:resolve(output, `${name}-day.png`), fullPage:width>=1024});
    if (width < 768) await page.getByRole('button',{name:'Add appointment on October 20, 2026'}).click();
    else {
      const slot = page.locator('[data-staff-column="staff"] button').nth(5);
      const box = await slot.boundingBox(); await slot.click({position:{x:box.width/2,y:box.height/2+1}});
    }
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('#bs-service')).toHaveValue('');
    await expect(page.locator('[name="start_time"]')).toHaveValue(width < 768 ? '' : '2026-10-20T16:30:00.000Z');
    await expect(page.locator('[name="staff_id"]')).toHaveValue(width < 768 ? '' : 'staff');
    await page.screenshot({path:resolve(output, `${name}-sheet.png`), fullPage:width>=1024});
    await close();
    await open('?view=month');
    await expect(page.getByRole('button',{name:/^Add appointment on/})).toHaveCount(31);
    await expect(page.getByRole('button',{name:/^Add appointment on (September|November)/})).toHaveCount(0);
    const monthAdd=page.getByRole('button',{name:'Add appointment on October 20, 2026',exact:true});
    if (width >= 1024) await page.mouse.move(0,0);
    const pointer = await page.evaluate(()=>({hover:matchMedia('(hover:hover)').matches,coarse:matchMedia('(pointer:coarse)').matches}));
    expect(pointer).toEqual({hover:width>=1024,coarse:width<1024});
    await expect(monthAdd).toHaveCSS('opacity', width < 1024 ? '1' : '0');
    await page.screenshot({path:resolve(output,`${name}-month-resting.png`),fullPage:width>=1024});
    if (width < 1024) {
      expect((await monthAdd.boundingBox()).height).toBeGreaterThanOrEqual(44);
      await monthAdd.tap();
      await expect(page.locator('[name="date"]')).toHaveValue('2026-10-20');
      await expect(page.locator('[name="start_time"]')).toHaveValue('');
      await close();
    } else {
      await monthAdd.locator('..').hover();
      await expect(monthAdd).toHaveCSS('opacity','1');
    }
    await page.getByRole('button',{name:'Open October 20',exact:true}).click();
    expect(await page.evaluate(()=>window.__navigation)).toBe('/dashboard/calendar?view=day&date=2026-10-20');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    const add=page.getByRole('button',{name:'Add appointment on October 20, 2026',exact:true});
    await add.focus(); await expect(add).toHaveCSS('opacity','1'); await page.keyboard.press('Enter');
    await expect(page.locator('[name="start_time"]')).toHaveValue('');
    await expect(page.locator('[name="date"]')).toHaveValue('2026-10-20');
    await expect(page.locator('#bs-service')).toHaveValue('');
    await close();
    await page.screenshot({path:resolve(output,`${name}-month.png`),fullPage:width>=1024});
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
    await page.screenshot({path:resolve(output,`${name}-week-location.png`),fullPage:width>=1024});
    await close();
    await open('?view=month&existing');
    await page.getByRole('button',{name:/12:30 PM Test Customer/}).click();
    await expect(page.locator('#bs-service')).toHaveCount(0);
    await expect(page.getByText('Test Customer',{exact:true}).first()).toBeVisible();
    await open('');
    const openReception=page.getByRole('button',{name:'Open reception panel',exact:true}).filter({visible:true}).first();
    await openReception.click();
    await page.locator('#qa_customer').selectOption('cust');
    await expect(page.locator('#qa_service')).toHaveValue('svc');
    await page.getByRole('button',{name:'Available time',exact:true}).click();
    await page.getByRole('listbox',{name:'Available time'}).getByRole('option').first().click();
    await page.getByRole('button',{name:'Add new',exact:true}).click();
    await page.getByLabel('First name',{exact:true}).fill('Synthetic');
    await page.getByLabel('Notes',{exact:true}).fill('Retained local draft');
    await page.locator('#qa_new_notes').evaluate(node=>{window.__notesNode=node});
    await page.getByRole('button',{name:'Close reception panel',exact:true}).click();
    await expect(page.getByTestId('reception-flex-slot')).toBeHidden();
    await expect(page.getByTestId('reception-flex-slot')).toHaveAttribute('inert','');
    await expect(openReception).toBeFocused();
    await page.locator('#qa_new_notes').evaluate(node=>node.focus());
    await expect(openReception).toBeFocused(); // Hidden descendants cannot take focus.
    await page.keyboard.press('Tab');
    expect(await page.getByTestId('reception-flex-slot').evaluate(node=>node.contains(document.activeElement))).toBe(false);
    await openReception.click();
    await expect(page.getByLabel('Notes',{exact:true})).toHaveValue('Retained local draft');
    expect(await page.locator('#qa_new_notes').evaluate(node=>window.__notesNode===node)).toBe(true);
    await expect(page.getByLabel('First name',{exact:true})).toHaveValue('Synthetic');
    await expect(page.locator('#qa_service')).toHaveValue('svc');
    await expect(page.locator('[name="customer_id"]')).toHaveValue('cust');
    await expect(page.locator('[name="start_time"]')).toHaveValue('2026-10-20T16:30:00.000Z');
    await page.screenshot({path:resolve(output,`${name}-reception-retained.png`),fullPage:width>=1024});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
    results.push({name,width,height,pointer,errors,writes,receptionDraft:'PASS',hiddenFocus:'PASS',monthKeyboard:'PASS',monthTouch:width<1024?'PASS':'NOT APPLICABLE'});
    expect(errors).toEqual([]); expect(results.at(-1).writes).toEqual([]);
    await context.close();
  }
  await writeFile(resolve(output,'results.json'),JSON.stringify(results,null,2));
  console.log(JSON.stringify({result:'PASS',output,results},null,2));
} finally { await browser.close(); await server.close(); }
