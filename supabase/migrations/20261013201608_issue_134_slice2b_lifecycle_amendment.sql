-- Slice 2B D1. LOCAL IMPLEMENTATION ONLY; hosted application separately gated.
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
    or has_table_privilege('service_role','public.appointment_resources','TRUNCATE')
    or has_table_privilege('service_role','public.appointments','TRIGGER')
    or has_table_privilege('service_role','public.appointment_resources','TRIGGER') then
  raise exception 'LIFECYCLE_UNSAFE_OPERATIONAL_CAPABILITY' using errcode='55000';
 end if;
 if not exists(select 1 from pg_proc where oid=to_regprocedure('public.validate_appointment_slot(uuid,uuid,uuid,timestamptz,timestamptz,uuid,uuid)') and provolatile='s' and prosecdef and prorettype='void'::regtype and proconfig=array['search_path=public']) then
  raise exception 'LIFECYCLE_VALIDATOR_CONTRACT_DRIFT' using errcode='55000';
 end if;
end $pre$;

do $capability$ begin
if exists(select 1 from (values ('availability_block_reason','d2261e44fd62ffb476fe69864635ce14'),('bind_booking_operation_appointment_v1','969958c4bc89c69b5d86e3b6331a69ca'),('bootstrap_booking_operation_v1','cd89add6bfd84f1856513c928d5721e7'),('commit_booking_operation_manual_payment_v1','23ee6ac48b6d81f42f33bf40ae39cea5'),('get_available_slots','d3f0f20c81a56b5e70fe3850e7b357f7'),('guard_commerce_booking_operation_v1','d41900b2e537770768b4ed1cc8bc19f5'),('is_location_holiday','9e2e6baf8eb03b48980fc0cdf403682d'),('is_staff_on_vacation','b50c2c223d3a096ba12681ccf5185aea'),('payment_appointment_truth_v1','62e536cd4fac2f1d9cae6e99c1cb9117'),('payment_projection_history_valid_v1','a0619196c1ff08a005c13e924ad200c1'),('persist_booking_operation_appointment_v1','6001c439bf8657d112870d4bf7245ad9'),('project_payment_obligation_v1','b4ccf60290658c4dea0c0110ba5b950d'),('read_booking_operations_v1','4f9c0896e6c3f2fa593281a96e058bb1'),('read_payment_observability_v1','58b16d7bfcf3524da5e1082dc2ed15b3'),('resolve_location_id','f8cae8e103e3df570f5d2c0f6526ef35'),('set_updated_at','9b1889f56258bf9d6554213c05019c76'),('validate_appointment_slot','ba820a872e7ae4082cc66ce02dc03b52')) expected(name,body_md5)
      where (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname=expected.name)<>1 or not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
       where n.nspname='public' and p.proname=expected.name and md5(p.prosrc)=expected.body_md5)) then
      raise exception 'LIFECYCLE_PROTECTED_BODY_DRIFT' using errcode='55000'; end if;

 -- Preserve the reviewed privileged validator and its transitive read helpers.
 if exists(select 1 from (values
  ('validate_appointment_slot',true,'void','search_path=public'),
  ('get_available_slots',true,'timestamp with time zone','search_path=public'),
  ('resolve_location_id',false,'uuid',null),
  ('is_location_holiday',false,'boolean',null),
  ('is_staff_on_vacation',false,'boolean',null),
  ('availability_block_reason',false,'text','search_path=public')
 ) e(name,definer,result,path) left join pg_proc p on p.pronamespace='public'::regnamespace and p.proname=e.name
 join pg_language l on l.oid=p.prolang join pg_roles owner on owner.oid=p.proowner
 where p.prosecdef is distinct from e.definer or p.provolatile<>'s' or l.lanname<>case when e.name in ('resolve_location_id','is_location_holiday','is_staff_on_vacation') then 'sql' else 'plpgsql' end
  or p.prorettype::regtype::text<>e.result
  or p.proconfig is distinct from case when e.path is null then null::text[] else array[e.path] end
  or not (owner.rolsuper or owner.rolbypassrls) or owner.rolname in ('anon','authenticated','authenticator','service_role')
  or not has_function_privilege('service_role',p.oid,'EXECUTE')
  or exists(select 1 from aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a
   where a.grantee<>p.proowner and (a.is_grantable or a.privilege_type<>'EXECUTE'
    or a.grantee not in (0,'anon'::regrole,'authenticated'::regrole,'service_role'::regrole)))
  or (e.definer and exists(select 1 from aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a where a.grantee=0))) then
  raise exception 'LIFECYCLE_VALIDATOR_DEPENDENCY_POSTURE' using errcode='55000'; end if;
 if exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace join pg_roles owner on owner.oid=c.relowner
  where n.nspname='public' and c.relname in ('businesses','business_members','appointments','appointment_resources',
   'commerce_booking_operations','commerce_payment_attempts','commerce_transactions','commerce_refunds',
   'locations','location_settings','location_hours','location_hour_segments','services','service_locations',
   'staff','staff_locations','staff_services','staff_working_hours','staff_hour_segments','business_closures',
   'staff_closures','service_blackouts','calendar_connections','external_events','staff_vacations','holidays')
  and (not(owner.rolsuper or owner.rolbypassrls) or owner.rolname in ('anon','authenticated','authenticator','service_role')
   or not has_table_privilege('service_role',c.oid,'SELECT')
   or exists(select 1 from pg_proc p where p.pronamespace='public'::regnamespace
    and p.proname in ('validate_appointment_slot','get_available_slots') and not has_table_privilege(p.proowner,c.oid,'SELECT')))) then
  raise exception 'LIFECYCLE_READ_DEPENDENCY_VISIBILITY' using errcode='55000'; end if;
 if (select count(*) from pg_roles where rolname in ('anon','authenticated','authenticator','service_role'))<>4 then
  raise exception 'LIFECYCLE_REQUIRED_ROLE_ABSENT' using errcode='55000'; end if;
 if not exists(select 1 from pg_roles where rolname=current_user and (rolsuper or rolbypassrls)) then
  raise exception 'LIFECYCLE_MIGRATION_VISIBILITY' using errcode='55000'; end if;
 if exists(with recursive membership(start,roleid) as (
   select oid,oid from pg_roles where rolname in ('anon','authenticated','service_role')
   union select m.start,a.roleid from membership m join pg_auth_members a on a.member=m.roleid)
   select 1 from membership m join pg_roles base on base.oid=m.start join pg_roles reached on reached.oid=m.roleid
   where (base.rolname in ('anon','authenticated') and (reached.rolsuper or reached.rolbypassrls))
      or (base.rolname='service_role' and (reached.rolsuper or reached.oid in
          (select relowner from pg_class where oid in ('public.appointments'::regclass,'public.appointment_resources'::regclass))))) then
  raise exception 'LIFECYCLE_ROLE_ESCALATION_PATH' using errcode='55000'; end if;
 -- Named-role checks include PUBLIC and immediately inherited privileges.
 -- Also inspect SET ROLE targets; NOINHERIT alone is not a capability boundary.
 if exists(select 1 from pg_roles base join pg_roles r on
   (r.oid=base.oid or pg_has_role(base.oid,r.oid,'SET'))
   where base.rolname in ('anon','authenticated','authenticator','service_role') and
    (has_table_privilege(r.oid,'public.appointments','TRIGGER')
     or has_table_privilege(r.oid,'public.appointment_resources','TRIGGER')))
   or exists(select 1 from pg_class c cross join lateral
    aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) a
    where c.oid in ('public.appointments'::regclass,'public.appointment_resources'::regclass)
     and a.grantee=0 and a.privilege_type='TRIGGER') then
  raise exception 'LIFECYCLE_OPERATIONAL_TRIGGER_CAPABILITY' using errcode='55000'; end if;
 if exists(select 1 from pg_roles base join pg_roles r on
   (r.oid=base.oid or pg_has_role(base.oid,r.oid,'SET'))
   where base.rolname in ('anon','authenticated','authenticator','service_role') and
   (has_parameter_privilege(r.oid,'session_replication_role','SET')
    or has_table_privilege(r.oid,'public.appointments','TRUNCATE')
    or has_table_privilege(r.oid,'public.appointment_resources','TRUNCATE')
    or has_schema_privilege(r.oid,'public','CREATE')))
   or exists(select 1 from pg_class c cross join lateral
    aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) a
    where c.oid in ('public.appointments'::regclass,'public.appointment_resources'::regclass)
     and a.grantee=0 and a.privilege_type='TRUNCATE') then
  raise exception 'LIFECYCLE_OPERATIONAL_DDL_CAPABILITY' using errcode='55000'; end if;
 if exists(select 1 from pg_class where oid in ('public.appointments'::regclass,'public.appointment_resources'::regclass)
   and (relkind<>'r' or relispartition or not relrowsecurity)) then
  raise exception 'LIFECYCLE_PARENT_CHILD_RELATION_SHAPE' using errcode='55000'; end if;
 if exists(select 1 from pg_rewrite where ev_class in ('public.appointments'::regclass,'public.appointment_resources'::regclass))
    or exists(select 1 from pg_trigger where not tgisinternal and
     ((tgrelid='public.appointments'::regclass and tgname not in ('appointments_updated_at','appointments_booking_operation_guard'))
       or tgrelid='public.appointment_resources'::regclass)) then
  raise exception 'LIFECYCLE_UNREVIEWED_TRIGGER_OR_RULE' using errcode='55000'; end if;
 if not exists(select 1 from pg_trigger where tgrelid='public.appointments'::regclass and tgname='appointments_updated_at' and tgfoid='public.set_updated_at()'::regprocedure and tgenabled in ('O','A') and tgtype=19) then raise exception 'LIFECYCLE_TIMESTAMP_TRIGGER_DRIFT' using errcode='55000'; end if;
 if not exists(select 1 from pg_trigger where tgrelid='public.appointments'::regclass
   and tgname='appointments_booking_operation_guard' and tgenabled in ('O','A')
   and tgfoid='public.guard_appointment_booking_operation_link_v1()'::regprocedure)
   or exists(select 1 from pg_trigger where tgisinternal and tgrelid in
    ('public.appointments'::regclass,'public.appointment_resources'::regclass) and tgenabled not in ('O','A')) then
  raise exception 'LIFECYCLE_DISABLED_INTEGRITY_TRIGGER' using errcode='55000'; end if;
 if not exists(select 1 from pg_constraint where conrelid='public.appointment_resources'::regclass
   and conname='appointment_resources_appointment_id_fkey' and conkey=array[(select attnum from pg_attribute where attrelid='public.appointment_resources'::regclass and attname='appointment_id')]::smallint[]
   and confkey=array[(select attnum from pg_attribute where attrelid='public.appointments'::regclass and attname='id')]::smallint[]) then
  raise exception 'LIFECYCLE_RESOURCE_FK_KEYS' using errcode='55000'; end if;
 if not has_table_privilege('service_role','public.appointments','UPDATE')
   or not has_table_privilege('service_role','public.appointment_resources','INSERT,DELETE') then
  raise exception 'LIFECYCLE_EXISTING_DML_GRANT_REQUIRED' using errcode='55000'; end if;
end $capability$;

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

create function booking_lifecycle_private.guard_appointment_mutation_v2() returns trigger
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
 if new.before_image is distinct from jsonb_build_object('id',a.id,'business_id',a.business_id,'booking_operation_id',a.booking_operation_id,'customer_id',a.customer_id,'location_id',a.location_id,'service_id',a.service_id,'staff_id',a.staff_id,'start_time',to_char(a.start_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'end_time',to_char(a.end_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'status',a.status,'notes',a.notes,'room_id',a.room_id,'price_cents',a.price_cents,'tax_cents',a.tax_cents,'deposit_cents',a.deposit_cents,'operational_revision',a.operational_revision) then raise exception 'LIFECYCLE_JOURNAL_PREIMAGE' using errcode='23514'; end if;
 if (select array_agg(x order by x) from jsonb_object_keys(new.after_image) x) is distinct from array['booking_operation_id','business_id','customer_id','deposit_cents','end_time','id','location_id','notes','operational_revision','price_cents','room_id','service_id','staff_id','start_time','status','tax_cents']::text[] then raise exception 'LIFECYCLE_JOURNAL_KEYS' using errcode='23514'; end if;
 select coalesce(array_agg(resource_id order by resource_id),'{}'::uuid[]) into resources from public.appointment_resources where appointment_id=a.id;
 if resources is distinct from new.before_resource_ids
    or new.after_resource_ids is distinct from array(select distinct x from unnest(new.after_resource_ids) x order by x) then raise exception 'LIFECYCLE_JOURNAL_RESOURCE_SNAPSHOT' using errcode='23514'; end if;
 if char_length(new.before_image->>'notes')>10000 or char_length(new.after_image->>'notes')>10000 then raise exception 'LIFECYCLE_NOTES_OVERSIZE_HOLD' using errcode='22023'; end if;
 -- Decode against the actual row type, then reconstruct exact normalized types/format.
 select * into a from jsonb_populate_record(a,new.after_image);
 if new.after_image is distinct from jsonb_build_object('id',a.id,'business_id',a.business_id,'booking_operation_id',a.booking_operation_id,'customer_id',a.customer_id,'location_id',a.location_id,'service_id',a.service_id,'staff_id',a.staff_id,'start_time',to_char(a.start_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'end_time',to_char(a.end_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'status',a.status,'notes',a.notes,'room_id',a.room_id,'price_cents',a.price_cents,'tax_cents',a.tax_cents,'deposit_cents',a.deposit_cents,'operational_revision',a.operational_revision) or not isfinite(a.start_time) or not isfinite(a.end_time) or a.end_time<=a.start_time then raise exception 'LIFECYCLE_JOURNAL_IMAGE_FORMAT' using errcode='23514'; end if;
 select coalesce(array_agg(x order by x),'{}'::text[]) into changed from (
   select x from jsonb_object_keys(new.before_image) x where new.before_image->x is distinct from new.after_image->x
   union all select 'resource_ids' where new.before_resource_ids is distinct from new.after_resource_ids) q;
 expected_fields:=case when new.command='STATUS' then array['operational_revision','status']::text[] when new.command='NOTES' then array['notes','operational_revision']::text[] when new.command='RESCHEDULE' then array['end_time','operational_revision','start_time']::text[] when new.command='RESIZE' then array['end_time','operational_revision']::text[] when new.command='REASSIGN_STAFF' then array['end_time','operational_revision','staff_id','start_time']::text[] when new.command='REASSIGN_LOCATION' then array['end_time','location_id','operational_revision','resource_ids','room_id','staff_id','start_time']::text[] when new.command='RESOURCES' then array['operational_revision','resource_ids','room_id']::text[] when new.command='SERVICE_CORRECTION' then array['end_time','operational_revision','resource_ids','room_id','service_id','staff_id','start_time']::text[] when new.command='CANCEL' then array['operational_revision','status']::text[] when new.command='REASSIGN_CUSTOMER' then array['customer_id','operational_revision']::text[] else '{}'::text[] end;
 if changed is distinct from new.allowed_fields or not changed <@ expected_fields
    or (new.outcome='APPLIED' and (cardinality(changed)<2 or not 'operational_revision'=any(changed)))
    or (new.before_image->>'operational_revision')::bigint is distinct from new.observed_revision
    or (new.after_image->>'operational_revision')::bigint is distinct from new.result_revision then raise exception 'LIFECYCLE_JOURNAL_FIELD_SET' using errcode='23514'; end if;
 if new.command='CANCEL' and new.after_image->>'status'<>'cancelled' then raise exception 'LIFECYCLE_CANCEL_TARGET' using errcode='23514'; end if;
 if new.before_image->>'status'='cancelled' and new.command not in ('NOTES','CANCEL') then raise exception 'LIFECYCLE_TERMINAL' using errcode='23514'; end if;
 return new;
end $g$;

create or replace function public.guard_appointment_booking_operation_link_v1() returns trigger
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
  old_image:=jsonb_build_object('id',old.id,'business_id',old.business_id,'booking_operation_id',old.booking_operation_id,'customer_id',old.customer_id,'location_id',old.location_id,'service_id',old.service_id,'staff_id',old.staff_id,'start_time',to_char(old.start_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'end_time',to_char(old.end_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'status',old.status,'notes',old.notes,'room_id',old.room_id,'price_cents',old.price_cents,'tax_cents',old.tax_cents,'deposit_cents',old.deposit_cents,'operational_revision',old.operational_revision); new_image:=jsonb_build_object('id',new.id,'business_id',new.business_id,'booking_operation_id',new.booking_operation_id,'customer_id',new.customer_id,'location_id',new.location_id,'service_id',new.service_id,'staff_id',new.staff_id,'start_time',to_char(new.start_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'end_time',to_char(new.end_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'status',new.status,'notes',new.notes,'room_id',new.room_id,'price_cents',new.price_cents,'tax_cents',new.tax_cents,'deposit_cents',new.deposit_cents,'operational_revision',new.operational_revision);
  if old_image=new_image then return new; end if;
 end if;
 if current_user<>'service_role' then raise exception 'BOOKING_OPERATION_SERVICE_ROLE_REQUIRED' using errcode='42501'; end if;
  select *
  into operation_row
  from public.commerce_booking_operations operation_source
  where operation_source.id = new.booking_operation_id
    and operation_source.business_id = new.business_id;
  if not found then
    raise exception 'BOOKING_OPERATION_NOT_FOUND'
      using errcode = '23503';
  end if;

  expected_notes := case
    when operation_row.package_id is not null then
      concat_ws(
        E'\n',
        nullif(operation_row.appointment_notes, ''),
        'Package: ' || operation_row.package_name ||
          ' (' || operation_row.package_id::text || ')'
      )
    else operation_row.appointment_notes
  end;

  if tg_op = 'INSERT' then
    if operation_row.lifecycle_state <> 'OPEN'
       or row(
         new.business_id,
         new.customer_id,
         new.location_id,
         new.service_id,
         new.staff_id,
         new.start_time,
         new.end_time,
         new.status::text,
         new.notes,
         new.room_id,
         new.price_cents,
         new.tax_cents,
         new.deposit_cents
       ) is distinct from row(
         operation_row.business_id,
         operation_row.customer_id,
         operation_row.location_id,
         operation_row.service_id,
         operation_row.staff_id,
         operation_row.requested_start,
         operation_row.requested_end,
         operation_row.requested_status,
         expected_notes,
         operation_row.room_id,
         operation_row.subtotal_cents,
         operation_row.tax_cents,
         operation_row.deposit_required_cents
       ) then
      raise exception 'APPOINTMENT_BOOKING_OPERATION_REQUEST_MISMATCH'
        using errcode = '23514';
    end if;
    return new;
  end if;


 if new.operational_revision-old.operational_revision<>1 or old.operational_revision=9223372036854775807
    or row(old.price_cents,old.tax_cents,old.deposit_cents,old.amount_paid_cents,old.amount_refunded_cents,old.payment_status)
       is distinct from row(new.price_cents,new.tax_cents,new.deposit_cents,new.amount_paid_cents,new.amount_refunded_cents,new.payment_status) then raise exception 'LIFECYCLE_REVISION_OR_MONEY_CHANGE' using errcode='23514'; end if;
 select count(*) into n from booking_lifecycle_private.appointment_mutations m where m.transaction_id=pg_current_xact_id() and m.business_id=old.business_id and m.appointment_id=old.id and m.operation_id=old.booking_operation_id and m.outcome='APPLIED' and m.observed_revision=old.operational_revision and m.result_revision=new.operational_revision and m.before_image=old_image and m.after_image=new_image;
 if n<>1 then raise exception 'LIFECYCLE_EXACT_PERMIT_REQUIRED' using errcode='23514'; end if;
 select * into strict j from booking_lifecycle_private.appointment_mutations m where m.transaction_id=pg_current_xact_id() and m.business_id=old.business_id and m.appointment_id=old.id and m.effect_revision=new.operational_revision;
 if not exists(select 1 from public.businesses b where b.id=old.business_id and (b.owner_id=j.actor_id or exists(select 1 from public.business_members m where m.business_id=b.id and m.user_id=j.actor_id and m.role in ('owner','admin')))) then raise exception 'LIFECYCLE_AUTHORITY_CHANGED' using errcode='42501'; end if;
 if new.customer_id is distinct from old.customer_id then
  if j.command<>'REASSIGN_CUSTOMER' or old.status::text='cancelled' or operation_row.lifecycle_state<>'CLOSED' or operation_row.close_reason<>'CUSTOMER_REASSIGNED' or operation_row.replacement_customer_id is distinct from new.customer_id
     or exists(select 1 from public.commerce_transactions t where t.appointment_id=old.id)
 or exists(select 1 from public.commerce_refunds f where f.appointment_id=old.id or exists(select 1 from public.commerce_transactions t where t.id=f.transaction_id and t.appointment_id=old.id))
     or exists(select 1 from public.commerce_payment_attempts t where t.id=j.original_attempt_id and (t.execution_state not in ('FAILED','SKIPPED') or t.recovery_disposition<>'DO_NOT_RETRY'))
     or not exists(select 1 from public.customers c where c.id=new.customer_id and c.business_id=new.business_id) then raise exception 'APPOINTMENT_LEDGER_CUSTOMER_REASSIGNMENT_FORBIDDEN' using errcode='23514'; end if;
 end if;
 if new.status::text='cancelled' and old.status::text<>'cancelled' and (j.command<>'CANCEL' or operation_row.lifecycle_state<>'CLOSED' or operation_row.close_reason<>'APPOINTMENT_CANCELLED') then raise exception 'LIFECYCLE_CANCEL_FENCE_REQUIRED' using errcode='23514'; end if;
 if array(select r.resource_id from public.appointment_resources r where r.appointment_id=old.id order by r.resource_id) is distinct from j.after_resource_ids then raise exception 'LIFECYCLE_RESOURCE_FINAL_STATE' using errcode='23514'; end if;
 return new;
end $g$;

create function booking_lifecycle_private.guard_appointment_resource_v2() returns trigger
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
       case when op.package_id is null then op.appointment_notes else concat_ws(E'\n',nullif(op.appointment_notes,''),'Package: '||op.package_name||' ('||op.package_id||')') end)
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
end $g$;

create function public.revise_booking_notes_v2(p_business_id uuid,p_operation_id uuid,p_appointment_id uuid,p_actor_id uuid,p_mutation_id uuid,p_expected_revision bigint,p_reason text,p_notes text) returns table(outcome text,appointment_id uuid,operation_id uuid,mutation_id uuid,effect_revision bigint,current_revision bigint,current_status public.appointment_status,original_attempt_id uuid,recovery_required boolean)
language plpgsql volatile security invoker set search_path=pg_catalog,pg_temp as $f$
#variable_conflict use_column
declare a public.appointments%rowtype; desired public.appointments%rowtype; op public.commerce_booking_operations%rowtype;
 t public.commerce_payment_attempts%rowtype; prior record; resources uuid[]; target_resources uuid[];
 before_j jsonb; after_j jsonb; request_j jsonb; changed text[]; v_command text; v_reason text;
 v_outcome text; v_key uuid; v_origin text; v_effect bigint; v_recorded boolean:=false;
 v_workflow text[]; v_count integer; v_uid uuid; v_owner uuid;
 s public.services%rowtype; new_s public.services%rowtype; st public.staff%rowtype; loc public.locations%rowtype;
 pair public.staff_services%rowtype; effective_duration integer; v_name text; v_amount integer;
begin

if current_user<>'service_role' then raise exception 'LIFECYCLE_SERVICE_ROLE_REQUIRED' using errcode='42501'; end if;
 select b.owner_id into v_owner from public.businesses b where b.id=p_business_id for share;
 if not found then return query select 'NOT_AUTHORIZED'::text,null::uuid,null::uuid,null::uuid,null::bigint,null::bigint,null::public.appointment_status,null::uuid,true; return; end if;
 if v_owner is distinct from p_actor_id then
  perform 1 from public.business_members m where m.business_id=p_business_id and m.user_id=p_actor_id and m.role in ('owner','admin') for share;
  if not found then return query select 'NOT_AUTHORIZED'::text,null::uuid,null::uuid,null::uuid,null::bigint,null::bigint,null::public.appointment_status,null::uuid,true; return; end if;
 end if;

if p_business_id is null or p_operation_id is null or p_appointment_id is null or p_actor_id is null or p_mutation_id is null or p_expected_revision is null or p_expected_revision<0 or p_reason is null or char_length(btrim(p_reason)) not between 1 and 500 then raise exception 'LIFECYCLE_INVALID_INPUT' using errcode='22023'; end if;
 v_reason:=btrim(p_reason); v_key:=p_mutation_id; v_origin:='V2';

v_command:='NOTES';

perform pg_advisory_xact_lock(hashtextextended('booking-operation:'||p_operation_id::text,0));
 select * into t from public.commerce_payment_attempts x where x.business_id=p_business_id and x.booking_operation_id=p_operation_id for update;
 if not found then return query select 'UNKNOWN'::text,null::uuid,null::uuid,null::uuid,null::bigint,null::bigint,null::public.appointment_status,null::uuid,true; return; end if;
 select * into a from public.appointments x where x.id=p_appointment_id and x.business_id=p_business_id and x.booking_operation_id=p_operation_id for no key update;
 if not found then return query select 'UNKNOWN'::text,null::uuid,null::uuid,null::uuid,null::bigint,null::bigint,null::public.appointment_status,null::uuid,true; return; end if;
 select * into op from public.commerce_booking_operations x where x.id=p_operation_id and x.business_id=p_business_id for update;
 if not found or t.customer_id is distinct from op.customer_id or t.actor_id is distinct from op.actor_id or (t.appointment_id is not null and t.appointment_id<>a.id) then return query select 'UNKNOWN'::text,null::uuid,null::uuid,null::uuid,null::bigint,null::bigint,null::public.appointment_status,null::uuid,true; return; end if;
 resources:=array(select resource_id from public.appointment_resources where appointment_id=a.id order by resource_id);
 target_resources:=resources; desired:=a;

request_j:=jsonb_build_object('business_id',p_business_id,'operation_id',p_operation_id,'appointment_id',p_appointment_id,'actor_id',p_actor_id,'mutation_id',p_mutation_id,'expected_revision',p_expected_revision,'reason',v_reason,'origin',v_origin,'command',v_command)||jsonb_build_object('notes',nullif(p_notes,''));

select * into prior from booking_lifecycle_private.appointment_mutations m where m.business_id=p_business_id and m.appointment_id=p_appointment_id and m.mutation_id=p_mutation_id;
 if found then
  if prior.request is distinct from request_j then return query select 'CONFLICT'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,(t.execution_state in ('REQUESTED','FAILED') or a.customer_id is distinct from op.customer_id or exists(select 1 from public.commerce_payment_reconciliation z where z.attempt_id=t.id and z.is_financial and z.state not in ('COMPLETE','NOT_REQUIRED'))); return; end if;
  v_effect:=prior.effect_revision; return query select 'REPLAY'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,(t.execution_state in ('REQUESTED','FAILED') or a.customer_id is distinct from op.customer_id or exists(select 1 from public.commerce_payment_reconciliation z where z.attempt_id=t.id and z.is_financial and z.state not in ('COMPLETE','NOT_REQUIRED'))); return;
 end if;
 if a.operational_revision<>p_expected_revision then return query select 'STALE_REVISION'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,(t.execution_state in ('REQUESTED','FAILED') or a.customer_id is distinct from op.customer_id or exists(select 1 from public.commerce_payment_reconciliation z where z.attempt_id=t.id and z.is_financial and z.state not in ('COMPLETE','NOT_REQUIRED'))); return; end if;
 if char_length(a.notes)>10000 then return query select 'UNKNOWN'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,true; return; end if;
 before_j:=jsonb_build_object('id',a.id,'business_id',a.business_id,'booking_operation_id',a.booking_operation_id,'customer_id',a.customer_id,'location_id',a.location_id,'service_id',a.service_id,'staff_id',a.staff_id,'start_time',to_char(a.start_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'end_time',to_char(a.end_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'status',a.status,'notes',a.notes,'room_id',a.room_id,'price_cents',a.price_cents,'tax_cents',a.tax_cents,'deposit_cents',a.deposit_cents,'operational_revision',a.operational_revision);

select count(*) into v_count from public.commerce_transactions x where x.payment_attempt_id=t.id;
 if exists(select 1 from public.commerce_payment_attempt_events e where e.attempt_id=t.id and e.business_id<>t.business_id)
    or exists(select 1 from public.commerce_payment_reconciliation o where o.attempt_id=t.id and o.business_id<>t.business_id) then return query select 'UNKNOWN'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,true; return; end if;
 if t.execution_state in ('FAILED','SKIPPED') then
  if v_count<>0 or t.recovery_disposition<>'DO_NOT_RETRY' or t.resolved_at is null
     or exists(select 1 from public.commerce_payment_reconciliation o where o.attempt_id=t.id)
     or (select count(*) from public.commerce_payment_attempt_events e where e.attempt_id=t.id)<>2
     or (select count(*) from public.commerce_payment_attempt_events e where e.attempt_id=t.id and e.event_type='REQUESTED' and e.money_state='NOT_RECORDED')<>1
     or (select count(*) from public.commerce_payment_attempt_events e where e.attempt_id=t.id and e.event_type=t.execution_state and e.money_state='NOT_RECORDED' and e.failure_class is not distinct from t.failure_class and e.failure_code is not distinct from t.failure_code)<>1 then return query select 'UNKNOWN'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,true; return; end if;
 elsif t.execution_state='ACCEPTED' then
  if v_count<>1 or not public.payment_projection_history_valid_v1(p_business_id,t.id)
    or not exists(select 1 from public.commerce_transactions x where x.payment_attempt_id=t.id and row(x.business_id,x.customer_id,x.appointment_id,x.kind,x.amount_cents,x.currency,x.status,x.provider,x.method,x.created_by) is not distinct from row(t.business_id,t.customer_id,t.appointment_id,t.payment_kind,t.amount_cents,t.currency,'succeeded'::text,'manual'::text,t.method,t.actor_id)) then return query select 'UNKNOWN'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,true; return; end if;
 elsif t.execution_state='REQUESTED' then
  if v_count<>0 or t.resolved_at is not null or t.recovery_disposition<>'RECOVER' or t.failure_class is not null or t.failure_code is not null
    or exists(select 1 from public.commerce_payment_reconciliation o where o.attempt_id=t.id)
    or (select count(*) from public.commerce_payment_attempt_events e where e.attempt_id=t.id)<>1
    or (select count(*) from public.commerce_payment_attempt_events e where e.attempt_id=t.id and e.event_type='REQUESTED' and e.money_state='NOT_RECORDED')<>1 then return query select 'UNKNOWN'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,true; return; end if;
 else return query select 'UNKNOWN'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,true; return; end if;

if char_length(p_notes)>10000 then raise exception 'LIFECYCLE_NOTES_LIMIT' using errcode='22023'; end if; desired.notes:=nullif(p_notes,'');

after_j:=jsonb_build_object('id',desired.id,'business_id',desired.business_id,'booking_operation_id',desired.booking_operation_id,'customer_id',desired.customer_id,'location_id',desired.location_id,'service_id',desired.service_id,'staff_id',desired.staff_id,'start_time',to_char(desired.start_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'end_time',to_char(desired.end_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'status',desired.status,'notes',desired.notes,'room_id',desired.room_id,'price_cents',desired.price_cents,'tax_cents',desired.tax_cents,'deposit_cents',desired.deposit_cents,'operational_revision',desired.operational_revision);
 if after_j=before_j and target_resources=resources then v_outcome:='NO_CHANGE'; v_effect:=null; changed:='{}'::text[];
 else
  if a.operational_revision=9223372036854775807 then raise exception 'LIFECYCLE_REVISION_EXHAUSTED' using errcode='22003'; end if;
  desired.operational_revision:=a.operational_revision+1; after_j:=jsonb_build_object('id',desired.id,'business_id',desired.business_id,'booking_operation_id',desired.booking_operation_id,'customer_id',desired.customer_id,'location_id',desired.location_id,'service_id',desired.service_id,'staff_id',desired.staff_id,'start_time',to_char(desired.start_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'end_time',to_char(desired.end_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'status',desired.status,'notes',desired.notes,'room_id',desired.room_id,'price_cents',desired.price_cents,'tax_cents',desired.tax_cents,'deposit_cents',desired.deposit_cents,'operational_revision',desired.operational_revision);
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
  if not found or (to_jsonb(a)-'updated_at') is distinct from (to_jsonb(desired)-'updated_at') or row(a.amount_paid_cents,a.amount_refunded_cents,a.payment_status) is distinct from row(desired.amount_paid_cents,desired.amount_refunded_cents,desired.payment_status) or jsonb_build_object('id',a.id,'business_id',a.business_id,'booking_operation_id',a.booking_operation_id,'customer_id',a.customer_id,'location_id',a.location_id,'service_id',a.service_id,'staff_id',a.staff_id,'start_time',to_char(a.start_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'end_time',to_char(a.end_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'status',a.status,'notes',a.notes,'room_id',a.room_id,'price_cents',a.price_cents,'tax_cents',a.tax_cents,'deposit_cents',a.deposit_cents,'operational_revision',a.operational_revision) is distinct from after_j or array(select resource_id from public.appointment_resources where appointment_id=a.id order by resource_id) is distinct from target_resources then raise exception 'LIFECYCLE_FINAL_STATE_MISMATCH' using errcode='23514'; end if;
 end if;
 if not exists(select 1 from public.commerce_booking_operations x where x.id=op.id and to_jsonb(x)=to_jsonb(op)) or not exists(select 1 from public.commerce_payment_attempts x where x.id=t.id and to_jsonb(x)=to_jsonb(t)) then raise exception 'LIFECYCLE_FINANCIAL_IDENTITY_CHANGED' using errcode='23514'; end if;
 return query select v_outcome,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,(t.execution_state in ('REQUESTED','FAILED') or a.customer_id is distinct from op.customer_id or exists(select 1 from public.commerce_payment_reconciliation z where z.attempt_id=t.id and z.is_financial and z.state not in ('COMPLETE','NOT_REQUIRED')));
end $f$;

create function public.transition_booking_appointment_v2(p_business_id uuid,p_operation_id uuid,p_appointment_id uuid,p_actor_id uuid,p_mutation_id uuid,p_expected_revision bigint,p_reason text,p_target_status public.appointment_status,p_correction boolean) returns table(outcome text,appointment_id uuid,operation_id uuid,mutation_id uuid,effect_revision bigint,current_revision bigint,current_status public.appointment_status,original_attempt_id uuid,recovery_required boolean)
language plpgsql volatile security invoker set search_path=pg_catalog,pg_temp as $f$
#variable_conflict use_column
declare a public.appointments%rowtype; desired public.appointments%rowtype; op public.commerce_booking_operations%rowtype;
 t public.commerce_payment_attempts%rowtype; prior record; resources uuid[]; target_resources uuid[];
 before_j jsonb; after_j jsonb; request_j jsonb; changed text[]; v_command text; v_reason text;
 v_outcome text; v_key uuid; v_origin text; v_effect bigint; v_recorded boolean:=false;
 v_workflow text[]; v_count integer; v_uid uuid; v_owner uuid;
 s public.services%rowtype; new_s public.services%rowtype; st public.staff%rowtype; loc public.locations%rowtype;
 pair public.staff_services%rowtype; effective_duration integer; v_name text; v_amount integer;
begin

if current_user<>'service_role' then raise exception 'LIFECYCLE_SERVICE_ROLE_REQUIRED' using errcode='42501'; end if;
 select b.owner_id into v_owner from public.businesses b where b.id=p_business_id for share;
 if not found then return query select 'NOT_AUTHORIZED'::text,null::uuid,null::uuid,null::uuid,null::bigint,null::bigint,null::public.appointment_status,null::uuid,true; return; end if;
 if v_owner is distinct from p_actor_id then
  perform 1 from public.business_members m where m.business_id=p_business_id and m.user_id=p_actor_id and m.role in ('owner','admin') for share;
  if not found then return query select 'NOT_AUTHORIZED'::text,null::uuid,null::uuid,null::uuid,null::bigint,null::bigint,null::public.appointment_status,null::uuid,true; return; end if;
 end if;

if p_business_id is null or p_operation_id is null or p_appointment_id is null or p_actor_id is null or p_mutation_id is null or p_expected_revision is null or p_expected_revision<0 or p_reason is null or char_length(btrim(p_reason)) not between 1 and 500 then raise exception 'LIFECYCLE_INVALID_INPUT' using errcode='22023'; end if;
 v_reason:=btrim(p_reason); v_key:=p_mutation_id; v_origin:='V2';

v_command:='STATUS';

perform pg_advisory_xact_lock(hashtextextended('booking-operation:'||p_operation_id::text,0));
 select * into t from public.commerce_payment_attempts x where x.business_id=p_business_id and x.booking_operation_id=p_operation_id for update;
 if not found then return query select 'UNKNOWN'::text,null::uuid,null::uuid,null::uuid,null::bigint,null::bigint,null::public.appointment_status,null::uuid,true; return; end if;
 select * into a from public.appointments x where x.id=p_appointment_id and x.business_id=p_business_id and x.booking_operation_id=p_operation_id for no key update;
 if not found then return query select 'UNKNOWN'::text,null::uuid,null::uuid,null::uuid,null::bigint,null::bigint,null::public.appointment_status,null::uuid,true; return; end if;
 select * into op from public.commerce_booking_operations x where x.id=p_operation_id and x.business_id=p_business_id for update;
 if not found or t.customer_id is distinct from op.customer_id or t.actor_id is distinct from op.actor_id or (t.appointment_id is not null and t.appointment_id<>a.id) then return query select 'UNKNOWN'::text,null::uuid,null::uuid,null::uuid,null::bigint,null::bigint,null::public.appointment_status,null::uuid,true; return; end if;
 resources:=array(select resource_id from public.appointment_resources where appointment_id=a.id order by resource_id);
 target_resources:=resources; desired:=a;

request_j:=jsonb_build_object('business_id',p_business_id,'operation_id',p_operation_id,'appointment_id',p_appointment_id,'actor_id',p_actor_id,'mutation_id',p_mutation_id,'expected_revision',p_expected_revision,'reason',v_reason,'origin',v_origin,'command',v_command)||jsonb_build_object('target_status',p_target_status,'correction',p_correction);

select * into prior from booking_lifecycle_private.appointment_mutations m where m.business_id=p_business_id and m.appointment_id=p_appointment_id and m.mutation_id=p_mutation_id;
 if found then
  if prior.request is distinct from request_j then return query select 'CONFLICT'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,(t.execution_state in ('REQUESTED','FAILED') or a.customer_id is distinct from op.customer_id or exists(select 1 from public.commerce_payment_reconciliation z where z.attempt_id=t.id and z.is_financial and z.state not in ('COMPLETE','NOT_REQUIRED'))); return; end if;
  v_effect:=prior.effect_revision; return query select 'REPLAY'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,(t.execution_state in ('REQUESTED','FAILED') or a.customer_id is distinct from op.customer_id or exists(select 1 from public.commerce_payment_reconciliation z where z.attempt_id=t.id and z.is_financial and z.state not in ('COMPLETE','NOT_REQUIRED'))); return;
 end if;
 if a.operational_revision<>p_expected_revision then return query select 'STALE_REVISION'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,(t.execution_state in ('REQUESTED','FAILED') or a.customer_id is distinct from op.customer_id or exists(select 1 from public.commerce_payment_reconciliation z where z.attempt_id=t.id and z.is_financial and z.state not in ('COMPLETE','NOT_REQUIRED'))); return; end if;
 if char_length(a.notes)>10000 then return query select 'UNKNOWN'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,true; return; end if;
 before_j:=jsonb_build_object('id',a.id,'business_id',a.business_id,'booking_operation_id',a.booking_operation_id,'customer_id',a.customer_id,'location_id',a.location_id,'service_id',a.service_id,'staff_id',a.staff_id,'start_time',to_char(a.start_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'end_time',to_char(a.end_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'status',a.status,'notes',a.notes,'room_id',a.room_id,'price_cents',a.price_cents,'tax_cents',a.tax_cents,'deposit_cents',a.deposit_cents,'operational_revision',a.operational_revision);

select count(*) into v_count from public.commerce_transactions x where x.payment_attempt_id=t.id;
 if exists(select 1 from public.commerce_payment_attempt_events e where e.attempt_id=t.id and e.business_id<>t.business_id)
    or exists(select 1 from public.commerce_payment_reconciliation o where o.attempt_id=t.id and o.business_id<>t.business_id) then return query select 'UNKNOWN'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,true; return; end if;
 if t.execution_state in ('FAILED','SKIPPED') then
  if v_count<>0 or t.recovery_disposition<>'DO_NOT_RETRY' or t.resolved_at is null
     or exists(select 1 from public.commerce_payment_reconciliation o where o.attempt_id=t.id)
     or (select count(*) from public.commerce_payment_attempt_events e where e.attempt_id=t.id)<>2
     or (select count(*) from public.commerce_payment_attempt_events e where e.attempt_id=t.id and e.event_type='REQUESTED' and e.money_state='NOT_RECORDED')<>1
     or (select count(*) from public.commerce_payment_attempt_events e where e.attempt_id=t.id and e.event_type=t.execution_state and e.money_state='NOT_RECORDED' and e.failure_class is not distinct from t.failure_class and e.failure_code is not distinct from t.failure_code)<>1 then return query select 'UNKNOWN'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,true; return; end if;
 elsif t.execution_state='ACCEPTED' then
  if v_count<>1 or not public.payment_projection_history_valid_v1(p_business_id,t.id)
    or not exists(select 1 from public.commerce_transactions x where x.payment_attempt_id=t.id and row(x.business_id,x.customer_id,x.appointment_id,x.kind,x.amount_cents,x.currency,x.status,x.provider,x.method,x.created_by) is not distinct from row(t.business_id,t.customer_id,t.appointment_id,t.payment_kind,t.amount_cents,t.currency,'succeeded'::text,'manual'::text,t.method,t.actor_id)) then return query select 'UNKNOWN'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,true; return; end if;
 elsif t.execution_state='REQUESTED' then
  if v_count<>0 or t.resolved_at is not null or t.recovery_disposition<>'RECOVER' or t.failure_class is not null or t.failure_code is not null
    or exists(select 1 from public.commerce_payment_reconciliation o where o.attempt_id=t.id)
    or (select count(*) from public.commerce_payment_attempt_events e where e.attempt_id=t.id)<>1
    or (select count(*) from public.commerce_payment_attempt_events e where e.attempt_id=t.id and e.event_type='REQUESTED' and e.money_state='NOT_RECORDED')<>1 then return query select 'UNKNOWN'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,true; return; end if;
 else return query select 'UNKNOWN'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,true; return; end if;

if p_target_status is null or p_correction is null or p_target_status::text in ('scheduled','cancelled') then return query select 'CONFLICT'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,(t.execution_state in ('REQUESTED','FAILED') or a.customer_id is distinct from op.customer_id or exists(select 1 from public.commerce_payment_reconciliation z where z.attempt_id=t.id and z.is_financial and z.state not in ('COMPLETE','NOT_REQUIRED'))); return; end if;
 if a.status::text='cancelled' then return query select 'TERMINAL'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,(t.execution_state in ('REQUESTED','FAILED') or a.customer_id is distinct from op.customer_id or exists(select 1 from public.commerce_payment_reconciliation z where z.attempt_id=t.id and z.is_financial and z.state not in ('COMPLETE','NOT_REQUIRED'))); return; end if;
 select array_agg(x order by ord) into v_workflow from public.businesses b cross join lateral jsonb_array_elements_text(case when jsonb_typeof(b.appointment_status_workflow)='array' then b.appointment_status_workflow else '[]'::jsonb end) with ordinality as workflow(x,ord) where b.id=p_business_id and x in ('pending','confirmed','arrived','waiting','in_progress','completed','cancelled','no_show');
 if cardinality(v_workflow) is null or cardinality(v_workflow)=0 then v_workflow:=array['confirmed','arrived','waiting','in_progress','completed','cancelled','no_show']; end if;
 if p_target_status<>a.status and not p_correction and not (a.status::text='pending' and p_target_status::text='confirmed') then
  if a.status::text in ('completed','no_show') or not p_target_status::text=any(v_workflow) or (p_target_status::text<>'no_show' and coalesce(array_position(v_workflow,p_target_status::text),0)<=coalesce(array_position(v_workflow,a.status::text),0)) then return query select 'CONFLICT'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,(t.execution_state in ('REQUESTED','FAILED') or a.customer_id is distinct from op.customer_id or exists(select 1 from public.commerce_payment_reconciliation z where z.attempt_id=t.id and z.is_financial and z.state not in ('COMPLETE','NOT_REQUIRED'))); return; end if;
 end if;
 desired.status:=p_target_status;

after_j:=jsonb_build_object('id',desired.id,'business_id',desired.business_id,'booking_operation_id',desired.booking_operation_id,'customer_id',desired.customer_id,'location_id',desired.location_id,'service_id',desired.service_id,'staff_id',desired.staff_id,'start_time',to_char(desired.start_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'end_time',to_char(desired.end_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'status',desired.status,'notes',desired.notes,'room_id',desired.room_id,'price_cents',desired.price_cents,'tax_cents',desired.tax_cents,'deposit_cents',desired.deposit_cents,'operational_revision',desired.operational_revision);
 if after_j=before_j and target_resources=resources then v_outcome:='NO_CHANGE'; v_effect:=null; changed:='{}'::text[];
 else
  if a.operational_revision=9223372036854775807 then raise exception 'LIFECYCLE_REVISION_EXHAUSTED' using errcode='22003'; end if;
  desired.operational_revision:=a.operational_revision+1; after_j:=jsonb_build_object('id',desired.id,'business_id',desired.business_id,'booking_operation_id',desired.booking_operation_id,'customer_id',desired.customer_id,'location_id',desired.location_id,'service_id',desired.service_id,'staff_id',desired.staff_id,'start_time',to_char(desired.start_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'end_time',to_char(desired.end_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'status',desired.status,'notes',desired.notes,'room_id',desired.room_id,'price_cents',desired.price_cents,'tax_cents',desired.tax_cents,'deposit_cents',desired.deposit_cents,'operational_revision',desired.operational_revision);
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
  if not found or (to_jsonb(a)-'updated_at') is distinct from (to_jsonb(desired)-'updated_at') or row(a.amount_paid_cents,a.amount_refunded_cents,a.payment_status) is distinct from row(desired.amount_paid_cents,desired.amount_refunded_cents,desired.payment_status) or jsonb_build_object('id',a.id,'business_id',a.business_id,'booking_operation_id',a.booking_operation_id,'customer_id',a.customer_id,'location_id',a.location_id,'service_id',a.service_id,'staff_id',a.staff_id,'start_time',to_char(a.start_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'end_time',to_char(a.end_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'status',a.status,'notes',a.notes,'room_id',a.room_id,'price_cents',a.price_cents,'tax_cents',a.tax_cents,'deposit_cents',a.deposit_cents,'operational_revision',a.operational_revision) is distinct from after_j or array(select resource_id from public.appointment_resources where appointment_id=a.id order by resource_id) is distinct from target_resources then raise exception 'LIFECYCLE_FINAL_STATE_MISMATCH' using errcode='23514'; end if;
 end if;
 if not exists(select 1 from public.commerce_booking_operations x where x.id=op.id and to_jsonb(x)=to_jsonb(op)) or not exists(select 1 from public.commerce_payment_attempts x where x.id=t.id and to_jsonb(x)=to_jsonb(t)) then raise exception 'LIFECYCLE_FINANCIAL_IDENTITY_CHANGED' using errcode='23514'; end if;
 return query select v_outcome,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,(t.execution_state in ('REQUESTED','FAILED') or a.customer_id is distinct from op.customer_id or exists(select 1 from public.commerce_payment_reconciliation z where z.attempt_id=t.id and z.is_financial and z.state not in ('COMPLETE','NOT_REQUIRED')));
end $f$;

create function public.revise_booking_schedule_v2(p_business_id uuid,p_operation_id uuid,p_appointment_id uuid,p_actor_id uuid,p_mutation_id uuid,p_expected_revision bigint,p_reason text,p_command text,p_location_id uuid,p_service_id uuid,p_staff_id uuid,p_start_time timestamptz,p_end_time timestamptz,p_room_id uuid,p_resource_ids uuid[]) returns table(outcome text,appointment_id uuid,operation_id uuid,mutation_id uuid,effect_revision bigint,current_revision bigint,current_status public.appointment_status,original_attempt_id uuid,recovery_required boolean)
language plpgsql volatile security invoker set search_path=pg_catalog,pg_temp as $f$
#variable_conflict use_column
declare a public.appointments%rowtype; desired public.appointments%rowtype; op public.commerce_booking_operations%rowtype;
 t public.commerce_payment_attempts%rowtype; prior record; resources uuid[]; target_resources uuid[];
 before_j jsonb; after_j jsonb; request_j jsonb; changed text[]; v_command text; v_reason text;
 v_outcome text; v_key uuid; v_origin text; v_effect bigint; v_recorded boolean:=false;
 v_workflow text[]; v_count integer; v_uid uuid; v_owner uuid;
 s public.services%rowtype; new_s public.services%rowtype; st public.staff%rowtype; loc public.locations%rowtype;
 pair public.staff_services%rowtype; effective_duration integer; v_name text; v_amount integer;
begin

if current_user<>'service_role' then raise exception 'LIFECYCLE_SERVICE_ROLE_REQUIRED' using errcode='42501'; end if;
 select b.owner_id into v_owner from public.businesses b where b.id=p_business_id for share;
 if not found then return query select 'NOT_AUTHORIZED'::text,null::uuid,null::uuid,null::uuid,null::bigint,null::bigint,null::public.appointment_status,null::uuid,true; return; end if;
 if v_owner is distinct from p_actor_id then
  perform 1 from public.business_members m where m.business_id=p_business_id and m.user_id=p_actor_id and m.role in ('owner','admin') for share;
  if not found then return query select 'NOT_AUTHORIZED'::text,null::uuid,null::uuid,null::uuid,null::bigint,null::bigint,null::public.appointment_status,null::uuid,true; return; end if;
 end if;

if p_business_id is null or p_operation_id is null or p_appointment_id is null or p_actor_id is null or p_mutation_id is null or p_expected_revision is null or p_expected_revision<0 or p_reason is null or char_length(btrim(p_reason)) not between 1 and 500 then raise exception 'LIFECYCLE_INVALID_INPUT' using errcode='22023'; end if;
 v_reason:=btrim(p_reason); v_key:=p_mutation_id; v_origin:='V2';

v_command:=p_command;

perform pg_advisory_xact_lock(hashtextextended('booking-operation:'||p_operation_id::text,0));
 select * into t from public.commerce_payment_attempts x where x.business_id=p_business_id and x.booking_operation_id=p_operation_id for update;
 if not found then return query select 'UNKNOWN'::text,null::uuid,null::uuid,null::uuid,null::bigint,null::bigint,null::public.appointment_status,null::uuid,true; return; end if;
 select * into a from public.appointments x where x.id=p_appointment_id and x.business_id=p_business_id and x.booking_operation_id=p_operation_id for no key update;
 if not found then return query select 'UNKNOWN'::text,null::uuid,null::uuid,null::uuid,null::bigint,null::bigint,null::public.appointment_status,null::uuid,true; return; end if;
 select * into op from public.commerce_booking_operations x where x.id=p_operation_id and x.business_id=p_business_id for update;
 if not found or t.customer_id is distinct from op.customer_id or t.actor_id is distinct from op.actor_id or (t.appointment_id is not null and t.appointment_id<>a.id) then return query select 'UNKNOWN'::text,null::uuid,null::uuid,null::uuid,null::bigint,null::bigint,null::public.appointment_status,null::uuid,true; return; end if;
 resources:=array(select resource_id from public.appointment_resources where appointment_id=a.id order by resource_id);
 target_resources:=resources; desired:=a;

request_j:=jsonb_build_object('business_id',p_business_id,'operation_id',p_operation_id,'appointment_id',p_appointment_id,'actor_id',p_actor_id,'mutation_id',p_mutation_id,'expected_revision',p_expected_revision,'reason',v_reason,'origin',v_origin,'command',v_command)||jsonb_build_object('location_id',p_location_id,'service_id',p_service_id,'staff_id',p_staff_id,'start_time',to_char(p_start_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'end_time',to_char(p_end_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'room_id',p_room_id,'resource_ids',array(select x from unnest(p_resource_ids) x order by x));

select * into prior from booking_lifecycle_private.appointment_mutations m where m.business_id=p_business_id and m.appointment_id=p_appointment_id and m.mutation_id=p_mutation_id;
 if found then
  if prior.request is distinct from request_j then return query select 'CONFLICT'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,(t.execution_state in ('REQUESTED','FAILED') or a.customer_id is distinct from op.customer_id or exists(select 1 from public.commerce_payment_reconciliation z where z.attempt_id=t.id and z.is_financial and z.state not in ('COMPLETE','NOT_REQUIRED'))); return; end if;
  v_effect:=prior.effect_revision; return query select 'REPLAY'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,(t.execution_state in ('REQUESTED','FAILED') or a.customer_id is distinct from op.customer_id or exists(select 1 from public.commerce_payment_reconciliation z where z.attempt_id=t.id and z.is_financial and z.state not in ('COMPLETE','NOT_REQUIRED'))); return;
 end if;
 if a.operational_revision<>p_expected_revision then return query select 'STALE_REVISION'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,(t.execution_state in ('REQUESTED','FAILED') or a.customer_id is distinct from op.customer_id or exists(select 1 from public.commerce_payment_reconciliation z where z.attempt_id=t.id and z.is_financial and z.state not in ('COMPLETE','NOT_REQUIRED'))); return; end if;
 if char_length(a.notes)>10000 then return query select 'UNKNOWN'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,true; return; end if;
 before_j:=jsonb_build_object('id',a.id,'business_id',a.business_id,'booking_operation_id',a.booking_operation_id,'customer_id',a.customer_id,'location_id',a.location_id,'service_id',a.service_id,'staff_id',a.staff_id,'start_time',to_char(a.start_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'end_time',to_char(a.end_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'status',a.status,'notes',a.notes,'room_id',a.room_id,'price_cents',a.price_cents,'tax_cents',a.tax_cents,'deposit_cents',a.deposit_cents,'operational_revision',a.operational_revision);

if p_command is null or p_command not in ('RESCHEDULE','RESIZE','REASSIGN_STAFF','REASSIGN_LOCATION','RESOURCES','SERVICE_CORRECTION') or p_location_id is null or p_service_id is null or p_staff_id is null or p_start_time is null or p_end_time is null or not isfinite(p_start_time) or not isfinite(p_end_time) or p_end_time<=p_start_time or p_resource_ids is null or coalesce(array_ndims(p_resource_ids),1)<>1 or array_position(p_resource_ids,null) is not null or cardinality(p_resource_ids)<>(select count(distinct x) from unnest(p_resource_ids) x) then raise exception 'LIFECYCLE_INVALID_SCHEDULE' using errcode='22023'; end if;
 if a.status::text='cancelled' then return query select 'TERMINAL'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,(t.execution_state in ('REQUESTED','FAILED') or a.customer_id is distinct from op.customer_id or exists(select 1 from public.commerce_payment_reconciliation z where z.attempt_id=t.id and z.is_financial and z.state not in ('COMPLETE','NOT_REQUIRED'))); return; end if;

select count(*) into v_count from public.commerce_transactions x where x.payment_attempt_id=t.id;
 if exists(select 1 from public.commerce_payment_attempt_events e where e.attempt_id=t.id and e.business_id<>t.business_id)
    or exists(select 1 from public.commerce_payment_reconciliation o where o.attempt_id=t.id and o.business_id<>t.business_id) then return query select 'UNKNOWN'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,true; return; end if;
 if t.execution_state in ('FAILED','SKIPPED') then
  if v_count<>0 or t.recovery_disposition<>'DO_NOT_RETRY' or t.resolved_at is null
     or exists(select 1 from public.commerce_payment_reconciliation o where o.attempt_id=t.id)
     or (select count(*) from public.commerce_payment_attempt_events e where e.attempt_id=t.id)<>2
     or (select count(*) from public.commerce_payment_attempt_events e where e.attempt_id=t.id and e.event_type='REQUESTED' and e.money_state='NOT_RECORDED')<>1
     or (select count(*) from public.commerce_payment_attempt_events e where e.attempt_id=t.id and e.event_type=t.execution_state and e.money_state='NOT_RECORDED' and e.failure_class is not distinct from t.failure_class and e.failure_code is not distinct from t.failure_code)<>1 then return query select 'UNKNOWN'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,true; return; end if;
 elsif t.execution_state='ACCEPTED' then
  if v_count<>1 or not public.payment_projection_history_valid_v1(p_business_id,t.id)
    or not exists(select 1 from public.commerce_transactions x where x.payment_attempt_id=t.id and row(x.business_id,x.customer_id,x.appointment_id,x.kind,x.amount_cents,x.currency,x.status,x.provider,x.method,x.created_by) is not distinct from row(t.business_id,t.customer_id,t.appointment_id,t.payment_kind,t.amount_cents,t.currency,'succeeded'::text,'manual'::text,t.method,t.actor_id)) then return query select 'UNKNOWN'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,true; return; end if;
 elsif t.execution_state='REQUESTED' then
  if v_count<>0 or t.resolved_at is not null or t.recovery_disposition<>'RECOVER' or t.failure_class is not null or t.failure_code is not null
    or exists(select 1 from public.commerce_payment_reconciliation o where o.attempt_id=t.id)
    or (select count(*) from public.commerce_payment_attempt_events e where e.attempt_id=t.id)<>1
    or (select count(*) from public.commerce_payment_attempt_events e where e.attempt_id=t.id and e.event_type='REQUESTED' and e.money_state='NOT_RECORDED')<>1 then return query select 'UNKNOWN'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,true; return; end if;
 else return query select 'UNKNOWN'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,true; return; end if;

if t.execution_state='REQUESTED' then return query select 'PAYMENT_RECOVERY_REQUIRED'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,true; return; end if;
 if t.appointment_id is distinct from a.id and not (op.lifecycle_state='CLOSED' and t.execution_state in ('FAILED','SKIPPED') and t.appointment_id is null) then return query select 'UNKNOWN'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,true; return; end if;
 desired.location_id:=p_location_id;desired.service_id:=p_service_id;desired.staff_id:=p_staff_id;desired.start_time:=p_start_time;desired.end_time:=p_end_time;desired.room_id:=p_room_id;
 target_resources:=array(select x from unnest(p_resource_ids) x order by x);
 after_j:=jsonb_build_object('id',desired.id,'business_id',desired.business_id,'booking_operation_id',desired.booking_operation_id,'customer_id',desired.customer_id,'location_id',desired.location_id,'service_id',desired.service_id,'staff_id',desired.staff_id,'start_time',to_char(desired.start_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'end_time',to_char(desired.end_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'status',desired.status,'notes',desired.notes,'room_id',desired.room_id,'price_cents',desired.price_cents,'tax_cents',desired.tax_cents,'deposit_cents',desired.deposit_cents,'operational_revision',desired.operational_revision);
 select coalesce(array_agg(x),'{}'::text[]) into changed from (select x from jsonb_object_keys(before_j) x where before_j->x is distinct from after_j->x union all select 'resource_ids' where resources is distinct from target_resources) q;
 if not changed <@ (case v_command
 when 'RESCHEDULE' then array['end_time','start_time']::text[]
when 'RESIZE' then array['end_time']::text[]
when 'REASSIGN_STAFF' then array['end_time','staff_id','start_time']::text[]
when 'REASSIGN_LOCATION' then array['end_time','location_id','resource_ids','room_id','staff_id','start_time']::text[]
when 'RESOURCES' then array['resource_ids','room_id']::text[]
when 'SERVICE_CORRECTION' then array['end_time','resource_ids','room_id','service_id','staff_id','start_time']::text[]
else '{}'::text[] end) then return query select 'CONFLICT'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,(t.execution_state in ('REQUESTED','FAILED') or a.customer_id is distinct from op.customer_id or exists(select 1 from public.commerce_payment_reconciliation z where z.attempt_id=t.id and z.is_financial and z.state not in ('COMPLETE','NOT_REQUIRED'))); return; end if;
 -- Lock admitted catalog rows in the exact frozen table/UUID order.
 perform 1 from public.locations x where x.id in (a.location_id,p_location_id) and x.business_id=p_business_id order by x.id for share;
 perform 1 from public.services x where x.id in (a.service_id,p_service_id) and x.business_id=p_business_id order by x.id for share;
 perform 1 from public.staff x where x.id in (a.staff_id,p_staff_id) and x.business_id=p_business_id order by x.id for share;
 perform 1 from public.service_locations x where x.service_id=p_service_id and x.location_id=p_location_id order by x.service_id,x.location_id for share;
 perform 1 from public.staff_locations x where x.staff_id=p_staff_id and x.location_id=p_location_id order by x.staff_id,x.location_id for share;
 perform 1 from public.staff_services x where x.staff_id=p_staff_id and x.service_id=p_service_id order by x.staff_id,x.service_id for share;
 perform 1 from public.booking_resources x where (x.id=any(target_resources) or x.id=p_room_id) and x.business_id=p_business_id order by x.id for share;
 select * into loc from public.locations where id=p_location_id and business_id=p_business_id and is_active;
 if not found then return query select 'CONFLICT'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,(t.execution_state in ('REQUESTED','FAILED') or a.customer_id is distinct from op.customer_id or exists(select 1 from public.commerce_payment_reconciliation z where z.attempt_id=t.id and z.is_financial and z.state not in ('COMPLETE','NOT_REQUIRED'))); return; end if;
 select * into s from public.services where id=a.service_id and business_id=p_business_id;
 if not found then return query select 'UNKNOWN'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,true; return; end if;
 select * into new_s from public.services where id=p_service_id and business_id=p_business_id and is_active;
 if not found then return query select 'CONFLICT'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,(t.execution_state in ('REQUESTED','FAILED') or a.customer_id is distinct from op.customer_id or exists(select 1 from public.commerce_payment_reconciliation z where z.attempt_id=t.id and z.is_financial and z.state not in ('COMPLETE','NOT_REQUIRED'))); return; end if;
 select * into st from public.staff where id=p_staff_id and business_id=p_business_id and is_active;
 if not found then return query select 'CONFLICT'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,(t.execution_state in ('REQUESTED','FAILED') or a.customer_id is distinct from op.customer_id or exists(select 1 from public.commerce_payment_reconciliation z where z.attempt_id=t.id and z.is_financial and z.state not in ('COMPLETE','NOT_REQUIRED'))); return; end if;
 select * into pair from public.staff_services where staff_id=p_staff_id and service_id=p_service_id;
 if not found or not (new_s.location_id=p_location_id or exists(select 1 from public.service_locations where service_id=p_service_id and location_id=p_location_id)) or not (st.location_id=p_location_id or exists(select 1 from public.staff_locations where staff_id=p_staff_id and location_id=p_location_id)) then return query select 'CONFLICT'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,(t.execution_state in ('REQUESTED','FAILED') or a.customer_id is distinct from op.customer_id or exists(select 1 from public.commerce_payment_reconciliation z where z.attempt_id=t.id and z.is_financial and z.state not in ('COMPLETE','NOT_REQUIRED'))); return; end if;
 if v_command='SERVICE_CORRECTION' and a.service_id<>p_service_id then
  if op.package_id is not null or s.price is null or new_s.price is null or s.price<0 or new_s.price<0 or s.price::text='NaN' or new_s.price::text='NaN'
     or s.tax_rate_bps is null or new_s.tax_rate_bps is null or s.tax_rate_bps<0 or new_s.tax_rate_bps<0
     or s.deposit_cents is null or new_s.deposit_cents is null or s.deposit_cents<0 or new_s.deposit_cents<0
     or s.deposit_required is null or new_s.deposit_required is null
     or row(s.price,s.tax_rate_bps,s.deposit_cents,s.deposit_required) is distinct from row(new_s.price,new_s.tax_rate_bps,new_s.deposit_cents,new_s.deposit_required) then return query select 'FINANCIAL_REVIEW_REQUIRED'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,(t.execution_state in ('REQUESTED','FAILED') or a.customer_id is distinct from op.customer_id or exists(select 1 from public.commerce_payment_reconciliation z where z.attempt_id=t.id and z.is_financial and z.state not in ('COMPLETE','NOT_REQUIRED'))); return; end if;
 end if;
 effective_duration:=coalesce(nullif(pair.duration_override_minutes,0),new_s.duration_minutes);
 if effective_duration is null or effective_duration<5 or pair.duration_override_minutes<0 then return query select 'CONFLICT'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,(t.execution_state in ('REQUESTED','FAILED') or a.customer_id is distinct from op.customer_id or exists(select 1 from public.commerce_payment_reconciliation z where z.attempt_id=t.id and z.is_financial and z.state not in ('COMPLETE','NOT_REQUIRED'))); return; end if;
 if (v_command in ('REASSIGN_STAFF','SERVICE_CORRECTION') or (v_command='REASSIGN_LOCATION' and a.staff_id<>p_staff_id)) and p_end_time-p_start_time<>make_interval(mins=>effective_duration) then return query select 'CONFLICT'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,(t.execution_state in ('REQUESTED','FAILED') or a.customer_id is distinct from op.customer_id or exists(select 1 from public.commerce_payment_reconciliation z where z.attempt_id=t.id and z.is_financial and z.state not in ('COMPLETE','NOT_REQUIRED'))); return; end if;
 if p_room_id is not null and not exists(select 1 from public.booking_resources r where r.id=p_room_id and r.business_id=p_business_id and r.is_active and r.resource_type='room' and (r.location_id is null or r.location_id=p_location_id)) then return query select 'CONFLICT'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,(t.execution_state in ('REQUESTED','FAILED') or a.customer_id is distinct from op.customer_id or exists(select 1 from public.commerce_payment_reconciliation z where z.attempt_id=t.id and z.is_financial and z.state not in ('COMPLETE','NOT_REQUIRED'))); return; end if;
 if exists(select 1 from unnest(target_resources) x left join public.booking_resources r on r.id=x and r.business_id=p_business_id and r.is_active and (r.location_id is null or r.location_id=p_location_id) where r.id is null) then return query select 'CONFLICT'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,(t.execution_state in ('REQUESTED','FAILED') or a.customer_id is distinct from op.customer_id or exists(select 1 from public.commerce_payment_reconciliation z where z.attempt_id=t.id and z.is_financial and z.state not in ('COMPLETE','NOT_REQUIRED'))); return; end if;
 if exists(select 1 from public.appointments x where x.id<>a.id and x.business_id=p_business_id and x.status::text<>'cancelled' and x.start_time<p_end_time and p_start_time<x.end_time and ((p_room_id is not null and x.room_id=p_room_id) or exists(select 1 from public.appointment_resources r where r.appointment_id=x.id and r.resource_id=any(target_resources)))) then return query select 'CONFLICT'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,(t.execution_state in ('REQUESTED','FAILED') or a.customer_id is distinct from op.customer_id or exists(select 1 from public.commerce_payment_reconciliation z where z.attempt_id=t.id and z.is_financial and z.state not in ('COMPLETE','NOT_REQUIRED'))); return; end if;
 -- Separate statement after every lock wait: preserve the protected STABLE validator.
 begin
  perform public.validate_appointment_slot(p_business_id,p_service_id,p_staff_id,p_start_time,p_end_time,a.id,p_location_id);
 exception when raise_exception then return query select 'CONFLICT'::text,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,(t.execution_state in ('REQUESTED','FAILED') or a.customer_id is distinct from op.customer_id or exists(select 1 from public.commerce_payment_reconciliation z where z.attempt_id=t.id and z.is_financial and z.state not in ('COMPLETE','NOT_REQUIRED'))); return; end;

after_j:=jsonb_build_object('id',desired.id,'business_id',desired.business_id,'booking_operation_id',desired.booking_operation_id,'customer_id',desired.customer_id,'location_id',desired.location_id,'service_id',desired.service_id,'staff_id',desired.staff_id,'start_time',to_char(desired.start_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'end_time',to_char(desired.end_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'status',desired.status,'notes',desired.notes,'room_id',desired.room_id,'price_cents',desired.price_cents,'tax_cents',desired.tax_cents,'deposit_cents',desired.deposit_cents,'operational_revision',desired.operational_revision);
 if after_j=before_j and target_resources=resources then v_outcome:='NO_CHANGE'; v_effect:=null; changed:='{}'::text[];
 else
  if a.operational_revision=9223372036854775807 then raise exception 'LIFECYCLE_REVISION_EXHAUSTED' using errcode='22003'; end if;
  desired.operational_revision:=a.operational_revision+1; after_j:=jsonb_build_object('id',desired.id,'business_id',desired.business_id,'booking_operation_id',desired.booking_operation_id,'customer_id',desired.customer_id,'location_id',desired.location_id,'service_id',desired.service_id,'staff_id',desired.staff_id,'start_time',to_char(desired.start_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'end_time',to_char(desired.end_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'status',desired.status,'notes',desired.notes,'room_id',desired.room_id,'price_cents',desired.price_cents,'tax_cents',desired.tax_cents,'deposit_cents',desired.deposit_cents,'operational_revision',desired.operational_revision);
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
  if not found or (to_jsonb(a)-'updated_at') is distinct from (to_jsonb(desired)-'updated_at') or row(a.amount_paid_cents,a.amount_refunded_cents,a.payment_status) is distinct from row(desired.amount_paid_cents,desired.amount_refunded_cents,desired.payment_status) or jsonb_build_object('id',a.id,'business_id',a.business_id,'booking_operation_id',a.booking_operation_id,'customer_id',a.customer_id,'location_id',a.location_id,'service_id',a.service_id,'staff_id',a.staff_id,'start_time',to_char(a.start_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'end_time',to_char(a.end_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'status',a.status,'notes',a.notes,'room_id',a.room_id,'price_cents',a.price_cents,'tax_cents',a.tax_cents,'deposit_cents',a.deposit_cents,'operational_revision',a.operational_revision) is distinct from after_j or array(select resource_id from public.appointment_resources where appointment_id=a.id order by resource_id) is distinct from target_resources then raise exception 'LIFECYCLE_FINAL_STATE_MISMATCH' using errcode='23514'; end if;
 end if;
 if not exists(select 1 from public.commerce_booking_operations x where x.id=op.id and to_jsonb(x)=to_jsonb(op)) or not exists(select 1 from public.commerce_payment_attempts x where x.id=t.id and to_jsonb(x)=to_jsonb(t)) then raise exception 'LIFECYCLE_FINANCIAL_IDENTITY_CHANGED' using errcode='23514'; end if;
 return query select v_outcome,a.id,op.id,v_key,v_effect,a.operational_revision,a.status,t.id,(t.execution_state in ('REQUESTED','FAILED') or a.customer_id is distinct from op.customer_id or exists(select 1 from public.commerce_payment_reconciliation z where z.attempt_id=t.id and z.is_financial and z.state not in ('COMPLETE','NOT_REQUIRED')));
end $f$;

create function public.read_booking_appointment_mutation_v2(p_business_id uuid,p_appointment_id uuid,p_actor_id uuid,p_mutation_id uuid) returns table(outcome text,appointment_id uuid,operation_id uuid,mutation_id uuid,effect_revision bigint,current_revision bigint,current_status public.appointment_status,original_attempt_id uuid,recovery_required boolean)
language plpgsql volatile security invoker set search_path=pg_catalog,pg_temp as $f$
#variable_conflict use_column
declare a public.appointments%rowtype; desired public.appointments%rowtype; op public.commerce_booking_operations%rowtype;
 t public.commerce_payment_attempts%rowtype; prior record; resources uuid[]; target_resources uuid[];
 before_j jsonb; after_j jsonb; request_j jsonb; changed text[]; v_command text; v_reason text;
 v_outcome text; v_key uuid; v_origin text; v_effect bigint; v_recorded boolean:=false;
 v_workflow text[]; v_count integer; v_uid uuid; v_owner uuid;
 s public.services%rowtype; new_s public.services%rowtype; st public.staff%rowtype; loc public.locations%rowtype;
 pair public.staff_services%rowtype; effective_duration integer; v_name text; v_amount integer;
begin
 if current_user<>'service_role' then raise exception 'LIFECYCLE_SERVICE_ROLE_REQUIRED' using errcode='42501'; end if;
 select b.owner_id into v_owner from public.businesses b where b.id=p_business_id for share;
 if not found then return query select 'NOT_AUTHORIZED'::text,null::uuid,null::uuid,null::uuid,null::bigint,null::bigint,null::public.appointment_status,null::uuid,true; return; end if;
 if v_owner is distinct from p_actor_id then
  perform 1 from public.business_members m where m.business_id=p_business_id and m.user_id=p_actor_id and m.role in ('owner','admin') for share;
  if not found then return query select 'NOT_AUTHORIZED'::text,null::uuid,null::uuid,null::uuid,null::bigint,null::bigint,null::public.appointment_status,null::uuid,true; return; end if;
 end if;
 if p_actor_id is null or p_business_id is null or p_appointment_id is null or p_mutation_id is null then return query select 'UNKNOWN'::text,null::uuid,null::uuid,null::uuid,null::bigint,null::bigint,null::public.appointment_status,null::uuid,true; return; end if;
 select * into a from public.appointments where id=p_appointment_id and business_id=p_business_id;
 if not found then return query select 'UNKNOWN'::text,null::uuid,null::uuid,null::uuid,null::bigint,null::bigint,null::public.appointment_status,null::uuid,true; return; end if;
 select * into prior from booking_lifecycle_private.appointment_mutations m where m.business_id=p_business_id and m.appointment_id=p_appointment_id and m.mutation_id=p_mutation_id;
 if not found then return query select 'UNKNOWN'::text,null::uuid,null::uuid,null::uuid,null::bigint,null::bigint,null::public.appointment_status,null::uuid,true; return; end if;
 return query select 'REPLAY'::text,a.id,prior.operation_id,prior.mutation_id,prior.effect_revision,a.operational_revision,a.status,prior.original_attempt_id,coalesce((select x.execution_state in ('REQUESTED','FAILED') or a.customer_id is distinct from x.customer_id or exists(select 1 from public.commerce_payment_reconciliation z where z.attempt_id=x.id and z.is_financial and z.state not in ('COMPLETE','NOT_REQUIRED')) from public.commerce_payment_attempts x where x.id=prior.original_attempt_id and x.business_id=p_business_id),true);
end $f$;

create function booking_lifecycle_private.close_operation_lifecycle_v2(p_business_id uuid,p_operation_id uuid,p_actor_id uuid,p_reason text,p_expected_current_customer_id uuid,p_replacement_customer_id uuid,p_cancel boolean,p_mutation_id uuid,p_expected_revision bigint,p_expected_appointment_id uuid,p_audit_reason text,p_compatibility_v1 boolean) returns table(outcome text,operation_id uuid,appointment_id uuid,attempt_id uuid,recorded boolean,mutation_id uuid,effect_revision bigint,current_revision bigint,current_status public.appointment_status,lifecycle_outcome text)
language plpgsql volatile security invoker set search_path=pg_catalog,pg_temp as $f$
#variable_conflict use_column
declare a public.appointments%rowtype; desired public.appointments%rowtype; op public.commerce_booking_operations%rowtype;
 t public.commerce_payment_attempts%rowtype; prior record; resources uuid[]; target_resources uuid[];
 before_j jsonb; after_j jsonb; request_j jsonb; changed text[]; v_command text; v_reason text;
 v_outcome text; v_key uuid; v_origin text; v_effect bigint; v_recorded boolean:=false;
 v_workflow text[]; v_count integer; v_uid uuid; v_owner uuid;
 s public.services%rowtype; new_s public.services%rowtype; st public.staff%rowtype; loc public.locations%rowtype;
 pair public.staff_services%rowtype; effective_duration integer; v_name text; v_amount integer;
 v_compat_wire text; p_appointment_id uuid;
begin
 if current_user<>'service_role' then raise exception 'LIFECYCLE_SERVICE_ROLE_REQUIRED' using errcode='42501'; end if;
 select b.owner_id into v_owner from public.businesses b where b.id=p_business_id for share;
 if not found then if p_compatibility_v1 then raise exception 'BOOKING_OPERATION_NOT_AUTHORIZED' using errcode='42501'; end if;return query select 'RECOVERY_REQUIRED'::text,null::uuid,null::uuid,null::uuid,false,null::uuid,null::bigint,null::bigint,null::public.appointment_status,'NOT_AUTHORIZED'::text;return; end if;
 if v_owner is distinct from p_actor_id then
  perform 1 from public.business_members m where m.business_id=p_business_id and m.user_id=p_actor_id and m.role in ('owner','admin') for share;
  if not found then if p_compatibility_v1 then raise exception 'BOOKING_OPERATION_NOT_AUTHORIZED' using errcode='42501'; end if;return query select 'RECOVERY_REQUIRED'::text,null::uuid,null::uuid,null::uuid,false,null::uuid,null::bigint,null::bigint,null::public.appointment_status,'NOT_AUTHORIZED'::text;return; end if;
 end if;
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
 if not found then return query select 'RECOVERY_REQUIRED'::text,null::uuid,null::uuid,null::uuid,false,null::uuid,null::bigint,null::bigint,null::public.appointment_status,'UNKNOWN'::text;return; end if;
 select * into a from public.appointments x where x.business_id=p_business_id and x.booking_operation_id=p_operation_id;
 if a.id is not null then
  if p_cancel and a.status::text='cancelled' then
   select * into a from public.appointments x where x.id=a.id for no key update;
   if a.status::text<>'cancelled' then return query select 'RECOVERY_REQUIRED'::text,null::uuid,null::uuid,null::uuid,false,null::uuid,null::bigint,null::bigint,null::public.appointment_status,'UNKNOWN'::text;return; end if;
  else
   select * into a from public.appointments x where x.id=a.id for update;
  end if;
 end if;
 select * into op from public.commerce_booking_operations x where x.id=p_operation_id and x.business_id=p_business_id for update;
 if not found then return query select 'RECOVERY_REQUIRED'::text,null::uuid,null::uuid,null::uuid,false,null::uuid,null::bigint,null::bigint,null::public.appointment_status,'UNKNOWN'::text;return; end if;
 if p_compatibility_v1 and op.actor_id<>p_actor_id then raise exception 'BOOKING_OPERATION_NOT_AUTHORIZED' using errcode='42501'; end if;
 if not p_compatibility_v1 and a.id is distinct from p_expected_appointment_id then return query select 'RECOVERY_REQUIRED'::text,null::uuid,null::uuid,null::uuid,false,null::uuid,null::bigint,null::bigint,null::public.appointment_status,'UNKNOWN'::text;return; end if;
 if row(t.customer_id,t.actor_id) is distinct from row(op.customer_id,op.actor_id) or (t.appointment_id is not null and t.appointment_id is distinct from a.id) then return query select 'RECOVERY_REQUIRED'::text,op.id,a.id,t.id,v_recorded,v_key,v_effect,a.operational_revision,a.status,'UNKNOWN'::text;return; end if;
 v_recorded:=exists(select 1 from public.commerce_transactions x where x.appointment_id=a.id);
 v_compat_wire:=case when op.lifecycle_state='CLOSED' then 'EXISTING' else 'CLOSED' end;
 if a.id is not null and p_reason in ('PRICING_CHANGED','SLOT_CONFLICT','OPERATOR_ABANDONED') then return query select 'RECOVERY_REQUIRED'::text,op.id,a.id,t.id,v_recorded,v_key,v_effect,a.operational_revision,a.status,'UNKNOWN'::text;return; end if;
 select count(*) into v_count from public.commerce_transactions x where x.payment_attempt_id=t.id;
 if exists(select 1 from public.commerce_payment_attempt_events e where e.attempt_id=t.id and e.business_id<>t.business_id)
    or exists(select 1 from public.commerce_payment_reconciliation o where o.attempt_id=t.id and o.business_id<>t.business_id) then return query select 'RECOVERY_REQUIRED'::text,op.id,a.id,t.id,v_recorded,v_key,v_effect,a.operational_revision,a.status,'UNKNOWN'::text;return; end if;
 if t.execution_state in ('FAILED','SKIPPED') then
  if v_count<>0 or t.recovery_disposition<>'DO_NOT_RETRY' or t.resolved_at is null
     or exists(select 1 from public.commerce_payment_reconciliation o where o.attempt_id=t.id)
     or (select count(*) from public.commerce_payment_attempt_events e where e.attempt_id=t.id)<>2
     or (select count(*) from public.commerce_payment_attempt_events e where e.attempt_id=t.id and e.event_type='REQUESTED' and e.money_state='NOT_RECORDED')<>1
     or (select count(*) from public.commerce_payment_attempt_events e where e.attempt_id=t.id and e.event_type=t.execution_state and e.money_state='NOT_RECORDED' and e.failure_class is not distinct from t.failure_class and e.failure_code is not distinct from t.failure_code)<>1 then return query select 'RECOVERY_REQUIRED'::text,op.id,a.id,t.id,v_recorded,v_key,v_effect,a.operational_revision,a.status,'UNKNOWN'::text;return; end if;
 elsif t.execution_state='ACCEPTED' then
  if v_count<>1 or not public.payment_projection_history_valid_v1(p_business_id,t.id)
    or not exists(select 1 from public.commerce_transactions x where x.payment_attempt_id=t.id and row(x.business_id,x.customer_id,x.appointment_id,x.kind,x.amount_cents,x.currency,x.status,x.provider,x.method,x.created_by) is not distinct from row(t.business_id,t.customer_id,t.appointment_id,t.payment_kind,t.amount_cents,t.currency,'succeeded'::text,'manual'::text,t.method,t.actor_id)) then return query select 'RECOVERY_REQUIRED'::text,op.id,a.id,t.id,v_recorded,v_key,v_effect,a.operational_revision,a.status,'UNKNOWN'::text;return; end if;
 elsif t.execution_state='REQUESTED' then
  if v_count<>0 or t.resolved_at is not null or t.recovery_disposition<>'RECOVER' or t.failure_class is not null or t.failure_code is not null
    or exists(select 1 from public.commerce_payment_reconciliation o where o.attempt_id=t.id)
    or (select count(*) from public.commerce_payment_attempt_events e where e.attempt_id=t.id)<>1
    or (select count(*) from public.commerce_payment_attempt_events e where e.attempt_id=t.id and e.event_type='REQUESTED' and e.money_state='NOT_RECORDED')<>1 then return query select 'RECOVERY_REQUIRED'::text,op.id,a.id,t.id,v_recorded,v_key,v_effect,a.operational_revision,a.status,'UNKNOWN'::text;return; end if;
 else return query select 'RECOVERY_REQUIRED'::text,op.id,a.id,t.id,v_recorded,v_key,v_effect,a.operational_revision,a.status,'UNKNOWN'::text;return; end if;
 if a.id is null then
  if p_reason in ('CUSTOMER_REASSIGNED','APPOINTMENT_CANCELLED') then raise exception 'BOOKING_OPERATION_APPOINTMENT_REQUIRED' using errcode='23514'; end if;
  if t.execution_state='ACCEPTED' or v_count<>0 then return query select 'RECOVERY_REQUIRED'::text,op.id,a.id,t.id,v_recorded,v_key,v_effect,a.operational_revision,a.status,'UNKNOWN'::text;return; end if;
  if op.lifecycle_state='CLOSED' and op.close_reason=p_reason then
   if t.execution_state='REQUESTED' then return query select 'RECOVERY_REQUIRED'::text,op.id,a.id,t.id,v_recorded,v_key,v_effect,a.operational_revision,a.status,'UNKNOWN'::text;return; end if;
   return query select 'EXISTING'::text,op.id,null::uuid,t.id,false,null::uuid,null::bigint,null::bigint,null::public.appointment_status,'NO_CHANGE'::text;return;
  end if;
  update public.commerce_booking_operations set lifecycle_state='CLOSED',close_reason=p_reason,replacement_customer_id=case when p_reason='CUSTOMER_REASSIGNED' then p_replacement_customer_id else null end,closed_at=coalesce(closed_at,now()),updated_at=now() where id=op.id and business_id=p_business_id;
 if t.execution_state='REQUESTED' then
  update public.commerce_payment_attempts set execution_state='FAILED',recovery_disposition='DO_NOT_RETRY',failure_class=case when p_reason in ('PRICING_CHANGED','OPERATOR_ABANDONED') then 'VALIDATION' else 'CONFLICT' end,failure_code=case when p_reason in ('PRICING_CHANGED','OPERATOR_ABANDONED') then 'INVALID_REQUEST' else 'KEY_CONFLICT' end,updated_at=now(),resolved_at=now() where id=t.id and business_id=p_business_id returning * into t;
  insert into public.commerce_payment_attempt_events(business_id,attempt_id,event_type,money_state,failure_class,failure_code) values(p_business_id,t.id,'FAILED','NOT_RECORDED',t.failure_class,t.failure_code);
 end if;
  return query select v_compat_wire,op.id,null::uuid,t.id,false,null::uuid,null::bigint,null::bigint,null::public.appointment_status,'NO_CHANGE'::text;return;
 end if;
 if char_length(a.notes)>10000 then return query select 'RECOVERY_REQUIRED'::text,op.id,a.id,t.id,v_recorded,v_key,v_effect,a.operational_revision,a.status,'UNKNOWN'::text;return; end if;
 resources:=array(select resource_id from public.appointment_resources where appointment_id=a.id order by resource_id);
 target_resources:=resources; desired:=a;
 if p_compatibility_v1 then p_expected_revision:=a.operational_revision; end if;
 request_j:=jsonb_build_object('business_id',p_business_id,'operation_id',p_operation_id,'appointment_id',a.id,'actor_id',p_actor_id,'mutation_id',v_key,'expected_revision',p_expected_revision,'reason',v_reason,'origin',v_origin,'command',v_command,'expected_customer_id',p_expected_current_customer_id,'replacement_customer_id',p_replacement_customer_id);
 if not p_compatibility_v1 then
  select * into prior from booking_lifecycle_private.appointment_mutations m where m.business_id=p_business_id and m.appointment_id=a.id and m.mutation_id=v_key;
  if found then
   if prior.request is distinct from request_j then return query select 'RECOVERY_REQUIRED'::text,op.id,a.id,t.id,v_recorded,v_key,v_effect,a.operational_revision,a.status,'CONFLICT'::text;return; end if;
   v_effect:=prior.effect_revision;return query select 'EXISTING'::text,op.id,a.id,t.id,v_recorded,v_key,v_effect,a.operational_revision,a.status,'REPLAY'::text;return;
  end if;
  if a.operational_revision<>p_expected_revision then return query select 'RECOVERY_REQUIRED'::text,op.id,a.id,t.id,v_recorded,v_key,v_effect,a.operational_revision,a.status,'STALE_REVISION'::text;return; end if;
 end if;
 if p_reason='CUSTOMER_REASSIGNED' then
  if a.status::text='cancelled' then return query select 'RECOVERY_REQUIRED'::text,op.id,a.id,t.id,v_recorded,v_key,v_effect,a.operational_revision,a.status,'TERMINAL'::text;return; end if;
  if a.customer_id<>p_expected_current_customer_id then
   if p_compatibility_v1 then raise exception 'BOOKING_OPERATION_EXPECTED_CUSTOMER_CHANGED' using errcode='40001'; end if;
   return query select 'RECOVERY_REQUIRED'::text,op.id,a.id,t.id,v_recorded,v_key,v_effect,a.operational_revision,a.status,'CONFLICT'::text;return;
  end if;
  perform 1 from public.customers c where c.id=p_replacement_customer_id and c.business_id=p_business_id for share;
  if not found then return query select 'RECOVERY_REQUIRED'::text,op.id,a.id,t.id,v_recorded,v_key,v_effect,a.operational_revision,a.status,'CONFLICT'::text;return; end if;
  if t.execution_state='ACCEPTED' or exists(select 1 from public.commerce_transactions x where x.appointment_id=a.id)
    or exists(select 1 from public.commerce_refunds f where f.appointment_id=a.id or exists(select 1 from public.commerce_transactions x where x.id=f.transaction_id and x.appointment_id=a.id)) then
   if p_compatibility_v1 then raise exception 'APPOINTMENT_LEDGER_CUSTOMER_REASSIGNMENT_FORBIDDEN' using errcode='23514'; end if;
   return query select 'RECOVERY_REQUIRED'::text,op.id,a.id,t.id,v_recorded,v_key,v_effect,a.operational_revision,a.status,'FINANCIAL_REVIEW_REQUIRED'::text;return;
  end if;
  desired.customer_id:=p_replacement_customer_id;
 else desired.status:='cancelled'; end if;
 if t.execution_state='REQUESTED' and v_recorded then return query select 'RECOVERY_REQUIRED'::text,op.id,a.id,t.id,v_recorded,v_key,v_effect,a.operational_revision,a.status,'UNKNOWN'::text;return; end if;
 before_j:=jsonb_build_object('id',a.id,'business_id',a.business_id,'booking_operation_id',a.booking_operation_id,'customer_id',a.customer_id,'location_id',a.location_id,'service_id',a.service_id,'staff_id',a.staff_id,'start_time',to_char(a.start_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'end_time',to_char(a.end_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'status',a.status,'notes',a.notes,'room_id',a.room_id,'price_cents',a.price_cents,'tax_cents',a.tax_cents,'deposit_cents',a.deposit_cents,'operational_revision',a.operational_revision); after_j:=jsonb_build_object('id',desired.id,'business_id',desired.business_id,'booking_operation_id',desired.booking_operation_id,'customer_id',desired.customer_id,'location_id',desired.location_id,'service_id',desired.service_id,'staff_id',desired.staff_id,'start_time',to_char(desired.start_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'end_time',to_char(desired.end_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'status',desired.status,'notes',desired.notes,'room_id',desired.room_id,'price_cents',desired.price_cents,'tax_cents',desired.tax_cents,'deposit_cents',desired.deposit_cents,'operational_revision',desired.operational_revision);
 if before_j=after_j then
  if op.lifecycle_state<>'CLOSED' or op.close_reason<>p_reason or t.execution_state='REQUESTED' then return query select 'RECOVERY_REQUIRED'::text,op.id,a.id,t.id,v_recorded,v_key,v_effect,a.operational_revision,a.status,'UNKNOWN'::text;return; end if;
  if p_compatibility_v1 then return query select 'EXISTING'::text,op.id,a.id,t.id,v_recorded,v_key,v_effect,a.operational_revision,a.status,'NO_CHANGE'::text;return; end if;
  v_outcome:='NO_CHANGE'; changed:='{}'::text[];v_effect:=null;
 else
  if a.operational_revision=9223372036854775807 then raise exception 'LIFECYCLE_REVISION_EXHAUSTED' using errcode='22003'; end if;
  if p_compatibility_v1 then v_key:=gen_random_uuid();request_j:=jsonb_set(request_j,'{mutation_id}',to_jsonb(v_key)); end if;
  desired.operational_revision:=a.operational_revision+1;v_effect:=desired.operational_revision;v_outcome:='APPLIED';after_j:=jsonb_build_object('id',desired.id,'business_id',desired.business_id,'booking_operation_id',desired.booking_operation_id,'customer_id',desired.customer_id,'location_id',desired.location_id,'service_id',desired.service_id,'staff_id',desired.staff_id,'start_time',to_char(desired.start_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'end_time',to_char(desired.end_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'status',desired.status,'notes',desired.notes,'room_id',desired.room_id,'price_cents',desired.price_cents,'tax_cents',desired.tax_cents,'deposit_cents',desired.deposit_cents,'operational_revision',desired.operational_revision);
  select array_agg(x order by x) into changed from jsonb_object_keys(before_j) x where before_j->x is distinct from after_j->x;
 end if;
 insert into booking_lifecycle_private.appointment_mutations(business_id,appointment_id,operation_id,mutation_id,actor_id,original_attempt_id,origin,command,transaction_id,expected_revision,observed_revision,result_revision,effect_revision,outcome,reason,request,before_image,after_image,before_resource_ids,after_resource_ids,allowed_fields)
 values(a.business_id,a.id,op.id,v_key,p_actor_id,t.id,v_origin,v_command,pg_current_xact_id(),a.operational_revision,a.operational_revision,desired.operational_revision,v_effect,v_outcome,v_reason,request_j,before_j,after_j,resources,resources,changed);
 if v_outcome='APPLIED' then
  update public.commerce_booking_operations set lifecycle_state='CLOSED',close_reason=p_reason,replacement_customer_id=case when p_reason='CUSTOMER_REASSIGNED' then p_replacement_customer_id else null end,closed_at=coalesce(closed_at,now()),updated_at=now() where id=op.id and business_id=p_business_id;
 if t.execution_state='REQUESTED' then
  update public.commerce_payment_attempts set execution_state='FAILED',recovery_disposition='DO_NOT_RETRY',failure_class=case when p_reason in ('PRICING_CHANGED','OPERATOR_ABANDONED') then 'VALIDATION' else 'CONFLICT' end,failure_code=case when p_reason in ('PRICING_CHANGED','OPERATOR_ABANDONED') then 'INVALID_REQUEST' else 'KEY_CONFLICT' end,updated_at=now(),resolved_at=now() where id=t.id and business_id=p_business_id returning * into t;
  insert into public.commerce_payment_attempt_events(business_id,attempt_id,event_type,money_state,failure_class,failure_code) values(p_business_id,t.id,'FAILED','NOT_RECORDED',t.failure_class,t.failure_code);
 end if;
  update public.appointments x set customer_id=desired.customer_id,status=desired.status,operational_revision=desired.operational_revision where x.id=a.id and x.business_id=a.business_id and x.operational_revision=a.operational_revision returning * into a;
  if not found or (to_jsonb(a)-'updated_at') is distinct from (to_jsonb(desired)-'updated_at') or row(a.amount_paid_cents,a.amount_refunded_cents,a.payment_status) is distinct from row(desired.amount_paid_cents,desired.amount_refunded_cents,desired.payment_status) or jsonb_build_object('id',a.id,'business_id',a.business_id,'booking_operation_id',a.booking_operation_id,'customer_id',a.customer_id,'location_id',a.location_id,'service_id',a.service_id,'staff_id',a.staff_id,'start_time',to_char(a.start_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'end_time',to_char(a.end_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'status',a.status,'notes',a.notes,'room_id',a.room_id,'price_cents',a.price_cents,'tax_cents',a.tax_cents,'deposit_cents',a.deposit_cents,'operational_revision',a.operational_revision) is distinct from after_j or array(select resource_id from public.appointment_resources where appointment_id=a.id order by resource_id) is distinct from resources
    or not exists(select 1 from public.commerce_booking_operations x where x.id=op.id and x.lifecycle_state='CLOSED' and x.close_reason=p_reason and x.replacement_customer_id is not distinct from case when p_reason='CUSTOMER_REASSIGNED' then p_replacement_customer_id else null end)
    or not exists(select 1 from public.commerce_payment_attempts x where x.id=t.id and to_jsonb(x)=to_jsonb(t) and x.execution_state<>'REQUESTED')
    or not exists(select 1 from public.commerce_booking_operations x where x.id=op.id and (to_jsonb(x)-array['lifecycle_state','close_reason','replacement_customer_id','closed_at','updated_at'])=(to_jsonb(op)-array['lifecycle_state','close_reason','replacement_customer_id','closed_at','updated_at'])) then raise exception 'LIFECYCLE_CLOSE_FINAL_STATE' using errcode='23514'; end if;
 end if;
 return query select v_compat_wire,op.id,a.id,t.id,v_recorded,v_key,v_effect,a.operational_revision,a.status,v_outcome;
end $f$;

create function public.close_booking_appointment_v2(p_business_id uuid,p_operation_id uuid,p_appointment_id uuid,p_actor_id uuid,p_mutation_id uuid,p_expected_revision bigint,p_reason text,p_command text,p_expected_customer_id uuid,p_replacement_customer_id uuid) returns table(outcome text,appointment_id uuid,operation_id uuid,mutation_id uuid,effect_revision bigint,current_revision bigint,current_status public.appointment_status,original_attempt_id uuid,recovery_required boolean)
language plpgsql volatile security invoker set search_path=pg_catalog,pg_temp as $f$
#variable_conflict use_column
declare r record;
begin
 if p_command is null or p_command not in ('CANCEL','REASSIGN_CUSTOMER') then raise exception 'LIFECYCLE_INVALID_CLOSE_COMMAND' using errcode='22023'; end if;
 select * into strict r from booking_lifecycle_private.close_operation_lifecycle_v2(p_business_id,p_operation_id,p_actor_id,case when p_command='CANCEL' then 'APPOINTMENT_CANCELLED' else 'CUSTOMER_REASSIGNED' end,p_expected_customer_id,p_replacement_customer_id,p_command='CANCEL',p_mutation_id,p_expected_revision,p_appointment_id,p_reason,false);
 return query select r.lifecycle_outcome,r.appointment_id,r.operation_id,r.mutation_id,r.effect_revision,r.current_revision,r.current_status,r.attempt_id,(r.lifecycle_outcome in ('UNKNOWN','PAYMENT_RECOVERY_REQUIRED','NOT_AUTHORIZED') or p_command='REASSIGN_CUSTOMER' or exists(select 1 from public.commerce_payment_attempts x where x.id=r.attempt_id and x.execution_state in ('REQUESTED','FAILED')) or exists(select 1 from public.commerce_payment_reconciliation z where z.attempt_id=r.attempt_id and z.is_financial and z.state not in ('COMPLETE','NOT_REQUIRED')));
end $f$;
create or replace function public.close_booking_operation_v1(p_business_id uuid,p_operation_id uuid,p_actor_id uuid,p_reason text,p_expected_current_customer_id uuid,p_replacement_customer_id uuid,p_cancel boolean) returns table(outcome text,operation_id uuid,appointment_id uuid,attempt_id uuid,recorded boolean)
language plpgsql security invoker set search_path=pg_catalog,pg_temp as $f$
#variable_conflict use_column
begin
 return query select r.outcome,r.operation_id,r.appointment_id,r.attempt_id,r.recorded from booking_lifecycle_private.close_operation_lifecycle_v2(p_business_id,p_operation_id,p_actor_id,p_reason,p_expected_current_customer_id,p_replacement_customer_id,p_cancel,null,null,null,p_reason,true) r;
end $f$;

create trigger appointment_mutations_guard before insert or update or delete on booking_lifecycle_private.appointment_mutations for each row execute function booking_lifecycle_private.guard_appointment_mutation_v2();
create trigger appointment_resources_lifecycle_guard before insert or update or delete on public.appointment_resources for each row execute function booking_lifecycle_private.guard_appointment_resource_v2();
drop trigger appointments_booking_operation_guard on public.appointments;
create trigger appointments_booking_operation_guard before insert or delete or update of id,business_id,booking_operation_id,customer_id,location_id,service_id,staff_id,start_time,end_time,status,notes,room_id,price_cents,tax_cents,deposit_cents,operational_revision on public.appointments for each row execute function public.guard_appointment_booking_operation_link_v1();
alter table public.appointments enable always trigger appointments_booking_operation_guard;
alter table public.appointment_resources enable always trigger appointment_resources_lifecycle_guard;
alter table booking_lifecycle_private.appointment_mutations enable always trigger appointment_mutations_guard;

revoke all on function public.transition_booking_appointment_v2(uuid,uuid,uuid,uuid,uuid,bigint,text,public.appointment_status,boolean) from public,anon,authenticated,service_role;
grant execute on function public.transition_booking_appointment_v2(uuid,uuid,uuid,uuid,uuid,bigint,text,public.appointment_status,boolean) to service_role;

revoke all on function public.revise_booking_notes_v2(uuid,uuid,uuid,uuid,uuid,bigint,text,text) from public,anon,authenticated,service_role;
grant execute on function public.revise_booking_notes_v2(uuid,uuid,uuid,uuid,uuid,bigint,text,text) to service_role;

revoke all on function public.revise_booking_schedule_v2(uuid,uuid,uuid,uuid,uuid,bigint,text,text,uuid,uuid,uuid,timestamptz,timestamptz,uuid,uuid[]) from public,anon,authenticated,service_role;
grant execute on function public.revise_booking_schedule_v2(uuid,uuid,uuid,uuid,uuid,bigint,text,text,uuid,uuid,uuid,timestamptz,timestamptz,uuid,uuid[]) to service_role;

revoke all on function public.close_booking_appointment_v2(uuid,uuid,uuid,uuid,uuid,bigint,text,text,uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.close_booking_appointment_v2(uuid,uuid,uuid,uuid,uuid,bigint,text,text,uuid,uuid) to service_role;

revoke all on function public.read_booking_appointment_mutation_v2(uuid,uuid,uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.read_booking_appointment_mutation_v2(uuid,uuid,uuid,uuid) to service_role;

revoke all on function booking_lifecycle_private.close_operation_lifecycle_v2(uuid,uuid,uuid,text,uuid,uuid,boolean,uuid,bigint,uuid,text,boolean) from public,anon,authenticated,service_role;
grant execute on function booking_lifecycle_private.close_operation_lifecycle_v2(uuid,uuid,uuid,text,uuid,uuid,boolean,uuid,bigint,uuid,text,boolean) to service_role;

revoke all on function booking_lifecycle_private.guard_appointment_resource_v2() from public,anon,authenticated,service_role;
grant execute on function booking_lifecycle_private.guard_appointment_resource_v2() to service_role;

revoke all on function booking_lifecycle_private.guard_appointment_mutation_v2() from public,anon,authenticated,service_role;
grant execute on function booking_lifecycle_private.guard_appointment_mutation_v2() to service_role;

do $post$ begin
if exists(select 1 from (values ('availability_block_reason','d2261e44fd62ffb476fe69864635ce14'),('bind_booking_operation_appointment_v1','969958c4bc89c69b5d86e3b6331a69ca'),('bootstrap_booking_operation_v1','cd89add6bfd84f1856513c928d5721e7'),('commit_booking_operation_manual_payment_v1','23ee6ac48b6d81f42f33bf40ae39cea5'),('get_available_slots','d3f0f20c81a56b5e70fe3850e7b357f7'),('guard_commerce_booking_operation_v1','d41900b2e537770768b4ed1cc8bc19f5'),('is_location_holiday','9e2e6baf8eb03b48980fc0cdf403682d'),('is_staff_on_vacation','b50c2c223d3a096ba12681ccf5185aea'),('payment_appointment_truth_v1','62e536cd4fac2f1d9cae6e99c1cb9117'),('payment_projection_history_valid_v1','a0619196c1ff08a005c13e924ad200c1'),('persist_booking_operation_appointment_v1','6001c439bf8657d112870d4bf7245ad9'),('project_payment_obligation_v1','b4ccf60290658c4dea0c0110ba5b950d'),('read_booking_operations_v1','4f9c0896e6c3f2fa593281a96e058bb1'),('read_payment_observability_v1','58b16d7bfcf3524da5e1082dc2ed15b3'),('resolve_location_id','f8cae8e103e3df570f5d2c0f6526ef35'),('set_updated_at','9b1889f56258bf9d6554213c05019c76'),('validate_appointment_slot','ba820a872e7ae4082cc66ce02dc03b52')) expected(name,body_md5)
      where (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname=expected.name)<>1 or not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
       where n.nspname='public' and p.proname=expected.name and md5(p.prosrc)=expected.body_md5)) then
      raise exception 'LIFECYCLE_PROTECTED_BODY_DRIFT' using errcode='55000'; end if;
 if (select count(*) from pg_trigger where (tgrelid,tgname) in
  (('public.appointments'::regclass,'appointments_booking_operation_guard'),
   ('public.appointment_resources'::regclass,'appointment_resources_lifecycle_guard'),
   ('booking_lifecycle_private.appointment_mutations'::regclass,'appointment_mutations_guard')) and tgenabled='A' and not tgisinternal)<>3 then
  raise exception 'LIFECYCLE_ALWAYS_GUARDS_REQUIRED' using errcode='55000'; end if;
 if not exists(select 1 from pg_class where oid='booking_lifecycle_private.appointment_mutations'::regclass and relrowsecurity and not relforcerowsecurity)
   or exists(select 1 from pg_policy where polrelid='booking_lifecycle_private.appointment_mutations'::regclass) then
  raise exception 'LIFECYCLE_JOURNAL_RLS' using errcode='55000'; end if;
 if exists(select 1 from pg_class c cross join lateral aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) a
   where c.oid='booking_lifecycle_private.appointment_mutations'::regclass and a.grantee<>c.relowner
   and (a.grantee<>'service_role'::regrole or a.privilege_type not in ('SELECT','INSERT') or a.is_grantable)) then
  raise exception 'LIFECYCLE_JOURNAL_ACL' using errcode='55000'; end if;
 if exists(select 1 from pg_namespace n cross join lateral aclexplode(coalesce(n.nspacl,acldefault('n',n.nspowner))) a
   where n.nspname='booking_lifecycle_private' and a.grantee<>n.nspowner
   and (a.grantee<>'service_role'::regrole or a.privilege_type<>'USAGE' or a.is_grantable)) then
  raise exception 'LIFECYCLE_SCHEMA_ACL' using errcode='55000'; end if;
 if (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in
  ('transition_booking_appointment_v2','revise_booking_schedule_v2','revise_booking_notes_v2','close_booking_appointment_v2','read_booking_appointment_mutation_v2'))<>5 then
  raise exception 'LIFECYCLE_RPC_OVERLOAD_DRIFT' using errcode='55000'; end if;
 if exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where
  (n.nspname='booking_lifecycle_private' or (n.nspname='public' and p.proname in
  ('transition_booking_appointment_v2','revise_booking_schedule_v2','revise_booking_notes_v2','close_booking_appointment_v2','read_booking_appointment_mutation_v2','close_booking_operation_v1','guard_appointment_booking_operation_link_v1')))
  and (p.prosecdef or p.proconfig is distinct from array['search_path=pg_catalog, pg_temp'] or p.pronargdefaults<>0
   or exists(select 1 from aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a where a.grantee not in (p.proowner,'service_role'::regrole)))) then
  raise exception 'LIFECYCLE_FUNCTION_POSTURE' using errcode='55000'; end if;
 if (select count(*) from pg_constraint where conrelid='booking_lifecycle_private.appointment_mutations'::regclass and contype='f' and convalidated and not condeferrable and confdeltype='r')<>4 then
  raise exception 'LIFECYCLE_JOURNAL_FKS' using errcode='55000'; end if;
end $post$;

comment on schema booking_lifecycle_private is 'Private lifecycle journal; not an API schema. No financial authority or A1/A2 activation.';
commit;
