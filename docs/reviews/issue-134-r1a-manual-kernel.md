# Issue #134 — R1a manual-payment kernel

**Status:** APPLIED TO GOVERNED STAGING ONLY / CLAUDE S-A / UNWIRED /
NEW ADMISSION DEFAULT OFF / HOSTED BEHAVIOR NOT TESTED
**Competitive Product Gate:** NOT_APPLICABLE — internal implementation of locked integrity behavior; no UI or product workflow change.
**Launch dependency:** REQUIRED. This candidate is not operational acceptance.

## 2026-10-05 — Governed Staging application accepted

**2026-10-05 13:04:46 America/Toronto — #134 R1a APPLIED TO GOVERNED STAGING ONLY / CLAUDE S-A / UNWIRED / DEFAULT OFF.** Darshan approved the exact application gate. Native Supabase migration application succeeded once on `wnfahklzaxirftyskctd`, hosted history `20261005170446 / issue_134_r1a_manual_payment_kernel`. Applied source `supabase/migrations/20261005154345_issue_134_r1a_manual_payment_kernel.sql` is exactly 16,151 bytes with stored SQL SHA-256 `4b7e38553eca69e039ef57e94b1e7201cfbad22e5beac4398db66cc94bad5ee7`. Source head at application `c24a2a3b5120da5b3802c815c4bda102be416cbd`; reviewed code `888bac096778ed85171b880a816d2052d84c92a4` is unchanged. [Execution evidence](https://github.com/renovisionai2-cloud/chasum/pull/156#issuecomment-5999283170); [independent review and reconciled limits](https://github.com/renovisionai2-cloud/chasum/pull/156#issuecomment-5999308262).

**Verified:** required actual hosted service-role privileges were present; no collision, schema mismatch or permission widening. Both expected functions have source-matching bodies, fixed search path, SECURITY INVOKER and EXECUTE restricted to owner/service_role; PUBLIC/anon/authenticated denied. Both functions/history share observed xmin `4584`. All 12 checked table counts/full-row digests, all 11 prior migration-history rows, 3,319 public-schema catalogue entries and 267 pre-existing public functions remained unchanged. Attempts/events/obligations/linked-ledger counts remain zero. The prior foundation `20261005032107` / `dee700ae...ee3a47` was not reapplied. Existing #153/SEQ-ACL-1 grants are unchanged. Fresh-session timeouts are not reused-apply-session proof; catalogue privileges are not hosted DML or PostgREST behavior.

**Independent application review COMPLETE — Claude S-A.** Fresh session `0c80e475-fb6c-430e-8a26-8cbf953daf37` independently checked source/payload identity and reviewed ChatGPT's supplied live evidence; no independent reviewer DB execution is claimed. No repeat of closed foundation or R1a authoring audits. Source/hosted version labels are deliberately mapped; never edit the SQL, rename/reapply it, or repair history merely to make labels equal. Its PREPARED ONLY comment remains immutable authoring history.

**Next safe preparation:** a bounded hosted kernel + legacy NULL-linked validation plan, with exact synthetic scope, rollback/retention, trigger/communication containment and non-transactional sequence-effect accounting. Routine read-only/design preparation needs no new PO permission; executing fixtures/DML requires a separately reviewed exact plan and explicit PO approval. No plan execution or function call occurred here. Do not run the disposable-local verifier against shared Staging or assume immutable committed records can be deleted. Appointment-customer reassignment remains a pre-adoption binding/projection blocker; #153 closure remains required before permission cutover. R1a remains unwired/default-off; projection/document/communication and full workflow acceptance remain unfinished. PR #155/#156 DRAFT/UNMERGED; main `31115e6a51b71fc097c279d205065d80e0be3573` unchanged. No Production/GVM contact, #135/Phase A Production release, historical six-USD repair, technician resumption or GVM Operational Acceptance.

### P134-R1A-STAGING evidence details

- Admission body SHA-256: `110485eb1eb2a86fd2eec72507fdf8beb7304aae92251ddef598162d05dd5847`.
- Commit body SHA-256: `e6acc9a31613b2f039305cf5169871e9b433839b4077b83d0858246194f46b15`.
- Before/after old history digest: `98dcd1787e9240e1eefea4584546e629` (11 rows).
- Before/after public-schema digest: `3f21a5e149708df22e9e0dca3c8a4c76` (3,319 entries).
- Before/after existing public-function digest: `6cba5dc09cc9c6b54a38250fcb9181f3` (267 functions).
- Checked data counts: Businesses 4; Customers 3; Appointments 11; Gift cards 0; Transactions 2; Invoices 1; Receipts 2; Customer payment events 2; Send intents 4; Attempts 0; Attempt events 0; Reconciliation 0. All full-row digests unchanged.
- Both new function ACLs: `{postgres=X/postgres,service_role=X/postgres}`. Their bodies require literal service_role; owner EXECUTE is not a financial-writer bypass.
- Required binding SELECT, ledger SELECT/INSERT, attempt/event/obligation SELECT/INSERT, attempt execution_state/updated_at/resolved_at UPDATE, schema USAGE and service_role BYPASSRLS were checked in hosted catalogues. No runtime call tested those permissions.
- Security advisors name neither new function. Existing warnings and intentional RLS-enabled/no-policy INFO persist; no whole-project security pass.
- This task invoked no payment RPC, fixture, local verifier, provider or sequence function. No build/full-suite/browser run was repeated for the schema application; prior disclosed test limitations persist.

**Review qualifications govern:** matching xmin is bounded installation evidence; fresh-session timeout defaults do not prove a reused session reset; zero adoption is not a universal no-historical-call claim; read-only planning is routine coordination, while hosted execution needs its own PO gate. A future migration runner must reconcile stored-SQL/version mapping rather than blindly treating the source timestamp as pending.

The authoring record below is historical. Its NOT APPLIED / application-next wording is superseded only for Staging by this section; its evidence limits and non-activation conditions remain valid. Do not rewrite the applied migration header.

## Historical final exact-code authoring acceptance — 2026-10-05

- Reviewed code HEAD: `888bac096778ed85171b880a816d2052d84c92a4`; tree `6cf9ab4ee1cd17aa72a974308a6737d9d7666cf6`. Base foundation head: `6c8d8d15d487e13b4547bee766d31d8806877180`. The later continuity closeout is Markdown-only; see Draft PR #156 for its current head. No non-documentation bytes change in that closeout.
- Sole implementer: GPT-5.6 Sol, session `23774e3d-ef31-4603-bfb4-18c3d5315be1`. C1-C4 commit `9da2ea6`; C5 commit `888bac0`. Initial candidate `ef79a83` was held, not accepted.
- **Grok G-A PASS**, [complete final report](https://github.com/renovisionai2-cloud/chasum/pull/156#issuecomment-5998789722), session `82f30882-dd80-49e4-b247-7948a266c1e6`: independent corrected-source review; no test/hash/PG execution claimed by Grok.
- **Claude A — AUTHORING PASS**, [complete final report](https://github.com/renovisionai2-cloud/chasum/pull/156#issuecomment-5998789992), session `adc0319f-3c4c-4cdf-8362-2e9d0ed7dc16`: independently verified final identity/hashes/scope, 41 focused tests, 562 scoped regressions and typecheck. No PG execution or sandbox bypass claimed by Claude.
- Coordinator independently ran the final verifier on an owned PostgreSQL 17.11 cluster bound to `127.0.0.1`, verified its data directory, obtained exit 0, and stopped/removed it. Verifier SHA: `d865fa7d8003c9e5c6a15ea0e15abb148f6f7c1c761ef8f3dac98fa24d4e5137`. Foundation loaded only as setup; no closed foundation audit was repeated.
- Coordinator also repeated the ORIGINAL failing CT-R1 SQL: admit REQUESTED -> set DO_NOT_RETRY -> commit. Corrected result is UNKNOWN, recorded=false, REQUESTED+DO_NOT_RETRY unchanged and **0 linked ledger rows**. True two-process overlapping commits yield RECORDED+REPLAY with one transaction identity, one ledger/outcome and four obligations. Lost-response and conflict races pass. [Consolidated exact-code execution evidence](https://github.com/renovisionai2-cloud/chasum/pull/156#issuecomment-5998723522).
- Final focused **3 files / 41 tests PASS**; final scoped regressions **61 files / 562 tests PASS**; typecheck/targeted lint/diff-check PASS. The older full-suite attempt had 1,896 passes and 39 skips but **two browser suites failed to start** (Chromium absent): NOT a full-suite pass, not rerun for C5. Local build NOT RUN. No browser/hosted/Production workflow acceptance is implied.

**C1-C5 CLOSED for this prepared component:** coherent REQUESTED/event holds; ledger-backed uncertainty; canonical recovery/admission/commit identities; actual concurrent commit/response-loss proof; explicit targets/attribution replay; existing supported-Business-currency validation without a new list/default. All sixteen approved paths remain the scope. Foundation SQL/vector fixtures and all existing runtime code are unchanged.

**NEXT GATE — Product Owner authorization of the exact NEW R1a migration** `4b7e38553eca69e039ef57e94b1e7201cfbad22e5beac4398db66cc94bad5ee7` to **governed Staging `wnfahklzaxirftyskctd` only**, prerequisite/collision/effective-privilege preflight followed by read-only post-apply schema/catalogue/hash verification. The migration is NOT APPLIED and both PRs remain Draft/unmerged. No activation, payment fixture, hosted legacy DML smoke, merge, Production/GVM, #135 release, historical USD repair, #153 change or technician resumption is authorized by these reviews.

**Preserved nonblocking authoring limitations / mandatory later gates:**
- Binding-table reads and event-sequence privileges are modeled locally, not freshly observed hosted ACLs; missing real privileges STOP. `031:71` does grant existing service_role ledger DML. #153/SEQ-ACL-1 stays open.
- Concurrent appointment.customer_id reassignment after binding validation remains an explicit **pre-adoption binding/projection gate**. No full race-safety claim, new lock or privilege widening.
- The local verifier creates disposable test-only trigger/function objects; use ONLY a newly owned disposable cluster, never a shared/local developer/hosted database. A failed assertion may leave test objects until the owned cluster is removed. Do not transplant this verifier to Staging.
- Hosted writer/legacy fixtures require reviewed rollback/retention and exact scope first. Immutable committed attempts/ledger/events cannot be assumed deletable.
- Authority-phase unsupported-currency errors can throw before the transport catches to preserve authentication redirects. Future wiring must handle that fail-closed path; there is no current UI wiring.
- Two SQL proof labels both print PASS 09; this is a cosmetic evidence-label issue only. No renumbering/byte change was made after review.
- R1a records durable obligations but does not process projections/documents/communications. **Activation stays prohibited until separately reviewed workflow readiness. GVM Operational Acceptance is NOT earned.**

The following implementation and initial-audit history remains evidence; any re-review-next wording is superseded by this final acceptance record.

## Prepared candidate

R1a adds one CLI-generated additive migration,
`20261005154345_issue_134_r1a_manual_payment_kernel.sql`, SHA-256
`4b7e38553eca69e039ef57e94b1e7201cfbad22e5beac4398db66cc94bad5ee7`.
It creates exactly two `SECURITY INVOKER` functions with fixed
`pg_catalog, pg_temp` search paths:

- `admit_payment_attempt_v1`
- `commit_manual_payment_attempt_v1`

Only `service_role` receives EXECUTE. The migration changes no table, column,
index, constraint, trigger, policy, sequence, default ACL, existing table
privilege or data. The accepted foundation remains byte-identical at SHA-256
`dee700ae7622afbcc91adf753b3fa559018ed9909f01cba2dc510db0a1ee3a47`.

The new `lib/commerce/payment-attempts/` module imports `server-only`, resolves
the current actor and Business through the existing request-cached session
guards, derives Business currency, verifies customer/appointment binding and
requires that currency to be present in the existing
`BUSINESS_CURRENCIES` list before any privileged call. It uses a default-off
admission control and is not a Server Action or route; no existing writer,
booking action, UI, provider or worker imports it.

## Locked behavior

Generic fingerprint v1 normalization preserves all six literal reference
vectors. The fixture is byte-identical to the reviewed artifact at SHA-256
`842c4afaf3d68a2778dded613a1b57dd4775a4019a3465c5130a82cc5d2f9874`.
R1a admits only existing-customer/optional-existing-appointment manual
payment/deposit intents using cash, debit card, credit card, e-transfer or
other. Invoice intent, booking-operation, none, gift/store credit,
refund/void/adjustment and Stripe are rejected before privileged admission.

Admission inserts the winner and exactly one REQUESTED event atomically.
Replay compares immutable tuple columns rather than trusting the fingerprint.
A changed tuple, including one carrying an equal hash, returns a committed
KEY_CONFLICT with stable server-derived evidence; duplicate evidence races
re-read and verify Business, attempt and event type.

Commit locks and revalidates the stored attempt, updates it to ACCEPTED before
inserting one linked succeeded manual ledger row, appends ACCEPTED evidence and
inserts exactly four obligations in one transaction. All remain PENDING except
customer-only `appointment_cache`, which is NOT_REQUIRED with `completed_at`.
Results never claim synchronization or receipt completion. Consistent replays
return the original ledger identity without writes; missing or inconsistent
ledger/events/obligations return UNKNOWN without repair. FAILED and SKIPPED are
not revived.

KEY_CONFLICT `NOT_RECORDED` evidence describes only the rejected conflicting
intent's lack of a new effect. It never overwrites or becomes the money truth
for a winning attempt that already has a valid linked ledger.

## Initial-candidate audit and bounded corrections

Independent review of the frozen initial candidate at `ef79a83` concluded
Grok G-B and Claude B; those results are preserved as findings, not acceptance.
The coordinator then reproduced CT-R1 locally: a REQUESTED attempt marked
DO_NOT_RETRY could still create a ledger and finish ACCEPTED.

This corrected candidate requires a coherent RECOVER disposition, no failure
annotations, exactly one valid REQUESTED event and no contradictory events
before any new effect. Incoherent REQUESTED attempts return UNKNOWN without
winner/evidence/ledger/obligation mutation. ACCEPTED replay now proves the
complete allowed event set while preserving `recorded=true` and the linked
transaction identity for an explicit ledger-backed UNKNOWN hold.

Recovery, admission and commit mappings now require canonical UUIDs and exact
Business/key/winner identities. A recovered winner must be returned as the same
EXISTING attempt before commit; malformed or drifting RPC identities cannot
certify recorded money. Read/RPC/transport uncertainty maps to typed UNKNOWN,
while request authentication/authorization control flow remains outside those
catches. R1a target validation explicitly allows only customer/appointment.
The C5 correction reuses the existing supported Business-currency list in both
current authority resolution and R1a normalization. Missing or syntactically
valid unsupported values fail before binding, recovery, admission or commit;
generic fingerprint-v1 normalization and all six vectors remain unchanged.

## Local proof and privilege provenance

A fresh PostgreSQL 17.11 cluster bound only to `127.0.0.1` executed the
foundation as setup, the complete R1a migration and the focused contract as
literal `service_role`; it was stopped and removed afterward. The verifier
rejects every nonlocal/query/fragment URL and strips every inherited `PG*`
variable from synchronous and concurrent `psql` children.

The fixture models only required existing privileges: migration 031 line 71's
dynamic `service_role` commerce-ledger DML, foundation grants on attempts/
events/reconciliation, binding-table SELECT and the Staging-observed inherited
event-sequence USAGE+SELECT. The latter two are modeled local assumptions, not
a fresh hosted ACL proof. The R1a migration grants no table, column or sequence
access. Exact hosted privileges remain an application preflight; any missing
privilege is a STOP, not permission to widen this migration or fixture.

Proof covered service-role boundaries, tenant/customer/appointment binding,
same-key admission, two genuinely concurrent commit processes producing exactly
RECORDED+REPLAY, committed-conflict races, a separate lost-response retry,
equal-value new-key payments, rollback, exact obligations, no false
synchronization, coherent recovery holds, terminal states and unchanged legacy
data. Focused correction tests passed 3 files / 41 tests; expanded commerce,
migration and booking regressions passed 61 files / 562 tests; typecheck,
targeted lint and diff-check passed. A broader run passed 185 files / 1,896
tests (39 skipped) but was not a suite PASS: two unrelated browser-backed
suites could not start because the local Playwright executable is absent. No
package/browser install was permitted.

## Withheld and next gate

No hosted database, provider, environment, migration application, UI/action
wiring, projection worker, invoice/receipt/mirror schema, #153 correction,
merge, Production, GVM, #135 release, historical repair or workflow activation
occurred. Build was not run because the requested safe local proof excludes
build-time environment/provider uncertainty.

Concurrent reassignment of `appointments.customer_id` after the binding read
remains an explicit pre-adoption binding/projection gate. This prepared,
unwired candidate makes no full-race-safety claim; it adds no row-locking or
existing-table privileges without a separately verified design.

**Flag activation for application traffic remains prohibited.** The next gate
is coordinator scope reconciliation followed by fresh Grok challenge and
independent Claude Level-3 review of these corrections. The initial G-B/B
reports do not accept this revision. Only after clearance may a separate
Product Owner gate consider migration application and isolated hosted fixtures.
Hosted legacy NULL-linked DML smoke, #153 closure before permission cutover,
projections, full workflow acceptance, governed Production release and GVM
Operational Acceptance remain later requirements.
