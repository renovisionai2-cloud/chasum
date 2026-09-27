-- Issue #112 G-3 PREPARATION ONLY. NOT EXECUTED. Staging only.
-- Never touch Production. No hosted mutation is authorized by this preparation task.
-- Do not use supabase db push / migration up. No automatic migration application.
-- PR #116 head e730483fcf49f850e675dcac9bbe30151a23010e
-- tree 604b3900447a84501f92ed38be8debe4e7060ffa
-- base ea575bb183abd5fb38cab6348494becd6b25e7e3
-- migration supabase/migrations/20260927043000_issue_112_p2b1_subscription_authority.sql
-- blob d6f80298fabb4ad014902ae6a1ed4dfc41dc10c5
-- sha256 b25ecee239bafbc75a1d3ddac09e0512895ca3a017cffbd0f81750924ed26b20

-- READ-ONLY CAPTURE. Execute only in a separately verified Staging connection.
-- Preserve every result, including empty sets, with timestamp and project identity.
-- Any error/missing relation/insufficient visibility means INCOMPLETE: ABORT gate.
-- Use a stop-on-error client. No data or schema modification occurs in this script.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
SELECT 'R1_CAPTURE_BEGIN' AS marker, current_database(), current_user, session_user,
       clock_timestamp(), current_setting('transaction_read_only') AS read_only;

SELECT * FROM pg_policies
WHERE schemaname='public' AND tablename IN ('businesses','billing_invoices','subscription_events')
ORDER BY tablename,policyname;
-- Exact policy recreation text, including roles, permissiveness, command and predicates.
SELECT format('CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s%s%s;',
 policyname,schemaname,tablename,permissive,cmd,
 (SELECT string_agg(CASE WHEN r='public' THEN 'PUBLIC' ELSE quote_ident(r) END, ', ' ORDER BY r)
  FROM unnest(roles) r),
 CASE WHEN qual IS NULL THEN '' ELSE ' USING ('||qual||')' END,
 CASE WHEN with_check IS NULL THEN '' ELSE ' WITH CHECK ('||with_check||')' END) AS captured_policy_ddl
FROM pg_policies WHERE schemaname='public'
 AND tablename IN ('businesses','billing_invoices','subscription_events') ORDER BY tablename,policyname;

SELECT c.oid::regclass AS relation, c.relrowsecurity, c.relforcerowsecurity,
       pg_get_userbyid(c.relowner) AS owner, c.relacl AS raw_acl,
       acldefault('r',c.relowner) AS default_acl_if_null
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname IN ('businesses','billing_invoices','subscription_events')
ORDER BY c.relname;
-- Complete expanded ACL, including PUBLIC (OID 0), grantor and grant option.
SELECT c.oid::regclass AS relation, pg_get_userbyid(a.grantor) AS grantor,
 CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END AS grantee,
 a.privilege_type,a.is_grantable
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
CROSS JOIN LATERAL aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) a
WHERE n.nspname='public' AND c.relname IN ('businesses','billing_invoices','subscription_events')
ORDER BY relation,grantee,privilege_type;
-- Effective role privileges include inherited and PUBLIC grants. PUBLIC is not a role:
-- its rights are the grantee=PUBLIC rows above; absence explicitly means no grants.
SELECT c.oid::regclass AS relation,r.rolname,v.privilege,
 has_table_privilege(r.oid,c.oid,v.privilege) AS effective
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
CROSS JOIN pg_roles r
CROSS JOIN (VALUES ('SELECT'),('INSERT'),('UPDATE'),('DELETE'),('TRUNCATE'),('REFERENCES'),('TRIGGER')) v(privilege)
WHERE n.nspname='public' AND c.relname IN ('businesses','billing_invoices','subscription_events')
 AND r.rolname IN ('anon','authenticated','service_role') ORDER BY relation,r.rolname,v.privilege;
-- Column ACLs are captured too: table revocation does not erase column grants.
SELECT c.oid::regclass AS relation,a.attname,a.attacl
FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname IN ('businesses','billing_invoices','subscription_events')
 AND a.attnum>0 AND NOT a.attisdropped ORDER BY relation,a.attnum;
SELECT t.tgrelid::regclass AS relation,t.tgname,t.tgenabled,t.tgisinternal,
 pg_get_triggerdef(t.oid,true) AS definition
FROM pg_trigger t WHERE t.tgrelid IN ('public.businesses'::regclass,
 'public.billing_invoices'::regclass,'public.subscription_events'::regclass)
ORDER BY relation,t.tgname;
-- tgenabled: O=origin/local, R=replica, A=always, D=disabled. All are retained.
SELECT indexname,indexdef FROM pg_indexes
WHERE schemaname='public' AND tablename='billing_invoices' ORDER BY indexname;

SELECT rolname,rolsuper,rolbypassrls,rolinherit,rolcanlogin FROM pg_roles
WHERE rolname IN ('service_role','authenticator','anon','authenticated','postgres')
 OR oid IN (SELECT relowner FROM pg_class WHERE oid IN
 ('public.businesses'::regclass,'public.billing_invoices'::regclass,'public.subscription_events'::regclass))
ORDER BY rolname;
SELECT pg_get_userbyid(roleid) AS granted_role,pg_get_userbyid(member) AS member,
 admin_option FROM pg_auth_members ORDER BY granted_role,member;
-- NB-12 ABORT interpretation (not a claim about unobserved hosted roles):
-- STOP if any required role is absent; anon/authenticated/authenticator must not
-- be superuser or BYPASSRLS. Review inherited authority/membership as well.
-- service_role must have effective hosted RLS bypass under FORCE RLS; ordinary
-- ownership alone does NOT bypass FORCE RLS. Its trusted path requires current_user
-- exactly service_role. Never ALTER ROLE to make tests pass.
-- Compare postgres and every captured table owner against Claude's approved role/
-- owner matrix, and verify the future sequence/function/new-table creator/owner.
-- Unknown/unapproved owner, unexpected superuser/BYPASSRLS or membership, missing
-- service_role bypass, or inability to verify any of these => ABORT before apply.
-- No approved NB-12 matrix supplied here: capture is evidence, NOT automatic PASS.

-- Broad catalog collision scan: all listed names, every schema, all overloads.
WITH names(name) AS (VALUES ('saas_subscription_mappings'),('saas_billing_events'),
 ('saas_subscription_revision_seq'),('guard_subscription_authority'),('saas_mapping_revision'),
 ('saas_receive'),('saas_apply'),('billing_invoices_provider_identity'),
 ('businesses_subscription_authority'),('subscription_revision')),
 hits AS (
 SELECT 'relation' AS kind,n.nspname AS schema,c.relname AS name,c.oid::text AS identity
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 UNION ALL SELECT 'function',n.nspname,p.proname,p.oid::regprocedure::text
 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 UNION ALL SELECT 'trigger',n.nspname,t.tgname,t.tgrelid::regclass::text
 FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace
 UNION ALL SELECT 'column',n.nspname,a.attname,c.oid::regclass::text
 FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE a.attnum>0 AND NOT a.attisdropped
 UNION ALL SELECT 'policy',n.nspname,p.polname,p.polrelid::regclass::text
 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid JOIN pg_namespace n ON n.oid=c.relnamespace)
SELECT names.name,h.kind,h.schema,h.identity FROM names LEFT JOIN hits h USING(name)
ORDER BY names.name,h.kind,h.schema,h.identity;
-- Any collision => ABORT pending review; IF NOT EXISTS is not identity validation.
-- Also capture P2B-1 policy names not included in the requested object list.
SELECT * FROM pg_policies WHERE policyname IN ('saas_no_client_business_insert','saas_invoice_owner_reads');
SELECT * FROM pg_indexes WHERE indexname='saas_billing_recovery';

SELECT 'businesses' AS metric,count(*) AS n FROM public.businesses
UNION ALL SELECT 'billing_invoices',count(*) FROM public.billing_invoices
UNION ALL SELECT 'subscription_events',count(*) FROM public.subscription_events
UNION ALL SELECT 'businesses.stripe_customer_id nonnull',count(*) FROM public.businesses WHERE stripe_customer_id IS NOT NULL
UNION ALL SELECT 'businesses.stripe_subscription_id nonnull',count(*) FROM public.businesses WHERE stripe_subscription_id IS NOT NULL
UNION ALL SELECT 'billing_invoices.stripe_invoice_id nonnull',count(*) FROM public.billing_invoices WHERE stripe_invoice_id IS NOT NULL
UNION ALL SELECT 'duplicate nonnull stripe_invoice_id groups',count(*) FROM
 (SELECT stripe_invoice_id FROM public.billing_invoices WHERE stripe_invoice_id IS NOT NULL GROUP BY stripe_invoice_id HAVING count(*)>1) d
UNION ALL SELECT 'duplicate nonnull stripe_invoice_id excess rows',coalesce(sum(n-1),0)::bigint FROM
 (SELECT count(*) n FROM public.billing_invoices WHERE stripe_invoice_id IS NOT NULL GROUP BY stripe_invoice_id HAVING count(*)>1) d
UNION ALL SELECT 'businesses.offer_id nonnull',count(*) FROM public.businesses WHERE offer_id IS NOT NULL
UNION ALL SELECT 'plan_offers',count(*) FROM public.plan_offers
UNION ALL SELECT 'design_partner_applications',count(*) FROM public.design_partner_applications;
-- Full deterministic JSON comparison evidence, not just a row count. Keep private.
SELECT coalesce(jsonb_agg(to_jsonb(d) ORDER BY to_jsonb(d)::text),'[]'::jsonb)
 AS design_partner_applications_exact_prestate FROM public.design_partner_applications d;
SELECT 'R1_CAPTURE_COMPLETE' AS marker;
ROLLBACK;
