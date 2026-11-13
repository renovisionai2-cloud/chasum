import {randomUUID} from 'node:crypto';

export async function runFinal({ctx:c,summary,log}) {
 const {ids,q,run,role,rpc,one,create,h,state,schedule,vclose,assert,record,moneyDigest}=c;
 const digest=a=>one(`select md5(jsonb_build_object('a',(select to_jsonb(x) from public.appointments x where id=${q(a.app)}),'j',(select coalesce(jsonb_agg(to_jsonb(x) order by mutation_id),'[]') from booking_lifecycle_private.appointment_mutations x where appointment_id=${q(a.app)}),'r',(select coalesce(jsonb_agg(to_jsonb(x) order by resource_id),'[]') from public.appointment_resources x where appointment_id=${q(a.app)}))::text) d`,'final-tuple-digest').d;
 async function rejection(a,call,outcome,label){const before=digest(a),money=moneyDigest(),r=call();assert(r.outcome===outcome&&digest(a)===before&&moneyDigest()===money,label);record(label,{result:r,before,after:digest(a),financial_digest:money});}
 const a=await create();
 for(const [column,value] of [['tax_rate_bps',100],['deposit_cents',100],['deposit_required',true],['price','NaN']]){
  const original=one(`select ${column} value from public.services where id=${q(ids.replacementService)}`,'catalog-original').value;
  role(`update public.services set ${column}=${q(value)} where id=${q(ids.replacementService)};`,'different-commercial-config');
  await rejection(a,()=>schedule(a,{cmd:'SERVICE_CORRECTION',service:ids.replacementService}),'FINANCIAL_REVIEW_REQUIRED','D05 incompatible '+column);
  role(`update public.services set ${column}=${q(original)} where id=${q(ids.replacementService)};`,'restore-commercial-config');
 }
 role(`delete from public.staff_services where staff_id=${q(ids.newStaff)} and service_id=${q(ids.service)};`,'remove-qualification');
 await rejection(a,()=>schedule(a,{cmd:'REASSIGN_STAFF',staff:ids.newStaff}),'CONFLICT','D05 missing staff qualification');
 role(`insert into public.staff_services(staff_id,service_id,duration_override_minutes) values(${q(ids.newStaff)},${q(ids.service)},30);`,'restore-qualification');
 const foreignLocation=one(`select public.create_default_location(${q(ids.other)}) id`,'foreign-location').id;
 await rejection(a,()=>schedule(a,{cmd:'REASSIGN_LOCATION',location:foreignLocation}),'CONFLICT','D04/D05 foreign Location');
 await rejection(a,()=>schedule(a,{cmd:'RESIZE',staff:ids.newStaff}),'CONFLICT','D04 field allowlist cannot hide staff change');
 const cancel=await create({payment:true});assert(vclose(cancel).outcome==='APPLIED','cancel requested');cancel.revision++;
 const original=moneyDigest();const again=vclose(cancel);assert(again.outcome==='NO_CHANGE'&&moneyDigest()===original&&state(cancel).operational_revision===1,'repeat cancel writes');
 const events=one(`select count(*)::int n from public.commerce_payment_attempt_events where attempt_id=${q(cancel.attempt)} and event_type='FAILED'`,'one-fence-event');assert(events.n===1,'repeat failed event');
 await rejection(cancel,()=>rpc('transition_booking_appointment_v2',h(cancel).concat(q('confirmed'),'true'),'cancelled-status'),'TERMINAL','D03 cancelled status correction refused');
 await rejection(cancel,()=>vclose(cancel,'REASSIGN_CUSTOMER',ids.customer,ids.replacement),'TERMINAL','D03 cancelled customer correction refused');
 record('D03 repeat cancel preserves one fence and revision',{again,events});
 // Original close metadata can drift under unchanged guards, but never becomes a new permit.
 const corrected=await create();assert(vclose(corrected,'REASSIGN_CUSTOMER',ids.customer,ids.replacement).outcome==='APPLIED','correction fixture');corrected.revision++;
 role(`update public.commerce_booking_operations set replacement_customer_id=${q(ids.customer)} where id=${q(corrected.op)};`,'replacement-metadata-drift');
 const before=moneyDigest();
 run(`set role service_role;do $proof$ begin begin update public.appointments set customer_id=${q(ids.customer)} where id=${q(corrected.app)};exception when check_violation then raise notice 'STALE_METADATA_NOT_A_PERMIT';return;end;raise exception 'STALE_METADATA_AUTHORIZED';end $proof$;`,'stale-metadata-no-permit');
 assert(moneyDigest()===before&&state(corrected).customer_id===ids.replacement,'stale metadata reattributed');record('K-5/K replacement metadata drift is constructible; direct correction still refused',{});
 // A later refunded legacy ledger still vetoes correction; refunds do not subtract history away.
 const refunded=await create(),tx=randomUUID();
 role(`insert into public.commerce_transactions(id,business_id,customer_id,appointment_id,kind,status,method,amount_cents,currency,provider,created_by) values(${[tx,ids.business,ids.customer,refunded.app,'payment','succeeded','cash',100,'cad','manual',ids.owner].map(q).join(',')});insert into public.commerce_refunds(business_id,customer_id,transaction_id,amount_cents,currency,reason,status) values(${[ids.business,ids.customer,tx,100,'cad','Synthetic full refund','succeeded'].map(q).join(',')});`,'refunded-ledger');
 await rejection(refunded,()=>vclose(refunded,'REASSIGN_CUSTOMER',ids.customer,ids.replacement),'FINANCIAL_REVIEW_REQUIRED','D06 transaction-linked refund never erases ledger veto');
 // Reader's source contract lacks both refund axes; capture the actual DTO, not invented fields.
 const originalRead=rpc('read_booking_operations_v1',[ids.business,ids.owner,'one',refunded.op,null,null,null,10].map(q),'refund-read-original');
 assert(!JSON.stringify(originalRead).includes('refunds'),'reader unexpectedly supplies refund aggregate');log({kind:'K-5-refund-read-omission',payload:originalRead});
 summary.cases.D04='PASS';summary.cases.D05='PASS';summary.cases.D06='PASS';
 summary.D09_limitation='Revision 0/1/2, reset/skip/MAX assignment and malformed permits are refused at runtime. A legitimate current revision of INT64_MAX cannot be constructed without ~9e18 valid edits or weakening guards; actual successor overflow branch is SOURCE-PROVEN only.';
 summary.cases.D09='NOT_PROVEN';
 record('D14 recovery boundaries covered by rollback injections, delayed replay and three-session C10',{});
 summary.cases.D14='PASS';
}
