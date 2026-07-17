-- Chasum Services Module Foundation (Phase 4 Step 3)
-- Additive only. Does not change public booking RPC signatures.

-- ---------------------------------------------------------------------------
-- Service catalog extensions
-- ---------------------------------------------------------------------------

alter table services
  add column if not exists cleanup_minutes integer not null default 0;

alter table services
  add column if not exists sort_order integer not null default 0;

alter table services
  add column if not exists taxable boolean not null default true;

alter table services
  add column if not exists deposit_required boolean not null default false;

alter table services
  add column if not exists booking_visibility text not null default 'online';

alter table services
  add column if not exists confirmation_mode text not null default 'inherit';

alter table services
  add column if not exists online_payment_required boolean not null default false;

alter table services
  add column if not exists max_appointments_per_day integer;

alter table services
  add column if not exists min_booking_notice_minutes integer;

alter table services
  add column if not exists max_booking_days_ahead integer;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'services_booking_visibility_check'
  ) then
    alter table services
      add constraint services_booking_visibility_check
      check (booking_visibility in ('online', 'hidden', 'internal'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'services_confirmation_mode_check'
  ) then
    alter table services
      add constraint services_confirmation_mode_check
      check (confirmation_mode in ('inherit', 'auto_confirm', 'require_approval'));
  end if;
end $$;

-- Backfill visibility from online_booking
update services
set booking_visibility = 'hidden'
where online_booking = false
  and booking_visibility = 'online';

update services
set deposit_required = true
where coalesce(deposit_cents, 0) > 0
  and deposit_required = false;

create index if not exists services_business_sort_idx
  on services (business_id, sort_order, name);

-- ---------------------------------------------------------------------------
-- Per-employee price override
-- ---------------------------------------------------------------------------

alter table staff_services
  add column if not exists price_override numeric(10, 2);

-- ---------------------------------------------------------------------------
-- Multi-location assignment (primary location_id remains for RPC compatibility)
-- ---------------------------------------------------------------------------

create table if not exists service_locations (
  service_id uuid not null references services (id) on delete cascade,
  location_id uuid not null references locations (id) on delete cascade,
  is_primary boolean not null default false,
  primary key (service_id, location_id)
);

create index if not exists service_locations_location_idx
  on service_locations (location_id);

alter table service_locations enable row level security;

drop policy if exists "Owners manage service locations" on service_locations;
create policy "Owners manage service locations"
  on service_locations for all
  using (
    exists (
      select 1 from services s
      where s.id = service_id and is_business_owner(s.business_id)
    )
  )
  with check (
    exists (
      select 1 from services s
      where s.id = service_id and is_business_owner(s.business_id)
    )
  );

-- Seed primary location from services.location_id
insert into service_locations (service_id, location_id, is_primary)
select s.id, s.location_id, true
from services s
where s.location_id is not null
on conflict (service_id, location_id) do nothing;

-- ---------------------------------------------------------------------------
-- Per-service blackout periods
-- ---------------------------------------------------------------------------

create table if not exists service_blackouts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  service_id uuid not null references services (id) on delete cascade,
  location_id uuid references locations (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index if not exists service_blackouts_service_idx
  on service_blackouts (service_id, starts_at);

alter table service_blackouts enable row level security;

drop policy if exists "Owners manage service blackouts" on service_blackouts;
create policy "Owners manage service blackouts"
  on service_blackouts for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

-- ---------------------------------------------------------------------------
-- Seed example categories for businesses that have none
-- ---------------------------------------------------------------------------

insert into service_categories (business_id, name, icon, color, sort_order)
select b.id, c.name, c.icon, c.color, c.sort_order
from businesses b
cross join (
  values
    ('Medical', 'stethoscope', '#2563EB', 0),
    ('Massage', 'sparkles', '#7C3AED', 1),
    ('Hair', 'scissors', '#DB2777', 2),
    ('Automotive', 'wrench', '#EA580C', 3),
    ('Photography', 'camera', '#0891B2', 4),
    ('Cleaning', 'sparkle', '#16A34A', 5),
    ('General', 'layers', '#64748B', 6)
) as c(name, icon, color, sort_order)
where not exists (
  select 1 from service_categories sc where sc.business_id = b.id
)
on conflict (business_id, name) do nothing;
