-- Optional employee assignment on appointments.
-- Unassigned bookings store staff_id as NULL and remain visible on the calendar.
-- Historical rows keep their existing staff_id values.

alter table appointments
  alter column staff_id drop not null;

-- GiST exclusion already treats NULL staff_id as non-equal (no mutual conflict).
-- Recreate for clarity after nullability change.
alter table appointments
  drop constraint if exists appointments_staff_no_overlap;

alter table appointments
  add constraint appointments_staff_no_overlap
  exclude using gist (
    staff_id with =,
    tstzrange(start_time, end_time, '[)') with &&
  )
  where (status not in ('cancelled') and staff_id is not null);

comment on column appointments.staff_id is
  'Assigned employee; NULL means unassigned / assign later.';
