-- Chasum Business Management settings foundation (Phase 4 Step 2)
-- Additive only. Does not alter booking RPC behavior yet.
-- Linked: profile identity, branding, booking policies, notifications, AI config,
-- business closures, documents, optional split-shift segments.

-- ---------------------------------------------------------------------------
-- businesses: identity, branding, booking policy, notifications, AI
-- ---------------------------------------------------------------------------

alter table businesses
  add column if not exists legal_name text;

alter table businesses
  add column if not exists business_type text;

alter table businesses
  add column if not exists language text not null default 'en';

alter table businesses
  add column if not exists favicon_url text;

alter table businesses
  add column if not exists brand_color text not null default '#2563EB';

alter table businesses
  add column if not exists accent_color text not null default '#7C3AED';

alter table businesses
  add column if not exists email_signature text;

alter table businesses
  add column if not exists booking_page_branding jsonb not null default '{}'::jsonb;

alter table businesses
  add column if not exists min_notice_minutes integer not null default 0;

alter table businesses
  add column if not exists cancellation_window_hours integer not null default 24;

alter table businesses
  add column if not exists reschedule_policy text;

alter table businesses
  add column if not exists allow_double_booking boolean not null default false;

alter table businesses
  add column if not exists waitlist_enabled boolean not null default true;

alter table businesses
  add column if not exists online_booking_enabled boolean not null default true;

alter table businesses
  add column if not exists booking_confirmation_mode text not null default 'auto';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'businesses_booking_confirmation_mode_check'
  ) then
    alter table businesses
      add constraint businesses_booking_confirmation_mode_check
      check (booking_confirmation_mode in ('auto', 'manual', 'request_approval'));
  end if;
end $$;

alter table businesses
  add column if not exists owner_notifications_enabled boolean not null default true;

alter table businesses
  add column if not exists staff_notifications_enabled boolean not null default true;

alter table businesses
  add column if not exists ai_settings jsonb not null default '{
    "summer": {
      "enabled": false,
      "greeting": "",
      "tone": "professional",
      "escalation": "",
      "business_knowledge": ""
    },
    "chase": {
      "enabled": false,
      "daily_summary": true,
      "weekly_summary": true,
      "recommendations": true,
      "business_analytics": true
    }
  }'::jsonb;

-- Seed confirmation mode from existing public_booking_mode where present
update businesses
set booking_confirmation_mode = 'request_approval'
where public_booking_mode = 'request_approval'
  and booking_confirmation_mode = 'auto';

update businesses
set online_booking_enabled = false
where public_booking_mode = 'staff_only'
  and online_booking_enabled = true;

-- ---------------------------------------------------------------------------
-- Business closures (vacation, temporary, special hours)
-- ---------------------------------------------------------------------------

create table if not exists business_closures (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  location_id uuid references locations (id) on delete cascade,
  closure_type text not null
    check (closure_type in ('holiday', 'vacation', 'temporary', 'special_hours')),
  name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  open_time time,
  close_time time,
  is_recurring boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index if not exists business_closures_business_idx
  on business_closures (business_id, starts_at);

alter table business_closures enable row level security;

drop policy if exists "Owners manage business closures" on business_closures;
create policy "Owners manage business closures"
  on business_closures for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

-- ---------------------------------------------------------------------------
-- Business documents
-- ---------------------------------------------------------------------------

create table if not exists business_documents (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  name text not null,
  file_url text not null,
  file_type text,
  created_at timestamptz not null default now()
);

create index if not exists business_documents_business_idx
  on business_documents (business_id, created_at desc);

alter table business_documents enable row level security;

drop policy if exists "Owners manage business documents" on business_documents;
create policy "Owners manage business documents"
  on business_documents for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

-- ---------------------------------------------------------------------------
-- Split-shift hour segments (additive; primary hours remain on location_hours)
-- ---------------------------------------------------------------------------

create table if not exists location_hour_segments (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations (id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  open_time time not null,
  close_time time not null,
  sort_order integer not null default 0,
  check (close_time > open_time)
);

create index if not exists location_hour_segments_location_idx
  on location_hour_segments (location_id, day_of_week, sort_order);

alter table location_hour_segments enable row level security;

drop policy if exists "Owners manage location hour segments" on location_hour_segments;
create policy "Owners manage location hour segments"
  on location_hour_segments for all
  using (
    exists (
      select 1 from locations l
      where l.id = location_id and is_business_owner(l.business_id)
    )
  )
  with check (
    exists (
      select 1 from locations l
      where l.id = location_id and is_business_owner(l.business_id)
    )
  );
