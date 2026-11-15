import {randomUUID} from 'node:crypto';

export async function runExtended({ctx:c,summary,log}) {
 const {ids,q,run,role,rpc,one,create,h,state,schedule,vclose,assert,record,moneyDigest}=c;
 const rowDigest=a=>one(`select md5(jsonb_build_object('a',(select to_jsonb(x) from public.appointments x where id=${q(a.app)}),'j',(select coalesce(jsonb_agg(to_jsonb(x) order by mutation_id),'[]') from booking_lifecycle_private.appointment_mutations x where appointment_id=${q(a.app)}),'r',(select coalesce(jsonb_agg(to_jsonb(x) order by resource_id),'[]') from public.appointment_resources x where appointment_id=${q(a.app)}))::text) digest`,'extended-row-digest').digest;
 const unchanged=(a,before,label)=>assert(rowDigest(a)===before,label+' changed rows');
 const call=(name,args)=>`select row_to_json(r) from public.${name}(${args.join(',')}) r;`;
 ids.location2=randomUUID();
 role(`insert into public.locations(id,business_id,name,slug,timezone) values(${q(ids.location2)},${q(ids.business)},'Synthetic secondary','secondary','America/Toronto');
 insert into public.location_settings(location_id,booking_limit_days) values(${q(ids.location2)},3650);
 insert into public.location_hours(location_id,day_of_week,is_open,open_time,close_time) select ${q(ids.location2)},n,true,'00:00'::time,'23:59'::time from generate_series(0,6) n;
 insert into public.service_locations(service_id,location_id) values(${q(ids.service)},${q(ids.location2)});
 insert into public.staff_locations(staff_id,location_id) values(${q(ids.staff)},${q(ids.location2)});`,'secondary-location');
 const locBooking=await create();let lr=schedule(locBooking,{cmd:'REASSIGN_LOCATION',location:ids.location2});assert(lr.outcome==='APPLIED','mapped location rejected');locBooking.revision++;record('D04 primary-or-mapped Location',{result:lr,location:ids.location2});
 for(const override of [null,0,-1]){
  const x=await create();role(`update public.staff_services set duration_override_minutes=${q(override)} where staff_id=${q(ids.newStaff)} and service_id=${q(ids.service)};`,'duration-config');
  const dr=schedule(x,{cmd:'REASSIGN_STAFF',staff:ids.newStaff});assert(dr.outcome===(override===-1?'CONFLICT':'APPLIED'),'duration fallback');record('D05 duration override '+override,{result:dr});
 }
 role(`update public.staff_services set duration_override_minutes=30 where staff_id=${q(ids.newStaff)} and service_id=${q(ids.service)};`,'restore-duration');
 // Actor semantics and actual, unmodified reader DTOs.
 const a=await create();const read=actor=>rpc('read_booking_operations_v1',[ids.business,actor,'one',a.op,null,null,null,10].map(q),'read-v1');
 const own=read(ids.owner),admin=read(ids.admin);assert(own.payload.found===true&&admin.payload.found===false,'D12-F creator restriction');
 let before=moneyDigest();const otherCommit=rpc('commit_booking_operation_manual_payment_v1',[ids.business,a.op,ids.admin,a.attempt].map(q),'admin-commit');assert(otherCommit.outcome==='UNKNOWN'&&!otherCommit.recorded&&moneyDigest()===before,'D12-F noncreator commit');
 const observe=()=>JSON.parse(role(`select public.read_payment_observability_v1(${[ids.business,ids.admin,'one',a.attempt,null,10].map(q).join(',')});`,'observe').split('\n').find(x=>x.startsWith('{')));
 const obs=observe();assert(!JSON.stringify(obs).includes('binding_valid')&&!JSON.stringify(obs).includes('appointment_valid'),'invented exported keys');
 const walk=x=>{if(x&&typeof x==='object'){if('attempt_key' in x)assert(x.attempt_key===null,'admin attempt key leak');Object.values(x).forEach(walk);}};walk(obs);
 const correction=vclose(a,'REASSIGN_CUSTOMER',ids.customer,ids.replacement);assert(correction.outcome==='APPLIED','D12-F correction');a.revision++;
 const corrected=observe();assert(JSON.stringify(corrected).includes('UNKNOWN'),'corrected observability not UNKNOWN');
 log({kind:'D12-F-exact-DTOs',own,admin,otherCommit,observability:obs,corrected});summary.cases['D12-F']='PASS';record('D12-F actor boundaries / actual JSON keys',{});
 // Old replay carries the latest revision without restoring its old image.
 const b=await create(),key=randomUUID();const input=h(b,key).concat(q('first'));
 const first=rpc('revise_booking_notes_v2',input,'recovery-first');assert(first.outcome==='APPLIED','first');b.revision++;
 assert(rpc('revise_booking_notes_v2',h(b).concat(q('second')),'recovery-second').outcome==='APPLIED','second');b.revision++;
 let d=rowDigest(b);const replay=rpc('revise_booking_notes_v2',input,'delayed-replay');assert(replay.outcome==='REPLAY'&&replay.effect_revision===1&&replay.current_revision===2&&state(b).notes==='second','old replay restored state');unchanged(b,d,'old replay');
 const readCurrent=rpc('read_booking_appointment_mutation_v2',[ids.business,b.app,ids.owner,key].map(q),'read-mutation');assert(readCurrent.current_revision===2&&readCurrent.effect_revision===1,'read current');record('D14 committed response loss / later revision replay',{replay,readCurrent});
 // Actual rollback after journal/parent effects, not an emulated response.
 d=rowDigest(b);before=moneyDigest();const rollbackInput=h(b).concat(q('must roll back'));
 const out=role(`begin; ${call('revise_booking_notes_v2',rollbackInput)} rollback;`,'explicit-rollback');assert(out.includes('ROLLBACK'),'no rollback boundary');unchanged(b,d,'rollback');assert(moneyDigest()===before,'rollback money');record('D13 rollback after lifecycle RPC',{before:d,after:rowDigest(b)});
 d=rowDigest(b);const noop=rpc('revise_booking_notes_v2',h(b).concat(q('second')),'notes-noop');assert(noop.outcome==='NO_CHANGE'&&noop.effect_revision===null&&state(b).operational_revision===2,'no-op revision');
 const stale=rpc('revise_booking_notes_v2',[ids.business,b.op,b.app,ids.owner,randomUUID(),0,'stale','third'].map(q),'stale');assert(stale.outcome==='STALE_REVISION','stale');
 // Null/empty normalization and deliberately oversized before/after input handling.
 assert(rpc('revise_booking_notes_v2',h(b).concat('null'),'clear-notes').outcome==='APPLIED','null clear');b.revision++;
 assert(rpc('revise_booking_notes_v2',h(b).concat(q('')),'empty-noop').outcome==='NO_CHANGE','empty normalization');record('D05 notes null / empty / NO_CHANGE',{});
 // Same-basis service correction versus incompatible commercial terms.
 const neutral=await create();before=moneyDigest();const sr=schedule(neutral,{cmd:'SERVICE_CORRECTION',service:ids.replacementService});assert(sr.outcome==='APPLIED','neutral service');neutral.revision++;
 assert(moneyDigest()===before,'neutral service changed money');
 role(`update public.services set price=26 where id=${q(ids.service)};`,'change-synthetic-price');
 d=rowDigest(neutral);const incompatible=schedule(neutral,{cmd:'SERVICE_CORRECTION',service:ids.service});assert(incompatible.outcome==='FINANCIAL_REVIEW_REQUIRED','non-neutral accepted');unchanged(neutral,d,'non-neutral');role(`update public.services set price=25 where id=${q(ids.service)};`,'restore-synthetic-price');record('D05 numeric service equality / incompatible price refusal',{sr,incompatible});
 // Legacy appointment transaction is admitted under unchanged financial guards.
 const legacy=await create();const tx=randomUUID();
 role(`insert into public.commerce_transactions(id,business_id,customer_id,appointment_id,kind,status,method,amount_cents,currency,provider,created_by) values(${[tx,ids.business,ids.customer,legacy.app,'payment','failed','cash',100,'cad','manual',ids.owner].map(q).join(',')});`,'legacy-failed-labelled-ledger');
 before=moneyDigest();d=rowDigest(legacy);const veto=vclose(legacy,'REASSIGN_CUSTOMER',ids.customer,ids.replacement);assert(veto.outcome==='FINANCIAL_REVIEW_REQUIRED','legacy history hidden');unchanged(legacy,d,'legacy veto');assert(moneyDigest()===before,'legacy veto money');record('D06 failed-labelled legacy transaction veto',{transaction:tx,veto});
 // Direct refund axis can point at another appointment independently of its transaction.
 const refunded=await create();const refund=randomUUID();role(`insert into public.commerce_refunds(id,business_id,customer_id,appointment_id,transaction_id,amount_cents,currency,reason,status) values(${[refund,ids.business,ids.customer,refunded.app,tx,50,'cad','Synthetic witness','failed'].map(q).join(',')});`,'direct-refund-axis');
 d=rowDigest(refunded);assert(vclose(refunded,'REASSIGN_CUSTOMER',ids.customer,ids.replacement).outcome==='FINANCIAL_REVIEW_REQUIRED','direct refund ignored');unchanged(refunded,d,'refund veto');
 const relationships=one(`select jsonb_agg(jsonb_build_object('name',conname,'definition',pg_get_constraintdef(oid)) order by conname) constraints from pg_constraint where conrelid in ('public.commerce_transactions'::regclass,'public.commerce_refunds'::regclass) and contype='f'`,'financial-FKs');
 log({kind:'D14-G-relationship-witness',transaction:tx,refund,transaction_appointment:legacy.app,refund_appointment:refunded.app,...relationships});summary.cases['D14-G']='PASS';record('D14-G independent appointment/attempt and refund axes',{});
 // Fail closed ordinary browser roles, with actual hosted capabilities still a separate gate.
 for(const principal of ['anon','authenticated']){
  const code=run(`set role ${principal};do $proof$ begin begin perform * from public.revise_booking_notes_v2(${h(b).concat(q('forbidden')).join(',')});exception when insufficient_privilege then raise notice 'EXPECTED_42501';return;end;raise exception 'unexpected privilege';end $proof$;`,'deny-'+principal);record('D11 '+principal+' RPC denial',{output:code});
 }
 for(const id of ['D01','D02','D03','D04','D05','D06','D07','D08','D09','D10','D11','D12','D13','D14','D15'])summary.cases[id]='NOT_PROVEN';
 summary.remaining_required_subcases='Main groups are partial; consult the accepted Section S. No complete-group PASS inferred from these witnesses.';
}
