-- TEST ONLY. Every client/service assertion uses actual SET LOCAL ROLE.
-- All mutations below are rolled back. No corrected-P2B behavior is asserted.
begin;
set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000101';
select p2b1_test.actor('authenticated', '00000000-0000-0000-0000-000000000101');
select p2b1_test.expect((select count(*) = 2 from businesses), 'public Business reads preserved');
select p2b1_test.expect((select count(*) = 1 from billing_invoices), 'owner invoice read scope');
select p2b1_test.expect((select count(*) = 1 from subscription_events), 'direct-owner event read scope');
with changed as (
 update businesses set name = 'Synthetic A edited', timezone = 'America/Toronto'
 where id = '00000000-0000-0000-0000-000000000201' returning name, timezone
) select p2b1_test.expect((select count(*) = 1 and bool_and(name = 'Synthetic A edited' and timezone = 'America/Toronto') from changed), 'ordinary settings write');
with changed as (
 update businesses set name = 'Forbidden' where id = '00000000-0000-0000-0000-000000000202' returning id
) select p2b1_test.expect((select count(*) = 0 from changed), 'owner A cannot edit B');
select p2b1_test.expect_denied($sql$update businesses set owner_id = '00000000-0000-0000-0000-000000000105' where id = '00000000-0000-0000-0000-000000000201'$sql$);
-- Deliberately demonstrate historical authority gaps, not their remediation.
with changed as (
 update businesses set subscription_plan_key = 'professional', subscription_status = 'paused',
 stripe_customer_id = 'synthetic_customer', stripe_subscription_id = 'synthetic_subscription'
 where id = '00000000-0000-0000-0000-000000000201' returning id
) select p2b1_test.expect((select count(*) = 1 from changed), 'existing subscription/provider-column write gap');
insert into billing_invoices(business_id,invoice_number,stripe_invoice_id) values
 ('00000000-0000-0000-0000-000000000201','SYN-GAP-1','synthetic_duplicate_invoice'),
 ('00000000-0000-0000-0000-000000000201','SYN-GAP-2','synthetic_duplicate_invoice');
select p2b1_test.expect((select count(*) = 2 and bool_and(currency = 'usd' and status = 'paid' and period_start is null and period_end is null)
 from billing_invoices where stripe_invoice_id = 'synthetic_duplicate_invoice'), 'existing invoice authority/identity/default gaps');
insert into subscription_events(business_id,event_type) values ('00000000-0000-0000-0000-000000000201','invoice_paid');
select p2b1_test.expect((select count(*) = 1 from subscription_events where event_type = 'invoice_paid' and currency = 'usd'), 'existing owner event insertion/default gap');
select p2b1_test.expect_denied($sql$insert into billing_invoices(business_id,invoice_number) values ('00000000-0000-0000-0000-000000000202','FORBIDDEN')$sql$);
select p2b1_test.expect_denied($sql$insert into subscription_events(business_id,event_type) values ('00000000-0000-0000-0000-000000000202','created')$sql$);
rollback;
\echo 'OBSERVED BASELINE GAPS: own subscription/provider fields writable; invoices/events client-writable; duplicate provider invoice IDs; legacy usd/paid/null-period defaults. NOT SECURITY PASS.'

begin;
set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000103';
select p2b1_test.actor('authenticated', '00000000-0000-0000-0000-000000000103');
select p2b1_test.expect((select count(*) = 1 from billing_invoices), 'business admin invoice audience');
select p2b1_test.expect((select count(*) = 0 from subscription_events), 'do not expand direct-owner event audience');
with changed as (
 update businesses set timezone = 'America/Toronto' where id = '00000000-0000-0000-0000-000000000201' returning id
) select p2b1_test.expect((select count(*) = 1 from changed), 'membership admin settings writer');
insert into billing_invoices(business_id,invoice_number,currency,status) values
 ('00000000-0000-0000-0000-000000000201','SYN-ADMIN-GAP','cad','open');
select p2b1_test.expect_denied($sql$insert into subscription_events(business_id,event_type) values ('00000000-0000-0000-0000-000000000201','created')$sql$);
rollback;
\echo 'OBSERVED BASELINE GAP: business admin can insert own-business invoices; subscription-event audience remains direct-owner only.'

begin;
set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000104';
select p2b1_test.actor('authenticated', '00000000-0000-0000-0000-000000000104');
select p2b1_test.expect((select count(*) = 1 from billing_invoices), 'co-owner invoice audience');
select p2b1_test.expect((select count(*) = 0 from subscription_events), 'co-owner is not direct event owner');
with changed as (
 update businesses set name = 'Synthetic co-owner edit' where id = '00000000-0000-0000-0000-000000000201' returning id
) select p2b1_test.expect((select count(*) = 1 from changed), 'membership owner settings writer');
rollback;

begin;
set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000102';
select p2b1_test.actor('authenticated', '00000000-0000-0000-0000-000000000102');
select p2b1_test.expect((select count(*) = 1 and bool_and(business_id = '00000000-0000-0000-0000-000000000202') from billing_invoices), 'cross-business owner read scope');
with changed as (
 update businesses set name = 'Forbidden' where id = '00000000-0000-0000-0000-000000000201' returning id
) select p2b1_test.expect((select count(*) = 0 from changed), 'owner B cannot edit A');
select p2b1_test.expect_denied($sql$insert into billing_invoices(business_id,invoice_number) values ('00000000-0000-0000-0000-000000000201','FORBIDDEN-B')$sql$);
rollback;

begin;
set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000105';
select p2b1_test.actor('authenticated', '00000000-0000-0000-0000-000000000105');
select p2b1_test.expect((select count(*) = 0 from billing_invoices), 'outsider invoice read denied');
select p2b1_test.expect((select count(*) = 0 from subscription_events), 'outsider event read denied');
with changed as (update businesses set name = 'Forbidden' returning id)
 select p2b1_test.expect((select count(*) = 0 from changed), 'outsider settings write denied');
select p2b1_test.expect_denied($sql$insert into subscription_events(business_id,event_type) values ('00000000-0000-0000-0000-000000000201','created')$sql$);
select p2b1_test.expect(has_table_privilege(current_user, 'billing_invoices', 'TRUNCATE')
 and has_table_privilege(current_user, 'subscription_events', 'TRUNCATE'), 'existing effective TRUNCATE grant');
truncate billing_invoices, subscription_events;
rollback;
\echo 'OBSERVED BASELINE GAP: actual authenticated outsider TRUNCATE succeeds outside RLS (rolled back). NOT SECURITY PASS; no HTTP route claim.'

begin;
set local role anon;
set local request.jwt.claim.role = 'anon';
set local request.jwt.claim.sub = '';
select p2b1_test.actor('anon', null);
select p2b1_test.expect((select count(*) = 2 from businesses), 'anonymous public Business read');
select p2b1_test.expect((select count(*) = 0 from billing_invoices), 'anonymous invoice read denied');
select p2b1_test.expect_denied($sql$insert into billing_invoices(business_id,invoice_number) values ('00000000-0000-0000-0000-000000000201','FORBIDDEN-ANON')$sql$);
truncate billing_invoices, subscription_events;
rollback;
\echo 'OBSERVED BASELINE GAP: actual anon TRUNCATE succeeds (rolled back). NOT SECURITY PASS.'

begin;
set local role service_role;
set local request.jwt.claim.role = 'service_role';
set local request.jwt.claim.sub = '';
select p2b1_test.actor('service_role', null);
select p2b1_test.expect((select count(*) = 2 from billing_invoices), 'service BYPASSRLS read');
with changed as (
 update businesses set subscription_plan_key = 'professional' where id = '00000000-0000-0000-0000-000000000201' returning id
) select p2b1_test.expect((select count(*) = 1 from changed), 'baseline trusted DB writer, not application Admin acceptance');
rollback;
\echo 'PRE-CORRECTION fixture behavior observed using actual roles; no migration or atomic-apply verification performed.'
