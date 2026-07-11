-- Chasum Phase 2 Enhancement Migration
-- Run after 001_booking_engine.sql

-- ---------------------------------------------------------------------------
-- Extend businesses
-- ---------------------------------------------------------------------------

alter table businesses
  add column if not exists appointment_interval_minutes integer not null default 30,
  add column if not exists booking_limit_days integer not null default 60,
  add column if not exists cancellation_policy text,
  add column if not exists max_daily_bookings integer;

-- ---------------------------------------------------------------------------
-- Extend services
-- ---------------------------------------------------------------------------

alter table services
  add column if not exists category text,
  add column if not exists buffer_before_minutes integer not null default 0,
  add column if not exists buffer_after_minutes integer not null default 0;

-- ---------------------------------------------------------------------------
-- Extend staff
-- ---------------------------------------------------------------------------

alter table staff
  add column if not exists photo_url text;

-- ---------------------------------------------------------------------------
-- Extend customers
-- ---------------------------------------------------------------------------

alter table customers
  add column if not exists tags text[] not null default '{}';

-- ---------------------------------------------------------------------------
-- Add pending status
-- ---------------------------------------------------------------------------

alter type appointment_status add value if not exists 'pending';

-- ---------------------------------------------------------------------------
-- Staff working hours
-- ---------------------------------------------------------------------------

create table if not exists staff_working_hours (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references staff(id) on delete cascade not null,
  day_of_week integer not null check (day_of_week between 0 and 6),
  is_working boolean not null default true,
  start_time time not null default '09:00',
  end_time time not null default '17:00',
  unique (staff_id, day_of_week)
);

-- ---------------------------------------------------------------------------
-- Staff vacations
-- ---------------------------------------------------------------------------

create table if not exists staff_vacations (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references staff(id) on delete cascade not null,
  start_date date not null,
  end_date date not null,
  reason text,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

-- ---------------------------------------------------------------------------
-- Business holidays
-- ---------------------------------------------------------------------------

create table if not exists holidays (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  name text not null,
  date date not null,
  is_recurring boolean not null default false,
  created_at timestamptz not null default now(),
  unique (business_id, date)
);

-- ---------------------------------------------------------------------------
-- Availability overrides (blocked or extra hours)
-- ---------------------------------------------------------------------------

create table if not exists availability (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  staff_id uuid references staff(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  is_available boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);

create index if not exists availability_staff_time_idx
  on availability (staff_id, start_time);

-- ---------------------------------------------------------------------------
-- RLS for new tables
-- ---------------------------------------------------------------------------

alter table staff_working_hours enable row level security;
alter table staff_vacations enable row level security;
alter table holidays enable row level security;
alter table availability enable row level security;

create policy "Owners manage staff working hours"
  on staff_working_hours for all
  using (
    exists (
      select 1 from staff s
      where s.id = staff_id and is_business_owner(s.business_id)
    )
  )
  with check (
    exists (
      select 1 from staff s
      where s.id = staff_id and is_business_owner(s.business_id)
    )
  );

create policy "Public can view staff working hours"
  on staff_working_hours for select using (true);

create policy "Owners manage staff vacations"
  on staff_vacations for all
  using (
    exists (
      select 1 from staff s
      where s.id = staff_id and is_business_owner(s.business_id)
    )
  )
  with check (
    exists (
      select 1 from staff s
      where s.id = staff_id and is_business_owner(s.business_id)
    )
  );

create policy "Public can view staff vacations"
  on staff_vacations for select using (true);

create policy "Owners manage holidays"
  on holidays for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

create policy "Public can view holidays"
  on holidays for select using (true);

create policy "Owners manage availability"
  on availability for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

create policy "Public can view availability"
  on availability for select using (true);
