-- Chasum Employees Module Foundation (Phase 4 Step 4)
-- Additive only. Does not change booking RPC signatures.

-- ---------------------------------------------------------------------------
-- Identity: first / last / preferred display name
-- ---------------------------------------------------------------------------

alter table staff
  add column if not exists first_name text;

alter table staff
  add column if not exists last_name text;

alter table staff
  add column if not exists preferred_name text;

-- Backfill from existing display name (best-effort)
update staff
set
  first_name = coalesce(
    nullif(trim(first_name), ''),
    nullif(split_part(trim(name), ' ', 1), '')
  ),
  last_name = coalesce(
    nullif(trim(last_name), ''),
    nullif(
      trim(substring(trim(name) from length(split_part(trim(name), ' ', 1)) + 1)),
      ''
    )
  )
where coalesce(trim(name), '') <> '';

-- ---------------------------------------------------------------------------
-- Roles: expand catalog + custom roles
-- ---------------------------------------------------------------------------

alter table staff drop constraint if exists staff_role_key_check;

alter table staff
  add constraint staff_role_key_check
  check (role_key in (
    'owner',
    'admin',
    'manager',
    'receptionist',
    'employee',
    'staff',
    'contractor',
    'custom'
  ));

create table if not exists custom_roles (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  key text not null,
  label text not null,
  description text,
  permissions jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, key)
);

create index if not exists custom_roles_business_idx
  on custom_roles (business_id, sort_order);

alter table custom_roles enable row level security;

drop policy if exists "Owners manage custom roles" on custom_roles;
create policy "Owners manage custom roles"
  on custom_roles for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

drop trigger if exists custom_roles_updated_at on custom_roles;
create trigger custom_roles_updated_at
  before update on custom_roles
  for each row execute function set_updated_at();

alter table staff
  add column if not exists custom_role_id uuid references custom_roles (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Booking rules (per employee; calendar engine consumes later)
-- ---------------------------------------------------------------------------

alter table staff
  add column if not exists max_appointments_per_day integer;

alter table staff
  add column if not exists min_break_minutes integer not null default 0;

alter table staff
  add column if not exists buffer_before_minutes integer not null default 0;

alter table staff
  add column if not exists buffer_after_minutes integer not null default 0;

alter table staff
  add column if not exists accept_online_bookings boolean not null default true;

alter table staff
  add column if not exists accept_new_clients boolean not null default true;

alter table staff
  add column if not exists accept_walk_ins boolean not null default true;

alter table staff
  add column if not exists priority_scheduling integer not null default 0;

alter table staff
  add column if not exists overtime_eligible boolean not null default false;

alter table staff
  add column if not exists default_location_id uuid references locations (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Service assignment: duration override (price_override from 024)
-- ---------------------------------------------------------------------------

alter table staff_services
  add column if not exists duration_override_minutes integer;

-- ---------------------------------------------------------------------------
-- Working hours depth: lunch + overtime on weekly row; split segments
-- ---------------------------------------------------------------------------

alter table staff_working_hours
  add column if not exists lunch_start_time time;

alter table staff_working_hours
  add column if not exists lunch_end_time time;

alter table staff_working_hours
  add column if not exists overtime_eligible boolean not null default false;

create table if not exists staff_hour_segments (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references staff (id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  segment_type text not null default 'work'
    check (segment_type in ('work', 'lunch', 'break')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);

create index if not exists staff_hour_segments_staff_day_idx
  on staff_hour_segments (staff_id, day_of_week, sort_order);

alter table staff_hour_segments enable row level security;

drop policy if exists "Owners manage staff hour segments" on staff_hour_segments;
create policy "Owners manage staff hour segments"
  on staff_hour_segments for all
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

-- Vacation / time-off kind
alter table staff_vacations
  add column if not exists kind text not null default 'vacation';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'staff_vacations_kind_check'
  ) then
    alter table staff_vacations
      add constraint staff_vacations_kind_check
      check (kind in ('vacation', 'time_off', 'sick', 'personal', 'other'));
  end if;
end $$;

-- Temporary personal closures
create table if not exists staff_closures (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  staff_id uuid not null references staff (id) on delete cascade,
  location_id uuid references locations (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index if not exists staff_closures_staff_idx
  on staff_closures (staff_id, starts_at);

alter table staff_closures enable row level security;

drop policy if exists "Owners manage staff closures" on staff_closures;
create policy "Owners manage staff closures"
  on staff_closures for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

-- ---------------------------------------------------------------------------
-- Documents: license category + expiry metadata
-- ---------------------------------------------------------------------------

alter table staff_documents drop constraint if exists staff_documents_category_check;

alter table staff_documents
  add constraint staff_documents_category_check
  check (category in (
    'general',
    'contract',
    'certification',
    'license',
    'id',
    'tax',
    'training',
    'other'
  ));

alter table staff_documents
  add column if not exists expires_on date;

alter table staff_documents
  add column if not exists issued_by text;

-- ---------------------------------------------------------------------------
-- Directory helpers
-- ---------------------------------------------------------------------------

create index if not exists staff_name_parts_idx
  on staff (business_id, last_name, first_name);

create index if not exists staff_active_idx
  on staff (business_id, is_active);
