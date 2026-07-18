-- Chasum Phase 5.1 — Availability Engine
-- Enriches get_available_slots / validate_appointment_slot / slot_is_blocked
-- with Business + Services + Employees constraints (lunch, split shifts,
-- closures, blackouts, cleanup, notice, caps, double-booking policy).
-- Signature of get_available_slots / validate_appointment_slot unchanged.

-- ---------------------------------------------------------------------------
-- Extended block reason (returns null when open, else a human/UI message)
-- ---------------------------------------------------------------------------

create or replace function availability_block_reason(
  p_business_id uuid,
  p_location_id uuid,
  p_staff_id uuid,
  p_service_id uuid,
  p_block_start timestamptz,
  p_block_end timestamptz,
  p_exclude_appointment_id uuid default null,
  p_allow_double_booking boolean default false
)
returns text
language plpgsql
stable
set search_path = public
as $$
begin
  -- Availability blocks
  if exists (
    select 1 from availability a
    where a.business_id = p_business_id
      and a.location_id = p_location_id
      and a.is_available = false
      and (a.staff_id is null or a.staff_id = p_staff_id)
      and a.start_time < p_block_end
      and a.end_time > p_block_start
  ) then
    return 'Time slot not available';
  end if;

  -- Staff appointments (honors allow_double_booking)
  if not coalesce(p_allow_double_booking, false) then
    if exists (
      select 1 from appointments ap
      where ap.business_id = p_business_id
        and ap.location_id = p_location_id
        and ap.staff_id = p_staff_id
        and ap.status not in ('cancelled')
        and ap.start_time < p_block_end
        and ap.end_time > p_block_start
        and (p_exclude_appointment_id is null or ap.id <> p_exclude_appointment_id)
    ) then
      return 'Time slot overlaps an existing appointment';
    end if;
  end if;

  -- External calendar busy (Google/Outlook sync already wired)
  if exists (
    select 1 from external_events ee
    join calendar_connections cc on cc.id = ee.calendar_connection_id
    where cc.business_id = p_business_id
      and cc.staff_id = p_staff_id
      and ee.is_busy = true
      and ee.start_time < p_block_end
      and ee.end_time > p_block_start
  ) then
    return 'Conflicts with an external calendar event';
  end if;

  -- Business closures (holiday / vacation / temporary / full special hours)
  if exists (
    select 1 from business_closures bc
    where bc.business_id = p_business_id
      and (bc.location_id is null or bc.location_id = p_location_id)
      and bc.starts_at < p_block_end
      and bc.ends_at > p_block_start
      and (
        bc.closure_type in ('holiday', 'vacation', 'temporary')
        or (bc.closure_type = 'special_hours' and bc.open_time is null)
      )
  ) then
    return 'Business is closed during this time';
  end if;

  -- Staff timed closures
  if exists (
    select 1 from staff_closures sc
    where sc.staff_id = p_staff_id
      and sc.business_id = p_business_id
      and (sc.location_id is null or sc.location_id = p_location_id)
      and sc.starts_at < p_block_end
      and sc.ends_at > p_block_start
  ) then
    return 'Employee is unavailable during this time';
  end if;

  -- Service blackouts
  if exists (
    select 1 from service_blackouts sb
    where sb.service_id = p_service_id
      and sb.business_id = p_business_id
      and (sb.location_id is null or sb.location_id = p_location_id)
      and sb.starts_at < p_block_end
      and sb.ends_at > p_block_start
  ) then
    return 'Service is blacked out for this time';
  end if;

  return null;
end;
$$;

-- Keep slot_is_blocked as boolean wrapper (backward compatible + double-book flag)
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
set search_path = public
as $$
  select availability_block_reason(
    p_business_id,
    p_location_id,
    p_staff_id,
    null,
    p_block_start,
    p_block_end,
    p_exclude_appointment_id,
    false
  ) is not null;
$$;

-- ---------------------------------------------------------------------------
-- get_available_slots — production availability algorithm
-- ---------------------------------------------------------------------------

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
  v_max_staff_day integer;
  v_max_service_day integer;
  v_duration integer;
  v_buf_before integer;
  v_buf_after integer;
  v_cleanup integer;
  v_min_notice integer;
  v_allow_double boolean;
  v_dow integer;
  v_loc_open time;
  v_loc_close time;
  v_loc_is_open boolean;
  v_staff_working boolean;
  v_staff_start time;
  v_staff_end time;
  v_lunch_start time;
  v_lunch_end time;
  v_window_start timestamptz;
  v_window_end timestamptz;
  v_slot timestamptz;
  v_slot_end timestamptz;
  v_block_start timestamptz;
  v_block_end timestamptz;
  v_now timestamptz := now();
  v_today date;
  v_daily_count integer;
  v_staff_day_count integer;
  v_service_day_count integer;
  v_reason text;
  v_has_loc_segments boolean;
  v_has_staff_work_segments boolean;
  v_seg record;
  v_staff_seg record;
  v_win_open time;
  v_win_close time;
  v_special_open time;
  v_special_close time;
begin
  v_location_id := resolve_location_id(p_business_id, p_location_id);
  if v_location_id is null then
    return;
  end if;

  select coalesce(l.timezone, b.timezone),
         coalesce(b.min_notice_minutes, 0),
         coalesce(b.allow_double_booking, false),
         b.booking_limit_days
  into v_tz, v_min_notice, v_allow_double, v_limit_days
  from locations l
  join businesses b on b.id = l.business_id
  where l.id = v_location_id;

  select
    ls.appointment_interval_minutes,
    coalesce(ls.booking_limit_days, v_limit_days),
    ls.max_daily_bookings,
    coalesce(ls.min_booking_notice_minutes, v_min_notice)
  into v_interval, v_limit_days, v_max_daily, v_min_notice
  from location_settings ls
  where ls.location_id = v_location_id;

  if not found then
    select b.appointment_interval_minutes, b.booking_limit_days, b.max_daily_bookings
    into v_interval, v_limit_days, v_max_daily
    from businesses b where b.id = p_business_id;
  end if;

  v_interval := coalesce(v_interval, 30);
  v_limit_days := coalesce(v_limit_days, 60);
  v_min_notice := coalesce(v_min_notice, 0);

  v_today := (v_now at time zone v_tz)::date;
  if p_date < v_today or p_date > v_today + v_limit_days then
    return;
  end if;

  if is_location_holiday(p_business_id, v_location_id, p_date) then
    return;
  end if;

  if is_staff_on_vacation(p_staff_id, p_date) then
    return;
  end if;

  -- Full-day business closure covering this local date
  if exists (
    select 1 from business_closures bc
    where bc.business_id = p_business_id
      and (bc.location_id is null or bc.location_id = v_location_id)
      and bc.closure_type in ('holiday', 'vacation', 'temporary')
      and (bc.starts_at at time zone v_tz)::date <= p_date
      and (bc.ends_at at time zone v_tz)::date >= p_date
  ) then
    return;
  end if;

  -- Service + duration override + buffers + cleanup + notice / max-ahead / max-day
  select
    coalesce(nullif(ss.duration_override_minutes, 0), s.duration_minutes),
    greatest(coalesce(s.buffer_before_minutes, 0), coalesce(st.buffer_before_minutes, 0)),
    greatest(coalesce(s.buffer_after_minutes, 0), coalesce(st.buffer_after_minutes, 0)),
    coalesce(s.cleanup_minutes, 0),
    greatest(
      v_min_notice,
      coalesce(s.min_booking_notice_minutes, 0)
    ),
    least(
      v_limit_days,
      coalesce(nullif(s.max_booking_days_ahead, 0), v_limit_days)
    ),
    s.max_appointments_per_day,
    st.max_appointments_per_day
  into
    v_duration, v_buf_before, v_buf_after, v_cleanup,
    v_min_notice, v_limit_days, v_max_service_day, v_max_staff_day
  from services s
  join staff st on st.id = p_staff_id
  left join staff_services ss
    on ss.staff_id = p_staff_id and ss.service_id = p_service_id
  where s.id = p_service_id
    and s.business_id = p_business_id
    and s.is_active = true
    and st.business_id = p_business_id
    and st.is_active = true
    and (
      s.location_id = v_location_id
      or exists (
        select 1 from service_locations sl
        where sl.service_id = s.id and sl.location_id = v_location_id
      )
    )
    and st.location_id = v_location_id;

  if not found or v_duration is null then
    return;
  end if;

  if p_date > v_today + v_limit_days then
    return;
  end if;

  if not exists (
    select 1 from staff_services ss
    where ss.staff_id = p_staff_id and ss.service_id = p_service_id
  ) then
    return;
  end if;

  v_dow := extract(dow from p_date)::integer;

  -- Special hours override for the day
  select bc.open_time, bc.close_time
  into v_special_open, v_special_close
  from business_closures bc
  where bc.business_id = p_business_id
    and (bc.location_id is null or bc.location_id = v_location_id)
    and bc.closure_type = 'special_hours'
    and bc.open_time is not null
    and bc.close_time is not null
    and (bc.starts_at at time zone v_tz)::date <= p_date
    and (bc.ends_at at time zone v_tz)::date >= p_date
  order by bc.starts_at desc
  limit 1;

  select exists (
    select 1 from location_hour_segments lhs
    where lhs.location_id = v_location_id and lhs.day_of_week = v_dow
  ) into v_has_loc_segments;

  select exists (
    select 1 from staff_hour_segments shs
    where shs.staff_id = p_staff_id
      and shs.day_of_week = v_dow
      and shs.segment_type = 'work'
  ) into v_has_staff_work_segments;

  select swh.is_working, swh.start_time, swh.end_time,
         swh.lunch_start_time, swh.lunch_end_time
  into v_staff_working, v_staff_start, v_staff_end, v_lunch_start, v_lunch_end
  from staff_working_hours swh
  where swh.staff_id = p_staff_id and swh.day_of_week = v_dow;

  if found and not coalesce(v_staff_working, true) and not v_has_staff_work_segments then
    return;
  end if;

  -- Daily caps
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

  if v_max_staff_day is not null then
    select count(*) into v_staff_day_count
    from appointments a
    where a.business_id = p_business_id
      and a.staff_id = p_staff_id
      and a.status not in ('cancelled')
      and (a.start_time at time zone v_tz)::date = p_date
      and (p_exclude_appointment_id is null or a.id <> p_exclude_appointment_id);
    if v_staff_day_count >= v_max_staff_day then return; end if;
  end if;

  if v_max_service_day is not null then
    select count(*) into v_service_day_count
    from appointments a
    where a.business_id = p_business_id
      and a.service_id = p_service_id
      and a.status not in ('cancelled')
      and (a.start_time at time zone v_tz)::date = p_date
      and (p_exclude_appointment_id is null or a.id <> p_exclude_appointment_id);
    if v_service_day_count >= v_max_service_day then return; end if;
  end if;

  -- Build location windows (segments > special hours > location_hours)
  if v_has_loc_segments then
    for v_seg in
      select lhs.open_time, lhs.close_time
      from location_hour_segments lhs
      where lhs.location_id = v_location_id and lhs.day_of_week = v_dow
      order by lhs.sort_order, lhs.open_time
    loop
      v_win_open := v_seg.open_time;
      v_win_close := v_seg.close_time;

      if v_special_open is not null then
        v_win_open := greatest(v_win_open, v_special_open);
        v_win_close := least(v_win_close, v_special_close);
      end if;

      if v_has_staff_work_segments then
        for v_staff_seg in
          select shs.start_time, shs.end_time
          from staff_hour_segments shs
          where shs.staff_id = p_staff_id
            and shs.day_of_week = v_dow
            and shs.segment_type = 'work'
          order by shs.sort_order, shs.start_time
        loop
          perform 1; -- placeholder for nested emit below
          v_loc_open := greatest(v_win_open, v_staff_seg.start_time);
          v_loc_close := least(v_win_close, v_staff_seg.end_time);
          if v_loc_open < v_loc_close then
            v_window_start := (p_date + v_loc_open)::timestamp at time zone v_tz;
            v_window_end := (p_date + v_loc_close)::timestamp at time zone v_tz;
            v_slot := v_window_start;
            while v_slot + make_interval(mins => v_duration) <= v_window_end loop
              v_slot_end := v_slot + make_interval(mins => v_duration);
              v_block_start := v_slot - make_interval(mins => v_buf_before);
              v_block_end := v_slot_end
                + make_interval(mins => v_buf_after)
                + make_interval(mins => v_cleanup);

              -- Lunch / break segments
              if exists (
                select 1 from staff_hour_segments br
                where br.staff_id = p_staff_id
                  and br.day_of_week = v_dow
                  and br.segment_type in ('lunch', 'break')
                  and (p_date + br.start_time)::timestamp at time zone v_tz < v_block_end
                  and (p_date + br.end_time)::timestamp at time zone v_tz > v_block_start
              ) then
                v_slot := v_slot + make_interval(mins => v_interval);
                continue;
              end if;

              if v_lunch_start is not null and v_lunch_end is not null then
                if (p_date + v_lunch_start)::timestamp at time zone v_tz < v_block_end
                   and (p_date + v_lunch_end)::timestamp at time zone v_tz > v_block_start then
                  v_slot := v_slot + make_interval(mins => v_interval);
                  continue;
                end if;
              end if;

              if v_slot > v_now
                 and v_slot >= v_now + make_interval(mins => v_min_notice)
              then
                v_reason := availability_block_reason(
                  p_business_id, v_location_id, p_staff_id, p_service_id,
                  v_block_start, v_block_end, p_exclude_appointment_id, v_allow_double
                );
                if v_reason is null then
                  return next v_slot;
                end if;
              end if;

              v_slot := v_slot + make_interval(mins => v_interval);
            end loop;
          end if;
        end loop;
      else
        if v_staff_start is not null then
          v_win_open := greatest(v_win_open, v_staff_start);
          v_win_close := least(v_win_close, v_staff_end);
        end if;
        if v_win_open < v_win_close then
          v_window_start := (p_date + v_win_open)::timestamp at time zone v_tz;
          v_window_end := (p_date + v_win_close)::timestamp at time zone v_tz;
          v_slot := v_window_start;
          while v_slot + make_interval(mins => v_duration) <= v_window_end loop
            v_slot_end := v_slot + make_interval(mins => v_duration);
            v_block_start := v_slot - make_interval(mins => v_buf_before);
            v_block_end := v_slot_end
              + make_interval(mins => v_buf_after)
              + make_interval(mins => v_cleanup);

            if v_lunch_start is not null and v_lunch_end is not null
               and (p_date + v_lunch_start)::timestamp at time zone v_tz < v_block_end
               and (p_date + v_lunch_end)::timestamp at time zone v_tz > v_block_start then
              v_slot := v_slot + make_interval(mins => v_interval);
              continue;
            end if;

            if v_slot > v_now
               and v_slot >= v_now + make_interval(mins => v_min_notice)
            then
              v_reason := availability_block_reason(
                p_business_id, v_location_id, p_staff_id, p_service_id,
                v_block_start, v_block_end, p_exclude_appointment_id, v_allow_double
              );
              if v_reason is null then
                return next v_slot;
              end if;
            end if;

            v_slot := v_slot + make_interval(mins => v_interval);
          end loop;
        end if;
      end if;
    end loop;
    return;
  end if;

  -- Single location hours window
  select lh.is_open, lh.open_time, lh.close_time
  into v_loc_is_open, v_loc_open, v_loc_close
  from location_hours lh
  where lh.location_id = v_location_id and lh.day_of_week = v_dow;

  if v_special_open is not null then
    v_loc_is_open := true;
    v_loc_open := v_special_open;
    v_loc_close := v_special_close;
  end if;

  if not coalesce(v_loc_is_open, false) then
    return;
  end if;

  if v_has_staff_work_segments then
    for v_staff_seg in
      select shs.start_time, shs.end_time
      from staff_hour_segments shs
      where shs.staff_id = p_staff_id
        and shs.day_of_week = v_dow
        and shs.segment_type = 'work'
      order by shs.sort_order, shs.start_time
    loop
      v_win_open := greatest(v_loc_open, v_staff_seg.start_time);
      v_win_close := least(v_loc_close, v_staff_seg.end_time);
      if v_win_open >= v_win_close then
        continue;
      end if;

      v_window_start := (p_date + v_win_open)::timestamp at time zone v_tz;
      v_window_end := (p_date + v_win_close)::timestamp at time zone v_tz;
      v_slot := v_window_start;
      while v_slot + make_interval(mins => v_duration) <= v_window_end loop
        v_slot_end := v_slot + make_interval(mins => v_duration);
        v_block_start := v_slot - make_interval(mins => v_buf_before);
        v_block_end := v_slot_end
          + make_interval(mins => v_buf_after)
          + make_interval(mins => v_cleanup);

        if exists (
          select 1 from staff_hour_segments br
          where br.staff_id = p_staff_id
            and br.day_of_week = v_dow
            and br.segment_type in ('lunch', 'break')
            and (p_date + br.start_time)::timestamp at time zone v_tz < v_block_end
            and (p_date + br.end_time)::timestamp at time zone v_tz > v_block_start
        ) then
          v_slot := v_slot + make_interval(mins => v_interval);
          continue;
        end if;

        if v_lunch_start is not null and v_lunch_end is not null
           and (p_date + v_lunch_start)::timestamp at time zone v_tz < v_block_end
           and (p_date + v_lunch_end)::timestamp at time zone v_tz > v_block_start then
          v_slot := v_slot + make_interval(mins => v_interval);
          continue;
        end if;

        if v_slot > v_now
           and v_slot >= v_now + make_interval(mins => v_min_notice)
        then
          v_reason := availability_block_reason(
            p_business_id, v_location_id, p_staff_id, p_service_id,
            v_block_start, v_block_end, p_exclude_appointment_id, v_allow_double
          );
          if v_reason is null then
            return next v_slot;
          end if;
        end if;

        v_slot := v_slot + make_interval(mins => v_interval);
      end loop;
    end loop;
    return;
  end if;

  if v_staff_start is not null then
    if not coalesce(v_staff_working, true) then
      return;
    end if;
    v_loc_open := greatest(v_loc_open, v_staff_start);
    v_loc_close := least(v_loc_close, v_staff_end);
    if v_loc_open >= v_loc_close then
      return;
    end if;
  end if;

  v_window_start := (p_date + v_loc_open)::timestamp at time zone v_tz;
  v_window_end := (p_date + v_loc_close)::timestamp at time zone v_tz;

  v_slot := v_window_start;
  while v_slot + make_interval(mins => v_duration) <= v_window_end loop
    v_slot_end := v_slot + make_interval(mins => v_duration);
    v_block_start := v_slot - make_interval(mins => v_buf_before);
    v_block_end := v_slot_end
      + make_interval(mins => v_buf_after)
      + make_interval(mins => v_cleanup);

    if v_lunch_start is not null and v_lunch_end is not null
       and (p_date + v_lunch_start)::timestamp at time zone v_tz < v_block_end
       and (p_date + v_lunch_end)::timestamp at time zone v_tz > v_block_start then
      v_slot := v_slot + make_interval(mins => v_interval);
      continue;
    end if;

    if v_slot > v_now
       and v_slot >= v_now + make_interval(mins => v_min_notice)
    then
      v_reason := availability_block_reason(
        p_business_id, v_location_id, p_staff_id, p_service_id,
        v_block_start, v_block_end, p_exclude_appointment_id, v_allow_double
      );
      if v_reason is null then
        return next v_slot;
      end if;
    end if;

    v_slot := v_slot + make_interval(mins => v_interval);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- validate_appointment_slot — richer messages via availability_block_reason
-- ---------------------------------------------------------------------------

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
  v_cleanup integer;
  v_min_notice integer;
  v_allow_double boolean;
  v_date date;
  v_today date;
  v_daily_count integer;
  v_block_start timestamptz;
  v_block_end timestamptz;
  v_reason text;
  v_max_staff_day integer;
  v_max_service_day integer;
  v_staff_day_count integer;
  v_service_day_count integer;
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

  select coalesce(l.timezone, b.timezone),
         coalesce(b.min_notice_minutes, 0),
         coalesce(b.allow_double_booking, false),
         b.booking_limit_days
  into v_tz, v_min_notice, v_allow_double, v_limit_days
  from locations l
  join businesses b on b.id = l.business_id
  where l.id = v_location_id;

  select ls.booking_limit_days, ls.max_daily_bookings,
         coalesce(ls.min_booking_notice_minutes, v_min_notice)
  into v_limit_days, v_max_daily, v_min_notice
  from location_settings ls
  where ls.location_id = v_location_id;

  select
    greatest(coalesce(s.buffer_before_minutes, 0), coalesce(st.buffer_before_minutes, 0)),
    greatest(coalesce(s.buffer_after_minutes, 0), coalesce(st.buffer_after_minutes, 0)),
    coalesce(s.cleanup_minutes, 0),
    greatest(v_min_notice, coalesce(s.min_booking_notice_minutes, 0)),
    least(
      coalesce(v_limit_days, 60),
      coalesce(nullif(s.max_booking_days_ahead, 0), coalesce(v_limit_days, 60))
    ),
    s.max_appointments_per_day,
    st.max_appointments_per_day
  into
    v_buf_before, v_buf_after, v_cleanup, v_min_notice, v_limit_days,
    v_max_service_day, v_max_staff_day
  from services s
  join staff st on st.id = p_staff_id
  where s.id = p_service_id
    and s.business_id = p_business_id
    and s.is_active = true
    and st.business_id = p_business_id
    and st.is_active = true;

  if not found then
    raise exception 'Service not available';
  end if;

  if not exists (
    select 1 from staff_services ss
    where ss.staff_id = p_staff_id and ss.service_id = p_service_id
  ) then
    raise exception 'Staff member does not offer this service';
  end if;

  if p_start_time < now() + make_interval(mins => coalesce(v_min_notice, 0)) then
    raise exception 'Does not meet minimum booking notice';
  end if;

  v_date := (p_start_time at time zone v_tz)::date;
  v_today := (now() at time zone v_tz)::date;

  if v_date < v_today or v_date > v_today + coalesce(v_limit_days, 60) then
    raise exception 'Date is outside the booking window';
  end if;

  if is_location_holiday(p_business_id, v_location_id, v_date) then
    raise exception 'Business is closed on this date';
  end if;

  if is_staff_on_vacation(p_staff_id, v_date) then
    raise exception 'Staff member is on vacation or time off';
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

  if p_exclude_appointment_id is null and v_max_staff_day is not null then
    select count(*) into v_staff_day_count
    from appointments a
    where a.business_id = p_business_id
      and a.staff_id = p_staff_id
      and a.status not in ('cancelled')
      and (a.start_time at time zone v_tz)::date = v_date;
    if v_staff_day_count >= v_max_staff_day then
      raise exception 'Daily appointment limit has been reached';
    end if;
  end if;

  if p_exclude_appointment_id is null and v_max_service_day is not null then
    select count(*) into v_service_day_count
    from appointments a
    where a.business_id = p_business_id
      and a.service_id = p_service_id
      and a.status not in ('cancelled')
      and (a.start_time at time zone v_tz)::date = v_date;
    if v_service_day_count >= v_max_service_day then
      raise exception 'Daily appointment limit has been reached';
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
  v_block_end := p_end_time
    + make_interval(mins => coalesce(v_buf_after, 0))
    + make_interval(mins => coalesce(v_cleanup, 0));

  v_reason := availability_block_reason(
    p_business_id, v_location_id, p_staff_id, p_service_id,
    v_block_start, v_block_end, p_exclude_appointment_id, v_allow_double
  );

  if v_reason is not null then
    raise exception '%', v_reason;
  end if;
end;
$$;

grant execute on function availability_block_reason(uuid, uuid, uuid, uuid, timestamptz, timestamptz, uuid, boolean)
  to anon, authenticated;
grant execute on function get_available_slots(uuid, uuid, uuid, date, uuid, uuid) to anon, authenticated;
grant execute on function validate_appointment_slot(uuid, uuid, uuid, timestamptz, timestamptz, uuid, uuid)
  to anon, authenticated;

comment on function get_available_slots is
  'Phase 5.1 Availability Engine — authoritative slot starts for all channels.';
comment on function availability_block_reason is
  'Phase 5.1 conflict classifier for closures, blackouts, busy, and external calendars.';
