-- Allow Private Alpha co-owners to manage their tenant (not only primary owner_id).
-- Fixes businesses / billing / communications policies that still hard-coded owner_id.

-- ---------------------------------------------------------------------------
-- Businesses: co-owners (via is_business_owner) can manage the tenant row
-- ---------------------------------------------------------------------------

drop policy if exists "Owners manage their businesses" on businesses;
create policy "Owners manage their businesses"
  on businesses for all
  using (
    owner_id = auth.uid()
    or is_business_owner(id)
  )
  with check (
    owner_id = auth.uid()
    or is_business_owner(id)
  );

-- ---------------------------------------------------------------------------
-- Billing phase 1 — scope by is_business_owner
-- ---------------------------------------------------------------------------

do $$
begin
  if to_regclass('public.billing_invoices') is not null then
    execute 'drop policy if exists "Owners manage billing invoices" on billing_invoices';
    execute $p$
      create policy "Owners manage billing invoices"
        on billing_invoices for all
        using (is_business_owner(business_id))
        with check (is_business_owner(business_id))
    $p$;
  end if;

  if to_regclass('public.billing_events') is not null then
    execute 'drop policy if exists "Owners manage billing events" on billing_events';
    execute $p$
      create policy "Owners manage billing events"
        on billing_events for all
        using (is_business_owner(business_id))
        with check (is_business_owner(business_id))
    $p$;
  end if;

  if to_regclass('public.subscription_changes') is not null then
    execute 'drop policy if exists "Owners manage subscription changes" on subscription_changes';
    execute $p$
      create policy "Owners manage subscription changes"
        on subscription_changes for all
        using (is_business_owner(business_id))
        with check (is_business_owner(business_id))
    $p$;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Customer documents (sprint 8) — was hard-coded to owner_id
-- ---------------------------------------------------------------------------

do $$
begin
  if to_regclass('public.customer_documents') is not null then
    execute 'drop policy if exists "Owners manage customer documents" on customer_documents';
    execute $p$
      create policy "Owners manage customer documents"
        on customer_documents for all
        using (is_business_owner(business_id))
        with check (is_business_owner(business_id))
    $p$;
  end if;
end $$;
