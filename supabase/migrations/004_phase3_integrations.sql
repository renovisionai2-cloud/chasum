-- Chasum Phase 3: Integrations & Communication Platform
-- Run after 003_rls_hardening.sql

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type calendar_provider as enum ('google', 'outlook', 'apple');
create type notification_channel as enum ('email', 'sms', 'in_app');
create type notification_type as enum (
  'confirmation',
  'reminder',
  'cancellation',
  'reschedule',
  'staff',
  'business',
  'waitlist'
);
create type delivery_status as enum ('pending', 'sent', 'failed', 'skipped');
create type job_status as enum ('pending', 'processing', 'completed', 'failed', 'cancelled');
create type job_type as enum (
  'email',
  'sms',
  'calendar_sync',
  'webhook',
  'reminder',
  'recurring',
  'waitlist_notify'
);
create type waitlist_status as enum ('waiting', 'notified', 'booked', 'cancelled');
create type recurrence_frequency as enum ('daily', 'weekly', 'biweekly', 'monthly');

-- ---------------------------------------------------------------------------
-- Calendar connections (per-staff or business-wide)
-- ---------------------------------------------------------------------------

create table if not exists calendar_connections (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  staff_id uuid references staff(id) on delete cascade,
  provider calendar_provider not null,
  provider_account_id text,
  provider_calendar_id text,
  calendar_name text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  sync_token text,
  ics_secret text unique,
  sync_enabled boolean not null default true,
  sync_direction text not null default 'two_way'
    check (sync_direction in ('inbound', 'outbound', 'two_way')),
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists calendar_connections_business_idx
  on calendar_connections (business_id);
create index if not exists calendar_connections_staff_idx
  on calendar_connections (staff_id);

-- ---------------------------------------------------------------------------
-- External calendar events (synced from Google/Outlook or ICS)
-- ---------------------------------------------------------------------------

create table if not exists external_events (
  id uuid primary key default gen_random_uuid(),
  calendar_connection_id uuid references calendar_connections(id) on delete cascade not null,
  appointment_id uuid references appointments(id) on delete set null,
  external_event_id text not null,
  title text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  is_busy boolean not null default true,
  raw_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (calendar_connection_id, external_event_id)
);

create index if not exists external_events_connection_time_idx
  on external_events (calendar_connection_id, start_time);
create index if not exists external_events_appointment_idx
  on external_events (appointment_id);

-- ---------------------------------------------------------------------------
-- In-app notifications
-- ---------------------------------------------------------------------------

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  type notification_type not null,
  channel notification_channel not null default 'in_app',
  title text not null,
  body text not null,
  metadata jsonb not null default '{}',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_business_created_idx
  on notifications (business_id, created_at desc);
create index if not exists notifications_unread_idx
  on notifications (business_id) where read_at is null;

-- ---------------------------------------------------------------------------
-- Email / SMS delivery logs
-- ---------------------------------------------------------------------------

create table if not exists notification_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  notification_id uuid references notifications(id) on delete set null,
  appointment_id uuid references appointments(id) on delete set null,
  channel notification_channel not null,
  recipient text not null,
  template_key text not null,
  status delivery_status not null default 'pending',
  provider text,
  provider_message_id text,
  provider_response jsonb,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notification_logs_business_idx
  on notification_logs (business_id, created_at desc);
create index if not exists notification_logs_status_idx
  on notification_logs (status) where status = 'pending';

-- ---------------------------------------------------------------------------
-- API keys for developer platform
-- ---------------------------------------------------------------------------

create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  name text not null,
  key_prefix text not null,
  key_hash text not null unique,
  scopes text[] not null default '{read,write}',
  last_used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists api_keys_business_idx on api_keys (business_id);
create index if not exists api_keys_hash_idx on api_keys (key_hash);

-- ---------------------------------------------------------------------------
-- Webhook endpoints
-- ---------------------------------------------------------------------------

create table if not exists webhook_endpoints (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  url text not null,
  secret text not null,
  events text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists webhook_endpoints_business_idx
  on webhook_endpoints (business_id);

-- ---------------------------------------------------------------------------
-- Recurring appointment rules
-- ---------------------------------------------------------------------------

create table if not exists recurring_rules (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  service_id uuid references services(id) on delete restrict not null,
  staff_id uuid references staff(id) on delete restrict not null,
  customer_id uuid references customers(id) on delete restrict not null,
  frequency recurrence_frequency not null,
  interval_count integer not null default 1 check (interval_count > 0),
  day_of_week integer check (day_of_week between 0 and 6),
  start_date date not null,
  end_date date,
  max_occurrences integer,
  start_time time not null,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recurring_rules_business_idx
  on recurring_rules (business_id);

-- ---------------------------------------------------------------------------
-- Waitlist
-- ---------------------------------------------------------------------------

create table if not exists waitlists (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  service_id uuid references services(id) on delete cascade not null,
  staff_id uuid references staff(id) on delete set null,
  customer_id uuid references customers(id) on delete cascade not null,
  preferred_date date not null,
  preferred_time_start time,
  preferred_time_end time,
  status waitlist_status not null default 'waiting',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists waitlists_business_status_idx
  on waitlists (business_id, status);

-- ---------------------------------------------------------------------------
-- Background job queue
-- ---------------------------------------------------------------------------

create table if not exists background_jobs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  job_type job_type not null,
  payload jsonb not null default '{}',
  status job_status not null default 'pending',
  scheduled_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  attempts integer not null default 0,
  max_attempts integer not null default 3,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists background_jobs_pending_idx
  on background_jobs (scheduled_at)
  where status = 'pending';

-- ---------------------------------------------------------------------------
-- Extend appointments for recurring + external calendar refs
-- ---------------------------------------------------------------------------

alter table appointments
  add column if not exists recurring_rule_id uuid references recurring_rules(id) on delete set null,
  add column if not exists external_event_id text;

-- ---------------------------------------------------------------------------
-- Business notification preferences
-- ---------------------------------------------------------------------------

alter table businesses
  add column if not exists email_notifications_enabled boolean not null default true,
  add column if not exists sms_notifications_enabled boolean not null default false,
  add column if not exists reminder_hours_before integer not null default 24,
  add column if not exists notification_email text;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table calendar_connections enable row level security;
alter table external_events enable row level security;
alter table notifications enable row level security;
alter table notification_logs enable row level security;
alter table api_keys enable row level security;
alter table webhook_endpoints enable row level security;
alter table recurring_rules enable row level security;
alter table waitlists enable row level security;
alter table background_jobs enable row level security;

-- Calendar connections
create policy "Owners manage calendar connections"
  on calendar_connections for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

-- External events (via connection ownership)
create policy "Owners manage external events"
  on external_events for all
  using (
    exists (
      select 1 from calendar_connections cc
      where cc.id = calendar_connection_id
        and is_business_owner(cc.business_id)
    )
  )
  with check (
    exists (
      select 1 from calendar_connections cc
      where cc.id = calendar_connection_id
        and is_business_owner(cc.business_id)
    )
  );

-- Notifications
create policy "Owners manage notifications"
  on notifications for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

-- Notification logs
create policy "Owners view notification logs"
  on notification_logs for select
  using (is_business_owner(business_id));

create policy "Owners insert notification logs"
  on notification_logs for insert
  with check (is_business_owner(business_id));

-- API keys
create policy "Owners manage api keys"
  on api_keys for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

-- Webhooks
create policy "Owners manage webhooks"
  on webhook_endpoints for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

-- Recurring rules
create policy "Owners manage recurring rules"
  on recurring_rules for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

-- Waitlists
create policy "Owners manage waitlists"
  on waitlists for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

-- Background jobs
create policy "Owners view background jobs"
  on background_jobs for select
  using (business_id is null or is_business_owner(business_id));

-- ---------------------------------------------------------------------------
-- Updated-at triggers
-- ---------------------------------------------------------------------------

create trigger calendar_connections_updated_at
  before update on calendar_connections
  for each row execute function set_updated_at();

create trigger external_events_updated_at
  before update on external_events
  for each row execute function set_updated_at();

create trigger webhook_endpoints_updated_at
  before update on webhook_endpoints
  for each row execute function set_updated_at();

create trigger recurring_rules_updated_at
  before update on recurring_rules
  for each row execute function set_updated_at();

create trigger waitlists_updated_at
  before update on waitlists
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Service role policies for job processor (insert/update jobs & logs)
-- ---------------------------------------------------------------------------

create policy "Service role manages background jobs"
  on background_jobs for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Service role manages notification logs"
  on notification_logs for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
