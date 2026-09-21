# Issue #73 — Package A: deterministic import preview

Implemented from base main `ec03d36f39705024dfcc5b923ca87e42795f3743`; independently audited candidate `f208ed9e6e9abd89235be6ac53b25fdfed04a1f6` was squash-merged as main `ea2fbe18e1c6bd759813bcb56d0544b86aa2aa5e`.
Package A is **COMPLETE / PRODUCTION ACCEPTED CODE FOUNDATION**. Issue #72 remains CLOSED / PRODUCTION ACCEPTED; Issue #73 remains open for separately governed Package B/C work.

## Implemented

`lib/imports/preview.ts` exports `previewImport(payload, snapshot, mapping, asOf)`.
It is pure Node-runtime domain code using existing Zod, Intl and SHA-256. No
route imports it. It has no database, provider, file or operational dependencies.
The supplied snapshot is a later server responsibility, not evidence of actor
authorization. This package grants no write authority.

The strict version-1 canonical payload has source system/account, input checksum,
explicit source timezone/currency, one fixed target and a discriminated `rows`
collection. Types distinguish locations, services, staff, all three assignment
kinds, customers and future appointments. Primary references and separate
assignment rows represent additional locations. Unknown fields are rejected,
not silently discarded. Structural/root errors fail the entire preview with a
controlled `ImportContractError`; semantically invalid rows stay visible in
outcomes. Input is limited to 5,000 rows. Adapters must supply opaque non-PII
sourceRowKeys, stable within a payload; external IDs are optional and never
fabricated from hashes. Do not put email/phone in row locators.

Each outcome has a status, separate planned action, controlled reasons, resolved
dependencies, content hash and, for ID-bearing entities only, a resolved target ID. It contains no
names/email/phone/address/notes. Locators, target IDs and hashes remain sensitive
pseudonymous metadata, not anonymous data. The returned `normalized` payload is
PII-bearing and is NOT the durable outcome projection or generic log content.

Target snapshots separate UUID-bearing `entities` (location, service, staff,
customer, appointment) from `assignments`. Assignment keys match the real schema:
staff_services(staff_id, service_id), staff_locations(staff_id, location_id),
service_locations(service_id, location_id). Discriminated assignment records
contain only their typed endpoint pair; no synthetic assignment UUID exists.
Every endpoint must resolve to an entity of the right type in this tenant's
snapshot. Malformed, missing, foreign or repeated snapshot pairs fail closed.

Option A: durable source refs and explicit mapping links apply only to ID-bearing
entities. Assignments use endpoint-pair idempotency, not source refs. An existing
pair returns DUPLICATE_EXISTING / SKIP with ASSIGNMENT_EXISTS and no existingId;
its resolved dependencies provide complete identity. Duplicate input pairs flag
all copies, including source-row references resolving to the same existing IDs.

Exact source identity is Business + sourceSystem + sourceAccountKey + entityType
+ sourceExternalId. Changed content on an existing source ID requires review.
Customers match normalized email within the target; conflicting identity or
multiple matches require review. Staff email and service/location names are
only review hints. Explicit mappings are tenant/type checked. All in-file
repetitions are flagged, never first-row-wins. Missing IDs remain missing: this
preview cannot promise future re-import identity without reviewed durable refs.

Children resolve only to READY creates or accepted existing links. Appointment
location, service, staff and customer are required; staff-service and location
assignments must agree. Primary location membership is implicit; additional
membership is explicit. Overlaps are half-open (start < other end and end > other
start), staff-wide. Existing snapshot occupancy is checked independently.
In-file collision warnings are generated only by READY / CREATE appointments,
with eligibility frozen after all validation and snapshot collision checks.
Invalid, unresolved, review-only and existing-link rows do not create new planned
occupancy. Both sides of READY collisions warn regardless of input ordering.
Cancelled appointments are excluded from this warning calculation. Full scheduling/availability is
not duplicated; Package B must revalidate authoritative constraints.

Time uses explicit source zone or an offset-bearing timestamp, never host zone.
If a row supplies both an offset timestamp and IANA timezone, its wall time must
match that zone at the specified instant (including DST); contradictions produce
INVALID_TIMESTAMP. Without a row timezone, the explicit offset is authoritative
and need not match the source default zone. Successful timestamp normalization
uses UTC; an explicitly supplied row timezone is then normalized to UTC as well.
Validation happens first, so normalized payload re-preview is stable and cannot
silently accept contradictory original inputs.
Local wall times are round-trip matched against candidate Intl timezone offsets;
Toronto gaps/folds block, rather than selecting an offset. Date-only and calendar
rollovers block. Contract precision is seconds (optional `.000` accepted); other
fractional precision requires mapping before preview. `asOf` is explicit and
used for future eligibility; it is not an internally generated timestamp.

Money uses bounded integer minor units under the current two-decimal Chasum
contract; zero/three-decimal currencies are unsupported and rejected. No FX, floating-price parsing or catalog recalculation. NONE is an
explicit source declaration, never inferred from missing fields. EXACT requires
all amount fields with pre-discount tax-exclusive price and separately stated tax; negatives, fractional/overflow values, excessive discounts or
refunds exceeding paid amounts block. Same-currency representable snapshots are
preserved. Currency mismatches, UNRECONCILED, paid/refunded snapshots and deposits
above total require FINANCIAL_RECONCILIATION_REQUIRED / REVIEW. Paid/refunded
source truth remains intact in memory; it must not be converted into fabricated
Chasum transactions. Package B must resolve ledger/reporting semantics and the
separately approved `import_unreconciled` capability before writing such rows.

## Preview integrity

SHA-256 binds version, target, source namespace/checksum, normalized data,
versioned status mapping, explicit link config, snapshot (including record
versions and composite assignment endpoint truth), and all row outcomes/actions. Object keys and unordered collections
are canonicalized. UI sourceLabel and generated timestamps/random IDs are not
hash inputs. asOf affects the hash when eligibility/outcomes change. Changed
target versions, mapping, source account, Business or material source data change
the hash. Hashes are commitments, not authentication tokens.

`inputChecksum` is caller/server-supplied source identity metadata in Package A.
A validates its format, not the underlying bytes; it is not an authentication
token or proof of file contents. Package C/future upload server must compute it
from actual received file/payload bytes rather than trusting a client assertion.
Package B must bind it with normalized payload and authoritative recomputation.
No upload or storage implementation is included here.

Package B must receive the reviewed hash, reauthenticate/re-authorize the actor,
recompute preview against current target truth and STOP on mismatch. Its atomic
previewed → committing transition, transactional batches and checks must close
the race after recomputation. This is not implemented here.

## Locked decisions / later packages

- No valid customer email: INVALID / UNSUPPORTED; no fake addresses.
- Every future appointment requires staff; migration 034 remains unauthorized.
- Financial unknowns never default to zero/unpaid; future representation is Level 3.
- Raw files: private short TTL or checksum-verified re-upload; no indefinite PII.
- Source account/workspace key is mandatory.

Future tables: data_import_runs, data_import_entity_refs,
data_import_row_outcomes. None is created. Lifecycle vocabulary: uploaded,
previewed, committing, completed, completed_with_errors, failed, cancelled.
Terminal runs immutable; retry is a new run reconciled through prior refs/outcomes.

Package B (separate Level-3 approval) owns schema, authorization, transactionality,
idempotency and durable results. Package C owns Business setup → Import data /
Switch to Chasum: Upload → Map → Review → Import → Results. No UI, upload,
storage, commit action, SQL, migration or import write exists in Package A.
Summer may explain/recommend later through this same deterministic contract.

Competitive baseline is the accepted official-source assessment on Issue #73
(Fresha, Square, Vagaro, Jane). Parity: mapping, preview, duplicates/errors,
explicit import and results/retry. Advantage: connected tenant/dependency truth,
preview integrity and auditable deterministic decisions. No broad research redo.

## Validation

Synthetic in-memory Vitest tests cover contracts, email, references, duplicates,
assignments, conflicts, DST, financial truth, tenant boundaries, hashing and
no-I/O dependencies. Typecheck, changed-file lint, build and diff-check are
PASS on the accepted candidate (107 tests / 2 files). No hosted or live-database test is needed
for this package; it cannot establish import write/Production readiness.
