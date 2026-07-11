-- Chasum Phase 4: Core Scheduling Engine
-- Run after 004_phase3_integrations.sql

-- ---------------------------------------------------------------------------
-- Prevent double-booking at the database level
-- ---------------------------------------------------------------------------

create extension if not exists btree_gist;

alter table appointments
  drop constraint if exists appointments_staff_no_overlap;

alter table appointments
  add constraint appointments_staff_no_overlap
  exclude using gist (
    staff_id with =,
    tstzrange(start_time, end_time, '[)') with &&
  )
  where (status not in ('cancelled'));

-- ---------------------------------------------------------------------------
-- Seed default staff working hours on insert
-- ---------------------------------------------------------------------------

create or replace function seed_staff_working_hours()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into staff_working_hours (staff_id, day_of_week, is_working, start_time, end_time)
  select
    new.id,
    d,
    d between 1 and 5,
    '09:00'::time,
    '17:00'::time
  from generate_series(0, 6) as d
  on conflict (staff_id, day_of_week) do nothing;

  return new;
end;
$$;

drop trigger if exists staff_seed_working_hours on staff;

create trigger staff_seed_working_hours
  after insert on staff
  for each row
  execute function seed_staff_working_hours();

-- Backfill staff without working hours
insert into staff_working_hours (staff_id, day_of_week, is_working, start_time, end_time)
select
  s.id,
  d,
  d between 1 and 5,
  '09:00'::time,
  '17:00'::time
from staff s
cross join generate_series(0, 6) as d
where not exists (
  select 1 from staff_working_hours swh where swh.staff_id = s.id
)
on conflict (staff_id, day_of_week) do nothing;

-- ---------------------------------------------------------------------------
-- Scheduling helpers
-- ---------------------------------------------------------------------------

create or replace function is_business_holiday(
  p_business_id uuid,
  p_date date
)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from holidays h
    where h.business_id = p_business_id
      and (
        h.date = p_date
        or (
          h.is_recurring
          and extract(month from h.date) = extract(month from p_date)
          and extract(day from h.date) = extract(day from p_date)
        )
      )
  );
$$;

create or replace function is_staff_on_vacation(
  p_staff_id uuid,
  p_date date
)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from staff_vacations sv
    where sv.staff_id = p_staff_id
      and p_date between sv.start_date and sv.end_date
  );
$$;

create or replace function slot_is_blocked(
  p_business_id uuid,
  p_staff_id uuid,
  p_block_start timestamptz,
  p_block_end timestamptz,
  p_exclude_appointment_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1
      from availability av
      where av.business_id = p_business_id
        and av.is_available = false
        and (av.staff_id is null or av.staff_id = p_staff_id)
        and av.start_time < p_block_end
        and av.end_time > p_block_start
    )
    or exists (
      select 1
      from appointments a
      join services s on s.id = a.service_id
      where a.business_id = p_business_id
        and a.staff_id = p_staff_id
        and a.status not in ('cancelled')
        and (p_exclude_appointment_id is null or a.id <> p_exclude_appointment_id)
        and (
          a.start_time - make_interval(mins => coalesce(s.buffer_before_minutes, 0))
        ) < p_block_end
        and (
          a.end_time + make_interval(mins => coalesce(s.buffer_after_minutes, 0))
        ) > p_block_start
    )
    or exists (
      select 1
      from external_events ee
      join calendar_connections cc on cc.id = ee.calendar_connection_id
      where cc.business_id = p_business_id
        and cc.staff_id = p_staff_id
        and ee.is_busy = true
        and ee.start_time < p_block_end
        and ee.end_time > p_block_start
    );
$$;

create or replace function get_available_slots(
  p_business_id uuid,
  p_service_id uuid,
  p_staff_id uuid,
  p_date date,
  p_exclude_appointment_id uuid default null
)
returns setof timestamptz
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_tz text;
  v_interval integer;
  v_limit_days integer;
  v_max_daily integer;
  v_duration integer;
  v_buf_before integer;
  v_buf_after integer;
  v_dow integer;
  v_biz_open time;
  v_biz_close time;
  v_biz_is_open boolean;
  v_staff_working boolean;
  v_staff_start time;
  v_staff_end time;
  v_window_start timestamptz;
  v_window_end timestamptz;
  v_slot timestamptz;
  v_slot_end timestamptz;
  v_block_start timestamptz;
  v_block_end timestamptz;
  v_now timestamptz := now();
  v_today date;
  v_daily_count integer;
begin
  select
    b.timezone,
    b.appointment_interval_minutes,
    b.booking_limit_days,
    b.max_daily_bookings
  into v_tz, v_interval, v_limit_days, v_max_daily
  from businesses b
  where b.id = p_business_id;

  if not found then
    return;
  end if;

  v_today := (v_now at time zone v_tz)::date;

  if p_date < v_today or p_date > v_today + v_limit_days then
    return;
  end if;

  if is_business_holiday(p_business_id, p_date) then
    return;
  end if;

  if is_staff_on_vacation(p_staff_id, p_date) then
    return;
  end if;

  select
    s.duration_minutes,
    s.buffer_before_minutes,
    s.buffer_after_minutes
  into v_duration, v_buf_before, v_buf_after
  from services s
  where s.id = p_service_id
    and s.business_id = p_business_id
    and s.is_active = true;

  if not found then
    return;
  end if;

  if not exists (
    select 1
    from staff st
    where st.id = p_staff_id
      and st.business_id = p_business_id
      and st.is_active = true
  ) then
    return;
  end if;

  if not exists (
    select 1
    from staff_services ss
    where ss.staff_id = p_staff_id
      and ss.service_id = p_service_id
  ) then
    return;
  end if;

  v_dow := extract(dow from p_date)::integer;

  select bh.is_open, bh.open_time, bh.close_time
  into v_biz_is_open, v_biz_open, v_biz_close
  from business_hours bh
  where bh.business_id = p_business_id
    and bh.day_of_week = v_dow;

  if not coalesce(v_biz_is_open, false) then
    return;
  end if;

  select swh.is_working, swh.start_time, swh.end_time
  into v_staff_working, v_staff_start, v_staff_end
  from staff_working_hours swh
  where swh.staff_id = p_staff_id
    and swh.day_of_week = v_dow;

  if found then
    if not v_staff_working then
      return;
    end if;

    v_biz_open := greatest(v_biz_open, v_staff_start);
    v_biz_close := least(v_biz_close, v_staff_end);

    if v_biz_open >= v_biz_close then
      return;
    end if;
  end if;

  v_window_start := (p_date + v_biz_open)::timestamp at time zone v_tz;
  v_window_end := (p_date + v_biz_close)::timestamp at time zone v_tz;

  if v_max_daily is not null then
    select count(*)
    into v_daily_count
    from appointments a
    where a.business_id = p_business_id
      and a.status not in ('cancelled')
      and (a.start_time at time zone v_tz)::date = p_date
      and (p_exclude_appointment_id is null or a.id <> p_exclude_appointment_id);

    if v_daily_count >= v_max_daily then
      return;
    end if;
  end if;

  v_slot := v_window_start;

  while v_slot + make_interval(mins => v_duration) <= v_window_end loop
    v_slot_end := v_slot + make_interval(mins => v_duration);
    v_block_start := v_slot - make_interval(mins => v_buf_before);
    v_block_end := v_slot_end + make_interval(mins => v_buf_after);

    if v_slot > v_now
      and not slot_is_blocked(
        p_business_id,
        p_staff_id,
        v_block_start,
        v_block_end,
        p_exclude_appointment_id
      ) then
      return next v_slot;
    end if;

    v_slot := v_slot + make_interval(mins => v_interval);
  end loop;
end;
$$;

create or replace function validate_appointment_slot(
  p_business_id uuid,
  p_service_id uuid,
  p_staff_id uuid,
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_exclude_appointment_id uuid default null
)
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_tz text;
  v_limit_days integer;
  v_max_daily integer;
  v_buf_before integer;
  v_buf_after integer;
  v_date date;
  v_today date;
  v_daily_count integer;
  v_block_start timestamptz;
  v_block_end timestamptz;
begin
  if p_end_time <= p_start_time then
    raise exception 'Invalid appointment time range';
  end if;

  if p_start_time <= now() then
    raise exception 'Appointment must be in the future';
  end if;

  select b.timezone, b.booking_limit_days, b.max_daily_bookings
  into v_tz, v_limit_days, v_max_daily
  from businesses b
  where b.id = p_business_id;

  if not found then
    raise exception 'Business not found';
  end if;

  if not exists (
    select 1
    from services s
    where s.id = p_service_id
      and s.business_id = p_business_id
      and s.is_active = true
  ) then
    raise exception 'Service not available';
  end if;

  if not exists (
    select 1
    from staff st
    where st.id = p_staff_id
      and st.business_id = p_business_id
      and st.is_active = true
  ) then
    raise exception 'Staff not available';
  end if;

  if not exists (
    select 1
    from staff_services ss
    where ss.staff_id = p_staff_id
      and ss.service_id = p_service_id
  ) then
    raise exception 'Staff member does not offer this service';
  end if;

  select s.buffer_before_minutes, s.buffer_after_minutes
  into v_buf_before, v_buf_after
  from services s
  where s.id = p_service_id;

  v_date := (p_start_time at time zone v_tz)::date;
  v_today := (now() at time zone v_tz)::date;

  if v_date < v_today or v_date > v_today + v_limit_days then
    raise exception 'Date is outside the booking window';
  end if;

  if is_business_holiday(p_business_id, v_date) then
    raise exception 'Business is closed on this date';
  end if;

  if is_staff_on_vacation(p_staff_id, v_date) then
    raise exception 'Staff member is unavailable on this date';
  end if;

  if p_exclude_appointment_id is null and v_max_daily is not null then
    select count(*)
    into v_daily_count
    from appointments a
    where a.business_id = p_business_id
      and a.status not in ('cancelled')
      and (a.start_time at time zone v_tz)::date = v_date;

    if v_daily_count >= v_max_daily then
      raise exception 'Daily booking limit reached';
    end if;
  end if;

  if not exists (
    select 1
    from get_available_slots(
      p_business_id,
      p_service_id,
      p_staff_id,
      v_date,
      p_exclude_appointment_id
    ) slot
    where slot = p_start_time
  ) then
    raise exception 'Time slot not available';
  end if;

  v_block_start := p_start_time - make_interval(mins => coalesce(v_buf_before, 0));
  v_block_end := p_end_time + make_interval(mins => coalesce(v_buf_after, 0));

  if slot_is_blocked(
    p_business_id,
    p_staff_id,
    v_block_start,
    v_block_end,
    p_exclude_appointment_id
  ) then
    raise exception 'Time slot no longer available';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Harden public appointment creation
-- ---------------------------------------------------------------------------

create or replace function create_public_appointment(
  p_business_id uuid,
  p_service_id uuid,
  p_staff_id uuid,
  p_customer_id uuid,
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not exists (
    select 1 from customers
    where id = p_customer_id
      and business_id = p_business_id
  ) then
    raise exception 'Customer not found';
  end if;

  perform validate_appointment_slot(
    p_business_id,
    p_service_id,
    p_staff_id,
    p_start_time,
    p_end_time
  );

  insert into appointments (
    business_id,
    service_id,
    staff_id,
    customer_id,
    start_time,
    end_time,
    status,
    notes
  )
  values (
    p_business_id,
    p_service_id,
    p_staff_id,
    p_customer_id,
    p_start_time,
    p_end_time,
    'confirmed',
    p_notes
  )
  returning id into v_id;

  return v_id;
exception
  when exclusion_violation then
    raise exception 'Time slot no longer available';
end;
$$;

grant execute on function is_business_holiday(uuid, date) to anon, authenticated;
grant execute on function is_staff_on_vacation(uuid, date) to anon, authenticated;
grant execute on function slot_is_blocked(uuid, uuid, timestamptz, timestamptz, uuid) to anon, authenticated;
grant execute on function get_available_slots(uuid, uuid, uuid, date, uuid) to anon, authenticated;
grant execute on function validate_appointment_slot(uuid, uuid, uuid, timestamptz, timestamptz, uuid) to anon, authenticated;
