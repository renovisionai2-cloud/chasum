-- Chasum Calendar & Booking Engine 2.0
-- Additive: resources/rooms, commercial appointment fields, portal, undo, recurring/waitlist hardening.
-- Keeps staff_id + customer_id FKs intact. Multi-tenant via business_id.

-- ---------------------------------------------------------------------------
-- Recurrence: yearly
-- ---------------------------------------------------------------------------

do $$
begin
  alter type recurrence_frequency add value if not exists 'yearly';
exception
  when duplicate_object then null;
end $$;

alter table recurring_rules
  add column if not exists location_id uuid references locations (id) on delete set null;

alter table recurring_rules
  add column if not exists timezone text;

-- Backfill location from staff primary location
update recurring_rules rr
set location_id = s.location_id
from staff s
where rr.staff_id = s.id
  and rr.location_id is null;

-- ---------------------------------------------------------------------------
-- Waitlist: location + priority queue
-- ---------------------------------------------------------------------------

alter table waitlists
  add column if not exists location_id uuid references locations (id) on delete set null;

alter table waitlists
  add column if not exists priority integer not null default 0;

alter table waitlists
  add column if not exists auto_fill boolean not null default true;

create index if not exists waitlists_priority_idx
  on waitlists (business_id, status, priority desc, created_at asc);

-- ---------------------------------------------------------------------------
-- Resources (rooms / equipment / vehicles / other)
-- ---------------------------------------------------------------------------

create table if not exists booking_resources (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  location_id uuid references locations (id) on delete set null,
  resource_type text not null default 'room'
    check (resource_type in ('room', 'equipment', 'vehicle', 'other')),
  name text not null,
  capacity integer,
  color text not null default '#64748b',
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists booking_resources_business_idx
  on booking_resources (business_id, resource_type);

alter table booking_resources enable row level security;

drop policy if exists "Owners manage booking resources" on booking_resources;
create policy "Owners manage booking resources"
  on booking_resources for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

drop trigger if exists booking_resources_updated_at on booking_resources;
create trigger booking_resources_updated_at
  before update on booking_resources
  for each row execute function set_updated_at();

create table if not exists appointment_resources (
  appointment_id uuid not null references appointments (id) on delete cascade,
  resource_id uuid not null references booking_resources (id) on delete restrict,
  primary key (appointment_id, resource_id)
);

create index if not exists appointment_resources_resource_idx
  on appointment_resources (resource_id);

alter table appointment_resources enable row level security;

drop policy if exists "Owners manage appointment resources" on appointment_resources;
create policy "Owners manage appointment resources"
  on appointment_resources for all
  using (
    exists (
      select 1 from appointments a
      where a.id = appointment_id and is_business_owner(a.business_id)
    )
  )
  with check (
    exists (
      select 1 from appointments a
      where a.id = appointment_id and is_business_owner(a.business_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Appointment commercial + CRM-ready fields
-- ---------------------------------------------------------------------------

alter table appointments
  add column if not exists room_id uuid references booking_resources (id) on delete set null;

alter table appointments
  add column if not exists color text;

alter table appointments
  add column if not exists price_cents integer;

alter table appointments
  add column if not exists tax_cents integer not null default 0;

alter table appointments
  add column if not exists discount_cents integer not null default 0;

alter table appointments
  add column if not exists deposit_cents integer not null default 0;

alter table appointments
  add column if not exists invoice_number text;

alter table appointments
  add column if not exists internal_notes text;

alter table appointments
  add column if not exists custom_fields jsonb not null default '{}'::jsonb;

alter table appointments
  add column if not exists travel_minutes integer not null default 0;

alter table appointments
  add column if not exists timezone text;

create index if not exists appointments_room_idx
  on appointments (room_id)
  where room_id is not null;

-- ---------------------------------------------------------------------------
-- Appointment attachments
-- ---------------------------------------------------------------------------

create table if not exists appointment_attachments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  appointment_id uuid not null references appointments (id) on delete cascade,
  name text not null,
  file_url text not null,
  file_type text,
  created_at timestamptz not null default now()
);

create index if not exists appointment_attachments_appt_idx
  on appointment_attachments (appointment_id, created_at desc);

alter table appointment_attachments enable row level security;

drop policy if exists "Owners manage appointment attachments" on appointment_attachments;
create policy "Owners manage appointment attachments"
  on appointment_attachments for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

-- ---------------------------------------------------------------------------
-- Undo stack (drag/drop / resize / bulk moves)
-- ---------------------------------------------------------------------------

create table if not exists appointment_change_log (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  appointment_id uuid not null references appointments (id) on delete cascade,
  action text not null
    check (action in (
      'create',
      'update',
      'reschedule',
      'resize',
      'duplicate',
      'cancel',
      'status_change'
    )),
  before_state jsonb,
  after_state jsonb,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists appointment_change_log_business_idx
  on appointment_change_log (business_id, created_at desc);

alter table appointment_change_log enable row level security;

drop policy if exists "Owners manage appointment change log" on appointment_change_log;
create policy "Owners manage appointment change log"
  on appointment_change_log for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

-- ---------------------------------------------------------------------------
-- Customer portal access tokens (self-service cancel/reschedule)
-- ---------------------------------------------------------------------------

create table if not exists customer_portal_tokens (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  customer_id uuid not null references customers (id) on delete cascade,
  token text not null unique,
  expires_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists customer_portal_tokens_customer_idx
  on customer_portal_tokens (customer_id);

alter table customer_portal_tokens enable row level security;

drop policy if exists "Owners manage portal tokens" on customer_portal_tokens;
create policy "Owners manage portal tokens"
  on customer_portal_tokens for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

-- Portal pages resolve tokens via service role (never expose token table publicly).

-- ---------------------------------------------------------------------------
-- Location booking engine knobs (travel / notice) — additive
-- ---------------------------------------------------------------------------

alter table location_settings
  add column if not exists min_booking_notice_minutes integer not null default 0;

alter table location_settings
  add column if not exists default_travel_minutes integer not null default 0;

alter table location_settings
  add column if not exists timezone text;
