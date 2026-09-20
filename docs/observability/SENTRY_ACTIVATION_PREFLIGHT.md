# Sentry activation preflight — Issue #75 / Parent #65

Status: DESIGN ONLY. No Production activation or provider configuration is authorized.

## Outbound contract

`lib/observability/sentry.ts` configures an error-event projection in `beforeSend`
and the supported `beforeSendEvent` integration hook. The latter runs immediately
before envelope creation in Sentry 10.66.0, including SDK-internal errors that skip
`beforeSend`. Tests exercise the real core client with an in-memory transport.

Events are rebuilt with approved flat diagnostic extras/tags, a searchable support
reference tag, exception class, normalized exception text, and bounded compiled
Next.js source locations/line/column. UUID-shaped internal IDs are retained.
The existing application diagnostic-key contract still applies: callers must not
put customer content into approved domain/scope/status/route fields. Route context
is an application-owned route template, not a raw URL or dynamic pathname.

Removed: raw message/logentry, request (including URL, headers, cookies, body and
query), user/IP fields, arbitrary contexts, breadcrumbs, attachments, local variables,
source snippets, function text, developer file paths, transaction/fingerprint,
mechanism metadata, threads, modules, SDK processing metadata and debug metadata.
Unknown top-level fields are dropped. Exception text is normalized for every cause.
Compiled stack URLs lose their authority, query and fragment. Only compiled Next
paths are retained; other source filenames are omitted conservatively.

Breadcrumbs, transactions, SDK logs and metrics are dropped. Automatic session
integrations and automatic HTTP integrations (which create request-session
envelopes outside event hooks) are excluded; client outcome reports are disabled.
Existing Chasum request-error hooks and error boundaries still capture errors. No replay/profiling
integration is installed by this change. The existing trace sample-rate expression
is unchanged, but transactions cannot pass this error-only boundary. Any future
tracing, replay, log, session, metric or attachment export needs a separate review.

These controls do not stop the provider from observing the network source IP on a
future connection. Provider-side IP scrubbing remains an activation prerequisite.
No real provider transport is used by the tests.

## Proposed activation contract — PO approval required

1. Approve the project, data region and authorized team. Start with a dedicated
   non-Production project and environment; never mix Preview tests into Production.
2. Approve server `SENTRY_DSN` for the selected project. The current server fallback
   to `NEXT_PUBLIC_SENTRY_DSN` is known behavior: set the server DSN explicitly.
3. Approve client activation separately using `NEXT_PUBLIC_SENTRY_DSN`. It is a
   public routing identifier, not an authentication secret; apply provider quotas
   and origin restrictions where supported. A client DSN change requires a build.
4. Use `production`, `preview`, `development` environment names deliberately.
   Initial rollout should be error-only with explicit `SENTRY_TRACES_SAMPLE_RATE=0`.
   Do not accidentally accept the historical 0.1 fallback. Sampling expansion needs
   its own privacy contract and approval; transactions are currently dropped.
5. Leave source-map upload OFF initially. No token or `withSentryConfig` exists in
   this change. Later approve CI-only least-privilege upload credentials and commit
   release identity. Review source contents/access and retention before uploading.
   Mapping needs separate verification: this boundary intentionally strips debug
   metadata and normalizes filenames; merely uploading maps is insufficient.
6. Configure provider-side scrubbing for request/user/IP, secrets and payment data;
   disable IP storage/geolocation enrichment where supported. Verify the provider's
   ingestion behavior in the isolated test project before Production activation.
7. Approve minimum retention (proposed 30 days), named support/security access,
   least privilege, MFA, auditability, deletion procedures and data residency.
8. Approve alert owners/routes and thresholds. Initial alerts should contain only
   project/environment, normalized error class and support reference; avoid raw
   event bodies in email/chat integrations. Start with a monitored pilot.
9. Verify in Preview with a deliberate synthetic capture using fictional content,
   without crashing a page, booking, worker or customer flow. Inspect the actual
   received event and search `referenceId:CHS-ERR-…`; compare with in-memory tests.
   A later Production verification, if approved, must be a standalone bounded
   synthetic capture with no GVM/customer workflow, never a manufactured crash.
10. Roll back by removing approved DSNs and redeploying/rebuilding (including the
    client bundle). If immediate containment is required, disable project ingestion
    or revoke its DSN at the provider under the approved incident procedure; existing
    cached clients may retain an old public DSN. Confirm no new events and separately
    handle already-ingested data. No rollback action is authorized here.

## Independent audit / rollout gates

Audit SDK hook ordering (including internal bypass), envelope attachments, nested
exception data, context-key/value trust, stack projection, error-only suppression,
provider-off/idempotent init, and source-map limitations. A dependency upgrade must
rerun envelope tests. Preview CI and independent audit must pass before merge.
Production activation is a later explicit Darshan YES/NO decision after Control
Tower reconciles this contract and provider-side verification.

COMPETITIVE GATE APPLICABILITY: NOT_APPLICABLE.
Internal observability/privacy hardening only; no customer/operator competitive
workflow changes.
