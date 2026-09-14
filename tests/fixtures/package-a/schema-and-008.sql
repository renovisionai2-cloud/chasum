-- DISPOSABLE LOCAL DATABASE ONLY. Captured column types/helpers and selected constraints.
-- No Production row data. Not a complete RLS/FK/trigger replica.
CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;

CREATE EXTENSION btree_gist;

CREATE TYPE appointment_status AS ENUM ('scheduled','confirmed','cancelled','completed','no_show','pending','arrived','waiting','in_progress');

CREATE TYPE calendar_provider AS ENUM ('google','outlook','apple');

CREATE TYPE delivery_status AS ENUM ('pending','sent','failed','skipped');

CREATE TYPE job_status AS ENUM ('pending','processing','completed','failed','cancelled','retrying');

CREATE TYPE job_type AS ENUM ('email','sms','calendar_sync','webhook','reminder','recurring','waitlist_notify');

CREATE TYPE notification_channel AS ENUM ('email','sms','in_app');

CREATE TYPE notification_type AS ENUM ('confirmation','reminder','cancellation','reschedule','staff','business','waitlist');

CREATE TYPE recurrence_frequency AS ENUM ('daily','weekly','biweekly','monthly','yearly');

CREATE TYPE waitlist_status AS ENUM ('waiting','notified','booked','cancelled');

CREATE TABLE appointments ("id" uuid, "business_id" uuid, "service_id" uuid, "staff_id" uuid, "customer_id" uuid, "start_time" timestamptz, "end_time" timestamptz, "status" appointment_status, "notes" text, "created_at" timestamptz, "updated_at" timestamptz, "recurring_rule_id" uuid, "external_event_id" text, "location_id" uuid, "room_id" uuid, "color" text, "price_cents" int4, "tax_cents" int4, "discount_cents" int4, "deposit_cents" int4, "invoice_number" text, "internal_notes" text, "custom_fields" jsonb, "travel_minutes" int4, "timezone" text, "payment_status" text, "amount_paid_cents" int4, "amount_refunded_cents" int4);

CREATE TABLE availability ("id" uuid, "business_id" uuid, "staff_id" uuid, "start_time" timestamptz, "end_time" timestamptz, "is_available" bool, "notes" text, "created_at" timestamptz, "location_id" uuid);

CREATE TABLE business_closures ("id" uuid, "business_id" uuid, "location_id" uuid, "closure_type" text, "name" text, "starts_at" timestamptz, "ends_at" timestamptz, "open_time" time, "close_time" time, "is_recurring" bool, "notes" text, "created_at" timestamptz);

CREATE TABLE businesses ("id" uuid, "owner_id" uuid, "name" text, "slug" text, "timezone" text, "created_at" timestamptz, "updated_at" timestamptz, "appointment_interval_minutes" int4, "booking_limit_days" int4, "cancellation_policy" text, "max_daily_bookings" int4, "email_notifications_enabled" bool, "sms_notifications_enabled" bool, "reminder_hours_before" int4, "notification_email" text, "subscription_plan_key" text, "logo_url" text, "phone" text, "email" text, "website" text, "address_line1" text, "address_line2" text, "city" text, "state" text, "postal_code" text, "country" text, "booking_policy" text, "social_links" jsonb, "cover_url" text, "public_booking_mode" text, "booking_invite_code" text, "description" text, "subscription_status" text, "trial_starts_at" timestamptz, "trial_ends_at" timestamptz, "stripe_customer_id" text, "stripe_subscription_id" text, "billing_interval" text, "current_period_start" timestamptz, "current_period_end" timestamptz, "cancel_at_period_end" bool, "canceled_at" timestamptz, "industry" text, "tax_number" text, "currency" text, "legal_name" text, "business_type" text, "language" text, "favicon_url" text, "brand_color" text, "accent_color" text, "email_signature" text, "booking_page_branding" jsonb, "min_notice_minutes" int4, "cancellation_window_hours" int4, "reschedule_policy" text, "allow_double_booking" bool, "waitlist_enabled" bool, "online_booking_enabled" bool, "booking_confirmation_mode" text, "owner_notifications_enabled" bool, "staff_notifications_enabled" bool, "ai_settings" jsonb, "appointment_status_workflow" jsonb, "private_alpha_enabled" bool, "offer_id" uuid, "marketing_email_enabled" bool, "quiet_hours_start" time, "quiet_hours_end" time, "communications_opt_out_footer" text);

CREATE TABLE calendar_connections ("id" uuid, "business_id" uuid, "staff_id" uuid, "provider" calendar_provider, "provider_account_id" text, "provider_calendar_id" text, "calendar_name" text, "access_token" text, "refresh_token" text, "token_expires_at" timestamptz, "sync_token" text, "ics_secret" text, "sync_enabled" bool, "sync_direction" text, "last_synced_at" timestamptz, "created_at" timestamptz, "updated_at" timestamptz);

CREATE TABLE external_events ("id" uuid, "calendar_connection_id" uuid, "appointment_id" uuid, "external_event_id" text, "title" text, "start_time" timestamptz, "end_time" timestamptz, "is_busy" bool, "raw_data" jsonb, "created_at" timestamptz, "updated_at" timestamptz);

CREATE TABLE holidays ("id" uuid, "business_id" uuid, "name" text, "date" date, "is_recurring" bool, "created_at" timestamptz, "location_id" uuid);

CREATE TABLE location_hour_segments ("id" uuid, "location_id" uuid, "day_of_week" int4, "open_time" time, "close_time" time, "sort_order" int4);

CREATE TABLE location_hours ("id" uuid, "location_id" uuid, "day_of_week" int4, "is_open" bool, "open_time" time, "close_time" time);

CREATE TABLE location_settings ("location_id" uuid, "appointment_interval_minutes" int4, "booking_limit_days" int4, "max_daily_bookings" int4, "cancellation_policy" text, "metadata" jsonb, "created_at" timestamptz, "updated_at" timestamptz, "min_booking_notice_minutes" int4, "default_travel_minutes" int4, "timezone" text);

CREATE TABLE locations ("id" uuid, "business_id" uuid, "name" text, "slug" text, "timezone" text, "is_default" bool, "is_active" bool, "address_line1" text, "address_line2" text, "city" text, "state" text, "postal_code" text, "phone" text, "metadata" jsonb, "created_at" timestamptz, "updated_at" timestamptz);

CREATE TABLE service_blackouts ("id" uuid, "business_id" uuid, "service_id" uuid, "location_id" uuid, "starts_at" timestamptz, "ends_at" timestamptz, "reason" text, "created_at" timestamptz);

CREATE TABLE service_locations ("service_id" uuid, "location_id" uuid, "is_primary" bool);

CREATE TABLE services ("id" uuid, "business_id" uuid, "name" text, "description" text, "duration_minutes" int4, "price" numeric, "color" text, "is_active" bool, "created_at" timestamptz, "updated_at" timestamptz, "category" text, "buffer_before_minutes" int4, "buffer_after_minutes" int4, "location_id" uuid, "online_booking" bool, "preparation_instructions" text, "internal_notes" text, "cancellation_policy" text, "category_id" uuid, "image_url" text, "tax_rate_bps" int4, "deposit_cents" int4, "custom_fields" jsonb, "cleanup_minutes" int4, "sort_order" int4, "taxable" bool, "deposit_required" bool, "booking_visibility" text, "confirmation_mode" text, "online_payment_required" bool, "max_appointments_per_day" int4, "min_booking_notice_minutes" int4, "max_booking_days_ahead" int4);

CREATE TABLE staff ("id" uuid, "business_id" uuid, "name" text, "email" text, "title" text, "color" text, "is_active" bool, "created_at" timestamptz, "updated_at" timestamptz, "photo_url" text, "location_id" uuid, "biography" text, "qualifications" text, "phone" text, "department_id" uuid, "employment_status" text, "role_key" text, "permissions" jsonb, "hire_date" date, "termination_date" date, "notes" text, "emergency_contact_name" text, "emergency_contact_phone" text, "emergency_contact_relationship" text, "pay_type" text, "hourly_rate_cents" int4, "salary_cents" int4, "commission_rate_bps" int4, "payroll_notes" text, "user_id" uuid, "first_name" text, "last_name" text, "preferred_name" text, "custom_role_id" uuid, "max_appointments_per_day" int4, "min_break_minutes" int4, "buffer_before_minutes" int4, "buffer_after_minutes" int4, "accept_online_bookings" bool, "accept_new_clients" bool, "accept_walk_ins" bool, "priority_scheduling" int4, "overtime_eligible" bool, "default_location_id" uuid);

CREATE TABLE staff_closures ("id" uuid, "business_id" uuid, "staff_id" uuid, "location_id" uuid, "starts_at" timestamptz, "ends_at" timestamptz, "reason" text, "created_at" timestamptz);

CREATE TABLE staff_hour_segments ("id" uuid, "staff_id" uuid, "day_of_week" int4, "start_time" time, "end_time" time, "segment_type" text, "sort_order" int4, "created_at" timestamptz);

CREATE TABLE staff_services ("staff_id" uuid, "service_id" uuid, "price_override" numeric, "duration_override_minutes" int4);

CREATE TABLE staff_vacations ("id" uuid, "staff_id" uuid, "start_date" date, "end_date" date, "reason" text, "created_at" timestamptz, "kind" text);

CREATE TABLE staff_working_hours ("id" uuid, "staff_id" uuid, "day_of_week" int4, "is_working" bool, "start_time" time, "end_time" time, "lunch_start_time" time, "lunch_end_time" time, "overtime_eligible" bool);

ALTER TABLE appointments ADD CONSTRAINT appointments_payment_status_check CHECK ((payment_status = ANY (ARRAY['unpaid'::text, 'deposit_required'::text, 'deposit_paid'::text, 'partially_paid'::text, 'fully_paid'::text, 'refunded'::text, 'voided'::text])));

ALTER TABLE appointments ADD CONSTRAINT appointments_staff_no_overlap EXCLUDE USING gist (staff_id WITH =, tstzrange(start_time, end_time, '[)'::text) WITH &&) WHERE ((status <> 'cancelled'::appointment_status));

ALTER TABLE business_closures ADD CONSTRAINT business_closures_check CHECK ((ends_at > starts_at));

ALTER TABLE business_closures ADD CONSTRAINT business_closures_closure_type_check CHECK ((closure_type = ANY (ARRAY['holiday'::text, 'vacation'::text, 'temporary'::text, 'special_hours'::text])));

ALTER TABLE staff_hour_segments ADD CONSTRAINT staff_hour_segments_check CHECK ((end_time > start_time));

ALTER TABLE staff_hour_segments ADD CONSTRAINT staff_hour_segments_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6)));

ALTER TABLE staff_hour_segments ADD CONSTRAINT staff_hour_segments_segment_type_check CHECK ((segment_type = ANY (ARRAY['work'::text, 'lunch'::text, 'break'::text])));

CREATE OR REPLACE FUNCTION public.is_location_holiday(p_business_id uuid, p_location_id uuid, p_date date)
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.is_staff_on_vacation(p_staff_id uuid, p_date date)
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
  select exists (
    select 1
    from staff_vacations sv
    where sv.staff_id = p_staff_id
      and p_date between sv.start_date and sv.end_date
  );
$function$
;

CREATE OR REPLACE FUNCTION public.resolve_location_id(p_business_id uuid, p_location_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE
AS $function$
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
$function$
;

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
$function$
;

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
$function$
;

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
$function$
;

GRANT EXECUTE ON FUNCTION public.get_available_slots(p_business_id uuid, p_service_id uuid, p_staff_id uuid, p_date date, p_exclude_appointment_id uuid, p_location_id uuid) TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.slot_is_blocked(p_business_id uuid, p_location_id uuid, p_staff_id uuid, p_block_start timestamp with time zone, p_block_end timestamp with time zone, p_exclude_appointment_id uuid) TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.validate_appointment_slot(p_business_id uuid, p_service_id uuid, p_staff_id uuid, p_start_time timestamp with time zone, p_end_time timestamp with time zone, p_exclude_appointment_id uuid, p_location_id uuid) TO anon, authenticated, service_role;