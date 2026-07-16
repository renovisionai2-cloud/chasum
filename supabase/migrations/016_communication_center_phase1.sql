-- Chasum Communication Center Phase 1
-- Unified communication_history + follow-ups; Twilio/Resend/push/WhatsApp/AI-ready.

-- ---------------------------------------------------------------------------
-- Customer mailing / visit address (Open Maps)
-- ---------------------------------------------------------------------------

alter table customers
  add column if not exists address text;

-- ---------------------------------------------------------------------------
-- Communication history (all channels)
-- ---------------------------------------------------------------------------

create table if not exists communication_history (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  customer_id uuid not null references customers (id) on delete cascade,
  appointment_id uuid references appointments (id) on delete set null,
  channel text not null
    check (channel in (
      'call',
      'sms',
      'email',
      'push',
      'whatsapp',
      'note',
      'reminder',
      'ai'
    )),
  direction text not null
    check (direction in ('outbound', 'inbound', 'internal')),
  status text not null default 'logged'
    check (status in (
      'logged',
      'queued',
      'sent',
      'delivered',
      'failed',
      'skipped',
      'cancelled'
    )),
  subject text,
  body text,
  recipient text,
  provider text,
  provider_message_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists communication_history_customer_idx
  on communication_history (customer_id, created_at desc);

create index if not exists communication_history_business_idx
  on communication_history (business_id, created_at desc);

create index if not exists communication_history_channel_idx
  on communication_history (business_id, channel, created_at desc);

create index if not exists communication_history_appointment_idx
  on communication_history (appointment_id)
  where appointment_id is not null;

alter table communication_history enable row level security;

drop policy if exists "Owners manage own communication history" on communication_history;
create policy "Owners manage own communication history"
  on communication_history for all
  using (
    business_id in (
      select id from businesses where owner_id = auth.uid()
    )
  )
  with check (
    business_id in (
      select id from businesses where owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Follow-up reminders
-- ---------------------------------------------------------------------------

create table if not exists communication_follow_ups (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  customer_id uuid not null references customers (id) on delete cascade,
  appointment_id uuid references appointments (id) on delete set null,
  title text not null,
  body text,
  due_at timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'cancelled')),
  completed_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists communication_follow_ups_customer_idx
  on communication_follow_ups (customer_id, due_at asc);

create index if not exists communication_follow_ups_business_pending_idx
  on communication_follow_ups (business_id, status, due_at asc);

alter table communication_follow_ups enable row level security;

drop policy if exists "Owners manage own follow-ups" on communication_follow_ups;
create policy "Owners manage own follow-ups"
  on communication_follow_ups for all
  using (
    business_id in (
      select id from businesses where owner_id = auth.uid()
    )
  )
  with check (
    business_id in (
      select id from businesses where owner_id = auth.uid()
    )
  );

drop trigger if exists communication_follow_ups_updated_at on communication_follow_ups;
create trigger communication_follow_ups_updated_at
  before update on communication_follow_ups
  for each row execute function set_updated_at();
