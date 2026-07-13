-- Sprint 7: Public booking experience — business description + public customer lookup

alter table businesses
  add column if not exists description text;

comment on column businesses.description is 'Public-facing business description on the booking page';

-- Prefill returning customers by email without exposing other clients (tenant-scoped).
create or replace function lookup_booking_customer(
  p_business_id uuid,
  p_email text
)
returns table (name text, phone text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_email is null or length(trim(p_email)) = 0 then
    return;
  end if;

  return query
  select c.name, c.phone
  from customers c
  where c.business_id = p_business_id
    and lower(c.email) = lower(trim(p_email))
  limit 1;
end;
$$;

grant execute on function lookup_booking_customer(uuid, text) to anon, authenticated;
