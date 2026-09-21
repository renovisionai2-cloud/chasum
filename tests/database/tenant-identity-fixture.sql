-- Synthetic subset of the existing schema, NEVER a governed environment fixture.
create role anon;
create role authenticated;
create role service_role bypassrls;
create schema auth;
create table auth.users(id uuid primary key, email_confirmed_at timestamptz, is_anonymous boolean default false, banned_until timestamptz, raw_app_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema public, auth to anon, authenticated, service_role;
grant execute on function auth.uid() to public;
create table public.businesses(
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id),
 name text not null, legal_name text, slug text not null unique, email text, phone text, website text,
 city text, state text, country text default 'US', timezone text default 'America/New_York',
 private_alpha_enabled boolean not null default false, appointment_interval_minutes integer default 30,
 booking_limit_days integer default 60, max_daily_bookings integer, cancellation_policy text,
 subscription_plan_key text default 'starter', created_at timestamptz default now()
);
create unique index businesses_one_per_owner_idx on public.businesses(owner_id);
create table public.business_members(id uuid default gen_random_uuid(), business_id uuid references public.businesses, user_id uuid references auth.users, role text, created_at timestamptz default now(), unique(business_id,user_id));
create table public.business_hours(business_id uuid references public.businesses,day_of_week integer,is_open boolean,open_time time,close_time time,unique(business_id,day_of_week));
create table public.locations(id uuid primary key default gen_random_uuid(),business_id uuid references public.businesses,name text,slug text,timezone text,is_default boolean,is_active boolean,city text,state text,phone text,unique(business_id,slug));
create table public.location_settings(location_id uuid primary key references public.locations,appointment_interval_minutes integer,booking_limit_days integer,max_daily_bookings integer,cancellation_policy text);
create table public.location_hours(location_id uuid references public.locations,day_of_week integer,is_open boolean,open_time time,close_time time);
create table public.platform_admins(user_id uuid primary key references auth.users);
alter table public.businesses enable row level security;
create policy "Public can view businesses" on public.businesses for select using(true);
-- Model baseline API grants; migration must close creation despite these grants.
grant all on all tables in schema public to anon,authenticated,service_role;
alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
