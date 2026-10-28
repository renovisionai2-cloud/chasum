v2 matches the bytes I reviewed. Reading the delivery and the exact diff.Verifying no stale counts or contradictions remain after the three deltas.```
CONTROL TOWER — FINAL NARROW CONTRACT CLOSEOUT (THREE DELTAS ONLY)
#134 durable fresh-booking operation / canonical manual-deposit handoff

Final contract SHA-256: 29f6cf2dda9163c2c395f845a4420593a094f8519d4880d77e44e17191c8262d — 782 lines
Prior v2 SHA-256:       6fc97806d1e409fdfba18976568f5a573e8e62366b0621ae0a6687553d90cbae — 747 lines
  v2 is byte-identical to the bytes I reviewed, so the +35-line delta is genuine and bounded.
Baseline HEAD verified unchanged: 0b3f071511e14a7c77541e80f039862fc71f924a. Working tree shows only
the two untracked design docs plus untracked .supabase/ (not read). No code, UI, SQL, or migration
exists or changed. R1/R2, G1–G5 and Q1–Q8 were not reopened; accepted foundation/R1a/C01/attribution
and the local proof were not re-audited.

VERDICT: READY_FOR_PO_IMPLEMENTATION_GATE — no required correction remains.
All three requested deltas close their mechanisms. C1 is closed. One non-blocking label nit only (N1).

=== DELTA 1 — C1 PRIVATE CANONICAL READ OWNERSHIP: CLOSED ===
Named first-slice entrypoints now exist with real signatures (§5, lines 149-152):
`readBookingOperationCanonical(operationId: string): Promise<BookingOperationReadResult>` and
`listBookingOperationHistory(input?: { cursor?: BookingOperationHistoryCursor; limit?: number })
: Promise<BookingOperationHistoryPage>`.
Internal owner is inside the existing 16-path allowlist — implemented in allowlist item 7
`lib/commerce/booking-operations/kernel.ts`, exported server-only from item 8 `index.ts`. Paths stay 16
(11 new + 5 existing), so ownership was assigned without inflating scope. That is the minimal fix.
Authorization is owned, not delegated: "Neither accepts actor or Business from its caller"; each calls
`requireUser()` and `requireBusiness()`, then invokes the RPC with exact `business_id`/`actor_id`.
Revoked access returns `NOT_AUTHORIZED` before canonical data "and exposes no existence distinction."
The read RPC independently re-verifies the supplied actor's current owner/admin membership, so a forged
actor argument is not trusted — the service-role boundary is not a bypass.
Actual transport is named: the existing service client calling private read-only
`read_booking_operations_v1`. Not an abstract interface.
One coherent snapshot with a fail-closed rule: `readBookingOperationCanonical` "uses one RPC statement
rooted at the operation" and aggregates appointment, attempt, ordered events, ledger and the four
obligations "without PostgREST child-row pagination" — it names the specific truncation hazard it
avoids. Result is discriminated `FOUND | ABSENT | UNKNOWN`, FOUND carries
`consistency: SINGLE_STATEMENT_READ_COMMITTED`, and "Contradictory identities/counts, truncated
required relations, or query errors return UNKNOWN; no partial result is classified." Fail-closed.
Incomplete/in-flight handling is correct and is the part that matters most for recovery safety:
"ABSENT means only 'not visible to this completed read.' It never proves that a concurrent transaction
cannot commit and never authorizes a new identity; recovery retries only the same operation through an
advisory-locking RPC." History likewise: "An in-flight invisible row may be absent from a page; exact
same-operation recovery remains authoritative." So absence can never license a replacement key.
History read is bounded and PII-free: opaque `(attention_rank,created_at,id)` cursor, limit 1–50,
`PAGE | UNKNOWN`, deterministic next cursor, and "SQL computes attention rank before pagination" —
which avoids ranking after the page is cut. Summaries carry "no customer/actor identity, inline input,
notes, hashes, provider payload, or other PII."
#133 is now an adapter over the same truth, not a dependency of internal recovery (§11, lines 551-553):
`readCanonicalPaymentOutcome()` is "the deferred public operator/Summer #133 adapter, not the first
slice's private reader. It must call `readBookingOperationCanonical()` and map that canonical result;
it may not independently query or reinterpret financial tables." That is exactly the inversion C1
required, and it removes the previous "sole reader" contradiction — no stale "sole #133" text remains.
No "columns exist so the read is implemented" bluff: a real SQL object is added with a pinned signature
and matching named parameters, plus explicit proof duties — offline "private exact/history reader
FOUND/ABSENT/UNKNOWN, authorization, cursor, PII-omission, and in-flight-absence behavior" and local
PostgreSQL "read RPC exact/history modes, membership revocation, cursor order, one-snapshot
contradictions, and PII-free history payload."

=== DELTA 2 — LEGACY NULL BRANCH RETURNS BEFORE PRIVILEGED CHECKS: CLOSED ===
§7 now orders the guard so the legacy path never touches privileged state: "on INSERT with
`new.booking_operation_id IS NULL`, the appointment guard returns `new` before any service-role,
permission, or registry access"; on UPDATE with old and new both NULL "it likewise returns `new`
first"; and "only a branch with old or new non-NULL operation identity performs the service-role and
registry checks; non-NULL→NULL and NULL→non-NULL UPDATE are rejected."
This closes the real hazard: the guard is SECURITY INVOKER and registry privileges are revoked from
`authenticated`, so without this early return an ordinary session insert would have failed the moment
the migration was applied. Because a RESTRICT/trigger takes effect on application even while the kernel
stays unwired — the same immediacy principle established by the accepted attribution migration — this
ordering is what actually keeps current session persistence working. It is consistent with the rest of
the contract: non-NULL operation identity remains valid only in the original service-role INSERT, and
bind still changes only `attempt.appointment_id`. No contradiction introduced.

=== DELTA 3 — REPEATED NO-LEDGER CORRECTION AFTER CLOSED: CLOSED ===
Terminality is preserved while repetition is permitted, and the two are properly separated: "CLOSED
never reopens" (line 308) and "all create/bind/commit functions reject CLOSED before a new financial
write" (line 457) both stand, while §7 adds "While CLOSED, the close RPC may advance
`replacement_customer_id`, `close_reason`, and `updated_at` for another authorized no-ledger correction
or cancellation; request columns and the original attempt remain immutable." So creation/payment
eligibility stays terminal; only lifecycle metadata advances. This is a real state rule, not a
reinterpretation of the old approval as a one-change-only allowance.
Atomic expected-current compare-and-set with a row lock: "For every reassignment it locks the
appointment, requires its customer to equal the supplied `expected_current_customer_id`, validates the
new same-Business target, stores that exact target in lifecycle metadata, and updates only
`WHERE customer_id=expected_current_customer_id`." The trigger "permits only that expected-current→
stored-target transition in the same service-role transaction" — the trigger follows stored metadata
rather than hardcoding a single original→replacement pair, which is what makes repetition safe.
Close signature arity is consistent: `close_booking_operation_v1(uuid,uuid,uuid,text,uuid,uuid,boolean)`
= 7 types matching the 7 named parameters `business_id, operation_id, actor_id, reason,
expected_current_customer_id, replacement_customer_id, cancel`. Reassignment requires both customer
arguments; cancellation requires both NULL with `cancel=true`; all other combinations reject.
ALL appointment ledger history is checked, including later separate payments — the requirement most at
risk of being missed: "customer correction checks every `commerce_transactions` row linked to the
appointment, regardless of payment-attempt identity, kind, status, or whether it was a later legitimate
payment", and "Any appointment-linked ledger history blocks customer change, including accepted
original-attempt and later separate-payment ledgers; no accepted guard is weakened."
Old payment is never revived: "no terminal attempt is reopened or replaced"; on an already CLOSED
operation close "leaves every terminal attempt unchanged"; SKIPPED stays SKIPPED because the accepted
guard forbids SKIPPED→FAILED; an already-FAILED attempt is untouched. Cancellation still discloses
recorded money rather than absence — it "never changes or hides that ledger and never authorizes
recollection."
Simple state proof is required, not prose: the fault matrix now carries "First/repeated no-ledger
customer correction | CLOSED and never reopened | locked expected-current→target atomically | first
REQUESTED→FAILED; later terminal attempt unchanged | zero across all appointment-linked history" and a
separate "Correction after original or later separate ledger | ... | any appointment-linked ledger
blocks" row, with §14 requiring "repeated CLOSED no-ledger corrections compare expected current and
succeed; any original/later appointment ledger blocks them."

=== VERIFIED FIRST-SLICE PATH AND OBJECT COUNTS (recomputed for consistency) ===
Paths: 16 total = 11 new + 5 existing. Unchanged by these deltas; readers reuse allowlist items 7-8.
Schema: 23 deltas = 1 table + 1 existing-table column + 8 named constraints + 3 indexes + 8 functions
+ 2 triggers. Arithmetic closes. Functions 7→8 (one read primitive added) — minimal and justified.
Read RPC signature/parameter arity agrees: `read_booking_operations_v1(uuid,uuid,text,uuid,integer,
timestamptz,uuid,integer)` ↔ `business_id, actor_id, mode, operation_id, cursor_attention_rank,
cursor_created_at, cursor_id, limit`, mode exactly `one|history`, read-only.
Bootstrap stays pinned at 37 arguments. Posture: all eight functions SECURITY INVOKER with fixed
search_path; the read primitive is `LANGUAGE plpgsql STABLE` with one canonical SELECT/CTE after
authorization and no mutation; EXECUTE granted only to service_role.
Count propagation is clean: I searched for stale "22 schema / 22 exact / 22-delta / seven functions /
all seven / sole #133 / 36-argument" and found NONE. §7, §13 inventory and §14 static requirement all
read 23 consistently. No applied foundation/R1a/attribution SQL is edited.

N1 (NON-BLOCKING LABEL NIT, no correction required): §5 line 149 calls `index.ts` "its existing
`index.ts`" while allowlist item 8 lists it as "NEW bounded exports." The intent is clearly
"already inside the allowlist," path count is unaffected at 16, and no mechanism depends on the word.
Fix only if the author is editing that line for another reason; it does not warrant a hash change.

=== LIMITS (unchanged and explicitly still future) ===
Proposed design only. No code, UI, SQL, DDL, migration, test, build, typecheck, verifier, database,
hosted, network, credential or .supabase activity occurred in authoring or in this review; I performed
source/file/git/hash reads only, made no edits, and used no subagents. I claim no implementation and no
execution pass — every signature, lock behavior, snapshot-consistency outcome and proof remains NOT RUN
and UNKNOWN until authored and independently audited.
Still future and not authorized here: public #133 operator and Summer reporting; wiring Booking Sheet,
Quick Appointment and `lib/actions/appointments.ts`; the four projection reconcilers, invoice numbering,
receipt and CRM uniqueness; all communications and receipt email; friendly customer-delete handling and
operation-linked update/cancel routing; the global `quickCreateCustomer` race; cross-actor/supervisor
recovery; #153 revocation and SEQ-ACL-1 permission work; providers, refunds, stored value; Staging
application; Production and GVM; technician resumption. First slice stays unwired and default-off,
preserves `createAppointment()` and the weak legacy dedupe, creates obligations as PENDING only, and
cannot be activated. PENDING never counts as COMPLETE, and every activation gate in §16 remains.

=== SAFE NEXT OWNER APPROVAL SCOPE ===
Authorize exactly the §13 prepared-only package: the 16 listed paths and the 23 schema deltas, with the
migration filename generated by the Supabase CLI at authorization time and never invented, plus the §14
offline/unit checks, the static migration contract, and the independently audited human-owned
disposable-local PostgreSQL proof. The approval must NOT authorize wiring either UI, activation, flag or
permission changes, hosted payment, Staging application, projection or communication implementation,
merge, Production, GVM activity, or technician resumption.
```