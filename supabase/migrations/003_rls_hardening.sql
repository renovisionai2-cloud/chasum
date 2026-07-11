-- Chasum Architecture Review: RLS hardening & tenant indexes
-- Run after 002_booking_enhancements.sql

-- ---------------------------------------------------------------------------
-- Tenant isolation indexes
-- ---------------------------------------------------------------------------

create index if not exists services_business_id_idx on services (business_id);
create index if not exists staff_business_id_idx on staff (business_id);
create index if not exists customers_business_id_idx on customers (business_id);
create index if not exists customers_business_email_idx on customers (business_id, email);
create index if not exists business_hours_business_id_idx on business_hours (business_id);
create index if not exists holidays_business_id_idx on holidays (business_id);
create index if not exists availability_business_id_idx on availability (business_id);
create index if not exists staff_working_hours_staff_id_idx on staff_working_hours (staff_id);
create index if not exists staff_vacations_staff_id_idx on staff_vacations (staff_id);

-- ---------------------------------------------------------------------------
-- Remove overly permissive public PII policies
-- ---------------------------------------------------------------------------

drop policy if exists "Public can view customers for booking lookup" on customers;
drop policy if exists "Public can create customers for booking" on customers;
drop policy if exists "Public can view appointments for availability" on appointments;
drop policy if exists "Public can create appointments" on appointments;

-- ---------------------------------------------------------------------------
-- SECURITY DEFINER RPCs for public booking (scoped by business_id)
-- ---------------------------------------------------------------------------

create or replace function get_public_appointments(
  p_business_id uuid,
  p_start timestamptz,
  p_end timestamptz
)
returns table (
  start_time timestamptz,
  end_time timestamptz,
  staff_id uuid,
  status appointment_status
)
language sql
stable
security definer
set search_path = public
as $$
  select a.start_time, a.end_time, a.staff_id, a.status
  from appointments a
  where a.business_id = p_business_id
    and a.status not in ('cancelled')
    and a.start_time >= p_start
    and a.start_time <= p_end;
$$;

create or replace function upsert_booking_customer(
  p_business_id uuid,
  p_name text,
  p_email text,
  p_phone text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  select id into v_id
  from customers
  where business_id = p_business_id
    and lower(email) = lower(p_email);

  if v_id is not null then
    update customers
    set name = p_name, phone = p_phone, updated_at = now()
    where id = v_id;
    return v_id;
  end if;

  insert into customers (business_id, name, email, phone)
  values (p_business_id, p_name, p_email, p_phone)
  returning id into v_id;

  return v_id;
end;
$$;

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
    select 1 from businesses where id = p_business_id
  ) then
    raise exception 'Business not found';
  end if;

  if not exists (
    select 1 from services
    where id = p_service_id
      and business_id = p_business_id
      and is_active = true
  ) then
    raise exception 'Service not available';
  end if;

  if not exists (
    select 1 from staff
    where id = p_staff_id
      and business_id = p_business_id
      and is_active = true
  ) then
    raise exception 'Staff not available';
  end if;

  if not exists (
    select 1 from customers
    where id = p_customer_id
      and business_id = p_business_id
  ) then
    raise exception 'Customer not found';
  end if;

  if exists (
    select 1 from appointments
    where business_id = p_business_id
      and staff_id = p_staff_id
      and status not in ('cancelled')
      and start_time < p_end_time
      and end_time > p_start_time
  ) then
    raise exception 'Time slot no longer available';
  end if;

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
end;
$$;

grant execute on function get_public_appointments(uuid, timestamptz, timestamptz) to anon, authenticated;
grant execute on function upsert_booking_customer(uuid, text, text, text) to anon, authenticated;
grant execute on function create_public_appointment(uuid, uuid, uuid, uuid, timestamptz, timestamptz, text) to anon, authenticated;
