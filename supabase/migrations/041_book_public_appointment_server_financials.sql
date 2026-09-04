-- P2-1: make book_public_appointment server-authoritative for commercial amounts.
-- Replaces the 040 function body. Same signature (PostgREST compatibility).
-- Caller p_price_cents / p_tax_cents / p_deposit_cents are accepted and IGNORED.
-- Persisted financials are derived from services + tax_rates, mirroring
-- lib/commerce/booking-financials.ts resolveBookingFinancials.
-- Does NOT alter appointments RLS, FORCE RLS, table grants, or default privileges.
-- Does NOT drop create_public_appointment / upsert_booking_customer / validate_appointment_slot.
-- NOT APPLIED in the implementation task that introduced this file.

create or replace function book_public_appointment(
  p_business_id uuid,
  p_location_id uuid,
  p_service_id uuid,
  p_staff_id uuid,
  p_customer_name text,
  p_customer_email text,
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_status text,
  p_customer_phone text default null,
  p_price_cents integer default 0,
  p_tax_cents integer default 0,
  p_deposit_cents integer default 0,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_customer_id uuid;
  v_status appointment_status;
  v_payment_status text;
  v_price integer;
  v_tax integer;
  v_deposit integer;
  v_service_price numeric(10, 2);
  v_service_deposit_cents integer;
  v_service_deposit_required boolean;
  v_service_tax_bps integer;
  v_catalog_cents integer;
  v_catalog_rate_bps integer;
  v_catalog_inclusive boolean;
  v_rate_bps integer;
  v_inclusive boolean;
begin
  -- p_price_cents, p_tax_cents, and p_deposit_cents are signature-compatible
  -- leftovers from 040. They are intentionally unused and must never be persisted.

  if p_business_id is null then
    raise exception 'Business not found';
  end if;

  if p_staff_id is null then
    raise exception 'Staff is required for public booking';
  end if;

  if p_start_time is null or p_end_time is null or p_end_time <= p_start_time then
    raise exception 'Invalid appointment time range';
  end if;

  if p_customer_name is null or length(trim(p_customer_name)) = 0 then
    raise exception 'Customer name is required';
  end if;

  if p_customer_email is null or position('@' in p_customer_email) = 0 then
    raise exception 'Customer email is required';
  end if;

  -- Enum-safe: never assign a text variable into appointment_status.
  -- Public callers may request only pending or confirmed.
  if p_status is null or lower(trim(p_status)) not in ('pending', 'confirmed') then
    raise exception 'Public booking status must be pending or confirmed';
  end if;

  if lower(trim(p_status)) = 'pending' then
    v_status := 'pending'::appointment_status;
  else
    v_status := 'confirmed'::appointment_status;
  end if;

  if not exists (
    select 1 from businesses where id = p_business_id
  ) then
    raise exception 'Business not found';
  end if;

  if not exists (
    select 1 from locations
    where id = p_location_id
      and business_id = p_business_id
  ) then
    raise exception 'Location not found';
  end if;

  select
    s.price,
    coalesce(s.deposit_cents, 0),
    coalesce(s.deposit_required, false),
    coalesce(s.tax_rate_bps, 0)
  into
    v_service_price,
    v_service_deposit_cents,
    v_service_deposit_required,
    v_service_tax_bps
  from services s
  where s.id = p_service_id
    and s.business_id = p_business_id
    and s.is_active = true
    and coalesce(s.online_booking, true) is not false;

  if not found then
    raise exception 'Service not available';
  end if;

  if not exists (
    select 1 from staff
    where id = p_staff_id
      and business_id = p_business_id
      and is_active = true
      and accept_online_bookings is not false
  ) then
    raise exception 'Staff not available';
  end if;

  if exists (
    select 1 from staff
    where id = p_staff_id
      and location_id is not null
      and location_id is distinct from p_location_id
  ) then
    raise exception 'Staff not available';
  end if;

  if not exists (
    select 1 from staff_services
    where staff_id = p_staff_id
      and service_id = p_service_id
  ) then
    raise exception 'Staff member does not offer this service';
  end if;

  v_customer_id := upsert_booking_customer(
    p_business_id,
    trim(p_customer_name),
    trim(p_customer_email),
    nullif(trim(coalesce(p_customer_phone, '')), '')
  );

  if v_customer_id is null then
    raise exception 'Failed to save customer details';
  end if;

  if not exists (
    select 1 from customers
    where id = v_customer_id
      and business_id = p_business_id
  ) then
    raise exception 'Customer not found';
  end if;

  perform validate_appointment_slot(
    p_business_id,
    p_service_id,
    p_staff_id,
    p_start_time,
    p_end_time,
    null,
    p_location_id
  );

  -- Canonical catalog cents from services.price (dollars → cents).
  -- Mirrors Math.round(Number(service.price) * 100) in Booking Engine / public preview.
  v_catalog_cents := greatest(round(coalesce(v_service_price, 0) * 100)::integer, 0);

  -- Active tax rate: default flag first, then name (mirrors booking-pricing.ts).
  select r.rate_bps, r.inclusive
  into v_catalog_rate_bps, v_catalog_inclusive
  from tax_rates r
  where r.business_id = p_business_id
    and coalesce(r.is_active, true) is not false
  order by r.is_default desc, r.name asc
  limit 1;

  if not found then
    v_catalog_rate_bps := 0;
    v_catalog_inclusive := false;
  end if;

  if coalesce(v_service_tax_bps, 0) > 0 then
    v_rate_bps := v_service_tax_bps;
    v_inclusive := coalesce(v_catalog_inclusive, false);
  elsif coalesce(v_catalog_rate_bps, 0) > 0 then
    v_rate_bps := v_catalog_rate_bps;
    v_inclusive := coalesce(v_catalog_inclusive, false);
  else
    v_rate_bps := 0;
    v_inclusive := false;
  end if;

  -- Exclusive: price_cents = catalog, tax_cents = round(catalog * bps / 10000).
  -- Inclusive: tax extracted from catalog; appointment total stays catalog.
  if v_rate_bps > 0 then
    if v_inclusive then
      v_tax := round((v_catalog_cents::numeric * v_rate_bps) / (10000 + v_rate_bps))::integer;
      v_price := greatest(v_catalog_cents - v_tax, 0);
    else
      v_price := v_catalog_cents;
      v_tax := round((v_catalog_cents::numeric * v_rate_bps) / 10000)::integer;
    end if;
  else
    v_price := v_catalog_cents;
    v_tax := 0;
  end if;

  -- Explicit deposit_cents wins. Percentage fallback only when deposit_required
  -- and no fixed cents. 20% of appointment total (price + tax), never of tax alone.
  if coalesce(v_service_deposit_cents, 0) > 0 then
    v_deposit := v_service_deposit_cents;
  elsif v_service_deposit_required then
    v_deposit := round((greatest(v_price + v_tax, 0)::numeric) * 0.2)::integer;
  else
    v_deposit := 0;
  end if;

  v_payment_status := case
    when v_deposit > 0 then 'deposit_required'
    else 'unpaid'
  end;

  insert into appointments (
    business_id,
    location_id,
    service_id,
    staff_id,
    customer_id,
    start_time,
    end_time,
    status,
    notes,
    price_cents,
    tax_cents,
    deposit_cents,
    amount_paid_cents,
    payment_status
  )
  values (
    p_business_id,
    p_location_id,
    p_service_id,
    p_staff_id,
    v_customer_id,
    p_start_time,
    p_end_time,
    v_status,
    p_notes,
    nullif(v_price, 0),
    v_tax,
    v_deposit,
    0,
    v_payment_status
  )
  returning id into v_id;

  return v_id;
exception
  when exclusion_violation then
    raise exception 'Time slot no longer available';
end;
$$;

revoke all on function book_public_appointment(
  uuid, uuid, uuid, uuid, text, text, timestamptz, timestamptz, text, text, integer, integer, integer, text
) from public;

grant execute on function book_public_appointment(
  uuid, uuid, uuid, uuid, text, text, timestamptz, timestamptz, text, text, integer, integer, integer, text
) to anon, authenticated;

comment on function book_public_appointment(
  uuid, uuid, uuid, uuid, text, text, timestamptz, timestamptz, text, text, integer, integer, integer, text
) is
  'Narrow SECURITY DEFINER writer for unauthenticated public named-staff booking. Revalidates tenant relationships, upserts the customer, and inserts the appointment in one transaction. Persisted price/tax/deposit are derived from services and tax_rates; caller commercial arguments are ignored. Does not weaken appointments RLS.';
