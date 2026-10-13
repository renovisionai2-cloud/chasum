"""Generate the single reviewed amendment; no SQL execution or hosted access."""
from pathlib import Path
import hashlib,re
import runpy
CAT=runpy.run_path(str(Path(__file__).with_name("catalog-assertions.py")))
ROOT=Path(__file__).resolve().parents[3]
TARGET=ROOT/'supabase/migrations/20261013201608_issue_134_slice2b_lifecycle_amendment.sql'
D1=ROOT/'docs/reviews/issue-134-slice2b-d1-lifecycle-sql-contract-freeze.md'
assert hashlib.sha256(D1.read_bytes()).hexdigest()=='0caf4f79ce43088520313728b4d3cd77758b0aa066f8f2f776f4714f9ebff6ed'
parts=[]
def emit(s):parts.append(s.strip()+'\n')
emit('''-- Slice 2B D1. LOCAL IMPLEMENTATION ONLY; hosted application separately gated.
-- Contract 0caf4f79ce43088520313728b4d3cd77758b0aa066f8f2f776f4714f9ebff6ed.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
do $pre$
begin
 if current_setting('server_version_num')::int / 10000 <> 17 then
  raise exception 'LIFECYCLE_POSTGRES_17_REQUIRED' using errcode='55000';
 end if;
 if to_regnamespace('booking_lifecycle_private') is not null
    or exists(select 1 from pg_attribute where attrelid='public.appointments'::regclass and attname='operational_revision' and not attisdropped)
    or exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('transition_booking_appointment_v2','revise_booking_schedule_v2','revise_booking_notes_v2','close_booking_appointment_v2','read_booking_appointment_mutation_v2')) then
  raise exception 'LIFECYCLE_OBJECT_COLLISION' using errcode='42710';
 end if;
 if not exists(select 1 from pg_roles where rolname='service_role' and rolbypassrls and not rolsuper)
    or exists(select 1 from pg_roles where rolname in ('anon','authenticated','authenticator') and (rolbypassrls or rolsuper)) then
  raise exception 'LIFECYCLE_ROLE_POSTURE_INVALID' using errcode='55000';
 end if;
 if not exists(select 1 from pg_constraint where conrelid='public.appointment_resources'::regclass and conname='appointment_resources_appointment_id_fkey' and contype='f' and confrelid='public.appointments'::regclass and confdeltype='c' and convalidated and not condeferrable)
    or exists(select 1 from public.appointment_resources r left join public.appointments a on a.id=r.appointment_id where a.id is null) then
  raise exception 'LIFECYCLE_RESOURCE_FK_INVALID' using errcode='55000';
 end if;
 if exists(select 1 from pg_class c join pg_roles r on r.oid=c.relowner where c.oid in ('public.appointments'::regclass,'public.appointment_resources'::regclass) and (not (r.rolsuper or r.rolbypassrls) or not has_table_privilege(r.oid,'public.appointments','SELECT'))) then
  raise exception 'LIFECYCLE_PARENT_VISIBILITY_REQUIRED' using errcode='55000';
 end if;
 if has_schema_privilege('service_role','public','CREATE')
    or has_parameter_privilege('service_role','session_replication_role','SET')
    or has_table_privilege('service_role','public.appointments','TRUNCATE')
    or has_table_privilege('service_role','public.appointment_resources','TRUNCATE') then
  raise exception 'LIFECYCLE_UNSAFE_OPERATIONAL_CAPABILITY' using errcode='55000';
 end if;
 if not exists(select 1 from pg_proc where oid=to_regprocedure('public.validate_appointment_slot(uuid,uuid,uuid,timestamptz,timestamptz,uuid,uuid)') and provolatile='s' and prosecdef and prorettype='void'::regtype and proconfig=array['search_path=public']) then
  raise exception 'LIFECYCLE_VALIDATOR_CONTRACT_DRIFT' using errcode='55000';
 end if;
end $pre$;

alter table public.appointments add column operational_revision bigint not null default 0,
 add constraint appointments_operational_revision_check check(operational_revision>=0);
create schema booking_lifecycle_private;
revoke all on schema booking_lifecycle_private from public,anon,authenticated,service_role;
grant usage on schema booking_lifecycle_private to service_role;
create table booking_lifecycle_private.appointment_mutations(
 business_id uuid not null, appointment_id uuid not null, operation_id uuid not null,
 mutation_id uuid not null, actor_id uuid not null, original_attempt_id uuid not null,
 origin text not null, command text not null, transaction_id xid8 not null,
 expected_revision bigint not null, observed_revision bigint not null, result_revision bigint not null,
 effect_revision bigint, outcome text not null, reason text not null, request jsonb not null,
 before_image jsonb not null, after_image jsonb not null,
 before_resource_ids uuid[] not null, after_resource_ids uuid[] not null,
 allowed_fields text[] not null, created_at timestamptz not null default transaction_timestamp(),
 constraint appointment_mutations_pkey primary key(business_id,appointment_id,mutation_id),
 constraint appointment_mutations_business_fk foreign key(business_id) references public.businesses(id) on delete restrict,
 constraint appointment_mutations_appointment_fk foreign key(appointment_id,business_id) references public.appointments(id,business_id) on delete restrict,
 constraint appointment_mutations_operation_fk foreign key(operation_id,business_id) references public.commerce_booking_operations(id,business_id) on delete restrict,
 constraint appointment_mutations_attempt_fk foreign key(original_attempt_id,business_id) references public.commerce_payment_attempts(id,business_id) on delete restrict,
 constraint appointment_mutations_revision_check check(
   expected_revision>=0 and expected_revision=observed_revision and result_revision>=0 and
   ((outcome='APPLIED' and observed_revision<9223372036854775807 and result_revision-observed_revision=1 and effect_revision is not null and effect_revision=result_revision)
    or (outcome='NO_CHANGE' and expected_revision=result_revision and effect_revision is null and before_image=after_image and before_resource_ids=after_resource_ids and allowed_fields='{}'::text[]))),
 constraint appointment_mutations_shape_check check(
  origin in ('V2','V1_CLOSE') and outcome in ('APPLIED','NO_CHANGE') and command in
   ('STATUS','NOTES','RESCHEDULE','RESIZE','REASSIGN_STAFF','REASSIGN_LOCATION','RESOURCES','SERVICE_CORRECTION','CANCEL','REASSIGN_CUSTOMER')
  and reason=btrim(reason) and char_length(reason) between 1 and 500
  and jsonb_typeof(request)='object' and jsonb_typeof(before_image)='object' and jsonb_typeof(after_image)='object'
  and coalesce(array_ndims(before_resource_ids),1)=1 and coalesce(array_ndims(after_resource_ids),1)=1
  and array_position(before_resource_ids,null) is null and array_position(after_resource_ids,null) is null
  and array_position(allowed_fields,null) is null and isfinite(created_at))
);
create unique index appointment_mutations_effect_key on booking_lifecycle_private.appointment_mutations(business_id,appointment_id,effect_revision) where effect_revision is not null;
create index appointment_mutations_transaction_idx on booking_lifecycle_private.appointment_mutations(transaction_id,business_id,appointment_id,observed_revision);
alter table booking_lifecycle_private.appointment_mutations enable row level security;
revoke all on booking_lifecycle_private.appointment_mutations from public,anon,authenticated,service_role;
grant select,insert on booking_lifecycle_private.appointment_mutations to service_role;
''')
parts[0]=parts[0].replace('alter table public.appointments add column',CAT['pre'](ROOT)+'\n\nalter table public.appointments add column')
KEYS=['id','business_id','booking_operation_id','customer_id','location_id','service_id','staff_id','start_time','end_time','status','notes','room_id','price_cents','tax_cents','deposit_cents','operational_revision']
FIELDS={'STATUS':['status'],'NOTES':['notes'],'RESCHEDULE':['start_time','end_time'],'RESIZE':['end_time'],'REASSIGN_STAFF':['staff_id','start_time','end_time'],'REASSIGN_LOCATION':['location_id','staff_id','room_id','start_time','end_time','resource_ids'],'RESOURCES':['room_id','resource_ids'],'SERVICE_CORRECTION':['service_id','staff_id','start_time','end_time','room_id','resource_ids'],'CANCEL':['status'],'REASSIGN_CUSTOMER':['customer_id']}
def arr(xs):return 'array['+','.join("'"+x+"'" for x in sorted(xs))+']::text[]'
def image(row):
 def value(k):
  if k in ('start_time','end_time'):return f'''to_char({row}.{k} at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')'''
  return f'{row}.{k}'
 return 'jsonb_build_object('+','.join("'"+k+"',"+value(k) for k in KEYS)+')'
allowed_case='case '+''.join(f"when new.command='{cmd}' then {arr(fs+['operational_revision'])} " for cmd,fs in FIELDS.items())+"else '{}'::text[] end"
emit(f'''create function booking_lifecycle_private.guard_appointment_mutation_v2() returns trigger
language plpgsql volatile security invoker set search_path=pg_catalog,pg_temp as $g$
declare a public.appointments%rowtype; resources uuid[]; changed text[]; expected_fields text[]; k text; v jsonb;
begin
 if tg_op<>'INSERT' then raise exception 'LIFECYCLE_JOURNAL_APPEND_ONLY' using errcode='23514'; end if;
 if current_user<>'service_role' then raise exception 'LIFECYCLE_NOT_AUTHORIZED' using errcode='42501'; end if;
 if new.transaction_id is distinct from pg_current_xact_id() or new.created_at is distinct from transaction_timestamp() then raise exception 'LIFECYCLE_JOURNAL_TRANSACTION' using errcode='23514'; end if;
 select * into a from public.appointments where id=new.appointment_id and business_id=new.business_id;
 if not found or a.booking_operation_id is distinct from new.operation_id or a.operational_revision is distinct from new.observed_revision then raise exception 'LIFECYCLE_JOURNAL_IDENTITY' using errcode='23514'; end if;
 if not exists(select 1 from public.commerce_payment_attempts t where t.id=new.original_attempt_id and t.business_id=new.business_id and t.booking_operation_id=new.operation_id)
    or not exists(select 1 from public.businesses b where b.id=new.business_id and (b.owner_id=new.actor_id or exists(select 1 from public.business_members m where m.business_id=b.id and m.user_id=new.actor_id and m.role in ('owner','admin')))) then raise exception 'LIFECYCLE_JOURNAL_AUTHORITY' using errcode='23514'; end if;
 if not (new.request @> jsonb_build_object('business_id',new.business_id,'appointment_id',new.appointment_id,'operation_id',new.operation_id,'mutation_id',new.mutation_id,'actor_id',new.actor_id,'expected_revision',new.expected_revision,'reason',new.reason,'origin',new.origin,'command',new.command)) then raise exception 'LIFECYCLE_JOURNAL_REQUEST_IDENTITY' using errcode='23514'; end if;
 if new.before_image is distinct from {image('a')} then raise exception 'LIFECYCLE_JOURNAL_PREIMAGE' using errcode='23514'; end if;
 if (select array_agg(x order by x) from jsonb_object_keys(new.after_image) x) is distinct from {arr(KEYS)} then raise exception 'LIFECYCLE_JOURNAL_KEYS' using errcode='23514'; end if;
 select coalesce(array_agg(resource_id order by resource_id),'{{}}'::uuid[]) into resources from public.appointment_resources where appointment_id=a.id;
 if resources is distinct from new.before_resource_ids
    or new.after_resource_ids is distinct from array(select distinct x from unnest(new.after_resource_ids) x order by x) then raise exception 'LIFECYCLE_JOURNAL_RESOURCE_SNAPSHOT' using errcode='23514'; end if;
 if char_length(new.before_image->>'notes')>10000 or char_length(new.after_image->>'notes')>10000 then raise exception 'LIFECYCLE_NOTES_OVERSIZE_HOLD' using errcode='22023'; end if;
 -- Decode against the actual row type, then reconstruct exact normalized types/format.
 select * into a from jsonb_populate_record(a,new.after_image);
 if new.after_image is distinct from {image('a')} or not isfinite(a.start_time) or not isfinite(a.end_time) or a.end_time<=a.start_time then raise exception 'LIFECYCLE_JOURNAL_IMAGE_FORMAT' using errcode='23514'; end if;
 select coalesce(array_agg(x order by x),'{{}}'::text[]) into changed from (
   select x from jsonb_object_keys(new.before_image) x where new.before_image->x is distinct from new.after_image->x
   union all select 'resource_ids' where new.before_resource_ids is distinct from new.after_resource_ids) q;
 expected_fields:={allowed_case};
 if changed is distinct from new.allowed_fields or not changed <@ expected_fields
    or (new.outcome='APPLIED' and (cardinality(changed)<2 or not 'operational_revision'=any(changed)))
    or (new.before_image->>'operational_revision')::bigint is distinct from new.observed_revision
    or (new.after_image->>'operational_revision')::bigint is distinct from new.result_revision then raise exception 'LIFECYCLE_JOURNAL_FIELD_SET' using errcode='23514'; end if;
 if new.command='CANCEL' and new.after_image->>'status'<>'cancelled' then raise exception 'LIFECYCLE_CANCEL_TARGET' using errcode='23514'; end if;
 if new.before_image->>'status'='cancelled' and new.command not in ('NOTES','CANCEL') then raise exception 'LIFECYCLE_TERMINAL' using errcode='23514'; end if;
 return new;
end $g$;
''')
# Parent INSERT branch copied from the unchanged accepted source; maintenance is replaced.
source=(ROOT/'supabase/migrations/20261007203352_issue_134_durable_booking_operation.sql').read_text()
oldguard=source.split('create function public.guard_appointment_booking_operation_link_v1()')[1].split('create function public.bootstrap_booking_operation_v1')[0]
insert=oldguard[oldguard.index('  select *\n  into operation_row'):oldguard.index('  if new.customer_id is distinct')]
history="""exists(select 1 from public.commerce_transactions t where t.appointment_id=old.id)
 or exists(select 1 from public.commerce_refunds f where f.appointment_id=old.id or exists(select 1 from public.commerce_transactions t where t.id=f.transaction_id and t.appointment_id=old.id))"""
emit(f'''create or replace function public.guard_appointment_booking_operation_link_v1() returns trigger
language plpgsql volatile security invoker set search_path=pg_catalog,pg_temp as $g$
declare operation_row public.commerce_booking_operations%rowtype; expected_notes text; j record; n integer; old_image jsonb; new_image jsonb;
begin
 if tg_op='DELETE' then
  if old.booking_operation_id is not null then raise exception 'LIFECYCLE_LINKED_HISTORY_RETAINED' using errcode='23514'; end if;
  return old;
 end if;
 if tg_op='INSERT' then
  if new.operational_revision<>0 then raise exception 'LIFECYCLE_INITIAL_REVISION' using errcode='23514'; end if;
  if new.booking_operation_id is null then return new; end if;
 elsif old.booking_operation_id is null and new.booking_operation_id is null then
  if old.operational_revision<>0 or new.operational_revision<>0 then raise exception 'LIFECYCLE_LEGACY_REVISION' using errcode='23514'; end if;
  return new;
 end if;
 if tg_op='UPDATE' then
  if row(old.id,old.business_id,old.booking_operation_id) is distinct from row(new.id,new.business_id,new.booking_operation_id) or old.booking_operation_id is null then raise exception 'APPOINTMENT_BOOKING_OPERATION_IMMUTABLE' using errcode='23514'; end if;
  old_image:={image('old')}; new_image:={image('new')};
  if old_image=new_image then return new; end if;
 end if;
 if current_user<>'service_role' then raise exception 'BOOKING_OPERATION_SERVICE_ROLE_REQUIRED' using errcode='42501'; end if;
{insert}
 if new.operational_revision-old.operational_revision<>1 or old.operational_revision=9223372036854775807
    or row(old.price_cents,old.tax_cents,old.deposit_cents,old.amount_paid_cents,old.amount_refunded_cents,old.payment_status)
       is distinct from row(new.price_cents,new.tax_cents,new.deposit_cents,new.amount_paid_cents,new.amount_refunded_cents,new.payment_status) then raise exception 'LIFECYCLE_REVISION_OR_MONEY_CHANGE' using errcode='23514'; end if;
 select count(*) into n from booking_lifecycle_private.appointment_mutations m where m.transaction_id=pg_current_xact_id() and m.business_id=old.business_id and m.appointment_id=old.id and m.operation_id=old.booking_operation_id and m.outcome='APPLIED' and m.observed_revision=old.operational_revision and m.result_revision=new.operational_revision and m.before_image=old_image and m.after_image=new_image;
 if n<>1 then raise exception 'LIFECYCLE_EXACT_PERMIT_REQUIRED' using errcode='23514'; end if;
 select * into strict j from booking_lifecycle_private.appointment_mutations m where m.transaction_id=pg_current_xact_id() and m.business_id=old.business_id and m.appointment_id=old.id and m.effect_revision=new.operational_revision;
 if not exists(select 1 from public.businesses b where b.id=old.business_id and (b.owner_id=j.actor_id or exists(select 1 from public.business_members m where m.business_id=b.id and m.user_id=j.actor_id and m.role in ('owner','admin')))) then raise exception 'LIFECYCLE_AUTHORITY_CHANGED' using errcode='42501'; end if;
 if new.customer_id is distinct from old.customer_id then
  if j.command<>'REASSIGN_CUSTOMER' or old.status::text='cancelled' or operation_row.lifecycle_state<>'CLOSED' or operation_row.close_reason<>'CUSTOMER_REASSIGNED' or operation_row.replacement_customer_id is distinct from new.customer_id
     or {history}
     or exists(select 1 from public.commerce_payment_attempts t where t.id=j.original_attempt_id and (t.execution_state not in ('FAILED','SKIPPED') or t.recovery_disposition<>'DO_NOT_RETRY'))
     or not exists(select 1 from public.customers c where c.id=new.customer_id and c.business_id=new.business_id) then raise exception 'APPOINTMENT_LEDGER_CUSTOMER_REASSIGNMENT_FORBIDDEN' using errcode='23514'; end if;
 end if;
 if new.status::text='cancelled' and old.status::text<>'cancelled' and (j.command<>'CANCEL' or operation_row.lifecycle_state<>'CLOSED' or operation_row.close_reason<>'APPOINTMENT_CANCELLED') then raise exception 'LIFECYCLE_CANCEL_FENCE_REQUIRED' using errcode='23514'; end if;
 if array(select r.resource_id from public.appointment_resources r where r.appointment_id=old.id order by r.resource_id) is distinct from j.after_resource_ids then raise exception 'LIFECYCLE_RESOURCE_FINAL_STATE' using errcode='23514'; end if;
 return new;
end $g$;
''')
emit('''create function booking_lifecycle_private.guard_appointment_resource_v2() returns trigger
language plpgsql volatile security invoker set search_path=pg_catalog,pg_temp as $g$
declare a public.appointments%rowtype; b public.appointments%rowtype;
 op public.commerce_booking_operations%rowtype; j record; n integer; rid uuid; aid uuid;
begin
 aid:=case when tg_op='DELETE' then old.appointment_id else new.appointment_id end;
 rid:=case when tg_op='DELETE' then old.resource_id else new.resource_id end;
 select * into a from public.appointments where id=aid for no key update;
 if not found then
  if tg_op='DELETE' and exists(select 1 from pg_roles where rolname=current_user and (rolsuper or rolbypassrls))
     and has_table_privilege(current_user,'public.appointments','SELECT') then return old; end if;
  raise exception 'LIFECYCLE_PARENT_UNKNOWN' using errcode='23514';
 end if;
 if tg_op='UPDATE' then
  select * into b from public.appointments where id=old.appointment_id for no key update;
  if not found or b.booking_operation_id is not null or a.booking_operation_id is not null then raise exception 'LIFECYCLE_RESOURCE_REPARENT_FORBIDDEN' using errcode='23514'; end if;
  return new;
 end if;
 if a.booking_operation_id is null then
  if tg_op='DELETE' then return old; end if; return new;
 end if;
 if current_user<>'service_role' then raise exception 'LIFECYCLE_SERVICE_ROLE_REQUIRED' using errcode='42501'; end if;
 select * into op from public.commerce_booking_operations where id=a.booking_operation_id and business_id=a.business_id;
 if not found then raise exception 'LIFECYCLE_OPERATION_UNKNOWN' using errcode='23514'; end if;
 if tg_op='INSERT' and a.operational_revision=0 and op.lifecycle_state='OPEN' and rid=any(op.resource_ids)
    and row(a.customer_id,a.location_id,a.service_id,a.staff_id,a.start_time,a.end_time,a.status::text,a.room_id,a.price_cents,a.tax_cents,a.deposit_cents,a.notes)
      is not distinct from row(op.customer_id,op.location_id,op.service_id,op.staff_id,op.requested_start,op.requested_end,op.requested_status,op.room_id,op.subtotal_cents,op.tax_cents,op.deposit_required_cents,
       case when op.package_id is null then op.appointment_notes else concat_ws(E'\\n',nullif(op.appointment_notes,''),'Package: '||op.package_name||' ('||op.package_id||')') end)
    and exists(select 1 from public.booking_resources r where r.id=rid and r.business_id=a.business_id and r.is_active) then return new; end if;
 select count(*) into n from booking_lifecycle_private.appointment_mutations m
 where m.transaction_id=pg_current_xact_id() and m.appointment_id=a.id and m.business_id=a.business_id and m.operation_id=a.booking_operation_id
 and m.outcome='APPLIED' and m.observed_revision=a.operational_revision and m.command in ('RESOURCES','REASSIGN_LOCATION','SERVICE_CORRECTION')
 and ((tg_op='DELETE' and rid=any(m.before_resource_ids) and not rid=any(m.after_resource_ids))
   or (tg_op='INSERT' and rid=any(m.after_resource_ids) and not rid=any(m.before_resource_ids)));
 if n<>1 then raise exception 'LIFECYCLE_RESOURCE_PERMIT_REQUIRED' using errcode='23514'; end if;
 if tg_op='DELETE' then return old; end if;
 select * into strict j from booking_lifecycle_private.appointment_mutations m where m.transaction_id=pg_current_xact_id() and m.appointment_id=a.id and m.business_id=a.business_id and m.effect_revision=a.operational_revision+1;
 if not exists(select 1 from public.booking_resources r where r.id=rid and r.business_id=a.business_id and r.is_active and (r.location_id is null or r.location_id=(j.after_image->>'location_id')::uuid)) then raise exception 'LIFECYCLE_RESOURCE_INVALID' using errcode='23514'; end if;
 return new;
end $g$;''')
H='p_business_id uuid,p_operation_id uuid,p_appointment_id uuid,p_actor_id uuid,p_mutation_id uuid,p_expected_revision bigint,p_reason text'
RESULT='outcome text,appointment_id uuid,operation_id uuid,mutation_id uuid,effect_revision bigint,current_revision bigint,current_status public.appointment_status,original_attempt_id uuid,recovery_required boolean'
DECL='''a public.appointments%rowtype; desired public.appointments%rowtype; op public.commerce_booking_operations%rowtype;
 t public.commerce_payment_attempts%rowtype; prior record; resources uuid[]; target_resources uuid[];
 before_j jsonb; after_j jsonb; request_j jsonb; changed text[]; v_command text; v_reason text;
 v_outcome text; v_key uuid; v_origin text; v_effect bigint; v_recorded boolean:=false;
 v_workflow text[]; v_count integer; v_uid uuid; v_owner uuid;
 s public.services%rowtype; new_s public.services%rowtype; st public.staff%rowtype; loc public.locations%rowtype;
 pair public.staff_services%rowtype; effective_duration integer; v_name text; v_amount integer;'''
def ret(code,empty=False):
 return f"return query select '{code}'::text,"+("null::uuid,null::uuid,null::uuid,null::bigint,null::bigint,null::public.appointment_status,null::uuid,true; return;" if empty else "a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,"+('true' if code in ('UNKNOWN','PAYMENT_RECOVERY_REQUIRED') else "(t.execution_state in ('REQUESTED','FAILED') or a.customer_id is distinct from op.customer_id or exists(select 1 from public.commerce_payment_reconciliation z where z.attempt_id=t.id and z.is_financial and z.state not in ('COMPLETE','NOT_REQUIRED')))")+"; return;")
AUTH="""if current_user<>'service_role' then raise exception 'LIFECYCLE_SERVICE_ROLE_REQUIRED' using errcode='42501'; end if;
 select b.owner_id into v_owner from public.businesses b where b.id=p_business_id for share;
 if not found then {deny} end if;
 if v_owner is distinct from p_actor_id then
  perform 1 from public.business_members m where m.business_id=p_business_id and m.user_id=p_actor_id and m.role in ('owner','admin') for share;
  if not found then {deny} end if;
 end if;"""
LOCKS="""perform pg_advisory_xact_lock(hashtextextended('booking-operation:'||p_operation_id::text,0));
 select * into t from public.commerce_payment_attempts x where x.business_id=p_business_id and x.booking_operation_id=p_operation_id for update;
 if not found then {unknown} end if;
 select * into a from public.appointments x where x.id=p_appointment_id and x.business_id=p_business_id and x.booking_operation_id=p_operation_id for no key update;
 if not found then {unknown} end if;
 select * into op from public.commerce_booking_operations x where x.id=p_operation_id and x.business_id=p_business_id for update;
 if not found or t.customer_id is distinct from op.customer_id or t.actor_id is distinct from op.actor_id or (t.appointment_id is not null and t.appointment_id<>a.id) then {unknown} end if;
 resources:=array(select resource_id from public.appointment_resources where appointment_id=a.id order by resource_id);
 target_resources:=resources; desired:=a;"""
def common_open(name,args,cmd,request_extra):
 emit(f'create function public.{name}({H}{args}) returns table({RESULT})\nlanguage plpgsql volatile security invoker set search_path=pg_catalog,pg_temp as $f$\ndeclare {DECL}\nbegin')
 emit(AUTH.format(deny=ret('NOT_AUTHORIZED',True)))
 emit("""if p_business_id is null or p_operation_id is null or p_appointment_id is null or p_actor_id is null or p_mutation_id is null or p_expected_revision is null or p_expected_revision<0 or p_reason is null or char_length(btrim(p_reason)) not between 1 and 500 then raise exception 'LIFECYCLE_INVALID_INPUT' using errcode='22023'; end if;
 v_reason:=btrim(p_reason); v_key:=p_mutation_id; v_origin:='V2';""")
 emit(f'v_command:={cmd};')
 emit(LOCKS.format(unknown=ret('UNKNOWN',True)))
 emit(f"request_j:=jsonb_build_object('business_id',p_business_id,'operation_id',p_operation_id,'appointment_id',p_appointment_id,'actor_id',p_actor_id,'mutation_id',p_mutation_id,'expected_revision',p_expected_revision,'reason',v_reason,'origin',v_origin,'command',v_command){request_extra};")
 emit(f"""select * into prior from booking_lifecycle_private.appointment_mutations m where m.business_id=p_business_id and m.appointment_id=p_appointment_id and m.mutation_id=p_mutation_id;
 if found then
  if prior.request is distinct from request_j then {ret('CONFLICT')} end if;
  v_effect:=prior.effect_revision; {ret('REPLAY')}
 end if;
 if a.operational_revision<>p_expected_revision then {ret('STALE_REVISION')} end if;
 if char_length(a.notes)>10000 then {ret('UNKNOWN')} end if;
 before_j:={image('a')};""")
def finish():
 emit(f"""after_j:={image('desired')};
 if after_j=before_j and target_resources=resources then v_outcome:='NO_CHANGE'; v_effect:=null; changed:='{{}}'::text[];
 else
  if a.operational_revision=9223372036854775807 then raise exception 'LIFECYCLE_REVISION_EXHAUSTED' using errcode='22003'; end if;
  desired.operational_revision:=a.operational_revision+1; after_j:={image('desired')};
  v_effect:=desired.operational_revision; v_outcome:='APPLIED';
  select array_agg(x order by x) into changed from (select x from jsonb_object_keys(before_j) x where before_j->x is distinct from after_j->x union all select 'resource_ids' where resources is distinct from target_resources) q;
 end if;
 insert into booking_lifecycle_private.appointment_mutations(business_id,appointment_id,operation_id,mutation_id,actor_id,original_attempt_id,origin,command,transaction_id,expected_revision,observed_revision,result_revision,effect_revision,outcome,reason,request,before_image,after_image,before_resource_ids,after_resource_ids,allowed_fields)
 values(a.business_id,a.id,op.id,v_key,p_actor_id,t.id,v_origin,v_command,pg_current_xact_id(),a.operational_revision,a.operational_revision,desired.operational_revision,v_effect,v_outcome,v_reason,request_j,before_j,after_j,resources,target_resources,changed);
 if v_outcome='APPLIED' then
  for v_uid in select x from unnest(resources) x where not x=any(target_resources) order by x loop delete from public.appointment_resources where appointment_id=a.id and resource_id=v_uid; end loop;
  for v_uid in select x from unnest(target_resources) x where not x=any(resources) order by x loop insert into public.appointment_resources(appointment_id,resource_id) values(a.id,v_uid); end loop;
  update public.appointments x set status=desired.status,notes=desired.notes,location_id=desired.location_id,service_id=desired.service_id,staff_id=desired.staff_id,start_time=desired.start_time,end_time=desired.end_time,room_id=desired.room_id,operational_revision=desired.operational_revision
  where x.id=a.id and x.business_id=a.business_id and x.operational_revision=a.operational_revision returning * into a;
  if not found or (to_jsonb(a)-'updated_at') is distinct from (to_jsonb(desired)-'updated_at') or row(a.amount_paid_cents,a.amount_refunded_cents,a.payment_status) is distinct from row(desired.amount_paid_cents,desired.amount_refunded_cents,desired.payment_status) or {image('a')} is distinct from after_j or array(select resource_id from public.appointment_resources where appointment_id=a.id order by resource_id) is distinct from target_resources then raise exception 'LIFECYCLE_FINAL_STATE_MISMATCH' using errcode='23514'; end if;
 end if;
 if not exists(select 1 from public.commerce_booking_operations x where x.id=op.id and to_jsonb(x)=to_jsonb(op)) or not exists(select 1 from public.commerce_payment_attempts x where x.id=t.id and to_jsonb(x)=to_jsonb(t)) then raise exception 'LIFECYCLE_FINANCIAL_IDENTITY_CHANGED' using errcode='23514'; end if;
 return query select v_outcome,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,(t.execution_state in ('REQUESTED','FAILED') or a.customer_id is distinct from op.customer_id or exists(select 1 from public.commerce_payment_reconciliation z where z.attempt_id=t.id and z.is_financial and z.state not in ('COMPLETE','NOT_REQUIRED')));
end $f$;""")
COHERENCE="""select count(*) into v_count from public.commerce_transactions x where x.payment_attempt_id=t.id;
 if exists(select 1 from public.commerce_payment_attempt_events e where e.attempt_id=t.id and e.business_id<>t.business_id)
    or exists(select 1 from public.commerce_payment_reconciliation o where o.attempt_id=t.id and o.business_id<>t.business_id) then {unknown} end if;
 if t.execution_state in ('FAILED','SKIPPED') then
  if v_count<>0 or t.recovery_disposition<>'DO_NOT_RETRY' or t.resolved_at is null
     or exists(select 1 from public.commerce_payment_reconciliation o where o.attempt_id=t.id)
     or (select count(*) from public.commerce_payment_attempt_events e where e.attempt_id=t.id)<>2
     or (select count(*) from public.commerce_payment_attempt_events e where e.attempt_id=t.id and e.event_type='REQUESTED' and e.money_state='NOT_RECORDED')<>1
     or (select count(*) from public.commerce_payment_attempt_events e where e.attempt_id=t.id and e.event_type=t.execution_state and e.money_state='NOT_RECORDED' and e.failure_class is not distinct from t.failure_class and e.failure_code is not distinct from t.failure_code)<>1 then {unknown} end if;
 elsif t.execution_state='ACCEPTED' then
  if v_count<>1 or not public.payment_projection_history_valid_v1(p_business_id,t.id)
    or not exists(select 1 from public.commerce_transactions x where x.payment_attempt_id=t.id and row(x.business_id,x.customer_id,x.appointment_id,x.kind,x.amount_cents,x.currency,x.status,x.provider,x.method,x.created_by) is not distinct from row(t.business_id,t.customer_id,t.appointment_id,t.payment_kind,t.amount_cents,t.currency,'succeeded'::text,'manual'::text,t.method,t.actor_id)) then {unknown} end if;
 elsif t.execution_state='REQUESTED' then
  if v_count<>0 or t.resolved_at is not null or t.recovery_disposition<>'RECOVER' or t.failure_class is not null or t.failure_code is not null
    or exists(select 1 from public.commerce_payment_reconciliation o where o.attempt_id=t.id)
    or (select count(*) from public.commerce_payment_attempt_events e where e.attempt_id=t.id)<>1
    or (select count(*) from public.commerce_payment_attempt_events e where e.attempt_id=t.id and e.event_type='REQUESTED' and e.money_state='NOT_RECORDED')<>1 then {unknown} end if;
 else {unknown} end if;"""
common_open('revise_booking_notes_v2',',p_notes text',"'NOTES'","||jsonb_build_object('notes',nullif(p_notes,''))")
emit(COHERENCE.format(unknown=ret('UNKNOWN')))
emit("if char_length(p_notes)>10000 then raise exception 'LIFECYCLE_NOTES_LIMIT' using errcode='22023'; end if; desired.notes:=nullif(p_notes,'');")
finish()
common_open('transition_booking_appointment_v2',',p_target_status public.appointment_status,p_correction boolean',"'STATUS'","||jsonb_build_object('target_status',p_target_status,'correction',p_correction)")
emit(COHERENCE.format(unknown=ret('UNKNOWN')))
emit(f"""if p_target_status is null or p_correction is null or p_target_status::text in ('scheduled','cancelled') then {ret('CONFLICT')} end if;
 if a.status::text='cancelled' then {ret('TERMINAL')} end if;
 select array_agg(x order by ord) into v_workflow from public.businesses b cross join lateral jsonb_array_elements_text(case when jsonb_typeof(b.appointment_status_workflow)='array' then b.appointment_status_workflow else '[]'::jsonb end) with ordinality as workflow(x,ord) where b.id=p_business_id and x in ('pending','confirmed','arrived','waiting','in_progress','completed','cancelled','no_show');
 if cardinality(v_workflow) is null or cardinality(v_workflow)=0 then v_workflow:=array['confirmed','arrived','waiting','in_progress','completed','cancelled','no_show']; end if;
 if p_target_status<>a.status and not p_correction and not (a.status::text='pending' and p_target_status::text='confirmed') then
  if a.status::text in ('completed','no_show') or not p_target_status::text=any(v_workflow) or (p_target_status::text<>'no_show' and coalesce(array_position(v_workflow,p_target_status::text),0)<=coalesce(array_position(v_workflow,a.status::text),0)) then {ret('CONFLICT')} end if;
 end if;
 desired.status:=p_target_status;""")
finish()
# Read-only decision evidence for the original attempt; never a whole-appointment balance.
common_open('revise_booking_schedule_v2',',p_command text,p_location_id uuid,p_service_id uuid,p_staff_id uuid,p_start_time timestamptz,p_end_time timestamptz,p_room_id uuid,p_resource_ids uuid[]','p_command',"||jsonb_build_object('location_id',p_location_id,'service_id',p_service_id,'staff_id',p_staff_id,'start_time',to_char(p_start_time at time zone 'UTC','YYYY-MM-DD\"T\"HH24:MI:SS.US\"Z\"'),'end_time',to_char(p_end_time at time zone 'UTC','YYYY-MM-DD\"T\"HH24:MI:SS.US\"Z\"'),'room_id',p_room_id,'resource_ids',array(select x from unnest(p_resource_ids) x order by x))")
emit(f"""if p_command is null or p_command not in ('RESCHEDULE','RESIZE','REASSIGN_STAFF','REASSIGN_LOCATION','RESOURCES','SERVICE_CORRECTION') or p_location_id is null or p_service_id is null or p_staff_id is null or p_start_time is null or p_end_time is null or not isfinite(p_start_time) or not isfinite(p_end_time) or p_end_time<=p_start_time or p_resource_ids is null or coalesce(array_ndims(p_resource_ids),1)<>1 or array_position(p_resource_ids,null) is not null or cardinality(p_resource_ids)<>(select count(distinct x) from unnest(p_resource_ids) x) then raise exception 'LIFECYCLE_INVALID_SCHEDULE' using errcode='22023'; end if;
 if a.status::text='cancelled' then {ret('TERMINAL')} end if;
""")
emit(COHERENCE.format(unknown=ret('UNKNOWN')))
emit(f"""if t.execution_state='REQUESTED' then {ret('PAYMENT_RECOVERY_REQUIRED')} end if;
 if t.appointment_id is distinct from a.id and not (op.lifecycle_state='CLOSED' and t.execution_state in ('FAILED','SKIPPED') and t.appointment_id is null) then {ret('UNKNOWN')} end if;
 desired.location_id:=p_location_id;desired.service_id:=p_service_id;desired.staff_id:=p_staff_id;desired.start_time:=p_start_time;desired.end_time:=p_end_time;desired.room_id:=p_room_id;
 target_resources:=array(select x from unnest(p_resource_ids) x order by x);
 after_j:={image('desired')};
 select coalesce(array_agg(x),'{{}}'::text[]) into changed from (select x from jsonb_object_keys(before_j) x where before_j->x is distinct from after_j->x union all select 'resource_ids' where resources is distinct from target_resources) q;
 if not changed <@ (case v_command
 """+''.join(f"when '{c}' then {arr(f)}\n" for c,f in FIELDS.items() if c not in ['STATUS','NOTES','CANCEL','REASSIGN_CUSTOMER'])+f"""else '{{}}'::text[] end) then {ret('CONFLICT')} end if;
 -- Lock admitted catalog rows in the exact frozen table/UUID order.
 perform 1 from public.locations x where x.id in (a.location_id,p_location_id) and x.business_id=p_business_id order by x.id for share;
 perform 1 from public.services x where x.id in (a.service_id,p_service_id) and x.business_id=p_business_id order by x.id for share;
 perform 1 from public.staff x where x.id in (a.staff_id,p_staff_id) and x.business_id=p_business_id order by x.id for share;
 perform 1 from public.service_locations x where x.service_id=p_service_id and x.location_id=p_location_id order by x.service_id,x.location_id for share;
 perform 1 from public.staff_locations x where x.staff_id=p_staff_id and x.location_id=p_location_id order by x.staff_id,x.location_id for share;
 perform 1 from public.staff_services x where x.staff_id=p_staff_id and x.service_id=p_service_id order by x.staff_id,x.service_id for share;
 perform 1 from public.booking_resources x where (x.id=any(target_resources) or x.id=p_room_id) and x.business_id=p_business_id order by x.id for share;
 select * into loc from public.locations where id=p_location_id and business_id=p_business_id and is_active;
 if not found then {ret('CONFLICT')} end if;
 select * into s from public.services where id=a.service_id and business_id=p_business_id;
 if not found then {ret('UNKNOWN')} end if;
 select * into new_s from public.services where id=p_service_id and business_id=p_business_id and is_active;
 if not found then {ret('CONFLICT')} end if;
 select * into st from public.staff where id=p_staff_id and business_id=p_business_id and is_active;
 if not found then {ret('CONFLICT')} end if;
 select * into pair from public.staff_services where staff_id=p_staff_id and service_id=p_service_id;
 if not found or not (new_s.location_id=p_location_id or exists(select 1 from public.service_locations where service_id=p_service_id and location_id=p_location_id)) or not (st.location_id=p_location_id or exists(select 1 from public.staff_locations where staff_id=p_staff_id and location_id=p_location_id)) then {ret('CONFLICT')} end if;
 if v_command='SERVICE_CORRECTION' and a.service_id<>p_service_id then
  if op.package_id is not null or s.price is null or new_s.price is null or s.price<0 or new_s.price<0 or s.price::text='NaN' or new_s.price::text='NaN'
     or s.tax_rate_bps is null or new_s.tax_rate_bps is null or s.tax_rate_bps<0 or new_s.tax_rate_bps<0
     or s.deposit_cents is null or new_s.deposit_cents is null or s.deposit_cents<0 or new_s.deposit_cents<0
     or s.deposit_required is null or new_s.deposit_required is null
     or row(s.price,s.tax_rate_bps,s.deposit_cents,s.deposit_required) is distinct from row(new_s.price,new_s.tax_rate_bps,new_s.deposit_cents,new_s.deposit_required) then {ret('FINANCIAL_REVIEW_REQUIRED')} end if;
 end if;
 effective_duration:=coalesce(nullif(pair.duration_override_minutes,0),new_s.duration_minutes);
 if effective_duration is null or effective_duration<5 or pair.duration_override_minutes<0 then {ret('CONFLICT')} end if;
 if (v_command in ('REASSIGN_STAFF','SERVICE_CORRECTION') or (v_command='REASSIGN_LOCATION' and a.staff_id<>p_staff_id)) and p_end_time-p_start_time<>make_interval(mins=>effective_duration) then {ret('CONFLICT')} end if;
 if p_room_id is not null and not exists(select 1 from public.booking_resources r where r.id=p_room_id and r.business_id=p_business_id and r.is_active and r.resource_type='room' and (r.location_id is null or r.location_id=p_location_id)) then {ret('CONFLICT')} end if;
 if exists(select 1 from unnest(target_resources) x left join public.booking_resources r on r.id=x and r.business_id=p_business_id and r.is_active and (r.location_id is null or r.location_id=p_location_id) where r.id is null) then {ret('CONFLICT')} end if;
 if exists(select 1 from public.appointments x where x.id<>a.id and x.business_id=p_business_id and x.status::text<>'cancelled' and x.start_time<p_end_time and p_start_time<x.end_time and ((p_room_id is not null and x.room_id=p_room_id) or exists(select 1 from public.appointment_resources r where r.appointment_id=x.id and r.resource_id=any(target_resources)))) then {ret('CONFLICT')} end if;
 -- Separate statement after every lock wait: preserve the protected STABLE validator.
 begin
  perform public.validate_appointment_slot(p_business_id,p_service_id,p_staff_id,p_start_time,p_end_time,a.id,p_location_id);
 exception when raise_exception then {ret('CONFLICT')} end;
""")
finish()
emit(f'''create function public.read_booking_appointment_mutation_v2(p_business_id uuid,p_appointment_id uuid,p_actor_id uuid,p_mutation_id uuid) returns table({RESULT})
language plpgsql volatile security invoker set search_path=pg_catalog,pg_temp as $f$
declare {DECL}
begin
 {AUTH.format(deny=ret('NOT_AUTHORIZED',True))}
 if p_actor_id is null or p_business_id is null or p_appointment_id is null or p_mutation_id is null then {ret('UNKNOWN',True)} end if;
 select * into a from public.appointments where id=p_appointment_id and business_id=p_business_id;
 if not found then {ret('UNKNOWN',True)} end if;
 select * into prior from booking_lifecycle_private.appointment_mutations m where m.business_id=p_business_id and m.appointment_id=p_appointment_id and m.mutation_id=p_mutation_id;
 if not found then {ret('UNKNOWN',True)} end if;
 return query select 'REPLAY'::text,a.id,prior.operation_id,prior.mutation_id,prior.effect_revision,a.operational_revision,a.status,prior.original_attempt_id,coalesce((select x.execution_state in ('REQUESTED','FAILED') or a.customer_id is distinct from x.customer_id or exists(select 1 from public.commerce_payment_reconciliation z where z.attempt_id=x.id and z.is_financial and z.state not in ('COMPLETE','NOT_REQUIRED')) from public.commerce_payment_attempts x where x.id=prior.original_attempt_id and x.business_id=p_business_id),true);
end $f$;''')
HELPERARGS='p_business_id uuid,p_operation_id uuid,p_actor_id uuid,p_reason text,p_expected_current_customer_id uuid,p_replacement_customer_id uuid,p_cancel boolean,p_mutation_id uuid,p_expected_revision bigint,p_expected_appointment_id uuid,p_audit_reason text,p_compatibility_v1 boolean'
HELPERRESULT='outcome text,operation_id uuid,appointment_id uuid,attempt_id uuid,recorded boolean,mutation_id uuid,effect_revision bigint,current_revision bigint,current_status public.appointment_status,lifecycle_outcome text'
def hr(wire,life,empty=False):
 return f"return query select '{wire}'::text,"+(f"null::uuid,null::uuid,null::uuid,false,null::uuid,null::bigint,null::bigint,null::public.appointment_status,'{life}'::text;return;" if empty else f"op.id,a.id,t.id,v_recorded,v_key,v_effect,a.operational_revision,a.status,'{life}'::text;return;")
# The exact original close failure-class mapping is preserved below.
FENCE="""update public.commerce_booking_operations set lifecycle_state='CLOSED',close_reason=p_reason,replacement_customer_id=case when p_reason='CUSTOMER_REASSIGNED' then p_replacement_customer_id else null end,closed_at=coalesce(closed_at,now()),updated_at=now() where id=op.id and business_id=p_business_id;
 if t.execution_state='REQUESTED' then
  update public.commerce_payment_attempts set execution_state='FAILED',recovery_disposition='DO_NOT_RETRY',failure_class=case when p_reason in ('PRICING_CHANGED','OPERATOR_ABANDONED') then 'VALIDATION' else 'CONFLICT' end,failure_code=case when p_reason in ('PRICING_CHANGED','OPERATOR_ABANDONED') then 'INVALID_REQUEST' else 'KEY_CONFLICT' end,updated_at=now(),resolved_at=now() where id=t.id and business_id=p_business_id returning * into t;
  insert into public.commerce_payment_attempt_events(business_id,attempt_id,event_type,money_state,failure_class,failure_code) values(p_business_id,t.id,'FAILED','NOT_RECORDED',t.failure_class,t.failure_code);
 end if;"""
emit(f'''create function booking_lifecycle_private.close_operation_lifecycle_v2({HELPERARGS}) returns table({HELPERRESULT})
language plpgsql volatile security invoker set search_path=pg_catalog,pg_temp as $f$
declare {DECL}
 v_compat_wire text; p_appointment_id uuid;
begin
 {AUTH.format(deny="if p_compatibility_v1 then raise exception 'BOOKING_OPERATION_NOT_AUTHORIZED' using errcode='42501'; end if;"+hr('RECOVERY_REQUIRED','NOT_AUTHORIZED',True))}
 if p_business_id is null or p_operation_id is null or p_actor_id is null or p_compatibility_v1 is null or p_reason is null or p_cancel is null or p_audit_reason is null or char_length(btrim(p_audit_reason)) not between 1 and 500
    or p_reason not in ('PRICING_CHANGED','SLOT_CONFLICT','CUSTOMER_REASSIGNED','APPOINTMENT_CANCELLED','OPERATOR_ABANDONED')
    or p_cancel is distinct from (p_reason='APPOINTMENT_CANCELLED')
    or (p_reason='CUSTOMER_REASSIGNED' and (p_expected_current_customer_id is null or p_replacement_customer_id is null))
    or (p_reason<>'CUSTOMER_REASSIGNED' and (p_expected_current_customer_id is not null or p_replacement_customer_id is not null))
    or (not p_compatibility_v1 and (p_expected_appointment_id is null or p_mutation_id is null or p_expected_revision is null or p_expected_revision<0)) then raise exception 'BOOKING_OPERATION_INVALID_CLOSE_REQUEST' using errcode='22023'; end if;
 v_reason:=btrim(p_audit_reason);v_key:=p_mutation_id;v_origin:=case when p_compatibility_v1 then 'V1_CLOSE' else 'V2' end;
 v_command:=case when p_reason='CUSTOMER_REASSIGNED' then 'REASSIGN_CUSTOMER' else 'CANCEL' end;
 perform pg_advisory_xact_lock(hashtextextended('booking-operation:'||p_operation_id::text,0));
 select * into t from public.commerce_payment_attempts x where x.business_id=p_business_id and x.booking_operation_id=p_operation_id for update;
 if not found then {hr('RECOVERY_REQUIRED','UNKNOWN',True)} end if;
 select * into a from public.appointments x where x.business_id=p_business_id and x.booking_operation_id=p_operation_id;
 if a.id is not null then
  if p_cancel and a.status::text='cancelled' then
   select * into a from public.appointments x where x.id=a.id for no key update;
   if a.status::text<>'cancelled' then {hr('RECOVERY_REQUIRED','UNKNOWN',True)} end if;
  else
   select * into a from public.appointments x where x.id=a.id for update;
  end if;
 end if;
 select * into op from public.commerce_booking_operations x where x.id=p_operation_id and x.business_id=p_business_id for update;
 if not found then {hr('RECOVERY_REQUIRED','UNKNOWN',True)} end if;
 if p_compatibility_v1 and op.actor_id<>p_actor_id then raise exception 'BOOKING_OPERATION_NOT_AUTHORIZED' using errcode='42501'; end if;
 if not p_compatibility_v1 and a.id is distinct from p_expected_appointment_id then {hr('RECOVERY_REQUIRED','UNKNOWN',True)} end if;
 if row(t.customer_id,t.actor_id) is distinct from row(op.customer_id,op.actor_id) or (t.appointment_id is not null and t.appointment_id is distinct from a.id) then {hr('RECOVERY_REQUIRED','UNKNOWN')} end if;
 v_recorded:=exists(select 1 from public.commerce_transactions x where x.appointment_id=a.id);
 v_compat_wire:=case when op.lifecycle_state='CLOSED' then 'EXISTING' else 'CLOSED' end;
 if a.id is not null and p_reason in ('PRICING_CHANGED','SLOT_CONFLICT','OPERATOR_ABANDONED') then {hr('RECOVERY_REQUIRED','UNKNOWN')} end if;
 {COHERENCE.format(unknown=hr('RECOVERY_REQUIRED','UNKNOWN'))}
 if a.id is null then
  if p_reason in ('CUSTOMER_REASSIGNED','APPOINTMENT_CANCELLED') then raise exception 'BOOKING_OPERATION_APPOINTMENT_REQUIRED' using errcode='23514'; end if;
  if t.execution_state='ACCEPTED' or v_count<>0 then {hr('RECOVERY_REQUIRED','UNKNOWN')} end if;
  if op.lifecycle_state='CLOSED' and op.close_reason=p_reason then
   if t.execution_state='REQUESTED' then {hr('RECOVERY_REQUIRED','UNKNOWN')} end if;
   return query select 'EXISTING'::text,op.id,null::uuid,t.id,false,null::uuid,null::bigint,null::bigint,null::public.appointment_status,'NO_CHANGE'::text;return;
  end if;
  {FENCE}
  return query select v_compat_wire,op.id,null::uuid,t.id,false,null::uuid,null::bigint,null::bigint,null::public.appointment_status,'NO_CHANGE'::text;return;
 end if;
 if char_length(a.notes)>10000 then {hr('RECOVERY_REQUIRED','UNKNOWN')} end if;
 resources:=array(select resource_id from public.appointment_resources where appointment_id=a.id order by resource_id);
 target_resources:=resources; desired:=a;
 if p_compatibility_v1 then p_expected_revision:=a.operational_revision; end if;
 request_j:=jsonb_build_object('business_id',p_business_id,'operation_id',p_operation_id,'appointment_id',a.id,'actor_id',p_actor_id,'mutation_id',v_key,'expected_revision',p_expected_revision,'reason',v_reason,'origin',v_origin,'command',v_command,'expected_customer_id',p_expected_current_customer_id,'replacement_customer_id',p_replacement_customer_id);
 if not p_compatibility_v1 then
  select * into prior from booking_lifecycle_private.appointment_mutations m where m.business_id=p_business_id and m.appointment_id=a.id and m.mutation_id=v_key;
  if found then
   if prior.request is distinct from request_j then {hr('RECOVERY_REQUIRED','CONFLICT')} end if;
   v_effect:=prior.effect_revision;{hr('EXISTING','REPLAY')}
  end if;
  if a.operational_revision<>p_expected_revision then {hr('RECOVERY_REQUIRED','STALE_REVISION')} end if;
 end if;
 if p_reason='CUSTOMER_REASSIGNED' then
  if a.status::text='cancelled' then {hr('RECOVERY_REQUIRED','TERMINAL')} end if;
  if a.customer_id<>p_expected_current_customer_id then
   if p_compatibility_v1 then raise exception 'BOOKING_OPERATION_EXPECTED_CUSTOMER_CHANGED' using errcode='40001'; end if;
   {hr('RECOVERY_REQUIRED','CONFLICT')}
  end if;
  perform 1 from public.customers c where c.id=p_replacement_customer_id and c.business_id=p_business_id for share;
  if not found then {hr('RECOVERY_REQUIRED','CONFLICT')} end if;
  if t.execution_state='ACCEPTED' or exists(select 1 from public.commerce_transactions x where x.appointment_id=a.id)
    or exists(select 1 from public.commerce_refunds f where f.appointment_id=a.id or exists(select 1 from public.commerce_transactions x where x.id=f.transaction_id and x.appointment_id=a.id)) then
   if p_compatibility_v1 then raise exception 'APPOINTMENT_LEDGER_CUSTOMER_REASSIGNMENT_FORBIDDEN' using errcode='23514'; end if;
   {hr('RECOVERY_REQUIRED','FINANCIAL_REVIEW_REQUIRED')}
  end if;
  desired.customer_id:=p_replacement_customer_id;
 else desired.status:='cancelled'; end if;
 if t.execution_state='REQUESTED' and v_recorded then {hr('RECOVERY_REQUIRED','UNKNOWN')} end if;
 before_j:={image('a')}; after_j:={image('desired')};
 if before_j=after_j then
  if op.lifecycle_state<>'CLOSED' or op.close_reason<>p_reason or t.execution_state='REQUESTED' then {hr('RECOVERY_REQUIRED','UNKNOWN')} end if;
  if p_compatibility_v1 then {hr('EXISTING','NO_CHANGE')} end if;
  v_outcome:='NO_CHANGE'; changed:='{{}}'::text[];v_effect:=null;
 else
  if a.operational_revision=9223372036854775807 then raise exception 'LIFECYCLE_REVISION_EXHAUSTED' using errcode='22003'; end if;
  if p_compatibility_v1 then v_key:=gen_random_uuid();request_j:=jsonb_set(request_j,'{{mutation_id}}',to_jsonb(v_key)); end if;
  desired.operational_revision:=a.operational_revision+1;v_effect:=desired.operational_revision;v_outcome:='APPLIED';after_j:={image('desired')};
  select array_agg(x order by x) into changed from jsonb_object_keys(before_j) x where before_j->x is distinct from after_j->x;
 end if;
 insert into booking_lifecycle_private.appointment_mutations(business_id,appointment_id,operation_id,mutation_id,actor_id,original_attempt_id,origin,command,transaction_id,expected_revision,observed_revision,result_revision,effect_revision,outcome,reason,request,before_image,after_image,before_resource_ids,after_resource_ids,allowed_fields)
 values(a.business_id,a.id,op.id,v_key,p_actor_id,t.id,v_origin,v_command,pg_current_xact_id(),a.operational_revision,a.operational_revision,desired.operational_revision,v_effect,v_outcome,v_reason,request_j,before_j,after_j,resources,resources,changed);
 if v_outcome='APPLIED' then
  {FENCE}
  update public.appointments x set customer_id=desired.customer_id,status=desired.status,operational_revision=desired.operational_revision where x.id=a.id and x.business_id=a.business_id and x.operational_revision=a.operational_revision returning * into a;
  if not found or (to_jsonb(a)-'updated_at') is distinct from (to_jsonb(desired)-'updated_at') or row(a.amount_paid_cents,a.amount_refunded_cents,a.payment_status) is distinct from row(desired.amount_paid_cents,desired.amount_refunded_cents,desired.payment_status) or {image('a')} is distinct from after_j or array(select resource_id from public.appointment_resources where appointment_id=a.id order by resource_id) is distinct from resources
    or not exists(select 1 from public.commerce_booking_operations x where x.id=op.id and x.lifecycle_state='CLOSED' and x.close_reason=p_reason and x.replacement_customer_id is not distinct from case when p_reason='CUSTOMER_REASSIGNED' then p_replacement_customer_id else null end)
    or not exists(select 1 from public.commerce_payment_attempts x where x.id=t.id and to_jsonb(x)=to_jsonb(t) and x.execution_state<>'REQUESTED')
    or not exists(select 1 from public.commerce_booking_operations x where x.id=op.id and (to_jsonb(x)-array['lifecycle_state','close_reason','replacement_customer_id','closed_at','updated_at'])=(to_jsonb(op)-array['lifecycle_state','close_reason','replacement_customer_id','closed_at','updated_at'])) then raise exception 'LIFECYCLE_CLOSE_FINAL_STATE' using errcode='23514'; end if;
 end if;
 return query select v_compat_wire,op.id,a.id,t.id,v_recorded,v_key,v_effect,a.operational_revision,a.status,v_outcome;
end $f$;''')
emit(f'''create function public.close_booking_appointment_v2({H},p_command text,p_expected_customer_id uuid,p_replacement_customer_id uuid) returns table({RESULT})
language plpgsql volatile security invoker set search_path=pg_catalog,pg_temp as $f$
declare r record;
begin
 if p_command is null or p_command not in ('CANCEL','REASSIGN_CUSTOMER') then raise exception 'LIFECYCLE_INVALID_CLOSE_COMMAND' using errcode='22023'; end if;
 select * into strict r from booking_lifecycle_private.close_operation_lifecycle_v2(p_business_id,p_operation_id,p_actor_id,case when p_command='CANCEL' then 'APPOINTMENT_CANCELLED' else 'CUSTOMER_REASSIGNED' end,p_expected_customer_id,p_replacement_customer_id,p_command='CANCEL',p_mutation_id,p_expected_revision,p_appointment_id,p_reason,false);
 return query select r.lifecycle_outcome,r.appointment_id,r.operation_id,r.mutation_id,r.effect_revision,r.current_revision,r.current_status,r.attempt_id,(r.lifecycle_outcome in ('UNKNOWN','PAYMENT_RECOVERY_REQUIRED','NOT_AUTHORIZED') or p_command='REASSIGN_CUSTOMER' or exists(select 1 from public.commerce_payment_attempts x where x.id=r.attempt_id and x.execution_state in ('REQUESTED','FAILED')) or exists(select 1 from public.commerce_payment_reconciliation z where z.attempt_id=r.attempt_id and z.is_financial and z.state not in ('COMPLETE','NOT_REQUIRED')));
end $f$;
create or replace function public.close_booking_operation_v1(p_business_id uuid,p_operation_id uuid,p_actor_id uuid,p_reason text,p_expected_current_customer_id uuid,p_replacement_customer_id uuid,p_cancel boolean) returns table(outcome text,operation_id uuid,appointment_id uuid,attempt_id uuid,recorded boolean)
language plpgsql security invoker set search_path=pg_catalog,pg_temp as $f$
begin
 return query select r.outcome,r.operation_id,r.appointment_id,r.attempt_id,r.recorded from booking_lifecycle_private.close_operation_lifecycle_v2(p_business_id,p_operation_id,p_actor_id,p_reason,p_expected_current_customer_id,p_replacement_customer_id,p_cancel,null,null,null,p_reason,true) r;
end $f$;''')
emit('''create trigger appointment_mutations_guard before insert or update or delete on booking_lifecycle_private.appointment_mutations for each row execute function booking_lifecycle_private.guard_appointment_mutation_v2();
create trigger appointment_resources_lifecycle_guard before insert or update or delete on public.appointment_resources for each row execute function booking_lifecycle_private.guard_appointment_resource_v2();
drop trigger appointments_booking_operation_guard on public.appointments;
create trigger appointments_booking_operation_guard before insert or delete or update of id,business_id,booking_operation_id,customer_id,location_id,service_id,staff_id,start_time,end_time,status,notes,room_id,price_cents,tax_cents,deposit_cents,operational_revision on public.appointments for each row execute function public.guard_appointment_booking_operation_link_v1();
alter table public.appointments enable always trigger appointments_booking_operation_guard;
alter table public.appointment_resources enable always trigger appointment_resources_lifecycle_guard;
alter table booking_lifecycle_private.appointment_mutations enable always trigger appointment_mutations_guard;
''')
for name,types in [
 ('public.transition_booking_appointment_v2','uuid,uuid,uuid,uuid,uuid,bigint,text,public.appointment_status,boolean'),
 ('public.revise_booking_notes_v2','uuid,uuid,uuid,uuid,uuid,bigint,text,text'),
 ('public.revise_booking_schedule_v2','uuid,uuid,uuid,uuid,uuid,bigint,text,text,uuid,uuid,uuid,timestamptz,timestamptz,uuid,uuid[]'),
 ('public.close_booking_appointment_v2','uuid,uuid,uuid,uuid,uuid,bigint,text,text,uuid,uuid'),
 ('public.read_booking_appointment_mutation_v2','uuid,uuid,uuid,uuid'),
 ('booking_lifecycle_private.close_operation_lifecycle_v2','uuid,uuid,uuid,text,uuid,uuid,boolean,uuid,bigint,uuid,text,boolean'),
 ('booking_lifecycle_private.guard_appointment_resource_v2',''),
 ('booking_lifecycle_private.guard_appointment_mutation_v2','')]:
 emit(f'revoke all on function {name}({types}) from public,anon,authenticated,service_role;\ngrant execute on function {name}({types}) to service_role;')
emit(CAT['post'](ROOT))
emit('''
comment on schema booking_lifecycle_private is 'Private lifecycle journal; not an API schema. No financial authority or A1/A2 activation.';
commit;''')
if __name__=='__main__':
 TARGET.write_text('\n'.join(parts).replace('as $f$\n','as $f$\n#variable_conflict use_column\n'))
 print(TARGET.name,hashlib.sha256(TARGET.read_bytes()).hexdigest())
