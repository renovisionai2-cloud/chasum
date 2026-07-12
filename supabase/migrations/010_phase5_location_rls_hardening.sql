-- Tighten location RLS: authenticated users only see own business locations.
-- Public booking uses SECURITY DEFINER RPC (slug → business_id server-side).

drop policy if exists "Public can view active locations" on locations;
drop policy if exists "Public can view location hours" on location_hours;

create policy "Owners read own locations"
  on locations for select
  using (is_business_owner(business_id));

create policy "Owners read own location hours"
  on location_hours for select
  using (
    exists (
      select 1 from locations l
      where l.id = location_hours.location_id
        and is_business_owner(l.business_id)
    )
  );

create or replace function get_public_locations(p_business_id uuid)
returns setof locations
language sql
stable
security definer
set search_path = public
as $$
  select l.*
  from locations l
  join businesses b on b.id = l.business_id
  where l.business_id = p_business_id
    and l.is_active = true
  order by l.is_default desc, l.name;
$$;

grant execute on function get_public_locations(uuid) to anon, authenticated;

create or replace function get_public_location_by_slug(
  p_business_id uuid,
  p_location_slug text
)
returns locations
language sql
stable
security definer
set search_path = public
as $$
  select l.*
  from locations l
  where l.business_id = p_business_id
    and l.slug = p_location_slug
    and l.is_active = true
  limit 1;
$$;

grant execute on function get_public_location_by_slug(uuid, text) to anon, authenticated;
