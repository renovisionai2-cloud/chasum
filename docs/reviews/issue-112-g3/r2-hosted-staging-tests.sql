-- Issue #112 G-3 PREPARATION ONLY. NOT EXECUTED. Staging only.
-- Never touch Production. No hosted mutation is authorized by this preparation task.
-- Do not use supabase db push / migration up. No automatic migration application.
-- PR #116 head e730483fcf49f850e675dcac9bbe30151a23010e
-- tree 604b3900447a84501f92ed38be8debe4e7060ffa
-- base ea575bb183abd5fb38cab6348494becd6b25e7e3
-- migration supabase/migrations/20260927043000_issue_112_p2b1_subscription_authority.sql
-- blob d6f80298fabb4ad014902ae6a1ed4dfc41dc10c5
-- sha256 b25ecee239bafbc75a1d3ddac09e0512895ca3a017cffbd0f81750924ed26b20

-- REVIEW-ONLY HOSTED STAGING ACCEPTANCE RUNBOOK. NOT an executable test suite.
-- All SQL examples below are inert comments. No auto-apply.
-- No second execution of the migration file on Staging in G-3.
-- The guard prevents accidental execution from being mistaken for acceptance.
BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '30s';
DO $review$ BEGIN
 RAISE EXCEPTION 'REVIEW ONLY: G-3 hosted execution requires completed PRECHECK and reviewed operator adaptation';
END $review$;
ROLLBACK;
/*
PRECHECK -- STOP on ANY failure or UNKNOWN, before migration or fixture creation
1. Independently verify the connection and application data plane are the approved
   isolated Staging project. Never use GVM, Chasum HQ, or ANY existing tenant as a
   test fixture. Never touch Production. Do not infer identity from database name.
   Record project identity and timestamp without credentials/tokens/customer data.
2. Verify PR/head/tree/base and migration blob/SHA-256 against the header, including
   working-file bytes. STOP on candidate/migration identity mismatch or scope drift.
   This local preparation verified the candidate; it is not a hosted verification.
3. Collect r1-preapply-capture.sql in a read-only repeatable-read snapshot. Save all
   output privately. Missing tables/columns, incomplete output or errors => STOP.
   All named object collisions, including overloads/columns/triggers/policies and
   saas_billing_recovery, must be absent before apply. STOP on any collision, even
   when candidate uses IF NOT EXISTS. READ the migration ledger as a precheck:
   prior application of 20260927043000 => STOP. WRITE NO ledger row in G-3.
   Do not repair/fabricate/delete 034–038 ledger entries. After a separately authorized
   Staging apply, explicitly record in Environment Manifest that it was applied
   out-of-band from unmerged Draft PR #116, the exact migration SHA-256, and that
   the ledger row was deliberately not written. Reconsider ledger treatment once
   for Staging/Production at G-5/G-6.
4. Require zero businesses with non-null stripe_customer_id/stripe_subscription_id;
   zero non-null invoice provider IDs and zero duplicate non-null invoice IDs;
   zero businesses.offer_id and zero plan_offers. Unexpected invoices/history or
   count differences from Claude's approved prestate => STOP, never delete to pass.
   Existing non-provider invoices require explicit expected baseline confirmation.
   Preserve design_partner_applications using deterministic per-row digests over ALL
   columns, ordered deterministically, plus row count and ordered column-name list.
   Travelling evidence must contain no full pre-existing tenant/application payloads.
5. NB-12: bind captured owners/role attributes/membership to this exact matrix
   (rolsuper / rolbypassrls): service_role=false/true; anon=false/false;
   authenticated=false/false; authenticator=false/false; postgres=false/true.
   postgres.rolsuper=false is EXPECTED on hosted Supabase; bypass=true is determinant.
   Owners of businesses/billing_invoices/subscription_events must each have
   rolsuper OR rolbypassrls true; captured postgres or supabase_admin is acceptable.
   ABORT if:
   (a) service_role has neither bypass nor superuser;
   (b) anon/authenticated/authenticator has superuser or bypass true;
   (c) owner of any of the three existing tables has neither superuser nor bypass;
   (d) any required role is absent;
   (e) service_role or another bypassing/superuser role is granted to anon or
       authenticated, directly or through a membership chain;
   (f) any of the three tables already has FORCE RLS shape contradicting migration;
   (g) ROLE THAT WILL EXECUTE APPLY has neither superuser nor bypass. This is
       load-bearing: new mapping/event tables use FORCE RLS with zero policies.
   Capture/verify the apply role and creator/owners of new functions, sequence and
   tables; missing required evidence => STOP. current_user must match each tested role.
   Do not wrongfully abort because authenticator is a member of service_role:
   role attributes are not inherited through membership; authenticator.rolbypassrls
   remains false until SET ROLE. Ordinary ownership alone cannot bypass FORCE RLS.
   Record but do not abort for supabase_admin ownership satisfying the owner rule,
   rolcanlogin differences on non-login roles, or additional Supabase platform
   bypass roles unless they violate the owner condition; (a)–(g) still apply.
   Do not ALTER ROLE, change memberships or relax FORCE RLS to make this pass.
6. r1-reverse-restore.sql remains placeholder-bearing and WILL NOT be executed.
   Concretize it only from real G-3a read-only capture output, then return it to
   Claude Development Control Tower for re-review before any mutating statement.
   Confirm r1-reverse-restore.sql has been populated/reviewed against this capture
   before apply; it remains separately gated for actual rollback authorization.
   Capture rollback evidence and resolve all restoration placeholders in advance.
7. Do not use supabase db push / migration up. Only the separately approved exact
   single migration may be applied by the authorized operator. This file neither
   applies nor authorizes it. Immediately after the first apply, before any fixtures,
   perform the READ-ONLY POST-APPLY SHAPE VERIFICATION below against the exact candidate.
   Hosted migration re-application is NOT AUTHORIZED in G-3.
   No second execution of the migration file on Staging in G-3.
8. Confirm a quiet test window (or compare protected snapshots for concurrent drift).
   Do not stop workers/change config without separate authorization. If unrelated
   writes prevent exact comparison, mark INCONCLUSIVE and stop; never rewrite data.
   Review all existing insert/update/delete triggers on fixture tables for side
   effects; no provider sends, queues or real billing. Unbounded effects => STOP.

READ-ONLY POST-APPLY SHAPE VERIFICATION -- immediately after first apply
Use only SELECT catalog/privilege inspection inside a READ ONLY transaction with
lock_timeout='3s' and statement_timeout='30s', ending ROLLBACK. Record definitions
and explicit expected/actual assertions; missing/unequal/UNKNOWN => STOP. Do not
repair shape, change grants or rerun the migration to obtain a pass.
- Exactly these five intended public tables are present: businesses, billing_invoices,
  subscription_events, saas_subscription_mappings, saas_billing_events. Do not count
  unrelated public tables as failures. Each has relrowsecurity=true AND
  relforcerowsecurity=true (pg_class joined to pg_namespace).
- pg_trigger/pg_get_triggerdef: businesses_subscription_authority is enabled
  (tgenabled='O'), BEFORE UPDATE, FOR EACH ROW on public.businesses, invoking
  public.guard_subscription_authority(), with the exact UPDATE OF column list:
  subscription_plan_key, subscription_status, billing_interval, trial_starts_at,
  trial_ends_at, current_period_start, current_period_end, cancel_at_period_end,
  canceled_at, stripe_customer_id, stripe_subscription_id, private_alpha_enabled,
  subscription_revision. Resolve tgattr through pg_attribute; no missing/extra column.
- pg_constraint/pg_get_constraintdef: both mapping UNIQUE constraints are present
  on (provider_account, livemode, subscription_id) and
  (provider_account, livemode, customer_id), on public.saas_subscription_mappings.
- pg_index/pg_get_indexdef/pg_get_expr: billing_invoices_provider_identity is valid,
  ready and UNIQUE on public.billing_invoices(stripe_invoice_id), with predicate
  stripe_invoice_id IS NOT NULL; assert exact key/predicate, not merely index name.
- pg_policies: ZERO non-SELECT policies on billing_invoices and subscription_events.
  saas_invoice_owner_reads is present on billing_invoices: PERMISSIVE SELECT TO
  authenticated USING (public.is_business_owner(business_id)). The direct-owner
  subscription_events SELECT policy is preserved verbatim from R-1a, including
  roles/permissiveness/USING/WITH CHECK; retain every other captured SELECT policy.
- Client grants revoked exactly as the candidate requires, inspecting raw/expanded
  ACLs, PUBLIC, inherited effective rights AND column ACLs (table revocation alone
  is insufficient): no client INSERT on businesses; no client privilege on mappings
  or billing events; no client invoice/history INSERT/UPDATE/DELETE/TRUNCATE/
  REFERENCES/TRIGGER. authenticated retains invoice/history SELECT; anon/PUBLIC
  do not acquire it. Existing ordinary business SELECT/UPDATE rights are preserved.
  No anon/authenticated/PUBLIC rights on saas_subscription_revision_seq.
- service_role grants present: SELECT/INSERT/UPDATE/DELETE on all five tables;
  USAGE on saas_subscription_revision_seq; EXECUTE on saas_receive(jsonb) and
  saas_apply(jsonb,jsonb,bigint). Verify effective rights and captured approved
  role/owner matrix without altering role attributes or memberships.
- Function EXECUTE revoked from anon/authenticated and PUBLIC on all four:
  guard_subscription_authority(), saas_mapping_revision(), saas_receive(jsonb),
  saas_apply(jsonb,jsonb,bigint). Inspect pg_proc ACLs and has_function_privilege;
  inherited or PUBLIC execution must not bypass revocation.
This verifies post-apply shape only; it is not hosted migration re-application proof.

OPERATOR HARNESS CONTRACT -- required before calling any test PASS
- Every later SQL transaction, including receipt, apply, negative probes and teardown,
  MUST begin with SET LOCAL lock_timeout = '3s'; SET LOCAL statement_timeout = '30s';
  use a stop-on-error client. API probes require verified equivalent server-side
  timeout bounds. Missing bounds or a timeout => STOP; never disable limits to pass.
- Every Staging-specific adaptation MUST be discovered from R-1a capture and linked
  to the exact captured evidence. Synthetic businesses/auth.users MUST satisfy actual
  captured NOT NULL/CHECK/FK requirements, including required referenced rows.
  Fixture adaptation uses captured R1a-B evidence. If ANY required constraint,
  default, FK or trigger evidence remains missing or UNKNOWN, STOP and report
  UNKNOWN / NOT RUN to Claude; never infer missing fields from historical migrations.
- Prohibited as adaptation: add/alter column; alter constraint; alter policy; alter
  trigger; alter grant; modify any existing tenant row; weaken/skip/delete assertion.
  If an assertion cannot execute against real Staging state: STOP and report
  UNKNOWN / NOT RUN. Do not silently relax anything to make the run pass.
- Adapt only to captured hosted schema; DO NOT run the disposable cluster baseline,
  historical migrations, full-verification runner or local fixture IDs on hosted DB.
- Each assertion records actual DB current_user, session_user, auth.uid(), expected
  vs actual result/SQLSTATE, affected row count, before/after footprint and timestamp.
- Use actual SET LOCAL ROLE anon/authenticated/service_role on a trusted authorized
  SQL connection, not just JWT claims on postgres. Assert current_user immediately.
  Separately exercise signed hosted API credentials for anon, authenticated fixture
  users and server-side service_role; SQL impersonation alone is not API acceptance.
  Do not store keys/JWTs or expose service credentials in browser/logs.
- Set local request.jwt.claims with sub and role plus legacy request.jwt.claim.sub
  and request.jwt.claim.role consistently for normal SQL probes. Restore/reset via
  ROLLBACK per role block. Invalid JWT signatures over API must be rejected (401).
- Denial means SQLSTATE 42501, or explicitly documented zero-row RLS filtering with
  a proven existing target and unchanged footprint. Syntax/constraint/not-null errors
  are NOT permission passes. Use valid rows and test savepoints. Unexpected success
  is FAIL; roll back immediately, including when denied-operation tests run in a
  transaction. Never commit negative probes. All examples use schema-qualified names.
- Every mutation filters exact fixture UUID or full provider-account/livemode/event
  key from a privately retained manifest, never slug/prefix-only bulk mutation.

SYNTHETIC FIXTURES AND EXACT COUNT LEDGER
- Generate fresh UUIDs A/B, five fresh synthetic auth identities (A owner, B owner,
  A co-owner, A member-admin, outsider), unique run tag g3_112_<nonce>, distinct
  slugs and provider identifiers. Confirm zero collisions BEFORE creation. Do not
  reuse an existing user/tenant, enable real providers or send invitations/emails.
- Create two synthetic businesses A/B using reviewed hosted-required fields with
  offer_id NULL, provider IDs NULL. Add exactly two A membership rows (co-owner and
  admin) only after verifying the hosted is_business_owner membership contract.
  No platform-admin assignment to existing users. B belongs only to its own owner.
- Seed exactly one invoice (NULL stripe_invoice_id, unique invoice_number) and one
  subscription_events row for A through service_role for read-preservation probes.
  Use an existing catalog plan (professional) read-only; never modify the catalog.
- Record exact baseline counts before migration and after migration, before fixtures:
  businesses B0; invoices I0; history H0; members M0; auth users U0;
  plan_offers O0=0; applications D0 plus ordered all-column row digests/column names.
  After migration mapping/event counts MUST be 0/0. Immediately after fixture seed: B0+2/I0+1/H0+1/M0+2/U0+5.
  Additional automatically created fixture rows must be enumerated by table/key and
  exact count before testing; unexplained side effects => STOP and review teardown.
- Snapshot existing businesses/invoices/history and design_partner_applications at
  start/end as deterministic per-row digests over ALL columns, ordered deterministically,
  plus row count and ordered column-name list. Travelling evidence is this structure only.
  Exclude only manifest UUIDs on comparisons. Migration adds subscription_revision:
  compare digests over ALL captured pre-migration business columns, retaining their
  ordered names, and separately assert each existing new revision=0; also capture
  all-column post-migration digests and ordered column names for later comparisons.
  Full SYNTHETIC row content is allowed and useful. Any full pre-existing tenant or
  application content retained by an operator stays private local only; never transmit
  it to Control Tower, GitHub, Environment Manifest or chat. Never print existing
  customer/provider data in a public report; the same prohibition covers all full
  pre-existing tenant/application row content.

REAL-ROLE SECURITY MATRIX (use only A/B; repeat hosted API counterparts)
A. Protected businesses writes: as anon and authenticated A owner/co-owner/admin,
   individually attempt changing each of subscription_plan_key, subscription_status,
   billing_interval, trial_starts_at, trial_ends_at, current_period_start,
   current_period_end, cancel_at_period_end, canceled_at, stripe_customer_id,
   stripe_subscription_id, private_alpha_enabled, subscription_revision. Use valid
   values and a visible A target; expect 42501, zero mutation/revision change.
   Outsider: zero affected rows or 42501, never mutate B/A. Also test valid client
   INSERT businesses denied even with own owner_id and spoofed subscription data.
B. Forged JWT role: SET LOCAL ROLE authenticated with A-owner sub but set BOTH JSON
   claim role and legacy claim role to service_role. Assert current_user remains
   authenticated. Protected UPDATE, saas_receive and saas_apply must still fail
   42501, with no rows changed. Separately tampered API token must fail signature
   verification, not become a service-role session.
C. As A owner, A co-owner and A member-admin, SELECT the exact seeded A invoice:
   each returns it through the retained owner/helper read contract. B owner/outsider
   return zero. Direct A owner reads the exact seeded subscription event. Co-owner,
   member-admin, B owner and outsider must retain their captured audience (historical
   015 is direct owner only, so zero absent a captured additional SELECT policy).
   Do not broaden policy to make a failed expectation pass; STOP on unexpected drift.
D. As authenticated A owner/admin, edit ordinary name/timezone settings on A. Assert
   one affected row, requested values persisted, subscription_revision unchanged;
   ROLLBACK probe and verify settings restored. APIs must demonstrate normal edit too.
E. Anonymous public booking: query the same public business fields used by booking
   for A's synthetic slug via anon API; require visible A and no extra private access.
   Check synthetic public booking route at desktop/mobile for business details and
   graceful empty availability; do not book, queue or send anything. Any additional
   booking fixtures require a separately reviewed exact fixture/count amendment.
F. NB-2 observation: after successful synthetic apply, anon SELECT id,
   stripe_customer_id,stripe_subscription_id FROM public.businesses WHERE id=A;
   record visibility of ONLY these SYNTHETIC provider IDs. Expected known exposure
   is an observation, not a remediation or proof that real provider IDs are safe.
G. anon/authenticated must get 42501 on SELECT/INSERT/UPDATE/DELETE against both
   saas_subscription_mappings and saas_billing_events. Invoice/history SELECT follows
   C; INSERT/UPDATE/DELETE must fail 42501. Construct valid rows, not DEFAULT VALUES
   that could fail for unrelated reasons. Footprints remain unchanged.
H. Both client roles: has_function_privilege must be false for saas_receive(jsonb),
   saas_apply(jsonb,jsonb,bigint), guard_subscription_authority(), saas_mapping_revision().
   Actually call receive/apply with valid JSON and require 42501. Trigger functions
   cannot be called as ordinary functions; their non-callability error alone is NOT
   proof of EXECUTE denial. Inspect ACL including PUBLIC for all four functions.
I. TRUNCATE denied for anon/authenticated on EACH of billing_invoices,
   subscription_events, saas_subscription_mappings, saas_billing_events. First assert
   has_table_privilege(current_user,'public.<table>','TRUNCATE')=false. Then isolated
   transaction/savepoint: attempt TRUNCATE public.<table> (no CASCADE); expect 42501;
   immediately ROLLBACK regardless of outcome. Stop if unexpected privileges exist
   before attempting destructive probe. Never run this as postgres/service_role;
   never commit. A foreign-key or lock error is NOT a security pass.
J. Hosted service_role under FORCE RLS: assert actual current_user=service_role and
   all five touched tables have relrowsecurity/relforcerowsecurity=true. Read A;
   update a protected field on A in rollback probe and require one changed row and
   increased revision. Repeat trusted hosted service-role API read/write on A and
   restore via reviewed synthetic-only write (revision advances; do not reset it).
   Verify no change to B/existing rows. Failure => NB-12 STOP; never relax roles/RLS.

SYNTHETIC APPLY INPUTS -- no real provider calls or signatures claimed
Mapping A after insertion:
  business_id=A, provider_account='acct_g3_<nonce>', livemode=false,
  customer_id='cus_g3_A_<nonce>', subscription_id='sub_g3_A_<nonce>',
  price_id='price_g3_A_<nonce>', plan_key='professional', billing_interval='monthly', currency='cad'.
Use equivalent distinct B identifiers for the unknown-mapping repair scenario.
Envelope E (each event_id scoped to the run):
  {"account":"acct_g3_<nonce>","livemode":false,"event_id":"<event>",
   "type":"subscription.updated","customer_id":"cus_g3_A_<nonce>",
   "subscription_id":"sub_g3_A_<nonce>"}
Snapshot S:
  {"account":"acct_g3_<nonce>","livemode":false,"customer_id":"cus_g3_A_<nonce>",
   "subscription_id":"sub_g3_A_<nonce>","price_id":"price_g3_A_<nonce>",
   "status":"active","period_start":"2026-09-01T00:00:00Z",
   "period_end":"2026-10-01T00:00:00Z","cancel_at_period_end":false}
Each receive is a separate committed service_role transaction:
  SELECT public.saas_receive(<E>::jsonb); -- initially RECEIVED
Fetch fresh synthetic S and SELECT subscription_revision FROM public.businesses WHERE id=A;
then separately call SELECT public.saas_apply(<E>::jsonb,<S>::jsonb,<revision>::bigint)
as actual service_role and commit. Record receipt state/reason/completed_at.
Do not replace S refetch with merely reading a new revision and reusing stale state.
For each step compare full synthetic business, full invoices/history, and B/existing
rows. Counts alone do not prove atomicity. Revision increases, not necessarily +1:
sequence gaps on rollback are normal and must not be reset.

ORDERED SCENARIOS -- exact deltas exclude security probes, which are rolled back
1. Exactly-once e-first: insert A mapping (revision advances); receive once, apply
   fresh => APPLIED; business matches mapped professional/monthly and S; history +1,
   invoice +0, receipt +1 and completed_at non-null. B unchanged.
2. Duplicate e-first: receive identical E => APPLIED; apply again (even old revision)
   => APPLIED, no business/revision/history/invoice/receipt delta. Changed envelope
   with same event key => ENVELOPE_MISMATCH; original receipt unchanged.
3. Invoice e-invoice: E type invoice.paid plus unique invoice_id='in_g3_1_<nonce>',
   currency='cad', amount_cents=100; receive/apply fresh => APPLIED; exactly one paid
   invoice with correct business/plan/period/amount; history +1, receipt +1.
4. Duplicate invoice e-invoice-duplicate: new event_id, SAME invoice_id; receive/apply
   fresh => IGNORED / INVOICE_ALREADY_RECORDED; receipt +1, completed_at non-null;
   zero business/revision/invoice/history delta, even if supplied S has different status.
5. Stale revision e-stale: retain revision from before e-invoice apply; receive new E,
   apply with retained revision => RETRY_REQUIRED / REVISION_MISMATCH, completed_at
   null; receipt +1, no authority mutation. Refetch S AND revision; same E => APPLIED,
   history +1, receipt count unchanged. Never terminally skip retryable receipts.
   Zero footprint change means exact equality of business (including revision),
   mapping, invoice and history rows immediately before/after the stale apply;
   the receipt intentionally changes to RETRY_REQUIRED / REVISION_MISMATCH.
   Apply the same exact comparisons to both stale scenarios below.
6. Stale after admin write e-admin: fetch S/r; trusted service_role same-value
   subscription_plan_key assignment on A must increase revision. Receive/apply old r
   => RETRY_REQUIRED / REVISION_MISMATCH, no overwrite of admin state. Refetch S/r,
   replay => APPLIED, history +1, receipt +1 total for scenario. This tests the trusted
   DB authority path, not UI platform-admin authentication.
7. Stale after mapping mutation e-mapping: fetch S/r; service_role change A mapping
   price_id to another synthetic price. Revision increases. Receive/apply old r =>
   RETRY_REQUIRED / REVISION_MISMATCH; no invoice/history/business mutation from apply.
   Refetch S with new price_id and current revision; replay => APPLIED, history +1,
   receipt +1. Do not pretend old snapshot/new revision is a successful refetch.
8. Unknown mapping e-unknown: use B identifiers before any B mapping exists. Receive
   then apply => BLOCKED / UNKNOWN_MAPPING, completed_at null; receipt +1, zero
   business/invoice/history changes. Repair by inserting B's exact synthetic mapping,
   refetch B S/r and replay SAME E => APPLIED, history +1; A unchanged.
9. Primary late-write failure e-failure and replay -- NO temporary function/trigger DDL:
   Use an invoice.paid envelope with a SECOND valid, unique invoice_id
   'in_g3_failure_<nonce>', matching mapping currency='cad', and valid non-negative
   amount_cents=100. Use current mapping identity/price and supported status='active'.
   S has valid period_start='2026-09-01T00:00:00Z' and
   period_end='2026-10-01T00:00:00Z'; set ONLY canceled_at='not-a-timestamp' invalid.
   Commit receive first. Confirm zero invoice rows for that exact invoice_id and
   zero history rows for A and this exact event_id; capture A's full authority row,
   subscription_revision, mapping and invoice/history footprint before apply.
   As actual service_role, apply this E/S with freshly read current revision in a
   bounded transaction. Require return BLOCKED; exact receipt state=BLOCKED,
   reason=APPLY_FAILED and completed_at IS NULL. Require NO billing_invoices row
   remains for that invoice_id; all businesses authority columns unchanged;
   subscription_revision unchanged; NO subscription_events row for this event;
   full pre-apply business/mapping/invoice/history footprints unchanged, including
   B and all pre-existing tenants. Commit the replayable BLOCKED receipt only after
   assertions pass; on unexpected result ROLLBACK and STOP.
   Static candidate order: valid invoice INSERT precedes the invalid canceled_at
   timestamptz cast in the businesses UPDATE; the exception handler rolls back the
   inner apply block. This demonstrates rollback of the prior invoice write and
   unchanged business authority/history; it does not claim a business UPDATE had
   completed before the failure. Record actual evidence, not static reasoning as PASS.
   Refetch valid S and current revision; use canceled_at=null (or a valid captured
   synthetic timestamp), with valid identity/price/status/periods. Replay SAME exact
   event/envelope => APPLIED, receipt reason NULL and completed_at non-null;
   exactly one invoice for this invoice_id and exactly one history row for A/event.
   Business matches valid S; receipt count stays one. No new event key for replay.

OPTIONAL FALLBACK ONLY -- temporary-trigger DDL, never the primary path
May be WAIVED because disposable PostgreSQL already proves engine-level
subtransaction semantics. Absence/waiver of this fallback does not waive scenario 9.
Any use requires a separately reviewed exact fallback script; this language does
not authorize execution or permit fixture-schema adaptation.
- One transaction for creation, failure probe and assertions; mandatory terminal
  ROLLBACK, never COMMIT. Receipt must have been committed separately beforehand.
- All function/trigger objects namespaced p2b1_g3_* with a fresh unique suffix.
  Read-only pre-absence and post-ROLLBACK absence checks must include every schema,
  function overload and trigger. Any collision/residue => STOP; no CASCADE.
- SET LOCAL lock_timeout <= '3s' and a bounded statement_timeout='30s' before DDL;
  never disable timeouts or extend them to obtain a pass.
- Synthetic business only: invoker trigger raises only for exact manifest A UUID
  AND exact e-failure event_id on subscription_events; other rows RETURN NEW.
  No existing tenant mutation, role privilege change or permanent object permitted.
- Require BLOCKED/APPLY_FAILED, completed_at NULL, zero retained invoice/history and
  unchanged business authority/revision before terminal ROLLBACK. This fallback
  separately probes failure after business writes; do not replace primary evidence.
- Lost session => read-only residue check before continuing; UNKNOWN is STOP.
  Do not reconnect and assume rollback/absence or proceed with mutation.

EXACT EXPECTED END COUNTS before teardown (all nine scenarios completed once)
  businesses B0+2; invoices I0+3 (one seed, two unique synthetic provider invoices);
  subscription_events H0+8 (one seed, seven successful applies);
  saas_subscription_mappings=2; saas_billing_events=8 (7 APPLIED, 1 IGNORED);
  members M0+2; auth users U0+5; plan_offers=0; applications=D0 with exact
  all-column digest/ordered-column-list equality.
  No RETRY_REQUIRED/BLOCKED/RECEIVED remain. All eight receipts completed_at non-null.
  Non-null provider IDs: exactly 2 business customer IDs + 2 subscription IDs and
  exactly 2 invoice provider IDs, all in manifest; duplicates=0; offer_id nonnull=0.
  Record actual exact integers, not just formulas, using captured B0/I0/H0/M0/U0/D0.
  Do not mark PASS if a scenario/fixture changes without updating the reviewed ledger.

TEARDOWN -- migration stays applied; this is NOT schema rollback
1. Save redacted assertion evidence; revoke/sign out synthetic sessions through the
   approved auth method, allowing for already-issued token validity. Keep keys secret.
2. In one reviewed service-role transaction delete exact manifest subscription_events,
   billing_invoices, saas_billing_events (full composite keys), then mappings, then
   fixture-dependent membership/other manifest child rows, then businesses A/B.
   Mapping delete advances fixture revision; never reset sequence. Explicitly assert
   expected affected-row counts at every step; mismatch => ROLLBACK and investigate.
   Never use TRUNCATE, CASCADE or broad prefix deletion for teardown.
3. Delete only the five newly created auth identities via reviewed auth cleanup; this
   separate API operation is not atomic with SQL teardown. Verify exact absence and
   any associated sessions/identity rows. On failure record CLEANUP INCOMPLETE and
   block acceptance; never claim deletion invalidates all existing tokens immediately.
4. Final counts must be B0/I0/H0/M0/U0, mappings/events=0/0, offers=0, applications=D0.
   Compare pre-existing tenant/application deterministic all-column row digests,
   row counts and ordered column-name lists exactly, using the captured pre-migration
   business columns plus the separate new-revision assertion as specified above;
   provider IDs all NULL again, offer_id all NULL, duplicate invoice IDs=0. New
   subscription_revision stays present with 0 for every pre-existing business.
   Confirm no synthetic keys or temporary failure trigger/function remain, all
   retained policies/grants/FORCE RLS equal the expected post-migration definition.
   No changes to sequence privileges, roles, existing tenants or providers. Sequence
   values may advance from fixture writes/rolled-back probes; never reset them.
5. Report each assertion PASS/FAIL/NOT RUN with evidence, exact pre/post counts,
   identity checks, NB-12 resolution, NB-2 observation and cleanup outcome to Claude.
   For pre-existing tenant/application rows, travelling evidence is deterministic
   all-column row digests, row count and ordered column-name list only. Never transmit
   their full content to Control Tower, GitHub, Environment Manifest or chat; any
   retained full content stays private local only. Full SYNTHETIC row content is allowed.

NB-1: This does NOT prove provider-event monotonic ordering. Revisions fence stale
snapshots relative to local authority/mapping writes; they do not order provider
creation times or prove a fetched snapshot is newer than previously applied state.
No webhook signature verification, provider activation, live billing, migration
reapply, or broader launch acceptance is established by this synthetic runbook.
*/
