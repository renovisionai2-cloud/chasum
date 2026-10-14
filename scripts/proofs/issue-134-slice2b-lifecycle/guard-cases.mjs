import {randomUUID} from 'node:crypto';

export async function runGuards({ctx:c,summary,log}) {
 const {ids,q,run,role,rpc,one,create,h,state,assert,record,moneyDigest}=c;
 const error=(statement,code,label,principal='service_role')=>{
  run(`set role ${principal};do $proof$ begin begin ${statement}; exception when others then if sqlstate=${q(code)} then raise notice 'EXPECTED_SQLSTATE:% MESSAGE:%',sqlstate,sqlerrm;return;else raise;end if;end;raise exception 'EXPECTED_ERROR_NOT_RAISED';end $proof$;`,label);record(label,{expected_sqlstate:code});
 };
 const journalDigest=()=>one(`select md5(coalesce(jsonb_agg(to_jsonb(x) order by business_id,appointment_id,mutation_id),'[]')::text) digest from booking_lifecycle_private.appointment_mutations x`,'journal-digest').digest;
 const close=(a,reason,expected=null,replacement=null,actor=ids.owner)=>rpc('close_booking_operation_v1',[ids.business,a.op,actor,reason,expected,replacement,reason==='APPOINTMENT_CANCELLED'].map(q),'v1-close');
 for(const reason of ['PRICING_CHANGED','SLOT_CONFLICT','OPERATOR_ABANDONED']){
  const a=await create({payment:true,persist:false});let j=journalDigest();
  let r=close(a,reason);assert(r.outcome==='CLOSED'&&!r.recorded&&r.appointment_id===null,'v1 no-parent close');
  const digest=moneyDigest();r=close(a,reason);assert(r.outcome==='EXISTING'&&journalDigest()===j&&moneyDigest()===digest,'v1 repeated no-parent fence');record('D12 '+reason+' no-parent fence / EXISTING',{r});
  const b=await create();j=journalDigest();const bd=moneyDigest();r=close(b,reason);assert(r.outcome==='RECOVERY_REQUIRED'&&journalDigest()===j&&moneyDigest()===bd,'v1 existing parent recovery');record('D12 '+reason+' existing-parent RECOVERY_REQUIRED',{r});
 }
 for(const reason of ['APPOINTMENT_CANCELLED','CUSTOMER_REASSIGNED']){
  const a=await create();let r=close(a,reason,reason==='CUSTOMER_REASSIGNED'?ids.customer:null,reason==='CUSTOMER_REASSIGNED'?ids.replacement:null);
  assert(r.outcome==='CLOSED'&&state(a).operational_revision===1,'v1 close effect');const d=moneyDigest(),j=journalDigest();
  r=close(a,reason,reason==='CUSTOMER_REASSIGNED'?ids.replacement:null,reason==='CUSTOMER_REASSIGNED'?ids.replacement:null);
  assert(r.outcome==='EXISTING'&&journalDigest()===j&&moneyDigest()===d,'v1 no-op');record('D12 '+reason+' effect / historical EXISTING',{r});
  error(`perform * from public.close_booking_operation_v1(${[ids.business,a.op,ids.admin,reason,reason==='CUSTOMER_REASSIGNED'?ids.replacement:null,reason==='CUSTOMER_REASSIGNED'?ids.customer:null,reason==='APPOINTMENT_CANCELLED'].map(q).join(',')})`,'42501','v1-noncreator');
 }
 for(const config of [{bind:false},{payment:true},{resources:[ids.resource,ids.newResource]}]){
  const a=await create(config);error(`delete from public.appointments where id=${q(a.app)}`,'23514','linked-retention');
 }
 // Real owner DELETE policy, no disabled FK or forced trigger order.
 run(`begin;set local role authenticated;set local request.jwt.claim.sub=${q(ids.owner)};
 do $proof$ begin begin delete from public.businesses where id=${q(ids.business)};exception when integrity_constraint_violation then if sqlstate<>'23514' or sqlerrm<>'LIFECYCLE_LINKED_HISTORY_RETAINED' then raise;end if;raise notice 'ACTUAL_BUSINESS_RETENTION:%:%',sqlstate,sqlerrm;return;end;raise exception 'BUSINESS_DELETE_UNEXPECTED_SUCCESS';end $proof$;rollback;`,'business-owner-delete');
 record('D08 Business cascade reached the linked-history guard; exact refusal observed',{});
 const a=await create({resources:[ids.resource]});
 error(`insert into public.appointment_resources(appointment_id,resource_id) values(${q(a.app)},${q(ids.newResource)})`,'23514','resource-unadmitted-insert');
 error(`update public.appointment_resources set resource_id=${q(ids.newResource)} where appointment_id=${q(a.app)}`,'23514','resource-direct-update');
 for(const revision of [2,9223372036854775807n])error(`update public.appointments set operational_revision=${revision} where id=${q(a.app)}`,'23514','revision-skip-'+revision);
 error(`perform * from public.revise_booking_notes_v2(${h(a).concat("repeat('x',10001)").join(',')})`,'22023','notes-bound');
 // Each error is injected only in a rollback-only local test transaction.
 for(const target of ['journal','parent','child','final','cache']){
  const rel=target==='journal'?'booking_lifecycle_private.appointment_mutations':['parent','final','cache'].includes(target)?'public.appointments':'public.appointment_resources';
  const event=['parent','final','cache'].includes(target)?'update':target==='child'?'delete':'insert';
  const args=target==='child'?h(a).concat(['RESOURCES',ids.location,ids.service,ids.staff,a.start,a.end,null].map(q),'array[]::uuid[]'):h(a).concat(q('Injected failure'));
  const name=target==='child'?'revise_booking_schedule_v2':'revise_booking_notes_v2';
  const before={money:moneyDigest(),journal:journalDigest(),state:state(a)};
  run(`begin;create function pg_temp.inject_failure() returns trigger language plpgsql as $inject$ begin ${target==='cache'?"new.amount_paid_cents:=coalesce(new.amount_paid_cents,0)+100;return new;":target==='final'?"new.notes:='Tampered after permit';return new;":"raise exception 'SYNTHETIC_INJECTION' using errcode='P0002';"}end $inject$;
 create trigger zzz_local_failure before ${event} on ${rel} for each row execute function pg_temp.inject_failure();
 set local role service_role;do $proof$ begin begin perform * from public.${name}(${args.join(',')});exception when ${['final','cache'].includes(target)?'check_violation':'no_data_found'} then return;end;raise exception 'INJECTION_NOT_OBSERVED';end $proof$;rollback;`,'inject-'+target);
  assert(moneyDigest()===before.money&&journalDigest()===before.journal&&JSON.stringify(state(a))===JSON.stringify(before.state),'injected rollback changed state');record('D13 '+target+' injection atomic rollback',before);
 }
 for(const mode of ['missing','wrong-extra']){
  const x=await create({resources:[ids.resource]}),before=moneyDigest(),j=journalDigest();
  const args=h(x).concat(['RESOURCES',ids.location,ids.service,ids.staff,x.start,x.end,null].map(q),[`array[${q(ids.newResource)}]::uuid[]`]);
  run(`begin;create function pg_temp.corrupt_child_delta() returns trigger language plpgsql as $body$ begin ${mode==='missing'?'return null;':`new.resource_id:=${q(ids.resource)}::uuid;return new;`}end $body$;
 create trigger zzz_local_child_delta before insert on public.appointment_resources for each row execute function pg_temp.corrupt_child_delta();set local role service_role;
 do $proof$ begin begin perform * from public.revise_booking_schedule_v2(${args.join(',')});exception when check_violation then if sqlerrm<>'LIFECYCLE_RESOURCE_FINAL_STATE' then raise;end if;return;end;raise exception 'CHILD_MISMATCH_NOT_DETECTED';end $proof$;rollback;`,'child-set-'+mode);
  assert(state(x).operational_revision===0&&moneyDigest()===before&&journalDigest()===j,'child set rollback');record('D10 '+mode+' child delta refused and rolled back',{});
 }
 // Mutation permit corruption: transaction, actor, tenant/link and image do not become authority.
 const changed=rpc('revise_booking_notes_v2',h(a).concat(q('real permit')),'permit-seed');assert(changed.outcome==='APPLIED','permit seed');a.revision++;
 error(`update public.appointments set operational_revision=0 where id=${q(a.app)}`,'23514','revision-reset-after-effect');
 error(`delete from public.appointment_resources where appointment_id=${q(a.app)}`,'23514','old-permit-child-reuse');
 const other=await create();error(`update public.appointment_resources set appointment_id=${q(other.app)} where appointment_id=${q(a.app)}`,'23514','linked-child-reparent');
 const cols=one(`select array_agg(attname order by attnum) names from pg_attribute where attrelid='booking_lifecycle_private.appointment_mutations'::regclass and attnum>0 and not attisdropped`,'journal-columns').names;
 for(const field of ['transaction_id','actor_id','business_id','appointment_id','operation_id','original_attempt_id','command','after_image','allowed_fields','result_revision']){
  const key=randomUUID();const overrides={transaction_id:"'1'::xid8",actor_id:q(ids.otherOwner)+'::uuid',business_id:q(ids.other)+'::uuid',appointment_id:q(randomUUID())+'::uuid',operation_id:q(randomUUID())+'::uuid',original_attempt_id:q(randomUUID())+'::uuid',command:"'STATUS'",after_image:"'{}'::jsonb",allowed_fields:"array['price_cents']::text[]",result_revision:'m.result_revision+1'};
  const normalized={mutation_id:q(key)+'::uuid',transaction_id:'pg_current_xact_id()',created_at:'transaction_timestamp()',expected_revision:'m.result_revision',observed_revision:'m.result_revision',result_revision:'m.result_revision',effect_revision:'null::bigint',outcome:"'NO_CHANGE'",before_image:'m.after_image',after_image:'m.after_image',before_resource_ids:'m.after_resource_ids',after_resource_ids:'m.after_resource_ids',allowed_fields:"'{}'::text[]",request:`jsonb_build_object('business_id',m.business_id,'appointment_id',m.appointment_id,'operation_id',m.operation_id,'mutation_id',${q(key)},'actor_id',m.actor_id,'expected_revision',m.result_revision,'reason',m.reason,'origin',m.origin,'command',m.command,'notes',m.after_image->'notes')`};
  const values=cols.map(k=>k===field?overrides[field]:(normalized[k]??'m.'+k));
  error(`insert into booking_lifecycle_private.appointment_mutations(${cols.join(',')}) select ${values.join(',')} from booking_lifecycle_private.appointment_mutations m where m.appointment_id=${q(a.app)} limit 1`,'23514','isolated-invalid-permit-'+field);
 }
 const multi=await create();let before=moneyDigest();
 const first=h(multi).concat(q('one'));multi.revision=1;const second=h(multi).concat(q('two'));
 role(`begin;select * from public.revise_booking_notes_v2(${first.join(',')});select * from public.revise_booking_notes_v2(${second.join(',')});select * from public.revise_booking_notes_v2(${first.join(',')});commit;`,'same-transaction-successors');
 assert(state(multi).operational_revision===2&&state(multi).notes==='two'&&moneyDigest()===before,'same transaction succession');record('D09 two successive keys and replay in one xid8',{});
 const mismatch=await create();error(`perform * from public.close_booking_operation_v1(${[ids.business,mismatch.op,ids.owner,'CUSTOMER_REASSIGNED',ids.replacement,ids.customer,false].map(q).join(',')})`,'40001','v1-current-customer-mismatch');
 const repeated=await create();assert(close(repeated,'CUSTOMER_REASSIGNED',ids.customer,ids.replacement).outcome==='CLOSED','v1 first correction');assert(close(repeated,'CUSTOMER_REASSIGNED',ids.replacement,ids.customer).outcome==='EXISTING'&&state(repeated).operational_revision===2,'v1 EXISTING actual effect');record('D12 repeated CLOSED v1 correction is an actual revision',{});
 const unbound=await create({persist:false});
 error(`insert into public.appointments(business_id,customer_id,location_id,service_id,staff_id,start_time,end_time,status,notes,price_cents,tax_cents,deposit_cents,booking_operation_id) select business_id,${q(ids.replacement)},location_id,service_id,staff_id,requested_start,requested_end,requested_status::public.appointment_status,appointment_notes,subtotal_cents,tax_cents,deposit_required_cents,id from public.commerce_booking_operations where id=${q(unbound.op)}`,'23514','original-insert-customer-binding');
 for(const [table,id] of [['commerce_booking_operations',unbound.op],['commerce_payment_attempts',unbound.attempt]]){
  run(`set role service_role;do $proof$ begin begin update public.${table} set customer_id=${q(ids.replacement)} where id=${q(id)};exception when insufficient_privilege or check_violation then raise notice 'IMMUTABLE_IDENTITY_REFUSAL:%:%',sqlstate,sqlerrm;return;end;raise exception 'IMMUTABILITY_NOT_ENFORCED';end $proof$;`,'immutable-'+table);
 }
 record('K-5 A/B/C original customer binding and operation/attempt immutable identity',{});
 for(const config of [{bind:false},{payment:true},{payment:true,settled:true},{closed:true}]){
  const x=await create(config);if(config.settled)assert(c.commit(x).recorded,'retention paid fixture');if(config.closed)assert(c.vclose(x).outcome==='APPLIED','retention closed fixture');
  const before=moneyDigest();run(`begin;set local role authenticated;set local request.jwt.claim.sub=${q(ids.owner)};do $proof$ begin begin delete from public.appointments where id=${q(x.app)};exception when check_violation then if sqlerrm<>'LIFECYCLE_LINKED_HISTORY_RETAINED' then raise;end if;return;end;raise exception 'DELETE_NOT_REFUSED';end $proof$;rollback;`,'authenticated-linked-retention');assert(moneyDigest()===before&&state(x)!==null,'retention changed graph');record('D08 authenticated linked DELETE variant',{config,appointment:x.app});
 }
 const legacyBusiness=randomUUID(),legacyOwner=randomUUID(),legacyCustomer=randomUUID(),legacyService=randomUUID(),legacyStaff=randomUUID(),legacyAp=randomUUID(),legacyLocation=randomUUID();
 run(`insert into auth.users(id,email) values(${q(legacyOwner)},'legacy-owner@local.invalid');insert into public.businesses(id,owner_id,name,slug) values(${q(legacyBusiness)},${q(legacyOwner)},'Synthetic legacy Business','legacy-'||${q(legacyBusiness)});
 insert into public.locations(id,business_id,name,slug) values(${q(legacyLocation)},${q(legacyBusiness)},'Legacy location','legacy');insert into public.customers(id,business_id,name,email) values(${q(legacyCustomer)},${q(legacyBusiness)},'Legacy customer','legacy@local.invalid');insert into public.services(id,business_id,location_id,name,duration_minutes,price) values(${q(legacyService)},${q(legacyBusiness)},${q(legacyLocation)},'Legacy service',30,25);insert into public.staff(id,business_id,location_id,name) values(${q(legacyStaff)},${q(legacyBusiness)},${q(legacyLocation)},'Legacy staff');insert into public.appointments(id,business_id,customer_id,service_id,staff_id,location_id,start_time,end_time,status) values(${[legacyAp,legacyBusiness,legacyCustomer,legacyService,legacyStaff,legacyLocation].map(q).join(',')},now()+interval '1100 days',now()+interval '1100 days 30 minutes','confirmed');`,'unlinked-business-fixture');
 run(`begin;set local role authenticated;set local request.jwt.claim.sub=${q(legacyOwner)};do $proof$ begin begin delete from public.businesses where id=${q(legacyBusiness)};raise notice 'LEGACY_BUSINESS_DELETE_SUCCEEDED';exception when integrity_constraint_violation then raise notice 'LEGACY_BUSINESS_DELETE_REFUSAL:%:%',sqlstate,sqlerrm;end;end $proof$;rollback;`,'unlinked-business-delete-characterization');
 assert(one(`select count(*)::int n from public.appointments where id=${q(legacyAp)}`,'unlinked-business-restored').n===1,'legacy Business rollback');record('D08 separate unlinked Business deletion characterized under real policies/FKs',{});
 // Rollback-only negative RLS fixture permits reaching the child guard while the real parent remains hidden.
 // No FK is changed, and the additional child policy never survives this test transaction.
 const hiddenBefore=moneyDigest();run(`begin;create policy d1_local_child_probe on public.appointment_resources for all to authenticated using(true) with check(true);
 set local role authenticated;set local request.jwt.claim.sub=${q(ids.otherOwner)};
 do $proof$ begin if exists(select 1 from public.appointments where id=${q(a.app)}) then raise exception 'PARENT_NOT_HIDDEN';end if;
 begin delete from public.appointment_resources where appointment_id=${q(a.app)};exception when check_violation then if sqlerrm<>'LIFECYCLE_PARENT_UNKNOWN' then raise;end if;raise notice 'RLS_HIDDEN_PARENT_REFUSED';return;end;raise exception 'HIDDEN_PARENT_DELETE_ACCEPTED';end $proof$;rollback;`,'RLS-hidden-parent');
 assert(moneyDigest()===hiddenBefore&&one(`select count(*)::int n from public.appointment_resources where appointment_id=${q(a.app)}`,'hidden-child-retained').n===1,'hidden parent cascade escape');record('D10 RLS-hidden parent is not physical absence',{});
 // Observe RI trigger execution principal without weakening any FK or guard.
 const legacy=randomUUID();
 role(`insert into public.appointments(id,business_id,customer_id,location_id,service_id,staff_id,start_time,end_time,status) values(${[legacy,ids.business,ids.customer,ids.location,ids.service,ids.staff].map(q).join(',')},now()+interval '1000 days',now()+interval '1000 days 30 minutes','confirmed');insert into public.appointment_resources(appointment_id,resource_id) values(${q(legacy)},${q(ids.resource)});`,'RI-fixture');
 run(`begin;create function public.d1_local_principal_probe() returns trigger language plpgsql security invoker as $body$ begin raise notice 'RI_PRINCIPAL:%',json_build_object('user',current_user,'operation',tg_op,'parent',old.appointment_id);return old;end $body$;
 create trigger zzz_local_principal_probe before delete on public.appointment_resources for each row execute function public.d1_local_principal_probe();
 set local role authenticated;set local request.jwt.claim.sub=${q(ids.owner)};
 delete from public.appointments where id=${q(legacy)};reset role;
 do $proof$ begin if exists(select 1 from public.appointment_resources where appointment_id=${q(legacy)}) then raise exception 'orphan';end if;end $proof$;rollback;`,'RI-owner-cascade-principal');
 assert(one(`select count(*)::int n from public.appointment_resources where appointment_id=${q(legacy)}`,'RI-restored').n===1,'RI rollback');record('D10 authenticated legacy DELETE cascade principal observed; instrumentation rolled back',{});
 for(const principal of ['anon','authenticated','service_role']){
  error('alter table public.appointments disable trigger appointments_booking_operation_guard','42501','no-disable-'+principal,principal);
 }
 log({kind:'guard-cases-complete',money_digest:moneyDigest(),journal_digest:journalDigest()});
 summary.cases.D12='PASS';
 summary.cases.D08='PASS';
 summary.cases.D10='PASS';
}
