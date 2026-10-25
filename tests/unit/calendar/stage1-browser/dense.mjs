import { expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export async function runDenseValidation({browser,origin,output,before}) {
  const results=[];
  const devices=before ? [['tablet',834,1112,true]] : [['laptop',1366,768,false],['tablet',834,1112,true]];
  for (const [name,width,height,touch] of devices) {
    const context=await browser.newContext({viewport:{width,height},timezoneId:'America/Los_Angeles',hasTouch:touch,isMobile:touch});
    const errors=[],writes=[];
    await context.exposeFunction('__recordWriteAttempt',name=>writes.push(name));
    await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
    const page=await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));
    await page.clock.setFixedTime(new Date('2026-10-26T12:00:00Z'));
    await page.goto(origin+'/tests/unit/calendar/stage1-browser/index.html?fixture=dense');
    const grid=page.getByRole('region',{name:/^Day view/});
    await expect(grid).toBeVisible();
    await page.evaluate(async()=>{await document.fonts.ready});
    await expect(grid.locator('[data-staff-column]')).toHaveCount(10);
    await grid.evaluate(el=>el.scrollTo({top:120,left:0,behavior:'instant'}));
    await page.mouse.move(0,0);
    const noHover=await page.evaluate(()=>matchMedia('(hover: none)').matches);
    expect(noHover).toBe(touch);
    const cases=[['Alexandria Montgomery-Wellington',true,true],['Payment Only',true,false],['Notes Only',false,true],['Both flags',true,true]];
    const cards=[];
    for (const [customer,due,notes] of cases) {
      const card=grid.getByRole('button',{name:new RegExp('^'+customer+',')});
      const evidence=await card.evaluate((el,{due,notes,before})=>{
        const rect=el.getBoundingClientRect();
        const clip=el.closest('[role="region"]').getBoundingClientRect();
        const indicators=before ? [...el.querySelectorAll('span')].filter(span=>['Due','Note'].includes(span.textContent.trim())) : [...el.querySelectorAll('[title="Payment due"],[title="Has notes"]')];
        return {name:el.getAttribute('aria-label'),title:el.title,height:rect.height,top:el.style.top,timeHeight:el.style.height,
          focused:el===document.activeElement,hovered:el.matches(':hover'),due,notes,
          restingText:[...el.querySelector(':scope > p').children].map(part=>({text:part.textContent,visible:part.getBoundingClientRect().bottom<=rect.bottom && part.getBoundingClientRect().right<=rect.right})),
          indicators:indicators.map(indicator=>{
            const r=indicator.getBoundingClientRect();
            const center=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
            return {label:indicator.title||indicator.textContent.trim(),
              visible:r.width>0 && r.height>0 && r.left>=rect.left && r.right<=rect.right && r.top>=rect.top && r.bottom<=rect.bottom && r.top>=clip.top && r.bottom<=clip.bottom && Boolean(center && indicator.contains(center))};
          })};
      },{due,notes,before});
      expect(evidence.focused).toBe(false);expect(evidence.hovered).toBe(false);
      expect(evidence.name).not.toContain('PRIVATE_SYNTHETIC');expect(evidence.title).not.toContain('PRIVATE_SYNTHETIC');
      if (before) {
        expect(evidence.name).not.toContain('Payment due');expect(evidence.name).not.toContain('Has notes');
        expect(evidence.indicators.some(indicator=>!indicator.visible)).toBe(true);
      } else {
        expect(evidence.name.includes('Payment due')).toBe(due);expect(evidence.title.includes('Payment due')).toBe(due);
        expect(evidence.name.includes('Has notes')).toBe(notes);expect(evidence.title.includes('Has notes')).toBe(notes);
        expect(evidence.indicators).toHaveLength(Number(due)+Number(notes));
        expect(evidence.indicators.every(indicator=>indicator.visible)).toBe(true);
        if(customer!=='Alexandria Montgomery-Wellington') expect(evidence.restingText.every(part=>part.visible)).toBe(true);
      }
      cards.push(evidence);
    }
    if (before) await page.screenshot({animations:'disabled',path:resolve(output,'r1-before-tablet-touch.png')});
    if (!before && touch) {
      await page.screenshot({animations:'disabled',path:resolve(output,'r1-tablet-touch-light.png')});
      await page.getByRole('button',{name:'Switch to dark mode'}).click();
      await page.screenshot({animations:'disabled',path:resolve(output,'r1-tablet-touch-dark.png')});
      for (const [customer,due,notes] of cases) {
        const card=grid.getByRole('button',{name:new RegExp('^'+customer+',')});
        if(due) await expect(card.getByTitle('Payment due')).toBeVisible();
        if(notes) await expect(card.getByTitle('Has notes')).toBeVisible();
      }
      await page.getByRole('button',{name:'Switch to light mode'}).click();
    }
    const dimensions=await grid.evaluate(el=>({clientWidth:el.clientWidth,scrollWidth:el.scrollWidth}));
    expect(dimensions.scrollWidth-dimensions.clientWidth).toBeGreaterThan(1200);
    const heading=grid.locator('[data-staff-column] > div:first-child').first();
    const rail=grid.locator('div.sticky.left-0[aria-hidden="true"]');
    const originalY=(await heading.boundingBox()).y, originalX=(await rail.boundingBox()).x;
    await grid.evaluate(el=>el.scrollTo({top:el.scrollTop+80,left:el.scrollWidth,behavior:'instant'}));
    const stickyStaff=Math.abs((await heading.boundingBox()).y-originalY)<1;
    const stickyTime=Math.abs((await rail.boundingBox()).x-originalX)<1;
    if(!before) {expect(stickyStaff).toBe(true);expect(stickyTime).toBe(true);}
    const scrollLeft=await grid.evaluate(el=>el.scrollLeft);
    expect(scrollLeft).toBeGreaterThan(1200);
    const lastHeading=await grid.locator('[data-staff-column="staff9"] > div:first-child').boundingBox();
    const viewport=await grid.boundingBox();
    expect(lastHeading.x+lastHeading.width).toBeLessThanOrEqual(viewport.x+viewport.width);
    const bodyOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    expect(bodyOverflow).toBe(false);
    if (!before && !touch) await page.screenshot({animations:'disabled',path:resolve(output,'r1-laptop-scrolled.png')});
    if (!before) {
      await grid.evaluate(el=>el.scrollTo({top:120,left:0,behavior:'instant'}));
      for (const customer of ['Alexandria Montgomery-Wellington','Overlapping Customer']) {
        const card=grid.getByRole('button',{name:new RegExp('^'+customer+',')});
        if(touch) await card.tap({position:{x:8,y:5}});
        else {await card.focus();await page.keyboard.press('Enter');}
        await expect(page.getByRole('dialog').getByText(customer,{exact:true}).first()).toBeVisible();
        await expect(page.locator('#bs-service')).toHaveCount(0);
        await page.keyboard.press('Escape');
      }
    }
    expect(errors).toEqual([]);expect(writes).toEqual([]);
    results.push({name,width,height,touch,noHover,staff:10,appointments:31,cards,dimensions,scrollLeft,bodyOverflow,stickyStaff,stickyTime,overlapOpening:before?'NOT RUN':'PASS',errors,writes});
    await context.close();
  }
  await writeFile(resolve(output,before?'r1-dense-before.json':'r1-dense-after.json'),JSON.stringify(results,null,2)+'\n');
  console.log(JSON.stringify({dense:results},null,2));
}
