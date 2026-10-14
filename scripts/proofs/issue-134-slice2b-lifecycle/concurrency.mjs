import {randomUUID} from 'node:crypto';

export async function runConcurrency({ctx:c,sessions,summary,log}) {
 const {ids,q,create,h,one,assert,record,state,moneyDigest}=c;
 const call=(name,args)=>`select row_to_json(r) from public.${name}(${args.join(',')}) r;`;
 const notes=(a,key=randomUUID(),actor=ids.owner)=>call('revise_booking_notes_v2',h(a,key,actor).concat(q('Concurrent note')));
 const commit=a=>call('commit_booking_operation_manual_payment_v1',[ids.business,a.op,ids.owner,a.attempt].map(q));
 const cancel=a=>call('close_booking_appointment_v2',h(a).concat(q('CANCEL'),'null','null'));
 const correction=a=>call('close_booking_appointment_v2',h(a).concat(q('REASSIGN_CUSTOMER'),q(ids.customer),q(ids.replacement)));
 const schedule=(a,start=new Date(Date.parse(a.start)+3600000).toISOString(),end=new Date(Date.parse(a.end)+3600000).toISOString())=>call('revise_booking_schedule_v2',h(a).concat(['RESCHEDULE',ids.location,ids.service,ids.staff,start,end,null].map(q),['array[]::uuid[]']));
 const parse=s=>JSON.parse(s.split('\n').filter(x=>x.startsWith('{')).at(-1));
 const activity=pids=>one(`select jsonb_build_object('sessions',(select jsonb_agg(jsonb_build_object('pid',pid,'state',state,'wait_event_type',wait_event_type,'wait_event',wait_event,'blockers',pg_blocking_pids(pid))) from pg_stat_activity where pid=any(array[${pids}])), 'locks',(select jsonb_agg(jsonb_build_object('pid',pid,'type',locktype,'mode',mode,'granted',granted,'relation',relation::regclass::text,'transactionid',transactionid::text,'virtualxid',virtualxid)) from pg_locks where pid=any(array[${pids}]))) evidence`,'lock-snapshot').evidence;
 async function waiting(s,others,label){const begin=Date.now();let e;while(Date.now()-begin<3000){e=activity([s.pid,...others.map(x=>x.pid)]);if(e.sessions.some(x=>x.pid===s.pid&&x.wait_event_type==='Lock')){log({kind:'lock-witness',label,elapsed_ms:Date.now()-begin,...e});return e;}await new Promise(r=>setTimeout(r,25));}throw new Error(label+' expected real lock wait not observed');}
 async function pair(label,first,second,verify){const s1=await sessions.open(label+'-A').begin(),s2=await sessions.open(label+'-B').begin();try{
  const a=await s1.exec(first);const p=s2.exec(second);await waiting(s2,[s1],label);await s1.exec('commit;');const b=await p;await s2.exec('commit;');verify(parse(a),parse(b));record(label,{first:parse(a),second:parse(b)});
 }finally{await s1.end();await s2.end();}}
 for(const reverse of [false,true]){
  const a=await create({payment:true});
  await pair('C01-'+(reverse?'schedule-first':'commit-first'),reverse?schedule(a):commit(a),reverse?commit(a):schedule(a),(x,y)=>{assert((reverse?x:y).outcome===(reverse?'PAYMENT_RECOVERY_REQUIRED':'APPLIED'),'C01 schedule outcome');assert((reverse?y:x).recorded===true,'C01 money');});
  assert(one(`select count(*)::int n from public.commerce_transactions where payment_attempt_id=${q(a.attempt)}`,'C01-ledger').n===1,'C01 duplicate');
 }
 summary.cases.C01='PASS';
 for(const reverse of [false,true]){
  const a=await create();const later=c.rpc('admit_payment_attempt_v1',[ids.business,randomUUID(),'v1:'+'b'.repeat(64),'collect_payment',ids.customer,a.app,ids.owner,'payment',100,'cad','cash','manual'].map(q),'C02-admit');
  const payment=call('commit_manual_payment_attempt_v1',[ids.business,later.attempt_id].map(q));
  const s1=await sessions.open('C02-A').begin(),s2=await sessions.open('C02-B').begin();try{
   const x=await s1.exec(reverse?payment:notes(a));const started=Date.now();const y=await s2.exec(reverse?notes(a):payment);
   const e=activity([s1.pid,s2.pid]);log({kind:'compatible-locks',label:'C02',reverse,elapsed_ms:Date.now()-started,...e});
   assert(parse(reverse?x:y).recorded===true&&parse(reverse?y:x).outcome==='APPLIED','C02 concurrent commands');
   await s2.exec('commit;');await s1.exec('commit;');record('C02-'+reverse,{first:parse(x),second:parse(y)});
  }finally{await s1.end();await s2.end();}
 }
 summary.cases.C02='PASS';
 for(const reverse of [false,true]){
  const a=await create();const later=c.rpc('admit_payment_attempt_v1',[ids.business,randomUUID(),'v1:'+'c'.repeat(64),'collect_payment',ids.customer,a.app,ids.owner,'payment',100,'cad','cash','manual'].map(q),'C03-admit');
  const payment=call('commit_manual_payment_attempt_v1',[ids.business,later.attempt_id].map(q));
  const s1=await sessions.open('C03-A').begin(),s2=await sessions.open('C03-B').begin();try{
   const x=await s1.exec(reverse?correction(a):payment);const p=s2.exec(reverse?payment:correction(a));await waiting(s2,[s1],'C03-'+reverse);await s1.exec('commit;');const y=await p;await s2.exec('commit;');
   if(reverse){assert(parse(x).outcome==='APPLIED','C03 correction winner');assert(!y.includes('"recorded":true'),'C03 old customer money admitted');}
   else assert(parse(x).recorded&&parse(y).outcome==='FINANCIAL_REVIEW_REQUIRED','C03 payment winner');
   record('C03-R1a-'+reverse,{first:x,second:y,final:state(a)});
  }finally{await s1.end();await s2.end();}
 }
 // Legacy insert is a separate required schedule, not inferred from the R1a runs.
 for(const reverse of [false,true]){
  const a=await create();const tx=randomUUID();
  const legacy=`insert into public.commerce_transactions(id,business_id,customer_id,appointment_id,kind,status,method,amount_cents,currency,provider,created_by) values(${[tx,ids.business,ids.customer,a.app,'payment','succeeded','cash',100,'cad','manual',ids.owner].map(q).join(',')});select json_build_object('inserted',true);`;
  const s1=await sessions.open('C03-legacy-A').begin(),s2=await sessions.open('C03-legacy-B').begin();try{
   const x=await s1.exec(reverse?correction(a):legacy);const p=s2.exec(reverse?legacy:correction(a));await waiting(s2,[s1],'C03-legacy');await s1.exec('commit;');const y=await p;await s2.exec('commit;');
   const count=one(`select count(*)::int n from public.commerce_transactions where id=${q(tx)}`,'C03-legacy-count').n;
   assert(reverse?(parse(x).outcome==='APPLIED'&&count===0):(count===1&&parse(y).outcome==='FINANCIAL_REVIEW_REQUIRED'),'C03 legacy attribution');record('C03-legacy-'+reverse,{first:x,second:y,count});
  }finally{await s1.end();await s2.end();}
 }
 summary.cases.C03='PASS';

 for(const reverse of [false,true]){
  const a=await create({payment:true});await pair('C04-'+reverse,reverse?cancel(a):commit(a),reverse?commit(a):cancel(a),(x,y)=>{assert((reverse?x:y).outcome==='APPLIED','C04 cancel');assert(reverse?!(y.recorded):x.recorded,'C04 money');});
 }
 summary.cases.C04='PASS';
 for(const same of [false,true]){
  const a=await create(),key=randomUUID();await pair('C06-'+same,notes(a,key),notes(a,same?key:randomUUID()),(x,y)=>{assert(x.outcome==='APPLIED'&&y.outcome===(same?'REPLAY':'STALE_REVISION'),'C06 winner');});assert(state(a).operational_revision===1,'C06 revision');
 }
 summary.cases.C06='PASS';
 // Actual projector functions, synthetic admission only; no worker process.
 c.run(`insert into public.commerce_projection_admission(business_id,enabled,admit_attempts_created_after) values(${q(ids.business)},true,clock_timestamp()) on conflict(business_id) do update set enabled=true,admit_attempts_created_after=excluded.admit_attempts_created_after;`,'synthetic-projection-admission');
 for(const kind of ['appointment_cache','invoice_settlement','customer_payment_events','receipt'])for(const reverse of [false,true]){
  const a=await create({payment:true});assert(c.commit(a).recorded,'C05 paid fixture');
  const project=`select public.project_payment_obligation_v1(${[ids.business,a.attempt,kind].map(q).join(',')});`;
  await pair('C05-'+kind+'-'+reverse,reverse?notes(a):project,reverse?project:notes(a),(x,y)=>{assert((reverse?x:y).outcome==='APPLIED','C05 edit');assert((reverse?y:x).outcome==='APPLIED'&&(reverse?y:x).state==='COMPLETE','C05 projector');});
  assert(one(`select count(*)::int n from public.commerce_transactions where payment_attempt_id=${q(a.attempt)}`,'C05-ledger').n===1,'C05 ledger');
 }
 summary.cases.C05='PASS';
 c.run(`update public.commerce_projection_admission set enabled=false where business_id=${q(ids.business)};`,'close-synthetic-projection-admission');
 // Three real sessions: a cancel wins, schedule sees a later revision, and replay reads current state.
 {
  const a=await create(),key=randomUUID();const s1=await sessions.open('C10-cancel').begin(),s2=await sessions.open('C10-schedule').begin(),s3=await sessions.open('C10-read').begin();
  try{
   const cmd=call('close_booking_appointment_v2',h(a,key).concat(q('CANCEL'),'null','null'));
   assert(parse(await s1.exec(cmd)).outcome==='APPLIED','C10 cancel');
   const p=s2.exec(schedule(a));await waiting(s2,[s1,s3],'C10');
   const early=parse(await s3.exec(call('read_booking_appointment_mutation_v2',[ids.business,a.app,ids.owner,key].map(q))));assert(early.outcome==='UNKNOWN','C10 uncommitted journal visible');
   await s1.exec('commit;');const late=parse(await p);assert(late.outcome==='STALE_REVISION','C10 stale');await s2.exec('commit;');
   const recovered=parse(await s3.exec(call('read_booking_appointment_mutation_v2',[ids.business,a.app,ids.owner,key].map(q))));assert(recovered.outcome==='REPLAY'&&recovered.current_status==='cancelled','C10 canonical recovery');
   const replay=parse(await s3.exec(cmd));assert(replay.outcome==='REPLAY'&&replay.current_revision===1,'C10 delayed replay');await s3.exec('commit;');record('C10-three-sessions',{early,late,recovered,replay});
  }finally{await s1.end();await s2.end();await s3.end();}
 }
 summary.cases.C10='PASS';
 // Legacy parent deletion versus child INSERT, both orders. Constraints remain enabled.
 for(const reverse of [false,true]){
  const app=randomUUID();c.role(`insert into public.appointments(id,business_id,customer_id,location_id,service_id,staff_id,start_time,end_time,status) values(${[app,ids.business,ids.customer,ids.location,ids.service,ids.staff].map(q).join(',')},now()+interval '${reverse?901:900} days',now()+interval '${reverse?901:900} days 30 minutes','confirmed');`,'C08-legacy');
  const del=`delete from public.appointments where id=${q(app)};select json_build_object('deleted',true);`;
  const ins=`insert into public.appointment_resources(appointment_id,resource_id) values(${q(app)},${q(ids.resource)});select json_build_object('inserted',true);`;
  const s1=await sessions.open('C08-A').begin(),s2=await sessions.open('C08-B').begin();try{
   await s1.exec(reverse?ins:del);const p=s2.exec(reverse?del:ins);await waiting(s2,[s1],'C08');await s1.exec('commit;');const result=await p;await s2.exec('commit;');
   const remaining=one(`select (select count(*)::int from public.appointments where id=${q(app)}) parents,(select count(*)::int from public.appointment_resources where appointment_id=${q(app)}) children`,'C08-after');assert(remaining.parents===0&&remaining.children===0,'C08 orphan');record('C08-legacy-'+reverse,{result,remaining});
  }finally{await s1.end();await s2.end();}
 }
 for(const reverse of [false,true]){
  const a=await create({resources:[ids.resource]});const edit=call('revise_booking_schedule_v2',h(a).concat(['RESOURCES',ids.location,ids.service,ids.staff,a.start,a.end,null].map(q),['array[]::uuid[]']));
  const del=`delete from public.appointments where id=${q(a.app)};`;
  const s1=await sessions.open('C08-linked-A').begin(),s2=await sessions.open('C08-linked-B').begin();try{
   if(reverse){await s1.exec(del);const y=parse(await s2.exec(edit));assert(y.outcome==='APPLIED','linked edit after refused delete');await s1.exec('rollback;');await s2.exec('commit;');}
   else{assert(parse(await s1.exec(edit)).outcome==='APPLIED','linked edit');const p=s2.exec(del);await waiting(s2,[s1],'C08-linked');await s1.exec('commit;');await p;await s2.exec('rollback;');}
   assert(state(a).operational_revision===1,'linked parent deleted');record('C08 linked DELETE refused / resource maintenance '+reverse,{appointment:a.app});
  }finally{await s1.end();await s2.end();}
 }
 summary.cases.C08='PASS';
 // Linked variant and observed RI principal remain separate.

 for(const reverse of [false,true]){
  const a=await create(),b=await create();let start=new Date(Date.parse(b.start)+3600000).toISOString(),end=new Date(Date.parse(b.end)+3600000).toISOString();
  const s1=await sessions.open('C07-A').begin(),s2=await sessions.open('C07-B').begin();try{
   const x=await s1.exec(schedule(reverse?b:a,start,end));const p=s2.exec(schedule(reverse?a:b,start,end));await waiting(s2,[s1],'C07');await s1.exec('commit;');const y=await p;await s2.exec('commit;');assert(parse(x).outcome==='APPLIED'&&!y.includes('"outcome":"APPLIED"'),'C07 collision');record('C07-'+reverse,{winner:x,loser:y});
  }finally{await s1.end();await s2.end();}
 }
 {
  const a=await create(),b=await create();const moved=c.schedule(b,{cmd:'REASSIGN_STAFF',staff:ids.newStaff,start:a.start,end:a.end});assert(moved.outcome==='APPLIED','resource contention setup');b.revision++;b.start=a.start;b.end=a.end;
  const resources=(x,staff)=>call('revise_booking_schedule_v2',h(x).concat(['RESOURCES',ids.location,ids.service,staff,x.start,x.end,null].map(q),[`array[${q(ids.newResource)}]::uuid[]`]));
  const s1=await sessions.open('C07-soft-A').begin(),s2=await sessions.open('C07-soft-B').begin();try{
   const x=parse(await s1.exec(resources(a,ids.staff))),y=parse(await s2.exec(resources(b,ids.newStaff)));assert(x.outcome==='APPLIED'&&y.outcome==='APPLIED','unexpected new hard reservation rule');
   log({kind:'soft-resource-contention',...activity([s1.pid,s2.pid])});await s1.exec('commit;');await s2.exec('commit;');record('C07 existing soft resource check permits concurrent overlap',{x,y});
  }finally{await s1.end();await s2.end();}
 }
 summary.cases.C07='PASS';
 // Soft-contention witness above deliberately preserves the existing limitation.
 for(const reverse of [false,true]){
  const a=await create();const s1=await sessions.open('C09-A').begin(),s2=await sessions.open('C09-B').begin();try{
   const revoke=`delete from public.business_members where business_id=${q(ids.business)} and user_id=${q(ids.admin)};select json_build_object('revoked',true);`;
   const x=await s1.exec(reverse?revoke:notes(a,randomUUID(),ids.admin));const p=s2.exec(reverse?notes(a,randomUUID(),ids.admin):revoke);await waiting(s2,[s1],'C09');await s1.exec('commit;');const y=await p;await s2.exec('commit;');assert(parse(reverse?y:x).outcome===(reverse?'NOT_AUTHORIZED':'APPLIED'),'C09 auth ordering');record('C09-delete-'+reverse,{first:x,second:y});
   c.role(`insert into public.business_members(business_id,user_id,role) values(${q(ids.business)},${q(ids.admin)},'admin');`,'restore-synthetic-admin');
  }finally{await s1.end();await s2.end();}
 }
 for(const kind of ['owner-transfer'])for(const reverse of [false,true]){
  const a=await create();const actor=kind==='downgrade'?ids.admin:ids.owner;
  const revoke=kind==='downgrade'?`update public.business_members set role='employee' where business_id=${q(ids.business)} and user_id=${q(ids.admin)};`:`update public.businesses set owner_id=${q(ids.admin)} where id=${q(ids.business)};`;
  const s1=await sessions.open('C09-'+kind+'-A').begin(),s2=await sessions.open('C09-'+kind+'-B').begin();try{
   const x=await s1.exec(reverse?revoke+"select json_build_object('revoked',true);":notes(a,randomUUID(),actor));const p=s2.exec(reverse?notes(a,randomUUID(),actor):revoke+"select json_build_object('revoked',true);");await waiting(s2,[s1],'C09-'+kind);await s1.exec('commit;');const y=await p;await s2.exec('commit;');assert(parse(reverse?y:x).outcome===(reverse?'NOT_AUTHORIZED':'APPLIED'),'C09 '+kind);record('C09-'+kind+'-'+reverse,{first:x,second:y});
  }finally{await s1.end();await s2.end();}
  c.role(kind==='downgrade'?`update public.business_members set role='admin' where business_id=${q(ids.business)} and user_id=${q(ids.admin)};`:`update public.businesses set owner_id=${q(ids.owner)} where id=${q(ids.business)};`,'restore-synthetic-authority');
 }
 summary.cases.C09='NOT_PROVEN';
 summary.C09_limitation='Deletion and owner transfer executed both orders. Downgrade to an unauthorized membership role cannot be constructed: unchanged business_members_role_check admits only owner/admin. The attempted employee downgrade was rejected in run 640c9cf9; no constraint was changed.';
 // Downgrade and owner-transfer variants remain explicit.
 for(const reverse of [false,true]){
  const a=await create();const s1=await sessions.open('C11-A').begin(),s2=await sessions.open('C11-B').begin();try{
   const retire=`update public.staff set is_active=false where id=${q(ids.staff)};select json_build_object('retired',true);`;
   const x=await s1.exec(reverse?retire:schedule(a));const p=s2.exec(reverse?schedule(a):retire);await waiting(s2,[s1],'C11');await s1.exec('commit;');const y=await p;await s2.exec('commit;');assert(parse(reverse?y:x).outcome===(reverse?'CONFLICT':'APPLIED'),'C11 post-lock reread');record('C11-staff-retirement-'+reverse,{first:x,second:y});c.role(`update public.staff set is_active=true where id=${q(ids.staff)};`,'restore-synthetic-staff');
  }finally{await s1.end();await s2.end();}
 }
 for(const kind of ['mapping','duration','location'])for(const reverse of [false,true]){
  const a=await create();const desired=kind==='duration'?[ids.location,ids.service,ids.newStaff]:[ids.location2,ids.service,ids.staff];
  const edit=call('revise_booking_schedule_v2',h(a).concat([kind==='duration'?'REASSIGN_STAFF':'REASSIGN_LOCATION',...desired,a.start,a.end,null].map(q),['array[]::uuid[]']));
  const change=kind==='mapping'?`delete from public.staff_locations where staff_id=${q(ids.staff)} and location_id=${q(ids.location2)};`:kind==='duration'?`update public.staff_services set duration_override_minutes=45 where staff_id=${q(ids.newStaff)} and service_id=${q(ids.service)};`:`update public.locations set is_active=false where id=${q(ids.location2)};`;
  await pair('C11-'+kind+'-'+reverse,reverse?change+"select json_build_object('changed',true);":edit,reverse?edit:change+"select json_build_object('changed',true);",(x,y)=>assert((reverse?y:x).outcome===(reverse?'CONFLICT':'APPLIED'),'C11 fresh '+kind));
  c.role(kind==='mapping'?`insert into public.staff_locations(staff_id,location_id) values(${q(ids.staff)},${q(ids.location2)});`:kind==='duration'?`update public.staff_services set duration_override_minutes=30 where staff_id=${q(ids.newStaff)} and service_id=${q(ids.service)};`:`update public.locations set is_active=true where id=${q(ids.location2)};`,'restore-catalog');
 }
 // Deliberate incompatible administrator order: bounded deadlock, no committed effect.
 {
  const a=await create();const before=moneyDigest();const s1=await sessions.open('C11-reverse-admin').begin(),s2=await sessions.open('C11-reverse-edit').begin();try{
   await s1.exec(`update public.staff_services set duration_override_minutes=45 where staff_id=${q(ids.newStaff)} and service_id=${q(ids.service)};`);
   const edit=call('revise_booking_schedule_v2',h(a).concat(['REASSIGN_STAFF',ids.location,ids.service,ids.newStaff,a.start,a.end,null].map(q),['array[]::uuid[]']));
   const p=s2.exec(edit);await waiting(s2,[s1],'C11-incompatible-admin');
   const admin=s1.exec(`select id from public.commerce_payment_attempts where id=${q(a.attempt)} for update;`);
   const results=await Promise.all([p,admin]);await new Promise(r=>setTimeout(r,20));assert((s1.errorText()+s2.errorText()).includes('40P01'),'C11 expected bounded deadlock missing');
   await s1.exec('rollback;');await s2.exec('rollback;');assert(state(a).operational_revision===0&&moneyDigest()===before,'C11 deadlock rollback');record('C11 incompatible admin order bounded 40P01',{results,errors:s1.errorText()+s2.errorText()});
  }finally{await s1.end();await s2.end();}
 }
 summary.cases.C11='PASS';
 {
  const a=await create(),before=moneyDigest();const s1=await sessions.open('D13-lock-holder').begin(),s2=await sessions.open('D13-lock-timeout').begin();try{
   await s1.exec(`select id from public.appointments where id=${q(a.app)} for no key update;`);
   const p=s2.exec(notes(a));await waiting(s2,[s1],'D13-lock-timeout');await p;await new Promise(r=>setTimeout(r,20));assert(s2.errorText().includes('55P03'),'lock timeout category');
   await s2.exec('rollback;');await s1.exec('rollback;');assert(state(a).operational_revision===0&&moneyDigest()===before,'lock timeout partial effect');record('D13 bounded lock timeout',{errors:s2.errorText()});
  }finally{await s1.end();await s2.end();}
  const s=await sessions.open('D13-statement-timeout').begin();try{
   await s.exec(notes(a));await s.exec('set local statement_timeout=50;select pg_sleep(0.2);');await new Promise(r=>setTimeout(r,20));assert(s.errorText().includes('57014'),'statement timeout category');await s.exec('rollback;');assert(state(a).operational_revision===0&&moneyDigest()===before,'statement timeout partial effect');record('D13 statement timeout after mutation rolls back',{errors:s.errorText()});
  }finally{await s.end();}
 }

 // Repeated cancellation holds NO KEY UPDATE, compatible with real FK KEY SHARE.
 {
  const a=await create();assert(c.vclose(a).outcome==='APPLIED','D03 cancel seed');a.revision++;
  const before=moneyDigest(),s1=await sessions.open('D03-noop-cancel').begin(),s2=await sessions.open('D03-key-share').begin();
  try{assert(parse(await s1.exec(cancel(a))).outcome==='NO_CHANGE','D03 repeat cancel');
   const result=await s2.exec(`select json_build_object('id',id) from public.appointments where id=${q(a.app)} for key share;`);
   assert(parse(result).id===a.app&&!s2.errorText(),'D03 strong parent lock upgrade');await s2.exec('commit;');await s1.exec('commit;');
   assert(moneyDigest()===before&&state(a).operational_revision===1,'D03 noop effect');record('D03 repeated cancellation does not upgrade parent lock',{result});
  }finally{await s1.end();await s2.end();}
 }
 summary.cases.D03='PASS';
 // Abrupt client loss after the parent/permit effect, but before COMMIT.
 {
  const a=await create(),before=moneyDigest(),s=await sessions.open('D14-abrupt-client-loss').begin();
  assert(parse(await s.exec(notes(a))).outcome==='APPLIED','D14 precommit effect');await s.abandon();
  for(let i=0;i<100;i++){if(!c.one(`select exists(select 1 from pg_stat_activity where pid=${s.pid}) alive`,'D14-backend-drain').alive)break;await new Promise(r=>setTimeout(r,20));}
  assert(!c.one(`select exists(select 1 from pg_stat_activity where pid=${s.pid}) alive`,'D14-drained').alive,'D14 backend not drained');
  const journal=c.one(`select count(*)::int n from booking_lifecycle_private.appointment_mutations where appointment_id=${q(a.app)}`,'D14-no-uncommitted-journal');
  assert(state(a).operational_revision===0&&journal.n===0&&moneyDigest()===before,'D14 abandoned transaction survived');record('D14 abrupt client loss before COMMIT rolls back permit and parent',{journal,pid:s.pid});
 }
 summary.cases.D13='PASS';
 log({kind:'concurrency-partial',financial_digest:moneyDigest()});
}
