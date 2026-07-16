-- Chasum Employee Management Department (Phase 1)
-- Extends staff (booking providers) with HR fields — does NOT replace staff_id FKs.

-- ---------------------------------------------------------------------------
-- Departments
-- ---------------------------------------------------------------------------

create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  name text not null,
  description text,
  color text not null default '#64748b',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, name)
);

create index if not exists departments_business_idx
  on departments (business_id, sort_order);

alter table departments enable row level security;

drop policy if exists "Owners manage departments" on departments;
create policy "Owners manage departments"
  on departments for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

drop trigger if exists departments_updated_at on departments;
create trigger departments_updated_at
  before update on departments
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Staff HR / employment columns
-- ---------------------------------------------------------------------------

alter table staff
  add column if not exists phone text;

alter table staff
  add column if not exists department_id uuid references departments (id) on delete set null;

alter table staff
  add column if not exists employment_status text not null default 'active'
    check (employment_status in (
      'active',
      'onboarding',
      'on_leave',
      'terminated',
      'contractor'
    ));

alter table staff
  add column if not exists role_key text not null default 'employee'
    check (role_key in (
      'admin',
      'manager',
      'employee',
      'receptionist',
      'contractor'
    ));

alter table staff
  add column if not exists permissions jsonb not null default '[]'::jsonb;

alter table staff
  add column if not exists hire_date date;

alter table staff
  add column if not exists termination_date date;

alter table staff
  add column if not exists notes text;

alter table staff
  add column if not exists emergency_contact_name text;

alter table staff
  add column if not exists emergency_contact_phone text;

alter table staff
  add column if not exists emergency_contact_relationship text;

alter table staff
  add column if not exists pay_type text not null default 'hourly'
    check (pay_type in ('hourly', 'salary', 'commission', 'hybrid'));

alter table staff
  add column if not exists hourly_rate_cents integer;

alter table staff
  add column if not exists salary_cents integer;

alter table staff
  add column if not exists commission_rate_bps integer;

alter table staff
  add column if not exists payroll_notes text;

-- Future: link staff row to a login user for multi-staff auth / time clock
alter table staff
  add column if not exists user_id uuid references auth.users (id) on delete set null;

create index if not exists staff_department_idx on staff (department_id);
create index if not exists staff_role_idx on staff (business_id, role_key);
create index if not exists staff_user_idx on staff (user_id) where user_id is not null;

-- ---------------------------------------------------------------------------
-- Multi-location assignments (primary stays staff.location_id)
-- ---------------------------------------------------------------------------

create table if not exists staff_locations (
  staff_id uuid not null references staff (id) on delete cascade,
  location_id uuid not null references locations (id) on delete cascade,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (staff_id, location_id)
);

create index if not exists staff_locations_location_idx
  on staff_locations (location_id);

alter table staff_locations enable row level security;

drop policy if exists "Owners manage staff locations" on staff_locations;
create policy "Owners manage staff locations"
  on staff_locations for all
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

-- Backfill primary location assignments
insert into staff_locations (staff_id, location_id, is_primary)
select id, location_id, true
from staff
where location_id is not null
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Employee documents
-- ---------------------------------------------------------------------------

create table if not exists staff_documents (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  staff_id uuid not null references staff (id) on delete cascade,
  name text not null,
  category text not null default 'general'
    check (category in (
      'general',
      'contract',
      'certification',
      'id',
      'tax',
      'training',
      'other'
    )),
  file_url text not null,
  file_type text,
  created_at timestamptz not null default now()
);

create index if not exists staff_documents_staff_idx
  on staff_documents (staff_id, created_at desc);

alter table staff_documents enable row level security;

drop policy if exists "Owners manage staff documents" on staff_documents;
create policy "Owners manage staff documents"
  on staff_documents for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

-- ---------------------------------------------------------------------------
-- Activity timeline (HR + ops events; time-clock ready)
-- ---------------------------------------------------------------------------

create table if not exists staff_activity (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  staff_id uuid not null references staff (id) on delete cascade,
  event_type text not null
    check (event_type in (
      'created',
      'updated',
      'status_changed',
      'role_changed',
      'schedule_updated',
      'vacation_added',
      'vacation_removed',
      'document_added',
      'document_removed',
      'note_added',
      'payroll_updated',
      'assignment_changed',
      'time_clock',
      'ai_event',
      'other'
    )),
  title text not null,
  body text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists staff_activity_staff_idx
  on staff_activity (staff_id, created_at desc);

create index if not exists staff_activity_business_idx
  on staff_activity (business_id, created_at desc);

alter table staff_activity enable row level security;

drop policy if exists "Owners manage staff activity" on staff_activity;
create policy "Owners manage staff activity"
  on staff_activity for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

-- Seed default departments for existing businesses (idempotent)
insert into departments (business_id, name, description, sort_order, color)
select b.id, d.name, d.description, d.sort_order, d.color
from businesses b
cross join (
  values
    ('Front Desk', 'Reception and client intake', 1, '#0ea5e9'),
    ('Service Team', 'Providers and technicians', 2, '#22c55e'),
    ('Management', 'Owners and managers', 3, '#8b5cf6'),
    ('Operations', 'Support and back office', 4, '#f59e0b')
) as d(name, description, sort_order, color)
on conflict (business_id, name) do nothing;
