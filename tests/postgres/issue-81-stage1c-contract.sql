\set ON_ERROR_STOP on
begin;

create or replace function pg_temp.expect_failure(p_sql text, p_contains text)
returns void language plpgsql as $$
begin
  begin
    execute p_sql;
    raise exception 'expected failure but statement succeeded: %', p_sql;
  exception when others then
    if sqlerrm like 'expected failure%' then raise; end if;
    if position(lower(p_contains) in lower(sqlerrm)) = 0 then
      raise exception 'wrong failure. expected %, got %', p_contains, sqlerrm;
    end if;
  end;
end $$;

-- Fixture owners/businesses. Use enterprise for workflow fixtures so quota
-- tests can be isolated to dedicated plan fixtures below.
set local session_replication_role = replica;
insert into public.businesses(
  id, owner_id, name, slug, timezone, appointment_interval_minutes,
  booking_limit_days, max_daily_bookings, cancellation_policy,
  min_notice_minutes, subscription_plan_key, private_alpha_enabled
) values
  ('10000000-0000-0000-0000-000000000201','10000000-0000-0000-0000-000000000101','Stage1C A','stage1c-a','UTC',20,90,18,'24 hours',45,'enterprise',false),
  ('10000000-0000-0000-0000-000000000202','10000000-0000-0000-0000-000000000102','Stage1C B','stage1c-b','UTC',30,60,null,null,0,'enterprise',false),
  ('10000000-0000-0000-0000-000000000203','10000000-0000-0000-0000-000000000103','Starter Alpha','stage1c-starter-alpha','UTC',30,60,null,null,0,'starter',true),
  ('10000000-0000-0000-0000-000000000204','10000000-0000-0000-0000-000000000104','Business Limit','stage1c-business-limit','UTC',30,60,null,null,0,'business',false);
set local session_replication_role = origin;

insert into public.locations(id,business_id,name,slug,timezone,is_default,is_active)
values
  ('10000000-0000-0000-0000-000000000301','10000000-0000-0000-0000-000000000201','A Default','a-default','UTC',true,true),
  ('10000000-0000-0000-0000-000000000302','10000000-0000-0000-0000-000000000202','B Default','b-default','UTC',true,true),
  ('10000000-0000-0000-0000-000000000303','10000000-0000-0000-0000-000000000203','Starter Existing','starter-existing','UTC',true,true);

insert into public.location_settings(
  location_id, appointment_interval_minutes, booking_limit_days,
  max_daily_bookings, cancellation_policy, min_booking_notice_minutes,
  default_travel_minutes, timezone, metadata
) values
  ('10000000-0000-0000-0000-000000000301',15,120,12,'Source cancellation',90,25,'America/Toronto','{"private":"do-not-copy"}'::jsonb),
  ('10000000-0000-0000-0000-000000000302',30,60,null,null,0,0,'UTC','{}'::jsonb),
  ('10000000-0000-0000-0000-000000000303',30,60,null,null,0,0,'UTC','{}'::jsonb);

insert into public.location_hours(location_id,day_of_week,is_open,open_time,close_time)
select '10000000-0000-0000-0000-000000000301', d, d between 1 and 5,
       case when d=2 then time '08:00' else time '09:00' end,
       case when d=2 then time '19:00' else time '17:00' end
from generate_series(0,6) d;
insert into public.location_hours(location_id,day_of_week,is_open,open_time,close_time)
select '10000000-0000-0000-0000-000000000302', d, d between 1 and 5, time '09:00', time '17:00'
from generate_series(0,6) d;
insert into public.location_hours(location_id,day_of_week,is_open,open_time,close_time)
select '10000000-0000-0000-0000-000000000303', d, d between 1 and 5, time '09:00', time '17:00'
from generate_series(0,6) d;

insert into public.location_hour_segments(location_id,day_of_week,open_time,close_time,sort_order)
values
  ('10000000-0000-0000-0000-000000000301',2,'08:00','12:00',0),
  ('10000000-0000-0000-0000-000000000301',2,'13:00','19:00',1);

insert into public.services(id,business_id,name,duration_minutes,price,location_id,is_active,online_booking)
values
  ('10000000-0000-0000-0000-000000000401','10000000-0000-0000-0000-000000000201','Primary Active',30,100,'10000000-0000-0000-0000-000000000301',true,true),
  ('10000000-0000-0000-0000-000000000402','10000000-0000-0000-0000-000000000201','Mapped Active',30,80,'10000000-0000-0000-0000-000000000301',true,true),
  ('10000000-0000-0000-0000-000000000403','10000000-0000-0000-0000-000000000201','Inactive',30,50,'10000000-0000-0000-0000-000000000301',false,true);

insert into public.service_locations(service_id,location_id,is_primary)
values
  ('10000000-0000-0000-0000-000000000401','10000000-0000-0000-0000-000000000301',true),
  ('10000000-0000-0000-0000-000000000402','10000000-0000-0000-0000-000000000301',false),
  ('10000000-0000-0000-0000-000000000403','10000000-0000-0000-0000-000000000301',true);

insert into public.staff(id,business_id,name,location_id,is_active,accept_online_bookings)
values ('10000000-0000-0000-0000-000000000501','10000000-0000-0000-0000-000000000201','A Staff','10000000-0000-0000-0000-000000000301',true,true);
insert into public.staff_locations(staff_id,location_id,is_primary)
values ('10000000-0000-0000-0000-000000000501','10000000-0000-0000-0000-000000000301',true);

insert into public.booking_resources(id,business_id,location_id,resource_type,name,is_active)
values
 ('10000000-0000-0000-0000-000000000601','10000000-0000-0000-0000-000000000201','10000000-0000-0000-0000-000000000301','room','Source Room',true);

insert into public.business_closures(
  id,business_id,location_id,closure_type,name,starts_at,ends_at
) values (
  '10000000-0000-0000-0000-000000000701',
  '10000000-0000-0000-0000-000000000201',
  '10000000-0000-0000-0000-000000000301',
  'temporary','Do not copy',now()+interval '10 days',now()+interval '11 days'
);

-- Entitlement reconciliation and privilege posture.
do $$
begin
  if (select max_locations from public.subscription_plans where plan_key='business') <> 6 then
    raise exception 'Business location limit was not reconciled to 6';
  end if;
  if has_function_privilege('anon','public.can_add_location(uuid)','EXECUTE')
     or has_function_privilege('anon','public.create_location_from_template(uuid,text,text,text,text,text,text,text,text,text,text,uuid)','EXECUTE')
     or has_function_privilege('service_role','public.create_location_from_template(uuid,text,text,text,text,text,text,text,text,text,text,uuid)','EXECUTE') then
    raise exception 'Stage 1C function EXECUTE leaked';
  end if;
  if not has_function_privilege('authenticated','public.can_add_location(uuid)','EXECUTE')
     or not has_function_privilege('authenticated','public.create_location_from_template(uuid,text,text,text,text,text,text,text,text,text,text,uuid)','EXECUTE') then
    raise exception 'authenticated Stage 1C EXECUTE missing';
  end if;
  if has_function_privilege('authenticated','public.enforce_location_quota()','EXECUTE')
     or has_function_privilege('service_role','public.enforce_location_quota()','EXECUTE') then
    raise exception 'quota trigger helper EXECUTE leaked';
  end if;
end $$;

-- Starter + Private Alpha does NOT bypass the billed/product plan cap.
do $$
begin
  if public.can_add_location('10000000-0000-0000-0000-000000000203') then
    raise exception 'Private Alpha bypassed Starter location cap';
  end if;
end $$;

-- Default-location template copy as authenticated owner.
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000101',true);
select set_config(
  'stage1c.default_created',
  (public.create_location_from_template(
    '10000000-0000-0000-0000-000000000201',
    'Copied Default','copied-default','America/Vancouver',
    '1 New St',null,'New City','BC','A1A1A1',null,
    'default',null
  )->>'location_id'),
  true
);
reset role;

do $$
declare
  new_id uuid := current_setting('stage1c.default_created')::uuid;
  source_settings record;
  new_settings record;
begin
  select * into source_settings from public.location_settings where location_id='10000000-0000-0000-0000-000000000301';
  select * into new_settings from public.location_settings where location_id=new_id;

  if new_settings.appointment_interval_minutes <> source_settings.appointment_interval_minutes
     or new_settings.booking_limit_days <> source_settings.booking_limit_days
     or new_settings.max_daily_bookings is distinct from source_settings.max_daily_bookings
     or new_settings.cancellation_policy is distinct from source_settings.cancellation_policy
     or new_settings.min_booking_notice_minutes <> source_settings.min_booking_notice_minutes
     or new_settings.default_travel_minutes <> source_settings.default_travel_minutes
     or new_settings.timezone is distinct from source_settings.timezone then
    raise exception 'source location settings were not copied exactly';
  end if;

  if new_settings.metadata <> '{}'::jsonb then
    raise exception 'opaque source metadata was copied';
  end if;

  if (select count(*) from public.location_hours where location_id=new_id) <> 7 then
    raise exception 'source hours were not copied';
  end if;
  if exists (
    select 1
    from public.location_hours n
    full join public.location_hours s
      on s.location_id='10000000-0000-0000-0000-000000000301'
     and n.day_of_week=s.day_of_week
    where n.location_id=new_id
      and (n.is_open,n.open_time,n.close_time) is distinct from (s.is_open,s.open_time,s.close_time)
  ) then
    raise exception 'copied hours differ from source';
  end if;

  if (select count(*) from public.location_hour_segments where location_id=new_id) <> 2 then
    raise exception 'split-hour segments were not copied';
  end if;

  if (select count(*) from public.service_locations where location_id=new_id) <> 2 then
    raise exception 'active source Service set was not copied';
  end if;
  if exists (
    select 1 from public.service_locations
    where location_id=new_id and service_id='10000000-0000-0000-0000-000000000403'
  ) then
    raise exception 'inactive Service was copied';
  end if;
  if (select count(*) from public.services where business_id='10000000-0000-0000-0000-000000000201') <> 3 then
    raise exception 'Service rows were duplicated';
  end if;

  if exists(select 1 from public.staff_locations where location_id=new_id) then
    raise exception 'Staff was copied automatically';
  end if;
  if exists(select 1 from public.booking_resources where location_id=new_id) then
    raise exception 'resources were copied automatically';
  end if;
  if exists(select 1 from public.business_closures where location_id=new_id) then
    raise exception 'closures/exceptions were copied';
  end if;
end $$;

-- Explicit copy must reject a source from another Business.
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000101',true);
select pg_temp.expect_failure(
  format(
    'select public.create_location_from_template(%L,%L,%L,%L,null,null,null,null,null,null,%L,%L)',
    '10000000-0000-0000-0000-000000000201','Cross tenant','cross-tenant','UTC',
    'copy','10000000-0000-0000-0000-000000000302'
  ),
  'Source location is unavailable'
);
reset role;

-- Start blank creates concrete safe scheduling rows with no invented availability.
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000101',true);
select set_config(
  'stage1c.blank_created',
  (public.create_location_from_template(
    '10000000-0000-0000-0000-000000000201',
    'Blank','blank','America/Toronto',
    null,null,null,null,null,null,
    'blank',null
  )->>'location_id'),
  true
);
reset role;

do $$
declare
  new_id uuid := current_setting('stage1c.blank_created')::uuid;
  s record;
begin
  select * into s from public.location_settings where location_id=new_id;
  if s.appointment_interval_minutes <> 20
     or s.booking_limit_days <> 90
     or s.max_daily_bookings <> 18
     or s.cancellation_policy <> '24 hours'
     or s.min_booking_notice_minutes <> 45
     or s.default_travel_minutes <> 0
     or s.timezone <> 'America/Toronto' then
    raise exception 'blank settings did not use Business defaults';
  end if;
  if (select count(*) from public.location_hours where location_id=new_id) <> 7
     or exists(select 1 from public.location_hours where location_id=new_id and is_open=true) then
    raise exception 'blank hours are not seven closed days';
  end if;
  if exists(select 1 from public.location_hour_segments where location_id=new_id)
     or exists(select 1 from public.service_locations where location_id=new_id)
     or exists(select 1 from public.staff_locations where location_id=new_id)
     or exists(select 1 from public.booking_resources where location_id=new_id) then
    raise exception 'blank mode copied operational relationships';
  end if;
end $$;

-- Quota trigger protects direct inserts and activation bypass.
-- Bootstrap six active Business-plan rows with triggers disabled to model an
-- existing-at-limit tenant, then prove every new active row is rejected.
set local session_replication_role = replica;
insert into public.locations(id,business_id,name,slug,timezone,is_active,is_default)
select
  ('20000000-0000-0000-0000-' || lpad(i::text,12,'0'))::uuid,
  '10000000-0000-0000-0000-000000000204',
  'Existing '||i,
  'existing-'||i,
  'UTC',true,i=1
from generate_series(1,6) i;
insert into public.locations(id,business_id,name,slug,timezone,is_active,is_default)
values ('20000000-0000-0000-0000-000000000099','10000000-0000-0000-0000-000000000204','Inactive','inactive','UTC',false,false);
set local session_replication_role = origin;

select pg_temp.expect_failure(
  'insert into public.locations(business_id,name,slug,timezone,is_active,is_default) values (''10000000-0000-0000-0000-000000000204'',''Seventh'',''seventh'',''UTC'',true,false)',
  'LOCATION_LIMIT_REACHED'
);
select pg_temp.expect_failure(
  'update public.locations set is_active=true where id=''20000000-0000-0000-0000-000000000099''',
  'LOCATION_LIMIT_REACHED'
);

-- A pre-existing over-limit tenant is not rewritten/deleted, but cannot add.
set local session_replication_role = replica;
insert into public.locations(id,business_id,name,slug,timezone,is_active,is_default)
values ('20000000-0000-0000-0000-000000000007','10000000-0000-0000-0000-000000000204','Grandfathered 7','grandfathered-7','UTC',true,false);
set local session_replication_role = origin;
do $$
begin
  if (select count(*) from public.locations where business_id='10000000-0000-0000-0000-000000000204' and is_active=true) <> 7 then
    raise exception 'existing over-limit rows were not preserved';
  end if;
  if public.can_add_location('10000000-0000-0000-0000-000000000204') then
    raise exception 'existing over-limit tenant can still add';
  end if;
end $$;

-- Failure after the Location INSERT must roll the whole RPC back. A slug
-- conflict occurs at the core insert and leaves no side rows.
do $$
declare before_count bigint;
begin
  select count(*) into before_count from public.locations where business_id='10000000-0000-0000-0000-000000000201';
  begin
    perform public.create_location_from_template(
      '10000000-0000-0000-0000-000000000201',
      'Duplicate slug','a-default','UTC',
      null,null,null,null,null,null,'blank',null
    );
    raise exception 'expected duplicate slug failure';
  exception when unique_violation then
    null;
  end;
  if (select count(*) from public.locations where business_id='10000000-0000-0000-0000-000000000201') <> before_count then
    raise exception 'failed create left a Location row';
  end if;
end $$;

-- Stage 1C does not introduce resource-aware booking or migrations 034-036.
do $$
begin
  if to_regclass('public.service_resource_requirements') is not null then
    raise exception 'locked resource requirement schema appeared';
  end if;
end $$;

rollback;
