"""Pure authoring helper: bounded assertions, not a second migration."""
from pathlib import Path
import hashlib,re

def protected_bodies(root):
    names={
      'set_updated_at',
      'bootstrap_booking_operation_v1','persist_booking_operation_appointment_v1',
      'bind_booking_operation_appointment_v1','commit_booking_operation_manual_payment_v1',
      'read_booking_operations_v1','guard_commerce_booking_operation_v1',
      'validate_appointment_slot','get_available_slots','resolve_location_id',
      'is_location_holiday','is_staff_on_vacation','availability_block_reason','payment_projection_history_valid_v1',
      'payment_appointment_truth_v1','project_payment_obligation_v1','read_payment_observability_v1',
    }
    files=sorted(p for p in (root/'supabase/migrations').glob('0*.sql') if int(p.name[:3])<=33)
    files += [root/'supabase/migrations'/n for n in [
      '20260922050000_issue_81_stage_1b_relationship_booking_convergence.sql',
      '20261004190341_issue_134_payment_attempt_foundation.sql',
      '20261005154345_issue_134_r1a_manual_payment_kernel.sql',
      '20261007012529_issue_134_appointment_financial_attribution.sql',
      '20261007203352_issue_134_durable_booking_operation.sql',
      '20261008210359_issue_133_payment_projection_observability.sql']]
    found={}
    for p in files:
      for m in re.finditer(r'create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?(\w+)\s*\([^;]*?\bas\s+(\$\w*\$)(.*?)\2',p.read_text(),re.S|re.I):
        if m[1] in names: found[m[1]]=hashlib.md5(m[3].encode()).hexdigest()
    missing=names-set(found)
    if missing: raise RuntimeError('Unresolved protected function bodies: '+str(missing))
    values=','.join("('%s','%s')"%x for x in sorted(found.items()))
    return f"""if exists(select 1 from (values {values}) expected(name,body_md5)
      where (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname=expected.name)<>1 or not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
       where n.nspname='public' and p.proname=expected.name and md5(p.prosrc)=expected.body_md5)) then
      raise exception 'LIFECYCLE_PROTECTED_BODY_DRIFT' using errcode='55000'; end if;"""

def pre(root):
    return "do $capability$ begin\n"+protected_bodies(root)+"""

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
 if exists(select 1 from pg_roles r where r.rolname in ('anon','authenticated','service_role') and
   (has_parameter_privilege(r.oid,'session_replication_role','SET')
    or has_table_privilege(r.oid,'public.appointments','TRUNCATE')
    or has_table_privilege(r.oid,'public.appointment_resources','TRUNCATE')
    or has_schema_privilege(r.oid,'public','CREATE'))) then
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
end $capability$;"""

def post(root):
    return "do $post$ begin\n"+protected_bodies(root)+"""
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
end $post$;"""
