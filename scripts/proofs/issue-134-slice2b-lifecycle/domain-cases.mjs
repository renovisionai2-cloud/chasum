import {randomUUID} from 'node:crypto';

export async function runDomain({ctx:c,summary,log}) {
 const {ids,q,role,rpc,one,create,h,state,schedule,commit,vclose,assert,record,moneyDigest}=c;
 const packaged=await create({packageId:randomUUID(),resources:[ids.resource,ids.newResource]});
 assert(state(packaged).notes?.startsWith('Package: Synthetic bundle'),'package admitted note');
 assert(one(`select count(*)::int n from public.appointment_resources where appointment_id=${q(packaged.app)}`,'package-resources').n===2,'package resource set');
 let d=moneyDigest();const refused=schedule(packaged,{cmd:'SERVICE_CORRECTION',service:ids.replacementService});assert(refused.outcome==='FINANCIAL_REVIEW_REQUIRED'&&moneyDigest()===d,'package correction');record('D01 package original tuple / exact two resources / correction holds',{appointment:packaged.app});
 const pending=await create({status:'pending'});const confirmed=rpc('transition_booking_appointment_v2',h(pending).concat(q('confirmed'),'false'),'confirm-pending');assert(confirmed.outcome==='APPLIED','pending confirm');pending.revision++;
 role(`update public.businesses set appointment_status_workflow='["confirmed","completed","no_show"]'::jsonb where id=${q(ids.business)};`,'configured-workflow');
 const complete=rpc('transition_booking_appointment_v2',h(pending).concat(q('completed'),'false'),'configured-skip');assert(complete.outcome==='APPLIED','configured skip');pending.revision++;
 for(const status of ['scheduled','cancelled'])assert(rpc('transition_booking_appointment_v2',h(pending).concat(q(status),'true'),'invalid-status').outcome==='CONFLICT','status misuse');
 role(`update public.businesses set appointment_status_workflow=null where id=${q(ids.business)};`,'restore-workflow');
 const past=await create({past:true});d=moneyDigest();
 role(`update public.services set is_active=false where id=${q(ids.service)};update public.staff set is_active=false where id=${q(ids.staff)};`,'retire-for-history');
 assert(rpc('revise_booking_notes_v2',h(past).concat(q('Historical note')),'past-notes').outcome==='APPLIED','past notes validator');past.revision++;
 assert(rpc('transition_booking_appointment_v2',h(past).concat(q('completed'),'false'),'past-status').outcome==='APPLIED','past status validator');past.revision++;
 role(`update public.services set is_active=true where id=${q(ids.service)};update public.staff set is_active=true where id=${q(ids.staff)};`,'restore-history-catalog');
 assert(moneyDigest()===d,'historical edit repriced');record('D02 pending / configured skip / past inactive-catalog maintenance',{before:d,after:moneyDigest()});summary.cases.D02='PASS';
 const paid=await create({payment:true});const payment=commit(paid);assert(payment.recorded,'paid fixture');d=moneyDigest();
 const close=rpc('close_booking_operation_v1',[ids.business,paid.op,ids.owner,'APPOINTMENT_CANCELLED',null,null,true].map(q),'paid-v1-cancel');assert(close.outcome==='CLOSED'&&close.recorded,'paid cancel recorded truth');
 const tx=one(`select id,customer_id,amount_cents from public.commerce_transactions where payment_attempt_id=${q(paid.attempt)}`,'paid-retained');assert(tx.id===payment.transaction_id&&tx.customer_id===ids.customer&&tx.amount_cents===500,'paid cancellation rewrote money');record('D03/D12 paid v1 cancellation retained ledger',{close,transaction:tx});
 // Cross-axis foreign refund: existing schema permits it, customer correction must see it.
 const clean=await create(),foreignCustomer=randomUUID(),refund=randomUUID();
 role(`insert into public.customers(id,business_id,name,email) values(${q(foreignCustomer)},${q(ids.other)},'Synthetic foreign customer','foreign@local.invalid');
 insert into public.commerce_refunds(id,business_id,customer_id,transaction_id,appointment_id,amount_cents,currency,reason,status) values(${[refund,ids.other,foreignCustomer,payment.transaction_id,clean.app,1,'cad','Synthetic foreign contradiction','failed'].map(q).join(',')});`,'foreign-refund-witness');
 d=moneyDigest();const denied=vclose(clean,'REASSIGN_CUSTOMER',ids.customer,ids.replacement);assert(denied.outcome==='FINANCIAL_REVIEW_REQUIRED'&&!JSON.stringify(denied).includes(refund)&&moneyDigest()===d,'foreign refund hidden or leaked');record('D06 foreign direct-refund contradiction veto',{result:denied,refund_witness:refund});
 // Protected duration/buffer validator remains the authority for desired schedule.
 const first=await create(),second=await create();role(`update public.services set buffer_after_minutes=15,cleanup_minutes=5 where id=${q(ids.service)};`,'buffer-config');
 const end=first.start,start=new Date(Date.parse(end)-1800000).toISOString();d=moneyDigest();const conflict=schedule(second,{start,end});assert(conflict.outcome==='CONFLICT'&&moneyDigest()===d,'buffer bypass');role(`update public.services set buffer_after_minutes=0,cleanup_minutes=0 where id=${q(ids.service)};`,'restore-buffers');record('D05 buffer/cleanup conflict',{conflict});
 // Explicit Toronto fall-back instant is never rounded or silently reinterpreted.
 const dst=await create();const now=new Date();let year=now.getUTCFullYear(),day=new Date(Date.UTC(year,10,1));day.setUTCDate(1+(7-day.getUTCDay())%7);if(day<now){year++;day=new Date(Date.UTC(year,10,1));day.setUTCDate(1+(7-day.getUTCDay())%7);}
 const date=day.toISOString().slice(0,10),dstStart=date+'T01:30:00-04:00',dstEnd=date+'T01:00:00-05:00';
 const moved=schedule(dst,{cmd:'REASSIGN_LOCATION',location:ids.location2,start:dstStart,end:dstEnd});assert(moved.outcome==='APPLIED','DST explicit interval');
 const times=one(`select start_time at time zone 'UTC' as utc_start,end_time-start_time as elapsed,extract(minute from start_time at time zone 'America/Toronto')::int as local_minute from public.appointments where id=${q(dst.app)}`,'DST-persisted');assert(times.local_minute===30&&times.elapsed==='00:30:00','DST/time integrity');record('D04 explicit DST interval / :30 integrity',{input_start:dstStart,input_end:dstEnd,times});
 const oversized=await create({apptNotes:'x'.repeat(10001)});const held=rpc('revise_booking_notes_v2',h(oversized).concat(q('replacement')),'oversized-existing-hold');assert(held.outcome==='UNKNOWN'&&held.recovery_required&&state(oversized).operational_revision===0,'oversized notes truncated');record('D05 oversized existing notes held',{});
 const room=randomUUID();role(`insert into public.booking_resources(id,business_id,location_id,resource_type,name) values(${[room,ids.business,ids.location,'room','Synthetic room'].map(q).join(',')});`,'room-fixture');
 const roomAp=await create();const roomResult=schedule(roomAp,{cmd:'RESOURCES',room});assert(roomResult.outcome==='APPLIED','room-only effect');record('D04 room-only lifecycle effect',{result:roomResult});
 const staleFence=await create();assert(vclose(staleFence).outcome==='APPLIED','cancel fixture');staleFence.revision++;
 role(`update public.commerce_booking_operations set close_reason='PRICING_CHANGED' where id=${q(staleFence.op)};`,'synthetic-stale-close-metadata');
 const unknown=vclose(staleFence);assert(unknown.outcome==='UNKNOWN'&&unknown.recovery_required&&state(staleFence).operational_revision===1,'stale close metadata authorized no-op');record('D03 stale cancellation fence is UNKNOWN/HOLD',{result:unknown});
 // Fresh obligations: PENDING, then an actual projector failure from contradictory refund evidence.
 c.run(`insert into public.commerce_projection_admission(business_id,enabled,admit_attempts_created_after) values(${q(ids.business)},true,clock_timestamp()) on conflict(business_id) do update set enabled=true,admit_attempts_created_after=excluded.admit_attempts_created_after;`,'D07-local-admission');
 const uncertain=await create({payment:true});const recorded=commit(uncertain);assert(recorded.recorded,'D07 original payment');
 d=moneyDigest();let note=rpc('revise_booking_notes_v2',h(uncertain).concat(q('Pending projection')),'pending-projection-notes');assert(note.outcome==='APPLIED'&&note.recovery_required&&moneyDigest()===d,'pending hold cleared');uncertain.revision++;
 role(`insert into public.commerce_refunds(business_id,customer_id,transaction_id,appointment_id,amount_cents,currency,reason,status) values(${[ids.business,ids.customer,recorded.transaction_id,uncertain.app,1,'cad','Synthetic uncertainty','failed'].map(q).join(',')});`,'uncertain-refund');
 const projection=JSON.parse(role(`select public.project_payment_obligation_v1(${[ids.business,uncertain.attempt,'appointment_cache'].map(q).join(',')});`,'D07-projector-failure').split('\n').find(x=>x.startsWith('{')));
 assert(projection.state==='FAILED','D07 actual failure not produced');d=moneyDigest();
 note=rpc('revise_booking_notes_v2',h(uncertain).concat(q('Keep financial HOLD')),'failed-projection-notes');assert(note.outcome==='APPLIED'&&note.recovery_required&&moneyDigest()===d,'failed projection reset');uncertain.revision++;
 for(const kind of ['invoice_settlement','customer_payment_events','receipt']){
  const result=JSON.parse(role(`select public.project_payment_obligation_v1(${[ids.business,uncertain.attempt,kind].map(q).join(',')});`,'D07-failed-'+kind).split('\n').find(x=>x.startsWith('{')));assert(result.state==='FAILED','D07 '+kind+' failure');
  const digest=moneyDigest();const saved=rpc('revise_booking_notes_v2',h(uncertain).concat(q('Held '+kind)),'D07-held-'+kind);assert(saved.outcome==='APPLIED'&&saved.recovery_required&&moneyDigest()===digest,'D07 '+kind+' reset');uncertain.revision++;record('D07 '+kind+' FAILED unchanged through maintenance',{result,saved});
 }
 c.run(`update public.commerce_projection_admission set enabled=false where business_id=${q(ids.business)};`,'D07-close-local-admission');record('D07 pending/failed projection state preserved',{projection,note});
 summary.cases.D07='PASS'; // Complete projection variants are exercised by C05.
 summary.cases.D01='PASS';
 log({kind:'domain-cases-complete',money_digest:moneyDigest()});
}
