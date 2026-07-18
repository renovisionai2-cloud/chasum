-- Milestone 5 / Phase 5.8 — Communications Platform
-- Centralizes email, SMS, and in-app delivery. Provider secrets stay in env.

-- ---------------------------------------------------------------------------
-- Business communication preferences
-- ---------------------------------------------------------------------------

alter table businesses
  add column if not exists marketing_email_enabled boolean not null default false;

alter table businesses
  add column if not exists quiet_hours_start time;

alter table businesses
  add column if not exists quiet_hours_end time;

alter table businesses
  add column if not exists communications_opt_out_footer text;

comment on column businesses.quiet_hours_start is
  'Local quiet-hours start (HH:MM). Outbound transactional may delay until quiet hours end.';
comment on column businesses.quiet_hours_end is
  'Local quiet-hours end (HH:MM).';

-- ---------------------------------------------------------------------------
-- In-app notification center enhancements
-- ---------------------------------------------------------------------------

alter table notifications
  add column if not exists priority text not null default 'normal';

alter table notifications
  add column if not exists archived_at timestamptz;

alter table notifications
  add column if not exists customer_id uuid references customers (id) on delete set null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'notifications_priority_check'
  ) then
    alter table notifications
      add constraint notifications_priority_check
      check (priority in ('low', 'normal', 'high', 'urgent'));
  end if;
exception
  when duplicate_object then null;
end $$;

create index if not exists notifications_unread_idx
  on notifications (business_id, created_at desc)
  where read_at is null and archived_at is null;

create index if not exists notifications_archived_idx
  on notifications (business_id, archived_at desc)
  where archived_at is not null;

-- ---------------------------------------------------------------------------
-- Delivery queue enhancements (exponential backoff)
-- ---------------------------------------------------------------------------

alter table background_jobs
  add column if not exists next_retry_at timestamptz;

alter table background_jobs
  add column if not exists cancelled_at timestamptz;

-- Widen job_status for cancelled / retrying semantics where enum exists
do $$
begin
  alter type job_status add value if not exists 'cancelled';
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter type job_status add value if not exists 'retrying';
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

create index if not exists background_jobs_retry_idx
  on background_jobs (status, next_retry_at)
  where status = 'pending';

-- ---------------------------------------------------------------------------
-- Richer delivery log statuses for Communications Platform
-- ---------------------------------------------------------------------------

alter table notification_logs
  add column if not exists customer_id uuid references customers (id) on delete set null;

alter table notification_logs
  add column if not exists job_id uuid references background_jobs (id) on delete set null;

alter table notification_logs
  add column if not exists attempt integer not null default 1;

-- ---------------------------------------------------------------------------
-- Communications audit log (immutable intent)
-- ---------------------------------------------------------------------------

create table if not exists communications_audit_log (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  channel text,
  template_key text,
  recipient text,
  entity_type text,
  entity_id uuid,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists communications_audit_log_business_idx
  on communications_audit_log (business_id, created_at desc);

alter table communications_audit_log enable row level security;

drop policy if exists "Owners read communications audit" on communications_audit_log;
create policy "Owners read communications audit"
  on communications_audit_log for select
  using (is_business_owner(business_id));

drop policy if exists "Owners insert communications audit" on communications_audit_log;
create policy "Owners insert communications audit"
  on communications_audit_log for insert
  with check (is_business_owner(business_id));

-- Service role inserts via service client (bypass RLS) for job processor.
