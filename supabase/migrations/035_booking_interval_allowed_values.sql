-- Booking time interval: document allowed values on existing columns.
-- Field name remains appointment_interval_minutes (businesses + location_settings).
-- Do NOT apply to the shared production Supabase project until approved.
-- Migration 034 must remain unapplied.

-- Forward: constrain to platform-supported booking grid intervals.
-- Existing rows with other values are normalized to the nearest allowed option
-- before the check is added (30 stays 30; atypical values snap to nearest).

update businesses
set appointment_interval_minutes = case
  when appointment_interval_minutes <= 7 then 5
  when appointment_interval_minutes <= 12 then 10
  when appointment_interval_minutes <= 17 then 15
  when appointment_interval_minutes <= 25 then 20
  when appointment_interval_minutes <= 37 then 30
  when appointment_interval_minutes <= 52 then 45
  else 60
end
where appointment_interval_minutes is not null
  and appointment_interval_minutes not in (5, 10, 15, 20, 30, 45, 60);

update location_settings
set appointment_interval_minutes = case
  when appointment_interval_minutes <= 7 then 5
  when appointment_interval_minutes <= 12 then 10
  when appointment_interval_minutes <= 17 then 15
  when appointment_interval_minutes <= 25 then 20
  when appointment_interval_minutes <= 37 then 30
  when appointment_interval_minutes <= 52 then 45
  else 60
end
where appointment_interval_minutes is not null
  and appointment_interval_minutes not in (5, 10, 15, 20, 30, 45, 60);

alter table businesses
  drop constraint if exists businesses_appointment_interval_minutes_check;

alter table businesses
  add constraint businesses_appointment_interval_minutes_check
  check (appointment_interval_minutes in (5, 10, 15, 20, 30, 45, 60));

alter table location_settings
  drop constraint if exists location_settings_appointment_interval_minutes_check;

alter table location_settings
  add constraint location_settings_appointment_interval_minutes_check
  check (appointment_interval_minutes in (5, 10, 15, 20, 30, 45, 60));

comment on column businesses.appointment_interval_minutes is
  'Booking time interval (minutes): how often start times are offered. Allowed: 5,10,15,20,30,45,60.';

comment on column location_settings.appointment_interval_minutes is
  'Location booking time interval; overrides business when set. Used by get_available_slots.';

-- Rollback:
-- alter table businesses drop constraint if exists businesses_appointment_interval_minutes_check;
-- alter table location_settings drop constraint if exists location_settings_appointment_interval_minutes_check;
-- (Data values remain; comments can be left in place.)
