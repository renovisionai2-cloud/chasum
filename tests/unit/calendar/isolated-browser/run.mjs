// node tests/unit/calendar/isolated-browser/run.mjs [evidence-directory] [after|r1-after]
// Real Calendar, Reception, Booking Sheet and CSS; deterministic in-memory server boundaries.
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import ts from 'typescript';
import { chromium, expect } from '@playwright/test';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { runDenseValidation } from './dense.mjs';
const root = process.cwd();
const output = resolve(process.argv[2] || '/private/tmp/chasum-reception-isolated-evidence');
await mkdir(output, { recursive: true });
// Reuse the exact app/layout.tsx fonts from a successful local Next build.
// The baseline can point at the same build because layout/font sources are unchanged.
const fontBuild = process.env.CHASUM_STAGE1_FONT_BUILD || resolve(root,'.next/static');
const cssFiles=(await readdir(resolve(fontBuild,'chunks'),{recursive:true})).filter(f=>f.endsWith('.css'));
const fontRules=[];
for(const file of cssFiles){
  const css=await readFile(resolve(fontBuild,'chunks',file),'utf8');
  fontRules.push(...(css.match(/@font-face\{[^}]*\}/g)||[]).filter(rule=>/font-family:(Inter|JetBrains)/.test(rule)));
}
if(!fontRules.length) throw new Error('Run npm run build first: actual application fonts are required');
const fontCss=fontRules.join('\n').replaceAll('../media/','/__stage1_fonts/media/')+'\n:root{--font-geist-sans:Inter,system-ui,sans-serif;--font-geist-mono:"JetBrains Mono",monospace}';
const actionRuntime = `
const call = async (name, args) => {
  window.__calls ||= []; window.__calls.push({ name, args });
  if (window.__fixtureActions?.[name]) return window.__fixtureActions[name](...args);
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
    configureServer(server){
      server.middlewares.use(async(req,res,next)=>{
        if(req.url==='/__stage1_fonts/font.css'){res.setHeader('Content-Type','text/css');res.end(fontCss);return;}
        const match=req.url?.match(/^\/__stage1_fonts\/media\/([a-zA-Z0-9._-]+\.woff2)$/);
        if(match){res.setHeader('Content-Type','font/woff2');res.end(await readFile(resolve(fontBuild,'media',match[1])));return;}
        next();
      });
    },
    resolveId(id) {
      if (id.startsWith(root + "/")) id = "@/" + id.slice(root.length + 1);
      if (id.startsWith('@/lib/actions/')) return '\0cal01:' + id;
      if (['next/navigation', 'next/link', 'next/image', '@/providers/toast-provider'].includes(id)) return '\0cal01:' + id;
      if (id.includes('supabase') || id === 'server-only') throw new Error('Hosted module forbidden in fixture: ' + id);
    },
    async load(id) {
      if (!id.startsWith('\0cal01:')) return;
      const original = id.slice(7);
      if (original === 'next/navigation') return `const navigate=url=>{window.__navigation=url;const next=new URL(url,location.origin);history.replaceState(null,'','/tests/unit/calendar/isolated-browser/index.html'+next.search);window.__render?.()};export const useRouter = () => ({refresh(){window.__render?.()},push:navigate,replace:navigate}); export const usePathname=()=>'/dashboard/calendar'; export const useSearchParams=()=>new URLSearchParams(location.search);`;
      if (original === 'next/image') return `import React from 'react'; export default function Image({fill,priority,unoptimized,...props}) {return React.createElement('img',props)}`;
      if (original === 'next/link') return `import React from 'react'; export default function Link({children,...props}) {return React.createElement('a',props,children)}`;
      if (original === '@/providers/toast-provider') return `export const useToast=()=>({toast(){}});`;
      const file = await readFile(resolve(root, original.replace('@/', '') + '.ts'), 'utf8');
      const ast = ts.createSourceFile(original, file, ts.ScriptTarget.Latest, true);
      const names = ast.statements.flatMap(s => {
        if (ts.isExportDeclaration(s) && s.exportClause && ts.isNamedExports(s.exportClause)) return s.exportClause.elements.filter(e=>!e.isTypeOnly).map(e=>e.name.text);
        if (!s.modifiers?.some(m=>m.kind===ts.SyntaxKind.ExportKeyword)) return [];
        if (ts.isFunctionDeclaration(s)) return [s.name.text];
        if (ts.isVariableStatement(s)) return s.declarationList.declarations.map(d=>d.name.text);
        return [];
      });
      return actionRuntime + names.map(n => `export const ${n}=(...args)=>call('${n}',args);`).join('\n');
    },
  }, react()], resolve: { alias: { '@': root } }, server: { host: '127.0.0.1', port: 0, watch: { ignored: ['**/.next/**'] } },
});
await server.listen();
const address = server.httpServer.address();
const origin = `http://127.0.0.1:${address.port}`;
const browser = await chromium.launch({ headless: true });
const requestedPhase = process.argv[3] || 'after';
const correction = requestedPhase.startsWith('r1');
const phase = correction ? 'after' : requestedPhase;
const results = [];
try {
  if (requestedPhase === 'issue135') {
    const { runSubmitValidation } = await import('./submit.mjs');
    results.push(...await runSubmitValidation({browser,origin,output}));
  }
  if (correction) await runDenseValidation({browser,origin,output,before:requestedPhase === 'r1-before'});
  for (const [name,width,height] of ['r1-before','issue135'].includes(requestedPhase) ? [] : [['desktop',1440,900],['laptop',1366,768],['tablet',834,1112],['iphone',390,844]]) {
    const context=await browser.newContext({viewport:{width,height},timezoneId:'America/Los_Angeles',hasTouch:width<1024,isMobile:width<1024});
    const writes=[], errors=[];
    await context.exposeFunction('__recordWriteAttempt',name=>writes.push(name));
    await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
    const page=await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));
    await page.clock.setFixedTime(new Date('2026-10-26T12:00:00Z'));
    await page.goto(origin+'/tests/unit/calendar/isolated-browser/index.html');
    await expect(page.getByRole('button',{name:phase==='before' && width<640?'New':'New appointment',exact:true})).toBeVisible();
    await page.evaluate(async()=>{await document.fonts.ready});
    expect(await page.evaluate(()=>document.fonts.check('12px Inter'))).toBe(true);
    await page.waitForTimeout(300);
    if (!correction) await page.screenshot({animations:"disabled",path:resolve(output,`${phase}-${name}-closed.png`)});
    if(width<768) await page.getByRole('button',{name:phase==='before'?'New':'New appointment',exact:true}).click();
    else {
      const slot=page.locator('[data-staff-column="staff"] button').nth(5);
      const box=await slot.boundingBox(); await slot.click({position:{x:box.width/2,y:box.height/2+1}});
    }
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('#bs-service')).toHaveValue('');
    await expect(page.locator('[name="date"]')).toHaveValue('2026-10-26');
    await expect(page.locator('[name="start_time"]')).toHaveValue(width<768?'':'2026-10-26T16:30:00.000Z');
    if (!correction) await page.screenshot({animations:"disabled",path:resolve(output,`${phase}-${name}-open.png`)});
    if (phase === 'after') {
      const dialog=page.getByRole('dialog');
      await expect(page.locator('body')).toHaveCSS('overflow','hidden');
      await page.locator('#bs-notes').fill('Continuous notes');
      await page.locator('#bs-notes').press('ArrowLeft');
      await page.locator('#bs-notes').pressSequentially('X');
      await expect(page.locator('#bs-notes')).toBeFocused();
      await expect(page.locator('#bs-notes')).toHaveValue('Continuous noteXs');
      if(width>=768) {
        await expect(dialog).toHaveCSS('width','600px');
        await dialog.getByRole('button',{name:'Wide',exact:true}).click();
        expect((await dialog.boundingBox()).width).toBeCloseTo(Math.min(820,Math.floor(width*.78)),0);
        await dialog.getByRole('button',{name:'Standard',exact:true}).click();
      }
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(page.locator('body')).not.toHaveCSS('overflow','hidden');
      await expect(page.getByRole('combobox',{name:'Calendar view'})).toHaveValue('day');
      await expect(page.getByRole('heading',{name:'Monday, Oct 26',exact:true})).toBeVisible();

      const brief=page.locator('details').filter({has:page.locator('section[aria-label="Morning brief"]')});
      await expect(brief).not.toHaveAttribute('open');
      await expect(brief.locator('summary')).toContainText('Payment information not verified');
      await expect(brief).not.toContainText(/987654|8765|7654|6543|UNVERIFIED_FINANCIAL_SENTINEL|EXACT|HELD|UNKNOWN/);
      await brief.locator('summary').click();
      await expect(brief).toHaveAttribute('open');
      await expect(brief.getByText('2 bookings · 1 reschedules · 4 confirmations')).toBeVisible();
      await expect(brief.getByText('Review today’s appointments and availability.')).toBeVisible();
      await expect(brief.getByText('Payment information not verified',{exact:true})).toBeVisible();
      await brief.scrollIntoViewIfNeeded();
      await page.screenshot({animations:'disabled',path:resolve(output,`after-${name}-brief-expanded.png`)});
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      await brief.locator('summary').focus();
      await page.keyboard.press('Enter');
      await expect(brief).not.toHaveAttribute('open');

      // Real view/date handlers, locally simulated server refresh.
      for(const view of ['week','month','agenda','timeline','employees','locations','resource','day']) {
        await page.getByRole('combobox',{name:'Calendar view'}).selectOption(view);
        await expect(page.getByRole('combobox',{name:'Calendar view'})).toHaveValue(view);
      }
      // Existing navigation normalizes month/week to their range start. Restore
      // the chosen civil date explicitly before checking day-by-day navigation.
      await page.locator('details').filter({has:page.locator('#calendar-jump-date')}).locator('summary').click();
      await page.locator('#calendar-jump-date').fill('2026-10-26');
      await expect(page.getByRole('heading',{name:'Monday, Oct 26',exact:true})).toBeVisible();
      await page.getByRole('button',{name:'Next',exact:true}).click();
      await expect(page.getByRole('heading',{name:'Tuesday, Oct 27',exact:true})).toBeVisible();
      await page.getByRole('button',{name:'Previous',exact:true}).click();
      await expect(page.getByRole('heading',{name:'Monday, Oct 26',exact:true})).toBeVisible();

      // Filter only the visible schedule; reset and inspect existing appointment.
      await page.locator('summary').filter({hasText:'Filters'}).click();
      await page.getByRole('checkbox',{name:'Consultation',exact:true}).uncheck();
      await expect(page.getByText('Calendar filtered',{exact:false})).toBeVisible();
      await expect(page.getByRole('button',{name:/Sofia Bennett/})).toHaveCount(0);
      await page.getByRole('button',{name:'Reset filters',exact:true}).click();
      await page.getByRole('combobox',{name:'Staff',exact:true}).selectOption('staff1');
      await expect(page.getByRole('button',{name:/Sofia Bennett/})).toHaveCount(0);
      await page.getByRole('button',{name:'Reset filters',exact:true}).click();
      await page.getByRole('button',{name:'By staff',exact:true}).click();
      await page.keyboard.press('Escape');
      await page.getByRole('button',{name:/Sofia Bennett/}).click();
      await expect(page.locator('#bs-service')).toHaveCount(0);
      await expect(page.getByText('Sofia Bennett',{exact:true}).first()).toBeVisible();
      await page.keyboard.press('Escape');

      // Canonical Location switch UI, named -> ALL -> another named -> original.
      const changeScope=async(value,label)=>{
        if(width<640){
          await page.getByRole('button',{name:/^Workspace location:/}).click();
          await page.getByRole('dialog',{name:'Workspace location',exact:true}).getByRole('button',{name:label,exact:true}).click();
          await expect(page.getByRole('button',{name:'Workspace location: '+label,exact:true})).toBeVisible();
        } else {
          await page.getByRole('combobox',{name:'Switch location',exact:true}).selectOption(value);
          await expect(page.getByRole('combobox',{name:'Switch location',exact:true})).toHaveValue(value);
        }
      };
      await changeScope('ALL','All locations');
      await page.getByRole('button',{name:'New appointment',exact:true}).click();
      await expect(page.locator('#bs-location')).toHaveValue('');
      await expect(page.locator('[name="start_time"]')).toHaveValue('');
      await page.locator('#bs-location').selectOption('loc2');
      await expect(page.locator('#bs-service')).toHaveValue('');
      await page.keyboard.press('Escape');
      await changeScope('loc2','South Studio');
      await page.getByRole('button',{name:'New appointment',exact:true}).click();
      await expect(page.locator('#bs-location')).toHaveValue('loc2');
      await page.keyboard.press('Escape');
      await changeScope('loc','North Studio');

      const opener=page.getByRole('button',{name:'Open reception panel',exact:true}).filter({visible:true}).first();
      await opener.click();
      await page.getByRole('button',{name:'Close reception panel',exact:true}).click();
      await expect(opener).toBeFocused();
      await expect(page.getByTestId('reception-flex-slot')).toHaveAttribute('inert','');

      if(width<640) for(const label of ['Centre','Reception','Customers','Payments','More']) await expect(page.getByRole('navigation').last().getByText(label,{exact:true})).toBeVisible();
      await page.evaluate(()=>scrollTo(0,0));
      await page.getByRole('button',{name:'Switch to dark mode'}).click();
      if (!correction) await page.screenshot({animations:'disabled',path:resolve(output,`after-${name}-dark.png`)});
      await page.getByRole('button',{name:'Switch to light mode'}).click();
      if(width>=768) {
        const grid=page.getByRole('region',{name:/^Day view/});
        await grid.evaluate(el=>{el.scrollTo({top:80,left:0,behavior:'instant'})});
        if (!correction) await grid.screenshot({animations:'disabled',path:resolve(output,`after-${name}-cards.png`)});
        const headings=page.locator('[data-staff-column] > div:first-child');
        const initial=(await headings.first().boundingBox()).y;
        await grid.evaluate(el=>{el.scrollTo({top:el.scrollTop+100,left:el.scrollWidth,behavior:'instant'})});
        expect((await headings.first().boundingBox()).y).toBeCloseTo(initial,0);
        await page.getByRole('button',{name:/Nina|Lily Peterson/}).first().scrollIntoViewIfNeeded();
        // A long card must not shrink on hover, and expansion must not mask a resize preview.
        // Only the synthetic in-memory read fixture changes; never submit the resize.
        await page.evaluate(async()=>{
          const appointment=window.__fixtureActions.getAppointments()[0];
          appointment.end_time=new Date(Date.parse(appointment.start_time)+120*60000).toISOString();
          await window.__render();
        });
        const longCard=page.getByRole('button',{name:/Sofia Bennett.*120 minutes/});
        await longCard.scrollIntoViewIfNeeded();
        await page.mouse.move(0,0);
        const restingHeight=(await longCard.boundingBox()).height;
        await longCard.hover();
        expect((await longCard.boundingBox()).height).toBeGreaterThanOrEqual(restingHeight-1);
        const handle=await longCard.getByRole('separator',{name:'Resize duration'}).boundingBox();
        await page.mouse.move(handle.x+handle.width/2,handle.y+handle.height/2);
        await page.mouse.down();
        await page.mouse.move(handle.x+handle.width/2,handle.y+handle.height/2+40);
        await expect(longCard).toHaveAttribute('data-interacting','true');
        const geometry=await longCard.evaluate(el=>({
          actual:el.getBoundingClientRect().height,
          expected:parseFloat(el.style.height)/100*el.parentElement.clientHeight,
        }));
        expect(Math.abs(geometry.actual-geometry.expected)).toBeLessThan(1);
      }
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    }
    results.push({name,width,height,errors,writes,bodyOverflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});
    expect(errors).toEqual([]);expect(writes).toEqual([]);
    await context.close();
  }
  await writeFile(resolve(output,`${correction ? requestedPhase : phase}-results.json`),JSON.stringify(results,null,2));
  console.log(JSON.stringify({phase,output,results},null,2));
} finally {await browser.close();await server.close();}
