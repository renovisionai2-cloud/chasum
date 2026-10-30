// Real CalendarPage, keyed ReceptionWorkspace, CalendarClient, CSS and canonical Sheet.
// Fixed clock; all data are synthetic. No submit, domain mutation or hosted request.
import { expect } from '@playwright/test';
import { resolve } from 'node:path';

export async function runDateRetentionValidation({browser,origin,output}) {
  const results=[];
  for(const [name,width,height] of [['desktop',1440,900],['laptop',1366,768],['tablet',834,1112],['mobile',390,844]]) {
    const context=await browser.newContext({viewport:{width,height},timezoneId:'America/Los_Angeles',hasTouch:width<1024,isMobile:width<1024});
    const writes=[],errors=[],externalRequests=[],transitions=[];
    await context.exposeFunction('__recordWriteAttempt',action=>writes.push(action));
    await context.route('**/*',route=>{
      if(new URL(route.request().url()).origin===origin) return route.continue();
      externalRequests.push(route.request().url());return route.abort();
    });
    const page=await context.newPage();
    page.setDefaultTimeout(10000);
    page.setDefaultNavigationTimeout(60000);
    page.on('pageerror',error=>errors.push(error.message));
    await page.clock.setFixedTime(new Date('2026-10-26T12:00:00Z'));
    const viewSelect=page.getByRole('combobox',{name:'Calendar view'});
    const jump=page.locator('#calendar-jump-date');
    const query=()=>page.evaluate(()=>window.__calls.filter(call=>call.name==='getAppointments').at(-1).args);
    async function assertDate(view,date) {
      await expect(viewSelect).toHaveValue(view);
      await expect(jump).toHaveValue(date);
      expect(new URL(page.url()).searchParams.get('date')).toBe(date);
      expect(new URL(page.url()).searchParams.get('view')).toBe(view);
    }
    async function transition(view,date,action) {
      const before=await page.evaluate(()=>{
        window.__dateRetentionInput=document.querySelector('#calendar-jump-date');
        return {search:location.search,queries:window.__calls.filter(call=>call.name==='getAppointments').length};
      });
      await action();
      await expect.poll(()=>page.evaluate(()=>window.__calls.filter(call=>call.name==='getAppointments').length)).toBeGreaterThan(before.queries);
      const expectedSearch=`?view=${view}&date=${date}`;
      if(before.search!==expectedSearch) await expect.poll(()=>page.evaluate(()=>document.querySelector('#calendar-jump-date')!==window.__dateRetentionInput)).toBe(true);
      await assertDate(view,date);
      const bounds=await query();
      transitions.push({view,date,query:bounds});
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      await expect(page.getByRole('button',{name:'Today',exact:true})).toBeVisible();
      await expect(viewSelect).toBeVisible();
      await expect(page.getByRole('dialog')).toHaveCount(0);
    }
    const switchTo=(view,date='2026-10-26')=>transition(view,date,()=>viewSelect.selectOption(view));
    async function pick(view,date) {
      const details=page.locator('details').filter({has:jump});
      if(await details.getAttribute('open')===null) await details.locator('summary').click();
      await transition(view,date,()=>jump.fill(date));
    }
    const today=view=>transition(view,'2026-10-26',()=>page.getByRole('button',{name:'Today',exact:true}).click());
    try {
      console.log(name+': date-retention fixture loading');
      await page.goto(origin+'/tests/unit/calendar/isolated-browser/index.html?view=day&date=2026-10-24',{waitUntil:'domcontentloaded'});
      await expect(viewSelect).toBeVisible({timeout:60000});
      await page.evaluate(()=>document.fonts.ready);
      expect(await page.evaluate(()=>document.fonts.check('12px Inter'))).toBe(true);
      await today('day');
      await page.evaluate(async()=>{await document.fonts.ready;await Promise.all(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));});
      const initialPosition=await page.locator('[aria-label="Calendar controls"]').evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY};});
      for(let round=0;round<3;round++) {
        await switchTo('week');
        await expect(page.getByRole('heading',{name:'Oct 25 – Oct 31, 2026',exact:true})).toBeVisible();
        expect(await query()).toEqual(['2026-10-25T04:00:00.000Z','2026-11-08T04:59:59.999Z']);
        if(round===0) await page.screenshot({animations:'disabled',path:resolve(output,`${name}-week.png`)});
        await switchTo('day');
        await expect(page.getByRole('heading',{name:'Monday, Oct 26',exact:true})).toBeVisible();
        expect(await query()).toEqual(['2026-10-26T04:00:00.000Z','2026-10-27T03:59:59.999Z']);
      }
      for(const view of ['month','agenda']) {await switchTo(view);await switchTo('day');}
      for(const view of ['week','month','agenda']) {
        await switchTo(view);
        await pick(view,'2026-10-28');
        await today(view);
      }
      await switchTo('week');
      await transition('week','2026-11-02',()=>page.getByRole('button',{name:'Next',exact:true}).click());
      await transition('week','2026-10-26',()=>page.getByRole('button',{name:'Previous',exact:true}).click());
      await switchTo('month');
      await pick('month','2026-01-31');
      await transition('month','2026-02-28',()=>page.getByRole('button',{name:'Next',exact:true}).click());
      await transition('month','2026-01-28',()=>page.getByRole('button',{name:'Previous',exact:true}).click());
      await pick('month','2026-10-26');
      await transition('day','2026-10-28',()=>page.getByRole('button',{name:'Open October 28',exact:true}).click());
      await today('day');
      // A real document reload of a range-view deep link retains the anchor too.
      await switchTo('week');
      await page.reload({waitUntil:'domcontentloaded'});
      await expect(viewSelect).toBeVisible();await assertDate('week','2026-10-26');
      await switchTo('day');
      await page.evaluate(async()=>{await document.fonts.ready;await Promise.all(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));});
      const finalPosition=await page.locator('[aria-label="Calendar controls"]').evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY};});
      expect(finalPosition.x).toBeCloseTo(initialPosition.x,0);
      expect(finalPosition.y).toBeCloseTo(initialPosition.y,0);
      await page.screenshot({animations:'disabled',path:resolve(output,`${name}-day-closed.png`)});
      await expect(page.locator('summary').filter({hasText:'Morning brief'})).toContainText('Payment information not verified');

      // Filters remain within the same Calendar session when opening/closing Sheet.
      await page.locator('summary').filter({hasText:'Filters'}).click();
      await page.getByRole('checkbox',{name:'Follow-up session',exact:true}).uncheck();
      await page.getByRole('combobox',{name:'Staff',exact:true}).selectOption('staff');
      await page.locator('summary').filter({hasText:'Filters'}).click();
      if(width<768) await page.getByRole('button',{name:'Add appointment on October 26, 2026',exact:true}).click();
      else {
        const slot=page.locator('[data-staff-column="staff"] button').nth(5);
        const box=await slot.boundingBox();await slot.click({position:{x:box.width/2,y:box.height/2+1}});
      }
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.locator('[name="date"]')).toHaveValue('2026-10-26');
      await expect(page.locator('[name="start_time"]')).toHaveValue(width<768?'':'2026-10-26T16:30:00.000Z');
      await expect(page.locator('[name="staff_id"]')).toHaveValue(width<768?'':'staff');
      await expect(page.locator('#bs-location')).toHaveValue('loc');
      await expect(page.locator('#bs-service')).toHaveValue('');
      await page.screenshot({animations:'disabled',path:resolve(output,`${name}-day-open.png`)});
      await page.locator('#bs-notes').pressSequentially('Local continuous typing');
      await expect(page.locator('#bs-notes')).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await assertDate('day','2026-10-26');
      await page.locator('summary').filter({hasText:'Filters'}).click();
      await expect(page.getByRole('checkbox',{name:'Follow-up session',exact:true})).not.toBeChecked();
      await expect(page.getByRole('combobox',{name:'Staff',exact:true})).toHaveValue('staff');
      await page.locator('summary').filter({hasText:'Filters'}).click();
      // Preserve (and disclose) existing key-remount behavior: filters reset on
      // changing views. Persistence across keys would be a separate app change.
      await switchTo('week');
      await page.locator('summary').filter({hasText:'Filters'}).click();
      await expect(page.getByRole('checkbox',{name:'Follow-up session',exact:true})).toBeChecked();
      await expect(page.getByRole('combobox',{name:'Staff',exact:true})).toHaveValue('');
      await page.locator('summary').filter({hasText:'Filters'}).click();

      // Canonical Location UI changes only the in-memory fixture preference.
      if(width<640) {
        await page.getByRole('button',{name:/^Workspace location:/}).click();
        await page.getByRole('dialog',{name:'Workspace location',exact:true}).getByRole('button',{name:'South Studio',exact:true}).click();
        await expect(page.getByRole('button',{name:'Workspace location: South Studio',exact:true})).toBeVisible();
      } else {
        await page.getByRole('combobox',{name:'Switch location',exact:true}).selectOption('loc2');
        await expect(page.getByRole('combobox',{name:'Switch location',exact:true})).toHaveValue('loc2');
      }
      await switchTo('month');await switchTo('day');
      await page.getByRole('button',{name:'New appointment',exact:true}).click();
      await expect(page.locator('#bs-location')).toHaveValue('loc2');
      await expect(page.locator('[name="date"]')).toHaveValue('2026-10-26');
      await page.getByRole('dialog').locator('button[aria-label="Close"]').click();
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await assertDate('day','2026-10-26');
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      expect(writes).toEqual([]);expect(errors).toEqual([]);expect(externalRequests).toEqual([]);
      const calledActions=await page.evaluate(()=>[...new Set(window.__calls.map(call=>call.name))]);
      expect(calledActions.some(name=>/^(create|update|cancel|reschedule|resize|record|collect|send|duplicate|undo)/i.test(name))).toBe(false);
      results.push({name,width,height,browserTimezone:'America/Los_Angeles',operationalTimezone:'America/Toronto',transitions,errors,writes,externalRequests,calledActions,bodyOverflow:false,filterSessionPreserved:true,filterAcrossViewRemount:'existing reset preserved'});
      console.log(name+': date-retention passed');
    } finally {await context.close();}
  }
  return results;
}
