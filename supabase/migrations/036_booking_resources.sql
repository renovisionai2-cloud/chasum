-- PREPARED ONLY — DO NOT APPLY without explicit approval.
-- Resource management for concurrent bookings (rooms, chairs, equipment).
-- Platform-wide; not industry-specific.

-- create table if not exists public.resources (
--   id uuid primary key default gen_random_uuid(),
--   business_id uuid not null references public.businesses(id) on delete cascade,
--   location_id uuid not null references public.locations(id) on delete cascade,
--   name text not null,
--   resource_type text not null,
--   description text,
--   is_active boolean not null default true,
--   capacity integer not null default 1 check (capacity >= 1),
--   color text,
--   sort_order integer not null default 0,
--   created_at timestamptz not null default now(),
--   updated_at timestamptz not null default now()
-- );

-- create table if not exists public.service_resource_requirements (
--   id uuid primary key default gen_random_uuid(),
--   business_id uuid not null references public.businesses(id) on delete cascade,
--   service_id uuid not null references public.services(id) on delete cascade,
--   resource_type text not null,
--   quantity integer not null default 1 check (quantity >= 1),
--   allow_automatic_assignment boolean not null default true,
--   allow_manual_selection boolean not null default true,
--   allow_assign_later boolean not null default false,
--   created_at timestamptz not null default now()
-- );

-- create table if not exists public.appointment_resources (
--   appointment_id uuid not null references public.appointments(id) on delete cascade,
--   resource_id uuid not null references public.resources(id) on delete restrict,
--   assignment_source text not null default 'automatic',
--   primary key (appointment_id, resource_id)
-- );

select 1;
