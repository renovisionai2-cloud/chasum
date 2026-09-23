-- Issue #73 B2 core / Level 3 / CODE ONLY. Apply exact file in one transaction.
-- Requires B1, accepted Stage 1B/1C and the separate Staff quota prerequisite.
-- No hosted apply authorization. No historical migrations (including 034-036).
set local lock_timeout = '5s';
set local statement_timeout = '30s';

do $$
begin
  if not exists (select 1 from pg_trigger where tgrelid='public.staff'::regclass
    and tgname='staff_enforce_plan_quota' and tgenabled in ('O','A')
    and tgfoid='public.enforce_staff_quota()'::regprocedure)
    or not exists (select 1 from pg_trigger where tgrelid='public.locations'::regclass
      and tgname='locations_enforce_plan_quota' and tgenabled in ('O','A'))
    or not exists (select 1 from pg_constraint where conrelid='public.appointments'::regclass
      and conname='appointments_staff_no_overlap' and contype='x') then
    raise exception 'B2 requires Location/Staff quota and appointment exclusion prerequisites';
  end if;
  perform max_staff from public.subscription_plans limit 1;
  perform preview_hash, snapshot_hash from public.data_import_runs limit 1;
end $$;

-- Existing catalog configuration retains its accepted behavior. New Services
-- default unreviewed; the normal explicit Service creation form supplies true.
alter table public.services add column commercial_settings_reviewed boolean not null default true;
alter table public.services alter column commercial_settings_reviewed set default false;
create function public.guard_service_commercial_readiness() returns trigger
language plpgsql security invoker set search_path=pg_catalog,pg_temp as $$
begin
  if not new.commercial_settings_reviewed and (new.online_booking or new.booking_visibility='online') then
    raise exception 'SERVICE_COMMERCIAL_REVIEW_REQUIRED' using errcode='P0001';
  end if;
  return new;
end $$;
create trigger services_commercial_readiness before insert or update on public.services
for each row execute function public.guard_service_commercial_readiness();

-- No raw payload persisted. Fingerprints are sensitive pseudonymous metadata.
alter table public.data_import_runs
  add column target_fingerprint text check (target_fingerprint ~ '^[a-f0-9]{64}$'),
  add column commit_guard_hash text check (commit_guard_hash ~ '^[a-f0-9]{64}$'),
  add column lease_token uuid,
  add column lease_expires_at timestamptz check (isfinite(lease_expires_at)),
  add column heartbeat_at timestamptz check (isfinite(heartbeat_at));
alter table public.data_import_row_outcomes
  add column operational_hash text check (operational_hash ~ '^[a-f0-9]{64}$'),
  add column row_ordinal integer check (row_ordinal between 0 and 4999),
  add column commit_result text check (commit_result in ('CREATED','LINKED','SKIPPED','BLOCKED')),
  add constraint data_import_b2_outcome_shape check (
    (operational_hash is null and row_ordinal is null and commit_result is null)
    or (operational_hash is not null and row_ordinal is not null
      and ((phase='preview' and commit_result is null) or (phase='commit' and commit_result is not null))));
create unique index data_import_outcome_ordinal on public.data_import_row_outcomes(import_run_id,phase,row_ordinal)
where row_ordinal is not null;

create or replace function public.data_import_guard_run() returns trigger
language plpgsql security invoker set search_path=pg_catalog,pg_temp as $$
begin
  if tg_op='INSERT' then
    if new.state<>'uploaded' or new.lease_token is not null or new.commit_guard_hash is not null then
      raise exception 'Import run must start uploaded' using errcode='23514';
    end if;
    return new;
  end if;
  if old.state in ('completed','completed_with_errors','failed','cancelled') then
    raise exception 'Terminal import run is immutable; retry requires a new run' using errcode='23514';
  end if;
  if row(new.id,new.business_id,new.created_by,new.source_system,new.source_account_key,new.schema_version,
    new.input_checksum,new.source_timezone,new.source_currency,new.created_at)
    is distinct from row(old.id,old.business_id,old.created_by,old.source_system,old.source_account_key,old.schema_version,
    old.input_checksum,old.source_timezone,old.source_currency,old.created_at) then
    raise exception 'Import run identity is immutable' using errcode='23514';
  end if;
  if not ((old.state='uploaded' and new.state in ('previewed','failed','cancelled'))
    or (old.state='previewed' and new.state in ('committing','failed','cancelled'))
    or (old.state='committing' and new.state in ('committing','completed','completed_with_errors','failed'))) then
    raise exception 'Illegal import run transition' using errcode='23514';
  end if;
  if old.state<>'uploaded' or new.state<>'previewed' then
    if row(new.preview_hash,new.snapshot_hash,new.previewed_at,new.target_fingerprint,new.commit_guard_hash)
      is distinct from row(old.preview_hash,old.snapshot_hash,old.previewed_at,old.target_fingerprint,old.commit_guard_hash) then
      raise exception 'Reviewed import preview is immutable' using errcode='23514';
    end if;
  end if;
  if not (old.state='previewed' and new.state='committing') and new.commit_started_at is distinct from old.commit_started_at then
    raise exception 'Import commit timestamp is immutable outside entry' using errcode='23514';
  end if;
  if old.state=new.state then
    if old.commit_guard_hash is null or new.heartbeat_at is null or new.lease_expires_at is null
      or new.lease_token is null or new.heartbeat_at <= old.heartbeat_at
      or new.lease_expires_at <= new.heartbeat_at
      or new.finished_at is distinct from old.finished_at
      or (new.lease_token is distinct from old.lease_token and old.lease_expires_at > clock_timestamp()) then
      raise exception 'Invalid import lease update' using errcode='23514';
    end if;
  end if;
  return new;
end $$;

create function public.data_import_digest(p_value jsonb) returns text
language sql immutable security invoker set search_path=pg_catalog,pg_temp as $$
  select encode(sha256(convert_to(p_value::text,'UTF8')),'hex')
$$;

-- A single SQL statement provides a coherent, complete tenant snapshot, without
-- PostgREST pagination truncation. Versions bind all operational row fields.
-- Only needed matching fields leave this RPC; source payload is never stored.
create function public.data_import_context(p_business uuid) returns jsonb
language sql stable security invoker set search_path=pg_catalog,pg_temp set timezone='UTC' as $$
select jsonb_build_object(
  'business',jsonb_build_object('id',b.id,'timezone',b.timezone,'currency',upper(b.currency),
    'planKey',b.subscription_plan_key,'bookingDefaults',jsonb_build_array(b.appointment_interval_minutes,
    b.booking_limit_days,b.max_daily_bookings,b.cancellation_policy,b.min_notice_minutes)),
  'capacity',jsonb_build_object('maxLocations',p.max_locations,'maxStaff',p.max_staff,
    'activeLocations',(select count(*) from public.locations where business_id=b.id and is_active),
    'activeStaff',(select count(*) from public.staff where business_id=b.id and is_active)),
  'snapshot',jsonb_build_object('businessId',b.id,
    'entities',coalesce((select jsonb_agg(e order by e->>'entityType',e->>'id') from (
      select jsonb_strip_nulls(jsonb_build_object('entityType','location','id',l.id,'businessId',l.business_id,
        'version',public.data_import_digest(to_jsonb(l)),'name',l.name,'slug',l.slug,'address',l.address_line1,'phone',l.phone)) e
        from public.locations l where l.business_id=b.id
      union all select jsonb_strip_nulls(jsonb_build_object('entityType','service','id',s.id,'businessId',s.business_id,
        'version',public.data_import_digest(to_jsonb(s)),'name',s.name,'primaryLocationId',s.location_id,
        'durationMinutes',s.duration_minutes,'priceCents',s.price*100)) from public.services s where s.business_id=b.id
      union all select jsonb_strip_nulls(jsonb_build_object('entityType','staff','id',s.id,'businessId',s.business_id,
        'version',public.data_import_digest(to_jsonb(s)),'name',s.name,'email',s.email,'phone',s.phone,
        'primaryLocationId',s.location_id)) from public.staff s where s.business_id=b.id
      union all select jsonb_strip_nulls(jsonb_build_object('entityType','customer','id',c.id,'businessId',c.business_id,
        'version',public.data_import_digest(to_jsonb(c)),'name',c.name,'email',c.email,'phone',c.phone)) from public.customers c where c.business_id=b.id
      union all select jsonb_build_object('entityType','appointment','id',a.id,'businessId',a.business_id,
        'version',public.data_import_digest(to_jsonb(a)),'staffId',a.staff_id,'start',a.start_time,'end',a.end_time,
        'status',case when a.status::text='scheduled' then 'pending' else a.status::text end)
        from public.appointments a where a.business_id=b.id
    ) entities),'[]'::jsonb),
    'assignments',coalesce((select jsonb_agg(e order by e::text) from (
      select jsonb_build_object('entityType','serviceLocation','serviceId',x.service_id,'locationId',x.location_id) e
        from public.service_locations x join public.services s on s.id=x.service_id where s.business_id=b.id
      union all select jsonb_build_object('entityType','staffLocation','staffId',x.staff_id,'locationId',x.location_id)
        from public.staff_locations x join public.staff s on s.id=x.staff_id where s.business_id=b.id
      union all select jsonb_build_object('entityType','staffService','staffId',x.staff_id,'serviceId',x.service_id)
        from public.staff_services x join public.staff s on s.id=x.staff_id where s.business_id=b.id
    ) assignments),'[]'::jsonb),
    'sourceRefs',coalesce((select jsonb_agg(jsonb_build_object('businessId',r.business_id,'sourceSystem',r.source_system,
      'sourceAccountKey',r.source_account_key,'entityType',r.entity_type,'sourceExternalId',r.source_external_id,
      'sourceRowHash',r.source_row_hash,'chasumEntityId',r.chasum_entity_id) order by r.id)
      from public.data_import_entity_refs r where r.business_id=b.id),'[]'::jsonb)))
from public.businesses b join public.subscription_plans p on p.plan_key=b.subscription_plan_key and p.is_active
where b.id=p_business
$$;

-- Lock order is always Business -> active plan -> run. Owner changes and quota
-- inserts serialize here; NO KEY UPDATE allows ordinary child INSERT FK KEY SHARE
-- to finish before a customer-table lock, avoiding an FK/table lock inversion.
-- Never accept a caller-supplied tenant authority claim.
create function public.data_import_authorize(p_business uuid,p_actor uuid) returns void
language plpgsql security invoker set search_path=pg_catalog,pg_temp as $$
declare v_plan_key text;
begin
  if current_setting('transaction_isolation') not in ('read committed','read uncommitted') then
    raise exception 'IMPORT_FRESH_TRANSACTION_REQUIRED';
  end if;
  select b.subscription_plan_key into v_plan_key from public.businesses b
    where b.id=p_business and b.owner_id=p_actor for no key update;
  if not found or p_actor is null then raise exception 'IMPORT_OWNER_REQUIRED' using errcode='42501'; end if;
  perform 1 from public.subscription_plans p where p.plan_key=v_plan_key and p.is_active for share;
  if not found then raise exception 'IMPORT_PLAN_UNAVAILABLE'; end if;
end $$;

create function public.get_data_import_context(p_business uuid,p_actor uuid) returns jsonb
language plpgsql security definer set search_path=pg_catalog,pg_temp as $$
declare ctx jsonb;
begin
  perform public.data_import_authorize(p_business,p_actor);
  ctx:=public.data_import_context(p_business);
  return ctx || jsonb_build_object('fingerprint',public.data_import_digest(ctx));
end $$;

create function public.prepare_data_import_run(p_business uuid,p_actor uuid,p_source jsonb,
  p_preview_hash text,p_snapshot_hash text,p_target_fingerprint text,p_rows jsonb) returns jsonb
language plpgsql security definer set search_path=pg_catalog,pg_temp as $$
declare rid uuid; ctx jsonb; guard text; item jsonb; o jsonb; idx integer:=0; slugs jsonb;
  previous_rank integer:=-1; rank integer;
begin
  perform public.data_import_authorize(p_business,p_actor);
  ctx:=public.data_import_context(p_business);
  if p_target_fingerprint is distinct from public.data_import_digest(ctx) then raise exception 'IMPORT_REPREVIEW_REQUIRED'; end if;
  if jsonb_typeof(p_rows) is distinct from 'array' or jsonb_array_length(p_rows)>5000 then raise exception 'IMPORT_INVALID_PLAN'; end if;
  select coalesce(jsonb_agg(x->'row'->>'slug' order by x->'row'->>'slug'),'[]'::jsonb) into slugs
    from jsonb_array_elements(p_rows) x where x->'row'->>'entityType'='location' and x->'outcome'->>'plannedAction'='CREATE';
  guard:=public.data_import_digest(jsonb_build_object('businessId',p_business,'planKey',ctx->'business'->'planKey',
    'capacity',ctx->'capacity','locationSlugs',slugs,'previewHash',p_preview_hash,'snapshotHash',p_snapshot_hash,
    'targetFingerprint',p_target_fingerprint,'operationalPlanHash',public.data_import_digest(p_rows)));
  insert into public.data_import_runs(business_id,created_by,source_system,source_account_key,schema_version,
    input_checksum,source_timezone,source_currency) values(p_business,p_actor,p_source->>'sourceSystem',p_source->>'sourceAccountKey',
    p_source->>'schemaVersion',p_source->>'inputChecksum',p_source->>'sourceTimezone',p_source->>'sourceCurrency') returning id into rid;
  for item in select value from jsonb_array_elements(p_rows) loop
    o:=item->'outcome';
    rank:=array_position(array['location','service','staff','serviceLocation','staffLocation','staffService','customer','appointment'],o->>'entityType');
    if rank is null or rank<previous_rank or o->>'entityType' is distinct from item->'row'->>'entityType'
      or o->>'sourceRowKey' is distinct from item->'row'->>'sourceRowKey' then raise exception 'IMPORT_INVALID_PLAN'; end if;
    previous_rank:=rank;
    insert into public.data_import_row_outcomes(import_run_id,phase,entity_type,source_row_key,
      source_row_hash,status,planned_action,reason_codes,target_entity_id,operational_hash,row_ordinal)
    values(rid,'preview',o->>'entityType',o->>'sourceRowKey',o->>'sourceRowHash',
      o->>'status',o->>'plannedAction',array(select jsonb_array_elements_text(o->'reasonCodes')),
      (o->>'existingId')::uuid,public.data_import_digest(item),idx);
    idx:=idx+1;
  end loop;
  update public.data_import_runs set state='previewed',preview_hash=p_preview_hash,snapshot_hash=p_snapshot_hash,
    previewed_at=clock_timestamp(),target_fingerprint=p_target_fingerprint,commit_guard_hash=guard where id=rid;
  return jsonb_build_object('runId',rid,'commitGuardHash',guard);
end $$;

create function public.data_import_lock_run(p_business uuid,p_actor uuid,p_run uuid) returns public.data_import_runs
language plpgsql security invoker set search_path=pg_catalog,pg_temp as $$
declare r public.data_import_runs;
begin
  perform public.data_import_authorize(p_business,p_actor);
  select * into r from public.data_import_runs where id=p_run and business_id=p_business and created_by=p_actor for update;
  if not found or r.commit_guard_hash is null then raise exception 'IMPORT_RUN_AUTHORITY' using errcode='42501'; end if;
  return r;
end $$;

-- Initial begin and expired-lease reclaim share the same CAS. Reclaim deliberately
-- checks immutable reviewed commitments, not a pre-write snapshot changed by the
-- run's own successful batches. Every remaining row is revalidated at write time.
create function public.begin_data_import_commit(p_business uuid,p_actor uuid,p_run uuid,
  p_preview_hash text,p_snapshot_hash text,p_commit_guard_hash text,p_rows jsonb,p_resume boolean default false) returns uuid
language plpgsql security definer set search_path=pg_catalog,pg_temp as $$
declare r public.data_import_runs; token uuid:=gen_random_uuid(); t timestamptz;
begin
  r:=public.data_import_lock_run(p_business,p_actor,p_run);
  if row(p_preview_hash,p_snapshot_hash,p_commit_guard_hash) is distinct from row(r.preview_hash,r.snapshot_hash,r.commit_guard_hash) then
    raise exception 'IMPORT_REPREVIEW_REQUIRED';
  end if;
  if jsonb_typeof(p_rows) is distinct from 'array' or jsonb_array_length(p_rows)<>(select count(*) from public.data_import_row_outcomes where import_run_id=p_run and phase='preview')
    or exists(select 1 from jsonb_array_elements(p_rows) with ordinality x(item,ordinal) where not exists (
      select 1 from public.data_import_row_outcomes p where p.import_run_id=p_run and p.phase='preview'
      and p.row_ordinal=x.ordinal-1 and p.operational_hash=public.data_import_digest(x.item))) then
    raise exception 'IMPORT_ROW_NOT_REVIEWED';
  end if;
  t:=clock_timestamp();
  if r.state='previewed' and not p_resume then
    if public.data_import_digest(public.data_import_context(p_business)) is distinct from r.target_fingerprint then
      raise exception 'IMPORT_REPREVIEW_REQUIRED';
    end if;
    update public.data_import_runs set state='committing',commit_started_at=t,lease_token=token,
      heartbeat_at=t,lease_expires_at=t+interval '2 minutes' where id=p_run and state='previewed';
  elsif r.state='committing' and p_resume and r.lease_expires_at<=t then
    update public.data_import_runs set lease_token=token,heartbeat_at=t,lease_expires_at=t+interval '2 minutes' where id=p_run;
  else raise exception 'IMPORT_RUN_NOT_CLAIMABLE';
  end if;
  return token;
end $$;

create function public.data_import_require_lease(r public.data_import_runs,p_token uuid) returns void
language plpgsql security invoker set search_path=pg_catalog,pg_temp as $$
begin
  if r.state<>'committing' or p_token is null or r.lease_token is distinct from p_token
    or r.lease_expires_at is null or r.lease_expires_at<=clock_timestamp() then raise exception 'IMPORT_LEASE_LOST'; end if;
end $$;

create function public.data_import_resolve(p_business uuid,p_run uuid,p_type text,p_ref jsonb) returns uuid
language plpgsql security invoker set search_path=pg_catalog,pg_temp as $$
declare target uuid;
begin
  if p_ref->>'existingId' is not null then target:=(p_ref->>'existingId')::uuid;
  else
    select target_entity_id into target from public.data_import_row_outcomes where import_run_id=p_run and phase='commit'
      and entity_type=p_type and source_row_key=p_ref->>'sourceRowKey' and commit_result in ('CREATED','LINKED');
  end if;
  if target is null then raise exception 'BLOCKED_PARENT' using errcode='P7301'; end if;
  begin perform public.data_import_assert_target(p_type,target,p_business);
  exception when foreign_key_violation then raise exception 'MISSING_REFERENCE' using errcode='P7301'; end;
  return target;
end $$;

-- Internal single-row primitive. Only the bounded batch RPC may execute it.
create function public.data_import_write_row(p_business uuid,p_run uuid,p_row jsonb,p_status text) returns uuid
language plpgsql security invoker set search_path=pg_catalog,pg_temp as $$
declare target uuid; loc uuid; svc uuid; st uuid; cust uuid; b public.businesses;
  f jsonb; amount text; n numeric; total numeric; matches integer; zone text; inserted integer;
begin
  select * into strict b from public.businesses where id=p_business;
  if p_row->>'entityType' in ('location','service','staff','customer') and nullif(btrim(p_row->>'name'),'') is null then
    raise exception 'NAME_REQUIRED' using errcode='P7301'; end if;
  case p_row->>'entityType'
  when 'location' then
    zone:=coalesce(p_row->>'timezone',(select source_timezone from public.data_import_runs where id=p_run));
    if not exists(select 1 from pg_timezone_names where name=zone) then raise exception 'INVALID_TIMEZONE' using errcode='P7301'; end if;
    if coalesce(p_row->>'slug','') !~ '^[a-z0-9][a-z0-9-]{0,47}$' then raise exception 'INVALID_ROW' using errcode='P7301'; end if;
    if exists(select 1 from public.locations where business_id=p_business and slug=p_row->>'slug') then
      raise exception 'DUPLICATE_LOCATION_SLUG' using errcode='P7301'; end if;
    insert into public.locations(business_id,name,slug,timezone,address_line1,phone,is_active,is_default)
      values(p_business,p_row->>'name',p_row->>'slug',zone,p_row->>'address',p_row->>'phone',true,false) returning id into target;
    insert into public.location_settings(location_id,appointment_interval_minutes,booking_limit_days,max_daily_bookings,
      cancellation_policy,min_booking_notice_minutes,default_travel_minutes,timezone)
      values(target,coalesce(b.appointment_interval_minutes,30),coalesce(b.booking_limit_days,60),b.max_daily_bookings,
      b.cancellation_policy,coalesce(b.min_notice_minutes,0),0,zone);
    insert into public.location_hours(location_id,day_of_week,is_open) select target,day,false from generate_series(0,6) day;
  when 'service' then
    loc:=public.data_import_resolve(p_business,p_run,'location',p_row->'primaryLocation');
    if p_row->>'currency' is distinct from upper(b.currency) then raise exception 'CURRENCY_MISMATCH' using errcode='P7301'; end if;
    n:=(p_row->>'priceCents')::numeric;
    if n is null or n<>trunc(n) or n<0 or n>2147483647 or (p_row->>'durationMinutes')::numeric<=0
      or (p_row->>'durationMinutes')::numeric<>trunc((p_row->>'durationMinutes')::numeric)
      or (p_row->>'durationMinutes')::numeric>2147483647 then raise exception 'INVALID_MONEY' using errcode='P7301'; end if;
    -- Omit unknown commercial settings. Readiness makes inherited DB defaults non-public.
    insert into public.services(business_id,location_id,name,duration_minutes,price,is_active,online_booking,booking_visibility,commercial_settings_reviewed)
      values(p_business,loc,p_row->>'name',(p_row->>'durationMinutes')::integer,n/100,true,false,'internal',false) returning id into target;
    insert into public.service_locations(service_id,location_id,is_primary) values(target,loc,true);
  when 'staff' then
    loc:=public.data_import_resolve(p_business,p_run,'location',p_row->'primaryLocation');
    insert into public.staff(business_id,location_id,default_location_id,name,email,phone,is_active,employment_status,
      user_id,accept_online_bookings,accept_new_clients,accept_walk_ins)
      values(p_business,loc,loc,p_row->>'name',p_row->>'email',p_row->>'phone',true,'active',null,false,false,false) returning id into target;
    -- Existing AFTER INSERT seed is authoritative; close its seven rows atomically.
    update public.staff_working_hours set is_working=false where staff_id=target;
    if (select count(*) from public.staff_working_hours where staff_id=target)<>7 then raise exception 'IMPORT_STAFF_HOURS_PREREQUISITE'; end if;
    insert into public.staff_locations(staff_id,location_id,is_primary) values(target,loc,true);
  when 'customer' then
    if p_row->>'email' is null or p_row->>'email'<>lower(btrim(p_row->>'email'))
      or p_row->>'email' !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
      raise exception 'CUSTOMER_EMAIL_UNSUPPORTED' using errcode='P7301'; end if;
    select count(*) into matches from public.customers where business_id=p_business and lower(btrim(email))=p_row->>'email';
    if matches>0 then raise exception 'IDENTITY_CONFLICT' using errcode='P7301'; end if;
    insert into public.customers(business_id,name,email,phone) values(p_business,p_row->>'name',p_row->>'email',p_row->>'phone') returning id into target;
  when 'serviceLocation' then
    svc:=public.data_import_resolve(p_business,p_run,'service',p_row->'service');
    loc:=public.data_import_resolve(p_business,p_run,'location',p_row->'location');
    insert into public.service_locations(service_id,location_id,is_primary) values(svc,loc,false) on conflict do nothing;
    get diagnostics inserted=row_count;
    if inserted=0 then raise exception 'ASSIGNMENT_EXISTS' using errcode='P7302'; end if;
  when 'staffLocation' then
    st:=public.data_import_resolve(p_business,p_run,'staff',p_row->'staff');
    loc:=public.data_import_resolve(p_business,p_run,'location',p_row->'location');
    insert into public.staff_locations(staff_id,location_id,is_primary) values(st,loc,false) on conflict do nothing;
    get diagnostics inserted=row_count;
    if inserted=0 then raise exception 'ASSIGNMENT_EXISTS' using errcode='P7302'; end if;
  when 'staffService' then
    st:=public.data_import_resolve(p_business,p_run,'staff',p_row->'staff');
    svc:=public.data_import_resolve(p_business,p_run,'service',p_row->'service');
    insert into public.staff_services(staff_id,service_id) values(st,svc) on conflict do nothing;
    get diagnostics inserted=row_count;
    if inserted=0 then raise exception 'ASSIGNMENT_EXISTS' using errcode='P7302'; end if;
  when 'appointment' then
    loc:=public.data_import_resolve(p_business,p_run,'location',p_row->'location');
    svc:=public.data_import_resolve(p_business,p_run,'service',p_row->'service');
    st:=public.data_import_resolve(p_business,p_run,'staff',p_row->'staff');
    cust:=public.data_import_resolve(p_business,p_run,'customer',p_row->'customer');
    -- Lock the actual relationships against concurrent deletion until INSERT ends.
    perform 1 from public.service_locations where service_id=svc and location_id=loc for share;
    if not found then raise exception 'ASSIGNMENT_REQUIRED' using errcode='P7301'; end if;
    perform 1 from public.staff_locations where staff_id=st and location_id=loc for share;
    if not found then raise exception 'ASSIGNMENT_REQUIRED' using errcode='P7301'; end if;
    perform 1 from public.staff_services where staff_id=st and service_id=svc for share;
    if not found then raise exception 'ASSIGNMENT_REQUIRED' using errcode='P7301'; end if;
    if p_row->>'start' !~ 'Z$' or p_row->>'end' !~ 'Z$' or not isfinite((p_row->>'start')::timestamptz)
      or not isfinite((p_row->>'end')::timestamptz) then raise exception 'INVALID_TIMESTAMP' using errcode='P7301'; end if;
    if (p_row->>'start')::timestamptz<=clock_timestamp() then raise exception 'NOT_FUTURE' using errcode='P7301'; end if;
    if (p_row->>'end')::timestamptz<=(p_row->>'start')::timestamptz then raise exception 'INVALID_RANGE' using errcode='P7301'; end if;
    if p_status is null or p_status not in ('pending','confirmed','arrived','waiting','in_progress','cancelled','completed','no_show') then
      raise exception 'UNMAPPED_STATUS' using errcode='P7301'; end if;
    f:=p_row->'financials';
    if f->>'kind' is distinct from 'EXACT' or f->>'currency' is distinct from upper(b.currency)
      or f->>'currency' is distinct from (select source_currency from public.data_import_runs where id=p_run)
      or (f->>'amountPaidCents')::numeric is distinct from 0::numeric or (f->>'amountRefundedCents')::numeric is distinct from 0::numeric
      or (f->>'discountCents')::numeric is distinct from 0::numeric then raise exception 'FINANCIAL_RECONCILIATION_REQUIRED' using errcode='P7301'; end if;
    foreach amount in array array['priceCents','taxCents','depositCents','amountPaidCents','amountRefundedCents','discountCents'] loop
      n:=(f->>amount)::numeric;
      if n is null or n<>trunc(n) or n<0 or n>2147483647 then raise exception 'INVALID_MONEY' using errcode='P7301'; end if;
    end loop;
    total:=(f->>'priceCents')::numeric+(f->>'taxCents')::numeric;
    if total>2147483647 or (f->>'depositCents')::numeric>total then raise exception 'INVALID_MONEY' using errcode='P7301'; end if;
    insert into public.appointments(business_id,location_id,service_id,staff_id,customer_id,start_time,end_time,status,notes,
      price_cents,tax_cents,deposit_cents,amount_paid_cents,amount_refunded_cents,discount_cents,payment_status)
      values(p_business,loc,svc,st,cust,(p_row->>'start')::timestamptz,(p_row->>'end')::timestamptz,p_status::public.appointment_status,p_row->>'notes',
      (f->>'priceCents')::integer,(f->>'taxCents')::integer,(f->>'depositCents')::integer,0,0,0,
      case when (f->>'depositCents')::integer>0 then 'deposit_required' else 'unpaid' end) returning id into target;
  else raise exception 'IMPORT_INVALID_PLAN';
  end case;
  return target;
end $$;

-- Each row's operational INSERT, stable ref, and immutable outcome share a
-- subtransaction. Only controlled business failures are retained; unexpected
-- failures escape and roll back the ENTIRE bounded batch.
create function public.commit_data_import_batch(p_business uuid,p_actor uuid,p_run uuid,p_token uuid,p_rows jsonb) returns jsonb
language plpgsql security definer set search_path=pg_catalog,pg_temp as $$
declare r public.data_import_runs; item jsonb; o jsonb; rowdata jsonb; expected public.data_import_row_outcomes;
  prior public.data_import_row_outcomes; ref public.data_import_entity_refs; target uuid;
  result text; reasons text[]; status text; action text; message text; constraint_name text;
  returned jsonb:='[]'::jsonb; t timestamptz; v_customer public.customers; matches integer;
begin
  r:=public.data_import_lock_run(p_business,p_actor,p_run);
  perform public.data_import_require_lease(r,p_token);
  if jsonb_typeof(p_rows) is distinct from 'array' or jsonb_array_length(p_rows)>50 then raise exception 'IMPORT_BATCH_LIMIT'; end if;
  -- Legacy customer uniqueness is case-sensitive. This short, bounded table
  -- lock waits for ordinary customer writers before normalized identity checks.
  -- It neither rewrites legacy duplicates nor grants imports an UPDATE policy.
  if exists(select 1 from jsonb_array_elements(p_rows) x where x->'row'->>'entityType'='customer') then
    lock table public.customers in share row exclusive mode;
  end if;
  for item in select value from jsonb_array_elements(p_rows) loop
    o:=item->'outcome'; rowdata:=item->'row';
    select * into expected from public.data_import_row_outcomes where import_run_id=p_run and phase='preview'
      and entity_type=o->>'entityType' and source_row_key=o->>'sourceRowKey';
    if not found or expected.operational_hash is distinct from public.data_import_digest(item) then raise exception 'IMPORT_ROW_NOT_REVIEWED'; end if;
    select * into prior from public.data_import_row_outcomes where import_run_id=p_run and phase='commit'
      and entity_type=expected.entity_type and source_row_key=expected.source_row_key;
    if found then returned:=returned||jsonb_build_array(to_jsonb(prior)); continue; end if;
    if exists(select 1 from public.data_import_row_outcomes p where p.import_run_id=p_run and p.phase='preview'
      and p.row_ordinal<expected.row_ordinal and not exists(select 1 from public.data_import_row_outcomes c
        where c.import_run_id=p_run and c.phase='commit' and c.row_ordinal=p.row_ordinal)) then raise exception 'IMPORT_DEPENDENCY_ORDER'; end if;
    target:=null; result:=null; status:=expected.status; action:=expected.planned_action; reasons:=expected.reason_codes;
    begin
      if action in ('BLOCK','REVIEW') then result:='BLOCKED';
      elsif action='SKIP' then result:='SKIPPED';
      else
        if expected.entity_type='appointment' then
          if rowdata->'financials'->>'kind' is distinct from 'EXACT'
            or rowdata->'financials'->>'currency' is distinct from upper((select currency from public.businesses where id=p_business))
            or (rowdata->'financials'->>'amountPaidCents')::numeric is distinct from 0::numeric
            or (rowdata->'financials'->>'amountRefundedCents')::numeric is distinct from 0::numeric
            or (rowdata->'financials'->>'discountCents')::numeric is distinct from 0::numeric then
            raise exception 'FINANCIAL_RECONCILIATION_REQUIRED' using errcode='P7301'; end if;
        end if;
        select * into ref from public.data_import_entity_refs where business_id=p_business and source_system=r.source_system
          and source_account_key=r.source_account_key and entity_type=expected.entity_type and source_external_id=(rowdata->>'sourceExternalId');
        if found then
          if ref.source_row_hash<>expected.source_row_hash then raise exception 'SOURCE_ID_CHANGED' using errcode='P7301'; end if;
          if expected.target_entity_id is not null and ref.chasum_entity_id<>expected.target_entity_id then
            raise exception 'IDENTITY_CONFLICT' using errcode='P7301'; end if;
          target:=public.data_import_resolve(p_business,p_run,expected.entity_type,jsonb_build_object('existingId',ref.chasum_entity_id));
          update public.data_import_entity_refs set last_import_run_id=p_run,updated_at=clock_timestamp() where id=ref.id;
          result:='LINKED';
        elsif action='LINK_EXISTING' then
          target:=public.data_import_resolve(p_business,p_run,expected.entity_type,jsonb_build_object('existingId',expected.target_entity_id));
          result:='LINKED';
        end if;
        if expected.entity_type='customer' then
          if rowdata->>'email' is null or rowdata->>'email'<>lower(btrim(rowdata->>'email'))
            or rowdata->>'email' !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
            raise exception 'CUSTOMER_EMAIL_UNSUPPORTED' using errcode='P7301'; end if;
          if result is null then
            select count(*) into matches from public.customers where business_id=p_business and lower(btrim(email))=rowdata->>'email';
            if matches>1 then raise exception 'AMBIGUOUS_MATCH' using errcode='P7301'; end if;
            if matches=1 then
              select id into target from public.customers where business_id=p_business and lower(btrim(email))=rowdata->>'email';
              result:='LINKED';
            end if;
          end if;
        end if;
        if expected.entity_type='customer' and result='LINKED' then
          select * into v_customer from public.customers where id=target;
          select count(*) into matches from public.customers where business_id=p_business and lower(btrim(email))=rowdata->>'email';
          if rowdata->>'email' is null or lower(btrim(v_customer.email)) is distinct from rowdata->>'email' or matches<>1
            or v_customer.name is distinct from rowdata->>'name' or (v_customer.phone is not null and rowdata->>'phone' is not null and v_customer.phone<>rowdata->>'phone') then
            raise exception 'IDENTITY_CONFLICT' using errcode='P7301'; end if;
        end if;
        if result is null then
          target:=public.data_import_write_row(p_business,p_run,rowdata,item->>'mappedStatus');
          result:='CREATED';
        end if;
        if result='LINKED' then status:='DUPLICATE_EXISTING'; action:='LINK_EXISTING'; end if;
        if (rowdata->>'sourceExternalId') is not null and expected.entity_type in ('location','service','staff','customer','appointment')
          and ref.id is null then
          insert into public.data_import_entity_refs(business_id,source_system,source_account_key,entity_type,source_external_id,
            source_row_hash,chasum_entity_id,first_import_run_id,last_import_run_id)
            values(p_business,r.source_system,r.source_account_key,expected.entity_type,(rowdata->>'sourceExternalId'),
              expected.source_row_hash,target,p_run,p_run);
        end if;
      end if;
    exception
      when sqlstate 'P7302' then
        result:='SKIPPED'; target:=null; status:='DUPLICATE_EXISTING'; action:='SKIP'; reasons:=array['ASSIGNMENT_EXISTS'];
      when sqlstate 'P7301' then
        get stacked diagnostics message=message_text;
        result:='BLOCKED'; target:=null; status:='WARNING'; action:='REVIEW'; reasons:=array[message];
      when exclusion_violation then
        get stacked diagnostics constraint_name=constraint_name;
        if constraint_name<>'appointments_staff_no_overlap' then raise; end if;
        result:='BLOCKED'; target:=null; status:='WARNING'; action:='REVIEW'; reasons:=array['APPOINTMENT_OVERLAP'];
      when unique_violation then
        get stacked diagnostics constraint_name=constraint_name;
        if constraint_name not in ('locations_business_id_slug_key','customers_business_id_email_key') then raise; end if;
        result:='BLOCKED'; target:=null; status:='WARNING'; action:='REVIEW'; reasons:=array['IDENTITY_CONFLICT'];
      when raise_exception then
        get stacked diagnostics message=message_text;
        if message <> 'STAFF_LIMIT_REACHED' and message not like 'LOCATION_LIMIT_REACHED:%' then raise; end if;
        result:='BLOCKED'; target:=null; status:='WARNING'; action:='REVIEW'; reasons:=array['INVALID_ROW'];
    end;
    insert into public.data_import_row_outcomes(import_run_id,phase,entity_type,source_row_key,source_row_hash,
      status,planned_action,reason_codes,target_entity_id,operational_hash,row_ordinal,commit_result)
      values(p_run,'commit',expected.entity_type,expected.source_row_key,expected.source_row_hash,
      status,action,reasons,target,expected.operational_hash,expected.row_ordinal,result) returning * into prior;
    returned:=returned||jsonb_build_array(to_jsonb(prior));
  end loop;
  t:=clock_timestamp();
  update public.data_import_runs set heartbeat_at=t,lease_expires_at=t+interval '2 minutes' where id=p_run;
  return returned;
end $$;

-- Empty batch is an explicit heartbeat. No timers or background job engine.
create function public.finish_data_import_run(p_business uuid,p_actor uuid,p_run uuid,p_token uuid,p_abort boolean default false) returns text
language plpgsql security definer set search_path=pg_catalog,pg_temp as $$
declare r public.data_import_runs; expected bigint; actual bigint; blocked bigint; terminal text;
begin
  r:=public.data_import_lock_run(p_business,p_actor,p_run);
  perform public.data_import_require_lease(r,p_token);
  select count(*) into expected from public.data_import_row_outcomes where import_run_id=p_run and phase='preview';
  select count(*),count(*) filter(where commit_result='BLOCKED') into actual,blocked
    from public.data_import_row_outcomes where import_run_id=p_run and phase='commit';
  if p_abort then terminal:='failed';
  elsif actual<>expected then raise exception 'IMPORT_INCOMPLETE';
  elsif blocked=0 then terminal:='completed';
  elsif blocked=actual then terminal:='failed';
  else terminal:='completed_with_errors'; end if;
  update public.data_import_runs set state=terminal,finished_at=clock_timestamp() where id=p_run;
  return terminal;
end $$;

-- Revoke inherited/default EXECUTE too, and fail closed if role membership drift
-- defeats effective privileges. B1 direct table write privileges remain absent.
do $$
declare f record; role_name text; allowed boolean;
begin
  for f in select oid,proname,oid::regprocedure signature from pg_proc where pronamespace='public'::regnamespace
    and proname in ('guard_service_commercial_readiness','data_import_digest','data_import_context','data_import_authorize',
      'get_data_import_context','prepare_data_import_run','data_import_lock_run','begin_data_import_commit',
      'data_import_require_lease','data_import_resolve','data_import_write_row','commit_data_import_batch','finish_data_import_run') loop
    execute format('revoke all on function %s from public,anon,authenticated,service_role',f.signature);
    allowed:=f.proname in ('get_data_import_context','prepare_data_import_run','begin_data_import_commit','commit_data_import_batch','finish_data_import_run');
    if allowed then execute format('grant execute on function %s to service_role',f.signature); end if;
    foreach role_name in array array['anon','authenticated','service_role'] loop
      if has_function_privilege(role_name,f.oid,'EXECUTE') is distinct from (allowed and role_name='service_role') then
        raise exception 'Unexpected effective B2 function privilege'; end if;
    end loop;
  end loop;
end $$;
