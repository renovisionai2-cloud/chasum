-- PREPARED ONLY. Do not apply without separate environment/release approval.
-- Independent of 029, 034-036 and 040/041; worker execution still requires 029.
-- Keep creation, RLS and grants atomic so creating-role defaults never expose an
-- intermediate writable ledger. A colliding existing table must fail for review.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

create table public.communication_send_intents (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  intent_key text not null check (intent_key ~ '^[0-9a-f]{64}$'),
  channel text not null check (channel in ('email', 'sms')),
  template_key text not null check (length(btrim(template_key)) > 0),
  recipient_hash text not null check (recipient_hash ~ '^[0-9a-f]{64}$'),
  state text not null check (state in ('sending', 'accepted', 'rejected', 'unknown')),
  owner_id uuid not null,
  attempt integer not null check (attempt > 0),
  provider text,
  provider_message_id text,
  failure_code text check (failure_code ~ '^[a-zA-Z][a-zA-Z0-9_]{0,63}$'),
  first_job_id uuid,
  last_job_id uuid,
  source text not null check (source in ('inline', 'worker')),
  entity_type text check (entity_type in ('appointment', 'receipt')),
  entity_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  accepted_at timestamptz,
  constraint communication_send_intents_business_intent_unique unique (business_id, intent_key),
  constraint communication_send_intents_entity_pair check ((entity_type is null) = (entity_id is null))
);

-- No expiry/reclaim trigger. The application must retain sending/unknown rows
-- until an independently governed delivery reconciliation establishes the truth.
-- Job correlation has no FK: queue deletion must not erase send-intent evidence.
alter table public.communication_send_intents enable row level security;
alter table public.communication_send_intents force row level security;

-- Clear default grants for the intended API roles, including service_role, then
-- restore only necessary operations. No owner or authenticated-user policies.
revoke all privileges on table public.communication_send_intents from public, anon, authenticated, service_role;
grant select, insert, update on table public.communication_send_intents to service_role;

-- Forward recovery: retain this ledger while any send could recur. Do not drop,
-- truncate or delete accepted/unknown reservations to recover from a failed send.
commit;
