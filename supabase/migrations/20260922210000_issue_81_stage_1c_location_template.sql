-- Issue #81 Stage 1C — atomic Add Location template workflow.
-- Authorized implementation only. Do not apply to hosted databases without a
-- separate Product Owner Staging/Production gate.
--
-- Stage-1 truth:
--   services = Business catalog
--   service_locations = offered-at
--   staff_locations = works-at
--   location_hours/location_settings = concrete scheduling truth
-- Snapshot/copy only. No live inheritance. No resource-aware booking.

-- Reconcile the Product Owner-locked Business location entitlement.
update public.subscription_plans
set max_locations = 6
where plan_key = 'business'
  and max_locations is distinct from 6;

-- Read-only quota projection. The trigger below is the final write authority.
create or replace function public.can_add_location(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    when sp.plan_key is null then false
    when sp.max_locations is null then true
    else (
      select count(*)
      from public.locations l
      where l.business_id = b.id
        and l.is_active = true
    ) < sp.max_locations
  end
  from public.businesses b
  left join public.subscription_plans sp
    on sp.plan_key = coalesce(b.subscription_plan_key, 'starter')
  where b.id = p_business_id
    and public.is_business_owner(b.id);
$;

revoke all on function public.can_add_location(uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.can_add_location(uuid)
  to authenticated;

-- Additional active Locations must be created through the governed atomic
-- workflow. Existing SECURITY DEFINER/system writers retain owner/service
-- privileges; browser/API roles cannot create structurally partial Locations.
revoke insert on table public.locations
  from public, anon, authenticated;

-- Final DB-level quota authority. It protects every active Location INSERT and
-- inactive -> active transition, including direct PostgREST writes.
create or replace function public.enforce_location_quota()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_plan_key text;
  v_max integer;
  v_active integer;
begin
  if new.is_active is not true then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.is_active is true then
    return new;
  end if;

  select coalesce(b.subscription_plan_key, 'starter')
  into v_plan_key
  from public.businesses b
  where b.id = new.business_id
  for update;

  if not found then
    raise exception 'Business not found for location quota.'
      using errcode = 'P0001';
  end if;

  select sp.max_locations
  into v_max
  from public.subscription_plans sp
  where sp.plan_key = v_plan_key
    and sp.is_active = true;

  if not found then
    raise exception 'Location entitlement is unavailable for this plan.'
      using errcode = 'P0001';
  end if;

  if v_max is null then
    return new;
  end if;

  select count(*)
  into v_active
  from public.locations l
  where l.business_id = new.business_id
    and l.is_active = true;

  if v_active >= v_max then
    raise exception 'LOCATION_LIMIT_REACHED: plan % allows % active location(s).',
      v_plan_key, v_max
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_location_quota()
  from public, anon, authenticated, service_role;

drop trigger if exists locations_enforce_plan_quota on public.locations;
create trigger locations_enforce_plan_quota
before insert or update of is_active on public.locations
for each row execute function public.enforce_location_quota();

-- One atomic Stage 1C workflow writer.
create or replace function public.create_location_from_template(
  p_business_id uuid,
  p_name text,
  p_slug text,
  p_timezone text,
  p_address_line1 text,
  p_address_line2 text,
  p_city text,
  p_state text,
  p_postal_code text,
  p_phone text,
  p_setup_mode text,
  p_source_location_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_business public.businesses%rowtype;
  v_source public.locations%rowtype;
  v_source_settings public.location_settings%rowtype;
  v_location_id uuid;
  v_source_id uuid;
  v_service_count integer := 0;
  v_hours_count integer := 0;
  v_default_count integer := 0;
  v_mode text := lower(trim(coalesce(p_setup_mode, '')));
begin
  if not public.is_business_owner(p_business_id) then
    raise exception 'You are not authorized to create a location for this business.'
      using errcode = '42501';
  end if;

  select *
  into v_business
  from public.businesses b
  where b.id = p_business_id
  for update;

  if not found then
    raise exception 'Business not found.'
      using errcode = 'P0001';
  end if;

  if nullif(trim(coalesce(p_name, '')), '') is null then
    raise exception 'Location name is required.'
      using errcode = 'P0001';
  end if;

  if nullif(trim(coalesce(p_slug, '')), '') is null then
    raise exception 'Location slug is required.'
      using errcode = 'P0001';
  end if;

  if nullif(trim(coalesce(p_timezone, '')), '') is null then
    raise exception 'Location timezone is required.'
      using errcode = 'P0001';
  end if;

  if not exists (
    select 1
    from pg_timezone_names tz
    where tz.name = trim(p_timezone)
  ) then
    raise exception 'Location timezone is invalid.'
      using errcode = 'P0001';
  end if;

  if v_mode not in ('default', 'copy', 'blank') then
    raise exception 'Invalid location setup mode.'
      using errcode = 'P0001';
  end if;

  if v_mode = 'default' then
    select count(*)
    into v_default_count
    from public.locations l
    where l.business_id = p_business_id
      and l.is_active = true
      and l.is_default = true;

    if v_default_count = 0 then
      raise exception 'No active default location is available to copy.'
        using errcode = 'P0001';
    end if;
    if v_default_count > 1 then
      raise exception 'Multiple active default locations require review before copying.'
        using errcode = 'P0001';
    end if;

    select l.*
    into v_source
    from public.locations l
    where l.business_id = p_business_id
      and l.is_active = true
      and l.is_default = true;

    v_source_id := v_source.id;
  elsif v_mode = 'copy' then
    if p_source_location_id is null then
      raise exception 'Choose a source location to copy.'
        using errcode = 'P0001';
    end if;

    select l.*
    into v_source
    from public.locations l
    where l.id = p_source_location_id
      and l.business_id = p_business_id
      and l.is_active = true;

    if not found then
      raise exception 'Source location is unavailable for this business.'
        using errcode = 'P0001';
    end if;
    v_source_id := v_source.id;
  else
    if p_source_location_id is not null then
      raise exception 'Start blank cannot include a source location.'
        using errcode = 'P0001';
    end if;
    v_source_id := null;
  end if;

  -- The quota trigger serializes and authoritatively enforces the configured
  -- plan limit. This insert also participates in the function transaction.
  insert into public.locations(
    business_id,
    name,
    slug,
    timezone,
    is_default,
    is_active,
    address_line1,
    address_line2,
    city,
    state,
    postal_code,
    phone
  ) values (
    p_business_id,
    trim(p_name),
    trim(p_slug),
    trim(p_timezone),
    false,
    true,
    nullif(trim(coalesce(p_address_line1, '')), ''),
    nullif(trim(coalesce(p_address_line2, '')), ''),
    nullif(trim(coalesce(p_city, '')), ''),
    nullif(trim(coalesce(p_state, '')), ''),
    nullif(trim(coalesce(p_postal_code, '')), ''),
    nullif(trim(coalesce(p_phone, '')), '')
  )
  returning id into v_location_id;

  if v_source_id is not null then
    select *
    into v_source_settings
    from public.location_settings ls
    where ls.location_id = v_source_id;

    if not found then
      raise exception 'Source location booking settings are incomplete.'
        using errcode = 'P0001';
    end if;

    select count(*)
    into v_hours_count
    from public.location_hours lh
    where lh.location_id = v_source_id;

    if v_hours_count <> 7 then
      raise exception 'Source location hours are incomplete.'
        using errcode = 'P0001';
    end if;

    insert into public.location_settings(
      location_id,
      appointment_interval_minutes,
      booking_limit_days,
      max_daily_bookings,
      cancellation_policy,
      min_booking_notice_minutes,
      default_travel_minutes,
      timezone
    ) values (
      v_location_id,
      v_source_settings.appointment_interval_minutes,
      v_source_settings.booking_limit_days,
      v_source_settings.max_daily_bookings,
      v_source_settings.cancellation_policy,
      v_source_settings.min_booking_notice_minutes,
      v_source_settings.default_travel_minutes,
      coalesce(v_source_settings.timezone, trim(p_timezone))
    );

    insert into public.location_hours(
      location_id,
      day_of_week,
      is_open,
      open_time,
      close_time
    )
    select
      v_location_id,
      lh.day_of_week,
      lh.is_open,
      lh.open_time,
      lh.close_time
    from public.location_hours lh
    where lh.location_id = v_source_id
    order by lh.day_of_week;

    insert into public.location_hour_segments(
      location_id,
      day_of_week,
      open_time,
      close_time,
      sort_order
    )
    select
      v_location_id,
      seg.day_of_week,
      seg.open_time,
      seg.close_time,
      seg.sort_order
    from public.location_hour_segments seg
    where seg.location_id = v_source_id
    order by seg.day_of_week, seg.sort_order;

    insert into public.service_locations(service_id, location_id, is_primary)
    select s.id, v_location_id, false
    from public.services s
    where s.business_id = p_business_id
      and s.is_active = true
      and (
        s.location_id = v_source_id
        or exists (
          select 1
          from public.service_locations sl
          where sl.service_id = s.id
            and sl.location_id = v_source_id
        )
      )
    on conflict (service_id, location_id) do nothing;

    get diagnostics v_service_count = row_count;
  else
    -- "Start blank" means no copied availability, not invalid scheduling rows.
    insert into public.location_settings(
      location_id,
      appointment_interval_minutes,
      booking_limit_days,
      max_daily_bookings,
      cancellation_policy,
      min_booking_notice_minutes,
      default_travel_minutes,
      timezone
    ) values (
      v_location_id,
      coalesce(v_business.appointment_interval_minutes, 30),
      coalesce(v_business.booking_limit_days, 60),
      v_business.max_daily_bookings,
      v_business.cancellation_policy,
      coalesce(v_business.min_notice_minutes, 0),
      0,
      trim(p_timezone)
    );

    insert into public.location_hours(
      location_id,
      day_of_week,
      is_open,
      open_time,
      close_time
    )
    select
      v_location_id,
      day,
      false,
      time '09:00',
      time '17:00'
    from generate_series(0, 6) as day;
  end if;

  return jsonb_build_object(
    'location_id', v_location_id,
    'setup_mode', v_mode,
    'source_location_id', v_source_id,
    'copied_service_count', v_service_count
  );
end;
$$;

revoke all on function public.create_location_from_template(
  uuid,text,text,text,text,text,text,text,text,text,text,uuid
) from public, anon, authenticated, service_role;
grant execute on function public.create_location_from_template(
  uuid,text,text,text,text,text,text,text,text,text,text,uuid
) to authenticated;

-- The workflow does not create Staff/resource relationships. Those remain
-- explicit post-create actions.
