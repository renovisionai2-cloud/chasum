-- Chasum Reports & Analytics Department
-- Additive: scheduled report delivery + export audit. Multi-tenant via business_id.

create table if not exists report_schedules (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  name text not null,
  report_type text not null
    check (
      report_type in (
        'executive',
        'revenue',
        'appointments',
        'customers',
        'employees',
        'services',
        'locations',
        'financial',
        'inventory'
      )
    ),
  cadence text not null
    check (cadence in ('daily', 'weekly', 'monthly', 'yearly')),
  recipients text[] not null default '{}',
  format text not null default 'csv'
    check (format in ('csv', 'pdf', 'excel', 'email')),
  enabled boolean not null default true,
  last_sent_at timestamptz,
  next_run_at timestamptz,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists report_schedules_business_idx
  on report_schedules (business_id, enabled, cadence);

alter table report_schedules enable row level security;

drop policy if exists "Owners manage report schedules" on report_schedules;
create policy "Owners manage report schedules"
  on report_schedules for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

drop trigger if exists report_schedules_updated_at on report_schedules;
create trigger report_schedules_updated_at
  before update on report_schedules
  for each row execute function set_updated_at();

create table if not exists report_exports (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  report_type text not null,
  format text not null
    check (format in ('csv', 'pdf', 'excel', 'print', 'email')),
  row_count integer not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists report_exports_business_idx
  on report_exports (business_id, created_at desc);

alter table report_exports enable row level security;

drop policy if exists "Owners manage report exports" on report_exports;
create policy "Owners manage report exports"
  on report_exports for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));
