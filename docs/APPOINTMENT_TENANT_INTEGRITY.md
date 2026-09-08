# Appointment API and event tenant integrity

This technical contract extends `6275b8935b603e3686c3109d5f100039c7049e49` on
`codex/appointment-api-tenant-integrity-fix`, based on recovery functional lineage
`47c24acb22db8d8da7cef9971357e1d26f87cffa`. It does not certify hosted Staging or
authorize Production execution. Recovery controls and documents remain unchanged.

## Cancellation contract

DELETE first loads the appointment under the authenticated business. Foreign and
absent IDs have the same 404 response. Before changing status, the route validates
all four retained references through the shared server-only validator, with active
state checks disabled. It never substitutes a location. Missing/foreign references
produce a generic 409 and a reconciliation marker containing only the owned
appointment and business IDs; no mutation, event, or enqueue occurs.

An already-cancelled valid row returns 200 without another mutation/event. Otherwise
the update matches ID, business, loaded `updated_at`, and non-cancelled status, and
must return the affected row. A zero-row race returns 409 without an event; database
errors return safe 503 errors. Concurrent DELETEs cannot both emit for one transition.
Repeated PATCH cancellation also suppresses the cancellation event while retaining
validated field edits and its response shape. DELETE followed by PATCH cancellation
does not create a second occurrence.

The current API/recovery schema requires staff and the other three references.
Unexpected null retained fields fail closed. Migration 034 remains held; this change
does not enable unassigned appointment persistence. Separately, the reusable event
loader preserves the existing explicit-null unassigned-staff display semantics for
other server callers, while rejecting undefined staff or a missing non-null staff ID.
Future optional-staff API activation must review PATCH and DELETE compatibility.

## Event-loading boundary

`handleAppointmentEvent` requires the caller's business ID. The server-only loader
reads the base appointment under that business, then explicitly queries customer,
service, staff, and location under the same business. It completes all checks before
in-app notification, email/SMS/reminder/webhook/calendar enqueue, or immediate
calendar provider work. A mismatch throws a generic reconciliation-required error;
lookup failures are sanitized. No foreign record is fetched to explain a mismatch.
Inactive same-business records retain their historical names and recipient details.

Calendar push receives the validated snapshot and business name rather than reloading
unscoped appointment embeds. Calendar cancellation loads only links whose inner
calendar connection belongs to the validated business, before token/provider use.
The hosted verification gate must confirm actual PostgREST join/filter behavior.

## Production caller analysis

| Caller | Business context and appointment proof | Reference proof before calling |
| --- | --- | --- |
| API POST | Authenticated business; successful owned insertion | Shared reference validator and slot RPC |
| API PATCH | Authenticated business; owned read and version-matched returned update | Shared validator for effective references |
| API DELETE | Authenticated business; owned read and version-matched returned cancellation | Shared validator for retained references, inactive allowed |
| Booking event bridge | `event.businessId`; proof depends on originating booking mutation | No uniform retained-reference proof in the bridge; event loader now enforces it |
| Public booking action | Resolved business; successful booking RPC/engine result | Public booking checks and named-staff RPC; optional-staff path stays gated |
| Recurring generator | Rule business; successful insertion under that business | Slot validation covers scheduling references; copied customer reference is independently checked by event loader |

All six production call sites now pass their existing business context. Only the
API DELETE path gains the pre-mutation cancellation integrity guarantee here.
Booking-engine cancellation mutations can occur before their bridge runs, and the
event emitter catches handler failures. The new loader prevents foreign-data effects
from those calls; it does not roll back their earlier mutations or redesign them.

## Verification and limits

Local tests cover foreign/unknown/null references, no partial effects, safe errors
and logs, inactive historical rows, repeated/concurrent cancellation, lost updates,
valid recipients/occurrence identities, business-bound event calls, and calendar
snapshot/connection isolation. Existing POST/PATCH/GET and booking/worker/webhook
regressions remain part of the required check set.

Cancellation and notification enqueue are not a transactional outbox. A post-mutation
loader/enqueue failure can leave communications absent or partially queued; the API
surfaces the failure, and repeated cancellation does not retry fanout. Such delivery
failures need governed reconciliation. The tests explicitly record this P2 limit.

The appointment version guard covers edits to that appointment, not arbitrary
privileged concurrent reparenting of a referenced record. Scoped detail snapshots
prevent later immediate sinks from reloading foreign PII. Database-wide atomic
reference integrity would require separate constraints/transactional enforcement.

Hosted Staging verification is a separate gate. Use synthetic non-GVM tenants,
prove rejected requests leave status/jobs/notifications unchanged, verify intended
durable-v1 communication enqueue, and keep real providers and global worker execution
disabled. Never treat local checks as hosted Staging PASS or Production approval.
