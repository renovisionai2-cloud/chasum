-- Sprint 8: GVM Baby World go-live — production profile, booking modes, documents

alter table businesses
  add column if not exists cover_url text,
  add column if not exists public_booking_mode text not null default 'public'
    check (public_booking_mode in ('staff_only', 'request_approval', 'public', 'invite_only')),
  add column if not exists booking_invite_code text;

comment on column businesses.cover_url is 'Public cover/hero image on booking page';
comment on column businesses.public_booking_mode is 'Controls public booking access: staff_only | request_approval | public | invite_only';
comment on column businesses.booking_invite_code is 'Required query invite code when mode is invite_only';

alter table services
  add column if not exists internal_notes text,
  add column if not exists cancellation_policy text;

comment on column services.internal_notes is 'Staff-only notes, not shown on public booking';
comment on column services.cancellation_policy is 'Optional per-service cancellation copy; falls back to business policy';

alter table customers
  add column if not exists referral_source text;

create table if not exists customer_documents (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  name text not null,
  file_url text not null,
  file_type text,
  created_at timestamptz not null default now()
);

create index if not exists customer_documents_customer_idx
  on customer_documents (customer_id, created_at desc);

alter table customer_documents enable row level security;

drop policy if exists "Owners manage customer documents" on customer_documents;
create policy "Owners manage customer documents"
  on customer_documents for all
  using (
    business_id in (select id from businesses where owner_id = auth.uid())
  )
  with check (
    business_id in (select id from businesses where owner_id = auth.uid())
  );

-- Public appointment create with optional pending status (request approval)
drop function if exists create_public_appointment(uuid, uuid, uuid, uuid, timestamptz, timestamptz, text, uuid);

create or replace function create_public_appointment(
  p_business_id uuid,
  p_service_id uuid,
  p_staff_id uuid,
  p_customer_id uuid,
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_notes text default null,
  p_location_id uuid default null,
  p_status text default 'confirmed'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_location_id uuid;
  v_status text;
begin
  v_location_id := resolve_location_id(p_business_id, p_location_id);
  v_status := case
    when p_status in ('pending', 'confirmed') then p_status
    else 'confirmed'
  end;

  if not exists (
    select 1 from customers
    where id = p_customer_id and business_id = p_business_id
  ) then
    raise exception 'Customer not found';
  end if;

  perform validate_appointment_slot(
    p_business_id, p_service_id, p_staff_id,
    p_start_time, p_end_time, null, v_location_id
  );

  insert into appointments (
    business_id, location_id, service_id, staff_id, customer_id,
    start_time, end_time, status, notes
  )
  values (
    p_business_id, v_location_id, p_service_id, p_staff_id, p_customer_id,
    p_start_time, p_end_time, v_status, p_notes
  )
  returning id into v_id;

  return v_id;
exception
  when exclusion_violation then
    raise exception 'Time slot no longer available';
end;
$$;

grant execute on function create_public_appointment(uuid, uuid, uuid, uuid, timestamptz, timestamptz, text, uuid, text) to anon, authenticated;

-- Storage bucket for logos, covers, and client documents
insert into storage.buckets (id, name, public)
values ('business-assets', 'business-assets', true)
on conflict (id) do nothing;

drop policy if exists "Owners upload business assets" on storage.objects;
drop policy if exists "Public read business assets" on storage.objects;
drop policy if exists "Owners update own assets" on storage.objects;
drop policy if exists "Owners delete own assets" on storage.objects;

create policy "Owners upload business assets"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'business-assets'
    and (storage.foldername(name))[1] in (
      select id::text from businesses where owner_id = auth.uid()
    )
  );

create policy "Public read business assets"
  on storage.objects for select
  to public
  using (bucket_id = 'business-assets');

create policy "Owners update own assets"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'business-assets'
    and (storage.foldername(name))[1] in (
      select id::text from businesses where owner_id = auth.uid()
    )
  );

create policy "Owners delete own assets"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'business-assets'
    and (storage.foldername(name))[1] in (
      select id::text from businesses where owner_id = auth.uid()
    )
  );
