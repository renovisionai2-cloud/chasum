-- Chasum Phase 5: Multi-Location Foundation
-- Run after 007_one_business_per_owner.sql

-- ---------------------------------------------------------------------------
-- Subscription plans (location limits from configuration, not hard-coded)
-- ---------------------------------------------------------------------------

create table if not exists subscription_plans (
  plan_key text primary key,
  name text not null,
  max_locations integer,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into subscription_plans (plan_key, name, max_locations, description)
values
  ('starter', 'Starter', 1, 'Single location'),
  ('professional', 'Professional', 3, 'Up to 3 locations'),
  ('business', 'Business', 10, 'Up to 10 locations'),
  ('enterprise', 'Enterprise', null, 'Unlimited locations')
on conflict (plan_key) do nothing;

alter table businesses
  add column if not exists subscription_plan_key text not null default 'starter'
    references subscription_plans (plan_key);

-- ---------------------------------------------------------------------------
-- Locations (extensible for departments, rooms, equipment via metadata)
-- ---------------------------------------------------------------------------

create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  name text not null,
  slug text not null,
  timezone text,
  is_default boolean not null default false,
  is_active boolean not null default true,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  phone text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, slug)
);

create index if not exists locations_business_id_idx on locations (business_id);

create table if not exists location_settings (
  location_id uuid primary key references locations (id) on delete cascade,
  appointment_interval_minutes integer not null default 30,
  booking_limit_days integer not null default 60,
  max_daily_bookings integer,
  cancellation_policy text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists location_hours (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations (id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  is_open boolean not null default true,
  open_time time not null default '09:00',
  close_time time not null default '17:00',
  unique (location_id, day_of_week)
);

create index if not exists location_hours_location_id_idx on location_hours (location_id);

-- ---------------------------------------------------------------------------
-- Helper: create default location for a business
-- ---------------------------------------------------------------------------

create or replace function create_default_location(
  p_business_id uuid,
  p_name text default 'Main Location'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_location_id uuid;
  v_business businesses;
begin
  select * into v_business from businesses where id = p_business_id;
  if not found then
    raise exception 'Business not found';
  end if;

  select id into v_location_id
  from locations
  where business_id = p_business_id and is_default = true
  limit 1;

  if v_location_id is not null then
    return v_location_id;
  end if;

  insert into locations (business_id, name, slug, timezone, is_default, is_active)
  values (
    p_business_id,
    p_name,
    'main',
    v_business.timezone,
    true,
    true
  )
  returning id into v_location_id;

  insert into location_settings (
    location_id,
    appointment_interval_minutes,
    booking_limit_days,
    max_daily_bookings,
    cancellation_policy
  )
  values (
    v_location_id,
    coalesce(v_business.appointment_interval_minutes, 30),
    coalesce(v_business.booking_limit_days, 60),
    v_business.max_daily_bookings,
    v_business.cancellation_policy
  );

  insert into location_hours (location_id, day_of_week, is_open, open_time, close_time)
  select
    v_location_id,
    bh.day_of_week,
    bh.is_open,
    bh.open_time,
    bh.close_time
  from business_hours bh
  where bh.business_id = p_business_id;

  if not found then
    insert into location_hours (location_id, day_of_week, is_open, open_time, close_time)
    select
      v_location_id,
      gs.day,
      gs.day between 1 and 5,
      '09:00:00'::time,
      '17:00:00'::time
    from generate_series(0, 6) as gs(day);
  end if;

  return v_location_id;
end;
$$;

-- Backfill default locations for all existing businesses
do $$
declare
  r record;
begin
  for r in select id, name from businesses loop
    perform create_default_location(r.id, r.name || ' — Main');
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- location_id on operational tables
-- ---------------------------------------------------------------------------

alter table staff add column if not exists location_id uuid references locations (id) on delete restrict;
alter table services add column if not exists location_id uuid references locations (id) on delete restrict;
alter table appointments add column if not exists location_id uuid references locations (id) on delete restrict;
alter table availability add column if not exists location_id uuid references locations (id) on delete cascade;
alter table holidays add column if not exists location_id uuid references locations (id) on delete cascade;

update staff s
set location_id = l.id
from locations l
where l.business_id = s.business_id
  and l.is_default = true
  and s.location_id is null;

update services sv
set location_id = l.id
from locations l
where l.business_id = sv.business_id
  and l.is_default = true
  and sv.location_id is null;

update appointments a
set location_id = l.id
from locations l
where l.business_id = a.business_id
  and l.is_default = true
  and a.location_id is null;

update availability av
set location_id = l.id
from locations l
where l.business_id = av.business_id
  and l.is_default = true
  and av.location_id is null;

alter table staff alter column location_id set not null;
alter table services alter column location_id set not null;
alter table appointments alter column location_id set not null;
alter table availability alter column location_id set not null;

create index if not exists staff_location_id_idx on staff (location_id);
create index if not exists services_location_id_idx on services (location_id);
create index if not exists appointments_location_id_idx on appointments (location_id);
create index if not exists availability_location_id_idx on availability (location_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table locations enable row level security;
alter table location_settings enable row level security;
alter table location_hours enable row level security;
alter table subscription_plans enable row level security;

create policy "Anyone can read subscription plans"
  on subscription_plans for select using (true);

create policy "Owners manage locations"
  on locations for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

create policy "Owners manage location settings"
  on location_settings for all
  using (
    exists (
      select 1 from locations l
      where l.id = location_settings.location_id
        and is_business_owner(l.business_id)
    )
  )
  with check (
    exists (
      select 1 from locations l
      where l.id = location_settings.location_id
        and is_business_owner(l.business_id)
    )
  );

create policy "Owners manage location hours"
  on location_hours for all
  using (
    exists (
      select 1 from locations l
      where l.id = location_hours.location_id
        and is_business_owner(l.business_id)
    )
  )
  with check (
    exists (
      select 1 from locations l
      where l.id = location_hours.location_id
        and is_business_owner(l.business_id)
    )
  );

create policy "Public can view active locations"
  on locations for select using (is_active = true);

create policy "Public can view location hours"
  on location_hours for select using (true);

-- ---------------------------------------------------------------------------
-- Resolve default / explicit location
-- ---------------------------------------------------------------------------

create or replace function resolve_location_id(
  p_business_id uuid,
  p_location_id uuid default null
)
returns uuid
language sql
stable
as $$
  select coalesce(
    p_location_id,
    (
      select l.id
      from locations l
      where l.business_id = p_business_id
        and l.is_default = true
      limit 1
    )
  );
$$;

-- ---------------------------------------------------------------------------
-- Location limit check (subscription-driven)
-- ---------------------------------------------------------------------------

create or replace function can_add_location(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    case
      when sp.max_locations is null then true
      else (
        select count(*) from locations l where l.business_id = p_business_id
      ) < sp.max_locations
    end
  from businesses b
  join subscription_plans sp on sp.plan_key = b.subscription_plan_key
  where b.id = p_business_id;
$$;

grant execute on function can_add_location(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Update ensure_business_for_owner to seed default location
-- ---------------------------------------------------------------------------

create or replace function ensure_business_for_owner(
  p_name text,
  p_preferred_slug text
)
returns businesses
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid := auth.uid();
  v_business businesses;
  v_candidate text;
  v_attempt int := 0;
  v_location_id uuid;
begin
  if v_owner_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_business from businesses where owner_id = v_owner_id;
  if found then
    perform create_default_location(v_business.id, v_business.name || ' — Main');
    return v_business;
  end if;

  while v_attempt < 6 loop
    if v_attempt = 0 then
      v_candidate := p_preferred_slug;
    elsif v_attempt between 1 and 4 then
      v_candidate := p_preferred_slug || '-' || v_attempt::text;
    else
      v_candidate := 'biz-' || replace(v_owner_id::text, '-', '');
    end if;

    begin
      insert into businesses (owner_id, name, slug)
      values (v_owner_id, p_name, v_candidate)
      returning * into v_business;

      insert into business_hours (business_id, day_of_week, is_open, open_time, close_time)
      select v_business.id, gs.day, gs.day between 1 and 5, '09:00:00'::time, '17:00:00'::time
      from generate_series(0, 6) as gs(day);

      v_location_id := create_default_location(v_business.id, p_name || ' — Main');
      return v_business;
    exception
      when unique_violation then
        select * into v_business from businesses where owner_id = v_owner_id;
        if found then
          perform create_default_location(v_business.id, v_business.name || ' — Main');
          return v_business;
        end if;
    end;

    v_attempt := v_attempt + 1;
  end loop;

  select * into v_business from businesses where owner_id = v_owner_id;
  if found then
    perform create_default_location(v_business.id, v_business.name || ' — Main');
    return v_business;
  end if;

  raise exception 'Failed to create business for owner %', v_owner_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Scheduling RPCs: add p_location_id (nullable → default location)
-- ---------------------------------------------------------------------------

create or replace function is_location_holiday(
  p_business_id uuid,
  p_location_id uuid,
  p_date date
)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from holidays h
    where h.business_id = p_business_id
      and (h.location_id is null or h.location_id = p_location_id)
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

create or replace function slot_is_blocked(
  p_business_id uuid,
  p_location_id uuid,
  p_staff_id uuid,
  p_block_start timestamptz,
  p_block_end timestamptz,
  p_exclude_appointment_id uuid default null
)
returns boolean
language sql
stable
as $$
  select
    exists (
      select 1 from availability a
      where a.business_id = p_business_id
        and a.location_id = p_location_id
        and a.is_available = false
        and (a.staff_id is null or a.staff_id = p_staff_id)
        and a.start_time < p_block_end
        and a.end_time > p_block_start
    )
    or exists (
      select 1 from appointments ap
      where ap.business_id = p_business_id
        and ap.location_id = p_location_id
        and ap.staff_id = p_staff_id
        and ap.status not in ('cancelled')
        and ap.start_time < p_block_end
        and ap.end_time > p_block_start
        and (p_exclude_appointment_id is null or ap.id <> p_exclude_appointment_id)
    )
    or exists (
      select 1 from external_events ee
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
  p_exclude_appointment_id uuid default null,
  p_location_id uuid default null
)
returns setof timestamptz
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_location_id uuid;
  v_tz text;
  v_interval integer;
  v_limit_days integer;
  v_max_daily integer;
  v_duration integer;
  v_buf_before integer;
  v_buf_after integer;
  v_dow integer;
  v_loc_open time;
  v_loc_close time;
  v_loc_is_open boolean;
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
  v_location_id := resolve_location_id(p_business_id, p_location_id);
  if v_location_id is null then
    return;
  end if;

  select coalesce(l.timezone, b.timezone)
  into v_tz
  from locations l
  join businesses b on b.id = l.business_id
  where l.id = v_location_id;

  select
    ls.appointment_interval_minutes,
    ls.booking_limit_days,
    ls.max_daily_bookings
  into v_interval, v_limit_days, v_max_daily
  from location_settings ls
  where ls.location_id = v_location_id;

  if not found then
    select b.appointment_interval_minutes, b.booking_limit_days, b.max_daily_bookings
    into v_interval, v_limit_days, v_max_daily
    from businesses b where b.id = p_business_id;
  end if;

  v_today := (v_now at time zone v_tz)::date;
  if p_date < v_today or p_date > v_today + coalesce(v_limit_days, 60) then
    return;
  end if;

  if is_location_holiday(p_business_id, v_location_id, p_date) then
    return;
  end if;

  if is_staff_on_vacation(p_staff_id, p_date) then
    return;
  end if;

  select s.duration_minutes, s.buffer_before_minutes, s.buffer_after_minutes
  into v_duration, v_buf_before, v_buf_after
  from services s
  where s.id = p_service_id
    and s.business_id = p_business_id
    and s.location_id = v_location_id
    and s.is_active = true;

  if not found then return; end if;

  if not exists (
    select 1 from staff st
    where st.id = p_staff_id
      and st.business_id = p_business_id
      and st.location_id = v_location_id
      and st.is_active = true
  ) then return; end if;

  if not exists (
    select 1 from staff_services ss
    where ss.staff_id = p_staff_id and ss.service_id = p_service_id
  ) then return; end if;

  v_dow := extract(dow from p_date)::integer;

  select lh.is_open, lh.open_time, lh.close_time
  into v_loc_is_open, v_loc_open, v_loc_close
  from location_hours lh
  where lh.location_id = v_location_id and lh.day_of_week = v_dow;

  if not coalesce(v_loc_is_open, false) then return; end if;

  select swh.is_working, swh.start_time, swh.end_time
  into v_staff_working, v_staff_start, v_staff_end
  from staff_working_hours swh
  where swh.staff_id = p_staff_id and swh.day_of_week = v_dow;

  if found then
    if not v_staff_working then return; end if;
    v_loc_open := greatest(v_loc_open, v_staff_start);
    v_loc_close := least(v_loc_close, v_staff_end);
    if v_loc_open >= v_loc_close then return; end if;
  end if;

  v_window_start := (p_date + v_loc_open)::timestamp at time zone v_tz;
  v_window_end := (p_date + v_loc_close)::timestamp at time zone v_tz;

  if v_max_daily is not null then
    select count(*) into v_daily_count
    from appointments a
    where a.business_id = p_business_id
      and a.location_id = v_location_id
      and a.status not in ('cancelled')
      and (a.start_time at time zone v_tz)::date = p_date
      and (p_exclude_appointment_id is null or a.id <> p_exclude_appointment_id);
    if v_daily_count >= v_max_daily then return; end if;
  end if;

  v_slot := v_window_start;
  while v_slot + make_interval(mins => v_duration) <= v_window_end loop
    v_slot_end := v_slot + make_interval(mins => v_duration);
    v_block_start := v_slot - make_interval(mins => v_buf_before);
    v_block_end := v_slot_end + make_interval(mins => v_buf_after);

    if v_slot > v_now and not slot_is_blocked(
      p_business_id, v_location_id, p_staff_id,
      v_block_start, v_block_end, p_exclude_appointment_id
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
  p_exclude_appointment_id uuid default null,
  p_location_id uuid default null
)
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_location_id uuid;
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

  v_location_id := resolve_location_id(p_business_id, p_location_id);
  if v_location_id is null then
    raise exception 'Location not found';
  end if;

  select coalesce(l.timezone, b.timezone)
  into v_tz
  from locations l
  join businesses b on b.id = l.business_id
  where l.id = v_location_id;

  select ls.booking_limit_days, ls.max_daily_bookings
  into v_limit_days, v_max_daily
  from location_settings ls
  where ls.location_id = v_location_id;

  if not exists (
    select 1 from services s
    where s.id = p_service_id
      and s.business_id = p_business_id
      and s.location_id = v_location_id
      and s.is_active = true
  ) then
    raise exception 'Service not available';
  end if;

  if not exists (
    select 1 from staff st
    where st.id = p_staff_id
      and st.business_id = p_business_id
      and st.location_id = v_location_id
      and st.is_active = true
  ) then
    raise exception 'Staff not available';
  end if;

  if not exists (
    select 1 from staff_services ss
    where ss.staff_id = p_staff_id and ss.service_id = p_service_id
  ) then
    raise exception 'Staff member does not offer this service';
  end if;

  select s.buffer_before_minutes, s.buffer_after_minutes
  into v_buf_before, v_buf_after
  from services s where s.id = p_service_id;

  v_date := (p_start_time at time zone v_tz)::date;
  v_today := (now() at time zone v_tz)::date;

  if v_date < v_today or v_date > v_today + coalesce(v_limit_days, 60) then
    raise exception 'Date is outside the booking window';
  end if;

  if is_location_holiday(p_business_id, v_location_id, v_date) then
    raise exception 'Business is closed on this date';
  end if;

  if is_staff_on_vacation(p_staff_id, v_date) then
    raise exception 'Staff member is unavailable on this date';
  end if;

  if p_exclude_appointment_id is null and v_max_daily is not null then
    select count(*) into v_daily_count
    from appointments a
    where a.business_id = p_business_id
      and a.location_id = v_location_id
      and a.status not in ('cancelled')
      and (a.start_time at time zone v_tz)::date = v_date;

    if v_daily_count >= v_max_daily then
      raise exception 'Daily booking limit reached';
    end if;
  end if;

  if not exists (
    select 1
    from get_available_slots(
      p_business_id, p_service_id, p_staff_id, v_date,
      p_exclude_appointment_id, v_location_id
    ) slot
    where slot = p_start_time
  ) then
    raise exception 'Time slot not available';
  end if;

  v_block_start := p_start_time - make_interval(mins => coalesce(v_buf_before, 0));
  v_block_end := p_end_time + make_interval(mins => coalesce(v_buf_after, 0));

  if slot_is_blocked(
    p_business_id, v_location_id, p_staff_id,
    v_block_start, v_block_end, p_exclude_appointment_id
  ) then
    raise exception 'Time slot no longer available';
  end if;
end;
$$;

create or replace function create_public_appointment(
  p_business_id uuid,
  p_service_id uuid,
  p_staff_id uuid,
  p_customer_id uuid,
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_notes text default null,
  p_location_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_location_id uuid;
begin
  v_location_id := resolve_location_id(p_business_id, p_location_id);

  if not exists (
    select 1 from customers
    where id = p_customer_id and business_id = p_business_id
  ) then
    raise exception 'Customer not found';
  end if;

  perform validate_appointment_slot(
    p_business_id, p_service_id, p_staff_id,
    p_start_time, p_end_time, null, v_location_id
  );

  insert into appointments (
    business_id, location_id, service_id, staff_id, customer_id,
    start_time, end_time, status, notes
  )
  values (
    p_business_id, v_location_id, p_service_id, p_staff_id, p_customer_id,
    p_start_time, p_end_time, 'confirmed', p_notes
  )
  returning id into v_id;

  return v_id;
exception
  when exclusion_violation then
    raise exception 'Time slot no longer available';
end;
$$;

grant execute on function get_available_slots(uuid, uuid, uuid, date, uuid, uuid) to anon, authenticated;
grant execute on function validate_appointment_slot(uuid, uuid, uuid, timestamptz, timestamptz, uuid, uuid) to anon, authenticated;
grant execute on function create_public_appointment(uuid, uuid, uuid, uuid, timestamptz, timestamptz, text, uuid) to anon, authenticated;

-- Drop obsolete overloads (also in 009 for databases that applied 008 before this line existed)
drop function if exists slot_is_blocked(uuid, uuid, timestamptz, timestamptz, uuid);
drop function if exists get_available_slots(uuid, uuid, uuid, date, uuid);
drop function if exists validate_appointment_slot(uuid, uuid, uuid, timestamptz, timestamptz, uuid);
drop function if exists create_public_appointment(uuid, uuid, uuid, uuid, timestamptz, timestamptz, text);
