-- Issue #112 G-3 PREPARATION ONLY. NOT EXECUTED. Staging only.
-- Never touch Production. No hosted mutation is authorized by this preparation task.
-- Do not use supabase db push / migration up. No automatic migration application.
-- PR #116 head e730483fcf49f850e675dcac9bbe30151a23010e
-- tree 604b3900447a84501f92ed38be8debe4e7060ffa
-- base ea575bb183abd5fb38cab6348494becd6b25e7e3
-- migration supabase/migrations/20260927043000_issue_112_p2b1_subscription_authority.sql
-- blob d6f80298fabb4ad014902ae6a1ed4dfc41dc10c5
-- sha256 b25ecee239bafbc75a1d3ddac09e0512895ca3a017cffbd0f81750924ed26b20

-- REVIEW-ONLY rollback TEMPLATE; must NOT be executed yet.
-- No role privilege changes: no ALTER ROLE, role membership grants or bypass changes.
-- Exact captured policy/grant/RLS state from r1 MUST be substituted and verified.
-- Historical migrations describe likely shapes, never authoritative hosted prestate.
-- Execute only after separate rollback authorization, Staging identity verification,
-- quiescence, evidence retention and proof every P2B-1 object is unused/synthetic-only.
-- If any real mapping/event/invoice/history or dependency exists, ABORT; design a
-- separately reviewed data-preserving recovery. Never CASCADE object drops.
-- Do not replay migrations 015/033 wholesale (they contain unrelated changes).
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
DO $guard$
BEGIN
  -- FAIL CLOSED. This unconditional guard deliberately requires a reviewed edit.
  -- Replace it only after substituting and validating ALL markers below, comparing
  -- captured R1_CAPTURE_BEGIN/R1_CAPTURE_COMPLETE and signed evidence identity.
  RAISE EXCEPTION 'REVIEW ONLY: missing verified R1 prestate and rollback authorization';
END
$guard$;
/*
REQUIRED CAPTURE MARKERS -- all unresolved; text replacement alone is NOT proof:
  R1_CAPTURE_ID = <timestamp + evidence digest + verified Staging project>
  R1_COMPLETE = <complete result sets, no capture errors>
  CAPTURED_POLICIES = <exact policy DDL for ALL three tables>
  CAPTURED_ACL = <all grantees, grantors, grant options, column ACLs, inherited rights>
  CAPTURED_RLS_FLAGS = <enabled/forced booleans for ALL three tables>
  CAPTURED_OWNERS_AND_NB12 = <approved roles, owners and privileges>
  CREATED_OBJECT_IDENTITY = <absent before; exact candidate definitions after>
  SYNTHETIC_ONLY_AND_UNUSED = <reviewed fixture manifest, no other consumers>
  RESTORE_DATA_VERIFIED = <synthetic teardown + pre-existing rows unchanged>
  ROLLBACK_AUTHORIZATION = <Claude/PO reference and precise approved method>

1. Lock public.businesses, public.billing_invoices, public.subscription_events,
   public.saas_subscription_mappings, public.saas_billing_events IN ACCESS EXCLUSIVE
   MODE inside this same transaction. Timeout means STOP, not retry with no timeout.
2. Verify exact current objects, no unknown consumers/dependencies, no data beyond
   the approved fixture manifest. Teardown using exact UUID/event composite keys,
   removing mappings BEFORE businesses; never broad DELETE or TRUNCATE. Compare all
   pre-existing rows and design_partner_applications to captured prestate.
3. Only if absent in r1 and proven created by this migration, execute this narrow
   reverse order; no IF EXISTS masking wrong state, no CASCADE:

DROP TRIGGER saas_mapping_revision ON public.saas_subscription_mappings;
DROP TRIGGER businesses_subscription_authority ON public.businesses;
DROP FUNCTION public.saas_apply(jsonb,jsonb,bigint);
DROP FUNCTION public.saas_receive(jsonb);
DROP FUNCTION public.saas_mapping_revision();
DROP FUNCTION public.guard_subscription_authority();
DROP POLICY saas_no_client_business_insert ON public.businesses;
DROP POLICY saas_invoice_owner_reads ON public.billing_invoices;
DROP TABLE public.saas_billing_events; -- also removes its own indexes/constraints
DROP TABLE public.saas_subscription_mappings;
DROP INDEX public.billing_invoices_provider_identity;
ALTER TABLE public.businesses DROP COLUMN subscription_revision;
DROP SEQUENCE public.saas_subscription_revision_seq;

4. Recreate ONLY captured policies that P2B-1 removed; unchanged policies stay as-is.
   Compare every definition (roles/permissiveness/command/USING/WITH CHECK). Examples
   below are historically accurate; paste them ONLY if present in captured r1.
   015 and 033 use distinct invoice names, so BOTH can coexist and need restoration.

-- 015 direct-owner ALL policy, implicit TO PUBLIC / AS PERMISSIVE:
CREATE POLICY "Owners manage own invoices" ON public.billing_invoices FOR ALL
 USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id=auth.uid()))
 WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_id=auth.uid()));
-- 033 co-owner/admin helper shape, also implicit TO PUBLIC / AS PERMISSIVE:
CREATE POLICY "Owners manage billing invoices" ON public.billing_invoices FOR ALL
 USING (public.is_business_owner(business_id))
 WITH CHECK (public.is_business_owner(business_id));
-- 015 owner INSERT remains direct-owner: 033 did not broaden this policy.
CREATE POLICY "Owners insert own subscription events" ON public.subscription_events FOR INSERT
 WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_id=auth.uid()));
-- Existing SELECT policies were retained by P2B-1; do not recreate over them.
-- Restore any other captured non-SELECT invoice/history policies too.

5. Substitute EXACT per-table captured grants and flags, not guessed defaults:
   For each of businesses / billing_invoices / subscription_events:
   - remove only privileges added by P2B-1; restore removed PUBLIC/anon/authenticated
     and service_role privileges to captured prestate, including WITH GRANT OPTION.
   - Account for NULL ACL (default owner ACL), every other grantee and grantor, and
     column grants. Never blanket-reset other roles; never modify role attributes.
   - Use reviewed REVOKE <added privileges> ON TABLE public.<table> FROM <grantee>;
     GRANT <captured removed privileges> ON TABLE public.<table> TO <grantee>
       [WITH GRANT OPTION]; preserve grantor identity via approved original grantor.
   - ALTER TABLE public.<table> ENABLE ROW LEVEL SECURITY; or DISABLE per r1.
   - ALTER TABLE public.<table> FORCE ROW LEVEL SECURITY; or NO FORCE per r1.
   These are four independent captured choices per table, not universal defaults.
   If preserving grantors/ACL cannot be done with authorized authority, ABORT.
6. Re-run catalog capture comparison: policies, effective ACL, column ACL, owner,
   RLS/FORCE flags, triggers, indexes and pre-existing data must exactly match r1.
   Verify new objects absent and design_partner_applications exactly identical.
   Application callers must no longer require the removed RPCs/column; coordinate
   separately authorized candidate rollback if necessary. Do not deploy here.
7. Only after reviewed assertions pass may a separately authorized operator replace
   the final ROLLBACK with COMMIT. This template intentionally cannot commit.
   Reconcile any migration ledger entry separately; never fabricate/delete ledger
   history as part of this template.
*/
ROLLBACK;
