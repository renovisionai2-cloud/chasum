\set ON_ERROR_STOP on
begin;

-- Issue #81 Stage 1B disposable-Postgres contract.
-- Run only after the Stage 1B migration has been applied to a disposable
-- database that mirrors the governed Production baseline (034-036 absent).

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

-- Deterministic disposable fixture UUIDs are inlined below.

-- Bypass auth.users FK only for disposable fixture bootstrap. Relationship
-- and tenant-key guards are tested below with triggers enabled.
set local session_replication_role = replica;
insert into public.businesses(id, owner_id, name, slug, timezone, appointment_interval_minutes, booking_limit_days)
values
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000101', 'Stage1B A', 'stage1b-a', 'UTC', 30, 60),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000102', 'Stage1B B', 'stage1b-b', 'UTC', 30, 60);
set local session_replication_role = origin;

insert into public.locations(id,business_id,name,slug,timezone,is_default,is_active)
values
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000201','A Primary','a-primary','UTC',true,true),
  ('00000000-0000-0000-0000-000000000302','00000000-0000-0000-0000-000000000201','A Secondary','a-secondary','UTC',false,true),
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000202','B Primary','b-primary','UTC',true,true);

insert into public.services(id,business_id,name,duration_minutes,price,location_id,is_active,online_booking,tax_rate_bps,deposit_cents,deposit_required)
values
  ('00000000-0000-0000-0000-000000000401','00000000-0000-0000-0000-000000000201','A Service',30,100.00,'00000000-0000-0000-0000-000000000301',true,true,1300,2000,true),
  ('00000000-0000-0000-0000-000000000402','00000000-0000-0000-0000-000000000202','B Service',30,50.00,'00000000-0000-0000-0000-000000000303',true,true,0,0,false);

insert into public.staff(id,business_id,name,location_id,is_active,accept_online_bookings)
values
  ('00000000-0000-0000-0000-000000000501','00000000-0000-0000-0000-000000000201','A Staff','00000000-0000-0000-0000-000000000301',true,true),
  ('00000000-0000-0000-0000-000000000502','00000000-0000-0000-0000-000000000202','B Staff','00000000-0000-0000-0000-000000000303',true,true);

-- Same-Business CRUD succeeds.
insert into public.service_locations(service_id,location_id) values ('00000000-0000-0000-0000-000000000401','00000000-0000-0000-0000-000000000302');
insert into public.staff_locations(staff_id,location_id) values ('00000000-0000-0000-0000-000000000501','00000000-0000-0000-0000-000000000302');
insert into public.staff_services(staff_id,service_id) values ('00000000-0000-0000-0000-000000000501','00000000-0000-0000-0000-000000000401');
insert into public.service_locations(service_id,location_id) values ('00000000-0000-0000-0000-000000000402','00000000-0000-0000-0000-000000000303');
insert into public.staff_locations(staff_id,location_id) values ('00000000-0000-0000-0000-000000000502','00000000-0000-0000-0000-000000000303');
insert into public.staff_services(staff_id,service_id) values ('00000000-0000-0000-0000-000000000502','00000000-0000-0000-0000-000000000402');
update public.services set online_booking=false where id='00000000-0000-0000-0000-000000000402';
update public.staff set accept_online_bookings=false where id='00000000-0000-0000-0000-000000000502';
update public.service_locations set is_primary=false where service_id='00000000-0000-0000-0000-000000000401' and location_id='00000000-0000-0000-0000-000000000302';
update public.staff_locations set is_primary=false where staff_id='00000000-0000-0000-0000-000000000501' and location_id='00000000-0000-0000-0000-000000000302';
update public.staff_services set price_override=99 where staff_id='00000000-0000-0000-0000-000000000501' and service_id='00000000-0000-0000-0000-000000000401';

-- Cross-Business INSERT / UPDATE fails even as postgres (BYPASSRLS).
select pg_temp.expect_failure(
  format('insert into public.service_locations(service_id,location_id) values (%L,%L)', '00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000303'),
  'same Business');
select pg_temp.expect_failure(
  format('update public.service_locations set location_id=%L where service_id=%L and location_id=%L', '00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000302'),
  'same Business');
select pg_temp.expect_failure(
  format('insert into public.staff_locations(staff_id,location_id) values (%L,%L)', '00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000303'),
  'same Business');
select pg_temp.expect_failure(
  format('update public.staff_locations set location_id=%L where staff_id=%L and location_id=%L', '00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000302'),
  'same Business');
select pg_temp.expect_failure(
  format('insert into public.staff_services(staff_id,service_id) values (%L,%L)', '00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000402'),
  'same Business');
select pg_temp.expect_failure(
  format('update public.staff_services set service_id=%L where staff_id=%L and service_id=%L', '00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000401'),
  'same Business');

-- Tenant keys are immutable.
select pg_temp.expect_failure(format('update public.services set business_id=%L where id=%L', '00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000401'), 'immutable');
select pg_temp.expect_failure(format('update public.staff set business_id=%L where id=%L', '00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000501'), 'immutable');
select pg_temp.expect_failure(format('update public.locations set business_id=%L where id=%L', '00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000301'), 'immutable');

-- Exact least-privilege ACL posture on all three relationship tables.
do $$
declare
  t text;
begin
  foreach t in array array['service_locations','staff_locations','staff_services'] loop
    if has_table_privilege('PUBLIC','public.'||t,'SELECT')
       or has_table_privilege('PUBLIC','public.'||t,'INSERT')
       or has_table_privilege('PUBLIC','public.'||t,'UPDATE')
       or has_table_privilege('PUBLIC','public.'||t,'DELETE')
       or has_table_privilege('PUBLIC','public.'||t,'TRUNCATE')
       or has_table_privilege('PUBLIC','public.'||t,'REFERENCES')
       or has_table_privilege('PUBLIC','public.'||t,'TRIGGER')
       or has_table_privilege('PUBLIC','public.'||t,'MAINTAIN') then
      raise exception 'PUBLIC relationship privilege remains on %', t;
    end if;

    if not has_table_privilege('anon','public.'||t,'SELECT')
       or has_table_privilege('anon','public.'||t,'INSERT')
       or has_table_privilege('anon','public.'||t,'UPDATE')
       or has_table_privilege('anon','public.'||t,'DELETE')
       or has_table_privilege('anon','public.'||t,'TRUNCATE')
       or has_table_privilege('anon','public.'||t,'REFERENCES')
       or has_table_privilege('anon','public.'||t,'TRIGGER')
       or has_table_privilege('anon','public.'||t,'MAINTAIN') then
      raise exception 'anon ACL posture incorrect on %', t;
    end if;

    if not has_table_privilege('authenticated','public.'||t,'SELECT')
       or not has_table_privilege('authenticated','public.'||t,'INSERT')
       or not has_table_privilege('authenticated','public.'||t,'UPDATE')
       or not has_table_privilege('authenticated','public.'||t,'DELETE')
       or has_table_privilege('authenticated','public.'||t,'TRUNCATE')
       or has_table_privilege('authenticated','public.'||t,'REFERENCES')
       or has_table_privilege('authenticated','public.'||t,'TRIGGER')
       or has_table_privilege('authenticated','public.'||t,'MAINTAIN') then
      raise exception 'authenticated ACL posture incorrect on %', t;
    end if;

    if not has_table_privilege('service_role','public.'||t,'SELECT')
       or not has_table_privilege('service_role','public.'||t,'INSERT')
       or not has_table_privilege('service_role','public.'||t,'UPDATE')
       or not has_table_privilege('service_role','public.'||t,'DELETE')
       or has_table_privilege('service_role','public.'||t,'TRUNCATE')
       or has_table_privilege('service_role','public.'||t,'REFERENCES')
       or has_table_privilege('service_role','public.'||t,'TRIGGER')
       or has_table_privilege('service_role','public.'||t,'MAINTAIN') then
      raise exception 'service_role ACL posture incorrect on %', t;
    end if;
  end loop;
end $$;

-- Exact governed trigger presence.
do $$
begin
  if (select count(*) from pg_trigger where not tgisinternal and tgname in (
    'service_locations_same_business',
    'staff_locations_same_business',
    'staff_services_same_business',
    'services_business_id_immutable',
    'staff_business_id_immutable',
    'locations_business_id_immutable'
  )) <> 6 then
    raise exception 'Stage 1B trigger set is incomplete';
  end if;
end $$;

-- Exact governed policy names/commands/roles.
do $$
begin
  if (select count(*) from pg_policies
      where schemaname='public'
        and (
          (tablename='service_locations' and policyname in ('Owners manage service locations','Public can view bookable service locations'))
          or (tablename='staff_locations' and policyname in ('Owners manage staff locations','Public can view active staff locations'))
          or (tablename='staff_services' and policyname in ('Owners manage staff services','Public can view bookable staff services'))
        )) <> 6 then
    raise exception 'Stage 1B relationship policy set is incomplete';
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname='public'
      and tablename in ('service_locations','staff_locations','staff_services')
      and policyname like 'Owners manage %'
      and not (cmd='ALL' and roles='{authenticated}'::name[])
  ) then
    raise exception 'owner relationship policy role/command drift';
  end if;
end $$;

-- Trigger helpers cannot be invoked directly by API roles.
do $$
begin
  if has_function_privilege('anon','public.assert_same_business_relationship()','EXECUTE')
     or has_function_privilege('authenticated','public.assert_same_business_relationship()','EXECUTE')
     or has_function_privilege('service_role','public.assert_same_business_relationship()','EXECUTE') then
    raise exception 'relationship helper EXECUTE leaked';
  end if;
end $$;

-- Governed RPCs have no PUBLIC execute and intended explicit roles do.
do $$
declare
  f text;
begin
  foreach f in array array[
    'public.get_available_slots(uuid,uuid,uuid,date,uuid,uuid)',
    'public.validate_appointment_slot(uuid,uuid,uuid,timestamp with time zone,timestamp with time zone,uuid,uuid)',
    'public.book_public_appointment(uuid,uuid,uuid,uuid,text,text,timestamp with time zone,timestamp with time zone,text,text,integer,integer,integer,text)'
  ] loop
    if has_function_privilege('PUBLIC',f,'EXECUTE') then raise exception 'PUBLIC EXECUTE remains on %', f; end if;
    if not has_function_privilege('anon',f,'EXECUTE')
       or not has_function_privilege('authenticated',f,'EXECUTE')
       or not has_function_privilege('service_role',f,'EXECUTE') then
      raise exception 'intended EXECUTE missing on %', f;
    end if;
  end loop;
end $$;

-- Public-safe relationship reads expose active/bookable same-Business rows only.
set local role anon;
select set_config('request.jwt.claim.sub','',true);
do $$
begin
  if (select count(*) from public.service_locations where service_id='00000000-0000-0000-0000-000000000401') <> 1 then
    raise exception 'anon service_locations read mismatch';
  end if;
  if (select count(*) from public.staff_locations where staff_id='00000000-0000-0000-0000-000000000501') <> 1 then
    raise exception 'anon staff_locations read mismatch';
  end if;
  if (select count(*) from public.staff_services where staff_id='00000000-0000-0000-0000-000000000501') <> 1 then
    raise exception 'anon staff_services read mismatch';
  end if;
  if (select count(*) from public.service_locations where service_id='00000000-0000-0000-0000-000000000402') <> 0 then
    raise exception 'anon saw non-bookable service relationship';
  end if;
  if (select count(*) from public.staff_locations where staff_id='00000000-0000-0000-0000-000000000502') <> 0 then
    raise exception 'anon saw non-online staff-location relationship';
  end if;
  if (select count(*) from public.staff_services where staff_id='00000000-0000-0000-0000-000000000502') <> 0 then
    raise exception 'anon saw non-public staff-service relationship';
  end if;
end $$;
reset role;

-- Owner/admin relationship management remains functional under RLS.
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000101', true);
delete from public.staff_locations where staff_id='00000000-0000-0000-0000-000000000501' and location_id='00000000-0000-0000-0000-000000000302';
insert into public.staff_locations(staff_id,location_id) values ('00000000-0000-0000-0000-000000000501','00000000-0000-0000-0000-000000000302');
reset role;

-- Availability fixtures for tomorrow in UTC.
insert into public.location_hours(location_id,day_of_week,is_open,open_time,close_time)
values ('00000000-0000-0000-0000-000000000302', extract(dow from current_date + 1)::int, true, '09:00','17:00')
on conflict (location_id,day_of_week) do update set is_open=true,open_time='09:00',close_time='17:00';
insert into public.staff_working_hours(staff_id,day_of_week,is_working,start_time,end_time)
values ('00000000-0000-0000-0000-000000000501', extract(dow from current_date + 1)::int, true, '09:00','17:00')
on conflict (staff_id,day_of_week) do update set is_working=true,start_time='09:00',end_time='17:00';

-- Legitimate secondary Service + secondary Staff produces slots.
do $$
declare n int;
begin
  select count(*) into n
  from public.get_available_slots('00000000-0000-0000-0000-000000000201','00000000-0000-0000-0000-000000000401','00000000-0000-0000-0000-000000000501',current_date+1,null,'00000000-0000-0000-0000-000000000302');
  if n < 1 then raise exception 'secondary relationship combination produced no slots'; end if;
end $$;

-- Each missing relationship fails closed.
delete from public.service_locations where service_id='00000000-0000-0000-0000-000000000401' and location_id='00000000-0000-0000-0000-000000000302';
select pg_temp.expect_failure(
  format('select public.validate_appointment_slot(%L,%L,%L,(current_date+1+time ''10:00'')::timestamptz,(current_date+1+time ''10:30'')::timestamptz,null,%L)',
         '00000000-0000-0000-0000-000000000201','00000000-0000-0000-0000-000000000401','00000000-0000-0000-0000-000000000501','00000000-0000-0000-0000-000000000302'),
  'not offered at the selected location');
insert into public.service_locations(service_id,location_id) values ('00000000-0000-0000-0000-000000000401','00000000-0000-0000-0000-000000000302');

delete from public.staff_locations where staff_id='00000000-0000-0000-0000-000000000501' and location_id='00000000-0000-0000-0000-000000000302';
select pg_temp.expect_failure(
  format('select public.validate_appointment_slot(%L,%L,%L,(current_date+1+time ''10:00'')::timestamptz,(current_date+1+time ''10:30'')::timestamptz,null,%L)',
         '00000000-0000-0000-0000-000000000201','00000000-0000-0000-0000-000000000401','00000000-0000-0000-0000-000000000501','00000000-0000-0000-0000-000000000302'),
  'does not work at the selected location');
insert into public.staff_locations(staff_id,location_id) values ('00000000-0000-0000-0000-000000000501','00000000-0000-0000-0000-000000000302');

delete from public.staff_services where staff_id='00000000-0000-0000-0000-000000000501' and service_id='00000000-0000-0000-0000-000000000401';
select pg_temp.expect_failure(
  format('select public.validate_appointment_slot(%L,%L,%L,(current_date+1+time ''10:00'')::timestamptz,(current_date+1+time ''10:30'')::timestamptz,null,%L)',
         '00000000-0000-0000-0000-000000000201','00000000-0000-0000-0000-000000000401','00000000-0000-0000-0000-000000000501','00000000-0000-0000-0000-000000000302'),
  'does not offer this service');
insert into public.staff_services(staff_id,service_id) values ('00000000-0000-0000-0000-000000000501','00000000-0000-0000-0000-000000000401');

-- Final writer rejects relationship failure before Customer mutation.
delete from public.staff_locations where staff_id='00000000-0000-0000-0000-000000000501' and location_id='00000000-0000-0000-0000-000000000302';
do $$
declare before_count bigint; after_count bigint;
begin
  select count(*) into before_count from public.customers where business_id='00000000-0000-0000-0000-000000000201' and email='stage1b-invalid@example.test';
  begin
    perform public.book_public_appointment(
      '00000000-0000-0000-0000-000000000201','00000000-0000-0000-0000-000000000302','00000000-0000-0000-0000-000000000401','00000000-0000-0000-0000-000000000501',
      'Invalid Relationship','stage1b-invalid@example.test',
      (current_date+1+time '10:00')::timestamptz,
      (current_date+1+time '10:30')::timestamptz,
      'confirmed',null,0,0,0,null
    );
    raise exception 'expected relationship rejection';
  exception when others then
    if position('does not work at the selected location' in sqlerrm)=0 then raise; end if;
  end;
  select count(*) into after_count from public.customers where business_id='00000000-0000-0000-0000-000000000201' and email='stage1b-invalid@example.test';
  if after_count <> before_count then raise exception 'customer mutated before relationship rejection'; end if;
end $$;
insert into public.staff_locations(staff_id,location_id) values ('00000000-0000-0000-0000-000000000501','00000000-0000-0000-0000-000000000302');

-- Valid secondary named-Staff public booking reaches normal write path and
-- preserves catalog financial/status behavior.
do $$
declare appt uuid; r record;
begin
  appt := public.book_public_appointment(
    '00000000-0000-0000-0000-000000000201','00000000-0000-0000-0000-000000000302','00000000-0000-0000-0000-000000000401','00000000-0000-0000-0000-000000000501',
    'Valid Secondary','stage1b-valid@example.test',
    (current_date+1+time '10:00')::timestamptz,
    (current_date+1+time '10:30')::timestamptz,
    'confirmed',null,1,1,1,'stage1b'
  );
  select * into r from public.appointments where id=appt;
  if r.staff_id <> '00000000-0000-0000-0000-000000000501'::uuid or r.location_id <> '00000000-0000-0000-0000-000000000302'::uuid then
    raise exception 'secondary booking relationship stamps incorrect';
  end if;
  if r.status::text <> 'confirmed' then raise exception 'appointment status changed'; end if;
  if r.price_cents <> 10000 or r.tax_cents <> 1300 or r.deposit_cents <> 2000 then
    raise exception 'financial regression: %, %, %', r.price_cents, r.tax_cents, r.deposit_cents;
  end if;
  if r.payment_status <> 'deposit_required' then raise exception 'deposit status regression'; end if;
end $$;

rollback;
