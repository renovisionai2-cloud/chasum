-- One business per authenticated owner + atomic ensure RPC.
-- Safe to run after scripts/cleanup-duplicate-businesses.mjs (or uses guarded dedupe below).

-- ---------------------------------------------------------------------------
-- 1. Remove duplicate businesses (keep oldest per owner; skip rows with data)
-- ---------------------------------------------------------------------------

delete from businesses b
where b.id in (
  select b2.id
  from businesses b2
  join (
    select owner_id, min(created_at) as keep_created_at
    from businesses
    group by owner_id
    having count(*) > 1
  ) d on d.owner_id = b2.owner_id and b2.created_at > d.keep_created_at
)
and not exists (select 1 from services s where s.business_id = b.id)
and not exists (select 1 from staff st where st.business_id = b.id)
and not exists (select 1 from customers c where c.business_id = b.id)
and not exists (select 1 from appointments a where a.business_id = b.id);

-- ---------------------------------------------------------------------------
-- 2. Enforce one primary business per owner
-- ---------------------------------------------------------------------------

create unique index if not exists businesses_one_per_owner_idx
  on businesses (owner_id);

-- ---------------------------------------------------------------------------
-- 3. Atomic get-or-create (idempotent under concurrent requests)
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
  v_slug text;
  v_candidate text;
  v_attempt int := 0;
begin
  if v_owner_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_business
  from businesses
  where owner_id = v_owner_id;

  if found then
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
      select
        v_business.id,
        gs.day,
        gs.day between 1 and 5,
        '09:00:00'::time,
        '17:00:00'::time
      from generate_series(0, 6) as gs(day);

      return v_business;
    exception
      when unique_violation then
        select * into v_business
        from businesses
        where owner_id = v_owner_id;

        if found then
          return v_business;
        end if;
    end;

    v_attempt := v_attempt + 1;
  end loop;

  select * into v_business
  from businesses
  where owner_id = v_owner_id;

  if found then
    return v_business;
  end if;

  raise exception 'Failed to create business for owner %', v_owner_id;
end;
$$;

revoke all on function ensure_business_for_owner(text, text) from public;
grant execute on function ensure_business_for_owner(text, text) to authenticated;
