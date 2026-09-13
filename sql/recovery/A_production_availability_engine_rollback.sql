-- Fresh Production capture; restore only under a separate governed rollback approval.

-- Confirm no new callers depend on availability_block_reason; DROP uses RESTRICT.

BEGIN;

CREATE OR REPLACE FUNCTION public.slot_is_blocked(p_business_id uuid, p_location_id uuid, p_staff_id uuid, p_block_start timestamp with time zone, p_block_end timestamp with time zone, p_exclude_appointment_id uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
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
$function$;

ALTER FUNCTION public.slot_is_blocked(p_business_id uuid, p_location_id uuid, p_staff_id uuid, p_block_start timestamp with time zone, p_block_end timestamp with time zone, p_exclude_appointment_id uuid) OWNER TO postgres;

ALTER FUNCTION public.slot_is_blocked(p_business_id uuid, p_location_id uuid, p_staff_id uuid, p_block_start timestamp with time zone, p_block_end timestamp with time zone, p_exclude_appointment_id uuid) RESET ALL;

REVOKE ALL ON FUNCTION public.slot_is_blocked(p_business_id uuid, p_location_id uuid, p_staff_id uuid, p_block_start timestamp with time zone, p_block_end timestamp with time zone, p_exclude_appointment_id uuid) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.slot_is_blocked(p_business_id uuid, p_location_id uuid, p_staff_id uuid, p_block_start timestamp with time zone, p_block_end timestamp with time zone, p_exclude_appointment_id uuid) TO PUBLIC, anon, authenticated, service_role;

COMMENT ON FUNCTION public.slot_is_blocked(p_business_id uuid, p_location_id uuid, p_staff_id uuid, p_block_start timestamp with time zone, p_block_end timestamp with time zone, p_exclude_appointment_id uuid) IS NULL;

CREATE OR REPLACE FUNCTION public.get_available_slots(p_business_id uuid, p_service_id uuid, p_staff_id uuid, p_date date, p_exclude_appointment_id uuid DEFAULT NULL::uuid, p_location_id uuid DEFAULT NULL::uuid)
 RETURNS SETOF timestamp with time zone
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

ALTER FUNCTION public.get_available_slots(p_business_id uuid, p_service_id uuid, p_staff_id uuid, p_date date, p_exclude_appointment_id uuid, p_location_id uuid) OWNER TO postgres;

ALTER FUNCTION public.get_available_slots(p_business_id uuid, p_service_id uuid, p_staff_id uuid, p_date date, p_exclude_appointment_id uuid, p_location_id uuid) RESET ALL;

ALTER FUNCTION public.get_available_slots(p_business_id uuid, p_service_id uuid, p_staff_id uuid, p_date date, p_exclude_appointment_id uuid, p_location_id uuid) SET search_path TO public;

REVOKE ALL ON FUNCTION public.get_available_slots(p_business_id uuid, p_service_id uuid, p_staff_id uuid, p_date date, p_exclude_appointment_id uuid, p_location_id uuid) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.get_available_slots(p_business_id uuid, p_service_id uuid, p_staff_id uuid, p_date date, p_exclude_appointment_id uuid, p_location_id uuid) TO PUBLIC, anon, authenticated, service_role;

COMMENT ON FUNCTION public.get_available_slots(p_business_id uuid, p_service_id uuid, p_staff_id uuid, p_date date, p_exclude_appointment_id uuid, p_location_id uuid) IS NULL;

CREATE OR REPLACE FUNCTION public.validate_appointment_slot(p_business_id uuid, p_service_id uuid, p_staff_id uuid, p_start_time timestamp with time zone, p_end_time timestamp with time zone, p_exclude_appointment_id uuid DEFAULT NULL::uuid, p_location_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

ALTER FUNCTION public.validate_appointment_slot(p_business_id uuid, p_service_id uuid, p_staff_id uuid, p_start_time timestamp with time zone, p_end_time timestamp with time zone, p_exclude_appointment_id uuid, p_location_id uuid) OWNER TO postgres;

ALTER FUNCTION public.validate_appointment_slot(p_business_id uuid, p_service_id uuid, p_staff_id uuid, p_start_time timestamp with time zone, p_end_time timestamp with time zone, p_exclude_appointment_id uuid, p_location_id uuid) RESET ALL;

ALTER FUNCTION public.validate_appointment_slot(p_business_id uuid, p_service_id uuid, p_staff_id uuid, p_start_time timestamp with time zone, p_end_time timestamp with time zone, p_exclude_appointment_id uuid, p_location_id uuid) SET search_path TO public;

REVOKE ALL ON FUNCTION public.validate_appointment_slot(p_business_id uuid, p_service_id uuid, p_staff_id uuid, p_start_time timestamp with time zone, p_end_time timestamp with time zone, p_exclude_appointment_id uuid, p_location_id uuid) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.validate_appointment_slot(p_business_id uuid, p_service_id uuid, p_staff_id uuid, p_start_time timestamp with time zone, p_end_time timestamp with time zone, p_exclude_appointment_id uuid, p_location_id uuid) TO PUBLIC, anon, authenticated, service_role;

COMMENT ON FUNCTION public.validate_appointment_slot(p_business_id uuid, p_service_id uuid, p_staff_id uuid, p_start_time timestamp with time zone, p_end_time timestamp with time zone, p_exclude_appointment_id uuid, p_location_id uuid) IS NULL;

DROP FUNCTION public.availability_block_reason(p_business_id uuid, p_location_id uuid, p_staff_id uuid, p_service_id uuid, p_block_start timestamp with time zone, p_block_end timestamp with time zone, p_exclude_appointment_id uuid, p_allow_double_booking boolean) RESTRICT;

COMMIT;

NOTIFY pgrst, 'reload schema';
