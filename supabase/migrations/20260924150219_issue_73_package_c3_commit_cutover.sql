-- Issue #73 Package C3 / Level 3 / CODE ONLY. Do not apply without a separate hosted gate.
-- Requires the accepted B1/B2/C1 foundations. Additive only; migrations 034-036 are unrelated.
set local lock_timeout = '5s';
set local statement_timeout = '30s';

do $$
begin
  perform 1 from pg_proc where oid='public.data_import_lock_run(uuid,uuid,uuid)'::regprocedure;
  perform 1 from pg_proc where oid='public.begin_data_import_commit(uuid,uuid,uuid,text,text,text,jsonb,boolean)'::regprocedure;
  perform 1 from public.data_import_runs limit 1;
exception when undefined_function or undefined_table then
  raise exception 'C3 requires the accepted B1/B2 import foundation';
end $$;

-- Composite tenant key for the consent table. The run id remains globally unique;
-- this redundant pair exists only so same-Business FK integrity is database-enforced.
alter table public.data_import_runs
  add constraint data_import_runs_id_business_c3_key unique (id,business_id);

create table public.data_import_reminder_takeovers (
  import_run_id uuid primary key,
  business_id uuid not null,
  requested_by uuid not null references auth.users(id) on delete restrict,
  requested_at timestamptz not null default transaction_timestamp() check (isfinite(requested_at)),
  constraint data_import_reminder_takeovers_run_business_fk
    foreign key (import_run_id,business_id)
    references public.data_import_runs(id,business_id)
    on delete cascade
);

create index data_import_reminder_takeovers_business_idx
  on public.data_import_reminder_takeovers(business_id,requested_at desc);

create function public.guard_data_import_reminder_takeover() returns trigger
language plpgsql security invoker set search_path=pg_catalog,pg_temp as $$
begin
  if tg_op <> 'INSERT' then
    raise exception 'IMPORT_REMINDER_TAKEOVER_IMMUTABLE' using errcode='23514';
  end if;
  return new;
end $$;

create trigger data_import_reminder_takeovers_guard
before update or delete on public.data_import_reminder_takeovers
for each row execute function public.guard_data_import_reminder_takeover();

-- Cancellation is allowed only before operational commit. Reuse the exact B2
-- Business->plan->run lock primitive so cancel-vs-begin cannot invert lock order.
create function public.cancel_data_import_run(p_business uuid,p_actor uuid,p_run uuid) returns text
language plpgsql security definer set search_path=pg_catalog,pg_temp as $$
declare r public.data_import_runs;
begin
  r:=public.data_import_lock_run(p_business,p_actor,p_run);
  if r.state='cancelled' then return 'cancelled'; end if;
  if r.state<>'previewed' or r.commit_started_at is not null
    or r.lease_token is not null or r.lease_expires_at is not null then
    raise exception 'IMPORT_RUN_NOT_CANCELLABLE';
  end if;
  update public.data_import_runs
    set state='cancelled',finished_at=clock_timestamp()
    where id=r.id and state='previewed' and commit_started_at is null
      and lease_token is null and lease_expires_at is null;
  if not found then raise exception 'IMPORT_RUN_NOT_CANCELLABLE'; end if;
  return 'cancelled';
end $$;

-- Owner consent is a permanent audit fact for this run. It can be requested only
-- while the run is still previewed. Repeated requests for the same run are idempotent.
create function public.request_data_import_reminder_takeover(p_business uuid,p_actor uuid,p_run uuid) returns jsonb
language plpgsql security definer set search_path=pg_catalog,pg_temp as $$
declare r public.data_import_runs; existing public.data_import_reminder_takeovers;
begin
  r:=public.data_import_lock_run(p_business,p_actor,p_run);
  select * into existing from public.data_import_reminder_takeovers where import_run_id=r.id;
  if found then
    if existing.business_id is distinct from p_business or existing.requested_by is distinct from p_actor then
      raise exception 'IMPORT_RUN_AUTHORITY' using errcode='42501';
    end if;
    return jsonb_build_object('importRunId',existing.import_run_id,'requestedAt',existing.requested_at);
  end if;
  if r.state<>'previewed' or r.commit_started_at is not null
    or r.lease_token is not null or r.lease_expires_at is not null then
    raise exception 'IMPORT_REMINDER_TAKEOVER_CLOSED';
  end if;
  insert into public.data_import_reminder_takeovers(import_run_id,business_id,requested_by)
    values(r.id,p_business,p_actor)
    returning * into existing;
  return jsonb_build_object('importRunId',existing.import_run_id,'requestedAt',existing.requested_at);
end $$;


-- Bounded non-PII run truth for the C3 workspace. Counts are computed in the
-- database so PostgREST row limits can never truncate progress/results.
create function public.get_data_import_run_summaries(
  p_business uuid,p_actor uuid,p_limit integer default 20
) returns jsonb
language plpgsql security definer set search_path=pg_catalog,pg_temp as $$
declare result jsonb;
begin
  perform public.data_import_authorize(p_business,p_actor);
  if p_limit is null or p_limit<1 or p_limit>20 then raise exception 'IMPORT_INVALID_LIMIT'; end if;
  select coalesce(jsonb_agg(x.item order by x.created_at desc),'[]'::jsonb) into result
  from (
    select r.created_at,jsonb_build_object(
      'id',r.id,'business_id',r.business_id,'created_by',r.created_by,
      'source_system',r.source_system,'source_account_key',r.source_account_key,
      'schema_version',r.schema_version,'input_checksum',r.input_checksum,
      'source_timezone',r.source_timezone,'source_currency',r.source_currency,
      'state',r.state,'preview_hash',r.preview_hash,'snapshot_hash',r.snapshot_hash,
      'commit_guard_hash',r.commit_guard_hash,'created_at',r.created_at,
      'previewed_at',r.previewed_at,'commit_started_at',r.commit_started_at,
      'finished_at',r.finished_at,'lease_expires_at',r.lease_expires_at,
      'total_rows',(select count(*) from public.data_import_row_outcomes o
        where o.import_run_id=r.id and o.phase='preview'),
      'committed_rows',(select count(*) from public.data_import_row_outcomes o
        where o.import_run_id=r.id and o.phase='commit'),
      'created_count',(select count(*) from public.data_import_row_outcomes o
        where o.import_run_id=r.id and o.phase='commit' and o.commit_result='CREATED'),
      'linked_count',(select count(*) from public.data_import_row_outcomes o
        where o.import_run_id=r.id and o.phase='commit' and o.commit_result='LINKED'),
      'skipped_count',(select count(*) from public.data_import_row_outcomes o
        where o.import_run_id=r.id and o.phase='commit' and o.commit_result='SKIPPED'),
      'blocked_count',(select count(*) from public.data_import_row_outcomes o
        where o.import_run_id=r.id and o.phase='commit' and o.commit_result='BLOCKED'),
      'reminder_requested',exists(select 1 from public.data_import_reminder_takeovers t where t.import_run_id=r.id),
      'unreviewed_services',(select count(*) from public.data_import_row_outcomes o
        join public.services svc on svc.id=o.target_entity_id and svc.business_id=r.business_id
        where o.import_run_id=r.id and o.phase='commit' and o.entity_type='service'
          and o.commit_result='CREATED' and not svc.commercial_settings_reviewed),
      'staff_needing_setup',(select count(*) from public.data_import_row_outcomes o
        join public.staff st on st.id=o.target_entity_id and st.business_id=r.business_id
        where o.import_run_id=r.id and o.phase='commit' and o.entity_type='staff'
          and o.commit_result='CREATED'
          and (not st.accept_online_bookings or not exists(
            select 1 from public.staff_working_hours h where h.staff_id=st.id and h.is_working))),
      'locations_needing_hours',(select count(*) from public.data_import_row_outcomes o
        join public.locations l on l.id=o.target_entity_id and l.business_id=r.business_id
        where o.import_run_id=r.id and o.phase='commit' and o.entity_type='location'
          and o.commit_result='CREATED'
          and not exists(select 1 from public.location_hours h where h.location_id=l.id and h.is_open)),
      'eligible_reminder_appointments',(select count(distinct o.target_entity_id)
        from public.data_import_row_outcomes o
        join public.appointments a on a.id=o.target_entity_id and a.business_id=r.business_id
        join public.businesses b on b.id=r.business_id
        where o.import_run_id=r.id and o.phase='commit' and o.entity_type='appointment'
          and o.commit_result in ('CREATED','LINKED') and o.target_entity_id is not null
          and a.status::text not in ('cancelled','completed','no_show')
          and a.start_time>clock_timestamp()
          and a.start_time-(b.reminder_hours_before*interval '1 hour')>clock_timestamp()),
      'scheduled_reminder_jobs',(select count(*) from public.background_jobs j
        where j.business_id=r.business_id and j.job_type='reminder'
          and j.payload->>'source'='import_reminder_takeover'
          and j.payload->>'importRunId'=r.id::text
          and j.status::text not in ('failed','cancelled')),
      'failed_reminder_jobs',(select count(*) from public.background_jobs j
        where j.business_id=r.business_id and j.job_type='reminder'
          and j.payload->>'source'='import_reminder_takeover'
          and j.payload->>'importRunId'=r.id::text
          and j.status::text='failed')
    ) item
    from public.data_import_runs r
    where r.business_id=p_business and r.created_by=p_actor
    order by r.created_at desc
    limit p_limit
  ) x;
  return result;
end $$;

-- At most 25 appointment targets per scheduling call. Existing tagged C3 jobs
-- are recognized from durable queue truth; deterministic job PKs remain the
-- final job-row race guard and communication_send_intents remains send safety.
create function public.get_data_import_reminder_candidates(
  p_business uuid,p_actor uuid,p_run uuid,p_limit integer default 25
) returns jsonb
language plpgsql security definer set search_path=pg_catalog,pg_temp as $$
declare r public.data_import_runs; result jsonb;
begin
  r:=public.data_import_lock_run(p_business,p_actor,p_run);
  if p_limit is null or p_limit<1 or p_limit>25 then raise exception 'IMPORT_INVALID_LIMIT'; end if;
  if r.state not in ('completed','completed_with_errors','failed') then
    raise exception 'IMPORT_REMINDER_TAKEOVER_NOT_TERMINAL';
  end if;
  if not exists(select 1 from public.data_import_reminder_takeovers t
    where t.import_run_id=r.id and t.business_id=p_business and t.requested_by=p_actor) then
    raise exception 'IMPORT_REMINDER_TAKEOVER_NOT_REQUESTED';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'appointmentId',q.appointment_id,'reminderAt',q.reminder_at) order by q.reminder_at,q.appointment_id),'[]'::jsonb)
    into result
  from (
    select distinct o.target_entity_id appointment_id,
      a.start_time-(b.reminder_hours_before*interval '1 hour') reminder_at
    from public.data_import_row_outcomes o
    join public.appointments a on a.id=o.target_entity_id and a.business_id=p_business
    join public.businesses b on b.id=p_business
    where o.import_run_id=r.id and o.phase='commit' and o.entity_type='appointment'
      and o.commit_result in ('CREATED','LINKED') and o.target_entity_id is not null
      and a.status::text not in ('cancelled','completed','no_show')
      and a.start_time>clock_timestamp()
      and a.start_time-(b.reminder_hours_before*interval '1 hour')>clock_timestamp()
      and (
        not exists(select 1 from public.background_jobs j where j.business_id=p_business
          and j.job_type='reminder' and j.payload->>'source'='import_reminder_takeover'
          and j.payload->>'importRunId'=r.id::text and j.payload->>'appointmentId'=a.id::text
          and j.payload->>'channel'='email')
        or not exists(select 1 from public.background_jobs j where j.business_id=p_business
          and j.job_type='reminder' and j.payload->>'source'='import_reminder_takeover'
          and j.payload->>'importRunId'=r.id::text and j.payload->>'appointmentId'=a.id::text
          and j.payload->>'channel'='sms')
      )
    order by reminder_at,o.target_entity_id
    limit p_limit
  ) q;
  return result;
end $$;

alter table public.data_import_reminder_takeovers enable row level security;
alter table public.data_import_reminder_takeovers force row level security;

revoke all on public.data_import_reminder_takeovers from public,anon,authenticated,service_role;
grant select on public.data_import_reminder_takeovers to service_role;

revoke all on function public.guard_data_import_reminder_takeover() from public,anon,authenticated,service_role;
revoke all on function public.cancel_data_import_run(uuid,uuid,uuid) from public,anon,authenticated,service_role;
revoke all on function public.request_data_import_reminder_takeover(uuid,uuid,uuid) from public,anon,authenticated,service_role;
revoke all on function public.get_data_import_run_summaries(uuid,uuid,integer) from public,anon,authenticated,service_role;
revoke all on function public.get_data_import_reminder_candidates(uuid,uuid,uuid,integer) from public,anon,authenticated,service_role;
grant execute on function public.cancel_data_import_run(uuid,uuid,uuid) to service_role;
grant execute on function public.request_data_import_reminder_takeover(uuid,uuid,uuid) to service_role;
grant execute on function public.get_data_import_run_summaries(uuid,uuid,integer) to service_role;
grant execute on function public.get_data_import_reminder_candidates(uuid,uuid,uuid,integer) to service_role;

-- Closing self-verification: no browser table write path and no client RPC execute.
do $$
declare role_name text;
begin
  if not (select relrowsecurity and relforcerowsecurity from pg_class where oid='public.data_import_reminder_takeovers'::regclass)
    or exists(select 1 from pg_policy where polrelid='public.data_import_reminder_takeovers'::regclass) then
    raise exception 'C3 reminder consent RLS posture drift';
  end if;
  foreach role_name in array array['anon','authenticated'] loop
    if has_table_privilege(role_name,'public.data_import_reminder_takeovers','SELECT')
      or has_table_privilege(role_name,'public.data_import_reminder_takeovers','INSERT')
      or has_table_privilege(role_name,'public.data_import_reminder_takeovers','UPDATE')
      or has_table_privilege(role_name,'public.data_import_reminder_takeovers','DELETE')
      or has_function_privilege(role_name,'public.cancel_data_import_run(uuid,uuid,uuid)','EXECUTE')
      or has_function_privilege(role_name,'public.request_data_import_reminder_takeover(uuid,uuid,uuid)','EXECUTE')
      or has_function_privilege(role_name,'public.get_data_import_run_summaries(uuid,uuid,integer)','EXECUTE')
      or has_function_privilege(role_name,'public.get_data_import_reminder_candidates(uuid,uuid,uuid,integer)','EXECUTE') then
      raise exception 'C3 client privilege drift';
    end if;
  end loop;
  if not has_table_privilege('service_role','public.data_import_reminder_takeovers','SELECT')
    or has_table_privilege('service_role','public.data_import_reminder_takeovers','INSERT')
    or has_table_privilege('service_role','public.data_import_reminder_takeovers','UPDATE')
    or has_table_privilege('service_role','public.data_import_reminder_takeovers','DELETE')
    or not has_function_privilege('service_role','public.cancel_data_import_run(uuid,uuid,uuid)','EXECUTE')
    or not has_function_privilege('service_role','public.request_data_import_reminder_takeover(uuid,uuid,uuid)','EXECUTE')
    or not has_function_privilege('service_role','public.get_data_import_run_summaries(uuid,uuid,integer)','EXECUTE')
    or not has_function_privilege('service_role','public.get_data_import_reminder_candidates(uuid,uuid,uuid,integer)','EXECUTE')
    or has_function_privilege('service_role','public.guard_data_import_reminder_takeover()','EXECUTE') then
    raise exception 'C3 service-role privilege drift';
  end if;
end $$;
