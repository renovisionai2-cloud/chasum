# Issue #83 — Stage 1A operator catalog implementation

**Status: MERGED / PRODUCTION ACCEPTED APPLICATION RELEASE.** Starting base: `f2ad2eac10330b55c229bdad72539159911fffa7`. Accepted corrected PR head: `c90336aa084fde014e1e51d1c2f21e1aef1d942f`. Squash-merge / application release: `88f6902e4688dc610ecba4e52ecc17d02ec25e9b`. Normal Vercel Production deployment: SUCCESS. No Supabase migration or Production tenant-data mutation accompanied this release.

## Contract and architecture

Implements the [accepted #81 operator-only contract](https://github.com/renovisionai2-cloud/chasum/issues/81#issuecomment-5767513694)
and [Issue #83](https://github.com/renovisionai2-cloud/chasum/issues/83).
Competitive assessment source: [#81 official-source assessment](https://github.com/renovisionai2-cloud/chasum/issues/81).
No new competitive research. Shared Business catalog → location enablement; no
service copies. Chasum principle: “We already know how your business operates.
Tell us what is different here.”

`getOperatorServiceCatalog()` adds one business-bound services query with nested
`service_locations(location_id)`. It does not inherit the location-scope cookie.
Query/relationship errors throw instead of pretending the business has no services.
`OperatorServiceCatalogItem` extends Service only for operator consumers. Missing
membership data allows primary compatibility, never guessed secondary membership.

`isServiceOfferedAtLocation` / `filterServicesOfferedAtLocation` own the rule:
primary `services.location_id` match OR explicit service_locations membership.
An absent location is not an offered location. Long-term authority stays mappings.
Active-service and package restrictions remain consumer concerns.

## Complete call-site inventory

Original getServices callers:

| Caller | Decision |
| --- | --- |
| dashboard/services/page.tsx | Operator catalog; pass validated selected-location display context |
| dashboard/calendar/page.tsx | Operator catalog to CalendarClient → ReceptionWorkspace → ReceptionPanel → QuickAppointment, and BookingSheet |
| dashboard/clients/[id]/page.tsx | Operator catalog to CustomerProfile → BookingSheet; services prop is used only by that booking entry point |
| dashboard/employees/page.tsx | Unchanged employee assignment scope |
| dashboard/employees/[id]/page.tsx | Unchanged employee profile assignment scope |
| dashboard/business/page.tsx | Unchanged Business hub/package selector scope |
| dashboard/automation/page.tsx | Unchanged automation configuration scope |
| lib/actions/command-centre.ts | Unchanged setup/completeness metrics scope |

Operator selector/prop scan:
- BookingSheet initial/default selection and location changes use the shared rule;
  AppointmentSection uses it for options. Package selection intersects its existing
  service IDs with offered services. Historical appointment identity is retained on
  initial edit; explicit location changes reconcile an invalid selected service.
- QuickAppointment derives current selectable/submitted service from the selected
  location, including an explicit no-active-services option. Existing staff,
  availability, financial, customer and notification code is unchanged.
- Reception brief/next-slot functions use the catalog then filter before sampling.
  Staff queries retain exact primary-location filtering and existing limits.
- CalendarClient, ReceptionWorkspace, ReceptionPanel and CustomerProfile carry the
  additive catalog type. ColorLegend remains a generic presentation consumer.
- ServicesManager retains Service for its existing editor and uses the catalog
  type for list rows. EmployeeDirectory, EmployeeManager, EmployeeProfile,
  StaffManager and BusinessHub generic Service[] consumers remain unchanged.
- PublicBookingPage/getPublicServices and API v1 services remain unchanged.
- AI receptionist knowledge's primary-only service filter is recorded but excluded:
  Summer/advisory convergence is not Stage 1A implementation authorization.

## Operator behavior and write safety

Services always shows the Business catalog. Selected location displays Offered
here / Not offered here and Enable at this location. Search/status/category filters
continue to work across the catalog. Zero mappings does not show a first-service
empty state. A naturally offered single-location catalog hides the extra status UI;
a genuinely empty Business retains the first-service state. All-location scope
shows the catalog without asserting an arbitrary location's offering status.

Enable uses the normal session client, resolves the current business on the server,
and checks service and active location against that business. It upserts only the
composite relationship, with ignoreDuplicates so retries do not overwrite existing
is_primary metadata. It neither creates services, changes the primary field, nor
deletes mappings. Services/Calendar/Business/client booking pages are revalidated.
Existing primary + Also offered at editor writes remain byte-unchanged.
No disable, bulk mapping, privileged writer or migration was added.

## Validation and limits

- New focused helper/action/component/wiring/Reception coverage; real BookingSheet,
  AppointmentSection, QuickAppointment and ServicesManager exercised with mocked
  external actions. DB constraints/RLS are not claimed tested by mocks.
- Final targeted Services + booking + Reception + Calendar + commerce suites after the bounded package/location correction: 53 files, 402 tests passed. Typecheck passed. Next 16.2.10 production build passed.
- Raw changed-file ESLint is NOT clean: 23 errors + 1 warning reproduce on the exact
  untouched base in BookingSheet and QuickAppointment (effect state, purity,
  memoization, refs and unused `_next`). No rules disabled. No new diagnostic
  category/count; new files and remaining changed files pass. This is a named
  baseline limitation for Control Tower, not a claimed lint PASS.
- git diff --check passed. Frozen paths and public/getServices function bytes checked
  against the authorized base.
- Governed hosted Preview acceptance on Staging exercised Services A/B/C, ALL LOCATIONS, Calendar and CRM Booking Sheet location switching, Quick Appointment filtering, the real Enable-at-Location action, public-freeze smoke and responsive operator states. One P2 package/location empty-state defect was found and corrected in the same PR. Targeted hosted retest passed on corrected head `c90336aa084fde014e1e51d1c2f21e1aef1d942f`: explicit package-unavailable option/help, empty `service_id`, disabled confirmation, no unrelated Service substitution, ordinary Service mode regression PASS. Desktop 1440×1000 and mobile 390×844 retest PASS; broader initial run also covered tablet 768×1024.
- Acceptance cleanup was mandatory and passed twice. Chasum Test Studio returned exactly to 1 Location / 1 active Service / 1 service mapping / 2 Customers / 0 packages / Starter after each governed hosted run; temporary QA Auth/member/fixture rows were absent. Stable pre/post fingerprint: `c1844210672164d00546d8fc222f940d` exact-match with empty semantic diff. Production, GVM and Chasum HQ were untouched.

## Frozen boundaries and next gates

No changes under supabase/, public booking page/action, booking engine, availability
SQL/actions, appointment write actions, commerce logic, staff actions/eligibility,
or location actions. No schema, service ID, historical appointment or hosted data
mutation. No Production testing or environment configuration changes.

Staff-location server convergence and its known fail-open UI behavior remain for
Stage 1B. Internal service visibility is not proof of staff/slot availability;
existing validation remains authoritative. Public convergence must ship with 1B.
Stage 1C, entitlement changes, B2 and hosted mapping backfills remain unauthorized.

Stage 1A closeout: independent Claude focused audit PASS; Control Tower source/correction reviews PASS; governed hosted acceptance + targeted hosted retest PASS; Product Owner approved squash merge; normal Vercel Production deployment SUCCESS.

Next gate is **NOT Stage 1B implementation**. Before any Stage 1B/public convergence work, separately govern the Level-3 same-Business relationship integrity/RLS hardening for `service_locations`, `staff_locations`, and `staff_services`, then restate the combined Staff-location server + public Service convergence contract for Product Owner approval. Stage 1C and Package B2 remain blocked.
