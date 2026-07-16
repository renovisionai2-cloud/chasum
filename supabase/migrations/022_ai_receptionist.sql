-- Chasum AI Receptionist Phase 1 (Emma)
-- Additive conversation store + voice channel prep. Multi-tenant via business_id.
-- Voice calling is NOT implemented — channel value reserved for future.

-- Allow voice on communication_history.channel when a check constraint exists
do $$
begin
  alter table communication_history drop constraint if exists communication_history_channel_check;
exception
  when undefined_table then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter table communication_history
    add constraint communication_history_channel_check
    check (channel in ('call', 'sms', 'email', 'push', 'whatsapp', 'note', 'reminder', 'ai', 'voice'));
exception
  when undefined_table then null;
  when duplicate_object then null;
end $$;

create table if not exists ai_receptionist_conversations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  location_id uuid references locations (id) on delete set null,
  customer_id uuid references customers (id) on delete set null,
  channel text not null default 'web'
    check (channel in ('web', 'sms', 'email', 'voice', 'internal')),
  status text not null default 'open'
    check (status in ('open', 'escalated', 'resolved', 'archived')),
  visitor_name text,
  visitor_email text,
  visitor_phone text,
  intent text,
  booking_started boolean not null default false,
  escalated_at timestamptz,
  escalation_reason text,
  follow_up_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_receptionist_conversations_business_idx
  on ai_receptionist_conversations (business_id, status, updated_at desc);

create index if not exists ai_receptionist_conversations_customer_idx
  on ai_receptionist_conversations (customer_id)
  where customer_id is not null;

alter table ai_receptionist_conversations enable row level security;

drop policy if exists "Owners manage AI receptionist conversations"
  on ai_receptionist_conversations;
create policy "Owners manage AI receptionist conversations"
  on ai_receptionist_conversations for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

drop trigger if exists ai_receptionist_conversations_updated_at
  on ai_receptionist_conversations;
create trigger ai_receptionist_conversations_updated_at
  before update on ai_receptionist_conversations
  for each row execute function set_updated_at();

create table if not exists ai_receptionist_messages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  conversation_id uuid not null
    references ai_receptionist_conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system', 'staff')),
  content text not null,
  intent text,
  provider text,
  citations jsonb not null default '[]'::jsonb,
  suggested_slots jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ai_receptionist_messages_conversation_idx
  on ai_receptionist_messages (conversation_id, created_at);

alter table ai_receptionist_messages enable row level security;

drop policy if exists "Owners manage AI receptionist messages"
  on ai_receptionist_messages;
create policy "Owners manage AI receptionist messages"
  on ai_receptionist_messages for all
  using (is_business_owner(business_id))
  with check (is_business_owner(business_id));
