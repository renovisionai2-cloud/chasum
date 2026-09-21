# Issue #83 — Stage 1A operator catalog implementation

Candidate only; no merge or hosted acceptance is claimed. Starting main and branch
base: `f2ad2eac10330b55c229bdad72539159911fffa7`.
Branch: `feat/stage-1a-operator-service-catalog`.

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
- Targeted Services + booking + Reception + Calendar + commerce suites: 53 files,
  401 tests passed. Typecheck passed. Next 16.2.10 production build passed.
- Raw changed-file ESLint is NOT clean: 23 errors + 1 warning reproduce on the exact
  untouched base in BookingSheet and QuickAppointment (effect state, purity,
  memoization, refs and unused `_next`). No rules disabled. No new diagnostic
  category/count; new files and remaining changed files pass. This is a named
  baseline limitation for Control Tower, not a claimed lint PASS.
- git diff --check passed. Frozen paths and public/getServices function bytes checked
  against the authorized base.
- Local Chromium synthetic fixture: desktop 1440×1000, laptop 1280×800,
  tablet 768×1024, mobile 390×844. Catalog unmapped/secondary/single states,
  QuickAppointment and BookingSheet location switches, keyboard focus and Escape
  checked; no horizontal overflow or page errors. Mobile catalog/sheet and desktop
  screenshots visually inspected. Real components/styles; external actions and
  auxiliary panels stubbed; all non-loopback requests blocked. No hosted acceptance.
- Local evidence: `/private/tmp/issue83-ui/` (fixture, runner, results and screenshots)
  and `/private/tmp/issue83-{regression,typecheck,build,lint}.log`. Temporary evidence
  is not permanent release storage. Preserve separately if needed for acceptance.

## Frozen boundaries and next gates

No changes under supabase/, public booking page/action, booking engine, availability
SQL/actions, appointment write actions, commerce logic, staff actions/eligibility,
or location actions. No schema, service ID, historical appointment or hosted data
mutation. No Production testing or environment configuration changes.

Staff-location server convergence and its known fail-open UI behavior remain for
Stage 1B. Internal service visibility is not proof of staff/slot availability;
existing validation remains authoritative. Public convergence must ship with 1B.
Stage 1C, entitlement changes, B2 and hosted mapping backfills remain unauthorized.

Next: Control Tower exact-delta review → focused independent audit → isolated
Preview/browser acceptance → Product Owner merge decision. Do not merge from this
implementation task or treat its local fixture as database/runtime acceptance.
