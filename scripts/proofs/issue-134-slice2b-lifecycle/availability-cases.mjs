import {randomUUID} from 'node:crypto';

// Dedicated metadata/appointments: never edit the existing financial fixtures.
// Matrix setup is rolled back per observation; only the cleanup lifecycle witness
// and its legitimate setup/correction operations persist in this disposable DB.
export async function runAvailability({ctx:c,summary,log}) {
 const {ids,q,run,role,one,create,schedule,assert,moneyDigest}=c;
 const f=Object.fromEntries(['location','locationBad','service','candidateService','unqualifiedService','staff','otherStaff','existing','foreignService','foreignStaff'].map(k=>[k,randomUUID()]));
 summary.availability={fixture:f,cases:[]};
 const add=(name,result,evidence)=>{const entry={name,result,...evidence};summary.availability.cases.push(entry);log({kind:'availability',...entry});};
 role(`insert into public.locations(id,business_id,name,slug,timezone) values
 (${q(f.location)},${q(ids.business)},'Availability proof','availability-proof','UTC'),
 (${q(f.locationBad)},${q(ids.business)},'Unmapped proof','unmapped-proof','UTC');
 insert into public.location_settings(location_id,booking_limit_days,appointment_interval_minutes) values(${q(f.location)},3650,5),(${q(f.locationBad)},3650,5);
 insert into public.location_hours(location_id,day_of_week,is_open,open_time,close_time) select ${q(f.location)},n,true,'00:00'::time,'23:59'::time from generate_series(0,6) n;
 insert into public.services(id,business_id,location_id,name,duration_minutes,price) values
 (${q(f.service)},${q(ids.business)},${q(f.location)},'Existing availability service',30,25),
 (${q(f.candidateService)},${q(ids.business)},${q(f.location)},'Zero-buffer candidate service',30,25),
 (${q(f.unqualifiedService)},${q(ids.business)},${q(f.location)},'Unqualified service',30,25),
 (${q(f.foreignService)},${q(ids.other)},null,'Foreign metadata only',30,25);
 insert into public.staff(id,business_id,location_id,name) values
 (${q(f.staff)},${q(ids.business)},${q(f.location)},'Availability staff'),
 (${q(f.otherStaff)},${q(ids.business)},${q(f.location)},'Availability replacement'),
 (${q(f.foreignStaff)},${q(ids.other)},null,'Foreign metadata staff');
 insert into public.staff_services(staff_id,service_id) values(${q(f.staff)},${q(f.service)}),(${q(f.staff)},${q(f.candidateService)}),(${q(f.otherStaff)},${q(f.candidateService)});
 insert into public.staff_locations(staff_id,location_id) values(${q(f.staff)},${q(ids.location)});
 insert into public.service_locations(service_id,location_id) values(${q(f.candidateService)},${q(ids.location)});
 update public.staff_working_hours set is_working=true,start_time='00:00',end_time='23:59' where staff_id in (${q(f.staff)},${q(f.otherStaff)});
 update public.services set buffer_before_minutes=0,buffer_after_minutes=0,cleanup_minutes=0 where id in (${q(f.service)},${q(f.candidateService)});
 update public.staff set buffer_before_minutes=0,buffer_after_minutes=0 where id in (${q(f.staff)},${q(f.otherStaff)});
 update public.services set buffer_before_minutes=60,buffer_after_minutes=60,cleanup_minutes=60 where id=${q(f.foreignService)};
 update public.staff set buffer_before_minutes=60,buffer_after_minutes=60 where id=${q(f.foreignStaff)};`,'availability-fixtures');
 const a=await create();
 const day=new Date();day.setUTCDate(day.getUTCDate()+400);const date=day.toISOString().slice(0,10);
 const at=t=>date+'T'+t+':00Z';
 let financial=moneyDigest();
 let result=schedule(a,{cmd:'SERVICE_CORRECTION',service:f.candidateService,staff:f.staff,start:at('12:30'),end:at('13:00')});
 assert(result.outcome==='APPLIED','availability same-basis service/staff setup');a.revision++;
 add('qualified-neutral-service-staff-correction','PASS',{rpc:result,before_digest:financial,after_digest:moneyDigest(),duration_minutes:30});
 result=schedule(a,{cmd:'REASSIGN_LOCATION',service:f.candidateService,staff:f.staff,location:f.location,start:at('12:30'),end:at('13:00')});
 assert(result.outcome==='APPLIED'&&moneyDigest()===financial,'availability mapped Location setup repriced/failed');a.revision++;
 add('mapped-location-correction','PASS',{rpc:result,before_digest:financial,after_digest:moneyDigest(),duration_minutes:30});
 a.start=at('12:30');a.end=at('13:00');
 const existingInsert=(service=f.service,staff=f.staff)=>`insert into public.appointments(id,business_id,location_id,service_id,staff_id,customer_id,start_time,end_time,status) values(${[f.existing,ids.business,f.location,service,staff,ids.customer,at('10:00'),at('10:30'),'confirmed'].map(q).join(',')});`;
 role(existingInsert(),'availability-existing');
 const snap=()=>one(`select (select to_jsonb(x) from public.appointments x where id=${q(a.app)}) appointment,
 (select to_jsonb(x) from public.appointments x where id=${q(f.existing)}) existing,
 (select count(*)::int from booking_lifecycle_private.appointment_mutations where appointment_id=${q(a.app)}) journal_count`,'availability-state');
 const baseline=snap();
 const validateFunction=`create function pg_temp.availability_validator(s timestamptz,e timestamptz,st uuid,ex uuid) returns jsonb language plpgsql as $v$ begin
 perform public.validate_appointment_slot(${q(ids.business)},${q(f.candidateService)},st,s,e,ex,${q(f.location)});
 return jsonb_build_object('outcome','ALLOWED'); exception when others then return jsonb_build_object('outcome','REFUSED','sqlstate',sqlstate,'message',sqlerrm); end $v$;`;
 const config=(sb=0,sa=0,cleanup=0,tb=0,ta=0)=>`update public.services set buffer_before_minutes=${sb},buffer_after_minutes=${sa},cleanup_minutes=${cleanup} where id=${q(f.service)};
 update public.staff set buffer_before_minutes=${tb},buffer_after_minutes=${ta} where id=${q(f.staff)};`;
 function probe(name,{start,end,setup='',raw=true,allowed=false,staff=f.staff,exclude=a.app,double=false,expectComposed=true}) {
  const before=snap(),digest=moneyDigest();
  const out=run(`begin;${setup}${validateFunction}
 select jsonb_build_object('name',${q(name)},'current_user',current_user,'session_user',session_user,
 'input',jsonb_build_object('start',${q(start)}::timestamptz,'end',${q(end)}::timestamptz,'exclude',${q(exclude)}::uuid,'staff',${q(staff)}::uuid),
 'existing',(select to_jsonb(x) from public.appointments x where id=${q(f.existing)}),
 'existing_service',(select jsonb_build_object('business',business_id,'before',buffer_before_minutes,'after',buffer_after_minutes,'cleanup',cleanup_minutes) from public.services where id=(select service_id from public.appointments where id=${q(f.existing)})),
 'existing_staff',(select jsonb_build_object('business',business_id,'before',buffer_before_minutes,'after',buffer_after_minutes) from public.staff where id=(select staff_id from public.appointments where id=${q(f.existing)})),
 'candidate_service',(select jsonb_build_object('before',buffer_before_minutes,'after',buffer_after_minutes,'cleanup',cleanup_minutes,'duration',duration_minutes) from public.services where id=${q(f.candidateService)}),
 'raw_reason',public.availability_block_reason(${[ids.business,f.location,staff,f.candidateService,start,end,exclude,double].map(q).join(',')}),
 'slot_in_set',exists(select 1 from public.get_available_slots(${[ids.business,f.candidateService,staff].map(q).join(',')},(${q(start)}::timestamptz at time zone (select timezone from public.locations where id=${q(f.location)}))::date,${q(exclude)},${q(f.location)}) slot where slot=${q(start)}::timestamptz),
 'validator',pg_temp.availability_validator(${[start,end,staff,exclude].map(q).join(',')}),
 'journal_count',(select count(*) from booking_lifecycle_private.appointment_mutations where appointment_id=${q(a.app)}));rollback;`,'availability-'+name);
  const witness=JSON.parse(out.split('\n').find(x=>x.startsWith('{')));
  const after=snap(),afterDigest=moneyDigest();
  add(name,'OBSERVED',{witness,expected:{raw_conflict:raw,composed_allowed:allowed,half_open:'existing expanded start < candidate expanded end AND existing expanded end > candidate expanded start'},before,after,before_digest:digest,after_digest:afterDigest});
  assert(witness.raw_reason===(raw?'Time slot overlaps an existing appointment':null),name+' wrong existing-appointment conflict reason');
  assert(witness.candidate_service.before===0&&witness.candidate_service.after===0&&witness.candidate_service.cleanup===0,name+' candidate buffers contaminated isolation');
  if(expectComposed)assert(witness.slot_in_set===allowed&&witness.validator.outcome===(allowed?'ALLOWED':'REFUSED'),name+' composed availability mismatch');
  if(!allowed&&expectComposed)assert(witness.validator.sqlstate==='P0001'&&['Time slot not available','Time slot overlaps an existing appointment'].includes(witness.validator.message),name+' unrelated validator rejection');
  assert(JSON.stringify(before)===JSON.stringify(after)&&digest===afterDigest&&witness.journal_count===before.journal_count,name+' probe mutated state');
  summary.availability.cases.at(-1).result='PASS';log({kind:'availability-asserted',name,result:'PASS'});
  return witness;
 }
 // Each pair straddles the relevant expanded half-open boundary. Candidate
 // service buffers stay zero; same-staff buffers legitimately apply to both sides.
 for(const [name,setup,blocked,edge] of [
  ['existing-service-before',config(10),['09:25','09:55'],['09:20','09:50']],
  ['existing-service-after',config(0,10),['10:35','11:05'],['10:40','11:10']],
  ['existing-staff-before',config(0,0,0,10),['09:25','09:55'],['09:20','09:50']],
  ['existing-staff-after',config(0,0,0,0,10),['10:35','11:05'],['10:40','11:10']],
  ['greatest-before-not-sum',config(10,0,0,5),['09:25','09:55'],['09:20','09:50']],
  ['greatest-after-not-sum',config(0,10,0,0,5),['10:35','11:05'],['10:40','11:10']],
  ['existing-service-cleanup',config(0,0,5),['10:30','11:00'],['10:35','11:05']],
  ['after-plus-cleanup',config(0,10,5),['10:40','11:10'],['10:45','11:15']],
 ]){
  probe(name+'-conflict',{setup,start:at(blocked[0]),end:at(blocked[1])});
  probe(name+'-boundary',{setup,start:at(edge[0]),end:at(edge[1]),raw:false,allowed:true});
 }
 probe('raw-named-staff-overlap',{start:at('10:00'),end:at('10:30')});
 probe('raw-left-half-open',{start:at('09:30'),end:at('10:00'),raw:false,allowed:true});
 probe('raw-right-half-open',{start:at('10:30'),end:at('11:00'),raw:false,allowed:true});
 probe('self-without-exclusion',{start:a.start,end:a.end,exclude:null});
 probe('self-excluded',{start:a.start,end:a.end,raw:false,allowed:true});
 probe('cancelled-does-not-reserve',{setup:`update public.appointments set status='cancelled' where id=${q(f.existing)};`,start:at('10:00'),end:at('10:30'),raw:false,allowed:true});
 // Configuration governs the availability layer; the independent physical
 // exclusion constraint is NOT bypassed or claimed to allow overlapping writes.
 probe('configured-double-booking-validator',{setup:`update public.businesses set allow_double_booking=true where id=${q(ids.business)};`,start:at('10:00'),end:at('10:30'),raw:false,allowed:true,double:true});
 const doubleOut=run(`begin;update public.businesses set allow_double_booking=true where id=${q(ids.business)};
 do $x$ begin begin insert into public.appointments(business_id,location_id,service_id,staff_id,customer_id,start_time,end_time,status) values(${[ids.business,f.location,f.candidateService,f.staff,ids.customer,at('10:00'),at('10:30'),'confirmed'].map(q).join(',')}); exception when exclusion_violation then raise notice 'DOUBLE_BOOKING_PHYSICAL_EXCLUSION:23P01';return;end;raise exception 'EXPECTED_EXCLUSION_MISSING';end $x$;rollback;`,'availability-double-physical');
 add('configured-double-booking-physical-exclusion','PASS',{expected_sqlstate:'23P01',stdout:doubleOut,limitation:'Validator configuration does not disable appointments_staff_no_overlap; no overlapping persistence claimed.'});
 // Missing metadata is structurally impossible here. Capture actual FK and
 // NOT NULL refusals, not a fabricated runtime overlap PASS or disabled guard.
 for(const column of ['service_id','staff_id'])for(const missing of ['null','nonexistent']) {
  const invalid=missing==='null'?'null':q(randomUUID()),expected=missing==='null'?'23502':'23503';
  const out=run(`begin;create function pg_temp.metadata_probe() returns jsonb language plpgsql as $x$ declare constraint_name text;begin
  update public.appointments set ${column}=${invalid} where id=${q(f.existing)};
  return jsonb_build_object('outcome','UNEXPECTED_ACCEPT');exception when others then get stacked diagnostics constraint_name=CONSTRAINT_NAME;return jsonb_build_object('sqlstate',sqlstate,'constraint',constraint_name,'message',sqlerrm);end $x$;
  select pg_temp.metadata_probe();rollback;`,'availability-missing-'+column+'-'+missing);
  const witness=JSON.parse(out.split('\n').find(x=>x.startsWith('{')));
  add('missing-'+column+'-'+missing,'NOT_PROVEN',{witness,reason:'Schema prohibits the anomalous fixture; raw-overlap fallback is source-characterized only. No constraint weakened.'});
  assert(witness.sqlstate===expected,'unexpected missing metadata fixture result');
  assert(JSON.stringify(snap())===JSON.stringify(baseline),'missing metadata probe survived rollback');
 }
 // Legacy unlinked rows may have same-ID/FK-valid foreign metadata. Observe
 // constructibility first, then prove tenant-qualified LEFT JOIN behavior.
 for(const [column,id,staff] of [['service_id',f.foreignService,f.staff],['staff_id',f.foreignStaff,f.foreignStaff]]) {
  const setup=`update public.appointments set ${column}=${q(id)} where id=${q(f.existing)};`;
  const out=run(`begin;create function pg_temp.foreign_probe() returns jsonb language plpgsql as $x$ begin ${setup} return jsonb_build_object('outcome','CONSTRUCTED');exception when others then return jsonb_build_object('outcome','REFUSED','sqlstate',sqlstate,'message',sqlerrm);end $x$;select pg_temp.foreign_probe();rollback;`,'availability-foreign-constructibility-'+column);
  const witness=JSON.parse(out.split('\n').find(x=>x.startsWith('{')));
  if(witness.outcome==='REFUSED') {add('foreign-'+column,'NOT_PROVEN',{witness,reason:'Actual schema refused anomalous legacy relationship; no constraint weakened.'});continue;}
  const composed=column==='service_id';
  probe('foreign-'+column+'-raw-overlap',{setup,start:at('10:00'),end:at('10:30'),staff,expectComposed:composed});
  const boundary=probe('foreign-'+column+'-buffer-isolation',{setup,start:at('10:30'),end:at('11:00'),staff,raw:false,allowed:composed,expectComposed:composed});
  if(!composed)assert(boundary.validator.outcome==='REFUSED'&&boundary.validator.message==='Staff not available'&&!boundary.slot_in_set,'foreign staff accepted by composed validator');
 }
 // Dedicated cleanup lifecycle witness: different services, zero candidate
 // service/staff buffers, real service-role RPC, exact persisted/journal deltas.
 role(config(0,0,5),'availability-cleanup-persisted-config');
 const invoke=(cmd,start,end,overrides={})=>schedule(a,{cmd,location:f.location,service:f.candidateService,staff:f.staff,start,end,...overrides});
 for(const [name,cmd,overrides] of [
  ['staff-duration','REASSIGN_STAFF',{staff:f.otherStaff,end:at('13:15')}],
  ['service-duration','SERVICE_CORRECTION',{service:f.service,end:at('13:15')}],
  ['service-qualification','SERVICE_CORRECTION',{service:f.unqualifiedService}],
  ['location-mapping','REASSIGN_LOCATION',{location:f.locationBad}],
  ['service-conflict','SERVICE_CORRECTION',{service:f.service,start:at('10:00'),end:at('10:30')}],
 ]) {
  const before=snap(),digest=moneyDigest();const r=invoke(cmd,a.start,a.end,overrides);const after=snap();
  add(name,'OBSERVED',{rpc:r,before,after,before_digest:digest,after_digest:moneyDigest()});
  assert(r.outcome==='CONFLICT'&&JSON.stringify(before)===JSON.stringify(after)&&moneyDigest()===digest,name+' correction guard');summary.availability.cases.at(-1).result='PASS';
 }
 const before=snap(),digest=moneyDigest();
 const rejected=invoke('RESCHEDULE',at('10:30'),at('11:00'));const rejectedState=snap();
 add('cleanup-10:30-lifecycle','OBSERVED',{existing_interval:[at('10:00'),at('10:30')],cleanup_minutes:5,candidate_interval:[at('10:30'),at('11:00')],candidate_buffer_minutes:0,expected_half_open:'10:35 > 10:30; collision',rpc:rejected,before,after:rejectedState,before_digest:digest,after_digest:moneyDigest()});
 assert(rejected.outcome==='CONFLICT'&&JSON.stringify(before)===JSON.stringify(rejectedState)&&moneyDigest()===digest,'cleanup rejection changed rows/money');summary.availability.cases.at(-1).result='PASS';
 const allowed=invoke('RESCHEDULE',at('10:35'),at('11:05'));const after=snap();
 add('cleanup-10:35-lifecycle','OBSERVED',{candidate_interval:[at('10:35'),at('11:05')],expected_half_open:'10:35 > 10:35 is false; eligible',rpc:allowed,before:rejectedState,after,before_digest:digest,after_digest:moneyDigest()});
 assert(allowed.outcome==='APPLIED'&&after.appointment.operational_revision===before.appointment.operational_revision+1&&after.journal_count===before.journal_count+1&&Date.parse(after.appointment.start_time)===Date.parse(at('10:35'))&&Date.parse(after.appointment.end_time)-Date.parse(after.appointment.start_time)===1800000&&JSON.stringify(after.existing)===JSON.stringify(before.existing)&&moneyDigest()===digest,'cleanup boundary persistence mismatch');a.revision++;
 summary.availability.cases.at(-1).result='PASS';
 const selfBefore=snap(),selfMoney=moneyDigest();
 const selfMove=invoke('RESCHEDULE',at('10:40'),at('11:10'));const selfAfter=snap();
 add('overlapping-self-reschedule','OBSERVED',{rpc:selfMove,before:selfBefore,after:selfAfter,before_digest:selfMoney,after_digest:moneyDigest()});
 assert(selfMove.outcome==='APPLIED'&&selfAfter.appointment.operational_revision===a.revision+1&&selfAfter.journal_count===selfBefore.journal_count+1&&moneyDigest()===selfMoney,'self-exclusion lifecycle');a.revision++;
 summary.availability.cases.at(-1).result='PASS';
 // Current-year or next-year Toronto DST instants; explicit offsets preserve
 // elapsed time even when the displayed wall clock repeats/skips.
 for(const kind of ['spring','fall']) {
  const now=new Date();let year=now.getUTCFullYear();let d;
  do {d=new Date(Date.UTC(year,kind==='spring'?2:10,1));d.setUTCDate(1+(7-d.getUTCDay())%7+(kind==='spring'?7:0));if(d<=now)year++;else break;}while(true);
  const localDate=d.toISOString().slice(0,10),start=localDate+(kind==='spring'?'T01:45:00-05:00':'T01:30:00-04:00'),end=localDate+(kind==='spring'?'T03:15:00-04:00':'T01:00:00-05:00');
  const b=snap(),md=moneyDigest();
  const out=run(`begin;update public.locations set timezone='America/Toronto' where id=${q(f.location)};
  set local role service_role;
  select row_to_json(r) from public.revise_booking_schedule_v2(${c.h(a).concat(['RESCHEDULE',f.location,f.candidateService,f.staff,start,end,null].map(q),'array[]::uuid[]').join(',')}) r;
  reset role;select jsonb_build_object('elapsed_seconds',extract(epoch from end_time-start_time),'start',start_time,'end',end_time,'revision',operational_revision) from public.appointments where id=${q(a.app)};rollback;`,'availability-DST-'+kind);
  const [r,times]=out.split('\n').filter(x=>x.startsWith('{')).map(x=>JSON.parse(x));
  add('DST-'+kind,'OBSERVED',{start,end,rpc:r,times,before:b,after:snap(),before_digest:md,after_digest:moneyDigest()});
  assert(r.outcome==='APPLIED'&&times.elapsed_seconds===1800&&times.revision===a.revision+1&&Date.parse(times.start)===Date.parse(start)&&Date.parse(times.end)===Date.parse(end)&&JSON.stringify(b)===JSON.stringify(snap())&&md===moneyDigest(),'DST elapsed/persistence/rollback');summary.availability.cases.at(-1).result='PASS';
 }
 summary.availability.complete=true;
 log({kind:'availability-complete',cases:summary.availability.cases});
}
