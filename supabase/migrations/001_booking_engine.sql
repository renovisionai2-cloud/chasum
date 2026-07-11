-- Chasum Phase 2: Core Booking Engine
-- Run this in the Supabase SQL Editor or via supabase db push

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  slug text unique not null,
  timezone text not null default 'America/New_York',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  name text not null,
  description text,
  duration_minutes integer not null check (duration_minutes > 0),
  price numeric(10, 2) not null default 0,
  color text not null default '#2563eb',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists staff (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  name text not null,
  email text,
  title text,
  color text not null default '#3b82f6',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists staff_services (
  staff_id uuid references staff(id) on delete cascade,
  service_id uuid references services(id) on delete cascade,
  primary key (staff_id, service_id)
);

create table if not exists business_hours (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  day_of_week integer not null check (day_of_week between 0 and 6),
  is_open boolean not null default true,
  open_time time not null default '09:00',
  close_time time not null default '17:00',
  unique (business_id, day_of_week)
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  name text not null,
  email text not null,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, email)
);

create type appointment_status as enum (
  'scheduled',
  'confirmed',
  'cancelled',
  'completed',
  'no_show'
);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  service_id uuid references services(id) on delete restrict not null,
  staff_id uuid references staff(id) on delete restrict not null,
  customer_id uuid references customers(id) on delete restrict not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status appointment_status not null default 'scheduled',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists appointments_business_start_idx
  on appointments (business_id, start_time);

create index if not exists appointments_staff_start_idx
  on appointments (staff_id, start_time);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table businesses enable row level security;
alter table services enable row level security;
alter table staff enable row level security;
alter table staff_services enable row level security;
alter table business_hours enable row level security;
alter table customers enable row level security;
alter table appointments enable row level security;

-- Helper: check if current user owns a business
create or replace function is_business_owner(bid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from businesses
    where id = bid and owner_id = auth.uid()
  );
$$;

-- Businesses
create policy "Owners manage their businesses"
  on businesses for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Public can view businesses"
  on businesses for select
  using (true);

-- Services
create policy "Owners manage services"
  on services for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

create policy "Public can view active services"
  on services for select
  using (is_active = true);

-- Staff
create policy "Owners manage staff"
  on staff for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

create policy "Public can view active staff"
  on staff for select
  using (is_active = true);

-- Staff services
create policy "Owners manage staff services"
  on staff_services for all
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

create policy "Public can view staff services"
  on staff_services for select
  using (true);

-- Business hours
create policy "Owners manage business hours"
  on business_hours for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

create policy "Public can view business hours"
  on business_hours for select
  using (true);

-- Customers
create policy "Owners manage customers"
  on customers for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

create policy "Public can create customers for booking"
  on customers for insert
  with check (true);

create policy "Public can view customers for booking lookup"
  on customers for select
  using (true);

-- Appointments
create policy "Owners manage appointments"
  on appointments for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

create policy "Public can create appointments"
  on appointments for insert
  with check (status in ('scheduled', 'confirmed'));

create policy "Public can view appointments for availability"
  on appointments for select
  using (status not in ('cancelled'));

-- ---------------------------------------------------------------------------
-- Updated-at trigger
-- ---------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger businesses_updated_at
  before update on businesses
  for each row execute function set_updated_at();

create trigger services_updated_at
  before update on services
  for each row execute function set_updated_at();

create trigger staff_updated_at
  before update on staff
  for each row execute function set_updated_at();

create trigger customers_updated_at
  before update on customers
  for each row execute function set_updated_at();

create trigger appointments_updated_at
  before update on appointments
  for each row execute function set_updated_at();
