-- Private Alpha: co-owner membership + per-business entitlement override.
-- Keeps subscription_plan_key (Free/starter) unchanged while unlocking product access.
-- Does NOT touch Stripe or platform_admins.

-- ---------------------------------------------------------------------------
-- 1. Private Alpha entitlement override (business-scoped)
-- ---------------------------------------------------------------------------

alter table businesses
  add column if not exists private_alpha_enabled boolean not null default false;

comment on column businesses.private_alpha_enabled is
  'When true, unlocks Private Alpha product entitlements while preserving subscription_plan_key (e.g. Free/starter). No Stripe subscription implied.';

create index if not exists businesses_private_alpha_idx
  on businesses (private_alpha_enabled)
  where private_alpha_enabled = true;

-- ---------------------------------------------------------------------------
-- 2. Business members (co-owners / operators) — single-tenant only
-- ---------------------------------------------------------------------------

create table if not exists business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'owner'
    check (role in ('owner', 'admin')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  unique (business_id, user_id)
);

create index if not exists business_members_user_idx
  on business_members (user_id);

create index if not exists business_members_business_idx
  on business_members (business_id);

alter table business_members enable row level security;

drop policy if exists "Members read own membership" on business_members;
create policy "Members read own membership"
  on business_members for select
  using (
    user_id = auth.uid()
    or is_business_owner(business_id)
  );

-- Writes are service-role / security definer only (no broad insert policy for clients).

grant select on table business_members to authenticated;
grant select, insert, update, delete on table business_members to service_role;

-- ---------------------------------------------------------------------------
-- 3. Expand is_business_owner to include co-owner members
-- ---------------------------------------------------------------------------

create or replace function is_business_owner(bid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from businesses
    where id = bid and owner_id = auth.uid()
  )
  or exists (
    select 1 from business_members
    where business_id = bid
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
$$;

-- ---------------------------------------------------------------------------
-- 4. Location quota: Private Alpha override uses Professional+ limits
-- ---------------------------------------------------------------------------

create or replace function can_add_location(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    case
      when coalesce(b.private_alpha_enabled, false) then true
      when sp.max_locations is null then true
      else (
        select count(*) from locations l where l.business_id = p_business_id
      ) < sp.max_locations
    end
  from businesses b
  left join subscription_plans sp on sp.plan_key = b.subscription_plan_key
  where b.id = p_business_id;
$$;

grant execute on function can_add_location(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. ensure_business_for_owner: prefer owner membership before creating
-- ---------------------------------------------------------------------------

create or replace function ensure_business_for_owner(
  p_name text,
  p_preferred_slug text
)
returns businesses
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid := auth.uid();
  v_business businesses;
  v_candidate text;
  v_attempt int := 0;
  v_location_id uuid;
begin
  if v_owner_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Prefer Private Alpha co-owner membership (design-partner primary tenant).
  select b.* into v_business
  from business_members m
  join businesses b on b.id = m.business_id
  where m.user_id = v_owner_id
    and m.role in ('owner', 'admin')
    and coalesce(b.private_alpha_enabled, false) = true
  order by m.created_at asc
  limit 1;

  if found then
    return v_business;
  end if;

  -- Any owner/admin membership.
  select b.* into v_business
  from business_members m
  join businesses b on b.id = m.business_id
  where m.user_id = v_owner_id
    and m.role in ('owner', 'admin')
  order by m.created_at asc
  limit 1;

  if found then
    return v_business;
  end if;

  -- Primary owned business (one-per-owner).
  select * into v_business from businesses where owner_id = v_owner_id;
  if found then
    perform create_default_location(v_business.id, v_business.name || ' — Main');
    return v_business;
  end if;

  while v_attempt < 6 loop
    if v_attempt = 0 then
      v_candidate := p_preferred_slug;
    elsif v_attempt between 1 and 4 then
      v_candidate := p_preferred_slug || '-' || v_attempt::text;
    else
      v_candidate := 'biz-' || replace(v_owner_id::text, '-', '');
    end if;

    begin
      insert into businesses (owner_id, name, slug)
      values (v_owner_id, p_name, v_candidate)
      returning * into v_business;

      insert into business_hours (business_id, day_of_week, is_open, open_time, close_time)
      select v_business.id, gs.day, gs.day between 1 and 5, '09:00:00'::time, '17:00:00'::time
      from generate_series(0, 6) as gs(day);

      v_location_id := create_default_location(v_business.id, p_name || ' — Main');
      return v_business;
    exception
      when unique_violation then
        select * into v_business from businesses where owner_id = v_owner_id;
        if found then
          perform create_default_location(v_business.id, v_business.name || ' — Main');
          return v_business;
        end if;
    end;

    v_attempt := v_attempt + 1;
  end loop;

  select * into v_business from businesses where owner_id = v_owner_id;
  if found then
    perform create_default_location(v_business.id, v_business.name || ' — Main');
    return v_business;
  end if;

  raise exception 'Failed to create business for owner %', v_owner_id;
end;
$$;

grant execute on function ensure_business_for_owner(text, text) to authenticated;
