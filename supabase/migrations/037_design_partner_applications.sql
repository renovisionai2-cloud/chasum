-- Track 1 — design_partner_applications
--
-- MANUAL SCOPED SQL EXECUTION ONLY.
-- DO NOT run `supabase db push`, `supabase migration up`, or any CLI that
-- applies pending files in filename order.
-- Migrations 034, 035, and 036 remain unapplied. A CLI apply would attempt
-- those first against the shared Preview/Production Supabase project.
-- This file is UNAPPLIED until Product Owner explicitly approves Track 1
-- database execution. Preview and Production share Supabase.
--
-- Does NOT create auth users, businesses, members, subscriptions, offers,
-- Stripe customers, or billing rows.

create table if not exists public.design_partner_applications (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  industry text not null,
  employees text not null,
  locations text not null,
  current_software text not null,
  monthly_appointments text not null,
  pain_point text not null,
  contact_email text not null,
  contact_phone text,
  notes text,
  requested_plan_key text,
  status text not null default 'received'
    check (status in (
      'received',
      'reviewing',
      'accepted',
      'declined',
      'waitlisted'
    )),
  source text not null default 'apply',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid,
  constraint design_partner_applications_email_present
    check (char_length(trim(contact_email)) > 0)
);

comment on table public.design_partner_applications is
  'Private Alpha / design-partner applications from /apply. Persistence only — never auto-provisions a tenant.';

comment on column public.design_partner_applications.contact_email is
  'Maps from form field email. No contact_name column — the form does not collect one.';

comment on column public.design_partner_applications.requested_plan_key is
  'Optional; the current /apply form does not collect a plan. Founder may set later.';

create index if not exists design_partner_applications_created_idx
  on public.design_partner_applications (created_at desc);

create index if not exists design_partner_applications_status_idx
  on public.design_partner_applications (status, created_at desc);

alter table public.design_partner_applications enable row level security;

-- Public marketing form writes only through the trusted server action
-- (service_role). No anonymous or tenant INSERT/SELECT policies.
revoke all on table public.design_partner_applications from public;
do $$
begin
  revoke all on table public.design_partner_applications from anon;
exception
  when undefined_object then null;
end $$;
do $$
begin
  revoke all on table public.design_partner_applications from authenticated;
exception
  when undefined_object then null;
end $$;

grant select, insert, update, delete on table public.design_partner_applications
  to service_role;
