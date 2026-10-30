// Issue #135: actual Calendar/Sheet and native form events, synthetic actions only.
import { expect } from '@playwright/test';
import { resolve } from 'node:path';

export async function runSubmitValidation({browser,origin,output}) {
  const results=[];
  for(const [name,width,height] of [['desktop',1366,768],['tablet-touch',834,1112]]) {
    const context=await browser.newContext({viewport:{width,height},timezoneId:'America/Los_Angeles',hasTouch:width<1024,isMobile:width<1024});
    const writes=[],errors=[],externalRequests=[];
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
    try {
      console.log(name+': loading local fixture');
      await page.goto(origin+'/tests/unit/calendar/isolated-browser/index.html',{waitUntil:'domcontentloaded'});
      await expect(page.getByRole('button',{name:'New appointment',exact:true})).toBeVisible({timeout:60000});
      console.log(name+': fixture ready');
      await page.evaluate(()=>{
        window.__syntheticCreates=[];
        window.__fixtureActions.createAppointment=(_prev,fd)=>{
          window.__syntheticCreates.push(Object.fromEntries(fd));
          return new Promise(resolve=>{window.__finishCreate=resolve;});
        };
        window.__fixtureActions.previewBookingSheetAvailability=()=>new Promise(resolve=>{window.__finishAvailability=()=>resolve({slots:[{start:'2026-10-26T16:30:00.000Z',end:'2026-10-26T17:00:00.000Z'}],alternativeStaff:[],alternativeDays:[]});});
      });
      const count=()=>page.evaluate(()=>window.__syntheticCreates.length);
      const drain=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      const openSlot=async()=>{
        const slot=page.locator('[data-staff-column="staff"] button').nth(5);
        const box=await slot.boundingBox();await slot.click({position:{x:box.width/2,y:box.height/2+1}});
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.locator('#bs-service')).toHaveValue('');
        await expect(page.locator('[name="date"]')).toHaveValue('2026-10-26');
        await expect(page.locator('[name="start_time"]')).toHaveValue('2026-10-26T16:30:00.000Z');
        await expect(page.locator('[name="staff_id"]')).toHaveValue('staff');
        await expect(page.locator('#bs-location')).toHaveValue('loc');
      };
      const fillEligible=async()=>{
        await page.getByRole('combobox',{name:'Search customers'}).fill('Test Customer');
        await expect(page.getByRole('option',{name:/Test Customer/})).toBeVisible();
        await page.getByRole('combobox',{name:'Search customers'}).press('Enter');
        await page.locator('#bs-service').selectOption('svc');
        await expect.poll(()=>page.evaluate(()=>typeof window.__finishAvailability)).toBe('function');
      };
      await openSlot();
      console.log(name+': Calendar slot opened');
      const form=page.getByRole('dialog').locator('form').filter({has:page.locator('[name="start_time"]')});
      await form.evaluate(el=>el.requestSubmit()); // No service/customer: must not claim.
      expect(await count()).toBe(0);
      await fillEligible();
      console.log(name+': explicit selection ready');
      await form.evaluate(el=>el.requestSubmit()); // Availability unresolved: still no claim.
      expect(await count()).toBe(0);
      await page.evaluate(()=>window.__finishAvailability());
      await expect(page.getByRole('button',{name:'Confirm appointment',exact:true})).toBeEnabled();
      await page.locator('#bs-notes').pressSequentially('Initial synthetic notes');
      await expect(page.locator('#bs-notes')).toBeFocused();
      await form.evaluate(el=>{el.requestSubmit();el.requestSubmit();});
      await expect(page.getByRole('button',{name:'Confirming…'})).toBeDisabled();
      expect(await count()).toBe(1);
      await form.evaluate(el=>el.requestSubmit());
      expect(await count()).toBe(1);
      await page.evaluate(()=>window.__finishCreate({error:'Correct the synthetic booking.'}));
      const submit=page.getByRole('button',{name:'Confirm appointment',exact:true});
      await expect(submit).toBeEnabled();await drain();
      expect(await count()).toBe(1); // No duplicate queued after deferred resolution.
      await page.locator('#bs-notes').fill('Corrected synthetic notes');
      await page.getByText('Record $50 deposit',{exact:true}).click();
      await page.getByLabel('Payment method',{exact:true}).selectOption('e_transfer');
      const retry=page.getByRole('button',{name:/Confirm and record/});
      // Native keyboard activation emits a click; also requestSubmit in that same
      // click event before the default form submission. The real guard must win.
      await retry.evaluate(el=>el.addEventListener('click',()=>el.form.requestSubmit(),{once:true}));
      await retry.focus();await page.keyboard.press('Enter');
      await expect(page.getByRole('button',{name:'Confirming…'})).toBeDisabled();
      expect(await count()).toBe(2);
      const corrected=await page.evaluate(()=>window.__syntheticCreates[1]);
      expect(corrected).toMatchObject({customer_id:'cust',service_id:'svc',staff_id:'staff',location_id:'loc',start_time:'2026-10-26T16:30:00.000Z',notes:'Corrected synthetic notes',payment_mode:'deposit',payment_amount_cents:'5000',payment_method:'e_transfer'});
      await page.evaluate(()=>window.__finishCreate({appointmentId:'synthetic-135-created',success:'Appointment confirmed — payment needs attention.',payment:{status:'failed',transactionId:null,canRetry:true,amountCents:5000,method:'e_transfer',methodLabel:'E-Transfer',detail:'Synthetic failure; no transaction created.'}}));
      await expect(page.getByRole('button',{name:'Appointment booked'})).toBeDisabled();
      await expect(page.getByRole('alert')).toContainText('synthetic-135-created');
      await form.evaluate(el=>{el.requestSubmit();el.requestSubmit();});await drain();
      expect(await count()).toBe(2);
      await page.screenshot({animations:'disabled',path:resolve(output,`issue135-${name}-locked.png`)});
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(page.getByRole('heading',{name:'Monday, Oct 26',exact:true})).toBeVisible();
      await expect(page.getByRole('combobox',{name:'Calendar view'})).toHaveValue('day');
      await expect(page.getByRole('combobox',{name:'Switch location',exact:true})).toHaveValue('loc');
      await page.evaluate(()=>{delete window.__finishAvailability;});
      await openSlot();await fillEligible();await page.evaluate(()=>window.__finishAvailability());
      const nextSubmit=page.getByRole('button',{name:'Confirm appointment',exact:true});
      await expect(nextSubmit).toBeEnabled();await nextSubmit.click();
      await expect.poll(count).toBe(3);
      await page.evaluate(()=>window.__finishCreate({appointmentId:'synthetic-135-new-session',success:'Appointment confirmed.',payment:{status:'skipped'}}));
      await expect(page.getByRole('dialog')).toHaveCount(0);await drain();
      expect(await count()).toBe(3);
      expect(errors).toEqual([]);expect(writes).toEqual([]);expect(externalRequests).toEqual([]);
      results.push({name,width,height,syntheticCreateCalls:3,correctedFormData:corrected,errors,unapprovedWrites:writes,externalRequests});
    } finally {await context.close();}
  }
  return results;
}
